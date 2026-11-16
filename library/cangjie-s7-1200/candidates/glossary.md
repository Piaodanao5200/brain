# Glossary candidates — 来源：西门子 S7-1200 系统手册 V4.2（A5E02486685-AK, 2016-09，正文 p29–1534）/ 提取时间：2026-11-16 / extractor: glossary-extractor
#
# 说明：每条 author_definition 尽量采用书中原文片段；核心字段为 key_distinction（作者用法 vs 常识用法）与 why_it_matters（下游 skill 用途）。
# 来源章节页码为 PDF 文件页序，与原文 <!-- PDF_PAGE --> 标记一致。

- id: g01
  term: OB（组织块 / Organization Block）
  type: term
  source_chapter: "ch5.1.3 / ch7.3.1，PDF p89、p98、p204"
  author_definition: |
    "组织块 (OB) 定义程序的结构。有些 OB 具有预定义的行为和启动事件，但用户也可以创建具有自定义启动事件的 OB。"（p89）
    "组织块为程序提供结构。它们充当操作系统和用户程序之间的接口。OB 是由事件驱动的。事件（如诊断中断或时间间隔）会使 CPU 执行 OB。"（p204）
    "OB 控制用户程序的执行。CPU 中的特定事件将触发组织块的执行。OB 无法互相调用或通过 FC 或 FB 调用。"（p98）
  key_distinction: |
    ≠ "主函数 / main()" — OB 不是被程序调用的普通函数，而是由事件触发、由操作系统调度的入口。
    ≠ 可互相调用的子程序 — OB 之间不能互相调用，也不能被 FC/FB 调用；只有对应事件（程序循环、启动、诊断中断、时间间隔等）才能启动它。
    = 带调度语义的事件入口：每个 OB 有编号、启动事件和优先级（1~26，程序循环最低、时间错误 22/26、MC 伺服 25），CPU 按优先级高低执行，同级先到先得。
    = 类型固定分工：程序循环 OB（如 OB1 反复执行）、启动 OB（STOP→RUN 执行一次）、各类中断/错误 OB（事件驱动）。
  why_it_matters: |
    程序结构决策 skill（T02）必须先讲清 OB 是"事件入口"而非"函数"，否则会把中断 OB 误当成可被调用的子程序，设计出错误的调用结构。
    实时性评估（T03）依赖 OB 的优先级/事件语义：低优先级程序循环 OB 会被高优先级中断 OB 打断，并在中断点续执行。
  tags: [term, core-concept, program-structure, event-driven]

- id: g02
  term: 中断 OB 与事件优先级/排队
  type: term
  source_chapter: "ch5.1.3 / ch5.1.3.15，PDF p98、p114–p116"
  author_definition: |
    "CPU 按照 OB 对应的优先级对其进行处理，遵从高优先级在前低优先级在后的顺序执行 OB。最低优先等级为 1（对应主程序循环），最高优先等级为 26。"（p98）
    "中断可能发生在扫描周期的任何阶段，并且由事件驱动。事件发生时，CPU 将中断扫描循环，并调用被组态用于处理该事件的 OB。OB 处理完该事件后，CPU 从中断点继续执行用户程序。"（p97）
    "CPU 通过各种事件类型的不同队列限制单一来源的未决（排队的）事件数量。达到给定事件类型的未决事件限值后，下一个事件将丢失。"（p114）
  key_distinction: |
    ≠ "异常捕获 / try-catch" — 中断 OB 是硬件/系统事件驱动的例行入口，不限于错误；且 CPU 按固定优先级调度，而非代码位置决定。
    ≠ "无限嵌套" — 从中断事件 OB 起的嵌套深度最多 6（从程序循环/启动 OB 起为 16）；且从 V4.0 起可组态 OB 是否可中断，时间错误 OB 默认不能中断非程序循环 OB。
    = 事件会排队、有上限，队列溢出可用时间错误 OB（OB80）响应；同优先级先到先得。
  why_it_matters: |
    实时性与排障 skill（T03/T07）需要区分"中断打断 → 断点续执行"与"程序顺序执行"；诊断队列溢出、时间错误事件也必须落到对应 OB 而非当作普通报警。
  tags: [term, core-concept, interrupt, priority, real-time]

