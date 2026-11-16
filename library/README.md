# library

原文知识库。跟 `D:/collaborative project/brain/memory` 是两件事，别混：

| | memory（记忆体） | library（这里） |
|---|---|---|
| 装什么 | 结论、决策、偏好，50–150 字 | 整篇论文 / 网页 / 文档，几千到几万字 |
| 谁写 | 你和 AI 边聊边写 | 外部资料，原文导入 |
| 检索返回 | 那条结论 | 原文片段 + 文件 + 页码 + 章节 |
| 量级 | 几十到几百条 | 几百到几万段 |
| 存储 | 一堆 `.md` 文件 | SQLite 索引 + 原文归档 |

一句话：**记忆体记「我们定过什么」，知识库记「资料里到底说了什么」。**

## 快速开始

最省事的方式：**把文件丢进 `inbox/`，然后一条命令**。

```bash
cd D:/collaborative project/brain/library
python bin/kb.py sync      # inbox 里有什么就导什么，成功的自动清空
```

其余常用命令：

```bash
python bin/kb.py add "D:/某目录/论文"        # 导入整个目录（递归）
python bin/kb.py add "某文件.pdf"            # 导入单篇
python bin/kb.py search "注意力机制 长文本"    # 检索
python bin/kb.py stats                      # 库有多大
python bin/kb.py list --kind pdf            # 有哪些 PDF
python bin/kb.py show md-73a4db4ff9         # 看某篇的章节结构
```

`sync` 与 `add` 的区别：`sync` 只认 `inbox/`，导入成功后会把原件删掉（原文已复制进 `sources/`），失败的留在原处让你看得见；`add` 可以指定任意路径，且不动原件。

导入时原文会被**复制**一份到 `sources/`（按格式分目录，文件名前面带内容哈希）。原始文件不动，也不删。加 `--no-copy` 可以只索引不复制。

## 检索返回什么

```
1. 大模型能力与速度排名 · 2026 年 11 月
   MD · 一、先给结论 · 第 2 段 · md-73a4db4ff9
   出处: D:\collaborative project\brain\library\sources\md\73a4db4f_report.md
   1. **最强和最优不是同一个模型。** Claude Fable 5.2 能力第一（AA 智能指数 65）…
```

四样东西缺一不可：**原文片段**（不是 AI 概括）、**文件**、**位置**（页码 / 章节 / 第几段）、**文档 id**。任何一条你都能回到原文核对——这是它跟"聊天记录搜索"的根本区别。

## 支持的格式

| 格式 | 状态 | 怎么处理 |
|---|---|---|
| `.md` `.txt` | ✅ | 直接读，保留标题层级 |
| `.html` `.htm` | ✅ | markitdown 转 md，保留结构（失败退回自带抽取器） |
| `.pdf`（有文字层） | ✅ | pypdf 抽文本切块；`markdown/` 那份用 pymupdf4llm 转，保留标题与表格 |
| `.pdf`（扫描件） | ✅ | 自动判定无文字层 → 渲染成图 → OCR，页码保留 |
| `.docx` | ✅ | markitdown（mammoth）转 md，标题/列表/表格都在 |
| `.pptx` `.ppt` | ✅ | markitdown，按幻灯片分节 |
| `.xlsx` `.xls` `.csv` | ✅ | markitdown，表格转 md 表 |
| 图片 `png jpg webp bmp tiff` | ✅ | OCR 出文字，原图归档，投影里嵌入 |
| 视频 `mp4 mov mkv avi webm` | ✅ | 抽帧 OCR（带时间点）+ 语音转写 |
| 音频 `mp3 wav m4a flac` | ✅ | 语音转写 |

旧版 `.doc` / `.ppt`（二进制格式）和加密 PDF 会在入箱阶段报错并留在 `inbox/`，不会入库。

## 扫描件、图片、视频怎么进来

三条链路，都是自动判定的，不用你选参数。

**扫描件 PDF**：先试文字层，平均每页不足 30 字就判定为扫描件，用 PyMuPDF 按 200 dpi 渲染每页再 OCR。实测 3 页约 4 秒，页码不丢，检索结果里标 `OCR 识别 · 第 N 页`。

**图片**：直接 OCR。原图存进 `sources/image/`，`export-md` 会把图嵌进 Markdown，人看时图文对照。

**视频**：两条腿走路 —
- 画面：每 10 秒抽一帧（`--interval 30` 可拉长），OCR 出画面里的文字，片段标注 `画面 03:20`
- 声音：**优先找同名 `.srt` / `.vtt` / `.txt` 字幕**，最准、零成本、带时间轴；没有字幕才走语音转写

```bash
python bin/kb.py add "会议录像.mp4" --interval 30     # 长视频拉大间隔，省时间
python bin/kb.py add "扫描件.pdf" --dpi 300            # 小字/表格调高分辨率
```

### 依赖

```bash
python -m pip install rapidocr-onnxruntime   # 图片与扫描件 OCR，离线，不装外部程序
python -m pip install pymupdf pymupdf4llm    # 扫描件渲染 + PDF 转 markdown
python -m pip install "markitdown[docx,pptx,xlsx]"   # Office 文档转 markdown
python -m pip install imageio-ffmpeg         # 视频抽帧与音频提取（自带 ffmpeg）
python -m pip install faster-whisper         # 语音转写，可选
```

`markitdown` 只装 `docx,pptx,xlsx` 三个 extras，**不要装 `[all]`**——那会拉进 Azure SDK
等几百 MB 的东西，而本机方案（PDF 用 pymupdf4llm、OCR 用 rapidocr、音频用
faster-whisper）在中文场景下都比它强。

