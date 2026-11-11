---
title: "Visible-Thermal Tiny Object Detection: A Benchmark Dataset and Baselines (RGBT-Tiny)"
paper_id: "ying2025visiblethermal"
authors: "Ying et al."
year: "2025"
venue: "IEEE TPAMI"
list: "core"
scope: "Core"
section: "Surveys & Benchmarks"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["aerial", "benchmark"]
paper_link: "https://arxiv.org/abs/2406.14482"
code_link: "https://github.com/XinyiYing/RGBT-Tiny"
doi: "10.1109/TPAMI.2025.3544621"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：RGBT-Tiny benchmark: 115 paired sequences, 93K frames, 1.2M annotations in 7 categories (over 81% of objects under 16x16 px), plus the SAFit evaluation measure and extensive baseline evaluations.

## 点评

微小目标检测基准：115 序列 / 93K 帧 / 1.2M 标注、8 场景 7 类别、光照四档（夜间占 33.9%），条件多样性全是场景级协变量；全文与补充无任何退化/缺失子集或协议，条纹/NUC/坏点/热饱和等热故障零建模。口径是引用雷区：正文主表用作者自提的 SAFit 度量，IoU 口径在补充表 III，且分可见光/热红外两套真值标注，四格数值可差一倍以上，引用必须连口径与标注侧一起引。基准自带复制输入对照（基准方统一重训）：UA-CMDet 在两口径、两套标注四格中全部负融合，ProbEn-middle 四格全正；全场最佳是单模态通用检测器 DiffusionDet（SAFit AP 38.4/36.9），压过全部专用 RGBT 融合方法。M2D-LIF 与 DyFCLT 均不在其基线之列——「M2D-LIF 在 RGBT-Tiny 的 AP 38.7」只出自 DyFCLT 自家对比表，引用须写 per DyFCLT, Table 1。数据为 DJI Mavic 2 单平台 60–100 m 航拍，宣称精细对齐但视差随深度变化未解决、无像素级残差统计。

## 框架图

![RGBT-Tiny 数据集总览图（原文 Figure 1）：六个场景的可见光/热红外配对帧、标注框与序列级属性圆标](figs/visible-thermal-tiny-object-detection-a-benchmark-dataset-and-baselines-rgbt-tiny.webp)

*原文 Figure 1：RGBT-Tiny 数据集示例帧总览。六个场景面板（Playground、Country Road、Sea、City Road ×2、Bridge），每面板含可见光/热红外配对帧及标注框；顶部蓝条为场景名与（标注数/帧数）；底部圆标为序列级属性——粉色为光照等级（H / M / L / In）、绿色为目标尺度（M / S / T / Et）、黄色为标注密度（S / M / D）。对基准类论文，这张数据总览图的信息量高于其对齐流程示意图。图源：Ying et al., IEEE TPAMI 2025（预印本 arXiv:2406.14482v2），Figure 1。*

## 问题定义

本文要解决的是 RGBT 小目标检测缺公正基准的问题，分两层。（1）数据集层：既有工作几乎全是单模态小目标检测（可见光或热红外各自为政）；已有的 RGBT 数据集则数量不足、类别单一、应用面窄、图像未对齐、目标偏大（正文表 I 与 32 个已有数据集逐项对照），无法公正评测多类别 RGBT 小目标检测算法。（2）评测层：通用检测的 IoU 口径对微小框的定位扰动容忍度过低——正文给的例子是 8×8 的框偏 2 像素，IoU 从 1 掉到 0.39——用它评测微小目标会系统性失真，故需尺度自适应的评测度量。须注意，全文的问题定义里没有退化/损坏模态议程：它诉求的「鲁棒/极端」是自然场景条件的多样性（光照四档、密度、遮挡、双镜头残差视差），两路传感器在采集全程始终正常工作；标题与行文中的 challenging 指目标太小、线索太少，不是输入被污染。阅读依据：预印本 arXiv:2406.14482v2 HTML 全文（含补充材料）；期刊版为 IEEE TPAMI 2025，未逐行比对期刊排版版。

