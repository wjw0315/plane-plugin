"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// service/src/main.js
var import_node_http = __toESM(require("node:http"), 1);

// service/src/config.js
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
function configPath(env) {
  const dir = env.OPENCHAMBER_SERVICE_DATA_DIR || (0, import_node_path.join)(process.cwd(), ".plane-data");
  return (0, import_node_path.join)(dir, "config.json");
}
async function loadConfig(env) {
  try {
    const raw = await (0, import_promises.readFile)(configPath(env), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
async function saveConfig(env, cfg) {
  const file = configPath(env);
  await (0, import_promises.mkdir)((0, import_node_path.dirname)(file), { recursive: true });
  await (0, import_promises.writeFile)(file, JSON.stringify(cfg, null, 2) + "\n", { mode: 384 });
  await (0, import_promises.chmod)(file, 384);
  return cfg;
}
function maskConfig(cfg) {
  if (!cfg) return { configured: false, baseUrl: "", workspace: "", apiVersion: "v2", hasKey: false };
  const baseUrl = String(cfg.baseUrl || "");
  const workspace = String(cfg.workspace || "");
  const hasKey = Boolean(cfg.apiKey);
  return {
    configured: Boolean(baseUrl && hasKey && workspace),
    baseUrl,
    workspace,
    apiVersion: String(cfg.apiVersion || "v2"),
    hasKey
  };
}

// service/src/plane.js
var PlaneError = class extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "PlaneError";
    this.code = code;
    this.status = status;
  }
};
function normalizeConfig(raw) {
  const cfg = raw || {};
  const baseUrl = String(cfg.baseUrl || "").trim().replace(/\/+$/, "");
  const apiKey = String(cfg.apiKey || "").trim();
  const workspace = String(cfg.workspace || "").trim();
  const apiVersion = String(cfg.apiVersion || "").trim().toLowerCase() === "v1" ? "v1" : "v2";
  const missing = [];
  if (!baseUrl) missing.push("baseUrl");
  if (!apiKey) missing.push("apiKey");
  if (!workspace) missing.push("workspace");
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) {
    throw new PlaneError("BAD_CONFIG", "\u5730\u5740\u8981\u4EE5 http:// \u6216 https:// \u5F00\u5934");
  }
  if (baseUrl && /\/api(\/v\d)?$/i.test(baseUrl)) {
    throw new PlaneError("BAD_CONFIG", "\u5730\u5740\u4E0D\u8981\u5E26 /api \u6216 /api/v1\uFF0C\u586B\u5230\u7AEF\u53E3\u4E3A\u6B62\uFF08\u4F8B\u5982 http://192.168.1.188:8080\uFF09");
  }
  return { baseUrl, apiKey, workspace, apiVersion, missing };
}
function apiBase(cfg) {
  return `${cfg.baseUrl}${cfg.apiVersion === "v1" ? "/api/v1" : "/api/v2"}`;
}
function workItemsSegment(cfg) {
  return cfg.apiVersion === "v1" ? "issues" : "work-items";
}
function errorForStatus(status, detail) {
  if (status === 401 || status === 403) return new PlaneError("AUTH_FAILED", "API Key \u65E0\u6548\u6216\u6CA1\u6709\u6743\u9650\uFF08401/403\uFF09", status);
  if (status === 404) return new PlaneError("NOT_FOUND", "\u7AEF\u70B9\u6216\u8D44\u6E90\u4E0D\u5B58\u5728\uFF08404\uFF09\uFF0C\u5730\u5740\u6216 API \u7248\u672C\u53EF\u80FD\u4E0D\u5BF9", 404);
  if (status === 429) return new PlaneError("RATE_LIMITED", "\u88AB Plane \u9650\u6D41\uFF08429\uFF09", 429);
  if (status >= 500) return new PlaneError("NETWORK", `Plane \u8FD4\u56DE ${status}`, status);
  return new PlaneError("NOT_FOUND", `Plane \u8FD4\u56DE ${status}${detail ? "\uFF1A" + detail.slice(0, 160) : ""}`, status);
}
async function request(cfg, path, { method = "GET", body, fetchImpl = fetch, retry = true } = {}) {
  const url = `${apiBase(cfg)}${path}`;
  const once = async () => {
    let res;
    try {
      res = await fetchImpl(url, {
        method,
        headers: {
          "X-Api-Key": cfg.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: body ? JSON.stringify(body) : void 0
      });
    } catch (e) {
      throw new PlaneError("NETWORK", `\u8FDE\u4E0D\u4E0A Plane\uFF08${cfg.baseUrl}\uFF09\uFF1A${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw errorForStatus(res.status, detail);
    }
    try {
      return await res.json();
    } catch {
      throw new PlaneError("NETWORK", "Plane \u8FD4\u56DE\u7684\u4E0D\u662F JSON");
    }
  };
  try {
    return await once();
  } catch (e) {
    const retryable = e instanceof PlaneError && (e.code === "NETWORK" || e.code === "RATE_LIMITED");
    if (!retry || !retryable) throw e;
    await new Promise((r) => setTimeout(r, 200));
    return await once();
  }
}
async function listProjects(cfg, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${encodeURIComponent(cfg.workspace)}/projects/`, { fetchImpl });
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map((r) => ({
    id: String(r.uuid ?? r.id ?? ""),
    name: String(r.name ?? ""),
    identifier: String(r.identifier ?? "")
  }));
}
function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}
function mapItem(raw) {
  const labels = Array.isArray(raw?.labels) ? raw.labels : [];
  const assignees = Array.isArray(raw?.assignees) ? raw.assignees : [];
  return {
    id: String(raw?.uuid ?? raw?.id ?? ""),
    identifier: String(raw?.identifier ?? raw?.sequence_id ?? ""),
    name: String(raw?.name ?? ""),
    stateId: String(raw?.state ?? ""),
    priority: raw?.priority != null ? String(raw.priority) : null,
    assignees: assignees.map((a) => ({
      id: String(a?.uuid ?? a?.id ?? ""),
      name: String(a?.display_name ?? a?.name ?? "")
    })),
    labels: labels.map((l) => typeof l === "string" ? l : String(l?.id ?? "")).filter(Boolean)
  };
}
var seg = (v) => encodeURIComponent(v);
async function listStates(cfg, projectId, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/states/`, { fetchImpl });
  return unwrap(data).map((r) => ({
    id: String(r.uuid ?? r.id ?? ""),
    name: String(r.name ?? ""),
    color: r.color ? String(r.color) : null,
    order: Number(r.sequence ?? 0)
  })).sort((a, b) => a.order - b.order);
}
async function listWorkItems(cfg, projectId, stateId, fetchImpl = fetch) {
  const qs = stateId ? `?state=${seg(stateId)}` : "";
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${qs}`,
    { fetchImpl }
  );
  return unwrap(data).map(mapItem);
}
async function patchState(cfg, projectId, workItemId, stateId, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { method: "PATCH", body: { state: stateId }, fetchImpl }
  );
  return mapItem(data);
}
function htmlToText(html) {
  if (!html) return "";
  return String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6])>/gi, "\n").replace(/<li[^>]*>/gi, "- ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
}
async function getWorkItem(cfg, projectId, workItemId, fetchImpl = fetch) {
  const raw = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { fetchImpl }
  );
  return { item: mapItem(raw), description: htmlToText(raw?.description_html ?? raw?.description ?? "") };
}

