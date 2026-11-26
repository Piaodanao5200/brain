#!/usr/bin/env node
// kb_doctor — 跨客户端接线体检。改配置、换电脑、升级客户端之后跑一次。
// 用法：node memory/bin/kb_doctor.mjs [--json]
// 退出码：0 = 全通过（含提醒）；1 = 有失败项需要修。

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");          // brain 根目录
const VAULT = path.join(ROOT, "memory", "vault");
const AGENTS = path.join(ROOT, "AGENTS.md");
const KB = path.join(ROOT, "memory", "bin", "kb.mjs");
const HOME = process.env.USERPROFILE || process.env.HOME || "";
const jsonOut = process.argv.includes("--json");

const rows = [];
function add(level, name, detail) { rows.push({ level, name, detail }); }

// 1. 真源
if (!fs.existsSync(AGENTS)) {
  add("FAIL", "真源文件", "找不到 AGENTS.md");
} else {
  const t = fs.readFileSync(AGENTS, "utf8");
  const need = ["通用工作规则", "会话启动协议", "每轮自检"];
  const miss = need.filter((s) => !t.includes(s));
  miss.length
    ? add("FAIL", "真源文件", "缺章节：" + miss.join("、"))
    : add("PASS", "真源文件", "AGENTS.md 存在，" + need.length + " 个关键章节齐全");
}

// 2. 命令行入口
let validEntries = null;
try {
  const out = execFileSync(process.execPath, [KB, "bootstrap"], { encoding: "utf8", timeout: 30000 });
  const m = out.match(/有效条目\s*(\d+)\s*条/);
  validEntries = m ? Number(m[1]) : null;
  add("PASS", "命令行入口", "bootstrap 可跑" + (validEntries ? "，有效条目 " + validEntries + " 条" : ""));
} catch (e) {
  add("FAIL", "命令行入口", "kb.mjs bootstrap 跑不起来：" + String(e.message).slice(0, 80));
}

