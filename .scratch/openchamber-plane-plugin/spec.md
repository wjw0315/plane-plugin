Status: ready-for-agent

# OpenChamber Plane 扩展 Spec

> 来源：`/to-spec` 流程（2026-11-16），基于 Paseo 版 Plane 插件（[.scratch/paseo-plane-plugin/spec.md](../paseo-plane-plugin/spec.md)）、2026-11-16 对 Plane 0.23.1 实例的 API 实测，以及对 OpenChamber guest 扩展契约（`@openchamber/sdk` 2.7.x）的核对。
> 形态决策：把 Plane 看板做成 **OpenChamber guest 扩展**（新仓库），Paseo 版继续独立维护；两者共享 Plane API 兼容逻辑，不共享代码包。

## Problem Statement

Paseo 侧的 Plane 插件已能看板读写并把会话与工作项打通，但日常写代码、跑 agent 的主战场是 OpenChamber。在 OpenChamber 里想知道「这个项目还有哪些活、我这条会话对应哪张卡」只能切浏览器打开 Plane，或者让 agent 单独调 Plane MCP——人看不到图，卡也拖不动。

Plane MCP 解决的是 agent 的调用问题，人的可视化与手动流转在 OpenChamber 里是空白。

## Solution

做一个 OpenChamber guest 扩展（rail 面板 + 本地 service 进程）：

- **看板**：面板列出 workspace 下的项目，切项目后按该项目的 states 动态生成列，卡片渲染 work items；拖拽卡片改状态直接落到 Plane。
- **双视图可切换**（原型裁定 A + B）：**列式看板**（默认，横向滚列、拖拽改状态）与**分组列表**（单列纵向按状态分组、详情就地展开）；面板头部一个两段开关切换，选择持久化在宿主 storage，重开面板沿用上次。
- **本地 service 承接数据**：面板不直连 Plane，全部经 `host.serviceRequest` 打到扩展自己的 service 进程，service 负责认证、路径版本分支、错误归一化。
- **配置**：配置写在面板自己的设置表单里（地址、API Key、workspace、API 版本），service 存到自己的数据目录（`config.json`，600），面板只拿脱敏视图（`configured` / `baseUrl` / `workspace` / `hasKey`）。**不用 Settings → Integrations**：平台的 `contributes.integration` 要求 `token.apiOrigin` 必须是 https（实测 http 直接被 schema 拒），自托管 Plane 常跑在局域网 http 上，那张卡片填不进去。
- **任务 → 会话（可配置发起）**：详情里点「发起会话」开一个配置抽屉——项目、是否在全新 worktree 里跑（可命名 + 选基线分支）、模型、思考级别、智能体，外加一段补充提示词。prompt 由「编号 + 标题 + 描述 + 补充」拼成；起成功后打 `oc-<sessionId>` 标签、推到 In Progress。
- **结论回填（自动 + 人工兜底）**：订阅会话事件，`turn-finished` 拿到 agent 的最终答复就写进 Plane 评论；详情里同时保留「回填结论…」的可编辑草稿入口，自动那条失败或想改措辞时用。卡片留「✓ 结论」标记，按会话去重。
- **反向（二期）**：`onSessionLifecycle` 驱动卡片上的「待回填/进行中」标记，`/plane` 命令与会话菜单动作把两侧对上。

一期 = 看板读写 + 任务详情 + 发起会话 + 结论回填（可独立验收）；二期 = 会话事件联动、斜杠命令与消息菜单动作。

## User Stories

