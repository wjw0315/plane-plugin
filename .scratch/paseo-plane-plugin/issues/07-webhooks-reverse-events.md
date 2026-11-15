# 07 — Webhooks 反向事件（可选）

**What to build:** 当 Plane 中 work item 状态被外部变更时，插件通过接收 Plane webhook 感知该变更，并触发对应 Paseo 会话的相应动作，实现任务到会话的反向事件驱动（非轮询）。

**Blocked by:** 05 — 会话生命周期同步

**Status:** resolved

- [x] 插件能接收并解析 Plane webhook 中的 work item 状态变更事件
- [x] 状态变更能映射到并触发对应会话动作
- [x] webhook 签名校验或等价鉴权到位，拒绝非法请求

## Implementation

- `shared/plane-settings.ts` — 新增 `webhookEnabled`（默认 false）、`webhookSecret`、`webhookPort`（默认 8788）三个字段，版本升到 2。
- `server/plane-webhook.ts` — 新增 webhook 接收模块：
  - `verifyWebhookSignature(secret, body, signature)`：HMAC-SHA256 校验 Plane `X-Plane-Signature` 头，常量时间比较防时序攻击；空 secret/签名、篡改 body 均拒绝。
  - `parseWebhookPayload(body)`：解析 Plane v2 载荷，提取 `event`/`entity_id`/`workspace_id`/`data`；非法结构返回 null。
  - `startWebhookServer(config, onEvent)`：Node `http` 服务器，监听 `webhookPort`，POST 请求经签名校验 → 载荷解析 → 调用 `onEvent`；405（非 POST）/403（签名无效）/400（载荷非法）/500（处理异常）/200（成功）。返回停止函数。
- `index.server.ts` —
  - `agent.session_open` 钩子增加捕获 `context.paseo`（contribute 本身不接收 paseo，从钩子上下文取，结构兼容 `PaseoApi`）。
  - 新增 `handleWebhookEvent`：过滤 `workitem.*` 事件 → 取 `data.project` → 优先用载荷内 `labels`，缺失则 `getWorkItem` 拉取 → `resolveSessionAgentId` 反查会话 → 向会话 `send()` 状态变更通知。
  - `contribute` 末尾异步读取配置，`webhookEnabled && webhookSecret` 时启动 webhook 服务器；清理函数负责停止服务器。
- `client/plane-settings-page.tsx` — 新增 Webhook 区块：启用开关（关闭/启用分段控件）、Secret 输入、端口输入（仅启用时显示）。
- `tests/plane-webhook.test.ts` — 6 项测试覆盖签名校验（有效/错误密钥/空值/篡改 body）与载荷解析（v2 结构/非法结构）。

**验证**：`tsc --noEmit` 零错误；`tests/plane-api.test.ts` 14 项 + `tests/plane-webhook.test.ts` 6 项全过；webhook 服务器端到端实测（无签名→403、错签名→403、正确签名→200 且事件正确传入 handler、GET→405）；`paseo plugin reload` 日志 "Plugin ready" 无报错（默认关闭，不启动服务器）。

**部署说明**：Plane webhook 要求公网可达 URL，不接受 localhost/私网地址。启用后需将插件 `webhookPort` 通过反向代理/隧道暴露为公网 HTTPS URL，并在 Plane Webhook 配置中填入该 URL 与 secret。无关联会话的 work item 变更会被静默忽略（不报错）。
