# Counter-example candidates — 来源：西门子 S7-1200 系统手册 V4.2（2016，A5E02486685-AK，PDF p29–1534）；提取器：counter-example-extractor；提取时间：2026-11-16
# 说明：每条均回原文（chunks.jsonl / source.md）核验引用与 PDF 页码；包含 failure_mode + mechanism + warning_signs + bound_to；按职责不做筛选，宁多勿漏。

- id: ce01
  title: 安装环境不当导致电气故障与意外机械动作
  type: counter-example
  source_chapter: 4.1 S7-1200 设备安装准则 · PDF p59
  source_quote: |
    "警告：S7-1200 安装不当会导致发生电气故障或出现意外的机械操作。电气故障或意外的机械操作可能会导致死亡、人员重伤和/或财产损失。必须遵守适当操作环境的所有安装和维护说明以确保设备安全运行。"
  failure_mode: |
    安装时不考虑防尘、防潮、隔离热源/高压/电噪声、不留散热间隙，导致 PLC 内部发生电气故障或受控设备意外动作。
  mechanism: |
    灰尘/潮湿/大气污染会形成导电性污染，在 PLC 中引起操作和电气故障；高压高电噪声设备靠近低压逻辑设备，会通过传导与感应耦合干扰；自然对流散热依赖上下各≥25mm 空隙，空间不足导致过热降额。
  warning_signs:
    - 安装区域有粉尘/潮湿/导电污染却未用 IP54 等外壳
    - 低压信号线与交流动力线、高能量快速开关直流线走同一线槽
    - 设备上方或下方空隙小于 25mm
  bound_to:
    - 功率预算计算
    - CPU/模块选型
    - 安装接线规范
  tags: [counter-example, installation, safety, environment]
  task_ids: [T01]

- id: ce02
  title: 纵向（垂直）安装仍套用水平安装的温度上限
  type: counter-example
  source_chapter: 4.1 S7-1200 设备安装准则 · PDF p60
  source_quote: |
    "小心：对于纵向安装，允许的最大环境温度将降低 10°C。请按图所示调整垂直安装的 S7-1200 系统的方位。"
  failure_mode: |
    按水平安装的环境温度选型，设备改为垂直安装后超出降额后的温度上限，导致过热、寿命缩短或误动作。
  mechanism: |
    垂直安装破坏自然对流效率，散热能力下降，手册明确规定最大环境温度降低 10°C；选型阶段若不把安装方位作为变量，温度裕度会被悄然吃掉。
  warning_signs:
    - 机柜空间受限改垂直安装但未重新核算环境温度
    - 环境温度接近 CPU 标称上限
  bound_to:
    - CPU/模块选型
    - 功率预算计算
  tags: [counter-example, installation, thermal, derating]
  task_ids: [T01]

- id: ce03
  title: 把外部 24V 电源与 CPU 传感器电源并联
  type: counter-example
  source_chapter: 4.2 功率预算 · PDF p61
  source_quote: |
    "警告：将外部 24V DC 电源与 24V DC 传感器电源并联会导致这两个电源之间有冲突，因为每个电源都试图建立自己首选的输出电压电平。该冲突可能使其中一个电源或两个电源的寿命缩短或立即出现故障，从而导致 PLC 系统的运行不确定。"
  failure_mode: |
    当 24V 传感器电源预算不足时，把外部 24V 电源并到传感器电源上，导致电源冲突、寿命缩短或立即故障、系统运行不确定。
  mechanism: |
    两个电源各自试图建立自己的输出电压，并联后形成环流与电压拉锯；运行不确定意味着故障不可预测，可能升级为安全事故。正确做法是 DC 传感器电源和外部电源分别给不同位置供电，仅连接公共端 M。
  warning_signs:
    - 24V 传感器电源预算不够，想"补一个电源并联"
    - 外部电源与传感器电源正极接在一起
  bound_to:
    - 功率预算计算
    - CPU/模块选型
    - 安装接线规范
  tags: [counter-example, power-budget, wiring, safety]
  task_ids: [T01]

- id: ce04
  title: 非隔离 M 端子接到不同参考电位
  type: counter-example
  source_chapter: 4.2 功率预算 · PDF p61
  source_quote: |
    "警告：将非隔离的 M 端子连接到不同参考电位将导致意外的电流，该电流可能导致 PLC 和任何连接设备损坏或运行不确定。务必确保 S7-1200 系统中的所有非隔离 M 端子都连接到同一个参考电位。"
  failure_mode: |
    把标注为"非隔离"的 M 端子（CPU 电源、SM 继电器线圈电源、非隔离模拟量输入电源）接到不同参考电位，形成意外电流烧毁 PLC 与连接设备。
  mechanism: |
    手册指出这些 24V 电源输入端口通过公共逻辑电路互连；互连的 M 端子若电位不同，会在回路中产生计划外的环流，造成损坏或不确定运行。
  warning_signs:
    - 系统里存在多个"非隔离"标注的电路
    - 不同模块的 M 端子各自就近接地而非统一参考点
  bound_to:
    - 功率预算计算
    - 安装接线规范
  tags: [counter-example, power-budget, grounding, wiring]
  task_ids: [T01]

- id: ce05
  title: 在易燃或易爆环境中断开带电连接设备
  type: counter-example
  source_chapter: 4.3.2 安装和拆卸 CPU · PDF p66
  source_quote: |
    "警告：请勿在易燃或易爆环境中断开连接设备。在易燃或易爆环境中断开连接设备可能会引起火灾或爆炸，从而导致死亡、人员重伤和/或财产损失。"
  failure_mode: |
    在危险区域带电插拔或断开连接，产生电弧/火花引燃周围气体或粉尘，造成火灾爆炸与人身伤害。
  mechanism: |
    断开带电回路必然伴随触点分离电弧；在易燃/易爆气氛中电弧是点火源，因此手册把"断开连接设备"本身列为禁止项，而非仅强调断电。
  warning_signs:
    - 作业区域存在可燃气体、蒸气或粉尘
    - 需要在运行中插拔连接器
  bound_to:
    - 安装拆卸流程
    - 设备更换
  tags: [counter-example, installation, hazardous-location, safety]
  task_ids: [T01]

- id: ce06
  title: 徒手拿放板卡造成静电放电损坏
  type: counter-example
  source_chapter: 4.3.2 安装和拆卸 CPU · PDF p66；5.5.1 在 CPU 中插入存储卡 · PDF p152
  source_quote: |
    "说明：静电放电可能会损坏设备或 CPU 上的卡槽。在拿放设备时，请与已接地的导电垫接触或使用接地腕带。"
    "注意：静电放电可能会损坏存储卡或 CPU 上的卡槽。在操控存储卡时，请先接触接地传导垫和/或佩戴接地腕带。将存储卡存放在导电容器内。"
  failure_mode: |
    未采取防静电措施就触碰 CPU、信号板或存储卡，静电放电击穿半导体或损伤卡槽，造成隐性或 immediate 失效。
  mechanism: |
    人体可积累数千伏静电，放电电流通过 I/O 引脚/卡槽触点进入器件；损伤可能是潜在性的，当时不表现、后期才出现间歇故障，因此难以归因。
  warning_signs:
    - 干燥季节/地毯环境作业
    - 直接手持 PCB 板边或存储卡触点
    - 存储卡装在普通塑料盒而非导电容器
  bound_to:
    - 存储卡与固件维护
    - 安装拆卸流程
  tags: [counter-example, esd, installation, maintenance]
  task_ids: [T10, T01]

