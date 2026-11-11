---
title: "EI²Det: Edge-Guided Illumination-Aware Interactive Learning for Visible-Infrared Object Detection"
paper_id: "hu2025eidet"
authors: "Hu et al."
year: "2025"
venue: "IEEE TCSVT"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["quality-aware"]
paper_link: "https://doi.org/10.1109/TCSVT.2025.3539625"
code_link: "https://github.com/hukefy/EI2Det"
doi: "10.1109/TCSVT.2025.3539625"
notes_basis: "abstract"
req04_quality_estimation: "No"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Unknown"
---

**一句话要点**：Edge-guided, illumination-aware interactive learning between the two streams, with the accompanying MFAD dataset.

## 点评

正文不可得（IEEE 付费墙、无预印本），机制层据官方代码全量逐行核查，框架图取自仓库。其光照门是光照门谱系的第四代、语义未变：IWM 只读原始 VIS 图像（缩至 64×64 的小分类器、交叉熵监督），输出每图一对全局标量 (w_v, w_t = 1 − w_v)——四代估计的都是场景亮度先验、从不是模态健康度；IR 从不被读，IR 故障时门完全无感，VIS 故障时门的输入本身即污染源。结构上不能弃权：w_v = 0.5 + 0.5·α·D(p)，α 为可学习标量、初值 0（训练起点为恒等权 0.5/0.5），双流恒拼接、无趋向零点的机制。「interactive」实为跨模态引导的自注意力（跨模态传递的只有注意力图、值不跨模态），污染通道比值交换型窄，但损坏流的 query 仍可任意扭曲健康流的空间注意力。另有两处实现问题：边缘模块图称 Sobel、代码实为拉普拉斯式高通核初始化的可学习卷积，且以固定 0.2 把仅源自 VIS 的边缘特征注入融合（夜间即噪声注入，比例不可学、不能关）；IWM 前向有按 batch 下标缩放 logits 的明显笔误，使光照权重依赖样本在批中的位置。退化/缺失/故障评测在可核查范围内为零；自建 MFAD 的雨雾与光照标注属场景级自然协变量、传感器始终健康。头条数字仅 MFAD 一组来自官方 README，其余为同行转引且 LLVIP 两源口径互斥、禁止混用；KAIST 与消融表在付费墙内未找到可核查来源、未填。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 对比表：[[compare|REQ-04 四维对比表]]
