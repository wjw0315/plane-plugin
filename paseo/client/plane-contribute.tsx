import type { PluginClientContext } from "@getpaseo/plugin/client";
import { PlaneScreen } from "./plane-screen";
import { PlaneSidebarEntry } from "./plane-sidebar-entry";
import { PlaneSettingsPage } from "./plane-settings-page";
import { PLANE_SCREEN_ID } from "../shared/plane-ids";

/** 设置页贡献点 id：宿主设置里的入口与「去设置」跳转都用它。 */
const PLANE_SETTINGS_SCREEN_ID = "plane-settings";

/**
 * 装配 Plane 插件的四个贡献点：
 * - 看板屏幕（`addScreen`）
 * - 侧边栏头部入口（`addSidebarHeaderItem`）
 * - 命令中心入口（`addCommandCenterItem`）
 * - 配置设置页（`addSettingsScreen`）
 *
 * 返回的清理函数在插件卸载时依次调用各贡献点的 remove。
 */
export function contributePlane(client: PluginClientContext): () => void {
  const cleanups: Array<() => void> = [
    client.addScreen({
      id: PLANE_SCREEN_ID,
      title: "Plane 任务看板",
      // 顶栏的「⚙ 设置」需要跳宿主设置页，这里把跳转动作注入屏幕
      Component: (screenProps) => (
        <PlaneScreen
          {...screenProps}
          onOpenSettings={() => client.openSettings(PLANE_SETTINGS_SCREEN_ID)}
        />
      ),
    }),
    client.addSidebarHeaderItem({
      id: "plane-sidebar",
      title: "Plane 任务看板",
      Component: PlaneSidebarEntry,
    }),
    client.addCommandCenterItem({
      id: "open-plane-board",
      title: "打开 Plane 任务看板",
      icon: "SquareKanban",
      keywords: ["plane", "看板", "任务", "board", "kanban"],
      context: "global",
      onSelect: (context) => {
        context.openScreen({ screenId: PLANE_SCREEN_ID });
      },
    }),
    client.addSettingsScreen({
      id: PLANE_SETTINGS_SCREEN_ID,
      title: "Plane",
      icon: "Blocks",
      Component: PlaneSettingsPage,
    }),
  ];

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}
