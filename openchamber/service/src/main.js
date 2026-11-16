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
 *   POST /states     列项目的状态（看板列）
 *   POST /work-items 列工作项（可按 stateId 过滤）
 *   POST /work-item   取单条工作项 + 描述（详情用）
 *   POST /patch-state 改工作项状态
 *   POST /comment     结论回填（追加评论，不改描述）
 *   POST /session-start 由 service 发起会话（可指定 model/variant/agent、可先建 worktree）
 *   POST /bind-session 给工作项追加 oc-<sessionId> 标签（可顺带推状态）
 */
import http from "node:http";
import { loadConfig, saveConfig, maskConfig } from "./config.js";
import { normalizeConfig, listProjects, listStates, listWorkItems, patchState, getWorkItem, ensureLabel, patchWorkItem, addComment, PlaneError } from "./plane.js";
import { startSession } from "./session.js";

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
      sendJson(res, 200, { ok: true, service: "plane", version: "0.5.0" });
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

    if (req.method === "POST" && path === "/states") {
      const body = await readBody(req);
      if (!body.projectId) throw new PlaneError("BAD_CONFIG", "缺少 projectId");
      const cfg = requireConfig(await loadConfig(process.env));
      const states = await listStates(cfg, body.projectId);
      sendJson(res, 200, { ok: true, states });
      return;
    }

    if (req.method === "POST" && path === "/work-items") {
      const body = await readBody(req);
      if (!body.projectId) throw new PlaneError("BAD_CONFIG", "缺少 projectId");
      const cfg = requireConfig(await loadConfig(process.env));
      const items = await listWorkItems(cfg, body.projectId, body.stateId);
      sendJson(res, 200, { ok: true, items });
      return;
    }

    if (req.method === "POST" && path === "/work-item") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId) throw new PlaneError("BAD_CONFIG", "work-item 需要 projectId / workItemId");
      const cfg = requireConfig(await loadConfig(process.env));
      const got = await getWorkItem(cfg, body.projectId, body.workItemId);
      sendJson(res, 200, { ok: true, ...got });
      return;
    }

    if (req.method === "POST" && path === "/patch-state") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !body.stateId) {
        throw new PlaneError("BAD_CONFIG", "patch-state 需要 projectId / workItemId / stateId");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const item = await patchState(cfg, body.projectId, body.workItemId, body.stateId);
      sendJson(res, 200, { ok: true, item });
      return;
    }

    if (req.method === "POST" && path === "/comment") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !String(body.body || "").trim()) {
        throw new PlaneError("BAD_CONFIG", "comment 需要 projectId / workItemId / body");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const comment = await addComment(cfg, body.projectId, body.workItemId, body.body, { sessionId: body.sessionId });
      sendJson(res, 200, { ok: true, comment });
      return;
    }

    if (req.method === "POST" && path === "/session-start") {
      const body = await readBody(req);
      const out = await startSession(process.env, body);
      sendJson(res, 200, { ok: true, ...out });
      return;
    }

    if (req.method === "POST" && path === "/bind-session") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !body.sessionId) {
        throw new PlaneError("BAD_CONFIG", "bind-session 需要 projectId / workItemId / sessionId");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const label = await ensureLabel(cfg, body.projectId, `oc-${body.sessionId}`);
      const current = await getWorkItem(cfg, body.projectId, body.workItemId);
      const labels = Array.from(new Set([...(current.item.labels || []), label.id]));
      const patch = { labels };
      if (body.stateId) patch.state = body.stateId;
      const item = await patchWorkItem(cfg, body.projectId, body.workItemId, patch);
      sendJson(res, 200, { ok: true, item, label });
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
