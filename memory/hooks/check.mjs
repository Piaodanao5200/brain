#!/usr/bin/env node
/**
 * check.mjs — 检查 WorkBuddy 里的自动检索钩子是否真的在工作
 *
 * 用法：node hooks/check.mjs
 * 做三件事：配置有没有、脚本能不能跑、最近有没有真的触发过。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const LOG = join(HERE, "_hook.log");
const SETTINGS = join(process.env.HOME || process.env.USERPROFILE || "", ".workbuddy", "settings.json");

const ok = (s) => `\x1b[32m✓\x1b[0m ${s}`;
const no = (s) => `\x1b[31m✗\x1b[0m ${s}`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log("\n1) WorkBuddy 配置");
let cfg = null;
if (!existsSync(SETTINGS)) {
  console.log(no(`找不到 ${SETTINGS}`));
} else {
  try {
    cfg = JSON.parse(readFileSync(SETTINGS, "utf8"));
    const h = cfg.hooks || {};
    for (const ev of ["SessionStart", "UserPromptSubmit"]) {
      const arr = h[ev];
      if (Array.isArray(arr) && arr.length) {
        const cmd = arr[0]?.hooks?.[0]?.command || "?";
        console.log(ok(`${ev} 已配置 ${dim(cmd)}`));
      } else {
        console.log(no(`${ev} 未配置`));
      }
    }
  } catch (e) {
    console.log(no(`settings.json 不是合法 JSON：${e.message}`));
  }
}

console.log("\n2) 脚本自检（直接喂一个假提问）");
try {
  const out = execFileSync("bash", [join(HERE, "wb-run.sh")], {
    input: JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "上次那个模型排名第一的是哪个" }),
    encoding: "utf8",
    timeout: 20000,
  });
  const j = JSON.parse(out);
  const ctx = j.hookSpecificOutput.additionalContext;
  console.log(ok(`脚本可运行，本可注入 ${ctx.length} 字（${ctx.split("\n").filter((l) => l.startsWith("· ")).length} 条命中）`));
} catch (e) {
  console.log(no(`脚本执行失败：${String(e.message).slice(0, 120)}`));
}

console.log("\n3) 真实触发记录");
if (!existsSync(LOG)) {
  console.log(no("还没有 _hook.log —— 说明钩子从未被 WorkBuddy 真正调用过"));
  console.log(dim("   重启 WorkBuddy 后新开一个任务，再来跑一次这条命令。"));
} else {
  const lines = readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean);
  const age = (Date.now() - statSync(LOG).mtimeMs) / 60000;
  console.log(`共 ${lines.length} 条记录，最近一次 ${age.toFixed(0)} 分钟前`);
  for (const l of lines.slice(-6)) console.log("  " + dim(l));
  if (age > 120) console.log(dim("\n   超过 2 小时没有新记录：如果你期间用过 WorkBuddy，说明钩子没生效。"));
}
console.log("");
