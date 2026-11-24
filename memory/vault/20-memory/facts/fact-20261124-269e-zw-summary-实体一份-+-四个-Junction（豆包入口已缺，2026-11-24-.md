---
id: fact-20261124-269e
type: fact
scope: project
layer: L1
title: zw-summary 实体一份 + 四个 Junction（豆包入口已缺，2026-11-24 核实）
tags: [skill, junction, 目录结构, zw-summary, 迁移]
created: 2026-11-24
updated: 2026-11-24
valid_from: 2026-11-24
supersedes: [fact-20261116-b313]
status: active
confidence: 0.9
source: lead @ 2026-11-24 本机复测，session-43414ec9
aliases: []
---

结论：zw-summary 实体在共用仓库 skills/zw-summary（git 管理），四个 Junction 指回同一实体。依据：2026-11-24 复测 ~/.workbuddy、~/.agents、~/.codex、~/.codebuddy 四入口均为 Junction；豆包 .user_skills 入口已不存在（Doubao/skills 为空）。边界：豆包若重新接入需重挂 Junction；旧「五入口」说法作废。