- id: g03
  term: FC（功能 / Function）
  type: term
  source_chapter: "ch5.1 / ch7.3.2，PDF p89、p205"
  author_definition: |
    "功能 (FC) 是通常用于对一组输入值执行特定运算的代码块。FC 将此运算结果存储在存储器位置。"（p205）
    "FC 不具有相关的背景数据块 (DB)。对于用于计算该运算的临时数据，FC 采用了局部数据堆栈。不保存临时数据。要长期存储数据，可将输出值赋给全局存储器位置，如 M 存储器或全局 DB。"（p205）
    "FC 不与任何特定数据块 (DB) 相关联。"（p89）
  key_distinction: |
    ≠ 通用编程里的"函数" — FC 没有自己的静态存储：临时数据存在局部数据栈、块结束即丢失，不跨扫描保留。
    ≠ FB — 无背景 DB，因此无"实例"概念；输出必须写入 M 区或全局 DB 才能长期保存。
    = 一次性、无状态的可复用运算块，靠参数传入传出。
  why_it_matters: |
    T02 结构决策中"何时用 FC 何时用 FB"的分水岭就是"是否需要跨扫描保存状态"；若按常识把 FC 当普通函数、默认它能记住上次值，会写出丢数据的程序。
  tags: [term, core-concept, program-structure, stateless]

- id: g04
  term: FB（功能块 / Function Block）与实例
  type: term
  source_chapter: "ch5.1 / ch7.3.3，PDF p89、p206"
  author_definition: |
    "FB 还使用相关联的数据块（称为背景数据块）来保存该 FB 调用实例的数据值。可多次调用 FB，每次调用都采用唯一的背景数据块。调用带有不同背景数据块的同一 FB 不会对其它任何背景数据块的数据值产生影响。"（p89）
    "功能块 (FB) 是使用背景数据块保存其参数和静态数据的代码块。FB 具有位于数据块 (DB) 或'背景'DB 中的变量存储器。背景 DB 提供与 FB 的实例（或调用）关联的一块存储区并在 FB 完成后存储数据。"（p206）
  key_distinction: |
    ≠ 普通"函数" — FB 自带背景 DB 保存参数与静态数据，值跨扫描保留，同一 FB 配不同背景 DB 可控制多台设备且互不干扰（可重入）。
    ≠ FC — 有状态、有实例；Input/Output/InOut 与静态参数都存背景 DB（临时存储器不存）。
    = "实例 = FB 的一次调用 + 专属背景 DB"，这是 S7 面向对象式复用的核心。
  why_it_matters: |
    T02 "一个 FB 控制多台泵/阀"的决策完全依赖实例概念；下游 skill 须强调"每次调用必须指定唯一背景 DB"，否则多台设备会共享数据互相覆盖。
  tags: [term, core-concept, program-structure, stateful, reentrancy]

- id: g05
  term: 背景 DB / 实例数据块（Instance DB）
  type: term
  source_chapter: "ch5.1 / ch7.3.4，PDF p89、p207"
  author_definition: |
    "背景 DB 存储特定 FB 的数据。背景 DB 中数据的结构反映了 FB 的参数（Input、Output 和 InOut）和静态数据。（FB 的临时存储器不存储在背景 DB 中。）"（p207）
    "以存储特定功能块 (FB) 的数据。用户程序中的所有程序块都可访问全局 DB 中的数据，而背景 DB 仅存储特定功能块 (FB) 的数据。"（p207）
  key_distinction: |
    ≠ "私有数据" — 虽然背景 DB 由某个 FB 实例专用，但书中明确"任何代码块都可访问背景 DB 中的数据"，并非访问隔离。
    ≠ 全局 DB — 全局 DB 存所有块共享数据；背景 DB 结构由 FB 接口决定、专属一次 FB 调用。
    = 既是 FB 实例的状态载体，又可被其他块读取（只是语义上属于该实例）。
  why_it_matters: |
    T02 与诊断 skill 需要提醒：共享背景 DB 时不要误以为数据受保护；FB 间数据串扰的根因常是复用了同一背景 DB。
  tags: [term, core-concept, data-block, instance]

