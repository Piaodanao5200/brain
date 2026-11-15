#!/usr/bin/env node
/**
 * mcp-server.mjs — 知识库与记忆体的 MCP 服务器
 *
 * 两种传输，同一份逻辑：
 *   node server/mcp-server.mjs            启动 HTTP 服务（云端 / 多客户端共享）
 *   node server/mcp-server.mjs --stdio    走 stdio（本地 Claude Code / Codex / Cursor）
 *
 * 环境变量：
 *   KB_VAULT    vault 目录，默认 ../vault
 *   PORT        HTTP 端口，默认 8787
 *   KB_TOKEN    HTTP 访问令牌；设置后所有请求需带 Authorization: Bearer <token>
 *   KB_READONLY 设为 1 则禁用写入类工具
 */
import http from "node:http";
import { createInterface } from "node:readline";
import { VAULT, search, read, writeEntry, supersede, scan, buildIndex, rules, recent, rebuildIndex } from "./lib/vault.mjs";

const VERSION = "1.0.0";
const READONLY = process.env.KB_READONLY === "1";
const TOKEN = process.env.KB_TOKEN || "";

/* ---------------- 工具定义 ---------------- */

const TOOLS = [
  {
    name: "kb_bootstrap",
    description: "新会话启动时第一个调用。返回写入规则、全部条目的紧凑索引、以及最近变更。用它来判断「这个项目里已经有哪些记忆」，再决定要检索什么。",
    inputSchema: {
      type: "object",
      properties: {
        recent_days: { type: "number", description: "最近变更的时间窗口（天），默认 14" },
        with_rules: { type: "boolean", description: "是否返回写入规则，默认 true" },
      },
    },
  },
  {
    name: "kb_search",
    description: "按关键词检索知识库与记忆体（BM25 + 中文二元切分）。先用它定位条目，再用 kb_read 取全文。只返回摘要片段，不要凭片段编造细节。",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "检索词，可为自然语言；中文直接写原句即可" },
        k: { type: "number", description: "返回条数，默认 6，最大 20" },
        type: { type: "string", description: "限定类型：knowledge / decision / fact / pitfall / todo / note / session" },
        tags: { type: "array", items: { type: "string" }, description: "标签过滤，需全部命中" },
        include_inactive: { type: "boolean", description: "是否包含已作废（superseded）条目，默认否" },
      },
      required: ["query"],
    },
  },
  {
    name: "kb_read",
    description: "读取单条记忆的全文（含 frontmatter、来源与时效）。参数可以是 id、相对路径或标题。",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "条目 id 或相对路径" } },
      required: ["id"],
    },
  },
  {
    name: "kb_write",
    description: "写入一条新记忆。写入前必须先 kb_search 查重；同一事实变更请用 kb_supersede 而不是新增。正文 50–150 字，一句话摘要开头，必须给 source。",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", description: "knowledge / decision / fact / pitfall / todo / note / session" },
        title: { type: "string", description: "一句话标题，说明这条记忆是什么结论" },
        body: { type: "string", description: "正文，50–150 字为宜；写清结论、依据、时效" },
        tags: { type: "array", items: { type: "string" }, description: "2–5 个标签，用于同类聚合" },
        scope: { type: "string", description: "project / user / global，默认 project" },
        source: { type: "string", description: "出处：文件路径、URL、PR 号或「用户口述 @ 日期」" },
        confidence: { type: "number", description: "0–1，默认 0.9；二手转述给 0.5–0.7" },
        supersedes: { type: "string", description: "被本条取代的旧条目 id（可选）" },
        force: { type: "boolean", description: "标题与已有条目重复时强制写入，默认 false" },
      },
      required: ["type", "title", "body", "source"],
    },
  },
  {
    name: "kb_supersede",
    description: "用新内容取代一条旧记忆：旧条目置为 superseded 并留指向新条目的链接，不物理删除。适用于事实变更、命令变更、决策推翻。",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "要取代的旧条目 id" },
        body: { type: "string", description: "新正文；省略则沿用旧正文" },
        title: { type: "string", description: "新标题；省略则沿用旧标题" },
        source: { type: "string", description: "本次变更的依据" },
      },
      required: ["id"],
    },
  },
  {
    name: "kb_recent",
    description: "列出最近变更的条目，用于接手别人工作、或确认自己这轮写入是否生效。",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "时间窗口，默认 14" },
        limit: { type: "number", description: "条数上限，默认 15" },
      },
    },
  },
];

