---
id: knowledge-20261117-aafa
type: knowledge
scope: project
title: cangjie 蒸馏与知识库的配合流程：三层分工、攒够判据、反哺走 update
tags: [蒸馏, cangjie, 知识库, skill, 配合流程, 反哺]
created: 2026-11-17
updated: 2026-11-17
valid_from: 2026-11-17
supersedes: []
status: active
confidence: 0.9
source: 2026-11-17 与用户讨论确定；cangjie-skill SKILL.md v2.5.0
---

cangjie-skill 的产出是可执行方法论（skill），不是知识库条目，它不做总结。三层分工各管一段：原文（证据）进 library，kb.py add 自动转 md；结论（是什么）进记忆体 vault，zw-summary 先取转写再人工总结入库；做法（怎么做）走 cangjie 蒸馏成 skill，产物进 D:/collaborative project/skills/ 并 mount 挂载。

蒸馏完成后必须在 vault 记一条「装了什么 skill、什么场景触发」——否则新会话不知道自己有这个能力，永远不会触发。升级判据：一条内容能拆出 ≥3 个可验证执行单元才值得跑蒸馏（流水线 5 个 sub-agent 并行 + 多阶段验证，token 消耗大），短视频/帖子默认只走总结进知识库。

使用端分工：skill 管一般流程（相对静态），知识库管具体事实和踩过的坑（活的）。典型链路：任务触发 skill 给框架 → 需要事实/数据/背景时 kb search / read 查库 → 产出 → 新经验写回 vault。

反哺（知识库反哺 skill）的攒够判据——不是条数而是能否归纳规律，满足其一即可：①同一偏差重复出现（如按 skill 做 5 个方案 3 次在同一步不符实际）；②同类 pitfall ≥3 条且性质相同；③有可当标准答案的成功案例。攒的本质是对错样本：输入（任务）+ skill 建议 X + 实际做了 Y + 结果 Z。因此 pitfall 条目要按三段写，别只写「XX 不行」。

反哺路径：先走 B——攒够后让 agent 走 cangjie 的 update 流程，捞库中案例修订能力卡（步骤/边界/评测段），改动进 skills 仓库 git 可回退。darwin-skill 尚未安装，cangjie 产物评测用例格式与 darwin 兼容，以后想自动化再装即插即用。
