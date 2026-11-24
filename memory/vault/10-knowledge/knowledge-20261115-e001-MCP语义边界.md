---
id: knowledge-20261115-e001
type: knowledge
scope: global
layer: L1
title: MCP 统一传输但不统一语义，必须选一个唯一真源
tags: [mcp, 协议, 互通]
created: 2026-11-15
updated: 2026-11-15
valid_from: 2026-11-15
supersedes: []
status: active
confidence: 0.85
source: MCP 规范 2025-11-25 修订版 + 2026-07-28 更新说明
---

## 结论

MCP 让 Claude Code、Cursor、Codex、ChatGPT 等客户端都能连同一个 server，但它只规范**传输与方法调用**，不规定记忆的 schema。两个都"支持 MCP"的记忆服务器，数据模型可能完全不兼容。

## 依据

- 协议层统一：JSON-RPC 2.0，工具通过 `tools/list` 自描述，客户端无需预先知道工具名。
- 语义层不统一：条目字段、去重策略、冲突消解各实现不同，换一个 server 等于换一套数据模型，**照样要迁移**。
- 2026-07-28 修订版去掉了 `initialize` 握手对会话状态的依赖，每个请求自带协议版本，因此可以写成无状态服务——本项目的 HTTP 实现即按此设计。

## 边界

如果只用单一客户端（只连 Claude Code），这条的约束力不大；一旦要跨 agent 共享，唯一真源就是硬要求。