## 方法细节

本篇为基准类论文，本节按草稿原文呈现其数据集构建与评测协议。采集：平台为 DJI Mavic 2 无人机，飞行高度 60–100 m，机身垂直排列 RGBT 双镜头；双相机原始帧率 30 fps，公开版采样为 15 fps；热红外波段 8–14 μm；原始分辨率可见光 1920×1080、热红外 640×512。对齐：先相机标定去畸变，再用单应变换把可见光图对齐到热红外图，裁剪得到 640×512 的配对图像；作者明说单应只在固定景深内成立，双镜头固有的视差随深度变化未被解决、是留给后续工作的挑战——即数据集是「精细对齐」宣称与未量化的残差弱对齐并存。规模与构成（正文表 I）：115 段配对序列、93K 帧、1.2M 人工标注；目标 7 类（ship、car、cyclist、pedestrian、bus、drone、plane）；场景 8 类（sea、lake、bridge、city road、country road、playground、airport、sky），在四座城市跨一年、四季多天气采集。标注：用 DarkLabel 标注配对边界框 + 类别 + 跟踪 ID；除极端条件下少数不可辨认的目标外，两模态标注一一对应——正因为如此，两套标注并不完全等同：夜间不可见光照下热红外能标出可见光看不见的目标，ship 与 pedestrian 两类的热红外标注数多于可见光，这也是主表要分两套真值评测的原因。质量流程为 2000+ 小时、两步核验（标注员各自标注并互审；每图另经评估者复核，反复修订至无异议）；短时遮挡（<5 帧）用时序插值补框，长时遮挡不处理；全部标注中轻度遮挡（5–10 帧）3.4%、中度（10–20 帧）3.4%、重度（>20 帧）5.2%。划分：按序列划 85 段训练 / 30 段测试，两子集均须覆盖全部场景、目标类别与光照、密度变化且互不重叠；无验证集。属性体系（序列级标注，见图 1 底部圆标）：光照四档（high / medium / low / invisible；夜间序列占全部数据的 33.9%，其中 70% 以上为 low 与 invisible 两档）；密度三档（按每帧平均标注数 sparse [1,10)、medium [10,50)、dense [50,∞)；实际密度范围 1–161 框/帧，城市道路与桥梁显著密于天空与机场场景）；尺度五档（按框面积：extremely tiny [1²,8²)、tiny [8²,16²)、small [16²,32²)、medium [32²,96²)、large [96²,∞)），tiny 档占比最大（48%），small 及以下占 97% 以上，<16×16 的目标占 81% 以上（摘要口径）。评测协议：主口径为本文自提的 SAFit（正文表 III）——以 sigmoid(√A/C − 1) 为权重对 IoU 与 NWD 加权求和，A 为真值框面积，本数据集取 C=32；另有 SAFit 损失（1 − SAFit）及变体 SAFit-s（按尺寸硬切换）、SAFitg（GIoU 与 NWD 加权）。COCO 式 IoU 口径的全部基线结果放在补充表 III。主表按两套真值分左右两半报告（可见光标注口径 / 热红外标注口径），指标为 AP、AP50、AP75、五档尺度 AP 与 AR；后续论文引用「RGBT-Tiny 上的 AP」时用的基本是补充表 III 的 IoU 口径，引用时必须连口径一起注。

## 实验设置

