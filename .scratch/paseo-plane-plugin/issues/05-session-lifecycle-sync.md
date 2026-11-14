# 05 — 会话生命周期同步（正向）

**What to build:** 当 Paseo 会话创建、进行、结束时，插件自动在目标 Plane 项目创建或更新对应 work item——标题为会话名，标签含 `paseo` 与会话 id，状态随会话推进流转（创建→Backlog，进行中→In Progress，结束→Done），使会话与团队任务一一对应。

**Blocked by:** 03 — 看板读取 UI

**Status:** ready-for-agent

- [ ] 会话创建时在目标项目生成 work item，标题=会话名，state=Backlog，标签含 paseo+会话id
- [ ] 会话进行中对应 work item 的 state 更新为 In Progress
- [ ] 会话结束时对应 work item 的 state 更新为 Done
- [ ] 异常结束或删除的会话按约定处理，不留孤立 work item