1. 作为团队成员，我想在 OpenChamber 右侧 rail 看到「Plane」面板，以便不离开编辑器就能看团队任务。
2. 作为团队成员，我想在面板顶部切换 Plane 项目，以便在多个项目之间聚焦。
3. 作为团队成员，我想让看板的列来自目标项目的 states 配置，以便适配不同项目的工作流，而不是写死列名。
4. 作为团队成员，我想看到每个状态列下对应的 work items，以便一眼看清当前分布。
5. 作为团队成员，我想在卡片上看到标题、序号、指派人、优先级与标签，以便快速判断能不能接。
6. 作为团队成员，我想把卡片拖到另一列来改状态，以便不必回浏览器操作。
7. 作为团队成员，我想在拖拽时看到目标列高亮与失败回滚，以便知道这次操作到底成没成。
8. 作为团队成员，我想在看板加载失败时看到明确原因（配置缺失 / Key 无效 / 路径不支持 / 网络不通），以便自己排查。
9. 作为团队成员，我想点刷新重新拉数据，以便别人在 Plane 里改了状态后同步过来。
10. 作为扩展使用者，我想在面板自己的设置表单里填 Plane 地址、API Key、workspace 与 API 版本，以便一次配置长期可用（局域网 http 实例用不了 Integrations 卡片）。
11. 作为扩展使用者，我想配置保存后立即生效、不必重启 OpenChamber，以便快速试错。
12. 作为扩展使用者，我想在配置不完整时面板给出引导而不是空白页，以便知道该去填什么。
13. 作为维护者，我想扩展 service 用环境变量拿端口与令牌、以 `Authorization: Bearer` 校验，以便和 OpenChamber 现有扩展**同一套契约**（`/health` 探活）。
14. 作为维护者，我想 Plane 客户端同时支持 `/api/v1`（`issues`、项目级标签）与 `/api/v2`（`work-items`、workspace 级标签），以便同一份代码适配 0.23 与 1.x 实例。
15. 作为团队成员，我想面板自动记住上次选的项目，以便每次打开回到同一视图。
16. 作为会话使用者（二期），我想在会话菜单里点一下就把当前会话建成 Plane work item，以便任务从对话里长出来。
17. 作为会话使用者（二期），我想会话开始/结束自动把对应 work item 推到 In Progress / Done，以便团队看到真实进度。
18. 作为会话使用者（二期），我想点击看板卡片直接跳到对应会话，以便从任务回到当时上下文。
19. 作为会话使用者（二期），我想用 `/plane` 斜杠命令列出/切换当前会话绑定的工作项，以便不离开输入框完成绑定。
20. 作为团队成员（二期），我想在卡片上看清它是否已绑定会话，以便区分人工建的任务与 agent 会话。
21. 作为维护者，我想扩展的写操作（建卡、改状态、建标签）有明确失败语义，以便看板不会静默吞掉失败。
22. 作为维护者，我想这套扩展在 VS Code / 移动端不加载（宿主不支持），文档里写清以免误报，以便减少无效支持。
23. 作为团队成员，我想看到 Plane 实例偶发抖动时的重试提示，而不是直接报错成红色故障，以便区分网络抖动与真实故障。
24. 作为团队成员，我想点一下卡片就在面板里看到这张卡的详情，以便不下钻到浏览器也能判断要不要接。
25. 作为团队成员，我想在详情里看到编号、优先级、指派人、标签、描述与关联会话，以便一次看全，不必回列表里拼信息。
26. 作为团队成员，我想在详情里直接切状态，以便看完就顺手推进，不需要先返回看板再拖一次。
27. 作为团队成员，我想从详情一键在 Plane 网页里打开这张卡，以便需要改描述或评论时跳到原生界面。
28. 作为团队成员，我想用返回按钮、Esc 或点空白处退出详情，以便不丢看板的位置与滚动。
29. 作为会话使用者（二期），我想在详情里点关联会话直接跳过去，以便从任务回到对话上下文。
30. 作为维护者，我想详情与看板共用同一套改状态路径，以便两处行为一致、只维护一份写入逻辑。
31. 作为团队成员，我想在任务详情里一键「发起会话」，以便从任务直接开工，不用把标题复制到输入框。
32. 作为团队成员，我想发起会话时自动把编号、标题、描述带进首条 prompt，以便 agent 一上来就有上下文。
33. 作为团队成员，我想会话创建后自动把任务推到 In Progress 并打上会话标签，以便团队看到这张卡有人在做。
34. 作为会话使用者，我想会话结束后把结论一键回填成任务评论，以便结论落回任务而不是留在对话里。
35. 作为会话使用者，我想回填前能看并改结论草稿，以便删掉过程噪音只留结论。
36. 作为团队成员，我想回填只追加评论、不改原描述，以便原始需求不被覆盖。
37. 作为团队成员，我想卡片与详情上有「✓ 结论」标记，以便一眼看出哪些卡已经有结论。
38. 作为团队成员，我想回填失败时草稿不丢并能重试，以便长文不用重写。
39. 作为团队成员，我想在 Plane 网页里能看到这条评论，以便不装扩展的同事也能读。
40. 作为维护者，我想回填由扩展 service 直连 Plane 评论接口，以便不依赖 agent 是否装了 MCP。
41. 作为会话使用者，我想在发起会话前选一个项目，以便这次会话开在我想要的那个仓库里。
42. 作为会话使用者，我想选择是否在全新 worktree 里跑，并能给 worktree 起名、选基线分支，以便不污染当前分支。
43. 作为会话使用者，我想选择模型（`provider/model`），以便重活交给强模型、小事交给便宜的。
44. 作为会话使用者，我想选择思考级别（variant），以便同一个模型按难度调推理深度。
45. 作为会话使用者，我想选择智能体（build / plan / 自定义），以便先规划再动手。
46. 作为会话使用者，我想在任务内容之外补一段提示词，以便交代约束、验收标准或不要碰的文件。
47. 作为会话使用者，我想在抽屉里看到最终会发出去的 prompt 原文，以便确认拼装没错。
48. 作为会话使用者，我想发完之后抽屉关掉、卡片上出现会话角标，以便确认这次发起成功。
49. 作为会话使用者，我想会话一跑完结论就自动出现在任务评论里，以便不用回面板手动贴。
50. 作为会话使用者，我想自动回填在设置里可关，以便过程噪音多的会话不污染任务。
51. 作为团队成员，我想看到自动回填那条评论标了「自动」与来源会话号，以便知道它是机器写的。
52. 作为会话使用者，我想自动回填失败时退回手动草稿并提示，以便结论不会丢。
53. 作为维护者，我想自动回填按「会话 + 轮次」去重，以便同一条结论不会写两遍。
54. 作为会话使用者，我想在超长答复被截断时看到提示，以便知道评论里的内容不完整。
55. 作为团队成员，我想在面板头部一键切换「列式看板」和「分组列表」，以便按当下心情或屏幕宽度选布局。
56. 作为团队成员，我想切换后的视图被记住，以便下次打开面板回到我惯用的那个。
57. 作为团队成员，我在列式看板里想看到全部状态列与拖拽，以便横向推进。
58. 作为团队成员，我在分组列表里想一屏纵向看完所有状态并就地展开详情，以便窄面板里不用左右滚。
59. 作为团队成员，我想两种视图读的是同一份数据（同一筛选、同一项目），以便切来切去不会丢卡或串项目。
60. 作为团队成员，我想两种视图里的改状态都是同一套行为（乐观更新 + 撤销），以便换个视图不用重新学。

