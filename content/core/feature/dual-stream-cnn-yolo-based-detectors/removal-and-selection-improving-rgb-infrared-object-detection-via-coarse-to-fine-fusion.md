---
title: "Removal and Selection: Improving RGB-Infrared Object Detection via Coarse-to-Fine Fusion"
paper_id: "zhao2025removal"
authors: "Zhao, Yuan, Jiang, Wang, Wei"
year: "2025"
venue: "IEEE TITS"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Conflict-Aware; Quality-Aware"
tags: ["conflict-aware", "quality-aware"]
paper_link: "https://arxiv.org/abs/2401.10731"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Coarse-to-fine fusion: first remove modality noise/redundancy from features, then select complementary cross-modal information.

## 点评

名字像损伤处理，实质是干净配对分布上训练的内容自适应机制。RSR 在骨干之前、图像级对每路模态独立执行频谱 patch 衰减：滤波器由只读该模态自身幅度谱的预测网络生成、topK 恒保留 320/400 个频谱 patch，结构上不可能清掉一路模态，移除内容以背景为主（SNR 仅升 0.2–0.36 dB）。DFS 逐尺度用 Router 把 softmax 权重阈值化为 (1,1)/(1,0)/(0,1) 硬开关、被关模态特征整幅乘 0，但最终特征含完全无门的共享支路，两模态内容无条件到达检测器、总贡献结构性不为零；阈值取值与门控触发频率全文未报告。仅 KAIST（'All' 口径，与 'Reasonable' 不可直接比）/ FLIR-aligned / LLVIP 三个干净基准，无退化/缺失/故障评测，也无测试时模态消融（单模态行均为单独训练的检测器）。作者自陈 LLVIP 上既有融合方法总被单 IR 方法超过（ProbEn 51.5、GAFF 55.8 低于 IR-only 的 58.6），RSDet 以 61.3 首次越过——干净数据口径。

## 框架图

![RSDet 方法主框图（原文 Figure 3）：粗到细融合总览与 RSR、DFS 两模块的内部结构](figs/removal-and-selection-improving-rgb-infrared-object-detection-via-coarse-to-fine-fusion.webp)

*原文 Figure 3：RSDet 的粗到细融合框架。上排为总览：红外 I 与可见光 V 先经「粗」阶段的 RSR（冗余频谱移除）得 I′、V′，各过骨干得多尺度特异特征 C_I-spe、C_V-spe 与共享特征 C_sha；再经「细」阶段的 DFS（动态特征选择）得融合特异特征 C_spe，C_spe 与 C_sha 一并送入右侧目标检测器（Faster R-CNN）。左下为 RSR 内部：图像经 DFT 分解为幅度谱与相位谱，滤波器预测网络只读幅度谱、经 topK 生成滤波器，与频谱逐点相乘（相位原样保留）后 IDFT 回空间域。右下为 DFS 内部：门控网络由两路特征的池化统计生成权重，Router 按阈值控制各尺度 I/V 专家的通断，专家输出再按权重聚合。读图关键：共享特征 C_sha 从骨干直达检测器、全程无门控。图源：Zhao et al., IEEE TITS 2025（预印本 arXiv:2401.10731v6），Figure 3。*

## 问题定义

本文把 RGB-IR 融合的困难定义为每个模态内部的冗余特征（redundant features）在传播中放大融合不精确（fusion imprecision）：背景干扰、高频噪声等与目标无关的信息随特征提取与融合一路带入，污染融合特征。作者对既有路线的批评是：Late Fusion 无显式跨模态交互、学不到互补信息；Halfway Fusion 一类方法只强调互补信息学习、忽视冗余的负面影响。解法借 Treisman 衰减理论（Attenuation Theory）的认知叙事：人脑先按准则衰减无关信息、再精细选择所需信息——对应一个 coarse-to-fine 视角：先「粗」地移除每路模态内部的干扰频谱，再「细」地在模态间选择所需特征做融合。须注意，这里的「冗余/干扰」是干净配对输入自身的属性（背景杂波、成像高频噪声，可视化显示被移除内容主要集中在背景区域），是定性/概念性的问题陈述——全文没有把「某一路传感器在测试时被损坏、污染或缺失」设为问题。作者唯一接近「模态有害」的表述出现在 LLVIP 讨论：弱光下 RGB 特征会干扰 IR 特征、使既有融合方法反而不如单 IR 检测器——但那仍是自然条件下的特征干扰陈述，不是受控退化协议。阅读依据：预印本 arXiv:2401.10731v6 全文；正式版（IEEE TITS 2025）标题与预印本略有差异，方法简称以 RSDet 为准。

## 方法细节

