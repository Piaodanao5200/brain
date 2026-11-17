#!/usr/bin/env python3
"""
md_export.py — 把知识库里的每个文件转成一份 Markdown「原文」

职责边界：
- 只负责「原件 → markdown 全文」，不碰检索、不碰索引。
- 产出的 .md 是**派生物**：删掉重跑即可还原，手改会被覆盖。

引擎按格式分派，不是一把梭：

    pdf 有文本层   pymupdf4llm   保留标题层级与表格，比 markitdown 的纯文本强
    pdf 扫描件     已有 chunks   文字本来就来自 OCR，直接拼，保证「搜到的=看到的」
    image          已有 chunks   同上
    video / audio  已有 chunks   同上（字幕或 whisper 转写结果）
    docx/pptx/xlsx markitdown    本机没有更好的选择
    html / url     markitdown    保留结构
    md / txt       原文复制

这样分派的原因：markitdown 的 PDF 走 pdfminer，只出纯文本、丢表格；它的 OCR 要
tesseract 外部程序、音频转写要云 API，都和「离线、零云依赖」的目标冲突。
"""
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MD_DIR = ROOT / "markdown"
SOURCES = ROOT / "sources"

# 本模块额外支持的格式（kb.py 的 KIND_MAP 里没有，或虽然有但没有解析分支）
EXTRA_KINDS = {
    ".pptx": "pptx", ".ppt": "pptx",
    ".xlsx": "xlsx", ".xls": "xlsx",
    ".csv": "csv",
}

BANNER = "<!-- 派生物：由 kb.py md 生成，手改会被覆盖。要改内容请改原件或重新入库 -->"


# ---------- 通用 ----------

def kind_of(path: Path, kind_map=None):
    suffix = path.suffix.lower()
    if kind_map and suffix in kind_map:
        return kind_map[suffix]
    return EXTRA_KINDS.get(suffix)


