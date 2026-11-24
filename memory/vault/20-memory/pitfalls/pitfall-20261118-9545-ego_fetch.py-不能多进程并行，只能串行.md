---
id: pitfall-20261118-9545
type: pitfall
scope: project
layer: L1
title: ego_fetch.py 不能多进程并行，只能串行
tags: [ego, ego_fetch, 并行, 竞态]
created: 2026-11-18
updated: 2026-11-18
valid_from: 2026-11-18
supersedes: []
status: active
confidence: 0.9
source: 手动写入
aliases: [并行冲突, page, label, not, found, 串行]
---

2026-11-18 实测：三个 ego_fetch.py --search 并行跑（bilibili/xhs/douyin），B站成功、xhs/douyin 全挂，报 Error: page label not found: p3/p4（Managed Pages in task space: none）。三个进程抢了同一个任务空间，页面标签 p2/p3/p4 竞态冲突。串行重试立即通过。这修正了 knowledge-734e 的适用范围：多进程并行提速只对裸 ego-browser 脚本（bootstrap.mjs 模板那类，每进程独立 taskSpace）有效；ego_fetch.py 内部自己管理页面标签，必须串行。另：小红书 --search 搜索环节通但逐条详情「未取到媒体地址」5/5 失败，抖音 5 条中 3 条同类失败——详情步可接受部分失败，不影响搜索索引。
