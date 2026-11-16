/**
 * Plane REST 客户端（service 侧）。
 *
 * 版本差异全在这里：
 *   v1 → /api/v1 + 工作项叫 issues + 标签挂在项目下
 *   v2 → /api/v2 + 工作项叫 work-items + 标签挂在 workspace 下
 *
 * 错误统一归一化成固定的 code，面板只认 code 不认 HTTP 状态。
 */

export class PlaneError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "PlaneError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeConfig(raw) {
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
    throw new PlaneError("BAD_CONFIG", "地址要以 http:// 或 https:// 开头");
  }
  if (baseUrl && /\/api(\/v\d)?$/i.test(baseUrl)) {
    throw new PlaneError("BAD_CONFIG", "地址不要带 /api 或 /api/v1，填到端口为止（例如 http://192.168.1.188:8080）");
  }

  return { baseUrl, apiKey, workspace, apiVersion, missing };
}

export function apiBase(cfg) {
  return `${cfg.baseUrl}${cfg.apiVersion === "v1" ? "/api/v1" : "/api/v2"}`;
}

export function workItemsSegment(cfg) {
  return cfg.apiVersion === "v1" ? "issues" : "work-items";
}

function errorForStatus(status, detail) {
  if (status === 401 || status === 403) return new PlaneError("AUTH_FAILED", "API Key 无效或没有权限（401/403）", status);
  if (status === 404) return new PlaneError("NOT_FOUND", "端点或资源不存在（404），地址或 API 版本可能不对", 404);
  if (status === 429) return new PlaneError("RATE_LIMITED", "被 Plane 限流（429）", 429);
  if (status >= 500) return new PlaneError("NETWORK", `Plane 返回 ${status}`, status);
  return new PlaneError("NOT_FOUND", `Plane 返回 ${status}${detail ? "：" + detail.slice(0, 160) : ""}`, status);
}

/**
 * 发一次 Plane 请求。NETWORK / RATE_LIMITED 各重试一次（短退避），其余直接抛。
 */
export async function request(cfg, path, { method = "GET", body, fetchImpl = fetch, retry = true } = {}) {
  const url = `${apiBase(cfg)}${path}`;

  const once = async () => {
    let res;
    try {
      res = await fetchImpl(url, {
        method,
        headers: {
          "X-Api-Key": cfg.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new PlaneError("NETWORK", `连不上 Plane（${cfg.baseUrl}）：${e instanceof Error ? e.message : String(e)}`);
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw errorForStatus(res.status, detail);
    }
    try {
      return await res.json();
    } catch {
      throw new PlaneError("NETWORK", "Plane 返回的不是 JSON");
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

/** GET 项目列表。v1 与 v2 都回 { results }，字段名一致；容错处理裸数组。 */
export async function listProjects(cfg, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${encodeURIComponent(cfg.workspace)}/projects/`, { fetchImpl });
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map((r) => ({
    id: String(r.uuid ?? r.id ?? ""),
    name: String(r.name ?? ""),
    identifier: String(r.identifier ?? ""),
  }));
}
