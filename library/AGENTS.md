# AGENTS.md（知识库部分）

上级目录有一份完整说明：`../AGENTS.md`。这里只列这个目录本身怎么用。

`library/` 是**原文资料库**：PDF / 扫描件 / 图片 / 音视频 / 网页 解析成文字后，切块存进 `store.db`（SQLite FTS5）。和记忆体（`../memory/vault/`）是两个东西——那边是"该记住的结论"，这边是"需要时去翻的材料"。

## 查

```bash
python bin/kb.py search "关键词"          # 带出处：文件名 + 页码 / 段落号
python bin/kb.py search "关键词" --json   # 给程序读
python bin/kb.py list                     # 库里有哪些篇
python bin/kb.py show <id>                # 某篇的分块结构
```

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

## 结构

```
inbox/        投递口，丢文件进来
sources/      原件归档（按类型分 pdf/ md/ image/ audio/ video/ docx/ pptx/ xlsx/）
markdown/     原文的 markdown 版，入库时自动生成（入 git，可 diff）
reading/      检索投影，带「出处：第 N 页」锚点（自动生成，不入 git）
store.db      分块索引，删了可以用 rebuild 从 sources/ 重建
```

## 注意

- **临时转单个文件不必入库**：`markitdown "某文件.pptx" > 输出.md` 直接出 md（本机 0.1.9，只装了 docx/pptx/xlsx/csv 四类解析，PDF 它走 pdfminer 会丢表格，扫描件和音视频它依赖云端或用不了）。正式入库的转换统一走 `bin/md_export.py`，引擎怎么分派见该文件头部注释。
- **`store.db` 里存的是绝对路径。** 整个目录搬家后要更新路径（`update documents set path=replace(...)`），不要用 `rebuild`——有 OCR/转写的库重建一次要跑很久。
- **`markdown/` 和 `reading/` 都是派生物，别手改。** 前者是原文的干净版本（给人读、给 agent 全文读），后者带出处锚点（用来核对某句话出处在哪）。要改内容改原件再重转，或把改好的 md 当新文件丢进 `inbox/`。
- **`md_status=partial` 表示文字来自 OCR 或语音转写**，没有版面结构，可能有识别错误。引用前核对原件。
- **检索粒度是块不是篇**：命中的是某一段，出处给到页码或段落号，引用时带上。
- 想看某一篇的原文 md 路径：`sqlite3 store.db "select md_path from documents where id='<id>'"`，或用 `python bin/kb.py show <id>`。
