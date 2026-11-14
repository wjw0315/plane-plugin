import type { PluginServerContext } from "@getpaseo/plugin/server";
import { PLANE_SETTINGS } from "./shared/plane-settings";

/**
 * 插件 server 入口。
 *
 * 票 01 只注册配置设置：daemon 自动处理读写 / 重置 RPC，
 * Plane API 封装（list / patch）在票 02 加入。
 */
export default function contribute(server: PluginServerContext) {
  server.registerSettings(PLANE_SETTINGS);
  return () => {};
}
