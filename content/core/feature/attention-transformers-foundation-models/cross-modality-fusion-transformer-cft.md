---
title: "Cross-Modality Fusion Transformer (CFT)"
paper_id: "fang2021crossmodality"
authors: "Fang, Han, Wang"
year: "2021"
venue: "arXiv"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Attention"
tags: ["cross-attention", "transformer"]
paper_link: "https://arxiv.org/abs/2111.00273"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：YOLOv5-based transformer cross-modal fusion for RGB-T detection.

## 点评

早期 Transformer 融合基线，基于 YOLOv5，在 FLIR + LLVIP 上被广泛对比。

## 框架图

![CFT 方法主框图（原文 Figure 2）：左为双流 CSPDarknet 骨干在第 3、4、5 阶段各接一个 CFT 模块的总览，右为单个 CFT 模块的 Transformer 细节](figs/cross-modality-fusion-transformer-cft.webp)

*原文 Figure 2：Cross-Modality Fusion Backbone（CFB）框架。左半为总览——RGB 与热红外两条 CSPDarknet 支路（特征 F_R1–F_R5 / F_T1–F_T5，尺寸 320×320×64 至 20×20×1024），第 3、4、5 阶段各接一个 CFT 模块，交互结果 P_3 / P_4 / P_5 送往特征金字塔；右半为单个 CFT 模块细节——两模态特征拼接加位置嵌入后，经 8 层堆叠的 Transformer 块（LayerNorm + 多头注意力 / MLP），输出 F′_R / F′_T 残差加回各支路。图源：Fang et al., arXiv:2111.00273 Figure 2。*

## 问题定义

多光谱（可见光 + 热红外）目标检测的核心问题是如何设计跨模态融合机制，充分利用两模态的互补性。已有工作几乎全部基于双流 CNN：卷积的感受野是局部的，跨模态交互只能在局部邻域内发生，难以建模长程依赖与全局上下文。作者主张 Transformer 的自注意力是全连接图结构，天然适合连接多模态信号，并声称为首个将 Transformer 引入多光谱目标检测的工作。问题的默认前提是两模态输入均为完好、对齐的图像对；鲁棒性只在修辞层面出现（摘要称融合可 robustly capture 模态间潜在交互），不构成实验问题。

## 方法细节

整体框架称为 Cross-Modality Fusion Backbone（CFB）：把 YOLOv5 的特征提取网络改造成双流 CSPDarknet53（RGB 与热红外各一支），在第 3、4、5 阶段的输出后各插入一个 CFT 模块，共三个；每路特征经 CFT 交互后的结果送入后续特征金字塔与检测头。基线即去掉 CFT 的双流网络，二者差异只有 CFT 模块本身。单个 CFT 模块的做法：取某一阶段的两模态特征图，各自展平为序列，沿序列维拼接成联合序列，加上可学习位置嵌入后送入标准 Transformer（多头自注意力 + 两层 MLP，GELU 激活；每个 CFT 模块堆叠 8 个 Transformer 块）；输出序列再拆回两模态、变回特征图形状，作为残差加回各自支路。理论卖点是：联合序列上的注意力相关矩阵天然分解为四个块——两个模态内块与两个模态间块——因此一次自注意力同时完成模态内与模态间融合，无需手工设计融合算子。一个关键的工程妥协：直接在原始分辨率上做注意力不可接受，因此特征图在进入 Transformer 前先经全局平均池化压到固定的 8×8 分辨率，输出再双线性上采样回原分辨率——跨模态注意力实际只在 8×8 的粗粒度网格上运行（共 128 个 token）。损失沿用 YOLOv5 组合：GIoU 框回归 + 交叉熵分类 + 置信度平方误差。

## 实验设置

数据集三个，均为干净基准：FLIR 对齐版（5,142 对，训练 4,129 / 测试 1,013，person / car / bicycle 三类；原文明确丢弃未对齐对，仅用 aligned 版本）；LLVIP（16,836 对严格时空对齐的低光行人图像对）；VEDAI（航拍车辆，9 类、3,700 余个标注、1,200 余张图）。指标为 COCO 式 mAP50 / mAP75 / mAP。训练：SGD（初始学习率 1e-2、动量 0.937、权重衰减 5e-4），200 epoch，batch 32，2× TITAN RTX，YOLOv5 的 COCO 预训练权重初始化，Mosaic 增广。对照包括单模态 YOLOv5 / YOLOv3 / Faster R-CNN、双流基线，以及 Halfway Fusion、CFR、GAFF 等多模态方法。

