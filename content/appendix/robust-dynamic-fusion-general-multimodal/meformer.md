---
title: "Robust Multimodal 3D Object Detection via Modality-Agnostic Decoding and Proximity-based Modality Ensemble"
paper_id: "cha2024robust"
authors: "Cha, Joo, Park, Lee, Kim, Kim"
year: "2024"
venue: "arXiv"
list: "appendix"
scope: "Reference"
section: "Robust & Dynamic Fusion (General Multimodal)"
subsection: ""
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Negative Fusion"
tags: ["negative-fusion", "degraded-modality"]
paper_link: "https://arxiv.org/abs/2407.19156"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Defines and mitigates “negative fusion” from defective modalities.

## 点评

提出并命名“负融合（negative fusion）”：有缺陷模态的信息反噬另一模态的正确信息；以模态无关解码与近邻集成缓解。

## 框架图

![MEFormer 方法主框图（原文 Figure 2）：相机与 LiDAR 双骨干、MOAD 共享参数 Transformer 解码器三分支（输出 Z_LC/Z_L/Z_C）与右侧 PME 集成模块（输出 Z_e）](figs/meformer.webp)

*原文 Figure 2：MEFormer 总体架构。相机与 LiDAR 双骨干之上是共享参数的 Transformer 解码器三分支（双模态 LC、仅 LiDAR、仅相机，输出 Z_LC/Z_L/Z_C），右侧 PME 模块以 Z_LC 为 query 对三分支框特征做带邻近度偏置的 cross-attention，输出最终集成特征 Z_e。图源：Cha et al. 2024, arXiv:2407.19156。*

## 问题定义

融合 3D 检测的两个结构性毛病：(1) LiDAR 过度依赖——相机只作语义补充，LiDAR 一旦缺失，融合模型甚至不如纯相机模型（BEVFusion 仅相机时 mAP 仅 0.2，近乎失效）；(2) 负融合——某模态信号弱/带噪时（夜间相机、雨天 LiDAR），其错误信息污染另一模态的正确信息，使融合预测反被拖坏。目标是完整输入保持 SOTA、同时对传感器缺失与损坏鲁棒。模态为相机 + LiDAR、任务为 3D 检测。

## 方法细节

以 CMT 跨模态 Transformer 解码器为基座，两个部件：(1) MOAD（训练策略）：同一共享参数的解码器并行跑三条分支——双模态 LC、仅 LiDAR、仅相机——共用 object queries、仅模态位置编码不同；每分支独立 Hungarian 匹配与损失、等权监督，迫使解码器学会从任一单模态独立提取几何 + 语义，治 LiDAR 依赖。(2) PME（推理模块）：以 LC 分支的框特征为 query，对三分支特征做一层 cross-attention；关键是邻近度注意力偏置——按预测框中心在 BEV 空间的距离经可学习标量变换成偏置、加到 attention logit 上，压制空间不相关框之间的噪声传递。抗噪依据是几何邻近度，不估计任何模态质量。训练分两阶段：MOAD 20 epoch，再冻结骨干与 Transformer 单独训 PME 6 epoch。

## 实验设置

仅 nuScenes（32 线 LiDAR + 6 路相机，700/150/150 划分），指标 mAP / NDS。退化评测全部在测试时施加、训练不做对应增强：整模态缺失（此设置禁用 PME）、LiDAR 降至 4 波束、相机污渍遮挡、夜间/雨天自然子集。

## 关键数字

完整输入验证集 73.9 NDS / 71.5 mAP、测试集 74.3 / 72.2。缺失时：仅 LiDAR 69.5 / 63.6、仅相机 48.0 / 42.5，均优于 CMT（68.1/61.7 与 44.7/38.3）。退化场景（MOAD+PME）四项均为最优：4 波束 63.4 / 55.9、相机污渍 69.9 / 64.6、夜间 46.8 / 43.7、雨天 74.9 / 72.2。但夜间 mAP 43.7 离干净的 71.5 仍很远——是跌得少，不是不跌。速度 3.1 FPS（比 CMT 慢 0.3）。

## 消融说明了什么

CMT 基线 72.9 / 70.3；+PME 73.1 / 70.5；+MOAD 73.7 / 71.3；全用 73.9 / 71.5——主力是 MOAD（约 +0.8 NDS / +1.0 mAP），PME 在干净集只贡献 +0.2，但其增益随场景变难而变大（波束减少 +0.9、相机污渍 +0.3、夜间 +0.6 mAP）；远距离（>30 m）MOAD 带来 +1.1 mAP。而缺失鲁棒性完全来自 MOAD——PME 在缺失设置下根本不启用。

## 局限

全文没有形式化保证——“prevent negative fusion”只是目标宣称加实验佐证，没有 Perf_融合 ≥ 最优单模态 形式的约束或证明；负融合本身也没有可计算的度量（无负融合率之类统计），只靠退化场景的性能对比事后指认。PME 以双模态分支特征为 query 锚点，该分支若已被噪声主导、集成能否纠正未做失败分析。仅 nuScenes 单数据集、单一基座验证；退化类型有限（无标定误差、时序错位、点云密度渐变等）；两阶段训练与 PME 带来额外成本；原文未设局限章节。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
