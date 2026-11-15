#!/usr/bin/env node
/**
 * compact.mjs — 压缩与归档：把过期、低价值、长期不动的条目挑出来
 *
 * 只做确定性的整理，不调用 LLM：
 *   --dry-run   默认，只报告
 *   --apply     实际归档（移动到 90-archive/，status 置 archived）
 *   --days 90   判断"过期"的天数阈值
 *
 * 会话条目的压缩（摘要成决策/事实）需要判断力，交给 agent 做，
 * 这里只负责把它们筛出来并提示。
 */
import fs from "node:fs";
import path from "node:path";
import { scan, VAULT, parseFrontmatter, stringifyFrontmatter, rebuildIndex } from "../server/lib/vault.mjs";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const daysIdx = args.indexOf("--days");
const DAYS = daysIdx !== -1 ? Number(args[daysIdx + 1]) || 90 : 90;

const entries = scan().filter((e) => !["index", "archive"].includes(e.type));
const now = Date.now();

const candidates = [];

for (const e of entries) {
  const ageDays = (now - e.mtime) / 86400000;
  const isDone = e.status === "superseded" || e.status === "archived";
  const lowConf = e.confidence !== null && e.confidence < 0.35;
  const stale = ageDays > DAYS;

  if (isDone && stale) {
    candidates.push({ e, reason: `${e.status} 且 ${Math.round(ageDays)} 天未动`, action: "archive" });
  } else if (lowConf) {
    candidates.push({ e, reason: `置信度 ${e.confidence} 偏低`, action: "review" });
  } else if (e.type === "todo" && e.status === "active" && ageDays > 30) {
    candidates.push({ e, reason: `待办 ${Math.round(ageDays)} 天未完成`, action: "review" });
  } else if (e.type === "session" && stale) {
    candidates.push({ e, reason: `会话记录已 ${Math.round(ageDays)} 天，可压缩为决策或事实`, action: "summarize" });
  }
}

if (!candidates.length) {
  console.log(`没有需要整理的条目（阈值 ${DAYS} 天，共 ${entries.length} 条）。`);
  process.exit(0);
}

console.log(`${candidates.length} 条待整理${apply ? "" : "（dry-run，加 --apply 执行）"}：\n`);
for (const { e, reason, action } of candidates) {
  console.log(`[${action}] ${e.id}  ${e.title}`);
  console.log(`          ${reason} · ${e.rel}`);
}

if (apply) {
  const archDir = path.join(VAULT, "90-archive");
  fs.mkdirSync(archDir, { recursive: true });
  let moved = 0;
  for (const { e, action } of candidates) {
    if (action !== "archive") continue;
    const { fm, body } = parseFrontmatter(fs.readFileSync(e.file, "utf8"));
    fm.status = "archived";
    fm.updated = new Date().toISOString().slice(0, 10);
    const target = path.join(archDir, path.basename(e.file));
    fs.writeFileSync(target, stringifyFrontmatter(fm, body), "utf8");
    fs.unlinkSync(e.file);
    moved++;
  }
  rebuildIndex();
  console.log(`\n已归档 ${moved} 条到 90-archive/，索引已重建。`);
  console.log("review / summarize 类需要人或有判断力的 agent 处理，脚本不动它们。");
}
