---
title: "M-SpecGene: Generalized Foundation Model for RGBT Multispectral Vision"
paper_id: "zhou2025mspecgene"
authors: "Zhou et al."
year: "2025"
venue: "ICCV"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
tags: ["foundation-model"]
paper_link: "https://openaccess.thecvf.com/content/ICCV2025/html/Zhou_M-SpecGene_Generalized_Foundation_Model_for_RGBT_Multispectral_Vision_ICCV_2025_paper.html"
code_link: "https://github.com/CalayZhou/M-SpecGene"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Self-supervised RGBT foundation model using a Cross-Modality Structural Sparsity metric and GMM-based progressive masking to pretrain modality-invariant representations.

## 点评

Validated across eleven datasets and four RGBT downstream tasks including detection.

## 框架图

![M-SpecGene 方法主框图（原文 Figure 3）：上半为共享权重编码器的跨模态自监督预训练，下半为下游任务微调](figs/m-specgene-generalized-foundation-model-for-rgbt-multispectral-vision.webp)

*原文 Figure 3：上半 (a) 预训练——RGB 与热像图块被 GMM-CMSS 采样函数互补掩码后，分别进入一对共享权重编码器；两路特征经交叉注意力（Q 与 K/V 交叉）交换互补信息，再由 RGB 解码器与 Thermal 解码器各自重构本模态目标图——一个编码器吃两模态、两套解码器各管一路，是全图核心。下半 (b) 微调——RGB 与热像 patchify 后沿 batch 维拼成联合输入喂入预训练编码器（两模态并行独立编码、图中无任何跨模态连线），输出 reshape 为 B×2C×H×W 后分接 ViTDet、UperNet、LoFTR 等任务头——下游融合只剩通道拼接，一眼可见。图源：Zhou et al., ICCV 2025，Figure 3。*

## 问题定义

作者把既有 RGBT 研究定性为逐案定制范式：每个任务手工定制双流模型、在小规模任务数据上全监督训练，并归纳其三重局限——(1) 人工归纳偏置（任务导向表示不可扩展）；(2) 模态偏置（热红外分支不得不用 ImageNet 预训练权重初始化，污染其先验）；(3) 数据瓶颈（RGBT 数据稀缺、标注昂贵）。本文的回应是做 RGBT 领域的通用基础模型：用大规模无标注 RGBT 数据自监督预训练一个共享编码器，学模态不变表示，下游四类任务（检测、分割、跨模态特征匹配、显著性检测）共用同一预训练权重再各自全量微调。其针对性难点是 RGBT 数据固有的信息不平衡：热像缺纹理细节、两模态信息密度不对称、且数据非目标中心（目标小而散），MAE 式随机掩码会不成比例地落在信息稀疏区。为此提出以信息密度引导的渐进掩码。问题设定始终是干净、对齐的双模态配对输入——预训练数据清洗甚至主动剔除低质量样本（见方法细节），全文没有任何模态损坏、缺失或测试时退化的设定。阅读依据：CVF 开放获取 PDF 正文全文通读（正文、表 1–表 7、图 1–图 5 图注）；补充材料未读，全部结论以正文为准。

## 方法细节

