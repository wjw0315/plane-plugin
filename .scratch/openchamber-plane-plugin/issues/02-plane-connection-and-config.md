Status: ready-for-agent

# 02 Plane 连接与配置：列项目 + 三种错误面 + 记住项目

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## What to build

把 Plane 接通并在面板里看得见：扩展的 Integrations 设置卡片收四个字段（地址、API Key、workspace、API 版本），面板顶部按这几个值列出项目；配置缺失、Key 无效、网络不通三种情况各给一句可操作的话，而不是空白页或红屏。刷新按钮能重新拉取；切过的项目记住，下次打开还在那个项目。

service 增加一条节点路由（列项目），Plane 客户端按 API 版本切前缀与工作项路径段（v1 的 `issues` 与项目级标签、v2 的 `work-items` 与 workspace 级标签），错误统一归一化成固定错误码，`NETWORK` 与限流在 service 内重试一次。

## Acceptance criteria

- [ ] 配置全空时面板给「去设置填写」引导，且不发任何 Plane 请求
- [ ] 填好之后能列出真实项目（本机 0.23.1 实例用 `v1` 应列出 `xlm-scrm`）
- [ ] API Key 无效 → 明确提示 Key 无效，不进重试循环
- [ ] 地址不通 → 提示网络问题，且 service 内部已重试过一次
- [ ] 切换项目后关闭再打开面板，仍是上次的项目
- [ ] 只改配置里的 API 版本就能适配两种实例：v1 实例真连，v2 用假 Plane 响应验证路径形状（`/api/v2` + `work-items`）
- [ ] 设置改完立即生效，不需要重启 OpenChamber

## Blocked by

- [01 扩展骨架](01-extension-skeleton.md)
