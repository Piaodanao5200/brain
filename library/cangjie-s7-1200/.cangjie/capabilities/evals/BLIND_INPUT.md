# 盲测任务

## 已安装的 skill 清单（7个）

### power-budget-sizing（功率预算核算与供电选型）
计算 S7-1200 CPU 的 5V/24V 功率预算并判定是否需外部电源时激活。场景：有一份 CPU+SM/CM/SB 清单想知道带不带得动、模块不识别怀疑供电不足、24V 不够想并联电源、在 1211C~1217C 间选型。信号：'算功率预算/can this CPU power these modules'、'24V 不够能并联吗/parallel another 24V supply'、'5V/24V 余量/current headroom'。不用于：查订货号针脚（走检索）、完整系统设计、LED/诊断排障。输出两路差额表与最小外部电源容量；硬约束不得并联、M 共点。

### program-structure-decision（用户程序结构决策（OB/FC/FB/DB））
决定 S7-1200 用户程序该用 OB/FC/FB/DB 哪种块、如何复用与嵌套时激活。场景：从零搭程序纠结逻辑放哪、多台同类设备要复用又不串数据、数据莫名丢失怀疑 FC/FB 用错、规划调用层级、线性还是模块化。信号：'OB/FC/FB/DB 怎么选/FB vs FC/instance DB'、'多台设备一个功能块/reentrancy'、'数据没保存住/data not retained'、'嵌套多少层/nesting depth'。不用于：查指令语法、算功率、解决多值撕裂（用 data-consistency）。

### data-consistency（数据一致性保障）
处理 S7-1200 多值读写撕裂、PIP 刷新、参数传递丢数据与临界区保护时激活。场景：HMI 画面几个相关值对不上、循环与中断 OB 共享变量、HMI 改的值被覆盖丢失、PIP 配了却不刷新、传大结构纠结传值/引用、PROFINET 一致性数据。信号：'数据不一致/值对不上/torn data'、'HMI 改的值丢了/overwritten'、'DIS_AIRT/EN_AIRT 配对'、'PIP 不刷新/process image partition'、'传值还是传引用/optimized DB'。不用于：单变量类型地址、块结构、通信连接组态。

### communication-config（通信协议选型与组态）
为 S7-1200 选通信协议与角色并组态连接时激活。场景：配 PROFINET/PROFIBUS/PtP/Modbus 不知选哪个、设备名不匹配致数据交换不运行、运行时改 IP、多 Modbus TCP 连接分配端口/ID、RS485 端接、PUT/GET 默认禁用。信号：'PROFINET/Modbus 怎么组态/configure'、'设备名不匹配/no data exchange'、'主从/master slave/function code'、'RS485 端接/termination'、'PUT/GET 允许/permit PUT GET'。不用于：一致性读写、物理接线、通用排障。

### online-troubleshooting（在线诊断与故障排查）
S7-1200 现场故障定位——CPU 亮灯/停机、诊断缓冲区解读、时间错误、模块/从站故障、模拟量歧义值时激活。场景：CPU 红灯黄灯 STOP 不知何故、诊断条目一堆不知先看哪、时间错误/拔插模块为何 STOP 或没 STOP、PROFINET 从站定位、32767 分不清断线还是超量程、间歇异常要 Trace。信号：'CPU 报警/红灯/停机/fault/STOP'、'诊断缓冲区/diagnostic buffer'、'故障定位/troubleshoot/root cause'、'时间错误/watchdog'、'从站故障/DeviceStates'。不用于：下载同步、固件换卡、中断原理。

### storage-firmware-maintenance（存储卡、固件与出厂复位维护）
S7-1200 存储卡（传送卡/程序卡/固件卡）、固件更新、出厂复位、备份恢复与忘记密码时激活。场景：多台 CPU 批量灌程序选卡型、刷固件怕变砖、卡读不出来想格式化、复位出厂怕丢 IP/保持性数据、备份恢复选方式、忘记密码恢复访问。信号：'传送卡/程序卡/固件卡/transfer card'、'刷固件/firmware update'、'格式化卡/card not recognized'、'恢复出厂/MRES/retain IP'、'备份恢复/backup restore'、'忘记密码/forgot password'。不用于：V3→V4 换型、程序下载调试、运行期诊断。

### device-replacement（设备更换与版本兼容检查）
用 V4.2 CPU 更换 V3.0 CPU（或判断能否换型/回退）时激活。场景：现场 V3.0 CPU 要换 V4.2、误想靠固件跨大版本、换型后编译下载失败怀疑 STEP7 版本或复制粘贴、项目含 HMI/运动 TO/专有技术保护块、TO 版本或 DB 预留区问题、能否回退。信号：'V3.0 换 V4.2/replace CPU'、'固件升级跨版本/cross version'、'换后编译下载失败'、'TO 版本/运动控制库'、'传送卡不兼容/密码映射'、'能换回去吗/rollback'。不用于：日常固件更新、常规下载、V4.0/4.1 直接运行。

## 用户 prompt（逐条独立判断，输出JSON）

1. case_id=power-budget-sizing__st-01
   prompt: 我用的是 1214C，想带 3 个 SM1223 和 1 个 CM1241，还有一个 SB1223，帮我算算 5V 和 24V 电流够不够，要不要加外部电源？

2. case_id=power-budget-sizing__st-02
   prompt: 24V 传感器电源带不动所有输入了，能不能再并联一个 24V 电源一起供？

3. case_id=power-budget-sizing__st-03
   prompt: can this CPU power these modules? 1211C plus a few signal boards

