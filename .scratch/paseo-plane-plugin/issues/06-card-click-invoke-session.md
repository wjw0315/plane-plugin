# 06 — 卡片点击唤起会话

**What to build:** 用户点击看板上的 work item 卡片，插件按标签 `paseo` + 会话 id 反查到对应 Paseo 会话并直接唤起，无需手动查找，实现任务到会话的反向跳转。

**Blocked by:** 05 — 会话生命周期同步

**Status:** ready-for-agent

- [ ] 点击带会话标签的卡片能直接唤起对应 Paseo 会话
- [ ] 无可关联会话的卡片点击时给出明确提示，不崩溃