## 关键数字

FLIR（mAP50 / mAP75 / mAP）：CFT 78.7 / 35.5 / 40.2；双流基线 73.0 / 32.0 / 37.4（CFT 相对 +5.7 / +3.5 / +2.8）；单模态 YOLOv5：RGB-only 67.8 / 25.9 / 31.8，热红外-only 73.9 / 35.7 / 39.5。值得注意：朴素双流基线的 mAP（37.4）与 mAP50（73.0）均低于热红外单模态（39.5 / 73.9）——干净数据上融合不如最佳单模态的早期实例，作者归因于粗糙融合加重模态失衡、导致性能退化；CFT 把 mAP 抬到 40.2，也仅比热红外单模态高 0.7。相对当时最强的 GAFF（72.9 mAP50）领先 5.8 个点。LLVIP：CFT 97.5 / 72.9 / 63.6；双流基线 95.8 / 71.4 / 62.3；RGB-only 90.8 / 51.9 / 50.0，热红外-only 94.6 / 72.2 / 61.9。VEDAI：CFT 85.3 / 65.9 / 56.0；双流基线 79.7 / 47.7 / 46.8——mAP75 一项 +18.2、mAP +9.2，是三组数据中增益最大的。跨检测器（FLIR）：CFT 亦可挂到 YOLOv3（mAP50 76.3，相对其双流基线 +4.0）与 Faster R-CNN（77.5，+4.3）。代价：YOLOv5+CFT 参数量 206.03M（双流基线 73.72M，近 2.8 倍），GFLOPs 224.40（基线 190.14）。一处文本不一致：结论段写 FLIR mAP50 为 78.5，表 1 与表 3 均为 78.7（以表格为准）。

## 消融说明了什么

本文的消融（§4.4）实质是模态与检测器两个维度的对照，而非模块组件拆解。其一，单模态 vs 双流 vs 双流+CFT 的三级对照（表 1）显示：简单双流拼接并不能保证超过最佳单模态（FLIR 上为反例），增益主要来自 CFT 的注意力交互而非用了两路输入本身。其二，跨检测器实验（表 2）表明增益不依赖于 YOLOv5，属模块级贡献。其三，可视化分析（§4.5）给出两点机制证据：相关矩阵的四块结构在实测中成立（模态间两块近似对称）；CFT 输出的数值范围比原特征小一个数量级，即 CFT 学到的是小幅残差校正而非替换原特征。文中未见对池化分辨率（8×8）、注意力头数、堆叠层数（8）的敏感性消融。

## 局限

鲁棒性评测为零（已逐项核查全文）：没有任何模态退化、噪声注入、腐化或缺失模态实验；摘要中的 robustly 只是对注意力机制的定性描述。单模态对照行是独立训练的单模态检测器，并非融合模型去掉一路输入的缺失模态测试；FLIR 的昼、夜与 LLVIP 的低光都是自然场景分布，表格亦未按昼夜拆分报告。跨模态注意力被全局池化压到 8×8 网格：交互是全局语义级的，无法在原分辨率上表达局部空间对应；对未对齐数据无任何处理（实验直接使用 FLIR 对齐版并丢弃未对齐对）。注意力对两模态一视同仁：联合序列中每个 token 地位对称，没有任何质量感知、置信度或门控机制——某一模态整体不可靠时，其 token 仍以同等权重参与注意力并污染另一模态的输出。参数量膨胀严重（206M），与轻量部署取向相反；且增益的相当一部分来自 8 层 Transformer 堆叠的容量增加，文中未做等参数量对照。基线与增益口径需注意：其双流基线是作者自搭的朴素拼接，FLIR 上弱于热红外单模态，CFT 的相对增益部分来自基线偏弱。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
