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
# 单篇或整个目录，支持 pdf docx md txt html 图片 音频 视频
python bin/kb.py add "D:\某个文件.pdf"

# 或者丢进 inbox/ 再一次性入库（推荐，失败的文件会留在 inbox 方便排查）
python bin/kb.py sync

# 一键：同步 + 导出投影 + 重建记忆体索引 + 刷阅读页
node ../memory/bin/kb.mjs refresh
```

## 结构

```
inbox/     投递口，丢文件进来
sources/   原件归档（按类型分 pdf/ md/ image/ audio/ video/）
reading/   给人看的 Markdown 投影（自动生成，别手改）
store.db   分块索引，删了可以用 rebuild 从 sources/ 重建
```

## 注意

- **`store.db` 里存的是绝对路径。** 整个目录搬家后要更新路径（`update documents set path=replace(...)`），不要用 `rebuild`——有 OCR/转写的库重建一次要跑很久。
- **`reading/` 是投影，不是真源。** 要改内容改原件，然后重新 `export-md`。
- **检索粒度是块不是篇**：命中的是某一段，出处给到页码或段落号，引用时带上。
