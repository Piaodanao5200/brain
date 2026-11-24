---
id: decision-20261118-9e3d
type: decision
scope: project
layer: L1
title: 豆包索引落点复用 MEMORY.md，不另建独立文件
tags: [记忆, 会话启动, 豆包, 索引落点]
created: 2026-11-18
updated: 2026-11-18
valid_from: 2026-11-18
supersedes: []
status: active
confidence: 0.9
source: 豆包 @ 2026-11-18 会话 38454755670856450
aliases: []
---

豆包会话的索引落点定为复用 WorkBuddy 的 MEMORY.md：平台偏好直接指向该文件，不新建 DOUBAO.md，也不把 kb.mjs 的同步目标数组化。

依据：2026-11-18 校验该文件 KB-INDEX 区 35 条与 INDEX.md 短 ID 完全一致、零差异，可直接当索引用；复用后派生索引仍只有 1 份。新建独立文件会让派生副本变 2 份，需改约 10 行代码并长期手工维护，换来的只是摆脱对 WorkBuddy 目录的依赖。

边界：WorkBuddy 卸载或 MEMORY.md 改路径时本方案失效，届时回退为新建独立文件加 syncMemoryIndex 多目标。