/* ---------------- 格式化 ---------------- */

const fmtDate = (s) => String(s || "").slice(0, 10);

function fmtIndex() {
  const entries = scan().filter((e) => !["index", "archive"].includes(e.type) && e.status !== "archived");
  const active = entries.filter((e) => e.status === "active" || e.status === "canonical");
  const label = { knowledge: "知识", decision: "决策", fact: "事实", pitfall: "坑", todo: "待办", note: "笔记", session: "会话" };
  const groups = {};
  for (const e of active) (groups[e.type] ||= []).push(e);
  const out = [];
  for (const [type, list] of Object.entries(groups)) {
    list.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    out.push(`【${label[type] || type}】${list.length} 条`);
    for (const e of list) {
      out.push(`- ${e.id} | ${e.title} | ${e.tags.map((t) => "#" + t).join(" ") || "-"} | ${fmtDate(e.updated)}`);
    }
    out.push("");
  }
  return { text: out.join("\n"), count: active.length, byType: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])) };
}

function fmtHit(e) {
  const flags = [];
  if (e.status && e.status !== "active") flags.push(e.status);
  if (e.confidence !== null && e.confidence < 0.6) flags.push(`低置信 ${e.confidence}`);
  return [
    `▸ ${e.id}  [${e.type}] ${e.title}`,
    `  ${e.tags.map((t) => "#" + t).join(" ") || "无标签"} · ${fmtDate(e.updated)}${e.source ? " · 出处 " + e.source : ""}${flags.length ? " · ⚠ " + flags.join(", ") : ""}`,
    e.snippet ? `  ${e.snippet}` : "",
  ].filter(Boolean).join("\n");
}

function fmtFull(e) {
  return [
    `id: ${e.id}`,
    `title: ${e.title}`,
    `type: ${e.type} · scope: ${e.scope} · status: ${e.status}`,
    `tags: ${e.tags.join(", ") || "-"}`,
    `created: ${e.created} · updated: ${e.updated} · valid_from: ${e.valid_from || "-"}`,
    `confidence: ${e.confidence ?? "-"} · source: ${e.source || "-"}`,
    e.supersedes.length ? `supersedes: ${e.supersedes.join(", ")}` : "",
    `path: ${e.rel}`,
    "",
    e.body.trim(),
  ].filter((x) => x !== "").join("\n");
}

/* ---------------- 工具执行 ---------------- */

