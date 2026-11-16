# openchamber-plane

Plane 任务看板的 **OpenChamber guest 扩展**。左侧 rail 一个面板，看板读写、从任务发起会话、把会话结论写回任务。

它在 `plane-plugin` 仓库的 `openchamber/` 子目录里，和规格、切片同一个仓库：

- 规格：`.scratch/openchamber-plane-plugin/spec.md`
- 切片：`.scratch/openchamber-plane-plugin/issues/01`–`09`
- 原型（一次性）：`.scratch/openchamber-plane-plugin/prototype/panel-prototype.html`

> 为什么是子目录而不是独立仓库：spec / issues 在这里，代码隔一个仓库每次都要跳。代价是**只能用「添加文件夹」安装**——OpenChamber 的 git / zip 安装读的是仓库根的 `openchamber` 块，而根 `package.json` 是 Paseo 插件清单。

## 现在到哪了

- **01 骨架**（完成）：面板能装出来、跟宿主握手、service 按契约应答 `/health`
- **02 连接与配置**（完成）：面板内配置表单 → 列项目 → 三种错误面 → 记住项目
- **03 列式看板**（完成）：按项目 states 生成列、卡片渲染、拖拽改状态（乐观更新 + 5 秒撤销 + 失败回滚）
- **04 双视图**（完成）：面板头部「列 / 列表」切换，选择记在宿主 storage（`plane.view`）；列表视图纵向分组 + 「移动到」下拉，切换不重拉数据
- **05 任务详情**（完成）：点卡片开详情（列视图=覆盖页、列表视图=就地展开），字段含状态/编号/优先级/指派/标签/会话/描述；详情里可切状态、在 Plane 打开、复制链接；Esc / 返回 / 收起关闭
- **06 发起会话**（完成）：详情里「发起会话」开参数抽屉（项目 / 全新 worktree / 模型 / 思考级别 / 智能体 / 补充提示词 + prompt 预览）；默认走宿主 `startSession`，选了三件套或 worktree 走 service `sessions.start`（可先 `git worktree add`）；成功后打 `oc-<sessionId>` 标签并推 In Progress
- **07 手动回填结论**（完成）：详情「回填结论…」开草稿抽屉，写入 `POST /comment`（纯文本转 HTML，首行标来源会话），成功后卡片与详情出现「✓ 结论」；失败保留草稿可重试；只追加评论不改描述
- **08 自动回填结论**（完成）：订阅 `turn-finished` 会话事件（transcript 授权），把 agent 最终答复自动写成 Plane 评论；按 (工作项, 会话, 事件时间) 去重；截断标注；设置里 `autoBackfill` 可关（默认开）
- **09 命令 / chip / 会话动作**（完成）：`/plane XLMSC-31` 回 chip、聊天里的编号点击开详情、会话菜单「Plane：挂到工作项」开绑定抽屉；卡片 ⌘ 角标点击跳会话
- **10 改配置 + 新建工作项**（完成）：底部「设置」开配置覆盖层（合并保存，Key 留空不变；含「自动回填结论」开关）；看板头部「＋」新建工作项（名称 + 目标状态），创建后自动刷新看板
- issue 10（移动端 opt-in / 体验打磨）：另一条并行线，见上方说明

## 安装

1. 设置 → 扩展 → 添加文件夹 → 选 **`plane-plugin/openchamber`**（不是仓库根）
2. 在权限对话框里允许**本地 service**（这一片的 service 只做 `/health`）
3. rail 出现 Plane 面板；底部显示「宿主 已连接」
4. 面板里填 4 个字段（地址 / API Key / workspace / API 版本）→ 保存并连接 → 看到项目列表

> **配置写在面板里，不用 Settings → Integrations。** 平台的 `contributes.integration` 要求 `token.apiOrigin` 是 **https**（实测 http 直接被 schema 拒），自托管 Plane 常常是局域网 http，填不进去。所以配置走面板表单，落在 service 的数据目录 `config.json`（600 权限，gitignore 之外），面板只拿脱敏视图（有没有 Key、地址、workspace），拿不到 Key 本身。

> 文件夹安装从原目录运行：改完代码 `npm run build`，再在面板里重载即可，不用重装。
> 换成 zip / git 安装时只发构建产物（`panel/main.js`、`service/main.cjs`），宿主不会编译。

> **手机上怎么看面板**：手机端要 manifest 显式写 `contributes.panel.mobile: true`，面板才会变成手机工作区抽屉里的一个 tab（没有这个键，手机上就是没有面板，open 模式的菜单动作也不出现）。本扩展已经开了。改完 manifest 要在宿主里**重新加载扩展**，手机端重连后才认。手机上默认给列表视图（看板拖拽是 HTML5 DnD，触控拖不动）；改状态走列表的「移动到」下拉或详情页里的状态按钮。

## 开发

```bash
cd openchamber        # 仓库根是 Paseo 插件，两套依赖互不相干
npm install
npm run build         # panel → IIFE，service → CJS
npm test              # manifest 能被宿主解析 + service 契约冒烟
```

