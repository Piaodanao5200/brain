#!/usr/bin/env node
/**
 * user-prompt-submit.mjs — 按用户这句话实时检索，把命中的记忆注入上下文
 *
 * 比 session-start 更精准：它拿到的是用户本次真实的提问。
 * 作为 Claude Code 的 UserPromptSubmit hook，实现「新会话自动检索相关知识」。
 *
 * 配置（~/.claude/settings.json 或项目 .claude/settings.json）：
 * {
 *   "hooks": {
 *     "UserPromptSubmit": [{
 *       "hooks": [{ "type": "command", "command": "node <绝对路径>/hooks/user-prompt-submit.mjs", "timeout": 10 }]
 *     }]
 *   }
 * }
 *
 * stdin 收到 { session_id, prompt, cwd, ... }；stdout 注入上下文。
 */
import { search } from "../server/lib/vault.mjs";

let raw = "";
try {
  raw = await new Promise((resolve) => {
    let buf = "";
    process.stdin.on("data", (d) => (buf += d));
    process.stdin.on("end", () => resolve(buf));
    setTimeout(() => resolve(buf), 3000);
  });
} catch {
  raw = "";
}

let prompt = "";
try {
  const payload = JSON.parse(raw || "{}");
  prompt = payload.prompt || payload.user_prompt || "";
} catch {
  prompt = raw;
}

// 太短的输入（"继续"、"嗯"）不检索，避免噪音
const cleaned = String(prompt).replace(/\s+/g, " ").trim();
if (cleaned.length < 6) process.exit(0);

let hits = [];
try {
  hits = search(cleaned, { k: 5 }).filter((h) => h.score > 0.8);
} catch {
  process.exit(0);
}
if (!hits.length) process.exit(0);

const lines = ["<memory-hits>"];
lines.push("以下长期记忆与本次提问相关，按相关度排序（只是摘要，需要细节请 kb_read）：");
for (const h of hits) {
  lines.push(`- ${h.id} | ${h.title} | ${h.tags.map((t) => "#" + t).join(" ")} | ${String(h.updated).slice(0, 10)}`);
  if (h.snippet) lines.push(`  ${h.snippet}`);
}
lines.push("若记忆与实际代码/文件冲突，以实际文件为准，并顺手修正记忆。");
lines.push("</memory-hits>");
process.stdout.write(lines.join("\n") + "\n");