基线构成（以正文 §IV-B 枚举为准，共 30 个方法，全部在 RGBT-Tiny 上重新训练后评测）：（1）可见光通用检测 18 个（SSD、YOLO、TOOD、Faster R-CNN、SABL、Cascade R-CNN、Dynamic R-CNN、RetinaNet、CenterNet、FCOS、ATSS、VarifocalNet、Deformable DETR、Sparse R-CNN、CO-DETR、DiffusionDet、DINO、DDQ）：单模态迁移口径，分别以可见光输入、热红外输入各评一遍；MMDetection 实现、默认参数，骨干/颈部优先 ResNet50+FPN，两阶段方法缩小初始锚框以适配小目标。（2）可见光小目标检测 3 个（RFLA、QueryDet、C3Det）：官方代码，同为单模态口径。（3）热红外小目标检测 3 个（ACM、ALCNet、DNA-Net）：本质是单类红外小目标掩膜分割方法，为接入多类检测评测做了范式改造——扩输出通道做多类分割，以框生成的均匀（hard）/ 高斯（soft）掩膜训练，测试时掩膜连通域取最小外接矩形转成框；其数字是改造后的可比性产物，不是原生检测性能。（4）RGBT 检测 6 个（UA-CMDet、ProbEn-early、ProbEn-middle、QFDet、CALNet、CMA-Det）：双模态输入的专用融合方法。另设复制输入对照：UA-CMDet 与 ProbEn-middle 各有一行带「(-)」标记的变体，即把单模态输入复制成两路（图中记为 VV / TT，真融合记为 VT）喂同一双路网络训练，专为隔离「融合本身带来多少增益」；并按四档光照给出 VV/TT/VT × 两套标注的 AP 曲线，但只图示、未列表。计数不一致（引用须防）：算法总数在文内三处不一致——摘要一处写 23 个、结论写 32 个、正文枚举为 30 个（18+3+3+6；结论的 32 疑把两个复制输入对照行计入），引用基线规模以正文枚举的 30 为准。

## 关键数字

RGBT 方法（SAFit 口径，正文表 III），AP 为「可见光标注口径 / 热红外标注口径」：QFDet 31.8 / 33.2（RGBT 组最佳，AP50 50.0 / 50.3）；CALNet 27.5 / 29.4；ProbEn-middle 27.4 / 29.3；ProbEn-early 18.4 / 17.0；CMA-Det 18.9 / 18.4；UA-CMDet 16.1 / 20.0。RGBT 方法（IoU 口径，补充表 III），同为两套标注口径：QFDet 13.6 / 16.6；ProbEn-middle 13.3 / 15.5；CALNet 10.6 / 12.7；UA-CMDet 6.1 / 8.0；ProbEn-early 3.2 / 7.4；CMA-Det 5.5 / 5.6。这一口径才是后续方法论文与 RGBT-Tiny 对比时的通用口径。全场最佳是单模态通用检测器（SAFit 口径，正文表 III）：DiffusionDet 以单模态输入达 AP 38.4（可见光）/ 36.9（热红外），CO-DETR 35.0 / 35.0——强通用检测器只吃一路输入，就压过全部 6 个专用 RGBT 融合方法（最佳 QFDet 31.8 / 33.2）。复制输入对照（正文表 III 与补充表 III，两口径结论一致）：UA-CMDet 的复制输入行反超其真融合行（SAFit 18.4 / 24.4 vs 16.1 / 20.0；IoU 8.6 / 11.9 vs 6.1 / 8.0）——在基准方的统一重训下，UA-CMDet 在此数据集上是负融合；ProbEn-middle 则真融合胜复制输入（SAFit 27.4 / 29.3 vs 24.7 / 26.0；IoU 13.3 / 15.5 vs 12.8 / 14.1）。同一基准、同一对照协议，融合增益两种符号并存。归属核查（重点）：M2D-LIF 与 DyFCLT 都不在本基准的基线名单中（两者均为基准发表之后的工作），本基准正文与补充的任何一张表里都没有 M2D-LIF 的数字；「M2D-LIF 在 RGBT-Tiny 上 AP 38.7」只出现在 DyFCLT 论文自己的对比表（其表 1）中，且 DyFCLT 未声明该数字是复现还是转引——引用 38.7 必须写 per DyFCLT, Table 1，不得挂到 RGBT-Tiny 基准名下。反过来，本基准官方口径下 RGBT 方法的天花板是 QFDet（IoU 口径 13.6 / 16.6），与方法论文自报口径完全不在一个数值体系里，跨来源拼表必错。SAFit 损失消融（正文表 II、补充表，可见光输入）：SAFit 口径下 SAFitg 综合最优（ATSS AP 24.7、Sparse R-CNN 22.0）；纯 IoU 损失训练的 Sparse R-CNN 在 SAFit 口径下 AP 仅 8.1，换 SAFit 损失达 21.4。热红外小目标方法的垫底幅度（IoU 口径，补充表 III）：ACM / ALCNet / DNA-Net 在可见光标注口径 AP 为 0.0 / 0.0 / 0.5，热红外标注口径 6.9 / 3.6 / 2.0——掩膜分割范式迁移到多类检测评测后基本失效，其数字只能说明范式不匹配，不宜作检测基线引用。

