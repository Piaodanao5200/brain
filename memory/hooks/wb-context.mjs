#!/usr/bin/env node
/**
 * wb-context.mjs — WorkBuddy hook：把本地记忆库 + 专业知识库的命中结果注入上下文
 *
 * 一个脚本同时服务两个事件：
 *   SessionStart     → 输出「记忆地图」：库里有什么，够 agent 判断该不该查
 *   UserPromptSubmit → 拿用户这句话去两边检索，把命中的条目与原文片段注入
 *
 * stdin 收到 {session_id, cwd, hook_event_name, prompt?, source?}
 * stdout 必须是单个 JSON 对象：
 *   {"hookSpecificOutput":{"hookEventName":"...","additionalContext":"..."}}
 *
 * 任何异常都 exit 0 —— 钩子不能因为自己的问题卡住正常对话。
 */
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { scan, recent, search } from "../server/lib/vault.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOG = join(HERE, "_hook.log");
const KB_ROOT = process.env.KB_ROOT || "D:/brain/library";
const KB_PY = join(KB_ROOT, "bin", "kb.py");
const T0 = Date.now();

/* ---------- 工具 ---------- */
function log(event, detail) {
  try {
    if (existsSync(LOG) && statSync(LOG).size > 512 * 1024) return; // 超 512KB 不再写
    appendFileSync(LOG, `${new Date().toISOString()} | ${event} | ${Date.now() - T0}ms | ${detail}\n`);
  } catch {}
}

function readStdin() {
  return new Promise((res) => {
    let buf = "";
    let done = false;
    const fin = () => { if (!done) { done = true; res(buf); } };
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (d) => (buf += d));
    process.stdin.on("end", fin);
    process.stdin.on("error", fin);
    setTimeout(fin, 3000); // 没有 stdin 时别卡住
  });
}

/** 找一个可用的 python：优先环境变量，其次 app 自带，最后 PATH */
function resolvePython() {
  if (process.env.KB_PYTHON && existsSync(process.env.KB_PYTHON)) return process.env.KB_PYTHON;
  const base = process.env.WB_PY_BASE || "D:/WorkBuddy/binaries/python/versions";
  try {
    const cands = readdirSync(base)
      .filter((v) => v.startsWith("3."))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map((v) => join(base, v, "python.exe"))
      .filter(existsSync);
    if (cands.length) return cands[0];
  } catch {}
  for (const c of ["python3", "python"]) {
    const r = spawnSync(c, ["--version"], { timeout: 3000, encoding: "utf8" });
    if (r.status === 0) return c;
  }
  return null;
}

const PY = resolvePython();

/** 查专业知识库，返回命中数组；失败返回 null（用于区分"没命中"和"查不了"） */
function kbSearch(query, k = 3) {
  if (!PY || !existsSync(KB_PY)) return null;
  const r = spawnSync(PY, [KB_PY, "search", query, "-k", String(k), "--json"], {
    cwd: KB_ROOT,
    timeout: 6000,
    encoding: "utf8",
    windowsHide: true,
  });
  if (r.status !== 0 || !r.stdout) return null;
  try {
    const j = JSON.parse(r.stdout.trim().split("\n").pop());
    return Array.isArray(j.hits) ? j.hits : [];
  } catch {
    return null;
  }
}

function emit(eventName, additionalContext) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventName, additionalContext },
  }) + "\n");
}

const TYPE_LABEL = {
  knowledge: "知识", decision: "决策", fact: "事实", pitfall: "坑",
  todo: "待办", note: "笔记", session: "会话",
};

/* ---------- 相关性闸门 ----------
 * BM25 的 or 模式会把「今天天气怎么样」也匹配到不相干的片段（命中"怎么"）。
 * 所以在 Node 侧再算一次词面重合：把提问切成中文二元组 + 英文词，
 * 命中片段里至少要出现 2 个（提问很短时 1 个），否则丢弃。
 */
const STOP = new Set([
  "怎么", "什么", "为什", "么样", "帮我", "一下", "可以", "如何", "哪个", "哪些",
  "是不", "这个", "那个", "有没", "没有", "能不", "不能", "请问", "告诉", "我们",
  "你们", "他们", "现在", "还是", "就是", "但是", "因为", "所以", "需要", "应该",
  "知道", "觉得", "今天", "明天", "昨天", "然后", "如果", "这样", "那样",
]);

