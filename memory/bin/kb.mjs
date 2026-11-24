#!/usr/bin/env node
/**
 * kb — 命令行入口，给人用的。agent 走 MCP，人走这里。
 *
 *   node bin/kb.mjs bootstrap              会话启动看一眼全局
 *   node bin/kb.mjs search "部署 端口"      检索
 *   node bin/kb.mjs read decision-20261115-ab12
 *   node bin/kb.mjs new --type decision --title "..." --body "..." --tags db,架构 --source "..."
 *   node bin/kb.mjs supersede <id> --body "新结论"
 *   node bin/kb.mjs index                  重建 00-index/INDEX.md
 *   node bin/kb.mjs recent --days 7
 *   node bin/kb.mjs lint                   漂移与合规检查
 *   node bin/kb.mjs stats
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VAULT, scan, search, read, writeEntry, supersede, buildIndex, rebuildIndex, recent, dailyDigest } from "../server/lib/vault.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** 落空登记本：search 零命中（或全部是兜底结果）时把 query 记下来，
 *  refresh/mem 会列出。治"不知道自己哪里搜不到"的盲区。 */
const MISSES_LOG = path.join(VAULT, "..", "misses.log");

function logMiss(query) {
  try {
    fs.appendFileSync(MISSES_LOG, `${new Date().toISOString()}\t${String(query).replace(/\s+/g, " ").slice(0, 120)}\n`, "utf8");
  } catch {}
}

function missCount() {
  try {
    const lines = fs.readFileSync(MISSES_LOG, "utf8").split("\n").filter(Boolean);
    return lines.length;
  } catch {
    return 0;
  }
}

/** 字符预算油表：always-on / 专题文件的字符数 vs 预算线。
 *  超 80% 预警，超 100% 报警——别等被平台截断了才发现。 */
function charGauge() {
  const USER_DIR = process.env.WB_USER_DIR || "D:/WorkBuddy/user-48a30fac-1fde-4b69-a7bb-ddcac39c873c-personal";
  const rows = [
    ["用户级 MEMORY.md", path.join(USER_DIR, "MEMORY.md"), 2500],
    ["L2 索引 memory-technical.md", "D:/collaborative project/brain/memory/l2/memory-technical.md", 3000],
    ["工作区 MEMORY.md", WB_MEMORY, 3000],
  ];
  const out = [];
  for (const [name, p, budget] of rows) {
    let chars = 0;
    try {
      chars = fs.readFileSync(p, "utf8").replace(/\s/g, "").length;
    } catch {
      out.push([name, C.r("读不到 ") + C.dim(p)]);
      continue;
    }
    const pct = Math.round((chars / budget) * 100);
    const bar = pct >= 100 ? C.r(`✗ ${chars}/${budget}（${pct}%）超预算，必须拆`)
      : pct >= 80 ? C.y(`⚠ ${chars}/${budget}（${pct}%）接近上限`)
      : C.g(`✓ ${chars}/${budget}（${pct}%）`);
    out.push([name, bar]);
  }
  return out;
}

/**
 * 把 INDEX.md 压成紧凑清单，写进 WorkBuddy 的 MEMORY.md 标记区。
 * 为什么需要：WorkBuddy 桌面版不执行 settings.json 的 shell hook（2026-11-16 实测），
 * 会话启动靠 MEMORY.md 自动注入。索引不跟着同步，新会话就看不到新条目。
 */
const WB_MEMORY = process.env.WB_MEMORY || "D:/WorkBuddy/user-48a30fac-1fde-4b69-a7bb-ddcac39c873c-personal/MEMORY.md";
const MARK_B = "<!-- KB-INDEX:BEGIN -->";
const MARK_E = "<!-- KB-INDEX:END -->";

