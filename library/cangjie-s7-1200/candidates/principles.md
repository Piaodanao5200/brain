# Principle candidates — 来源: 西门子 S7-1200 系统手册 V4.2 (A5E02486685-AK, 2016-09) / 提取时间: 2026-11-16 / 提取器: principle-extractor
# 覆盖: source.md 正文 p29–1534。附录 A/B/C/D（p1535+，含"计算功率预算"p1779、模拟量表示法表 p1675/1677）未纳入正文文本，相关公式仅能从正文引用处提取，已在 missing_conditions 标注。

- id: p01
  title: 开放式设备必须装在封闭外壳内且仅限授权人员开启
  type: principle
  source_chapter: ch4.1 安装准则 · p59
  source_quote: "电气设备标准将 SIMATIC S7-1200 系统分类为开放式设备。必须将 S7-1200 安装在外壳、控制柜或电控室内。仅限获得授权的人员能打开外壳、控制柜或进入电控室。"
  summary: S7-1200 属开放式设备，必须安装在封闭外壳/控制柜/电控室内，且只有授权人员可开启；安装环境须干燥并考虑 SELV/PELV 防电击。
  tags: [principle, installation, safety, enclosure]
  task_ids: [T01]

- id: p02
  title: 高压高噪声设备必须与低压逻辑设备物理隔离
  type: principle
  source_chapter: ch4.1 安装准则 · p59
  source_quote: "作为布置系统中各种设备的基本规则，必须将产生高压和高电噪声的设备与 S7-1200 等低压逻辑型设备隔离开……避免将低压信号线和通信电缆铺设在具有交流动力线和高能量快速开关直流线的槽中。"
  summary: 布置系统的基本规则是把高压/高电噪声设备与低压逻辑设备隔离；电子设备布置在控制柜较凉爽区域，低压信号线与通信电缆不得与交流动力线同槽敷设。
  tags: [principle, installation, emc, layout]
  task_ids: [T01]

- id: p03
  title: 冷却与接线空隙下限 25 mm
  type: rule
  source_chapter: ch4.1 安装准则 · p60
  source_quote: "S7-1200 被设计成通过自然对流冷却。为保证适当冷却，在设备上方和下方必须留出至少 25 mm 的空隙。此外，模块前端与机柜内壁间至少应留出 25 mm 的深度。"
  summary: 自然对流冷却要求设备上下各留至少 25 mm 空隙、模块前端与柜内壁至少 25 mm 深度；纵向安装时最大环境温度降低 10°C。
  tags: [rule, installation, clearance, thermal]
  task_ids: [T01]

- id: p04
  title: 外部 24V DC 电源不得与 CPU 传感器电源并联
  type: rule
  source_chapter: ch4.2 功率预算 · p61
  source_quote: "如果需要外部 24 V DC 电源，请确保该电源不要与 CPU 的传感器电源并联。为提高电噪声防护能力，建议连接不同电源的公共端 (M)。"
  summary: 24V 需求超出传感器电源预算时须加外部 24V DC 电源，但该电源绝不可与 CPU 传感器电源并联（会导致两电源冲突、寿命缩短或故障）；建议把不同电源的 M 公共端相连以提高抗噪声。
  tags: [rule, power, wiring, danger]
  task_ids: [T01]

- id: p05
  title: 所有非隔离 M 端子必须接到同一参考电位
  type: rule
  source_chapter: ch4.2 功率预算 · p61
  source_quote: "所有非隔离的 M 端子必须连接到同一个外部参考电位……务必确保 S7-1200 系统中的所有非隔离 M 端子都连接到同一个参考电位。"
  summary: 系统中所有非隔离 M 端子必须接到同一个参考电位；接到不同参考电位会产生意外电流、损坏设备或导致运行不确定。
  tags: [rule, power, grounding, danger]
  task_ids: [T01]

- id: p06
  title: 功率预算须按 5V 逻辑预算与 24V 传感器预算分别核算
  type: calculation
  source_chapter: ch4.2 功率预算 · p61
  source_quote: "有关 CPU 所提供的 5 V DC 逻辑预算以及信号模块、信号板和通信模块的 5 V DC 功率要求的信息，请参考技术规范……请参考'计算功率预算'(页 1779)来确定 CPU 可以为您的配置提供多少电能（或电流）。"
  summary: CPU 内部电源为 CPU/SM/SB/CM 供电；选型时须核对 CPU 提供的 5V DC 逻辑预算 ≥ 各模块 5V 需求之和，24V 传感器预算 ≥ 24V 负载之和，超出则加外部电源。
  tags: [calculation, power, budgeting, selection]
  task_ids: [T01]
  inputs: [CPU 型号对应的 5V 逻辑预算与 24V 传感器预算, 各 SM/SB/CM 的 5V 功率要求, 24V DC 负载总需求]
  formula: "5V 余量 = CPU 5V 预算 − Σ(各模块 5V 需求); 24V 余量 = CPU 24V 传感器预算 − Σ(24V 负载)"
  units: [V, mA/A, W]
  output: 各路预算余量；为负则须加外部 24V 电源或改选型
  missing_conditions: "具体预算数值表位于附录 A 技术规范 p1535 与'计算功率预算'p1779，未纳入正文，需查 PDF 原表补齐；正文仅有原则无具体数值。"

