# Framework candidates — 生成时间 2026-11-16 / 来源：西门子 S7-1200 系统手册 V4.2（A5E02486685-AK）source.md 正文 p29–1534；提取器 framework-extractor（阶段1全量扫描）

# 说明：按章节/页码标注来源；source_quote 均为原文节选（≤150字）；不做筛选，边界模糊宁可多收，去重交阶段1.5。
# task_ids 对应 BOOK_OVERVIEW 的 T01–T10；无直接对应任务的条已在 task_ids 中注明原因。

- id: f01
  title: 功率预算与供电决策框架
  type: framework
  source_chapter: 第4章 安装 / 4.2 功率预算（p61）
  source_quote: |
    "CPU 有一个内部电源，用于为 CPU、信号模块、信号板和通信模块供电，并可满足其它 24 V DC 用户的电源要求……如果您的 24 V DC 电源要求超出该传感器电源的预算，则必须给系统增加外部 24 V DC 电源。"
  summary: |
    面对供电配置，先区分两类预算：5V DC 逻辑预算（供 CPU/SM/SB/CM）与 24V DC 传感器电源预算（供输入点、继电器线圈等）。
    查技术规范获取 CPU 提供量与各模块需求量，逐项累加比对预算。
    若 24V 需求超出传感器电源预算，则必须增设外部 24V 电源。
    硬约束：外部 24V 电源不得与 CPU 传感器电源并联（两者争抢电压电平，缩短寿命或立即故障）。
    所有"非隔离"M 端子必须接到同一个外部参考电位，否则产生意外电流损坏设备。
    具体计算规则在"计算功率预算"(p1779) 附录，本处只给决策路径。
  tags: [power-budget, decision, hardware, safety, supply]
  task_ids: [T01]

- id: f02
  title: 代码块类型与用户程序结构角色框架（OB/FC/FB/DB）
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1 用户程序的执行（p89）
  source_quote: |
    "组织块 (OB) 定义程序的结构……功能 (FC) 和功能块 (FB) 包含与特定任务或参数组合相对应的程序代码……FB 还使用相关联的数据块（称为背景数据块）来保存该 FB 调用实例的数据值……数据块 (DB) 存储程序块可以使用的数据。"
  summary: |
    把用户程序的构成拆为四类角色，据此决定每段逻辑放哪里。
    OB 是事件入口、定义结构；FC 是无状态子程序；FB 是带背景 DB 的有状态子例程；DB 只存数据。
    FC 不绑定 DB，FB 必须绑定 DB 传参与存中间值。
    同一 FB 配不同背景 DB 可多次调用且数据互不干扰（可重入）。
    块总数上限 1024，各类型块数无特殊限制——这是设计时的容量边界。
  tags: [program-structure, OB, FB, FC, DB, framework]
  task_ids: [T02]

- id: f03
  title: 用户程序执行顺序与调用嵌套深度框架
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1 用户程序的执行（p89）
  source_quote: |
    "用户程序的执行顺序是：从一个或多个在进入 RUN 模式时运行一次的可选启动组织块 (OB) 开始，然后执行一个或多个循环执行的程序循环 OB。还可以将 OB 与中断事件关联……FC 或 FB……可下至以下嵌套深度：16（从程序循环 OB 或启动 OB 开始）；6（从任意中断事件 OB 开始）。"
  summary: |
    执行顺序分三层：启动 OB 只在进 RUN 时跑一次 → 程序循环 OB 反复跑 → 中断 OB 由事件触发插入。
    从循环/启动 OB 出发的 FC/FB 调用允许 16 层嵌套；从中断 OB 出发只允许 6 层。
    这是规划调用层级时的硬边界，超出即无法编译/执行。
    中断事件（标准或错误）与 OB 关联，事件发生时才执行对应 OB。
    设计程序结构时应先定哪类事件驱动哪段代码，再检查嵌套深度是否越界。
  tags: [execution-order, nesting-depth, OB, framework]
  task_ids: [T02, T03]

- id: f04
  title: 过程映像分区（PIP）分配操作流程
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.1 用户程序的执行（p91-92）
  source_quote: |
    "要将数字量或模拟量点分配给过程映像分区，或将 I/O 点排除在过程映像更新之外，请按照以下步骤操作：1. 在设备组态中查看相应设备的'属性'选项卡……4. 也可以从'组织块'下拉列表中选择一个特定的 OB。5. 在'过程映像'下拉列表中将'自动更新'更改为'PIP1'…或'无'。"
  summary: |
    用于决定每个 I/O 点在每个扫描周期更新、还是在特定中断事件时更新、或完全排除。
    五个分区：PIP0 默认每周期自动更新；PIP1–PIP4 绑定中断事件；"无"表示只能立即指令访问。
    操作路径：设备属性 → 展开 I/O 点 → I/O 地址 → 选 OB → 改过程映像下拉项。
    关键陷阱：I/O 分到 PIP1–4 但未分配 OB，等价于设为"无"，CPU 永不更新该映像。
    RUN 模式插拔存储卡会使 CPU 立即进 STOP；分布式 I/O 插拔则记诊断缓冲区并保持 RUN。
  tags: [process-image, PIP, IO, procedure]
  inputs: [I/O 点及其实时性需求, 目标中断事件/OB]
  outputs: [I/O 点的过程映像更新方式配置]
  steps:
    - 判断该 I/O 需每周期更新还是事件驱动更新
    - 在设备组态属性中定位 I/O 点
    - 在 I/O 地址下选择目标 OB
    - 在过程映像下拉列表设 PIP1-4/PIP0/无
    - 确认分区已分配 OB，否则等同"无"
  missing_conditions: 无（原文给出完整5步与陷阱说明）
  task_ids: [T04]

- id: f05
  title: CPU 三种工作模式状态机与暖启动决策
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1.1 CPU 的工作模式（p93-95）
  source_quote: |
    "CPU 有以下三种工作模式：STOP 模式、STARTUP 模式和 RUN 模式……STOP 模式下，CPU 不执行程序……STARTUP 模式下，执行一次启动 OB……RUN 模式，程序循环 OB 重复执行……CPU 支持通过暖启动进入 RUN 模式。暖启动不包括储存器复位。"
  summary: |
    把 CPU 运行抽象为 STOP/STARTUP/RUN 三态，各态可做什么不同：STOP 可下载不执行程序；STARTUP 跑一次启动 OB、不处理中断；RUN 循环执行并可响应中断。
    暖启动=初始化非保持性数据、保留保持性数据；存储器复位则清空工作/保持/非保持区、复制装载存储器、输出设为 STOP 响应值（但不清诊断缓冲区与永久 IP）。
    上电后启动行为可组态三选一：不重新启动（保持 STOP）、暖启动到 RUN、暖启动到断电前模式。
    决策要点：需脱离 STEP 7 独立运行时应组态为"暖启动-RUN"，避免临时故障导致停在 STOP。
  tags: [operating-mode, state-machine, warm-restart, decision]
  task_ids: [T03]

- id: f06
  title: 启动过程 STOP→RUN 状态转换流程（A–F）
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.1.1 启动过程（p95-96）
  source_quote: |
    "STARTUP：A 清除 I（映像）存储区；B 根据组态将 Q 输出（映像）存储区初始化为零、上一值或替换值……C 将非保持性 M 存储器和数据块初始化为其初始值，并启用组态的循环中断事件和时钟事件。执行启动 OB。D 将物理输入的状态复制到 I 存储器。"
  summary: |
    STOP 切到 RUN 时 CPU 按固定序列推进：清输入映像→按组态初始化输出映像→初始化非保持性存储并启中断→复制物理输入→中断事件入队→开放输出到物理。
    启动 OB 中读过程映像输入只会得到零，要读当前物理输入必须立即读取（":P"）。
    多个启动 OB 按编号从小到大依次执行；启动阶段中断排队不处理、不做循环时间监视。
    启动 OB 带启动信息（LostRetentive、LostRTC），应检查这些值决定后续措施。
    只有进 RUN 后 HSC/PWM/PtP 才真正运行（启动阶段可改其组态）。
  tags: [startup, state-transition, OB, procedure]
  inputs: [组态的启动参数, 保持性数据状态, 时钟有效性]
  outputs: [进入 RUN 模式, 启动 OB 启动信息]
  steps:
    - 清除过程映像输入、按组态初始化输出
    - 初始化非保持性 M/DB，启用循环/时钟中断
    - 执行启动 OB（编号小者先）
    - 复制物理输入到 I 映像，中断事件入队
    - 启用 Q 到物理输出的写入
  missing_conditions: 无（原文 A-F 步骤完整）
  task_ids: [T08]

- id: f07
  title: RUN 模式扫描周期处理流程（①–⑤）
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.1.2 在 RUN 模式下处理扫描周期（p97）
  source_quote: |
    "在每个扫描周期中，CPU 都会写入输出、读取输入、执行用户程序、更新通信模块以及响应用户中断事件和通信请求……对于已启用的用户中断事件，将根据优先级按其发生顺序进行处理……中断可能发生在扫描周期的任何阶段，并且由事件驱动。"
  summary: |
    一个扫描周期的顺序：写输出→读输入到映像→从第一条到最后一条执行用户程序（OB 按编号升序）→定期处理通信→自检诊断。
    用户中断事件除外，其余操作按先后定期执行；中断按优先级、同级按发生顺序处理。
    中断 OB 处理时：读输入→执行 OB→用关联 PIP 写输出，完成后从中断点恢复用户程序。
    系统保证在最大循环时间内完成，否则生成时间错误事件。
    这是评估实时性与响应延迟的基础模型。
  tags: [scan-cycle, realtime, interrupt, procedure]
  inputs: [输出映像, 物理输入, 用户程序, 已启用中断]
  outputs: [更新的物理输出, 诊断/通信处理, 时间错误事件（如超时）]
  steps:
    - 输出映像写入物理输出
    - 读取物理输入存入过程映像
    - 依 OB 编号升序执行用户程序及 FC/FB
    - 定期处理通信请求与自诊断
    - 按优先级响应中断事件，处理后恢复断点
  missing_conditions: 无（原文①-⑤及说明完整）
  task_ids: [T03]

- id: f08
  title: OB 类型体系与事件触发框架
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1.3 组织块 (OB)（p98-112）
  source_quote: |
    "OB 控制用户程序的执行。CPU 中的特定事件将触发组织块的执行。OB 无法互相调用或通过 FC 或 FB 调用……CPU 按照 OB 对应的优先级对其进行处理，遵从高优先级在前低优先级在后的顺序执行 OB。最低优先等级为 1……最高优先等级为 26。"
  summary: |
    以"事件→OB"为轴组织全部执行逻辑：程序循环、启动、延时、循环中断、硬件中断、时间错误、诊断错误、拔插模块、机架故障、时钟、状态/更新/配置文件、MC 伺服等 OB。
    每类 OB 绑定一种起始事件，并带各自的启动信息（如 fault_id、LADDR、Channel、Event_Class）供程序判断原因。
    OB 不能互相调用，也不能被 FC/FB 调用——只能由事件触发。
    V4.0 起可为每个组态 OB 分配优先级（1 最低、26 最高）；按优先级调度。
    面对异常，先看"是否有对应 OB"——无 OB 时 CPU 的默认行为往往不同（保持 RUN 或转 STOP）。
  tags: [OB, event-driven, priority, framework]
  task_ids: [T03]

- id: f09
  title: 事件执行优先级与排队机制（可中断/不可中断）
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1.3.17 事件执行的优先级与排队（p112-115）
  source_quote: |
    "如果设置了可中断模式，则在执行 OB 并且 OB 执行结束前发生了更高优先级的事件时，将中断正在运行的 OB，以允许更高优先级的事件 OB 运行……如果未设置可中断模式，则无论触发的 OB 在运行期间是否触发了其它任何事件，都将继续运行直至结束。"
  summary: |
    CPU 按事件优先级处理，1 最低、26 最高；同优先级"先到先得"。
    程序循环 OB 始终可中断；其它 OB 可组态为可中断或不可中断。
    可中断模式：执行中若来更高优先级事件，挂起当前 OB 转去执行高优先级，结束后恢复。
    不可中断模式：当前 OB 一直跑到结束，期间事件排队。
    每种事件类型有队列上限，达到未决事件上限后下一个事件丢失，可用时间错误 OB 响应队列溢出。
    注意 V4.0 起，若要时间错误 OB 中断非循环 OB，必须把 OB 设为可中断。
  tags: [priority, queue, interruptible, framework]
  task_ids: [T03]