整体管线（图 3）：两路图像先经 RSR 得过滤后图像，再提取共享/特异特征，最后由 DFS 选择融合，融合特征 C = C_sha + C_spe 送入 Faster R-CNN（ResNet-50）的 RPN 与检测头，RPN 与 R-CNN 头不变。所谓 coarse-to-fine 是单向前馈的两段串联（图像级频域过滤 → 特征级选择），不是迭代精修、也没有反馈回路。（1）RSR——在输入图像级、骨干之前，对两路模态各自独立执行（模态内操作，无任何跨模态比较）：对图像做 DFT 得复数频谱，滤波器预测网络只吃幅度谱，经一个简单编码器得嵌入向量，每个分量代表频谱图上一个 patch 区域的「重要性」（全文 patch 总数 400）；对其做 topK（选定 K=320）保留 top-K patch 的嵌入值，再以最近邻插值 reshape 回频谱尺寸得取值 [0,1] 的滤波器，与频谱逐点相乘（滤波器为实值，相位原样保留、只衰减幅度），IDFT 回空间域。软滤波器下非 top-K 位置保留其较小的嵌入值，硬滤波器下直接置 0；最终采用软滤波器 + K=320。作者对学到的滤波器的解读是「移除了一些高频噪声」，可视化（图 7）显示移除内容以背景为主，处理前后 SNR 仅微升约 0.2–0.36 dB。判据来源：滤波器完全由被过滤模态自己的幅度谱预测，无冗余真值、无质量监督，纯粹由检测损失与互信息损失在干净配对数据上端到端学出，它学的是「对检测有用的频谱保留策略」，不是损坏检测器。（2）共享/特异提取：过滤后图像各过 ResNet 骨干得多尺度特异特征，共享特征由若干 ResBlock 提取；特异/共享的解耦用互信息损失监督（以 CE−KL 近似最大化互信息），总损失中其系数 γ = 0.001。（3）DFS 的粒度是逐尺度的模态二选一/全选：每个尺度上把两路特异特征做全局平均池化并展平，门控网络把两者拼接后过线性层 + softmax 得权重——权重来自两路被选择特征自身的池化统计，且跨模态竞争；Router 以阈值 t 把权重转成硬二值开关，取值组合只有 (1,1)、(1,0)、(0,1) 三种（公式中没有 (0,0) 分支，两路都低于 t 时未定义），且 t 的取值全文从未给出。专家（每模态每尺度一个，各为两个卷积块）吃的是先乘过开关的特征，其输出再乘软权重聚合。结构核查：特异支路内可以逐尺度把一路模态的特征整幅乘 0，但整路清零需全部 4 个尺度同时关闭；共享支路 C_sha 没有任何门控或权重、直通检测器，一路模态经共享支路的内容贡献结构性地不为零，全管线不存在把任一模态总贡献压到零的通路；RSR 的 topK 按构造恒保留 320/400 个频谱 patch，软滤波器连其余 patch 也不置零。

## 实验设置

数据集三个（无 DroneVehicle、无 M3FD）：KAIST（训练 8,963 对 / 测试 2,252 对，改进标注，采用 'All' 设置——含 <55 px 与重遮挡目标，比 'Reasonable' 更难）；FLIR-aligned（共 5,142 对，训练 4,129 / 测试 1,013，person/car/bicycle 三类，dog 类因实例过少被剔除）；LLVIP（训练 12,025 / 测试 3,463 对）。指标：FLIR、LLVIP 用 mAP50 / mAP75 / mAP@[.5:.95]；KAIST 用 log-average MR⁻²，在 'All' 设置下分别报 IoU=0.5 与 IoU=0.7 两套（表 IV）。实现：MMDetection；Faster R-CNN + ResNet-50；SGD（momentum 0.9，权重衰减 1e-4），12 epoch，lr 1e-2（FLIR/KAIST）/ 1e-3（LLVIP）；各数据集输入分辨率被调整到与 LLVIP 一致；增广只有随机翻转（p=0.5）；RTX 3090。单模态对照以单独训练的检测器行给出：表 V、表 VI 列有 SSD / RetinaNet / Cascade R-CNN / Faster R-CNN / DDQ-DETR 分别只吃 IR 或只吃 RGB 的行，表 II 公平设置下有 Faster R-CNN 的 RGB-only、IR-only、双流相加三行；但全文没有对训练好的 RSDet 本身做测试时模态消融（测试时去掉/损坏一路输入会怎样，未测）。没有的设置（核查结论）：无任何退化/腐化注入、无模态缺失、无传感器故障模型（条纹、非均匀性、坏点、饱和均无）；KAIST 的昼/夜、尺度、遮挡子集是数据集固有划分，不是受控退化；训练增广亦无损坏增广。

## 关键数字