- id: p07
  title: 接地接线前必须断电，并采用独立于 PLC 的安全措施
  type: principle
  source_chapter: ch4.4 接线准则 · p81
  source_quote: "在对任何电气设备进行接地或者接线之前，请确保设备的电源已经断开……应采取一些独立于 S7-1200 的安全措施以防止可能的人员受伤或设备损坏……应使用紧急停止功能、机电超控功能或其它独立于 S7-1200 的冗余安全功能。"
  summary: 接地/接线前必须断开所有相关设备电源；电子控制设备可能失灵导致意外动作，故必须配置独立于 PLC 的急停/机电超控/冗余安全功能。
  tags: [principle, wiring, safety, emergency-stop]
  task_ids: [T01]

- id: p08
  title: 单点接地，地线尽可能短且用大线径
  type: rule
  source_chapter: ch4.4 接线准则 · p82
  source_quote: "将应用设备接地的最佳方式是确保 S7-1200 和相关设备的所有公共端和接地连接在同一个点接地。该点应该直接连接到系统的大地接地。所有地线应尽可能地短且应使用大线径，例如，2 mm2 (14 AWG)。"
  summary: 最佳接地方式是所有公共端与接地点单点接地并直连大地；地线尽量短、线径尽量大（如 2 mm²/14 AWG）。
  tags: [rule, wiring, grounding]
  task_ids: [T01]

- id: p09
  title: 接线须提供隔离开关、过流保护与浪涌抑制
  type: checklist
  source_chapter: ch4.4 接线准则 · p83
  source_quote: "规划 S7-1200 的接线时，应提供一个可同时切断 CPU 电源、所有输入电路和所有输出电路电力供应的隔离开关。请提供过流保护……为所有可能遭雷电冲击的线路安装合适的浪涌抑制设备……使用尽可能短的电线并确保线径适合承载所需电流。"
  summary: 接线规则清单：①装可同时切断 CPU+全部 I/O 的隔离开关；②电源线加过流保护（熔断器/断路器），输出回路可另加熔断；③可能遭雷击线路加装浪涌抑制；④避免信号线与动力线同槽、成对布线；⑤短电线+合适线径；⑥电缆温度等级高于环境 30°C（如环境 55°C 用 ≥85°C 电缆）；⑦用屏蔽线且在 S7-1200 端接地；⑧外部供电输入回路加过流保护（内部 24V 供电不需）；⑨连接器插牢。
  tags: [checklist, wiring, protection, surge]
  task_ids: [T01]

- id: p10
  title: CPU/SM/SB 接线端子机械参数表
  type: template
  source_chapter: ch4.4 接线准则 · p84 表格 4-17
  source_quote: "表格 4- 17 S7-1200 CPU、SM 和SB 的接线规则……软绞线的可连接导线横截面 2 mm2 到 0.3 mm2……每个连接的导线数 1 根或 2 根……剥线长度 6.4 mm……拧紧扭矩（最大值）0.56 N·m（5 英寸·磅）"
  summary: 接线核验字段模板（CPU/SM 连接器 vs SB 连接器）：软绞线横截面 2~0.3 mm² vs 1.3~0.3 mm²；每连接 1–2 根、总截面 2 mm² vs 1.3 mm²；剥线长度 6.4 mm vs 6.3–7 mm；最大拧紧扭矩 0.56 N·m vs 0.33 N·m；工具 2.5–3.0 mm vs 2.0–2.5 mm 一字螺丝刀。注意勿拧过紧。
  tags: [template, wiring, terminal, torque]
  task_ids: [T01]

- id: p11
  title: 感性负载必须加抑制电路，灯负载需浪涌限制
  type: principle
  source_chapter: ch4.4 接线准则 · p85–87
  source_quote: "将抑制电路与感性负载配合使用，以在控制输出断开时限制电压升高……配备一个外部抑制电路，使其从电路上跨接在负载两端并且在位置上接近负载，这样对降低电气噪声最有效……由于接通浪涌电流大，灯负载会损坏继电器触点。"
  summary: 感性负载须跨接抑制电路且尽量靠近负载以限压降噪；DC 感性负载一般加二极管，需更快关断则再加稳压二极管（DC 输出 8.2V、继电器输出 36V）；AC 用 MOV。灯负载浪涌为稳态电流 10–15 倍，频繁开关建议插式继电器/浪涌限制器。抑制有效性须用示波器验证。
  tags: [principle, wiring, inductive-load, suppression]
  task_ids: [T01]

- id: p12
  title: CPU 三种工作模式与暖启动数据保留规则
  type: rule
  source_chapter: ch5.1.1 CPU 的工作模式 · p93–94
  source_quote: "CPU 有以下三种工作模式：STOP 模式、STARTUP 模式和 RUN 模式……STOP 模式下，CPU 不执行程序……在 STARTUP 模式下，执行一次启动 OB（如果存在）。在启动模式下，CPU 不会处理中断事件……暖启动……初始化所有的非保持性系统和用户数据，并保留所有保持性用户数据值。"
  summary: STOP 不执行程序但可下载；STARTUP 执行一次启动 OB 且不处理中断事件；RUN 重复执行程序循环 OB 且可在任意点执行中断 OB。暖启动初始化非保持性数据、保留保持性数据，不含存储器复位。
  tags: [rule, cpu-mode, startup]
  task_ids: [T02, T03]