## Implementation Decisions

**形态与仓库**

- 新仓库，OpenChamber guest 扩展：`openchamber.apiVersion: 1`，`package.json` 必须带 semver `version`，可选 `engines.openchamber`。
- 安装方式：设置 → 扩展 → 添加文件夹 / ZIP / Git；文件夹安装按原目录运行（`extensions.json` 记 `source: "path"`），ZIP/Git 安装复制到 OpenChamber 数据目录的 `extensions/<id>`。
- 与 Paseo 版的关系：共享「Plane API 兼容层」的判定规则，代码复制而非引包（两边宿主 API 完全不同）。

**贡献点（manifest）**

只声明实际要用的贡献点：

- `contributes.panel`：看板入口（id / name / icon / entry），rail 右侧面板，iframe 加载打包好的 `panel/index.html`。
- `contributes.service`：数据层进程（`service/main.js`）。
- `contributes.integration.settings`：Integrations 卡片上的配置字段（baseUrl / apiKey / workspace / defaultProject / apiVersion）。
- 二期加 `contributes.commands`（`/plane`）与 `contributes.actions`（会话菜单动作）。

契约形状（平台契约，非应用代码）：

```text
package.json
├── name / version
└── openchamber
    ├── apiVersion: 1
    ├── engines.openchamber (可选)
    └── contributes
        ├── panel      { id, name, icon, entry }
        ├── service    { entry }
        └── integration.settings [ { key, label, type, required? } ]
```

**面板（iframe）**

- 用 `@openchamber/sdk` 的 `connectHost()`：`onReady` / `onSettings` / `onDirectory` / `onSession`（二期）/ `serviceRequest` / `toast` / `openExternal`。
- iframe **不编译 TS、不加载 ESM**，面板必须打成单文件 IIFE 再引用。构建工具随仓库自选（esbuild 最省事）。
- 面板不持久化凭据：表单提交后由 service 落盘到自己的数据目录，面板只拿脱敏视图（`configured` / `baseUrl` / `workspace` / `hasKey`），拿不到 Key 本身。
- 看板状态机：`未配置 → 加载项目 → 加载列与卡片 → 拖拽中 → 回滚/成功 → 打开详情`；列与卡片的数据结构只保留渲染必需字段，避免把 Plane 原始响应透传到 UI。
- 「记住上次项目」用宿主 storage（`host.storage`），不落本地文件。

