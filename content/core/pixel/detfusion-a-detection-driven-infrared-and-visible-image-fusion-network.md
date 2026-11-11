---
title: "DetFusion: A Detection-driven Infrared and Visible Image Fusion Network"
paper_id: "sun2022detfusion"
authors: "Sun et al."
year: "2022"
venue: "ACM MM"
list: "core"
scope: "Related"
section: "Pixel-Level Fusion for Detection"
subsection: ""
fusion_level: "pixel"
architecture: "CNN"
tags: ["image-fusion", "task-coupled"]
paper_link: "https://dl.acm.org/doi/pdf/10.1145/3503161.3547902"
code_link: "https://github.com/SunYM2020/DetFusion"
doi: "10.1145/3503161.3547902"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Modality-specific detectors supply object attention maps that bias the fusion decoder toward object regions.

## 点评

全文不可得（ACM 付费墙、无预印本），机制层据官方代码全量与官方框架图一手核实，数字为 TPAMI IVIF 综述统一重评协议的转引、与原文自报严格隔离。「detection-driven」的确切含义：级联两个模态专属 Faster R-CNN，融合图回喂冻结的检测器，取两支 bbox 头的分类+回归损失回传更新融合网络——优化的是「融合图对检测器友好」。其对象感知内容损失的掩码来自标注框而非检测器输出（框内融合像素拉向两源逐像素 max、框外拉向 mean），不构成自指，但该先验只存在于训练期、推理期无对象先验可用。共享注意力由检测支路自身特征生成、取两模态逐元素 max 后在解码器 4 处做 (1+Att) 残差调制——只能增强、不能抑制，任一模态的伪高响应（热噪声、强反光）会被 max 全额放大，无关闭/折扣一路的表达位置，与接管方向恰好相反。发布代码的测试路径是两支各自在源模态特征上检测，融合图只是并行产物、最终检测根本不发生在融合图上。综述重评下其 M3FD 检测 mAP 0.580（表 V，该表无单模态对照行）、FMB 分割 mIoU 56.5、83.07M 参数为全表最重一档。退化/缺失/故障评测为零。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
