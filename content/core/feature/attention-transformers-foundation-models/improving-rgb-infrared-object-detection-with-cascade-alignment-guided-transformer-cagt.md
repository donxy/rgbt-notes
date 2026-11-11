---
title: "Improving RGB-Infrared Object Detection with Cascade Alignment-Guided Transformer (CAGT)"
paper_id: "yuan2024improving"
authors: "Yuan, Shi, Wang, Wang, Wei"
year: "2024"
venue: "Information Fusion"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Alignment; Attention"
tags: ["alignment", "aerial", "transformer", "cross-attention"]
paper_link: "https://doi.org/10.1016/j.inffus.2024.102246"
code_link: ""
doi: "10.1016/j.inffus.2024.102246"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Cascades region alignment (TSRA-style) with a complementary fusion transformer inside an RoI detection head; evaluated on DroneVehicle and KAIST.

## 点评

全文不可得（Elsevier 付费墙、无预印本与官方代码），本注记据官方摘要与同行文献转述。RoI 检测头内的级联对齐+融合：TSRA 先对区域提议池化的两模态区域特征做平移/尺度/旋转对齐，其内部的 CFT（Complementary Fusion Transformer，与 Fang et al. 的 CFT 只是缩写相同、并非同一方法）再做互补融合，沿级联 RoI 头逐级重复。与同组 TSFADet、C2Former 属同一对齐纲领，作用位置移到检测头内。仅 DroneVehicle + KAIST 采样两个干净基准；转引（UniRGB-IR 表 II，全集口径）KAIST MR⁻² All 28.96，反略逊于姊妹作 C2Former 的 28.39。无退化/缺失/受控失准评测；对齐机器无模态健康概念，损坏模态的区域特征会被照常对齐、照常融合。

## 相关页面

- 主题综述：[[themes/cross-modal-misalignment-unaligned-fusion|跨模态错位与未对齐融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
