#!/usr/bin/env node
/**
 * render.mjs —— 把 vault/ 与 library/reading/ 渲染成一个自包含的静态阅读页。
 *
 * 两级结构：先分「记忆体 / 知识库」两个系统，再分各系统内的分组。
 * 这条分界比分组本身重要——记忆体每次会话被自动注入，知识库只在 agent 主动查时才进来。
 *
 * 为什么把所有内容内联进 HTML：浏览器在 file:// 下会拦截 fetch() 读本地文件（CORS），
 * 所以单文件 + 内联 JSON 是唯一「双击即用、零依赖、零服务」的做法。
 *
 * 用法：
 *   node bin/render.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');            // D:/collaborative project/brain/memory
const VAULT = path.join(ROOT, 'vault');
const KB_ROOT = path.resolve(ROOT, '..', 'library');
const KB_READING = path.join(KB_ROOT, 'reading');
const OUT_DIR = path.join(ROOT, 'reading');
const OUT = path.join(OUT_DIR, 'index.html');

/* 两个系统。顺序即侧栏顺序，也是人心里的默认顺序。 */
const SYSTEMS = [
  {
    key: 'memory',
    label: '记忆体',
    where: 'D:/collaborative project/brain/memory/vault',
    mode: '每次会话自动注入',
    color: 'mem',
    blurb: 'agent 应该一直记得的事',
    put: '一个断言：决策、事实、坑、待办、结论',
    keep: '长报告、原件、整本书',
  },
  {
    key: 'kb',
    label: '知识库',
    where: 'D:/collaborative project/brain/library',
    mode: 'agent 主动查才进来',
    color: 'kb',
    blurb: 'agent 需要时去翻的资料',
    put: '一份材料：报告、论文、PDF、视频、扫描件',
    keep: '几十字的结论、临时决定',
  },
];

/* 目录 -> 分组。system 决定它归哪一边。 */
const SECTIONS = [
  { key: 'index',     sys: 'memory', label: '索引',   dir: '00-index',            hint: '规矩 + 自动目录' },
  { key: 'knowledge', sys: 'memory', label: '知识',   dir: '10-knowledge',        hint: '可复用的结论' },
  { key: 'decision',  sys: 'memory', label: '决策',   dir: '20-memory/decisions', hint: '选了什么、为什么不选别的' },
  { key: 'fact',      sys: 'memory', label: '事实',   dir: '20-memory/facts',     hint: '环境、偏好、既有产物' },
  { key: 'pitfall',   sys: 'memory', label: '坑',     dir: '20-memory/pitfalls',  hint: '踩过一次就别再踩' },
  { key: 'todo',      sys: 'memory', label: '待办',   dir: '20-memory/todos',     hint: '未完成的事' },
  { key: 'note',      sys: 'memory', label: '笔记',   dir: '20-memory/notes',     hint: '还没归类的草稿' },
  { key: 'session',   sys: 'memory', label: '会话',   dir: '30-sessions',         hint: '一次工作的流水' },
  { key: 'archive',   sys: 'memory', label: '归档',   dir: '90-archive',          hint: '过期但保留' },
  { key: 'library',   sys: 'kb',     label: '资料',   dir: null,                  hint: 'library 投影' },
];

/* ---------- frontmatter ---------- */

function parseFrontmatter(raw) {
  const meta = {};
  let body = raw;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (m) {
    body = raw.slice(m[0].length);
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1];
      let val = kv[2].trim();
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else {
        val = val.replace(/^["']|["']$/g, '');
      }
      meta[key] = val;
    }
  }
  return { meta, body: body.trim() };
}

/* ---------- 采集 ---------- */

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, acc);
    else if (ent.name.endsWith('.md') && !ent.name.startsWith('_')) acc.push(full);
  }
  return acc;
}

const docs = [];
let seq = 0;

function addDoc(fullPath, section, sys, rootDir) {
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
  const stat = fs.statSync(fullPath);
  const title = meta.title || path.basename(fullPath, '.md').replace(/^[\w]+-\d{8}-\w+-/, '');
  const tags = Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []);
  docs.push({
    id: meta.id || rel.replace(/\.md$/, ''),
    type: meta.type || section,
    title,
    tags,
    status: meta.status || 'active',
    confidence: meta.confidence ?? '',
    scope: meta.scope || '',
    source: meta.source || '',
    created: meta.created || '',
    updated: meta.updated || stat.mtime.toISOString().slice(0, 10),
    section,
    sys,
    path: rel,
    chars: body.length,
    body,
    order: seq++,
  });
}

