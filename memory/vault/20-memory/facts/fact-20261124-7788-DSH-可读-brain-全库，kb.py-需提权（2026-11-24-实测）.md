---
id: fact-20261124-7788
type: fact
scope: project
layer: L1
title: DSH 可读 brain 全库，kb.py 需提权（2026-11-24 实测）
tags: [记忆库, dsh, 沙箱, 实测]
created: 2026-11-24
updated: 2026-11-24
valid_from: 2026-11-24
supersedes: []
status: active
confidence: 0.9
source: lead @ 2026-11-24 本机全量跑通实测，会话 session-43414ec9
aliases: [dsh读取记忆库, 全量跑通]
---

2026-11-24 全量跑通：DSH 能读 brain 全部记忆（51 文件/48 条，lint 0 错 10 警），L2 四专题、L3 都可读，kb.mjs mem/lint 正常。边界：kb.py 需 danger-full-access 才能写 library 的 SQLite WAL；豆包 .user_skills Junction 未找到；ego 实为 0.6.3.17，L2 记的 0.6.3.14 已旧。