- id: g06
  term: DB（数据块 / Data Block）
  type: term
  source_chapter: "ch5.1 / ch7.3.4，PDF p89、p207–p208"
  author_definition: |
    "数据块 (DB) 存储程序块可以使用的数据。"（p89）
    "有两种类型的 DB：全局 DB 存储程序中代码块的数据。任何 OB、FB 或 FC 都可访问全局 DB 中的数据。背景 DB 存储特定 FB 的数据。"（p207）
  key_distinction: |
    ≠ 普通意义上的"数据库/数据表" — DB 是 CPU 中的一块存储区，用于保存程序运行数据，掉电后当前值不删除（配置保持性后可跨掉电）。
    = 区分全局 DB（所有块可访问）与背景 DB（绑定 FB 实例）；可组态为只读、标准/优化访问。
  why_it_matters: |
    数据类型与寻址规则（T04）、数据一致性（T04）以及 Modbus/PROFINET 数据交换都围绕 DB 展开；下游必须区分"优化访问 DB 无固定地址"这一关键限制。
  tags: [term, core-concept, data-block, storage]

- id: g07
  term: 扫描周期（Scan Cycle / 扫描）
  type: term
  source_chapter: "ch5.1 / ch5.1.2 / ch5.1.4，PDF p89、p97、p117"
  author_definition: |
    "每个周期都包括写入输出、读取输入、执行用户程序指令以及执行后台处理。该周期称为扫描周期或扫描。"（p89）
    "在每个扫描周期中，CPU 都会写入输出、读取输入、执行用户程序、更新通信模块以及响应用户中断事件和通信请求。"（p97）
  key_distinction: |
    ≠ 简单的"循环执行一次程序" — 扫描周期是确定性实时单位：写输出→读输入→执行程序（含通信处理、自诊断），且会被更高优先级中断事件在任何阶段打断。
    ≠ 固定频率 — 各次扫描耗时随程序与通信负载变化，除非组态"最小扫描周期时间"来消除差异。
    = 系统保证在"最大循环时间"内完成，超时生成时间错误事件。
  why_it_matters: |
    T03 实时性评估的全部基础：响应延迟以扫描周期计；高速计数等超过扫描速率的事件必须用 HSC 而非普通指令。
  tags: [term, core-concept, real-time, timing]

- id: g08
  term: 过程映像（Process Image）
  type: term
  source_chapter: "ch5.1.2 / ch5.2.1，PDF p97、p127"
  author_definition: |
    "在每个扫描周期的开始，从过程映像重新获取数字量及模拟量输出的当前值，然后将其写入…物理输出。…随后在该扫描周期中，将读取…输入的当前值，然后将这些值写入过程映像。"（p97）
    "对输入 (I) 或输出 (Q) 存储区（例如 I0.3 或 Q1.7）的引用会访问过程映像。"（p127）
  key_distinction: |
    ≠ "直接读/写物理 I/O" — 普通 I/Q 访问的是周期开始/末刷新的一份内存快照，不是实时物理引脚；要立即访问物理点须加":P"。
    = 输入映像在周期初由物理输入刷新、输出映像在周期末写回物理输出；这带来最多一个扫描周期的延迟与一致性边界。
  why_it_matters: |
    T03/T04 必须区分过程映像与立即外设访问：I/O 响应延迟、数据撕裂、以及"通过指令访问物理输出会同时更新映像"的副作用都源于此。
  tags: [term, core-concept, io, process-image]

- id: g09
  term: ":P 立即外设访问（立即 I/O）"
  type: term
  source_chapter: "ch5.2.1，PDF p127、p130"
  author_definition: |
    "要立即访问物理输入或输出，请在引用后面添加':P'（例如，I0.3:P、Q1.7:P 或 'Stop:P'）。"（p127）
    "通过指令访问物理输入时，指令将访问物理输入的值，但输入过程映像不会更新。…使用 Q_:P 访问既影响物理输出，也影响存储在输出过程映像中的相应值。"（p97、p130）
  key_distinction: |
    ≠ ":P 只是换个地址写法" — 它绕过过程映像直接读物理点：I_:P 不更新输入映像，Q_:P 同时更新物理输出和映像。
    ≠ 普通 I/Q 的周期刷新语义 — :P 是即时生效、用于精确定时/诊断；但强制(I)只能强制外设输入，不能强制过程映像输入。
  why_it_matters: |
    在线诊断与强制（T07）中"强制 I 点必须写 I_:P"、精确定时控制都要用 :P；误用普通 I/Q 会导致读到陈旧快照、调试结论错误。
  tags: [term, io, process-image, diagnostics]

