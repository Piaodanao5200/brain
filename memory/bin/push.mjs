#!/usr/bin/env node
/**
 * push.mjs — 用 GitHub REST API 推送本地提交（绕过被墙/被拦截的 git push）
 *
 * 解决的问题：本机 `git push` 在 github.com:443 上 TLS 被中断（schannel: server
 * closed abruptly），但 api.github.com 正常。所以改走 API：blob → tree → commit →
 * 移动分支指针。
 *
 * 与早期脚本的关键区别：早期脚本写 `parents: []` + `force: true`，每次推送都把远程
 * 历史抹成一条。本脚本：
 *   - 从远程当前 tip 接上父节点，历史**累积**而不是覆盖
 *   - 逐 commit 重放本地未推送的提交（保留各自的 message / author / 时间）
 *   - 复用 blob / tree 缓存，只上传变化的部分
 *   - 顺便把远程历史与本地对齐：若 SHA 与本地一致，`git status` 就会显示 "up to date"
 *
 * 用法:
 *   node push.mjs                     # 推送当前仓库（默认分支）
 *   node push.mjs --repo <路径>        # 推送指定仓库
 *   node push.mjs --dry-run           # 只显示要做什么，不动远程
 *   node push.mjs --branch main       # 指定分支
 *
 * 凭据：从 git 的 credential helper 现取（git credential fill），不写进任何文件。
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ---------- 参数 ----------
const argv = process.argv.slice(2);
function flag(name, def = null) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}
const REPO = path.resolve(flag('repo', process.cwd()));
const DRY = !!flag('dry-run', false);
const BRANCH = flag('branch', null); // null = 用仓库默认分支

// ---------- 小工具 ----------
const sh = (args, opts = {}) =>
  execFileSync('git', args, { cwd: REPO, encoding: 'buffer', maxBuffer: 512 * 1024 * 1024, ...opts });

const shText = (args) => sh(args).toString('utf8').trim();

function die(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

function readToken() {
  // 用 git 自己的凭据助手取 token：与 git 用的是同一份，无需单独保存
  const out = execFileSync('git', ['credential', 'fill'], {
    cwd: REPO,
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8',
  });
  const m = out.match(/^password=(.+)$/m);
  if (!m) die('取不到 GitHub 凭据。请先在别的终端执行一次 git push 记录凭据，或运行 git credential approve。');
  return m[1].trim();
}

function remoteSlug() {
  const url = shText(['remote', 'get-url', 'origin']);
  const m = url.match(/github\.com[:/]+([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (!m) die(`无法从 remote 解析仓库名: ${url}`);
  return { owner: m[1], repo: m[2] };
}

async function api(method, endpoint, body, token) {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'brain-push-mjs',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const msg = json.message || text.slice(0, 300);
    const err = new Error(`${method} ${endpoint} → ${res.status} ${msg}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

// ---------- git 对象读取 ----------
/** 解析 commit 对象 */
function readCommit(sha) {
  const raw = sh(['cat-file', 'commit', sha]).toString('utf8');
  const headEnd = raw.indexOf('\n\n');
  const headers = raw.slice(0, headEnd).split('\n');
  const message = raw.slice(headEnd + 2);
  let tree = null;
  const parents = [];
  let author = null;
  let committer = null;
  for (const line of headers) {
    if (line.startsWith('tree ')) tree = line.slice(5).trim();
    else if (line.startsWith('parent ')) parents.push(line.slice(7).trim());
    else if (line.startsWith('author ')) author = parsePerson(line.slice(7));
    else if (line.startsWith('committer ')) committer = parsePerson(line.slice(10));
  }
  return { sha, tree, parents, author, committer, message };
}

/** "Name <mail> 1699999999 +0800" → { name, email, date } */
function parsePerson(s) {
  const m = s.match(/^(.*?)\s*<([^>]*)>\s*(\d+)\s+([+-]\d{4})$/);
  if (!m) return { name: s, email: '', date: new Date().toISOString() };
  return { name: m[1], email: m[2], date: toIso(Number(m[3]), m[4]) };
}

/** epoch + 时区 → 带偏移的 ISO（保留偏移才能让 commit SHA 与本地一致） */
function toIso(epoch, tz) {
  const sign = tz[0] === '-' ? -1 : 1;
  const offMin = sign * (Number(tz.slice(1, 3)) * 60 + Number(tz.slice(3, 5)));
  const local = new Date((epoch + offMin * 60) * 1000);
  return local.toISOString().replace(/\.\d{3}Z$/, '') + tz.slice(0, 3) + ':' + tz.slice(3);
}

/** 列出一个 tree 的直接条目（-z 避免中文名被转义） */
function readTree(treeSha) {
  const raw = sh(['ls-tree', '-z', treeSha]).toString('utf8');
  if (!raw) return [];
  return raw
    .split('\0')
    .filter(Boolean)
    .map((rec) => {
      const tab = rec.indexOf('\t');
      const meta = rec.slice(0, tab).split(' ');
      return { mode: meta[0], type: meta[1], sha: meta[2], name: rec.slice(tab + 1) };
    });
}

function hasObject(sha) {
  try {
    sh(['cat-file', '-e', `${sha}^{object}`]);
    return true;
  } catch {
    return false;
  }
}

// ---------- 主流程 ----------
const token = readToken();
const { owner, repo } = remoteSlug();

