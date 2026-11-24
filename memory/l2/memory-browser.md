# 浏览器技术细节（L2 专题）

> 用户级 L2 专题层：ego 浏览器安装路径、Junction、扩展 ID、连接验证。
> 入口索引：`memory-technical.md`。字符预算 3,000。
> **本专题全部是"仅 WorkBuddy 成立"的平台专属细节，勿外推给 Codex/豆包/DeepSeek。**

## 浏览器选择（ego 细节）
- ego 是 Citro Labs 出品的 Chromium 系浏览器，版本 0.6.3.17（2026-11-24 核实；旧记 0.6.3.14 已过时）。
- **安装路径（2026-11-16 核实，只有一份实体）**：约 741 文件 / 618.8 MB。
  - 实体在 `E:\software\ego lite\`；`C:\Program Files\Citro Labs\ego lite` 只是 **Junction → `E:\software\ego lite`**（"装完搬目录、原地留链接"，非 ego 功能）。
  - 两处路径的 `ego.exe` 文件 ID 完全相同，磁盘只占一份。
  - 4 个快捷方式、注册表卸载项、`App Paths\ego.exe` 都指向 C 盘路径；`~/.local/share/ego/active_version_dir` → `E:\software\ego lite\Application\0.6.3.14`。
  - 风险：删 E 盘 = 程序真没了；删 C 盘 Junction = 快捷方式和注册表全断。Junction 是单点，E 盘符变动或目录改名会让双击失效、`ego-browser` CLI 一起挂。
  - 识别方法（别再被误导）：`Get-Item` 看 `LinkType=Junction`；穿过 Junction 枚举子项时 `Target` 会出现 `C:\software\ego lite\...` 这种不存在的残留串，但 `fsutil reparsepoint query` 会明确报"不是重分析点"。
- 用户数据：`C:\Users\12647\AppData\Local\Citro Labs\ego lite\User Data`（Profile 1）
- WorkBuddy 扩展 ID：`ajnnogdfpilbhkeggdjlcokgglijmdde`（0.2.8，已安装并启用）。
- **重要**：ego 在可用浏览器列表里显示为 `name: "Google Chrome"` / `family: "chrome"`，扩展 ID 同上（装的是 Chrome 商店版扩展），不要因为找不到 "ego" 就判定它没连上。验证方法：查 `browser-extension-native-host.exe` 的父进程链，挂在 `ego.exe` 上就说明已连接；真正的 Edge 用 `ndbfelmlimfjklodckmbalfioaehegpc`。
- 每次浏览器任务的 browser_id 都要重新获取，不要复用旧编号（同一会话里编号会变）。若确实没连上，再请用户点一下 ego 工具栏的 WorkBuddy 扩展图标或重启 ego。

## 本平台操作命令与本机路径（仅 WorkBuddy）
- **浏览器通道**：默认 ego-browser CLI（命令行程序），写法 `ego-browser nodejs <轮次脚本.mjs>` 做搜索/取数/抓取。可执行文件路径：`E:\software\ego lite\Application\<版本>\ego-browser.exe`（版本升级后到 `~/.local/share/ego/active_version_dir` 查当前指向，别写死 0.6.3.x）。
- **MCP 浏览器**（外部浏览器工具接口）：要用 UI 自动化的那套（`browser_id` 参数）之前，**必须先问用户**，不得直接调用。
- **音视频抽帧**：`D:\WorkBuddy\video_understanding\extract_frames.py` 抽关键帧画面；音频用 AudioTranscribe 转写（工具名，非本机路径）。
- **网页搜索**：WebSearch / domain_search（WorkBuddy 平台内置工具名）；GitHub 用已装 connector（外部服务连接器）。
- 上面的命令/路径都是平台专属；**通用检索纪律**（多源三类、交叉验证、不跳源、音视频取全过程）不在这里——在共享库 `D:\collaborative project\brain\AGENTS.md`「通用工作规则」节。