// service/src/main.js
var PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0);
var TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || "";
if (!PORT || !TOKEN) {
  console.error("[plane] \u7F3A\u5C11 OPENCHAMBER_SERVICE_PORT / OPENCHAMBER_SERVICE_TOKEN\uFF0C\u65E0\u6CD5\u542F\u52A8");
  process.exit(1);
}
var STATUS_FOR_CODE = {
  CONFIG_MISSING: 400,
  BAD_CONFIG: 400,
  AUTH_FAILED: 401,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  NETWORK: 502
};
function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function sendError(res, err) {
  const code = err instanceof PlaneError ? err.code : "INTERNAL";
  const message = err instanceof Error ? err.message : String(err);
  const status = STATUS_FOR_CODE[code] ?? 500;
  if (code === "INTERNAL") console.error("[plane] \u5185\u90E8\u9519\u8BEF:", err);
  sendJson(res, status, { ok: false, error: { code, message } });
}
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new PlaneError("BAD_CONFIG", "\u8BF7\u6C42\u4F53\u592A\u5927");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new PlaneError("BAD_CONFIG", "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON");
  }
}
function requireConfig(saved) {
  const cfg = normalizeConfig(saved || {});
  if (cfg.missing.length) {
    const err = new PlaneError("CONFIG_MISSING", `\u8FD8\u7F3A\uFF1A${cfg.missing.join("\u3001")}`);
    err.missing = cfg.missing;
    throw err;
  }
  return cfg;
}
var server = import_node_http.default.createServer(async (req, res) => {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    sendJson(res, 401, { ok: false, error: { code: "UNAUTHORIZED", message: "\u7F3A\u5C11\u6216\u9519\u8BEF\u7684 service token" } });
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
      await saveConfig(process.env, {
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        workspace: cfg.workspace,
        apiVersion: cfg.apiVersion
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
      if (!body.projectId) throw new PlaneError("BAD_CONFIG", "\u7F3A\u5C11 projectId");
      const cfg = requireConfig(await loadConfig(process.env));
      const states = await listStates(cfg, body.projectId);
      sendJson(res, 200, { ok: true, states });
      return;
    }
    if (req.method === "POST" && path === "/work-items") {
      const body = await readBody(req);
      if (!body.projectId) throw new PlaneError("BAD_CONFIG", "\u7F3A\u5C11 projectId");
      const cfg = requireConfig(await loadConfig(process.env));
      const items = await listWorkItems(cfg, body.projectId, body.stateId);
      sendJson(res, 200, { ok: true, items });
      return;
    }
    if (req.method === "POST" && path === "/work-item") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId) throw new PlaneError("BAD_CONFIG", "work-item \u9700\u8981 projectId / workItemId");
      const cfg = requireConfig(await loadConfig(process.env));
      const got = await getWorkItem(cfg, body.projectId, body.workItemId);
      sendJson(res, 200, { ok: true, ...got });
      return;
    }
    if (req.method === "POST" && path === "/patch-state") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !body.stateId) {
        throw new PlaneError("BAD_CONFIG", "patch-state \u9700\u8981 projectId / workItemId / stateId");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const item = await patchState(cfg, body.projectId, body.workItemId, body.stateId);
      sendJson(res, 200, { ok: true, item });
      return;
    }
    sendJson(res, 404, { ok: false, error: { code: "NOT_FOUND", message: `\u6CA1\u6709\u8FD9\u4E2A\u8DEF\u7531\uFF1A${req.method} ${path}` } });
  } catch (e) {
    if (e instanceof PlaneError && e.missing) {
      sendJson(res, 400, { ok: false, error: { code: e.code, message: e.message, missing: e.missing } });
      return;
    }
    sendError(res, e);
  }
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[plane] service \u76D1\u542C 127.0.0.1:${PORT}`);
});
function shutdown(signal) {
  console.log(`[plane] \u6536\u5230 ${signal}\uFF0C\u9000\u51FA`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1e4).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