- id: p13
  title: 启动 OB 中读物理输入必须立即读（过程映像输入读为零）
  type: rule
  source_chapter: ch5.1 启动过程 · p96
  source_quote: "通过'启动 OB'中的指令对过程映像输入进行任何的读访问，都只会读取零值，而不是读取当前物理输入值。因此，要在启动模式下读取物理输入的当前状态，必须执行立即读取操作……如果存在多个启动 OB，则按照 OB 编号依次执行各启动 OB，OB 编号最小的先执行。"
  summary: 启动 OB 中读过程映像输入(I)只会得零，要读当前物理输入必须立即读(I_:P)；多个启动 OB / 程序循环 OB 均按编号升序执行，编号最小先执行。
  tags: [rule, startup, process-image, ob]
  task_ids: [T02, T03]

- id: p14
  title: 启动阶段中断只排队不处理，循环时间监视不执行
  type: rule
  source_chapter: ch5.1 启动过程 · p96
  source_quote: "在启动阶段，对中断进行排队但不加以处理；在启动阶段，不执行任何循环时间监视；只有在 RUN 模式下才会真正运行 HSC、PWM 和点对点通信模块。"
  summary: STARTUP 阶段中断事件只入队不处理、不做循环时间监视、可改 HSC/PWM/PtP 组态；这些模块只在 RUN 模式真正运行。
  tags: [rule, startup, interrupt, hsc]
  task_ids: [T03]

- id: p15
  title: OB 按优先级处理，范围 1（最低，主循环）至 26（最高）
  type: rule
  source_chapter: ch5.1.3 组织块 (OB) · p98
  source_quote: "OB 无法互相调用或通过 FC 或 FB 调用……CPU 按照 OB 对应的优先级对其进行处理，遵从高优先级在前低优先级在后的顺序执行 OB。最低优先等级为 1（对应主程序循环），最高优先等级为 26。"
  summary: OB 由事件触发、不能互相调用也不能被 FC/FB 调用；CPU 按优先级高低处理，最低 1（主程序循环）、最高 26；多个事件可分配相同优先级，同优先级按发生顺序处理。
  tags: [rule, ob, priority, interrupt]
  task_ids: [T02, T03]

- id: p16
  title: 循环中断 OB 规则：每个事件一个 OB、最多四个、相移错开
  type: rule
  source_chapter: ch5.1.3.4 循环中断 OB · p100
  source_quote: "最多可组态四个循环中断事件，每个循环中断事件对应一个 OB……一个循环事件只可连接一个循环中断 OB……可为每一个循环中断分配一个相移，从而使循环中断彼此错开……最大相移为 6000 ms（6 秒）或为最大循环时间，选择两者中的较小者。"
  summary: 循环中断：最多 4 个事件、每个事件只连一个 OB、优先级高于程序循环；用相移错开同时发生的事件（默认 0，最大相移取 6000ms 与最大循环时间的较小者）；SET_CINT 设置的周期/相移在上电或切 STOP 后恢复初始值。
  tags: [rule, interrupt, cyclic-ob, phase-shift]
  task_ids: [T03]

- id: p17
  title: 中断事件数量上限（上升/下降沿、HSC）
  type: rule
  source_chapter: ch5.1.3.5 硬件中断 OB · p101
  source_quote: "硬件中断事件数具有以下限制：沿：上升沿事件最多 16 条，下降沿事件最多 16 条；HSC 事件：CV=PV 最多 6 个，方向更改最多 6 条，外部复位最多 6 条。"
  summary: 硬件中断事件上限：上升沿 16、下降沿 16；HSC 事件 CV=PV 6、方向更改 6、外部复位 6；每个硬件中断事件使用一个中断 OB。
  tags: [rule, interrupt, hardware-ob, limits]
  task_ids: [T03]

- id: p18
  title: 时间错误（超时/队列溢出）处理规则与 RE_TRIGR 十倍上限
  type: rule
  source_chapter: ch5.1.3.6 / 5.1.4 · p102–103, p117
  source_quote: "如果同一程序循环中出现两次'超出最大周期时间'情况且没有复位循环定时器，则无论时间错误中断 OB 是否存在，CPU 都将切换到 STOP 模式……用户程序可将程序循环执行时间最多延长为所组态最大周期时间的十倍。"
  summary: 超时/OB无法启动/队列溢出触发时间错误 OB(OB80)；无 OB80 时默认时间错误保持 RUN、超时默认切 STOP；RE_TRIGR 最多把单循环延长到最大周期时间的 10 倍（ENO=TRUE 表示成功），同一循环两次超时未复位则必切 STOP。
  tags: [rule, time-error, watchdog, ob80]
  task_ids: [T03]

- id: p19
  title: 扫描周期为固定顺序，中断按优先级穿插
  type: principle
  source_chapter: ch5.1.2 在 RUN 模式下处理扫描周期 · p97
  source_quote: "在每个扫描周期中，CPU 都会写入输出、读取输入、执行用户程序、更新通信模块以及响应中断……以上操作（用户中断事件除外）按先后顺序定期进行处理。对于已启用的用户中断事件，将根据优先级按其发生顺序进行处理。"
  summary: 扫描周期顺序固定：写输出→读输入→执行用户程序→自检诊断→处理通信/中断；用户中断除外按先后定期处理，中断事件按优先级及发生顺序处理，可在扫描任意阶段打断循环。
  tags: [principle, scan-cycle, realtime, interrupt]
  task_ids: [T03]

