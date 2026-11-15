#!/usr/bin/env bash
# wb-run.sh — hook 启动器：负责找到 node 再交给 wb-context.mjs
# 之所以多这一层：WorkBuddy 的 hook 命令在 Git Bash 里执行，node 可能不在 PATH 上，
# 而 app 自带的 node 路径带版本号，升级后会变，所以这里动态解析。

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NODE="$(command -v node 2>/dev/null || true)"

if [ -z "$NODE" ]; then
  NODE="$(ls -d /d/WorkBuddy/binaries/node/versions/*/node.exe 2>/dev/null \
    | sort -V | tail -1)"
fi

# 兜底：Windows 下的标准安装位置
if [ -z "$NODE" ] && [ -f "/c/Program Files/nodejs/node.exe" ]; then
  NODE="/c/Program Files/nodejs/node.exe"
fi

# 实在找不到就静默退出，绝不阻塞对话
[ -z "$NODE" ] && exit 0

exec "$NODE" "$DIR/wb-context.mjs"