- id: ce07
  title: BB 1297 电池板装入未规定的电池
  type: counter-example
  source_chapter: 4.3.3 安装和拆卸 SB、CB 或 BB · PDF p69
  source_quote: |
    "警告：在 BB 1297 中安装未规定的电池或将未规定的电池连接到电路，可能会导致火灾或部件元件损坏以及不可预测的设备运行情况。请仅使用规定的 CR1025 电池作为实时时钟的后备电源。"
  failure_mode: |
    用非 CR1025 型号的电池替换实时时钟后备电池，导致漏液、火灾、元件损坏或不可预测的运行。
  mechanism: |
    电池的电压、尺寸、放电特性与卡片夹设计匹配；型号不符会造成接触不良、过流或化学泄漏，且电池板是"备用时钟"路径，故障表现为时钟丢失而非立即停机，容易被忽略。
  warning_signs:
    - 现场没有 CR1025，用"差不多型号"的纽扣电池代替
    - 电池正负极装反或未卡入卡夹
  bound_to:
    - 设备维护与备件更换
    - 时钟/时间戳可信度
  tags: [counter-example, battery, hardware, safety]
  task_ids: [T09, T10]

- id: ce08
  title: 用工具强行分离模块或拧过头
  type: counter-example
  source_chapter: 4.3.6 拆卸和重新安装端子板连接器 · PDF p73；4.3.2 安装和拆卸 CPU · PDF p67；4.4 接线准则 · PDF p84
  source_quote: |
    "注意：不要使用工具分离模块。请不要使用工具来分离模块，否则可能损坏设备。"
    "避免对安装螺钉施加过多扭矩。不要使用平头螺钉。"
    "* 为避免损坏连接器，小心不要将螺丝拧得过紧。"
  failure_mode: |
    用螺丝刀硬撬模块、使用平头螺钉、或对端子螺丝施加过大扭矩，造成卡夹/连接器/螺纹损坏。
  mechanism: |
    端子板与模块靠弹性卡扣定位而非螺纹承载，金属工具会把塑料卡爪撬断；扭矩超过 0.56 N·m（CPU/SM）或 0.33 N·m（SB）会压裂绝缘；平头螺钉会顶伤面板/导轨接触面并影响接地。
  warning_signs:
    - 用一字螺丝刀当撬棍拆模块
    - 电动螺丝刀未设扭矩上限
    - 用平头螺钉固定 CPU
  bound_to:
    - 安装拆卸流程
    - 设备更换
  tags: [counter-example, installation, mechanical, torque]
  task_ids: [T01, T09]

- id: ce09
  title: 带电进行接地与接线作业
  type: counter-example
  source_chapter: 4.4 接线准则 · PDF p81
  source_quote: |
    "警告：安装已上电的 S7-1200 或相关设备或者为这些设备接线可能会导致电击或意外设备操作。如果在安装或拆卸过程中没有断开 S7-1200 或相关设备的所有电源，则可能会由于电击或意外设备操作而导致死亡、人员重伤和/或财产损失。"
  failure_mode: |
    在设备仍带电时安装或接线，导致触电、短路或受控设备意外动作。
  mechanism: |
    接线端子在带电状态下裸露，工具或导线误碰相邻电位会造成相间短路和电弧；I/O 回路意外接通可能驱动执行器动作。手册要求先断开 S7-1200 及所有相关设备的电源，并确认。
  warning_signs:
    - 为"省事"不断电插拔 I/O 连接器
    - 未锁定挂牌（LOTO）就开工
    - 只关了 PLC，没关外部 24V/执行器电源
  bound_to:
    - 安装接线规范
    - 设备更换
  tags: [counter-example, wiring, electrical-safety, lockout]
  task_ids: [T01]

- id: ce10
  title: 把 PLC 当作唯一的安全屏障
  type: counter-example
  source_chapter: 4.4 接线准则 · PDF p81；7.1 设计 PLC 系统的指南 · PDF p199
  source_quote: |
    "警告：控制设备在不安全情况下运行时可能会出现故障，从而导致受控设备的意外运行。这种意外操作可能会导致死亡、人员重伤和/或财产损失。应使用紧急停止功能、机电超控功能或其它独立于 S7-1200 的冗余安全功能。"
    "此信息仅用于设计正常和预期的异常操作。出于安全考虑，不应依赖此'最佳情况'方案。"
  failure_mode: |
    仅靠 PLC 程序实现安全联锁，不设独立于 PLC 的急停/机电超控，一旦 PLC 故障或程序跑飞，受控设备失控伤人损物。
  mechanism: |
    电子控制设备可能失灵并导致意外动作；PLC 的单点故障（CPU、程序、I/O、电源）会同时击穿"检测—决策—执行"整条安全链，所以必须保留独立于 PLC 的硬接线兜底。
  warning_signs:
    - 安全联锁只写在用户程序里
    - 没有硬件急停回路
    - 风险评估把 PLC 当作"安全 PLC"但型号并非 failsafe
  bound_to:
    - 系统设计/安全回路
    - PLC 程序结构设计
  tags: [counter-example, functional-safety, independent-safety, design]
  task_ids: [T02]

- id: ce11
  title: 用非隔离或单绝缘电源给低压电路供电
  type: counter-example
  source_chapter: 4.4 接线准则 · PDF p82
  source_quote: |
    "警告：若使用非隔离或单绝缘电源通过交流线路给低压电路供电，可能会导致本来应当可以安全触摸的电路上出现危险电压，例如，通信电路和低压传感器线路。这种意外的高压可能会引起电击而导致死亡、人员重伤和/或财产损失。"
  failure_mode: |
    使用非隔离/单绝缘的 AC-DC 电源给 SELV 低压电路供电，使本应可安全触摸的通信口、传感器线路带上危险电压。
  mechanism: |
    AC 线路与低压电路之间失去双重/加强绝缘或基本绝缘+辅助绝缘，隔离边界失效后市电窜入低压侧；手册限定只用合格的高压转低压整流器作为可安全接触电路的电源。
  warning_signs:
    - 用廉价非隔离 AC-DC 模块给传感器/通信供电
    - 误以为 24V DC 电路天然安全隔离（手册：24V 间隔离仅起一定作用）
  bound_to:
    - 安装接线规范
    - 电源/选型
  tags: [counter-example, insulation, selv, electrical-safety]
  task_ids: [T01]

