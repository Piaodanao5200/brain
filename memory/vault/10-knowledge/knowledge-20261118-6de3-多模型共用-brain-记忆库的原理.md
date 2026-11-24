---
id: knowledge-20261118-6de3
type: knowledge
scope: project
layer: L1
title: 多模型共用 brain 记忆库的原理
tags: [记忆库, 多agent, 架构]
created: 2026-11-18
updated: 2026-11-18
valid_from: 2026-11-18
supersedes: []
status: active
confidence: 0.9
source: 手动写入
aliases: []
---

各家客户端的云记忆是私有格式互相隔离（豆包读不到 brain，实测 bb53）。brain 能被所有 agent 共用靠三点：① 纯 Markdown+YAML，任何模型都能直接读，不需要专用解析器；② 统一 CLI 接口（kb.mjs / kb.py），任何 agent 会跑 shell 就能用；③ 单实体 + 多 Junction：物理一份在 D:/collaborative project/brain/，各 agent 目录挂 Junction 指向它，改一处全体生效。最小公约数是"能读文件 + 能跑命令"。与 e001（统一真源）、e002（冲突消解靠人工）、05ba（共用 skill 同机制）互补。