语音模型默认 `base`，中文准确率一般；`KB_WHISPER=small` 更准但慢 2–3 倍。**有字幕文件就不用装它。**

### 三个必须知道的限制

1. **OCR 会认错字。** 清晰印刷体可靠，手写、艺术字、低分辨率、复杂表格不可靠。原文保留在 `sources/`，引用以原件为准。
2. **视频只取"文字"，不取"画面理解"。** 抽帧读的是画面里的文字（PPT、字幕、屏幕内容），不理解人物动作场景。既没字幕也没口播的视频，进来是空的。
3. **耗时按分钟计。** 100 页扫描件约 2–3 分钟；1 小时视频（10 秒一帧 = 360 帧）约 5–8 分钟。跑的时候别关窗口。

## 原文 markdown：markdown/

每个进库的文件都会产出一份对应的 `.md`，放在 `markdown/`。入库时自动生成，不用额外跑命令。

```bash
python bin/kb.py md            # 补上历史遗留的缺失（默认只补缺的，不动已有的）
python bin/kb.py md --all      # 全量重转，覆盖现有的
python bin/kb.py md --retry    # 只重试上次失败的
python bin/kb.py md --doc pdf-ab12cd34ef   # 单篇
```

引擎按格式分派，不是一把梭：

| 输入 | 引擎 | 为什么是它 |
|---|---|---|
| PDF 有文字层 | `pymupdf4llm` | 保留标题层级与表格。markitdown 的 PDF 走 pdfminer，只出纯文本 |
| PDF 扫描件 / 图片 | 已有分块（OCR） | 文字本来就是 OCR 出来的，直接拼，保证「搜到的」和「看到的」是同一份 |
| 视频 / 音频 | 已有分块（字幕或转写） | 同上，不重复转一遍 |
| docx / pptx / xlsx / csv | `markitdown` | 本机没有更合适的 |
| html | `markitdown` | 保留结构，失败退回自带抽取器 |
| md / txt | `native` | 原样搬运 |

**`partial` 是什么意思**：这份 md 的文字来自 OCR 或语音转写，没有版面结构（标题、表格都是猜的），
识别也可能有错。frontmatter 里会写 `engine: ocr-asr` 和一行提醒。引用前核对原件。

**不要手改 `markdown/` 里的文件。** 它是派生物，`kb.py md --all` 会按原件重转、直接覆盖。
要改内容请改原件重新转，或把改好的 md 当新文件丢进 `inbox/` 入库。

## 检索投影：export-md

```bash
python bin/kb.py export-md
```

生成 `reading/`，每篇一个 Markdown，带 frontmatter、分段锚点、出处行。用 Obsidian 打开这个目录就能读、能双链、能 git diff。

**和 `markdown/` 的区别**：`markdown/` 是原文的干净版本，用来读和留给 agent 全文读；
`reading/` 是从检索分块拼出来的，每段后面挂一行「出处：第 N 页」和锚点，用来核对
「这条结论是从哪一段来的」。两个都要，各管一件事。

**投影是从索引重新生成的**，你在 `reading/` 里手改的内容下次导出会被覆盖。要改就改原文再重建。已删除文档的旧投影会自动清掉，不会在 Obsidian 里留下僵尸条目。

## 为什么不用向量检索

本机没有 embedding 服务（无 ollama），上千篇走 API 做 embedding 有持续成本；而这个库的用法是「我知道要找什么，帮我定位到原文」，关键词 + 好的分块就够了，且结果可解释——你能看懂为什么命中这一段。

什么时候该加：需要"我记得意思但想不起用词"式的模糊召回时。那时加一层向量做**第二路召回**，与关键词结果合并，原文和索引结构都不用变。

## 分块规则

- 按标题切，遇到 `#` 强制断块
- 目标 600 字一块，硬上限 1400 字
- 正文小于 40 字丢弃（页眉、孤立标题）；OCR / 转写来的块按 6 字算（一页截图可能只有一行字）
- PDF 按页先切，页内再按段落
- 视频按「画面 时间点」「口播 时间点」分块，同一画面重复的帧只留一次

一块 600 字是有原因的：太短丢上下文，太长命中后注入的内容里一半是无关的。

## 中文检索怎么做的

SQLite FTS5 自带的分词器切不开中文（整句会当成一个词），所以入库时把中文切成**二元组**（"知识库" → "知识 识库"）存进索引，查询时同样切。这样不需要装分词词典，纯标准库就能跑，效果对中文够用。

## 数据安全

- 原文在 `sources/`，索引在 `store.db`，两者独立。
- `store.db` 删了能重建：`python bin/kb.py rebuild --force`（从 sources 全量重扫）。
- 想换机器：整个目录拷走就行，没有外部依赖。
- `rm` 默认只从索引移除，原文保留；加 `--purge` 才删原文。

## 性能

实测（本机，1000 篇 / 47 MB 中文语料）：

| 做法 | 单次查询 |
|---|---|
| 逐文件读盘再匹配 | 351 ms |
| grep -r 全盘扫 | 3,514 ms |
| **FTS5 索引查询** | **0.26 ms** |

建索引是一次性的（约 9 秒 / 1000 篇），日常查询不吃这个成本。当前库 1 篇 21 段，查询 1 ms。

## 目录

```
sources/      原文归档（md/ txt/ html/ pdf/ image/ video/ audio/ docx/ pptx/ xlsx/）
inbox/        待导入的临时堆放处
markdown/     原文的 markdown 版（入库时自动生成，可删可重建，入 git 可 diff）
reading/      检索投影，带出处锚点（export-md 生成，不入 git）
store.db      索引（文档表 + 片段表 + 全文索引）
bin/kb.py     入库、检索、导出
bin/md_export.py  按格式分派引擎，产出 markdown/
```
