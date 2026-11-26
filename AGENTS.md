# AGENTS.md — 本地知识库与记忆体

> 给**任何** agent 的接入说明。读这一份就够；细则在 `memory/vault/00-index/RULES.md`，但不要一开始就读它——太长了。
>
> 这份文件的作用：让一个没见过的 agent 在 30 秒内知道「这里有什么、怎么读、怎么写、别写什么」。

## 通用工作规则（跨 agent · 所有 agent 必读，新记忆默认写入本库）

> 这一节是**跨 agent 共享**的工作纪律，不绑定任何平台。任何 agent 读到本文件即视为接受。
> **默认写入位置：本库 `memory/vault/`（L1，原子事实层，命中才读）**。只有"仅本平台可用"的操作细节才写各自私有层，并标注"仅本平台"。

1. **写入授权（最高优先）**：记忆/知识库任何增删改前，先获用户明确同意，不"顺手写"。用户说"写进记忆" = 授权但只写这一条、不夹带；跳过/未明确同意 = 不同意。改、删同样先确认。
2. **输出文字（EL5 风格）**：凡专业名词、英文缩写、技术词，按 EL5（即 Explain Like I'm 5，给五岁小孩讲）解释——紧跟一句「即……」大白话，必要时补生活类比；能不用术语就不用。判据：外行读完不问「这是什么」。所有对话适用。**反引号（即把文字包成代码样式的排版符号）不免除解释义务**：只有纯路径、命令行、参数、文件名才豁免；工具名与缩写即使包了反引号，首次出现仍要给释义。
3. **省 token**（token = 文本计量单位，省它即省上下文开销）：省过程开销，不省输出信息量——该给用户的结论和细节不打折。不重复读已读文件；大文件分段读；不粘贴大段命令输出；记忆只读命中的 1–2 条全文；批量合并处理；效果/速度优先于省。
4. **信息检索来源**：多源并行至少三类——① 视频/社交平台（抖音、小红书、B站、X、YouTube）② 代码托管平台（GitHub）③ 网页搜索。每条标注来源、交叉验证；拿不到要说明；**不得擅自跳过约定信息源**（WHV 教训：一次因跳源踩的坑），跳过须先征得同意。音视频类必须取全过程详情（完整转写/字幕/关键帧画面），不能只采标题、点赞等表面元数据。用哪个工具由各 agent 按自身平台能力决定，**本库不写死工具名或本机路径**。
5. **工具选择**：需要外部能力先查当前 agent 已有/可装的能力（skill = 预置技能包 / MCP = 外部工具接口 / CLI = 命令行程序），没有再往外找；判断可用再调用，不重复造轮子。
6. **写入判层 + 实时维护**：
   - 事实/决策/坑/方案 → 本库 L1（`memory/vault/`，默认去处）
   - 跨 agent 通用规则 → 本文件（AGENTS.md）
   - 平台专属操作细节（工具命令、本机路径） → 各 agent 私有层，标注"仅本平台"
   - 写入即更新上层指针；任一文件超预算 80% 立即压缩或拆；发现断链/失效指针当场修。
7. **收尾扫描**：实质工作收尾按"决策/事实/坑/被否方案"四格过一遍（详见下文），列清单问用户记哪几条——写入仍须用户明确同意。
8. **每轮自检（触发式检索 + 发送前两闸）**：每轮回复前对照四问——① **是否触发检索？** 触发场景：用户提到「记忆 / 规则 / 偏好 / 约定 / 上次 / 之前 / 还记得」；任务涉及本机配置、交付物验收、跨会话历史、要写入记忆、或结论会影响以后做法。触发 → 先跑 `node memory/bin/kb_hint.mjs "用户原话"`（短检索，最多 3 条候选，约 150 token），够再 `kb.mjs read` 1–2 条全文；不触发 → 不必检索（索引是地图不是内容，不搞每轮全量检索）。② 信息是否覆盖三类源（见第 4 条）？③ **回复闸（术语 + 检索一次查完，靠脚本不靠自觉）**：草稿写成临时文件后跑 `python "D:\collaborative project\brain\memory\bin\reply_gate.py" <草稿文件路径> --query "用户刚才的原话"`（python 不在 PATH 时用 `D:\WorkBuddy\binaries\python\versions\3.13.12\python.exe`）。它同时查两件事：术语是否都带「即……」释义（术语 = 专业名词 / 英文缩写（含 AI、KB 这类两字母简称）/ 命令行参数 / 文件扩展名），草稿是否带 `按记忆：命中 N 条 / 无命中` 那行——**并且会用 --query 现场重跑 `kb_hint`，与草稿那行逐字比对，编造或改写都判失败**。退出码（即程序最后返回的数字，0 成功、1 有问题）非 0 一律不许发；与记忆无关的纯计算/纯改写任务可加 `--skip-memory`。手写自查不算过（见第 2 条）。④ 增删改记忆是否已获同意（见第 1 条）？
9. **跨客户端接入**：每个客户端怎么接、接完怎么验、忘了检索怎么办，一律看 `memory/l2/clients.md`（2026-11-26 版，含登记表与 16 项体检）。新客户端只加一行登记，不另写一套规则。**平台偏好写什么，只看 `memory/l2/platform-prefs.md`（核心 6 条）**；改真源后要同步它、再同步平台偏好，然后跑 `node memory/bin/kb_doctor.mjs` 查「副本一致性」。

