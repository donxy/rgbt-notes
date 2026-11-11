---
title: "Multiscale Cross-modal Homogeneity Enhancement and Confidence-aware Fusion for Multispectral Pedestrian Detection"
paper_id: "li2024multiscale"
authors: "Li et al."
year: "2024"
venue: "IEEE TMM"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["pedestrian", "quality-aware"]
paper_link: "https://doi.org/10.1109/TMM.2023.3272471"
code_link: "https://github.com/RimXidian/MCHE-CF-for-Multispectral-Pedestrian-Detection"
doi: "10.1109/TMM.2023.3272471"
notes_basis: "abstract"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Enhances cross-modal feature homogeneity at multiple scales, then fuses with per-modality confidence estimates.

## 点评

正文不可得（IEEE 付费墙、无预印本），机制层据官方代码逐行核读。标题中的「confidence」是自指的特征空间门控，不是模态健康或证据置信：内部置信 = 每路用自身池化框特征经卷积栈 + Sigmoid 生成的空间权重图，交互置信 = 两路特征通道均值导出的联合图，无任何显式监督或校准、只靠检测损失端到端学习，与 CMPD/EHF 的证据路线不同科。所有权重为 Sigmoid 及其乘积/平均 ∈(0,1) 开区间、非凸组合，数学上不能把一路压到零；且骨干 5 处 Mutual_Related 残差互注已在融合前把两路写进彼此——「丢弃一路」在此架构中不可表示，注入本身就是损坏传播通道。同质增强被操作化为参数共享的 SE 式通道注意力变换下两路的可通约成分。转引数字（TFDet 表 III）：KAIST reasonable MR⁻² All 6.71 / Day 7.58 / Night 5.52，其中 Far 36.75 为该表 17 个方法最佳——优势集中于远距离小行人，是干净数据上的尺度优势、非鲁棒性证据。代码里另有摘要未提的训练期噪声增广（每批以 10%/10% 概率把整批一路换成高斯噪声图），测试路径无对应评测、且无法确认是否用于论文实验。原文自报表格与消融未读到，第二个数据集身份未能核实。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 对比表：[[compare|REQ-04 四维对比表]]
