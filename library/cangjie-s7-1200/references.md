# references.md — 有来源价值但非可独立执行方法的候选（阶段 3 写入 Bundle 参考区）

> 判定依据：方法论 03-stage1.5 — case / counter-example / term 一般作为支持材料或参考保留；纯参数表/模板无独立可执行动作。
> 交付路径（阶段 3 实装）：`book/glossary.md`（术语）、`book/overview.md` 参考区（示例/失败模式/参数表），并作为下游 skill 的 Boundary(B) 字段来源。
> 本文件为 93 条 reference 候选（22 case + 45 counter-example + 25 glossary + 1 参数表模板）。每条保留原候选 ID。

## A. Case（worked_example，22 条）→ book/overview.md 参考区（示例/演算）

| id | title | task_ids | 交付路径 | reference 理由 |
|---|---|---|---|---|
| c01 | 0-20mA 测 50~100°C 温度换算 | T06 | overview 参考区/模拟量示例 | 演算示例；可执行的换算规则已由 p26/p36 承载，本条为佐证 |
| c02 | 组态控制三模块隐藏与换槽 | T01 | overview 参考区/组态控制示例 | 独立情境示例，非通用方法 |
| c03 | 组态控制在线显示诊断差异 | T07 | overview 参考区/组态控制示例 | 演示性示例，诊断规则见 f52/f16 |
| c04 | 浮点精度 1e8+1=1e8 | T04 | overview 参考区/数据类型示例 | 演算示例；精度规则见 p27 |
| c05 | 数组声明与寻址示例 | T04 | overview 参考区/数据类型示例 | 语法示例，非方法 |
| c06 | 数学函数 SQR/EXPT 演算 | T08 | overview 参考区/指令示例 | 指令级示例 |
| c07 | PEEK/POKE 索引寻址示例 | T04 | overview 参考区/寻址示例 | 调用示例，运行结果未给出 |
| c08 | ENO 使能输出使用示例 | T02 | overview 参考区/程序流程示例 | 编程结构示例 |
| c09 | SCL 变量映射示例 | T02 | overview 参考区/接口示例 | 接口声明示例 |
| c10 | DeviceStates 16 从站诊断示例 | T07 | overview 参考区/诊断示例 | 诊断位解析示例；指令选择框架见 f44 |
| c11 | ModuleStates 模块级诊断示例 | T07 | overview 参考区/诊断示例 | 诊断位解析示例 |
| c12 | Deserialize 客户数据反序列化 | T04 | overview 参考区/指令示例 | 指令工作原理演示 |
| c13 | NORM_X/SCALE_X 模拟量示例 | T06 | overview 参考区/模拟量示例 | 示例；公式见 p36 |
| c14 | 配方 RecipeExport/Import 示例 | (空) | overview 参考区/配方示例 | 编程示例，无独立任务 ID |
| c15 | PID_Temp 级联控制器示例 | T06 | overview 参考区/PID 示例 | 组态示例 |
| c16 | CPU1217C 四种 PTO 速度组合 | T06/T01 | overview 参考区/运动示例 | 组态示例 |
| c17 | 消息帧4 组态 SINAMICS S120 | T06/T05 | overview 参考区/驱动组态示例 | 组态操作流程示例 |
| c18 | T_CONFIG 更改 IP 参数示例 | T05 | overview 参考区/通信组态示例 | 组态示例 |
| c19 | MB_SERVER 多 TCP 连接示例 | T05 | overview 参考区/Modbus 示例 | 多连接配置示例 |
| c20 | Modbus RTU 主站四段式程序 | T05 | overview 参考区/Modbus 示例 | 编程示例 |
| c21 | 早期 Modbus TCP 示例 | T05 | overview 参考区/旧版通信示例 | 旧版遗留示例，新项目不照搬（见 BOOK_OVERVIEW 批判）；保留为版本认知 |
| c22 | Get_*Path 读取符号/实例/块名 | T07/T02 | overview 参考区/诊断示例 | 指令调用示例 |

## B. Counter-example（失败模式/边界材料，45 条）→ book/overview.md 的 Boundary 区 / 各 skill 的 B 字段