- id: ce12
  title: 灯负载直接用继电器输出导致触点烧蚀
  type: counter-example
  source_chapter: 4.4 接线准则 · PDF p85
  source_quote: |
    "由于接通浪涌电流大，灯负载会损坏继电器触点。该浪涌电流通常是钨灯稳态电流的 10 到 15 倍。对于在应用期间将进行大量开关操作的灯负载，建议安装可更换的插入式继电器或浪涌限制器。"
  failure_mode: |
    用 S7-1200 继电器输出直接驱动频繁开关的灯负载，触点被 10–15 倍浪涌电流烧蚀、粘连或early失效。
  mechanism: |
    钨丝灯冷态电阻低，上电瞬间电流为稳态 10–15 倍；继电器触点在反复开断中承受电弧与热冲击，寿命被急剧消耗。插入式继电器或浪涌限制器把冲击转移到可更换/可抑制的环节。
  warning_signs:
    - 输出带白炽灯/钨灯且频繁通断
    - 未加插入式继电器或浪涌限制器
  bound_to:
    - 输出接线与负载选型
    - 继电器寿命估算
  tags: [counter-example, load, relay, inrush]
  task_ids: [T01]

- id: ce13
  title: 感性负载缺少抑制电路导致输出损坏与 PLC 中断
  type: counter-example
  source_chapter: 4.4 接线准则 · PDF p85–86
  source_quote: |
    "抑制电路可保护输出，防止通过感性负载中断电流时产生的高压瞬变导致其过早损坏。抑制能力差的感性负载产生的高频噪声会中断 PLC 的运行。"
  failure_mode: |
    继电器输出开关感性负载时不加抑制电路，高压瞬变损坏输出触点，高频噪声导致 PLC 运行中断。
  mechanism: |
    感性负载电流不能突变，断开时产生反电动势尖峰；继电器输出没有内置抑制（DC 输出有），尖峰与高频噪声耦合进 PLC 电源/逻辑。MOV 单独使用（无并联 RC）反而引入显著高频噪声。
  warning_signs:
    - 继电器输出直接驱动接触器/线圈且未跨接抑制
    - 只用 MOV 不加 RC 就以为够了
    - 抑制元件额定值未按峰值电压/功率校核
  bound_to:
    - 输出接线与负载选型
    - 抗干扰设计
  tags: [counter-example, inductive-load, suppression, noise]
  task_ids: [T01]

- id: ce14
  title: 用 Windows 格式化程序重格式化 SIMATIC 存储卡
  type: counter-example
  source_chapter: 5.5.5 固件更新 · PDF p162
  source_quote: |
    "注意：请勿使用 Windows 的格式化程序或其它格式化程序来重新格式化存储卡。如果使用 Microsoft Windows 的格式化程序重新格式化了 Siemens 存储卡，那么 S7-1200 CPU 将无法再使用该存储卡。"
  failure_mode: |
    用 Windows 自带格式化工具清理/重格式化西门子存储卡，导致 CPU 再也无法识别和使用该卡。
  mechanism: |
    SIMATIC 卡需要预格式化并带有专用作业文件与隐藏文件；通用文件系统格式化会抹掉这些专用结构，CPU 的评估流程找不到作业文件即判定无效。
  warning_signs:
    - 卡"读不出来"就右键格式化
    - 用普通 SD 卡格式化工具处理 SIMATIC 卡
  bound_to:
    - 存储卡与固件维护
    - 设备维护流程
  tags: [counter-example, memory-card, formatting, maintenance]
  task_ids: [T10]

- id: ce15
  title: 删除存储卡上的 __LOG__ 与 crdinfo.bin 隐藏文件
  type: counter-example
  source_chapter: 5.5.5 固件更新 · PDF p163；5.5.3 传送卡 · PDF p156；5.5.4 程序卡 · PDF p160
  source_quote: |
    "注意：请勿删除存储卡上的'__LOG__'和'crdinfo.bin'隐藏文件。存储卡必须包含'__LOG__'和'crdinfo.bin'文件。如果删除了这些文件，将无法在 CPU 中使用该存储卡。"
  failure_mode: |
    为"清空"存储卡手动或靠清理软件删除隐藏系统文件，导致该卡在 CPU 中彻底不可用。
  mechanism: |
    这两个隐藏文件是 CPU 识别和管理存储卡的必要条件；它们默认隐藏，容易被"清理垃圾"操作连带删除，且删除后没有明显报错提示，直到插卡才暴露。
  warning_signs:
    - 用"显示隐藏文件"后手工逐项删除
    - 第三方清理软件勾选清理卡片
  bound_to:
    - 存储卡与固件维护
    - 传送卡/程序卡制作
  tags: [counter-example, memory-card, hidden-files, maintenance]
  task_ids: [T10]

- id: ce16
  title: 向运行中的 CPU 插入存储卡
  type: counter-example
  source_chapter: 5.5.1 在 CPU 中插入存储卡 · PDF p152；5.5.3 传送卡 · PDF p157；5.6 丢失密码后恢复 · PDF p165
  source_quote: |
    "警告：插入存储卡之前，请检查并确认 CPU 当前未执行任何操作。如果将存储卡（无论组态为程序卡、传送卡还是固件更新卡）插入到正在运行的 CPU，CPU 将立即进入 STOP 模式，这可能引起过程中断，进而导致人员死亡或严重受伤。"
  failure_mode: |
    不检查 CPU 状态就插卡（含用空传送卡恢复密码），使运行中的 CPU 立即进入 STOP，造成过程中断甚至安全事故。
  mechanism: |
    CPU 评估存储卡的前提是 STOP；运行中插卡会强制切换 STOP，输出进入组态的替换/冻结状态，受控机器可能失控。手册要求插卡前确保 CPU 未控制任何机器或过程，并装急停电路。
  warning_signs:
    - CPU 处于 RUN 就插卡
    - 未确认"程序处于安全状态"
    - 现场无独立于 PLC 的急停
  bound_to:
    - 存储卡与固件维护
    - 密码恢复流程
    - 在线诊断与排障
  tags: [counter-example, memory-card, stop-mode, safety, password-recovery]
  task_ids: [T10, T07]

- id: ce17
  title: 把 V3.0 程序传送卡插入 V4.x CPU
  type: counter-example
  source_chapter: 5.5.1 在 CPU 中插入存储卡 · PDF p152；5.5.3 传送卡 · PDF p157
  source_quote: |
    "说明：请勿将 V3.0 程序传送卡插入 S7-1200 V4.0 CPU。版本 3.0 程序传送卡与版本 S7-1200 V4.0 CPU 不兼容。插入含有 V3.0 程序的存储卡会导致 CPU 错误。"
  failure_mode: |
    拿旧版本传送卡直接插到新 CPU，造成 CPU 报错，代码无法装载。
  mechanism: |
    传送卡的程序与作业文件带版本信息，V3 与 V4 不兼容；V4 CPU 评估阶段即判定错误。恢复需用 STOP→RUN/MRES/循环上电清除错误，并用 TIA Portal 在硬件配置中升级设备后再传送。
  warning_signs:
    - 卡槽里是旧项目遗留的 V3 传送卡
    - 升级 CPU 固件/型号后未重建传送卡
  bound_to:
    - 设备更换与型号替换
    - 存储卡与固件维护
  tags: [counter-example, version-compatibility, memory-card, upgrade]
  task_ids: [T09, T10]