def slugify(title: str, limit=40) -> str:
    """文件名安全化。中文原样保留，只清掉文件系统不认的字符和装饰性分隔符。"""
    s = (title or "").strip()
    s = re.sub(r"[·•|｜/]+", "-", s)                 # 「标题 · 副标题」这种分隔
    s = re.sub(r"\s*(?=[\u4e00-\u9fff])|(?<=[\u4e00-\u9fff])\s*", "", s)  # 中文旁的空格直接去掉
    s = re.sub(r'[\\/:*?"<>|\r\n\t]+', "-", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-.")
    return s[:limit] or "untitled"


def md_filename(doc_id: str, title: str) -> str:
    return "%s-%s.md" % (doc_id, slugify(title))


def _frontmatter(meta: dict) -> str:
    lines = ["---"]
    for k, v in meta.items():
        if v is None or v == "":
            continue
        lines.append("%s: %s" % (k, json.dumps(v, ensure_ascii=False) if isinstance(v, str) and (":" in v or v[:1] in "@`'\"#") else v))
    lines.append("---")
    lines.append(BANNER)
    lines.append("")
    return "\n".join(lines)


# ---------- 各引擎 ----------

def _native(path: Path) -> str:
    """md / txt：原样搬运，只把 BOM 和 CRLF 规整掉。"""
    raw = path.read_bytes()
    for enc in ("utf-8-sig", "utf-8", "gbk", "latin-1"):
        try:
            return raw.decode(enc).replace("\r\n", "\n")
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace").replace("\r\n", "\n")


def _markitdown(path_or_url, suffix_hint=""):
    """统一走 markitdown。返回 (text, engine, title)。"""
    from markitdown import MarkItDown

    md = MarkItDown()
    result = md.convert(str(path_or_url))
    text = (result.text_content or "").replace("\r\n", "\n").strip()
    if not text:
        raise ValueError("markitdown 没抽到内容")
    return text, "markitdown", (getattr(result, "title", None) or "").strip()


def _pdf_with_layout(path: Path):
    """有文本层的 PDF：pymupdf4llm 按页输出，保留表格与标题。

    返回 (markdown, npages)；扫描件返回 (None, 0) 交给 chunks 拼。
    """
    import pymupdf4llm
    import pymupdf

    doc = pymupdf.open(str(path))
    if doc.needs_pass:
        doc.close()
        raise ValueError("PDF 有密码，无法提取")
    try:
        npages = len(doc)
        # 文字层判定与 kb.parse_pdf 一致：平均每页不足 30 字按扫描件处理
        sample = min(npages, 5)
        chars = sum(len(doc[i].get_text("text").strip()) for i in range(sample))
        if npages == 0 or chars < 30 * max(sample, 1):
            return None, 0
        pages = pymupdf4llm.to_markdown(str(path), page_chunks=True)
    finally:
        doc.close()

    parts = []
    for i, page in enumerate(pages, 1):
        text = (page.get("text") or "").strip()
        if not text:
            continue
        parts.append("<!-- p.%d -->\n\n%s" % (i, text))
    if not parts:
        return None, 0
    return "\n\n---\n\n".join(parts), npages


def _chunks_to_md(db, doc_id: str, title: str):
    """扫描件 / 图片 / 音视频：文字本来就来自 OCR 或转写，直接用，保证两边一致。"""
    rows = db.execute(
        "SELECT heading,page,text FROM chunks WHERE doc_id=? ORDER BY seq", (doc_id,)
    ).fetchall()
    if not rows:
        raise ValueError("这篇没有可用分块")
    parts, last_head = [], None
    for heading, page, text in rows:
        label = (heading or "").strip()
        if page and label and not label.startswith("第"):
            head = "## %s · 第 %d 页" % (label, page)
        elif page:
            head = "## 第 %d 页" % page
        else:
            head = "## %s" % (label or "正文")
        if head != last_head:
            parts.append(head)
            last_head = head
        parts.append(text.strip())
    return "\n\n".join(parts)


def to_blocks(md: str):
    """把 markdown 切成 kb.py 需要的 (heading, page, text)。

    页码取自 `<!-- p.N -->` 标记（PDF 用 pymupdf4llm 按页输出时插的）。
    空行分段、`#` 开头换标题——和 kb.py 里对纯文本的处理保持一致。
    """
    blocks, buf, heading, page = [], [], "", 0

    def flush():
        nonlocal buf
        if buf:
            blocks.append((heading, page, "\n".join(buf)))
            buf = []

    for line in md.splitlines():
        s = line.strip()
        m = re.match(r"^<!--\s*p\.(\d+)\s*-->$", s)
        if m:
            page = int(m.group(1))
            continue
        m = re.match(r"^<!--\s*Slide number:\s*(\d+)\s*-->$", s)
        if m:
            # pptx：一张幻灯片就是「一页」，顺便在这切开
            flush()
            page = int(m.group(1))
            continue
        if s.startswith("#"):
            flush()
            heading = s.lstrip("#").strip()
            continue
        if not s:
            flush()
            continue
        buf.append(s)
    flush()
    return blocks


# ---------- 主入口 ----------
def convert(path: Path, kind: str, title: str, db=None, doc_id=None):
    """返回 (markdown_text, engine)。失败抛异常，由调用方决定怎么记。"""
    if kind in ("md", "txt"):
        return _native(path), "native"

    if kind == "pdf":
        text, _ = _pdf_with_layout(path)
        if text:
            return text, "pymupdf4llm"
        # 扫描件：文字已由 OCR 入块，直接拼
        return _chunks_to_md(db, doc_id, title), "ocr"

    if kind in ("image", "video", "audio"):
        return _chunks_to_md(db, doc_id, title), "ocr-asr"

    if kind == "html":
        try:
            text, engine, _ = _markitdown(path)
            return text, engine
        except Exception:
            # markitdown 挂了就退回 kb.py 的 TextExtractor（已入块）
            return _chunks_to_md(db, doc_id, title), "html-fallback"

    if kind in ("docx", "pptx", "xlsx", "csv"):
        text, engine, _ = _markitdown(path)
        return text, engine

    text, engine, _ = _markitdown(path)
    return text, engine


def render_doc(db, doc, force=False, quiet=False) -> str:
    """给一篇文档产出 markdown。返回状态字符串：ok / partial / skipped / failed:xxx"""
    doc_id, path, title, kind = doc["id"], Path(doc["path"]), doc["title"] or "", doc["kind"]

    if not path.exists():
        return "failed:原件不存在"

    out = MD_DIR / md_filename(doc_id, title)
    if out.exists() and not force:
        db.execute("UPDATE documents SET md_path=?, md_status=COALESCE(md_status,'ok') WHERE id=?", (str(out), doc_id))
        return "skip"

    try:
        body, engine = convert(path, kind, title, db=db, doc_id=doc_id)
    except SystemExit as e:
        return "failed:%s" % str(e).splitlines()[0][:60]
    except Exception as e:
        msg = str(e).splitlines()[0][:80] if str(e) else e.__class__.__name__
        db.execute("UPDATE documents SET md_status=? WHERE id=?", ("failed:%s" % msg, doc_id))
        db.commit()
        if not quiet:
            print("  ✗ %s  %s" % (doc_id, msg))
        return "failed:%s" % msg

    # 扫描件 / 图片 / 音视频没有版面结构，只有识别出的文字，标 partial
    status = "partial" if engine in ("ocr", "ocr-asr", "html-fallback") else "ok"

    n_pages = len(re.findall(r"<!-- p\.\d+ -->", body))
    try:
        rel = path.relative_to(ROOT).as_posix()   # 入仓用相对路径，换机器也能看懂
    except ValueError:
        rel = path.as_posix()
    # 出处优先用原始来源（URL/绝对路径），没有再退回库内归档路径。
    # doc 是 SELECT * 的 dict，老库未迁移完时可能没这两个键，用 .get 兜底。
    origin = (doc.get("source") or "").strip()
    meta = {
        "id": doc_id,
        "title": title,
        "kind": kind,
        "engine": engine,
        "pages": n_pages or None,
        "source": origin or rel,
        "platform": doc.get("platform") or None,
        "added": doc["added"],
        "generated": time.strftime("%Y-%m-%d %H:%M"),
    }
    if status == "partial":
        meta["note"] = "文字来自 OCR 或语音转写，可能有识别错误，引用前请核对原件"
    MD_DIR.mkdir(parents=True, exist_ok=True)
    text = _frontmatter(meta) + "# %s\n\n%s\n" % (title or path.stem, body.strip())
    # newline="\n"：Windows 上 write_text 默认会写成 CRLF，入 git 后每篇都变成整篇 diff
    out.write_text(text, encoding="utf-8", newline="\n")

    db.execute(
        "UPDATE documents SET md_path=?, md_engine=?, md_status=? WHERE id=?",
        (str(out), engine, status, doc_id),
    )
    db.commit()
    if not quiet:
        tag = {"ok": "✓", "partial": "◐"}.get(status, "·")
        print("  %s %s  %s  %s" % (tag, doc_id, engine, out.name))
    return status


def run(db, mode="missing", doc_id=None, quiet=False):
    """mode: all（全量重转）/ missing（只补缺失）/ retry（只重试失败）"""
    sql = "SELECT * FROM documents"
    params = ()
    if doc_id:
        sql += " WHERE id=?"
        params = (doc_id,)
    rows = [dict(zip([d[0] for d in db.execute(sql, params).description], r))
            for r in db.execute(sql, params).fetchall()]
    if doc_id and not rows:
        print("没有这篇：%s" % doc_id)
        return {}

    stat = {"ok": 0, "partial": 0, "skip": 0, "failed": 0}
    for doc in rows:
        if mode == "missing" and doc.get("md_path") and Path(doc["md_path"]).exists():
            stat["skip"] += 1
            continue
        if mode == "retry" and not (doc.get("md_status") or "").startswith("failed"):
            stat["skip"] += 1
            continue
        r = render_doc(db, doc, force=(mode == "all"), quiet=quiet)
        key = "failed" if r.startswith("failed") else r
        stat[key] = stat.get(key, 0) + 1
    return stat


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import kb

    db = kb.connect()
    mode = sys.argv[1] if len(sys.argv) > 1 else "missing"
    print(run(db, mode))
