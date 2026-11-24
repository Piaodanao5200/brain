---
id: fact-20261119-2150
type: fact
scope: project
layer: L1
title: GitHub Desktop 安装位置：实体在 E 盘，C 盘挂 Junction
tags: [环境, github, junction, 安装位置]
created: 2026-11-19
updated: 2026-11-19
valid_from: 2026-11-19
supersedes: []
status: active
confidence: 0.9
source: 用户口述 + 本机实测 @ 2026-11-19
aliases: [GitHubDesktop, GitHub, 桌面版, GitHub, Desktop, 安装路径]
---

GitHub Desktop 3.6.11 实体在 E:/software/GitHubDesktop，C:/Users/12647/AppData/Local/GitHubDesktop 为 Junction 指向它。依据：2026-11-19 实测，898.2 MB / 1039 文件校验一致，卸载项、Update.exe、快捷方式路径不变且可达。边界：用户数据 %APPDATA%\GitHub Desktop 未迁；Squirrel 升级重建 app-<版本> 目录时若 C 盘长出实体目录，需重做 Junction。
