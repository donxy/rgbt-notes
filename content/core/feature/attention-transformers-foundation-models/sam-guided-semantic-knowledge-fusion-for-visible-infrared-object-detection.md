---
title: "SAM-Guided Semantic Knowledge Fusion for Visible-Infrared Object Detection"
paper_id: "li2025samguided"
authors: "Li et al."
year: "2025"
venue: "ACM MM"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
tags: ["foundation-model"]
paper_link: "https://dl.acm.org/doi/10.1145/3746027.3755718"
code_link: "https://github.com/liting1018/SemFusion"
doi: "10.1145/3746027.3755718"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Injects SAM-derived semantic knowledge into visible-infrared feature fusion to guide object-level complementarity.

## 点评

全文不可得（ACM 付费墙、无预印本；摘要宣称的代码仓库为空仓、承诺未兑现），本注记据官方摘要与两处同行转述。SAM 的「引导」分两路且载体可确指：阶段一 FGRA 用 SAM 生成的掩码建立目标级跨模态对应、以可变形卷积对齐 RGB 特征；阶段二 SKD 蒸馏的「semantic knowledge」被摘要明确枚举为 SAM 特征、偏移场、掩码三样——对齐偏移本身被当作知识迁移，是它区别于一般特征蒸馏之处。存在一种对应型自指（结构推断）：FGRA 以 RGB 为中心、SAM 为可见光模型，若掩码源自可见光，则可见光退化时先坏的是掩码、而掩码驱动的是对齐偏移——坏先验会把特征主动对错位置，属几何误差、比权重型自指的增益误差更难纠正。全篇无任何质量/可靠性/不确定性量，掩码是语义信号而非可信度信号，无压低、无弃权；推理期是否还运行 SAM 摘要未交代，两种读法对鲁棒性都不利。评测仅 DroneVehicle / VEDAI / LLVIP 三个干净基准；官方摘要不含任何数值、同行也未转引其表格——引用时只能引方法、不能引数字。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