- id: ce18
  title: 固件更新中途断电或更新前未确保 CPU 空闲
  type: counter-example
  source_chapter: 5.5.5 固件更新 · PDF p162–163
  source_quote: |
    "说明：要完成模块的固件更新，必须确保模块的 24V DC 电源保持接通。"
    "警告：在安装固件更新之前，请确定 CPU 当前未执行任何进程。安装固件更新程序时 CPU 将切换到 STOP 模式，这可能会影响在线操作或机器的运行。"
  failure_mode: |
    固件复制过程中断电，或 CPU 正带载Process时插卡更新，导致更新失败、CPU 处于 STOP、机器意外停机。
  mechanism: |
    固件更新依赖持续 24V 供电完成复制与重启；插卡本身强制 STOP，若未确认 CPU 空闲则生产过程被打断。手册还指出固件更新无法把 V3.0 或更早版本直接升到 V4.0/V4.1，跨大版本需按路径升级。
  warning_signs:
    - 更新期间供电不稳或有人拉闸
    - 计划停机窗口未预留
    - 想从 V3.0 一步跳到 V4.x
  bound_to:
    - 固件更新流程
    - 设备维护
  tags: [counter-example, firmware, power, maintenance]
  task_ids: [T10]

- id: ce19
  title: 写保护存储卡导致配方/数据日志指令报错
  type: counter-example
  source_chapter: 5.5.1 在 CPU 中插入存储卡 · PDF p152
  source_quote: |
    "注意：如果将写保护存储卡插入 CPU 中，STEP 7 会在下一次上电时显示诊断消息提醒您这一情况。CPU 将无故障上电，但如果存储卡为写保护，例如，包含配方或数据日志的指令将返回错误。"
  failure_mode: |
    把卡上的写保护开关拨到 Lock 就插卡，运行含配方/数据日志的指令时返回错误。
  mechanism: |
    CPU 虽能正常上电，但写保护使卡不可写，任何需要落盘的指令都会失败；故障表现为"运行中报指令错误"而非"上电失败"，容易误判为程序 bug。
  warning_signs:
    - 存储卡侧面保护开关处于 Lock
    - 配方写入、数据日志指令报 STATUS 错误
  bound_to:
    - 存储卡与固件维护
    - 在线诊断与排障
  tags: [counter-example, write-protection, recipe, datalog, troubleshooting]
  task_ids: [T10, T07]

- id: ce20
  title: 密码保护只保护访问，不保护通信指令与程序执行
  type: counter-example
  source_chapter: 7.6.1 CPU 的访问保护 · PDF p226
  source_quote: |
    "密码保护不适用于用户程序指令的执行，包括通信功能。输入正确的密码便可访问该级别的所有功能。PLC 到 PLC 通信（使用代码块中的通信指令）不受 CPU 中安全等级的限制。"
  failure_mode: |
    以为设置了 CPU 访问密码就万事大吉，忽视 PUT/GET 等 PLC 到 PLC 通信不受安全等级限制，导致数据仍可被远程读写。
  mechanism: |
    CPU 安全等级只约束编程设备/HMI 的访问路径；程序内通信指令走独立通道，默认不受等级限制，因此"有密码"不等于"数据不被读写"。
  warning_signs:
    - 仅靠 CPU 密码保护就认为数据安全
    - 未单独评估 PUT/GET 访问许可
  bound_to:
    - 访问保护与密码策略
    - 通信配置
  tags: [counter-example, access-protection, communication, misconception]
  task_ids: [T05]

- id: ce21
  title: 未授权访问 CPU / 把 PLC 变量改成无效值
  type: counter-example
  source_chapter: 7.6.1 CPU 的访问保护 · PDF p227；12.1 启用 Web 服务器 · PDF p1128–1129；12.2 组态 Web 服务器用户 · PDF p1131
  source_quote: |
    "警告：对受保护的 CPU 进行未授权访问。拥有 CPU 完全访问权限的用户有权限读写 PLC 变量。无论 CPU 访问级别是多少，Web 服务器用户都有权限读写 PLC 变量。未经授权访问 CPU 或将 PLC 变量更改为无效值可能会中断过程操作并可能导致死亡、严重人身伤害和/或财产损失。"
  failure_mode: |
    Web 服务器用户或攻击者绕过/利用授权写入无效 PLC 变量，导致过程控制被打断或出现危险动作。
  mechanism: |
    授权访问本身包含写权限；无效值（超范围、非法组合）会被用户程序当作真值使用，而程序若不做错误检查和范围检查，就会把异常值传递到输出。手册因此要求强密码、仅 HTTPS、限制 Everybody 权限、对变量做范围检查。
  warning_signs:
    - 用弱口令（字典词、个人信息）保护 CPU/Web
    - 放宽了"所有人"(Everybody) 用户的默认最低权限
    - 用 HTTP 而非 HTTPS 访问 Web 服务器
    - 程序逻辑未对来自 Web 的变量做范围检查
  bound_to:
    - 访问保护与密码策略
    - Web 服务器配置
    - PLC 程序结构设计
  tags: [counter-example, security, web-server, access-control, invalid-values]
  task_ids: [T05, T07]

- id: ce22
  title: 混淆专有技术保护密码与复制保护密码
  type: counter-example
  source_chapter: 7.6.4 复制保护 · PDF p231
  source_quote: |
    "对于与强制性密码的动态绑定，定义下载或复制块所必须使用的密码。请注意，复制保护密码和专有技术保护 (页 229)密码是两个不同的密码。"
  failure_mode: |
    把复制保护密码和专有技术保护密码当作同一个，输入错误密码导致块无法下载/复制或无法解开代码查看。
  mechanism: |
    两种保护作用于不同环节（绑定下载 vs 隐藏代码），系统分别保存两套凭据；混淆后虽"密码是对的"但用错了地方，表现为下载被拒或块只读。
  warning_signs:
    - 只记了一组密码却配置了两项保护
    - 下载含动态绑定的块时反复提示密码错误
  bound_to:
    - 访问保护与密码策略
    - 程序下载/同步
  tags: [counter-example, password, know-how-protection, copy-protection]
  task_ids: [T08]

- id: ce23
  title: 在用户定义 Web 页面变量中使用引号
  type: counter-example
  source_chapter: 12.7.8 特定于用户定义 Web 页面的限制 · PDF p1192
  source_quote: |
    "避免在用于任意目的的数据块变量中使用含有嵌入式单引号或双引号的文本字符串。因为在 HTML 语法中，经常将单引号或双引号用作分隔符，文本字符串内的引号会破坏用户自定义 Web 页面的显示。"
  failure_mode: |
    在 DB 字符串变量里写入单/双引号（手工输入或用户程序赋值），导致自定义 Web 页面渲染错乱或显示破坏。
  mechanism: |
    生成的 HTML 用引号作属性/文本分隔符；变量内容中的引号未转义会提前闭合 HTML 结构，破坏页面。手册明确要求既不在 STEP 7 里输入引号，也不让用户程序分配含引号的字符串。
  warning_signs:
    - DB 字符串值含 ' 或 "
    - 用户程序把外部文本直接 MOVE 到 Web 相关 DB 变量
  bound_to:
    - Web 服务器配置
    - 用户定义 Web 页面设计
  tags: [counter-example, web-server, html, string]
  task_ids: [T05]

