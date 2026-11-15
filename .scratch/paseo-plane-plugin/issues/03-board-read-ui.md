# 03 — 看板读取 UI

**What to build:** 用户打开看板屏幕，能看到目标项目的工作流列（列名取自该项目的 states，动态生成）与各列下的 work item 卡片（含标题、指派人、优先级、状态等关键信息）；数据经客户端 RPC 调用 server、再由 server 调 Plane 获取。

**Blocked by:** 02 — Plane API server 封装层

**Status:** resolved

- [x] 看板列自动反映目标项目的 states 配置，不写死列名
- [x] 每张卡片展示标题、指派人、优先级、状态等关键信息
- [x] 切换目标 project 后看板重新拉取并渲染对应数据
- [x] 数据加载失败时看板显示明确错误提示

## Implementation

- `shared/plane-rpc.ts` — 新增 `planeListProjectsRpc`（`plane.list-projects`，RPC 名称全小写）与 `planeProjectSchema`；`planeWorkItemSchema` 增加 `assignees: [{ id, name }]`。
- `server/plane-api.ts` — 新增 `listProjects()`；抽出 `mapWorkItem()` 统一 work item 映射（含 assignees），`listWorkItems` / `patchState` 共用。
- `index.server.ts` — 注册 `planeListProjectsRpc` handler，配置缺失或 API 错误时返回 `{ status: "error" }`。
- `client/plane-screen.tsx` — 完整重写：顶部横向项目切换器（点击切换后自动重拉 states + work items），看板主体为横向滚动的动态列（列名取自 states，色点取自 state.color，列头显示卡片数），卡片含 identifier、优先级（紧急/高/中/低，颜色分级）、标题、指派人（无则"未指派"）。配置缺失/加载错误均有明确提示。

**验证**：`tsc --noEmit` 零错误；`tests/plane-api.test.ts` 7 项全过（含新增 assignees 映射）；`paseo plugin reload` 后日志 "Plugin ready" 无报错。