- id: p20
  title: 访问物理 I/O 加 :P 后缀，I_:P 只读、Q_:P 只写
  type: rule
  source_chapter: ch5.2.1 寻址 · p127–130
  source_quote: "要立即访问物理输入或输出，请在引用后面添加':P'（例如，I0.3:P、Q1.7:P）……I_:P 访问为只读访问……Q_:P 访问为只写访问。"
  summary: 地址加 :P 立即访问物理点：I_:P 直接从物理输入取值（只读，且仅限模块支持的输入大小、向上取整到字节）；Q_:P 同时写过程映像和物理输出（只写）；:P 访问不改变（I）/会改变（Q）对应过程映像值。
  tags: [rule, addressing, io, process-image]
  task_ids: [T02, T03]

- id: p21
  title: 绝对地址构成与 SCL 必须加 % 前缀
  type: rule
  source_chapter: ch5.2.1 寻址 · p128, p131
  source_quote: "绝对地址由以下元素组成：存储区标识符（如 I、Q 或 M）、要访问的数据的大小（B/W/D）、数据的起始地址……在 SCL 中，必须在地址前输入'%'来表示此地址为绝对地址。如果没有'%'，STEP 7 将在编译时生成未定义的变量错误。"
  summary: 绝对地址=存储区标识+大小(B/W/D)+起始地址；位访问不带大小助记符（如 M3.4）；LAD/FBD 自动加 %，SCL 必须手动加 % 否则编译报未定义变量。
  tags: [rule, addressing, syntax, scl]
  task_ids: [T02]

- id: p22
  title: 存储区访问属性表（I/Q/M/L/DB）
  type: template
  source_chapter: ch5.2.1 寻址 · p127 表格 5-21
  source_quote: "表格 5- 21 存储区……I 过程映像输入：扫描周期开始时从物理输入复制，不可强制、无保持性；I_:P 物理输入：立即读取，支持强制；M 位存储器：控制和数据存储器，可选保持性；DB：数据存储器，也是 FB 参数存储器，可选保持性。"
  summary: 工作模板字段：存储区(I/I_:P/Q/Q_:P/M/L/DB)—说明—是否可强制—是否保持性。I/Q 过程映像无保持性不可强制，I_:P/Q_:P 支持强制，M 与 DB 保持性可选，L 临时区无保持性不可强制、仅块内局部有效。
  tags: [template, memory, addressing, retentivity]
  task_ids: [T02]

- id: p23
  title: I/O 地址按 8 点数字量 / 2 点模拟量分组分配
  type: rule
  source_chapter: ch5.2.1 寻址 · p132
  source_quote: "无论模块是否使用所有点，STEP 7 都按每组 8 点（1 字节）的方式分配数字量输入和输出。STEP 7 按照每组 2 点的方式分配模拟量输入和输出，其中每个模拟点占用 2 个字节（16 位）。"
  summary: STEP 7 自动分配 I/Q 地址：数字量每 8 点=1 字节（即便未用满），模拟量每 2 点一组、每点占 2 字节(16 位)；可在设备组态改地址，工具会协助纠正大小错误/地址冲突。
  tags: [rule, addressing, io-allocation]
  task_ids: [T02]

- id: p24
  title: 临时存储器局部有效，每优先级 16KB/6KB 分配
  type: rule
  source_chapter: ch5.2.1 / 5.1.5 · p130–131
  source_quote: "临时存储器在'局部'范围内有效……当 OB 调用 FC 时，FC 无法访问对其进行调用的 OB 的临时存储器。CPU 为每个 OB 优先级都提供了临时（本地）存储器：16 KB 用于启动和程序循环……6 KB 用于每次额外的中断事件线程。"
  summary: 临时存储器(L)仅声明它的块可访问、子块不能访问父块的 L；只能通过符号寻址；每个 OB 优先级分配本地存储器：启动/程序循环 16KB、每个额外中断线程 6KB（含相关 FB/FC）。
  tags: [rule, memory, local-data, nesting]
  task_ids: [T02, T03]

- id: p25
  title: 模拟量转换顺序：先标准化 0.0–1.0 再标定工程单位
  type: principle
  source_chapter: ch5.3 模拟值的处理 · p133
  source_quote: "要以工程单位使用模拟量输入，必须首先将模拟值标准化为由 0.0 到 1.0 的实数（浮点）值。然后，必须将其标定为其表示的工程单位的最小值和最大值……STEP 7 为此提供了 NORM_X 和 SCALE_X 指令。"
  summary: 模拟量转工程单位必须两步：先 NORM_X 标准化到 0.0–1.0，再 SCALE_X 标定到工程单位上下限；反向输出则先标准化再标定到 0~27648（电流）/ -27648~27648（电压）。用 NORM_X/SCALE_X 或 CALCULATE。
  tags: [principle, analog, scaling, norm]
  task_ids: [T06]

