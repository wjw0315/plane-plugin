# 02 — Plane API server 封装层

**What to build:** 插件 server 能按配置的 Plane 实例与凭据，通过 REST API（v2，X-Api-Key 认证）拉取目标项目的 work item states 与 work items 列表，并能将单个 work item 的 state 更新为指定值；API 错误（401 鉴权失败、404 项目或端点不存在、网络不可达）被捕获并以可读形式反馈，不抛出未处理异常。

**Blocked by:** 01 — 插件脚手架与配置

**Status:** resolved

- [x] 给定配置，server 能返回目标项目的 states 列表与 work items 列表
- [x] server 能将指定 work item 的 state 更新为给定值
- [x] 鉴权失败（401）/ 端点不存在（404）/ 网络失败时返回明确错误，不抛出未处理异常
- [x] 经 mock HTTP 验证请求构造（URL、X-Api-Key、PATCH body 的 state）与响应解析

## Implementation

已实现并验证：

- `shared/plane-rpc.ts` — 三个 RPC 契约（`plane.list-states` / `plane.list-work-items` / `plane.patch-state`），每个输出为 `{ status: "ready", ... } | { status: "error", error }` 判别联合。RPC 名称必须全小写，符合 Paseo SDK 的 `/^[a-z][a-z0-9._-]*$/` 正则。
- `server/plane-api.ts` — Plane v2 REST 客户端：`listStates` / `listWorkItems` / `patchState`，统一走 `X-Api-Key` 认证，`PlaneApiError` 携带 statusCode。401/404/网络错误各有明确文案。
- `index.server.ts` — 注册三个 RPC handler，通过 `settings.read()` 获取配置，所有异常被捕获转成 `{ status: "error" }` 响应。

**测试**：`tests/plane-api.test.ts` 用 mock fetch 验证 7 项场景全过——URL 构造、X-Api-Key 头、PATCH body 的 state 字段、响应解析、401/404/网络错误处理。

**验证**：`tsc --noEmit` 零错误；`paseo plugin reload` 后 daemon 日志 "Plugin ready" 无报错。
