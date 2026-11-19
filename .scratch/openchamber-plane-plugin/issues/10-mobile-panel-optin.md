Status: ready-for-human

# 10 移动端面板（manifest opt-in + 触控适配）

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## 背景

扩展在桌面端 / Web 端正常显示，手机上完全看不到面板。这不是 bug，是宿主的规则：

- 手机端加载扩展目录，但**大面板默认不给看**——只有 manifest 显式写 `contributes.panel.mobile: true`，面板才会变成手机工作区抽屉里的一个 tab（`plugin:<id>`）。
- 没写这个键时：手机上没有面板、没有 attach、open 模式的 action（`plane-bind`）也不出现在菜单里；链接/chip 点下去会提示「该扩展不在手机上打开」。
- 宿主文档：`@openchamber/sdk` 2.7.2 的 `API.md`（`panel.mobile` 一节）与 `DOCUMENTATION.md`（*On the phone*）。旧文档写「移动端不加载扩展」已经过期——那是 2.7.0 之前的说法。

## 已改（代码）

- `openchamber/package.json`：`contributes.panel` 加 `"mobile": true`。
- `openchamber/panel/src/main.js`：读 `ready.device`（`formFactor` / `pointer`），手机（`phone` 或 `coarse` 指针）默认**列表视图**（列表用「移动到」下拉改状态，能用），看板视图不拖拽。
- `openchamber/panel/src/board.js`：`boardHTML` 收 `canDrag`，不拖拽时不画「拖到这里」占位。
- `openchamber/panel/index.html`：`body[data-device=phone]` 下的触控目标放大（行高 ≥44px、按钮 ≥36px）、头部换行、卡片不再显示 grab 光标。
- `openchamber/test/smoke.mjs`：断言 `contributes.panel.mobile === true`。

## 待验证（要人拿手机做）

- [ ] 手机 App 连上同一桌面实例（直连或 relay 都行）后，工作区抽屉里出现 Plane tab
- [ ] 面板在 ~360px 宽度下不横向溢出：头部（项目下拉 / 列·列表切换 / 刷新）、列表分组、详情覆盖页、发起会话抽屉、回填草稿抽屉
- [ ] 触控：点卡片开详情、下拉改状态、抽屉里的按钮都能点中（无 44px 以下的热点）
- [ ] 手机上会话菜单动作「Plane：挂到工作项」出现（open 模式 action 需要 `panel.mobile`）
- [ ] `/plane` 斜杠命令在手机输入框可用（命令不需要 opt-in）
- [ ] service / sessionEvents 自动回填在手机上照常触发（service 跑在桌面服务器上，手机只是客户端）

## 待办（可选，下一切片）

- [ ] 看板的触控拖拽（现在手机上看板只能看不能拖，改状态走列表下拉或详情里的状态按钮）
- [ ] 手机上是否需要独立的紧凑版布局（现在是把桌面布局压到 360px）
- [ ] `contributes.page`（全屏页）：手机上从会话列表的 More 菜单进，360px 排版，手机上比抽屉 tab 更合适