- id: g10
  term: 过程映像分区（PIP, Process Image Partition）
  type: term
  source_chapter: "ch5.1.2 / ch6.8 / ch10.3.4，PDF p97、p192、p773"
  author_definition: |
    "对于中断事件，如果适用的话，CPU 将读取输入、执行 OB，然后使用关联的过程映像分区 (PIP) 写入输出。"（p97）
    "您还可以将输入和输出分配给过程映像分区（PIP0、PIP1、PIP2、PIP3、PIP4）或自动更新，或者不使用过程映像分区。"（p192）
  key_distinction: |
    ≠ "自动更新的过程映像" — PIP 是可由特定 OB 单独更新的子分区（PIP0~PIP4），与周期自动更新并列；把 I/O 分配给 PIP 后，该 I/O 不再随主扫描自动刷新，而由关联 OB 在事件时刷新。
    = 用于中断 OB 和运动控制（"OB 伺服 PIP"）的"局部、按需刷新"映像，缩短 I/O 响应路径。
  why_it_matters: |
    T03/T06 实时性与运动控制组态：高频 I/O、硬限位开关应分配到 OB 伺服 PIP 才能与工艺对象同步处理，否则响应会滞后一个扫描周期。
  tags: [term, io, process-image, real-time, motion]

- id: g11
  term: 一致性数据（Consistent Data）
  type: term
  source_chapter: "ch9.3.10，PDF p454–p455"
  author_definition: |
    "使用 DPRD_DAT（读取一致性数据）指令一致性地读取一个或多个字节的数据，使用 DPWR_DAT（写入一致性的数据）指令一致性地传送一个或多个字节的数据。"（p454）
    "PROFINET 支持最多 1024 字节的一致性数据。…如果正在对一致性数据使用 DPRD_DAT 和 DPWR_DAT 指令，则必须从过程映像自动更新中删除该一致性数据。"（p455）
  key_distinction: |
    ≠ "一致 = 数值正确" — 这里的"一致性"专指数据传输的原子性：多字节数据在一次操作中整体刷新，不会被扫描/通信中途撕裂。
    ≠ 默认行为 — 普通过程映像刷新不保证跨模块/跨周期一致；要用 DPRD_DAT/DPWR_DAT 必须从过程映像自动更新中删除该区域，否则冲突。
    = S7-1200 一致性外围 I/O 读写仅支持 1、2、4 字节（PROFINET 最高 1024 字节）。
  why_it_matters: |
    T04 数据一致性方案必须显式处理：多字节/跨通信数据若不用一致性指令并脱离自动更新，会出现读写撕裂（半新半旧值）。
  tags: [term, core-concept, data-consistency, communication]

- id: g12
  term: 装载存储器 / 工作存储器 / 保持性存储器（三级存储）
  type: term
  source_chapter: "ch5.1.5，PDF p119–p120"
  author_definition: |
    "装载存储器，用于非易失性地存储用户程序、数据和组态…（位于存储卡或 CPU 中）…断电后继续保持。"（p119）
    "工作存储器是易失性存储器，用于在执行用户程序时存储用户项目的某些内容…将在断电后丢失，而在恢复供电时由 CPU 恢复。"（p119）
    "保持性存储器，用于非易失性地存储限量的工作存储器值。断电过程中，CPU 使用保持性存储区存储所选用户存储单元的值。"（p119）
  key_distinction: |
    ≠ 笼统的"内存/闪存" — 三者分工明确：装载=非易失项目存档（类似硬盘），工作=易失运行区（类似 RAM），保持性=掉电保留的少量运行值。
    ≠ "起始值与当前值在同一处" — 起始值始终在装载存储器，当前值在工作存储器；READ_DBL/WRIT_DBL 就是在两者间搬运。
  why_it_matters: |
    T04 数据一致性、T10 维护（存储卡/掉电恢复）都依赖三级存储模型；选型（工作存储器容量限制程序大小）与"掉电后值是否保留"的判断都由此决定。
  tags: [term, core-concept, memory, storage]