| id | title | task_ids | 交付路径 | reference 理由 |
|---|---|---|---|---|
| ce01 | 安装环境不当致电气故障 | T01 | overview Boundary/安装 | 失败模式；正向规则已由 p01/p02/p03 承载 |
| ce02 | 纵向安装套用水平温度上限 | T01 | overview Boundary/安装 | 失败模式，降额规则见 p03 |
| ce03 | 外部24V与传感器电源并联 | T01 | overview Boundary/供电 | 失败模式；正向禁令见 p04 |
| ce04 | 非隔离M端子接不同电位 | T01 | overview Boundary/接地 | 失败模式；正向规则见 p05 |
| ce05 | 易燃环境断开带电设备 | T01 | overview Boundary/安装 | 禁令为支持材料 |
| ce06 | 徒手拿放板卡 ESD 损坏 | T10/T01 | overview Boundary/ESD | 防护提示，支持材料 |
| ce07 | BB1297 装入非规定电池 | T09/T10 | overview Boundary/备件 | 具体禁令支持材料 |
| ce08 | 工具强行分离模块/拧过头 | T01/T09 | overview Boundary/安装 | 机械操作禁令 |
| ce09 | 带电接地与接线 | T01 | overview Boundary/接线 | 失败模式；正向规则见 p07 |
| ce10 | 把 PLC 当唯一安全屏障 | T02 | overview Boundary/功能安全 | 安全原则，独立安全规则见 p07 |
| ce11 | 非隔离/单绝缘电源供电 | T01 | overview Boundary/电源 | 禁令支持材料 |
| ce12 | 灯负载直接继电器输出 | T01 | overview Boundary/负载 | 失败模式；规则见 p11 |
| ce13 | 感性负载缺抑制 | T01 | overview Boundary/负载 | 失败模式；正向规则见 p11 |
| ce14 | Windows 格式化 SIMATIC 卡 | T10 | overview Boundary/存储卡 | 禁令支持材料 |
| ce15 | 删 __LOG__/crdinfo.bin 隐藏文件 | T10 | overview Boundary/存储卡 | 禁令支持材料 |
| ce16 | 向运行中 CPU 插卡 | T10/T07 | overview Boundary/存储卡 | 失败模式；安全前提见 f17/f20 |
| ce17 | V3.0 卡插入 V4.x CPU | T09/T10 | overview Boundary/兼容性 | 失败模式；恢复见 f23/f54 |
| ce18 | 固件更新中途断电 | T10 | overview Boundary/固件 | 失败模式；规则见 f22 |
| ce19 | 写保护卡致配方/日志报错 | T10/T07 | overview Boundary/存储卡 | 失败模式，支持材料 |
| ce20 | 密码保护不保护通信指令 | T05 | overview Boundary/安全 | 认知误区；访问规则见 f31/p39 |
| ce21 | 未授权访问/改无效 PLC 变量 | T05/T07 | overview Boundary/Web安全 | 失败模式；规则见 p38 |
| ce22 | 混淆专有技术/复制保护密码 | T08 | overview Boundary/密码 | 认知误区，支持材料 |
| ce23 | 用户 Web 页面变量用引号 | T05 | overview Boundary/Web | 具体限制支持材料 |
| ce24 | 强制值随项目/存储卡持续生效 | T07/T08/T09 | overview Boundary/调试 | 失败模式，支持材料 |
| ce25 | 误把 RUN 下载当无风险小改 | T08/T07 | overview Boundary/RUN下载 | 风险警告；流程见 f63/f64 |
| ce26 | RUN 下载后以为删除逻辑立即失效 | T08/T06 | overview Boundary/RUN下载 | 行为边界，限制见 f64 |
| ce27 | 忽略 RUN 下载临时错误 | T07/T08 | overview Boundary/RUN下载 | 失败模式；恢复见 f64 |
| ce28 | 超最大扫描周期以为默认RUN安全 | T03/T02/T07 | overview Boundary/实时性 | 失败模式；规则见 f10/f14 |
| ce29 | 依赖 V3 时间错误OB旧中断行为 | T09/T02 | overview Boundary/版本迁移 | 版本差异，支持材料 |
| ce30 | 改写系统/时钟存储器位 | T02/T04 | overview Boundary/存储器 | 失败模式；约束见 f15 |
| ce31 | 误以为下载重置保持性数据 | T08/T10 | overview Boundary/保持性 | 认知误区，支持材料 |
| ce32 | 把基本类型一致误推多值一致 | T04/T02/T05 | overview Boundary/一致性 | 失败模式；方法见 f30/p34 |
| ce33 | DIS_AIRT/EN_AIRT 不成对 | T03/T04 | overview Boundary/中断 | 失败模式；配对规则见 f42 |
| ce34 | PID 放 OB1 每周期算 | T06/T03 | overview Boundary/PID | 反面规则支持材料 |
| ce35 | 增量编码器当绝对值用 | T06/T01 | overview Boundary/选型 | 一致性约束支持材料 |
| ce36 | TO 与驱动器/传感器组态不一致 | T06/T09 | overview Boundary/运动 | 一致性检查支持材料 |
| ce37 | 对优化DB/运动DB误用 ATTR_DB | T04 | overview Boundary/指令边界 | 指令适用边界支持材料 |
| ce38 | 频繁 WRIT_DBL 写闪存缩寿命 | T04 | overview Boundary/持久化 | 慢性失效支持材料 |
| ce39 | 扩展指令 8x 错误码当无害提示 | T07/T05 | overview Boundary/错误码 | 静默失败支持材料 |
| ce40 | PtP DONE/NDR/ERROR 只读一周期 | T05/T07 | overview Boundary/PtP | 单周期信号支持材料 |
| ce41 | 误以为 Port_Config 参数永久保存 | T05/T10 | overview Boundary/PtP | 易失性支持材料 |
| ce42 | 分布式IO/强制时 STOP 无法启用输出 | T07/T08 | overview Boundary/调试 | 限制支持材料 |
| ce43 | 安全事件重复条目堵诊断缓冲区 | T07 | overview Boundary/诊断 | 失败模式；机制见 f16 |
| ce44 | 日时钟默认值当可信时间戳 | T07 | overview Boundary/时间戳 | 支持材料 |
| ce45 | 用户Web页面耗尽装载存储器 | T05/T01 | overview Boundary/Web | 容量支持材料 |

