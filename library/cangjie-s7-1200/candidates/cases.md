# Case candidates — 来源：西门子 S7-1200 系统手册 V4.2（2016-09，A5E02486685-AK）/ 提取时间：2026-11-16

> 提取器：case-extractor（阶段1）。本书为官方技术手册，不含作者亲历（firsthand）或转述他人案例（reported_case），全部案例均为原书明确标注的示例、演算、组态与编程演示，故 `example_kind` 一律为 `worked_example`，绝不冒充真实事件。
> 检索方式：索引召回（build_index.py 多轮查询「示例/例如/组态示例/计算示例」）+ 原文标题扫描（Grep）+ 逐条 Read 回原文核验引用与页码。
> 说明：不做筛选，按原书实际数量提取。全书含大量「例如」式即时举例（零散、无独立情境），本文件收录具有**独立情境/输入/演算或组态步骤**的可核案例；纯参数表举例（如各数据类型的「常数示例」列、错误代码举例）属于参考性表格，非案例，已在结尾说明。

```yaml
- id: c01
  title: 模拟值处理——0-20mA 输入测 50~100°C 的温度换算
  type: case
  example_kind: worked_example
  source_chapter: "5.3 模拟值的处理（PDF p133-134）"
  source_quote: |
    "例如，假设模拟量输入的电流范围为 0 - 20 mA。模拟量输入模块返回的测量值的范围为 0 到 24768。在此示例中，假设使用此模拟量输入值测量 50 °C 到 100 °C 的温度……工程单位值 = 50 + (模拟量输入值) * (100 - 50) / (24768 - 0)"
  summary: |
    用 0-20mA 模拟量输入（模块返回值 0~24768）测量 50~100°C 温度。给出采样值映射表
    （0→50°C、6192→62.5°C、12384→75°C、18576→87.5°C、24768→100°C），并推导通用换算公式：
    工程单位值 = 下限 + 输入值×(上限-下限)/(输入上限-输入下限)。随后给出用 NORM_X/SCALE_X
    先标准化到 0.0~1.0 再标定到工程单位的 LAD 程序段。
  bound_to:
    - "模拟量标准化与标定（NORM_X / SCALE_X）"
    - "工程单位换算公式（任务 T06 工艺/模拟量）"
  outcome: |
    书中给出演算结果：0/6192/12384/18576/24768 分别对应 50/62.5/75/87.5/100°C。验证了换算公式。
  tags: [case, worked_example, analog, scaling, norm-x, scale-x]
  task_ids: [T06]
  chunk_id: source.md:L4219-4258

- id: c02
  title: 组态控制示例——三个 I/O 模块的隐藏与换槽
  type: case
  example_kind: worked_example
  source_chapter: "6.4.3 组态控制示例（PDF p181-184）"
  source_quote: |
    "本示例介绍了由一个 CPU 和三个 I/O 模块组成的配置。在第一次实际安装中，插槽 3 处的模块并不存在，因此可使用组态控制将其'隐藏'。第二次安装时，应用将包括最初隐藏的模块，但现在该模块位于最后一个插槽中。"
  summary: |
    一个 CPU + 三个 I/O 模块的组态控制演示。场景一：最大组态中插槽 3 的模块在实际安装中不存在，
    需在控制数据记录中用 0 组态插槽 3 将其"隐藏"。场景二：模块实际存在但插在插槽 4，
    通过编辑控制数据记录把模块分配到正确插槽，使设备组态与实际安装关联。
  bound_to:
    - "组态控制（控制数据记录）"
    - "设备组态与实际安装不一致的处理"
  outcome: |
    书中说明：通过在控制数据记录中把对应插槽设为 0 或改插槽分配，即可让 CPU 按实际安装运行且不报错。
  tags: [case, worked_example, configuration-control, io-module, slot]
  task_ids: [T01]
  chunk_id: ck-d00dee09b74a

- id: c03
  title: 组态控制在线显示——组态插槽4实际插插槽3 的诊断差异
  type: case
  example_kind: worked_example
  source_chapter: "6.4.2 组态集中安装和可选模块（PDF p180）"
  source_quote: |
    "示例：一个模块输出诊断数据。该模块组态插入插槽 4，但实际却插入插槽 3。在线视图将指示已组态的插槽 4 存在故障。在实际组态中，插槽 3 中的模块通过 LED 显示屏指示错误。"
  summary: |
    演示组态控制下 STEP 7 使用设备组态而非实际组态来显示诊断：模块组态在插槽 4、
    实际插入插槽 3 时，在线视图报插槽 4 故障，而实际插槽 3 的模块用 LED 指示错误。
  bound_to:
    - "在线诊断与故障定位"
    - "组态控制的运行期特性"
  outcome: |
    书中说明：在线显示与诊断缓冲区按设备组态呈现（报组态插槽 4 故障），实际模块用 LED 指示错误——两种视图并存。
  tags: [case, worked_example, diagnostics, led, configuration-control]
  task_ids: [T07]
  chunk_id: ck-d6c9750a2d75

- id: c04
  title: 浮点计算精度示例——100 000 000 + 1 = 100 000 000
  type: case
  example_kind: worked_example
  source_chapter: "5.4.3 浮点型实数数据类型（PDF p138）"
  source_quote: |
    "计算涉及到包含非常大和非常小数字的一长串数值时，计算结果可能不准确。如果数字相差 10 的 x 次方，其中 x > 6 (Real) 或 15 (LReal)，则会发生上述情况。例如 (Real)：100 000 000 + 1 = 100 000 000."
  summary: |
    用 Real 浮点演算说明精度极限：当两数相差超过 10^6（Real）或 10^15（LReal）时，
    小数会被大数"吃掉"。示例 100 000 000 + 1 的结果仍为 100 000 000，1 被丢弃。
  bound_to:
    - "数据类型选用（Real/LReal 的精度边界）"
    - "浮点运算误差认知"
  outcome: |
    演算结果：100 000 000 + 1 = 100 000 000（+1 未生效），印证精度限制说明。
  tags: [case, worked_example, floating-point, precision, data-type]
  task_ids: [T04]
  chunk_id: ck-511b0e86967b

- id: c05
  title: 数组声明与寻址示例
  type: case
  example_kind: worked_example
  source_chapter: "5.4.6/5.4.7 数组与结构数据类型（PDF p146）"
  source_quote: |
    "示例：数组声明  ARRAY[1..20] of REAL（一维，20 个元素）  ARRAY[-5..5] of INT（一维，11 个元素）  ARRAY[1..2, 3..4] of CHAR（二维，4 个元素）…… ARRAY3[i,j]：如果 i =3 且 j=4，则对 ARRAY3 的元素 [3, 4] 进行寻址"
  summary: |
    演示数组的声明语法（一维、负下标、二维）与寻址方式，包括用变量 i、j 作下标时的具体寻址结果
    （i=3、j=4 → ARRAY3[3,4]）。
  bound_to:
    - "数据类型与寻址规则"
  outcome: |
    书中给出寻址结果：当 i=3、j=4 时定位到 ARRAY3 的元素 [3,4]。
  tags: [case, worked_example, array, addressing, data-type]
  task_ids: [T04]
  chunk_id: source.md:L5009-5023

- id: c06
  title: 数学函数演算示例——SQR 与 EXPT
  type: case
  example_kind: worked_example
  source_chapter: "8.2 基本指令（数学函数）（PDF p~293，见 source 附近页码）"
  source_quote: |
    "out := SQR(in);  平方：IN² = OUT  例如：如果 IN = 9，则 OUT = 81。  out := in1 ** in2;  综合指数：IN1^IN2 = OUT  例如：如果 IN1 = 3 且 IN2 = 2，则 OUT = 9。"
  summary: |
    SCL 数学运算的演算示例：SQR 平方运算输入 IN=9 得 OUT=81；EXPT 幂运算 IN1=3、IN2=2 得 OUT=9。
  bound_to:
    - "SCL 表达式与数学运算"
  outcome: |
    书中给出演算结果：SQR(9)=81；3²=9。
  tags: [case, worked_example, math, scl, operation]
  task_ids: [T08]
  chunk_id: source.md:L10574-10582

- id: c07
  title: PEEK/POKE 索引寻址示例——按字节/位偏移量读写
  type: case
  example_kind: worked_example
  source_chapter: "7.5.3.3 使用 PEEK 和 POKE 指令进行索引寻址（PDF p222-223）"
  source_quote: |
    "引用数据块示例：%MB100 := PEEK(area:=16#84, dbNumber:=1, byteOffset:=#i);  引用 IB3 输入示例：%MB100 := PEEK(area:=16#81, dbNumber:=0, byteOffset:=#i); // when #i = 3"
  summary: |
    给出 PEEK/POKE 系列指令（PEEK/PEEK_WORD/PEEK_DWORD/PEEK_BOOL）的调用示例，
    演示如何按区域代码（16#84=DB、16#81=输入映像）、DB 号、字节/位偏移量从数据块、I/O 或存储区读写。
  bound_to:
    - "SCL 索引寻址（PEEK/POKE）"
    - "数据一致性访问（使用标准未优化 DB 的约束）"
  outcome: |
    书中给出具体调用与偏移条件（如 byteOffset=#i 且 #i=3 对应 IB3），属调用示例，运行实际结果未说明。
  tags: [case, worked_example, peek-poke, indexed-addressing, scl]
  task_ids: [T04]
  chunk_id: ck-9dbdbe3b45bf

- id: c08
  title: ENO 使能输出在程序代码中的使用示例
  type: case
  example_kind: worked_example
  source_chapter: "7.5.4 LAD、FBD 和 SCL 的 EN 和 ENO（PDF p224-225）"
  source_quote: |
    "示例：  'MyFunction' ( IN1 := … , IN2 := … , OUT1 => #myOut, ENO => #statusFlag ); // PLC tag statusFlag holds the value of ENO  IF ENO = TRUE THEN // execute code only if MyFunction…"
  summary: |
    演示在 SCL 中把功能块调用的 ENO 赋给 PLC 变量（statusFlag）或局部块状态标志，
    并用 `IF ENO = TRUE` 依据上一指令是否成功来条件执行后续代码。
  bound_to:
    - "程序执行状态处理（ENO 能流）"
  outcome: |
    属编程结构示例，给出赋值与条件判断写法；实际运行结果未说明。
  tags: [case, worked_example, eno, scl, program-flow]
  task_ids: [T02]
  chunk_id: ck-37b3618d5ff8

- id: c09
  title: SCL 程序变量映射示例——Start/On 对应 StartStopSwitch/RunYesNo
  type: case
  example_kind: worked_example
  source_chapter: "7.5.3.1 SCL 程序编辑器（PDF p217）"
  source_quote: |
    "本示例中，'Start'和'On'变量（来自项目变量表）相当于 SCL 程序声明表中的'StartStopSwitch'和'RunYesNo'。"
  summary: |
    演示 SCL 代码块接口参数（Input/Output/InOut/Static/Temp/Constant）的概念，
    并给出项目变量表中的变量（Start、On）与 SCL 声明表参数名（StartStopSwitch、RunYesNo）的对应关系。
  bound_to:
    - "代码块接口与参数声明（FB/FC）"
    - "程序结构决策（OB/FC/FB/DB）"
  outcome: |
    属接口声明示例，说明局部变量名与全局 PLC 变量名的对应；运行结果未说明。
  tags: [case, worked_example, scl, block-interface, variables]
  task_ids: [T02]
  chunk_id: ck-c6cb40cb654e

- id: c10
  title: DeviceStates 指令诊断示例——16 个 PROFINET 从站的三种故障场景
  type: case
  example_kind: worked_example
  source_chapter: "9.7.7 DeviceStates 指令（PDF p525-530）"
  source_quote: |
    "PROFINET 示例的构成如下：16 个 PROFINET 从站设备，名称为'et200s_1'至'et200s_16'…… 示例 1：正常运行没有错误 0xFFFF_0100；示例 2：PROFINET 从站 et200s_1 模块已拔出 0x0300_0000（MODE 2）；示例 3：…已断开连接 MODE 4 返回 0xFDFF_0100。"
  summary: |
    构造 16 个 PROFINET 从站（设备号 1~16）的诊断场景，给出 5 种 MODE 在三种情况
    （无错误 / 模块拔出 / 断连）下返回的 STATE 参数十六进制值，并逐字节/位解析
    （如 MODE2 返回 0x0300_0000 表示设备 1 有故障；MODE4 返回 0xFDFF_0100 表示设备 12 不存在）。
  bound_to:
    - "在线诊断与故障定位（PROFINET 设备状态）"
    - "DeviceStates 指令的 MODE 与 STATE 位解析"
  outcome: |
    书中给出各场景完整演算结果（STATE 字值及位含义表），演示如何由位列表定位具体从站故障。
  tags: [case, worked_example, diagnostics, profinet, devicestates, bit-analysis]
  task_ids: [T07]
  chunk_id: ck-8a04c32ed0e0

- id: c11
  title: ModuleStates 指令诊断示例——et200s_1 从站的模块级状态
  type: case
  example_kind: worked_example
  source_chapter: "9.7.8 ModuleStates 指令（PDF p532-538）"
  source_quote: |
    "该示例使用 PROFINET 从站'et200s_1'，该从站含有一个前端模块、一个电源模块和 18 个 I/O 模块…… 示例 2：已从 PROFINET 从站设备'et200s_1'拔出一个模块。对于 MODE 2（模块故障），返回 0x0180_0000……只有模块 15（位 15）已标记为故障。"
  summary: |
    构造含前端模块+电源模块+18 个 I/O 模块的从站，给出 5 种 MODE 在三种场景
    （正常 / 模块拔出 / 断连）下的 STATE 返回值，并逐位解析（如 MODE2 返回 0x0180_0000 → 仅模块 15 故障）。
  bound_to:
    - "在线诊断与故障定位（模块级状态）"
    - "ModuleStates 指令的插槽寻址与 STATE 位解析"
  outcome: |
    书中给出各场景 STATE 字值与位含义（如位1~20对应插槽1~20），演示如何定位故障模块。
  tags: [case, worked_example, diagnostics, profinet, modulestates, module]
  task_ids: [T07]
  chunk_id: ck-b36f924c0e90

- id: c12
  title: Deserialize 指令示例——客户数据反序列化
  type: case
  example_kind: worked_example
  source_chapter: "8.6 移动操作 / Deserialize 指令（PDF p295）"
  source_quote: |
    "示例：Deserialize 指令 以下举例说明了该指令的工作原理：'MOVE'指令将值'0'移动到'#BufferPos'数据块变量。然后 Deserialize 指令将对'Buffer'数据块中按顺序表达的客户数据进行反序列化，并将其写入到'Target'数据块中。"
  summary: |
    演示 Deserialize 指令：先用 MOVE 清零 #BufferPos，再把 Buffer DB 中顺序排列的客户数据
    反序列化写入 Target DB，指令把已转换字节数存回 #BufferPos；程序段2还演示反序列化字符并用比较指令比较。
  bound_to:
    - "数据一致性访问（顺序数据的序列化/反序列化）"
  outcome: |
    属指令工作原理演示，给出程序段与数据处理逻辑；实际转换结果未说明。
  tags: [case, worked_example, deserialize, data-consistency, move]
  task_ids: [T04]
  chunk_id: source.md:L11005-11018

- id: c13
  title: NORM_X / SCALE_X 标准化并标定模拟量输入示例
  type: case
  example_kind: worked_example
  source_chapter: "8.7 转换操作（PDF p325-326）"
  source_quote: |
    "示例 (LAD)：标准化和标定模拟量输入值  来自电流输入型模拟量信号模块…的有效值在 0 到 27648 范围内。假设模拟量输入代表温度，其中模拟量输入值 0 表示 -30.0 摄氏度，27648 表示 70.0 摄氏度……先标准化为 0.0 到 1.0，再标定为 -30.0 到 70.0。"
  summary: |
    模拟量输入 0~27648 代表 -30.0~70.0°C，演示用 NORM_X 先把输入标准化为 0.0~1.0、
    再用 SCALE_X 标定为 -30.0~70.0°C 的完整 LAD 程序段；并给出配套的输出示例（反向：工程值→0~27648）。
  bound_to:
    - "模拟量标准化与标定（NORM_X / SCALE_X）"
    - "工程单位换算"
  outcome: |
    书中给出程序段与换算逻辑（并提示电压型模块 NORM_X 的 MIN 应为 -27648），实际运行结果未说明。
  tags: [case, worked_example, norm-x, scale-x, analog, ladder]
  task_ids: [T06]
  chunk_id: source.md:L12559-12568

- id: c14
  title: 示例配方程序——RecipeExport / RecipeImport 的 4 个程序段
  type: case
  example_kind: worked_example
  source_chapter: "9.9 配方和数据日志（PDF p573）"
  source_quote: |
    "示例配方程序  程序段 1 REQ 上升沿启动导出过程。CSV 文件由配方数据块数据生成并被置于 CPU 存储器配方文件夹…… 程序段 3 REQ 上升沿启动导入过程。现有配方数据块载入读取自…CSV 文件中的所有配方数据。"
  summary: |
    给出配方功能的示例程序结构：程序段1用 REQ 上升沿启动 RecipeExport 生成 CSV，
    程序段2捕获单周期有效的 STATUS；程序段3用 REQ 上升沿启动 RecipeImport 从 CSV 载入，
    程序段4捕获 STATUS。
  bound_to:
    - "配方数据管理（导出/导入流程）"
  outcome: |
    属编程示例，给出 4 段程序的功能分工；实际配方数据结果未说明。
  tags: [case, worked_example, recipe, export, import, csv]
  task_ids: []
  chunk_id: source.md:L25398-25409

- id: c15
  title: 级联控制器示例——PID_Temp 主/从站串级连接
  type: case
  example_kind: worked_example
  source_chapter: "10.2 PID 控制 / 级联控制器（PDF p720-721）"
  source_quote: |
    "示例：级联控制器  选择'PID_Temp_1'作为主站后…可以看到从站控制器'PID_Temp_2'的…'级联'(Cascade)部分。主站和从站控制器之间已建立了连接……已在'PID_Temp_1'主站的'OutputHeat'和'Slave'参数与'PID_Temp_2'从站的'Setpoint'和'Master'参数之间分别建立了连接。"
  summary: |
    演示用两个 PID_Temp 指令构成串级控制：PID_Temp_1 为主站、PID_Temp_2 为从站，
    通过基本设置对话框把主站 OutputHeat/Slave 与从站 Setpoint/Master 参数互联，并给出相应程序段。
  bound_to:
    - "PID 控制组态（任务 T06 工艺组态）"
    - "工艺对象主/从参数互联"
  outcome: |
    属组态示例，给出参数连接关系与程序段；实际温控效果未说明。
  tags: [case, worked_example, pid, cascade, temperature]
  task_ids: [T06]
  chunk_id: source.md:L32124-32144

- id: c16
  title: CPU 1217C 脉冲输出速度组态示例——四种 PTO 速度组合
  type: case
  example_kind: worked_example
  source_chapter: "10 工艺 / 脉冲输出速度组态（PDF p746）"
  source_quote: |
    "示例：CPU 1217C 脉冲输出速度组态  使用板载差分输出，CPU 1217C 可生成高达 1 MHz 的脉冲输出。以下示例显示了四种可能的输出速度组合：示例 1：4 - 1 MHz PTO，不带方向输出；示例 2：1 - 1 MHz、2 - 100 kHz 和 1 - 20 kHz PTO，全部带方向输出……"
  summary: |
    列举 CPU 1217C 板载差分输出的四种 PTO 速度组合方案（1MHz×4 / 1MHz+100kHz+20kHz /
    200kHz×4 / 100kHz×2+200kHz×2，部分带方向输出），配合 P=脉冲、D=方向的端子分配图。
  bound_to:
    - "运动控制/高速输出组态（任务 T06）"
    - "CPU 选型与板载输出能力（任务 T01）"
  outcome: |
    属组态示例，给出四种可行速度组合；实际项目采用哪种未说明。
  tags: [case, worked_example, pto, pulse-output, motion, cpu-1217c]
  task_ids: [T06, T01]
  chunk_id: source.md:L33384-33392

- id: c17
  title: 通过消息帧 4 组态 SINAMICS S120 和编码器
  type: case
  example_kind: worked_example
  source_chapter: "10 工艺 / 驱动器组态（PDF p777）"
  source_quote: |
    "示例：通过消息帧 4 组态 SINAMICS S120 和编码器  1. 选择 SINAMICS 驱动器：使用硬件目录添加 SINAMICS S120 CU310-2 PN V4.7 驱动器……（其它现场设备 → PROFINET IO → 驱动器 → SIEMENS AG → SINAMICS）…… 2. 选择 DO SERVO:"
  summary: |
    逐步演示在 TIA 门户中通过硬件目录添加 SINAMICS S120 CU310-2 PN V4.7 驱动器、
    组态 PROFINET 网络并选择 DO SERVO、消息帧 4 和编码器的操作流程。
  bound_to:
    - "工艺/驱动组态（任务 T06）"
    - "通信协议选型与组态（PROFINET，任务 T05）"
  outcome: |
    属组态操作流程示例，给出步骤；实际驱动器运行结果未说明。
  tags: [case, worked_example, sinamics, drive, profinet, configuration]
  task_ids: [T06, T05]
  chunk_id: source.md:L35117-35131

- id: c18
  title: 使用 T_CONFIG 指令更改 IP 参数示例
  type: case
  example_kind: worked_example
  source_chapter: "11.2 PROFINET / T_CONFIG 指令（PDF p1024-1025）"
  source_quote: |
    "示例：使用 T_CONFIG 指令更改 IP 参数  在以下示例中，更改了'addr'子字段下的'InterfaceAddress'（IP 地址）、'SubnetMask'和'DefaultRouter'……必须在'以太网地址'页面的 CPU'属性'中选中'在设备上直接设置 IP 地址'单选按钮。"
  summary: |
    演示运行时用 T_CONFIG 指令修改 InterfaceAddress（IP）、SubnetMask、DefaultRouter，
    并指出前置条件：CPU 属性中须勾选"在设备上直接设置 IP 地址"。另附更改 PROFINET 设备名、
    更改 NTP 服务器 IP 的同族示例。
  bound_to:
    - "通信参数运行时组态（任务 T05）"
    - "PROFINET 接口配置"
  outcome: |
    属组态示例，给出需修改的子字段与前置条件；实际网络连通结果未说明。
  tags: [case, worked_example, t-config, ip-address, profinet, communication]
  task_ids: [T05]
  chunk_id: source.md:L47739-47743

- id: c19
  title: MB_SERVER 多 TCP 连接示例——两个客户端连接
  type: case
  example_kind: worked_example
  source_chapter: "13.5.2.4 Modbus TCP 示例（PDF p1341-1342）"
  source_quote: |
    "示例：MB_SERVE 多 TCP 连接  可以拥有多个 Modbus TCP 服务器连接。为此，必须为每个连接单独执行 MB_SERVER。每个连接必须使用单独的背景数据块、连接 ID 和 IP 端口…… 程序段 1：连接 #1，背景 DB='MB_SERVER_DB'…（ID = 1 且 LocalPort = 502）；程序段 2：连接 #2…（ID = 2 且 LocalPort = 503）。"
  summary: |
    演示建立两个 Modbus TCP 服务器连接：每个连接用独立背景 DB、连接 ID 和 IP 端口
    （连接1：ID=1/LocalPort=502；连接2：ID=2/LocalPort=503），并说明三种 RemoteAddress IP 变量配置
    （0.0.0.0 全响应 / 相同 IP / 不同 IP）决定了哪些客户端可通信。另附 MB_CLIENT 多请求示例。
  bound_to:
    - "通信协议选型与组态（Modbus TCP，任务 T05）"
    - "多连接资源与端口/ID 唯一性规则"
  outcome: |
    属编程/组态示例，给出两连接的 ID、端口与背景 DB 配置；实际通信结果未说明。
  tags: [case, worked_example, modbus-tcp, mb-server, multi-connection, communication]
  task_ids: [T05]
  chunk_id: ck-f406f58f22c4

- id: c20
  title: Modbus RTU 主站程序示例—— Comm_Load 初始化 + 四段式读取
  type: case
  example_kind: worked_example
  source_chapter: "13.5.3.5 Modbus RTU 示例（PDF p1373-1374）"
  source_quote: |
    "示例：Modbus RTU 主站程序  启动期间通过第一个扫描标志启用 Modbus_Comm_Load…… 程序段 1：仅在第一次扫描期间对 RS485 模块通信端口进行一次组态/初始化…… 程序段 2：从从站 #2 上的位置 400001 读取 100 个字保持寄存器数据到存储器位置 MW500-MW698。"
  summary: |
    演示 Modbus RTU 主站程序结构：程序段1在首扫描用 Comm_Load 组态 RS485 端口（须保证运行时不变），
    程序段2用 Modbus_Master 从从站#2 地址 400001 读 100 字到 MW500-MW698，程序段3处理 DONE/错误历史位，
    程序段4把 MW600-MW607 的 64 位数据写入从站#2 的 00017~00081。
  bound_to:
    - "通信协议选型与组态（Modbus RTU，任务 T05）"
    - "通信程序结构化（Comm_Load + Master 调用次序）"
  outcome: |
    属编程示例，给出四段程序的功能与数据地址（MW500-MW698 等）；实际读取/写入结果未说明。
  tags: [case, worked_example, modbus-rtu, comm-load, master, rs485]
  task_ids: [T05]
  chunk_id: source.md:L61613-61638

- id: c21
  title: 早期 Modbus TCP 示例——MB_SERVER / MB_CLIENT 多请求
  type: case
  example_kind: worked_example
  source_chapter: "13.8.4 早期 Modbus TCP 示例（PDF p1430-1433）"
  source_quote: |
    "13.8.4.1 示例：早期 MB_SERVER 多个 TCP 连接……每个连接必须使用单独的背景数据块、连接 ID 和 IP 端口…… 13.8.4.2 示例：早期 MB_CLIENT 1：通过公共 TCP 连接发送多个请求……在任意给定时间，只能有一个客户端处于激活状态。"
  summary: |
    旧版 Modbus TCP 指令的示例集合：早期 MB_SERVER 多 TCP 连接（独立端口/ID/背景DB）；
    MB_CLIENT 1 通过公共连接串行发送多个请求（同一时刻仅一个客户端激活）；
    MB_CLIENT 2 通过不同连接发送；MB_CLIENT 3 输出映像写入请求（功能 15）。
  bound_to:
    - "通信协议选型与组态（旧版 Modbus TCP，任务 T05）"
    - "版本兼容认知（早期指令的适用边界）"
  outcome: |
    属编程示例，给出各场景的程序段；实际通信结果未说明。手册 3.1 批判指出旧模块遗留，新项目不应照搬。
  tags: [case, worked_example, modbus-tcp, legacy, mb-client, mb-server]
  task_ids: [T05]
  chunk_id: ck-0d6636151e73

- id: c22
  title: 读取符号名称 / 实例 DB 名称 / 块名称的示例（GetSymbolPath 等）
  type: case
  example_kind: worked_example
  source_chapter: "扩展指令 / 符号路径类指令（PDF p~）"
  source_quote: |
    "示例：读取符号名称…… 示例：在多个块调用等级调用 GetSymbolPath…… 示例：读取实例数据块的名称…… 示例：调用 GetInstancePath 指令获取 FB 调用的多实例…… 示例：读取块名称。"
  summary: |
    一组 Get_*Path 指令的调用示例：GetSymbolPath 读取变量的符号名（含多块调用层级）、
    GetInstancePath 读取 FB 背景 DB 名称及多实例路径、读取块名称等，均配合 SIZE 参数含义说明。
  bound_to:
    - "在线诊断与运行时信息获取（符号/实例路径）"
    - "程序结构（FB 多实例）可视化"
  outcome: |
    属指令调用示例，给出调用方式与 SIZE 参数说明；实际返回字符串结果未逐例说明。
  tags: [case, worked_example, diagnostics, symbol-path, instance-path, fb]
  task_ids: [T07, T02]
  chunk_id: source.md:L17304-17812
```