- id: g13
  term: 保持性（Retain / 保持性数据）
  type: term
  source_chapter: "ch5.1.1 / ch5.1.5，PDF p93–p94、p120"
  author_definition: |
    "暖启动不包括储存器复位。执行暖启动时，CPU 会初始化所有的非保持性系统和用户数据，并保留所有保持性用户数据值。"（p93）
    "将某些数据标记为保持性数据可以避免发生电源故障后造成数据丢失。"（p120）
    "在系统初始化过程中，CPU 将删除所有非保持性位 (M) 存储器，并将所有非保持性 DB 的内容复位为装载存储器的初始值。CPU 将保留保持性位 (M) 存储器和保持性 DB 的内容。"（p94）
  key_distinction: |
    ≠ "掉电后所有数据都保留" — 只有被显式标记保持的 M 区/DB/FB 变量才跨掉电；非保持区在暖启动时被清零或复位为装载存储器初始值。
    = 保持性位存储器从 MB0 起连续；FB 变量可设 Retain/Non-retain/Set in IDB（由背景 DB 决定）。
  why_it_matters: |
    T10 恢复/掉电处理与 T04 状态保存必须显式规划保持范围：累计量、配方等未设保持会在上电后丢失，是常见现场故障根因。
  tags: [term, core-concept, memory, retentive]

- id: g14
  term: 暖启动（Warm Start）与存储器复位（MRES）
  type: term
  source_chapter: "ch5.1.1，PDF p93–p94"
  author_definition: |
    "CPU 支持通过暖启动进入 RUN 模式。暖启动不包括储存器复位。"（p93）
    "存储器复位将清除所有工作存储器、保持性及非保持性存储区、将装载存储器复制到工作存储器并将输出设置为组态的'对 CPU STOP 的响应'。存储器复位不会清除诊断缓冲区，也不会清除永久保存的 IP 地址值。"（p93）
  key_distinction: |
    ≠ 一般语境的"重启=恢复出厂" — 暖启动保留保持性数据，只初始化非保持数据；存储器复位（MRES）才是彻底清空并重载项目。
    ≠ "复位会清掉全部记录" — 存储器复位不清除诊断缓冲区、不清除永久 IP。
    = "暖启动 - 断电前的模式" 会按掉电前状态决定回 RUN 还是 STOP。
  why_it_matters: |
    T10 维护排障 skill 必须区分暖启动与 MRES：误执行 MRES 会丢失保持性数据与组态，且诊断缓冲区仍在可用于追溯故障。
  tags: [term, memory, startup, maintenance]

- id: g15
  term: 循环时间监视（最大/最小扫描周期时间）
  type: term
  source_chapter: "ch5.1.4，PDF p117–p118"
  author_definition: |
    "循环时间是指 CPU 操作系统在 RUN 模式下执行循环阶段所需的时间。CPU 提供了两种监视循环时间的方法：最大扫描周期时间、最小扫描周期时间。"（p117）
    "最大扫描周期时间始终启用…默认值为 150 ms。最小扫描周期时间为可选项，默认情况下被禁用。"（p118）
  key_distinction: |
    ≠ "扫描越快越好 / 无上限" — CPU 强制监视最大周期时间（1–6000 ms，默认 150 ms），超时触发时间错误事件，按组态保持 RUN 或进 STOP。
    ≠ 最小时间会拖慢程序 — 最小周期时间仅让 CPU 在程序完成后延时/做诊断与通信，用于消除扫描时长波动，不会因超出它而产生系统响应。
    = RE_TRIGR 可复位监视定时器，但同一周期第二次超时必进 STOP。
  why_it_matters: |
    T03 实时性评估要给出监控窗口与超时行为；排障时时间错误 OB/诊断缓冲区条目需结合最大周期时间组态解读。
  tags: [term, real-time, timing, diagnostics]

