# brain — 本地知识库与记忆体

一个放在本机、可被任何 agent 读写的记忆系统。**纯 Markdown 与 SQLite，零云依赖，零 API 成本。**

- `memory/` — **记忆体**：用户长期定过的事（决策 / 事实 / 坑 / 待办），十几条，KB 级
- `library/` — **知识库**：外部资料原文（PDF / 扫描件 / 图片 / 视频），可到 GB，按需查

一句话区分：**记忆体是「应该一直记得的事」，知识库是「需要时去翻的资料」。**
详细的接入与使用规则在 [`AGENTS.md`](./AGENTS.md)（给 agent 看）和 [`memory/README.md`](./memory/README.md)（给自己看）。

## 目录

```
brain/
├─ AGENTS.md                 给任何 agent 的接入说明（先读这个）
├─ 更新.cmd                  双击：同步 inbox → 重建索引 → 刷阅读页
├─ 看板.cmd                  双击：启动实时看板（可增改），自动开浏览器
├─ push.cmd                  双击：把本地提交推到 GitHub
│
├─ memory/                   记忆体
│  ├─ vault/                 ★ 唯一真源，一条记忆一个 .md
│  │  ├─ 00-index/           RULES.md（写入规则）、INDEX.md（自动索引）
│  │  ├─ 10-knowledge/       可复用的通用结论
│  │  ├─ 20-memory/          decisions / facts / pitfalls / todos / notes
│  │  ├─ 30-sessions/        一次工作的流水
│  │  └─ 90-archive/         过期但保留
│  ├─ bin/kb.mjs             命令行：bootstrap / search / new / supersede / refresh
│  ├─ bin/render.mjs         生成阅读页
│  ├─ bin/push.mjs           走 GitHub API 推送（本机 git push 不通时的替代方案）
│  ├─ server/mcp-server.mjs  MCP 服务（7 个工具，stdio 与 HTTP 双模）
│  ├─ server/ui-server.mjs   看板服务：读 API + SSE 实时推送 + 写入转交 vault.mjs
│  ├─ ui/index.html          看板页面（单文件，无构建）
│  └─ hooks/                 WorkBuddy 会话启动时自动注入相关记忆
│
└─ library/                  知识库
   ├─ inbox/                 ★ 投递口，丢文件进来
   ├─ sources/               原件归档（pdf / docx / pptx / xlsx / md / image / audio / video）
   ├─ markdown/              ★ 每个原件的 markdown 版，入库时自动生成，入 git
   ├─ bin/kb.py              命令行：add / sync / search / md / export-md
   ├─ bin/md_export.py       按格式分派转换引擎，产出 markdown/
   └─ reading/               检索投影，带出处锚点（生成物）
```

## 日常用法

```bash
# 一条命令更新全部（同步 inbox → 导出投影 → 重建索引 → 刷阅读页）
cd memory && node bin/kb.mjs refresh
```

或者直接双击 `更新.cmd`。

| 想做什么 | 怎么做 |
|---|---|
| 记一件事 | 告诉 agent，或 `node bin/kb.mjs new --type decision --title "…" --body "…"` |
| 查记忆 | `node bin/kb.mjs search "关键词"` |
| 放资料 | 丢进 `library/inbox/`，然后 `更新.cmd` |
| 读某篇原文 | 开 `library/markdown/<id>-<标题>.md`，或丢给 agent 读这个路径 |
| 查资料原文 | `python library/bin/kb.py search "关键词"`（带出处页码） |
| 看全部（静态快照） | `cd memory && node bin/render.mjs`，然后打开 `memory/reading/index.html`（`更新.cmd` 会自动做并打开） |
| 实时看 + 直接改 | 双击 `看板.cmd`，或 `node bin/kb.mjs ui`，浏览器开 http://127.0.0.1:8788 |
| 今天变了什么 | `node bin/kb.mjs daily` |

## 推送到 GitHub

本机的 `git push` 在本网络下不通（`github.com:443` 的 TLS 握手被中断），但 `api.github.com`
正常。所以推送走 REST API：**blob → tree → commit → 移动分支指针**，由 `memory/bin/push.mjs` 完成。

```bash
# 推送当前仓库
node memory/bin/push.mjs

# 推别的仓库（脚本通用，不绑定本目录）
node memory/bin/push.mjs --repo "D:/collaborative project/skills"

# 先看看会推什么，不动远程
node memory/bin/push.mjs --dry-run
```

或者双击 `push.cmd`。

几个要点：

- **历史是累积的，不是覆盖的**。新提交接在远程当前 tip 之后，父节点正确传下去，
  所以仓库里能一条条往回看，`git revert <sha>` 能一步撤销。
- **SHA 与本地一致**。提交的 author / committer / 时间 / 树全部照抄本地对象，
  重放出来的 SHA 与本地相同，所以 `git status` 会如实显示 `main...origin/main`（没有 ahead）。
- **只传变化的部分**。blob / tree 的映射缓存在 `.git/remote-cache.json`，
  第二次推送通常只传个位数对象。
- **`--reset` 慎用**。它丢弃远程独有的历史、按本地历史强推指针，只用于远程历史本身是
  假的时候（例如早期脚本用空父提交推上去的那种）。正常场景一律不带这个参数。



- **Markdown 是唯一真源**，没有向量库。检索用 BM25 + 中文二元切分，本地毫秒级，不需 API key。
- **不物理删除**。事实变更走 `supersede`，旧条目保留为 `superseded` 并指向新条目——「我们以前相信什么」本身是信息。
- **记忆的权威低于代码**。记忆与代码冲突时看代码，然后修掉那条记忆。
- **真源入仓，派生物不入仓**。`store.db`（可索引重建）、`reading/`（可重新导出）、阅读页 HTML（可重新渲染）都在 `.gitignore` 里。

## 克隆到新机器后

```bash
git clone <repo> brain && cd brain

# 1. 重建知识库索引（如果 sources/ 里有原件）
cd library && python bin/kb.py rebuild && cd ..

# 2. 重建记忆索引并生成阅读页
cd memory && node bin/kb.mjs refresh
```

依赖：Node 18+（记忆体零依赖）、Python 3.10+（知识库需要 `pymupdf`、`rapidocr-onnxruntime` 等，见 `library/README.md`）。

## 注意

这个仓库可能包含个人工作习惯与环境信息（端口、路径、偏好）。**请保持私有。**