function queryTokens(s) {
  const out = new Set();
  const norm = String(s || "").toLowerCase();
  for (const w of norm.match(/[a-z0-9]{3,}/g) || []) out.add(w);
  for (const run of norm.match(/[\u4e00-\u9fa5]+/g) || []) {
    if (run.length === 2 && !STOP.has(run)) out.add(run);
    for (let i = 0; i + 1 < run.length; i++) {
      const g = run.slice(i, i + 2);
      if (!STOP.has(g)) out.add(g);
    }
  }
  return out;
}

/** 提问词在正文里出现了几个（去重计数） */
function overlap(tokens, text) {
  const t = String(text || "").toLowerCase();
  let n = 0;
  for (const g of tokens) if (t.includes(g)) n++;
  return n;
}

/** 相关才留：至少命中 2 个词；提问很短（≤2 个词）时 1 个即可 */
function relevant(tokens, text) {
  if (!tokens.size) return false;
  const need = Math.min(2, tokens.size);
  return overlap(tokens, text) >= need;
}

/**
 * 记忆条目是否值得注入。BM25 分数在这个库里大致是：
 * 强相关 6~15、弱相关 1~3、噪音 <1。分数越高要求越松（强命中已被 BM25 证明），
 * 分数中等则要求词面命中 2 个，避免「今天天气怎么样」命中"怎么"这种假相关。
 */
function keepMemoryHit(h, tokens) {
  const text = `${h.title} ${h.snippet || ""} ${(h.tags || []).join(" ")}`;
  const ov = overlap(tokens, text);
  return (h.score >= 4 && ov >= 1) || (h.score >= 2 && ov >= 2);
}


/* ---------- SessionStart：给一张地图 ---------- */
function onSessionStart(payload) {
  const active = scan().filter(
    (e) => !["index", "archive"].includes(e.type) && (e.status === "active" || e.status === "canonical"),
  );
  if (!active.length) { log("SessionStart", "空库，不注入"); return; }

  const groups = {};
  for (const e of active) (groups[e.type] ||= []).push(e);

  const lines = [
    "<kb-context>",
    "你有两个本地库，路径固定，可直接读写：",
    "· 记忆库 D:/brain/memory/vault — 我们定过什么（决策/事实/坑/待办）",
    "· 知识库 D:/brain/library — 资料原文（PDF/网页/文档，带页码与出处）",
    "需要细节时去查（kb_search / kb_read，或 python bin/kb.py search \"词\"），不要凭印象复述历史结论。",
    "铁律：记忆与代码/文件冲突时，以文件为准并顺手修正记忆；查不到就写「暂无数据」，不估算。",
    "",
    `记忆库共 ${active.length} 条有效条目：`,
  ];

  for (const [type, list] of Object.entries(groups)) {
    list.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    const head = list.slice(0, 6).map((e) => `${e.id}(${e.title})`);
    const more = list.length > 6 ? ` 等 ${list.length} 条` : "";
    lines.push(`· ${TYPE_LABEL[type] || type}：${head.join("；")}${more}`);
  }

  const rec = recent(7, 4);
  if (rec.length) lines.push("", "最近 7 天变更：" + rec.map((e) => `${e.title}(${e.id})`).join("；"));

  const kb = kbSearch("", 0); // 空查询只用来探活，不取结果
  lines.push("", kb === null
    ? "知识库：当前不可用（python 或索引缺失），需要时告知用户跑一次 stats 检查。"
    : "知识库：可用，检索走 FTS5，命中返回原文片段 + 文件路径 + 页码。");
  lines.push("</kb-context>");

  const ctx = lines.join("\n");
  log("SessionStart", `条目 ${active.length} 条，注入 ${ctx.length} 字`);
  emit("SessionStart", ctx);
}