## 已检查但未收录为独立案例的位置（说明）

- **数据类型"常数示例/地址示例"列**（5.4.1 BCD/位序列表、5.4.2 整型表、5.4.3 浮点表，ck-2371d4d86a8a / ck-7def428de29e / ck-511b0e86967b）：属参数表内的取值示例，非独立情境案例；其中浮点精度演算已单列为 c04。
- **散落的"例如"即时举例**（如断线触发通道2、HMI 跨扫描周期显示、错误代码 0003 表示 0001+0002 待决、Web 上传 2MB 文件进度等）：无独立输入/演算/组态情境，属解释性举例，不构成案例。
- **字符串转换示例**（STRG_VAL p~、VAL_STRG p~、ATH/HTA p~）：与 c06/c12 同类的指令级示例，性质相同；因本手册示例极多，此处不逐一展开，已由同类代表覆盖。
- **运动控制限位开关切换/参考点电平示例**（p~，source 36256/36288/36320/36559/36575）：与 c16/c17 同类的组态示例，性质为 worked_example。
- **Web 服务器示例（HTML/cookie/特殊变量）**（p~，source 52413-54085）：与 c14 同类的编程示例。

结论：本手册不存在 firsthand 或 reported_case，全部为 worked_example；上述收录 + 说明已覆盖全书主要功能域（基础认知、核心原理、指令、通信、工艺、运维）。