- id: g16
  term: 通信负载（Communication Load）
  type: term
  source_chapter: "ch5.1.4 / ch11.2.14，PDF p118、p1060"
  author_definition: |
    "通信负载：可以组态一个百分比时间，专门用于通信任务。"（p118）
    "STEP 7 计算通信负载，然后计算产生的更新时间。"（p1060）
  key_distinction: |
    ≠ "通信不占 CPU 时间" — 通信处理在扫描周期中定期执行并占用专门的百分比时间，会拉长扫描周期、挤占用户程序执行窗口。
    = 它是可组态资源，也是 PROFINET 更新时间（发送时钟）计算的前提。
  why_it_matters: |
    T03/T05 通信与实时性联动：组态过高通信负载会增加扫描抖动；PROFINET 组态时更新时间由通信负载反算，需纳入选型与诊断考量。
  tags: [term, communication, real-time, timing]

- id: g17
  term: 诊断缓冲区（Diagnostic Buffer）
  type: term
  source_chapter: "ch5.1.6 / ch15.10，PDF p123、p1497"
  author_definition: |
    "CPU 提供了一个诊断缓冲区，其中包含的每个条目对应一个诊断事件。每个条目都包含了事件发生的日期和时间、事件类别及事件描述。条目按时间顺序显示，最新发生的事件位于最上面。此日志最多可提供 50 个最近发生的事件。日志填满后，新事件将替换日志中最早的事件。掉电时，将保存事件。"（p123）
    "仅永久存储诊断缓冲区中 10 个最新的事件。"（p1497）
  key_distinction: |
    ≠ 完整运行日志 — 它是容量有限的环形缓冲（最多 50 条，仅 10 条永久保存），旧事件会被覆盖。
    ≠ 只记录故障 — 也记录 CPU 每次状态切换（上电、切 STOP、切 RUN）与所有系统诊断事件。
    = 排障的"第一现场"，须在线访问查看；存储器复位不会清除它。
  why_it_matters: |
    T07 在线诊断排障 skill 的核心数据源：定位故障必须先读诊断缓冲区，且要理解"只保留最近 50 条/10 条永久"的覆盖特性，避免误判事件已发生。
  tags: [term, core-concept, diagnostics, troubleshooting]

- id: g18
  term: PROFINET IO 角色：IO 控制器 / IO 设备 / 智能设备（I-Device）
  type: term
  source_chapter: "ch11.2.12 / ch11.2.13，PDF p1040、p1044–p1045"
  author_definition: |
    "PROFINET 网络中的设备在分配名称后才可与 CPU 连接。"（p1041）
    "CPU 的'智能设备'（智能 IO 设备）功能简化了与 IO 控制器的数据交换…智能设备作为 IO 设备链接到'上位'IO 控制器。预处理由 CPU 上的用户程序完成…并通过 PROFINET IO 接口提供给上位站的 CPU。"（p1044）
  key_distinction: |
    ≠ 普通"主/从" — IO 控制器/IO 设备是 PROFINET 的确定角色；"智能设备"是同时具备自身用户程序预处理能力、又作为 IO 设备挂到上位控制器的双重角色 CPU。
    = 设备必须先"分配名称"才能连接，名称不匹配则数据交换不运行；智能设备通过 GSD 文件（而非 STEP 7 项目）向上位站暴露接口，保护专有知识。
  why_it_matters: |
    T05 通信选型/组态 skill 必须让用户在"普通 IO 设备 / 智能设备 / 共享设备"间正确选择；把智能设备当普通 IO 设备会丢失其预处理与知识保护价值。
  tags: [term, communication, profinet, role]

- id: g19
  term: 共享设备（Shared Device）
  type: term
  source_chapter: "ch11.2.14，PDF p1053–p1055"
  author_definition: |
    "'共享设备'功能允许 IO 设备的模块或子模块在不同的 IO 控制器中进行划分。"（p1053）
    "对共享设备子模块的访问将在各个 IO 控制器之间分配。每个共享设备子模块以独占方式分配给一个 IO 控制器。"（p1053）
  key_distinction: |
    ≠ "多个控制器同时读写同一模块" — 共享的是一台 IO 设备，但每个子模块被"独占"分配给一个控制器；不是共享数据，而是共享物理设备、拆分控制权。
    ≠ 自动生效 — 必须在多个项目中一致组态访问权，否则访问参数分配错误只有在控制器运行时才以组态错误形式暴露。
  why_it_matters: |
    T05 多控制器分布式系统组态需明确：共享设备解决"多个邻近 I/O 模块供不同控制器"的问题，但访问权/发送时钟/IP 必须跨项目一致，否则隐性故障难排查。
  tags: [term, communication, profinet, shared-device]