头条（SOTA 对照表）：KAIST 'All' MR⁻²（IoU=0.5，表 IV(a)，越低越好）All 24.79（Day 24.18 / Night 26.49），次优 CAGTDet 28.96；Far 子集 37.68 vs 次优 49.40（作者称领先约 11.72 点）。FLIR（表 V）mAP50 83.9 / mAP 43.8，次优 CSAA 79.2/41.3、ICAFusion（CSPDarkNet53）79.2/41.4。LLVIP（表 VI）mAP50 95.8 / mAP 61.3，次优 CSAA 94.3/59.2。单模态锚点：FLIR 上 IR-only Faster R-CNN 74.4/37.6、RGB-only 64.9/28.9（表 II/V）；LLVIP 上最强 IR-only 为 DDQ-DETR 的 58.6 mAP、最强 RGB-only 46.7 mAP（表 VI）。特别地，LLVIP 表 VI 中多数融合方法（ProbEn 51.5、Halfway 55.1、GAFF 55.8）低于最强 IR-only 检测器（Cascade R-CNN 56.8 / DDQ-DETR 58.6）——作者在 LLVIP 讨论中明说该数据集上既有 RGB-IR 方法「总是被单 IR 模态方法超过」，RSDet 的 61.3 首次越过 IR-only 最强行（+2.7 mAP），但这是干净数据上的比较。引用口径警告：KAIST 的 24.79 是 'All' 设置，与行人文献常用的 'Reasonable' 设置数值不可直接比较，引用时须连口径一起注明。

## 消融说明了什么

组件消融（表 I，三个数据集并行报告）：无 RSR、无 DFS 的基线在 FLIR 为 mAP50 81.2 / mAP 41.2、LLVIP 为 mAP50 95.0 / mAP 55.5、KAIST 'All' MR⁻² 为 26.48；只加 RSR 后为 82.3 / 41.9、95.0 / 57.1、26.12；只加 DFS 后为 82.4 / 42.8、95.6 / 59.5、26.23；两者全加（完整 RSDet）为 83.9 / 43.8、95.8 / 61.3、24.79。两个模块各自在三个数据集上都有一致的小幅正贡献，合用时最优，支持「先移除、再选择」的两段式设计，但每一步的量级都在数个点以内。DFS 可替换性对照（表 II，FLIR，统一 Faster R-CNN + ResNet-50 骨干与检测头）：双流直接相加基线 mAP50 73.1 / mAP 37.1（64.61M 参数）；把融合换成 CMX 为 80.5 / 39.7（305.20M 参数），换成 CFT 为 77.5 / 39.2（196.93M），换成 DFS 为 80.9 / 41.3（68.52M）——DFS 以接近相加基线的参数量取得最高的 mAP75 与 mAP。RSR 滤波器设计（表 III，FLIR）：软滤波器在 K=320 时最优（83.9 / 43.8）；软滤波器在 K 取 300–400 各值下的平均 mAP 42.90，高于硬滤波器的 42.52；K=400 即什么都不移除时为 82.4 / 42.8。消融的边界：全部消融只改变模块构成与超参数，没有任何一组改变测试输入的模态状态（损坏、缺失或置零），证明的是两模块在干净分布上的检测增益，而不是对模态异常的适应能力；「RSR 移除的是冗余」的主要证据是可视化与 t-SNE 图（图 7–图 9）：移除内容以背景为主、SNR 仅微升约 0.2–0.36 dB。

## 局限

（1）退化/缺失评测为零（已核查全文）：没有噪声注入、模态损坏、模态缺失或传感器故障的任何实验设定。两级判据都取自被处理模态自身（RSR 读模态自己的幅度谱、DFS 读特征自身的池化统计），全部只在干净配对数据上以检测损失训练，无可靠性真值、无损坏增广。以周期性条纹噪声为例（结构推断，作者未实验）：条纹在幅度谱上是高幅值高频分量，恰是滤波器预测网络读取的统计量本身——损坏会直接改写判据的输入分布，滤波器与门控都在分布外工作，无任何机制保证其输出仍指向「衰减损坏、保留完好」。（2）结构上不存在把任一模态总贡献压到零的通路：共享支路 C_sha 无门控直通检测器；RSR 的 topK 恒保留 320/400 个频谱 patch；DFS 的硬开关虽能逐尺度清零特异特征，但整路清零需 4 个尺度同时关闭，且阈值 t 的取值全文从未报告、门控实际触发频率无从得知，开关公式亦未定义两路权重都低于 t 的情形。（3）无测试时模态消融：表中的单模态行是单独训练的检测器，训练好的 RSDet 在测试时去掉或损坏一路输入的表现未测。（4）正文没有独立的局限一节，也未讨论上述任何一点。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
