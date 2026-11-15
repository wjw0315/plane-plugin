# 06 — 卡片点击唤起会话

**What to build:** 用户点击看板上的 work item 卡片，插件按标签 `paseo` + 会话 id 反查到对应 Paseo 会话并直接唤起，无需手动查找，实现任务到会话的反向跳转。

**Blocked by:** 05 — 会话生命周期同步

**Status:** resolved

- [x] 点击带会话标签的卡片能直接唤起对应 Paseo 会话
- [x] 无可关联会话的卡片点击时给出明确提示，不崩溃

## Implementation

- `shared/plane-rpc.ts` — `planeWorkItemSchema` 增加 `labels: z.array(z.string())`（work item 的标签 uuid 列表）；新增 `planeResolveSessionRpc`（`plane.resolve-session`，输入 `{ projectId, workItemId }`，输出 `ready`/`error` 二态）。
- `server/plane-api.ts` —
  - `mapWorkItem` 增加 `labels` 映射（Plane 返回的标签 uuid 数组）。
  - 新增 `getWorkItem(config, projectId, workItemId)`：GET 单条 work item。
  - 新增 `resolveSessionAgentId(config, itemLabels)`：取 work item 标签 uuid → `listLabels` 取回名称 → 按 `paseo-<agentId>` 约定匹配，首个命中返回会话 id，无匹配返回 null。
- `index.server.ts` — 注册 `planeResolveSessionRpc` handler：读配置 → `getWorkItem` 取标签 → `resolveSessionAgentId` 反查；无关联返回「该任务未关联 Paseo 会话」错误，API 异常捕获转可读响应。
- `client/plane-screen.tsx` —
  - 卡片释放时按位移阈值（<10px）区分点按与拖拽：点按走 `handleTapCard`，拖拽走原有的改状态逻辑。
  - `handleTapCard` 调 `plane.resolve-session` RPC，拿到 agentId 后 `navigation.openAgent({ agentId })` 唤起会话；无关联或导航不可用时在看板下方显示提示（statusWarning 色），不崩溃。
  - 新增 `tapError` 状态与展示；`navigation` 从 `PluginScreenProps` 解构（旧宿主缺失时降级提示）。

**验证**：`tsc --noEmit` 零错误；`tests/plane-api.test.ts` 14 项全过（新增 resolveSessionAgentId 匹配/未命中/空、getWorkItem 含 labels）；`paseo plugin reload` 后日志 "Plugin ready" 无报错。点按/拖拽区分与唤起为客户端交互，需在 Paseo 界面中实际点按卡片验证。
