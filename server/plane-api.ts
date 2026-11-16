import type { PlaneConfig } from "../shared/plane-settings";
import type { planeStateSchema, planeWorkItemSchema, planeProjectSchema } from "../shared/plane-rpc";
import { z } from "zod";

type State = z.infer<typeof planeStateSchema>;
type WorkItem = z.infer<typeof planeWorkItemSchema>;
type Project = z.infer<typeof planeProjectSchema>;

/**
 * Plane v2 REST API 客户端。
 *
 * 所有请求走 `X-Api-Key` 认证，错误以 `PlaneApiError` 抛出，
 * 由上层 RPC handler 捕获后转成可读的 error 响应。
 */
export class PlaneApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "PlaneApiError";
  }
}

/**
 * API 版本前缀。
 *
 * - v1：Plane 0.x 的公开 API（`/api/v1/`），`X-Api-Key` 认证，游标分页，工作项叫 issues。
 * - v2：Plane 1.x 的新 API（`/api/v2/`），工作项叫 work-items。
 */
function apiPrefix(config: PlaneConfig): string {
  return config.apiVersion === "v1" ? "/api/v1" : "/api/v2";
}

/** 工作项路径段：v1 叫 issues，v2 叫 work-items。 */
function workItemSegment(config: PlaneConfig): string {
  return config.apiVersion === "v1" ? "issues" : "work-items";
}

function resolveBaseUrl(config: PlaneConfig): string {
  const base = config.baseUrl.replace(/\/+$/, "");
  return `${base}${apiPrefix(config)}`;
}

function headers(config: PlaneConfig): Record<string, string> {
  return {
    "X-Api-Key": config.apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function request<T>(
  config: PlaneConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${resolveBaseUrl(config)}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...headers(config), ...(init.headers ?? {}) } });
  } catch (e) {
    throw new PlaneApiError(
      `无法连接 Plane 实例（${config.baseUrl}）：${e instanceof Error ? e.message : String(e)}`,
      0,
    );
  }
  if (res.status === 401) throw new PlaneApiError("API Key 无效或已过期（401）", 401);
  if (res.status === 404) throw new PlaneApiError("请求的端点或资源不存在（404）", 404);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new PlaneApiError(`Plane API 请求失败（${res.status}）：${detail.slice(0, 200)}`, res.status);
  }
  return res.json() as Promise<T>;
}