- id: p26
  title: 模拟值标定通用公式与额定范围
  type: calculation
  source_chapter: ch5.3 模拟值的处理 · p133–134
  source_quote: "0 到 27648 表示电流的额定范围，-27648 到 27648 表示电压的额定范围。任何该范围之外的值即表示上溢或下溢……工程单位值 = (工程单位范围下限) + (模拟量输入值) * (工程单位范围上限 - 工程单位范围下限) / (模拟量输入上限 - 模拟量输入下限)"
  summary: 模块返回整数：电流 0~27648、电压 -27648~27648，超范围为上/下溢。工程单位换算按线性插值公式；典型做法先标准化到 0.0–1.0 再换算到工程范围。
  tags: [calculation, analog, formula, scaling]
  task_ids: [T06]
  inputs: [模拟量输入值, 工程单位范围下限, 工程单位范围上限, 模拟量输入下限, 模拟量输入上限]
  formula: "工程单位值 = EU下限 + 模拟量输入值 × (EU上限 − EU下限) / (模拟量输入上限 − 模拟量输入下限)"
  units: ["工程单位(°C/体积/重量等)", "模拟量整数(0~27648 或 -27648~27648)"]
  output: 工程单位浮点值
  missing_conditions: "示例出现 24768 与正文额定范围 27648 不一致（疑为手册示例笔误），换算时以模块实际额定范围为准；超范围值类型表位于附录 p1675/1677 未纳入正文。"

- id: p27
  title: 浮点精度规则：Real 6 位、LReal 15 位有效数字
  type: rule
  source_chapter: ch5.4.3 浮点型实数数据类型 · p138
  source_quote: "单精度浮点数的精度最高为 6 位有效数字，而双精度浮点数的精度最高为 15 位有效数字……如果数字相差 10 的 x 次方，其中 x > 6 (Real) 或 15 (LReal)，则会发生上述情况。例如 (Real)：100 000 000 + 1 = 100 000 000."
  summary: Real(32位)精度 6 位、LReal(64位)精度 15 位有效数字；输入浮点常数最多保留相应有效位数；数量级相差超过 10^6(Real)/10^15(LReal) 相加会丢失小量（如 1e8+1=1e8）。LReal 不支持直接寻址、可在块接口数组中分配。
  tags: [rule, datatype, float, precision]
  task_ids: [T02]

- id: p28
  title: 整数数据类型数值范围表
  type: calculation
  source_chapter: ch5.4.2 整数数据类型 · p137 表格 5-30
  source_quote: "表格 5- 30 整型数据类型（U=无符号，S=短，D=双）：USInt 8 位 0~255；SInt 8 位 -128~127；UInt 16 位 0~65,535；Int 16 位 -32,768~32,767；UDInt 32 位 0~4,294,967,295；DInt 32 位 -2,147,483,648~2,147,483,647。"
  summary: 数据类型选择须匹配数值范围：USInt 0~255、SInt -128~127、UInt 0~65535、Int -32768~32767、UDInt 0~4294967295、DInt -2147483648~2147483647。下划线为千位分隔符。
  tags: [calculation, datatype, integer, range]
  task_ids: [T02]
  inputs: [待存数值]
  formula: "N 位无符号范围 0~2^N−1；N 位有符号范围 −2^(N−1)~2^(N−1)−1"
  units: [bit]
  output: 所选数据类型的数值范围
  missing_conditions: 无

- id: p29
  title: 诊断缓冲区容量 50 条、最新在上、掉电保存
  type: rule
  source_chapter: ch5.1.6 诊断缓冲区 · p123
  source_quote: "此日志最多可提供 50 个最近发生的事件。日志填满后，新事件将替换日志中最早的事件。掉电时，将保存事件……必须在线访问诊断缓冲区。"
  summary: 诊断缓冲区最多存 50 个最近事件，按时间顺序显示、最新在最上，满后新事件覆盖最早事件，掉电时保存；记录所有系统诊断事件及每次 CPU 状态切换；须在线访问（在线和诊断 > 诊断 > 诊断缓冲区）。
  tags: [rule, diagnostics, buffer, troubleshooting]
  task_ids: [T07]

- id: p30
  title: CPU 状态 LED 判读规则
  type: rule
  source_chapter: ch15.1 状态 LED · p1483–1486
  source_quote: "STOP/RUN：黄色常亮指示 STOP 模式；纯绿色指示 RUN 模式；闪烁（绿色和黄色交替）指示 CPU 处于 STARTUP 模式。ERROR 呈红色闪烁即表示出错……纯红色指示硬件出现故障。MAINT 在每次插入存储卡时闪烁。"
  summary: 状态灯判据：STOP/RUN 黄常亮=STOP、绿=RUN、黄绿交替闪=STARTUP/故障模式；ERROR 红闪=出错、红常亮=硬件故障、全灯闪=固件故障；MAINT 闪=插入存储卡/维护请求（强制 I/O、需换电池）。SM 的 DIAG 绿=运行、红=故障，I/O Channel 绿=组态激活、红闪=I/O 错误。
  tags: [rule, diagnostics, led, troubleshooting]
  task_ids: [T07]

