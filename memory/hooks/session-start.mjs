#!/usr/bin/env node
/**
 * session-start.mjs — 会话启动时自动注入「记忆地图」
 *
 * 用途：作为 Claude Code 的 SessionStart hook，把索引写进上下文，
 *      这样 agent 一开局就知道有哪些记忆，不需要你提醒它去查。
 *
 * 配置（~/.claude/settings.json 或项目 .claude/settings.json）：
 * {
 *   "hooks": {
 *     "SessionStart": [{
 *       "hooks": [{ "type": "command", "command": "node <绝对路径>/hooks/session-start.mjs" }]
 *     }]
 *   }
 * }
 *
 * stdout 会被加进上下文，所以这里只输出紧凑索引，不输出全文。
 */
import { scan, recent } from "../server/lib/vault.mjs";

const entries = scan().filter((e) => !["index", "archive"].includes(e.type));
const active = entries.filter((e) => e.status === "active" || e.status === "canonical");

if (!active.length) {
  process.exit(0); // 空库不注入噪音
}

const label = { knowledge: "知识", decision: "决策", fact: "事实", pitfall: "坑", todo: "待办", note: "笔记", session: "会话" };
const groups = {};
for (const e of active) (groups[e.type] ||= []).push(e);

const lines = [
  "<memory-map>",
  `长期知识库与记忆体中有 ${active.length} 条有效条目。当本次任务与其相关时，`,
  "先用 kb_search 检索、再 kb_read 取全文；不相关就不要加载，也不要提及这份索引。",
  "",
];
for (const [type, list] of Object.entries(groups)) {
  list.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  lines.push(`${label[type] || type}：`);
  for (const e of list) {
    lines.push(`- ${e.id} | ${e.title} | ${e.tags.map((t) => "#" + t).join(" ") || "-"}`);
  }
}
const rec = recent(7, 5);
if (rec.length) {
  lines.push("", "最近变更：" + rec.map((e) => `${e.title}(${e.id})`).join("；"));
}
lines.push("</memory-map>");
process.stdout.write(lines.join("\n") + "\n");
