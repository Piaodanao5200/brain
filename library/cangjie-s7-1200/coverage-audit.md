# coverage-audit.md — T01–T10 任务覆盖审计（阶段 1.5）

> 基准：BOOK_OVERVIEW.md「原书关键任务清单 T01–T10」。
> 方法：任务 → 原文位置 → 候选 → decision → 最终去向。critical/high 任务逐项复核。
> 重要限制：本次执行时原文 source.md 在过程中被并发清空，无法 Grep/Read 回查；原文位置取候选自带标注与 BOOK_OVERVIEW 记载。附录 A/B/C/D 在 22:30 才追加进 source.md（p1535–1810），阶段 1 提取器使用的是旧文本，导致 T01（功率预算数值）/T09（型号替换兼容表）候选不足——本审计如实登记该缺口，不虚报零遗漏。
> **补缺口更新（2026-11-16 22:50）**：已从备份快照 PDF 补提取附录 A/B/D 原文（存档 appendix-source.md）。缺口1（p06 定量功率）已补齐升 verified；缺口3（T09 更换兼容）新增 f73 verified；缺口2（型号/订货号表）确认为纯查阅型，走 reference-tables.md 检索、不蒸馏。needs_review 现为空。T01/T09 覆盖状态上调。

## 覆盖总览

| task | 任务 | 重要性 | 核心候选 | 覆盖状态 |
|---|---|---|---|---|
| T01 | 选 CPU/模块 + 算功率预算 | 关键 | f01, p01–p11, p06, f25 | **充分（已补）**：决策框架+安装规则+定量核算(p06升verified)；型号/订货号表走 reference-tables.md 检索 |
| T02 | 设计程序结构 OB/FC/FB/DB | 关键 | f02,p32 / f03 / f05,p12 / f26/f27/f28 | 充分 |
| T03 | 扫描周期/中断实时性 | 高 | f03,f07,f08,f09,f10,f14,f15,f38–f42 | 充分 |
| T04 | 数据一致性访问 | 高 | f04,f28/f33,f29/f29,f30/f34,f42 | 充分 |
| T05 | 通信配置 PN/PB/PtP/Modbus | 高 | f50,f51,f56,p31,p39,p40 | 部分覆盖：连接/角色/设备名充分；**PB 组态专章与 Modbus 大量细节以 case/reference 呈现，无独立 verified 组态流程** |
| T06 | 高速计数/PID/运动控制 | 中 | f45–f49, p25,p26,p36 | 充分 |
| T07 | 在线诊断定位故障 | 关键 | f10–f16,f43,f44,f52–f54,f61,f65,f66 | 充分 |
| T08 | 下载/调试/同步 | 高 | f32–f37,f55,f60–f64,f70,f72 | 充分 |
| T09 | 设备更换与备件兼容 | 中 | f73(新),f54,ce02,ce07,ce08,ce17,ce29,ce36 | **充分（已补）**：f73 附录D更换决策流程升verified；订货号/端子排表走 reference-tables.md 检索 |
| T10 | 恢复出厂/固件/存储卡 | 中 | f17–f24,f54,f57,f58,f59,f67–f69 | 充分 |

---

## T01 — 为项目选 CPU 与模块并算功率预算（关键）

- 原文位置：ch4.1 安装准则 p59–60；ch4.2 功率预算 p61；ch4.4 接线准则 p81–87；ch7.1 设计指南 p199–200；附录 A 技术规范 p1535、附录 B p1535+、附录 C 订购 p1535+、"计算功率预算" p1779（后两者为 22:30 追加）。
- 候选与去向：
  - f01 功率预算与供电决策框架 → **verified**（决策路径：5V/24V 分类、查表累加、超预算加外部电源、两条硬约束）
  - p01 开放设备外壳 / p02 高噪声隔离 / p03 25mm 间隙 / p04 不并联 / p05 M 同电位 / p07 断电+独立安全 / p08 单点接地 / p09 接线清单 / p11 感性负载抑制 → **verified**（安装/接线硬规则）
  - p06 功率预算分别核算 → **verified（补缺口后升级）**：附录B表B-1算例 + 附录A 5种CPU预算值补齐，独立复算逐项一致（5V差额790mA/24V差额−56mA），详见 appendix-source.md 与 verified.md 补缺口批次
  - p10 端子参数表 → **reference**（overview 参考区）
  - f25/p45 系统设计指南 → f25 **verified**（p45 rejected 并入）
  - ce01–ce13、c01、c02、c16 → **reference**（失败模式/示例，Boundary 区）
- critical 逐项复核（补缺口后更新）：
  - "算功率预算"——**已补齐**：p06 从 needs_review 升 verified，附录B算例+附录A预算值完整，可独立定量核算与判定外部电源需求。
  - "选 CPU 与模块"——**部分（按方法论合理降级）**：CPU 5V/24V 预算、模块数上限等决策相关参数已入 p06/reference-tables.md；纯型号/订货号/针脚表（附录 A/C）是"查"不是"迁移能力"，过不了 V3，走 reference-tables.md 检索，不蒸馏——这是 cangjie 的既定处理，非遗漏。
