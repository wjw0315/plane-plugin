# 08 — 看板页面按设计稿重构

**What to build:** 把 Paseo 插件的看板页从「能跑的裸实现」重做成设计稿里的样子：顶栏（状态点 / 标题 / 列·列表段控件 / 项目切换 / 刷新 / 设置）、列视图与列表视图双形态、卡片 chip 体系、底部 toast 与撤销，以及未配置 / 加载 / 空 / 错四态。用户先看设计稿与原型，确认外观后再决定后续加什么功能。

**Blocked by:** 04 — 拖拽改状态；06 — 卡片点击唤起会话

**Status:** resolved

- [x] 顶栏四件套齐活：状态点、视图段控件、项目切换、刷新、设置入口
- [x] 列视图可拖拽改状态（沿用既有 PanResponder + measureInWindow 命中），失败回滚 + toast
- [x] 列表视图按状态分组、组头可折叠，用「移动到」状态 pill 改状态
- [x] 卡片展示编号、优先级 chip、指派头像、标签 chip、会话 chip
- [x] 改状态后 toast 提供「撤销」，5 秒内可放回原列
- [x] 未配置 / 加载中 / 空项目 / 出错四态都有明确文案
- [x] 页面组件按职责拆分到 `client/plane/`，`plane-screen.tsx` 只留数据装配与编排
- [x] 设置按钮跳宿主设置页（贡献点注入 `onOpenSettings`）

## Implementation

- `paseo/docs/paseo-插件页面-设计稿.md` — 设计稿 v1.0（待确认）：页面骨架、尺寸 / 颜色 token 映射、卡片 / 列 / 列表 / toast 组件规格、本期交互清单、四态说明、本期不做的范围、验收清单。数值取自 `openchamber/panel/index.html` 的 CSS，两处需同步。
- `paseo/client/plane/prototype-preview.html` — 设计稿单文件预览原型（零依赖、mock 数据、`?view=list` 切列表视图），供不装插件时看效果；非生产代码。
- `paseo/client/plane/tokens.ts` — `SIZE`（顶栏高 40、列宽 200/160、圆角、字号、间距等）、`PRIORITY_CHIP`（紧急 / 高 / 中 / 低固定色）、`DRAG_OVER`、`SESSION_CHIP`、`TOAST`、`IDENTIFIER_PREFIX = "XLMSC-"`；`PlaneColors` 取 `theme.colors`。
- `paseo/client/plane/types.ts` — `PlaneProject` / `PlaneState` / `PlaneWorkItem`（从 `shared/plane-rpc.ts` 的 zod schema 推导）与 `PlaneViewMode`。
- `paseo/client/plane/labels.ts` — `extractSessionAgentId`（标签名匹配 `paseo-<agentId>`，直接取 agentId，不额外发 RPC）、`readableLabels`（过滤 uuid 形态标签）。
- `paseo/client/plane/header.tsx` — 顶栏；项目切换在项目 ≤3 时循环切下一个，>3 时弹出项目浮层（超过 8 项滚动）。
- `paseo/client/plane/board-view.tsx` — 列视图；保留既有 `PanResponder` 拖拽与 `measureInWindow` + `hitTestColumn` 命中逻辑，窄屏用更窄的列。
- `paseo/client/plane/list-view.tsx` — 列表视图；状态分组 + 组头折叠，每张卡片下方一排「移动到」状态 pill（RN 无原生 select，用 pill 代替）。
- `paseo/client/plane/card.tsx` / `chips.tsx` — 卡片与 chip（优先级 / 标签 / 指派头像取名末两字 / 会话 chip 紫色系）。
- `paseo/client/plane/toast.tsx` — 底部 toast；成功带「撤销」，失败显示服务端错误文案；同时只显示一条，新的覆盖旧的。
- `paseo/client/plane-screen.tsx` — 重写为「壳」：拉配置 / 项目 / states + work items（刷新按钮用 `reloadToken` 触发重拉）、视图切换不重新请求、toast 状态与自动消失（成功 5 秒 / 失败 8 秒）、改状态乐观更新 + 失败回滚、撤销把卡片放回原列；四种页面态各有文案。
- `paseo/client/plane-contribute.tsx` — 新增 `PLANE_SETTINGS_SCREEN_ID = "plane-settings"` 常量；`addScreen` 处用闭包把 `onOpenSettings`（`client.openSettings`）注入 `PlaneScreen`；设置贡献点 id 复用同一常量。
- `paseo/README.md` — 目录结构补 `client/plane/` 组件清单与 `docs/`。

**保留的既有行为**（重写中未丢）：拖拽改状态与命中列逻辑、乐观更新 + 失败回滚原列、点卡片走 `plane.resolve-session` → `navigation.openAgent` 唤起会话。

**验证**：`cd paseo && npm run typecheck` 零错误；`npm test`（`tests/plane-api.test.ts` 14 项 + `tests/plane-webhook.test.ts` 6 项）全过。视觉与拖拽手感需在 Paseo 界面里实际看（装 `paseo/` 子目录后 `plugin reload`，窗口 ⌘R）。

**本期不做**（留给用户看设计稿后再定）：新建工作项、任务详情覆盖页、发起会话 / 结论回填、视图选择持久化、手机端布局专项。