/* ---------- UserPromptSubmit：按这句话检索 ---------- */
function onUserPrompt(payload) {
  const raw = String(payload.prompt || payload.user_prompt || "");
  const q = raw.replace(/\s+/g, " ").trim();
  // 太短或纯确认词不检索，避免噪音（"继续""好""嗯""谢谢"）
  if (q.length < 6 || /^(继续|好的?|嗯+|谢谢|ok|okay|go on|yes)[。.!！?？]*$/i.test(q)) {
    log("UserPromptSubmit", `跳过（${q.length} 字）`);
    return;
  }

  const toks = queryTokens(q);

  let memHits = [];
  try {
    memHits = search(q, { k: 10 })
      .filter((h) => h.score > 1.8 && keepMemoryHit(h, toks))
      .slice(0, 3);
  } catch (e) {
    log("UserPromptSubmit", `记忆检索异常 ${e.message}`);
  }

  // 知识库：先过相关性闸门，再按「同一文档同一标题」去重，避免一篇文档占满名额
  const seen = new Set();
  const kbHits = (kbSearch(q, 6) || [])
    .filter((h) => relevant(toks, `${h.title} ${h.heading || ""} ${h.snippet || ""}`))
    .filter((h) => {
      const key = `${h.doc_id}|${h.heading || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);

  if (!memHits.length && !kbHits.length) {
    log("UserPromptSubmit", `无命中「${q.slice(0, 24)}」`);
    return;
  }

  /* ---------- 组装，带硬预算 ----------
   * 注入的文字会留在上下文里，之后每轮都要重新发一遍，所以必须封顶。
   * 超预算时从末尾整条丢弃命中，不截断句子（半句话比没有更浪费）。
   */
  const MAX = Number(process.env.WB_CTX_MAX) || 1000;
  const head = '<kb-context reason="与本轮提问相关，自动检索自本地记忆库与知识库">';
  const tail = "这些是自动召回的旁证，不是最终答案：与当前文件冲突以文件为准；用不上就别提它。\n</kb-context>";
  const budget = MAX - head.length - tail.length;
  const parts = [];
  let used = 0;

  const push = (block) => {
    const len = block.join("\n").length + 1;
    if (used + len > budget) return false;
    parts.push(block.join("\n"));
    used += len;
    return true;
  };

  /** 一段一节：标题与第一条命中一起入栈，后面的塞不下就整条丢弃 */
  const addSection = (title, blocks, cap = budget) => {
    let accepted = 0;
    let sectionUsed = 0;
    for (const b of blocks) {
      const lines = accepted === 0 ? [title, ...b] : b;
      const len = lines.join("\n").length + 1;
      if (sectionUsed + len > cap) break; // 本节配额用尽，不挤占另一节
      if (!push(lines)) break; // 总预算用尽
      sectionUsed += len;
      accepted++;
    }
    return accepted;
  };

  // 两路各分一半预算：防止记忆条目把知识库挤掉（或反过来）
  const memCap = Math.round(budget * 0.55);

  let memUsed = 0;
  if (memHits.length) {
    memUsed = addSection(
      "记忆库命中（结论性内容，引用前建议 kb_read 核对全文）：",
      memHits.map((h) => {
        const tags = (h.tags || []).map((t) => "#" + t).join(" ");
        const block = [`· ${h.title} [${h.id}] ${tags} ${String(h.updated).slice(0, 10)}`];
        if (h.snippet) block.push(`  ${String(h.snippet).replace(/\s+/g, " ").slice(0, 150)}`);
        return block;
      }),
      memCap,
    );
  }

  let kbUsed = 0;
  const kbCap = budget - used; // 记忆没花完的额度全部留给知识库
  if (kbHits.length) {
    kbUsed = addSection(
      "知识库命中（原文片段，引用时必须标注出处）：",
      kbHits.map((h) => {
        const loc = [h.page ? `第 ${h.page} 页` : null, h.heading ? h.heading.slice(0, 20) : null]
          .filter(Boolean).join(" · ");
        return [
          `· ${String(h.title).slice(0, 44)}${loc ? " — " + loc : ""} [${h.doc_id}]`,
          `  ${String(h.snippet || "").replace(/\s+/g, " ").slice(0, 150)}`,
          `  出处: ${h.path}`,
        ];
      }),
      kbCap,
    );
  }

  const ctx = [head, ...parts, tail].join("\n");
  log("UserPromptSubmit", `「${q.slice(0, 24)}」记忆 ${memUsed} 条 / 知识 ${kbUsed} 条，${ctx.length} 字`);
  emit("UserPromptSubmit", ctx);
}

/* ---------- 入口 ---------- */
const payload = JSON.parse((await readStdin()) || "{}");
const event = payload.hook_event_name || process.argv[2] || "";
try {
  if (event === "SessionStart") onSessionStart(payload);
  else if (event === "UserPromptSubmit") onUserPrompt(payload);
  else log("unknown", `事件 ${event}`);
} catch (e) {
  log(event || "error", `异常 ${e && e.message}`);
  process.exit(0);
}
process.exit(0);
