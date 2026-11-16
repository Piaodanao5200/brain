# kb-memory

本地知识库与记忆体。`vault/` 里每个 `.md` 文件是一条记忆，一个零依赖 MCP 服务把它暴露给任何 agent——Claude Code、Cursor、Codex、ChatGPT 连的是同一份数据。

- **你能实时看**：就是普通 Markdown 文件夹，Obsidian / VS Code / 记事本随便改，改完立刻生效，没有"同步"这一步。
- **agent 能读写**：MCP 工具 `kb_search` / `kb_read` / `kb_write` / `kb_supersede` / `kb_daily`（按天汇总）。
- **新会话自动检索**：三层机制，从"强行注入索引"到"按提问精准召回"，见下文。
- **能上云**：同一个进程加 `--stdio` 就是本地工具，不加就是 HTTP 服务，反代后任何远程 agent 都能连。

```
你的编辑器 / Obsidian ──┐
Claude Code ── stdio ──┤
Cursor ─────── stdout ─┼──►  MCP 服务  ──►  vault/**/*.md   （唯一真源，git 可管）
Codex ──────── stdio ──┤        │
ChatGPT ─── HTTPS ─────┘        └── 写入前查重 → 冲突走 supersede → 重建索引
```

## 60 秒跑起来

不需要 `npm install`，Node 18+ 即可。

```bash
cd "D:/collaborative project/brain/memory"

node bin/kb.mjs index          # 重建索引
node bin/kb.mjs refresh        # 一键更新：inbox 入库 → 导出投影 → 重建索引 → 刷阅读页
node bin/kb.mjs bootstrap      # 看看库里有什么
node bin/kb.mjs search "冲突"   # 检索
node bin/kb.mjs stats          # 统计
node bin/kb.mjs ui             # 启动看板：实时监看 + 直接增改（http://127.0.0.1:8788）
node bin/kb.mjs daily          # 今日新增 / 更新 / 作废
```

**人工查看与更新**两种方式，随你：

1. 用 Obsidian「打开文件夹作为仓库」选 `vault/`，或直接用 VS Code 打开——所见即文件。
2. 用命令行：`node bin/kb.mjs new --type decision --title "..." --body "..." --tags a,b --source "..."`。

新建条目可以复制 `vault/20-memory/_template.md`，但**更推荐用 `kb new` 或 MCP 写入**——它会自动生成 id、查重、重建索引，手写容易漏字段，`kb lint` 会报出来。

## 接给 agent

### 1. Claude Code（stdio，最稳）

```bash
claude mcp add kb -- node "D:/collaborative project/brain/memory/server/mcp-server.mjs" --stdio
```

### 2. Cursor

项目内 `.cursor/mcp.json`（或全局 `~/.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "kb": {
      "command": "node",
      "args": ["D:/collaborative project/brain/memory/server/mcp-server.mjs", "--stdio"]
    }
  }
}
```

### 3. Codex

`~/.codex/config.toml`：

```toml
[mcp_servers.kb]
command = "node"
args = ["D:/collaborative project/brain/memory/server/mcp-server.mjs", "--stdio"]
```

### 4. ChatGPT / 任何远程客户端（HTTP）

先在本机或云主机起服务：

```bash
PORT=8787 KB_TOKEN=<你的令牌> node server/mcp-server.mjs
```

然后在客户端里添加自定义 MCP 连接器，URL 填 `http://<主机>:8787/mcp`，认证方式选 Bearer 并填同一个令牌。

> ChatGPT 的 Pro 档对 MCP 写入权限有限制（多为只读），写入需要更高档位。如果发现写不进去，先 `KB_READONLY=1` 只读接、写入交给本地 agent。

**不支持 MCP 的客户端**（如某些网页版）：它们至少会读 `AGENTS.md`。这也是一层兜底——`AGENTS.md` 里写了同样的规则和"先检索再回答"的协议。

## 新会话自动检索：三层机制

你提的"新会话自动先检索一遍项目"这件事，agent 本身**不会主动做**，必须靠外部机制触发。这里给了三层，从强到弱：

### 第一层：hook 按提问精准召回（最有效，WorkBuddy 已装好）

`hooks/wb-context.mjs` 一个脚本服务两个事件，同时查**记忆库**和**知识库**：

| 事件 | 做什么 | 注入量 |
|---|---|---|
| `SessionStart` | 给一张"地图"：库里有哪些条目、最近改了什么、知识库是否可用 | 约 1000 字 |
| `UserPromptSubmit` | 拿你这句话去两边检索，命中才注入；无关提问不注入 | 0–1000 字（默认上限） |

