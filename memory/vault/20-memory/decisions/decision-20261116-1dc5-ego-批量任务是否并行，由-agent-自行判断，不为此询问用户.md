---
id: decision-20261116-1dc5
type: decision
scope: project
layer: L1
title: ego 批量任务是否并行，由 agent 自行判断，不为此询问用户
tags: [ego, 并行, 决策权限, 协作约定]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: []
status: active
confidence: 0.9
source: 用户 2026-11-16 指示；D:/WorkBuddy/ego/README.md
---

批量浏览器任务要不要并行，由 agent 自己决定，不打断用户征求意见（用户 2026-11-16 明确要求）。

判断依据只有一条：任务里的步骤之间有没有依赖。无依赖才并行——开 3–4 个 ego-browser nodejs 进程，每个进程管一个空间；有依赖、或涉及需要登录态和有风控的站点（抖音 / 小红书 / B站 / X），一律串行。

拿不准时按串行处理：串行只是慢一点，并发踩到风控要人重新登录甚至锁号，代价不对等。

决定之后直接执行，只在结果里顺带说明用了几个进程，不单独问。技术依据（同一进程内并行无效、只能多进程）见 knowledge-20261116-734e；约定文件在 D:/WorkBuddy/ego/README.md「默认并行策略」与 bootstrap.mjs 顶部注释。
