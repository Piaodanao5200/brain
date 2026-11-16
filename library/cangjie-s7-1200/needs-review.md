# needs-review.md — 关键条件缺失/来源冲突/尚不能检验的候选

> 不进入 active 能力池。列出具体缺口、补读/询问事项。

```yaml
- id: p06
  title: 功率预算须按 5V 逻辑预算与 24V 传感器预算分别核算
  type: calculation
  merged_from: [p06]
  task_ids: [T01]
  source_evidence:
    - source_id: A5E02486685-AK
      location: "ch4.2 功率预算 p61；引用'计算功率预算' p1779、附录A技术规范 p1535"
  decision: needs_review
  V1_source_sufficiency:
    passed: false
    reason: "正文 p61 只给出'须分别核算 5V/24V 预算、超出加外部电源'的原则与公式骨架（5V余量=CPU5V预算−Σ模块5V需求；24V余量=CPU24V传感器预算−Σ24V负载），但核算必需的数值表——各 CPU 提供的 5V/24V 预算值、各 SM/SB/CM 的 5V 需求量——位于附录A技术规范(p1535)与'计算功率预算'(p1779)。候选文件自带说明明确这些附录数值'未纳入正文，需查 PDF 原表补齐'。"
  V2_executability:
    passed: false
    reason: "换一组具体输入（如 CPU 1214C + 3个SM + 若干24V传感器）无法在仅有正文的情况下算出预算余量并检验是否超预算——缺 CPU 预算数值与模块需求数值，无法给出预期数值/容差。纸面演练在缺数值处被迫停止。"
  V3_task_utility:
    passed: true
    reason: "T01 为 critical 任务，功率预算是硬性设计约束，固化后价值明确；但增益不能替代来源与可执行性验证。"
  gaps:
    - "缺各 CPU 型号的 5V DC 逻辑预算与 24V DC 传感器电源预算数值表（附录A p1535）"
    - "缺各 SM/SB/CM 模块的 5V DC 功率需求数值表（'计算功率预算' p1779 / 附录A）"
    - "缺 24V DC 负载需求的取值与超预算判定阈值（超出即须外部电源的定量边界）"
  actions_to_resolve:
    - "补读 source.md 附录A 技术规范与'计算功率预算'页，取得数值表（注：本次执行时 source.md 被并发清空，待工作区恢复后补读）"
    - "补入 1~2 个完整算例（CPU 型号 + 模块清单 + 24V负载 → 5V/24V 余量 → 是否加外部电源），独立核对数值"
    - "确认 5V 与 24V 两路预算的计量单位（mA/W）与取整规则"
  note: "功率预算决策的'定性路径'已由 f01(verified) 承载；本条仅缺失定量核算能力，不因此否定 f01。"
```

## 补读后的去向

- 若补齐数值表并通过 V2 演练 → 升为 `verified`，作为 T01 的计算型能力候选。
- 若附录原文也无法给出完整数值（如分散在多表、口径不一）→ 维持 `needs_review` 并在交付中明确告知用户 T01 的功率预算无法自动化核算，仅能提供决策框架（f01）与硬约束（p04/p05）。
