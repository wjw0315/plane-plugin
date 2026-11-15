# Plane 任务看板插件（Paseo Plugin）

在 [Paseo](https://paseo.sh) 中查看和管理自托管 [Plane](https://plane.so) 团队任务看板：
动态列、拖拽改状态、Paseo 会话与 Plane 工作项双向同步。

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

```
index.server.ts          插件 server 入口：注册配置、RPC、会话同步钩子、webhook
index.client.tsx         插件 client 入口，装配各贡献点
server/
  plane-api.ts           Plane v2 REST API 客户端（X-Api-Key 认证、PlaneApiError）
  plane-webhook.ts       Webhook 签名校验与 HTTP 服务器
client/
  plane-screen.tsx       看板屏幕（项目切换、动态列、拖拽改状态）
  plane-sidebar-entry.tsx 侧边栏头部入口
  plane-contribute.tsx   装配 screen / sidebar / command center / settings 四个贡献点
  plane-settings-page.tsx 配置设置页
shared/                  server 与 client 共享的 schema、RPC 与配置定义
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
npm install
npm run typecheck
```

要求 Paseo `>= 0.14.0`。`tests/` 下有 API 与 webhook 的单元测试，当前仓库未配置测试运行器。