> 平台注记：WorkBuddy 每会话自动注入的是 `D:\WorkBuddy\user-48a30fac-1fde-4b69-a7bb-ddcac39c873c-personal\MEMORY.md`（引导层，只放指针+索引+平台专属）；它应指向本文件。**其它 agent（Codex/豆包/DeepSeek）请以本文件为准**，不要去读那个私有文件。

## 这里有什么

两个库，职责不同，别混：

| 目录 | 是什么 | 量级 | 谁去读 |
|---|---|---|---|
| `memory/vault/` | **记忆体**：用户长期定过的事（决策 / 事实 / 坑 / 待办） | 十几条，KB 级 | 每次会话开始**主动读** |
| `library/` | **知识库**：外部资料原文（PDF / 扫描件 / 图片 / 视频 / 网页） | 可到 GB | 用户问到才**按需查** |

一句话区分：**记忆体是"应该一直记得的事"，知识库是"需要时去翻的资料"。**

记忆体内部结构（纯 Markdown，`vault/` 就是真源，没有数据库、没有向量库）：

```
vault/00-index/     RULES.md（写入规则）、INDEX.md（自动生成的索引，别手改）
vault/10-knowledge/ 可复用的通用结论
vault/20-memory/    decisions/ facts/ pitfalls/ todos/ notes/
vault/30-sessions/  一次工作的流水
vault/90-archive/   过期但保留
```

## 接入方式：三选一

### A. MCP（推荐，能读能写）

服务是零依赖的 Node 脚本，stdio 模式，工具共 6 个：
`kb_bootstrap` `kb_search` `kb_read` `kb_write` `kb_supersede` `kb_recent` `kb_daily`

**Cursor**（`.cursor/mcp.json`，项目级或全局 `~/.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "kb-memory": {
      "command": "node",
      "args": ["D:\\collaborative project\\brain\\memory\\server\\mcp-server.mjs", "--stdio"]
    }
  }
}
```

**Claude Code**（一条命令就行）：

```bash
claude mcp add kb-memory -- node "D:\collaborative project\brain\memory\server\mcp-server.mjs" --stdio
```

**Codex**（`~/.codex/config.toml`）：

```toml
[mcp_servers.kb-memory]
command = "node"
args = ["D:\\collaborative project\\brain\\memory\\server\\mcp-server.mjs", "--stdio"]
```

**HTTP 模式的客户端**（Streamable HTTP，无状态）：

```bash
cd D:/collaborative project/brain/memory && node server/mcp-server.mjs     # 监听 127.0.0.1:8787
# 端点 http://127.0.0.1:8787/mcp
```

> 如果客户端里 `node` 不在 PATH，把 `command` 换成绝对路径：
> `D:\WorkBuddy\binaries\node\versions\22.22.2-6\node.exe`

### B. 命令行（不支持 MCP 时）

```bash
node "D:\collaborative project\brain\memory\bin\kb.mjs" search "关键词" -k 5
node "D:\collaborative project\brain\memory\bin\kb.mjs" search "ego | browser | 浏览器" --multi   # 多说法融合
node "D:\collaborative project\brain\memory\bin\kb.mjs" read <id>
node "D:\collaborative project\brain\memory\bin\kb.mjs" new --type decision --title "…" --body "…" --tags a,b --aliases 别名1,别名2 --source "…"
node "D:\collaborative project\brain\memory\bin\kb.mjs" bootstrap          # 会话启动看全局
node "D:\collaborative project\brain\memory\bin\kb.mjs" mem               # 同步索引 + 字符预算油表 + 落空账
node "D:\collaborative project\brain\memory\bin\kb.mjs" misses            # 落空登记本明细
node "D:\collaborative project\brain\memory\bin\kb.mjs" daily              # 今天新增/更新/作废
```

