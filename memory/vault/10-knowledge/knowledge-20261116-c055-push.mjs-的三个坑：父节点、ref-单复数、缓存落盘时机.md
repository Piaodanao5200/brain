---
id: knowledge-20261116-c055
type: knowledge
scope: project
layer: L1
title: push.mjs 的三个坑：父节点、ref 单复数、缓存落盘时机
tags: [github, git, api, 推送]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: []
status: active
confidence: 0.9
source: WorkBuddy agent 实测 @ 2026-11-16，lead 复核
---

API 重放提交时，唯一决定 SHA 是否与本地一致的是 parents 必须接远程当前 tip；接对了重放出的 SHA 与本地逐条相同，两边就是同一套提交，回退就是普通 git revert。

依据：2026-11-16 实测 brain（5 条）与 skills（2 条），远程与本地 SHA 完全对应。另外两个坑：读 ref 用单数 /git/ref/、更新指针用复数 /git/refs/，写错会「commit 建好、指针 404」；对象缓存要在移指针之前落盘，否则失败重跑要重传全部对象。

边界：--reset 只在远程历史本身伪造（空父提交）时用，本轮对 skills 用过一次。既然 git 已可用（见 4a42），这条只覆盖「必须走 API」的场景。
