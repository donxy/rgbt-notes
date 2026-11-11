---
title: "Distribution-Aligned Multimodal Fusion for Robust Object Detection"
paper_id: "hao2026distributionaligned"
authors: "Hao, Pu, Wang, She"
year: "2026"
venue: "CVPR"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer; DETR"
mechanisms: "Quality-Aware"
tags: ["degraded-modality", "quality-aware"]
paper_link: "https://openaccess.thecvf.com/content/CVPR2026/papers/Hao_Distribution-Aligned_Multimodal_Fusion_for_Robust_Object_Detection_CVPR_2026_paper.pdf"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Freezes a pretrained detector and trains only a lightweight fusion module that aligns fused features to the pretrained (clean) feature distribution, generalizing to unseen degradation types.

## 点评

Cross-degradation generalization studied explicitly, with alignment-target ablations on three benchmarks.

## 框架图

![Distribution-Aligned 方法主框图（原文 Figure 2）：上 Stage 1 离线拟合 GMM 得到对齐目标 P_normal，下 Stage 2 冻结共享 ViT 编码器与 DETR 解码器、只训练融合模块（跨模态注意力 + 自适应 token 门控）](figs/distribution-aligned-multimodal-fusion-for-robust-object-detection.webp)

*原文 Figure 2：方法总体架构。上 Stage 1（离线）：冻结的共享 ViT 编码器在正常图像上提取 [CLS] 特征、拟合 GMM，得到对齐目标 P_normal（右上红框）。下 Stage 2（在线）：RGB/IR 经同一冻结编码器得到双路特征，只训练中间的融合模块（跨模态注意力 + 自适应 token 门控），校正特征送入冻结的 DETR 解码器；训练损失为对齐损失（[CLS] 在 GMM 下的负对数似然）与检测损失之和。雪花标记为冻结、火焰为可训练。图源：Hao et al., CVPR 2026 正式 PDF，Figure 2。*

## 问题定义

RGB 在过曝、欠曝、夜间等条件下，特征会偏离预训练分布，而检测器的决策边界是按正常特征校准的——偏离即掉点；IR 对光照不敏感，可提供互补。现有融合方法多为端到端训练，本质上在隐式拟合训练数据分布：训练只覆盖有限退化类型时，学到的是退化特异的模式，换一种退化就垮。作者把问题重构为一个选择题：融合后的特征应该对齐到谁——训练退化的分布，还是正常的分布？核心问题不是融合模块怎么设计，而是对齐目标选哪个分布，才能只见过一种退化却泛化到其他退化。

## 方法细节

两阶段、冻结检测器。阶段 1（离线）：用冻结编码器在目标域正常样本的 [CLS] 特征上拟合 K=8、对角协方差的 GMM，得到参考分布 P_normal——注意它不是 COCO 预训练分布，而是目标数据集 5k 张正常验证样本（经亮度/对比度筛选）的特征分布，标题里的 “pretrained distribution” 是简写。阶段 2：冻结整个检测器（ViT-Base + DETR 头，86M），只训一个轻量融合模块（13M）：RGB/IR 的 patch token 先过 8 头双向交叉注意力互相挑选互补信息，再经自适应门控（拼接特征取均值过 MLP+sigmoid 得通道维门控向量调制）与融合 MLP 输出校正特征、送回冻结检测头。总损失 = 融合特征 [CLS] 在 GMM 下的负对数似然 + 0.5 × 检测损失；对齐只直接作用于全局 [CLS]，不用 KL/MMD（Wasserstein 距离只作事后分析指标）。

## 实验设置

LLVIP（行人）、FLIR（车辆）、DroneVehicle（航拍车辆）三个 RGB-IR 配对集；统一 ViT-Base + DETR 口径、所有基线由作者同实现重跑，指标 mAP@IoU=0.5、3 次运行 mean±std；融合模块 AdamW、lr 1e-4、30 epoch、单张 RTX 4090。退化协议两层：主实验分 normal 与过曝/欠曝/夜间评测；核心是跨退化协议——全部模型只在过曝样本上训练，在已见的过曝与未见的欠曝、夜间、模糊上评测。

## 关键数字

主表三集均为最高：LLVIP 98.1、FLIR 79.5、DroneVehicle 57.8；总参 99M、训练 3.5 小时（端到端对照 14–17 小时）。LLVIP 场景拆分：正常 97.8，过曝 47.3、欠曝 51.8、夜间 83.5——增益集中在挑战场景；但换算保持率，过曝只剩正常水平的 48.4%，即最强方法在过曝下也丢掉一半性能。跨退化（只训过曝）：对齐到 P_normal 的未见退化成绩为欠曝 48.5 / 夜间 76.8 / 模糊 40.6；对齐到训练退化分布 P_degraded 已见项反略高（48.2 vs 47.3），未见项全面落后（夜间 −9.3、模糊 −12.1）——这是“对齐目标决定泛化”的直接证据。对齐验证：其融合特征到 P_normal 的 W₂ 距离 0.87，远低于退化 RGB 原始特征的 2.34，且与 mAP 高低顺序一致。

## 消融说明了什么

冻结检测器下从 Concat 基线逐步加组件：总体 mAP 75.3 → +交叉注意力 78.6 → +自适应门控 80.9 → +对齐损失 82.5（过曝 31.5 → 47.3）——对齐损失是单步增益最大的一环；冻结本身与对齐损失各有独立贡献（端到端对照 96.5 / 41.2 / 44.5，本文 97.8 / 47.3 / 51.8）。训练曲线上，对齐到退化分布的损失约 15 epoch 即平台化（过拟合有限模式），对齐到正常分布则持续下降至训练结束。

## 局限

作者自承：依赖预训练检测器质量与 GMM 对特征分布的近似；所有模态同时严重退化时互补信息耗尽、方法无能为力；约 10% 特征仍属难以对齐的困难样本。复现缺口更实在：过曝/欠曝/模糊如何生成、强度参数、各退化子集样本量，正文均未报告，主实验训练集的退化构成也未交代——跨退化结论无法按原文精确复现。评测面：没有模态缺失实验，IR 被默认始终可用且完好，IR 自身退化/缺失时如何未涉及；退化全是光度类（雾只出现在动机文字、未进实验）；对齐只压在一个全局 [CLS] token 上，patch 级空间分布是否真对齐只有 t-SNE 等间接证据。两处小错位：模块名叫 token gating、给出的门控实际是通道维向量、对所有 token 共享；可训练参数分项相加 14.2M 与文中总述 13M 对不上，原文未解释。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
