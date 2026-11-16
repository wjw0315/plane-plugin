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

/* ---------------- 03 片：状态 / 工作项 ---------------- */

function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

/** 工作项归一化：v1 没有 identifier，用 sequence_id 兜底；labels 可能是对象数组。 */
export function mapItem(raw) {
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
      name: String(a?.display_name ?? a?.name ?? ""),
    })),
    labels: labels.map((l) => (typeof l === "string" ? l : String(l?.id ?? ""))).filter(Boolean),
  };
}

const seg = (v) => encodeURIComponent(v);

export async function listStates(cfg, projectId, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/states/`, { fetchImpl });
  return unwrap(data)
    .map((r) => ({
      id: String(r.uuid ?? r.id ?? ""),
      name: String(r.name ?? ""),
      color: r.color ? String(r.color) : null,
      order: Number(r.sequence ?? 0),
    }))
    .sort((a, b) => a.order - b.order);
}

export async function listWorkItems(cfg, projectId, stateId, fetchImpl = fetch) {
  const qs = stateId ? `?state=${seg(stateId)}` : "";
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${qs}`,
    { fetchImpl },
  );
  return unwrap(data).map(mapItem);
}

export async function patchState(cfg, projectId, workItemId, stateId, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { method: "PATCH", body: { state: stateId }, fetchImpl },
  );
  return mapItem(data);
}

/** 极简 HTML → 文本：Plane 的描述是 description_html，面板只需要能读。 */
export function htmlToText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 单条工作项 + 描述文本（详情用，取最新）。 */
export async function getWorkItem(cfg, projectId, workItemId, fetchImpl = fetch) {
  const raw = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { fetchImpl },
  );
  return { item: mapItem(raw), description: htmlToText(raw?.description_html ?? raw?.description ?? "") };
}

/* ---------------- 06 片：标签与通用写入 ---------------- */

export async function listLabels(cfg, projectId, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/labels/`, { fetchImpl });
  return unwrap(data).map((r) => ({ id: String(r.uuid ?? r.id ?? ""), name: String(r.name ?? "") }));
}

/** 按名字找标签，没有就建（v1 的标签是项目级）。 */
export async function ensureLabel(cfg, projectId, name, fetchImpl = fetch) {
  const found = (await listLabels(cfg, projectId, fetchImpl)).find(
    (l) => l.name.toLowerCase() === String(name).toLowerCase(),
  );
  if (found) return found;
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/labels/`, {
    method: "POST",
    body: { name, color: "#a78bfa" },
    fetchImpl,
  });
  return { id: String(data?.uuid ?? data?.id ?? ""), name: String(data?.name ?? name) };
}

export async function patchWorkItem(cfg, projectId, workItemId, patch, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { method: "PATCH", body: patch, fetchImpl },
  );
  return mapItem(data);
}

/* ---------------- 07 片：评论回填 ---------------- */

function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

/** 纯文本 → Plane 评论用的 HTML：空行分段，单换行用 <br>。 */
export function textToCommentHtml(text, { sessionId } = {}) {
  const body = String(text || "")
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const head = sessionId
    ? `<p><em>（来自 OpenChamber 会话 <code>${escapeHtml(sessionId)}</code>）</em></p>`
    : "";
  return head + body;
}

export async function addComment(cfg, projectId, workItemId, text, { sessionId } = {}, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/comments/`,
    { method: "POST", body: { comment_html: textToCommentHtml(text, { sessionId }) }, fetchImpl },
  );
  return {
    id: String(data?.uuid ?? data?.id ?? ""),
    createdAt: data?.created_at ? String(data.created_at) : new Date().toISOString(),
  };
}

/** 新建工作项（名称 + 目标状态；v1/v2 路径分支在 request 里）。 */
export async function createWorkItem(cfg, projectId, name, stateId, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/`,
    { method: "POST", body: { name, state: stateId }, fetchImpl },
  );
  return mapItem(data);
}