- id: ce24
  title: 忘记强制值会随项目/存储卡持续生效并传播
  type: counter-example
  source_chapter: 15.13.5 CPU 中的强制值 · PDF p1508–1509
  source_quote: |
    "在强制表格中强制输入或输出时，强制操作将变成项目组态的一部分。如果关闭 STEP 7，被强制元素仍会在 CPU 程序中保持激活状态，直至这些元素被清除。"
    "含有通过存储卡装载到另一个 CPU 的强制点的程序将继续强制程序中选择的点。"
  failure_mode: |
    调试时强制了 I/O 却忘记清除，关闭 STEP 7 后强制仍在运行；含强制点的程序经存储卡装载到其他 CPU 后继续强制，造成误动作且难排查。
  mechanism: |
    强制值存储在 CPU 中而非强制表格中，且随程序/存储卡传播；因此"关掉工程软件就没事"的直觉是错的，必须显式停止强制。写保护卡上还无法初始化/更改强制，强制写保护值会报错。
  warning_signs:
    - 调试结束后未勾选"停止强制"
    - 把带强制的程序复制到别的 CPU
    - 现场输出行为与程序逻辑对不上
  bound_to:
    - 在线诊断与排障
    - 程序调试与在线测试
    - 设备更换
  tags: [counter-example, forcing, debugging, persistence]
  task_ids: [T07, T08, T09]

- id: ce25
  title: 误把 RUN 模式下载当成无风险的"小改动"
  type: counter-example
  source_chapter: 15.14 在 RUN 模式下下载 · PDF p1510
  source_quote: |
    "警告：在 RUN 模式下下载的风险。在 RUN 模式下向 CPU 中下载更改时，这些更改将立即影响过程操作。在 RUN 模式下更改程序可能会引起意外的系统操作，进而导致人员死亡、重伤和/或设备损坏。"
  failure_mode: |
    以为 RUN 模式下载"对过程干扰最小"就随意在线改程序，改动立即作用于真实过程，导致意外系统操作和安全事故。
  mechanism: |
    手册强调该功能既可做小改也可做重大改动，而改动"立即生效"；更隐蔽的是 STEP 7 在 CPU 处于 RUN 且有程序更改时默认优先尝试 RUN 模式下载，除非主动切到 STOP。
  warning_signs:
    - 未评估对操作员与机器的安全后果就在线改
    - 一次下载超过 20 个块（手册要求超过则必须 STOP）
    - 以为"改一个参数"不会立即影响输出
  bound_to:
    - 程序调试与在线测试
    - 在线诊断与排障
  tags: [counter-example, download-in-run, safety, process]
  task_ids: [T08, T07]

- id: ce26
  title: RUN 模式下载后误以为删除的逻辑立即失效
  type: counter-example
  source_chapter: 15.14.7 在 RUN 模式下下载的考虑事项 · PDF p1520
  source_quote: |
    "如果删除一个输出的控制逻辑，则在下一次上电循环或切换到 STOP 模式之前，CPU 将始终保持该输出的最终状态。如果删除了正在运行的高速计数器或脉冲输出函数，则该高速计数器或脉冲输出将继续运行，直至下一次上电循环或切换到 STOP 模式。"
  failure_mode: |
    在 RUN 模式下删除输出逻辑、HSC/PWM/PTO 功能后，以为已停止，实际上输出保持最后状态、高速功能继续运行，造成危险。
  mechanism: |
    删除逻辑只改变程序，不改变已被写出的物理输出状态和已初始化的硬件功能，直到下一次上电循环或 STOP→RUN 才重新初始化；首次扫描位相关逻辑也不会因 RUN 下载而执行。
  warning_signs:
    - 在线删了控制逻辑却没做 STOP/上电循环
    - 期望首次扫描位逻辑重新触发
    - 想用 RUN 下载覆盖 DB 当前值（手册：不能覆盖）
  bound_to:
    - 程序调试与在线测试
    - 工艺组态（HSC/PWM/PTO）
  tags: [counter-example, download-in-run, output-state, hsc, pto]
  task_ids: [T08, T06]

- id: ce27
  title: 对含数据日志/READ_DBL 等指令的块在 RUN 下载时忽略临时错误
  type: counter-example
  source_chapter: 15.14.7 在 RUN 模式下下载的考虑事项 · PDF p1521
  source_quote: |
    "CPU 中激活了'在 RUN 模式下下载'后，以下指令可能会发生临时错误……DataLogCreate/DataLogOpen/DataLogWrite… STATUS = W#16#80C0, ERROR = TRUE；READ_DBL/WRIT_DBL RET_VAL = W#16#82C0；Create_DB/Delete_DB/RTM… = 0x80C0。该错误是临时错误。如果出现错误，则需稍后重试该指令。"
  failure_mode: |
    RUN 模式下载激活期间数据日志/DB 操作返回 80C0/82C0 错误，误以为是永久故障而反复排查程序或放弃重试。
  mechanism: |
    CPU 在统一激活下载更改时会暂停用户程序对装载存储器的访问，相关指令在此期间必然报临时错误；手册明确要求"稍后重试"，且"不能在执行 OB 的过程中重试"。
  warning_signs:
    - 下载期间 DataLog/READ_DBL/WRIT_DBL 报 80C0/82C0
    - 在同一个 OB 里立刻重试仍失败
  bound_to:
    - 在线诊断与排障
    - 程序调试与在线测试
  tags: [counter-example, download-in-run, transient-error, datalog]
  task_ids: [T07, T08]

- id: ce28
  title: 超出最大扫描周期时间却以为"默认保持 RUN 就安全"
  type: counter-example
  source_chapter: 5.1.4 监视和组态循环时间 · PDF p117；5.1.3 组织块 (OB) · PDF p114, p116
  source_quote: |
    "如果超出组态的最大扫描周期时间，将生成错误……如果用户程序不包括时间错误中断 OB，则时间错误事件将产生一个诊断缓冲区条目，但 CPU 仍保持 RUN 模式。"
    "但是，如果同一个扫描周期第二次超出最大扫描周期时间，CPU 就会进入 STOP 模式。"
  failure_mode: |
    只看到"超时后默认仍 RUN"就忽视循环超限，未配置时间错误 OB，结果同一周期二次超时直接进 STOP 或队列溢出丢失事件。
  mechanism: |
    CPU 始终监视扫描周期；首次超时只记诊断，但二次超时强制 STOP；同时各事件类型有未决队列上限，达到上限后"下一个事件将丢失"，只能用时间错误中断 OB 响应溢出。
  warning_signs:
    - 未组态时间错误 OB（OB 80/时间错误中断）
    - 循环时间接近 150ms 默认值
    - 诊断缓冲区出现超时条目却未处理
  bound_to:
    - 扫描周期/实时性评估
    - 中断与报警配置
    - 在线诊断与排障
  tags: [counter-example, cycle-time, watchdog, ob, queue-overflow]
  task_ids: [T03, T02, T07]