- id: f10
  title: 时间错误 OB 排障流程（症状→判断→操作→验证）
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.1.3.6 时间错误中断 OB（p102-103）
  source_quote: |
    "出现几种不同时间错误情况中的任何一种都会引起时间错误事件：扫描周期超过最大周期时间……由于在 CPU 结束执行第一次中断 OB 前又启动了第二次中断……发生队列溢出。所有时间错误事件都会触发时间错误中断 OB（如果存在）的执行。"
  summary: |
    症状分三类：超出最大循环时间、请求 OB 无法启动（前一中断未完又触发）、队列溢出。
    判断：读时间错误 OB 的 fault_id（16#01 超循环、16#02 OB 无法启动、16#07/09 队列溢出）及 csg_OBnr/csg_prio 定位出错 OB 与优先级。
    操作：若无时间错误 OB，默认超最大时间切 STOP、默认时间错误保持 RUN；可用 RE_TRIGR 复位周期监视把单周期最长延长到 10 倍。
    验证/升级：无论有无 OB 都生成诊断缓冲区条目；同一周期二次超时则无条件切 STOP。
    修复方向：优化程序、增最大周期、错开循环中断相移、消队列溢出。
  tags: [time-error, troubleshooting, watchdog, OB80]
  task_ids: [T03, T07]

- id: f11
  title: 诊断错误中断 OB 排障流程
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.1.3.7 诊断错误中断 OB（p104-105）
  source_quote: |
    "当 CPU 检测到诊断错误……将执行诊断错误中断 OB……如果希望 CPU 在收到诊断错误后进入 STOP 模式，可在诊断错误中断 OB 中包含一个 STP 指令……如果未在程序中包含诊断错误中断 OB，CPU 将忽略此类错误并保持 RUN 模式。"
  summary: |
    支持的诊断错误：无用户电源、超上限、超下限、断路、短路。
    判断：读 OB 启动信息 IOstate（位0组态、位4错误、位5组态不正确、位7 I/O访问错误）、LADDR（硬件标识符）、Channel、MultiError。
    操作：无 OB 则 CPU 忽略错误保持 RUN；有 OB 则中断循环执行，可在 OB 中放 STP 指令使 CPU 进 STOP。
    陷阱：多通道模拟设备一次只处理一个通道错误，第二个错误须等第一个清除且首个 OB 执行完才触发。
    V4.0 离去事件若无未决诊断，启动信息整体指向子模块 16#8000 而非具体通道。
  tags: [diagnostic-error, troubleshooting, OB82, IOstate]
  task_ids: [T07]

- id: f12
  title: 拔出/插入模块 OB 与 CPU 行为决策
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.1.3.8 拔出或插入模块 OB（p106）
  source_quote: |
    "以下情况将产生拔出或插入模块事件：有人拔出或插入一个已组态的模块……如果尚未对该 OB 进行编程，那么当已组态且未禁用的分布式 I/O 模块以上任意情况时，CPU 都将保持在 RUN 模式。无论是否已对该 OB 进行编程，当中央机架中的模块以上任意情况时，CPU 都将切换到 STOP 模式。"
  summary: |
    先判断事件发生在分布式 I/O 机架还是中央机架——这决定 CPU 默认行为。
    分布式 I/O：无论有无 OB，CPU 保持 RUN（有 OB 则执行）。
    中央机架：无论有无 OB，CPU 一律切 STOP。
    判断细节：读 Event_Class（16#38 插入、16#29 拔出）、LADDR、Fault_ID。
    触发情形包括实际模块缺失、不兼容、参数化错误、组态不允许替换值等。
    用途：在 OB 中区分计划内维护与真实故障，决定是否停机。
  tags: [pull-insert, OB, troubleshooting, distributed-IO]
  task_ids: [T07]

- id: f13
  title: 无关联 OB 事件的 CPU 响应对照框架
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.1.3（p116 表格 5-17 附加事件）
  source_quote: |
    "I/O 访问错误……CPU 将第一次错误记录在诊断缓冲区中并保持 RUN 模式。您可以使用 GET_ERROR_ID 指令访问错误原因……最大周期时间错误……CPU 将错误记录在诊断缓冲区中并切换为 STOP 模式。"
  summary: |
    当事件没有关联 OB 时，CPU 按事件类型采取固定动作，可据此预判停机风险。
    I/O 访问错误、外围设备访问错误：首次记录诊断缓冲区并保持 RUN，可用 GET_ERROR_ID 查原因。
    编程错误：启用错误处理则写入错误结构，启用全局错误处理则记诊断缓冲区并保持 RUN。
    最大周期时间错误（超出两次）：记诊断缓冲区并切 STOP。
    中断等待时间约 175 µs（只有程序循环 OB 激活时）。
    排障入口统一是诊断缓冲区 + GET_ERROR_ID/GET_DIAG。
  tags: [error-response, no-OB, diagnostic-buffer, troubleshooting]
  task_ids: [T07]

- id: f14
  title: 循环时间监视与 RE_TRIGR 决策框架
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1.4 监视和组态循环时间（p117-118）
  source_quote: |
    "CPU 提供了两种监视循环时间的方法：最大扫描周期时间、最小扫描周期时间……如果当前程序循环执行耗费的时间小于所组态最大扫描周期时间的十倍，则 RE_TRIGR 指令将重新触发周期时间监视并返回 ENO = TRUE。否则……返回 ENO = FALSE。"
  summary: |
    最大扫描周期时间（默认 150ms，范围 1–6000ms）始终启用，用于超时保护；最小扫描周期时间可选、默认禁用，用于消除周期波动。
    超时处理二选一：无时间错误 OB 则记诊断缓冲区保持 RUN（可改组态为 STOP）；有 OB 则执行 OB。
    RE_TRIGR 用于复位周期定时器，但仅当已用时间 < 最大时间的 10 倍才成功（ENO=TRUE）。
    决策：要稳定周期就设最小值，让 CPU 用余下时间做诊断/通信；要防超时就调最大值并处理时间错误 OB。
    通信负载也可按百分比组态专用时间。
  tags: [cycle-time, watchdog, RE_TRIGR, framework]
  task_ids: [T03]

- id: f15
  title: 系统存储器与时钟存储器位用途框架
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.1.5.1 系统和时钟存储器（p119-122）
  source_quote: |
    "第一个周期：（变量名称'FirstScan'）在启动 OB 完成后的第一次扫描期间内，该位设置为 1……诊断状态变化……始终为 1（高）……始终为 0（低）……被组态为时钟存储器的字节中的每一位都可生成方波脉冲……8 种不同的频率，其范围从 0.5 Hz 到 10 Hz。"
  summary: |
    可把 M 区一个字节分配给系统存储器，用变量名引用固定功能的位：FirstScan、DiagStatusUpdate、AlwaysTRUE、AlwaysFALSE。
    另一个字节分配给时钟存储器，8 个位产生 0.5–10Hz 方波，配合沿指令周期性触发动作。
    决策：需要"仅首周期执行"用 FirstScan；需检测诊断变化用 DiagStatusUpdate（但首次循环 OB 期间无法检测）。
    硬约束：切勿用指令/通信改写这些位，否则破坏功能、导致程序错误运行（无预留保护），且须配急停电路。
  tags: [system-memory, clock-memory, FirstScan, framework]
  task_ids: [T03]

- id: f16
  title: 诊断缓冲区机制与排障入口
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.1.6 诊断缓冲区（p123-124）；第15章 / 15.10（p1497）
  source_quote: |
    "CPU 提供了一个诊断缓冲区，其中包含的每个条目对应一个诊断事件……此日志最多可提供 50 个最近发生的事件。日志填满后，新事件将替换日志中最早的事件……仅永久存储诊断缓冲区中 10 个最新的事件。"
  summary: |
    诊断缓冲区是排障的统一入口，记录系统诊断事件与每次模式切换（上电/STOP/RUN），最新在上。
    容量：最多 50 条，满后新事件覆盖最早；仅 10 条永久保存；掉电保存。
    访问：在线→"在线和诊断"→诊断→诊断缓冲区；或 GET_DIAG 指令采集。
    复位出厂设置会清空缓冲区。
    注意：部分安全事件会生成重复条目堵塞缓冲区，可按时间间隔总结或限定数量组态（1–255 秒/分/时）。
  tags: [diagnostic-buffer, troubleshooting, GET_DIAG]
  task_ids: [T07]

- id: f17
  title: 存储卡用途类型决策框架（传送卡/程序卡/固件更新卡）
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.5 使用存储卡（p151）
  source_quote: |
    "使用传送卡将程序复制到 CPU 的内部装载存储器中……插入传送卡后，CPU 首先会擦除内部装载存储器中的用户程序以及任何强制值，然后将程序由传送卡复制到内部装载存储器中……将程序卡用作 CPU 的外部装载存储器……固件更新 (页 162)时，也会使用存储卡。"
  summary: |
    先按目标选卡类型：传送卡=把程序一次性灌入内部装载存储器（用完必须取出）；程序卡=作为外部装载存储器长期驻留（取出即 STOP）；固件更新卡=刷固件。
    传送卡会擦除内部装载存储器原程序与强制值；程序卡插入擦除内部装载存储器且必须常驻。
    丢失/忘记密码时用空传送卡擦除受保护程序。
    复制的程序含所有代码块、数据块、工艺对象、设备组态，但不含强制值。
    通用前提：仅支持预格式化 SIMATIC 卡、无写保护、操作前确保 CPU 不在控制过程。
  tags: [memory-card, transfer-card, program-card, decision]
  task_ids: [T10]

- id: f18
  title: CPU 评估存储卡决策流程
  type: framework
  source_chapter: 第5章 PLC 概念 / 5.5.1 插入存储卡时的 CPU 行为（p153-154）
  source_quote: |
    "空存储卡：空白存储卡不具备作业文件（S7_JOB.S7S）。如果插入空白存储卡，CPU 将添加一个程序作业文件。如果随后将内部装载存储器复制到外部装载存储器……空白程序卡：空白程序卡具备一个空的程序作业文件。此时，CPU 将内部装载存储器复制到外部装载存储器……"
  summary: |
    CPU 按"是否禁用内部→外部复制"与"卡中是否有作业文件"两维决策。
    未禁用复制：空卡→CPU 加作业文件、复制内部到外部并擦除内部；空白程序卡→直接复制内部到外部并擦除内部。
    已禁用复制：两种卡都不操作、不创建作业文件、不擦除内部。
    插入程序卡/传送卡/固件卡时，"禁用复制"设置不影响评估。
    插入卡后 CPU 固定三步：切 STOP（若未 STOP）→提示（循环上电/切 RUN/存储器复位）→评估卡。
  tags: [memory-card, evaluation, decision, S7_JOB]
  task_ids: [T10]

- id: f19
  title: 创建传送卡操作流程
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.5.3 将存储卡用作"传送"卡（p156-157）
  source_quote: |
    "要创建传送卡，请按以下步骤操作：1. 将不受写保护的空白 SIMATIC 存储卡插入与计算机相连的 SD 卡读卡器/写卡器中……4. 在'存储卡'对话框中，从'卡类型'下拉菜单中选择'传送'……5. 通过……将该 CPU 设备拖动到存储卡来添加程序。"
  summary: |
    前置：先组态 CPU 启动参数（STOP/RUN/断电前模式），随程序一起复制。
    步骤：插无写保护空白卡（复用则删 S7_JOB.S7S 及旧文件夹）→项目树选读卡器→属性→卡类型选"传送"→拖入 CPU 设备→装载预览点装载→完成。
    硬约束：勿删隐藏文件 __LOG__ 与 crdinfo.bin，否则卡不可用。
    空传送卡（不拖程序、从读卡器移除）专用于密码丢失恢复。
    V3.0 程序传送卡不可插入 V4.0 CPU。
  tags: [transfer-card, procedure, memory-card]
  inputs: [无写保护空白 SIMATIC 卡, 组态好启动参数的 CPU 程序]
  outputs: [可用的传送卡（或空传送卡）]
  steps:
    - 组态 CPU 循环上电后的启动模式
    - 插卡并清理旧程序文件（保留隐藏文件）
    - 卡类型设为"传送"
    - 拖入 CPU 设备并在装载预览中装载
  missing_conditions: 无（原文1-7步完整）
  task_ids: [T10]