**双视图（A + B，原型裁定）**

- **A 列式看板**：横向滚动的状态列（列宽约 150px），卡片紧凑，拖拽改状态是主操作。适合面板较宽（≥420px）或需要横向推进多状态时。
- **B 分组列表**：单列纵向，按状态分组（`<details>` 可折叠），卡片下方给「移动到」下拉；详情**就地展开**在卡片内，再次点击同一张卡收起。窄面板（300–420px）里不用左右滚。
- 切换控件放面板头部：两段式按钮（列 / 列表），与项目选择器同一行；切换不重新拉数据（同一份内存数据换渲染），不重置滚动之外的筛选状态。
- 持久化：视图选择写宿主 storage（键形如 `plane.view`），打开面板优先读回；storage 不可用时退化为默认 A，不报错。
- 详情形态随视图：A 用覆盖式二级页，B 用就地展开。字段与动作同一套（状态、编号、优先级、指派、会话、结论、描述、在 Plane 打开、复制链接、回填），Esc 在两种形态都关闭。
- 淘汰：C（聚焦单列 + 底部抽屉）不进产品，只在原型里留作对比。

**任务详情（卡片点击后的交互）**

- 形态定稿：**A 视图用面板内覆盖式二级页**（同一面板宽度内左滑入，不是新窗口、不开浏览器、不弹宿主模态）；**B 视图就地展开**在卡片内，再点一次同一张卡收起。两者字段与动作完全一致。A 的覆盖页返回后看板位置与滚动不变（覆盖层叠加，不销毁列表）。
- 详情字段（一期）：标题、编号（`XLMSC-<sequence_id>`）、状态（可切换）、优先级、指派人、标签、描述、关联会话（只读展示，绑定属二期）。
- 详情动作：切状态、在 Plane 打开（`host.openExternal`，拼 `{baseUrl}/{workspace}/projects/{identifier}/issues/{sequence_id}`）、复制链接、返回。Escape、返回箭头、点空白遮罩均关闭；打开详情时把焦点移入覆盖层，关闭后焦点回到原卡片（键盘用户不丢位置）。
- 一期不做标题/描述/指派编辑：写操作只保留「改状态」与「建卡（二期）」，避免和 Plane 原生表单抢职责；需要编辑时走「在 Plane 打开」。
- 详情改状态复用同一路径：与拖拽共用 `/patch-state`，成功后同样是「乐观更新 + 5 秒撤销」；失败回滚并保留详情页不关。
- 详情数据来源：优先用列表已带字段直接渲染（秒开），同时发 `POST /work-item` 取最新单条（拿到最新描述与状态），返回后覆盖渲染；单条请求失败只提示「详情可能不是最新」，不阻断查看。

**任务 → 会话（参数与执行位置）**

- 参数面：项目（`projectId`）、worktree（是否新建 / 名称 / 基线分支）、模型（`provider/model`）、思考级别（`variant`）、智能体（`agent`）、补充提示词。
- **执行位置是这次调研的核心结论**：面板 iframe 的 `startSession` 只接受 `{ providerId, id, title, url, text?, projectId?, worktree?, navigation? }`——**没有 model / variant / agent**；service 侧的宿主调用 `sessions.start` 接受 `{ prompt, projectId? | directory?, title?, model?, variant?, agent? }`——**有这三项，但没有 worktree**。所以按用户的选择分两条路：
  - 选了模型 / 思考级别 / 智能体 → 由 **service** 调 `sessions.start` 发起（需 `contributes.sessionControl`，安装时授权）。
  - 勾了「全新 worktree」→ service 先 `git worktree add`（目录 `<repo>/.worktrees/oc-<seq>-<slug>`、分支 `oc/<seq>-<slug>`、基线取用户选择），再 `sessions.start({ directory })`；宿主不知道这次创建，所以命名必须可预期，侧栏靠目录自然聚合。
  - 默认模型 / 默认智能体 / 不开 worktree → 走 iframe `startSession`，一次调用顺带把工作项挂成 chip（`providerId: "plane"`、`id`、`title`、`url`、`text`）。
