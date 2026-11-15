# CLAUDE.md

本项目的全部 agent 协作规则在 [AGENTS.md](./AGENTS.md)，请先读它。

要点速查：

- **会话开始**：先 `kb_bootstrap`，再针对用户问题 `kb_search`（k=5），只 `kb_read` 命中的条目。不要全量加载。
- **写入前**：必须 `kb_search` 查重；事实变更用 `kb_supersede` 而非新增。
- **不存密钥**；`source` 必填；命令只写指向不写副本。
- **记忆权威低于代码**：冲突时以代码为准，并修正记忆。

真源目录：`vault/`（纯 Markdown）。规则全文：`vault/00-index/RULES.md`。
