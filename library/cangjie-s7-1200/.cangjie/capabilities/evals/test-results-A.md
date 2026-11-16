# 盲测判分报告 — results-A.jsonl


## power-budget-sizing

| case | expected | selected | 判定 |
|---|---|---|---|
| power-budget-sizing__st-01 | should_trigger | power-budget-sizing | TP |
| power-budget-sizing__st-02 | should_trigger | power-budget-sizing | TP |
| power-budget-sizing__st-03 | should_trigger | power-budget-sizing | TP |
| power-budget-sizing__snt-01 | should_not_trigger | none | TN |
| power-budget-sizing__snt-02 | sibling | online-troubleshooting | OK |
| power-budget-sizing__edge-01 (edge) | 边界 | none | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/1)

## program-structure-decision

| case | expected | selected | 判定 |
|---|---|---|---|
| program-structure-decision__st-01 | should_trigger | program-structure-decision | TP |
| program-structure-decision__st-02 | should_trigger | program-structure-decision | TP |
| program-structure-decision__st-03 | should_trigger | program-structure-decision | TP |
| program-structure-decision__snt-01 | should_not_trigger | none | TN |
| program-structure-decision__snt-02 | sibling | data-consistency | OK |
| program-structure-decision__edge-01 (edge) | 边界 | program-structure-decision | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/1)

## data-consistency

| case | expected | selected | 判定 |
|---|---|---|---|
| data-consistency__st-01 | should_trigger | data-consistency | TP |
| data-consistency__st-02 | should_trigger | data-consistency | TP |
| data-consistency__st-03 | should_trigger | data-consistency | TP |
| data-consistency__snt-01 | should_not_trigger | none | TN |
| data-consistency__snt-02 | sibling | communication-config | OK |
| data-consistency__edge-01 (edge) | 边界 | data-consistency | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/1)

## communication-config

| case | expected | selected | 判定 |
|---|---|---|---|
| communication-config__st-01 | should_trigger | communication-config | TP |
| communication-config__st-02 | should_trigger | communication-config | TP |
| communication-config__st-03 | should_trigger | communication-config | TP |
| communication-config__snt-01 | sibling | online-troubleshooting | OK |
| communication-config__snt-02 | should_not_trigger | none | TN |
| communication-config__edge-01 (edge) | 边界 | communication-config | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/1)

## online-troubleshooting

| case | expected | selected | 判定 |
|---|---|---|---|
| online-troubleshooting__st-01 | should_trigger | online-troubleshooting | TP |
| online-troubleshooting__st-02 | should_trigger | online-troubleshooting | TP |
| online-troubleshooting__st-03 | should_trigger | online-troubleshooting | TP |
| online-troubleshooting__snt-01 | sibling | storage-firmware-maintenance | OK |
| online-troubleshooting__snt-02 | sibling | power-budget-sizing | OK |
| online-troubleshooting__edge-01 (edge) | 边界 | online-troubleshooting | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/2)

## storage-firmware-maintenance

| case | expected | selected | 判定 |
|---|---|---|---|
| storage-firmware-maintenance__st-01 | should_trigger | storage-firmware-maintenance | TP |
| storage-firmware-maintenance__st-02 | should_trigger | storage-firmware-maintenance | TP |
| storage-firmware-maintenance__st-03 | should_trigger | storage-firmware-maintenance | TP |
| storage-firmware-maintenance__snt-01 | sibling | device-replacement | OK |
| storage-firmware-maintenance__snt-02 | sibling | power-budget-sizing | OK |
| storage-firmware-maintenance__edge-01 (edge) | 边界 | storage-firmware-maintenance | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/2)

## device-replacement

| case | expected | selected | 判定 |
|---|---|---|---|
| device-replacement__st-01 | should_trigger | device-replacement | TP |
| device-replacement__st-02 | should_trigger | device-replacement | TP |
| device-replacement__st-03 | should_trigger | device-replacement | TP |
| device-replacement__snt-01 | sibling | storage-firmware-maintenance | OK |
| device-replacement__snt-02 | sibling | online-troubleshooting | OK |
| device-replacement__edge-01 (edge) | 边界 | none | EDGE-OK |

- TP 3 / FP 0 / FN 0 / TN 2
- precision 1.00 / recall 1.00 / **F1 1.00** / 兄弟混淆率 0.00 (0/2)

---

## 汇总（7 skill 合计）

- TP 21 / FP 0 / FN 0 / TN 14
- 微平均 precision 1.000 / recall 1.000 / **F1 1.000**
- 兄弟混淆率 0.000 (0/10)
- 判分 case 数: 42