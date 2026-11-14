# 01 — 插件脚手架与配置

**What to build:** Paseo 插件加载后，侧边栏、命令中心与主屏幕出现 Plane 任务看板入口；用户能在配置中填入 Plane 自托管 base URL、API Key、目标 workspace / project、API 版本（默认 v2）并保存，配置在插件重启后仍生效。

**Blocked by:** None — can start immediately

**Status:** resolved

- [x] 插件在 Paseo 中加载，三个贡献点（侧边栏入口、命令中心入口、看板屏幕）均可见
- [x] 配置表单可填写并保存 Plane base URL / API Key / workspace / project / API 版本
- [x] 配置持久化，重启后配置值保留
- [x] 配置缺失或非法时插件给出明确提示，不崩溃

## Implementation

已实现并验证：`paseo-plugin.json` 清单、`shared/plane-settings.ts`（`defineSettings` 五字段 schema）、`client/plane-contribute.tsx`（装配 `addScreen`/`addSidebarHeaderItem`/`addCommandCenterItem`/`addSettingsScreen` 四贡献点）、`client/plane-screen.tsx`（配置状态展示）、`client/plane-sidebar-entry.tsx`、`client/plane-settings-page.tsx`（读写表单）、`index.client.tsx`、`index.server.ts`（`registerSettings`）。`tsc --noEmit` 零错误，`paseo plugin install` 后 daemon 日志 "Plugin ready" 无报错。