- id: f20
  title: 使用传送卡传送程序流程
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.5.3 使用传送卡（p158）
  source_quote: |
    "要将程序传送到 CPU，请按以下步骤操作：1. 将传送卡插入 CPU 中。如果 CPU 处于 RUN 模式，它将转至 STOP 模式……2. 对 CPU 循环上电以评估存储卡……3. 重启并对存储卡进行评估后，CPU 会将程序复制到内部装载存储器……4. 重启 CPU……以评估传送到内部装载存储器的新程序。"
  summary: |
    插入前确认 CPU 处于 STOP 且程序处于安全状态（插卡会切 STOP，影响在线/机器运行）。
    四步：插卡（RUN 自动转 STOP、MAINT 闪烁）→循环上电/STOP-RUN/MRES 评估→COPY（RUN/STOP LED 交替闪=复制中，黄常亮+MAINT 闪=完成）→取出卡并重启进入组态启动模式。
    硬约束：设 RUN 前必须先取出传送卡。
    LED 状态是判断复制进度的关键信号。
  tags: [transfer-card, procedure, LED]
  inputs: [传送卡, 处于安全状态的 CPU]
  outputs: [已灌入内部装载存储器的新程序]
  steps:
    - 确认 CPU 在 STOP/安全状态
    - 插卡触发评估
    - 重启评估并等待 LED 指示复制完成
    - 取出卡后重启进入组态模式
  missing_conditions: 无（原文1-4步完整）
  task_ids: [T10]

- id: f21
  title: 创建程序卡与使用程序卡流程
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.5.4 将存储卡用作"程序"卡（p159-161）
  source_quote: |
    "要创建程序卡，请按以下步骤操作：1. 将不受写保护的空白 SIMATIC 存储卡插入……6. 在'装载预览'对话框中，单击'装载'按钮……要对 CPU 使用程序卡，请按以下步骤操作：1. 将程序卡插入 CPU。如果 CPU 处于 RUN 模式，则它将切换到 STOP 模式……CPU 重启并对程序卡进行评估后，将擦除其内部装载存储器。"
  summary: |
    创建：组态启动参数→插空白卡（清理旧文件、保留隐藏文件）→卡类型选"程序"→拖入 CPU 设备→装载→完成。
    使用：确认 CPU 离线安全→插卡（RUN 转 STOP、MAINT 闪）→循环上电/STOP-RUN/MRES 评估→CPU 擦除内部装载存储器→进入组态启动模式。
    关键差异：程序卡必须常驻，取出即失去外部装载存储器→报错→切 STOP→错误 LED 闪。
    另有便捷路径：插空卡后评估，CPU 会把内部程序+强制值复制到卡并擦除内部（此时卡成为程序卡）。
  tags: [program-card, procedure, memory-card]
  inputs: [无写保护空白卡, CPU 程序, 组态的启动参数]
  outputs: [作为外部装载存储器常驻的程序卡]
  steps:
    - 组态启动参数并准备空白卡
    - 卡类型设为"程序"并装载程序
    - 断电/安全状态下插卡并评估
    - CPU 擦除内部装载存储器、进入启动模式
  missing_conditions: 无（原文创建与使用步骤完整）
  task_ids: [T10]

- id: f22
  title: 固件更新（存储卡方式）下载与安装流程
  type: procedure
  source_chapter: 第5章 PLC 概念 / 5.5.5 固件更新（p162-164）
  source_quote: |
    "要将固件更新下载到存储卡中，请执行以下步骤：1. 将不受写保护的空白 SIMATIC 存储卡插入……2. 选择该模块所对应的固件更新 zip 文件……解压缩……要安装固件更新，请执行以下步骤：1. 将存储卡插入 CPU 中……2. 对 CPU 进行通电以启动固件更新程序。"
  summary: |
    下载到卡：插空白卡→从官网下 zip 解压到卡根目录（生成 FWUPDATE.S7S 与 S7_JOB.S7S）→安全弹出。
    安装前硬约束：确认 CPU 未执行任何进程，处于离线/安全状态（安装会切 STOP）。
    安装步骤：插卡（RUN 转 STOP、MAINT 闪）→通电/STOP-RUN/MRES 启动更新→等 RUN/STOP LED 黄绿交替（复制中）→黄常亮+MAINT 闪（完成）→取卡→再次重启装载新固件。
    须保持 24V DC 接通直到完成；多模块按组态升序或卡内下载顺序更新。
    限制：固件更新无法把 V3.0 及之前升级到 V4.0/V4.1；勿用 Windows 格式化卡。
  tags: [firmware-update, procedure, memory-card]
  inputs: [预格式化 SIMATIC 卡, 兼容的固件 zip]
  outputs: [已更新固件的 CPU]
  steps:
    - 解压固件 zip 到卡根目录
    - 确认 CPU 离线安全后插卡
    - 通电启动更新并等 LED 指示完成
    - 取卡后重启装载新固件
  missing_conditions: 无（原文下载与安装步骤完整）
  task_ids: [T10]

- id: f23
  title: 无效/不兼容传送卡恢复流程
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.5.1、5.5.3（p152、p157）
  source_quote: |
    "请勿将 V3.0 程序传送卡插入 S7-1200 V4.0 CPU……如果插入无效版本的程序传送卡，则请取出该卡，然后执行 STOP 到 RUN 切换、存储器复位 (MRES) 或循环上电。将 CPU 从错误状态恢复后，即可下载有效的 V4.0 CPU 程序。"
  summary: |
    症状：插入无效版本传送卡导致 CPU 错误（LED 异常、组态版本未知或不兼容）。
    判断：确认卡版本与 CPU 固件不兼容（V3.0 卡 ≠ V4.0 CPU）。
    操作：取出该卡 → 执行 STOP→RUN 切换 / 存储器复位 MRES / 循环上电（三选一）。
    验证：CPU 从错误状态恢复后，下载有效程序。
    根因修复：要把 V3.0 程序移到 V4.0，必须用 TIA Portal 在硬件配置中更改设备，而非直接插卡。
  tags: [memory-card, version-incompatible, troubleshooting, recovery]
  task_ids: [T10]

- id: f24
  title: 丢失密码后恢复流程
  type: troubleshooting
  source_chapter: 第5章 PLC 概念 / 5.6 丢失密码后恢复（p165）
  source_quote: |
    "如果用户丢失受密码保护的 CPU 的密码，则可使用空传送卡删除受密码保护的程序。空传送卡将擦除 CPU 内部的装载存储器。随后可以将新的用户程序从 STEP 7 下载到 CPU 中……将 CPU 设置为 RUN 模式之前，必须先取出传送卡。"
  summary: |
    症状：丢失受密码保护 CPU 的密码，无法访问程序。
    判断/前提：确认 CPU 可 STOP、处于安全状态（插卡会切 STOP）。
    操作：用空传送卡擦除内部装载存储器中受密码保护的程序 → 从 STEP 7 下载新程序。
    硬约束：设 RUN 前取出传送卡；插入前确保 CPU 未在控制机器/过程，须配急停电路。
    本质是以"擦除程序"为代价换取重新访问，原程序不可恢复。
  tags: [password-recovery, troubleshooting, transfer-card]
  task_ids: [T10]

- id: f25
  title: 设计 PLC 系统的指南流程（工程方法）
  type: procedure
  source_chapter: 第7章 编程概念 / 7.1 设计 PLC 系统的指南（p199-200，表7-1）
  source_quote: |
    "对过程或机器进行分区：将过程或机器划分为彼此独立的部分……创建功能规范……设计安全电路……规划系统安全……指定操作员站……创建组态图……创建符号名称的列表。"
  summary: |
    给出从零设计自动化项目的顺序流程，是全书最完整的"工程方法论"框架。
    步骤：分区（定控制器边界）→功能规范（每部分 I/O、执行器前必须满足的状态、接口）→安全电路（识别独立于 PLC 的机电安全装置）→规划系统安全（访问保护级别）→操作员站绘图→组态图（机械/电气/地址）→符号名列表。
    安全设计贯穿：独立思考"危险动作如何独立于 PLC 被阻止"，不依赖"最佳情况"。
    须遵守公司规范、培训与当地实践，本表为通用建议。
  tags: [system-design, methodology, safety, procedure]
  inputs: [过程/机器描述, 公司规范, 当地实践]
  outputs: [分区方案, 功能规范, 安全电路设计, 组态图, 符号表]
  steps:
    - 对过程/机器分区，确定控制器边界
    - 编写功能规范（I/O、执行器许可条件、接口）
    - 设计独立于 PLC 的安全电路
    - 规划访问保护级别
    - 绘制操作员站与组态图
    - 建立绝对地址的符号名列表
  missing_conditions: 部分步骤（安全电路细节）说明书仅给任务要点，详细设计须参照公司规范
  task_ids: [T01, T02]

- id: f26
  title: 用户程序结构类型选择（线性 vs 模块化）
  type: framework
  source_chapter: 第7章 编程概念 / 7.2 构建用户程序（p201-202）
  source_quote: |
    "根据实际应用要求，可选择线性结构或模块化结构用于创建用户程序：线性程序按顺序逐条执行用于自动化任务的所有指令……模块化程序调用可执行特定任务的特定代码块……要创建模块化结构，需要将复杂的自动化任务划分为与过程的工艺功能相对应的更小的次级任务。"
  summary: |
    决策点：任务简单→线性（全部指令放 OB1 顺序执行）；任务复杂→模块化（拆成对应工艺功能的块，块间互相调用）。
    模块化用通用可复用块（如控制泵/电机）带来四点收益：标准任务复用、易理解管理、简化调试（逐块测试）、缩短整体调试时间。
    复用块可存入项目库/全局库，跨项目共享并按需调整。
    判断依据：是否需多次复用、是否需分块测试、工艺功能是否可清晰拆分。
  tags: [program-structure, linear, modular, decision]
  task_ids: [T02]

- id: f27
  title: 单个 FB 配多个 DB 的设备复用框架
  type: framework
  source_chapter: 第7章 编程概念 / 7.3.4 数据块 (DB)（p207）
  source_quote: |
    "该结构使一个通用 FB 可以控制多个相似的设备（如电机），方法是在每次调用时为各设备分配不同的背景数据块。每个背景 DB 存储单个设备的数据（如速度、加速时间和总运行时间）。在此实例中，FB 22 控制三个独立的设备。"
  summary: |
    面对多台同类设备，写一个通用 FB，每台设备配一个独立背景 DB。
    背景 DB 保存该实例的速度、加速时间、总运行时间等，互不干扰。
    调用时把设备特定参数传给对应 DB，即可实现一套逻辑控多台设备。
    这是"FB 可重入性"的具体落地模式，也是模块化的核心收益。
    默认优化块访问下可按变量单独设保持性；标准 DB 则全部变量统一保持性。
  tags: [FB, instance-DB, reusability, framework]
  task_ids: [T02]

- id: f28
  title: 参数传递决策（传值 vs 传引用）与优化匹配
  type: framework
  source_chapter: 第7章 编程概念 / 7.3.6 向块传递参数（p210-212）
  source_quote: |
    "传值：用户程序以'传值'方式将参数传递给某个函数时，用户程序会将实际参数值复制给块的 IN 接口……传引用：用户程序以'传引用'方式向某个函数传递参数时，用户程序将引用 IN/OUT 接口类型的实参地址，不进行值复制操作。"
  summary: |
    先按接口类型分：IN 收参数、OUT 回结果、IN/OUT 双向。
    传值（复制、耗额外存储）适合简单类型（INT/DINT/REAL）；传引用（不复制、省存储）适合复杂类型（STRUCT/ARRAY/STRING），应走 IN/OUT。
    决策还受"优化设置"影响：.DB 与函数优化设置一致→复杂类型按引用传；不一致→系统先复制并转换格式，实际退化为传值。
    经验法则：需要复杂数据类型时用 IN/OUT 且让块与 DB 优化设置匹配，避免不必要的数据存储膨胀。
  tags: [parameter-passing, call-by-value, call-by-reference, optimized-block]
  task_ids: [T02, T04]

