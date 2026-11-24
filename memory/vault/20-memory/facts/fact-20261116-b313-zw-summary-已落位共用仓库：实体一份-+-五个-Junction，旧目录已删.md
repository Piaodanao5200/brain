---
id: fact-20261116-b313
type: fact
scope: project
layer: L1
title: zw-summary 已落位共用仓库：实体一份 + 五个 Junction，旧目录已删
tags: [skill, junction, 目录结构, zw-summary, 迁移]
created: 2026-11-16
updated: 2026-11-24
valid_from: 2026-11-16
supersedes: []
status: superseded
confidence: 0.9
source: 2026-11-16 本机迁移实测 + 仓库 check.ps1（WorkBuddy agent）
superseded_by: fact-20261124-269e
---

结论：zw-summary 已按「一份实体 + 多 Junction」落位，实体在 `D:\collaborative project\skills\zw-summary`（git 提交 e1a01f8，11 文件 / 218KB），旧 `D:\WorkBuddy\skills\zw-summary` 已删除。

依据：2026-11-16 迁移实测。五个入口均为 Junction 指向同一实体：~/.workbuddy/skills、~/.agents/skills、~/.codex/skills、~/.codebuddy/skills、豆包 ...\agent_mode\workspace\.user_skills；仓库 check.ps1 结论「全部正常 · 实体 2 个 · 已安装 agent 5 个」。迁移前置检查三项均过：目录名等于 SKILL.md 的 name、frontmatter 有 description、内部无硬编码本机绝对路径，所以搬完调用不断（从新路径实跑 ego_fetch.py 得 ok=1 验证）。豆包入口未实测：该客户端读不到本机记忆库，是否有 bash/python 待验证。

边界：本机执行策略为 Restricted，直接跑仓库里的 .ps1 会被拒，需进程级 Bypass（或双击配套 .cmd 包装）；配套包装脚本就是干这件事的。


<!-- superseded -->
> 已被 `fact-20261124-269e` 取代，检索时请优先使用新条目。
