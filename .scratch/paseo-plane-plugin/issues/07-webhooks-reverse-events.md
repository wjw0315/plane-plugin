# 07 — Webhooks 反向事件（可选）

**What to build:** 当 Plane 中 work item 状态被外部变更时，插件通过接收 Plane webhook 感知该变更，并触发对应 Paseo 会话的相应动作，实现任务到会话的反向事件驱动（非轮询）。

**Blocked by:** 05 — 会话生命周期同步

**Status:** ready-for-agent

- [ ] 插件能接收并解析 Plane webhook 中的 work item 状态变更事件
- [ ] 状态变更能映射到并触发对应会话动作
- [ ] webhook 签名校验或等价鉴权到位，拒绝非法请求