- id: ce29
  title: 依赖 V3 时代"时间错误 OB 可中断任何 OB"的旧行为
  type: counter-example
  source_chapter: 5.1.3 组织块 (OB) · PDF p114
  source_quote: |
    "如果将 OB 执行模式组态为不可中断，则时间错误 OB 不能中断除程序循环 OB 以外的 OB。在 S7-1200 CPU V4.0 之前的版本中，时间错误 OB 可中断任何正在执行的 OB。而从 V4.0 开始，如果希望时间错误 OB（或其它任何优先级更高的 OB）能够中断除程序循环 OB 以外的执行中 OB，必须将 OB 执行组态为可中断。"
  failure_mode: |
    把 V3 的中断行为套用到 V4 CPU，以为超时保护 OB 能抢占任何正在执行的 OB，实际因 OB 默认不可中断而无法抢占，错过超时处理窗口。
  mechanism: |
    V4.0 起 OB 执行是否可中断变成组态项，默认不可中断；不显式勾选，高优先级 OB 只能在程序循环 OB 上抢占，无法中断其它执行中的 OB。
  warning_signs:
    - 从 V3 迁移到 V4 但未复核 OB 中断属性
    - 时间错误 OB 未在预期时机执行
  bound_to:
    - 中断与报警配置
    - 设备更换与型号替换
  tags: [counter-example, ob, preemption, version-migration]
  task_ids: [T09, T02]

- id: ce30
  title: 用户程序改写系统存储器或时钟存储器位
  type: counter-example
  source_chapter: 5.1.5 CPU 存储器 · PDF p122
  source_quote: |
    "小心：覆盖系统存储器位或时钟存储器位时的风险。改写系统存储器或时钟存储器的各个位可能会破坏这些功能中的数据，同时还可能导致用户程序错误运行，进而造成设备损坏和人员伤害。因为时钟存储器和系统存储器都不是预留的 M 存储器，所以指令或通信可以写入这些单元并破坏其中的数据。"
  failure_mode: |
    指令或 HMI 通信写入被分配为系统/时钟存储器的 M 字节，破坏 FirstScan、DiagStatusUpdate、时钟位等功能，导致程序逻辑误用这些信号。
  mechanism: |
    这些字节本质仍是普通 M 存储器，只是被"分配"了特殊含义，并未硬件锁定；任何写入（程序、通信）都会改写它们，而依赖这些位的逻辑不会察觉异常。
  warning_signs:
    - 用地址直接写 M 字节，未避开已分配的系统/时钟字节
    - 首次扫描位逻辑行为异常
    - 通信写入覆盖了 M 区
  bound_to:
    - 数据类型与寻址规则
    - PLC 程序结构设计
  tags: [counter-example, memory, system-byte, clock-byte, overwrite]
  task_ids: [T02, T04]

- id: ce31
  title: 误以为下载程序会重置保持性数据
  type: counter-example
  source_chapter: 5.1.5 CPU 存储器 · PDF p121
  source_quote: |
    "说明：下载程序不会清除或更改保持性存储器中的现有值。如果要在下载之前清除保持性存储器，请在下载程序前将 CPU 复位为出厂设定。"
  failure_mode: |
    想在下载时"顺便清零"保持性变量，结果旧值继续保留，导致新程序读到上一轮生产遗留的状态。
  mechanism: |
    保持性存储器设计目的是断电保持，下载不触碰它；要清除必须先做出厂复位。工作存储器断电丢失、保持性存储器非易失保持，两者语义不同，混淆会造成状态污染。
  warning_signs:
    - 下载后设备按"旧配方/旧计数"运行
    - 误以为重新下载等于初始化
  bound_to:
    - 程序调试与在线测试
    - 恢复出厂与维护
  tags: [counter-example, retentive-memory, download, reset]
  task_ids: [T08, T10]

- id: ce32
  title: 把"基本数据类型一致"误推为"多个值一致"
  type: counter-example
  source_chapter: 7.4 了解数据一致性 · PDF p213
  source_quote: |
    "CPU 为所有基本数据类型……保持数据一致性。值的读/写操作无法中断。如果用户程序共享存储器中在程序循环 OB 和中断 OB 之间生成的多个值，用户程序还必须确保在修改或读取这些值时保持一致性。由于通信会周期性地中断用户程序，因而不能保证 HMI 能够同时更新 CPU 中的多个值。例如，给定 HMI 画面上显示的值可能来自 CPU 的不同扫描周期。"
  failure_mode: |
    以为"CPU 保证数据一致性"就放心地把多个相关变量分散读写，结果在中断/HMI 通信打断时出现撕裂数据：同一画面/计算中的值来自不同扫描周期。
  mechanism: |
    CPU 只保证单个基本类型读写的原子性；跨多个值的复合一致性需程序员用 DIS_AIRT/EN_AIRT 包住读改写区，否则中断 OB 或通信请求会插入并改变其中部分值。
  warning_signs:
    - 多个相关变量在中断 OB 与循环 OB 间共享却无保护
    - HMI 画面显示的值"对不上"
    - 未使用 DIS_AIRT/EN_AIRT 包临界区
  bound_to:
    - 数据一致性访问
    - PLC 程序结构设计
    - 通信配置
  tags: [counter-example, data-consistency, race-condition, dis-airt]
  task_ids: [T04, T02, T05]

- id: ce33
  title: DIS_AIRT 与 EN_AIRT 不成对使用
  type: counter-example
  source_chapter: 9.5.5 DIS_AIRT 和 EN_AIRT · PDF p484–485；7.4 了解数据一致性 · PDF p213
  source_quote: |
    "每一次 DIS_AIRT 执行都必须通过一次 EN_AIRT 执行来取消。必须在同一个 OB 中或从同一个 OB 调用的任意 FC 或 FB 中完成 EN_AIRT 执行后，才能再次启用此 OB 的中断。"
    "只有当参数 RET_VAL = 0 时，才会再次启用中断处理。"
  failure_mode: |
    调了 DIS_AIRT 却漏掉/放错位置的 EN_AIRT，导致中断被长期禁用，高优先级事件得不到响应，或中断等待时间被无意拉长。
  mechanism: |
    OS 用计数器统计 DIS_AIRT 次数，只有等量 EN_AIRT 才能抵消；EN_AIRT 还必须在同一 OB 或其调用链内执行，放错 OB 无效。副作用是延迟中断会增大从事件发生到 OB 执行的等待时间。
  warning_signs:
    - DIS_AIRT 后无配对 EN_AIRT
    - EN_AIRT 放在另一个 OB 里
    - RET_VAL 非 0 却以为中断已恢复
  bound_to:
    - 中断与报警配置
    - 数据一致性访问
  tags: [counter-example, dis-airt, interrupts, pairing]
  task_ids: [T03, T04]

