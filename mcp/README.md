# Plane MCP Server

把自托管 [Plane](https://plane.so) v2 REST API 封装为 MCP server，供 codeg 等 MCP 客户端直接调用，无需打开 Plane 平台。

复用 `../server/plane-api.ts` 的 API 客户端，零重复逻辑。

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
| `PLANE_WORKSPACE` | 目标 workspace 标识 |

## 在 codeg 中接入

codeg 的 MCP 配置为 stdio 类型，`command` 指向 `tsx`，`args` 指向本 server 文件，`env` 传上述变量：

```json
{
  "mcpServers": {
    "plane": {
      "command": "npx",
      "args": ["tsx", "/Users/jiaweiwu/baidu_backup/macm1air/work/project/plane-plugin/mcp/server.ts"],
      "env": {
        "PLANE_BASE_URL": "http://your-plane-host",
        "PLANE_API_KEY": "your-api-key",
        "PLANE_WORKSPACE": "your-workspace"
      }
    }
  }
}
```

> 路径按本机实际位置调整；若 codeg 的 MCP 配置界面字段名不同，以界面为准，填 command / args / env 三项即可。

## 本地验证

```bash
npm run mcp
# 或直接发 stdio 请求验证
npm run typecheck
```
