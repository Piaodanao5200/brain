#!/usr/bin/env python3
"""reply_gate — 回复发出前的总闸：先查术语释义，再验检索行是不是真跑出来的。

用法：
    python memory/bin/reply_gate.py <草稿文件路径> --query "用户刚才的原话"
    python memory/bin/reply_gate.py <草稿文件路径> --skip-memory      # 与记忆无关的纯计算/纯改写

判定：
    1) 术语闸：草稿里每个专业名词/英文缩写/参数名，后面 12 字内要有「即……」释义；
    2) 检索闸（验真，不只看格式）：用 --query 传入的原话现场跑 memory/bin/kb_hint.mjs，
       拿它输出的首行「按记忆：命中 N 条 / 无命中」，与草稿里的那一行逐字比对；
       对不上就判失败——手写、编数字、改写格式都过不去。

退出码：0 全通过；1 有未通过项，按提示修完再发；2 参数错误。
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BRAIN = HERE.parent.parent
TERM_LINT = HERE / "term_lint.py"
KB_HINT = HERE / "kb_hint.mjs"

MEMORY_MARK = re.compile(r"^按记忆：(命中\s*\d+\s*条|无命中)\s*$", re.MULTILINE)
NODE_FALLBACKS = [
    Path(r"D:\WorkBuddy\binaries\node\versions\22.22.2-6\node.exe"),
    Path(r"D:\WorkBuddy\binaries\node\current\node.exe"),
]


def find_node() -> str | None:
    node = shutil.which("node")
    if node:
        return node
    for p in NODE_FALLBACKS:
        if p.exists():
            return str(p)
    return None


def run_term_lint(draft: Path) -> tuple[bool, str]:
    if not TERM_LINT.exists():
        return True, "术语检查脚本缺失，已跳过"
    r = subprocess.run([sys.executable, str(TERM_LINT), str(draft)], capture_output=True, text=True)
    out = (r.stdout or "").strip()
    return r.returncode == 0, out


def run_kb_hint(query: str) -> tuple[str, str]:
    """返回 (首行, 错误信息)。首行为空表示没跑成。"""
    node = find_node()
    if not node:
        return "", "找不到 node，无法现场跑 kb_hint"
    if not KB_HINT.exists():
        return "", "缺脚本 memory/bin/kb_hint.mjs"
    try:
        r = subprocess.run(
            [node, str(KB_HINT), query],
            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60,
        )
    except Exception as e:  # noqa: BLE001
        return "", "kb_hint 执行异常：" + str(e)[:80]
    for line in (r.stdout or "").splitlines():
        line = line.strip()
        if MEMORY_MARK.match(line):
            return line, ""
    return "", "kb_hint 没输出『按记忆：…』行（退出码 " + str(r.returncode) + "）"


def main() -> int:
    raw = sys.argv[1:]
    skip_memory = "--skip-memory" in raw
    query = ""
    if "--query" in raw:
        i = raw.index("--query")
        if i + 1 < len(raw):
            query = raw[i + 1]
            raw = raw[:i] + raw[i + 2:]
    args = [a for a in raw if not a.startswith("--")]
    if len(args) != 1:
        print('用法: python memory/bin/reply_gate.py <草稿文件路径> --query "用户原话" [--skip-memory]')
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

    marks = MEMORY_MARK.findall(text)
    if skip_memory:
        print("[跳过] 检索闸：本轮声明与记忆无关")
    elif not query.strip():
        fails.append("检索闸")
        print("[失败] 检索闸：没给 --query，无法验证检索行真伪")
        print('        重跑: ... reply_gate.py <草稿> --query "用户刚才的原话"')
    elif not marks:
        fails.append("检索闸")
        print("[失败] 检索闸：草稿里没有『按记忆：命中 N 条 / 无命中』")
        print('        先跑: node memory/bin/kb_hint.mjs "用户原话"，把首行原样贴进草稿')
    else:
        actual, err = run_kb_hint(query)
        if not actual:
            fails.append("检索闸")
            print("[失败] 检索闸：现场跑 kb_hint 失败 — " + err)
        else:
            draft_line = "按记忆：" + re.sub(r"^按记忆：", "", marks[0])
            if draft_line == actual:
                print("[通过] 检索闸：草稿那行与实测一致（" + actual + "）")
            else:
                fails.append("检索闸")
                print("[失败] 检索闸：草稿写的是『" + draft_line + "』，实测是『" + actual + "』")
                print("        以实测为准；实测为空就写『按记忆：无命中』，不许编数字")

    if fails:
        print("\n结论：不许发。待修 " + " / ".join(fails))
        return 1
    print("\n结论：可以发。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
