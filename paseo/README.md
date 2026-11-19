# plane-plugin（Paseo 插件）

在 [Paseo](https://paseo.sh) 中查看和管理自托管 [Plane](https://plane.so) 团队任务看板：
动态列、拖拽改状态、Paseo 会话与 Plane 工作项双向同步。

它在 `plane-plugin` 仓库的 `paseo/` 子目录里，和规格、切片同一个仓库：

- 规格：`.scratch/` 下的 plane 插件规格
- 切片：`.scratch/openchamber-plane-plugin/issues/` 之外的 plane 插件切片

> 为什么是子目录而不是独立仓库：spec / issues 在这里，代码隔一个仓库每次都要跳。
> 代价是**只能用「添加文件夹」安装**——装的时候选 `plane-plugin/paseo`（不是仓库根）。
> 仓库根现在是宿主目录，放三个子项目（`paseo/`、`openchamber/`、`mcp/`）和文档。

## 功能

- **任务看板**：顶部切换 Plane 项目，下方按 Plane 状态渲染动态列，拖拽卡片即可改状态（`patch-state`）。
- **配置管理**：内置设置页（host 级），填写自托管 Plane 地址、API Key、workspace，走 Plane v2 API。
- **会话 → 工作项同步**：带 `plane:project` 标签的会话在生命周期内自动创建并流转对应工作项：

  | 会话事件 | 工作项状态 |
  | --- | --- |
  | `agent.created` | Backlog（标题取会话名，打 `paseo-<agentId>` 标签） |
  | `agent.turn_started` | In Progress |
  | `agent.closed` / `agent.archived` | Done |

- **工作项 → 会话（webhook，可选）**：开启后插件启动本地 HTTP 服务器，接收 Plane
  `workitem.*` 事件，HMAC-SHA256 校验签名后反查关联会话并推送状态变更通知。

## 目录结构

```text
paseo/
  index.server.ts          插件 server 入口：注册配置、RPC、会话同步钩子、webhook
  index.client.tsx         插件 client 入口，装配各贡献点
  paseo-plugin.json        插件 manifest（id / 要求版本）
  server/
    plane-api.ts           Plane v2 REST API 客户端（X-Api-Key 认证、PlaneApiError）
    plane-webhook.ts       Webhook 签名校验与 HTTP 服务器
  client/
    plane-screen.tsx       看板屏幕（数据装配 + 状态编排，具体视图见 client/plane/）
    plane/                 看板页面组件（按设计稿拆分）
      tokens.ts            尺寸 / 颜色 token（设计稿 §2）
      types.ts             看板数据类型
      labels.ts            标签解析（会话 id 提取、uuid 标签过滤）
      header.tsx           顶栏（状态点 / 视图段控件 / 项目 / 刷新 / 设置）
      board-view.tsx       列视图（横向列 + 拖拽改状态）
      list-view.tsx        列表视图（分组折叠 + 「移动到」状态 pill）
      card.tsx             工作项卡片
      chips.tsx            优先级 / 标签 / 头像 / 会话 chip
      toast.tsx            底部 toast（成功带撤销 / 失败提示）
      prototype-preview.html 设计稿单文件预览原型（零依赖 mock，非生产代码）
    plane-sidebar-entry.tsx 侧边栏头部入口
    plane-contribute.tsx   装配 screen / sidebar / command center / settings 四个贡献点
    plane-settings-page.tsx 配置设置页
  docs/
    paseo-插件页面-设计稿.md 看板页面设计稿 v1.0（骨架 / token / 组件规格 / 交互清单）
  shared/
    plane-config.ts        配置字段的纯定义（zod schema + PlaneConfig 类型）
    plane-settings.ts      Paseo 设置项注册（defineSettings，包装 plane-config）
    plane-rpc.ts           RPC 契约
    plane-ids.ts           屏幕 id 等常量
  tests/                   API 与 webhook 的单元测试
```

## 配置

在 Paseo 设置页「Plane」中填写：

| 字段 | 说明 |
| --- | --- |
| `baseUrl` | 自托管 Plane 地址，如 `http://plane.example.com` |
| `apiKey` | Plane API Key（`X-Api-Key` 认证） |
| `workspace` | 目标 workspace 标识 |
| `apiVersion` | 保留字段，当前实现固定走 Plane v2 API |
| `webhookEnabled` | 是否启用反向 webhook |
| `webhookSecret` | Webhook 签名密钥（HMAC-SHA256，hex） |
| `webhookPort` | Webhook 监听端口，默认 `8788` |

配置由 daemon 通过 `server.registerSettings` 持久化，客户端经 `settingsRpc` 读写；
各字段独立降级到默认值，单个非法值不会使整条配置失效。

## 同步机制

- **目标项目来自会话标签**：会话打上 `plane:project=<项目 uuid>` 标签后，其生命周期内的所有状态变更才会同步；无标签的会话不创建工作项，避免产生孤立项。
- 同步状态（`agentId → { projectId, workItemId, phase }`）保存在 server 内存中，插件重载后重置，重载后以工作项标签 `paseo-<agentId>` 反查会话。
- 会话 → 工作项的流转是幂等的：目标阶段与当前一致时跳过。

## 开发

```bash
cd paseo        # 仓库根只是宿主目录，两套插件依赖各装各的
npm install
npm run typecheck
npm test
```

要求 Paseo `>= 0.14.0`。`tests/` 下是 API 与 webhook 的断言脚本，用 `tsx` 直接跑，不依赖测试运行器。

仓库根还有两个互不相干的兄弟目录：

- `../openchamber/` —— OpenChamber guest 扩展，见 [openchamber/README.md](../openchamber/README.md)
- `../mcp/` —— Plane MCP server（宿主无关），复用本目录的 `server/plane-api.ts`，见 [mcp/README.md](../mcp/README.md)
