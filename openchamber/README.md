# openchamber-plane

Plane 任务看板的 **OpenChamber guest 扩展**。左侧 rail 一个面板，看板读写、从任务发起会话、把会话结论写回任务。

它在 `plane-plugin` 仓库的 `openchamber/` 子目录里，和规格、切片同一个仓库：

- 规格：`.scratch/openchamber-plane-plugin/spec.md`
- 切片：`.scratch/openchamber-plane-plugin/issues/01`–`09`
- 原型（一次性）：`.scratch/openchamber-plane-plugin/prototype/panel-prototype.html`

> 为什么是子目录而不是独立仓库：spec / issues 在这里，代码隔一个仓库每次都要跳。代价是**只能用「添加文件夹」安装**——OpenChamber 的 git / zip 安装读的是仓库根的 `openchamber` 块，而根 `package.json` 是 Paseo 插件清单。

## 现在到哪了

**第 01 片（骨架）**：面板能装出来、跟宿主握手、本地 service 按契约应答 `/health`。看板与 Plane 连接是 02 片。

## 安装

1. 设置 → 扩展 → 添加文件夹 → 选 **`plane-plugin/openchamber`**（不是仓库根）
2. 在权限对话框里允许**本地 service**（这一片的 service 只做 `/health`）
3. rail 出现 Plane 面板；面板底部能看到「宿主 / service」两个状态

> 文件夹安装从原目录运行：改完代码 `npm run build`，再在面板里重载即可，不用重装。
> 换成 zip / git 安装时只发构建产物（`panel/main.js`、`service/main.cjs`），宿主不会编译。

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
| `test/smoke.mjs` | 不依赖 OpenChamber 的冒烟测试 |

## 契约要点

- 面板拿不到 service token，也不直连端口；一切经宿主代理（`serviceRequest`）。
- service 只监听 `127.0.0.1`，端口与令牌来自 `OPENCHAMBER_SERVICE_PORT` / `OPENCHAMBER_SERVICE_TOKEN`。
- **每个请求（含 `/health`）都要带** `Authorization: Bearer <token>`；宿主轮询 `/health` 到 200 才把状态标成 ready。
- service 不继承宿主环境（只有 PATH/HOME/temp/locale）；要落盘就写 `OPENCHAMBER_SERVICE_DATA_DIR`。
- 扩展只在 OpenChamber 桌面端与 Web 端加载；VS Code 与移动端不支持。

## 已知坑

- `service/main.js` 会被 `"type": "module"` 当 ESM，而 esbuild 产出的是 CJS → 必须用 `.cjs` 后缀，否则宿主拉起即 `require is not defined`。
- manifest 里 `contributes.panel.id` 会被顶层 `id` 覆盖（SDK 解析器行为），两者写成同一个值，免得后人读懵。
