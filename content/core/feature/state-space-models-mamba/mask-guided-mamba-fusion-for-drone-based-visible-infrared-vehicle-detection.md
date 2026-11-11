---
title: "Mask-Guided Mamba Fusion for Drone-based Visible-Infrared Vehicle Detection"
paper_id: "wang2024maskguided"
authors: "Wang et al."
year: "2024"
venue: "IEEE TGRS"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "State-Space Models (Mamba)"
fusion_level: "feature"
architecture: "Mamba"
tags: ["mamba", "aerial"]
paper_link: "https://doi.org/10.1109/TGRS.2024.3452550"
code_link: ""
doi: "10.1109/TGRS.2024.3452550"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Mask-guided state-space fusion for drone-based visible-infrared vehicle detection on DroneVehicle.

## 点评

全文不可得（闭源、无预印本与官方代码），本注记据官方摘要与四篇同行转引。其「mask」是车辆区域的空间聚焦、不是模态可靠性：以一路模态的候选区域覆盖另一路中间层特征的对应区域、再以正则约束提取跨模态引导，不决定用不用某一路（官方摘要自身存在模块缩写不一致，掩码由哪一路生成、如何监督在可核查范围内未核实）。融合 SSFM 把两路特征映射进共享隐状态交互（与 Fusion-Mamba 的 DSSF 同族），全管线无任何质量/可靠性量、无压低某一路的通道。掩码是结构性单点故障（结构推断）：引导信号来自同一对传感器，源模态损坏时掩码先错位/缺失、错误引导会被当作正常信息吸收，管线无第二道防线。退化/缺失/故障评测在核查范围内为零，单模态对照行同样不可核查。头条数字可交叉验证：DroneVehicle mAP@0.5 80.3（摘要 80.24%，两家独立转引表数值集合完全一致），规模约 122M 参数、6.1 FPS（转引），重型非实时。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
