# 本地技能现状（L2 专题）

> L2 专题层：已删/在用技能、共用仓库约定、B站抓取实测。
> 入口索引：`memory-technical.md`。字符预算 3,000。
> **适用性**：共用仓库约定（Junction、产品名命名）跨 agent 通用；具体技能清单/安装状态是 WorkBuddy 本机的，别的 agent 请按自身环境核对。

## 本地技能现状
- **`knowledge-distill` 已删除（2026-11-15 22:22）**，连同实体、4 个 Junction 入口和备份一并清除，不可恢复。不要按旧路径找。`D:\WorkBuddy\skill-store\` 保留待用。
- 仍在用的用户级技能：`ego-browser`（`~/.workbuddy/skills/ego-browser` → ego 安装目录下的 `ego-skills`，由 ego 官方维护，不要手动改）。
- **`zw-summary`（视频/播客总结）是多 agent 共用技能，实体在 `D:\collaborative project\skills\zw-summary\`**（共用仓库，git 管理，改一份全部生效），各 agent 目录只挂 Junction（豆包 `user_skills` 2026-11-16 迁移，旧路径已删除）。核心改造在 `adapters/`：`ego_fetch.py` 走 ego 取抖音/小红书/B站/YouTube/X 数据，`yt_fetch.py` 专管 YouTube。四档输出：`--quiet` / JSON / `--digest` / `--full`；另有 `--search "词" --platform douyin --limit 5` 关键词直跑（抖音/B站/小红书/YouTube 通，**X 搜索页不可用，只能喂单条链接**）。用法与踩坑见 `adapters/README.md`。
- **蒸馏 skill 的约定**：cangjie 蒸馏产出的技能实体放 `D:\collaborative project\skills\`（共用仓库），agent 目录只挂 Junction；说「卸载」= 摘链接 + 删仓库实体源文件，说「停用」= 实体留在仓库只摘挂载（decision-20261117-50a2）。
- 安装新技能的约定位置：实体放 `D:\WorkBuddy\skill-store\<name>\`（单 agent 自用），共用技能放 `D:\collaborative project\skills\`，再挂 Junction 入口。
- **B站视频搜集口播内容（2026-11-19 实测）**：`bili_api.py` 只抓元数据（源码写死 `subtitles:[], media_audio:None, media_video:None`），选题/标题阶段 `--search "词" --limit 5` 够用；要抓媒体/口播必须用 `ego_fetch.py <B站URL或BV号> --full`（**传 URL，不是本地路径**），落盘 `media_audio.m4a` + `media_video.mp4`。B站 AI 字幕轨道存在但匿名访问 URL 为空，口播转写兜底 = 对 `media_audio.m4a` 走 AudioTranscribe（长音频 ASR，实测 25 分钟视频全量转写成功）。踩坑：曾误传本地路径给 ego_fetch 导致失败、只拿到 meta.json。
