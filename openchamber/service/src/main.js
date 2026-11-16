/**
 * Plane 扩展的本地 service。
 *
 * 契约（见 @openchamber/sdk 的 GUEST_SERVICES.md）：
 *   - 只监听 127.0.0.1，端口来自 OPENCHAMBER_SERVICE_PORT
 *   - 每个请求（含 /health）都要带 Authorization: Bearer <OPENCHAMBER_SERVICE_TOKEN>
 *   - 宿主轮询 GET /health 直到 200，才算服务就绪
 *
 * 路由：
 *   GET  /health    就绪探针
 *   GET  /config    脱敏后的配置视图（面板渲染表单用）
 *   POST /config    保存配置（{ baseUrl, apiKey, workspace, apiVersion }）
 *   POST /projects  用已保存的配置列项目
 */
import http from "node:http";
import { loadConfig, saveConfig, maskConfig } from "./config.js";
import { normalizeConfig, listProjects, PlaneError } from "./plane.js";

const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0);
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || "";

if (!PORT || !TOKEN) {
  console.error("[plane] 缺少 OPENCHAMBER_SERVICE_PORT / OPENCHAMBER_SERVICE_TOKEN，无法启动");
  process.exit(1);
}

const STATUS_FOR_CODE = {
  CONFIG_MISSING: 400,
  BAD_CONFIG: 400,
  AUTH_FAILED: 401,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  NETWORK: 502,
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function sendError(res, err) {
  const code = err instanceof PlaneError ? err.code : "INTERNAL";
  const message = err instanceof Error ? err.message : String(err);
  const status = STATUS_FOR_CODE[code] ?? 500;
  if (code === "INTERNAL") console.error("[plane] 内部错误:", err);
  sendJson(res, status, { ok: false, error: { code, message } });
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new PlaneError("BAD_CONFIG", "请求体太大");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new PlaneError("BAD_CONFIG", "请求体不是合法 JSON");
  }
}

/** 已保存的配置 → 归一化；缺字段直接给带 missing 列表的错误。 */
function requireConfig(saved) {
  const cfg = normalizeConfig(saved || {});
  if (cfg.missing.length) {
    const err = new PlaneError("CONFIG_MISSING", `还缺：${cfg.missing.join("、")}`);
    err.missing = cfg.missing;
    throw err;
  }
  return cfg;
}

const server = http.createServer(async (req, res) => {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    sendJson(res, 401, { ok: false, error: { code: "UNAUTHORIZED", message: "缺少或错误的 service token" } });
    return;
  }

  const path = (req.url || "").split("?")[0];

  try {
    if (req.method === "GET" && path === "/health") {
      sendJson(res, 200, { ok: true, service: "plane", version: "0.2.0" });
      return;
    }

    if (req.method === "GET" && path === "/config") {
      sendJson(res, 200, { ok: true, config: maskConfig(await loadConfig(process.env)) });
      return;
    }

    if (req.method === "POST" && path === "/config") {
      const body = await readBody(req);
      const cfg = normalizeConfig(body);
      // 保存时允许缺字段（用户可以分步填），只在真正调用 Plane 时要求完整
      await saveConfig(process.env, {
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        workspace: cfg.workspace,
        apiVersion: cfg.apiVersion,
      });
      sendJson(res, 200, { ok: true, config: maskConfig(await loadConfig(process.env)) });
      return;
    }

    if (req.method === "POST" && path === "/projects") {
      const cfg = requireConfig(await loadConfig(process.env));
      const projects = await listProjects(cfg);
      sendJson(res, 200, { ok: true, projects });
      return;
    }

    sendJson(res, 404, { ok: false, error: { code: "NOT_FOUND", message: `没有这个路由：${req.method} ${path}` } });
  } catch (e) {
    if (e instanceof PlaneError && e.missing) {
      sendJson(res, 400, { ok: false, error: { code: e.code, message: e.message, missing: e.missing } });
      return;
    }
    sendError(res, e);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[plane] service 监听 127.0.0.1:${PORT}`);
});

function shutdown(signal) {
  console.log(`[plane] 收到 ${signal}，退出`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
