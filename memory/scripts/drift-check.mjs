#!/usr/bin/env node
/**
 * drift-check.mjs — 记忆漂移与合规检查，可直接进 CI。
 * 退出码 1 表示有错误级问题（不应合并）。
 */
import fs from "node:fs";
import path from "node:path";
import { scan, VAULT, TYPE_DIR } from "../server/lib/vault.mjs";

const errors = [];
const warns = [];

const REQUIRED = ["id", "type", "title", "tags", "created", "updated", "status", "source"];
const SECRET_PATTERNS = [
  [/sk-[A-Za-z0-9]{20,}/, "疑似 OpenAI/Anthropic 风格密钥"],
  [/AKIA[0-9A-Z]{16}/, "疑似 AWS Access Key"],
  [/gh[pousr]_[A-Za-z0-9]{30,}/, "疑似 GitHub Token"],
  [/(password|passwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^\s"']{8,}/i, "疑似明文凭据"],
  [/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, "私钥内容"],
  [/\b1[3-9]\d{9}\b/, "疑似手机号（如为示例数据请改用占位符）"],
];

const entries = scan();
const byId = new Map();
const byTitle = new Map();

for (const e of entries) {
  const where = e.rel;
  const isMeta = e.type === "index"; // RULES / INDEX 属于常驻层，字段要求不同

  // 1. 必填字段
  for (const k of REQUIRED) {
    if (isMeta && !["id", "type", "title", "status"].includes(k)) continue;
    const v = e[k];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length && k === "tags")) {
      // 手写的知识条目允许无 tags，但要有 id/type/title/source
      if (k === "tags") warns.push(`${where}: 缺少 tags，检索时难以归类`);
      else errors.push(`${where}: 缺少必填字段 ${k}`);
    }
  }

  // 2. id 唯一
  if (byId.has(e.id)) errors.push(`id 重复: ${e.id}（${byId.get(e.id).rel} 与 ${where}）`);
  else byId.set(e.id, e);

  // 3. 标题重复（只看有效条目）
  if (e.status === "active") {
    const key = e.title.toLowerCase().replace(/\s+/g, "");
    if (byTitle.has(key)) warns.push(`标题重复: 「${e.title}」出现于 ${byTitle.get(key).rel} 与 ${where}，应合并或用 supersede`);
    else byTitle.set(key, e);
  }

  // 4. 正文长度与空壳
  const bodyLen = e.body.replace(/\s+/g, "").length;
  if (bodyLen < 20) warns.push(`${where}: 正文过短（${bodyLen} 字），大概率是空壳条目`);
  if (bodyLen > 1200) warns.push(`${where}: 正文 ${bodyLen} 字，超过 1200 字，建议拆分（单条 50–150 字召回最好）`);

  // 5. supersedes 链完整性
  for (const oldId of e.supersedes) {
    if (!entries.some((x) => x.id === oldId)) errors.push(`${where}: supersedes 指向不存在的 ${oldId}`);
  }

  // 6. 过期
  const days = (Date.now() - e.mtime) / 86400000;
  if (days > 120 && e.status === "active") warns.push(`${where}: ${Math.round(days)} 天未更新，考虑复核或归档`);
  if (e.type === "todo" && e.status === "active" && days > 30) warns.push(`${where}: 待办超过 30 天未动，考虑关闭`);

  // 7. 密钥与隐私
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(e.body) || re.test(e.source || "")) errors.push(`${where}: ${label}`);
  }

  // 8. 日期格式
  for (const k of ["created", "updated", "valid_from"]) {
    const v = e[k];
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(String(v))) warns.push(`${where}: ${k} 不是 YYYY-MM-DD: ${v}`);
  }

  // 9. 类型与目录是否一致
  const expect = TYPE_DIR[e.type];
  if (expect && !e.rel.startsWith(expect) && e.type !== "index") {
    warns.push(`${where}: 类型 ${e.type} 建议放在 ${expect}/ 下`);
  }
}

// 10. 索引是否落后于真源
try {
  const idx = fs.readFileSync(path.join(VAULT, "00-index/INDEX.md"), "utf8");
  const missing = entries.filter((e) => e.status === "active" && e.type !== "index" && !idx.includes(e.id));
  if (missing.length) warns.push(`INDEX.md 落后：${missing.length} 条有效条目未出现在索引里，运行 kb index`);
} catch {
  warns.push("INDEX.md 不存在，运行 kb index");
}

console.log(`检查 ${entries.length} 条条目（vault: ${VAULT}）`);
if (warns.length) {
  console.log(`\n警告 ${warns.length} 项：`);
  for (const w of warns) console.log(`  ⚠ ${w}`);
}
if (errors.length) {
  console.log(`\n错误 ${errors.length} 项：`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`\n✓ 无错误${warns.length ? `，${warns.length} 项警告` : ""}`);
