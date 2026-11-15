---
id: decision-20261115-a6d4
type: decision
scope: project
title: 自动检索靠 WorkBuddy hook，不依赖 MCP 连接
tags: [架构, hook, 自动检索]
created: 2026-11-15
updated: 2026-11-15
valid_from: 2026-11-15
supersedes: []
status: active
confidence: 0.95
source: 2026-11-15 实施并测试
---

会话开始的自动检索用 ~/.workbuddy/settings.json 的 hooks 实现：SessionStart 注入记忆地图（约1000字），UserPromptSubmit 拿用户原话同时查记忆库与知识库，命中才注入。命令统一为 bash wb-run.sh（脚本自己找 node，避免路径带版本号失效）。之所以不走 MCP：桌面面板里 kb 连接器一直没出现，而 hook 直接读文件系统，不依赖连接器信任状态。噪音控制：BM25 or 模式会误匹配，故在 Node 侧加词面重合闸门（二元组覆盖≥2），实测「今天天气怎么样」不注入，
