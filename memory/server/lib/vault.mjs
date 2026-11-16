/**
 * vault.mjs — Markdown 真源的读写、检索、索引
 * 零依赖，Node 18+。
 *
 * 设计要点：
 * 1. 文件系统就是数据库。每条记忆一个 .md 文件，带 YAML frontmatter。
 * 2. 检索用 BM25（CJK 走二元切分），不依赖 embedding 服务，离线可跑。
 * 3. 不做物理删除：作废走 status: superseded，冲突检测靠 supersedes 链。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const VAULT = process.env.KB_VAULT
  ? path.resolve(process.env.KB_VAULT)
  : path.resolve(HERE, "../../vault");

export const TYPE_DIR = {
  knowledge: "10-knowledge",
  decision: "20-memory/decisions",
  fact: "20-memory/facts",
  pitfall: "20-memory/pitfalls",
  todo: "20-memory/todos",
  note: "20-memory/notes",
  session: "30-sessions",
};

const ALIAS = {
  know: "knowledge", doc: "knowledge", docs: "knowledge", 知识: "knowledge",
  dec: "decision", 决策: "decision",
  f: "fact", 事实: "fact",
  p: "pitfall", 坑: "pitfall", 踩坑: "pitfall",
  t: "todo", 待办: "todo",
  n: "note", 笔记: "note",
  s: "session", 会话: "session",
};

export function normType(t) {
  const k = String(t || "note").toLowerCase().trim();
  const v = ALIAS[k] || k;
  if (!TYPE_DIR[v]) throw new Error(`未知条目类型: ${t}；可用: ${Object.keys(TYPE_DIR).join(", ")}`);
  return v;
}

/* ---------------- frontmatter ---------------- */