- id: g20
  term: 工艺对象（Technology Object, TO）
  type: term
  source_chapter: "ch10.3.2 / ch10.3.3，PDF p751、p754"
  author_definition: |
    "在项目树中，展开节点'工艺对象'(Technology Objects)，然后选择'添加新对象'…选择'轴'(Axis) 图标…打开轴对象的组态编辑器。"（p751）
    "STEP 7 为'轴'工艺对象提供组态工具、调试工具和诊断工具。"（p754）
    "在工艺对象的数据块中保存组态数据。"（p754）
  key_distinction: |
    ≠ 普通"对象/OOP 实例" — 工艺对象是预置的、带专用组态/调试/诊断 UI 的功能封装（轴、PID 等），其参数保存在专属工艺对象 DB（TO-DB）中，由系统 OB 驱动。
    ≠ 可直接 new 的软件类 — 必须通过项目树添加并下载，且重命名后需在 STOP 模式重新下载以保证一致性。
  why_it_matters: |
    T06 高速计数/PID/运动控制组态 skill 必须以工艺对象为入口轴心；运动控制的应用周期（轴数×2 ms）、MC-Servo OB、OB 伺服 PIP 都挂在工艺对象体系下。
  tags: [term, core-concept, technology-object, motion, pid]

- id: g21
  term: Variant（参数化数据类型）
  type: term
  source_chapter: "ch9.3.3 / ch10.1.1，PDF p431、p632"
  author_definition: |
    "INPUTS IN_OUT Variant 读取数据所在的目标区域…可以使用以下数据类型：系统数据类型…用户定义类型 (UDT)…结构 (STRUCT)，但仅在未经优化的数据块中 (DB)。"（p431）
    "全部 CTRL_HSC_EXT…指令都使用系统定义的数据结构（存储在用户自定义的全局背景数据块中）存储计数器数据。"（p632）
  key_distinction: |
    ≠ 通用编程语言的"可变/动态类型" — Variant 是 S7 的指针式参数类型，允许指令接受多种数据类型，但实际可使用类型受指令限定（如 STRUCT 仅允许未优化 DB）。
    = 它是系统功能块（SFB）与用户数据间的接口，不决定物理存储，只描述"可被传入的实参形态"。
  why_it_matters: |
    T04/T06 使用扩展指令、工艺指令时，Variant 参数的类型限制（优化 DB 不可用 STRUCT）是常见编译/运行错误来源，下游 skill 必须显式提示。
  tags: [term, data-type, instruction, variant]

- id: g22
  term: 优化块访问 / 标准块访问（Optimized Block Access）
  type: term
  source_chapter: "ch7.3.4，PDF p208"
  author_definition: |
    "可优化访问的数据块无固定的定义结构。数据元素在声明中仅包含一个符号名，在块中没有固定地址。CPU 会将元素自动存储到块的可用存储区中，以免在存储器中留下间隙。…默认情况下会为新数据块选中优化块访问。"（p208）
    "标准 DB 与 STEP 7 Classic 编程工具以及经典的 S7-300 和 S7-400 CPU 兼容。"（p208）
  key_distinction: |
    ≠ "只是存储效率选项" — 优化访问 DB 的元素没有固定绝对地址，只能符号寻址；这直接决定它能否用于需要绝对/直接寻址的场合（如 Modbus DATA_PTR、STRUCT 类型的 Variant 实参、CTRL_HSC_EXT 起始值）。
    = 默认优化；需要绝对寻址/经典兼容时必须显式取消该选项（标准访问）。
  why_it_matters: |
    T04/T05/T06 中 Modbus 保持寄存器、DPRD_DAT、HSC 等指令明确要求"标准(Standard)访问"DB；若沿用默认优化 DB 会报"无绝对地址"类错误，是高频坑点。
  tags: [term, data-block, addressing, compatibility]

