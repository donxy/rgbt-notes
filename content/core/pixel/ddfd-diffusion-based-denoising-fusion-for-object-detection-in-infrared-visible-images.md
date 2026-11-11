---
title: "DDFD: Diffusion-Based Denoising Fusion for Object Detection in Infrared-Visible Images"
paper_id: "dang2025ddfd"
authors: "Dang et al."
year: "2025"
venue: "ACM MM"
list: "core"
scope: "Related"
section: "Pixel-Level Fusion for Detection"
subsection: ""
fusion_level: "pixel"
architecture: "Other"
tags: ["image-fusion", "task-coupled", "degraded-modality"]
paper_link: "https://dl.acm.org/doi/10.1145/3746027.3755183"
code_link: ""
doi: "10.1145/3746027.3755183"
notes_basis: "abstract"
req04_quality_estimation: "Unknown"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Treats image fusion as a diffusion denoising process with an image-adaptive visible-enhancement module, jointly optimized with the detector.

## 点评

全文不可得（ACM 付费墙、无预印本与官方代码），本注记据官方摘要与参考文献表。其「denoising」是扩散模型自身的标准语义——把融合重述为从噪声反向采样生成融合图像，生成目标是融合图本身而非某幅受损源图的干净版，要「去」的另一对象是摘要明言的目标无关冗余信息；没有证据表明它在修复受损模态的物理噪声。唯一的噪声相关模块 INE（image-aware noise estimator）由输入自身导出以条件化扩散去噪网络，摘要未给任何噪声模型（如高斯 σ）或水平标定，与自指质量信号同族；它不是逐模态可靠性权重，管线中不存在把任一模态压到零的机制位置，输出是双模态条件生成的单幅混合图像。管线唯一冲着输入质量去的模块只增强可见光一路（默认可见光易坏、红外可靠的非对称先验），对热红外自身损坏（条纹/NUC/饱和）没有对应物。实验只有 M3FD / DroneVehicle / VEDAI 三个干净基准，摘要结尾的恶劣天气指数据集原生场景属性，不是注入已知噪声的量测协议。官方摘要通篇零定量数字，采样步数、时延与全部 mAP 均未读到。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
