---
id: pitfall-20261124-5703
type: pitfall
scope: project
layer: L1
title: general_search 的 site: 限定对 B站无效，视频源必须走 zw-summary 适配器
tags: [检索工具, 搜索, site限定, bilibili, 适配器]
created: 2026-11-24
updated: 2026-11-24
valid_from: 2026-11-24
supersedes: []
status: active
confidence: 0.9
source: 用户确认 @ 2026-11-24 会话 38456543506046722
aliases: [site语法失效, 搜索返回空, 站点探测, B站不可用误判]
---

general_search 加 site:bilibili.com 返回空，不代表站点不可用：实测 B站首页 HTTP 200（0.34s），搜索接口返回 code:0 且给 20 条结果，未登录也能查公开数据；空结果只说明该搜索工具没索引到该站。视频类取数一律走 D:\\collaborative project\\skills\\zw-summary\\adapters（B站 bili_api.py、抖音/小红书 ego_fetch.py、YouTube yt_fetch.py），别拿 site: 语法探测站点。边界：其它搜索引擎的 site: 行为未测，不作推广。