4. case_id=power-budget-sizing__snt-01
   prompt: SM1223 这个模块的订货号是多少？端子几针？

5. case_id=power-budget-sizing__snt-02
   prompt: CPU 面板上 SF 红灯亮了，诊断缓冲区里有一条时间错误，帮我查什么问题

6. case_id=power-budget-sizing__edge-01
   prompt: 1214C 最多能插几个信号模块？

7. case_id=program-structure-decision__st-01
   prompt: 我要控制 5 台一样的电机，每台要单独记运行时间，逻辑应该写成 FB 还是 FC？

8. case_id=program-structure-decision__st-02
   prompt: 我用 FC 写的中间数据每次扫描都丢了，想跨扫描保存该用什么？

9. case_id=program-structure-decision__st-03
   prompt: 从硬件中断 OB 里调用 FC，最多能嵌套多少层？

10. case_id=program-structure-decision__snt-01
   prompt: TON 定时器的 IN、PT、Q 引脚分别是什么意思？

11. case_id=program-structure-decision__snt-02
   prompt: HMI 上显示的几个相关数值对不上，感觉像读写撕裂了

12. case_id=program-structure-decision__edge-01
   prompt: 写个小程序让 Q0.0 每 1 秒闪烁一次，用哪种块？

13. case_id=data-consistency__st-01
   prompt: HMI 上几个相关联的值读出来对不上，好像一个更新了一个没更新，怎么解决？

14. case_id=data-consistency__st-02
   prompt: 我给某路 AI 配了过程映像分区 PIP1，但它一直不刷新，是哪里错了？

15. case_id=data-consistency__st-03
   prompt: torn data between cyclic OB and interrupt OB, how to protect shared variables?

16. case_id=data-consistency__snt-01
   prompt: Real 类型和 DInt 类型各占几个字节？

17. case_id=data-consistency__snt-02
   prompt: PROFINET 设备名不匹配，数据交换起不来，怎么分配设备名？

18. case_id=data-consistency__edge-01
   prompt: PROFINET 一致性数据怎么读写？

19. case_id=communication-config__st-01
   prompt: 项目要和几个 Modbus 从站通信，选 Modbus TCP 还是 RTU？主站从站怎么定，功能码怎么配？

20. case_id=communication-config__st-02
   prompt: PROFINET 设备换了个新的，数据交换起不来，是不是设备名的问题？

21. case_id=communication-config__st-03
   prompt: S7-1200 的 PUT/GET 访问默认是不是禁用的？怎么允许？

22. case_id=communication-config__snt-01
   prompt: PROFINET 从站红灯，诊断缓冲区报了个模块故障，帮我定位是哪坏了

23. case_id=communication-config__snt-02
   prompt: CPU 的红黄 LED 分别代表什么状态？

24. case_id=communication-config__edge-01
   prompt: RS485 终端电阻要不要接，接几个？

25. case_id=online-troubleshooting__st-01
   prompt: CPU 面板 SF 红灯亮，还停机了，诊断缓冲区一堆条目，我该从哪看起？

26. case_id=online-troubleshooting__st-02
   prompt: 模拟量读到 32767，分不清是断线还是超量程，怎么判断？

27. case_id=online-troubleshooting__st-03
   prompt: CPU fault light is on and it went to STOP, diagnostic buffer has a time error entry — root cause?

28. case_id=online-troubleshooting__snt-01
   prompt: 怎么用传送卡给多台 CPU 批量灌程序？

29. case_id=online-troubleshooting__snt-02
   prompt: 1214C 带 3 个 SM 和 1 个 CM，5V 电流够不够？

30. case_id=online-troubleshooting__edge-01
   prompt: 下载程序后 CPU 一直报诊断错误，是程序问题还是下载问题？

31. case_id=storage-firmware-maintenance__st-01
   prompt: 我有 10 台 CPU 要灌同一个程序，该做传送卡还是程序卡？怎么做？

32. case_id=storage-firmware-maintenance__st-02
   prompt: 想给 CPU 恢复出厂设置，但怕 IP 地址和保持性数据丢了，怎么处理？

33. case_id=storage-firmware-maintenance__st-03
   prompt: forgot the CPU password, how to regain access?

34. case_id=storage-firmware-maintenance__snt-01
   prompt: 现场 V3.0 的 CPU 想换成 V4.2，项目里有运动控制 TO，怎么弄？

35. case_id=storage-firmware-maintenance__snt-02
   prompt: 24V 电源带不动扩展模块了，能并联一个电源吗？

36. case_id=storage-firmware-maintenance__edge-01
   prompt: 刷固件到一半断电了会怎样？

37. case_id=device-replacement__st-01
   prompt: 现场有台 V3.0 的 CPU 要换成 V4.2，能不能直接刷固件升级？换完还能换回去吗？

38. case_id=device-replacement__st-02
   prompt: V3.0 换成 V4.2 后编译下载失败，项目是 STEP7 V12 的，还带了运动控制 TO，怎么办？

39. case_id=device-replacement__st-03
   prompt: replacing V3.0 CPU with V4.2, what about the DB 100-byte reserve and password mapping?

40. case_id=device-replacement__snt-01
   prompt: 就是日常给 CPU 刷个新固件版本（同大版本内），注意什么？

41. case_id=device-replacement__snt-02
   prompt: CPU 亮红灯停机了，诊断缓冲区有条目，帮我定位故障

42. case_id=device-replacement__edge-01
   prompt: 我的项目是 V4.1 的，能在 V4.2 CPU 上直接跑吗？