根目录的 `npm run typecheck` 不受影响：`tsconfig` 只收 `.ts/.tsx`，这里是纯 JS，两套构建各走各的。

## 目录

| 路径 | 说明 |
| --- | --- |
| `panel/index.html` | 面板页，宿主加载它 |
| `panel/src/main.js` | 面板源码（ESM，用 `@openchamber/sdk`） |
| `panel/main.js` | 面板产物：esbuild 打的 IIFE，**要提交**（宿主不编译、iframe 不能加载 ESM） |
| `service/src/main.js` | service 源码（Node） |
| `service/main.cjs` | service 产物：esbuild 打的 CJS，**要提交**（`.js` 会被 `"type": "module"` 当成 ESM） |
| `test/smoke.mjs` | 不依赖 OpenChamber 的冒烟测试（含假 Plane） |
| `test/host-harness.html` | **假宿主**（不 import SDK，常量照抄，避免 30 多个模块偶尔加载卡住）：把面板放进 iframe、按 SDK 协议应答，用来在浏览器里手动点面板（`python3 -m http.server` 起在本目录，开 `/test/host-harness.html`，用面板上方两个按钮填值 + 点保存） |

## service 路由

| 路由 | 说明 |
| --- | --- |
| `GET /health` | 就绪探针，宿主轮询到 200 才算 ready |
| `GET /config` | 脱敏配置视图（`configured` / `baseUrl` / `workspace` / `apiVersion` / `hasKey`） |
| `POST /config` | 保存配置；允许分步填，只在真正调 Plane 时要求完整 |
| `POST /projects` | 用已存配置列项目（v1/v2 分支在这一层） |
| `POST /states` | 列项目的状态（看板列，按 sequence 排序） |
| `POST /work-items` | 列工作项（可按 `stateId` 过滤；v1 无 identifier 时用 `sequence_id`） |
| `POST /work-item` | 取单条工作项 + 描述文本（详情用；HTML 转纯文本） |
| `POST /patch-state` | 改工作项状态（拖拽落列 / 详情里切） |
| `POST /create-work-item` | 新建工作项（名称 + 目标状态，走 Plane 建卡接口） |
| `POST /comment` | 结论回填：纯文本 → 评论 HTML（分段 + 来源会话），追加到工作项 |
| `POST /session-start` | 由 service 发起会话（可指定 model/variant/agent；需要时先建 worktree） |
| `POST /bind-session` | 给工作项追加 `oc-<sessionId>` 标签（可顺带推状态） |
| `POST /comment` | 结论回填：纯文本 → 评论 HTML（分段 + 来源会话），追加到工作项 |

错误码：`CONFIG_MISSING`(400) / `BAD_CONFIG`(400) / `AUTH_FAILED`(401) / `NOT_FOUND`(404) / `RATE_LIMITED`(429) / `NETWORK`(502)。`NETWORK` 与 `RATE_LIMITED` 在 service 内重试一次。

## 会话相关的两条路径

- **默认**（不改模型/思考级别/智能体、不开 worktree）：面板调宿主 `startSession`，一次调用顺带把工作项挂成会话里的 chip。
- **要指定模型三件套或新 worktree**：面板打 service 的 `/session-start`，service 用宿主 `sessions.start`（它能指定 model/variant/agent），需要 worktree 时先 `git worktree add <repo>/.worktrees/<name>` 再把这个目录传过去——宿主的 `sessions.start` 没有 worktree 参数。

## 契约要点

- 面板拿不到 service token，也不直连端口；一切经宿主代理（`serviceRequest`）。
- service 只监听 `127.0.0.1`，端口与令牌来自 `OPENCHAMBER_SERVICE_PORT` / `OPENCHAMBER_SERVICE_TOKEN`。
- **每个请求（含 `/health`）都要带** `Authorization: Bearer <token>`；宿主轮询 `/health` 到 200 才把状态标成 ready。
- service 不继承宿主环境（只有 PATH/HOME/temp/locale）；要落盘就写 `OPENCHAMBER_SERVICE_DATA_DIR`。
- 扩展在 OpenChamber 桌面端与 Web 端加载；**VS Code 不加载**。移动端（手机 App / 移动版 Web）需要 manifest 里 `contributes.panel.mobile: true` 显式 opt-in，本扩展已开（见 [issue 10](../../.scratch/openchamber-plane-plugin/issues/10-mobile-panel-optin.md)）。

## 已知坑

- `service/main.js` 会被 `"type": "module"` 当 ESM，而 esbuild 产出的是 CJS → 必须用 `.cjs` 后缀，否则宿主拉起即 `require is not defined`。
- manifest 里 `contributes.panel.id` 会被顶层 `id` 覆盖（SDK 解析器行为），两者写成同一个值，免得后人读懵。
- `contributes.integration` 只接受 **https** 的 `token.apiOrigin`，局域网 http 的 Plane 用不了那张卡片（见上面安装说明）。
- `esbuild` 要固定版本：0.25 与 0.28 打出来的产物差一行 `"use strict"`，不锁会让产物在两次安装之间来回变。