- id: ce34
  title: 把 PID 指令放在主循环 OB1 每个周期都算
  type: counter-example
  source_chapter: 10.2 PID 控制 · PDF p666
  source_quote: |
    "说明：以恒定的采样时间间隔执行 PID 指令（最好在循环 OB 中）。由于 PID 回路需要一段时间来响应控制值的变化，因此请勿在每个循环中都计算输出值。请勿在主程序循环 OB（如 OB 1）中执行 PID 指令。"
  failure_mode: |
    把 PID 直接放在 OB1 每个扫描周期计算，采样时间随通信负荷/程序波动而变化，导致 PID 参数失效、调节振荡或控制品质差。
  mechanism: |
    PID 算法测量两次调用间隔并监视采样时间，假设固定采样周期；OB1 周期不恒定，采样时间抖动会被误当作过程响应，破坏 P/I/D 计算。应放入循环中断 OB 获得恒定采样。
  warning_signs:
    - PID 块直接挂在 OB1 主循环
    - 采样时间监视报警/ warning 0020（循环时间决定采样时间）
    - 控制输出波动与扫描周期相关
  bound_to:
    - 工艺组态（PID）
    - 扫描周期/实时性评估
  tags: [counter-example, pid, sampling-time, cycle-ob]
  task_ids: [T06, T03]

- id: ce35
  title: 把增量编码器当作绝对值编码器使用
  type: counter-example
  source_chapter: 10.3.4 闭环运动控制 · PDF p792
  source_quote: |
    "绝对值编码器可用作增量编码器，但增量编码器不能用作绝对值编码器。运动控制显示 TO 编码器类型的不一致情况及其在 PROFIdrive 消息帧中的相关实际值错误。"
  failure_mode: |
    在需要绝对位置的轴上使用增量编码器，或 TO 与驱动器中编码器类型组态不一致，导致实际值错误、轴无法正常启用。
  mechanism: |
    增量编码器断电后丢失位置，需回零；绝对值编码器保持位置。二者在 PROFIdrive 报文中的实际值解释不同，类型不一致会触发一致性检查错误并阻止轴启用。
  warning_signs:
    - 用增量编码器做绝对定位且无回零流程
    - TO 与驱动器的 P979 编码器类型不匹配
    - 一致性检查报 ErrorID
  bound_to:
    - 工艺组态（运动控制）
    - 设备选型
  tags: [counter-example, motion-control, encoder, consistency]
  task_ids: [T06, T01]

- id: ce36
  title: 运动控制 TO 与驱动器/传感器组态不一致
  type: counter-example
  source_chapter: 10.3.4 闭环运动控制 · PDF p790–792
  source_quote: |
    "运动控制会在首次启动或重启 TO 轴期间执行一致性检查……'p922'或'p2079'中的消息帧：如果 TO 和驱动器组态不一致，运动控制会显示一个错误……使用组态的轴参数不能达到最大速度，此时运动控制会显示一个错误。"
  failure_mode: |
    TIA Portal 中 TO 轴参数与驱动器实际参数（报文、电机类型、最大速度 p1082）不一致，启动时报错、轴无法启用或速度被内部下调。
  mechanism: |
    数据调整（DataAdaptation）把驱动器参数上传到 TO-DB，一致性检查在启动/重启时校验报文、电机类型、最大速度；不一致即报错。最大速度 > 2×参考速度时运动控制内部下调 p1082 并报错，而轴组态条目不变，易被忽视。
  warning_signs:
    - 更换驱动器/电机后未做数据调整
    - 最大速度设得远超参考速度
    - 启动时报一致性错误
  bound_to:
    - 工艺组态（运动控制）
    - 设备更换
  tags: [counter-example, motion-control, consistency, data-adaptation]
  task_ids: [T06, T09]

- id: ce37
  title: 对优化访问 DB / 运动控制 DB 误用 ATTR_DB
  type: counter-example
  source_chapter: 9.10.3 ATTR_DB（读取数据块属性）· PDF p615
  source_quote: |
    "请勿将 ATTR_DB 应用于具有优化访问且激活了预留存储空间的数据块。请勿通过指令 ATTR_DB 读取运动控制数据块。因此，将输出错误代码 80B2。"
  failure_mode: |
    用 ATTR_DB 去读优化访问 DB 或运动控制 DB，得到错误代码 80B2 或错误的长度值（DB_LENGTH=0），误判 DB 不存在/损坏。
  mechanism: |
    优化访问 DB 的布局不暴露绝对地址，长度无法读取（返回 0）；运动控制 DB 受保护，指令被明确禁止读取。这是指令的适用边界，不是 DB 故障。
  warning_signs:
    - ATTR_DB 返回 80B2 或 DB_LENGTH=0
    - 目标是优化 DB 或 TO/运动控制 DB
  bound_to:
    - 数据块控制指令选用
    - 数据类型与寻址规则
  tags: [counter-example, attr-db, optimized-db, motion-db, error-code]
  task_ids: [T04]

- id: ce38
  title: 频繁用 WRIT_DBL 写闪存缩短寿命
  type: counter-example
  source_chapter: 9.10.2 READ_DBL 和 WRIT_DBL · PDF p612
  source_quote: |
    "说明：WRIT_DBL 和 READ_DBL 指令对闪存的影响。WRIT_DBL 指令会在闪存（内部装载存储器或存储卡）内执行写入操作。为了避免影响闪存的使用寿命，可以采用 WRIT…"
  failure_mode: |
    把 WRIT_DBL 当普通变量写入在循环中高频调用，反复擦写闪存，缩短装载存储器寿命。
  mechanism: |
    WRIT_DBL 实际写入非易失闪存，闪存有擦写次数上限；与写 RAM 不同，高频写入会累积损耗且无即时报错，属于慢性失效。
  warning_signs:
    - WRIT_DBL 放在循环 OB 每个周期执行
    - 用 WRIT_DBL 保存频繁变化的过程数据
  bound_to:
    - 数据块控制指令选用
    - 数据记录/持久化设计
  tags: [counter-example, flash-wear, writ-dbl, lifetime]
  task_ids: [T04]

- id: ce39
  title: 把"扩展指令常见错误代码"当作无害提示
  type: counter-example
  source_chapter: 9.12 扩展指令的常见错误代码 · PDF p629
  source_quote: |
    "表格 9-237 扩展指令的常见错误代码：8x22 存储区对于输入太小；8x23 存储区对于输出太小；8x24 输入区非法；8x25 输出区非法；8x28 输入位赋值非法；8x29 输出位赋值非法；8x30 输出区是只读 DB；8x3A DB 不存在。如果执行代码块时出现其中一个错误，则 CPU 保持在 RUN（默认）或组态为 STOP。"
  failure_mode: |
    看到扩展指令返回 8x 错误码却不加处理，以为 CPU 还在 RUN 就没事，导致数据未按预期传送而过程带病运行。
  mechanism: |
    这些错误默认只记入状态输出，CPU 仍保持 RUN，故障"静默"；只有在代码块内用 GetError/GetErrorID 本地处理或组态 CPU 进 STOP 才会显式响应。
  warning_signs:
    - RET_VAL/STATUS 出现 8x22–8x3A 但未处理
    - 数据传送"没报错但值不对"
  bound_to:
    - 在线诊断与排障
    - 通信/PtP 组态
  tags: [counter-example, error-code, silent-failure, extended-instructions]
  task_ids: [T07, T05]

