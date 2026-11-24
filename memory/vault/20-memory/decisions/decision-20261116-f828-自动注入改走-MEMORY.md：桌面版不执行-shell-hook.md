---
id: decision-20261116-f828
type: decision
scope: project
layer: L1
title: 自动注入改走 MEMORY.md：桌面版不执行 shell hook
tags: [架构, hook, 自动检索]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: [decision-20261115-a6d4]
status: active
confidence: 0.95
source: 2026-11-16 排查并改用新方案
---

2026-11-16 实测推翻上一条：WorkBuddy 桌面版 5.11.3 会读到 ~/.workbuddy/settings.json 的 hooks 键（内核日志 settingsKeys 里含 hooks），但运行时只执行内置的 conversation-hook，用户配置的 shell 命令零执行。证据：手动跑 wb-run.sh 正常（24 条 / 1627 字）；无空格、无引号的探针钩子同样不触发；彻底重启应用（21:33）后仍不触发；最后一条成功记录停在 11-15 23:38。所以这不是路径、写法或脚本的问题，是应用层不再支持。

现行方案（不依赖 hook）：
- 会话启动的自动注入走 WorkBuddy 自带通道——每次会话注入 D:/WorkBuddy/.workbuddy/memory/MEMORY.md（就是上下文里的 working_memory_content）。里面放 kb.mjs mem 生成的紧凑索引，约 1700 字符 / 约 1300 token，属稳定前缀会命中 prompt 缓存，成本很低。
- 需要全文仍走 CLI：node memory/bin/kb.mjs search / read，约 200ms 一次，按需调用，不查不占上下文。
- index 与 refresh 都会顺带同步 MEMORY.md 的索引标记区，避免索引与库内容漂移（这条是给「命令会漂移」那个坑的补丁）。

仍然不依赖 MCP：桌面面板里 kb 连接器一直没出现，所以按需检索走 CLI 而不是 MCP 工具。

保留与判断：
- settings.json 里的 hooks 配置没删，无害；将来版本恢复支持可直接启用。wb-run.sh 的记忆地图注入与词面重合闸门（二元组覆盖≥2，防 BM25 or 模式误匹配）逻辑都还在，别当死代码删掉。
- 自检方法：新会话若看不到「记忆库索引」那一段，说明注入通道也断了，先确认 MEMORY.md 的 KB-INDEX 标记区还在、内容是最新的。