- id: p31
  title: 致命错误后故障模式重新启动的输出行为
  type: rule
  source_chapter: ch15.1 状态 LED · p1485
  source_quote: "CPU 固件在检测到致命错误时会尝试故障模式重新启动，如果重新启动成功，CPU 会通过持续闪烁 STOP/RUN、ERROR 和 MAINT LED 发出信号……不能在故障模式重新启动后装载用户程序和硬件配置。"
  summary: 致命错误后若故障模式重启成功：三灯持续闪烁、不能装载程序/组态、CPU 与信号板输出置 0、中央机架 SM 与分布式 I/O 输出按"对 CPU STOP 的响应"；若重启失败则 STOP+ERROR 亮、MAINT 灭。
  tags: [rule, diagnostics, fatal-error, failsafe]
  task_ids: [T07]

- id: p32
  title: 构建用户程序：OB/FC/FB/DB 的角色与选择规则
  type: principle
  source_chapter: ch7.2 / 7.3 · p201–207
  source_quote: "FC 不具有相关的背景 DB……FC 中的输出值必须写入存储器地址或全局 DB 中……FB 具有位于数据块(DB)或'背景'DB 中的变量存储器……通过背景 DB 可使用一个通用 FB 控制多个设备。"
  summary: OB 对应事件并组织程序（OB1 为基本结构）；FC 无背景 DB、临时数据不保存、输出须写 M 或全局 DB；FB 带背景 DB 保存参数/静态数据，一个通用 FB 配不同背景 DB 可控制多台设备；DB 数据执行完不删除，分全局 DB 与背景 DB。
  tags: [principle, program-structure, ob-fc-fb-db, reuse]
  task_ids: [T02]

- id: p33
  title: 参数传递规则：简单类型传值、复杂类型传引用
  type: rule
  source_chapter: ch7.3.6 向块传递参数 · p210–212
  source_quote: "通常情况下，针对结构变量使用 IN/OUT 接口类型（例如，ARRAY、STRUCT 和 STRING），避免不必要地增大所需的数据存储器……对于简单数据类型（例如 INT、DINT 和 REAL），可以以'传值'方式传递；传递复杂数据类型（STRUCT、ARRAY 和 STRING）时，可以采用'传引用'方式。"
  summary: IN/INOUT/OUT 三种接口：简单类型(INT/DINT/REAL)传值、复杂类型(STRUCT/ARRAY/STRING)用 IN/OUT 传引用以省存储；复杂类型应用 IN/OUT 接口；若 DB 与函数的优化设置不一致，STRUCT 会被"制作副本"使传引用退化为传值，可能导致中断 OB/HMI 对原结构的修改丢失——最佳做法是程序块与数据块采用匹配的优化设置。
  tags: [rule, parameter-passing, optimized-block, data-consistency]
  task_ids: [T02, T04]

- id: p34
  title: 数据一致性规则：基本类型原子访问，多值共享须 DIS_AIRT/EN_AIRT 保护
  type: principle
  source_chapter: ch7.4 了解数据一致性 · p213
  source_quote: "CPU 为所有基本数据类型……保持数据一致性。值的读/写操作无法中断……如果用户程序共享存储器中在程序循环 OB 和中断 OB 之间生成的多个值，用户程序还必须确保在修改或读取这些值时保持一致性……使用 DIS_AIRT 和 EN_AIRT 指令，以防止对共享值进行访问。"
  summary: CPU 保证基本类型和系统结构(IEC_TIMERS/DTL)读写的原子性；但多个共享值的一致性须用户负责：在代码块中用 DIS_AIRT 包裹读/写、再以 EN_AIRT 解除，防止中断 OB 打断；HMI/通信请求同样会中断循环，同一画面值可能来自不同扫描周期。
  tags: [principle, data-consistency, interrupt, dis-airt]
  task_ids: [T04]

- id: p35
  title: 通信缓冲区一致性：避免循环 OB 与中断 OB 同时读写
  type: rule
  source_chapter: ch7.4 了解数据一致性 · p213
  source_quote: "通过避免对程序循环 OB 和中断 OB 中的缓冲区进行任何读/写操作，可以确保数据缓冲区的数据一致性。如果需要在中断 OB 中修改这些指令的缓冲区值，请使用 DIS_AIRT 指令延迟所有中断……直到执行了 EN_AIRT 指令。"
  summary: 对 PtP/PROFINET(TSEND_C/TRCV_C)/分布式 I/O 传送缓冲区，避免循环 OB 与中断 OB 同时读写以保证一致性；若中断 OB 必须改缓冲区，用 DIS_AIRT 延迟所有中断直到 EN_AIRT（会增加中断等待时间）。
  tags: [rule, data-consistency, communication, buffer]
  task_ids: [T04, T05]

