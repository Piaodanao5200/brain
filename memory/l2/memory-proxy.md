# 代理配置（L2 专题）

> L2 专题层：本机两个代理的区别、翻墙抓取路径。
> 入口索引：`memory-technical.md`。字符预算 3,000。
> **适用性**：**仅 WorkBuddy 本机成立**——端口号、沙箱 ID 是这台机器的，别的 agent 读到请跳过，不要照抄。

## 代理配置（2026-11-17 实测）
- **本机两个代理，别搞混**：
  - `127.0.0.1:7897` = `verge-mihomo`（用户自己的 Clash Verge），**真正能翻墙**，实测 YouTube / X 均 HTTP 200。系统代理开关 `ProxyEnable=0`（没打开），但 7897 端口常驻监听、进程一直在跑。没权限也不该动它的订阅/节点——需要翻墙时只是让流量临时走这个已运行的端口，不改系统设置。
  - `127.0.0.1:64865` = WorkBuddy 自带 `sandbox-cli`（`E:\software\WorkBuddy\resources\app.asar.unpacked\cli\vendor\sandbox\5.11.4\sandbox-cli.exe`），是环境变量 `HTTP_PROXY/HTTPS_PROXY` 的指向，**不翻墙**，实测访问 YouTube 超时（http=000）。别把它当翻墙代理。
- **ego 浏览器走自身网络栈，不读 shell 的 `HTTP_PROXY` 环境变量** → 直接用 ego 抓 YouTube/X 会因沙箱代理而失败。翻墙抓取改用 `curl -x http://127.0.0.1:7897 ...` 显式指定代理（最可靠），或让脚本走 CDP 代理设置。
- **YouTube 抓取成功路径**：`curl -x http://127.0.0.1:7897` 抓 `youtube.com/results?search_query=...` 搜索页 HTML → Python 正则取 `ytInitialData` → 递归找 `videoRenderer` 拿标题/频道/播放量/ID。2026-11-17 实测通。
- **X 搜索页即使走 7897 也无解**：无登录态时强制 307 跳登录墙，拿不到推文列表；只能提供具体推文链接用 `zw-summary` 单条抓取。
- `zw-summary` 适配器的 `--search youtube` 2026-11-17 失效（`found=0`）——不要依赖它做 YouTube 搜索，优先用上面的 curl 路径。