// 3. 条目数与索引一致
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".md") && e.name !== "INDEX.md" && e.name !== "RULES.md") acc.push(p);
  }
  return acc;
}
try {
  // 口径与 bootstrap 一致：跳过 90-archive、跳过 _template 模板，只认 status 为 active / canonical
  const files = walk(VAULT).filter(
    (f) => !path.relative(VAULT, f).startsWith("90-archive") && !path.basename(f).startsWith("_")
  );
  let active = 0;
  for (const f of files) {
    const head = fs.readFileSync(f, "utf8");
    const m = head.match(/^status:\s*(.+)$/m);
    const st = m ? m[1].trim().replace(/["']/g, "") : "active";
    if (st === "active" || st === "canonical") active++;
  }
  if (validEntries === null) {
    add("WARN", "条目数与索引", "拿不到有效条目数，跳过比对");
  } else if (active === validEntries) {
    add("PASS", "条目数与索引", "文件 " + active + " 条 = 索引 " + validEntries + " 条");
  } else {
    add("FAIL", "条目数与索引", "文件里有效 " + active + " 条，索引只认 " + validEntries + " 条 → 跑 node memory/bin/kb.mjs index");
  }
} catch (e) {
  add("WARN", "条目数与索引", "统计失败：" + String(e.message).slice(0, 80));
}

// 4. MCP 服务
const serverPath = path.join(ROOT, "memory", "server", "mcp-server.mjs");
const wbMcp = path.join(HOME, ".workbuddy", "mcp.json");
if (!fs.existsSync(wbMcp)) {
  add("WARN", "MCP·WorkBuddy", "没有 " + wbMcp);
} else {
  try {
    const cfg = JSON.parse(fs.readFileSync(wbMcp, "utf8"));
    const servers = cfg.mcpServers || {};
    const kb = Object.entries(servers).find(([, v]) =>
      Array.isArray(v.args) && v.args.some((a) => String(a).includes("mcp-server.mjs"))
    );
    if (!kb) add("FAIL", "MCP·WorkBuddy", "mcp.json 里没有指向 mcp-server.mjs 的条目");
    else {
      const p = kb[1].args.map(String).find((a) => a.includes("mcp-server.mjs")).replace(/^D:/, "D:");
      fs.existsSync(p)
        ? add("PASS", "MCP·WorkBuddy", "条目 " + kb[0] + " → 服务脚本存在")
        : add("FAIL", "MCP·WorkBuddy", "条目路径不存在：" + p);
    }
  } catch (e) {
    add("FAIL", "MCP·WorkBuddy", "mcp.json 解析失败");
  }
}
const codexCfg = path.join(HOME, ".codex", "config.toml");
if (fs.existsSync(codexCfg)) {
  const t = fs.readFileSync(codexCfg, "utf8");
  t.includes("mcp-server.mjs")
    ? add("PASS", "MCP·Codex", "config.toml 里有记忆库 MCP 条目")
    : add("FAIL", "MCP·Codex", "config.toml 没有记忆库 MCP 条目（Codex 现在只能靠指针文件读，无工具直连）");
} else {
  add("WARN", "MCP·Codex", "没有 " + codexCfg);
}

// 5. 注入点
const injections = [
  ["DSH", path.join("D:\\deepseek\\dsh-home", "AGENTS.md")],
  ["通用 agents", path.join(HOME, ".agents", "AGENTS.md")],
  ["Codex", path.join(HOME, ".codex", "AGENTS.md")],
  ["CodeBuddy·AGENTS", path.join(HOME, ".codebuddy", "AGENTS.md")],
  ["CodeBuddy·CLAUDE", path.join(HOME, ".codebuddy", "CLAUDE.md")],
  ["WorkBuddy", path.join("D:\\WorkBuddy", "user-48a30fac-1fde-4b69-a7bb-ddcac39c873c-personal", "MEMORY.md")],
];
for (const [name, p] of injections) {
  if (!fs.existsSync(p)) { add("FAIL", name + " 注入", "缺文件：" + p); continue; }
  const t = fs.readFileSync(p, "utf8");
  t.includes("AGENTS.md")
    ? add("PASS", name + " 注入", (fs.statSync(p).size) + " 字节，含指向真源的指针")
    : add("FAIL", name + " 注入", "文件在，但没有指向 AGENTS.md 的指针");
}
add("MANUAL", "豆包 注入", "无注入文件，靠平台偏好指名去读；只能依赖回复闸兜底");

// 7. 副本一致性（平台偏好是副本，会旧）
const PREF = path.join(ROOT, "memory", "l2", "platform-prefs.md");
let coreCount = null;
if (!fs.existsSync(PREF)) {
  add("FAIL", "偏好标准文本", "缺 memory/l2/platform-prefs.md（副本没有比对基准）");
} else {
  const t = fs.readFileSync(PREF, "utf8");
  coreCount = (t.match(/^\d+\.\s+/gm) || []).length;
  coreCount >= 5
    ? add("PASS", "偏好标准文本", "platform-prefs.md 存在，核心 " + coreCount + " 条")
    : add("FAIL", "偏好标准文本", "platform-prefs.md 核心条数只有 " + coreCount + "，应 ≥5");
}
const wbMemo = injections.find(([n]) => n === "WorkBuddy")[1];
if (fs.existsSync(wbMemo)) {
  const t = fs.readFileSync(wbMemo, "utf8");
  const anchors = [
    ["真源路径", "collaborative project\\brain\\AGENTS.md"],
    ["唯一真源", "唯一真源"],
    ["启动必读", "启动必读"],
    ["写入授权", "写入授权"],
  ];
  const miss = anchors.filter(([, s]) => !t.includes(s)).map(([k]) => k);
  miss.length
    ? add("FAIL", "副本一致性·WorkBuddy", "副本缺锚点：" + miss.join("、") + " → 按 platform-prefs.md 补进 MEMORY.md")
    : add("PASS", "副本一致性·WorkBuddy", "4 个锚点齐全（真源路径 / 唯一真源 / 启动必读 / 写入授权）");
}
add("MANUAL", "副本一致性·豆包", "偏好写在平台设置里，读不到文件；气泡外请人工比对 platform-prefs.md 的 " + (coreCount ?? "若干") + " 条核心句");

// 8. 索引新鲜度
const indexFile = path.join(VAULT, "00-index", "INDEX.md");
try {
  const vaultFiles = walk(VAULT).filter((f) => path.basename(f) !== "INDEX.md" && path.basename(f) !== "RULES.md");
  const newest = Math.max(...vaultFiles.map((f) => fs.statSync(f).mtimeMs));
  if (!fs.existsSync(indexFile)) add("FAIL", "索引新鲜度", "没有 INDEX.md");
  else {
    const idx = fs.statSync(indexFile).mtimeMs;
    idx >= newest
      ? add("PASS", "索引新鲜度", "INDEX.md 比最新条目新")
      : add("FAIL", "索引新鲜度", "INDEX.md 落后于最新条目 → 跑 node memory/bin/kb.mjs index");
  }
} catch (e) {
  add("WARN", "索引新鲜度", "检查失败：" + String(e.message).slice(0, 80));
}

if (jsonOut) {
  console.log(JSON.stringify(rows, null, 2));
} else {
  const icon = { PASS: "[OK]  ", WARN: "[提醒]", FAIL: "[失败]", MANUAL: "[手动]" };
  for (const r of rows) console.log(icon[r.level] + " " + r.name + " — " + r.detail);
  const bad = rows.filter((r) => r.level === "FAIL").length;
  console.log("\n共 " + rows.length + " 项检查，失败 " + bad + " 项。");
}
process.exit(rows.some((r) => r.level === "FAIL") ? 1 : 0);