function parseScalar(raw) {
  const v = raw.trim();
  if (v === "" || v === "~" || v === "null") return "";
  if (v.startsWith("[") && v.endsWith("]")) {
    return v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^(true|false)$/i.test(v)) return v.toLowerCase() === "true";
  return v.replace(/^["']|["']$/g, "");
}

export function parseFrontmatter(text) {
  const src = String(text).replace(/^\uFEFF/, "");
  if (!src.startsWith("---")) return { fm: {}, body: src };
  const end = src.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: src };
  const head = src.slice(3, end).replace(/^\r?\n/, "");
  const body = src.slice(end + 4).replace(/^\r?\n/, "");
  const fm = {};
  let listKey = null;
  for (const line of head.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (m) {
      const [, k, rest] = m;
      if (rest.trim() === "") {
        listKey = k;
        fm[k] = [];
      } else {
        listKey = null;
        fm[k] = parseScalar(rest);
      }
      continue;
    }
    const li = line.match(/^\s*-\s+(.*)$/);
    if (li && listKey) {
      fm[listKey].push(parseScalar(li[1]));
    }
  }
  return { fm, body };
}

function yamlVal(v) {
  if (Array.isArray(v)) return `[${v.map((x) => String(x)).join(", ")}]`;
  if (v === undefined || v === null) return "";
  return String(v);
}

export function stringifyFrontmatter(fm, body) {
  const order = ["id", "type", "scope", "title", "tags", "created", "updated",
    "valid_from", "supersedes", "status", "confidence", "source"];
  const keys = [...order.filter((k) => fm[k] !== undefined),
    ...Object.keys(fm).filter((k) => !order.includes(k))];
  const head = keys.map((k) => `${k}: ${yamlVal(fm[k])}`).join("\n");
  return `---\n${head}\n---\n\n${String(body || "").trim()}\n`;
}

/* ---------------- 扫描 ---------------- */

function walk(dir, out = []) {
  let items = [];
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const it of items) {
    if (it.name.startsWith(".") || it.name === "node_modules") continue;
    const p = path.join(dir, it.name);
    if (it.isDirectory()) walk(p, out);
    else if (it.isFile() && it.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const SKIP = new Set(["_template.md", "INDEX.md"]);

export function scan() {
  const files = walk(VAULT).filter((f) => !SKIP.has(path.basename(f)));
  const entries = [];
  for (const file of files) {
    let raw;
    try {
      raw = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(VAULT, file).split(path.sep).join("/");
    const { fm, body } = parseFrontmatter(raw);
    const stat = fs.statSync(file);
    entries.push({
      id: fm.id || rel.replace(/\.md$/, ""),
      type: fm.type || guessType(rel),
      scope: fm.scope || "project",
      title: fm.title || firstHeading(body) || path.basename(file, ".md"),
      tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
      created: fm.created || iso(stat.birthtime),
      updated: fm.updated || iso(stat.mtime),
      valid_from: fm.valid_from || "",
      supersedes: Array.isArray(fm.supersedes) ? fm.supersedes : (fm.supersedes ? [fm.supersedes] : []),
      status: fm.status || "active",
      superseded_by: fm.superseded_by || "",
      confidence: fm.confidence === "" || fm.confidence === undefined ? null : Number(fm.confidence),
      source: fm.source || "",
      body,
      rel,
      file,
      mtime: stat.mtimeMs,
    });
  }
  return entries;
}

function guessType(rel) {
  if (rel.startsWith("10-knowledge")) return "knowledge";
  if (rel.startsWith("30-sessions")) return "session";
  if (rel.includes("/decisions/")) return "decision";
  if (rel.includes("/facts/")) return "fact";
  if (rel.includes("/pitfalls/")) return "pitfall";
  if (rel.includes("/todos/")) return "todo";
  if (rel.startsWith("00-index")) return "index";
  if (rel.startsWith("90-archive")) return "archive";
  return "note";
}

function firstHeading(body) {
  const m = String(body).match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function iso(d) {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/* ---------------- 按天汇总 ---------------- */

function localDay(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 某一天发生了什么：哪些是当天新增、哪些是当天改的、哪些被作废。
 * 三个入口（看板 / CLI daily / MCP kb_daily）共用这一个实现，避免三套口径对不上。
 */
export function dailyDigest(dateStr) {
  const day = String(dateStr || "").trim() || localDay(Date.now());
  const all = scan().filter((e) => e.type !== "index");
  const isActive = (e) => e.status === "active" || e.status === "canonical";
  const dayOf = (e) => (e.created ? e.created : e.mtime ? localDay(e.mtime) : "");
  const active = all.filter(isActive);
  const added = active.filter((e) => dayOf(e) === day);
  const changed = active.filter((e) => dayOf(e) !== day && e.updated === day);
  const retired = all.filter((e) => e.status === "superseded" && e.updated === day);
  return { date: day, added, changed, retired, counts: { added: added.length, changed: changed.length, retired: retired.length } };
}

/* ---------------- 检索：BM25 ---------------- */

export function tokenize(s) {
  if (!s) return [];
  const lower = String(s).toLowerCase();
  const out = [];
  for (const m of lower.matchAll(/[a-z0-9][a-z0-9_.\-]*/g)) {
    if (m[0].length > 1) out.push(m[0]);
  }
  const cjk = lower.replace(/[^\u3400-\u9fff]+/g, " ").trim();
  if (cjk) {
    for (const run of cjk.split(/\s+/)) {
      if (run.length === 1) out.push(run);
      for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
    }
  }
  return out;
}

const K1 = 1.2, B = 0.75;
const FIELD_W = { title: 3, tags: 2, body: 1, source: 0.5 };

function docTokens(e) {
  return {
    title: tokenize(e.title),
    tags: tokenize(e.tags.join(" ")),
    body: tokenize(e.body),
    source: tokenize(e.source),
  };
}

export function search(query, opts = {}) {
  const k = Math.max(1, Math.min(50, Number(opts.k) || 6));
  const entries = scan();
  const now = Date.now();
  const q = tokenize(query);
  const qset = [...new Set(q)];

  // 过滤
  const pool = entries.filter((e) => {
    if (opts.type && e.type !== normTypeLoose(opts.type)) return false;
    if (opts.scope && e.scope !== opts.scope) return false;
    // 规则与索引属于常驻层，由 bootstrap 一次性注入，不参与关键词检索，避免每次检索都被顶到前面
    if (e.type === "index" && !opts.includeIndex) return false;
    if (Array.isArray(opts.tags) && opts.tags.length
      && !opts.tags.every((t) => e.tags.some((x) => String(x).toLowerCase() === String(t).toLowerCase()))) return false;
    if (opts.includeInactive) return true;
    return e.status === "active" || e.status === "canonical";
  });

  if (!pool.length) return [];

  const docs = pool.map((e) => {
    const t = docTokens(e);
    const tf = {};
    const len = {};
    for (const [f, w] of Object.entries(FIELD_W)) {
      const toks = t[f] || [];
      len[f] = toks.length;
      for (const tok of toks) tf[tok] = (tf[tok] || 0) + w;
    }
    const total = Object.values(len).reduce((a, b) => a + b, 0);
    return { e, tf, total };
  });

  const avg = docs.reduce((a, d) => a + d.total, 0) / docs.length || 1;

  // IDF
  const df = {};
  for (const term of qset) {
    df[term] = docs.reduce((a, d) => a + (d.tf[term] ? 1 : 0), 0);
  }
  const idf = {};
  for (const term of qset) {
    idf[term] = Math.log(1 + (docs.length - df[term] + 0.5) / (df[term] + 0.5));
  }

  const scored = docs.map((d) => {
    let s = 0;
    for (const term of qset) {
      if (!d.tf[term]) continue;
      const f = d.tf[term];
      s += idf[term] * (f * (K1 + 1)) / (f + K1 * (1 - B + B * (d.total / avg)));
    }
    // 精确短语命中加成
    const qLower = String(query).toLowerCase().trim();
    if (qLower.length >= 2) {
      if (d.e.title.toLowerCase().includes(qLower)) s += 3;
      else if (d.e.body.toLowerCase().includes(qLower)) s += 1.2;
      if (d.e.tags.some((t) => qLower.includes(String(t).toLowerCase()))) s += 0.8;
    }
    // 新鲜度微调：30 天内加权
    const days = (now - d.e.mtime) / 86400000;
    if (days < 30) s *= 1 + 0.15 * (1 - days / 30);
    return { ...d.e, score: Number(s.toFixed(3)) };
  });

  const hits = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  // 无词面命中时，返回最近更新的条目，避免 agent 拿到空结果后瞎猜
  const result = hits.length ? hits : pool
    .sort((a, b) => b.mtime - a.mtime)
    .map((e) => ({ ...e, score: 0 }));
  return result.slice(0, k).map((e) => ({ ...e, snippet: snippetFor(e, qset) }));
}

function normTypeLoose(t) {
  try {
    return normType(t);
  } catch {
    return t;
  }
}

function snippetFor(e, qset) {
  const plain = e.body.replace(/^#.*$/gm, "").replace(/\s+/g, " ").trim();
  if (!plain) return "";
  const lower = plain.toLowerCase();
  let at = -1;
  for (const t of qset) {
    if (t.length < 2) continue;
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return plain.slice(0, 160) + (plain.length > 160 ? "…" : "");
  const start = Math.max(0, at - 40);
  return (start > 0 ? "…" : "") + plain.slice(start, start + 200) + (plain.length > start + 200 ? "…" : "");
}

/* ---------------- 写入 ---------------- */

export function sanitizeName(s) {
  return String(s).replace(/[\\/:*?"<>|\r\n\t]/g, " ").replace(/\s+/g, "-").slice(0, 48) || "untitled";
}

function newId(type) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${type}-${ymd}-${crypto.randomBytes(2).toString("hex")}`;
}

function normalizeTitle(t) {
  return String(t).toLowerCase().replace(/\s+/g, "").replace(/[，。、；：！？,.;:!?]/g, "");
}

export function writeEntry(input = {}) {
  const type = normType(input.type);
  const title = String(input.title || "").trim();
  if (!title) throw new Error("title 必填：一句话说清这条记忆是什么");
  const body = String(input.body || "").trim();
  if (!body) throw new Error("body 必填：请写 50–150 字正文，不要只留标题");
  const tags = Array.isArray(input.tags) ? input.tags : String(input.tags || "").split(/[,，\s]+/).filter(Boolean);
  const warnings = [];

  if (body.length > 2000) warnings.push("正文超过 2000 字，建议拆分或压缩到 150 字以内，否则检索信噪比会下降");

  const entries = scan();
  const norm = normalizeTitle(title);
  const dup = entries.find((e) => e.status === "active" && normalizeTitle(e.title) === norm);
  if (dup && !input.supersedes) {
    if (!input.force) {
      throw new Error(`已存在同标题条目 ${dup.id}（${dup.rel}）。如果要修改它，用 kb_supersede；确认是不同条目请传 force=true`);
    }
    warnings.push(`与已有条目 ${dup.id} 标题相同，已按 force 写入，注意可能造成两条记忆并存`);
  }

  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const id = input.id || newId(type);
  const fm = {
    id,
    type,
    scope: input.scope || "project",
    title,
    tags,
    created: date,
    updated: date,
    valid_from: input.valid_from || date,
    supersedes: input.supersedes ? (Array.isArray(input.supersedes) ? input.supersedes : [input.supersedes]) : [],
    status: "active",
    confidence: input.confidence ?? 0.9,
    source: input.source || "手动写入",
  };

  const dir = path.join(VAULT, TYPE_DIR[type]);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${id}-${sanitizeName(title)}.md`);
  fs.writeFileSync(file, stringifyFrontmatter(fm, body), "utf8");

  // 建立双向链接：在被取代条目里标记
  if (fm.supersedes.length) {
    for (const oldId of fm.supersedes) {
      markSuperseded(oldId, id, warnings);
    }
  }
  rebuildIndex();
  return { id, file, rel: path.relative(VAULT, file), warnings, date };
}

function markSuperseded(oldId, newId, warnings) {
  const old = scan().find((e) => e.id === oldId);
  if (!old) {
    warnings.push(`supersedes 指向的条目 ${oldId} 不存在，请检查 id`);
    return;
  }
  const { fm, body } = parseFrontmatter(fs.readFileSync(old.file, "utf8"));
  fm.status = "superseded";
  fm.superseded_by = newId;
  fm.updated = new Date().toISOString().slice(0, 10);
  const note = body.includes("<!-- superseded -->")
    ? body
    : `${body}\n\n<!-- superseded -->\n> 已被 \`${newId}\` 取代，检索时请优先使用新条目。`;
  fs.writeFileSync(old.file, stringifyFrontmatter(fm, note), "utf8");
}

export function supersede(id, patch = {}) {
  const old = scan().find((e) => e.id === id || e.rel === id);
  if (!old) throw new Error(`找不到条目 ${id}`);
  const r = writeEntry({
    type: old.type,
    title: patch.title || old.title,
    body: patch.body || old.body,
    tags: patch.tags || old.tags,
    scope: patch.scope || old.scope,
    source: patch.source || old.source || "supersede",
    confidence: patch.confidence ?? old.confidence ?? 0.9,
    supersedes: [old.id],
    force: true,
  });
  return r;
}

/**
 * 原地修改一条记忆：只改你给的字段，id 与 created 保持不变，updated 记为今天。
 * 语义变更（结论变了）应当走 supersede，不要用这个函数覆盖历史。
 */
export function updateEntry(idOrRel, patch = {}) {
  const e = scan().find((x) => x.id === idOrRel || x.rel === idOrRel);
  if (!e) throw new Error(`找不到条目 ${idOrRel}`);

  const { fm, body: oldBody } = parseFrontmatter(fs.readFileSync(e.file, "utf8"));
  let body = oldBody;
  const today = new Date();

  if (patch.title !== undefined) {
    const t = String(patch.title).trim();
    if (!t) throw new Error("标题不能为空");
    fm.title = t;
  }
  if (patch.body !== undefined) {
    const b = String(patch.body).trim();
    if (!b) throw new Error("正文不能为空");
    body = b;
  }
  if (patch.tags !== undefined) {
    fm.tags = Array.isArray(patch.tags)
      ? patch.tags
      : String(patch.tags || "").split(/[,，\s]+/).filter(Boolean);
  }
  if (patch.status !== undefined) {
    const ok = ["active", "canonical", "superseded", "archived", "draft"];
    if (!ok.includes(patch.status)) throw new Error(`status 只能是 ${ok.join(" / ")}`);
    fm.status = patch.status;
  }
  if (patch.confidence !== undefined && patch.confidence !== null && patch.confidence !== "") {
    const c = Number(patch.confidence);
    if (Number.isNaN(c) || c < 0 || c > 1) throw new Error("confidence 要在 0 到 1 之间");
    fm.confidence = c;
  }
  if (patch.source !== undefined) fm.source = String(patch.source);
  if (patch.scope !== undefined) fm.scope = String(patch.scope);

  fm.updated = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let file = e.file;
  let renamed = false;
  if (patch.title !== undefined) {
    const dir = path.dirname(e.file);
    const target = path.join(dir, `${fm.id}-${sanitizeName(fm.title)}.md`);
    if (target !== e.file && !fs.existsSync(target)) {
      file = target;
      renamed = true;
    }
  }

  fs.writeFileSync(file, stringifyFrontmatter(fm, body), "utf8");
  if (renamed) fs.unlinkSync(e.file);
  rebuildIndex();
  return { id: fm.id, file, rel: path.relative(VAULT, file), renamed };
}

/* ---------------- 索引 ---------------- */

const TYPE_LABEL = {
  knowledge: "知识", decision: "决策", fact: "事实",
  pitfall: "坑", todo: "待办", note: "笔记", session: "会话", index: "索引",
};

export function buildIndex() {
  const entries = scan().filter((e) => !["index", "archive"].includes(e.type));
  const active = entries.filter((e) => e.status === "active" || e.status === "canonical");
  const groups = {};
  for (const e of active) {
    (groups[e.type] ||= []).push(e);
  }
  const now = new Date().toISOString().slice(0, 10);
  const lines = [
    "---",
    "id: INDEX",
    "type: index",
    "title: 知识库与记忆体总索引",
    "status: canonical",
    `updated: ${now}`,
    "---",
    "",
    "# 总索引",
    "",
    `> 由 \`node bin/kb.mjs index\` 自动生成，请勿手改。共 ${active.length} 条有效条目。`,
    "> 每条格式：`id` 标题 · #标签 · 更新日期",
    "",
  ];
  for (const [type, list] of Object.entries(groups)) {
    list.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    lines.push(`## ${TYPE_LABEL[type] || type}（${list.length}）`, "");
    for (const e of list) {
      const tagStr = e.tags.length ? " · " + e.tags.map((t) => `#${t}`).join(" ") : "";
      lines.push(`- \`${e.id}\` ${e.title}${tagStr} · ${e.updated}`);
    }
    lines.push("");
  }
  const stale = active.filter((e) => (Date.now() - e.mtime) / 86400000 > 60);
  if (stale.length) {
    lines.push("## 可能过期（60 天未更新）", "");
    for (const e of stale) lines.push(`- \`${e.id}\` ${e.title} · ${e.updated}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function rebuildIndex() {
  try {
    fs.mkdirSync(path.join(VAULT, "00-index"), { recursive: true });
    fs.writeFileSync(path.join(VAULT, "00-index", "INDEX.md"), buildIndex(), "utf8");
    return true;
  } catch {
    return false;
  }
}

/* ---------------- 与会话启动相关 ---------------- */

export function rules() {
  try {
    return fs.readFileSync(path.join(VAULT, "00-index/RULES.md"), "utf8");
  } catch {
    return "";
  }
}

export function recent(days = 14, limit = 15) {
  const cutoff = Date.now() - days * 86400000;
  return scan()
    .filter((e) => e.mtime >= cutoff && e.type !== "index" && e.status !== "archived")
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);
}

export function read(idOrRel) {
  const key = String(idOrRel || "").trim();
  if (!key) throw new Error("需要 id 或相对路径");
  const entries = scan();
  const e = entries.find((x) => x.id === key)
    || entries.find((x) => x.rel === key || x.rel.replace(/\.md$/, "") === key.replace(/\.md$/, ""))
    || entries.find((x) => x.title === key);
  if (!e) throw new Error(`找不到条目 ${key}；先用 kb_search 检索`);
  return e;
}
