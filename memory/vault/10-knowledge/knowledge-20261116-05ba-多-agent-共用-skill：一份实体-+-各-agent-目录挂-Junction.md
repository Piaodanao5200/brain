---
id: knowledge-20261116-05ba
type: knowledge
scope: user
title: 多 agent 共用 skill：一份实体 + 各 agent 目录挂 Junction
tags: [约定, skill, 目录结构, junction]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: []
status: active
confidence: 0.9
source: 本机实测 @ 2026-11-15，WorkBuddy 侧已验证
---

**agent 不会去 D 盘找 skill**。每个 agent 启动时只扫自己固定的 skills 目录（`.workbuddy` / `.agents` / `.codex` / `.codebuddy` 各一份），路径写死。所以共用只能是「一份实体 + 多处链接」。

## 做法

实体唯一一份放 `D:\collaborative project\skills\<skill名>\`（含 SKILL.md），进 git；每个 agent 的 skills 目录各挂一个 **Junction** 指向它。用 `skills\挂载.cmd` 批量建链，`卸载.cmd` 只删链接不动实体，`校验.cmd` 查不合规、断链、漏挂。

## 三个硬约束

- **必须 Junction 不能 Symlink**：本机未开开发者模式，Symlink 需管理员权限。
- **必须逐个挂不能整目录替换**：skills 目录里混有 agent 自己的配置文件，替换整目录会丢。
- **目录名必须等于 SKILL.md 的 `name`**：不一致的挂载脚本直接跳过——防止挂上 agent 加载不了的 skill。

## 两个坑

- `npx skills add -g` 往各 agent 目录塞**实体副本**，绕过 Junction，造成同一 skill 存四份且无法统一更新。只用它的 `find` 搜索，安装走「拉 SKILL.md 进实体目录 + 挂载」。
- skill 带 `scripts/` 等于给每个 agent 任意代码执行权。装前必须读一遍，尤其 `curl | bash`、读 `.ssh`、读环境变量外发的。这条没有工具能替。
