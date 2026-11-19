import React from "react";
import type { PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { PLANE_SCREEN_ID } from "../shared/plane-ids";

/**
 * 侧边栏头部入口（`addSidebarHeaderItem`）。点击打开看板屏幕。
 * 用宿主统一的 `SidebarRow` 渲染，保证与其他侧边栏条目样式一致。
 */
export function PlaneSidebarEntry(props: PluginSidebarItemProps) {
  const { openScreen, currentScreen } = props;

  return (
    <SidebarRow
      label="Plane 任务看板"
      icon="SquareKanban"
      active={currentScreen?.screenId === PLANE_SCREEN_ID}
      onPress={() => openScreen({ screenId: PLANE_SCREEN_ID })}
    />
  );
}