- prompt 拼装：`XLMSC-<sequence_id> <标题>` + 空行 + 描述 + 空行 + 补充提示词（为空则省略）+ 空行 + 『完成后总结：改了什么、怎么验证、遗留什么』。抽屉里展示并允许编辑最终正文。
- 发起成功后 `PATCH issues/{id}` 追加标签 `oc-<sessionId>` 并推到 In Progress（可在设置关）。标签是重启后唯一的持久映射，写失败不阻断会话本身。

**结论回填（自动 + 人工兜底）**

- 自动机制：`contributes.sessionEvents: { events: ["turn-finished"], content: true }`——宿主把每个 `turn-finished` 以 HTTP POST 打到 service 的 `/session-events`（跨项目推、无窗口也推），`content` 里是 `{ sessionTitle, reply, replyTruncated }`，`event.session.id` 是会话号，`event.linked` 还带 linked items。`content` 需要 `transcript` 授权，单条答复上限 64000 字符。
- 映射工作项：先用 `event.linked` 里 `provider: "plane"` 的那条 → 再查本地 `sessionId → workItem` 映射 → 最后回退标签反查。
- 写入：与手动回填同一条路径 `POST /api/v1/workspaces/{slug}/projects/{pid}/issues/{id}/comments/`，body `{"comment_html": …}`（本机实测 201）；评论首行标「（自动回填 · 来自会话 `ses_xxx`）」，`replyTruncated` 为真时尾部再加「答复被截断」。
- 去重：按 `(workItemId, sessionId, event.at)` 记已回填集合，重复投递直接回 `{ ok: true }` 不写。Plane 侧无唯一约束，去重必须在 service 做。
- 兜底：事件丢了用 `sessions.lastReply(sessionId)` 主动拉一次（需 `sessionControl.content`）；自动写失败退回手动草稿并提示，结论不丢。
- 默认只追加评论、**不改描述**（`PATCH description_html` 实测 200 可用，但会覆盖人工维护的需求文本）。设置里「自动回填」默认开，关掉后只走详情的手动草稿。
- 一期写答复全文；「用 Small Model 压成三段摘要」放二期（`host.generate`，需 `model` 能力）。

**候选清单从哪来**

- SDK 没有「列出模型 / 智能体 / 变体」的接口（`SessionSnapshot` 只回读当前会话的 `model` / `agent`）。一期：设置里给三份候选（预置本机常用项 + 允许自由输入）；service 启动时尝试读 `~/.config/opencode/opencode.json` 的 provider 段生成模型候选初值（需 `filesystem` 授权，读不到就用设置里手填的）。思考级别固定给 `default / low / medium / high` 四档 + 自由输入。

**能力清单（安装时一次授权）**：`service`、`network`（service 出网到 Plane，随 `contributes.integration`）、`sessionControl` + `sessionControl.content`（service 发起会话、拉最后答复）、`transcript`（`sessionEvents.content`）、`sessions` + `prompt`（默认走 iframe `startSession` 时用）、`filesystem`（读 opencode 配置生成模型候选，可选）、`model`（二期摘要）、`links`（`XLMSC-24` 变可点 chip，可选）。

**service（本地进程）**

- 契约与现有扩展一致：读 `OPENCHAMBER_SERVICE_PORT` 与 `OPENCHAMBER_SERVICE_TOKEN`，请求需 `Authorization: Bearer <token>`，提供 `/health`。
- 路由（一期）：

| 路由 | 方法 | 入参 | 出参 |
| --- | --- | --- | --- |
| `/health` | GET | — | `{ ok: true }` |
| `/config` | GET | — | `{ config: { configured, baseUrl, workspace, apiVersion, hasKey } }`（脱敏，不含 Key） |
| `/config` | POST | `{ baseUrl, apiKey, workspace, apiVersion }` | `{ config }`（允许分步填，缺字段只在调 Plane 时才报） |
| `/projects` | POST | — | `{ projects: [{ id, name, identifier }] }`（配置取自 service 自己存的那份） |
| `/states` | POST | `{ config, projectId }` | `{ states: [{ id, name, color, order }] }` |
| `/work-items` | POST | `{ config, projectId, stateId? }` | `{ items: [{ id, identifier, name, stateId, priority, assignees, labels }] }` |
| `/work-item` | POST | `{ config, projectId, workItemId }` | `{ item, description }`（详情覆盖层用，取最新单条） |
| `/patch-state` | POST | `{ config, projectId, workItemId, stateId }` | `{ item }` |
| `/comment` | POST | `{ config, projectId, workItemId, body, sessionId? }` | `{ commentId, createdAt }`（结论回填，追加评论） |
| `/session-start` | POST | `{ config?, projectId?, directory?, worktree?: { name, baseBranch }, model?, variant?, agent?, prompt, workItemId, sessionId? }` | `{ sessionId, directory, worktreeCreated? }`（service 代面板调 `sessions.start`，并在需要时先建 worktree） |
| `/session-events` | POST | `GuestSessionEventRequest`（宿主直投，非面板调用） | `{ ok: true }` / `{ ok: false, error }`（`turn-finished` 触发自动回填） |
| `/labels` | POST | `{ config, projectId? }` | `{ labels: [{ id, name }] }` |