for (const s of SECTIONS) {
  if (!s.dir) continue;
  for (const f of walk(path.join(VAULT, s.dir))) addDoc(f, s.key, s.sys, VAULT);
}

if (fs.existsSync(KB_READING)) {
  for (const ent of fs.readdirSync(KB_READING)) {
    if (!ent.endsWith('.md') || ent.toUpperCase() === 'INDEX.MD') continue;
    addDoc(path.join(KB_READING, ent), 'library', 'kb', KB_READING);
  }
}

/* ---------- 组装 ---------- */

const sections = SECTIONS.map(s => ({ ...s }));
const payload = {
  generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  vault: VAULT.replace(/\\/g, '/'),
  kb: KB_ROOT.replace(/\\/g, '/'),
  systems: SYSTEMS,
  sections,
  docs,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, buildHtml(payload), 'utf8');

const count = k => docs.filter(d => d.sys === k).length;
console.log('已生成 ' + OUT);
console.log('记忆体 ' + count('memory') + ' 条 · 知识库 ' + count('kb') + ' 篇');
for (const s of SYSTEMS) {
  const inSys = sections.filter(x => x.sys === s.key);
  console.log('  ' + s.label + '：' + inSys.map(x =>
    x.label + ' ' + docs.filter(d => d.section === x.key).length).join(' · '));
}

/* ---------- 模板 ---------- */

