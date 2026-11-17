---
id: decision-20261117-50a2
type: decision
scope: project
title: 蒸馏出的 skill 实体放共用技能仓库
tags: []
created: 2026-11-17
updated: 2026-11-17
valid_from: 2026-11-17
supersedes: []
status: active
confidence: 0.9
source: 手动写入
---

cangjie 蒸馏产出的技能包（skill）实体统一放在 D:/collaborative project\skills\（共用技能仓库，git 管理），各 agent 目录按需挂 Junction；不放进单个 agent 的目录，也不作为 library/vault 条目。

卸载的定义（2026-11-17 用户明确）：卸载 = 摘链接 + 删除仓库里的实体源文件，不保留躺仓备份。只想暂时不用的说「停用」，实体留在仓库；说「卸载」就是连源文件一起删。
