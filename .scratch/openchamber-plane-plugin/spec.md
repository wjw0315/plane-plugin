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
- **本地 service 承接数据**：面板不直连 Plane，全部经 `host.serviceRequest` 打到扩展自己的 service 进程，service 负责认证、路径版本分支、错误归一化。
- **配置**：扩展的 Integrations 设置卡片填 Plane 地址、API Key、workspace、默认项目、API 版本；面板从宿主拿到配置后随请求下发，service 保持无状态。
- **会话打通（二期）**：会话菜单动作与 `/plane` 命令把当前会话和工作项对上（标签约定 `oc-<sessionId>`），会话事件驱动状态流转，卡片点击跳回会话。

分两期：一期看板读写（可独立验收）；二期会话同步、斜杠命令与消息菜单动作。

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
10. 作为扩展使用者，我想在 OpenChamber 设置里的 Integrations 卡片填 Plane 地址、API Key、workspace、默认项目与 API 版本，以便一次配置长期可用。
11. 作为扩展使用者，我想配置保存后立即生效，不必重启 OpenChamber，以便快速试错。
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
- 面板不持有 Plane 凭据的持久副本：配置来自 `onSettings`，随每次请求下发。
- 看板状态机：`未配置 → 加载项目 → 加载列与卡片 → 拖拽中 → 回滚/成功 → 打开详情`；列与卡片的数据结构只保留渲染必需字段，避免把 Plane 原始响应透传到 UI。
- 「记住上次项目」用宿主 storage（`host.storage`），不落本地文件。

**任务详情（卡片点击后的交互）**

- 形态定稿：**面板内覆盖式二级页**（在同一面板宽度内左滑入，不是新窗口、不开浏览器、不弹宿主模态）。理由：面板只有 300–560px，二级页能给出完整字段与足够点击面积，且返回后看板位置与滚动不变（详情以覆盖层叠加，不销毁列表）。
- 详情字段（一期）：标题、编号（`XLMSC-<sequence_id>`）、状态（可切换）、优先级、指派人、标签、描述、关联会话（只读展示，绑定属二期）。
- 详情动作：切状态、在 Plane 打开（`host.openExternal`，拼 `{baseUrl}/{workspace}/projects/{identifier}/issues/{sequence_id}`）、复制链接、返回。Escape、返回箭头、点空白遮罩均关闭；打开详情时把焦点移入覆盖层，关闭后焦点回到原卡片（键盘用户不丢位置）。
- 一期不做标题/描述/指派编辑：写操作只保留「改状态」与「建卡（二期）」，避免和 Plane 原生表单抢职责；需要编辑时走「在 Plane 打开」。
- 详情改状态复用同一路径：与拖拽共用 `/patch-state`，成功后同样是「乐观更新 + 5 秒撤销」；失败回滚并保留详情页不关。
- 详情数据来源：优先用列表已带字段直接渲染（秒开），同时发 `POST /work-item` 取最新单条（拿到最新描述与状态），返回后覆盖渲染；单条请求失败只提示「详情可能不是最新」，不阻断查看。

**service（本地进程）**

- 契约与现有扩展一致：读 `OPENCHAMBER_SERVICE_PORT` 与 `OPENCHAMBER_SERVICE_TOKEN`，请求需 `Authorization: Bearer <token>`，提供 `/health`。
- 路由（一期）：

| 路由 | 方法 | 入参 | 出参 |
| --- | --- | --- | --- |
| `/health` | GET | — | `{ ok: true }` |
| `/projects` | POST | `{ config }` | `{ projects: [{ id, name, identifier }] }` |
| `/states` | POST | `{ config, projectId }` | `{ states: [{ id, name, color, order }] }` |
| `/work-items` | POST | `{ config, projectId, stateId? }` | `{ items: [{ id, identifier, name, stateId, priority, assignees, labels }] }` |
| `/work-item` | POST | `{ config, projectId, workItemId }` | `{ item, description }`（详情覆盖层用，取最新单条） |
| `/patch-state` | POST | `{ config, projectId, workItemId, stateId }` | `{ item }` |
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
- 覆盖：缺 token → 401；`/health` → `{ok:true}`；配置缺字段 → `CONFIG_MISSING`；Plane 返回 401 → `AUTH_FAILED`；`/patch-state` 成功后回传规范化 item；`NETWORK` 抖动重试一次的分支。
- 先例：OpenChamber 现有扩展（openspec-board）就是「`node service/main.js` + `curl /health` + `POST /changes`」验收，本仓库 `mcp/` 的 stdio 自检脚本是同一种「把接缝跑起来再断言」的做法。

**接缝 C：iframe 侧 host API 适配层**

- 把 `connectHost()` 换成注入的假 bridge（对象：`serviceRequest` / `onSettings` / `onSession` / `openSession` / `openExternal` / `toast` / `storage`），断言：设置变更后下一次请求带新 config；`onSession` 事件只触发卡片标记刷新而不发建卡请求；卡片点击调 `openSession` 的参数正确。
- 详情交互也在这一层测：点卡片 → 覆盖层出现、列表节点未被卸载（返回后滚动位置不变）；详情里切状态只发一次 `/patch-state`（不重复发列表请求）；Esc 与返回箭头都关闭详情且焦点回到原卡片；「在 Plane 打开」→ `openExternal` 收到拼好的 URL；单条详情请求失败 → 出「可能不是最新」提示但仍渲染列表数据。
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
- 布局原型（一次性，可丢弃）：`.scratch/openchamber-plane-plugin/prototype/panel-prototype.html`，`?variant=A|B|C` 或 ← → 切换，三档分别是「列式看板 + 覆盖详情」「分组列表 + 就地展开」「聚焦单列 + 底部抽屉」。看板形态未裁定；上面「覆盖式二级页」是详情形态的先行定稿（原型 A 档），B/C 两种替代形态留作对比，裁定后回填本节。
