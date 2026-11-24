---
id: knowledge-20261116-df65
type: knowledge
scope: project
layer: L1
title: ego_fetch.py 支持关键词直跑：--search 抖音/B站/小红书/YouTube 通，X 不可用
tags: [ego, 取数, 抖音, bilibili, 小红书, youtube, skill]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: []
status: active
confidence: 0.9
source: D:\collaborative project\skills\zw-summary\adapters\ego_fetch.py + README.md，2026-11-16 实测（WorkBuddy agent）
---

结论：zw-summary 的 ego_fetch.py 加了 --search，一条命令走完「站内搜索 → 取前 N 条 → 逐条落盘 → 索引表」，抖音、B站、小红书、YouTube 实测全通，X 不可用。

依据（2026-11-16 实测）：python ego_fetch.py --search "agent" --platform douyin --limit 5；也可用 "bilibili:agent" 简写。候选与落盘目录写进 search.json，索引表格式与 --digest 一致，看完照旧用 --full 深读挑中的。单条取数是独立子进程，某条失败或超时 300s 只跳过该条。三个坑：①B站搜索页右侧「热搜」卡片也是 /video/ 链接，但没有作者和播放数，曾把「GEN vs BLG」当成第 1 条结果，现按「缺 author 且缺 extra 就丢」过滤；②抖音搜索卡片没有 title/alt/data-e2e，只能按「时长 / 播放量 / 标题+简介 / @作者 / 时间」的固定行序解析，用 img[alt] 取标题会全空、38 条候选一条都不合格；③X 的 f=top 和 f=live 都稳定返回「出错了。请尝试重新加载。」，点三次重试也不恢复，属站点侧限制。

边界：X 只能喂单条链接；B站合集/多P 视频的 duration 是总时长（「全748集」显示 105912s = 29 小时），不能当单条长度判断。