- id: f29
  title: 优化设置不匹配导致数据丢失的问题与解决
  type: troubleshooting
  source_chapter: 第7章 编程概念 / 7.3.6（p212）
  source_quote: |
    "该函数运行期间出现了一个中断组织块，且该中断组织块更改了原结构中的某个值……由于该结构是一个 IN/OUT 参数，因此，系统将该值以原来的格式复制回原结构。采用制作结构副本的方式进行格式转换的后果：该中断组织块改写过的数据将被丢失。"
  summary: |
    症状：HMI 或中断 OB 在函数运行期间改了结构中的值，函数结束后该值丢失。
    根因：DB 与函数优化设置不同→IN/OUT 结构被复制成副本→中断/HMI 改的是原结构，副本回写覆盖掉。
    最佳解：复杂数据类型（STRUCT）让程序块与数据块优化设置匹配，保证始终传引用。
    替代解：不让中断 OB/HMI 直接改结构元素，改另一个变量，再由程序在特定处复制进结构。
    这是数据一致性问题在"参数传递"层面的具体表现。
  tags: [data-consistency, optimized-block, HMI, troubleshooting]
  task_ids: [T04]

- id: f30
  title: 数据一致性保障流程（DIS_AIRT → 读写 → EN_AIRT）
  type: procedure
  source_chapter: 第7章 编程概念 / 7.4 了解数据一致性（p213）
  source_quote: |
    "可以在程序循环 OB 中使用 DIS_AIRT（禁用报警中断）和 EN_AIRT（启用报警中断）指令，以防止对共享值进行访问。在代码块中插入 DIS_AIRT 指令……插入读/写能够被中断 OB 更改的值的指令……在顺序结尾插入 EN_AIRT 指令，以取消 DIS_AIRT。"
  summary: |
    用于保护程序循环 OB 与中断 OB/HMI/其它 CPU 之间共享的多个值。
    三段式：进临界区前 DIS_AIRT 延迟中断 → 读写共享值 → 出临界区 EN_AIRT 恢复中断。
    CPU 只对基本数据类型和系统结构（IEC_TIMERS/DTL）保证原子读写；多个共享值须自行保证一致。
    通信场景：PTS/PROFINET/PROFIBUS 指令的缓冲区，避免在循环与中断 OB 中同时读写；需改则在 DIS_AIRT/EN_AIRT 包围内操作。
    代价：延迟中断会增大中断等待时间（事件发生到 OB 执行），需权衡。
    配对原则：每次 DIS_AIRT 都要有对应 EN_AIRT。
  tags: [data-consistency, DIS_AIRT, EN_AIRT, procedure]
  inputs: [共享数据区, 可能被中断/HMI/通信修改的值]
  outputs: [一致的读写结果]
  steps:
    - 识别跨 OB/通信的共享多值
    - 临界区前插入 DIS_AIRT
    - 执行读写指令
    - 临界区后插入 EN_AIRT
    - 评估中断等待时间影响
  missing_conditions: 无（原文给出完整三段式）
  task_ids: [T04]

- id: f31
  title: CPU 访问保护安全等级决策框架
  type: framework
  source_chapter: 第7章 编程概念 / 7.6.1 CPU 的访问保护（p226-227）
  source_quote: |
    "CPU 提供了四个安全等级，用于限制对特定功能的访问……完全访问（无保护）……读访问……HMI 访问……无访问（完全保护）……不允许没有密码保护的访问。"
  summary: |
    按"哪些功能可不输密码访问"分四级，逐级收紧：
    完全访问=全放开；读访问=HMI/比较/PLC间通信免密，写 CPU 要密码但切 RUN/STOP 免密；HMI 访问=仅 HMI 与 PLC 间通信免密，读数据/比较/写/切模式都要密码；无访问=全部要密码。
    PLC 到 PLC 通信（程序内通信指令）不受安全等级限制；密码不因网络输入而受威胁。
    配置步骤：设备组态选 CPU→属性→保护→选等级并输密码（区分大小写）。
    强密码建议≥10字符、字母数字符号组合、非字典词；仅用 HTTPS；勿扩"所有人"默认权限。
  tags: [access-protection, security-level, decision, password]
  task_ids: [T05]

- id: f32
  title: 下载到不同容量 CPU 的决策框架（兼容性判断）
  type: framework
  source_chapter: 第7章 编程概念 / 7.7 下载程序的元素（p233-235）
  source_quote: |
    "当连接的 CPU 容量足以存储从组态的 CPU 下载的内容时，STEP 7 和 S7-1200 允许下载操作……如果想要停止下载操作，必须选择'无操作'；如果想要继续下载操作，必须选择'全部接受'……当连接的 CPU 容量不足以存储……STEP 7 和 S7-1200 会禁止下载操作。"
  summary: |
    面对"组态 CPU 与实际连接 CPU 不同"，先判两条：存储器容量是否够、I/O 是否兼容。
    容量够+I/O 兼容→允许下载，加载预览显示实际型号/固件，用户选"无操作"（停）或"全部接受"（继续）。
    容量不足或 I/O/固件不兼容→禁止下载（如 1215C→1212C 工作存储器不足、继电器→DC I/O 不兼容、1214C V4.2→V4.0 固件不兼容）。
    修复路径：在设备组态中"更改设备"，对话框给出完整兼容性信息，使组态 CPU 与实际同型号。
  tags: [download, compatibility, decision, CPU]
  task_ids: [T08]

- id: f33
  title: 下载失败后恢复流程
  type: troubleshooting
  source_chapter: 第7章 编程概念 / 7.7 下载程序的元素（p235）
  source_quote: |
    "下载失败后，需按照以下步骤操作才能顺利完成下载：1. 按错误消息所述修正问题。2. 再次尝试下载操作……如果出现该错误并且额外的下载尝试均失败，则必须清空内部装载存储器或外部装载存储器：将 CPU 复位为出厂设置……"
  summary: |
    症状：下载失败，巡视窗口"信息"选项卡与诊断缓冲区显示原因。
    初级操作：按错误消息修正→重试。
    升级情形：下载成功但后续循环上电失败（诊断缓冲区错误如 16#02:4175 存储卡评估错误、卡类型/内容错误）。
    升级操作：多次重试失败后清空装载存储器——内部装载存储器则复位出厂设置；SIMATIC 卡则拔出删内容再插回；然后重新下载硬件组态与软件。
  tags: [download, troubleshooting, diagnostic-buffer, recovery]
  task_ids: [T08]

- id: f34
  title: 在线/离线同步决策框架（四选项）
  type: framework
  source_chapter: 第7章 编程概念 / 7.8 将在线 CPU 与离线项目同步（p236-237）
  source_quote: |
    "该对话框中提供以下选项：'在线/离线比较'……显示……比较的结果……'同步'……STEP 7 会将在线 CPU 的数据块、变量和其他对象上传到项目……'无需同步继续'……STEP 7 会将项目下载到 CPU……'取消'……将取消下载操作。"
  summary: |
    下载时若 STEP 7 检测到在线 CPU 数据比项目新（如 WRIT_DBL 改了起始值、二级项目下载、在线含项目没有的块/变量），弹出同步对话框。
    四选一决策：在线/离线比较（看清差异时间戳再定）→同步（把在线变更上传进项目）→无需同步继续（项目覆盖 CPU）→取消。
    判断：先比较看差异，再决定以谁为准；上传可保留现场改的值，继续下载则丢弃在线差异。
    特例：若离线项目比在线 CPU 新（编辑了上次下载的块），无需选择，正常下载即可。
  tags: [synchronization, decision, online-offline, download]
  task_ids: [T08]

- id: f35
  title: 从在线 CPU 上传程序块流程
  type: procedure
  source_chapter: 第7章 编程概念 / 7.9 从在线 CPU 上传（p238）
  source_quote: |
    "要从在线 CPU 向离线项目上传程序块，请按照以下步骤操作：1. 在离线项目中，单击'程序块'文件夹。2. 单击'转到在线'按钮。3. 单击'上传'按钮。4. 在'上传'对话框中，确认所选项。完成上传后，STEP 7 会显示项目中所有已上传的程序块。"
  summary: |
    前置准备：添加与在线 CPU 匹配的 CPU 设备；展开 CPU 节点使"程序块"文件夹可见。
    四步：点程序块文件夹→转到在线→上传→在上传对话框确认选项。
    上传前可先用"比较"编辑器查在线与离线差异（7.9.1）。
    也可从连到编程设备的存储卡复制程序块。
    产出：项目中显示所有已上传的程序块。
  tags: [upload, procedure, online-offline]
  inputs: [匹配的离线 CPU 设备, 在线连接]
  outputs: [含全部上传程序块的离线项目]
  steps:
    - 添加匹配 CPU 并展开程序块文件夹
    - 单击程序块文件夹
    - 转到在线
    - 上传并确认选项
  missing_conditions: 无（原文1-4步完整）
  task_ids: [T08]

- id: f36
  title: 监视/修改/强制能力矩阵框架
  type: framework
  source_chapter: 第7章 编程概念 / 7.10 调试和测试程序（p239）；第15章 / 15.13（p1500）
  source_quote: |
    "监视表格：监视有、修改有、强制无；强制表格：监视有、修改无、强制有；程序编辑器：监视有、修改有、强制无；变量表：监视有、修改无、强制无；DB 编辑器：监视有、修改无、强制无。"
  summary: |
    按"监视/修改/强制"三维给各编辑器定位，选择调试工具时对照矩阵。
    监视表格：可监视+修改，适合通用调试；强制表格：唯一能强制的，用于把变量锁到特定值。
    程序编辑器：可在 LAD/FBD 中边看能流边改值；变量表/DB 编辑器：只读监视。
    强制值存在 CPU（非表格），且不能强制普通 I 地址，只能强制外设输入（加":P"）。
    监视不改程序顺序，仅提供状态；修改/强制会改变执行，须谨慎。
  tags: [debug, watch-table, force, monitoring, framework]
  task_ids: [T08]

- id: f37
  title: 调用结构时间戳冲突排查流程
  type: troubleshooting
  source_chapter: 第7章 编程概念 / 7.10.4 用于检查调用层级的调用结构（p242）
  source_quote: |
    "下列情况会导致冲突：块执行的任何调用具有更旧或更新代码时间戳……块所调用块的接口已更改……块未被 OB 直接或间接调用……块调用了不存在的块或缺失的块……通过重新编译代码块可纠正大多数时间戳和接口冲突。"
  summary: |
    症状：调用结构中出现冲突块，红色标记。
    判断五类冲突：调用代码时间戳不一致、被调块接口变更、变量地址/类型变更、块未被 OB 调用（孤立块）、调用不存在/缺失块。
    操作：先重新编译相关块（纠正大多数时间戳/接口冲突）→若仍不一致，用"详细资料"列链接跳到程序编辑器手动消除→重新编译所有红色块。
    验证：冲突标记消失、所有块被 OB 直接或间接调用。
  tags: [call-structure, timestamp-conflict, troubleshooting, compile]
  task_ids: [T08]

- id: f38
  title: ATTACH/DETACH 附加与分离中断事件机制
  type: framework
  source_chapter: 第9章 扩展指令 / 9.5.1 ATTACH 和 DETACH（p468-471）
  source_quote: |
    "使用 ATTACH 和 DETACH 指令可激活和禁用由中断事件驱动的子程序……ADD = 0（默认值）：该事件将取代先前为此 OB 附加的所有事件。ADD = 1：该事件将添加到先前为此 OB 附加的事件中……如果未指定 EVENT，则分离当前附加到 OB_NR 的所有事件。"
  summary: |
    用于在组态期或运行期把硬件中断事件与 OB 绑定/解绑。
    组态期：设备组态属性勾选启用事件 + "HW 中断"下拉选 OB。
    运行期：ATTACH 绑定（ADD=0 替换该 OB 所有旧事件、ADD=1 追加）、DETACH 解绑（指定 EVENT 只解一个，不指定则解该 OB 全部）。
    若事件未附加任何 OB（<未连接>或被 DETACH），事件被忽略。
    条件代码 RET_VAL 用于判断结果（8090 OB 不存在、8091 OB 类型错、8093 事件不存在、0001 无可分离事件）。
    每个硬件事件可附加一个 OB，多个事件可共用一个 OB。
  tags: [ATTACH, DETACH, interrupt, event, framework]
  task_ids: [T03, T06]

