---
id: knowledge-20261116-1c14
type: knowledge
scope: project
title: 本机推 GitHub 只能走 API，且 commit 必须接上远程父节点才不丢历史
tags: [github, git, api, 推送]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: []
status: superseded
confidence: 0.9
source: memory/bin/push.mjs，2026-11-16 实测 brain 与 skills 两仓库
superseded_by: knowledge-20261116-4a42
---

本机 git push 不通（github.com:443 TLS 被中断，api.github.com 正常），只能走 REST API：blob → tree → commit → PATCH 分支指针。关键在 commit 的 parents 必须接远程当前 tip；写空数组会每次把远程历史抹成一条，踩过一次。author/committer/时间照抄本地，重放出的 SHA 就与本地完全一致，两边天然对齐，回退直接 git revert 再推，不需要任何 SHA 对照表。两个易错点：更新指针要用 /git/refs/{ref}（复数），读单个 ref 是 /git/ref/{ref}（单数），写错就 404；--reset（强推、以本地历史为准）只在远程历史本身是伪造空父提交时才用。工具见 memory/bin/push.mjs。


<!-- superseded -->
> 已被 `knowledge-20261116-4a42` 取代，检索时请优先使用新条目。
