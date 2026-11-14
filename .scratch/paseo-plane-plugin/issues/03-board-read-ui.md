# 03 — 看板读取 UI

**What to build:** 用户打开看板屏幕，能看到目标项目的工作流列（列名取自该项目的 states，动态生成）与各列下的 work item 卡片（含标题、指派人、优先级、状态等关键信息）；数据经客户端 RPC 调用 server、再由 server 调 Plane 获取。

**Blocked by:** 02 — Plane API server 封装层

**Status:** ready-for-agent

- [ ] 看板列自动反映目标项目的 states 配置，不写死列名
- [ ] 每张卡片展示标题、指派人、优先级、状态等关键信息
- [ ] 切换目标 project 后看板重新拉取并渲染对应数据
- [ ] 数据加载失败时看板显示明确错误提示
