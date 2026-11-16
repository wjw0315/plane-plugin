Status: ready-for-agent

# 09 二期：/plane 命令、会话菜单动作、工作项 chip

## Parent

[OpenChamber Plane 扩展 Spec](../spec.md)

## What to build

把两侧的入口补全，让用户不一定要走面板：

- 输入框里的 `/plane` 命令：列出当前会话绑定的工作项、把它挂到某张卡、或解绑。
- 会话菜单动作：对当前会话一键「挂到 Plane 工作项」或「回填结论」。
- 聊天里出现的 `XLMSC-24` 这类编号，变成可点的 chip，点了直接开面板并定位到那张卡的详情。
- 卡片上的「进行中 / 待回填」标记由会话事件驱动，跟随真实状态变化。
- 文档写明扩展在 VS Code 与移动端不加载，避免被当成 bug 报回来。

## Acceptance criteria

- [ ] `/plane` 在真实会话里可用，能列出当前绑定并成功解绑
- [ ] 会话菜单里有动作项，点了之后 Plane 侧出现对应标签与关联
- [ ] 聊天文本里的 `XLMSC-24` 渲染成 chip，点击打开面板并落在该卡详情
- [ ] 卡片标记随会话事件变化：进行中出现、结束后变为待回填/已回填
- [ ] 未配置 Plane 时这些入口给出引导而不是报错
- [ ] 扩展 README 写明宿主限制（VS Code / 移动端不加载）与所需授权清单

## Blocked by

- [08 自动回填](08-auto-conclusion-backfill.md)

## Comments

- **2026-11-16 已实现**：`openchamber/`（提交 `5eb586c`，版本 0.9.0）。
  - manifest：`commands`（/plane）、`links`（XLMSC 编号 → chip 点击开面板）、`actions`（会话菜单「Plane：挂到工作项」）。
  - 面板 `handleHostCallbacks()`：`onResolve`（/plane XLMSC-31 → 返回 chip）、`onItem`（link → 打开对应卡详情；session → 绑定抽屉）、卡片 ⌘ 会话角标 → `openSession` 跳转。
  - onReady 幂等：宿主会推多次 ready（iframe 加载 + 每次 hello），只初始化一次——之前重复初始化会把面板状态打回 boot，这正是调试时「面板莫名回到表单」的原因。
  - 假宿主实测：resolve 回 chip、link 点击开详情、会话动作绑定成功且角标出现；控制台 0 错误。
  - **未验收**：真机装上后 /plane 命令与 chip 跳转（仍待 02 真机配置跑通）。
  - 顺带说明：本条切片期间工作区混入了另一条并行线（issue 10 移动端）的未提交改动（phone CSS / panel.mobile / spec 22），未代为提交。
