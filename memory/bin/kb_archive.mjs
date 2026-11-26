#!/usr/bin/env node
// kb_archive — 把"作废满 N 天"的旧条目移进 90-archive（不物理删除，历史留得住）。
// 用法：
//   node memory/bin/kb_archive.mjs                 # 只列清单，不动文件（默认）
//   node memory/bin/kb_archive.mjs --apply         # 真移
//   node memory/bin/kb_archive.mjs --days 90       # 改天数门槛
//   node memory/bin/kb_archive.mjs --vault <目录>   # 指定别的 vault（测试用）
// 规则：status = superseded，且 frontmatter 的 updated 日期距今 ≥ days 天 → 候选。
// 移法：原文件搬到 90-archive/<原目录名>-<文件名>.md，frontmatter 改 status: archived 并补 archived: 日期。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const DRY = !APPLY;
const idx = argv.indexOf("--days");
const DAYS = idx >= 0 && argv[idx + 1] ? Math.max(0, Number(argv[idx + 1])) : 90;
const vIdx = argv.indexOf("--vault");
const VAULT = vIdx >= 0 && argv[vIdx + 1] ? path.resolve(argv[vIdx + 1]) : path.join(HERE, "..", "vault");
const ARCHIVE = path.join(VAULT, "90-archive");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (path.relative(VAULT, p).startsWith("90-archive")) continue;
      walk(p, acc);
    } else if (e.name.endsWith(".md") && e.name !== "INDEX.md" && e.name !== "RULES.md") {
      acc.push(p);
    }
  }
  return acc;
}

function frontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!mm) continue;
    fm[mm[1]] = mm[2].trim().replace(/^["']|["']$/g, "");
  }
  return { fm, headLen: m[0].length };
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const cutoffMs = DAYS * 86400000;

const candidates = [];
for (const f of walk(VAULT)) {
  const raw = fs.readFileSync(f, "utf8");
  const parsed = frontmatter(raw);
  if (!parsed) continue;
  const st = String(parsed.fm.status || "active");
  if (st !== "superseded") continue;
  const dateStr = parsed.fm.updated || parsed.fm.created || parsed.fm.valid_from || "";
  const d = dateStr ? new Date(dateStr + "T00:00:00") : fs.statSync(f).mtime;
  if (Number.isNaN(d.getTime())) continue;
  const age = today.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (age >= cutoffMs) {
    candidates.push({ file: f, id: String(parsed.fm.id || path.basename(f, ".md")), dateStr, ageDays: Math.round(age / 86400000), raw, headLen: parsed.headLen });
  }
}

console.log("vault: " + VAULT);
console.log("门槛: 作废满 " + DAYS + " 天 ｜ 候选 " + candidates.length + " 条" + (DRY ? "（只列不清，加 --apply 才真移）" : ""));
for (const c of candidates) {
  console.log("- " + c.id + " ｜ updated " + (c.dateStr || "未知") + " ｜ 已 " + c.ageDays + " 天");
}

if (!APPLY) {
  if (candidates.length) console.log("\n确认后跑: node memory/bin/kb_archive.mjs --apply");
  process.exit(0);
}

if (!candidates.length) process.exit(0);
fs.mkdirSync(ARCHIVE, { recursive: true });
const todayStr = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
let moved = 0;
for (const c of candidates) {
  const rel = path.relative(VAULT, c.file);
  const tag = path.basename(path.dirname(c.file));
  const dest = path.join(ARCHIVE, tag + "-" + path.basename(c.file));
  const head = c.raw.slice(0, c.headLen);
  const body = c.raw.slice(c.headLen);
  const lines = head.split(/\r?\n/);
  const endIdx = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  for (let i = 1; i < endIdx; i++) {
    if (/^status:\s*/i.test(lines[i])) lines[i] = "status: archived";
  }
  if (!lines.some((l) => /^archived:/i.test(l))) {
    lines.splice(endIdx, 0, "archived: " + todayStr);
  }
  fs.writeFileSync(dest, lines.join("\n") + body, "utf8");
  fs.unlinkSync(c.file);
  if (rel.startsWith("90-archive")) continue;
  moved++;
  console.log("✓ " + rel + " → 90-archive/" + path.basename(dest));
}
console.log("\n共移入归档 " + moved + " 条；旧文件未物理删除，仍可从 90-archive 找回。");
