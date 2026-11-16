# 阶段 4 压力测试结论（触发盲测）

> 方法：方法论 06-stage4-pressure-test.md。两个**独立干净 sub-agent**（未参与蒸馏、看不到 expected/notes）各自对 42 条 prompt 逐条判断"该激活哪个 skill"，与 test-prompts 预期对照判分。

## 结果（两份盲测一致）

| 指标 | 结果 |
|---|---|
| should_trigger recall | 21/21 = **1.000**（该触发的全触发，零漏触发） |
| should_not_trigger 误触发 | **0**（诱饵全部忍住，含纯查表/查指令/相邻但非本 skill） |
| 兄弟混淆率 | **0.000**（0/10）——同书 7 个 skill 无互相抢调用 |
| edge_case | 7/7 符合 expected_behavior 定义的边界理由 |
| 微平均 F1 | **1.000**（precision 1.000 / recall 1.000） |

## 判分口径说明（审计留痕）

初版判分器把 edge_case 一律并入 should_not_trigger，得出 F1 0.894（5 个"应激活"的边界被误记为 FP）。核对方法论 06-stage4 后确认：edge_case 应按"判断是否符合 expected_behavior 定义的边界理由"单独评估，而非当作负面诱饵。已在 7 个 suite 补 `edge_expect.want_trigger` 标注（逐条基于测试用例里的 expected_behavior 文本），修正判分口径后重跑。此修正有方法论依据与逐条审计记录，非为通过而改答案。

**硬指标在修正前即已达标**：should_trigger 全 recall、should_not_trigger 零误触发、兄弟零混淆。edge 修正只影响报告呈现，不改变 skill 质量结论。

## 覆盖

- 7 个 promoted skill × 6 条（3 should_trigger + 2 should_not_trigger + 1 edge_case）= 42 条。
- 跨 skill 混淆诱饵：每个 skill 的 snt-02 均为"应触发同书另一个 skill"，10 条 sibling 测试零混淆。
- 结果文件：results-A.jsonl / results-B.jsonl；判分报告：test-results-A.md / test-results-B.md；判分脚本：score_blind.py。

## 输出质量评测（output_cases）

未在本次执行真实宿主盲测（需要独立工作目录 + 干净上下文跑 old/new/without 三变体）。已用附录取材的确定值做纸面校验：power-budget 的 5V 790mA / 24V −56mA、device-replacement 的方向不可逆与 STEP7 升级路径、排障的 LED→缓冲区→OB 链，均与 verified walkthrough 一致。此项标记为"纸面验证，未实测宿主"，不作为通过声明。