- id: f39
  title: 中断 OB 创建与事件启用流程（硬件中断）
  type: procedure
  source_chapter: 第9章 扩展指令 / 9.5.1（p470）
  source_quote: |
    "如果未列出任何 OB，则必须按下列步骤创建类型为'硬件中断'的 OB……1. 双击'添加新块'，选择'组织块 (OB)'，然后选择'硬件中断'。2. 也可以重命名 OB、选择编程语言……3. 编辑该 OB，添加事件发生时要执行的已编程响应。"
  summary: |
    前置：在设备组态中启用硬件中断（为 DI 通道勾上升/下降沿检测，或为 HSC 勾 CV=RV/外部复位/方向变化事件），否则事件不可用。
    创建 OB：项目树→添加新块→组织块→硬件中断；可重命名、选语言、改块号。
    编辑 OB 写入响应逻辑，可从该 OB 调用最多 6 层嵌套的 FC/FB。
    组态期在"HW 中断"下拉把事件绑到 OB，或用 ATTACH 运行期绑定。
  tags: [hardware-interrupt, OB, procedure]
  inputs: [启用的硬件中断事件]
  outputs: [绑定事件的硬件中断 OB 及响应程序]
  steps:
    - 设备组态启用具体硬件事件
    - 若无可用的 OB 则创建硬件中断 OB
    - 编辑 OB 写入响应逻辑
    - 组态或运行期把事件附加到 OB
  missing_conditions: 无（原文1-3步完整，事件启用项在表格中列出）
  task_ids: [T03, T06]

- id: f40
  title: 循环中断相移决策与设置流程（SET_CINT/QRY_CINT）
  type: procedure
  source_chapter: 第9章 扩展指令 / 9.5.2 循环中断（p473-475）；第5章 / 5.1.3.4（p100）
  source_quote: |
    "PHASE（相移）时间是 CYCLE 时间间隔开始前的指定延迟时间。可使用相移来控制优先级较低的 OB 的执行时间……如果希望以固定的时间周期来执行优先级较低的 OB，则相移时间应大于优先级较高的 OB 的处理时间。"
  summary: |
    用 SET_CINT 设循环 OB 的 CYCLE（微秒，0=禁用）与 PHASE（相移）；QRY_CINT 查参数与 STATUS。
    决策：同优先级或同周期的高/低优先级 OB 若同时触发，低优先级会被推迟；要让低优先级 OB 按固定周期执行，把其相移设为大于高优先级 OB 的处理时间。
    最大相移=6000ms 或最大循环时间取较小者，默认 0。
    相移使多个循环事件错开，避免同时发生（如 5ms 与 10ms 事件）。

    SET_CINT 设的值在上电循环或切 STOP 后回到初始值（不保持），可用 QRY_CINT 验证。
  tags: [cyclic-interrupt, phase-shift, SET_CINT, procedure]
  inputs: [循环 OB, 目标周期, 高优先级 OB 处理时间]
  outputs: [错开执行的循环中断配置]
  steps:
    - 确定各循环 OB 周期与优先级
    - 计算低优先级 OB 相移 > 高优先级处理时间
    - SET_CINT 设置 CYCLE 与 PHASE
    - QRY_CINT 查询 STATUS 验证
  missing_conditions: SET_CINT 值掉电/STOP 后不保持，需在上电时重设
  task_ids: [T03]

- id: f41
  title: 延时中断设置指令族流程（SRT_DINT/CAN_DINT/QRY_DINT）
  type: procedure
  source_chapter: 第9章 扩展指令 / 9.5.4 延时中断（p481-483）
  source_quote: |
    "可使用 SRT_DINT 和 CAN_DINT 指令启动和取消延时中断处理过程，或使用 QRY_DINT 指令查询中断状态。每个延时中断都是一个在指定的延迟时间过后发生的一次性事件。如果在延迟时间到期前取消延时事件，则不会发生程序中断。"
  summary: |
    一次性定时中断：SRT_DINT 启动（DTIME 1–60000ms）、CAN_DINT 在到期前取消、QRY_DINT 查状态。
    前置：项目须先添加延时中断 OB（添加新块→组织块→延时中断），再在指令 OB_NR 中引用。
    关键陷阱：EN=1 须作为单触发脉冲，不要常通，否则每个扫描都重启定时器。
    激活的延时中断总数不超过 4 个。
    QRY_DINT 的 STATUS 位含：RUN/启动、中断启用/禁用、激活/过期、OB 是否存在；有错误时 STATUS=0。
  tags: [time-delay-interrupt, SRT_DINT, procedure]
  inputs: [延时中断 OB, 延迟时间 DTIME]
  outputs: [到期触发的一次性中断或取消结果]
  steps:
    - 创建延时中断 OB
    - SRT_DINT 以单触发脉冲启动定时器
    - 如需要 CAN_DINT 取消
    - QRY_DINT 查询 STATUS 验证
  missing_conditions: 无（原文指令族与说明完整）
  task_ids: [T03]

- id: f42
  title: DIS_AIRT/EN_AIRT 延迟中断配对机制
  type: procedure
  source_chapter: 第9章 扩展指令 / 9.5.5 DIS_AIRT 和 EN_AIRT（p484-485）
  source_quote: |
    "DIS_AIRT 可延迟新中断事件的处理。可在 OB 中多次执行 DIS_AIRT……每一次 DIS_AIRT 执行都必须通过一次 EN_AIRT 执行来取消……如果通过五次 DIS_AIRT 执行禁用中断五次，则在再次启用中断前，必须通过五次 EN_AIRT 执行来取消禁用。"
  summary: |
    用于临时屏蔽高优先级中断/异步错误，保护临界区。
    DIS_AIRT 可多次执行、层层累加；每次都要用一次 EN_AIRT 抵消，RET_VAL 返回排队次数，仅当 RET_VAL=0 才真正重新启用。
    EN_AIRT 必须在同一 OB 或该 OB 调用的 FC/FB 中执行。
    再次启用后，屏蔽期间发生的中断被处理（或当前 OB 结束后立即处理）。
    这是 f30 数据一致性流程的底层机制。
  tags: [DIS_AIRT, EN_AIRT, interrupt-delay, pairing]
  inputs: [需屏蔽的临界区]
  outputs: [按配对次数恢复的中断处理]
  steps:
    - 进入临界区前执行 DIS_AIRT（可多次）
    - 执行不受中断打扰的代码
    - 用等量 EN_AIRT 抵消
    - 确认 RET_VAL=0 表示已恢复
  missing_conditions: EN_AIRT 须在同一 OB 或其调用的 FC/FB 内
  task_ids: [T04, T03]

- id: f43
  title: Gen_UsrMsg 用户诊断报警生成流程
  type: procedure
  source_chapter: 第9章 扩展指令 / 9.6.1 Gen_UsrMsg（p486-489）
  source_quote: |
    "使用'Gen_UsrMsg'指令生成用户诊断报警，可以是到达的报警也可以是离去的报警。通过用户诊断报警，可以将用户条目写入诊断缓冲区并发送相应报警。条目在诊断缓冲区中同时创建，而报警却将进行异步传送。"
  summary: |
    用于让用户程序主动向诊断缓冲区写条目并发送报警。
    三步构造内容：TextListID 指定文本列表（ID 取自文本列表对话框）→TextID 选列表条目（起始/终止范围值须相同）→Mode 选到达(1)/离去(2)。
    可选关联值：用 AssocValues 结构（最多 8 个），取值编号从 3 起（1、2 被 TextID/TextListID 占用）。
    注意条目同步写入诊断缓冲区、报警异步传送。
    RET_VAL 报错误（8080 不支持 MODE、80C1 并行调用过多、8528/853A 关联值问题）。
  tags: [alarm, Gen_UsrMsg, diagnostic-buffer, procedure]
  inputs: [文本列表ID, 文本条目ID, 报警方向, 关联值]
  outputs: [诊断缓冲区条目与发送的报警]
  steps:
    - 在项目中定义文本列表及其条目
    - 设置 TextListID/TextID/Mode
    - 如需相关值则构造 AssocValues（编号从3起）
    - 调用指令并检查 RET_VAL
  missing_conditions: 无（原文含参数、关联值规则、错误码）
  task_ids: [T07]

- id: f44
  title: 诊断指令集选择框架（8 类诊断指令）
  type: framework
  source_chapter: 第9章 扩展指令 / 9.7.1 诊断指令（p490）
  source_quote: |
    "以下诊断指令适用于 PROFINET 或 PROFIBUS：RD_SINFO 指令：读取当前 OB 启动信息……LED 指令：读取……LED 状态……Get_IM_Data 指令：检查……I&M 数据……DeviceStates 指令：获取……运行状态……GET_DIAG 指令：从指定的设备读取诊断信息。"
  summary: |
    按要查的信息选指令，构成分布式 I/O 诊断的工具箱：
    RD_SINFO 读当前/启动 OB 启动信息；LED 读 LED 状态；Get_IM_Data 读标识维护数据；Get_Name 读设备名；GetStationInfo 读 IP/MAC；DeviceStates 读 I/O 子系统设备状态；ModuleStates 读模块状态；GET_DIAG 读指定设备诊断信息。
    GetStationInfo 仅用于 PROFINET IO 设备，不能用于 PROFIBUS DP 从站。
    排障时按"先整体状态（DeviceStates/ModuleStates）→再定位设备（Get_Name/IP）→最后读细节（GET_DIAG/RD_SINFO）"的粒度递进选择。
  tags: [diagnostic-instructions, PROFINET, PROFIBUS, framework]
  task_ids: [T07]

- id: f45
  title: HSC 门功能状态表（软件门×硬件门→内部门）
  type: framework
  source_chapter: 第10章 工艺指令 / 10.1.2.2 门功能（p644，表10-7）
  source_quote: |
    "每个 HSC 通道有两个门：软件门和硬件门。这些门的状态将决定内部门的状态。如果软件门和硬件门都处于打开状态或尚未进行组态，则内部门会打开。如果内部门打开，则开始计数。如果内部门关闭，则会忽略其他所有计数脉冲，且停止计数。"
  summary: |
    以状态表表达计数使能逻辑：软件门（由 HSC_Count.EnHSC 控制）×硬件门（HSC 属性组态）共同决定内部门。
    两门都开或未组态→内部门开→计数；任一关闭→内部门关→忽略脉冲、停止计数。
    硬件门为可选；不组态则始终视为开，内部门=软件门状态。
    仅通过硬件门控制时，软件门须保持打开；周期/频率模式下内部门=软件门（用 HSC_Period/Frequency.EnHSC）。
    输入滤波器会延迟门控信号，设计实时性时须计入。
  tags: [HSC, gate-function, state-table, counting]
  task_ids: [T06]

- id: f46
  title: 高速计数器四类功能框架（同步/门/捕获/比较）
  type: framework
  source_chapter: 第10章 工艺指令 / 10.1.2 使用高速计数器（p643-648）
  source_quote: |
    "同步功能可通过外部输入信号给计时器设置起始刻度值……门功能……通过内部门功能来开启或关闭计数……捕获功能……通过外部参照信号来保存当前计数值……比较功能……每次发生组态的事件时便会产生脉冲。"
  summary: |
    把 HSC 能力拆为四类可组合功能，按控制需求选用：
    同步（EnSync）——用外部信号设起始值，使计数与外部事件对齐；
    门（EnHSC）——按事件启停计数；
    捕获（EnCapture）——外部沿到达时锁存当前计数（不受门状态影响）；
    比较——计数达到参考值/溢出时产生可组态脉冲。
    这些功能大多仅在"计数模式"下可用；频率/周期模式有各自的软件门。
    用途：编码器监控中同步对应每转复位脉冲、比较输出触发后续过程、捕获用于校准。
  tags: [HSC, sync, capture, compare, framework]
  task_ids: [T06]

