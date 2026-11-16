#!/usr/bin/env node
/**
 * ui-server.mjs — 本地看板服务（零依赖）
 *
 * 只做三件事：
 *   1. 把 vault 读出来做成 JSON（/api/state）
 *   2. 盯住 vault 的文件变化，用 SSE 推给页面（/events）
 *   3. 接收写入请求，一律转交给 vault.mjs，自己不碰文件
 *
 * 为什么写操作要转交给 vault.mjs：id 生成、索引重建、supersede 链都在那里，
 * 绕过它就会写出不合规的条目，最终两套规则打架。
 *
 * 用法：node server/ui-server.mjs          默认 127.0.0.1:8788
 * 环境变量：KB_UI_PORT / KB_NO_OPEN=1 / KB_VAULT
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { VAULT, scan, writeEntry, supersede, updateEntry, rebuildIndex, dailyDigest } from './lib/vault.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const UI_FILE = path.join(ROOT, 'ui', 'index.html');
const KB_ROOT = path.resolve(ROOT, '..', 'library');
const PORT = Number(process.env.KB_UI_PORT || 8788);
const HOST = '127.0.0.1';
const OPEN_BROWSER = process.env.KB_NO_OPEN !== '1';

/* ---------------- 工具 ---------------- */

function dayStr(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function dayOf(e) {
  if (e.created) return e.created;
  if (e.mtime) return dayStr(new Date(e.mtime));
  return '';
}

function sendJSON(res, code, obj) {
  const buf = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': buf.length,
  });
  res.end(buf);
}

function readBody(req, limitBytes) {
  limitBytes = limitBytes || 1024 * 512;
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limitBytes) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('JSON 解析失败：' + e.message)); }
    });
    req.on('error', reject);
  });
}

/* ---------------- 状态 ---------------- */

function libraryFiles() {
  const out = [];
  const roots = [path.join(KB_ROOT, 'sources'), path.join(KB_ROOT, 'inbox')];
  for (const root of roots) {
    const walk = (dir, depth) => {
      if (depth > 3 || out.length >= 200) return;
      let items = [];
      try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const it of items) {
        if (it.name.startsWith('.')) continue;
        const p = path.join(dir, it.name);
        if (it.isDirectory()) walk(p, depth + 1);
        else if (it.isFile()) {
          try {
            const st = fs.statSync(p);
            out.push({
              name: it.name,
              rel: path.relative(KB_ROOT, p).split(path.sep).join('/'),
              ext: path.extname(it.name).slice(1).toLowerCase(),
              size: st.size,
              mtime: st.mtimeMs,
              day: dayStr(st.mtime),
            });
          } catch {}
        }
      }
    };
    walk(root, 0);
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

function buildState() {
  const today = dayStr();
  const all = scan().filter((e) => e.type !== 'index');
  const isActive = (e) => e.status === 'active' || e.status === 'canonical';
  const active = all.filter(isActive);

  const dig = dailyDigest(today);
  const added = dig.added;
  const changed = dig.changed;
  const retired = dig.retired;

  const byType = {};
  for (const e of active) byType[e.type] = (byType[e.type] || 0) + 1;

  const strip = (e) => ({
    id: e.id, type: e.type, scope: e.scope, title: e.title, tags: e.tags,
    status: e.status, created: e.created, updated: e.updated,
    confidence: e.confidence, source: e.source, superseded_by: e.superseded_by,
    body: e.body, rel: e.rel, mtime: e.mtime,
  });

  return {
    ok: true,
    now: new Date().toISOString(),
    today,
    vault: VAULT,
    counts: {
      total: all.length,
      active: active.length,
      superseded: all.filter((e) => e.status === 'superseded').length,
      byType,
    },
    daily: {
      date: today,
      added: added.map(strip),
      changed: changed.map(strip),
      retired: retired.map(strip),
    },
    entries: all.map(strip),
    library: libraryFiles(),
  };
}

/* ---------------- SSE ---------------- */

const clients = new Set();
let timer = null;

function broadcast(reason) {
  const payload = 'event: change\ndata: ' + JSON.stringify({ at: new Date().toISOString(), reason: reason || 'vault' }) + '\n\n';
  for (const res of clients) {
    try { res.write(payload); } catch { clients.delete(res); }
  }
}

function scheduleBroadcast(reason) {
  clearTimeout(timer);
  timer = setTimeout(() => broadcast(reason), 300);
}

function watchDir(dir, reason) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.watch(dir, { recursive: true }, () => scheduleBroadcast(reason));
  } catch (e) {
    console.error('[watch] ' + dir + ' 监听失败：' + e.message);
  }
}

