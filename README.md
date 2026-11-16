# plane-plugin

Plane 任务看板插件仓库。两套宿主、两套插件代码，同一个仓库：

| 目录 | 宿主 | 说明 |
| --- | --- | --- |
| `paseo/` | [Paseo](https://paseo.sh) | 看板屏幕、会话 ↔ 工作项同步、webhook 反向同步 |
| `openchamber/` | [OpenChamber](https://openchamber.dev) | guest 扩展：rail 面板 + service，看板读写、会话发起与结论回填 |
| `mcp/` | 任意 MCP 客户端 | Plane v2 API 的 MCP server（stdio），宿主无关 |

两套插件各自独立：依赖、构建、测试都在自己的子目录里跑，互不相干。
仓库根只放文档与规格（`docs/`、`.scratch/`）。

## 目录结构

```text
plane-plugin/
  paseo/                    Paseo 插件（TypeScript / React Native）
    paseo-plugin.json       插件 manifest
    index.server.ts         server 入口
    index.client.tsx        client 入口
    client/ server/ shared/ mcp/ tests/
  openchamber/              OpenChamber 扩展（纯 JS）
    panel/                  面板（宿主加载 iframe）
    service/                本地 service（宿主拉起）
    test/                   冒烟测试 + 假宿主 harness
  mcp/                      Plane MCP server（独立小包，宿主无关）
    server.ts               stdio MCP server，8 个工具
  docs/                     仓库级约定（issue tracker、标签、领域模型）
  .scratch/                 规格与切片
```

## 安装

两套插件都**只能用「添加文件夹」安装**，别选仓库根：

- Paseo：选 `plane-plugin/paseo`
- OpenChamber：选 `plane-plugin/openchamber`

## 开发

```bash
cd paseo       && npm install && npm run typecheck
cd openchamber && npm install && npm run build && npm test
cd mcp         && npm install && npm run typecheck
```

细节看各自的 README：

- [paseo/README.md](paseo/README.md)
- [openchamber/README.md](openchamber/README.md)
- [mcp/README.md](mcp/README.md)
