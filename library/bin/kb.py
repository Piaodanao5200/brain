#!/usr/bin/env python3
"""
kb.py — 专业知识库：原文归档 + 分块索引 + 出处可追溯

    python bin/kb.py add <文件或目录>      导入（自动复制到 sources/）
    python bin/kb.py search "关键词"        检索，返回原文片段与出处
    python bin/kb.py stats                 库统计
    python bin/kb.py list [--kind pdf]     列出已入库文档
    python bin/kb.py show <doc_id>         看某篇的目录结构
    python bin/kb.py rm <doc_id>           移除一篇
    python bin/kb.py rebuild               从 sources/ 全量重建索引
    python bin/kb.py md                    给每篇产出 markdown 原文（到 markdown/）
    python bin/kb.py export-md             导出人读的 Markdown 投影到 reading/

支持格式：md / txt / html / docx / pptx / xlsx / csv / pdf（含扫描件，自动 OCR）
         图片 png jpg webp bmp tiff（OCR，原图留 sources/image/）
         视频 mp4 mov mkv avi webm（抽帧 OCR + 语音转写，**媒体原件不留**，识别结果存 sources/video/*.md）
         音频 mp3 wav m4a flac（语音转写，**媒体原件不留**，识别结果存 sources/audio/*.md）

设计取舍：
- 原文（sources/）与索引（store.db）分离。删了 store.db 也能从 sources 重建，原文永远不会被索引逻辑改坏。
- 音视频原件体积大，不入库；只把识别出的文字写成 md 作为「识别原件」留存。代价：无法从原视频重新转写。
- NO_SPLIT=True：整篇一个块（heading 降级为行内标签保留出处），检索命中返回全文；改 False 可切回 TARGET/HARD 分块。
- 中文检索用二元切分（bigram）写进 FTS5，因为 FTS5 默认分词器切不开中文句子。
- 只做关键词检索，不做向量。理由见 README：本机没有 embedding 服务，且上千篇下关键词 + 好分块已足够定位。
- 扫描件与视频是「降级可用」：识别有误差，原文仍保留，引用时以原件为准。
"""
import argparse
import hashlib
import io
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
from html.parser import HTMLParser
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "sources"
INBOX = ROOT / "inbox"
DB = ROOT / "store.db"
TOPICS = SOURCES / ".topics.json"   # sha -> topic，重建索引时回填主题用
META = SOURCES / ".meta.json"       # sha -> {source, platform}，重建索引时回填出处用

TARGET = 450      # 目标块大小（字）
HARD = 1400       # 硬上限
MIN_CHUNK = 40    # 小于此长度的块丢弃（页眉页脚、孤立标题）
NO_SPLIT = False  # True=整篇一个块（不切）；False=按 TARGET/HARD 切。改这里即可切换。

STOP = set("的 了 是 在 和 与 及 对 从 到 为 以 把 被 让 就 都 也 还 又 而 但 或 一个 这个 那个 什么 怎么 如何 为什么 哪些 可以 需要 我们 你们 他们 自己 这样 那样 因为 所以 如果 但是 然后 已经 进行 通过".split())

KIND_MAP = {
    ".md": "md", ".markdown": "md", ".txt": "txt", ".text": "txt",
    ".html": "html", ".htm": "html", ".pdf": "pdf",
    ".docx": "docx", ".doc": "docx",
    ".pptx": "pptx", ".ppt": "pptx",
    ".xlsx": "xlsx", ".xls": "xlsx", ".csv": "csv",
}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff", ".gif"}
VIDEO_EXT = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"}
AUDIO_EXT = {".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg"}
KIND_MAP.update({e: "image" for e in IMAGE_EXT})
KIND_MAP.update({e: "video" for e in VIDEO_EXT})
KIND_MAP.update({e: "audio" for e in AUDIO_EXT})

# 媒体识别参数（可用命令行覆盖）
OCR_DPI = 200        # 扫描件渲染分辨率，低于 150 小字会糊
FRAME_EVERY = 10     # 视频抽帧间隔（秒）
MAX_FRAMES = 150     # 单个视频最多抽多少帧，防止长视频跑飞


