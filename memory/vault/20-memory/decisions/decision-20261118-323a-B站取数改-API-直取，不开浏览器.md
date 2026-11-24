---
id: decision-20261118-323a
type: decision
scope: project
layer: L1
title: B站取数改 API 直取，不开浏览器
tags: [bilibili, api, 适配器, 取数]
created: 2026-11-18
updated: 2026-11-18
valid_from: 2026-11-18
supersedes: []
status: active
confidence: 0.9
source: 手动写入
aliases: [bili_api, B站API, wbi签名]
---

2026-11-18 用户拍板并已实施：B站取数弃用 ego 浏览器路线，改走 web API 直取。适配器 D:/collaborative project/skills/zw-summary/adapters/bili_api.py（已入 git c07f389）：api.bilibili.com + wbi 签名（混淆表取自 bilibili-API-collect 权威文档），密钥每日缓存于 videosum/.bili_api_cache.json。产物格式与 ego_fetch 对齐（meta.json/search.json），zw-summary 链路通用。旧 README 记录的『B站 API 裸请求 412』根因是没带 buvid3 cookie，补 buvid3+UA+Referer 即通。字段：7 项统计+标签+评论。边界：未登录评论只给约 3 条热评，导入登录 cookie 可解锁完整楼层。YouTube 早已是 yt-dlp JSON 直取；抖音/TikTok 量大再上 Evil0ctal Docker API；X 用 twikit；小红书保持 ego 装人（逆向有刑事判例，不碰）。
