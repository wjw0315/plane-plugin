# Plane MCP Server

把自托管 [Plane](https://plane.so) v2 REST API 封装为 MCP server，供 codeg 等 MCP 客户端直接调用，无需打开 Plane 平台。

复用 `../paseo/server/plane-api.ts` 的 API 客户端，零重复逻辑；配置类型取自
`../paseo/shared/plane-config.ts`（纯定义，不依赖 Paseo SDK）。

> 本目录是**宿主无关**的独立小包，跟 Paseo 插件（`../paseo/`）、OpenChamber 扩展（`../openchamber/`）
> 各自一套依赖，只共用 Plane API 客户端源码。

## 工具

| 工具 | 说明 |
| --- | --- |
| `list_projects` | 列出 workspace 下所有项目 |
| `list_states` | 列出项目下所有状态 |
| `list_work_items` | 列出项目下工作项，可按状态过滤 |
| `get_work_item` | 获取单个工作项详情 |
| `patch_state` | 修改工作项状态 |
| `create_work_item` | 创建工作项 |
| `list_labels` | 列出 workspace 下所有标签 |
| `create_label` | 创建标签（已存在则返回已有） |

## 配置

通过环境变量传入，在 codeg `Settings → MCP` 中添加：

| 环境变量 | 说明 |
| --- | --- |
| `PLANE_BASE_URL` | 自托管 Plane 地址，如 `http://plane.example.com` |
| `PLANE_API_KEY` | Plane API Key（`X-Api-Key` 认证） |
| `PLANE_WORKSPACE` | 目标 workspace 标识（slug 或 uuid） |
| `PLANE_API_VERSION` | API 版本，默认 `v2`；Plane 0.x 实例用 `v1` |

### v1 与 v2 的差异

| | v1（Plane 0.x，如 0.23.1） | v2（Plane 1.x 新 API） |
| --- | --- | --- |
| 前缀 | `/api/v1/` | `/api/v2/` |
| 工作项路径 | `issues` | `work-items` |
| 标签作用域 | 项目级（`/projects/{id}/labels/`） | workspace 级（`/labels/`） |
| 认证 | `X-Api-Key` 可用 | 视实例而定 |

`v1` 下 `list_labels` / `create_label` 需要传 `projectId`；不传时取 workspace 下第一个项目。

## 在 codeg 中接入

codeg 的 MCP 配置为 stdio 类型，`command` 指向 `tsx`，`args` 指向本 server 文件，`env` 传上述变量：

```json
{
  "mcpServers": {
    "plane": {
      "command": "/Users/jiaweiwu/baidu_backup/macm1air/work/project/plane-plugin/mcp/node_modules/.bin/tsx",
      "args": ["/Users/jiaweiwu/baidu_backup/macm1air/work/project/plane-plugin/mcp/server.ts"],
      "env": {
        "PLANE_BASE_URL": "http://your-plane-host",
        "PLANE_API_KEY": "your-api-key",
        "PLANE_WORKSPACE": "your-workspace"
      }
    }
  }
}
```

> 路径按本机实际位置调整；`command` 指向本目录自带的 `tsx`（mcp 有独立 node_modules，别用系统全局的）。
> 若 codeg 的 MCP 配置界面字段名不同，以界面为准，填 command / args / env 三项即可。

## 本地验证

```bash
npm install
npm run typecheck   # tsc --noEmit
npm start           # tsx server.ts（stdio）
```
