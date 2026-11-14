Status: ready-for-agent

# Paseo Plane 插件 Spec

> 来源：`/to-spec` 流程，基于 2026-11-14 对 Plane（makeplane/plane，AGPL-3.0）API / 自托管 / 团队能力的调研与可行性结论。
> 平台决策：从 Mindwtr 更正为 Plane（团队管理是核心换平台理由）。

## Problem Statement

用户需要在 Paseo 内管理团队任务看板。此前的 Mindwtr 方案只能做单人个人任务，无法支撑团队管理（成员、角色、指派、工作流），与用户「团队管理」的核心诉求不匹配。Plane 自托管提供团队管理为核心能力（Workspace / Projects / Work items / 成员角色 / Teamspaces），但目前与 Paseo 之间没有集成：会话与团队任务彼此割裂，无法在 Paseo 内直接查看、操作 Plane 的团队工作项，也无法把 Paseo 会话与 Plane 任务双向关联。

用户想要一个 Paseo 插件，把 Plane 的团队任务看板接进 Paseo，并在会话与工作项之间建立双向同步。

## Solution

在 Paseo 中开发一个 **Plane 插件**，复用 better-paseo Tasks 看板的三贡献点模式（`addScreen` + `addSidebarHeaderItem` + `addCommandCenterItem`），数据层从 Mindwtr API 换为 Plane REST API（v2，`/api/v2/`，`X-Api-Key` 认证）。

- **看板**：读取目标 Plane 项目的 work item states（项目级可配置工作流），动态生成看板列；卡片渲染 work items。拖拽改列 = `PATCH` work item 的 `state`。
- **会话打通**：在 Paseo 会话生命周期钩子中创建/更新对应 Plane work item（标题=会话名，标签 `paseo` + 会话 id），实现会话→任务的正向同步；看板卡片点击按标签查会话 id 唤起对应 Paseo 会话，实现任务→会话的反向唤起。
- **反向事件（可选）**：利用 Plane Webhooks，work item 状态变更时通知插件，触发对应会话动作（Mindwtr 无此能力，是 Plane 的增量优势）。

分两阶段交付：阶段一搭看板骨架（读列表 + 拖拽改状态），阶段二加会话↔work item 双向同步。

## User Stories

1. 作为团队管理者，我想在 Paseo 侧边栏看到「Plane 任务看板」入口，以便不离开 Paseo 就能查看团队任务。
2. 作为团队成员，我想在 Paseo 看板中看到某个 Plane 项目的全部 work items，以便掌握团队当前工作分布。
3. 作为团队成员，我想让看板列自动反映目标项目的 states 配置（而非写死列名），以便适配不同项目的不同工作流。
4. 作为团队成员，我想在看板上拖拽一张卡片到另一列，以便更新该 work item 的状态（对应 Plane `PATCH state`）。
5. 作为团队成员，我想看到每张卡片的标题、指派人、优先级、状态等关键信息，以便快速判断任务状态。
6. 作为 Paseo 使用者，我想在发起一个 Paseo 会话时自动创建一个对应的 Plane work item（标题=会话名，初始 state=Backlog，标签含 `paseo` 与会话 id），以便会话与团队任务一一对应。
7. 作为 Paseo 使用者，我想在会话进行中把对应 work item 置为 In Progress，以便团队看到该会话正在推进。
8. 作为 Paseo 使用者，我想在会话结束时把对应 work item 置为 Done，以便团队知道该任务已完成。
9. 作为团队成员，我想点击看板卡片直接唤起对应的 Paseo 会话，以便从任务跳回当时的工作上下文。
10. 作为团队管理者，我想通过标签 `paseo` + 会话 id 反查并定位会话，以便维护会话与任务的对应关系。
11. 作为 Paseo 使用者，我想在插件配置中填入 Plane 自托管 base URL 与 API Key（`X-Api-Key`），以便插件能连上我的 Plane 实例。
12. 作为团队管理者，我想选择要展示的 Plane workspace / project，以便看板聚焦在目标项目范围。
13. 作为 Paseo 使用者，我想在插件配置中切换 Plane API 版本（默认 v2），以便适配 Plane 的接口演进。
14. 作为团队成员，我想在看板数据加载失败时看到明确的错误提示，以便排查 API Key / 网络 / 项目配置问题。
15. 作为团队管理者，我想在（可选）启用 Webhooks 后，当 work item 状态被外部变更时收到通知，以便触发对应 Paseo 会话动作。
16. 作为 Paseo 使用者，我想在会话被删除或异常结束时不留下孤立的 Plane work item，以便保持任务列表干净。
17. 作为团队成员，我想让插件复用 Paseo 现有的 RPC 机制（`client.rpc`）与插件贡献点，以便与其它 Paseo 插件保持一致的架构。
18. 作为团队管理者，我想限制对看板的写操作权限与 Plane 中的角色权限一致，以便避免越权修改他人工作项。

## Implementation Decisions

