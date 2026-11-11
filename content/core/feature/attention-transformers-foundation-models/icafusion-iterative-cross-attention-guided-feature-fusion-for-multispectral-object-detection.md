---
title: "ICAFusion: Iterative Cross-Attention Guided Feature Fusion for Multispectral Object Detection"
paper_id: "shen2024icafusion"
authors: "Shen, Chen, Liu, Zuo, Fan, Yang"
year: "2024"
venue: "Pattern Recognition"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Attention"
tags: ["cross-attention"]
paper_link: "https://doi.org/10.1016/j.patcog.2023.109913"
code_link: "https://github.com/chanchanchan97/ICAFusion"
doi: "10.1016/j.patcog.2023.109913"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Iterative cross-attention guided feature fusion for multispectral object detection.

## 点评

迭代跨注意力融合的代表方法，常作对比基线（LLVIP、M3FD）。

## 框架图

![ICAFusion 方法主框图（原文 Figure 2）：RGB 与 Thermal 双支路经 C1 至 C5 五阶段、在 C3、C4、C5 三处由 DMFF 模块融合后送 Neck 与三个 Head](figs/icafusion-iterative-cross-attention-guided-feature-fusion-for-multispectral-object-detection.webp)

*原文 Figure 2：RGB（上）与 Thermal（下）两条支路各经 C1 至 C5 五个阶段，在 C3、C4、C5 三处由 DMFF 模块做双模态特征融合，融合特征送入 Neck 做多尺度聚合，再经三个 Head 输出检测结果。模块细节见原文 Figure 3（DMFF：SFS + ICFE + NIN 融合）。图源：Shen et al., arXiv:2308.07504，Figure 2。*

## 问题定义

问题设定与 CFT 同源：卷积式特征融合只有局部感受野，对图像错位敏感，且无法建模跨模态的长程依赖；需要一种全局的跨模态特征交互机制来收获两模态的互补信息。作者额外提出第二个问题：直接堆叠多个 Transformer 块做特征增强会带来参数量与空间复杂度膨胀——如何不增加可学习参数地加深跨模态交互。受人类复习知识启发，答案是参数共享的迭代交互。问题的默认前提仍是两模态输入为完好、对齐（FLIR 用 aligned 版）的图像对。需要特别注意：贡献列表声称 CFE / ICFE 模块可为某一路模态缺失或质量差的场景提供可行方案，正文也给了相应实验——但其实验形态（见实验设置与局限）与真正的模态损坏相距甚远。阅读依据：arXiv:2308.07504 v1 预印本全文通读（引言至结论、表 1–表 11、图 1–图 8）；正式版为 Pattern Recognition 145 (2024) 109913，期刊版未逐字比对；本文数据集是 KAIST、FLIR、VEDAI，没有 LLVIP。

## 方法细节

整体沿用 halfway fusion 的双流骨干（默认 YOLOv5 + CSPDarkNet53），在 C3、C4、C5 三个阶段各插入一个 DMFF（双模态特征融合）模块，融合特征送入原检测器的 neck 与 head。DMFF 由三部分构成。(1) SFS（空间特征收缩）：在注意力之前压缩特征图以降低 token 数，两种方案——卷积式（reshape 到通道维加 1×1 卷积）与池化式（平均池化与最大池化以可学习权重混合的 mixed pooling）；消融后选定 mixed pooling。(2) CFE（跨模态特征增强）：核心的双向交叉注意力。两个 CFE 模块（参数不共享）分别增强两支路：以热红外支路为例，K、V 由热红外 token 投影，Q 只由辅助模态（RGB）token 投影，即用另一模态的 query 去检索、重组本模态的 value；8 头多头交叉注意力；两条残差支路都带可学习系数（初始化为 1）。这与 CFT 的关键区别在于：CFT 把两模态 token 拼成联合序列做自注意力（Q、K、V 来自全部模态），ICAFusion 只算跨模态相关性，其复杂度约为 CFT 的一半；且不用 CFT 的全局池化，改用 SFS 在特征分辨率上收缩。(3) ICFE（迭代 CFE）：把双 CFE 块以参数共享方式重复作用 n 次，前一次输出作下一次输入，即文题中的迭代；默认迭代次数 n=1，n 增大不增加参数与显存，但要增加计算时间。ICFE 输出的两路增强特征再经 NIN fusion（1×1 卷积拼接融合）得到融合特征。工作模式（图 5）有五种：单 CFE 只输出增强后 RGB 或热红外、双 CFE 参数共享、双 CFE 不共享、基线 NIN 融合。损失沿用所挂检测器（YOLOv5 / FCOS）的原始损失，无融合专用损失。

## 实验设置

数据集三个，均为干净基准：KAIST（弱对齐 640×512，训练 8,963 对 / 测试 2,252 对，用 sanitized 标注；指标为漏检率 MR，越低越好）；FLIR aligned 版（5,142 对，训练 4,129 / 测试 1,013，person、car、bicycle 三类；指标 mAP50 / mAP75 / mAP）；VEDAI（航拍，1,268 对 RGB-IR、9 类车辆、3,700 余标注，1024×1024，旋转框转水平框）。训练：PyTorch 1.7.1，RTX 3090，60 epoch，batch 8，SGD（学习率 1e-2、动量 0.937、权重衰减 5e-4、余弦退火），输入训练 640×640、测试 640×512，Mosaic 加随机翻转增广。消融基线为 YOLOv5 + NIN 融合。可迁移性实验挂了 VGG16、ResNet50、CSPDarkNet53 三种骨干与 YOLOv5、FCOS 两种检测头。与缺失模态相关的唯一实验是不同输入模态实验：所谓缺失，是把存活模态的同一幅图像同时喂给两条支路（R+R 或 T+T，即复制输入），既没有置零或黑图，也没有任何噪声、模糊、曝光等退化注入；图像质量差从未被操作化为任何实验条件。

