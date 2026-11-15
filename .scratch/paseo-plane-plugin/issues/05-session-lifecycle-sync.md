# 05 — 会话生命周期同步（正向）

**What to build:** 当 Paseo 会话创建、进行、结束时，插件自动在目标 Plane 项目创建或更新对应 work item——标题为会话名，标签含 `paseo` 与会话 id，状态随会话推进流转（创建→Backlog，进行中→In Progress，结束→Done），使会话与团队任务一一对应。

**Blocked by:** 03 — 看板读取 UI

**Status:** resolved

- [x] 会话创建时在目标项目生成 work item，标题=会话名，state=Backlog，标签含 paseo+会话id
- [x] 会话进行中对应 work item 的 state 更新为 In Progress
- [x] 会话结束时对应 work item 的 state 更新为 Done
- [x] 异常结束或删除的会话按约定处理，不留孤立 work item

## Implementation

- `server/plane-api.ts` — 新增 `SyncPhase` 类型（`backlog`/`in_progress`/`done`）、`Label` 接口、`listLabels`/`createLabel`/`ensureLabel`（workspace 内按名查找，不存在则 POST 创建，并发撞名回退再查）、`createWorkItem`（POST 带 name/state/labels）、`resolveStateForPhase`（按阶段别名精确匹配优先、再子串匹配，未命中返回 null）。
- `index.server.ts` — 接入生命周期钩子：
  - `before("agent.session_open")`：从会话标签 `plane:project`（= Plane 项目 uuid）记录 `agentId → projectId`，无标签则不同步（避免孤立 work item）。
  - `agent.created`：在目标项目创建 work item（标题=会话名，state=Backlog，标签 `paseo-<agentId>`），记入 `syncItems`。
  - `agent.turn_started` / `agent.closed` / `agent.archived`：调用 `syncPhase` 幂等流转到 In Progress / Done（closed 与 archived 均视为结束）。
  - 全部钩子 try/catch，错误经 `console.error` 以 `[plane-plugin]` 前缀记录，不抛出未处理异常。
- `tests/plane-api.test.ts` — 扩展至 12 项，覆盖 listLabels、ensureLabel（复用/创建）、createWorkItem、resolveStateForPhase（别名匹配与未命中）。

**验证**：`tsc --noEmit` 零错误；`tests/plane-api.test.ts` 12 项全过；`paseo plugin reload` 后日志 "Plugin ready" 无报错。

**约定说明**：目标项目不进 settings，从会话标签 `plane:project` 获取（会话创建时打标签）；无该标签的会话不同步，确保异常/删除会话不留孤立 work item。`agent.closed`/`agent.archived` 均映射为 Done，符合「不留未完结 item」的约定。