- id: p36
  title: SCALE_X / NORM_X 公式、参数类型与越界行为
  type: calculation
  source_chapter: ch8.7.5 · p323–325
  source_quote: "OUT = VALUE (MAX - MIN) + MIN……OUT = (VALUE - MIN) / (MAX - MIN)，其中 (0.0 <= OUT <= 1.0)……SCALE_X 参数 VALUE 应限制为 (0.0 <= VALUE <= 1.0)……NORM_X 参数 VALUE 应限制为 (MIN <= VALUE <= MAX)。"
  summary: SCALE_X: OUT=VALUE×(MAX−MIN)+MIN（VALUE 需在 0.0~1.0，MIN/MAX/OUT 同类型）；NORM_X: OUT=(VALUE−MIN)/(MAX−MIN) 得 0.0~1.0（MIN/VALUE/MAX 同类型）。越界：VALUE 超范围仍线性外推并置 ENO=TRUE，除非结果超出 OUT 类型范围则置中间值、ENO=FALSE；MAX<=MIN 或 VALUE=±INF/NaN 时 ENO=FALSE。
  tags: [calculation, scaling, norm, analog, formula]
  task_ids: [T06]
  inputs: [VALUE, MIN, MAX, OUT 数据类型]
  formula: "SCALE_X: OUT = VALUE×(MAX−MIN)+MIN ; NORM_X: OUT = (VALUE−MIN)/(MAX−MIN)"
  units: ["VALUE(0.0~1.0 或工程量)", "OUT(工程量 或 0.0~1.0)"]
  output: 标定/标准化后的 OUT 值与 ENO 状态
  missing_conditions: "电流型模块 MIN=0、电压型模块 MIN=−27648（正文 p325 明确）；电压/电流模拟量表示法表在附录 p1675/1677 未纳入正文。"

- id: p37
  title: CPU 四个访问安全等级规则
  type: rule
  source_chapter: ch7.6.1 CPU 的访问保护 · p226–227
  source_quote: "CPU 提供了四个安全等级……完全访问（无保护）……读访问……HMI 访问……无访问（完全保护）……密码区分大小写。"
  summary: 四级保护：完全访问(无需密码)、读访问(读数据/比较需密码，改模式不需)、HMI访问(仅 HMI 与 PLC-PLC 免密，读/写/比较/改模式需密码)、无访问(全部需密码)；默认无保护无密码；密码区分大小写；PLC-PLC 通信不受安全等级限制。
  tags: [rule, security, access-level, password]
  task_ids: [T07, T10]

- id: p38
  title: 强密码与安全实践清单
  type: checklist
  source_chapter: ch7.6.1 · p227（Siemens 建议）
  source_quote: "Siemens 建议您遵守以下安全实践：使用强密码对 CPU 访问级别和 Web 服务器用户 ID 进行密码保护……仅使用 HTTPS 协议启用对 Web 服务器的访问……不要扩展 Web 服务器'所有人'(Everybody)用户的默认最低权限……对程序逻辑中的变量执行错误检查和范围检查。"
  summary: 安全实践清单：①强密码≥10 字符（字母+数字+特殊字符、非字典词、非个人信息），妥善保管并常改；②Web 服务器仅用 HTTPS；③不扩大 Everybody 用户默认最低权限；④对程序变量做错误检查和范围检查（Web 用户可改无效值）。
  tags: [checklist, security, password, web-server]
  task_ids: [T07, T10]

- id: p39
  title: PUT/GET 通信访问须显式启用
  type: rule
  source_chapter: ch7.6.2 外部装载存储器 · p228
  source_quote: "要使用 PUT/GET 指令访问远程连接伙伴，用户还必须得到许可。默认情况下，'允许使用 PUT/GET 通信进行访问'选项处于未启用状态……将保护访问级别组态为除'无访问（完全保护）'外的任意级别；选择'允许使用 PUT/GET 通信进行访问'复选框。"
  summary: PUT/GET 访问默认禁用；要允许客户端经 PUT/GET 访问 CPU 数据，须①把保护级别设为非"无访问"，②勾选"允许使用 PUT/GET 通信进行访问"，再下载。
  tags: [rule, communication, put-get, security]
  task_ids: [T05, T07]

- id: p40
  title: RS485 网络只端接和偏置两端设备
  type: rule
  source_chapter: ch13.2 偏置和端接 RS485 网络连接器 · p1223–1224
  source_quote: "只能端接和偏置 RS485 网络的两端。不会端接或偏置这两个终端设备之间的设备……开关位置=开(On)：端接且偏置；开关位置=关(Off)：无端接或偏置。"
  summary: RS485 网络仅两端设备端接且偏置（连接器开关置 On），中间所有设备不得端接/偏置（置 Off）；无屏蔽时金属导线接触约 12 mm；CB1241 用 TRA-TA、TRB-TB 短接接入内部电阻，A=绿/针8、B=红/针3，M 接屏蔽。
  tags: [rule, communication, rs485, termination]
  task_ids: [T05]

- id: p41
  title: 复位为出厂设置的先决条件与结果
  type: checklist
  source_chapter: ch15.5 复位为出厂设置 · p1491–1492
  source_quote: "可在以下情形下将 S7-1200 复位为原始出厂设置：CPU 有在线连接；CPU 处于 STOP 模式……如果要保留 IP 地址，请选中'保留 IP 地址'复选框；如果要删除 IP 地址，则选中'删除 IP 地址'复选框。"
  summary: 复位先决条件：CPU 在线且处于 STOP（RUN 时确认后可切 STOP）。步骤：进在线和诊断→功能→复位为出厂设置→选保留/删除 IP→复位→确定。结果：清诊断缓冲区、复位时间、操作数区与参数恢复初始值、按选择保留/删除 IP（MAC 固定不变）、删控制数据记录；有卡时从卡恢复工作存储器，无卡时清空工作/装载存储器。
  tags: [checklist, maintenance, factory-reset, ip]
  task_ids: [T10]

