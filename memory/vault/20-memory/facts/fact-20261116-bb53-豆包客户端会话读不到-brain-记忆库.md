---
id: fact-20261116-bb53
type: fact
scope: project
layer: L1
title: 豆包客户端会话读不到 brain 记忆库
tags: [记忆, 会话启动, 豆包, 边界]
created: 2026-11-16
updated: 2026-11-18
valid_from: 2026-11-16
supersedes: []
status: superseded
confidence: 0.9
source: 会话 38453975086721794 实测 @ 2026-11-16
superseded_by: fact-20261118-0802
---

豆包桌面客户端的会话读不到 brain 记忆库：它既不执行 WorkBuddy hook，也不注入 AGENTS.md，只会带上平台级偏好与画像，看起来像"读到了记忆"，实际与 vault 无关。

依据：2026-11-16 查会话 38453975086721794（分享短链 xDgquTCE9fqTWLOEu），2 轮 4 条全为 message、无任何 tool_call；同期库内无文件变动。
边界：豆包若接入 hook 或 MCP 插件，此结论失效；与 ad50（DSH 会带记忆指针）是两条不同机制，勿合并。


<!-- superseded -->
> 已被 `fact-20261118-0802` 取代，检索时请优先使用新条目。
