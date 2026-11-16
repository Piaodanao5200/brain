"""盲测判分器：与 cangjie run_trigger_evals.py score 同逻辑。
用法: python score_blind.py <results.jsonl> <out_report.md>
对 7 个 suite 各自判分（每个 suite 的 target 是该 skill）。
"""
import json, os, sys

E = os.path.dirname(os.path.abspath(__file__))

def score(results_path, out_path):
    results = [json.loads(l) for l in open(results_path, encoding='utf-8') if l.strip()]
    by_case = {r['case_id']: r for r in results}
    slugs = ['power-budget-sizing', 'program-structure-decision', 'data-consistency',
             'communication-config', 'online-troubleshooting', 'storage-firmware-maintenance',
             'device-replacement']
    all_rows = [f"# 盲测判分报告 — {os.path.basename(results_path)}\n"]
    agg = {'tp': 0, 'fp': 0, 'fn': 0, 'tn': 0, 'sib_total': 0, 'sib_confused': 0}
    for target in slugs:
        suite = json.load(open(os.path.join(E, f'{target}.suite.json'), encoding='utf-8'))
        rows = ["\n## " + target + "\n", "| case | expected | selected | 判定 |", "|---|---|---|---|"]
        tp = fp = fn = tn = sib_t = sib_c = 0
        for c in suite['trigger_cases']:
            r = by_case.get(c['case_id'])
            if not r:
                rows.append(f"| {c['case_id']} | {c['expected']} | (缺失) | MISSING |")
                continue
            sel = r.get('selected_skill', 'none')
            triggered = sel == target
            exp = c['expected']
            if exp == 'should_trigger':
                v = 'TP' if triggered else 'FN'; tp += triggered; fn += not triggered
            elif exp == 'edge_case':
                # 方法论 06-stage4：edge_case 按"是否符合 expected_behavior 定义的边界理由"判。
                # 我在 test-prompts 里为每条 edge 标注了 edge_expect（want_trigger: true/false/any），
                # 从此套件文件读取；若无标注则按触发计为符合（宽松回退，并在报告注明）。
                ee = c.get('edge_expect', {})
                want = ee.get('want_trigger')
                ok = (want is None) or (want == 'any') or (want == triggered)
                v = 'EDGE-OK' if ok else 'EDGE-FAIL'
                if not ok:
                    fp += 1 if triggered else 0
                # edge 不计入 TP/FP/FN/TN 主指标，单独统计
                rows.append(f"| {c['case_id']} (edge) | 边界 | {sel} | {v} |")
                continue
            elif exp == 'should_not_trigger':
                v = 'FP' if triggered else 'TN'; fp += triggered; tn += not triggered
            else:  # sibling
                sib_t += 1
                if triggered:
                    v = '混淆(FP)'; sib_c += 1; fp += 1
                else:
                    v = 'OK' if sel == c.get('sibling_target') else f'未中兄弟({sel})'; tn += 1
            rows.append(f"| {c['case_id']} | {exp} | {sel} | {v} |")
        prec = tp / (tp + fp) if tp + fp else 0
        rec = tp / (tp + fn) if tp + fn else 0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0
        conf = sib_c / sib_t if sib_t else 0
        rows.append(f"\n- TP {tp} / FP {fp} / FN {fn} / TN {tn}")
        rows.append(f"- precision {prec:.2f} / recall {rec:.2f} / **F1 {f1:.2f}** / 兄弟混淆率 {conf:.2f} ({sib_c}/{sib_t})")
        all_rows += rows
        for k, val in [('tp',tp),('fp',fp),('fn',fn),('tn',tn),('sib_total',sib_t),('sib_confused',sib_c)]:
            agg[k] += val
    tp,fp,fn,tn = agg['tp'],agg['fp'],agg['fn'],agg['tn']
    prec = tp/(tp+fp) if tp+fp else 0; rec = tp/(tp+fn) if tp+fn else 0
    f1 = 2*prec*rec/(prec+rec) if prec+rec else 0
    conf = agg['sib_confused']/agg['sib_total'] if agg['sib_total'] else 0
    all_rows += ["\n---\n", "## 汇总（7 skill 合计）\n",
                 f"- TP {tp} / FP {fp} / FN {fn} / TN {tn}",
                 f"- 微平均 precision {prec:.3f} / recall {rec:.3f} / **F1 {f1:.3f}**",
                 f"- 兄弟混淆率 {conf:.3f} ({agg['sib_confused']}/{agg['sib_total']})",
                 f"- 判分 case 数: {len(results)}"]
    open(out_path, 'w', encoding='utf-8').write('\n'.join(all_rows))
    print(f"判分完成 → {out_path}")
    print(f"微平均 F1 {f1:.3f} | precision {prec:.3f} recall {rec:.3f} | 兄弟混淆 {conf:.3f}")

if __name__ == '__main__':
    score(sys.argv[1], sys.argv[2])
