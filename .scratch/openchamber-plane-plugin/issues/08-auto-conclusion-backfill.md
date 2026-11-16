Status: ready-for-agent

# 08 自动回填结论：订阅会话事件 + 去重 + 开关

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## What to build

会话一跑完，结论自己回到任务上，不用人去面板里贴。扩展声明订阅会话结束事件并附带内容，宿主会把每轮结束时 agent 的最终答复推给 service；service 把它写成对应工作项的评论（首行标「自动回填 · 来自会话 xxx」），写完广播给面板刷新标记。

要点：工作项优先取事件里挂着的关联项，取不到再查本地「会话 → 工作项」映射，最后回退标签反查；同一条结论只写一次；答复被截断时在评论尾部说明；写入失败退回手动草稿并提示；设置里给一个开关，默认开。

## Acceptance criteria

- [ ] 投递一条「会话结束」事件（带答复内容与关联工作项）→ 对应工作项出现一条评论，正文含答复与来源会话号
- [ ] 同一事件重复投递（同一时间戳）→ 不写第二条，仍回成功
- [ ] 答复被截断（标记为 truncated）→ 评论尾部出现「答复被截断」说明
- [ ] 关掉自动回填开关 → 事件仍被接收但不再写评论
- [ ] 写评论失败（假 Plane 500）→ 回 `{ ok: false }`，不抛异常；面板收到提示并出现可编辑的手动草稿
- [ ] 事件里没有关联工作项、本地也没有映射 → 放弃写并记录日志，不误写到别的卡
- [ ] 事件丢失时能用「拉最后一次答复」补写（可手动触发验证一次）

## Blocked by

- [07 手动回填](07-manual-conclusion-backfill.md)

## Comments

- **2026-11-16 已实现**：`openchamber/`（提交 `b1d0899`，版本 0.8.0）。
  - manifest：`contributes.sessionEvents: { events: ["turn-finished"], content: true }`（授权 `transcript`）。
  - service：`POST /session-events` 接宿主直投事件，`readSessionEventRequest` 校验信封；`turn-finished` → 按映射找工作项 → 把 `content.reply` 写成评论（首行标来源会话，`replyTruncated` 追加截断说明，超 4000 字符截断）；按 `(workItemId, sessionId, event.at)` 去重；设置里 `autoBackfill` 可关。
  - 映射：`/session-start` 与 `/bind-session` 都会把 `sessionId → { workItemId, projectId }` 记进 service 内存。
  - 假宿主 + 假 Plane 实测：投一条 turn-finished → 评论落地（含答复与来源会话号）；重复投递不重复写；截断标记出现；坏信封 → 400；`autoBackfill=false` → 跳过。
  - **未验收**：真机装上后实际会话的自动回填（事件要经宿主投递，需真机装好后跑一轮真实会话）。