- 二期加 `/session-link`（`{ config, projectId, sessionId, title, phase }`）与 `/resolve-session`。
- service 无状态：配置随请求进，不写盘、不缓存凭据（重启即忘）。
- 错误归一化：HTTP 200 之外一律返回 `{ error: { code, message } }`，码表 `CONFIG_MISSING` / `AUTH_FAILED` / `NOT_FOUND` / `UNSUPPORTED_PATH` / `NETWORK` / `RATE_LIMITED`；面板按码给不同文案与「重试」入口。
- 抖动处理：`NETWORK`/`RATE_LIMITED` 由 service 内部重试一次（短退避），仍失败才把错误抛给面板。

**Plane API 兼容层（核心决定）**

- 版本分支：`apiVersion: v1` → 前缀 `/api/v1` + 工作项段 `issues` + 标签**项目级**（`/projects/{id}/labels/`）；`apiVersion: v2` → `/api/v2` + `work-items` + 标签**workspace 级**。默认 `v2`，本机 0.23.1 实例填 `v1`。
- 认证统一 `X-Api-Key`（workspace 级 API Token）；不使用会话 cookie（那是浏览器专用，`/api/**` 只认 cookie，`/api/v1/**` 只认 key）。
- 只读能力直接用；写入只有三处：改状态、建工作项（二期）、建标签（二期）。
- 分页：v1 是游标分页（`{ results, count, total_pages }`），一期按首页取用，超过单页上限时面板提示「数据被截断」而不静默少卡。
- 明确不支持：Plane Pages、成员/角色管理、webhook 反向事件。

**二期：会话打通**

- 标签约定 `oc-<sessionId>`，语义与 Paseo 版的 `paseo-<agentId>` 平行但不复用命名，避免两个宿主互相干扰。
- 会话 → 工作项：动作/命令触发 `POST /session-link`，service 做「按标签查已有 → 没有就建（state=Backlog）→ 有就改名/改状态」的幂等收敛。
- 工作项 → 会话：卡片上的会话标记点击 → 面板调 host API 打开对应会话。
- `onSession` 事件只用于刷新卡片上的会话标记与「当前会话」高亮，不在后台偷偷建卡（建卡必须显式触发，防止对话一多就刷出一堆空卡）。

## Testing Decisions

三个接缝，按「越靠外越好」排序，均不碰 iframe 的 DOM 细节。

**接缝 A：Plane 客户端模块（最内，纯函数级）**

- 测外部行为：给定配置与入参，断言**发出去的请求**（方法、URL 形状、`X-Api-Key`、body）与**错误到错误码的映射**（401→`AUTH_FAILED`、404→`NOT_FOUND`、fetch 抛错→`NETWORK`）。
- 覆盖 v1/v2 分支的差异点：前缀、`issues`/`work-items`、标签项目级/workspace 级、v1 未给 projectId 时回退第一个项目。
- 手法：注入 fake fetch，不真连 Plane。先例：本仓库 `tests/plane-api.test.ts` 就是这个形态（同构断言，换成扩展的目录与命名）。

**接缝 B：service HTTP 路由（主接缝）**

