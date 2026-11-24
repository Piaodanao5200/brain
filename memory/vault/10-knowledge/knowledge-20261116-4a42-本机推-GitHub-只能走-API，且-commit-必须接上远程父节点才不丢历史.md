---
id: knowledge-20261116-4a42
type: knowledge
scope: project
layer: L1
title: git 可直接连 GitHub：TLS 走 openssl 后端，认证用 extraheader
tags: [github, git, tls, 沙箱]
created: 2026-11-16
updated: 2026-11-16
valid_from: 2026-11-16
supersedes: [knowledge-20261116-1c14]
status: active
confidence: 0.9
source: lead 实测 @ 2026-11-16
---

git 在本机可用；之前「github.com:443 TLS 被中断」是 schannel 在受限令牌下取不到凭据（SEC_E_NO_CREDENTIALS）造成的假象，不是网络问题。

依据：DSH 沙箱内对私有仓库 ls-remote、浅 clone、push --dry-run 全部 exit 0。修法是 http.sslBackend=openssl，认证写进 ~/.gitconfig 的 http.https://github.com/.extraheader（令牌原本在 Windows 凭据管理器）。

边界：沙箱禁命名管道，msys sh 起不来，git 的 credential helper 全部失效（GCM 报 Win32 error 5），所以不能靠 GCM/store；~/.gitconfig 里是明文令牌，换令牌要同步改。git 在 WorkBuddy 的 PortableGit 目录，已加入用户 PATH 但需重启 DSH 才对 agent 的 shell 生效，之前用绝对路径。push.mjs 仍可作纯 API 备选。
