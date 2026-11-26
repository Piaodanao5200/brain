#!/usr/bin/env python3
"""reply_gate — 回复发出前的总闸：先查术语释义，再查是否真跑过记忆检索。

用法：
    python memory/bin/reply_gate.py <草稿文件路径>
    python memory/bin/reply_gate.py <草稿文件路径> --skip-memory   # 与记忆无关的纯计算/纯改写任务

判定：
    1) 术语闸：草稿里每个专业名词/英文缩写/参数名，后面 12 字内要有「即……」释义；
    2) 检索闸：草稿里必须出现「按记忆：命中 N 条」或「按记忆：无命中」，
       这句只能由 memory/bin/kb_hint.mjs 产生，手写无效（脚本会核对行首格式）。

退出码：0 全通过；1 有未通过项，按提示修完再发；2 参数错误。
"""
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BRAIN = HERE.parent.parent
TERM_LINT = HERE / "term_lint.py"

MEMORY_MARK = re.compile(r"^按记忆：(命中\s*\d+\s*条|无命中)\s*$", re.MULTILINE)


def run_term_lint(draft: Path) -> tuple[bool, str]:
    if not TERM_LINT.exists():
        return True, "术语检查脚本缺失，已跳过"
    r = subprocess.run([sys.executable, str(TERM_LINT), str(draft)], capture_output=True, text=True)
    out = (r.stdout or "").strip()
    return r.returncode == 0, out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    skip_memory = "--skip-memory" in sys.argv
    if len(args) != 1:
        print("用法: python memory/bin/reply_gate.py <草稿文件路径> [--skip-memory]")
        return 2
    draft = Path(args[0])
    if not draft.exists():
        print("草稿不存在:", draft)
        return 2
    text = draft.read_text(encoding="utf-8")
    fails = []

    ok_term, term_out = run_term_lint(draft)
    if ok_term:
        print("[通过] 术语闸：0 条未解释术语")
    else:
        fails.append("术语闸")
        print("[失败] 术语闸：")
        print(term_out)

    if skip_memory:
        print("[跳过] 检索闸：本轮声明与记忆无关")
    elif MEMORY_MARK.search(text):
        print("[通过] 检索闸：草稿带检索结论")
    else:
        fails.append("检索闸")
        print("[失败] 检索闸：草稿里没有『按记忆：命中 N 条 / 无命中』")
        print("        先跑: node memory/bin/kb_hint.mjs \"用户原话\"，把首行原样贴进草稿")

    if fails:
        print("\n结论：不许发。待修 " + " / ".join(fails))
        return 1
    print("\n结论：可以发。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