/* ---------------- 路由 ---------------- */

function writeGuard(req) {
  // 只接受本页面发起的写请求：带自定义头，跨站页面无法伪造（同源策略会拦）。
  return req.headers['x-kb-ui'] === '1';
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://' + HOST + ':' + PORT);
  const p = url.pathname;

  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    let html = '';
    try { html = fs.readFileSync(UI_FILE, 'utf8'); } catch {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('找不到界面文件：' + UI_FILE);
    }
    const buf = Buffer.from(html, 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-length': buf.length });
    return res.end(buf);
  }

  if (req.method === 'GET' && p === '/api/health') return sendJSON(res, 200, { ok: true, today: dayStr(), vault: VAULT });
  if (req.method === 'GET' && p === '/api/state') return sendJSON(res, 200, buildState());

  if (req.method === 'GET' && p === '/api/daily') {
    const state = buildState();
    const d = url.searchParams.get('date') || state.today;
    if (d === state.today) return sendJSON(res, 200, state.daily);
    const dig = dailyDigest(d);
    return sendJSON(res, 200, { date: dig.date, added: dig.added, changed: dig.changed, retired: dig.retired });
  }

  if (req.method === 'GET' && p === '/events') {
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    res.write('event: hello\ndata: ' + JSON.stringify({ at: new Date().toISOString() }) + '\n\n');
    clients.add(res);
    const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25000);
    req.on('close', () => { clearInterval(hb); clients.delete(res); });
    return;
  }

  if (p.startsWith('/api/') && req.method !== 'GET' && !writeGuard(req)) {
    return sendJSON(res, 403, { ok: false, error: '缺少 x-kb-ui 请求头，拒绝写入' });
  }

  if (req.method === 'POST' && p === '/api/entry') {
    const body = await readBody(req);
    try {
      const r = writeEntry(body);
      scheduleBroadcast('write');
      return sendJSON(res, 200, { ok: true, id: r.id, rel: r.rel, warnings: r.warnings });
    } catch (e) {
      return sendJSON(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'PATCH' && p === '/api/entry') {
    const body = await readBody(req);
    const id = body.id || url.searchParams.get('id');
    if (!id) return sendJSON(res, 400, { ok: false, error: '缺少 id' });
    delete body.id;
    try {
      const r = updateEntry(id, body);
      scheduleBroadcast('update');
      return sendJSON(res, 200, { ok: true, id: r.id, rel: r.rel, renamed: r.renamed });
    } catch (e) {
      return sendJSON(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && p === '/api/entry/supersede') {
    const body = await readBody(req);
    if (!body.id) return sendJSON(res, 400, { ok: false, error: '缺少 id' });
    try {
      const r = supersede(body.id, {
        title: body.title, body: body.body, source: body.source,
        confidence: body.confidence, tags: body.tags,
      });
      scheduleBroadcast('supersede');
      return sendJSON(res, 200, { ok: true, id: r.id, from: body.id, rel: r.rel });
    } catch (e) {
      return sendJSON(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && p === '/api/reindex') {
    try { rebuildIndex(); scheduleBroadcast('reindex'); return sendJSON(res, 200, { ok: true }); }
    catch (e) { return sendJSON(res, 400, { ok: false, error: e.message }); }
  }

  sendJSON(res, 404, { ok: false, error: 'not found: ' + p });
}

/* ---------------- 启动 ---------------- */

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    try { sendJSON(res, 500, { ok: false, error: e.message }); } catch {}
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('[kb-ui] 端口 ' + PORT + ' 已被占用。换个端口：set KB_UI_PORT=8789');
    process.exit(1);
  }
  console.error('[kb-ui] ' + e.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  watchDir(VAULT, 'vault');
  const libSources = path.join(KB_ROOT, 'sources');
  const libInbox = path.join(KB_ROOT, 'inbox');
  watchDir(libSources, 'library');
  watchDir(libInbox, 'library');

  const url = 'http://' + HOST + ':' + PORT + '/';
  console.log('');
  console.log('  kb 看板已启动  ' + url);
  console.log('  vault: ' + VAULT);
  console.log('  实时监听中，Ctrl+C 停止。');
  console.log('');

  if (OPEN_BROWSER && process.platform === 'win32') {
    try {
      const child = spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
      child.unref();
    } catch (e) { console.error('打开浏览器失败，请手动访问 ' + url); }
  }
});

process.on('SIGINT', () => {
  console.log('\n  bye.');
  for (const res of clients) { try { res.end(); } catch {} }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 500);
});