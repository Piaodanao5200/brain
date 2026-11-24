# 记忆库操作与取数（L2 专题）

> L2 专题层：kb.mjs 命令用法、视频/帖子取数原则。
> 入口索引：`memory-technical.md`。字符预算 3,000。
> **适用性**：通用原则（宁可缺失不可污染等）所有 agent 遵守；具体命令/本机路径多为 WorkBuddy 环境，其他 agent 用到再核对自身环境。

## 记忆库操作
根目录 `D:\collaborative project\brain`（记忆体 + `library/` 知识库）。有历史决策、约定、环境事实时先查这里。

- 搜：`node memory/bin/kb.mjs search "关键词" -k 5`
- 读全文：`node memory/bin/kb.mjs read <id>`
- 写新条目：`node memory/bin/kb.mjs new --type knowledge|decision|fact|pitfall --title "…" --body "…"`，然后 `index`
- 一键刷新：`node memory/bin/kb.mjs refresh`（同步 inbox → 补 markdown → 重建索引 → 同步索引 → 刷阅读页）
- **写入前必须问用户**，不自动记录。

> 2026-11-16 实测：`settings.json` 的 shell hook 在 WorkBuddy 桌面版（5.11.3）不执行，自动注入改由 `MEMORY.md` 承担。原 hook 配置保留，若将来版本恢复可直接用。

## 视频/帖子取数
`zw-summary` 是多 agent 共用技能（实体 `D:\collaborative project\skills\zw-summary\`，各处挂 Junction）。`adapters/ego_fetch.py` 取五平台元数据与评论，`yt_fetch.py` 管 YouTube；四档输出 `--quiet` / JSON / `--digest` / `--full`，另支持 `--search`。原则：宁可缺失，不能污染（别用 `body.innerText` 兜底）。
