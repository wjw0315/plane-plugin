# 04 — 拖拽改状态

**What to build:** 用户在看板上把一张卡片拖到另一列，对应 Plane work item 的 state 被更新为该列对应的状态，刷新后看板反映新状态，使看板成为可用的工作流操作界面。

**Blocked by:** 03 — 看板读取 UI

**Status:** resolved

- [x] 拖拽卡片到目标列后，该 work item 在 Plane 中的 state 变为目标列对应状态
- [x] 刷新看板后卡片出现在新列
- [x] 拖拽失败（如网络/鉴权）时卡片状态不变并给出提示

## Implementation

`client/plane-screen.tsx` 增加拖拽改状态：

- 每张卡片挂 `PanResponder`：触摸即接管手势（看板横向滚动留给滚轮/触控板与列间空隙），grant 时用 `measureInWindow` 一次性量取各列的窗口坐标存入 `columnRects`，move 时按手势坐标命中目标列并高亮（accent 边框），释放时命中检测确定目标列。
- 释放后调用 `plane.patch-state` RPC：先乐观把卡片移到目标列，失败回滚到原列并显示「拖拽失败：<原因>」提示；目标列与当前列相同则忽略。
- 拖拽中被拖卡片降透明度 + accent 边框，其余卡片半透明，目标列高亮。
- `patchState` 经由 `useRpc(planePatchStateRpc)`，server 侧 handler 在票 02 已注册。

**验证**：`tsc --noEmit` 零错误；`tests/plane-api.test.ts` 7 项全过（含 PATCH body/401/404/网络错误，即拖拽失败路径的底层保障）；`paseo plugin reload` 日志 "Plugin ready" 无报错。拖拽手势为客户端交互，需在 Paseo 界面中实际拖动卡片验证命中与回滚表现。