class TextExtractor(HTMLParser):
    """从 HTML 抽正文，丢掉 script/style/nav。"""
    BLOCK = {"p", "div", "br", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article", "blockquote", "pre"}
    SKIP = {"script", "style", "noscript", "nav", "footer", "header", "aside", "svg"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.skip = 0
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        if tag == "title":
            self._in_title = True
        if tag in self.BLOCK:
            self.out.append("\n")
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.out.append("\n" + "#" * int(tag[1]) + " ")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        if tag == "title":
            self._in_title = False
        if tag in self.BLOCK:
            self.out.append("\n")

    def handle_data(self, data):
        if self.skip:
            return
        if self._in_title:
            self.title += data.strip()
            return
        t = data.strip()
        if t:
            self.out.append(t)

    def text(self):
        return "".join(self.out)


def _md_export():
    """延迟导入同目录的 md_export.py —— 只有真要用 markitdown / 产 md 时才加载。"""
    here = str(Path(__file__).resolve().parent)
    if here not in sys.path:
        sys.path.insert(0, here)
    import md_export

    return md_export


def _parse_office(path: Path, kind: str):
    """Office / 表格 → markitdown 转 markdown → 按标题切块。

    旧版本这里没有分支，docx 会落进下面的「按 utf-8 读文本」逻辑，
    二进制被当文本解码，入库的是一堆乱码。
    """
    m = _md_export()
    text, _engine, mtitle = m._markitdown(path)
    blocks = m.to_blocks(text)
    if not blocks:
        raise ValueError("没抽到内容（文件可能是空的，或是旧版 .doc/.ppt 二进制格式）")
    return kind, (mtitle or path.stem).strip(), blocks


def strip_frontmatter(text):
    if text.startswith("---"):
        i = text.find("\n---", 3)
        if i != -1:
            return text[i + 4:].lstrip("\n")
    return text


def parse_file(path: Path, dpi=OCR_DPI, interval=FRAME_EVERY):
    """返回 (kind, title, blocks) —— blocks 是 [(heading, page, text)]"""
    kind = KIND_MAP.get(path.suffix.lower())
    if kind is None:
        return None, None, None
    if kind == "pdf":
        return parse_pdf(path, dpi)
    if kind == "image":
        return parse_image(path)
    if kind in ("video", "audio"):
        return parse_media(path, kind, interval)
    if kind in ("docx", "pptx", "xlsx", "csv"):
        return _parse_office(path, kind)

    raw = path.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    if kind == "html":
        p = TextExtractor()
        p.feed(text)
        title = p.title or path.stem
        text = p.text()
    else:
        text = strip_frontmatter(text)
        m = re.search(r"^#\s+(.+)$", text, re.M)
        title = m.group(1).strip() if m else path.stem

    blocks, heading, buf = [], "", []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("#"):
            if buf:
                blocks.append((heading, "\n".join(buf)))
                buf = []
            heading = s.lstrip("#").strip()
            continue
        buf.append(s)
        if sum(len(x) for x in buf) >= TARGET:
            blocks.append((heading, "\n".join(buf)))
            buf = []
    if buf:
        blocks.append((heading, "\n".join(buf)))
    return kind, title, [(h, 0, t) for h, t in blocks]


# ---------- OCR：图片与扫描件 ----------

_OCR_ENGINE = None


def _ocr_engine():
    global _OCR_ENGINE
    if _OCR_ENGINE is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
        except ImportError:
            raise SystemExit(
                "识别图片 / 扫描件需要 OCR 引擎：\n"
                "  python -m pip install rapidocr-onnxruntime\n"
                "（纯 Python + ONNX，不需要另装外部程序；内置中英文模型，离线可用）"
            )
        _OCR_ENGINE = RapidOCR()
    return _OCR_ENGINE


def ocr_lines(source):
    """source 可以是图片字节、路径或 ndarray。返回按阅读顺序排好的文本行。"""
    import numpy as np
    from PIL import Image

    if isinstance(source, (bytes, bytearray)):
        arr = np.asarray(Image.open(io.BytesIO(source)).convert("RGB"))
    elif isinstance(source, (str, Path)):
        arr = np.asarray(Image.open(str(source)).convert("RGB"))
    else:
        arr = source

    out = _ocr_engine()(arr)
    res = out[0] if isinstance(out, tuple) else out
    rows = []
    for item in res or []:
        try:
            box, txt = item[0], str(item[1]).strip()
        except Exception:
            continue
        if not txt:
            continue
        rows.append((box[0][1], box[0][0], txt))
    # 按 y 分桶再按 x 排序，避免多栏文本被拉成乱序
    rows.sort(key=lambda r: (round(float(r[0]) / 20.0), float(r[1])))
    return [t for _, _, t in rows]


def parse_image(path):
    lines = ocr_lines(path.read_bytes())
    if not lines:
        return "image", path.stem, []
    return "image", path.stem, [("图片文字", 0, "\n".join(lines))]


def parse_pdf(path, dpi=OCR_DPI):
    try:
        from pypdf import PdfReader
    except ImportError:
        raise SystemExit(
            "需要 pypdf 才能解析 PDF：\n"
            "  python -m pip install pypdf\n"
            "（纯 Python 包，无需编译）"
        )
    reader = PdfReader(io.BytesIO(path.read_bytes()))
    title = str((reader.metadata or {}).get("/Title") or path.stem).strip()
    pages, total = [], 0
    for i, pg in enumerate(reader.pages, 1):
        try:
            t = pg.extract_text() or ""
        except Exception:
            t = ""
        total += len(t.strip())
        pages.append(("", i, t))

    # 文字层判定：平均每页不足 30 字，按扫描件走 OCR
    if total >= 30 * max(len(pages), 1):
        return "pdf", title, pages
    return "pdf", title, _ocr_pdf(path, dpi, len(pages))


def _ocr_pdf(path, dpi=OCR_DPI, npages=0):
    pm = _pymupdf()
    doc = pm.open(str(path))
    print("  · 未检出文字层 → 按扫描件 OCR（%d 页，%d dpi）" % (len(doc), dpi))
    pages = []
    for i, page in enumerate(doc, 1):
        t0 = time.time()
        pix = page.get_pixmap(dpi=dpi)
        lines = ocr_lines(pix.tobytes("png"))
        pages.append(("OCR 识别", i, "\n".join(lines)))
        print("    第 %d/%d 页 · %d 行 · %.1fs" % (i, len(doc), len(lines), time.time() - t0))
    doc.close()
    return pages


def _pymupdf():
    try:
        import pymupdf
        return pymupdf
    except ImportError:
        pass
    try:
        import fitz
        return fitz
    except ImportError:
        raise SystemExit(
            "渲染扫描件需要 PyMuPDF：\n"
            "  python -m pip install pymupdf"
        )


# ---------- 音视频：抽帧 OCR + 语音转写 ----------

_WHISPER = None
WHISPER_SIZE = "base"   # 可用环境变量 KB_WHISPER=small / medium 提升中文准确率


def _ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    raise SystemExit(
        "处理音视频需要 ffmpeg：\n"
        "  python -m pip install imageio-ffmpeg\n"
        "（会带一个自带 ffmpeg 的可执行文件，不污染系统 PATH）"
    )


def _duration(ff, path):
    try:
        err = subprocess.run([ff, "-i", str(path)], capture_output=True,
                             text=True, errors="replace").stderr
    except Exception:
        return 0.0
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", err)
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def _mmss(sec):
    sec = int(sec or 0)
    return "%02d:%02d" % (sec // 60, sec % 60)


def parse_media(path, kind, interval=FRAME_EVERY):
    ff = _ffmpeg()
    tmp = Path(tempfile.mkdtemp(prefix="kbmedia-"))
    blocks = []
    try:
        subs = _sidecar_subtitles(path)
        if kind == "video":
            blocks.extend(_video_frames(ff, path, tmp, interval))
        if subs:
            blocks.extend(subs)
            print("  · 发现同名字幕文件，直接采用，跳过语音转写")
        else:
            blocks.extend(_audio_blocks(ff, path, tmp))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return kind, path.stem, blocks


def _sidecar_subtitles(path):
    """同名 .srt/.vtt/.txt 字幕优先于语音转写：准确、零成本、带时间轴。"""
    for ext in (".srt", ".vtt", ".txt"):
        p = path.with_suffix(ext)
        if not p.exists():
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue
        text = re.sub(r"\d{2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\S+.*", "", text)
        text = re.sub(r"<[^>]+>", "", text)
        lines = [x.strip() for x in text.splitlines() if x.strip() and not x.strip().isdigit()]
        if not lines:
            continue
        head = lines[0][:40]
        return [("字幕 %s" % ext.lstrip("."), 0, "\n".join(lines))]
    return []


def _video_frames(ff, path, tmp, interval):
    print("  · 抽帧：每 %d 秒一帧" % interval)
    pat = str(tmp / "f_%05d.png")
    cmd = [ff, "-y", "-loglevel", "error", "-i", str(path),
           "-vf", "fps=1/%d,scale=1280:-2" % interval,
           "-frames:v", str(MAX_FRAMES), pat]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print("    ✗ 抽帧失败：%s" % e.stderr.decode("utf-8", "replace")[:200])
        return []
    frames = sorted(tmp.glob("f_*.png"))
    blocks, last, kept = [], "", 0
    for idx, fp in enumerate(frames):
        text = "\n".join(ocr_lines(str(fp))).strip()
        if len(text) < 6:
            continue
        norm = re.sub(r"\s+", "", text)
        if norm == last:
            continue
        last = norm
        blocks.append(("画面 %s" % _mmss(idx * interval), 0, text))
        kept += 1
    print("    抽到 %d 帧 · 有文字 %d 帧" % (len(frames), kept))
    return blocks


def _audio_blocks(ff, path, tmp):
    wav = tmp / "a.wav"
    try:
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(path),
                        "-vn", "-ac", "1", "-ar", "16000", str(wav)],
                       check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print("    ✗ 音频提取失败：%s" % e.stderr.decode("utf-8", "replace")[:160])
        return []
    segs = _transcribe(wav)
    if not segs:
        try:
            import faster_whisper  # noqa: F401
            print("    · 没有识别到语音（静音或纯音乐）")
        except ImportError:
            print("    · 未安装语音转写模型，音频部分已跳过")
            print("      安装：python -m pip install faster-whisper")
        return []
    blocks, buf, start = [], [], None
    for t, txt in segs:
        if start is None:
            start = t
        buf.append(txt)
        if sum(len(x) for x in buf) >= TARGET:
            blocks.append(("口播 %s" % _mmss(start), 0, "\n".join(buf)))
            buf, start = [], None
    if buf:
        blocks.append(("口播 %s" % _mmss(start or 0), 0, "\n".join(buf)))
    print("    转写 %d 句 → %d 段" % (len(segs), len(blocks)))
    return blocks


def _wav_float32(path):
    """读 16k 单声道 wav 成 float32 数组。
    不经过 PyAV：不同版本 av 的 av.open 参数会变，直接用 wave + numpy 最稳。"""
    import wave

    import numpy as np

    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        raw = w.readframes(w.getnframes())
    arr = np.frombuffer(raw, dtype=np.int16).astype("float32") / 32768.0
    if sr != 16000 and len(arr):
        idx = np.linspace(0, len(arr) - 1, max(1, int(len(arr) * 16000 / sr)))
        arr = np.interp(idx, np.arange(len(arr)), arr).astype("float32")
    return arr


def _transcribe(wav):
    global _WHISPER
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return []
    size = os.environ.get("KB_WHISPER", WHISPER_SIZE)
    if _WHISPER is None:
        print("  · 加载语音模型 %s（首次运行需下载）" % size)
        _WHISPER = WhisperModel(size, device="cpu", compute_type="int8")
    try:
        audio = _wav_float32(wav)
        if audio.size < 1600:      # 不足 0.1 秒，直接跳过
            return []
        segs, _info = _WHISPER.transcribe(audio, language="zh",
                                          vad_filter=True, beam_size=1)
        return [(s.start, s.text.strip()) for s in segs if s.text.strip()]
    except Exception as e:
        print("    ✗ 转写失败：%s" % e)
        return []


def to_tokens(text):
    """中文二元切分 + 英文词。FTS5 默认分词器切不开中文，所以自己切好再存。"""
    low = text.lower()
    out = []
    for m in re.finditer(r"[a-z0-9][a-z0-9_.\-]*", low):
        if len(m.group()) > 1:
            out.append(m.group())
    for run in re.findall(r"[\u3400-\u9fff]+", low):
        if len(run) == 1:
            out.append(run)
        for i in range(len(run) - 1):
            bg = run[i:i + 2]
            if bg not in STOP:
                out.append(bg)
    return out


def load_topics():
    """读 sources/.topics.json：sha -> topic。文件不存在或坏了就当空。"""
    try:
        return json.loads(TOPICS.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_topic(sha, topic):
    """把某篇的主题写进 sidecar（不在 store.db 里，rebuild 不丢）。"""
    m = load_topics()
    if topic:
        m[sha] = topic
    else:
        m.pop(sha, None)
    SOURCES.mkdir(parents=True, exist_ok=True)
    TOPICS.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")


def load_meta():
    """读 sources/.meta.json：sha -> {source, platform}。坏了当空。"""
    try:
        return json.loads(META.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_meta(sha, source=None, platform=None):
    """把某篇的出处/平台写进 sidecar（rebuild 不丢）。两个都空则删除该条。"""
    m = load_meta()
    if not source and not platform:
        m.pop(sha, None)
    else:
        rec = m.get(sha, {})
        if source:
            rec["source"] = source
        if platform:
            rec["platform"] = platform
        m[sha] = rec
    SOURCES.mkdir(parents=True, exist_ok=True)
    META.write_text(json.dumps(m, ensure_ascii=False, indent=2), encoding="utf-8")


# URL 域名 -> 平台名。命中第一个即返回。
_URL_PLATFORM = (
    ("bilibili", "B站"), ("b23.tv", "B站"),
    ("douyin", "抖音"), ("xiaohongshu", "小红书"), ("xhslink", "小红书"),
    ("youtube", "YouTube"), ("youtu.be", "YouTube"),
    ("twitter", "X"), ("x.com", "X"),
    ("weixin.qq", "微信公众号"), ("mp.weixin", "微信公众号"),
    ("zhihu", "知乎"), ("github", "GitHub"),
    ("weibo", "微博"), ("kuaishou", "快手"), ("toutiao", "今日头条"),
)


def infer_platform(path: Path, source: str = "", kind: str = ""):
    """从来源 URL / 文件后缀推断平台。推断不出返回 ''（留给 --platform 手填）。"""
    hay = (source or "").lower()
    for needle, name in _URL_PLATFORM:
        if needle in hay:
            return name
    ext = path.suffix.lower()
    by_ext = {
        ".pdf": "PDF", ".docx": "Word", ".doc": "Word", ".pptx": "PPT",
        ".xlsx": "Excel", ".csv": "CSV", ".xls": "Excel",
        ".html": "网页", ".htm": "网页",
        ".png": "图片", ".jpg": "图片", ".jpeg": "图片", ".webp": "图片",
        ".bmp": "图片", ".tiff": "图片",
        ".mp4": "视频", ".mov": "视频", ".mkv": "视频", ".avi": "视频", ".webm": "视频",
        ".mp3": "音频", ".wav": "音频", ".m4a": "音频", ".flac": "音频",
        ".md": "本地文档", ".txt": "本地文档",
    }
    return by_ext.get(ext, "")


def read_frontmatter_meta(path: Path):
    """读 md 头部 frontmatter 里的 source / platform / url / title。
    只认文件开头 '---' 到下一个 '---' 之间，键形如 `key: value`。"""
    out = {}
    try:
        raw = path.read_bytes().decode("utf-8", errors="replace")
    except Exception:
        return out
    if not raw.startswith("---"):
        return out
    end = raw.find("\n---", 3)
    if end == -1:
        return out
    for line in raw[3:end].splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        k, v = k.strip().lower(), v.strip().strip("'\"")
        if k in ("source", "url", "platform", "标题"):
            out[k] = v
    return out


def connect():
    db = sqlite3.connect(DB)
    db.execute("PRAGMA journal_mode=WAL")
    db.executescript("""
    CREATE TABLE IF NOT EXISTS documents(
      id TEXT PRIMARY KEY, path TEXT NOT NULL, title TEXT, kind TEXT,
      size INTEGER, mtime TEXT, sha TEXT UNIQUE, nchunks INTEGER DEFAULT 0, added TEXT
    );
    CREATE TABLE IF NOT EXISTS chunks(
      id INTEGER PRIMARY KEY AUTOINCREMENT, doc_id TEXT NOT NULL, seq INTEGER,
      heading TEXT, page INTEGER, start INTEGER, text TEXT NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(tokens);
    CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(doc_id);
    """)
    _migrate(db)
    return db


def _migrate(db):
    """给老库补列。幂等，每次 connect 都会跑一遍。"""
    have = {r[1] for r in db.execute("PRAGMA table_info(documents)")}
    for col, decl in (
        ("md_path", "TEXT"),      # markdown/xxx.md 的绝对路径
        ("md_engine", "TEXT"),    # pymupdf4llm / markitdown / ocr / native
        ("md_status", "TEXT"),    # ok / partial / failed:原因
        ("topic", "TEXT"),        # 主题分类，如 PLC / AI大模型（导入时 --topic 或事后 topic 命令设置）
        ("source", "TEXT"),       # 原始出处：URL 或本地绝对路径（区别于 path=库内归档路径）
        ("platform", "TEXT"),     # 来源平台：B站/抖音/小红书/YouTube/PDF/本地文件…
    ):
        if col not in have:
            db.execute("ALTER TABLE documents ADD COLUMN %s %s" % (col, decl))
    db.commit()


def merge_blocks(blocks, kind=None):
    """NO_SPLIT 模式：把整篇 blocks 合成一个文本块，保留 heading 作段落分隔。
    heading（页码/画面时间点/OCR 标记）降级为行内标签，不丢出处线索。"""
    parts = []
    for heading, page, text in blocks:
        body = (text or "").strip()
        if not body:
            continue
        if heading:
            parts.append("[%s]\n%s" % (heading, body))
        elif page:
            parts.append("[第 %d 页]\n%s" % (page, body))
        else:
            parts.append(body)
    return "\n\n".join(parts)


def min_block_len(heading, kind=None):
    """OCR / 转写 / Office 来的块天然短（一页截图可能只有一行字、一份 PPT 的一个要点
    只有几个字），不能按正文阈值丢弃，否则整篇会被判成「没抽到文本」。"""
    if kind in ("docx", "pptx", "xlsx", "csv"):
        return 6
    tag = (heading or "").split(" ")[0]
    return 6 if tag in ("OCR", "画面", "口播", "图片文字", "字幕") else MIN_CHUNK


def file_sha(path, buf=1 << 20):
    """流式计算哈希，避免整段视频被读进内存。"""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for blk in iter(lambda: f.read(buf), b""):
            h.update(blk)
    return h.hexdigest()


def recognized_md(title, blocks, source="", platform="", added=""):
    """把音视频识别结果拼成一份可读 md，作为「识别原件」存进 sources/。
    头部写元数据快照（标题/来源/平台/采集日期），rebuild 时不再重生成、sha 稳定。"""
    def y(v):
        return json.dumps(v or "", ensure_ascii=False)
    lines = ["---",
             "title: %s" % y(title),
             "source: %s" % y(source),
             "platform: %s" % y(platform),
             "captured: %s" % (added or ""),
             "---", "", "# %s" % (title or ""), ""]
    seen = None
    for heading, page, text in blocks:
        body = (text or "").strip()
        if not body:
            continue
        h = heading or (("第 %d 页" % page) if page else "")
        if h and h != seen:
            lines += ["## %s" % h, ""]
            seen = h
        lines += [body, ""]
    return "\n".join(lines).rstrip() + "\n"


def add_file(db, path: Path, copy=True, quiet=False, dpi=OCR_DPI, interval=FRAME_EVERY,
             topic=None, source=None, platform=None):
    path = path.resolve()
    kind = KIND_MAP.get(path.suffix.lower())
    if kind is None:
        return None

    # 重建时遇到 sources/video|audio/*.md：这是当初的「识别原件」，恢复其媒体类型，
    # 别再当普通 md 也别重跑 OCR/转写（内容已经在里面了）。
    recognized_media = None
    if kind == "md" and path.parent.name in ("video", "audio") and SOURCES in path.parents:
        recognized_media = path.parent.name
    # 媒体原件导入：不保留媒体文件，改写识别 md
    media_import = kind in ("video", "audio") and copy and recognized_media is None

    try:
        p_kind, title, blocks = parse_file(path, dpi, interval)
    except SystemExit:
        raise
    except Exception as e:
        print("  ✗ 解析失败 %s: %s" % (path.name, e))
        return None

    if not blocks:
        print("  ✗ 没抽到文本：%s（图片/扫描件需文字能识别；视频需有字幕或口播）" % path.name)
        return None

    if recognized_media:
        kind = recognized_media

    now = time.strftime("%Y-%m-%d %H:%M")
    added_day = time.strftime("%Y-%m-%d", time.localtime(path.stat().st_mtime))

    # --- 来源/平台：显式参数 > frontmatter > sidecar(按 sha) > 自动推断 ---
    fm = read_frontmatter_meta(path)
    exp_source = source or fm.get("source") or fm.get("url")
    exp_platform = platform or fm.get("platform")

    # sha：媒体用「识别 md」内容算（原件不留，内容寻址保证重建一致）；其余用原件。
    # 识别 md 头部此时就要定稿，所以先用 exp_* / 推断生成，重建时该 md 已存在不再重生成。
    md_text = None
    if media_import:
        base_source = exp_source or str(path)
        base_platform = exp_platform or infer_platform(path, base_source, kind)
        md_text = recognized_md(title, blocks, base_source, base_platform, added_day)
        sha = hashlib.sha256(md_text.encode("utf-8")).hexdigest()
    else:
        sha = file_sha(path)
        base_source = exp_source or str(path)
        base_platform = exp_platform or infer_platform(path, base_source, kind)

    meta_rec = load_meta().get(sha, {})
    # 显式参数最优先；其次 sidecar（meta 命令改过的有效值，rebuild 不丢）；再 frontmatter；最后推断
    source_final = source or meta_rec.get("source") or exp_source or base_source
    platform_final = platform or meta_rec.get("platform") or exp_platform or base_platform

    # 没显式给主题时，从 sidecar 回填（rebuild / 重新导入都能保住主题）
    if not topic:
        topic = load_topics().get(sha)

    row = db.execute("SELECT id, topic, source, platform FROM documents WHERE sha=?", (sha,)).fetchone()
    if row:
        # 重复导入：只补显式给出的元数据，不重复入库
        sets, vals = [], []
        if topic and topic != row[1]:
            sets.append("topic=?"); vals.append(topic); save_topic(sha, topic)
        if source and source != row[2]:
            sets.append("source=?"); vals.append(source)
        if platform and platform != row[3]:
            sets.append("platform=?"); vals.append(platform)
        if sets:
            db.execute("UPDATE documents SET %s WHERE id=?" % ",".join(sets), vals + [row[0]])
            if source or platform:
                save_meta(sha, source_final, platform_final)
            db.commit()
            if not quiet:
                print("  已存在，补元数据: %s" % row[0])
        elif not quiet:
            print("  跳过（内容相同，已存在）: %s" % row[0])
        return None

    doc_id = "%s-%s" % (kind, sha[:10])

    stored = path
    if copy:
        sub = SOURCES / kind
        sub.mkdir(parents=True, exist_ok=True)
        if media_import:
            # 只留识别文档，不留 mp4/mp3/mov 原件
            stored = sub / ("%s_%s.md" % (sha[:8], path.stem))
            if not stored.exists():
                # 用 bytes 写：Windows 下 write_text 会把 \n 转 \r\n，
                # 导致重建时 file_sha 算出的 sha 与这里对不上（doc_id 漂移）
                stored.write_bytes(md_text.encode("utf-8"))
        else:
            stored = sub / ("%s_%s" % (sha[:8], path.name))
            if not stored.exists():
                shutil.copy2(path, stored)

    size = stored.stat().st_size if copy else path.stat().st_size
    db.execute(
        "INSERT INTO documents(id,path,title,kind,size,mtime,sha,nchunks,added,topic,source,platform) "
        "VALUES(?,?,?,?,?,?,?,0,?,?,?,?)",
        (doc_id, str(stored), title, kind, size, added_day, sha, now, topic,
         source_final, platform_final),
    )
    save_meta(sha, source_final, platform_final)

    n = 0
    pos = 0
    # 检索前缀：把标题+主题的词拼进每块的索引词（只进 FTS，不改正文），
    # 这样块被单独命中时也知道出自哪篇——"卡片顶上贴书名"。
    prefix_toks = " ".join(to_tokens("%s %s" % (title, topic or "")))
    if NO_SPLIT:
        # 整篇一个块；heading 作为行内标签保留出处线索
        whole = merge_blocks(blocks, kind)
        if whole.strip():
            cur = db.execute(
                "INSERT INTO chunks(doc_id,seq,heading,page,start,text) VALUES(?,?,?,?,?,?)",
                (doc_id, 0, "", 0, 0, whole),
            )
            db.execute("INSERT INTO chunks_fts(rowid,tokens) VALUES(?,?)",
                       (cur.lastrowid, (prefix_toks + " " if prefix_toks else "") + " ".join(to_tokens(whole))))
            n = 1
    else:
        for seq, (heading, page, text) in enumerate(blocks):
            body = text.strip()
            if len(body) < min_block_len(heading, kind):
                continue
            # 超长块按 HARD 再切
            pieces = [body] if len(body) <= HARD else [body[i:i + HARD] for i in range(0, len(body), HARD)]
            for piece in pieces:
                cur = db.execute(
                    "INSERT INTO chunks(doc_id,seq,heading,page,start,text) VALUES(?,?,?,?,?,?)",
                    (doc_id, seq, heading or "", page or 0, pos, piece),
                )
                db.execute("INSERT INTO chunks_fts(rowid,tokens) VALUES(?,?)",
                           (cur.lastrowid, (prefix_toks + " " if prefix_toks else "") + " ".join(to_tokens(piece))))
                pos += len(piece)
                n += 1
    db.execute("UPDATE documents SET nchunks=? WHERE id=?", (n, doc_id))
    if topic:
        save_topic(sha, topic)
    db.commit()

    # 产出一份 markdown 原文。失败的照常入库、照常可检索，只记 md_status。
    _export_md(db, doc_id, quiet=quiet)

    if not quiet:
        print("  ✓ %s  →  %s  %d 块  %s" % (path.name[:50], doc_id, n, title[:40]))
    return doc_id


def _doc_row(db, doc_id):
    cur = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,))
    row = cur.fetchone()
    if not row:
        return None
    return dict(zip([d[0] for d in cur.description], row))


def _export_md(db, doc_id, quiet=False):
    """给一篇文档产 markdown。任何失败都不许把入库流程带崩。"""
    try:
        m = _md_export()
        doc = _doc_row(db, doc_id)
        if doc:
            m.render_doc(db, doc, quiet=quiet)
    except SystemExit as e:
        print("  · markdown 未生成：%s" % str(e).splitlines()[0][:70])
    except Exception as e:
        print("  · markdown 未生成：%s" % (str(e).splitlines()[0][:70] if str(e) else type(e).__name__))


def cmd_add(args):
    targets = []
    for t in args.paths:
        p = Path(t)
        if p.is_dir():
            for f in p.rglob("*"):
                if f.is_file() and f.suffix.lower() in KIND_MAP:
                    targets.append(f)
        elif p.is_file():
            targets.append(p)
        else:
            print("跳过不存在的路径: %s" % t)
    if not targets:
        return
    db = connect()
    ok = 0
    for p in sorted(set(targets)):
        if KIND_MAP.get(p.suffix.lower()) is None:
            continue
        if add_file(db, p, copy=not args.no_copy,
                    dpi=getattr(args, "dpi", OCR_DPI),
                    interval=getattr(args, "interval", FRAME_EVERY),
                    topic=getattr(args, "topic", None),
                    source=getattr(args, "source", None),
                    platform=getattr(args, "platform", None)):
            ok += 1
    print("\n导入 %d 篇，跳过 %d 个" % (ok, len(targets) - ok))


def cmd_sync(args):
    """把 inbox/ 里的文件全部入库，成功的原件删掉（原文已复制进 sources/）。
    解析失败的留在原处，方便你看是哪一篇出了问题。"""
    db = connect()
    INBOX.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in INBOX.rglob("*") if p.is_file() and not p.name.startswith("."))
    if not files:
        print("inbox 是空的。把 PDF / 网页 / md 丢进 %s 再跑一次。" % INBOX)
        return

    added = dup = failed = 0
    problems = []
    for p in files:
        if KIND_MAP.get(p.suffix.lower()) is None:
            print("  · 跳过（不支持 %s）: %s" % (p.suffix or "无扩展名", p.name))
            problems.append((p, "格式不支持"))
            failed += 1
            continue
        try:
            sha = file_sha(p)
        except Exception as e:
            problems.append((p, "读取失败 %s" % e))
            failed += 1
            continue
        if db.execute("SELECT 1 FROM documents WHERE sha=?", (sha,)).fetchone():
            print("  = 已存在，跳过: %s" % p.name[:60])
            p.unlink()
            dup += 1
            continue
        if add_file(db, p, copy=True, dpi=getattr(args, "dpi", OCR_DPI),
                    interval=getattr(args, "interval", FRAME_EVERY),
                    topic=getattr(args, "topic", None),
                    source=getattr(args, "source", None),
                    platform=getattr(args, "platform", None)):
            p.unlink()
            added += 1
        else:
            problems.append((p, "没抽到文本"))
            failed += 1

    print("\n入库 %d 篇 · 重复跳过 %d 篇 · 失败 %d 篇" % (added, dup, failed))
    if problems:
        print("失败的文件仍留在 inbox：")
        for p, why in problems:
            print("  - %s（%s）" % (p.name, why))
        print("提示：图片与扫描件需要文字较清晰；视频需要口播清晰或带同名字幕文件。")


def build_expr(q, mode):
    terms = to_tokens(q)
    seen, uniq = set(), []
    for t in terms:
        if t not in seen:
            seen.add(t)
            uniq.append(t)
    uniq = uniq[:24]
    if not uniq:
        return None
    joiner = " AND " if mode == "and" else " OR "
    return joiner.join('"%s"' % t for t in uniq)


def do_search(db, q, k=8, kind=None, topic=None, platform=None):
    for mode in ("and", "or"):
        expr = build_expr(q, mode)
        if not expr:
            return []
        sql = """
        SELECT c.doc_id, c.seq, c.heading, c.page, c.text, d.title, d.path, d.kind, d.topic,
               d.source, d.platform,
               bm25(chunks_fts) AS score
        FROM chunks_fts JOIN chunks c ON c.id = chunks_fts.rowid
        JOIN documents d ON d.id = c.doc_id
        WHERE chunks_fts MATCH ?
        """
        params = [expr]
        if kind:
            sql += " AND d.kind = ?"
            params.append(kind)
        if topic:
            sql += " AND d.topic = ?"
            params.append(topic)
        if platform:
            sql += " AND d.platform = ?"
            params.append(platform)
        sql += " ORDER BY score LIMIT ?"
        params.append(k)
        try:
            rows = db.execute(sql, params).fetchall()
        except sqlite3.OperationalError as e:
            print("查询出错:", e)
            return []
        if rows:
            return rows
    return []


def snippet(text, q, width=140):
    terms = [t for t in to_tokens(q) if len(t) >= 2]
    low = text.lower()
    at = -1
    for t in terms:
        i = low.find(t)
        if i != -1 and (at == -1 or i < at):
            at = i
    if at == -1:
        return text[:width * 2] + ("…" if len(text) > width * 2 else "")
    s = max(0, at - width // 2)
    return ("…" if s else "") + text[s:s + width * 2] + ("…" if len(text) > s + width * 2 else "")


def cmd_search(args):
    q = " ".join(args.query)
    db = connect()
    t0 = time.time()
    rows = do_search(db, q, args.k, args.kind,
                     getattr(args, "topic", None), getattr(args, "platform", None))
    ms = (time.time() - t0) * 1000

    # --json：供 hook / 其他程序调用，只输出结构化结果
    if getattr(args, "json", False):
        out = []
        for doc_id, seq, heading, page, text, title, path, kind, topic, origin, platform, score in rows:
            out.append({
                "doc_id": doc_id, "seq": seq, "heading": heading, "page": page,
                "title": title, "path": path, "kind": kind, "topic": topic,
                "source": origin, "platform": platform,
                "score": round(score, 4), "snippet": snippet(text, q, 120),
            })
        print(json.dumps({"query": q, "ms": round(ms, 1), "hits": out}, ensure_ascii=False))
        return

    if not rows:
        print("没有命中「%s」（%.0f ms）" % (q, ms))
        print("换个更短、更具体的关键词；或先确认这篇文档已入库。")
        return
    print("命中 %d 段（%.0f ms）\n" % (len(rows), ms))
    for i, (doc_id, seq, heading, page, text, title, path, kind, topic, origin, platform, score) in enumerate(rows, 1):
        loc = []
        if page:
            loc.append("第 %d 页" % page)
        if heading:
            loc.append(heading[:30])
        loc.append("第 %d 段" % (seq + 1))
        print("%d. %s" % (i, title[:70]))
        tags = "".join("[%s] " % t for t in (topic, platform) if t)
        print("   %s%s · %s · %s" % (tags, kind.upper(), " · ".join(loc), doc_id))
        print("   出处: %s" % (origin or path))
        print("   %s" % snippet(text, q))
        print()


def cmd_stats(args):
    db = connect()
    docs = db.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    chunks = db.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    chars = db.execute("SELECT COALESCE(SUM(LENGTH(text)),0) FROM chunks").fetchone()[0]
    size = sum(f.stat().st_size for f in ROOT.rglob("*") if f.is_file()) if ROOT.exists() else 0
    print("文档 %d 篇 · 片段 %d 段 · 正文 %s 字 · 磁盘 %.1f MB"
          % (docs, chunks, format(chars, ","), size / 1048576))
    if docs:
        print("\n按格式：")
        for kind, n, c in db.execute(
                "SELECT kind, COUNT(*), SUM(nchunks) FROM documents GROUP BY kind ORDER BY 2 DESC"):
            print("  %-6s %3d 篇 · %6d 段" % (kind, n, c or 0))
        print("\n按主题：")
        for topic, n, c in db.execute(
                "SELECT COALESCE(NULLIF(topic,''),'(未分类)'), COUNT(*), SUM(nchunks) "
                "FROM documents GROUP BY COALESCE(NULLIF(topic,''),'(未分类)') ORDER BY 2 DESC"):
            print("  %-16s %3d 篇 · %6d 段" % (topic, n, c or 0))
        print("\n最近导入：")
        for doc_id, title, n, added in db.execute(
                "SELECT id, title, nchunks, added FROM documents ORDER BY added DESC LIMIT 5"):
            print("  %s  %-50s %3d 段  %s" % (doc_id, title[:50], n, added))


def cmd_list(args):
    db = connect()
    sql = "SELECT id, title, kind, nchunks, path, topic, source, platform FROM documents"
    params = []
    cond = []
    if args.kind:
        cond.append("kind=?")
        params.append(args.kind)
    if getattr(args, "topic", None):
        cond.append("topic=?")
        params.append(args.topic)
    if getattr(args, "platform", None):
        cond.append("platform=?")
        params.append(args.platform)
    if cond:
        sql += " WHERE " + " AND ".join(cond)
    sql += " ORDER BY added DESC"
    for doc_id, title, kind, n, path, topic, origin, platform in db.execute(sql, params):
        tag = "".join("[%s]" % t for t in (topic, platform) if t)
        tag = (tag + " ") if tag else ""
        print("%s  %-6s %3d 段  %s%s" % (doc_id, kind, n, tag, title[:60]))


def cmd_show(args):
    db = connect()
    row = db.execute("SELECT title, kind, nchunks, path, added, topic, source, platform "
                     "FROM documents WHERE id=?", (args.doc_id,)).fetchone()
    if not row:
        print("没有这篇文档:", args.doc_id)
        return
    topic_line = ("主题: %s\n" % row[5]) if row[5] else "主题: (未分类)\n"
    source_line = "来源: %s\n" % (row[6] or "(自动推断路径)")
    platform_line = "平台: %s\n" % (row[7] or "(未标注)")
    print("%s\n%s · %d 段 · 入库 %s\n%s%s%s原文: %s\n"
          % (row[0], row[1].upper(), row[2], row[4], topic_line, source_line, platform_line, row[3]))
    for seq, heading, page, n in db.execute(
            "SELECT seq, heading, page, LENGTH(text) FROM chunks WHERE doc_id=? ORDER BY seq LIMIT 40", (args.doc_id,)):
        loc = ("第 %d 页" % page) if page else ""
        print("  %3d  %-28s %s  %d 字" % (seq + 1, (heading or "-")[:28], loc, n))


def cmd_topic(args):
    """给已入库文档设置/清除主题，或按主题列出文档。"""
    db = connect()
    action = args.action
    if action == "list":
        print("按主题：")
        for topic, n in db.execute(
                "SELECT COALESCE(NULLIF(topic,''),'(未分类)'), COUNT(*) "
                "FROM documents GROUP BY COALESCE(NULLIF(topic,''),'(未分类)') ORDER BY 2 DESC"):
            print("  %-16s %3d 篇" % (topic, n))
        if getattr(args, "verbose", False):
            t = args.topic
            sql = "SELECT id, title FROM documents"
            params = []
            if t:
                sql += " WHERE topic=?"
                params.append(t)
            elif getattr(args, "uncategorized", False):
                sql += " WHERE topic IS NULL OR topic=''"
            sql += " ORDER BY added DESC"
            print("\n文档：")
            for doc_id, title in db.execute(sql, params):
                print("  %s  %s" % (doc_id, title[:60]))
        return
    doc_id = args.doc_id
    row = db.execute("SELECT title, sha FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        print("没有这篇文档:", doc_id)
        return
    title, sha = row
    if action == "clear":
        db.execute("UPDATE documents SET topic=NULL WHERE id=?", (doc_id,))
        save_topic(sha, None)
        db.commit()
        print("已清除主题: %s  %s" % (doc_id, title[:50]))
    else:  # set
        topic = " ".join(args.topic).strip()
        db.execute("UPDATE documents SET topic=? WHERE id=?", (topic, doc_id))
        save_topic(sha, topic)
        db.commit()
        print("已设主题「%s」: %s  %s" % (topic, doc_id, title[:50]))


def cmd_meta(args):
    """事后查看/修改某篇文档的来源(source)和平台(platform)。改动写进 DB+sidecar，rebuild 不丢。"""
    db = connect()
    action = args.meta_action
    if action == "list":
        print("按平台：")
        for platform, n in db.execute(
                "SELECT COALESCE(NULLIF(platform,''),'(未标注)'), COUNT(*) "
                "FROM documents GROUP BY COALESCE(NULLIF(platform,''),'(未标注)') ORDER BY 2 DESC"):
            print("  %-16s %3d 篇" % (platform, n))
        return
    doc_id = args.doc_id
    row = db.execute("SELECT title, sha, source, platform FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        print("没有这篇文档:", doc_id)
        return
    title, sha, cur_source, cur_platform = row
    if action == "show" or not getattr(args, "set", None):
        print("来源: %s\n平台: %s" % (cur_source or "(自动推断路径)", cur_platform or "(未标注)"))
        return
    sets, vals = [], []
    for key, val in args.set:
        if key not in ("source", "platform"):
            print("忽略未知字段:", key); continue
        sets.append("%s=?" % key); vals.append(val)
    if not sets:
        return
    db.execute("UPDATE documents SET %s WHERE id=?" % ",".join(sets), vals + [doc_id])
    new = db.execute("SELECT source, platform FROM documents WHERE id=?", (doc_id,)).fetchone()
    save_meta(sha, new[0], new[1])
    db.commit()
    print("已更新出处: %s  %s\n  来源: %s\n  平台: %s"
          % (doc_id, title[:40], new[0] or "(自动推断路径)", new[1] or "(未标注)"))


def cmd_rm(args):
    db = connect()
    row = db.execute("SELECT path, md_path, sha FROM documents WHERE id=?", (args.doc_id,)).fetchone()
    if not row:
        print("没有这篇文档:", args.doc_id)
        return
    db.execute("DELETE FROM chunks_fts WHERE rowid IN (SELECT id FROM chunks WHERE doc_id=?)", (args.doc_id,))
    db.execute("DELETE FROM chunks WHERE doc_id=?", (args.doc_id,))
    db.execute("DELETE FROM documents WHERE id=?", (args.doc_id,))
    save_topic(row[2], None)
    if args.purge:
        save_meta(row[2], None, None)
    db.commit()

    # markdown 是派生物，随条目一起清掉；原件在 sources/，随时可重转
    if row[1]:
        mp = Path(row[1])
        if mp.exists():
            mp.unlink()
            print("已删除 markdown:", mp.name)

    if args.purge:
        p = Path(row[0])
        if p.exists() and SOURCES in p.parents:
            p.unlink()
            print("已删除原文:", p)
            print("已从索引移除:", args.doc_id)
            return
    print("已从索引移除:", args.doc_id, "（原文仍在 sources/，加 --purge 一并删除）")


def cmd_rebuild(args):
    if DB.exists() and not args.force:
        print("store.db 已存在。重建会清空索引，确认请加 --force")
        return
    if DB.exists():
        DB.unlink()
    db = connect()
    for p in sorted(SOURCES.rglob("*")):
        if p.is_file() and KIND_MAP.get(p.suffix.lower()):
            add_file(db, p, copy=False, quiet=True)
    cmd_stats(args)


VAULT = ROOT.parent / "memory" / "vault"


def cmd_pending(args):
    """列出已入库但记忆体还没有结论条目的资料。

    判定依据：vault 条目正文或 source 字段里出现 markdown/<文件名> 的引用。
    结论条目写入时正文末尾加 <sub>出处：markdown/<文件名></sub>，本命令
    下次就不再列它。拟结论由 agent 读全文后进行，用户点头才写入——
    不自动生成（宁可缺失，不能污染）。
    """
    db = connect()
    docs = db.execute(
        "SELECT id,title,kind,added,md_path,nchunks FROM documents ORDER BY added DESC"
    ).fetchall()

    cited = set()
    if VAULT.exists():
        for f in VAULT.rglob("*.md"):
            text = f.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"markdown/([^\s`)\]]+\.md)", text):
                cited.add(m.group(1))

    rows = []
    for doc_id, title, kind, added, md_path, n in docs:
        if not md_path:
            continue  # 还没产出 md 的（转换失败），不在待出结论范围
        if Path(md_path).name in cited:
            continue
        rows.append((doc_id, title or "(无标题)", kind, (added or "")[:10], md_path, n))

    if args.quiet:
        print(len(rows))
        return

    if not rows:
        print("✓ 所有资料都有结论条目")
        return
    print("待出结论 %d 篇：" % len(rows))
    for doc_id, title, kind, added, md_path, n in rows:
        print("  %s  [%s] %s  (%s)" % (doc_id, kind, title, added))
        print("    全文: %s  (%d 段)" % (md_path, n))
    print()
    print("流程：agent 读全文 → 拟结论草稿 → 用户点头 → kb.mjs new 写入，")
    print("正文末尾加一行 <sub>出处：markdown/<文件名></sub>。")


def cmd_export(args):
    """把索引里的分块导出成人可读的 Markdown，供 Obsidian / Git 使用。
    原文仍在 sources/，这里只是投影，随时可重新生成。"""
    db = connect()
    out = Path(args.out) if args.out else ROOT / "reading"
    out.mkdir(parents=True, exist_ok=True)
    rows = db.execute("SELECT id,title,kind,path,nchunks,added,source,platform "
                      "FROM documents ORDER BY added DESC").fetchall()
    if not rows:
        print("库里还没有文档。")
        return

    made = 0
    index = ["# 知识库投影 · 人读层", "",
             "由 `kb.py export-md` 从 store.db 生成，删掉重跑即可还原。原文在 `sources/`。", ""]
    for doc_id, title, kind, path, n, added, origin, platform in rows:
        chunks = db.execute(
            "SELECT seq,heading,page,text FROM chunks WHERE doc_id=? ORDER BY seq", (doc_id,)).fetchall()
        src = str(path).replace("\\", "/")
        lines = [
            "---",
            "id: %s" % doc_id,
            "title: %s" % json.dumps(title, ensure_ascii=False),
            "kind: %s" % kind,
            "chunks: %d" % len(chunks),
            "source: %s" % json.dumps(origin or src, ensure_ascii=False),
            "platform: %s" % json.dumps(platform or "", ensure_ascii=False),
            "exported: %s" % time.strftime("%Y-%m-%d %H:%M"),
            "---", "",
            "# %s" % title, "",
            "> 原文 `%s` · %d 段 · 入库 %s" % (Path(path).name, len(chunks), added), "",
        ]
        if kind in ("image", "video"):
            lines.append("![原图](%s)" % src if kind == "image" else "原文：%s" % src)
            lines.append("")
        for seq, heading, page, text in chunks:
            if heading and heading.strip() == title.strip():
                heading = "开篇"
            if heading and page:
                label = "%s · 第 %d 页" % (heading, page)
            elif page:
                label = "第 %d 页" % page
            else:
                label = heading or "第 %d 段" % (seq + 1)
            lines.append("## %s" % label)
            lines.append("")
            lines.append('<a id="c-%d"></a>' % (seq + 1))
            lines.append("")
            lines.append(text.strip())
            lines.append("")
            loc = (["第 %d 页" % page] if page else []) + ["第 %d 段" % (seq + 1)]
            lines.append("<sub>出处：%s · `%s` · [锚点](#c-%d)</sub>" % (" · ".join(loc), doc_id, seq + 1))
            lines.append("")
        (out / ("%s.md" % doc_id)).write_text("\n".join(lines) + "\n", encoding="utf-8")
        made += 1
        index.append("- [%s](%s.md) · %s · %d 段 · %s" % (title, doc_id, kind, len(chunks), added))

    (out / "INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")

    # 清掉已删除文档留下的旧投影，避免 Obsidian 里看到不存在的条目
    keep = {"INDEX.md"} | {"%s.md" % r[0] for r in rows}
    removed = 0
    for f in out.glob("*.md"):
        if f.name not in keep:
            f.unlink()
            removed += 1

    print("已导出 %d 篇 → %s" % (made, out))
    if removed:
        print("  清理过期投影 %d 个" % removed)
    print("  从 %s 打开即可浏览" % (out / "INDEX.md"))


def cmd_md(args):
    """产出 markdown 原文到 markdown/。默认只补缺失的，不动已有的。"""
    db = connect()
    m = _md_export()
    if args.all:
        mode = "all"
    elif args.retry:
        mode = "retry"
    else:
        mode = "missing"

    stat = m.run(db, mode=mode, doc_id=getattr(args, "doc_id", None))
    if not stat:
        return
    made = stat.get("ok", 0) + stat.get("partial", 0)
    print("markdown：新增 %d 篇（其中 %d 篇只有识别文字、无版面结构）· 跳过 %d · 失败 %d"
          % (made, stat.get("partial", 0), stat.get("skip", 0), stat.get("failed", 0)))
    if stat.get("failed") and not args.retry:
        print("  失败项重试：python bin/kb.py md --retry")

    keep = {Path(r[0]).name for r in
            db.execute("SELECT md_path FROM documents WHERE md_path IS NOT NULL AND md_path<>''")}
    gone = 0
    if m.MD_DIR.exists():
        for f in m.MD_DIR.glob("*.md"):
            if f.name not in keep:
                f.unlink()
                gone += 1
    if gone:
        print("  清理孤儿 markdown %d 个" % gone)


def main():
    ap = argparse.ArgumentParser(description="专业知识库：导入、检索、出处追溯")
    sub = ap.add_subparsers(dest="cmd")

    a = sub.add_parser("add", help="导入文件或目录")
    a.add_argument("paths", nargs="+")
    a.add_argument("--no-copy", action="store_true", help="只索引，不复制原文到 sources/")
    a.add_argument("--dpi", type=int, default=OCR_DPI, help="扫描件渲染分辨率，默认 %d" % OCR_DPI)
    a.add_argument("--interval", type=int, default=FRAME_EVERY, help="视频抽帧间隔秒，默认 %d" % FRAME_EVERY)
    a.add_argument("--topic", help="给本次导入的文档设主题，如 --topic PLC 或 --topic \"AI大模型\"")
    a.add_argument("--source", help="原始出处：URL 或绝对路径。不填则自动推断（本地文件=绝对路径）")
    a.add_argument("--platform", help="来源平台：B站/抖音/小红书/YouTube/微信公众号/PDF… 不填则按来源推断")
    a.set_defaults(func=cmd_add)

    s = sub.add_parser("search", help="检索")
    s.add_argument("query", nargs="+")
    s.add_argument("-k", type=int, default=8)
    s.add_argument("--kind", choices=sorted(set(KIND_MAP.values())))
    s.add_argument("--topic", help="只查某主题下的文档")
    s.add_argument("--platform", help="只查某平台的文档，如 B站 / 抖音 / PDF")
    s.add_argument("--json", action="store_true", help="输出 JSON，供程序调用")
    s.set_defaults(func=cmd_search)

    sub.add_parser("stats", help="统计").set_defaults(func=cmd_stats)

    sy = sub.add_parser("sync", help="把 inbox/ 里的文件全部入库（成功后清空 inbox）")
    sy.add_argument("--dpi", type=int, default=OCR_DPI)
    sy.add_argument("--interval", type=int, default=FRAME_EVERY)
    sy.add_argument("--topic", help="给本次入库的文档设主题")
    sy.add_argument("--source", help="原始出处，不填则自动推断")
    sy.add_argument("--platform", help="来源平台，不填则自动推断")
    sy.set_defaults(func=cmd_sync)

    l = sub.add_parser("list", help="列出文档")
    l.add_argument("--kind")
    l.add_argument("--topic", help="只列某主题的文档")
    l.add_argument("--platform", help="只列某平台的文档")
    l.set_defaults(func=cmd_list)

    mt = sub.add_parser("meta", help="查看/修改文档的来源与平台")
    mt_sub = mt.add_subparsers(dest="meta_action")
    mt_l = mt_sub.add_parser("list", help="按平台列出分布")
    mt_l.set_defaults(func=cmd_meta)
    mt_s = mt_sub.add_parser("show", help="查看某篇的来源与平台")
    mt_s.add_argument("doc_id")
    mt_s.set_defaults(func=cmd_meta)
    mt_e = mt_sub.add_parser("set", help="修改来源/平台，如 --set platform B站 --set source URL")
    mt_e.add_argument("doc_id")
    mt_e.add_argument("--set", dest="set", nargs=2, action="append", metavar=("KEY", "VALUE"),
                      help="KEY 为 source 或 platform，可重复。例：--set platform 抖音")
    mt_e.set_defaults(func=cmd_meta)

    tp = sub.add_parser("topic", help="给文档设/清主题，或按主题查看")
    tp_sub = tp.add_subparsers(dest="action")
    tp_l = tp_sub.add_parser("list", help="列出所有主题")
    tp_l.add_argument("-v", "--verbose", action="store_true", help="同时列出各主题下的文档")
    tp_l.add_argument("--topic", help="verbose 时只看某主题")
    tp_l.add_argument("--uncategorized", action="store_true", help="verbose 时只列未分类文档")
    tp_l.set_defaults(func=cmd_topic)
    tp_s = tp_sub.add_parser("set", help="给某篇文档设主题")
    tp_s.add_argument("doc_id")
    tp_s.add_argument("topic", nargs="+", help="主题名，如 PLC 或 AI大模型")
    tp_s.set_defaults(func=cmd_topic)
    tp_c = tp_sub.add_parser("clear", help="清除某篇文档的主题")
    tp_c.add_argument("doc_id")
    tp_c.set_defaults(func=cmd_topic)

    sh = sub.add_parser("show", help="看文档结构")
    sh.add_argument("doc_id")
    sh.set_defaults(func=cmd_show)

    r = sub.add_parser("rm", help="移除文档")
    r.add_argument("doc_id")
    r.add_argument("--purge", action="store_true")
    r.set_defaults(func=cmd_rm)

    rb = sub.add_parser("rebuild", help="从 sources/ 重建索引")
    rb.add_argument("--force", action="store_true")
    rb.set_defaults(func=cmd_rebuild)

    ex = sub.add_parser("export-md", help="导出人读的 Markdown 投影到 reading/")
    ex.add_argument("--out", help="输出目录，默认 reading/")
    ex.set_defaults(func=cmd_export)

    pd = sub.add_parser("pending", help="列出已入库但还没有结论条目的资料")
    pd.add_argument("--quiet", action="store_true", help="只输出数量")
    pd.set_defaults(func=cmd_pending)

    md = sub.add_parser("md", help="产出 markdown 原文到 markdown/（派生物，可重转）")
    md.add_argument("--all", action="store_true", help="全量重转，覆盖已有的")
    md.add_argument("--retry", action="store_true", help="只重试上次失败的")
    md.add_argument("--doc", dest="doc_id", help="只处理这一篇")
    md.set_defaults(func=cmd_md)

    args = ap.parse_args()
    if not args.cmd:
        ap.print_help()
        return
    args.func(args)


if __name__ == "__main__":
    main()