预训练数据 RGBT550K：先汇集 41 个公开数据集、10 类 RGBT 任务的约 300 万对样本（RGBT3M），再经三步清洗——数据集配额平衡（防止跟踪类大数据集主导）、视频时序采样去冗余、用 SSIM 作质量指标剔除 SSIM 小于 0.80 的低质量对——得到 548,238 对高质量样本（RGBT550K）。注意这一步的方向：低质量数据是被当作噪声过滤掉的，不是被当作鲁棒性训练信号利用的。架构（图 3a）为 Siamese MAE：RGB 与热像经互补掩码（一侧被掩的 patch 尽量在另一侧可见）后，送入共享权重 ViT 编码器——同一个编码器处理两个模态，这是其模态不变主张的结构载体；随后一层交叉注意力在潜空间交换两模态的互补信息；最后两个模态专属解码器（带自注意力）分别重构各自被掩的像素。重构目标即 MAE 式像素重建，无对比或对齐损失，对齐靠共享编码器与交叉注意力隐式达成。CMSS（跨模态结构稀疏度）：对每个同位置 patch 对定义一个由余弦相似度与两模态结构方差构成的量并归一化到 0 至 1。直觉是：低信息密度区（如天空）两模态 embedding 相似且结构方差小，CMSS 高；语义丰富区（如行人）两模态差异大、方差大，CMSS 低。故 CMSS 是 patch 级信息密度的代理量，且只用两模态自身的关联算出，不需要外部教师或分割模型。GMM-CMSS 渐进掩码：对全数据集 CMSS 分布用 3 分量高斯混合模型拟合（EM 在预训练迭代中逐批在线更新）；采样函数决定保留（未掩码）patch 的 CMSS 取向，并随训练进程平移：初期未掩码 patch 集中于低 CMSS 的高信息密度（目标）区，重构任务易；中段近似整体分布，退化为近随机掩码；末期未掩码 patch 转向低信息密度区、目标区被掩码，重构变难。另外，实际掩码数带一个偏置项，按两模态重构损失之差自适应调整，使两模态的掩码量保持平衡。预训练协议：两阶段——先在 ImageNet 与单模态热像数据集上初始化编码器与两解码器，再在 RGBT550K 上做跨模态自监督预训练；默认掩码率 90%（两模态相同）；AdamW，学习率 1.5e-4，半周期余弦衰减，8 张 GTX 4090；增广为 0.2 至 1.0 随机裁剪加 50% 翻转；有 ViT-S 与 ViT-B 两个规模。下游迁移（图 3b）为全参数微调：RGB 与热像分别 patchify 后沿 batch 维拼接，由同一个预训练编码器并行独立编码——微调与推理阶段两模态之间没有任何交叉注意力或交互；输出 reshape 回通道拼接后喂任务头（检测 ViTDet、分割 UperNet、匹配 LoFTR）。也就是说，下游的融合退化为最末端的特征通道拼接，全部跨模态交互都发生在预训练期。

## 实验设置

四个任务、十一个数据集，均为同数据集内训练与测试，无跨数据集迁移实验。检测：KAIST（指标为 log-average MR，九个子集）、FLIR、LLVIP（mAP / mAP50 / mAP75）；检测器 ViTDet，RGBT 特征以编码器输出拼接融合；报告 ViT-S 与 ViT-B 两档；对比较多，包括 Halfway Fusion、GAFF、ProbEn、CSAA、CALNet、TIRDet、MMI-Det、ICAFusion、CrossFormer、C2Former、UniRGB-IR 等。分割：SemanticRT、MVSeg、FMB（UperNet，mIoU）。跨模态特征匹配：LLVIP（对齐质量高），LoFTR 框架、骨干换 ViT-S 并加卷积 stem，指标为 AUC（3、5、10 度阈值）。显著性检测：VT821、VT1000、VT5000、VI-RGBT1500（UperNet；多项显著性指标），按惯例以 VT5000 的 2,500 对训练、其余作测试。鲁棒性协议：无。全文经定向核查，没有模态损坏、退化、缺失或噪声注入的任何实验。

## 关键数字

KAIST（表 1a，MR All）：M-SpecGene（ViT-B）23.74，优于 UniRGB-IR 的 25.21（作者称 All 上领先 1.47）；增益主要在 Night 19.42（UniRGB-IR 23.95），Day 25.66 与 25.93 基本持平；九项指标中七项最佳。ViT-S 版 All 27.28，反而弱于 UniRGB-IR（ViT-B）。FLIR（表 1b，mAP / mAP50 / mAP75）：ViT-B 为 44.7 / 84.8 / 40.1，对 UniRGB-IR 的 44.1 / 81.4 / 40.2——mAP 只 +0.6、mAP50 +3.4、mAP75 还低 0.1；TIRDet 的 mAP75 41.1 也高于它。ViT-S 版 43.7 / 82.4 / 39.4（mAP 低于 UniRGB-IR）。另注意作者特意点明：UniRGB-IR 的 ViT-B 先在 COCO 上预训练，M-SpecGene 不依赖高质量 RGB 检测数据——这是其口径优势，但也说明两边数字不是纯架构对比。LLVIP（表 1b）：ViT-B 为 65.3 / 97.4 / 75.4，对 UniRGB-IR 的 63.2 / 96.1 / 72.2（+2.1 mAP）；但 MMI-Det 的 mAP50 98.9 高于其 97.4（mAP 64.4 低于它）。分割：SemanticRT mIoU 79.84（ViT-B），胜 ECM 79.26 与 UniRGB-IR 75.21；MVSeg 63.02，大胜次名 DPLNet 57.90；FMB 60.1 低于 MRFS 61.2——作者承认在小规模 FMB（仅 280 验证样本）上不及带复杂融合模块的方法。匹配（表 4，LLVIP AUC，3、5、10 度）：本文（ViT-S）20.5 / 31.7 / 48.2，胜原版 LoFTR 的 18.8 / 29.7 / 46.2；传统与检测式方法近乎全零——这是模态不变表示卖点最有说服力的一项结果。显著性（表 5、6）：ViT-B 在 VT821、VI-RGBT1500 等多数指标最佳；但 VT5000 的 S 值 0.892 低于 UniRGB-IR 的 0.906，并非全胜。检测评了 FLIR 与 LLVIP（无 M3FD），且是 ViTDet 加全量微调的重型协议，数字与 YOLO 系中期融合表格不同构，只能作引用级对照。