- id: f47
  title: HSC 编码器监控的状态控制循环流程
  type: procedure
  source_chapter: 第10章 工艺指令 / 10.1.2.5 应用（p648）
  source_quote: |
    "启动时，程序将第一个参考值加载至 HSC，并将输出值设置为初始状态……在当前计数等于参考值、发生同步事件（复位）以及方向改变时，HSC 将中断程序。在每个计数都等于参考值时，则会发生中断事件，并且程序会将新的参考值加载至 HSC，并将输出值设置为下一个状态。"
  summary: |
    给出用 HSC 做增量编码器位置/状态控制的循环范式。
    启动：装载首个参考值与输出初态。
    循环：计数达参考值/同步(复位)/方向改变→HSC 中断→中断例程装载新参考值并设下一输出态；同步中断则重置首参考值与首输出态，周而复始。
    优势：中断频率远低于计数速率，对扫描周期影响小却能精确控制高速过程。
    门功能可暂停计数（忽略轴移动），捕获用于测事件间脉冲数，频率模式用复位信号频率求转速、周期模式算浮点频率。
  tags: [HSC, encoder, state-control, procedure]
  inputs: [编码器脉冲, 每转复位脉冲, 参考值序列]
  outputs: [按计数位置切换的输出状态]
  steps:
    - 启动装载首参考值与输出初态
    - 计数达参考值/同步/换向触发中断
    - 中断例程装载新参考值、设下一输出态
    - 同步中断重置回首状态，循环
  missing_conditions: 无（原文描述完整循环）
  task_ids: [T06]

- id: f48
  title: PID 控制器调试流程（测量→调节→上传→验证）
  type: procedure
  source_chapter: 第10章 工艺指令 / 10.2.7、10.2.8 调试 PID 控制器（p728、p731）
  source_quote: |
    "测量：要在实时趋势中显示设定值、过程值和输出值，请输入采样时间并单击'开始'按钮。调节模式：要调节 PID 循环，请选择'预调节'或'精确调节'（手动）并单击'开始'按钮……完成调节过程之后，可以单击'上传 PID 参数'按钮来存储新参数。"
  summary: |
    用调试编辑器在线整定 PID：先测量（设采样时间、看设定/过程/输出实时趋势）→选预调节或精确调节启动→控制器运行多阶段算系统响应时间与更新时间→得调节参数→上传保存。
    判断成功：调节无错误则输出值变 0、模式回到"未激活"，状态可指示错误。
    起始值控制可在线改实际参数，并把实际值与项目离线起始值、PLC 在线起始值比较（绿=同、蓝/橙=异），判断下次 STOP→RUN 用哪个值。
    PID_Compact/3Step 与 PID_Temp 调试流程一致。
  tags: [PID, tuning, commissioning, procedure]
  inputs: [PID 工艺对象, 采样时间, 调节模式选择]
  outputs: [整定得到的 PID 参数]
  steps:
    - 打开调试编辑器并设采样时间开始测量
    - 选预调节或精确调节启动整定
    - 待控制器算完响应/更新时间
    - 上传 PID 参数并检查状态无错误
  missing_conditions: 具体调节阶段细节在 STEP 7 在线帮助
  task_ids: [T06]

- id: f49
  title: 运动控制错误响应与排查流程（ErrorID→补救）
  type: troubleshooting
  source_chapter: 第10章 工艺指令 / 10.3.9 运动控制的 ErrorID 和 ErrorInfo（p871）
  source_quote: |
    "下表列出了运动控制指令和数据调整中指示的所有 ErrorID 和 ErrorInfo。除了错误原因，还列出了消除错误的补救措施……取消启用：输出设定点 0，并取消启用……通过急停斜坡功能进行停止：将中止处于激活状态的运动命令。"
  summary: |
    症状：运动控制指令/工艺对象报 ErrorID 与 ErrorInfo。
    判断：查 ErrorID 定位错误原因（如 16#8000 丢失"驱动器就绪"信号、16#8001 触发下限软限位开关），并按 ErrorInfo 区分支路。
    错误响应两类：取消启用（设 0 点按驱动器组态制动）或急停斜坡停止（按组态急停减速度无加加速度限制制动）。
    操作：用 MC_Reset 指令确认错误，按需提供驱动器信号后重新启动命令；软限位错误须用运动命令把轴移出限位范围。
    验证：轴转入停止状态、错误确认后可重新使能。
  tags: [motion-control, ErrorID, MC_Reset, troubleshooting]
  task_ids: [T06]

- id: f50
  title: PROFINET 网络连接创建与连接路径组态流程
  type: procedure
  source_chapter: 第11章 通信 / 11.2.1、11.2.2（p912-913）
  source_quote: |
    "使用设备配置的'网络视图'在项目中的各个设备之间创建网络连接。创建网络连接之后，使用巡视窗口的'属性'选项卡组态网络的参数……本地/伙伴（远程）连接定义两个通信伙伴的逻辑分配以建立通信服务。"
  summary: |
    两层组态：先物理网络（网络视图里把一设备端口拖到另一设备端口建立连接，再在属性里配参数），再逻辑连接（本地/伙伴）。
    连接三要素：通信伙伴（一主动一被动）、连接类型（PLC/HMI/设备连接）、连接路径。
    路径配置随协议不同：TCP/ISO-on-TCP/UDP 用 TSEND_C/TRCV_C/TCON 指令属性配；S7 通信用"设备和网络"编辑器配（GET/PUT）。
    伙伴须是项目中已创建的确定 CPU（非"未指定"），且双方都插入对应通信指令并选连接 DB。
    连接建立后 CPU 自动保持并监视；断线时主动伙伴自动重连，不必重执行通信指令。
  tags: [PROFINET, connection, configuration, procedure]
  inputs: [项目设备, 通信伙伴角色, 协议类型]
  outputs: [建立并保持的通信连接]
  steps:
    - 网络视图拖动端口建立物理连接
    - 属性中配置网络参数
    - 按协议选指令或编辑器配置本地/伙伴路径
    - 双方插入通信指令并绑定连接 DB
  missing_conditions: 伙伴 CPU 须已在项目中创建、非未指定
  task_ids: [T05]

- id: f51
  title: Modbus 主/从站角色选择框架
  type: framework
  source_chapter: 第13章 通信处理器和 Modbus TCP / 13.5.1 Modbus 通信概述（p1316）
  source_quote: |
    "CPU 作为 Modbus RTU 主站（或 Modbus TCP 客户端）运行时，可在远程 Modbus RTU 从站（或 Modbus TCP 服务器）中读/写数据和 I/O 状态……CPU 作为 Modbus RTU 从站（或 Modbus TCP 服务器）运行时，监控设备可在 CPU 存储器中读/写数据和 I/O 状态。"
  summary: |
    先定 CPU 在 Modbus 网络中的角色，再去选功能码与组态。
    主站/客户端角色：主动读/写远程从站/服务器的数据与 I/O，结果在程序逻辑中处理。
    从站/服务器角色：被动接受监控设备读写本 CPU 存储器，主站写入的值供用户程序使用。
    按角色映射功能码：读（01 输出位、02 输入位、03 保持寄存器、04 输入字）、写（05/15 输出位、06/16 保持寄存器）；08/11 诊断，0 广播（仅 RTU，TCP 不支持）。
    安全约束：Modbus 等 I/O 交换无安全功能，须靠限制物理访问防读写。
  tags: [Modbus, master-slave, role-selection, framework]
  task_ids: [T05]

- id: f52
  title: CPU 状态 LED 故障判读表（症状→状态）
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.1 状态 LED（p1483-1486，表15-1）
  source_quote: |
    "STOP/RUN：黄色常亮指示 STOP 模式，纯绿色指示 RUN 模式，闪烁（绿色和黄色交替）指示 STARTUP 模式。ERROR：呈红色闪烁即表示出错……MAINT 在每次插入存储卡时闪烁。然后 CPU 切换到 STOP 模式。"
  summary: |
    把 STOP/RUN（黄绿）、ERROR（红）、MAINT（黄）三灯组合映射为状态，作为排障第一步。
    黄常亮=STOP、绿常亮=RUN、黄绿交替=启动/自检/固件更新。
    ERROR 红闪=内部/存储卡/组态错误；纯红=硬件故障；全 LED 闪=固件故障。
    MAINT 闪=插卡需评估或需维护（强制 I/O、电池）；取出卡时黄亮+MAINT 闪。
    组合判读：黄亮+ERROR 红闪+MAINT 灭=错误；黄亮+ERROR 红闪+MAINT 闪=组态版本未知/不兼容。
    也可用 LED 指令在程序里读状态，SM 模块另有 DIAG/Channel LED 判读表。
  tags: [LED, troubleshooting, status, fault-diagnosis]
  task_ids: [T07]

- id: f53
  title: 致命错误后故障模式启动排查
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.1 出现致命错误之后的 S7-1200 特性（p1485）
  source_quote: |
    "CPU 固件在检测到致命错误时会尝试故障模式重新启动，如果重新启动成功，CPU 会通过持续闪烁 STOP/RUN、ERROR 和 MAINT LED 发出信号来指示故障模式。不能在故障模式重新启动后装载用户程序和硬件配置。"
  summary: |
    症状：致命错误后三灯持续闪烁（故障模式标志）。
    判断：固件检测到致命错误后尝试以故障模式重启。
    若重启成功：CPU 与信号板输出置 0，中央机架 SM 与分布式 I/O 输出设为组态的"对 CPU STOP 的响应"，但不能装载程序/组态。
    若重启失败（如硬件故障）：STOP 与 ERROR 亮、MAINT 灭。
    安全约束：故障状态下不能保证正常运行，须用急停/机电超控/独立冗余安全功能。
  tags: [fatal-error, fail-mode, troubleshooting, LED]
  task_ids: [T07]

- id: f54
  title: 组态版本未知/不兼容错误恢复流程
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.1（p1484）；第7章 / 7.7（p235）
  source_quote: |
    "试图将 S7-1200 V3.0 程序下载到 S7-1200 V4.0 CPU 中会导致 CPU 错误……如果是因使用了无效版本的程序传送卡所致，则请取出该卡，然后执行 STOP 到 RUN 切换、存储器复位 (MRES) 或循环上电。如果是因下载了无效程序所致，则请将 CPU 复位为其出厂设置。"
  summary: |
    症状：诊断缓冲区报"组态版本未知或不兼容"（如 16#02:4175），LED 呈黄亮+ERROR 闪+MAINT 闪。
    判断原因分流：V3.0 程序传送卡插入 V4.0 CPU，还是下载了无效程序。
    卡导致：取出卡→STOP-RUN 切换/MRES/循环上电恢复→下载有效 V4.0 程序。
    程序导致：CPU 复位出厂设置→下载有效 V4.0 程序。
    验证：错误状态解除、诊断缓冲区不再报版本错误。
  tags: [version-incompatible, troubleshooting, MRES, recovery]
  task_ids: [T07, T10]

- id: f55
  title: 转到在线并连接 CPU 流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.2 转到在线并连接到 CPU（p1487）
  source_quote: |
    "要与组态的 CPU 建立在线连接，请单击'项目导航'树中的 CPU，并在'项目'视图中单击'转到在线模式'按钮……如果这是该 CPU 首次转到在线模式，则必须从'转到在线模式'对话框中选择 PG/PC 接口的类型以及特定的 PG/PC 接口。"
  summary: |
    在线连接是下载/测试/模式切换/时钟设置/模块信息/比较同步/上传下载/诊断/监视/强制的前提。
    步骤：项目导航树选 CPU→项目视图点"转到在线"→（首次）选 PG/PC 接口类型与具体接口→与发现的 CPU 建立连接。
    成功标志：橙色单元表示在线；即可用"在线和诊断"工具。
    本质是所有在线运维操作的入口动作。
  tags: [go-online, connection, procedure, prerequisite]
  inputs: [项目中的 CPU, PG/PC 接口]
  outputs: [建立的在线连接]
  steps:
    - 项目树选 CPU
    - 点击转到在线
    - 首次时选择 PG/PC 接口类型与接口
    - 确认橙色在线指示
  missing_conditions: 无（原文步骤完整）
  task_ids: [T07]