const head = shText(['rev-parse', 'HEAD']);
const branch = BRANCH || shText(['rev-parse', '--abbrev-ref', 'HEAD']);

console.log(`\n  仓库   ${owner}/${repo}`);
console.log(`  分支   ${branch}`);
console.log(`  本地   ${head.slice(0, 7)}`);
if (DRY) console.log('  模式   演练（不会改动远程）');

// 远程当前 tip
const refPath = `/repos/${owner}/${repo}/git/ref/heads/${branch}`;
let remoteTip = null;
try {
  const ref = await api('GET', refPath, null, token);
  remoteTip = ref.object.sha;
  console.log(`  远程   ${remoteTip.slice(0, 7)}`);
} catch (e) {
  if (e.status === 404) {
    die(`远程没有 ${branch} 分支。请先在 GitHub 上建仓库并初始化，或换 --branch 指定正确分支。`);
  }
  throw e;
}

// 本地相对远程领先的提交（从旧到新）
let toPush = [];
if (remoteTip === head) {
  console.log('\n  远程已是最新，无需推送。\n');
  process.exit(0);
} else if (hasObject(remoteTip)) {
  const list = shText(['rev-list', '--reverse', `${remoteTip}..${head}`]).split('\n').filter(Boolean);
  toPush = list;
} else {
  // 远程 tip 不在本地对象库（历史是脚本造的 / 本地被重置过）
  // 策略：以远程 tip 为父，重放本地从根到 HEAD 的全部提交，结果是内容以本地为准
  const list = shText(['rev-list', '--reverse', 'HEAD']).split('\n').filter(Boolean);
  toPush = list;
  console.log(`\n  ! 远程 ${remoteTip.slice(0, 7)} 不在本地历史里，将整体重放本地 ${list.length} 个提交`);
}

console.log(`\n  待推送 ${toPush.length} 个提交：`);
for (const s of toPush) console.log(`    ${s.slice(0, 7)}  ${readCommit(s).message.split('\n')[0]}`);

if (DRY) {
  console.log('\n  演练结束，未上传任何内容。\n');
  process.exit(0);
}

// ---------- 缓存：本地对象 sha → 远程对象 sha ----------
const cachePath = path.join(REPO, '.git', 'remote-cache.json');
let cache = { blobs: {}, trees: {} };
try {
  cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  cache.blobs ||= {};
  cache.trees ||= {};
} catch {
  /* 首次运行 */
}

let uploaded = 0;
let reused = 0;

async function uploadBlob(localSha) {
  if (cache.blobs[localSha]) {
    reused++;
    return cache.blobs[localSha];
  }
  const buf = sh(['cat-file', 'blob', localSha]);
  const { sha } = await api('POST', `/repos/${owner}/${repo}/git/blobs`, {
    content: buf.toString('base64'),
    encoding: 'base64',
  }, token);
  cache.blobs[localSha] = sha;
  uploaded++;
  process.stdout.write(`\r  上传中… ${uploaded} 个对象  `);
  return sha;
}

async function uploadTree(localTreeSha) {
  if (cache.trees[localTreeSha]) return cache.trees[localTreeSha];
  const entries = readTree(localTreeSha);
  const tree = [];
  for (const e of entries) {
    if (e.type === 'commit') {
      // 子模块：API 建树时需要 type: 'commit'，直接透传 sha
      tree.push({ path: e.name, mode: e.mode, type: 'commit', sha: e.sha });
      continue;
    }
    const sha = e.type === 'tree' ? await uploadTree(e.sha) : await uploadBlob(e.sha);
    tree.push({ path: e.name, mode: e.mode, type: e.type, sha });
  }
  const { sha } = await api('POST', `/repos/${owner}/${repo}/git/trees`, { tree }, token);
  cache.trees[localTreeSha] = sha;
  return sha;
}

// ---------- 逐 commit 重放 ----------
let parentRemote = remoteTip;
let newTip = remoteTip;

for (const localSha of toPush) {
  const c = readCommit(localSha);
  const tree = await uploadTree(c.tree);
  const res = await api('POST', `/repos/${owner}/${repo}/git/commits`, {
    message: c.message,
    tree,
    parents: [parentRemote],
    author: c.author,
    committer: c.committer,
  }, token);
  const same = res.sha === localSha ? '  = 与本地一致' : '';
  console.log(`\n  ✓ ${localSha.slice(0, 7)} → ${res.sha.slice(0, 7)}${same}`);
  parentRemote = res.sha;
  newTip = res.sha;
}

if (uploaded) console.log(`\n  上传 ${uploaded} 个对象，复用 ${reused} 个`);

// ---------- 移动分支指针 ----------
await api('PATCH', refPath, { sha: newTip, force: false }, token);
console.log(`\n  ✓ ${branch} 指针 ${remoteTip.slice(0, 7)} → ${newTip.slice(0, 7)}`);

fs.writeFileSync(cachePath, JSON.stringify(cache, null, 0));

// 如果重放出来的 sha 与本地一致，把本地 origin/<branch> 也更新掉，避免 git status 误报
try {
  sh(['update-ref', `refs/remotes/origin/${branch}`, newTip]);
} catch {
  /* 忽略 */
}

if (newTip === head) {
  console.log('  本地与远程完全一致（同一 SHA），git status 会显示 up to date');
} else {
  console.log(`  远程 ${newTip.slice(0, 7)} ≠ 本地 ${head.slice(0, 7)}（历史被重写过，但内容一致）`);
}
console.log('');
