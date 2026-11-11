---
title: "Multispectral State-Space Feature Fusion: Bridging Shared and Cross-Parametric Interactions for Object Detection"
paper_id: "shen2026multispectral"
authors: "Shen et al."
year: "2026"
venue: "Information Fusion"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "State-Space Models (Mamba)"
fusion_level: "feature"
architecture: "Mamba"
tags: ["mamba"]
paper_link: "https://doi.org/10.1016/j.inffus.2025.103895"
code_link: ""
doi: "10.1016/j.inffus.2025.103895"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：State-space feature fusion that separately models shared and cross-parametric cross-modal interactions.

## 点评

论文自称 MS2Fusion（目录简称 MSF），出自 ICAFusion 团队。两类交互的确切所指：CP-SSM 让两支路全量交换输出解码矩阵 C（各自隐状态改由另一模态的 C 解码，B/Δ 保持自有）；SP-SSM 先把两模态特征直接相加、由融合特征生成一组共享 SSM 参数注入两支路。全管线没有任何质量/可靠性量、标量门或 softmax 权重（关键词核查坐实），混合比例全隐含在输入相关的 SSM 参数里、不可读出也不可干预，不存在把一路压到零的通路——是「用融合结果决定如何融合」的结构自指，一路损坏会经共享参数污染干净支路。退化评测为零；唯一的缺失实验是把存活模态复制喂入两支路（V+V / T+T），其相加基线在 V+V 下 mAP@0.5 61.2、低于单模态 RGB 检测器的 67.8，与 GM-DETR 的复制输入反例同型。头号机制 C 交换在自家消融里只值 +0.6，三模块总增益 +3.3 靠参数量 72.7M→130.2M 堆出。正文与自家表格有两处不一致（FLIR、LLVIP 各一），引用以表格为准。

## 框架图

![MS2Fusion 方法主框图（原文 Figure 5）：双骨干 + P3/P4/P5 三层 MS2Fusion 融合的总体架构与模块内部结构](figs/multispectral-state-space-feature-fusion-bridging-shared-and-cross-parametric-interactions-for-object-detection.webp)

*原文 Figure 5：上半为总体架构——双骨干分别处理可见光 I_V 与热红外 I_T，在 P3/P4/P5 三层各经一个 MS2Fusion 模块融合后送入 Neck，再接 Co-DETR（CoDINO 头）或 YOLO 检测头；下半为 MS2Fusion 内部结构——F_V、F_T 并行进入 CP-SSM（跨参数支路）与 SP-SSM（共享参数支路），四路输出交叉组合后经两个 FF-SSM 得到两路精修特征，再经第三个 FF-SSM 合成为该层融合输出 F_fused。图源：Shen et al., Information Fusion 2026（arXiv:2507.14643）Figure 5。*

## 问题定义

作者提出两个问题：其一，现有多光谱融合过度偏重局部互补特征、忽视跨模态共享语义，损害泛化；其二，感受野与计算复杂度难以兼得——CNN 感受野受限，Transformer 复杂度随序列长度二次增长。其图 1 把场景二分：模态互补显著时（一路纹理清晰、一路热签名强）靠互补特征；当两模态的判别特征都弱时（RGB 纹理模糊、热红外对比度低），跨模态一致的形状、结构等共享特征成为关键。须注意其问题设定的边界：所谓弱，指自然场景中特征不显著，输入始终是干净、配对、对齐的双模态图像；没有传感器损坏、信号退化或模态失效的设定，鲁棒只以低光、恶劣天气、遮挡等数据集自带场景的形式出现。

## 方法细节

双骨干分别提取 F_V、F_T，在 P3、P4、P5 三层各插入一个 MS2Fusion 模块，再经 FPN/PANet Neck 送检测头（YOLOv5 或 Co-DETR 两套框架分别评测）。模块内部：F_V、F_T 同时送入 CP-SSM 与 SP-SSM，两支路的四路输出交叉组合进入两个 FF-SSM 得到两路精修特征，再经第三个 FF-SSM 合成为该层输出。CP-SSM（跨参数支路）：两支路各是一个 Mamba 式 SSM，各自的 B、C、Δ 由本支路特征线性投影生成，随后交换两支路的输出矩阵 C——每支路的隐状态改用另一模态的输出投影矩阵解码，B、Δ 与状态转移保持自有，作者称之为在状态空间维度构造隐式注意力；特征展开采用行扫描。SP-SSM（共享参数支路）：先把 F_V 与 F_T 逐元素相加，由融合特征生成一组共享参数注入两支路各自的 SSM，两支路只保留独立的初始状态，意在压掉模态特有噪声、提取对光照等干扰不变的共享语义。FF-SSM（融合支路）：把两个输入按 (F1,F2) 与 (F2,F1) 两种顺序拼接成两条序列分别过 SSM 再合并输出，用反序路径补偿 Mamba 单向扫描的特征遗忘并扩大有效感受野。结构盘点：全管线没有任何质量/可靠性估计量，没有标量门或 softmax 权重；两模态的混合比例完全隐含在由特征线性生成的 SSM 参数（B、C、Δ）与状态递推之中，不可读出、不可校准；C 交换是全量交换这一二值结构选择，参数共享是硬约束而非加权——不存在把任一模态贡献压到零的通路。损失直接沿用检测框架自带损失，无融合专用损失。

## 实验设置