- **插件架构**：沿用 Paseo 插件标准结构，客户端（React 组件）+ 插件 server（生命周期钩子 + RPC 处理器）。客户端通过 `client.rpc` 调用 server，server 经 HTTP 调用 Plane REST API。**单一接缝为插件 RPC 边界**（client↔server），server 内部封装 Plane API 细节，客户端不直连 Plane。
- **贡献点**：复用 better-paseo 的三贡献点——`addScreen`（看板主界面）、`addSidebarHeaderItem`（侧边栏入口）、`addCommandCenterItem`（命令中心入口）。数据层从 Mindwtr 换为 Plane API，UI 组件原样复用。
- **Plane API 版本**：走 v2（`/api/v2/`）。v2 更规范（PATCH-only 写入、RFC 9457 错误模型、游标分页、稀疏字段），避免 v1 兼容包袱。认证用 `X-Api-Key`（个人访问令牌，等同所有者全权限）；如需细粒度可后续扩展 OAuth 2.0。
- **看板列来源**：动态读取目标项目的 states 列表生成列，不写死。拖拽改列映射为 `PATCH /api/v2/.../work-items/{id}` 改 `state`。
- **数据范围**：list work items / create work item / patch state 为核心封装；覆盖 work items / projects / states / labels / members 等所需端点。
- **会话↔work item 同步**：
  - 会话创建 → `POST` work item（标题=会话名，`state=Backlog`，标签 `paseo` + 会话 id）。
  - 会话进行中 → `PATCH` `state=In Progress`。
  - 会话结束 → `PATCH` `state=Done`。
  - 卡片点击 → 按标签 `paseo` + 会话 id 查会话 id → 唤起 Paseo 会话（插件 RPC）。
- **反向事件**：可选，Plane Webhooks 接收 work item 状态变更 → 触发对应会话动作。阶段二实现，阶段一不含。
- **配置**：插件配置项——Plane base URL、API Key、默认 workspace/project、API 版本（默认 v2）、（可选）webhook 开关。
- **跳过的端点**：Plane Pages 端点在公开 REST API 缺失（issue #9511/#8986），仅 UI 内部可用。本插件只做任务看板，不依赖 Pages，不受影响。
- **两阶段交付**：阶段一看板骨架（读列表 + 拖拽改状态，跑通核心数据流）；阶段二会话双向同步 + 点击跳会话 + 可选 Webhooks。

## Testing Decisions

- **测外部行为，不测实现细节**：验证看板能否正确渲染 states 与 work items、拖拽后 work item 状态是否真正变更、会话生命周期钩子是否按预期创建/更新 work item、卡片点击能否正确唤起会话。不测内部 HTTP 调用细节。
- **接口层测试**：插件 server 的 Plane API 封装层，用 mock HTTP 验证请求构造（URL、`X-Api-Key`、PATCH body 的 `state`）与响应解析，覆盖成功与错误（401/404/网络失败）路径。
- **客户端组件测试**：看板组件渲染（给定 states/work items 数据）、拖拽交互、配置表单。
- **集成测试**：在真实（或容器化）Plane 实例上，验证 list/create/patch 端点连通与端到端数据流。
- **会话同步测试**：模拟 Paseo 会话创建/进行/结束事件，断言对应 Plane work item 的 state 变化序列（Backlog→In Progress→Done）。
- **Prior art**：better-paseo Tasks 看板已有组件与 RPC 模式可作参照；Paseo 插件 RPC 与贡献点有既有测试范式可复用。

## Out of Scope

- Plane 原生 Board 视图的全部功能复刻（插件看板只做核心列+卡片+拖拽，不覆盖 Plane 原生看板的全部交互）。
- Pages / 文档类内容的集成（Plane Pages 端点公开 API 缺失，且本插件聚焦任务看板）。
- OAuth 2.0 细粒度 scope（首版用 `X-Api-Key`，OAuth 留作后续）。
- 跨多个 Plane workspace 的聚合看板（首版聚焦单 workspace 单 project）。
- Mindwtr 数据迁移（已决策放弃 Mindwtr，不做历史数据迁移）。
- Plane 自托管部署本身的运维（本 spec 只定义插件，不定义 Plane 多容器部署方案；部署为前置环境准备）。

## Further Notes

- **主要成本在自托管部署**：Plane 社区版需 Docker Compose 起多容器（PostgreSQL + Redis + RabbitMQ + API + Worker + Beat + Frontend + 反向代理），比 Mindwtr 单容器重。这是换取团队管理 / 工作流 / Webhooks 的代价，部署方案作为前置环境准备，不在本插件 spec 内。
- **v1 vs v2**：已决策走 v2，后续若 Plane v2 端点行为变化需跟进。
- **标签约定**：会话↔work item 的对应关系依赖标签 `paseo` + 会话 id，需保证标签创建与查询的一致性，避免孤立 work item。
- **发布**：本 spec 按本仓库 issue tracker 规则落地于 `.scratch/paseo-plane-plugin/spec.md`，顶部 `Status: ready-for-agent` 记录 triage 状态（见 `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`）。实现类工单后续在 `.scratch/paseo-plane-plugin/issues/` 下按 `01` 起编号单文件存放。
