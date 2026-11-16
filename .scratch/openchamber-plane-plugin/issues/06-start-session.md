Status: ready-for-agent

# 06 发起会话：参数抽屉 + 两条发起路径 + 绑定

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## What to build

从一张卡直接开一个 OpenChamber 会话。点「发起会话」先开参数抽屉：项目、是否在全新 worktree 里跑（名称 + 基线分支）、模型、思考级别、智能体、补充提示词；下面实时预览最终会发出去的 prompt（任务编号 + 标题 + 描述 + 补充 + 收尾要求）。

发起路径按选择分两条（宿主 API 能力不对等，这条是硬约束）：

- 只改了补充提示词、用默认模型与智能体、不开 worktree → 走面板侧的 `startSession`（一次调用，顺带把这张卡挂成会话里的 chip）。
- 选了模型 / 思考级别 / 智能体，或勾了全新 worktree → 走 service 发起：需要 worktree 时先建好目录再作为目录传进去，否则直接按项目发起。

成功后给工作项追加 `oc-<sessionId>` 标签并把状态推到 In Progress；卡片上出现会话角标，点击能跳到那个会话。

## Acceptance criteria

- [ ] 抽屉默认值正确（项目=当前项目、思考级别=default、补充为空），字段齐全
- [ ] 勾「全新 worktree」才出现名称与基线分支；取消勾选后隐藏
- [ ] 补充提示词输入后，prompt 预览实时变化；预览里含编号、标题、描述与收尾要求
- [ ] 提交中按钮置灰，连点只发起一次
- [ ] 默认路径：断言发给宿主的 `startSession` 入参含项目、工作项标识与标题，且 `worktree` 未传
- [ ] 选了模型三件套：断言走 service，且 service 调用宿主时带上 `model` / `variant` / `agent`
- [ ] 勾 worktree：先建出目录（可指向临时 git 仓库验），再以该目录发起
- [ ] 成功后：工作项标签多了 `oc-<sessionId>`、状态变成 In Progress、卡片出现可点的会话角标
- [ ] 发起失败：抽屉不关、给出失败原因，不留半绑定状态（标签与状态最多只写成一个，并提示）

## Blocked by

- [05 详情](05-work-item-detail.md)