## C. Glossary（术语，25 条）→ book/glossary.md

| id | term | task_ids | 交付路径 | reference 理由 |
|---|---|---|---|---|
| g01 | OB 组织块 | T02/T03 | glossary.md | 术语辨析；执行框架见 f02/f08 |
| g02 | 中断OB与事件优先级/排队 | T03/T07 | glossary.md | 术语辨析；框架见 f09 |
| g03 | FC 功能 | T02 | glossary.md | 术语辨析 |
| g04 | FB 功能块与实例 | T02 | glossary.md | 术语辨析；复用见 f27 |
| g05 | 背景DB 实例数据块 | T02 | glossary.md | 术语辨析 |
| g06 | DB 数据块 | T04 | glossary.md | 术语辨析 |
| g07 | 扫描周期 | T03 | glossary.md | 术语辨析；流程见 f07 |
| g08 | 过程映像 | T03/T04 | glossary.md | 术语辨析 |
| g09 | :P 立即外设访问 | T07 | glossary.md | 术语辨析；规则见 p20 |
| g10 | 过程映像分区 PIP | T03/T06 | glossary.md | 术语辨析；流程见 f04 |
| g11 | 一致性数据 | T04 | glossary.md | 术语辨析；方法见 f30 |
| g12 | 三级存储（装载/工作/保持性） | T04/T10 | glossary.md | 术语辨析 |
| g13 | 保持性 Retain | T10/T04 | glossary.md | 术语辨析 |
| g14 | 暖启动与存储器复位 MRES | T10 | glossary.md | 术语辨析；状态机见 f05 |
| g15 | 循环时间监视 | T03 | glossary.md | 术语辨析；框架见 f14 |
| g16 | 通信负载 | T03/T05 | glossary.md | 术语辨析 |
| g17 | 诊断缓冲区 | T07 | glossary.md | 术语辨析；机制见 f16 |
| g18 | PROFINET IO 角色/智能设备 | T05 | glossary.md | 术语辨析 |
| g19 | 共享设备 Shared Device | T05 | glossary.md | 术语辨析 |
| g20 | 工艺对象 TO | T06 | glossary.md | 术语辨析 |
| g21 | Variant 参数化数据类型 | T04/T06 | glossary.md | 术语辨析 |
| g22 | 优化/标准块访问 | T04/T05/T06 | glossary.md | 术语辨析 |
| g23 | 高速计数器 HSC | T06 | glossary.md | 术语辨析；功能框架见 f46 |
| g24 | PTO 脉冲串输出 | T06 | glossary.md | 术语辨析 |
| g25 | 在线工具：监视/修改/强制/轨迹 | T07/T08 | glossary.md | 术语辨析；矩阵见 f36 |

## D. 参数表/模板（1 条）→ book/overview.md 参考区

| id | title | task_ids | 交付路径 | reference 理由 |
|---|---|---|---|---|
| p10 | CPU/SM/SB 接线端子机械参数表 | T01 | overview 参考区/接线参数表 | 纯参数表（横截面/剥线长度/扭矩），无可执行动作；已完整含原文数值，供查阅 |
