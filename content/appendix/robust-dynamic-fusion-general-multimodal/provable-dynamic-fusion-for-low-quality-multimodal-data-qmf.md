---
title: "Provable Dynamic Fusion for Low-Quality Multimodal Data (QMF)"
nickname: "QMF"
paper_id: "zhang2023provable"
authors: "Zhang, Wu, Zhang, Hu, Fu, Zhou, Peng"
year: "2023"
venue: "ICML"
list: "appendix"
scope: "Reference"
section: "Robust & Dynamic Fusion (General Multimodal)"
subsection: ""
fusion_level: "decision"
architecture: "Other"
mechanisms: "Quality-Aware"
tags: ["quality-aware", "degraded-modality"]
paper_link: "https://arxiv.org/abs/2306.02050"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Energy-based uncertainty drives dynamic decision-level fusion weights, with guarantees.

## 点评

质量感知融合的代表方法：以能量不确定性驱动决策级动态权重，并给出理论保证；任务为分类。

## 框架图

![QMF 方法主框图（原文 Figure 2）：左侧泛化误差上界的三项分解（各模态经验损失、模型复杂度与不确定性感知协方差项），右侧动态与静态融合的假设空间对比](figs/provable-dynamic-fusion-for-low-quality-multimodal-data-qmf.webp)

*原文 Figure 2：QMF 的理论总览图。左：融合方法的泛化误差上界被分解为各模态的经验损失、模型复杂度与"不确定性感知"（uncertainty awareness，即权重与损失的协方差项）三部分——动态融合优于静态融合的全部理论余地都来自第三项；右：动态与静态融合的假设空间对比。图源：Zhang et al. 2023, arXiv:2306.02050。*

## 问题定义

动态融合在低质量多模态数据上用得很广，却没有理论依据：高噪声或模态质量失衡时，多模态并不总能胜过单模态。本文的问题是——能否设计一个可证明鲁棒的融合方法？分析对象限定在最常见的决策级（late）融合：各模态先独立预测、再加权求和。目标是从泛化误差角度说清动态融合何时、为何优于静态融合，并据此构造算法。注意全文是多模态分类，没有检测实验。

## 方法细节

理论与算法两层。理论层：在二分类、logistic 损失、决策级加权融合下，用 Rademacher 复杂度给出泛化误差界（定理 1）；定理 2 给出动态融合的界优于静态融合的充分条件——(i) 动态权重的期望等于静态权重；(ii) 动态权重与单模态损失的 Pearson 相关非正（权重越大处损失越小）。静态融合的协方差项恒为 0，条件 (ii) 让动态融合凭这一项把界压得更紧。算法层 QMF：权重取模态不确定性的负线性函数；不确定性用能量分数（由单模态 logits 计算，预测越均匀能量越高，动机是 −Energy 与数据密度 log p(x) 线性对齐，偏离训练分布的低质量样本应得高分）；原始能量分数的相关性不够，作者再加历史损失正则——用训练轨迹多次采样的平均单模态损失作监督，强制"历史损失大的样本、融合权重小"的排序关系。

## 实验设置

四个多模态分类数据集：场景识别 NYU Depth V2（RGB+深度，10 类）与 SUN RGB-D（19 类）、图文分类 UPMC FOOD-101、情感分析 MVSA。退化协议：测试时对 50% 的模态施加损坏——图像加零均值高斯噪声（方差 ε∈{0,5,10}、消融到 20），文本用 blank noise；报告平均与最差精度（NYU/SUN 为 10 个随机种子）。

## 关键数字

干净条件（ε=0）QMF 并非最优：NYU 平均精度 70.09%，低于 TMC 的 71.06% 与 MMTM 的 71.04%；SUN 上 62.09% 与 Late fusion 并列最好。噪声加大后优势出现，ε=10 时四个数据集均为全表最好：NYU 55.60%（最差 51.07%）、SUN 48.58%、FOOD-101 62.21%、MVSA 61.28%。与理论的对应验证：权重–损失相关的 |r| 在 FOOD-101 上为 0.498 / 0.652 / 0.735（ε=0/5/10），高于 MSP、Entropy、Evidence 等替代不确定性度量。

## 消融说明了什么

NYU、ε=20 时仅 late fusion 为 43.76%（最差 36.85%）；单加历史损失正则或单加不确定性加权都有提升，两者全用最好（48.26% / 43.73%）——说明能量分数本身满足不了理论所需的"不确定性–损失正相关"（假设 1），是靠正则把它训出来的。干净数据上动态加权没有优势，增益只在模态质量失衡时出现。

## 局限

作者自承：权重完全依赖不确定性估计的质量，而其与损失的相关性在 NYU/SUN 上只能达到"温和"水平；全部理论建立在假设 1 之上，而某些场景下 OOD 检测本身不可学习，完整刻画仍是开放问题。结构性局限：定理只覆盖二分类 + logistic 损失 + 决策级加权求和，多分类只是直接套用、没有多分类定理；比较的是泛化误差上界而非实际误差，且要求动/静态两种融合的单模态分类器同架构；实验只有 2 个模态，向 ≥3 模态的推广未验证、未证明；保证的关键一步（用 logistic 损失凸性把融合损失放缩为单模态损失加权和）在检测的复合损失上不成立。原文未报告附录中其他噪声类型（盐椒噪声等）的正文数值。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