function runTool(name, args = {}) {
  switch (name) {
    case "kb_bootstrap": {
      const idx = fmtIndex();
      const parts = [];
      if (args.with_rules !== false) {
        const r = rules().trim();
        if (r) parts.push("=== 写入规则（必须先读）===\n" + r.replace(/^---[\s\S]*?---\n/, "").trim());
      }
      parts.push(`=== 索引：${idx.count} 条有效条目 ===\n${idx.text}`);
      const rec = recent(Number(args.recent_days) || 14, 12);
      if (rec.length) {
        parts.push("=== 最近变更 ===\n" + rec.map((e) => `- ${e.id} | ${e.title} | ${fmtDate(e.updated)}`).join("\n"));
      }
      parts.push("=== 下一步 ===\n根据用户本次问题，用 kb_search 检索相关条目（k=5 左右），只 kb_read 命中的那几条；不要一次性读完索引里的所有条目。检索不到相关记忆就说明是全新话题，不要硬凑。");
      return parts.join("\n\n");
    }
    case "kb_search": {
      const hits = search(args.query, {
        k: args.k, type: args.type, tags: args.tags, includeInactive: args.include_inactive,
      });
      if (!hits.length) return `没有命中「${args.query}」。这可能是全新话题——直接按当前对话处理，不要编造记忆。若确实应该记录，稍后用 kb_write 写入。`;
      const head = `命中 ${hits.length} 条（按相关度）：\n`;
      return head + hits.map(fmtHit).join("\n\n") + "\n\n需要全文用 kb_read(id)。";
    }
    case "kb_read":
      return fmtFull(read(args.id));
    case "kb_recent": {
      const list = recent(Number(args.days) || 14, Number(args.limit) || 15);
      if (!list.length) return "该时间窗口内没有变更。";
      return list.map((e) => `- ${e.id} | [${e.type}] ${e.title} | ${fmtDate(e.updated)}`).join("\n");
    }
    case "kb_write":
    case "kb_supersede": {
      if (READONLY) throw new Error("当前服务为只读模式（KB_READONLY=1），写入被拒绝");
      const r = name === "kb_write" ? writeEntry(args) : supersede(args.id, args);
      const lines = [`已写入 ${r.id}`, `路径 ${r.rel}`];
      if (r.warnings?.length) lines.push("提示：", ...r.warnings.map((w) => "- " + w));
      lines.push("索引已重建。");
      return lines.join("\n");
    }
    default:
      throw new Error(`未知工具 ${name}`);
  }
}

/* ---------------- JSON-RPC ---------------- */

function rpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function rpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handleRpc(msg) {
  if (!msg || typeof msg !== "object") return rpcError(null, -32700, "Parse error");
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case "initialize": {
      const asked = params?.protocolVersion;
      // 回显客户端版本，兼容 2025-03-26 / 2025-06-18 / 2025-11-25 与之后的修订版
      const protocolVersion = asked || "2025-11-25";
      return rpcResult(id, {
        protocolVersion,
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
        },
        serverInfo: { name: "kb-memory", version: VERSION, title: "本地知识库与记忆体" },
        instructions:
          "这是用户长期的知识库与记忆体。会话开始时先调用 kb_bootstrap 了解已有哪些记忆，"
          + "再针对用户问题用 kb_search 检索并 kb_read 全文。写入前必须 kb_search 查重；"
          + "事实变更用 kb_supersede 而不是新增。记忆的权威低于代码与实际文件，冲突时以代码为准并修正记忆。",
      });
    }
    case "notifications/initialized":
    case "notifications/cancelled":
    case "notifications/roots/list_changed":
      return null;
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, {
        tools: READONLY ? TOOLS.filter((t) => !["kb_write", "kb_supersede"].includes(t.name)) : TOOLS,
      });
    case "tools/call": {
      const name = params?.name;
      try {
        const text = runTool(name, params?.arguments || {});
        return rpcResult(id, { content: [{ type: "text", text }] });
      } catch (err) {
        return rpcResult(id, { content: [{ type: "text", text: `错误：${err.message}` }], isError: true });
      }
    }
    case "resources/list": {
      const entries = scan().filter((e) => !["index", "archive"].includes(e.type));
      return rpcResult(id, {
        resources: entries.slice(0, 300).map((e) => ({
          uri: `kb://${e.id}`,
          name: e.title,
          description: `${e.type} · ${e.tags.join(",") || "无标签"} · ${fmtDate(e.updated)}`,
          mimeType: "text/markdown",
        })),
      });
    }
    case "resources/read": {
      const uri = String(params?.uri || "");
      const key = uri.replace(/^kb:\/\//, "");
      const e = read(key);
      return rpcResult(id, {
        contents: [{ uri, mimeType: "text/markdown", text: fmtFull(e) }],
      });
    }
    case "prompts/list":
      return rpcResult(id, { prompts: [] });
    default:
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/* ---------------- stdio ---------------- */

function startStdio() {
  const rl = createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const text = line.trim();
    if (!text) return;
    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      process.stdout.write(JSON.stringify(rpcError(null, -32700, "Parse error")) + "\n");
      return;
    }
    const batch = Array.isArray(msg) ? msg : [msg];
    const out = batch.map(handleRpc).filter(Boolean);
    if (out.length) {
      process.stdout.write(JSON.stringify(Array.isArray(msg) ? out : out[0]) + "\n");
    }
  });
  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
  process.stderr.write(`[kb-memory] stdio 就绪，vault=${VAULT}\n`);
}