- 结论（补缺口后）：**充分覆盖**。定性框架(f01)+安装规则+定量核算(p06)齐备；选型数据走检索。

## T02 — 设计用户程序结构（关键）

- 原文位置：ch5.1 p89、p93–122；ch7.2–7.3 p201–212。
- 候选与去向：f02（吸收 p32）、f03、f05（吸收 p12）、f26、f27、f28（吸收 p33）、f13–f15、p13、p20–p24、p27、p47、g01–g06 → **verified**；g 术语入 glossary.md；c08/c09/c22 → reference。
- 复核：OB/FC/FB/DB 角色、可重入、嵌套深度、寻址规则均有可执行 verified 候选，覆盖充分。

## T03 — 扫描周期/中断实时性（高）

- 原文位置：ch5.1.2–5.1.4 p97–118；ch9.5 p468–485。
- 候选与去向：f03、f05、f07（吸收 p19）、f08（吸收 p15）、f09、f10（吸收 p18）、f14、f15、f38–f42、p13/p14/p16/p17/p46 → **verified**；g02/g07/g10/g15/g16 → glossary.md；ce28/ce29/ce33/ce34 → reference(Boundary)。
- 复核：执行顺序、优先级/排队、循环时间监视、相移、延时中断、DIS_AIRT 配对均覆盖充分。

## T04 — 数据一致性访问（高）

- 原文位置：ch7.4 p213；ch9.9–9.10（配方/数据日志）；ch5.1.2 PIP。
- 候选与去向：f04 PIP 分区流程、f28（吸收 p33）、f29（吸收 p29，优化匹配丢数据）、f30（吸收 p34，DIS_AIRT/EN_AIRT 三段式）、f42 配对 → **verified**；p35 通信缓冲区 → verified；g11/g12/g13 → glossary.md；c01/c05/c07/c12 → reference；ce30/ce32/ce33/ce37/ce38 → reference(Boundary)。
- 复核：多值一致性、原子性边界、通信缓冲区、优化 DB 坑点覆盖充分。注：ch9.9–9.10 配方/数据日志以 c14（reference）呈现，无独立 verified 流程，但非本任务核心（一致性机制已覆盖）。

## T05 — 配置通信（高）

- 原文位置：ch11 通信 p912–1060；ch13 CP 与 Modbus p1223–1433。
- 候选与去向：f50 PROFINET 连接组态、f51 Modbus 主从角色、f56 设备名分配、p31（→f31 吸收）、p39 PUT/GET、p40 RS485 端接 → **verified**；g18/g19/g22 → glossary.md；c17–c21、ce20/ce21/ce23/ce39/ce40/ce41/ce45 → reference。
- high 逐项复核：
  - PROFINET 连接建立 → f50 verified，充分。
  - Modbus 主从角色选择 → f51 verified，充分。
  - **PROFIBUS 组态专流程**：候选以 p40（RS485 端接规则）+ reference 案例为主，无独立 verified 的 PROFIBUS 组态 step-by-step 流程候选 → 轻缺口。
  - Modbus 具体功能码程序（c19/c20/c21）为 worked_example → reference，符合方法论（case 不独立成能力）。
- 结论：基本覆盖。核心决策/规则有 verified；协议程序细节按方法论降 reference，合理。

## T06 — 组态高速计数/PID/运动控制（中）

- 原文位置：ch10 p631–871。
- 候选与去向：f45 HSC 门、f46 HSC 四类功能、f47 编码器监控、f48 PID 调试、f49 运动错误排查、f38/f39 中断 → **verified**；p25/p26/p36 模拟量标定 → verified；g20–g24 → glossary.md；c01/c13/c15/c16/c17 → reference；ce34/ce35/ce36 → reference(Boundary)。
- 复核：HSC/PID/运动核心机制与调试流程覆盖充分。

## T07 — 在线诊断定位故障（关键）

- 原文位置：ch15 p1483–1533；ch5.1.3 各类错误 OB；ch9.7 诊断指令。
- 候选与去向：f10–f13（错误 OB 排查）、f16（诊断缓冲区）、f43/f44（报警与诊断指令）、f52（吸收 p30 LED）、f53（吸收 p31 致命错误）、f54（版本不兼容恢复）、f55（转到在线）、f56、f60/f61（监视/触发）、f65（跟踪）、f66（SM1231 断路）、f71（拓扑比较）→ **verified**；p38/p39 → verified；g09/g17/g25 → glossary.md；c03/c10/c11/c22 → reference；ce24/ce25/ce27/ce28/ce39/ce40/ce42/ce43/ce44 → reference(Boundary)。
- critical 复核：LED 判读→诊断缓冲区→错误 OB→诊断指令→跟踪/拓扑，形成完整排障链，覆盖充分。

