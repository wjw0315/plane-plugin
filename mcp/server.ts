import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import type { PlaneConfig } from "../shared/plane-settings";
import {
  listProjects,
  listStates,
  listWorkItems,
  getWorkItem,
  patchState,
  createWorkItem,
  listLabels,
  createLabel,
  ensureLabel,
  PlaneApiError,
} from "../server/plane-api";

/**
 * Plane MCP Server —— 把自托管 Plane（plane.so）v2 REST API 暴露给 codeg 等 MCP 客户端。
 *
 * 配置走环境变量（codeg Settings → MCP 的 environment 字段）：
 *   PLANE_BASE_URL   自托管 Plane 地址，如 http://plane.example.com
 *   PLANE_API_KEY    Plane API Key（X-Api-Key 认证）
 *   PLANE_WORKSPACE  目标 workspace 标识
 *
 * 复用 ../server/plane-api.ts 的 API 客户端，零重复逻辑。
 */

function loadConfig(): PlaneConfig {
  return {
    baseUrl: process.env.PLANE_BASE_URL ?? "",
    apiKey: process.env.PLANE_API_KEY ?? "",
    workspace: process.env.PLANE_WORKSPACE ?? "",
    apiVersion: "v2",
    webhookEnabled: false,
    webhookSecret: "",
    webhookPort: 8788,
  };
}

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(e: unknown) {
  const msg = e instanceof PlaneApiError ? e.message : e instanceof Error ? e.message : String(e);
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
}

function requireConfig(config: PlaneConfig): string | null {
  if (!config.baseUrl) return "PLANE_BASE_URL 未配置";
  if (!config.apiKey) return "PLANE_API_KEY 未配置";
  if (!config.workspace) return "PLANE_WORKSPACE 未配置";
  return null;
}

const server = new McpServer({ name: "plane", version: "0.1.0" });

// ---- 项目 / 状态 ----

server.registerTool(
  "list_projects",
  {
    description: "列出 Plane workspace 下的所有项目（看板切换用）",
    inputSchema: {},
  },
  async () => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await listProjects(config));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "list_states",
  {
    description: "列出某项目下的所有状态（工作项流转用）",
    inputSchema: { projectId: z.string().describe("项目 uuid 或标识符") },
  },
  async ({ projectId }) => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await listStates(config, projectId));
    } catch (e) {
      return errorResult(e);
    }
  },
);

// ---- 工作项 ----

server.registerTool(
  "list_work_items",
  {
    description: "列出某项目下的工作项，可按状态过滤",
    inputSchema: {
      projectId: z.string().describe("项目 uuid 或标识符"),
      stateId: z.string().optional().describe("状态 uuid，不传则返回全部"),
    },
  },
  async ({ projectId, stateId }) => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await listWorkItems(config, projectId, stateId));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "get_work_item",
  {
    description: "获取单个工作项详情（含标签、指派人）",
    inputSchema: {
      projectId: z.string().describe("项目 uuid 或标识符"),
      workItemId: z.string().describe("工作项 uuid 或标识符"),
    },
  },
  async ({ projectId, workItemId }) => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await getWorkItem(config, projectId, workItemId));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "patch_state",
  {
    description: "修改工作项的状态（拖拽改状态 / 流转用）",
    inputSchema: {
      projectId: z.string().describe("项目 uuid 或标识符"),
      workItemId: z.string().describe("工作项 uuid 或标识符"),
      stateId: z.string().describe("目标状态 uuid（先 list_states 取）"),
    },
  },
  async ({ projectId, workItemId, stateId }) => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await patchState(config, projectId, workItemId, stateId));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "create_work_item",
  {
    description: "创建工作项（可指定状态与标签）",
    inputSchema: {
      projectId: z.string().describe("项目 uuid 或标识符"),
      name: z.string().describe("工作项名称"),
      stateId: z.string().describe("目标状态 uuid（先 list_states 取）"),
      labelIds: z.array(z.string()).optional().describe("标签 uuid 数组，可选"),
    },
  },
  async ({ projectId, name, stateId, labelIds }) => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(
        await createWorkItem(config, projectId, name, stateId, labelIds ?? []),
      );
    } catch (e) {
      return errorResult(e);
    }
  },
);

// ---- 标签 ----

server.registerTool(
  "list_labels",
  {
    description: "列出 workspace 下的所有标签",
    inputSchema: {},
  },
  async () => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await listLabels(config));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "create_label",
  {
    description: "创建标签；名称已存在时返回已有标签",
    inputSchema: { name: z.string().describe("标签名称") },
  },
  async ({ name }) => {
    const config = loadConfig();
    const missing = requireConfig(config);
    if (missing) return errorResult(new Error(missing));
    try {
      return textResult(await ensureLabel(config, name));
    } catch (e) {
      return errorResult(e);
    }
  },
);

// ---- 启动 ----

const transport = new StdioServerTransport();
server.connect(transport).catch((e) => {
  console.error("Plane MCP server 启动失败:", e);
  process.exit(1);
});
