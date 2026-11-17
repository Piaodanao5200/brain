# AGENTS.md（知识库部分）

上级目录有一份完整说明：`../AGENTS.md`。这里只列这个目录本身怎么用。

`library/` 是**原文资料库**：PDF / 扫描件 / 图片 / 音视频 / 网页 解析成文字后，切块存进 `store.db`（SQLite FTS5）。和记忆体（`../memory/vault/`）是两个东西——那边是"该记住的结论"，这边是"需要时去翻的材料"。

## 查

```bash
python bin/kb.py search "关键词"          # 带出处：来源/平台 + 页码 / 段落号
python bin/kb.py search "关键词" --json   # 给程序读（含 source/platform 字段）
python bin/kb.py search "关键词" --topic PLC     # 只在某主题里查
python bin/kb.py search "关键词" --platform B站  # 只在某平台里查
python bin/kb.py list                     # 库里有哪些篇
python bin/kb.py list --topic PLC         # 某主题下的篇
python bin/kb.py show <id>                # 看出处/平台 + 正文结构
python bin/kb.py topic list -v            # 主题分组 + 各主题文档
python bin/kb.py meta list                # 平台分组
```

## 主题分类

按主题给资料分组（PLC / AI大模型 …），与格式归档正交——原件仍按格式存 `sources/`，主题是 `store.db` 里的 `documents.topic` 标签。

```bash
python bin/kb.py add "手册.pdf" --topic PLC     # 导入即归类
python bin/kb.py sync --topic PLC              # inbox 里的归到 PLC
python bin/kb.py topic set <id> AI大模型        # 事后归类（可多个词，空格分隔）
python bin/kb.py topic clear <id>              # 清除
python bin/kb.py topic list [-v] [--topic X] [--uncategorized]
```

主题另存于 `sources/.topics.json`（sha → topic），`store.db` 删了用 `rebuild --force` 重建也不会丢主题。重复导入同一文件带 `--topic` 只补主题、不重复入库。

## 来源与平台

每篇记**来源**（原始 URL / 绝对路径）和**平台**（B站/抖音/小红书/YouTube/微信公众号/PDF…），与主题正交。填写优先级：`--source/--platform` 参数 > md frontmatter（`source`/`platform`/`url`）> 自动推断（URL 域名或扩展名）> 事后 `meta set`。

```bash
python bin/kb.py add "x.mp4" --source "https://www.bilibili.com/video/BV1xx" --platform B站
python bin/kb.py meta show <id>
python bin/kb.py meta set <id> --set platform 抖音 --set source "https://.../video/123"
python bin/kb.py meta list
```

存 `documents.source` / `documents.platform`，另存 `sources/.meta.json`（sha → 出处），`rebuild` 不丢。音视频「识别原件」头部写入来源/平台/`captured` 日期快照；`markdown/`、`reading/` 的 frontmatter 也带 source/platform。

`python` 不在 PATH 时用绝对路径：`D:\WorkBuddy\binaries\python\versions\3.13.12\python.exe`

## 加

```bash
# 单篇或整个目录，支持 pdf docx pptx xlsx csv md txt html 图片 音频 视频
python bin/kb.py add "D:\某个文件.pdf"

# 或者丢进 inbox/ 再一次性入库（推荐，失败的文件会留在 inbox 方便排查）
python bin/kb.py sync

# 一键：同步 + 补 markdown + 导出投影 + 重建记忆体索引 + 刷阅读页
node ../memory/bin/kb.mjs refresh
```

入库时会**自动产出一份 markdown** 到 `markdown/`，不需要另跑命令。表里没有的格式（例如
旧版 `.doc` / `.ppt`、加密 PDF）会在入箱阶段报错并留在 `inbox/`。

**音视频不留原件**：mp3/mp4 等不复制进库，只把识别文字拼成 md 存 `sources/video|audio/`，可检索可重建；代价是无法从原视频重转写。**图片/PDF/Word 仍留原件**。

**整篇一块**：`bin/kb.py` 顶部 `NO_SPLIT=True`（默认）——一篇文档=一个块，命中返回全文，heading 作 `[标签]` 内联。要切回分块改 `NO_SPLIT=False` 再 `rebuild --force`。已有库需 `rebuild --force` 才会从旧分块转成整篇一块。

## 结构

```
inbox/        投递口，丢文件进来
sources/      原件归档（按类型分 pdf/ md/ image/ docx/ pptx/ xlsx/；video/ audio/ 里是识别 md，非媒体原件）
markdown/     原文的 markdown 版，入库时自动生成（入 git，可 diff）
reading/      检索投影，带「出处：第 N 页」锚点（自动生成，不入 git）
store.db           分块索引，删了可以用 rebuild 从 sources/ 重建
sources/.topics.json  主题标签（sha → topic），rebuild 时回填
sources/.meta.json    来源/平台（sha → {source,platform}），rebuild 时回填
```

## 资料 → 结论流程

入库只到「全文可查」为止，记忆体的结论条目要 agent 单独拟：

```bash
python bin/kb.py pending     # 已入库但还没有结论条目的资料
```

读全文 → 拟结论 → 用户点头 → `kb.mjs new` 写入，正文末尾加 `<sub>出处：markdown/<文件名></sub>`。写入后 `pending` 不再列它。不自动生成（宁可缺失，不能污染）。详见根目录 AGENTS.md。

## 注意

- **临时转单个文件不必入库**：`markitdown "某文件.pptx" > 输出.md` 直接出 md（本机 0.1.9，只装了 docx/pptx/xlsx/csv 四类解析，PDF 它走 pdfminer 会丢表格，扫描件和音视频它依赖云端或用不了）。正式入库的转换统一走 `bin/md_export.py`，引擎怎么分派见该文件头部注释。
- **`store.db` 里存的是绝对路径。** 整个目录搬家后要更新路径（`update documents set path=replace(...)`），不要用 `rebuild`——有 OCR/转写的库重建一次要跑很久。
- **`markdown/` 和 `reading/` 都是派生物，别手改。** 前者是原文的干净版本（给人读、给 agent 全文读），后者带出处锚点（用来核对某句话出处在哪）。要改内容改原件再重转，或把改好的 md 当新文件丢进 `inbox/`。
- **`md_status=partial` 表示文字来自 OCR 或语音转写**，没有版面结构，可能有识别错误。引用前核对原件。
- **检索粒度默认整篇一块**（`NO_SPLIT=True`）：命中返回全文，出处给到来源/平台和页标签；改成 `NO_SPLIT=False` 并 `rebuild --force` 才是按段切分（出处到页码/段落号）。
- 想看某一篇的原文 md 路径：`sqlite3 store.db "select md_path from documents where id='<id>'"`，或用 `python bin/kb.py show <id>`。
