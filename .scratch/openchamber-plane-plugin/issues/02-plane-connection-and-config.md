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

## Comments

- **2026-11-16 已实现**：`openchamber/`（提交 `bd8ecd2`，版本 0.2.0）。
  - 完成：`GET/POST /config`（配置落 `OPENCHAMBER_SERVICE_DATA_DIR/config.json`，600，面板只见脱敏视图）+ `POST /projects`；Plane 客户端 v1/v2 分支 + 六种错误码归一化 + `NETWORK`/`RATE_LIMITED` 重试一次；面板表单 → 列项目 → 选中记忆（`host.storage`）；`CONFIG_MISSING`/`BAD_CONFIG` 回表单，`AUTH_FAILED`/`NETWORK` 走错误面带重试。
  - 实测：真实例 `g2` 列到 `xlm-scrm`；错 Key → HTTP 401 `AUTH_FAILED`；假 Plane 500 → HTTP 502 `NETWORK` 且恰好两次请求；`GET /config` 回包里搜不到 Key 字符串；面板在无宿主时降级为「不在 OpenChamber 里」，控制台 0 错误。
  - **方案变更（重要）**：原计划用 Settings → Integrations 卡片收四个字段，实测**做不到**——`contributes.integration` 要求 `token.apiOrigin` 是 https，`http://192.168.1.188:8080` 被 schema 直接拒（`invalid-integration`），`oauth`/`host` 两种鉴权模式也不适配。改为面板内配置表单 + service 数据目录存盘。spec 已同步（`12b5ebb`）。
  - **未验收**：装进 OpenChamber 后走一遍真实配置表单（仍属人工审批门）。