- id: ce40
  title: PtP 指令 DONE/NDR/ERROR 只置位一个周期就以为能随时读到
  type: counter-example
  source_chapter: 13.3.5 点对点指令 · PDF p1248
  source_quote: |
    "说明：DONE、NDR 和 ERROR 参数仅置位一个执行周期的时间。程序逻辑必须将临时输出状态值保存在数据锁存器中，以便能检测到后续程序扫描中的状态变化。"
  failure_mode: |
    在后续扫描才去读取 DONE/NDR/ERROR 状态，因信号只保持一个周期而错过完成/错误事件，误以为通信未发生或永远成功。
  mechanism: |
    这些是"沿"信号而非电平；若不在置位当拍锁存，下一周期即被清除。程序必须自行保存，否则状态检测不可靠。
  warning_signs:
    - 在非调用周期读取 DONE/NDR/ERROR
    - 未设置锁存位就把状态用于判断
  bound_to:
    - 通信协议选型与组态（PtP）
    - 在线诊断与排障
  tags: [counter-example, ptp, one-shot, status-latching]
  task_ids: [T05, T07]

- id: ce41
  title: 误以为用 Port_Config/PORT_CFG 改的端口参数会永久保存
  type: counter-example
  source_chapter: 13.3.5 点对点指令 · PDF p1251；13.6.1 早期点对点指令 · PDF p1377
  source_quote: |
    "CPU 不永久存储使用 Port_Config 指令设置的值。CPU 从 RUN 模式切换到 STOP 模式和循环上电后，将恢复设备配置中组态的参数。"
  failure_mode: |
    用指令动态改波特率/协议后以为永久生效，STOP→RUN 或循环上电后参数恢复为设备组态值，通信突然中断。
  mechanism: |
    动态端口配置只活在 RUN 期间，不写回设备组态；一旦模式切换/上电，CPU 重新加载设备组态参数。要永久改变必须改设备组态。
  warning_signs:
    - 仅在程序里调 Port_Config 改端口参数
    - 维护后重启发现通信参数"变回去"
  bound_to:
    - 通信协议选型与组态（PtP）
    - 设备维护
  tags: [counter-example, ptp, port-config, volatility]
  task_ids: [T05, T10]

- id: ce42
  title: 忽略分布式 I/O 组态导致 STOP 模式无法启用输出
  type: counter-example
  source_chapter: 15.13.5 CPU 中的强制值 · PDF p1507
  source_quote: |
    "如果已组态分布式 I/O，则无法在 STOP 模式下启用输出。如果尝试此操作，将返回错误。将 CPU 设置为 RUN 模式会禁用'启用外围设备输出'选项。如果任何输入或输出被强制，则处于 STOP 模式时不允许 CPU 启用输出。必须先取消强制功能。"
  failure_mode: |
    在带分布式 I/O 或存在强制点时试图在 STOP 模式强制启用输出，操作失败并返回错误，调试卡住。
  mechanism: |
    分布式 I/O 与强制机制改变了 STOP 模式输出使能的前提条件；手册明确：有分布式 I/O 或任何强制时，STOP 模式不允许启用输出，必须先取消强制。
  warning_signs:
    - STOP 模式下"启用外围设备输出"是灰的/报错
    - 系统中还有未清除的强制点
    - 组态了 PROFINET/PROFIBUS 分布式 I/O
  bound_to:
    - 在线诊断与排障
    - 程序调试与在线测试
  tags: [counter-example, distributed-io, stop-mode, forcing]
  task_ids: [T07, T08]

- id: ce43
  title: 安全事件重复条目堵塞诊断缓冲区
  type: counter-example
  source_chapter: 5.1.6 诊断缓冲区 · PDF p124
  source_quote: |
    "部分安全事件会在诊断缓冲区中生成重复条目。这些消息可能会堵塞诊断缓冲区，从而可能阻碍其它事件消息。您可以组态 PLC 限定安全事件的诊断消息数量。"
  failure_mode: |
    安全相关事件反复写入诊断缓冲区（最多 50 条，满后覆盖最早），把真正需要关注的其他事件挤出，排障时看不到关键线索。
  mechanism: |
    诊断缓冲区容量固定 50 条；高频重复条目持续覆盖旧事件，导致关键事件被冲掉。手册建议按时间间隔对安全事件做总结/限定。
  warning_signs:
    - 诊断缓冲区被同一类安全消息刷屏
    - 关键事件"消失"
    - 未配置安全事件消息限定
  bound_to:
    - 在线诊断与排障
  tags: [counter-example, diagnostic-buffer, log-flooding, troubleshooting]
  task_ids: [T07]

- id: ce44
  title: 把日时钟默认值当作可信时间戳
  type: counter-example
  source_chapter: 5.1.7 日时钟 · PDF p125
  source_quote: |
    "CPU 支持日时钟。在 CPU 断电期间，超级电容器提供时钟继续运行所需的电能……通电至少 24 小时之后，超级电容器所具有的电量通常足以维持时钟运行 20 天。STEP 7 将时钟设置为系统时间，它有一个初始的默认值或者遵循出厂值。若要使用日时钟，必须进行设置。"
  failure_mode: |
    不设置日时钟就依赖诊断缓冲区/数据日志的时间戳，断电超过超级电容维持期后时间丢失或不准，导致事件顺序错乱、追溯失败。
  mechanism: |
    时钟靠超级电容维持（充满约 20 天），超时或首次上电会用默认/出厂值；而时间戳依赖系统时间，未设置就不可信。
  warning_signs:
    - 设备长期断电后重新投用
    - 诊断条目时间与现场实际不符
    - 从未执行"设置日时钟"
  bound_to:
    - 在线诊断与排障
    - 数据记录设计
  tags: [counter-example, real-time-clock, timestamp, super capacitor]
  task_ids: [T07]

- id: ce45
  title: 在数据块生成的用户 Web 页面上耗尽装载存储器
  type: counter-example
  source_chapter: 12.7.8 特定于用户定义 Web 页面的限制 · PDF p1192
  source_quote: |
    "单击'生成块'之后，用户定义的 Web 页面就会成为数据块，这一过程需要用到装载存储器空间。如果未安装存储卡，这些块就会占用内部装载存储器空间，根据 CPU 型号的不同而会存在限制。如果需要减少用户定义 Web 页面所需空间，则减少图片的使用（如果适用）。"
  failure_mode: |
    用户定义 Web 页面大量使用图片/内容，生成的数据块占满装载存储器，导致下载失败或 CPU 空间不足。
  mechanism: |
    页面被编译成 DB 存入装载存储器，容量受 CPU 型号（无卡时）或存储卡容量限制；图片是主要占用源，且无即时提醒直到空间耗尽。
  warning_signs:
    - Web 页面含大量图片
    - 未安装存储卡却放了大量页面内容
    - 下载时报装载存储器不足
  bound_to:
    - Web 服务器配置
    - CPU/模块选型
  tags: [counter-example, web-server, load-memory, capacity]
  task_ids: [T05, T01]
