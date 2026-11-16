---
id: knowledge-20261116-734e
type: knowledge
scope: project
title: ego 并行只能靠多进程：同一进程内多开空间不提速
tags: [ego, 并行, 多进程, 并发, 风控]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: []
status: active
confidence: 0.9
source: D:/WorkBuddy/ego/README.md 与 par-bench-20261116，2026-11-16 实测（WorkBuddy agent）
---

同一 Node 进程内 ego-browser 的操作被全局串行化：同一空间 2 个 page 用 Promise.all 各等 2 秒，实测 4051ms，串行 4056ms，跨 2 空间同进程并行 4039ms；4 个 page 同时跑 8081ms（正好 4×2000），开几个空间都在排队。真提速只能起多个 ego-browser nodejs 进程：2 进程各 2 秒总耗时 2983ms（约 1.65 倍，每进程约 500ms 启动开销）。

默认策略（用户 2026-11-16 确认）：互不依赖的批量目标（一批 URL、几个平台各抓各的）开 3–4 个进程，一个进程管一个空间；需要登录态或有风控的站点（抖音/小红书/B站/X）保持串行，不要并发。原因是所有空间共用 Profile 1 的同一套 cookie，同账号并发只会招限流和验证码，总耗时反而更长。判断标准一句话：步骤之间有没有依赖，没依赖才并行。

另两个配套坑：①page.evaluate 的回调在页面里执行、拿不到 Node 变量，数值必须作为第二个参数传，否则报 ms is not defined；②脚本异常退出时 ego 会把窗口还原成 maximized，任务失败也会弹窗，所以脚本里要防御 null 而不是让它抛。
