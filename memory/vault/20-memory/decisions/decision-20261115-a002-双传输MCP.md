---
id: decision-20261115-a002
type: decision
scope: project
title: 同一份 MCP 服务同时暴露 stdio 与 HTTP 两种传输
tags: [架构, mcp, 部署]
created: 2026-11-15
updated: 2026-11-15
valid_from: 2026-11-15
supersedes: []
status: active
confidence: 0.9
source: 2026-11-15 实现 server/mcp-server.mjs
---

## 结论

`server/mcp-server.mjs` 一套工具实现，通过 `--stdio` 开关切换传输层：本地 agent 走 stdio（进程内管道，无需端口），远程/云端 agent 走 HTTP（Streamable HTTP，无状态）。

## 为什么

- 本地使用不该占用端口、不该有鉴权负担，stdio 最省事，Claude Code / Codex / Cursor 都原生支持。
- 云端要支持多个客户端同时连、要能穿透网络，必须 HTTP。
- 两者共用同一份 `vault.mjs` 逻辑，避免"本地能搜到、云端搜不到"这类语义分叉——这是双实现最常见的坑。

## 代价

HTTP 模式下无状态、不维护会话，因此不能做服务端主动推送（SSE stream）。对记忆类工具没影响：所有操作都是请求-响应。

## 什么情况下应该推翻

如果将来要做"写入后实时通知其他 agent"（订阅式同步），需要引入 SSE 流和会话管理，那时 HTTP 层要重写，stdio 不变。