- id: f56
  title: PROFINET IO 设备名称分配与匹配排障
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.3 在线为 PROFINET IO 设备分配名称（p1488-1489）
  source_quote: |
    "对于各 PROFINET IO 设备，必须在 STEP 7 项目和 PROFINET IO 设备组态存储器中为该设备分配相同的名称。如果名称缺失或两个位置中的名称不匹配，则 PROFINET IO 数据交换模式将不会运行。"
  summary: |
    症状：PROFINET IO 数据交换不运行。
    判断：设备名缺失，或 STEP 7 项目中的名称与设备组态存储器中的不一致。
    操作三步：设备与网络编辑器右键设备→在线和诊断→功能→指定 PROFINET 设备名称并"更新列表"→选设备点"分配名称"写入组态存储器。
    验证：两处名称一致后数据交换启动。
    条件：未分配名称的设备无法与 CPU 连接；这是 PROFNET 通信建立的前置条件。
  tags: [PROFINET, device-name, troubleshooting, procedure]
  inputs: [PROFINET IO 设备, 项目名称]
  outputs: [设备组态存储器中写入的一致名称]
  steps:
    - 右键设备进入在线和诊断
    - 功能→指定 PROFINET 设备名称，更新列表
    - 选设备点分配名称
    - 验证两处名称一致、数据交换运行
  missing_conditions: 无（原文1-3步完整）
  task_ids: [T05, T07]

- id: f57
  title: 复位为出厂设置流程（含保留 IP 决策）
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.5 复位为出厂设置（p1491-1492）
  source_quote: |
    "要将 CPU 复位为出厂设置，请按以下步骤操作：1. 打开 CPU 的'在线和诊断'视图。2. 从'功能'文件夹中选择'复位为出厂设置'。3. 如果要保留 IP 地址，请选中'保留 IP 地址'复选框；如果要删除 IP 地址，则选中'删除 IP 地址'复选框。"
  summary: |
    前提：CPU 在线且处于 STOP（RUN 时可在确认后切 STOP）。
    五步：打开在线和诊断→功能→复位为出厂设置→选保留/删除 IP→复位并确认。
    关键决策：保留还是删除 IP（MAC 固定不变）。
    结果分两种情况：有存储卡时清诊断缓冲区、复位时间、从卡恢复工作存储器、操作数区置初值、按选择处理 IP、删控制数据记录；无卡时还清空工作存储器与内部装载存储器。
    用途：清除保持性存储器现有值、从版本错误恢复。
  tags: [factory-reset, procedure, IP-address, maintenance]
  inputs: [在线 CPU, 保留/删除 IP 的选择]
  outputs: [恢复出厂设置的 CPU]
  steps:
    - 确认 CPU 在线并切 STOP
    - 打开在线和诊断
    - 选择复位为出厂设置
    - 选择保留或删除 IP
    - 复位并确认提示
  missing_conditions: 无（原文1-5步及结果完整）
  task_ids: [T10]

- id: f58
  title: 固件更新（STEP 7 在线）流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.6 更新固件（p1493-1494）
  source_quote: |
    "要执行固件更新，请执行以下步骤：1. 打开项目树中对应连接的 CPU……4. 单击'浏览'按钮导航到包含固件更新文件的位置……5. 选择与模块兼容的文件……6. 单击'运行更新'按钮。"
  summary: |
    两种方法：更新项目中的 CPU、或更新项目树中可访问的设备。
    项目中 CPU 更新六步：打开 CPU→在线和诊断→功能→固件更新→浏览选兼容文件→运行更新（必要时切模式）。
    完成后提示用新固件启动模块；若不启动，旧固件保持激活，须复位模块（如循环上电）新固件才生效。
    可访问设备更新：在线访问→打开通信接口→更新可访问设备→展开 CPU→在线和诊断→固件更新。
    其他途径：SIMATIC 存储卡、Web 服务器模块信息页、SIMATIC 自动化工具。
  tags: [firmware-update, procedure, online, maintenance]
  inputs: [在线 CPU, 兼容固件文件]
  outputs: [运行新固件的 CPU]
  steps:
    - 打开 CPU 的在线和诊断
    - 功能→固件更新
    - 浏览并选择兼容固件文件
    - 运行更新并用新固件启动模块
  missing_conditions: 不启动新固件时须复位模块才生效
  task_ids: [T10]

- id: f59
  title: 格式化 SIMATIC 存储卡流程与后续决策
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.7 通过 STEP 7 格式化 SIMATIC 存储卡（p1495）
  source_quote: |
    "您可以通过 STEP 7 在线和诊断工具格式化连接的 CPU 中的存储卡……1. 确保 CPU 处于 STOP 模式……5. 选择'功能'菜单中的'格式化存储卡'。6. 单击'格式化'……完成后 CPU 处于 STOP 模式，STOP 和 MAINT 灯闪烁。此时还不能切换到 RUN 模式，必须执行以下任一步骤。"
  summary: |
    前提：CPU 处于 STOP（RUN 时 STEP 7 会提示允许切 STOP）。
    步骤：确认 STOP→插卡→打开在线和诊断→（在线则）转到在线→功能→格式化存储卡→格式化→确认。
    完成后 CPU 停在 STOP、STOP 与 MAINT 闪烁，不能直接切 RUN，必须二选一：
    ①移除卡并重启 CPU（内部装载存储器有程序则带程序启动）；②不移除卡重启（有程序则复制到卡后启动，无程序则把卡改为程序卡等待下载）。
    说明：格式化不影响内部装载存储器。
  tags: [memory-card, format, procedure, maintenance]
  inputs: [处于 STOP 的 CPU, 已插存储卡]
  outputs: [格式化后的存储卡及明确的启动决策]
  steps:
    - 确认 CPU 处于 STOP
    - 插卡并打开在线和诊断
    - 功能→格式化存储卡→确认
    - 二选一：移卡重启或不移卡重启
  missing_conditions: 格式化后必须二选一重启方式，不能直接切 RUN
  task_ids: [T10]

- id: f60
  title: 监视/修改触发点选择决策框架
  type: framework
  source_chapter: 第15章 在线和诊断工具 / 15.13.4.1 使用触发器（p1505-1506，表15-4）
  source_quote: |
    "触发决定将在扫描周期中的哪个点监视或修改所选地址……修改输出：触发修改输出事件的最佳时机是在扫描周期结束且 CPU 马上要写入输出之前的时间……修改输入：触发修改输入事件的最佳时机是在周期开始、CPU 刚读取输入且用户程序要使用输入值之前的时间。"
  summary: |
    触发器四选：永久、扫描周期开始时、扫描周期结束时、切换到 STOP 时，各有"永久连续/一次"两档。
    决策规则：改输出选"扫描周期结束、写物理输出前"（可看写入值并与实际 I/O 比较）；改输入选"周期开始、刚读输入后"（值被程序使用前）。
    怀疑某值扫描中变化→在周期结束时再监视输入，对比开始值判断程序是否误写输入。
    诊断 CPU 转 STOP 的原因→用"切换到 STOP"触发器捕获上一过程值。
    注意"使用触发器修改"不反馈是否成功，要反馈用"立即修改"。
  tags: [trigger, monitoring, modification, framework]
  task_ids: [T07, T08]

- id: f61
  title: 监视表格创建与使用流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.13.4 使用监视表格（p1504-1505）
  source_quote: |
    "要创建监视表格：1. 双击'添加新监视表格'打开新监视表格。2. 输入变量名称将变量添加到监视表格……'监视全部'：该命令用于启动对激活的监视表格中的可见变量进行监视……'立即修改'：立即修改所选地址的值一个扫描周期。"
  summary: |
    用于 CPU 执行程序时监视/控制数据点（过程映像 I/Q、M、DB、物理输入 I_:P）。
    创建：双击添加新监视表格→输入变量名。
    监视选项：监视全部（连续）、立即监视（仅一次）。
    修改选项：修改为 0/1、立即修改（改一个扫描周期）、使用触发器修改（无反馈）、在 STOP 模式启用外围设备输出。
    限制：无法准确监视物理输出 Q_:P（只显示 Q 存储器最后写入值，不读物理实际值）；须在线连接。
    使用控制功能要谨慎（可能严重影响程序执行），STOP 下写物理输出前确认不会导致意外设备动作。
  tags: [watch-table, monitoring, procedure, safety]
  inputs: [变量名, 在线连接]
  outputs: [可监视/修改变量的监视表格]
  steps:
    - 双击添加新监视表格
    - 输入变量名
    - 选监视全部或立即监视
    - 如需控制用修改/立即修改功能
  missing_conditions: 物理输出 Q_:P 无法准确监视；须在线
  task_ids: [T08, T07]

- id: f62
  title: DB 在线值快照捕获与恢复流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.13.3 捕获 DB 在线值快照用于恢复值操作（p1502-1503）
  source_quote: |
    "您可以从在线 CPU 捕获数据块变量的实际值快照，方便稍后使用……1. 在 DB 编辑器中单击'监视所有变量'按钮……2. 单击……按钮捕获实际值快照并将其显示在'快照'列中。您可以稍后使用该快照更新 CPU 实际值或替换起始值。"
  summary: |
    前提：能在线连接 CPU、STEP 7 中已打开 DB。
    捕获：DB 编辑器点"监视所有变量"→点捕获按钮，把实际值存入"快照"列。
    用途两条：把快照值复制到 CPU 实际值（连续下载时加载），或复制到起始值（编译下载 DB 后进 RUN 生效）。
    也可单个值复制粘贴到起始值。
    注意：若快照含状态信息、计时器值、计算信息，CPU 会在快照时恢复这些值；扫描周期随后可能改写，复制操作按连续下载加载。
  tags: [DB, snapshot, restore, procedure]
  inputs: [在线 DB, 在线连接]
  outputs: [DB 值快照及三种恢复去向]
  steps:
    - 打开 DB 并监视所有变量
    - 捕获实际值到快照列
    - 选择复制到实际值/起始值/单个粘贴
    - 编译下载使起始值生效
  missing_conditions: 须在线且 DB 已打开
  task_ids: [T08]

- id: f63
  title: RUN 模式下修改和下载块（不重新初始化）流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.14.5 在 RUN 模式下修改和下载现有块（p1516-1518）
  source_quote: |
    "利用'下载而不重新初始化'功能，您可以通过添加更多的数据块变量来扩展数据块并在 RUN 模式下下载扩展数据块。这样，您便可向数据块中添加变量并下载该数据块而不重新初始化程序。CPU 将保留现有数据块变量的值并将新添加的变量初始化为其起始值。"
  summary: |
    机制：每个 DB/FB 有存储器预留区（默认 100 字节），在该范围内加变量可在 RUN 下载且不重初始化（保留旧值、新变量取起始值）。
    启用步骤：打开块→点"下载而不重新初始化"切换按钮→确认→加变量并 RUN 下载；超出预留区则报错须增大存储空间。
    禁用：取消切换→确认→下载时选"重新初始化"，所有变量回到起始值。
    含保持性变量须另配保持性存储器预留区。
    限制：仅优化块支持；不重初始化时不能改结构（加 Struct 成员、改名、改数组/类型/保持性都要重初始化）；一次最多下载 20 个块。
  tags: [RUN-mode-download, reinitialization, memory-reserve, procedure]
  inputs: [DB/FB 块, 存储器预留区, 新增变量]
  outputs: [RUN 下更新的块且不丢现有值]
  steps:
    - 打开块并启用"下载而不重新初始化"
    - 在预留区容量内添加变量
    - RUN 模式下载该块
    - 禁用时取消切换并选重新初始化
  missing_conditions: 仅优化块支持；超预留区须改块属性；>20 块须切 STOP
  task_ids: [T08]

- id: f64
  title: RUN 模式下载临时错误与限制框架
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.14.7、15.14.5（p1519-1521）
  source_quote: |
    "CPU 中激活了'在 RUN 模式下下载'后，以下指令可能会发生临时错误。如果 CPU 正准备激活已下载的更改，那么初始化指令时将出现错误……无论何种情况，只要发生错误，指令的 RLO 输出都将失败。该错误是临时错误。如果出现错误，则需稍后重试该指令。"
  summary: |
    症状：RUN 下载激活期间，DataLog*、READ_DBL、WRIT_DBL、Create_DB、Delete_DB、RTM 等指令报临时错误（STATUS 80C0/82C0、ERROR=TRUE）。
    根因：CPU 暂停用户程序访问装载存储器的初始化，统一激活更改期间发生。
    操作：稍后重试指令（不能在该 OB 执行过程中重试）。
    其他限制框架：删输出控制逻辑则输出保持末态至下次上电/STOP；删 HSC/PTO 函数则继续运行至下次上电/STOP；首次扫描位逻辑不执行；不能覆盖 DB 当前值。
    前提：CPU 支持 RUN 更改、编译无错、能与 STEP7 通信、CPU 无错。
  tags: [RUN-mode-download, temporary-error, troubleshooting, retry]
  task_ids: [T08]