配置写在 `~/.workbuddy/settings.json`（**本机已经写好，重启 WorkBuddy 生效**）：

```json
{
  "hooks": {
    "SessionStart":     [{ "hooks": [{ "type": "command", "command": "bash \"D:/collaborative project/brain/memory/hooks/wb-run.sh\"", "timeout": 20 }] }],
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "bash \"D:/collaborative project/brain/memory/hooks/wb-run.sh\"", "timeout": 15 }] }]
  }
}
```

**为什么要 `wb-run.sh` 这一层**：hook 在 Git Bash 里执行，`node` 未必在 PATH 上，而 app 自带的 node 路径带版本号（升级就变）。包装脚本会自己找 node，找不到就静默退出，绝不卡住对话。

**为什么不直接写 node 命令**：Windows 上 PATH 里的 `node` 是 WorkBuddy 注入的，换个启动方式就可能没有；写死绝对路径又会在升级后失效。包装脚本两头都兜住。

**相关性闸门**：BM25 的 or 模式会把"今天天气怎么样"匹配到含"怎么"的片段。所以 `wb-context.mjs` 在 Node 侧又算了一次词面重合——提问切成中文二元组 + 英文词，命中片段至少要覆盖 2 个（提问很短时 1 个）。实测：

| 提问 | 结果 |
|---|---|
| 上次那个模型排名第一的是哪个 | 注入 1731 字，6 条 |
| 为什么不用向量数据库 | 注入 398 字，1 条 |
| 今天天气怎么样 | 不注入 |
| 帮我写一份季度总结 | 不注入 |
| 继续（少于 6 字） | 不注入 |

**自检**：`node hooks/check.mjs`——查配置有没有、脚本跑不跑得通、最近有没有真的被触发过（读 `hooks/_hook.log`）。

### 费不费 token

**检索本身 0 token**：BM25 在本地算，不调任何模型。这一点和 mem0 那类"每次读写都叫一次 LLM 做抽取"的方案有本质区别——那种真正烧钱的是推理调用，不是存储。

花 token 的只有注入的那段文字，而且它会留在上下文里、之后每轮重发。所以设了硬上限：

| 项 | 数值 |
|---|---|
| 单次注入上限 | 1000 字（`WB_CTX_MAX` 可调） |
| 实测平均 | 约 700–900 字 |
| 实测命中率 | 31 次提问中 9 次零注入（约 29%） |
| 粗估 token | 1000 字 ≈ 500–1000 token（中文 1–2 字/token） |

按 $3/百万输入 token 算，一次注入约 $0.002。10 轮对话里注入 3 次，总额外成本不到 $0.01。

**预算分配**：记忆库最多用 55%，剩下的全给知识库；某一路没用完的额度另一路可以吃掉。这样不会出现"3 条记忆把知识库挤没了"的情况。

**同样的机制也能挂到 Claude Code**（把命令换成 `node <路径>/hooks/wb-context.mjs` 即可，它输出的 `hookSpecificOutput.additionalContext` 格式两者通用）：

```json
{ "hooks": { "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node D:/collaborative project/brain/memory/hooks/wb-context.mjs" }] }] } }
```

`hooks/session-start.mjs` 与 `hooks/user-prompt-submit.mjs` 是早期只查记忆库的版本，保留兼容，新装请用 `wb-context.mjs`。

这两个脚本走本地文件系统，不依赖 MCP 连接，即使客户端没连上也能工作。


### 第二层：AGENTS.md 协议（跨客户端通用）

`AGENTS.md` 里的「会话启动协议」要求 agent 开局调 `kb_bootstrap` 再 `kb_search`。Claude Code、Codex、Cursor 都会读这个文件。可靠度取决于模型是否遵守，通常没问题，但不如 hook 硬。

### 第三层：MCP 的 `instructions`（兜底）

服务在 `initialize` 响应里带了 `instructions` 字段，说明"先 bootstrap 再检索、写入前查重"。支持这个字段的客户端会自动把它放进系统提示。

**三层叠加的实际效果**：hook 已经把相关记忆塞进上下文了，agent 是否"主动去查"就不那么关键了；而 `AGENTS.md` 保证了没装 hook 的环境也不会瞎编。

## 上云

```bash
cd "D:/collaborative project/brain/memory"/deploy
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # 生成令牌填进 .env
# 填好 KB_DOMAIN 与 KB_TOKEN 后
docker compose up -d
```

