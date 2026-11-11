---
title: "Learning a Robust RGB-Thermal Detector for Extreme Modality Imbalance"
nickname: "Tian 2025"
paper_id: "tian2025learning"
authors: "Tian, Yang, Zhu, Wang, He"
year: "2025"
venue: "Pattern Recognition Letters"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN; YOLO"
mechanisms: "Quality-Aware"
tags: ["degraded-modality", "quality-aware", "modality-imbalance"]
paper_link: "https://arxiv.org/abs/2505.22154"
code_link: ""
doi: "10.1016/j.patrec.2025.05.005"
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Quality-mask interaction + pseudo-degradation + EMA base/auxiliary consistency for imbalanced RGB-T.

## 点评

逐位置质量掩码调制模态特征，训练期用伪退化 + EMA 基/辅检测器一致性；在 KAIST（LAMR）与 FLIR 上评测，含高斯噪声与对比度退化实验。

## 框架图

![Tian et al. 2025 方法主框图（原文 Figure 2）：绿色 base 检测器与红色 auxiliary 检测器的 base–auxiliary 总体架构](figs/learning-a-robust-rgb-thermal-detector-for-extreme-modality-imbalance.webp)

*原文 Figure 2：base–auxiliary 总体架构。绿色为 base 检测器（含双流骨干与质量感知交互模块细节），红色为 auxiliary 检测器；退化样本喂入 auxiliary 并受检测损失与 logits 一致性约束，base 由 EMA 更新，推理仅用 base。*

## 问题定义

将模态退化统一建模为 extreme modality imbalance：退化同时扰动训练收敛并在测试时造成 OOD。退化在文中以整图仿射形式出现，c→0 时退化为模态缺失，文中未将 corrupted 与 missing 分开处理。

## 方法细节

(1) 质量感知交互模块：双流 CSPDarknet 第 3/4/5 阶段，每模态以 conv+sigmoid 从自身特征预测单通道空间质量掩码，交叉相加融合（对方特征按其自身掩码门控后注入），concat+conv 后进 YOLOX neck/head。(2) 伪退化：训练时以概率 0.3 对单个模态施加全局仿射 x̂=b+c·x，c~U(0,0.7)，b~N(127.45, 2440)。(3) Base–Auxiliary：辅助检测器在退化样本上以检测损失 + 与 base（干净样本）logits 的 L2 一致性训练；base 为辅助检测器的 EMA（α=0.001），推理仅用 base。骨干深度/宽度缩放 0.67/0.75，参数 72.18M，MMDetection 实现。

## 实验设置

KAIST（Liu 重标注版，LAMR，FPPI [1e-2, 1]）与 FLIR 对齐三类子集（AP50）。SGD，学习率 0.01/0.02，KAIST 20 epoch、FLIR 47 epoch，2×RTX 3090 Ti。

## 关键数字

KAIST 干净 LAMR(All) 8.63（CPFM 6.62 更优）；RGB-only 31.35（CPFM 46.7、复现 YOLOX-RGBT 64.55）；TIR-only 16.63。FLIR AP50 干净 78.8（IGT 85），TIR-only 75.2（YOLOX 43.3）。测试时 σ=20 高斯噪声：8.86 / 9.56（YOLOX 16.77 / 25.15）。摘要“MR 降低 55%”为迁移实验（原文表 6）最佳单格而非平均。

## 消融说明了什么

交互模块单独使用反而恶化失衡条件（掩码放大 OOD）；伪退化单独作增广损害干净样本收敛；EMA base–auxiliary 框架将两者调和。Base 优于 Auxiliary（8.63 vs 12.68），最终模型取 EMA 一侧。框架可迁移：VFNet、SSD 在对比度退化下均获显著改善。

## 局限

退化族单一（全局仿射，无模糊/压缩/局部退化）；其自身实验显示针对高斯噪声的专门训练在部分设置下优于通用退化族，说明退化形式需被预先知道；质量掩码由退化特征本身估计（自指），未验证掩码与真实退化程度的相关性；鲁棒性仅测单点强度，无严重程度曲线；72.18M 参数，作者自承不利于部署。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