数据集：FLIR-aligned（训练 4,129 / 测试 1,013 对）、LLVIP（12,025 / 3,463 对）、M3FD（按 8:2 划分）、VEDAI（9:1，第四通道为 NIR 而非热红外）；另在 MFNet、SemanticRT（RGB-T 语义分割）与 VT821/VT1000/VT5000（显著性检测）上验证融合模块的通用性。指标为 mAP@0.5 与 mAP@[0.5:0.95]（VEDAI 只报 mAP@0.5）。实现：PyTorch、RTX 3090，输入 640×640（测试 640×512），SGD（lr 0.01、momentum 0.937、wd 5e-4、余弦衰减），batch 4，mosaic 增广；消融统一在 FLIR 上做、60 epochs。主对比表（表 2–5）没有单模态行；唯一的单模态/缺失相关实验是 §4.5.6 表 14 的复制输入测试（把存活模态的同一图像喂给两支路）。

## 关键数字

效率（表 1，FLIR + YOLOv5）：MS2Fusion 140.8 GFLOPs / 130.3M 参数 / 29.7 FPS / mAP@0.5 83.3，对比 Transformer 融合 421.9 GFLOPs / 440.6M / 75.0、CNN 融合 190.3 / 159.7M / 74.3。FLIR（表 2）：YOLOv5 版 83.3 / 40.3，Co-DETR 版 87.8 / 49.7 为表内最高；同表 TFDet、DAMSDet 均为 86.6，高于其 YOLOv5 版。LLVIP（表 3）：97.5 / 65.5，Co-DETR 版 98.4 / 70.6。M3FD（表 4）：89.4 / 59.7，Co-DETR 版 91.4 / 65.6 为表内最高。VEDAI（表 5）：80.2，低于 YOLOFusion 的 81.6；Co-DETR 版 84.2 为表内最高。复制输入测试（表 14，FLIR）：单模态检测器 V 67.8 / T 73.9；相加融合基线 V+V 61.2 / T+T 77.8 / V+T 80.0；MS2Fusion V+V 68.4 / T+T 82.1 / V+T 83.3。种子稳定性（表 16）：10 个随机种子下 FLIR mAP@0.5 均值 82.99、方差 0.15——这是文中鲁棒性的唯一量化出处，指初始化稳定性而非输入鲁棒性。口径提示：正文头条数字与自家表格有两处不一致（FLIR 的最高 83.3、超 SOTA 2.2% 与表 2 对不上；LLVIP 正文写 97.7、表中为 97.5），引用以表格为准。

## 消融说明了什么

模块消融（表 11，FLIR）：相加基线 80.0；单加 CP-SSM +2.1、SP-SSM +2.2、FF-SSM +2.5；两两组合 +2.7/+2.7/+2.9；三者齐全 +3.3 至 83.3，但参数量从 72.7M 涨到 130.2M——三模块增益次可加、无单一主导者，每块的边际贡献都不大且靠堆参数买来。C 交换本身只值 +0.6（表 13：交换 C 83.3 vs 不交换 82.7），即论文的头号机制（跨参数交互）在自家消融里是最弱的一环；同表扫描方向影响显著：列扫描使 person AP 从 85.1 降到 64.1（总 mAP 82.4），行+列双扫 82.0 也不如单行扫，说明 SSM 扫描方式对检测稳定性是敏感项。融合层数（表 12）：只 P3 为 81.1，P3+P4 为 82.0，三层 83.3，单调递增但边际递减。框架/骨干可移植性（表 9/10）：YOLOv5 与 Co-DETR 上均 +3.3，VGG16 +1.0、ResNet50 +4.8、CSPDarkNet53 +3.3；代价是速度，YOLOv5 框架 FPS 从基线 43.2 降到 24.4。FF-SSM 双向输入（表 15）：双向 83.3 vs 单向 83.1 / 82.5，特征遗忘补偿的量化收益只有 +0.2/+0.8。表 14 还显示：相加基线在 V+V 复制输入下为 61.2，低于单模态 RGB 检测器的 67.8；MS2Fusion 的 V+V 68.4 也仅与单模态 V 的 67.8 基本打平——作者以此表论证缺失模态下仍有竞争力（T+T 只比 V+T 低 1.2），但该实验是复制输入而非置零/丢弃，模型训练时从未见过这种输入分布。

## 局限

作者自陈（§4.7）只有三类失败案例——远距离且热签名与背景接近的小目标、遮挡目标、与人体热特征相似物体的假阳性，无方法论层面的局限讨论。退化/缺失评测足迹为零：无注噪、无模糊、无过曝，无任何传感器故障模型（条纹噪声、非均匀性漂移、坏点、热饱和均未出现）；所有挑战条件都是数据集自带的自然低光/夜间/遮挡场景。缺失模态仅有 §4.5.6 一处且以复制输入模拟，训练全程为完整配对，没有损坏但仍在场这一档评测，也未把损坏与缺失分开评测。SP-SSM 声称提取对光照条件与环境干扰不变的共享特征，但全文没有受控退化实验支撑该不变性，只有低光场景的定性特征可视化（图 12）。另：VEDAI 的第四通道是 NIR，与其余数据集的热红外不同质，原文未作区分提示；YOLOv5 框架下全模型 130.2M 参数并不轻量，VEDAI 上其 YOLOv5 版亦非最优（80.2 < YOLOFusion 81.6）。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
