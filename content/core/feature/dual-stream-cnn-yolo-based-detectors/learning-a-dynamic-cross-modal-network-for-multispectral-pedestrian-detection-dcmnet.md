---
title: "Learning a Dynamic Cross-Modal Network for Multispectral Pedestrian Detection (DCMNet)"
paper_id: "xie2022learning"
authors: "Xie et al."
year: "2022"
venue: "ACM MM"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Dynamic Fusion"
tags: ["pedestrian", "dynamic-fusion"]
paper_link: "https://doi.org/10.1145/3503161.3547895"
code_link: ""
doi: "10.1145/3503161.3547895"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Dynamically aggregates local and non-local cross-modal context when fusing the streams, instead of a fixed fusion rule.

## 点评

全文不可得（ACM 闭源、无预印本与官方代码），本注记据官方摘要与 TFDet 对比表转引。其「dynamic」是算子层面的内容自适应：局部模块用输入条件生成的动态卷积核建立跨模态局部对应，非局部模块生成动态隐特征节点作全局聚合中介——与模态路由或可靠性加权无关。无任何模态贡献加权、置信估计或门控开关。仅 KAIST + LLVIP 干净基准，无退化/缺失评测。摘要只给相对增益（同骨干 Cascade R-CNN 之上 KAIST +1.74、LLVIP +1.90 个百分点，指标未注明，引用须原样标注）；转引（TFDet 表 III/IV）：KAIST MR⁻² All 5.84，但 Far 子集 69.70 显著差于同期；LLVIP AP 58.4 属中游。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
