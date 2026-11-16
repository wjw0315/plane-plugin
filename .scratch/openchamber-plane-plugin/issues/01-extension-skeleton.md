Status: ready-for-agent

# 01 扩展骨架：装得上、面板出现、service 活着

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## What to build

一个能被 OpenChamber 识别、安装、启停的 guest 扩展最小闭环：manifest 声明 `apiVersion: 1` 与 `panel` / `service` 两个贡献点；面板挂在右侧 rail，在 300–560px 宽度内渲染空状态（还没有配置 Plane）；service 由宿主按需拉起，提供 `/health`，并校验宿主下发的 Bearer 令牌。

这一片不碰 Plane。目的是把「宿主契约」与「业务」切开：面板不出来、service 起不来，问题一定在宿主侧，不用怀疑 Plane。

## Acceptance criteria

- [ ] 设置 → 扩展 → 添加文件夹后，rail 出现 Plane 面板入口，点开有面板
- [ ] 面板在 300 / 380 / 560px 三档宽度下都不横向溢出，浏览器控制台无错误
- [ ] 直接跑 service（注入端口与令牌）时 `GET /health` 返回 `{ ok: true }`
- [ ] 不带令牌或令牌错误时 `/health` 返回 401，且不崩进程
- [ ] 宿主空闲后 service 被回收；杀掉宿主后没有残留 service 进程
- [ ] 在扩展设置里禁用后面板消失、service 停止

## Blocked by

None - can start immediately

## Comments

- **2026-11-16 已实现**：代码在独立仓库 `/Users/jiaweiwu/baidu_backup/macm1pro/work/project/openchamber-plane`（提交 `37e17a3`，尚未接远端）。
  - 已验收：manifest 用 SDK 自带的 `parseManifestJson` 解析通过；`npm test` 全绿（带 token 200 / 不带 401 / 错 token 401 / 未知路由 404 / SIGTERM 5 秒内退出 / 入口文件存在）；面板在真实浏览器里打开显示空态与「宿主未连接」，控制台 0 错误。
  - **未验收**：还差「装进 OpenChamber 后 rail 出现面板」——需要在 设置 → 扩展 → 添加文件夹 并允许本地 service，这一步是人工审批门。
  - 实测坑：`service` 产物必须是 `.cjs`（`.js` 会被 `"type": "module"` 当 ESM，宿主拉起即 `require is not defined`）；`contributes.panel.id` 会被顶层 `id` 覆盖，两者写成同值。
