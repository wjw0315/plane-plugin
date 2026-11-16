Status: ready-for-agent

# 03 A 列式看板：列/卡片 + 拖拽改状态 + 撤销

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## What to build

第一阶段真正能干活的面：按目标项目的 states 动态生成列（顺序跟 Plane 里一致，不写死列名），每列渲染该状态的卡片，卡片给标题、编号、优先级、指派人、标签点；把卡片拖到另一列就改状态——先把卡片挪过去并给「撤销」，失败再回滚，目标列拖入时高亮。

写入失败必须有明确结果，不能静默：卡片要弹回原列，并告诉用户是哪一类失败。

## Acceptance criteria

- [ ] 列来自项目的 states；在 Plane 里加/删一个状态后刷新，列跟着变，不改代码
- [ ] 卡片字段与 Plane 一致（编号形如 `XLMSC-24`，优先级与指派人不丢）
- [ ] 拖拽成功：卡片即时移动，出现带「撤销」的提示，5 秒内撤销能回到原列
- [ ] 拖拽失败（假 Plane 返回 500）：卡片回滚到原列并提示失败原因，不静默
- [ ] 拖到当前列不发起请求
- [ ] 单列 20 张卡时纵向滚动正常，列头不跟着滚走
- [ ] 面板在 380px 宽时仍可横向滚动看到全部列

## Blocked by

- [02 Plane 连接与配置](02-plane-connection-and-config.md)

## Comments

- **2026-11-16 已实现**：`openchamber/`（提交 `b260620`，版本 0.3.0）。
  - service：`POST /states`（按 `sequence` 排序）、`POST /work-items`（可按 stateId 过滤）、`POST /patch-state`；工作项归一化（v1 无 `identifier` 用 `sequence_id`，`labels` 统一成 id 数组）。
  - 面板：`board.js` 渲染状态列与卡片（编号 / 优先级 / 指派人）；拖拽落列走乐观更新，成功给 5 秒撤销，失败回滚并显示错误码。
  - 实测（假宿主 + 假 Plane）：三列正确渲染、拖第一张卡到 Todo 后列计数 2/0/1 → 1/1/1、`POST /patch-state` body 为 `{"projectId","workItemId","stateId"}`、Plane 侧收到 `{"state":"s2"}`；控制台 0 错误。
  - 顺手修：面板的 `serviceStatus()` 原来在宿主 ready 之前调用，永远显示「不可用」，已改到 ready 之后。
  - **未验收**：真机装上看板与拖拽（仍待 02 的配置表单在真机跑通）。
