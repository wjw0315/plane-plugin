/**
 * Plane 扩展的本地 service。
 *
 * 契约（见 @openchamber/sdk 的 GUEST_SERVICES.md）：
 *   - 只监听 127.0.0.1，端口来自 OPENCHAMBER_SERVICE_PORT
 *   - 每个请求（含 /health）都要带 Authorization: Bearer <OPENCHAMBER_SERVICE_TOKEN>
 *   - 宿主轮询 GET /health 直到 200，才算服务就绪
 *
 * 第 01 片只有 /health；接 Plane 的读写路由在下一片。
 */
import http from "node:http";

const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0);
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || "";

if (!PORT || !TOKEN) {
  console.error("[plane] 缺少 OPENCHAMBER_SERVICE_PORT / OPENCHAMBER_SERVICE_TOKEN，无法启动");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };

  // 契约要求：所有请求都要带 Bearer，/health 也不例外
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    json(401, { ok: false, error: { code: "UNAUTHORIZED", message: "缺少或错误的 service token" } });
    return;
  }

  const path = (req.url || "").split("?")[0];

  if (req.method === "GET" && path === "/health") {
    json(200, { ok: true, service: "plane", version: "0.1.0" });
    return;
  }

  json(404, { ok: false, error: { code: "NOT_FOUND", message: `没有这个路由：${req.method} ${path}` } });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[plane] service 监听 127.0.0.1:${PORT}`);
});

function shutdown(signal) {
  console.log(`[plane] 收到 ${signal}，退出`);
  server.close(() => process.exit(0));
  // 兜底：10 秒内没关干净就硬退，避免宿主 kill -9 前挂住
  setTimeout(() => process.exit(0), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
