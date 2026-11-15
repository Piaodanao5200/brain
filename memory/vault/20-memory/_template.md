---
id: _template-memory
type: decision
scope: project
title: 决策或事实的标题（一句话）
tags: [标签]
created: 2026-11-15
updated: 2026-11-15
valid_from: 2026-11-15
supersedes: []
status: active
confidence: 0.9
source: 用户口述 @ 2026-11-15
---

## 结论

一句话。例如："数据库用 Postgres 16，不用 MySQL。"

## 为什么

选它的理由，以及被否掉的方案和否掉的原因。这部分比结论更容易过期，写清时间点。

## 代价

接受了什么缺点。没有代价的决策通常是没想清楚。

## 什么情况下应该推翻

例如"如果单表超过 5 亿行，需要重新评估分库"。给自己留一个失效条件。

---

类型说明：
- `decision` 决策 → `20-memory/decisions/`
- `fact` 事实 → `20-memory/facts/`
- `pitfall` 坑 → `20-memory/pitfalls/`
- `todo` 待办 → `20-memory/todos/`
- `note` 笔记 → `20-memory/notes/`
- `session` 会话 → `30-sessions/`