## 消融说明了什么

基准论文的「消融」主要是三组对照实验，各自说明的问题不同。（1）损失对照（表 II）：微小目标上 IoU 类损失的训练信号不稳定（Sparse R-CNN + IoU 损失在 SAFit 口径下 AP 只有 8.1），尺度感知的平滑加权（SAFit）优于按尺寸硬切换（SAFit-s），且 SAFitg 在 extremely tiny / tiny 档胜过 NWD、在 medium 档胜过 GIoU/IoU——即「按尺寸在两种度量间软切换」在评测与训练两侧都成立，这是本文方法侧最实的结论。（2）复制输入对照（表 III 的「(-)」行 + 光照分档曲线图）：融合增益不是自动的、更不是由数据保证的。UA-CMDet 在两口径 × 两套标注四格里全部负融合，ProbEn-middle 则四格全正——增益符号取决于融合机制本身。按光照分档的 VV/TT/VT 曲线协议形态是现成的，但正文未给分档数字，无法据此精确引用各档增益幅度。（3）热红外小目标方法的均匀/高斯掩膜对照：高斯（soft）掩膜训练更稳定，是把单类红外小目标分割方法接入多类检测评测的可用适配法；但三方法绝对水平垫底，说明这一支的瓶颈是范式（逐像素分割 + 外接矩形）而非训练技巧。另有作者的归因总结：端到端与稠密提议（anchor / query）范式、去噪定位回归对本基准友好；跨模态语义冲突、时空弱对齐、低光照被列为融合错误的主要来源（失败案例图与此对应）。

## 局限

（1）无退化/缺失评测（已核查全文与补充）：没有模态损坏、模态缺失、传感器故障的受控子集或协议；所谓极端条件是自然低光/不可见光照、遮挡与背景杂波，全部是场景级协变量，传感器始终健康，也没有干净–损坏配对可言。（2）采集不涉及真实传感器故障形态：条纹噪声、非均匀性（NUC）漂移、坏点、热饱和等热像仪故障在全文无建模、无评测；补充材料讨论失败案例时仅把「设备噪声（device noise）」列为复杂背景杂波的来源之一，没有协议、没有分档、没有数字。（3）对齐质量未量化：宣称精细对齐，但单应变换的固定景深限制使深度方向残差视差必然存在，全文未给任何像素级残差统计，弱对齐程度无法复现地报告；把本基准当「已对齐」引用时须带这一保留。（4）平台与视角单一：全部数据出自同一型无人机（DJI Mavic 2）的同一类双镜头模组、60–100 m 高度，视角以俯视/斜俯视航拍为主；跨平台、跨传感器、地面视角的泛化均未评测。场景多样性是真的，但那是内容多样性，不是设备多样性。（5）口径事故高发：SAFit 与 IoU 两套数字 × 可见光/热红外两套标注共四格并行存在，数值差距可达一倍以上（如 QFDet 31.8 vs 13.6），跨论文引用若不注明口径与标注集必然拼错表；算法总数在文内还有 23 / 30 / 32 三种说法。（6）划分与时序：只有 train/test 两分、无验证集，调参易直接碰测试集；标注带跟踪 ID 且官方另有跟踪扩展，但本基准评测是逐帧检测，时序信息只在标注补框（短时遮挡插值）里用过。（7）类别不均衡：bus、cyclist 等类别实例少，作者自陈其性能受训练偏置拖累；分档 AP 的小样本波动未给置信区间。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
