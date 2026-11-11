---
title: "Contextually-Guided State Space Fusion for Misaligned Multi-Spectral Object Detection (CSSFDet)"
paper_id: "jin2025contextuallyguided"
authors: "Jin et al."
year: "2025"
venue: "ACM MM"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "State-Space Models (Mamba)"
fusion_level: "feature"
architecture: "Mamba"
mechanisms: "Alignment"
tags: ["mamba", "alignment", "aerial"]
paper_link: "https://dl.acm.org/doi/10.1145/3746027.3754550"
code_link: ""
doi: "10.1145/3746027.3754550"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Selective state-space fusion using global semantic context to compensate local features degraded by cross-modal misalignment.

## 点评

全文不可得（ACM 付费墙、无预印本与官方代码），本注记据官方摘要与同行转述。它处理的是「内容完好、位置错位」：无偏移估计/配准子网络，靠上下文引导的状态空间模块用全局语义上下文把错位处的特征隐式补回——与 AR-CNN、TSFADet 的显式几何对齐路线对照清晰。无任何模态质量/可靠性/不确定性量，Mamba 的「选择性」作用于特征序列而非模态证据，没有任何一路能被降权或关闭；上下文补偿在内容损坏下可能反成污染放大器（结构推断）。摘要称做过数据位移敏感性分析，但位移类型、幅度档位与曲线均不可核查，与 AR-CNN 公开可查的受控偏移协议在可核查性上不对等。退化/缺失/传感器故障评测在摘要层面为零。唯一可引数字：DroneVehicle mAP50 84.1（摘要称比基线 +20%，基线身份与相对/绝对口径未说明，不做推算）。

## 相关页面

- 主题综述：[[themes/cross-modal-misalignment-unaligned-fusion|跨模态错位与未对齐融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