得到 `https://<你的域名>/mcp`，任何远程 agent 都能连。附带的好处：

- `https://<域名>/index` 是实时索引页，手机浏览器也能看。
- `https://<域名>/search?q=关键词&token=...` 直接检索。

本机没装 Docker，这套配置**未在本地实测**（见 `vault/20-memory/todos/` 那条待办）。手动部署等价于：装 Node 22 → 拷代码 → `PORT=8787 KB_TOKEN=xxx node server/mcp-server.mjs` → 反代加 TLS。

## 本地与云怎么保持一致

这是最容易出错的地方。三种策略，选一个，别混：

| 策略 | 做法 | 适合 |
|---|---|---|
| **云为主** | 云上跑服务，本地定时 `rsync` 下来只读查阅 | 多个远程 agent 共用、你本人只是偶尔翻看 |
| **git 为主**（推荐） | `vault/` 进 git，云端定时 `git pull`，本地写完 push | 想要完整历史、可回滚、多台机器 |
| **双向同步** | Syncthing / iCloud / OneDrive 同步 `vault/` | 单人多设备，**但要接受冲突文件** |

**不要同时用"云为主"和"git 为主"**：云上 agent 写了但没 push，本地又 push 了别的，下一次 pull 就冲突，而且冲突的是记忆条目，合并起来很难判断哪条是对的。

选了 git 为主的话，云端加个定时任务：

```bash
*/5 * * * * cd /srv/kb-memory && git pull --rebase --autostash >> /var/log/kb-sync.log 2>&1
```

## 日常维护

```bash
node bin/kb.mjs lint            # 漂移检查：字段缺失、id 重复、标题重复、密钥泄露、索引落后
node scripts/compact.mjs        # 看看哪些条目该归档/压缩（dry-run）
node scripts/compact.mjs --apply # 真正归档 superseded 且长期未动的条目
```

建议把 `lint` 接进 CI 或 git pre-commit，否则半年后你会得到一个 300 条、一半过期的库。

## 为什么不用 mem0 / Letta / Zep

它们都更成熟，也有 MCP 接口。不用它们的理由只有一条：**你的规模用不上，而且它们会把真源锁进自己的库**。

- 它们的核心价值是自动抽取（从对话里判断该记什么）和大规模语义检索。代价是数据进了 SQLite/Postgres/图数据库，你想"打开文件夹看一眼、手改一条"就做不到。
- 换成另一个工具时，数据要迁移——MCP 统一的是传输，不是 schema（见 `vault/10-knowledge/knowledge-20261115-e001`）。

什么时候该换：条目超过 2000 条、或需要从几百小时对话里自动抽取。那时把本项目的 `vault/` 当导出源，导入它们，检索层替换、真源保留。

## 已知限制

1. **检索是词面的**。BM25 + 中文二元切分，同义不同词会漏（"成本"搜不到"花费"）。缓解：标题写清楚、标签规范、必要时加同义词表。
2. **没有权限体系**。有令牌就能读写全部。多人共用时，靠 `KB_READONLY` 和网络隔离，不靠细粒度 ACL。
3. **HTTP 模式无状态**，不支持服务端推送，因此没有"写入后通知其他 agent"的能力。
4. **hook 依赖客户端支持**。WorkBuddy 桌面版与 Claude Code 都支持 `SessionStart` / `UserPromptSubmit`；别的客户端没有就退回 `AGENTS.md` 协议。
5. **没做向量检索**，这是刻意的取舍，理由见上。
6. **hook 超时按秒算**（SessionStart 20s / UserPromptSubmit 15s），脚本本身耗时 300–800ms，正常不会碰到上限；知识库很大时 python 启动会慢一些。
7. **注入有 1000 字硬上限**，超出时整条丢弃命中而不是截断句子——半句话比少一条更浪费 token。

## 目录

```
AGENTS.md              所有 agent 的入口（薄壳规则）
CLAUDE.md              指向 AGENTS.md
.cursor/rules/         Cursor 规则
bin/kb.mjs             命令行：bootstrap/search/read/new/supersede/index/lint
server/mcp-server.mjs  MCP 服务（--stdio 或 HTTP）
server/lib/vault.mjs   解析、检索、写入、索引（全部逻辑在这里）
hooks/                 wb-context.mjs（统一入口）/ wb-run.sh（找 node）/ check.mjs（自检）
scripts/drift-check.mjs 漂移与密钥检查
scripts/compact.mjs    归档与压缩
deploy/                Dockerfile / compose / Caddyfile / .env.example
vault/                 真源
```