function buildHtml(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>记忆体 · 知识库</title>
<style>
:root{
  --bg:#f6f6f4; --panel:#ffffff; --panel-2:#fbfbfa; --line:#e4e3df; --line-soft:#eeede9;
  --fg:#1f1e1c; --fg-2:#5c5a55; --fg-3:#8f8c85;
  --mem:#2f6f5b; --mem-bg:#e7f1ed; --mem-line:#bcd8cc;
  --kb:#2b5f8f; --kb-bg:#e7eff8; --kb-line:#bcd2e6;
  --accent:#2f6f5b; --accent-soft:#e7f1ed;
  --mark:#fff2b8; --code-bg:#f1f0ec; --tag:#efeee9;
}
html[data-theme="dark"]{
  --bg:#16181a; --panel:#1e2124; --panel-2:#23262a; --line:#32363a; --line-soft:#2a2e32;
  --fg:#e8e6e1; --fg-2:#a9a6a0; --fg-3:#7b7872;
  --mem:#8ec2ae; --mem-bg:#20302c; --mem-line:#35564d;
  --kb:#8ab4dc; --kb-bg:#1e2a37; --kb-line:#324a63;
  --accent:#7fb3a0; --accent-soft:#243330;
  --mark:#4a4222; --code-bg:#26292d; --tag:#2b2f33;
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; background:var(--bg); color:var(--fg);
  font:15px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;
}
.app{display:grid; grid-template-columns:322px minmax(0,1fr); grid-template-rows:minmax(0,1fr); height:100vh; height:100dvh; overflow:hidden}

/* ---- 左栏 ---- */
.side{background:var(--panel-2); border-right:1px solid var(--line); display:flex; flex-direction:column; min-height:0}
.brand{padding:15px 16px 11px; border-bottom:1px solid var(--line-soft)}
.brand h1{margin:0; font-size:14.5px; font-weight:650; letter-spacing:.01em; display:flex; align-items:center; gap:8px}
.brand h1 .swatch{width:7px;height:7px;border-radius:2px;background:var(--mem);flex:none}
.brand h1 .swatch2{width:7px;height:7px;border-radius:2px;background:var(--kb);flex:none;margin-left:-4px}
.brand .sub{margin-top:5px; font-size:11.5px; color:var(--fg-3); font-variant-numeric:tabular-nums}
.tools{padding:10px 12px 0; display:flex; gap:8px; align-items:center}
.search{flex:1; position:relative}
.search input{
  width:100%; padding:7px 28px 7px 29px; font-size:12.5px; color:var(--fg);
  background:var(--panel); border:1px solid var(--line); border-radius:7px; outline:none;
}
.search input:focus{border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft)}
.search .ico{position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--fg-3); font-size:12px}
.search kbd{
  position:absolute; right:8px; top:50%; transform:translateY(-50%); font:11px/1 ui-monospace,monospace;
  color:var(--fg-3); border:1px solid var(--line); border-radius:4px; padding:2px 4px; background:var(--panel-2);
}
.iconbtn{
  flex:none; width:31px; height:31px; display:grid; place-items:center; cursor:pointer;
  background:var(--panel); border:1px solid var(--line); border-radius:7px; color:var(--fg-2); font-size:13px;
}
.iconbtn:hover{border-color:var(--fg-3); color:var(--fg)}
.seg{display:flex; gap:2px; margin:9px 12px 10px; padding:2px; background:var(--panel); border:1px solid var(--line); border-radius:7px}
.seg button{
  flex:1; appearance:none; border:0; background:none; cursor:pointer; font:inherit; font-size:11.5px;
  color:var(--fg-2); padding:4px 0; border-radius:5px; line-height:1.5;
}
.seg button:hover{color:var(--fg)}
.seg button.on{background:var(--fg); color:var(--panel); font-weight:600}
.seg button.on.mem{background:var(--mem); color:#fff}
.seg button.on.kb{background:var(--kb); color:#fff}
html[data-theme="dark"] .seg button.on.mem{color:#12181a}
html[data-theme="dark"] .seg button.on.kb{color:#12181a}

.list{flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:2px 8px 40px}
.list::-webkit-scrollbar,.reader::-webkit-scrollbar{width:10px}
.list::-webkit-scrollbar-thumb,.reader::-webkit-scrollbar-thumb{background:var(--line); border-radius:6px; border:3px solid transparent; background-clip:content-box}

/* 系统带 */
.band{margin:14px 0 0}
.band+.band{margin-top:22px; padding-top:6px; border-top:1px dashed var(--line)}
.band-head{display:flex; align-items:baseline; gap:6px; padding:6px 9px; border-radius:6px; margin-bottom:5px}
.band.mem .band-head{background:var(--mem-bg); color:var(--mem)}
.band.kb .band-head{background:var(--kb-bg); color:var(--kb)}
.band-head .nm{font-size:12px; font-weight:700; letter-spacing:.02em}
.band-head .ct{font-size:10.5px; opacity:.85; font-variant-numeric:tabular-nums}
.band-head .md{margin-left:auto; font-size:10px; opacity:.7; white-space:nowrap}
.band-sub{margin:0 9px 6px; font-size:10.5px; color:var(--fg-3); line-height:1.5}

.grp{margin:2px 0 1px; padding:6px 8px 3px 10px; display:flex; align-items:baseline; gap:6px; cursor:pointer; user-select:none; border-radius:5px}
.grp:hover{background:var(--panel)}
.grp .name{font-size:12px; font-weight:650; color:var(--fg-2); letter-spacing:.02em}
.grp .n{font-size:10px; color:var(--fg-3); background:var(--tag); border-radius:20px; padding:0 5px; font-variant-numeric:tabular-nums}
.grp .hint{margin-left:auto; font-size:10px; color:var(--fg-3); opacity:.8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.grp.collapsed + .items{display:none}
.item{display:block; padding:6px 9px 6px 13px; border-radius:6px; cursor:pointer; border:1px solid transparent; margin-left:6px}
.item:hover{background:var(--panel)}
.item.on{background:var(--panel); border-color:var(--line)}
.item .t{font-size:13px; line-height:1.45; color:var(--fg); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden}
.item.on .t{font-weight:600}
.item .m{margin-top:2px; font-size:10.5px; color:var(--fg-3); display:flex; gap:6px; flex-wrap:wrap; font-variant-numeric:tabular-nums}
.item .m .tg{color:var(--fg-3); opacity:.9}
mark{background:var(--mark); color:inherit; border-radius:2px; padding:0 1px}
.empty{padding:26px 12px; text-align:center; color:var(--fg-3); font-size:12.5px; line-height:1.9}

/* ---- 右栏 ---- */
.main{min-width:0; min-height:0; display:flex; flex-direction:column; background:var(--bg)}
.topbar{
  height:42px; flex:none; display:flex; align-items:center; gap:10px; padding:0 20px;
  border-bottom:1px solid var(--line-soft); background:var(--panel-2); font-size:11.5px; color:var(--fg-3);
}
.topbar .crumb{font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.topbar .spacer{flex:1}
.reader{flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; -webkit-overflow-scrolling:touch; padding:0}
.doc{max-width:748px; margin:0 auto; padding:36px 40px 120px}
.doc h2{font-size:25px; line-height:1.35; margin:0 0 14px; letter-spacing:-.01em; font-weight:680}
.meta{display:flex; flex-wrap:wrap; gap:6px 7px; align-items:center; padding-bottom:15px; margin-bottom:22px; border-bottom:1px solid var(--line-soft)}
.chip{
  font-size:10.5px; line-height:19px; padding:0 8px; border-radius:20px; background:var(--tag); color:var(--fg-2);
  font-variant-numeric:tabular-nums; white-space:nowrap;
}
.chip.tag{background:var(--accent-soft); color:var(--accent); cursor:pointer}
.chip.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10px}
.chip.mem{background:var(--mem-bg); color:var(--mem); font-weight:650}
.chip.kb{background:var(--kb-bg); color:var(--kb); font-weight:650}
.body{font-size:15px}
.body>p{margin:0 0 14px}
.body h1{font-size:21px; margin:28px 0 12px}
.body h2{font-size:17.5px; margin:28px 0 12px; padding-bottom:6px; border-bottom:1px solid var(--line-soft)}
.body h3{font-size:15px; margin:22px 0 9px}
.body h4{font-size:14px; margin:18px 0 8px; color:var(--fg-2)}
.body ul,.body ol{margin:0 0 14px; padding-left:22px}
.body li{margin:3px 0}
.body code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.86em; background:var(--code-bg); padding:2px 5px; border-radius:4px}
.body pre{background:var(--code-bg); border:1px solid var(--line-soft); border-radius:9px; padding:13px 15px; overflow:auto; margin:0 0 16px}
.body pre code{background:none; padding:0; font-size:12.5px; line-height:1.65}
.body blockquote{margin:0 0 16px; padding:2px 0 2px 14px; border-left:3px solid var(--accent); color:var(--fg-2)}
.body blockquote p:last-child{margin-bottom:0}
.body table{border-collapse:collapse; margin:0 0 18px; font-size:13px; display:block; overflow-x:auto}
.body th,.body td{border:1px solid var(--line); padding:6px 10px; text-align:left; vertical-align:top}
.body th{background:var(--panel-2); font-weight:600; white-space:nowrap}
.body hr{border:none; border-top:1px solid var(--line); margin:24px 0}
.body a{color:var(--accent); text-decoration:none; border-bottom:1px solid var(--accent-soft)}
.body a:hover{border-bottom-color:var(--accent)}
.body strong{font-weight:650}
.srcline{font-size:11.5px; color:var(--fg-3); margin:-4px 0 20px; padding-left:11px; border-left:2px solid var(--line); line-height:1.6}

/* ---- 欢迎页 ---- */
.welcome{max-width:800px; margin:0 auto; padding:44px 40px 80px}
.welcome h2{font-size:26px; margin:0 0 8px; letter-spacing:-.015em}
.welcome .lead{color:var(--fg-2); font-size:14px; margin:0 0 24px; max-width:560px}
.duo{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px}
.syscard{border:1px solid var(--line); border-radius:12px; padding:16px 18px; background:var(--panel)}
.syscard.mem{border-color:var(--mem-line); background:var(--mem-bg)}
.syscard.kb{border-color:var(--kb-line); background:var(--kb-bg)}
.syscard .h{display:flex; align-items:baseline; gap:7px; margin-bottom:2px}
.syscard .nm{font-size:14px; font-weight:700}
.syscard.mem .nm{color:var(--mem)}
.syscard.kb .nm{color:var(--kb)}
.syscard .ct{font-size:11px; opacity:.8; font-variant-numeric:tabular-nums}
.syscard.mem .ct,.syscard.mem .bl{color:var(--mem)}
.syscard.kb .ct,.syscard.kb .bl{color:var(--kb)}
.syscard .bl{font-size:12px; margin-bottom:10px; opacity:.9}
.syscard .row{display:flex; gap:6px; font-size:11.5px; line-height:1.6; color:var(--fg-2); margin-top:5px}
.syscard .row b{font-weight:600; color:var(--fg); flex:none; width:26px; opacity:.7}
.syscard .path{margin-top:10px; font:10.5px/1.5 ui-monospace,monospace; color:var(--fg-3); word-break:break-all}
.welcome h3{font-size:11px; letter-spacing:.07em; text-transform:uppercase; color:var(--fg-3); margin:0 0 10px}
.recent{border:1px solid var(--line); border-radius:10px; overflow:hidden; background:var(--panel); margin-bottom:24px}
.recent .row{display:flex; gap:9px; align-items:baseline; padding:9px 14px; cursor:pointer; border-bottom:1px solid var(--line-soft)}
.recent .row:last-child{border-bottom:none}
.recent .row:hover{background:var(--panel-2)}
.recent .row .sd{flex:none; width:6px; height:6px; border-radius:2px; transform:translateY(-2px)}
.recent .row .sd.mem{background:var(--mem)}
.recent .row .sd.kb{background:var(--kb)}
.recent .row .t{font-size:13px; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap}
.recent .row .d{font-size:10.5px; color:var(--fg-3); font-variant-numeric:tabular-nums; white-space:nowrap}
.tips{font-size:12px; color:var(--fg-3); line-height:1.95}
.tips code{background:var(--code-bg); padding:1px 5px; border-radius:4px; font-size:11px}
.back{display:none}
.topbar .iconbtn.back{display:none}

@media (max-width:900px){
  .app{grid-template-columns:1fr; grid-template-rows:minmax(0,1fr)}
  .side{border-right:none; min-height:0}
  .main{min-height:0}
  .app.reading .side{display:none}
  .app:not(.reading) .main{display:none}
  .topbar .iconbtn.back{display:grid; width:26px; height:26px; font-size:11px}
  .doc,.welcome{padding:22px 18px 70px}
  .duo{grid-template-columns:1fr}
  .topbar{padding:0 14px}
}
</style>
</head>
<body>
<div class="app" id="app">
  <aside class="side">
    <div class="brand">
      <h1><span class="swatch"></span><span class="swatch2"></span>记忆体 · 知识库</h1>
      <div class="sub" id="brandSub"></div>
    </div>
    <div class="tools">
      <div class="search">
        <span class="ico">⌕</span>
        <input id="q" type="search" placeholder="搜索两个库…" autocomplete="off">
        <kbd>/</kbd>
      </div>
      <button class="iconbtn" id="theme" title="切换深浅色">◐</button>
    </div>
    <div class="seg" id="seg">
      <button data-f="all" class="on">全部</button>
      <button data-f="memory">记忆体</button>
      <button data-f="kb">知识库</button>
    </div>
    <div class="list" id="list"></div>
  </aside>
  <main class="main">
    <div class="topbar">
      <button class="iconbtn back" id="back" title="返回列表" style="width:26px;height:26px;font-size:11px">←</button>
      <span class="crumb" id="crumb"></span>
      <span class="spacer"></span>
      <span id="stat"></span>
    </div>
    <div class="reader" id="reader"></div>
  </main>
</div>
<script id="data" type="application/json">${json}</script>
<script>
(function(){
  var D = JSON.parse(document.getElementById('data').textContent);
  var DOCS = D.docs;
  var SYS = D.systems;
  var SEC = D.sections;
  var SYSBY = {}; SYS.forEach(function(s){ SYSBY[s.key] = s; });
  var SECBY = {}; SEC.forEach(function(s){ SECBY[s.key] = s; });
  var byId = {}; DOCS.forEach(function(d){ byId[d.id] = d; });
  var countOf = function(k){ return DOCS.filter(function(d){ return d.sys === k; }).length; };

  var elApp = document.getElementById('app');
  var elList = document.getElementById('list');
  var elReader = document.getElementById('reader');
  var elQ = document.getElementById('q');
  var elCrumb = document.getElementById('crumb');
  var elStat = document.getElementById('stat');
  var elSub = document.getElementById('brandSub');
  var elSeg = document.getElementById('seg');
  var collapsed = {};
  var q = '';
  var filter = 'all';
  var current = null;

  var saved = null;
  try { saved = localStorage.getItem('wb-read-theme'); } catch(e){}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
  document.getElementById('theme').onclick = function(){
    var now = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', now);
    try { localStorage.setItem('wb-read-theme', now); } catch(e){}
  };

  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function hit(d){
    if (!q) return true;
    var hay = (d.title + ' ' + d.id + ' ' + d.tags.join(' ') + ' ' + d.body).toLowerCase();
    var parts = q.toLowerCase().split(/\\s+/).filter(Boolean);
    for (var i = 0; i < parts.length; i++) if (hay.indexOf(parts[i]) < 0) return false;
    return true;
  }
  function hi(s){
    var out = esc(s);
    if (!q) return out;
    var parts = q.split(/\\s+/).filter(Boolean).sort(function(a,b){ return b.length - a.length; });
    for (var i = 0; i < parts.length; i++) {
      var p = esc(parts[i]).replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
      if (!p) continue;
      out = out.replace(new RegExp('(' + p + ')', 'gi'), '<mark>$1</mark>');
    }
    return out;
  }
  function fmtChars(n){ return n >= 1000 ? (n/1000).toFixed(1) + 'k 字' : n + ' 字'; }

  /* ---- 侧栏：先分系统，再分分组 ---- */
  function renderList(){
    var html = '';
    var shown = 0;
    SYS.forEach(function(S){
      if (filter !== 'all' && filter !== S.key) return;
      var secs = SEC.filter(function(x){ return x.sys === S.key; });
      var total = 0;
      var body = '';
      secs.forEach(function(sec){
        var items = DOCS.filter(function(d){ return d.section === sec.key && hit(d); });
        total += items.length;
        if (!items.length) {
          if (q) return;
          body += '<div class="grp collapsed" data-sec="' + sec.key + '">' +
                    '<span class="name">' + esc(sec.label) + '</span><span class="n">0</span>' +
                    '<span class="hint">' + esc(sec.hint) + '</span>' +
                  '</div>';
          return;
        }
        var cls = 'grp' + (collapsed[sec.key] && !q ? ' collapsed' : '');
        body += '<div class="' + cls + '" data-sec="' + sec.key + '">' +
                  '<span class="name">' + esc(sec.label) + '</span>' +
                  '<span class="n">' + items.length + '</span>' +
                  '<span class="hint">' + esc(sec.hint) + '</span>' +
                '</div><div class="items">';
        items.forEach(function(d){
          var tags = d.tags.slice(0, 2).map(function(t){ return '#' + t; }).join(' ');
          body += '<div class="item' + (current && current.id === d.id ? ' on' : '') + '" data-id="' + esc(d.id) + '">' +
                    '<div class="t">' + hi(d.title) + '</div>' +
                    '<div class="m"><span>' + esc(d.updated || '') + '</span>' +
                      (tags ? '<span class="tg">' + hi(tags) + '</span>' : '') +
                    '</div>' +
                  '</div>';
        });
        body += '</div>';
      });
      if (!total && q) return;
      shown += total;
      html += '<div class="band ' + S.color + '">' +
                '<div class="band-head">' +
                  '<span class="nm">' + esc(S.label) + '</span>' +
                  '<span class="ct">' + total + (S.key === 'kb' ? ' 篇' : ' 条') + '</span>' +
                  '<span class="md">' + esc(S.mode) + '</span>' +
                '</div>' +
                '<div class="band-sub">' + esc(S.blurb) + '</div>' +
                (total ? body : '<div class="empty">这一边还没有内容</div>') +
              '</div>';
    });
    if (!shown) html = '<div class="empty">没有匹配「' + esc(q) + '」的条目<br><span style="font-size:11px">试试更短的关键词</span></div>';
    elList.innerHTML = html;
    elSub.textContent = '记忆体 ' + countOf('memory') + ' 条 · 知识库 ' + countOf('kb') + ' 篇 · ' + D.generatedAt;
    elStat.textContent = q ? ('命中 ' + shown + ' / ' + DOCS.length) : '';
    elSeg.querySelectorAll('button').forEach(function(b){
      var k = b.getAttribute('data-f');
      b.className = (k === filter ? 'on' : '');
      if (k === filter && k !== 'all') b.className = 'on ' + k;
    });
  }

  elSeg.onclick = function(e){
    var b = e.target.closest('button');
    if (!b) return;
    filter = b.getAttribute('data-f');
    renderList();
  };

  elList.onclick = function(e){
    var grp = e.target.closest('.grp');
    if (grp) { var k = grp.getAttribute('data-sec'); collapsed[k] = !collapsed[k]; renderList(); return; }
    var it = e.target.closest('.item');
    if (it) open(it.getAttribute('data-id'), true);
  };

  /* ---- Markdown ---- */
  function inline(t){
    t = esc(t);
    t = t.replace(/&lt;sub&gt;([\\s\\S]*?)&lt;\\/sub&gt;/g, '<sub>$1</sub>');
    t = t.replace(/\`([^\`]+)\`/g, function(_, c){ return '<code>' + c + '</code>'; });
    t = t.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\\*([^*\\n]+)\\*/g, '$1<em>$2</em>');
    t = t.replace(/\\[([^\\]]+)\\]\\(([^)\\s]+)\\)/g, function(_, txt, url){
      var safe = /^(https?:|mailto:|#|\\.?\\/)/i.test(url) ? url : '#';
      return '<a href="' + safe + '" target="_blank" rel="noopener">' + txt + '</a>';
    });
    return t;
  }
  function splitRow(l){
    return l.trim().replace(/^\\|/, '').replace(/\\|$/, '').split('|').map(function(s){ return s.trim(); });
  }
  function buildList(items, start, base){
    var tag = items[start].ordered ? 'ol' : 'ul';
    var html = '<' + tag + '>';
    var i = start;
    var firstOrdered = items[start].ordered;
    while (i < items.length) {
      if (items[i].indent < base || items[i].indent > base) break;
      if (i > start && items[i].ordered !== firstOrdered) break;
      var text = inline(items[i].text);
      var nested = '';
      var j = i + 1;
      if (j < items.length && items[j].indent > base) {
        var sub = buildList(items, j, items[j].indent);
        nested = sub.html;
        j = sub.end;
      }
      html += '<li>' + text + nested + '</li>';
      i = j;
    }
    html += '</' + tag + '>';
    return { html: html, end: i };
  }
  function md2html(src){
    var lines = src.split(/\\r?\\n/);
    var out = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];

      var anch = line.match(/^\\s*<a id="([^"]*)"><\\/a>\\s*$/);
      if (anch) { out.push('<span id="' + esc(anch[1]) + '"></span>'); i++; continue; }

      var sub = line.match(/^\\s*<sub>([\\s\\S]*)<\\/sub>\\s*$/);
      if (sub) { out.push('<div class="srcline">' + inline(sub[1]) + '</div>'); i++; continue; }

      if (/^\\s*\`\`\`/.test(line)) {
        var lang = line.replace(/^\\s*\`\`\`/, '').trim();
        var buf = [];
        i++;
        while (i < lines.length && !/^\\s*\`\`\`/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre><code' + (lang ? ' data-lang="' + esc(lang) + '"' : '') + '>' + esc(buf.join('\\n')) + '</code></pre>');
        continue;
      }
      var h = line.match(/^(#{1,4})\\s+(.*)$/);
      if (h) { out.push('<h' + h[1].length + '>' + inline(h[2]) + '</h' + h[1].length + '>'); i++; continue; }

      if (/^\\s*(---+|\\*\\*\\*+|___+)\\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      if (/^\\s*>/.test(line)) {
        var qb = [];
        while (i < lines.length && /^\\s*>/.test(lines[i])) { qb.push(lines[i].replace(/^\\s*>\\s?/, '')); i++; }
        out.push('<blockquote>' + md2html(qb.join('\\n')) + '</blockquote>');
        continue;
      }
      if (/^\\s*\\|/.test(line) && i + 1 < lines.length && /^\\s*\\|?\\s*:?-{2,}/.test(lines[i+1])) {
        var head = splitRow(line);
        i += 2;
        var rows = [];
        while (i < lines.length && /^\\s*\\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        var t = '<table><thead><tr>' + head.map(function(c){ return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        rows.forEach(function(r){
          t += '<tr>' + head.map(function(_, k){ return '<td>' + inline(r[k] || '') + '</td>'; }).join('') + '</tr>';
        });
        out.push(t + '</tbody></table>');
        continue;
      }
      var lm = line.match(/^(\\s*)([-*+]|\\d+[.)])\\s+(.*)$/);
      if (lm) {
        var baseIndent = lm[1].length;
        var items = [];
        while (i < lines.length) {
          var m2 = lines[i].match(/^(\\s*)([-*+]|\\d+[.)])\\s+(.*)$/);
          if (!m2) break;
          items.push({ indent: m2[1].length, ordered: /\\d/.test(m2[2]), text: m2[3] });
          i++;
        }
        out.push(buildList(items, 0, baseIndent).html);
        continue;
      }
      if (line.trim() === '') { i++; continue; }
      var para = [];
      while (i < lines.length && lines[i].trim() !== '' &&
             !/^(#{1,4}\\s|\\s*\\||\\s*>|\\s*\`\`\`|\\s*([-*+]|\\d+[.)])\\s|\\s*(---+|\\*\\*\\*+)\\s*$)/.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>');
      else { i++; }
    }
    return out.join('\\n');
  }

  /* ---- 渲染文档 ---- */
  function open(id, push){
    var d = byId[id];
    if (!d) { welcome(); return; }
    current = d;
    var S = SYSBY[d.sys] || { label: '?', color: 'mem' };
    var sec = SECBY[d.section] || { label: '' };
    var meta = [];
    meta.push('<span class="chip ' + S.color + '">' + esc(S.label) + '</span>');
    meta.push('<span class="chip">' + esc(sec.label) + '</span>');
    meta.push('<span class="chip mono">' + esc(d.id) + '</span>');
    if (d.status && d.status !== 'active') meta.push('<span class="chip">' + esc(d.status) + '</span>');
    if (d.confidence !== '' && d.confidence != null) meta.push('<span class="chip">置信 ' + esc(d.confidence) + '</span>');
    if (d.updated) meta.push('<span class="chip">' + esc(d.updated) + '</span>');
    meta.push('<span class="chip">' + fmtChars(d.chars) + '</span>');
    d.tags.forEach(function(t){ meta.push('<span class="chip tag" data-tag="' + esc(t) + '">#' + esc(t) + '</span>'); });

    var bodySrc = d.body.replace(/^#\\s+([^\\n]+)\\n+/, function(m0, t0){
      return t0.trim() === d.title.trim() ? '' : m0;
    });

    elReader.innerHTML = '<article class="doc">' +
      '<h2>' + esc(d.title) + '</h2>' +
      '<div class="meta">' + meta.join('') + '</div>' +
      (d.source ? '<div style="font-size:11.5px;color:var(--fg-3);margin:-12px 0 20px">来源：' + esc(d.source) + '</div>' : '') +
      '<div class="body">' + md2html(bodySrc) + '</div>' +
      '</article>';
    elReader.scrollTop = 0;
    elCrumb.textContent = S.label + ' / ' + sec.label + ' / ' + d.path;
    elApp.classList.add('reading');
    renderList();
    if (push && location.hash !== '#' + encodeURIComponent(d.id)) {
      history.replaceState(null, '', '#' + encodeURIComponent(d.id));
    }
  }

  elReader.onclick = function(e){
    var tag = e.target.closest('[data-tag]');
    if (tag) { q = tag.getAttribute('data-tag'); elQ.value = q; renderList(); return; }
    var row = e.target.closest('.recent .row');
    if (row) open(row.getAttribute('data-id'), true);
  };

  /* ---- 欢迎页 ---- */
  function welcome(){
    current = null;
    elApp.classList.remove('reading');
    var recent = DOCS.slice().sort(function(a,b){
      return (b.updated || '').localeCompare(a.updated || '') || a.order - b.order;
    }).slice(0, 6);
    var h = '<div class="welcome">' +
      '<h2>两个库，别混在一起用</h2>' +
      '<p class="lead">左边这个每次会话被自动塞给 agent，所以要短、要准；右边这个只在 agent 主动去查时才进来，所以可以大、可以杂。判断一条东西放哪，只看一句话会不会改变 agent 的做法。</p>' +
      '<div class="duo">';
    SYS.forEach(function(S){
      var n = countOf(S.key);
      h += '<div class="syscard ' + S.color + '">' +
             '<div class="h"><span class="nm">' + esc(S.label) + '</span><span class="ct">' + n + (S.key === 'kb' ? ' 篇' : ' 条') + '</span></div>' +
             '<div class="bl">' + esc(S.blurb) + ' · ' + esc(S.mode) + '</div>' +
             '<div class="row"><b>放</b><span>' + esc(S.put) + '</span></div>' +
             '<div class="row"><b>不放</b><span>' + esc(S.keep) + '</span></div>' +
             '<div class="path">' + esc(S.where) + '</div>' +
           '</div>';
    });
    h += '</div>' +
      '<h3>最近更新</h3><div class="recent">';
    recent.forEach(function(d){
      var S = SYSBY[d.sys];
      h += '<div class="row" data-id="' + esc(d.id) + '"><span class="sd ' + (S ? S.color : 'mem') + '"></span>' +
           '<span class="t">' + esc(d.title) + '</span>' +
           '<span class="d">' + esc(S ? S.label : '') + ' · ' + esc(d.updated || '') + '</span></div>';
    });
    h += '</div>' +
      '<div class="tips">' +
        '<div>· <code>/</code> 搜索两个库，<code>Esc</code> 清空；上方三个按钮可按库过滤。</div>' +
        '<div>· 点标签按标签跨库过滤；点条目看全文。</div>' +
        '<div>· 内容变动后运行 <code>node bin/render.mjs</code> 重新生成这一页。</div>' +
        '<div>· 记忆体源：<code>' + esc(D.vault) + '</code>　知识库源：<code>' + esc(D.kb) + '</code></div>' +
      '</div></div>';
    elReader.innerHTML = h;
    elCrumb.textContent = '概览';
    renderList();
  }

  elQ.oninput = function(){ q = elQ.value.trim(); renderList(); };
  document.addEventListener('keydown', function(e){
    if (e.key === '/' && document.activeElement !== elQ) { e.preventDefault(); elQ.focus(); elQ.select(); }
    if (e.key === 'Escape') { elQ.value = ''; q = ''; elQ.blur(); renderList(); }
  });
  document.getElementById('back').onclick = function(){ elApp.classList.remove('reading'); };

  var startId = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  if (startId && byId[startId]) open(startId, false);
  else welcome();

  window.addEventListener('hashchange', function(){
    var id = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (id && byId[id]) open(id, false);
    else if (!id) welcome();
  });
})();
</script>
</body>
</html>`;
}