## 消融说明了什么

预训练模型对比（表 7a，FLIR mAP50 / 匹配 AUC@10 度）：从头训练 70.6 / 41.2；监督 ImageNet 预训练 ViT 79.3 / 40.3；原味 MAE（ImageNet）82.8 / 37.0（对匹配反而有害）；M-SpecGene 84.8 / 48.2。作者据此论证：单模态预训练对找两模态共性的匹配任务有破坏性，而原生 RGBT 自监督对两类任务都正向——这是其预训练范式最核心的证据。表示架构（表 7b，FLIR mAP50）：Vanilla MAE（输入层混合）83.1；通道拼接 80.1；辅助分支（热像经交叉注意力辅助 RGB 解码）83.5；Siamese 83.8 最佳——共享编码器的对称结构胜出（注：此组数值为消融配置口径，与表 7a 的最终 84.8 不在同一配置下，不可混读）。掩码策略（表 7c）：随机掩码 83.8；只掩低 CMSS 区 83.6；只掩高 CMSS 区 83.4；GMM-CMSS 渐进掩码 84.8——只盯单一信息密度区都不如随机，渐进进程带来 +1.0，是 CMSS 机制的净贡献。解码器深度（表 7d）：2、4、8 层对应 84.1、84.8、84.5，4 层最佳。掩码率（表 7e）：85%、90%、95% 对应 84.4、84.8、84.1，90% 为甜点；过高掩码率会削弱 GMM-CMSS 策略本身的有效性。定性与统计分析（图 5）：t-SNE 显示其目标区特征可分性优于监督预训练；三检测数据集上目标与背景特征的 Wasserstein 距离分布以 M-SpecGene 最大，作者据此称其表示更以目标为中心——属可视化级证据，无受控实验。

## 局限

零鲁棒性设定（定向核查）：无模态损坏、退化、缺失评测，无噪声注入，无一路失效实验，无测试时适应。不仅如此，其预训练数据管线用 SSIM 小于 0.80 主动剔除低质量配对——基础模型路线在数据层就把低质量输入排除在外，与测试时损坏模态的问题设定正交。下游无跨模态交互：微调与推理时两模态被同一个编码器并行独立编码、最后只做通道拼接；预训练期的交叉注意力并不带到下游。一路模态损坏时，其特征未经任何质量折扣直接进入拼接特征——结构上不存在抑制坏模态的通路，下游跨模态交互只剩末端拼接。通用的含金量：通用在表示层——每个下游任务与数据集仍是全参数微调出一份独立权重（不同于 UniRGB-IR 约 10% 参数的适配器微调）；十一个数据集全部是同集内微调评测，没有任何跨数据集零样本或少样本迁移实验，其泛化能力未被跨分布检验。预训练并非纯 RGBT 自监督：编码器与解码器先经 ImageNet 与单模态热像数据初始化，再在 RGBT550K 上预训练；且其效果依赖作者自建的 RGBT550K 清洗管线（配额、去冗、SSIM 过滤的细节在附录），复现成本与数据可得性是隐含前提。检测增益幅度有限且口径重：对 UniRGB-IR 的检测优势集中在 KAIST 夜间与 LLVIP，FLIR 上 mAP 仅 +0.6 且 mAP75 略低；全部数字建立在 ViTDet 加 ViT-B 全量微调协议上，与单阶段检测器不可同表。模态不变只有可视化与下游涨点两类间接证据（t-SNE、Wasserstein 距离），没有受控的不变性测度（如同目标跨模态检索精度随条件变化的曲线）；CMSS 本身只是 patch 级统计代理，其与真实语义信息密度的对应关系未被验证。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