/* ---------------- HTTP ---------------- */

function authorized(req, url) {
  if (!TOKEN) return true;
  const h = req.headers.authorization || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q = url.searchParams.get("token") || "";
  return bearer === TOKEN || q === TOKEN;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.KB_CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Accept");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function text(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": typeof type === "string" ? type : "text/plain; charset=utf-8" });
  res.end(body);
}

function startHttp() {
  const port = Number(process.env.PORT) || 8787;
  const host = process.env.HOST || "0.0.0.0";

  const server = http.createServer(async (req, res) => {
    cors(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (url.pathname === "/health") {
      const entries = scan();
      return json(res, 200, {
        ok: true,
        version: VERSION,
        vault: VAULT,
        entries: entries.length,
        readonly: READONLY,
        auth: Boolean(TOKEN),
      });
    }

    if (!authorized(req, url)) {
      res.setHeader("WWW-Authenticate", "Bearer");
      return json(res, 401, { error: "unauthorized" });
    }

    // 人类可读：浏览器直接看索引 / 检索
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index")) {
      const md = buildIndex();
      if (url.pathname === "/") {
        return text(res, 200, `# kb-memory\n\nvault: ${VAULT}\n\n- GET /index  总索引（Markdown）\n- GET /search?q=关键词  检索\n- POST /mcp   MCP 端点（Streamable HTTP，无状态）\n- GET /health  健康检查\n`, "text/markdown; charset=utf-8");
      }
      return text(res, 200, md, "text/markdown; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname === "/search") {
      const q = url.searchParams.get("q") || "";
      if (!q) return text(res, 400, "缺少 q 参数");
      const hits = search(q, { k: Number(url.searchParams.get("k")) || 8 });
      return text(res, 200, hits.length ? hits.map(fmtHit).join("\n\n") : `没有命中「${q}」`, "text/plain; charset=utf-8");
    }

    if (url.pathname !== "/mcp") return json(res, 404, { error: "not found" });

    if (req.method === "GET") {
      // 本服务不需要服务端推送流，明确拒绝
      res.writeHead(405, { Allow: "POST, OPTIONS" });
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST, OPTIONS" });
      return res.end();
    }

    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 4 * 1024 * 1024) {
        res.writeHead(413);
        return res.end();
      }
    }
    let msg;
    try {
      msg = JSON.parse(raw || "{}");
    } catch {
      return json(res, 400, rpcError(null, -32700, "Parse error"));
    }

    if (Array.isArray(msg)) {
      const out = msg.map(handleRpc).filter(Boolean);
      if (!out.length) {
        res.writeHead(202);
        return res.end();
      }
      return json(res, 200, out);
    }
    const result = handleRpc(msg);
    if (!result) {
      res.writeHead(202);
      return res.end();
    }
    return json(res, 200, result);
  });

  server.listen(port, host, () => {
    process.stderr.write(`[kb-memory] HTTP 就绪 http://${host}:${port}/mcp  vault=${VAULT}${TOKEN ? " (需要 token)" : ""}\n`);
  });
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}

if (process.argv.includes("--stdio")) startStdio();
else startHttp();

rebuildIndex();
