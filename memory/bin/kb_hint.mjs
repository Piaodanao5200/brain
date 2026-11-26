#!/usr/bin/env node
// kb_hint — 极短检索：把用户原话喂进来，最多回 3 条候选（标题 + 一句结论），约 150 token。
// 用法：
//   node memory/bin/kb_hint.mjs "用户刚才说的话"
//   node memory/bin/kb_hint.mjs "关键词" --k 5 --json
// 设计要点：不读全量索引、不读全文，只给“够不够触发深读”的判断依据。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.join(HERE, "..", "vault");

const argv = process.argv.slice(2);
const jsonOut = argv.includes("--json");
let k = 3;
const kIdx = argv.indexOf("--k");
if (kIdx >= 0 && argv[kIdx + 1]) {
  const n = Number(argv[kIdx + 1]);
  if (Number.isFinite(n) && n > 0) k = Math.min(10, Math.floor(n));
}
const query = argv
  .filter((a, i) => !a.startsWith("--") && !(kIdx >= 0 && i === kIdx + 1))
  .join(" ")
  .trim();

if (!query) {
  console.error('用法: node kb_hint.mjs "原话或关键词" [--k 3] [--json]');
  process.exit(2);
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".md") && e.name !== "INDEX.md" && e.name !== "RULES.md") acc.push(p);
  }
  return acc;
}

function parse(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fm = {};
  let body = raw;
  if (m) {
    body = raw.slice(m[0].length);
    for (const line of m[1].split(/\r?\n/)) {
      const mm = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (!mm) continue;
      let v = mm[2].trim();
      if (v.startsWith("[") && v.endsWith("]")) {
        v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      } else {
        v = v.replace(/^["']|["']$/g, "");
      }
      fm[mm[1]] = v;
    }
  }
  return { fm, body: body.trim(), file };
}

function tokensOf(text) {
  const out = new Set();
  const chunks = text.toLowerCase().split(/[\s,，。、;；:：!！?？()（）\[\]"“”'’/\\|+·\-—_]+/).filter(Boolean);
  for (const c of chunks) {
    if (!c) continue;
    if (/^[\x00-\x7f]+$/.test(c)) {
      if (c.length >= 2) out.add(c);
    } else {
      out.add(c);
      for (let i = 0; i + 2 <= c.length; i++) out.add(c.slice(i, i + 2));
    }
  }
  return out;
}

function firstSentence(body) {
  const clean = body
    .replace(/^#+\s.*$/gm, "")
    .replace(/<sub>[\s\S]*?<\/sub>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const hit = clean.match(/^(.{10,90}?[。！？；])/);
  return (hit ? hit[1] : clean.slice(0, 90)).trim();
}

const qt = tokensOf(query);
const entries = walk(VAULT)
  .map(parse)
  .filter((e) => {
    const st = String(e.fm.status || "active");
    return st !== "superseded" && st !== "archived";
  })
  .map((e) => {
    const title = String(e.fm.title || path.basename(e.file, ".md"));
    const aliases = Array.isArray(e.fm.aliases) ? e.fm.aliases.join(" ") : String(e.fm.aliases || "");
    const tags = Array.isArray(e.fm.tags) ? e.fm.tags.join(" ") : String(e.fm.tags || "");
    const lowBody = e.body.toLowerCase();
    let score = 0;
    const hits = [];
    for (const t of qt) {
      let s = 0;
      if (title.toLowerCase().includes(t)) s += 5;
      if (aliases.toLowerCase().includes(t)) s += 3;
      if (tags.toLowerCase().includes(t)) s += 2;
      const cnt = lowBody.split(t).length - 1;
      if (cnt > 0) s += Math.min(cnt, 5);
      if (s > 0) {
        score += s;
        hits.push(t);
      }
    }
    return {
      id: String(e.fm.id || path.basename(e.file, ".md")),
      type: String(e.fm.type || "note"),
      title,
      summary: firstSentence(e.body),
      score,
      hits: hits.slice(0, 4),
    };
  })
  .filter((x) => x.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, k);

if (jsonOut) {
  console.log(JSON.stringify({ query, count: entries.length, hits: entries }, null, 2));
} else {
  if (!entries.length) {
    console.log("按记忆：无命中");
    console.log("下一步：换更具体的词再试（同义词 / 中英文 / 缩写），或 node memory/bin/kb.mjs search \"词1|词2\" --multi");
  } else {
    console.log("按记忆：命中 " + entries.length + " 条");
    for (const e of entries) {
      console.log("- [" + e.type + "] " + e.title);
      console.log("  " + e.summary);
    }
    console.log("够就 node memory/bin/kb.mjs read <id> 读 1–2 条全文；不够就换词再 hint。");
  }
}
