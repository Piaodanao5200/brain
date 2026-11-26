#!/usr/bin/env python3
"""术语通俗释义检查（term lint）——发送前跑一遍，0 命中才发。

规则来源：AGENTS.md 通用工作规则第 2 条 + vault/fact-20261118-df07。
凡专业名词、英文缩写、技术词（token、JSON、API、`--full` 等），必须紧跟「即……」大白话释义，风格按 EL5（即给五岁小孩讲）。

判定：词后 12 个字内没有「即」，且同段之前未解释过 → 判漏。
豁免：代码块内、URL 内、纯路径/命令行/参数/文件名内不检查。
行内代码不再整段豁免：工具名、英文缩写即使包了反引号，首次出现仍须带「即……」释义。
退出码：0 = 通过；1 = 有命中。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PARAM = re.compile(r"--[A-Za-z][A-Za-z0-9_-]*")
EXT = re.compile(
    r"\.(?:md|json|py|mjs|js|ts|txt|yaml|yml|xlsx|docx|pdf|sql|jsonl|toml"
    r"|exe|cmd|sh|bat|ps1|csv|tsv|html|htm|xml|log|ipynb|svg|zip|rar|db|sqlite|lock)\b"
)
ENG = re.compile(r"[A-Za-z][A-Za-z0-9_.+-]{2,}")
ACR = re.compile(r"(?<![A-Za-z0-9])[A-Z]{2}(?![A-Za-z0-9])")   # 两个字母的缩写：AI、KB、DB
LVL = re.compile(r"(?<![A-Za-z0-9])[A-Z][0-9](?![A-Za-z0-9])")  # 字母加序号：L1、L2
URLISH = re.compile(r"https?://\S+")
PATHISH = re.compile(r"(?:[A-Za-z]:\\[^\s`\"'）)]*|\\\\[^\s`\"'）)]*)")
HASHISH = re.compile(r"[0-9a-fA-F]{7,40}")
FENCE = re.compile(r"```")
WINDOW = 12

# 常见但往往无需解释的词（仍建议保留，避免噪音过大）
SOFT_SKIP = {"the", "and", "for", "with", "www", "com", "png", "jpg"}
# 两字母缩写里无需解释的例外（只放真正的应答词，别往里塞技术缩写）
ACR_SKIP = {"OK"}


ID_ENTRY = re.compile(r"(?:fact|knowledge|decision|pitfall|todo|session)-\d{8}-[0-9a-f]{4,}")


def _opaque(code: str) -> bool:
    """行内代码是否属于"操作性内容"：路径 / 参数 / 命令行 / 文件名 / 条目编号 / URL。"""
    s = code.strip()
    if not s:
        return True
    if " " in s or "\t" in s:        # 命令行（带参数）
        return True
    if "/" in s or "\\" in s:       # 路径
        return True
    if s.startswith("-"):            # 命令行参数
        return True
    if s.startswith("http://") or s.startswith("https://"):
        return True
    if EXT.search(s):                # 文件名 / 扩展名
        return True
    if ID_ENTRY.fullmatch(s):        # 记忆条目编号
        return True
    return False


def mask(text: str) -> str:
    """把 URL、代码块、路径替换成等长空格，保持行号与偏移不变。"""
    out = text
    for rx in (URLISH, PATHISH):
        for m in rx.finditer(text):
            out = out[: m.start()] + " " * (m.end() - m.start()) + out[m.end():]
    # 行内代码只豁免"操作性内容"：路径、参数、命令行、文件名、条目编号、URL
    # 工具名/英文缩写（如 reply_gate、kb_hint、MCP）不豁免——包反引号不等于解释过
    for m in re.finditer(r"`[^`\n]*`", out):
        inner = m.group()[1:-1].strip()
        if not _opaque(inner):
            continue  # 保留原文，交给后面的术语检查
        out = out[: m.start()] + " " * (m.end() - m.start()) + out[m.end():]
    # 代码块（成对 ``` 之间）
    fence_positions = [m.start() for m in FENCE.finditer(out)]
    for i in range(0, len(fence_positions) - 1, 2):
        s, e = fence_positions[i], fence_positions[i + 1]
        out = out[:s] + " " * (e - s) + out[e:]
    return out


def paragraphs(text: str):
    """按空行切段，返回 [(start_line_no, [line text...])]。"""
    lines = text.splitlines()
    start, buf = 1, []
    for idx, line in enumerate(lines, 1):
        if line.strip() == "":
            if buf:
                yield start, buf
                buf = []
            start = idx + 1
        else:
            if not buf:
                start = idx
            buf.append(line)
    if buf:
        yield start, buf


def check(text: str):
    masked = mask(text)
    mlines = masked.splitlines()
    hits = []

    for start_line, plines in paragraphs(text):
        explained = set()
        flagged = set()
        for offset, line in enumerate(plines):
            lineno = start_line + offset
            mline = mlines[lineno - 1] if lineno - 1 < len(mlines) else line
            spans = [(m.start(), m.end(), m.group())
                     for rx in (PARAM, EXT, ENG, ACR, LVL) for m in rx.finditer(mline)]
            spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
            owned = set()
            for s, e, word in spans:
                if any(s < oe and e > os_ for os_, oe in owned):
                    continue  # 已被更长的匹配覆盖
                owned.add((s, e))
                w = word.rstrip(".,;:，。；）)】”\"")
                if w.lower().lstrip("-") in SOFT_SKIP:
                    continue
                if w in ACR_SKIP:
                    continue
                if "\\" in w or "/" in w:  # 路径
                    continue
                # 提交号（7 位以上十六进制）不算术语
                left, right = s, e
                while left > 0 and line[left - 1].isalnum():
                    left -= 1
                while right < len(line) and line[right].isalnum():
                    right += 1
                if HASHISH.fullmatch(line[left:right]):
                    continue
                if w in explained or w in flagged:
                    continue
                tail = line[e: e + WINDOW]
                if "即" in tail:
                    explained.add(w)
                    continue
                head = line[max(0, s - 3): s]
                sugg = f"{w}（即……）"
                flagged.add(w)
                hits.append({
                    "line": lineno,
                    "term": w,
                    "context": line.strip()[:60],
                    "suggestion": sugg,
                    "prefix": head.strip(),
                })
    return hits


def main() -> int:
    ap = argparse.ArgumentParser(description="检查回复里的术语是否带「即…」释义")
    ap.add_argument("path", nargs="?", help="待检查的文本文件；省略则从 stdin 读")
    ap.add_argument("--json", action="store_true", help="输出 JSON")
    ap.add_argument("--quiet", action="store_true", help="只输出条数")
    argv = [a for a in sys.argv[1:] if a != "--path"]
    args = ap.parse_args(argv)

    if args.path:
        text = Path(args.path).read_text(encoding="utf-8")
    else:
        text = sys.stdin.read()

    hits = check(text)

    if args.json:
        print(json.dumps({"count": len(hits), "hits": hits}, ensure_ascii=False, indent=2))
    elif args.quiet:
        print(len(hits))
    elif hits:
        for h in hits:
            print(f"L{h['line']} | {h['term']} | 建议：{h['suggestion']} | 原文：{h['context']}")
        print(f"\n共 {len(hits)} 条未解释术语")
    else:
        print("OK：0 条未解释术语")

    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