- 真起 `service/main.js`（注入 `OPENCHAMBER_SERVICE_PORT` + `OPENCHAMBER_SERVICE_TOKEN`），用 HTTP 打路由断言 JSON；凭据用**假的 Plane 服务**（同一进程内的 http server）冒充，断言 service 打到假 Plane 的路径与头。
- 覆盖：缺 token → 401；`/health` → `{ok:true}`；未配置列项目 → `CONFIG_MISSING`（带 `missing`）；`POST /config` 后 `GET /config` 里**没有** API Key；地址带 `/api` 后缀 → `BAD_CONFIG`；Plane 返回 401 → `AUTH_FAILED`（HTTP 401）；Plane 500 → `NETWORK`（HTTP 502）且**只重试一次**（假 Plane 计数 = 2）；`/patch-state` 成功后回传规范化 item；`/comment` 打到 `…/comments/` 且 body 形状正确、Plane 4xx 映射成对应错误码。
- **自动回填在这条接缝上测最好**：直接 POST 一份 `turn-finished` 的 `GuestSessionEventRequest` 到 `/session-events`（`content.reply` 有内容、`event.linked` 带 `provider:"plane"`），断言 service 向假 Plane 发了一条评论、`comment_html` 里含答复正文与来源会话号；重复投递同一 `event.at` → 第二次不再写、仍回 `{ok:true}`；`replyTruncated: true` → 评论尾部带截断提示；假 Plane 返 500 → 回 `{ok:false}` 且不抛。
- service 侧发起会话要断言 `sessions.start` 的入参：注入假 host 调用层，检查 `{model, variant, agent, prompt, directory|projectId}` 与用户选择一致；勾「新 worktree」时断言先有 `git worktree add`（可用临时 git 仓库替身）再带 `directory`（该目录正是新建的 worktree 路径）。
- 先例：OpenChamber 现有扩展（openspec-board）就是「`node service/main.js` + `curl /health` + `POST /changes`」验收，本仓库 `mcp/` 的 stdio 自检脚本是同一种「把接缝跑起来再断言」的做法。

**接缝 C：iframe 侧 host API 适配层**

- 把 `connectHost()` 换成注入的假 bridge（对象：`serviceRequest` / `onSettings` / `onSession` / `openSession` / `openExternal` / `toast` / `storage`），断言：设置变更后下一次请求带新 config；`onSession` 事件只触发卡片标记刷新而不发建卡请求；卡片点击调 `openSession` 的参数正确。
- 详情交互也在这一层测：点卡片 → 覆盖层出现、列表节点未被卸载（返回后滚动位置不变）；详情里切状态只发一次 `/patch-state`（不重复发列表请求）；Esc 与返回箭头都关闭详情且焦点回到原卡片；「在 Plane 打开」→ `openExternal` 收到拼好的 URL；单条详情请求失败 → 出「可能不是最新」提示但仍渲染列表数据。
- 双视图在这一层测：点「列表」→ 渲染出分组列表且不再有横向滚动容器；再点「列」切回，卡片数量与状态归属不变（同一份数据换渲染，不重新拉）；点同一张卡两次在 B 视图里展开又收起；切换后断言 `storage` 写入 `plane.view=B`，重新初始化时读到 B 直接以列表启动；storage 抛错时退回 A 且不冒泡。
- 发起会话的抽屉在这一层测：默认值（项目=当前项目、模型/智能体=设置默认、思考级别=`default`、补充为空）；打开「全新 worktree」才出现名称与基线分支输入；prompt 预览随补充提示词实时变化；提交中按钮置灰、重复点击只发一次；选了三件套或 worktree 时走 `/session-start`（service），否则调 `host.startSession`——两条路的判定逻辑要分别断言。
- 自动回填不在这层测（走接缝 B 的事件投递），这里只测「service 用 `panels.emit` 广播回填完成 → 面板刷新该卡片的 ✓ 标识」，以及 `replyTruncated` 时详情里出现「答复不完整」提示。
- 这条接缝只在二期真正吃重（一期只有 settings/directory 与详情动作），一期先立骨架。

**好测试的判据**

- 只断言跨边界的东西：HTTP 请求与响应、发给 host 的调用参数。不断言选中器、类名、渲染顺序；UI 视觉走人工验收清单。
- 每个错误码至少一条用例，避免「失败也算通过」的静默。
- 不 mock Plane 客户端内部函数（那是接缝 A 的职责），接缝 B 里只假 Plane 服务本身。

## Out of Scope

- Plane Pages / Wiki 与成员、角色、权限管理。
- Webhook 反向事件（Plane 状态被外部改动后推送通知）。
- 多 workspace 同时展示（一次只对一个 workspace）。
- 离线缓存与本地镜像（无网就看板报错）。
- VS Code 与移动端（OpenChamber 宿主不加载扩展）。
- 与 Paseo 版的会话互通（两套标签约定并存，不互相搬运）。
- 发版与分发（ZIP 打包、Git 安装脚本另议）。

