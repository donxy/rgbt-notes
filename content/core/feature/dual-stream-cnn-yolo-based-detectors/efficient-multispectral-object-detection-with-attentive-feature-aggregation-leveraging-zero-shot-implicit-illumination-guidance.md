---
title: "Efficient Multispectral Object Detection with Attentive Feature Aggregation Leveraging Zero-Shot Implicit Illumination Guidance"
paper_id: "xiong2025efficient"
authors: "Xiong et al."
year: "2025"
venue: "Information Fusion"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["efficiency", "quality-aware"]
paper_link: "https://doi.org/10.1016/j.inffus.2025.102939"
code_link: ""
doi: "10.1016/j.inffus.2025.102939"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "Unknown"
req04_compensation: "Unknown"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Attentive feature aggregation steered by zero-shot implicit illumination estimates, targeting efficient multispectral detection.

## 点评

全文不可得（Elsevier 付费墙、无预印本、无官方代码），且证据为全队列最薄：官方摘要未被任何开放索引收录，机制层内容全部来自四处同行转述并逐项标注。它是光照门谱系的第五代（IAF 解析门 → IATDNN 分类器读融合特征 → MBNet 分类器读 RGB → EI²Det 全局标量对 → 本篇零样本隐式引导）：变的是监督来源（据标题主张以零样本方式免去目标数据上的昼/夜标注）与注入形式（显式标量门 → 隐式嵌入引导注意力计算），不变的是语义——估计的仍是场景级光照状态先验（且据转述为整图二值昼/夜），不是逐模态健康度。「zero-shot」线索的产生方式（是否视觉语言模型、读哪一路、提示形式）在一切可核查材料中均无披露，拒绝猜测。整图二值态与逐模态健康正交：热红外条纹/NUC/坏点/饱和、可见光局部过曝没有一个会翻转二值光照答案，门对损坏模式原理上无感（结构推断）。融合为跨模态注意力聚合，softmax 权重恒正、只能再分配，无压零通路——五代光照门无一具备接管/弃权语义。退化/缺失/故障评测在可核查范围内为零；头条精度、效率数字与单模态对照行均无一读到，「Efficient」只有定性主张、无定量证据可引。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
