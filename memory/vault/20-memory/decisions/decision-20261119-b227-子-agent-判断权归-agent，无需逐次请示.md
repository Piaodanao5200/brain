---
id: decision-20261119-b227
type: decision
scope: project
layer: L1
title: 子 agent 判断权归 agent，无需逐次请示
tags: [子agent, 判断权, 授权, 自主]
created: 2026-11-19
updated: 2026-11-19
valid_from: 2026-11-19
supersedes: []
status: active
confidence: 0.9
source: 手动写入
aliases: [子agent自主判断, 派不派, 授权派单]
---

2026-11-19 用户授权：是否派子 agent、派几个、派哪些任务，由主 agent 按 knowledge-f286 七条铁律自行判断并执行，不必逐次问用户。触发条件（满足其一即派）：①长调试预计超 10 轮（报错栈隔离在子会话）；②多源搜集/批量抓取（扇出 3-5，读并行写单线程）；③大中间产物如大文件扫描/全库统计（产物落文件回传指针）。不派：综合决策、与用户对话、改核心文件——写单线程留主会话。子 agent 看不到主会话对话，任务书必须自包含（背景/路径/判据/输出格式四段式）。收回后主 agent 必须核实文件确实改对再汇报；子 agent 卡住则收掉换方案不无限重试。延续 decision-1dc5（并行判断权归 agent）的同一原则。