## 关键数字

KAIST（MR，All / Day / Night）：本文 7.17 / 6.82 / 7.85，FPS 38.46（RTX 3090）；All 与 Day 为表中最佳，但 Night（7.85）反而不如 MSDS-RCNN（6.75）与 MLPD（6.95）；对照 MBNet 8.40、AR-CNN 10.22、Halfway Fusion 25.77。FLIR：mAP50 / mAP75 / mAP 为 79.2 / 36.9 / 41.4；分类别 AP50 为 Bicycle 66.9、Car 89.0、Person 81.6。同表 CFT 为 78.3 / 35.5 / 40.2（注：CFT 原文自报 mAP50 为 78.7，与此处转引的 78.3 不一致，引用须小心）；本文模块挂到 CFT 基线上的版本为 78.6 / 35.8 / 40.8。VEDAI：mAP50 76.62（基线 74.66），但严格口径 mAP 只有 44.93，低于 Input Fusion（45.65）与 Mid Fusion（46.30）——正文亦承认低 0.28 / 1.37 个点；正文另有一处口径错误：称 mAP 超基线 1.96，1.96 实为 mAP50 的增益（76.62 减 74.66），mAP 实际只增 0.84。代价：YOLOv5 + CSPDarkNet53 配置参数量 120.21M（基线 75.44M），FPS 38.46（基线 50.00）；比 CFT 的 206M 轻，但仍属重型。复制输入实验（缺失模态的唯一证据）：单路输出模式下退化温和——R+R 输入、只输出增强 RGB 时 KAIST MR 20.50（双模态输入时 17.74，+2.76），FLIR mAP50 66.3（68.7，−2.4）；T+T、只输出增强热红外时 MR 20.07（+1.72），mAP50 74.2（−0.9）。但融合输出模式直接崩塌：R+R 时 MR 31.23（+23.06）、mAP50 57.8（−21.4）；T+T 时 MR 37.42（+29.79）、mAP50 66.0（−13.2）。基线 YOLOv5 + NIN 在复制输入下同样崩塌（MR 43.79，+35.46）。

## 消融说明了什么

迭代次数（表 5）：n=1 最优（KAIST MR 7.63 降至 7.17，FLIR mAP50 77.5 升至 79.2）；n=2、3 反而变差（FLIR 76.9 / 77.5）。作者对图 6 的解释是：迭代增多后跨模态交互产生负效应，背景信息被逐渐增强——背景噪声干扰增强导致性能退化。即迭代卖点的实际增益只来自多过一遍，且再多就被噪声放大反噬。堆叠与迭代对比（表 4）：不共享参数地堆叠 1 至 10 个 CFE 块，mAP50 仅 77.5 升至 78.2，参数量却由 120.2M 涨到 517.1M、FPS 由 40.5 降到 17.3——堆叠路线被自家消融否定，这是迭代（参数共享）设计的正当性来源。双 CFE 必须不共享参数（表 3）：共享版反而伤害性能（KAIST MR 10.78，比基线差 +2.45；FLIR 76.0，−0.5），不共享版才有 +1.0 增益。残差可学习系数（表 2）：两支路都加可学习系数，MR 7.86 降至 7.63、mAP50 77.1 升至 77.5，小幅有效。SFS 方式（表 6）：mixed pooling 最佳（7.17 / 79.2），优于平均池化（7.58 / 77.0）、最大池化（7.94 / 78.4）与卷积式（7.42 / 78.6）。骨干与检测头（表 8）：DMFF 在三种骨干、YOLOv5 与 FCOS 上均有一致增益（如 FCOS：MR 14.03 降至 12.96，mAP50 69.8 升至 71.7），模块可移植性成立。

## 局限

损坏模态评测为零（已逐项核查全文）：没有任何噪声注入、模糊、曝光、条纹、坏点等退化实验，图像质量差只是贡献条目与方法一节中的一句断言，无对应实验支撑。所谓缺失模态实验名不副实：复制输入实验用的是复制存活模态图像（R+R / T+T），不是传感器失效（置零、无信号），更不是损坏；且该实验恰恰显示其默认的融合输出模式在单模态输入下崩塌（MR +23 至 +30），只有绕开融合、改用单路增强输出时才退化温和——论文正文对此只强调后者，属于选择性叙述。交叉注意力的引导信号只有特征相关性本身：query 来自辅助模态，若辅助模态被污染，其 query 会主动去检索并放大错误对应；全文没有任何质量估计、置信度或门控，一路不可靠时无任何抑制通路。与 CFT 一样，注意力机制对两模态的信任不受任务或质量约束。作者自设的局限一节只谈失败案例（交通标志与树木误检为人、遮挡漏检、屋顶设备误检为车），不涉及鲁棒性。KAIST 夜间子集并非最佳（见关键数字），其全天候叙事下优势主要在白天；VEDAI 严格 mAP 不敌更简单的输入级与中级融合基线。引用口径需注意两处：其对比表转引 CFT 的 FLIR mAP50 为 78.3（CFT 原文为 78.7）；正文 VEDAI 的 mAP +1.96 实为 mAP50 增益。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