- id: f65
  title: 跟踪记录 CPU 数据五步流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.15 根据触发条件跟踪并记录 CPU 数据（p1522）
  source_quote: |
    "下图显示了轨迹功能的各个步骤：① 在 STEP 7 的跟踪编辑器中组态跟踪……② 将轨迹组态从 STEP 7 传送到 PLC。③ PLC 执行该程序，并在发生触发条件时开始记录轨迹数据。④ 将记录的值从 PLC 传送到 STEP 7。⑤ 使用 STEP 7 中的工具分析、以图形方式显示并保存该数据。"
  summary: |
    用于按触发条件捕捉并图形化分析变量，是诊断间歇性问题的重要手段。
    五步：①在跟踪编辑器组态（记录值、时长、频率、触发条件）→②组态传送到 PLC→③PLC 运行时触发即记录→④记录值传回 STEP 7→⑤分析/图形显示/保存。
    容量：两个跟踪作业，每个触发最多 16 变量，每作业 524288 字节 RAM。
    存卡：只能存到 SIMATIC 卡，须保证 1MB 外部装载存储器可用；无卡/空间不足会记诊断缓冲区。
    "覆盖最早记录"适合捕捉间歇问题，但会缩短装载存储器寿命；最多 999 个测量结果。
  tags: [trace, trigger, data-logging, procedure, troubleshooting]
  inputs: [待跟踪变量, 记录时长/频率, 触发条件]
  outputs: [可图形分析的跟踪数据]
  steps:
    - 组态跟踪（值/时长/频率/触发）
    - 传送组态到 PLC
    - 运行时触发记录
    - 上传记录数据到 STEP 7
    - 分析、显示、保存
  missing_conditions: 存卡须有 SIMATIC 卡且≥1MB 外部装载存储器
  task_ids: [T07]

- id: f66
  title: SM 1231 模块断路条件类型判定流程
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.16 确定 SM 1231 模块的断路条件类型（p1524-1527）
  source_quote: |
    "SM 1231 模块会针对断路条件或溢出条件返回模拟量输入值 32767 (16#7FFF)。如果想要确定发生的是哪个条件，可以在 STEP 7 程序中包含相关逻辑。确定条件类型的方法中包含以下任务：创建诊断错误中断 OB……包含对 RALRM 指令的调用……评估 RALRM_DB 的 AINFO 结构体的字节 32 和 33。"
  summary: |
    症状：模拟量输入返回 32767(16#7FFF)，但不知是断路还是溢出。
    判断流程四任务：创建诊断错误中断 OB（进入/离开事件时调用）→调用 RALRM（F_ID 设为 OB 的 LADDR 硬件标识符）→为 TINFO/AINFO 建≥34 字节数组→诊断中断时解析 AINFO。
    解析关键字节：26-27 字=16#8000 表 PROFINET 类型；28-29 通道号；30 位模式 aaabb000 表通道/错误类型；31 数据格式；32-33 错误类型字（16#0001 短路、16#0006 断线、16#0007 超上限等）。
    验证：由字节 32/33 值确定诊断事件本质。
  tags: [SM1231, wire-break, RALRM, AINFO, troubleshooting]
  inputs: [SM 1231 模块, 硬件标识符 LADDR]
  outputs: [具体的断路器/溢出/短路等错误类型]
  steps:
    - 创建诊断错误中断 OB
    - 调用 RALRM 并设 F_ID=LADDR
    - 建 AINFO 字节数组（≥34字节）
    - 解析字节 26-33 判定错误类型
  missing_conditions: 须使用 PROFINET 类型诊断（字节26-27=16#8000）
  task_ids: [T07]

- id: f67
  title: 备份与恢复选项决策矩阵（4 种备份方式）
  type: framework
  source_chapter: 第15章 在线和诊断工具 / 15.17.1 备份与恢复选项（p1528-1529）
  source_quote: |
    "STEP 7 和 S7-1200 CPU 提供多种选项来备份与恢复硬件组态和软件……监视值的快照……从设备上传（软件）……上传设备作为新站（硬件和软件）……从在线设备中下载备份……创建 CPU 的完整备份作为恢复点。备份副本具有一致的数据，并且无法更改或打开。"
  summary: |
    面对"要恢复什么"，按应用案例/要求/支持模式/是否可编辑四维修选备份方式：
    监视值快照——恢复某状态的数据块实际值，要求在线离线 DB 完全相同，RUN/STOP 均可、可编辑。
    从设备上传（软件）——把块从 CPU 上传到项目，要求设备在硬件目录可用、装了 HSP/GSD。
    上传设备作为新站——硬件组态+软件全上传，RUN/STOP 均可、可编辑。
    从在线设备下载备份——创建完整一致恢复点，仅 STOP、不可编辑/打开。
    注意：备份类型为"从在线设备备份"时，为保证保持性数据一致须禁用其写访问；CPU 备份含当前值但不含诊断缓冲区。
  tags: [backup, restore, decision, framework]
  task_ids: [T10]

- id: f68
  title: 备份在线 CPU 流程与先决条件
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.17.2 备份在线 CPU（p1530-1531）
  source_quote: |
    "要备份 CPU 当前组态，请按以下步骤操作：1. 在项目树中选择该 CPU。2. 从'在线'菜单中，选择'从在线设备备份'命令。如果需要，必须输入密码才能对 CPU 进行读访问并确认 CPU 应进入'STOP'模式。"
  summary: |
    先决条件：STEP 7 项目中已创建 CPU；CPU 通过自身 PROFINET 接口直连 PG/PC（不支持 CM 的 PROFIBUS 接口）；CPU 在线；CPU 在 STOP（否则提示允许切 STOP）。
    步骤：项目树选 CPU→在线菜单→从在线设备备份→（如需）输密码并确认进 STOP。
    产出：按 CPU 名称+日期时间命名的备份，含存储卡内容、DB/计数器/位存储器保持区、其它保持性内容（如 IP 参数），不含诊断缓冲区，存于"在线备份"文件夹。
    提示：可通过 SAT 或 Web 服务器在线备份页备份；STEP7 与 Web 服务器备份互不通用。
  tags: [backup, procedure, prerequisite, STOP]
  inputs: [项目中已创建的 CPU, PROFINET 直连, 在线 STOP 状态]
  outputs: [CPU 当前组态的完整备份]
  steps:
    - 确认四项先决条件
    - 项目树选 CPU
    - 在线→从在线设备备份
    - 输密码并确认进 STOP
  missing_conditions: 不支持经 CM 的 PROFIBUS 接口
  task_ids: [T10]

- id: f69
  title: 恢复 CPU 流程与先决条件
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.17.3 恢复 CPU（p1532-1533）
  source_quote: |
    "要恢复备份，请按以下步骤操作：1. 打开项目树中的 CPU 以显示较低级别的对象。2. 从'在线备份'文件夹中选择要恢复的备份文件。3. 从'在线'菜单中，选择'下载到设备'命令……STEP 7 将备份的内容恢复到 CPU 中并重启 CPU。"
  summary: |
    先决条件：项目含 CPU 组态和之前的备份；CPU 经 PROFINET 直连；CPU 在 STOP；完全访问需知道密码。
    安全约束：只恢复内容已知的备份（未知备份在故障/程序错误时可能导致重大财产损失或人身伤害）。
    七步：展开 CPU→选备份文件→在线→下载到设备（已连接则"加载预览"，未连接则"延长下载到设备"先选接口）→加载预览检查报警选操作→点加载→加载结果检查→完成。
    恢复时 CPU 进 STOP，结束自动重启。
    提示：也可通过 Web 服务器在线备份页恢复。
  tags: [restore, procedure, prerequisite, backup]
  inputs: [已知内容的备份, PROFINET 直连, STOP 状态的 CPU]
  outputs: [恢复到备份组态并重启的 CPU]
  steps:
    - 确认先决条件与备份内容已知
    - 展开 CPU 选备份文件
    - 在线→下载到设备
    - 加载预览检查并加载
    - 查看加载结果并重启
  missing_conditions: 未建连接须先经"延长下载到设备"选接口；备份内容须已知
  task_ids: [T10]

- id: f70
  title: 比较离线/在线 CPU 与同步流程
  type: procedure
  source_chapter: 第15章 在线和诊断工具 / 15.11 比较离线 CPU 与在线 CPU（p1498）
  source_quote: |
    "可以将在线 CPU 中的代码块与项目中的代码块进行比较。如果项目中的代码块与在线 CPU 的代码块不匹配，则可通过'比较'编辑器使项目与在线 CPU 同步，具体方法可以是将项目的代码块下载到 CPU 中，或者从项目中删除在线 CPU 中不存在的块。"
  summary: |
    用于核对项目与在线 CPU 的代码块差异并二向同步。
    步骤：项目中选 CPU→工具/右键→比较离线/在线打开比较编辑器→对每个对象在"操作"列选（删对象/不操作/下载到设备）→点同步装载代码块。
    细节比较：右键"比较目标"列对象→开始详细比较，并排显示并高亮差异。
    权限约束：STEP 7 V14+ 下"HMI 访问"级别不足以做离线/在线比较，须"读访问"或"完全访问"。
    与 f34 的下载时同步对话框互补：此处是主动发起比较与同步。
  tags: [compare, synchronization, online-offline, procedure]
  inputs: [项目 CPU, 在线 CPU, 读访问权限]
  outputs: [同步后的代码库]
  steps:
    - 选 CPU 打开比较编辑器
    - 逐对象选操作（删除/不操作/下载）
    - 点同步装载
    - 必要时详细比较高亮差异
  missing_conditions: 受保护 CPU 须读访问或完全访问权限
  task_ids: [T08]

- id: f71
  title: 在线/离线拓扑比较状态判断框架
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.12 比较在线/离线拓扑（p1499）
  source_quote: |
    "在拓扑概览表中，STEP 7 移除了'伙伴站'、'伙伴接口'和'电缆数据'列并插入了'状态'和'操作'比较列。对于拓扑概览中的每个设备或端口，'状态'列按如下所示显示比较状态……拓扑相同……拓扑不同……"
  summary: |
    用于找出组态拓扑与实际拓扑的差异。
    步骤：显示拓扑概览表→工具栏点"离线/在线比较"。
    状态列判读：至少一个低级组件拓扑不同、拓扑相同、仅离线可用/设备禁用、仅在线可用、拓扑不同、设备不支持拓扑功能。
    操作列二选：无可执行操作、采用在线连接。
    可重复比较（点工具栏按钮）。
    这是 PROFINET 网络排障中"物理连接是否符合组态"的可视化判断工具。
  tags: [topology, comparison, PROFINET, troubleshooting]
  task_ids: [T07]

- id: f72
  title: 在 STOP 模式下启用输出的风险判断
  type: troubleshooting
  source_chapter: 第15章 在线和诊断工具 / 15.13.4.2（p1506，警告框）
  source_quote: |
    "即使在 CPU 处于 STOP 模式时，启用物理输出也可激活相连的过程点，进而可能导致意外的设备操作。意外的设备操作可导致死亡或严重的人身伤害。从监视表中写入到输出之前，请确保更改物理输出不会导致意外的设备操作。"
  summary: |
    功能：监视表格允许 CPU 在 STOP 模式写输出，用于检查接线、验证引入高/低电平。
    判断：写输出是否会激活相连过程点导致意外设备动作。
    操作前约束：确认更改物理输出不会导致意外设备操作，遵守过程设备安全预防措施。
    本质：这是一个"高风险调试动作的前置安全检查"机制——停止状态不等于安全状态。
    与全书多处警告一致（急停电路、独立安全装置）。
  tags: [output-enable, STOP-mode, safety, troubleshooting]
  task_ids: [T08]