## T08 — 下载/调试/同步程序（高）

- 原文位置：ch7.7–7.10 p233–242；ch15.11–15.14 p1498–1521。
- 候选与去向：f32 容量兼容决策、f33 下载失败恢复、f34 在线/离线同步、f35 上传、f36 能力矩阵、f37 时间戳冲突、f55、f60/f61、f62 快照、f63 RUN 下载、f64 临时错误、f70 比较同步、f72 STOP 输出风险、f06 → **verified**；g25 → glossary.md；c06/c08 → reference；ce22/ce24/ce25/ce26/ce27/ce31 → reference(Boundary)。
- 复核：下载前兼容判断、失败恢复、在线同步、RUN 下载风险均覆盖充分。

## T09 — 设备更换与备件兼容（中）

- 原文位置：附录 D 更换（p1535+，22:30 追加）；ch5.5 存储卡；ch5.1.3 版本差异。
- 候选与去向：
  - f54 组态版本不兼容恢复、f23 无效卡恢复 → **verified**（错误恢复类）
  - ce02 纵向安装降额、ce07 BB1297 电池、ce08 工具/扭矩、ce17 V3 卡不兼容、ce29 V3 时间错误 OB 旧行为、ce36 TO 与驱动器不一致 → **reference**(Boundary)
  - c02 组态控制换槽 → reference
- 复核（补缺口后更新）：
  - **已补齐**：新增 f73「V3.0→V4.2 CPU 设备更换决策与兼容检查流程」并升 verified——覆盖更换方向不可逆、STEP7升级路径、密码映射、OB属性、传送卡不兼容、运动控制版本/TO字段、HMI重编译、DB预留区处理、解除保护后重编译等完整流程（附录D.1 p1799-1806，原文存档 appendix-source.md）。
  - 订货号/端子排备件套件对照表（附录C/D.2）走 reference-tables.md 检索，不蒸馏（纯查阅型）。
- 结论（补缺口后）：**充分覆盖**。更换决策流程(f73)+错误恢复(f54)+失败模式(ce系列)齐备；备件查表走检索。

## T10 — 恢复出厂/固件更新/存储卡处理（中）

- 原文位置：ch5.5 p151–165；ch15.5–15.7 p1491–1495；ch15.17 p1528–1533。
- 候选与去向：f17 卡类型决策、f18 评估决策、f19 创建传送卡、f20 使用传送卡、f21 程序卡、f22 存储卡固件更新、f23/f24 恢复、f54、f57（吸收 p41）、f58 在线固件、f59 格式化、f67 备份恢复矩阵、f68（吸收 p42）、f69 恢复 → **verified**；p43 保持性备份禁写 → verified；p44 未知备份警告 → verified；g12/g13/g14 → glossary.md；ce06/ce07/ce14/ce15/ce16/ce17/ce18/ce19 → reference(Boundary)。
- 复核：三类卡用途、制作/使用步骤、固件更新、格式化后决策、备份/恢复矩阵覆盖充分。

---

## 缺口汇总（补缺口后更新）

1. ~~**T01 定量功率预算**（critical）~~ → **已关闭**：p06 补数值升 verified（2026-11-16 22:50）。
2. ~~**T01 CPU/模块选型数据表**（critical）~~ → **按方法论降级处理**：型号/订货号表走 reference-tables.md 检索，不蒸馏（V3 不过，纯查阅型）。CPU 预算值等关键决策参数已入 p06/参考表。
3. ~~**T09 型号替换兼容表**（中）~~ → **已关闭**：新增 f73 更换决策流程升 verified；备件查表走 reference-tables.md。
4. **T05 PROFIBUS 组态专流程**（高）：仍为轻缺口——无独立 verified 的 step-by-step 组态候选（RS485 端接规则 p40 已覆盖关键物理层约束，PROFINET/Modbus 主流程已覆盖）。不阻塞，入路由能力卡。
5. **来源回查受限（全局，部分缓解）**：阶段1的 211 条 V1 仍依据候选自带 source_quote+页码（原文曾被并发清空）；但缺口1/3 已从备份快照 PDF 补回原文（appendix-source.md）并二次核验。

## 对账（补缺口后）

- 阶段1输入 211 条 = f72 + p47 + c22 + ce45 + g25；补缺口新增 2 条（p06 升级计入路径调整、f73 新增）。
- verified 独立条目 **105**（原103 + p06 从 needs_review 转入 + f73 新增）；reference 93（c22+ce45+g25+p10）；needs_review **0**；rejected 14。
- 守恒：211 + f73新增1 = 212 项；105 + 93 + 0 + 14 = 212，无遗漏、无重复计入（p06 由 needs_review 转入 verified，不增总数；f73 为附录D新增）。
- 补缺口产物：appendix-source.md（原文存档）、reference-tables.md（查阅表）、verified.md 末尾「补缺口批次」段。