- id: p42
  title: 备份在线 CPU 的先决条件与备份内容
  type: checklist
  source_chapter: ch15.17.2 / 15.17.1 · p1528–1531
  source_quote: "要创建备份，必须满足以下先决条件：已在 STEP 7 项目中创建 CPU；已将 CPU 通过自身的 PROFINET 接口直接连接到编程设备/PC 上……CPU 处于'STOP'模式……备份包含 CPU 的当前值，但不包含诊断缓冲区。"
  summary: 备份先决条件：项目中有 CPU、经 PROFINET 直连（不支持 CM 的 PROFIBUS 口）、CPU 在线、CPU 处 STOP。备份内容含存储卡内容、DB/计数器/位存储器保持区、其它保持性存储器(如 IP 参数)，不含诊断缓冲区。STEP 7 备份与 Web 服务器备份互不通用（但可把 STEP 7 备份存到 PC 下载文件夹供 Web 恢复）。
  tags: [checklist, maintenance, backup, prerequisites]
  task_ids: [T10]

- id: p43
  title: 保持性数据备份须禁用写访问以保证一致性
  type: rule
  source_chapter: ch15.17.1 备份实际值时的特殊注意事项 · p1529
  source_quote: "要保证保持性数据的一致性，在备份过程中需禁用保持性数据的所有写访问操作。操作模式从 STOP 转换为 RUN 时，会将非保持性数据的实际值设置为起始值。CPU 备份中仅包含非保持性数据的起始值。"
  summary: "从在线设备备份"时为保证保持性数据一致性，备份过程中须禁用其所有写访问；CPU 备份仅含非保持性数据的起始值（STOP→RUN 时非保持性实际值被置为起始值）。
  tags: [rule, backup, retentivity, consistency]
  task_ids: [T10]

- id: p44
  title: 恢复内容未知备份的警告
  type: principle
  source_chapter: ch15.17.3 恢复 CPU · p1532
  source_quote: "警告：恢复内容未知的备份——如果恢复内容未知的备份，则在发生故障或程序错误时，可能导致重大财产损失或人员严重受伤。确保备份包含内容已知的组态。"
  summary: 恢复备份前必须确认其内容已知且为预期组态，否则故障/程序错误时可能造成重大财产损失或人员伤害。恢复时 CPU 进入 STOP，恢复后重启。
  tags: [principle, maintenance, restore, danger]
  task_ids: [T10]

- id: p45
  title: PLC 系统设计指南清单（分区→规范→安全→组态）
  type: checklist
  source_chapter: ch7.1 设计 PLC 系统的指南 · p199–200 表格 7-1
  source_quote: "表格 7- 1 设计 PLC 系统的指南……对过程或机器进行分区；创建功能规范；设计安全电路；规划系统安全；指定操作员站；创建组态图；创建符号名称的列表。"
  summary: 设计步骤清单：①对过程/机器分区（定控制器边界）；②写功能规范（I/O、执行器允许条件、操作界面、接口）；③设计安全电路（标识独立 PLC 的安全替代装置，不依赖"最佳情况"）；④规划系统安全（保护级别）；⑤指定操作员站（总览/机械布局/电气图）；⑥创建组态图（位置/布局/电气含型号与地址）；⑦建符号名列表。
  tags: [checklist, design, safety, planning]
  task_ids: [T02, T01]

- id: p46
  title: 时钟存储器位—周期/频率映射表
  type: calculation
  source_chapter: ch5.1.6 表格 5-20 · p123
  source_quote: "表格 5- 20 时钟存储器：位号 7/6/5/4/3/2/1/0；周期(s) 2.0/1.6/1.0/0.8/0.5/0.4/0.2/0.1；频率(Hz) 0.5/0.625/1/1.25/2/2.5/5/10。"
  summary: 时钟存储器各位输出固定方波：位0=0.1s(10Hz)、位1=0.2s(5Hz)、位2=0.4s(2.5Hz)、位3=0.5s(2Hz)、位4=0.8s(1.25Hz)、位5=1.0s(1Hz)、位6=1.6s(0.625Hz)、位7=2.0s(0.5Hz)。因与 CPU 周期异步，长周期中状态可能多次改变。
  tags: [calculation, clock-memory, frequency, mapping]
  task_ids: [T03]
  inputs: [时钟存储器位号 0–7]
  formula: "频率(Hz) = 1 / 周期(s)；周期按位号查表"
  units: [s, Hz]
  output: 对应位的方波周期与频率
  missing_conditions: 无

- id: p47
  title: SCL 转换与取整规则（ROUND/TRUNC/CEIL/FLOOR）
  type: rule
  source_chapter: ch8.7.3 / 8.7.4 · p323, p324
  source_quote: "ROUND（取整）和 TRUNC（截尾取整）……CEIL 和 FLOOR（浮点数向上和向下取整）。"
  summary: 类型转换须区分取整语义：ROUND 四舍五入到最近整数、TRUNC 截尾（丢小数）、CEIL 向上取整、FLOOR 向下取整；转换结果超出目标数据类型范围时 ENO=0。浮点常数有效位数 Real≤6、LReal≤15。
  tags: [rule, datatype, conversion, rounding]
  task_ids: [T02]