查知识库（另一套工具，Python）：

```bash
python "D:\collaborative project\brain\library\bin\kb.py" search "关键词"        # 带出处页码
python "D:\collaborative project\brain\library\bin\kb.py" search "关键词" --json # 机器可读
python "D:\collaborative project\brain\library\bin\kb.py" list                  # 库里有哪些篇
python "D:\collaborative project\brain\library\bin\kb.py" show <id>             # 看某篇的分块结构
```

`python` 不在 PATH 时用：`D:\WorkBuddy\binaries\python\versions\3.13.12\python.exe`

### C. 直接读文件（零配置，只读）

`memory/vault/**/*.md` 就是真源，任何能读文件的东西都能用。每条是 YAML frontmatter + 正文，字段含义：

```yaml
id: decision-20261115-a001      # 唯一 id，由工具生成
type: decision                  # knowledge / decision / fact / pitfall / todo / note / session
title: 用 Markdown 文件作为唯一真源
status: active                  # active / canonical / superseded / archived / draft
confidence: 0.9                 # 0-1，拿不准就写低
supersedes: []                  # 这条取代了哪些旧条目
source: 用户口述 @ 2026-11-15     # 必填
```

## 会话启动协议（必须执行）

1. **`kb_bootstrap`**：拿到写入规则 + 全部条目的紧凑索引。只建立"有哪些记忆"的地图。
2. **从用户本次问题提取关键词，`kb_search`（k=5）**。不要用「项目」「帮助」这类无信息量的词。
3. **只对命中的条目 `kb_read`，一次最多 2 条全文（条数闸）**。还要更多就分轮拿，别一次灌满上下文。
4. **没命中就按「检索兜底阶梯」换法子**（见下节），都落空才当新话题回答。不要硬凑。
5. 问题若落在某个已有决策范围内，**先读那条决策再动手**，避免推翻已定的方案。

**不要全量加载索引内容。** 索引是地图，不是内容。全读会挤占上下文，且大部分与本次无关。

## 检索与预算纪律（2026-11-18 借鉴 TencentDB Agent Memory，全 agent 遵守）

### 记忆分层（L0–L3）

| 层 | 内容 | 位置 | 何时进上下文 |
|---|---|---|---|
| L3 | 硬规则 + 索引 | 用户级 `MEMORY.md`（≤2,500 字符） | 平台自动注入 |
| L2 | 技术细节专题 | 本库 `memory/l2/`（`memory-technical.md` + browser/proxy/skills/kb 四专题，各 ≤3,000；含本机专属信息已逐篇标注适用性） | 用到才读 |
| L1 | 原子事实条目 | `memory/vault/` | 命中才读，一次 1–2 条 |
| L0 | 原始对话 | `conversation_search` / 工作区日志 | L1 不够时兜底 |

### 检索兜底阶梯（搜不到时按序换法，不许直接说"没有"）

1. 换更具体的词再搜；同义词/中英文/缩写各试一次，或直接 `kb.mjs search "词1|词2|词3" --multi`（多说法融合，结果去重封顶 -k）
2. 翻 `bootstrap` / INDEX.md 按分类扫
3. `grep` vault 正文全文找
4. `conversation_search` 查历史对话

### 别名（aliases）

- 写新条目尽量带 `--aliases "中英文,缩写,别称"`（如 ego 条目带 `browser,浏览器,Citro`）；`kb_supersede` 会自动继承旧条目的别名。
- 命中差距的根源常是"记的词 ≠ 查的词"，别名就是专门填这个差的。

### 落空登记（misses.log）

- `search` 零命中（或只拿到兜底结果）会自动记入 `memory/misses.log`；`kb.mjs mem` / `refresh` 会列条数，`kb.mjs misses` 看明细、`--clear` 清空。
- **攒够 3 条就处理**：补别名、补条目，然后清空。这是记忆系统的体检报告，别放着不管。

### 字符预算（三闸里能落地的两条）

