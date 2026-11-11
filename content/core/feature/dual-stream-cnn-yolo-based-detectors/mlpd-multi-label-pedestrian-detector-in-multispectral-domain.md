---
title: "MLPD: Multi-Label Pedestrian Detector in Multispectral Domain"
paper_id: "kim2021mlpd"
authors: "Kim et al."
year: "2021"
venue: "IEEE RA-L"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Alignment"
tags: ["pedestrian", "alignment"]
paper_link: "https://doi.org/10.1109/LRA.2021.3099870"
code_link: ""
doi: "10.1109/LRA.2021.3099870"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Multi-label learning with modality-specific (non-paired) box annotations, so RGB and thermal labels need not coincide — enables training on unpaired multispectral data.

## 点评

全文不可得（IEEE 闭源、无预印本），本注记据直接后继 HA-MLPD 的全文转述与四篇引用论文的结果表。「多标签」指逐实例的模态可见性状态（[1,0]/[0,1]/[1,1]），检测头在 SSD 定位之外并行预测该状态；双 VGG-16(BN) 支路多层拼接中间融合，无门控/注意力/质量估计，鲁棒性全押训练期（多标签监督 + 半配对增广）。KAIST MR⁻² All 7.58 / Day 7.95 / Night 6.95（四源一致；注意 SAMPD 的表把 Day/Night 互换）。原文设有整模态置零（blackout）评测：RGB 置零 All 16.34、热置零 23.95，属缺失端点；腐化（在场但被污染）评测为零，三态标签中也没有「在场但不可信」一态。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 主题综述：[[themes/cross-modal-misalignment-unaligned-fusion|跨模态错位与未对齐融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
