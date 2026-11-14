# 04 — 拖拽改状态

**What to build:** 用户在看板上把一张卡片拖到另一列，对应 Plane work item 的 state 被更新为该列对应的状态，刷新后看板反映新状态，使看板成为可用的工作流操作界面。

**Blocked by:** 03 — 看板读取 UI

**Status:** ready-for-agent

- [ ] 拖拽卡片到目标列后，该 work item 在 Plane 中的 state 变为目标列对应状态
- [ ] 刷新看板后卡片出现在新列
- [ ] 拖拽失败（如网络/鉴权）时卡片状态不变并给出提示