function syncMemoryIndex({ quiet = false } = {}) {
  const idxPath = path.join(VAULT, "00-index/INDEX.md");
  if (!fs.existsSync(idxPath)) return { ok: false, reason: "INDEX.md 不存在" };
  if (!fs.existsSync(WB_MEMORY)) return { ok: false, reason: `找不到 ${WB_MEMORY}` };

  const mem = fs.readFileSync(WB_MEMORY, "utf8");
  const a = mem.indexOf(MARK_B);
  const b = mem.indexOf(MARK_E);
  if (a < 0 || b < 0 || b < a) return { ok: false, reason: "MEMORY.md 缺少索引标记" };

  const groups = [];
  let cur = null;
  for (const raw of fs.readFileSync(idxPath, "utf8").split("\n")) {
    const h = raw.match(/^##\s+(.+?)（\d+）/);
    if (h) {
      cur = { name: h[1], items: [] };
      groups.push(cur);
      continue;
    }
    const it = raw.match(/^-\s+`([^`]+)`\s+(.+)$/);
    if (it && cur) {
      const short = it[1].replace(/^(knowledge|decision|fact|pitfall|todo|note)-\d{8}-/, "");
      let title = it[2].split(" · ")[0].trim();
      if (title.length > 6) title = title.slice(0, 5) + "…";
      cur.items.push(`${short} ${title}`);
    }
  }

  // 极清单行：每组一行、条目用 · 分隔，控制体积以塞进 L3（用户级 MEMORY.md）
  const body = groups.filter((g) => g.items.length)
    .map((g) => `${g.name} ${g.items.join(" · ")}`)
    .join("\n");
  const next = mem.slice(0, a + MARK_B.length) + "\n" + body + "\n" + mem.slice(b);
  const count = groups.reduce((n, g) => n + g.items.length, 0);

  if (next === mem) return { ok: true, changed: false, count };
  fs.writeFileSync(WB_MEMORY, next, "utf8");
  if (!quiet) console.log(C.g(`✓ MEMORY.md 索引已同步 `) + C.dim(`${count} 条`));
  return { ok: true, changed: true, count };
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(a);
  }
  return out;
}

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  c: (s) => `\x1b[36m${s}\x1b[0m`,
  g: (s) => `\x1b[32m${s}\x1b[0m`,
  y: (s) => `\x1b[33m${s}\x1b[0m`,
  r: (s) => `\x1b[31m${s}\x1b[0m`,
};

const d = (s) => String(s || "").slice(0, 10);

/** 找 python：环境变量 → WorkBuddy 自带 → PATH 上的 python3/python */
function resolvePython() {
  if (process.env.KB_PYTHON && fs.existsSync(process.env.KB_PYTHON)) return process.env.KB_PYTHON;
  const base = process.env.WB_PY_BASE || "D:/WorkBuddy/binaries/python/versions";
  try {
    const cands = fs
      .readdirSync(base)
      .filter((v) => v.startsWith("3."))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map((v) => path.join(base, v, "python.exe"))
      .filter((p) => fs.existsSync(p));
    if (cands.length) return cands[0];
  } catch {}
  for (const c of ["python3", "python"]) {
    try {
      execFileSync(c, ["--version"], { stdio: "ignore", timeout: 3000 });
      return c;
    } catch {}
  }
  return null;
}

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

const [, , cmd = "help", ...rest] = process.argv;
const args = parseArgs(rest);

switch (cmd) {
  case "bootstrap": {
    const entries = scan().filter((e) => !["index", "archive"].includes(e.type) && e.status !== "archived");
    const active = entries.filter((e) => e.status === "active" || e.status === "canonical");
    const label = { knowledge: "知识", decision: "决策", fact: "事实", pitfall: "坑", todo: "待办", note: "笔记", session: "会话" };
    const groups = {};
    for (const e of active) (groups[e.type] ||= []).push(e);
    console.log(C.b(`vault: ${VAULT}`));
    console.log(C.dim(`有效条目 ${active.length} 条 · 目录 ${Object.keys(groups).length} 类`));
    for (const [type, list] of Object.entries(groups)) {
      list.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
      console.log("\n" + C.b(`【${label[type] || type}】${list.length}`));
      for (const e of list) {
        console.log(`  ${C.c(e.id)}  ${e.title}`);
        console.log(C.dim(`      ${e.tags.map((t) => "#" + t).join(" ") || "-"} · ${d(e.updated)}`));
      }
    }
    const rec = recent(Number(args.days) || 14, 8);
    if (rec.length) {
      console.log("\n" + C.b("最近变更"));
      for (const e of rec) console.log(C.dim(`  ${d(e.updated)}  ${e.id}  ${e.title}`));
    }
    break;
  }

  case "search":
  case "s": {
    const q = args._.join(" ");
    if (!q) {
      console.error('用法: kb search "关键词" [--multi "词1|词2|词3"]');
      process.exit(1);
    }
    // --multi：一个词搜不到时换个说法再搜的自动版。用 | 分隔 2-3 种说法，
    // 逐个检索，按排名融合去重（RRF 思路的穷人版），总条数仍封顶 -k。
    let hits;
    if (args.multi) {
      const variants = q.split("|").map((s) => s.trim()).filter(Boolean);
      if (variants.length < 2) {
        console.error(C.y("--multi 需要 2 个以上说法，用 | 分隔：") + C.dim('kb search "ego | browser | 浏览器" --multi'));
        process.exit(1);
      }
      const k = Number(args.k) || 8;
      const fused = new Map();
      for (const v of variants) {
        const list = search(v, { k, type: args.type, tags: args.tags ? String(args.tags).split(",") : undefined, includeInactive: Boolean(args.all) });
        list.forEach((e, i) => {
          const prev = fused.get(e.id);
          const rrf = 1 / (60 + i + 1); // RRF：各路排名的倒数分数求和，谁靠前听谁的
          if (prev) prev.score += rrf;
          else fused.set(e.id, { ...e, score: rrf + (e.score > 0 ? 0.001 * (k - i) : 0), variant: v });
        });
      }
      hits = [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
      // 全部说法都只拿到兜底（score≈0 的最近更新）才算真落空
      const real = hits.some((e) => e.score > 0.01);
      if (!hits.length || !real) logMiss(`multi: ${q}`);
    } else {
      hits = search(q, {
        k: Number(args.k) || 8,
        type: args.type,
        tags: args.tags ? String(args.tags).split(",") : undefined,
        includeInactive: Boolean(args.all),
      });
      // 没命中，或只拿到 score=0 的兜底结果（词面没对上），都记一笔
      if (!hits.length || hits.every((e) => !e.score)) logMiss(q);
    }
    if (!hits.length) {
      console.log(C.y("没有命中。") + C.dim(" 已记入落空登记本（misses.log），refresh 时会列出。"));
      break;
    }
    console.log(C.dim(`命中 ${hits.length} 条：\n`));
    for (const e of hits) {
      console.log(`${C.c(e.id)} ${C.b(e.title)} ${C.dim(`[${e.type}] ${e.score > 0 ? "score " + e.score.toFixed(2) : "最近更新"}`)}`);
      console.log(C.dim(`  ${e.tags.map((t) => "#" + t).join(" ") || "无标签"} · ${d(e.updated)}${e.source ? " · " + e.source : ""}`));
      if (e.aliases && e.aliases.length) console.log(C.dim(`  别名: ${e.aliases.join(" / ")}`));
      if (e.snippet) console.log(`  ${e.snippet}`);
      console.log("");
    }
    break;
  }

  case "read":
  case "show": {
    const key = args._[0];
    if (!key) {
      console.error("用法: kb read <id|路径|标题>");
      process.exit(1);
    }
    const e = read(key);
    console.log(C.dim(`path: ${e.rel}`));
    console.log(C.b(e.title) + C.dim(`  [${e.type}] ${e.status}`));
    console.log(C.dim(`${e.tags.map((t) => "#" + t).join(" ") || "无标签"}${e.aliases && e.aliases.length ? " · 别名 " + e.aliases.join("/") : ""} · 建立 ${d(e.created)} · 更新 ${d(e.updated)} · 置信 ${e.confidence ?? "-"}`));
    if (e.source) console.log(C.dim(`出处: ${e.source}`));
    if (e.supersedes.length) console.log(C.y(`取代: ${e.supersedes.join(", ")}`));
    console.log("\n" + e.body.trim());
    break;
  }

  case "new":
  case "add": {
    const bodyArg = args.body === true ? readStdin() : args.body;
    try {
      const r = writeEntry({
        type: args.type || "note",
        title: args.title,
        body: bodyArg || "",
        tags: args.tags,
        aliases: args.aliases,
        scope: args.scope,
        source: args.source,
        confidence: args.confidence,
        force: Boolean(args.force),
      });
      console.log(C.g(`✓ 已写入 ${r.id}`) + C.dim(`  ${r.rel}`));
      for (const w of r.warnings) console.log(C.y(`  ⚠ ${w}`));
    } catch (err) {
      console.error(C.r("✗ " + err.message));
      process.exit(1);
    }
    break;
  }

  case "supersede": {
    const id = args._[0];
    if (!id) {
      console.error("用法: kb supersede <id> --body \"新结论\"");
      process.exit(1);
    }
    try {
      const r = supersede(id, {
        body: args.body === true ? readStdin() : args.body,
        title: args.title,
        source: args.source,
        confidence: args.confidence,
      });
      console.log(C.g(`✓ ${id} → ${r.id}`) + C.dim("  旧条目已标记 superseded"));
    } catch (err) {
      console.error(C.r("✗ " + err.message));
      process.exit(1);
    }
    break;
  }

  case "index": {
    rebuildIndex();
    const p = path.join(VAULT, "00-index/INDEX.md");
    console.log(C.g("✓ 索引已重建 ") + C.dim(p));
    syncMemoryIndex();
    break;
  }

  case "mem": {
    /** 只同步 MEMORY.md 的索引段，不重建 INDEX；顺带报字符预算油表和落空账 */
    const r = syncMemoryIndex({ quiet: true });
    if (!r.ok) {
      console.log(C.r("✗ ") + r.reason);
      process.exitCode = 1;
    } else {
      console.log(C.g("✓ MEMORY.md ") + C.dim(r.changed ? `已更新 ${r.count} 条` : "已是最新"));
      console.log(C.dim("  " + WB_MEMORY));
    }
    const n = missCount();
    console.log(C.dim(`落空登记 ${n ? C.y(n + " 条") : "0 条"}${n ? C.dim(" · 用 kb.mjs misses 查看，攒够就补别名或补条目") : ""}`));
    for (const [name, bar] of charGauge()) console.log("  " + C.dim(name) + "  " + bar);
    break;
  }

  case "misses": {
    /** 看落空登记本。--clear 清空。 */
    try {
      const lines = fs.readFileSync(MISSES_LOG, "utf8").split("\n").filter(Boolean);
      if (!lines.length) {
        console.log(C.dim("落空登记本是空的——目前没有搜不到的词。"));
        break;
      }
      console.log(C.b(`落空 ${lines.length} 条：`));
      for (const l of lines.slice(-30)) console.log(C.dim("  " + l.replace("\t", "  ")));
      if (args.clear) {
        fs.unlinkSync(MISSES_LOG);
        console.log(C.g("✓ 已清空"));
      } else {
        console.log(C.dim("处理完（补了别名/条目）后用 kb.mjs misses --clear 清空"));
      }
    } catch {
      console.log(C.dim("落空登记本是空的——目前没有搜不到的词。"));
    }
    break;
  }

  case "refresh": {
    /** 一键更新：inbox 入库 → 重建索引 → 导出人读投影 → 重刷阅读页 */
    const LIB = args.library || process.env.KB_LIBRARY || path.resolve(HERE, "..", "..", "library");
    const KBPY = path.join(LIB, "bin", "kb.py");
    if (!fs.existsSync(KBPY)) {
      console.log(C.r("✗ 找不到知识库：") + KBPY);
      console.log(C.dim("  用 --library <目录> 或环境变量 KB_LIBRARY 指定"));
      process.exitCode = 1;
      break;
    }
    const py = resolvePython();
    if (!py) {
      console.log(C.r("✗ 找不到可用的 python"));
      console.log(C.dim("  设置 KB_PYTHON 指向 python.exe，或确认 Python 已安装"));
      process.exitCode = 1;
      break;
    }

    const t0 = Date.now();
    const pyRun = (argv) =>
      execFileSync(py, argv, { cwd: LIB, encoding: "utf8", maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "pipe"] });
    const rows = [];
    let failed = 0;

    // ① inbox 入库
    let syncOut = "";
    let syncErr = "";
    try {
      syncOut = pyRun(["bin/kb.py", "sync"]);
    } catch (e) {
      syncOut = String(e.stdout || "");
      syncErr = String(e.stderr || "");
      failed++;
    }
    const m = syncOut.match(/入库 (\d+) 篇 · 重复跳过 (\d+) 篇 · 失败 (\d+) 篇/);
    if (/inbox 是空的/.test(syncOut)) rows.push(["inbox", C.dim("空，没有新文件")]);
    else if (m) {
      const [add, dup, bad] = [+m[1], +m[2], +m[3]];
      if (bad) failed++;
      rows.push(["inbox", `新增 ${add} 篇 · 重复 ${dup} 篇 · 失败 ${bad} 篇`]);
    } else if (syncErr) {
      rows.push(["inbox", C.r("解析出错 ") + C.dim(syncErr.trim().split("\n").pop().slice(0, 60))]);
    }

    // ② 补齐 markdown 原文（新文件入库时已自动产出，这里补历史遗留的缺失）
    try {
      const out = pyRun(["bin/kb.py", "md"]);
      const mm = out.match(/新增 (\d+) 篇.*?失败 (\d+) 篇/);
      if (mm) {
        const [made, bad] = [+mm[1], +mm[2]];
        if (bad) failed++;
        rows.push(["md", made ? `新增 ${made} 篇${bad ? C.r(" · 失败 " + bad + " 篇") : ""}` : C.dim("无缺失")]);
      } else {
        rows.push(["md", C.dim("已是最新")]);
      }
    } catch (e) {
      failed++;
      rows.push(["md", C.r("补齐失败 ") + C.dim(String(e.stderr || e.message).slice(-60))]);
    }

    // ③ 导出人读投影
    try {
      const out = pyRun(["bin/kb.py", "export-md"]);
      const mm = out.match(/(\d+)\s*篇/);
      rows.push(["投影", mm ? `已导出 ${mm[1]} 篇到 reading/` : C.dim("已导出")]);
    } catch (e) {
      failed++;
      rows.push(["投影", C.r("导出失败")]);
    }

    // ③.5 待出结论清单（agent 读全文拟结论，用户点头才写入）
    try {
      const n = +pyRun(["bin/kb.py", "pending", "--quiet"]).trim();
      rows.push(["待出结论", n > 0 ? C.y(`${n} 篇`) + C.dim(" · 让 agent 读全文拟结论") : C.dim("无")]);
    } catch {
      rows.push(["待出结论", C.dim("检测失败")]);
    }

    // ③.6 落空登记账（search 零命中的词，攒够就补别名或补条目）
    {
      const n = missCount();
      if (n) rows.push(["落空登记", C.y(`${n} 条`) + C.dim(" · kb.mjs misses 查看")]);
      else rows.push(["落空登记", C.dim("无")]);
    }

    // ④ 重建记忆体索引
    try {
      rebuildIndex();
      const n = scan().filter((e) => e.type !== "index").length;
      const r = syncMemoryIndex({ quiet: true });
      const tag = r.ok ? (r.changed ? " · MEMORY.md 已同步" : " · MEMORY.md 已是最新") : C.dim(" · MEMORY.md 未同步");
      rows.push(["索引", `INDEX.md 已重建 · 内容条目 ${n} 条${tag}`]);
    } catch (e) {
      failed++;
      rows.push(["索引", C.r("重建失败 ") + C.dim(String(e.message).slice(0, 60))]);
    }

    // ⑤ 重刷阅读页
    try {
      const out = execFileSync(process.execPath, [path.join(HERE, "render.mjs")], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const mm = out.match(/记忆体 (\d+) 条 · 知识库 (\d+) 篇/);
      rows.push(["页面", mm ? `记忆体 ${mm[1]} 条 · 知识库 ${mm[2]} 篇 · 已重刷` : "已重刷"]);
    } catch (e) {
      failed++;
      rows.push(["页面", C.r("渲染失败 ") + C.dim(String(e.message).slice(0, 60))]);
    }

    const sec = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(failed ? C.r(`✗ 更新完成但 ${failed} 步失败`) + C.dim(` · ${sec}s`) : C.g("✓ 全部更新完成") + C.dim(` · ${sec}s`));
    // 中文占两格，按字符数 padEnd 会错位，这里按显示宽度算
    const wOf = (s) => [...s].reduce((n, ch) => n + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
    const pad = (s, n) => s + " ".repeat(Math.max(0, n - wOf(s)));
    const w = Math.max(...rows.map((r) => wOf(r[0])));
    for (const [k, v] of rows) console.log("  " + C.dim(pad(k, w)) + "  " + v);
    console.log("  " + C.dim(pad("打开", w)) + "  " + path.join(HERE, "..", "reading/index.html"));
    if (failed) process.exitCode = 1;
    break;
  }

  case "recent": {
    const list = recent(Number(args.days) || 7, Number(args.limit) || 20);
    if (!list.length) console.log(C.dim("该窗口内没有变更"));
    for (const e of list) console.log(`${C.dim(d(e.updated))} ${C.c(e.id)} ${e.title}`);
    break;
  }

  case "stats": {
    const entries = scan();
    const byType = {};
    const byStatus = {};
    const tags = {};
    for (const e of entries) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      for (const t of e.tags) tags[t] = (tags[t] || 0) + 1;
    }
    const bytes = entries.reduce((a, e) => a + Buffer.byteLength(e.body), 0);
    console.log(C.b("条目 ") + entries.length + C.dim(`  正文 ${(bytes / 1024).toFixed(1)} KB`));
    console.log(C.dim("类型 ") + Object.entries(byType).map(([k, v]) => `${k}:${v}`).join("  "));
    console.log(C.dim("状态 ") + Object.entries(byStatus).map(([k, v]) => `${k}:${v}`).join("  "));
    const top = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 12);
    console.log(C.dim("标签 ") + top.map(([k, v]) => `#${k}:${v}`).join("  "));
    break;
  }

  case "lint": {
    try {
      execFileSync(process.execPath, [path.join(HERE, "../scripts/drift-check.mjs"), ...rest], { stdio: "inherit" });
    } catch {
      process.exitCode = 1;
    }
    break;
  }

  case "ui": {
    const uiPort = args.port || process.env.KB_UI_PORT || 8788;
    process.env.KB_UI_PORT = String(uiPort);
    await import("../server/ui-server.mjs");
    break;
  }

  case "daily": {
    const dig = dailyDigest(args.date);
    const added = dig.added, changed = dig.changed, retired = dig.retired;
    console.log(C.b(`今日 ${dig.date}`) + C.dim(`  新增 ${added.length} · 更新 ${changed.length} · 作废 ${retired.length}`));
    const show = (label, list) => {
      if (!list.length) return;
      console.log(C.c(label));
      for (const e of list) console.log(`  ${C.g(e.id)}  ${e.title}`);
    };
    show("新增", added);
    show("更新", changed);
    show("作废", retired);
    if (!added.length && !changed.length && !retired.length) console.log(C.dim("今天还没有变化。"));
    break;
  }

  case "help":
  case "--help":
  case "-h":
  default:
    console.log(`${C.b("kb")} — 知识库与记忆体命令行

  ${C.c("bootstrap")}              会话启动：列出全部有效条目 + 最近变更
  ${C.c("search")} <关键词>        检索（-k 8 --type decision --tags a,b --all）
                                   --multi "词1|词2|词3" 多说法融合搜；零命中自动记落空登记本
  ${C.c("read")} <id|路径|标题>     读全文
  ${C.c("new")} --type <类型> --title <标题> --body <正文> --tags a,b --aliases 别名1,别名2 --source <出处>
  ${C.c("supersede")} <id> --body <新结论>   取代旧条目（不物理删除）
  ${C.c("index")}                  重建 INDEX.md
  ${C.c("mem")}                    同步工作区 MEMORY.md 索引 + 字符预算油表 + 落空账
  ${C.c("misses")} [--clear]        看落空登记本（处理完清空）
  ${C.c("refresh")}                一键更新：inbox 入库 → 导出投影 → 重建索引 → 刷页面
                                   （--library <目录> 或 KB_LIBRARY 指定知识库位置）
  ${C.c("ui")} [--port 8788]        打开本地看板：实时监看 + 直接增改
  ${C.c("daily")}                   今日新增 / 更新 / 作废
  ${C.c("recent")} [--days 7]      最近变更
  ${C.c("stats")}                  统计
  ${C.c("lint")}                   漂移 / 密钥 / 字段完整性检查

vault: ${VAULT}
类型：knowledge 决策 事实 坑 待办 笔记 会话`);
}