- id: g23
  term: 高速计数器（HSC, High-Speed Counter）
  type: term
  source_chapter: "ch10.1 / ch10.1.1，PDF p631–p632"
  author_definition: |
    "'计数器操作'中所述的基本计数器指令限于发生在低于 S7-1200 CPU 扫描周期速率的计数事件。高速计数器 (HSC) 功能提供了发生在高于 PLC 扫描周期速率的计数脉冲。"（p631）
    "在下载硬件组态后，HSC 可以计数脉冲或测量频率而不需要任何调用指令。…计数值在每个扫描周期的过程映像（I 存储器）中被自动捕获并更新。"（p631）
  key_distinction: |
    ≠ 普通计数器指令 — 普通计数器受扫描周期速率限制，会漏计高频脉冲；HSC 由硬件实现，可处理高于扫描速率的脉冲，且组态后无需调用指令即可运行。
    = HSC 值通过过程映像（或 CTRL_HSC_EXT 的 DB）访问；运动控制中 HSC 与 PTO 有固定配对，且 V2.2 及更早固件中 PTO 会占用 HSC。
  why_it_matters: |
    T06 工艺组态 skill 必须按"事件频率 vs 扫描速率"选 HSC 还是普通计数；否则编码器/高速脉冲场景会严重漏计。
  tags: [term, core-concept, technology, counting, real-time]

- id: g24
  term: PTO（脉冲串输出 / Pulse Train Output）
  type: term
  source_chapter: "ch10.3.1 / ch10.3.2 / ch10.3.3，PDF p749、p751、p753"
  author_definition: |
    "PTO（脉冲 A 和方向 B）：…一个输出 (P0) 控制脉冲，另一输出 (P1) 控制方向。"（p749）
    "通过 PTO（脉冲串输出）在 PLC 和驱动器上连接开环轴。对于使用 PTO 的运动控制应用，CPU 需要使用板载或信号板 (SB) 数字量 I/O。这会限制小型 PLC 可使用的轴的最大数量。"（p753）
  key_distinction: |
    ≠ "普通数字量输出" — PTO 是板载/SB 高速脉冲硬件功能，用于开环运动控制；与驱动器共享脉冲/方向信号，占用高速输出资源，数量受 CPU 型号限制。
    ≠ 闭环接口 — 闭环运动用模拟量 I/O 或 PROFIdrive，不需要 PTO；PTO 仅用于开环轴。
  why_it_matters: |
    T06 运动控制选型必须区分开环（PTO）/闭环（模拟量或 PROFIdrive）：轴的数量、可用输出资源、是否需编码器都由此决定。
  tags: [term, technology, motion, pto]

- id: g25
  term: 在线工具：监视 / 修改 / 强制 / 轨迹（Trace）
  type: term
  source_chapter: "ch7.10.1 / ch15.13 / ch15.15，PDF p239–p240、p1500、p1522"
  author_definition: |
    "可以显示或监视变量的当前值。监视功能不会改变程序顺序。…可以修改在线 CPU 中变量的值…可以将外围设备输出（如 Q0.1:P 或'Start':P）强制为特定值。"（p1500）
    "强制值存储在 CPU 中，而不是监视表格中。无法强制输入（或'I'地址）。但是，可以强制外围设备输入。"（p240）
    "STEP 7 提供了轨迹和逻辑分析器功能，可用于组态 PLC 要跟踪和记录的变量。"（p1522）
  key_distinction: |
    ≠ "调试=改程序" — 监视只读、不改程序顺序；修改仅临时改值；"强制"是把值锁存在 CPU 中覆盖实际 I/O（且只能强制 :P 外设，danger 极高）。
    ≠ 强制与修改相同 — 强制值存 CPU、不受程序刷新覆盖，必须用强制表格解除；修改值会被程序下周期覆盖。
    = 轨迹（Trace）是按触发条件高速记录变量的另一类工具，需存储卡保存数据。
  why_it_matters: |
    T07/T08 排障与调试 skill 必须严格区分监视/修改/强制：误用强制会导致输出长期锁定在危险状态（LED 的 MAINT 会指示强制）；这是现场安全事故常见来源。
  tags: [term, diagnostics, debugging, force, trace]