/** GET states 列表，映射到 PlaneState 数组。 */
export async function listStates(config: PlaneConfig, projectId: string): Promise<State[]> {
  const data = await request<{ results: Array<Record<string, unknown>> }>(
    config,
    `/workspaces/${encodeURIComponent(config.workspace)}/projects/${encodeURIComponent(projectId)}/states/`,
  );
  return data.results.map((raw) => ({
    id: String(raw.uuid ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    color: raw.color != null ? String(raw.color) : null,
  }));
}

/** GET work items 列表，映射到 WorkItem 数组。 */
export async function listWorkItems(
  config: PlaneConfig,
  projectId: string,
  stateId?: string,
): Promise<WorkItem[]> {
  const params = new URLSearchParams();
  if (stateId) params.set("state", stateId);
  const qs = params.toString();
  const data = await request<{ results: Array<Record<string, unknown>> }>(
    config,
    `/workspaces/${encodeURIComponent(config.workspace)}/projects/${encodeURIComponent(projectId)}/${workItemSegment(config)}/${qs ? `?${qs}` : ""}`,
  );
  return data.results.map((raw) => mapWorkItem(raw));
}

function mapWorkItem(raw: Record<string, unknown>): WorkItem {
  const assignees = Array.isArray(raw.assignees) ? raw.assignees : [];
  const labels = Array.isArray(raw.labels) ? raw.labels : [];
  return {
    id: String(raw.uuid ?? raw.id ?? ""),
    identifier: String(raw.identifier ?? raw.sequence_id ?? ""),
    name: String(raw.name ?? ""),
    stateId: String(raw.state ?? ""),
    priority: raw.priority != null ? String(raw.priority) : null,
    assignees: assignees.map((a: Record<string, unknown>) => ({
      id: String(a.uuid ?? a.id ?? ""),
      name: String(a.name ?? a.display_name ?? ""),
    })),
    labels: labels.map((l: unknown) => String(l)),
  };
}

/**
 * 按 work item 的标签反查关联的 Paseo 会话 id。
 *
 * work item 的 `labels` 是标签 uuid，需先 `listLabels` 取回名称，
 * 再按 `paseo-<agentId>` 约定匹配，首个命中的后缀即为会话 id；无匹配返回 null。
 */
export async function resolveSessionAgentId(
  config: PlaneConfig,
  itemLabels: string[],
  projectId?: string,
): Promise<string | null> {
  if (itemLabels.length === 0) return null;
  const labels = await listLabels(config, projectId);
  const nameById = new Map(labels.map((l) => [l.id, l.name]));
  for (const id of itemLabels) {
    const name = nameById.get(id);
    if (!name) continue;
    const m = name.match(/^paseo-(.+)$/i);
    if (m) return m[1];
  }
  return null;
}

/** GET workspace 下的项目列表，用于看板项目切换。 */
export async function listProjects(config: PlaneConfig): Promise<Project[]> {
  const data = await request<{ results: Array<Record<string, unknown>> }>(
    config,
    `/workspaces/${encodeURIComponent(config.workspace)}/projects/`,
  );
  return data.results.map((raw) => ({
    id: String(raw.uuid ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    identifier: String(raw.identifier ?? ""),
  }));
}

/** PATCH 单个 work item 的 state。 */
export async function patchState(
  config: PlaneConfig,
  projectId: string,
  workItemId: string,
  stateId: string,
): Promise<WorkItem> {
  const data = await request<Record<string, unknown>>(
    config,
    `/workspaces/${encodeURIComponent(config.workspace)}/projects/${encodeURIComponent(projectId)}/${workItemSegment(config)}/${encodeURIComponent(workItemId)}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ state: stateId }),
    },
  );
  return mapWorkItem(data);
}

/** GET 单个 work item（含 labels）。 */
export async function getWorkItem(
  config: PlaneConfig,
  projectId: string,
  workItemId: string,
): Promise<WorkItem> {
  const data = await request<Record<string, unknown>>(
    config,
    `/workspaces/${encodeURIComponent(config.workspace)}/projects/${encodeURIComponent(projectId)}/${workItemSegment(config)}/${encodeURIComponent(workItemId)}/`,
  );
  return mapWorkItem(data);
}

/** 会话生命周期同步的目标阶段。 */
export type SyncPhase = "backlog" | "in_progress" | "done";

export interface Label {
  id: string;
  name: string;
}

/**
 * 标签路径。
 *
 * v1 的标签挂在项目下（`/projects/{id}/labels/`），v2 挂在 workspace 下（`/labels/`）。
 * v1 未指定 projectId 时，取 workspace 下第一个项目。
 */
async function labelsPath(config: PlaneConfig, projectId?: string): Promise<string> {
  const ws = encodeURIComponent(config.workspace);
  if (config.apiVersion !== "v1") return `/workspaces/${ws}/labels/`;
  let pid = projectId;
  if (!pid) {
    const projects = await listProjects(config);
    const first = projects[0];
    if (!first) throw new PlaneApiError("workspace 下没有项目，无法定位标签", 404);
    pid = first.id;
  }
  return `/workspaces/${ws}/projects/${encodeURIComponent(pid)}/labels/`;
}

/** GET 标签列表（v1 按项目过滤，v2 为 workspace 级）。 */
export async function listLabels(config: PlaneConfig, projectId?: string): Promise<Label[]> {
  const data = await request<{ results: Array<Record<string, unknown>> }>(
    config,
    await labelsPath(config, projectId),
  );
  return data.results.map((raw) => ({
    id: String(raw.uuid ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
  }));
}

/** POST 创建标签（v1 按项目创建，v2 为 workspace 级）。 */
export async function createLabel(config: PlaneConfig, name: string, projectId?: string): Promise<Label> {
  const data = await request<Record<string, unknown>>(
    config,
    await labelsPath(config, projectId),
    { method: "POST", body: JSON.stringify({ name, color: "#3b82f6" }) },
  );
  return { id: String(data.uuid ?? data.id ?? ""), name: String(data.name ?? name) };
}

/** 按名称找标签（同作用域内唯一），不存在则创建；并发撞名时回退再查。 */
export async function ensureLabel(
  config: PlaneConfig,
  name: string,
  projectId?: string,
): Promise<Label> {
  const find = async (): Promise<Label | undefined> =>
    (await listLabels(config, projectId)).find((l) => l.name.toLowerCase() === name.toLowerCase());
  const existing = await find();
  if (existing) return existing;
  try {
    return await createLabel(config, name, projectId);
  } catch (e) {
    const again = await find();
    if (again) return again;
    throw e;
  }
}

/** POST 创建 work item（带 state 与标签）。 */
export async function createWorkItem(
  config: PlaneConfig,
  projectId: string,
  name: string,
  stateId: string,
  labelIds: string[],
): Promise<WorkItem> {
  const data = await request<Record<string, unknown>>(
    config,
    `/workspaces/${encodeURIComponent(config.workspace)}/projects/${encodeURIComponent(projectId)}/${workItemSegment(config)}/`,
    { method: "POST", body: JSON.stringify({ name, state: stateId, labels: labelIds }) },
  );
  return mapWorkItem(data);
}

const PHASE_ALIASES: Record<SyncPhase, string[]> = {
  backlog: ["backlog", "todo"],
  in_progress: ["in progress", "in-progress", "doing"],
  done: ["done", "complete"],
};

/** 按阶段别名在项目 states 中匹配目标状态 id，找不到返回 null。 */
export function resolveStateForPhase(states: State[], phase: SyncPhase): string | null {
  const aliases = PHASE_ALIASES[phase];
  for (const alias of aliases) {
    const hit = states.find((s) => s.name.toLowerCase().trim() === alias);
    if (hit) return hit.id;
  }
  for (const alias of aliases) {
    const hit = states.find((s) => s.name.toLowerCase().includes(alias));
    if (hit) return hit.id;
  }
  return null;
}
