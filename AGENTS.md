# AGENTS.md — 本地知识库与记忆体

> 给**任何** agent 的接入说明。读这一份就够；细则在 `memory/vault/00-index/RULES.md`，但不要一开始就读它——太长了。
>
> 这份文件的作用：让一个没见过的 agent 在 30 秒内知道「这里有什么、怎么读、怎么写、别写什么」。

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
node "D:\collaborative project\brain\memory\bin\kb.mjs" read <id>
node "D:\collaborative project\brain\memory\bin\kb.mjs" new --type decision --title "…" --body "…" --tags a,b --source "…"
node "D:\collaborative project\brain\memory\bin\kb.mjs" bootstrap          # 会话启动看全局
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
3. **只对命中的条目 `kb_read`**，一次最多 5 条全文。
4. **没命中就正常回答**，说明这是新话题。不要硬凑，也不要跟用户说「我查了记忆库但没找到」。
5. 问题若落在某个已有决策范围内，**先读那条决策再动手**，避免推翻已定的方案。

**不要全量加载索引内容。** 索引是地图，不是内容。全读会挤占上下文，且大部分与本次无关。

### WorkBuddy 桌面版没有自动注入（2026-11-16 起）

`~/.workbuddy/settings.json` 里的 shell hook 在 WorkBuddy 桌面版 5.11.3 **不会被执行**：内核会读到 `hooks` 键（日志 `settingsKeys` 可见），但运行时只跑内置 `conversation-hook`，外部命令零执行。手动跑 `wb-run.sh` 正常，所以不是脚本或路径问题。重启、改路径、无空格探针均无效。

替代方案（已在用）：

- `D:\WorkBuddy\.workbuddy\memory\MEMORY.md` 放本库的**紧凑索引 + 命令**，WorkBuddy 每次会话自动注入（就是上下文里的 `working_memory_content`）。
- 索引随条目增加要同步更新，否则新会话看不到新条目。
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