- 条数闸：读全文一次 1–2 条；`--multi` 合并结果封顶 `-k`（默认 8）。
- 字符预算闸：用户级 MEMORY.md ≤2,500、memory-technical.md ≤3,000、工作区 MEMORY.md ≤3,000；**超 80% 就压缩或拆文件**，别等被平台截断（4,000 上限的坑已踩过一次）。`kb.mjs mem` 看油表。
- 超时闸做不到（文件读取无超时概念），不追求。

### 收尾四格扫描（治漏记）

实质工作收尾时，按四个格子过一遍对话：**决策 / 事实 / 坑 / 被否的方案**，列清单一次问用户"记哪几条"。写入仍须用户明确同意（铁律不变），扫描只是保证不漏提。

### 负知识留存

不光记"成功的路"，也记"此路不通"：调研中被排除的方案、试错失败的路径值得单独一条 pitfall，或写进结论条目的"为什么不是 B"。下次遇到同类问题不用重新踩一遍。

### WorkBuddy 桌面版自动注入机制（2026-11-24 更新）

`~/.workbuddy/settings.json` 里的 shell hook 在 WorkBuddy 桌面版 5.11.3 **不会被执行**：内核会读到 `hooks` 键（日志 `settingsKeys` 可见），但运行时只跑内置 `conversation-hook`，外部命令零执行。手动跑 `wb-run.sh` 正常，所以不是脚本或路径问题。重启、改路径、无空格探针均无效。

当前机制（**注入入口 ≠ 内容真源，两者分离**）：

- **注入入口（平台锁定，无法改成别处）**：`D:\WorkBuddy\user-48a30fac-1fde-4b69-a7bb-ddcac39c873c-personal\MEMORY.md`（L3 引导层），WorkBuddy 每会话自动注入。它只放"启动必读本文件 + L1 索引区 + 平台专属指针"，**不放通用规则正文**。旧路径 `D:\WorkBuddy\.workbuddy\memory\MEMORY.md` 已删除，别再指它。
- **内容真源（共享）**：本文件（AGENTS.md）「通用工作规则」节 —— 所有 agent 的通用规则以这里为准。
- L1 索引写在注入入口的 KB-INDEX 区，由 `kb.mjs mem` 自动同步；条目增加后要跑一次，否则新会话看不到新条目。
- 需要全文时用 CLI：`node memory/bin/kb.mjs search "…" -k 5` / `read <id>`。
- MCP 配置（`~/.workbuddy/mcp.json` 的 `kb`）本身正常，stdio 可启动，但桌面版未加载到工具列表；能用就用，不能用别卡在这。

## 写入纪律（硬约束）

1. **先查后写。** `kb_write` 前必须 `kb_search`；同标题会被拦下来提醒改用 `kb_supersede`。
2. **事实变更用 `kb_supersede`**，不要新增第二条、也不要手改旧文件。旧条目会留成 `superseded` 并指向新条目。
3. **永不复制命令到记忆里。** 只写"跑 `package.json` 里的 `build` 脚本"这类**指向**。命令副本必然滞后于真源。
4. **`source` 必填**：文件路径、URL、PR 号，或"用户口述 @ 日期"。
5. **不存密钥、令牌、手机号、身份证号。** `npm run lint` 会拦截。
6. **记忆的权威低于代码。** 记忆与代码冲突时，看代码，然后修掉那条记忆。

正文格式：50–150 字，第一句就是结论，不铺垫。

```
结论一句话。

依据：具体数据 / 文件路径 / 复现步骤。
边界：什么情况下这条不适用。
```

## 判断一条内容该进哪个库

| 问题 | 是 → |
|---|---|
| 要 agent 一直记住，还是需要时才查？ | 记住 → `memory/vault/`；查 → `library/` |
| 它会改变 agent 的做法吗？（"用户要表格""别用 rm -rf""方案已定"） | 会 → 记忆体 |
| 它是一个断言，还是一份材料？ | 断言 → 记忆体；材料（报告/论文/视频）→ 知识库 |

同一件事经常拆两份：全文进知识库，结论进记忆体。

## 资料 → 结论流程（入库后必做）

资料入库（`kb.py add` / `sync` / `refresh`）不产生记忆体结论——结论由 agent 读全文后拟定，用户点头才写入：

```bash
python library/bin/kb.py pending   # 列出已入库、还没有结论条目的资料
```

1. 读 `markdown/` 下的全文
2. 拟结论草稿（标题 + 类型 + 一句话正文）给用户看
3. 用户点头 → `node memory/bin/kb.mjs new` 写入，**正文末尾加一行 `<sub>出处：markdown/<文件名></sub>`**
4. 跑 `kb.mjs index` 同步 MEMORY.md；`kb.py pending` 不再列它即为成功