## Further Notes

- 本机 Plane 实例实测（2026-11-16）：`0.23.1`，只暴露 `/api/v1/`（`X-Api-Key`），**无 `/api/v2/`**；工作项路径是 `issues`；标签项目级；workspace slug `g2`；项目 `xlm-scrm`（`XLMSC`）；5 个状态。天然是接缝 A/B 的回归样本。
- 同一实例的 agent 通道已经存在：opencode 的 `plane` MCP 已接好（8 个工具）。扩展与 MCP 并存——MCP 给 agent 用，扩展给人看板与拖拽，两者共用一份 API Token。
- 已知抖动：该实例偶发 `fetch failed` / 502，所以重试语义写进了契约而不是留给 UI。
- 面板里不放「建卡」入口的一期原因：一期只做读写看板，建卡属于二期会话打通的一部分，避免一期出现两个建卡口子（命令 + 按钮）语义不一致。
- 若将来 Plane 升到 1.x，`apiVersion` 切 `v2` 即可回归，无需改面板；这是把版本差异关在 service 里的直接收益。
- 已实测的 Plane 写入路径（2026-11-16，本机 0.23.1）：`POST …/issues/{id}/comments/` → 201；`GET …/comments/` → 200 游标分页；`PATCH …/issues/{id}/` 的 `description_html` → 200；`PATCH …/issues/{id}/` 的 `labels:[uuid]` → 200 并回传新数组。回填与打标签两条链路都已在本机跑通。
- SDK 事实（`@openchamber/sdk@2.7.2` 类型定义核对，2026-11-16）：面板侧 `HostClient.startSession` 有 `projectId` / `worktree`（`{kind:'new',name?,baseBranch?}`）/ `navigation`，**没有 model / variant / agent**；service 侧 `sessions.start` 有 `model` / `variant` / `agent`，**没有 worktree**（只有 `projectId` 或 `directory`）。所以「模型/思考级别/智能体」必须由 service 发起，「新建 worktree」要么由 service 自己 `git worktree add` 后传 `directory`，要么退回 iframe `startSession`（放弃这三个选择）。这是本 spec 里唯一需要两条发起路径并存的原因。
- 自动回填的可行性已核实：`contributes.sessionEvents.content` 的 `turn-finished` 直接携带 agent 这一轮的最终答复（上限 64000 字符，`replyTruncated` 标记截断），宿主跨项目、无窗口也会推；另有 `sessions.lastReply(sessionId)` 可主动拉。两者都需 `transcript` / `sessionControl.content` 授权，`sessions.start` 则需 `sessionControl`。
- 仍然没有的能力：枚举模型 / 智能体 / 变体（无 `listModels` 之类接口，`SessionSnapshot` 只回读当前会话的 `model` / `agent`）；给已存在的会话换模型。所以候选清单只能来自设置或读 opencode 配置。
- MCP 缺口：现有 `plane` MCP 的 8 个工具里没有评论工具，agent 自助回填这条路要先给 MCP 加 `add_comment`（`POST …/comments/`）。扩展自身的回填写评论不经过 MCP。
- 布局裁定（2026-11-16）：**A 列式看板 + B 分组列表，两视图可切换**，C（聚焦单列）淘汰。原型 `.scratch/openchamber-plane-plugin/prototype/panel-prototype.html` 已按裁定实现：面板头部「列 / 列表」两段开关、选择写 `localStorage`（产品里换 `host.storage`）、B 视图就地展开再点收起、两视图共用同一份数据与同一套改状态行为；`?variant=` 仍可强制指定，C 只在原型里留作对比。整条链路（看板 → 详情 → 发起会话抽屉 → 绑定 → 回填 / 自动回填标记）都在这个文件里，会话与评论是模拟，不真调宿主。
- 原型已在 OpenChamber 内置浏览器里实测（起本地 http 服务打开）：5 列 11 卡、A/B 切换、B 就地展开与收起、拖拽把 XLMSC-31 移到 In Progress、刷新后记住 B、控制台 0 错误。踩过一个坑：新增的思考级别数组曾与变体列表同名（`VARIANTS`），重名覆盖会让 `render()` 抛错、整个面板白屏；常量取名要避开渲染状态。
