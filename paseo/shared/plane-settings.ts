import { defineSettings } from "@getpaseo/plugin";
import { planeConfigSchema } from "./plane-config";

/**
 * Plane 插件配置：连接自托管 Plane 实例并选择目标 workspace。
 * project 是看板数据级字段，在看板中切换，不留在设置里。
 *
 * 每个字段各自降级到默认值，单个非法值不会使整个记录失效。
 * 配置持久化由 daemon 通过 `server.registerSettings` 自动处理，
 * 客户端经 `settingsRpc` 读写。
 */
export const PLANE_SETTINGS = defineSettings({
  id: "plane",
  scope: "host",
  version: 2,
  schema: planeConfigSchema,
});

export type { PlaneConfig } from "./plane-config";
