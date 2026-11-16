import { z } from "zod";

/**
 * Plane 配置的纯定义（不含 Paseo 语义）。
 *
 * Paseo 插件用它注册设置项（`shared/plane-settings.ts`），
 * MCP server 直接用它构造配置对象 —— 两者共用同一份字段定义，
 * 但 MCP 不需要依赖 Paseo SDK。
 */
export const planeConfigSchema = z.object({
  baseUrl: z.string().default(""),
  apiKey: z.string().default(""),
  workspace: z.string().default(""),
  apiVersion: z.enum(["v1", "v2"]).default("v2"),
  webhookEnabled: z.boolean().default(false),
  webhookSecret: z.string().default(""),
  webhookPort: z.number().int().min(1).max(65535).default(8788),
});

export type PlaneConfig = z.infer<typeof planeConfigSchema>;