不自动生成结论（宁可缺失，不能污染）。`refresh` 输出里的「待出结论 N 篇」就是欠账清单，看到就处理或提醒用户。

## 项目存放约定（用户定的，新建项目必须遵守）

按「谁用」分两种放法，别混：

| 项目性质 | 放哪 | 例子 |
|---|---|---|
| **多个 agent 共用** | `D:\collaborative project\<项目名>\` | `D:\collaborative project\brain\` |
| **只有自己用** | 自己的目录下 `<自己的目录>\<项目名>\` | `D:\deepseek\<项目名>\`、`D:\WorkBuddy\<项目名>\` |

- 判断标准只有一句：**这个项目别的 agent 会不会读或写？** 会 → `collaborative project`；不会 → 自己的目录。
- `collaborative project` 名字里**带空格**，命令行里写完整路径一律加引号，别拼字符串。
- 文件夹名用 agent 自报的产品名，不要用 `agent`、`AI`、`code` 这类通用词——会和别人撞名。
- 只约束新建项目；已有的 `D:\WorkBuddy\llm-ranking` 保持原位，不要搬。
- 缓存、日志、临时产物放在各自项目目录里，不要散落到 `D:\` 根目录。

对应记忆条目：`fact-20261115-bb6e` 的继任条目（`kb search "collaborative project"`）。

## 自检

配好之后，用这条验证是否真的连上：

```bash
node "D:\collaborative project\brain\memory\bin\kb.mjs" search "向量库" -k 3
```

有输出（应命中 `knowledge-20261115-e002`）就说明通；报错见下。

## 常见故障

| 现象 | 原因与解法 |
|---|---|
| `node: command not found` | 用绝对路径 `D:\WorkBuddy\binaries\node\versions\22.22.2-6\node.exe` |
| MCP 连上但工具列表是空的 | 少了 `--stdio` 参数，服务会默认起 HTTP 模式 |
| 中文输出乱码 | Windows 控制台先 `chcp 65001`；程序输出本身是 UTF-8 |
| `8787` 端口被占用 | 换端口 `set PORT=8790 && node server/mcp-server.mjs` |
| 写了但检索不到 | 没重建索引，跑 `node bin/kb.mjs index` |

## 同步到 GitHub

`git` 已可用：`github.com:443` 本身是通的，之前的失败是 schannel 在受限令牌下取不到凭据
（`SEC_E_NO_CREDENTIALS`），看着像 TLS 中断。已在 `~/.gitconfig` 设 `http.sslBackend=openssl`，
并把 `https://github.com/` 的 `extraheader` 认证写好；私有仓库的 `ls-remote` / `clone` / `push --dry-run`
均实测通过。

- 沙箱里 **credential helper 不可用**：git 通过 msys `sh` 启动 helper，而沙箱禁命名管道，helper 一律失败。
  认证靠 extraheader，不要改回 GCM / store。
- `git` 在 WorkBuddy 的 PortableGit 目录下，已加入用户 PATH，但**已运行的 DSH 进程要重启**才认；
  在那之前用绝对路径调用。

备选（纯 API，不依赖本地 git）：

```bash
node "D:\collaborative project\brain\memory\bin\push.mjs" --repo <仓库路径>
```

行为：把本地未推送的提交逐个重放到远程，新提交接在远程 tip 之后（历史累积、可 `git revert`）；
author / committer / 时间照抄本地，所以重放出的 SHA 与本地一致，`git status` 不会误报领先。
blob / tree 映射缓存于 `.git/remote-cache.json`，二次推送只传变化部分。

- **不要**自己写 curl 拼 `POST /git/commits`：父节点传错就会把远程历史抹成一条（这个坑踩过）。
- 只有远程历史本身是伪造的时候才加 `--reset`（强推指针、以本地为准）。

## 别做的事

- **不要手改 `vault/00-index/INDEX.md`**，它是自动生成的，下次跑 `index` 会被覆盖。
- **不要物理删除条目**，用 `kb_supersede` 或把 `status` 改成 `archived`。
- **不要往 `library/inbox/` 里放已经入过库的文件**，会按内容哈希判重并自动删除原件（不会丢数据，原文已在 `library/sources/`）。
- **不要同时改同一个 `.md` 文件**：多人多 agent 协作时，写入走 `kb_write`，它自己处理 id 与索引。
