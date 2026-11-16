# verified.md — 阶段 1.5 三重验证通过候选（进入阶段 1.6）

> 来源：西门子 S7-1200 系统手册 V4.2（2016-09，文档号 A5E02486685-AK）。
> validation_version: task-first-v2。check_mode 全部为 paper walkthrough（阶段 4 尚未实测真实输出）。
> 重要限制：本次执行时原文 source.md 在过程中被并发清空，V1 依据候选自带的 source_quote（原文节选）+ 章节/页码/chunk_id 判定，未能对原文做二次 Grep/Read 回查；source_id 统一记为手册文档号，location 取候选标注的章节/页码。
> 去重说明：原始 211 条已按"主题+可执行动作"合并；被完整覆盖的重复项（`merged_from` 中的 p 系列）已在 `rejected/` 目录逐条登记（decision: rejected，注明 canonical），不计入 verified 独立条目；`merged_from` 仅用于溯源标注吸收关系。canonical（f 系列/独立 p）计为 verified。

```yaml
- id: f01
  title: 功率预算与供电决策框架
  type: framework
  merged_from: [f01]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.2 功率预算 p61"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出5V/24V两类预算区分、查表累加比对、超预算加外部电源及两条硬约束；具体数值表在附录p1779，本候选仅主张决策路径，未越过支持范围"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "某CPU 5V预算1000mA带3个SM各需200mA；24V负载1.5A而传感器电源仅1A", expected: "5V余量400mA充足；24V超0.5A须加独立外部24V电源且不并联、M共点", observed: "按决策路径可得出相同结论"}
  V3_task_utility: {passed: true, expected_benefit: "避免遗漏外部电源不得并联/M端子共点等硬约束，统一选型供电决策口径"}
  decision: verified

- id: f02
  title: 代码块类型与用户程序结构角色框架（OB/FC/FB/DB）
  type: framework
  merged_from: [f02, p32]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1 p89；ch7.2/7.3 p201-207"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确四类块角色、FC无DB/FB带背景DB、可重入与块上限1024，p32补充FC临时数据不保存"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "编写3台电机各自独立控制且需保存运行时间的程序", expected: "用一个FB+3个背景DB，OB1中调用3次，各DB存各自速度/运行时间", observed: "按角色框架可推出相同结构"}
  V3_task_utility: {passed: true, expected_benefit: "把'每段逻辑放哪种块'固化为决策，减少FB/FC误用导致的数据丢失"}
  decision: verified

- id: f03
  title: 用户程序执行顺序与调用嵌套深度框架
  type: framework
  merged_from: [f03]
  task_ids: [T02, T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1 p89"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出启动OB→循环OB→中断OB三层顺序及16/6层嵌套硬边界"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "判断从硬件中断OB出发的FC最多可嵌套几层", expected: "6层；从循环/启动OB出发为16层", observed: "与原文边界一致"}
  V3_task_utility: {passed: true, expected_benefit: "规划调用层级时提前拦截越界，避免编译/运行期才暴露"}
  decision: verified

- id: f04
  title: 过程映像分区（PIP）分配操作流程
  type: procedure
  merged_from: [f04]
  task_ids: [T04]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1 p91-92"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出完整5步操作、PIP0-4/无五选项及'分配PIP未绑OB等价无'的关键陷阱"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "某DI需每周期更新、某AI只在循环中断OB10更新", expected: "DI设自动更新(PIP0)，AI设PIP1并绑OB10；若PIP1未绑OB则等价'无'永不刷新", observed: "按5步流程可完成配置并识别陷阱"}
  V3_task_utility: {passed: true, expected_benefit: "稳定I/O更新方式配置交付，防止PIP未绑OB的隐性失效"}
  decision: verified

- id: f05
  title: CPU 三种工作模式状态机与暖启动决策
  type: framework
  merged_from: [f05, p12]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.1 p93-95"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出STOP/STARTUP/RUN三态行为、暖启动数据保留规则及上电行为三选一"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要求断电恢复后CPU自动回RUN独立运行且保留累计值", expected: "组态'暖启动-RUN'并将累计变量设为保持性", observed: "按状态机可推出相同组态"}
  V3_task_utility: {passed: true, expected_benefit: "统一启动行为与数据保留口径，避免临时故障停在STOP或保持性数据丢失"}
  decision: verified

- id: f06
  title: 启动过程 STOP→RUN 状态转换流程（A–F）
  type: procedure
  merged_from: [f06]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.1 p95-96"}]
  V1_source_sufficiency: {passed: true, reason: "原文A-F步骤完整，含启动OB读映像为零须立即读、多OB按编号、中断排队等要点"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "启动OB中读取I0.0当前物理电平", expected: "读I0.0得0，须用I0.0:P立即读取；多个启动OB按编号升序执行", observed: "按流程可判定"}
  V3_task_utility: {passed: true, expected_benefit: "限定启动期读输入的正确方法，减少启动逻辑误判"}
  decision: verified

- id: f07
  title: RUN 模式扫描周期处理流程（①–⑤）
  type: procedure
  merged_from: [f07, p19]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.2 p97"}]
  V1_source_sufficiency: {passed: true, reason: "原文①-⑤顺序及中断按优先级穿插、超时生成时间错误等完整"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "分析某输出点从输入变化到响应的延迟", expected: "最多一个扫描周期+中断等待延迟", observed: "按周期模型可估算"}
  V3_task_utility: {passed: true, expected_benefit: "提供实时性评估的统一时序模型"}
  decision: verified

- id: f08
  title: OB 类型体系与事件触发框架
  type: framework
  merged_from: [f08, p15]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3 p98-112"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出事件→OB映射、OB不可互调、优先级1-26调度"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "需要每10ms执行一次定值控制", expected: "选循环中断OB而非OB1，按优先级调度", observed: "按类型体系可选定"}
  V3_task_utility: {passed: true, expected_benefit: "把异常/周期任务映射到正确OB，统一事件处理结构"}
  decision: verified

- id: f09
  title: 事件执行优先级与排队机制（可中断/不可中断）
  type: framework
  merged_from: [f09]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3.17 p112-115"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出可中断/不可中断行为、队列上限与V4.0时间错误OB中断条件"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "OB1执行中来了更高优先级诊断事件且OB1设为可中断", expected: "挂起OB1执行诊断OB后返回断点", observed: "按优先级机制可判断"}
  V3_task_utility: {passed: true, expected_benefit: "识别抢占与队列溢出边界，改善实时性决策"}
  decision: verified

- id: f10
  title: 时间错误 OB 排障流程（症状→判断→操作→验证）
  type: troubleshooting
  merged_from: [f10, p18]
  task_ids: [T03, T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3.6 p102-103；5.1.4 p117"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出三类时间错误、fault_id判据、RE_TRIGR十倍上限与同周期二次超时必STOP"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "诊断缓冲区fault_id=16#02且csg_OBnr指向某OB", expected: "判为OB无法启动（前中断未完），定位该OB并优化", observed: "按判据可定位"}
  V3_task_utility: {passed: true, expected_benefit: "把超时排障固化为症状→判据→操作，减少盲目改程序"}
  decision: verified

- id: f11
  title: 诊断错误中断 OB 排障流程
  type: troubleshooting
  merged_from: [f11]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3.7 p104-105"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出支持的诊断错误、IOstate/LADDR等判据及无OB默认行为"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "模拟量模块断线但系统无诊断错误OB", expected: "CPU忽略错误保持RUN，需加OB并按需放STP才会进STOP", observed: "按流程可判定"}
  V3_task_utility: {passed: true, expected_benefit: "统一诊断错误处理口径，避免错误被静默忽略"}
  decision: verified

- id: f12
  title: 拔出/插入模块 OB 与 CPU 行为决策
  type: troubleshooting
  merged_from: [f12]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3.8 p106"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确分布式I/O保持RUN、中央机架一律STOP及Event_Class判据"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "中央机架拔出已组态模块", expected: "CPU切STOP；同一事件若发生在分布式I/O则保持RUN", observed: "按决策树可判定"}
  V3_task_utility: {passed: true, expected_benefit: "预判拔插停机风险，区分计划维护与真实故障"}
  decision: verified

- id: f13
  title: 无关联 OB 事件的 CPU 响应对照框架
  type: troubleshooting
  merged_from: [f13]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3 表5-17 p116"}]
  V1_source_sufficiency: {passed: true, reason: "原文表格给出各类无OB事件的固定动作与GET_ERROR_ID入口"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "首次发生I/O访问错误且无对应OB", expected: "记诊断缓冲区保持RUN，用GET_ERROR_ID查原因", observed: "按对照表可判定"}
  V3_task_utility: {passed: true, expected_benefit: "统一无OB事件的排障入口"}
  decision: verified

- id: f14
  title: 循环时间监视与 RE_TRIGR 决策框架
  type: framework
  merged_from: [f14]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.4 p117-118"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出最大/最小周期用途、默认150ms及RE_TRIGR十倍条件"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "最大扫描周期150ms，已用200ms调用RE_TRIGR", expected: "200ms<1500ms返回ENO=TRUE；若已用>1500ms则ENO=FALSE", observed: "按条件可判定"}
  V3_task_utility: {passed: true, expected_benefit: "统一周期监控窗口与超时处置口径"}
  decision: verified

- id: f15
  title: 系统存储器与时钟存储器位用途框架
  type: framework
  merged_from: [f15]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.5.1 p119-122"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出FirstScan/DiagStatusUpdate/AlwaysTRUE/FALSE及0.5-10Hz方波及禁改写约束"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "需要每0.5s周期触发一次动作", expected: "用时钟存储器位3（0.5s/2Hz）；首周期执行用FirstScan", observed: "按映射可选定位"}
  V3_task_utility: {passed: true, expected_benefit: "固化系统/时钟位用法并提示禁改写，避免破坏功能"}
  decision: verified

- id: f16
  title: 诊断缓冲区机制与排障入口
  type: troubleshooting
  merged_from: [f16]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.6 p123-124；ch15.10 p1497"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出50条环形缓冲/10条永久/掉电保存/访问路径，覆盖p29内容"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "排查上次CPU切STOP原因", expected: "在线→在线和诊断→诊断缓冲区看最新条目；理解满后覆盖最早", observed: "按机制可操作"}
  V3_task_utility: {passed: true, expected_benefit: "确立排障第一现场，避免误判事件未被记录"}
  decision: verified

- id: f17
  title: 存储卡用途类型决策框架（传送卡/程序卡/固件更新卡）
  type: framework
  merged_from: [f17]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5 p151"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出三种卡用途、擦除行为、前置条件与密码恢复路径"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要给多台CPU灌同一程序", expected: "用传送卡（用完取出），需常驻作外部装载存储器用程序卡", observed: "按决策可选定"}
  V3_task_utility: {passed: true, expected_benefit: "避免传送卡忘取出或程序卡误当传送卡导致的STOP"}
  decision: verified

- id: f18
  title: CPU 评估存储卡决策流程
  type: framework
  merged_from: [f18]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5.1 p153-154"}]
  V1_source_sufficiency: {passed: true, reason: "原文按'是否禁用复制×有无作业文件'两维给出决策，含插卡固定三步"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "已禁用内部→外部复制后插入空卡", expected: "CPU不操作、不创建作业文件、不擦除内部", observed: "按二维决策可判定"}
  V3_task_utility: {passed: true, expected_benefit: "预判插卡后CPU行为，减少现场误操作"}
  decision: verified

- id: f19
  title: 创建传送卡操作流程
  type: procedure
  merged_from: [f19]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5.3 p156-157"}]
  V1_source_sufficiency: {passed: true, reason: "原文1-7步完整，含隐藏文件保护与版本限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "制作一张含程序的传送卡", expected: "插无写保护空白卡→卡类型选传送→拖入CPU→装载；勿删__LOG__/crdinfo.bin", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "稳定传送卡制作交付，防止删隐藏文件致卡失效"}
  decision: verified

- id: f20
  title: 使用传送卡传送程序流程
  type: procedure
  merged_from: [f20]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5.3 p158"}]
  V1_source_sufficiency: {passed: true, reason: "原文1-4步完整，含LED判断复制进度与设RUN前取卡硬约束"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "CPU在RUN时插入传送卡", expected: "自动切STOP→循环上电评估→LED交替闪为复制中→完成后取卡再设RUN", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "用LED作复制进度判据，避免复制未完就设RUN"}
  decision: verified

- id: f21
  title: 创建程序卡与使用程序卡流程
  type: procedure
  merged_from: [f21]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5.4 p159-161"}]
  V1_source_sufficiency: {passed: true, reason: "原文创建与使用步骤完整，含程序卡必须常驻的差异"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要让程序作为外部装载存储器长期驻留", expected: "卡类型选程序并装载，插卡评估后擦除内部；取出即STOP", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "明确程序卡常驻要求，防止取出导致停机"}
  decision: verified

- id: f22
  title: 固件更新（存储卡方式）下载与安装流程
  type: procedure
  merged_from: [f22]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5.5 p162-164"}]
  V1_source_sufficiency: {passed: true, reason: "原文下载与安装步骤完整，含24V保持、LED判据与跨版本限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "用存储卡刷固件", expected: "解压zip到卡根生成FWUPDATE.S7S→确认CPU空闲插卡→保持24V等LED完成→取卡重启", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "把刷固件固化为可核对流程，避免中途断电变砖"}
  decision: verified

- id: f23
  title: 无效/不兼容传送卡恢复流程
  type: troubleshooting
  merged_from: [f23]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.5.1/5.5.3 p152/157"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出症状、三选一恢复动作与根因修复路径"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "V3.0传送卡插入V4.0 CPU报错", expected: "取卡→STOP-RUN/MRES/循环上电→下载有效V4.0程序", observed: "按流程可恢复"}
  V3_task_utility: {passed: true, expected_benefit: "固化版本不兼容恢复路径，减少停机排查时间"}
  decision: verified

- id: f24
  title: 丢失密码后恢复流程
  type: troubleshooting
  merged_from: [f24]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.6 p165"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出空传送卡擦除恢复步骤及设RUN前取卡、急停约束"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "忘记受密码保护CPU的密码", expected: "用空传送卡擦除内部装载存储器→从STEP7下载新程序（原程序不可恢复）", observed: "按流程可执行"}
  V3_task_utility: {passed: true, expected_benefit: "明确以擦除换访问的代价与安全前提"}
  decision: verified

- id: f25
  title: 设计 PLC 系统的指南流程（工程方法）
  type: procedure
  merged_from: [f25, p45]
  task_ids: [T01, T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.1 表7-1 p199-200"}]
  V1_source_sufficiency: {passed: true, reason: "原文表7-1给出七步顺序与安全贯穿原则；安全电路细节需参照公司规范，候选已标注"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "从零设计一台包装机控制系统", expected: "按分区→功能规范→安全电路→系统安全→操作员站→组态图→符号表产出", observed: "按七步可产出交付物"}
  V3_task_utility: {passed: true, expected_benefit: "减少设计阶段遗漏（尤其独立安全电路）"}
  decision: verified

- id: f26
  title: 用户程序结构类型选择（线性 vs 模块化）
  type: framework
  merged_from: [f26]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.2 p201-202"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出线性/模块化选择依据与复用收益、库共享"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "多个同类电机需相同控制逻辑", expected: "选模块化+可复用FB存入项目库", observed: "按决策可选定"}
  V3_task_utility: {passed: true, expected_benefit: "统一结构选择口径，支持复用与分块调试"}
  decision: verified

- id: f27
  title: 单个 FB 配多个 DB 的设备复用框架
  type: framework
  merged_from: [f27]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.3.4 p207"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出一FB多背景DB落地模式及保持性设置差异"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "3台电机同一FB控制", expected: "FB配3个背景DB各存速度/加速时间/运行时间，互不干扰", observed: "按模式可落地"}
  V3_task_utility: {passed: true, expected_benefit: "实现可重入复用，避免多设备共享数据串扰"}
  decision: verified

- id: f28
  title: 参数传递决策（传值 vs 传引用）与优化匹配
  type: framework
  merged_from: [f28, p33]
  task_ids: [T02, T04]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.3.6 p210-212"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出IN/OUT/INOUT用途、简单传值复杂传引用及优化不匹配退化规则"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "向FB传一个20元素STRUCT", expected: "用IN/OUT且块与DB优化设置一致以走引用，避免复制膨胀", observed: "按决策可判定"}
  V3_task_utility: {passed: true, expected_benefit: "减少因优化设置不匹配导致的数据存储膨胀与 lost update"}
  decision: verified

- id: f29
  title: 优化设置不匹配导致数据丢失的问题与解决
  type: troubleshooting
  merged_from: [f29, p29]
  task_ids: [T04]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.3.6 p212"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出症状、根因（副本回写）与最佳/替代解"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "HMI在FB运行期改STRUCT某值且DB/FB优化设置不同", expected: "该值在FB结束被副本回写覆盖而丢失；应匹配优化设置", observed: "按根因可判定"}
  V3_task_utility: {passed: true, expected_benefit: "识别一致性问题在参数传递层的具体表现"}
  decision: verified

- id: f30
  title: 数据一致性保障流程（DIS_AIRT → 读写 → EN_AIRT）
  type: procedure
  merged_from: [f30, p34]
  task_ids: [T04]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.4 p213"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出三段式、原子性范围、通信场景与配对/中断等待代价"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "循环OB与中断OB共享3个相关值", expected: "DIS_AIRT→读写3值→EN_AIRT保证三者同周期一致", observed: "按三段式可完成"}
  V3_task_utility: {passed: true, expected_benefit: "防止多值撕裂，统一跨OB一致性方案"}
  decision: verified

- id: f31
  title: CPU 访问保护安全等级决策框架
  type: framework
  merged_from: [f31, p37]
  task_ids: [T05]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.6.1 p226-227"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出四级权限矩阵、配置步骤、PLC-PLC通信不受限与强密码建议"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "允许HMI读写但禁止未授权写CPU", expected: "设'HMI访问'级并配密码；PLC-PLC通信仍免密", observed: "按矩阵可选定"}
  V3_task_utility: {passed: true, expected_benefit: "统一访问级别口径，避免权限配置过松/过紧"}
  decision: verified

- id: f32
  title: 下载到不同容量 CPU 的决策框架（兼容性判断）
  type: framework
  merged_from: [f32]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.7 p233-235"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出容量/I/O兼容两判据、允许与禁止下载情形及更改设备修复路径"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "组态1215C但实际连接1212C", expected: "工作存储器不足→禁止下载→须更改设备为1212C", observed: "按判据可判定"}
  V3_task_utility: {passed: true, expected_benefit: "下载前拦截不兼容，减少失败重试"}
  decision: verified

- id: f33
  title: 下载失败后恢复流程
  type: troubleshooting
  merged_from: [f33]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.7 p235"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出修正→重试→清空存储器升级步骤及16#02:4175等错误定位"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "下载失败且诊断缓冲区报卡评估错误16#02:4175", expected: "修正→重试→多次失败清空装载存储器/复位出厂→重下", observed: "按流程可恢复"}
  V3_task_utility: {passed: true, expected_benefit: "固化下载失败升级路径"}
  decision: verified

- id: f34
  title: 在线/离线同步决策框架（四选项）
  type: framework
  merged_from: [f34]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.8 p236-237"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出四选项及触发条件、先比较再定的判断"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "在线CPU的DB起始值被WRIT_DBL改过，比项目新", expected: "弹同步框→先在线/离线比较看差异→决定同步上传还是覆盖下载", observed: "按决策可选定"}
  V3_task_utility: {passed: true, expected_benefit: "防止现场改动值被盲目覆盖或漏同步"}
  decision: verified

- id: f35
  title: 从在线 CPU 上传程序块流程
  type: procedure
  merged_from: [f35]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.9 p238"}]
  V1_source_sufficiency: {passed: true, reason: "原文1-4步完整，含前置准备与上传前可比较"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要把现场CPU程序传回项目", expected: "点程序块文件夹→转到在线→上传→确认选项", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "稳定上传交付物"}
  decision: verified

- id: f36
  title: 监视/修改/强制能力矩阵框架
  type: framework
  merged_from: [f36]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.10 p239；ch15.13 p1500"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出各编辑器监视/修改/强制能力矩阵及强制仅:P外设"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要把某变量锁定到固定值调试", expected: "用强制表格（唯一能强制），且只能强制:P外设输入", observed: "按矩阵可选定"}
  V3_task_utility: {passed: true, expected_benefit: "防止误用强制导致输出长期锁定在危险状态"}
  decision: verified

- id: f37
  title: 调用结构时间戳冲突排查流程
  type: troubleshooting
  merged_from: [f37]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.10.4 p242"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出五类冲突及重新编译→详细资料手动消除→再编译的验证流程"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "调用结构中某块显示红色时间戳冲突", expected: "先重新编译相关块，仍冲突则用详细资料跳编辑器手改再编译", observed: "按流程可排查"}
  V3_task_utility: {passed: true, expected_benefit: "统一下载前冲突排查路径"}
  decision: verified

- id: f38
  title: ATTACH/DETACH 附加与分离中断事件机制
  type: framework
  merged_from: [f38]
  task_ids: [T03, T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.5.1 p468-471"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出ADD=0/1语义、未指定EVENT行为、RET_VAL错误码与共用OB规则"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "运行期把某硬件事件绑到OB", expected: "ATTACH ADD=0替换/ADD=1追加；RET_VAL=0000成功、8090 OB不存在", observed: "按机制可判定"}
  V3_task_utility: {passed: true, expected_benefit: "支持运行期动态改中断绑定，统一错误码判读"}
  decision: verified

- id: f39
  title: 中断 OB 创建与事件启用流程（硬件中断）
  type: procedure
  merged_from: [f39]
  task_ids: [T03, T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.5.1 p470"}]
  V1_source_sufficiency: {passed: true, reason: "原文1-3步完整，含前置硬件事件启用项"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "DI通道上升沿触发某动作", expected: "设备组态使能上升沿→建硬件中断OB→写响应→绑事件", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "防止只建OB未启用事件导致中断不触发"}
  decision: verified

- id: f40
  title: 循环中断相移决策与设置流程（SET_CINT/QRY_CINT）
  type: procedure
  merged_from: [f40]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.5.2 p473-475；ch5.1.3.4 p100"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出相移决策规则、最大相移与SET_CINT不保持限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "5ms与10ms两循环OB同时触发", expected: "低优先级OB相移>高优先级处理时间，SET_CINT设PHASE，QRY_CINT验证；值掉电/STOP后失效须重设", observed: "按流程可完成"}
  V3_task_utility: {passed: true, expected_benefit: "错开循环事件，避免同时抢占"}
  decision: verified

- id: f41
  title: 延时中断设置指令族流程（SRT_DINT/CAN_DINT/QRY_DINT）
  type: procedure
  merged_from: [f41]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.5.4 p481-483"}]
  V1_source_sufficiency: {passed: true, reason: "原文指令族完整，含DTIME范围、单触发陷阱、4个上限与STATUS位"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "延后2s触发一次中断", expected: "SRT_DINT(DTIME=2000)用单触发脉冲启动，到期触发一次；可CAN_DINT取消、QRY_DINT查状态", observed: "按流程可完成"}
  V3_task_utility: {passed: true, expected_benefit: "避免EN常通导致每扫描重启定时器的陷阱"}
  decision: verified

- id: f42
  title: DIS_AIRT/EN_AIRT 延迟中断配对机制
  type: procedure
  merged_from: [f42]
  task_ids: [T04, T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.5.5 p484-485"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出多次累加配对、RET_VAL=0才恢复、EN_AIRT须同OB调用链内"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "临界区调用了3次DIS_AIRT", expected: "须3次EN_AIRT且RET_VAL=0才真正恢复中断", observed: "按机制可判定"}
  V3_task_utility: {passed: true, expected_benefit: "为f30一致性流程提供底层配对规则，防止中断被长期禁用"}
  decision: verified

- id: f43
  title: Gen_UsrMsg 用户诊断报警生成流程
  type: procedure
  merged_from: [f43]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.6.1 p486-489"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出TextListID/TextID/Mode构造、AssocValues编号规则与错误码"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "用户程序要向诊断缓冲区写一条到达报警", expected: "定义文本列表→设TextListID/TextID/Mode=1→调用检查RET_VAL", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "统一用户报警生成格式，便于排障"}
  decision: verified

- id: f44
  title: 诊断指令集选择框架（8 类诊断指令）
  type: framework
  merged_from: [f44]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch9.7.1 p490"}]
  V1_source_sufficiency: {passed: true, reason: "原文列出8类指令用途及GetStationInfo仅PROFINET限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "排查某PROFINET从站设备故障", expected: "先DeviceStates/ModuleStates看整体→Get_Name/IP定位→GET_DIAG/RD_SINFO读细节", observed: "按粒度递进可选定"}
  V3_task_utility: {passed: true, expected_benefit: "提供诊断工具箱的递进选择路径"}
  decision: verified

- id: f45
  title: HSC 门功能状态表（软件门×硬件门→内部门）
  type: framework
  merged_from: [f45]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch10.1.2.2 表10-7 p644"}]
  V1_source_sufficiency: {passed: true, reason: "原文状态表给出两门组合与内部门关系、频率周期模式差异"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "只在外部门开时计数", expected: "组态硬件门、软件门保持开，两门开则内部门开计数；任一关则忽略脉冲", observed: "按状态表可判定"}
  V3_task_utility: {passed: true, expected_benefit: "把计数使能逻辑固化为状态表，减少门控误组态"}
  decision: verified

- id: f46
  title: 高速计数器四类功能框架（同步/门/捕获/比较）
  type: framework
  merged_from: [f46]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch10.1.2 p643-648"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出四类功能、适用模式及编码器应用对应"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "编码器每转复位且在参考值输出脉冲", expected: "用同步(EnSync)对齐+比较功能触发输出", observed: "按功能框架可选定"}
  V3_task_utility: {passed: true, expected_benefit: "按控制需求组合HSC功能，避免全用普通计数"}
  decision: verified

- id: f47
  title: HSC 编码器监控的状态控制循环流程
  type: procedure
  merged_from: [f47]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch10.1.2.5 p648"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出启动/循环/同步中断复位完整范式"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "按编码器位置切换输出状态", expected: "装载首参考值→达参考值中断装新值与下一输出态→同步中断复位回首态", observed: "按流程可落地"}
  V3_task_utility: {passed: true, expected_benefit: "以低中断频率实现高速精确定位控制"}
  decision: verified

- id: f48
  title: PID 控制器调试流程（测量→调节→上传→验证）
  type: procedure
  merged_from: [f48]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch10.2.7/10.2.8 p728/731"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出测量/预调节/精确调节/上传及成功判据；具体调节阶段在在线帮助，候选已标注"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "整定一个温度PID", expected: "调试编辑器设采样时间测量→预调节/精确调节→上传PID参数→检查状态无错误", observed: "按流程可完成"}
  V3_task_utility: {passed: true, expected_benefit: "固化在线整定交付步骤与成功判据"}
  decision: verified

- id: f49
  title: 运动控制错误响应与排查流程（ErrorID→补救）
  type: troubleshooting
  merged_from: [f49]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch10.3.9 p871"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出ErrorID/ErrorInfo表、两类错误响应与MC_Reset确认流程"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "ErrorID=16#8000丢失驱动器就绪", expected: "查原因→提供驱动器信号→MC_Reset确认→重启命令", observed: "按流程可排查"}
  V3_task_utility: {passed: true, expected_benefit: "把运动错误定位到具体补救动作"}
  decision: verified

- id: f50
  title: PROFINET 网络连接创建与连接路径组态流程
  type: procedure
  merged_from: [f50]
  task_ids: [T05]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch11.2.1/11.2.2 p912-913"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出物理/逻辑两层组态、三要素及伙伴须已创建的条件"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "CPU与HMI建立S7连接", expected: "网络视图拖端口→属性配参数→设备和网络编辑器配GET/PUT→双方插指令绑DB", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "统一连接组态交付物，避免伙伴未指定导致失败"}
  decision: verified

- id: f51
  title: Modbus 主/从站角色选择框架
  type: framework
  merged_from: [f51]
  task_ids: [T05]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch13.5.1 p1316"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出主从角色行为、功能码映射与安全约束"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "CPU要读取远程仪表数据", expected: "设为主站/客户端，用功能码03读保持寄存器", observed: "按映射可选定"}
  V3_task_utility: {passed: true, expected_benefit: "先定角色再选功能码，减少组态返工"}
  decision: verified

- id: f52
  title: CPU 状态 LED 故障判读表（症状→状态）
  type: troubleshooting
  merged_from: [f52, p30]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.1 表15-1 p1483-1486"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出三灯组合判据及SM LED判读，覆盖p30内容"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "CPU黄常亮+ERROR红闪+MAINT闪", expected: "组态版本未知/不兼容，结合诊断缓冲区确认", observed: "按判读表可判定"}
  V3_task_utility: {passed: true, expected_benefit: "把灯光信号固化为排障第一步判据"}
  decision: verified

- id: f53
  title: 致命错误后故障模式启动排查
  type: troubleshooting
  merged_from: [f53, p31]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.1 p1485"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出故障模式三灯标志、输出行为及不能装载程序组态"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "致命错误后三灯持续闪烁", expected: "故障模式重启成功、不能装载程序/组态，须配独立急停", observed: "按流程可判定"}
  V3_task_utility: {passed: true, expected_benefit: "识别故障模式不可用状态，避免误图装载"}
  decision: verified

- id: f54
  title: 组态版本未知/不兼容错误恢复流程
  type: troubleshooting
  merged_from: [f54]
  task_ids: [T07, T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.1 p1484；ch7.7 p235"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出按原因分流的恢复路径及验证方法"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "诊断缓冲区报16#02:4175且因插了V3卡", expected: "取卡→STOP-RUN/MRES/循环上电→下载V4程序", observed: "按流程可恢复"}
  V3_task_utility: {passed: true, expected_benefit: "区分卡导致与程序导致的恢复动作"}
  decision: verified

- id: f55
  title: 转到在线并连接 CPU 流程
  type: procedure
  merged_from: [f55]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.2 p1487"}]
  V1_source_sufficiency: {passed: true, reason: "原文步骤完整，含首次选PG/PC接口与橙色在线成功标志"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "首次连接项目中的CPU", expected: "项目树选CPU→转到在线→选PG/PC接口类型与接口→橙色在线指示", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "确立所有在线运维的前置入口"}
  decision: verified

- id: f56
  title: PROFINET IO 设备名称分配与匹配排障
  type: procedure
  merged_from: [f56]
  task_ids: [T05, T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.3 p1488-1489"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出症状、三步操作与两处名称一致的验证条件"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "PROFINET数据交换不运行因设备名不匹配", expected: "在线和诊断→指定设备名称→更新列表→分配名称→两处一致后启动", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "解决PROFINET建立前置条件问题"}
  decision: verified

- id: f57
  title: 复位为出厂设置流程（含保留 IP 决策）
  type: procedure
  merged_from: [f57, p41]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.5 p1491-1492"}]
  V1_source_sufficiency: {passed: true, reason: "原文五步及有卡/无卡两种结果、保留/删除IP决策完整"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "清除保持性数据但保留IP", expected: "在线STOP→复位出厂→勾保留IP→确认（MAC固定不变）", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "固化复位决策与结果预期"}
  decision: verified

- id: f58
  title: 固件更新（STEP 7 在线）流程
  type: procedure
  merged_from: [f58]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.6 p1493-1494"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出两种更新途径、六步及不启动新固件须复位的条件"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "用STEP7在线刷固件", expected: "在线和诊断→功能→固件更新→选兼容文件→运行更新→用新固件启动模块", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "防止更新后不重启导致旧固件仍激活"}
  decision: verified

- id: f59
  title: 格式化 SIMATIC 存储卡流程与后续决策
  type: procedure
  merged_from: [f59]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.7 p1495"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出步骤、STOP前提及格式化后必须二选一重启的约束"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "格式化后想直接切RUN", expected: "不能直接RUN，须移卡重启或不移卡重启二选一", observed: "按约束可判定"}
  V3_task_utility: {passed: true, expected_benefit: "避免格式化后误操作导致停在STOP"}
  decision: verified

- id: f60
  title: 监视/修改触发点选择决策框架
  type: framework
  merged_from: [f60]
  task_ids: [T07, T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.13.4.1 表15-4 p1505-1506"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出四种触发器及改输出/改输入的最佳时机与反馈限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要修改输出并观察写入值", expected: "触发器选'扫描周期结束、写物理输出前'；要反馈用立即修改", observed: "按决策可选定"}
  V3_task_utility: {passed: true, expected_benefit: "选对触发点才能捕获期望的变量状态"}
  decision: verified

- id: f61
  title: 监视表格创建与使用流程
  type: procedure
  merged_from: [f61]
  task_ids: [T08, T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.13.4 p1504-1505"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出创建、监视选项、修改选项及Q_:P无法准确监视限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "监视某DB变量并临时改值一个周期", expected: "建监视表格→输入变量名→立即修改；Q_:P无法准确监视", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "稳定调试监视交付，提示物理输出监视限制"}
  decision: verified

- id: f62
  title: DB 在线值快照捕获与恢复流程
  type: procedure
  merged_from: [f62]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.13.3 p1502-1503"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出捕获步骤与三种恢复去向及注意事项"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要把当前DB值保存为起始值", expected: "监视所有变量→捕获快照→复制到起始值→编译下载", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "支持现场值保留与恢复"}
  decision: verified

- id: f63
  title: RUN 模式下修改和下载块（不重新初始化）流程
  type: procedure
  merged_from: [f63]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.14.5 p1516-1518"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出预留区机制、启用步骤、禁用及仅优化块/20块限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "RUN下给DB加变量且不重初始化", expected: "启用下载而不重新初始化→在预留区(默认100字节)内加变量→RUN下载，旧值保留新变量取起始值", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "在线扩展块而保住运行数据"}
  decision: verified

- id: f64
  title: RUN 模式下载临时错误与限制框架
  type: troubleshooting
  merged_from: [f64]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.14.7/15.14.5 p1519-1521"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出临时错误指令集、STATUS码、重试规则及删除逻辑后行为"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "RUN下载激活期间WRIT_DBL报82C0", expected: "判为临时错误→稍后（非本OB内）重试", observed: "按框架可判定"}
  V3_task_utility: {passed: true, expected_benefit: "避免把临时错误误判为永久故障"}
  decision: verified

- id: f65
  title: 跟踪记录 CPU 数据五步流程
  type: procedure
  merged_from: [f65]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.15 p1522"}]
  V1_source_sufficiency: {passed: true, reason: "原文五步完整，含容量及存卡1MB限制"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "捕捉间歇性变量异常", expected: "组态跟踪→传送到PLC→触发记录→上传→分析显示；须SIMATIC卡≥1MB", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "诊断间歇性问题的图解手段"}
  decision: verified

- id: f66
  title: SM 1231 模块断路条件类型判定流程
  type: troubleshooting
  merged_from: [f66]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.16 p1524-1527"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出四任务及AINFO字节26-33判据（16#0001短路/0006断线/0007超上限）"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "模拟量返回32767不知断路还是溢出", expected: "建诊断错误OB→调RALRM(F_ID=LADDR)→解析AINFO字节32/33判类型", observed: "按流程可判定"}
  V3_task_utility: {passed: true, expected_benefit: "把32767歧义值定位到具体错误类型"}
  decision: verified

- id: f67
  title: 备份与恢复选项决策矩阵（4 种备份方式）
  type: framework
  merged_from: [f67]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.17.1 p1528-1529"}]
  V1_source_sufficiency: {passed: true, reason: "原文四维修选维度及一致性/可编辑性约束完整"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "只要恢复DB实际值", expected: "用监视值快照（可编辑）；要完整恢复点用从在线设备备份（仅STOP不可编辑）", observed: "按矩阵可选定"}
  V3_task_utility: {passed: true, expected_benefit: "按需选备份方式，避免用不可编辑备份做日常恢复"}
  decision: verified

- id: f68
  title: 备份在线 CPU 流程与先决条件
  type: procedure
  merged_from: [f68, p42]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.17.2 p1530-1531"}]
  V1_source_sufficiency: {passed: true, reason: "原文四项先决条件、步骤与备份内容完整"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "备份CPU当前组态", expected: "确认PROFINET直连+在线STOP→项目树选CPU→在线→从在线设备备份", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "先决条件前置核对，避免备份失败"}
  decision: verified

- id: f69
  title: 恢复 CPU 流程与先决条件
  type: procedure
  merged_from: [f69]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.17.3 p1532-1533"}]
  V1_source_sufficiency: {passed: true, reason: "原文先决条件、安全约束与七步完整"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "恢复一个内容已知的备份", expected: "展开CPU选备份→在线→下载到设备→加载预览检查→加载→重启", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "防止恢复内容未知备份导致的安全风险"}
  decision: verified

- id: f70
  title: 比较离线/在线 CPU 与同步流程
  type: procedure
  merged_from: [f70]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.11 p1498"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出比较同步步骤、详细比较及HMI访问级别不足的权限约束"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "核对项目与在线CPU代码块", expected: "打开比较编辑器→逐对象选操作→同步装载；须读/完全访问权限", observed: "按步骤可完成"}
  V3_task_utility: {passed: true, expected_benefit: "主动核对并二向同步代码库"}
  decision: verified

- id: f71
  title: 在线/离线拓扑比较状态判断框架
  type: troubleshooting
  merged_from: [f71]
  task_ids: [T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.12 p1499"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出状态列判读六种状态与操作列二选"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "查物理拓扑是否符合组态", expected: "显示拓扑概览表→点离线/在线比较→看状态列判同/不同/仅在线/仅离线", observed: "按框架可判定"}
  V3_task_utility: {passed: true, expected_benefit: "可视化判断PROFINET物理连接符合性"}
  decision: verified

- id: f72
  title: 在 STOP 模式下启用输出的风险判断
  type: troubleshooting
  merged_from: [f72]
  task_ids: [T08]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.13.4.2 p1506 警告框"}]
  V1_source_sufficiency: {passed: true, reason: "原文警告框明确STOP下启用输出可致意外设备动作"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "STOP下从监视表写输出检查接线", expected: "先确认不会导致意外设备动作（停止≠安全），配急停", observed: "按风险判断可处置"}
  V3_task_utility: {passed: true, expected_benefit: "在高风险调试动作前强制安全检查"}
  decision: verified

# ===== 以下为 principles 候选中独立通过者（其余并入上方 framework canonical / reference / needs_review） =====

- id: p01
  title: 开放式设备必须装在封闭外壳内且仅限授权人员开启
  type: principle
  merged_from: [p01]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.1 p59"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确提出开放式设备分类与外壳/授权要求"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "规划S7-1200安装环境", expected: "装IP54外壳/控制柜、仅授权人员开、环境干燥并考虑SELV/PELV", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "安装前拦截不合规环境"}
  decision: verified

- id: p02
  title: 高压高噪声设备必须与低压逻辑设备物理隔离
  type: principle
  merged_from: [p02]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.1 p59"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确隔离规则与信号线不得同槽"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "柜内同时有变频器与PLC", expected: "变频器与PLC隔离，低压信号线不与交流动力线同槽", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "降低传导/感应耦合干扰风险"}
  decision: verified

- id: p03
  title: 冷却与接线空隙下限 25 mm
  type: rule
  merged_from: [p03]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.1 p60"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出上下≥25mm、前端≥25mm及纵向降10°C的明确数值"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "在紧凑机柜安装CPU", expected: "上下各留≥25mm、前端与柜壁≥25mm；纵向安装温度上限再降10°C", observed: "按数值可核验"}
  V3_task_utility: {passed: true, expected_benefit: "把散热间隙固化为可核对安装项"}
  decision: verified

- id: p04
  title: 外部 24V DC 电源不得与 CPU 传感器电源并联
  type: rule
  merged_from: [p04]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.2 p61"}]
  V1_source_sufficiency: {passed: true, reason: "原文警告明确禁止并联并给出后果与共M建议"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "传感器电源不足想加外部电源", expected: "加独立外部24V、绝不与CPU传感器电源并联、仅共M", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "防止电源冲突导致寿命缩短/立即故障"}
  decision: verified

- id: p05
  title: 所有非隔离 M 端子必须接到同一参考电位
  type: rule
  merged_from: [p05]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.2 p61"}]
  V1_source_sufficiency: {passed: true, reason: "原文警告明确同电位要求及后果"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "系统有多个非隔离24V回路", expected: "所有非隔离M端子接同一参考电位", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "避免意外环流损坏设备"}
  decision: verified

- id: p07
  title: 接地接线前必须断电，并采用独立于 PLC 的安全措施
  type: principle
  merged_from: [p07]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.4 p81"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确断电要求与独立急停/机电超控/冗余安全功能"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要接线与接地", expected: "先断所有相关设备电源并配置独立于PLC的急停", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "把独立安全兜底固化为强制项"}
  decision: verified

- id: p08
  title: 单点接地，地线尽可能短且用大线径
  type: rule
  merged_from: [p08]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.4 p82"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出单点接地、直连大地、短且≥2mm²规则"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "规划系统接地", expected: "所有公共端单点接地直连大地，地线短且用≥2mm²(14AWG)", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "统一接地施工口径"}
  decision: verified

- id: p09
  title: 接线须提供隔离开关、过流保护与浪涌抑制
  type: checklist
  merged_from: [p09]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.4 p83"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出隔离开关/过流/浪涌/短电线/屏蔽接地等要点"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "设计一套接线防护", expected: "装总隔离开关、过流保护、浪涌抑制、屏蔽单端接地、合适线径", observed: "按清单可核对"}
  V3_task_utility: {passed: true, expected_benefit: "减少接线防护遗漏"}
  decision: verified

- id: p11
  title: 感性负载必须加抑制电路，灯负载需浪涌限制
  type: principle
  merged_from: [p11]
  task_ids: [T01]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch4.4 p85-87"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出抑制电路位置、类型（二极管/稳压管/MOV）与灯负载浪涌倍数"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "继电器输出驱动接触器线圈", expected: "线圈两端跨接抑制且靠近负载（AC用MOV/DC二极管+稳压管）", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "降低输出损坏与PLC被噪声中断风险"}
  decision: verified

- id: p13
  title: 启动 OB 中读物理输入必须立即读（过程映像输入读为零）
  type: rule
  merged_from: [p13]
  task_ids: [T02, T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1 p96"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确启动OB读I得零须I_:P及多OB按编号升序"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "启动OB判断端子当前电平", expected: "读I0.0得0，须I0.0:P；多启动OB按编号升序执行", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "避免启动逻辑读到零值误判"}
  decision: verified

- id: p14
  title: 启动阶段中断只排队不处理，循环时间监视不执行
  type: rule
  merged_from: [p14]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1 p96"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确启动期中断入队不处理、不监视循环、HSC/PWM/PtP仅RUN运行"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "启动阶段发生硬件中断", expected: "中断入队不处理，进RUN后才执行", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "界定启动期行为边界"}
  decision: verified

- id: p16
  title: 循环中断 OB 规则：每个事件一个 OB、最多四个、相移错开
  type: rule
  merged_from: [p16]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3.4 p100"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出4个上限、一事件一OB、相移及最大相移取值"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要配两个循环中断", expected: "最多4个、各绑一个OB、用相移错开，最大相移取min(6000ms,最大循环时间)", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "防止循环中断配置越界或同时抢占"}
  decision: verified

- id: p17
  title: 中断事件数量上限（上升/下降沿、HSC）
  type: rule
  merged_from: [p17]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.3.5 p101"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出上升沿16/下降沿16/HSC各6的上限"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要配置20个上升沿事件", expected: "超出16上限，须减到≤16", observed: "按数值可判定"}
  V3_task_utility: {passed: true, expected_benefit: "规划阶段拦截超限配置"}
  decision: verified

- id: p20
  title: 访问物理 I/O 加 :P 后缀，I_:P 只读、Q_:P 只写
  type: rule
  merged_from: [p20]
  task_ids: [T02, T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.2.1 p127-130"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出:P语义、只读/只写及映像更新副作用"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "程序中要立即读物理输入", expected: "用I0.3:P（只读且不更新映像）；Q1.7:P（只写且同时改映像）", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "区分过程映像与立即访问，避免读陈旧值"}
  decision: verified

- id: p21
  title: 绝对地址构成与 SCL 必须加 % 前缀
  type: rule
  merged_from: [p21]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.2.1 p128/131"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出地址构成与SCL必须加%否则编译报错"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "在SCL中写绝对地址M3.4", expected: "必须写%M3.4，否则编译报未定义变量", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "减少编译期地址错误"}
  decision: verified

- id: p22
  title: 存储区访问属性表（I/Q/M/L/DB）
  type: template
  merged_from: [p22]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.2.1 表5-21 p127"}]
  V1_source_sufficiency: {passed: true, reason: "原文表格给出各存储区可强制/保持性属性"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要强制某输入点", expected: "I过程映像不可强制，须强制I_:P外设", observed: "按表可判定"}
  V3_task_utility: {passed: true, expected_benefit: "统一存储区属性口径，避免强制错区"}
  decision: verified

- id: p23
  title: I/O 地址按 8 点数字量 / 2 点模拟量分组分配
  type: rule
  merged_from: [p23]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.2.1 p132"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确数字量每8点1字节、模拟每点2字节分组"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "8点DI模块只用5点", expected: "仍占1字节，下一模块从下一字节起", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "预判地址分配，避免地址冲突"}
  decision: verified

- id: p24
  title: 临时存储器局部有效，每优先级 16KB/6KB 分配
  type: rule
  merged_from: [p24]
  task_ids: [T02, T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.2.1/5.1.5 p130-131"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出L区局部性与每优先级本地存储器容量"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "FC想读调用它的OB的临时变量", expected: "读不到（L仅块内局部），改用M/DB传递", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "避免跨块访问临时区的错误设计"}
  decision: verified

- id: p25
  title: 模拟量转换顺序：先标准化 0.0–1.0 再标定工程单位
  type: principle
  merged_from: [p25]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.3 p133"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确两步顺序与NORM_X/SCALE_X指令"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "4-20mA对应0-100°C", expected: "NORM_X标准化到0.0-1.0→SCALE_X标定到0-100", observed: "按两步可完成"}
  V3_task_utility: {passed: true, expected_benefit: "统一模拟量换算流程"}
  decision: verified

- id: p26
  title: 模拟值标定通用公式与额定范围
  type: calculation
  merged_from: [p26]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.3 p133-134"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出线性插值公式及0~27648/-27648~27648额定范围；示例24768疑为笔误，候选已标注以实际范围为准"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "输入值13824，量程0~27648对应0~100°C", expected: "0+13824×100/27648=50°C（容差：以模块实际额定范围为准）", observed: "按公式算出50°C"}
  V3_task_utility: {passed: true, expected_benefit: "统一工程量换算口径并明示数值边界冲突"}
  decision: verified

- id: p27
  title: 浮点精度规则：Real 6 位、LReal 15 位有效数字
  type: rule
  merged_from: [p27]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.4.3 p138"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出有效位数与数量级相差丢失小量的示例"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "Real计算1e8+1", expected: "结果仍为1e8（+1丢失）；需高精度用LReal", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "指导数据类型选用，避免精度损失"}
  decision: verified

- id: p28
  title: 整数数据类型数值范围表
  type: calculation
  merged_from: [p28]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.4.2 表5-30 p137"}]
  V1_source_sufficiency: {passed: true, reason: "原文表格给出各整型范围及N位范围公式"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "要存-40000", expected: "Int(-32768~32767)不足，须用DInt", observed: "按范围可选定"}
  V3_task_utility: {passed: true, expected_benefit: "避免数值溢出选型错误"}
  decision: verified

- id: p35
  title: 通信缓冲区一致性：避免循环 OB 与中断 OB 同时读写
  type: rule
  merged_from: [p35]
  task_ids: [T04, T05]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.4 p213"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出避免同时读写原则及中断OB改缓冲区须DIS_AIRT/EN_AIRT"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "中断OB要改通信缓冲区", expected: "用DIS_AIRT延迟中断直到EN_AIRT，或避免在两OB同时读写", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "防止通信缓冲区数据撕裂"}
  decision: verified

- id: p36
  title: SCALE_X / NORM_X 公式、参数类型与越界行为
  type: calculation
  merged_from: [p36]
  task_ids: [T06]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch8.7.5 p323-325"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出两条公式、参数范围与ENO行为；MIN取值已注明（电流0/电压-27648）"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "NORM_X(VALUE=13824,MIN=0,MAX=27648)", expected: "OUT=0.5，ENO=TRUE；VALUE=30000时线性外推>1.0", observed: "按公式算出0.5"}
  V3_task_utility: {passed: true, expected_benefit: "统一指令级标定公式与越界判读"}
  decision: verified

- id: p38
  title: 强密码与安全实践清单
  type: checklist
  merged_from: [p38]
  task_ids: [T07, T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.6.1 p227"}]
  V1_source_sufficiency: {passed: true, reason: "原文Siemens建议给出强密码/HTTPS/不扩Everybody/变量范围检查"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "配置Web服务器访问", expected: "强密码≥10字符、仅HTTPS、不扩大Everybody权限、对变量做范围检查", observed: "按清单可核对"}
  V3_task_utility: {passed: true, expected_benefit: "减少弱口令与无效值注入风险"}
  decision: verified

- id: p39
  title: PUT/GET 通信访问须显式启用
  type: rule
  merged_from: [p39]
  task_ids: [T05, T07]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch7.6.2 p228"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出默认禁用及启用两条件"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "远程客户端要PUT/GET访问CPU数据", expected: "保护级别设非'无访问'+勾选允许PUT/GET+下载", observed: "按规则可完成"}
  V3_task_utility: {passed: true, expected_benefit: "避免误以为有密码即禁止通信访问"}
  decision: verified

- id: p40
  title: RS485 网络只端接和偏置两端设备
  type: rule
  merged_from: [p40]
  task_ids: [T05]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch13.2 p1223-1224"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确仅两端On、中间Off及接线细节"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "RS485总线上5台设备", expected: "仅两端设备开关置On端接偏置，中间3台置Off", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "防止多点端接导致信号反射"}
  decision: verified

- id: p43
  title: 保持性数据备份须禁用写访问以保证一致性
  type: rule
  merged_from: [p43]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.17.1 p1529"}]
  V1_source_sufficiency: {passed: true, reason: "原文明确备份期禁用写访问及CPU备份仅含非保持性起始值"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "备份保持性数据", expected: "备份期间禁用其所有写访问以保证一致", observed: "按规则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "避免备份出不一致的保持性值"}
  decision: verified

- id: p44
  title: 恢复内容未知备份的警告
  type: principle
  merged_from: [p44]
  task_ids: [T10]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch15.17.3 p1532"}]
  V1_source_sufficiency: {passed: true, reason: "原文警告明确未知备份的财产/人身风险"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "拿到一个来路不明的备份", expected: "先确认内容已知为预期组态，否则不得恢复", observed: "按原则可判定"}
  V3_task_utility: {passed: true, expected_benefit: "防止恢复未知组态造成事故"}
  decision: verified

- id: p46
  title: 时钟存储器位—周期/频率映射表
  type: calculation
  merged_from: [p46]
  task_ids: [T03]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch5.1.6 表5-20 p123"}]
  V1_source_sufficiency: {passed: true, reason: "原文表格给出位0-7对应周期/频率及频率=1/周期关系"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "需要0.5Hz方波", expected: "用位7（周期2.0s，频率=1/2.0=0.5Hz）", observed: "按表可查得位7"}
  V3_task_utility: {passed: true, expected_benefit: "快速定位时钟位，避免手算错误"}
  decision: verified

- id: p47
  title: SCL 转换与取整规则（ROUND/TRUNC/CEIL/FLOOR）
  type: rule
  merged_from: [p47]
  task_ids: [T02]
  source_evidence: [{source_id: A5E02486685-AK, location: "ch8.7.3/8.7.4 p323/324"}]
  V1_source_sufficiency: {passed: true, reason: "原文给出四种取整语义及超范围ENO=0"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "ROUND(2.6)/TRUNC(2.6)/CEIL(2.2)/FLOOR(2.8)", expected: "分别为3/2/3/2；超目标范围ENO=0", observed: "按语义可算出"}
  V3_task_utility: {passed: true, expected_benefit: "明确取整语义，避免转换错误"}
  decision: verified

# ===== 补缺口批次（2026-11-16 22:50，从备份快照 PDF 附录 A/B/D 重提取）=====
# 说明：p06 原为 needs_review（缺附录数值），本批补齐 CPU/模块电流数值 + 手册算例并独立复算通过，升为 verified。
#       f73 为附录 D 设备更换兼容决策流程，本批新增（原 T09 弱覆盖）。

- id: p06
  title: 功率预算 5V/24V 定量核算（CPU 预算值 + 模块需求查表 + 差额判定）
  type: calculation
  merged_from: [p06]
  task_ids: [T01]
  source_evidence:
    - {source_id: A5E02486685-AK, location: "附录B 计算功率预算 p1779-1782（表B-1算例/表B-2模板）"}
    - {source_id: A5E02486685-AK, location: "附录A 各CPU可用电流 p1549/1567/1584/1601/1620"}
  inputs: "CPU 型号；扩展模块清单(SM/CM/SB)及其5V需求；24V负载点数(数字量输入4mA/点、继电器线圈11mA/点)"
  formula: "5V差额 = CPU的5V预算 − Σ模块5V需求；24V差额 = CPU的24V传感器预算 − Σ(输入点×4mA + 继电器线圈×11mA)。差额<0 即超预算"
  units: mA
  output: "5V/24V 各自电流差额；24V<0 时给出所需外部电源最小 mA 数"
  V1_source_sufficiency: {passed: true, reason: "附录B表B-1给出完整算例（CPU1214C:5V1600/24V400mA，模块逐项需求）与表B-2空白模板；附录A给出5种CPU预算值；数值口径统一为mA，5V/24V分列。原文已存档 appendix-source.md。"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "手册算例：CPU1214C AC/DC/Rly + SB1223 + CM1241 + 3×SM1223 + SM1221，48入36出", expected: "5V=50+220+3×145+105=810mA，差额1600−810=790mA(充足)；24V=56+8+96+264+32=456mA，差额400−456=−56mA(缺56mA)，须加≥56mA外部24V电源", observed: "独立复算与手册表B-1数值逐项一致（见 appendix-source.md 复算校验）"}
  V3_task_utility: {passed: true, expected_benefit: "使 T01 从定性决策升级为可独立定量核算：给定组态即可算出两路余量、判定是否需外部电源及其最小容量，杜绝凭经验估算"}
  boundary: "外部24V电源不得与CPU传感器电源并联（双电源冲突致运行不确定）；所有非隔离M端子须接同一参考电位；内部继电器线圈功率已计入CPU预算，不重复计算；更多模块型号需求须回附录A逐查（reference-tables.md仅列算例值）"
  decision: verified

- id: f73
  title: V3.0→V4.2 CPU 设备更换决策与兼容检查流程
  type: procedure
  merged_from: [f73]
  task_ids: [T09]
  source_evidence:
    - {source_id: A5E02486685-AK, location: "附录D.1 用V4.2 CPU更换V3.0 CPU p1799-1806"}
  inputs: "现有V3.0项目及STEP7版本；待换CPU/模块；是否含HMI/运动控制TO/专有技术保护块/自定义Web页"
  steps:
    - "确认方向：仅支持 V3.0→V4.2 硬件更换，不可固件升级；下载组态后 V4.2 不可换回 V3.0；更换前先归档 V3.0 项目"
    - "升级项目：STEP7 V11/V12 先升 V13 SP1 再升 V14；禁止从旧版直接复制粘贴程序逻辑，须整项目升级后编辑"
    - "核对兼容项：密码保护级别映射；OB 中断属性(V3默认不可中断)；传送卡不兼容须重建V4.2卡；GET/PUT默认启用"
    - "运动控制：V1/V2库由编译替换为V3指令；TO版本不自动升级须手动选V5.0；核对轴参数字段重命名与指令(RDREC/WRREC/CONV)变化"
    - "HMI：重新编译项目、下载CPU与HMI、按需更新HMI固件"
    - "DB预留区：V4.0+每DB增100字节预留；下载前在 选项>设置>PLC编程>常规 将预留设0；已换设备则逐DB属性删除"
    - "解除专有技术/序列号复制保护→重新编译全部程序块→纠正所有错误→下载；OEM保护块须索取V4.2版本"
  outputs: "完成可下载的V4.2项目；更换后不可回退（下载前可撤消）"
  V1_source_sufficiency: {passed: true, reason: "附录D.1 p1799-1806 给出完整更换条件、方向约束、STEP7升级路径、密码映射表、运动控制版本表、DB预留区步骤、重新编译要求，步骤与边界完整，原文存档 appendix-source.md"}
  V2_executability: {passed: true, check_mode: walkthrough, input: "某V3.0项目(STEP7 V12)含HMI+运动控制V3.0 TO+专有技术保护块，需换V4.2", expected: "先V12→V13SP1→V14整项目升级；核对密码映射与OB属性；TO手动升V5.0并处理字段重命名；HMI重编译下载；解除专有技术保护后重编译全部块；下载前可撤消、下载后不可回退", observed: "按7步流程可覆盖全部兼容点并得出正确顺序"}
  V3_task_utility: {passed: true, expected_benefit: "把散落附录D的十几处兼容约束固化为有序检查清单，防止漏升STEP7/漏改TO版本/漏删DB预留区/误以为可回退等导致下载失败或运行异常"}
  boundary: "方向不可逆（下载后无法V4.2换回V3.0）；V3.0传送卡不可用；V4.0/V4.1项目可在V4.2直接运行无需修改；纯订货号/端子排套件表走检索(reference-tables.md)不在此流程"
  decision: verified
```
