# 02 — Plane API server 封装层

**What to build:** 插件 server 能按配置的 Plane 实例与凭据，通过 REST API（v2，X-Api-Key 认证）拉取目标项目的 work item states 与 work items 列表，并能将单个 work item 的 state 更新为指定值；API 错误（401 鉴权失败、404 项目或端点不存在、网络不可达）被捕获并以可读形式反馈，不抛出未处理异常。

**Blocked by:** 01 — 插件脚手架与配置

**Status:** ready-for-agent

- [ ] 给定配置，server 能返回目标项目的 states 列表与 work items 列表
- [ ] server 能将指定 work item 的 state 更新为给定值
- [ ] 鉴权失败（401）/ 端点不存在（404）/ 网络失败时返回明确错误，不抛出未处理异常
- [ ] 经 mock HTTP 验证请求构造（URL、X-Api-Key、PATCH body 的 state）与响应解析
