---
title: "UniRGB-IR: A Unified Framework for Visible-Infrared Semantic Tasks via Adapter Tuning"
paper_id: "yuan2025unirgbir"
authors: "Yuan, Cui, Zhao, Wang, Fu, Yang, Wei"
year: "2025"
venue: "ACM MM"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
tags: ["foundation-model", "adapter"]
paper_link: "https://arxiv.org/abs/2404.17360"
code_link: ""
doi: "10.1145/3746027.3754806"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Adapter injection of RGB-IR fusion into a frozen ViT foundation model.

## 点评

将 RGB-IR 融合以适配器形式注入冻结的 ViT 基础模型；FLIR mAP 44.1 / LLVIP 63.2。

## 框架图

![UniRGB-IR 方法主框图（原文 Figure 2）：冻结 ViT 主干、多模态特征池 MFP 与补充特征注入器 SFI 总览](figs/unirgb-ir.webp)

*原文 Figure 2：UniRGB-IR 总体架构。上路为冻结的 Vision Transformer（雪花标记）：RGB 图像经 Patch Embedding 进入 ViT Blocks 分 stage 处理，末端接 Det / Seg 等任务头——主干只见 RGB。下路为可训练的适配器（火焰标记）：MFP 同时吃 RGB 与 IR 图像产出多尺度补充特征 F_mfp，三个 SFI 模块在前三个 stage 的入口处把补充特征以逐元素相加的方式逐级注入 ViT 特征流。图右图例点明 Frozen / Tunable 的分界——一张图看清「谁冻结、谁训练、IR 从哪进」。图源：Yuan et al., ACM MM 2025（arXiv:2404.17360）Figure 2。*

## 问题定义

RGB-IR 语义任务（检测、分割、显著性检测等）长期缺少在大规模红外数据上预训练的基础模型，主流做法是拿 RGB 预训练模型为每个任务定制结构并全量微调，导致两个问题：(1) 任务间结构不通用、每个任务存一份专用模型，参数冗余；(2) 全量微调破坏基础模型在大规模数据上学到的先验，限制泛化。本文主张用适配器微调（adapter tuning）统一这批任务：冻结整个 RGB 基础模型，只训练一个把 RGB-IR 双模态特征「补充注入」主干的适配器，使同一套框架以极少的可训练参数适配多个下游任务。其问题设定始终是干净、对齐的双模态输入——全文没有任何模态退化、损坏或缺失的设定，也没有跨数据集泛化（在 A 上训练、B 上测试）实验：「统一」是架构与训练范式层面的，不是多数据集联合训练。版本说明：本笔记读的是 arXiv:2404.17360 的 v2；仓库著录会场为 ACM MM 2025。

## 方法细节

总体结构（图 2）三部分——冻结的 ViT 基础模型 + 多模态特征池 MFP + 补充特征注入器 SFI，后两者合称适配器，是唯一可训练部分（可训练参数约全量微调的 10%）。关键的非对称设计：ViT 主干自始至终只吃 RGB 图像（patch embedding 只处理可见光）；红外（以及 RGB 的另一份拷贝）走旁路 MFP 提取特征，再由 SFI 注入主干各 stage。也就是说，基础模型的「本体」是纯 RGB 的，IR 只能以补充特征的形式进入——这与双流主干有本质区别。MFP（多模态特征池）：ResNet 式 stem 分别提 RGB/IR 特征（H/4），通道均分四组，分别过 3×3、3×3、5×5、7×7 卷积做多感受野感知；每组内两模态特征用 SE 注意力融合（模态融合实际发生在这里）；拼接后经三层 stride-2 卷积构成特征金字塔，得到 1/8、1/16、1/32 三个尺度的特征，1×1 卷积投影后展平拼成补充特征 token。SFI（补充特征注入器）：置于 ViT 每个 stage 的起始处（实际只装前 3 个 stage，见消融）。以当前 stage 的 ViT 特征为 query、对补充特征做稀疏注意力（默认 deformable attention）采样注入；渐进式注入由门控融合单元 GFU 实现：把上一 stage 的注入特征与本 stage 新采样特征拼接过线性层预测标量权重 z，按 z / 1−z 加权融合；LayerNorm 用于「减小模态差异」。适配器微调范式：训练时冻结 ViT 全部参数，只优化适配器；下游框架按任务换：检测用 Cascade R-CNN（MMDetection）、分割/显著性用 SETR（MMSegmentation）、人脸识别用 InsightFace 换骨干。注意每个任务仍是单独训练一份适配器权重——共享的是冻结主干与适配器结构，不是同一份权重跑所有任务。

## 实验设置

基础模型：ViT-Base（COCO 预训练）。检测（表 I、II）：FLIR 用对齐子集（训练 4,129 对 / 测试 1,013 对），LLVIP（12,025 / 3,463 对），指标 mAP / mAP50 / mAP75；KAIST（8,963 / 2,252 对，All-dataset 设定），指标 log-average MR⁻²。检测框架为 Cascade R-CNN + 本框架骨干，AdamW，lr 2e-4，48 epoch，batch 16，RTX 3090，仅水平翻转增广。对比含单模态 SSD/RetinaNet/Faster R-CNN/Cascade R-CNN(ViT-B)/DDQ-DETR（分 RGB、IR 两组）与融合方法 GAFF、ProbEn、LGADet、CSAA；KAIST 另比 13 个行人检测方法（Halfway Fusion、CIAN、MSDS-RCNN、AR-CNN、MBNet、TSFADet、CMPD、CAGTDet、C2Former 等）。其余任务：语义分割 PST900（597/288 对）与 MFNet（1,569 对，2:1:1 划分），指标 mAcc/mIoU；显著性检测 VT821/VT1000/VT5000（按惯例以 VT5000 的 2,500 对训练、其余测试），指标 S/adpE/adpF/MAE；人脸识别 IRIS（4,228 对、30 人，80/20 划分），指标 Rank-1 与 TPR@FAR。

## 关键数字

FLIR（表 I，mAP）：UniRGB-IR 44.1（mAP50 81.4、mAP75 40.2）；最强单模态为 IR 的 Cascade R-CNN(ViT-B) 41.9；融合基线 CSAA 41.3、ProbEn 37.9、GAFF 37.4——注意 GAFF/ProbEn 均低于 IR 单模态 Faster R-CNN（37.6）甚至远低于 IR Cascade（41.9），作者在正文明确指出「多数多模态检测器还不如单模态检测器」，并归因于低光下 RGB 特征干扰红外特征（干净数据上的负融合现象）。LLVIP（表 I，mAP）：UniRGB-IR 63.2（96.1 / 72.2）；最强单模态 IR Cascade 60.4；CSAA 59.2、ProbEn 51.5。KAIST（表 II，MR⁻² All）：UniRGB-IR 25.21，优于 C2Former 28.39、CMPD 28.98、CAGTDet 28.96；Day 25.93 / Night 23.95 均为最佳，Far 子集从 C2Former 的 48.14 压到 38.21 提升最大。分割：PST900 mIoU 82.8（与 SGFNet 并列最佳）、mAcc 94.3（最佳）；MFNet mIoU 59.3、mAcc 75.7，均为最佳（次优 CMX 58.2）。显著性：VT5000 上 S 0.906 / adpE 0.935 / adpF 0.849 / MAE 0.027，四项均优于 LSNet；VT1000 亦全项最佳。人脸：AdaFace+UniRGB-IR Rank-1 84.2%、TPR@FAR=1% 89.4%（单模态 AdaFace-IR 为 76.3 / 85.1；注：人脸正文称 Rank-1 为 84.3%，表 IX 作 84.2%，此处以表为准）。覆盖范围：检测只评了 FLIR 与 LLVIP 两个数据集（且 FLIR 为对齐子集口径），没有 M3FD；全部为同数据集内训练–测试，无跨数据集数字。

## 消融说明了什么

组件消融（表 V，FLIR mAP / PST900 mIoU）：基线（RGB+IR 堆叠输入 + 全量微调）39.6 / 77.5；冻结 ViT + 加 MFP（注入方式为逐元素相加）41.2 / 78.8（+1.6 / +1.3）；再把相加换成 SFI 44.1 / 82.8（再 +2.9 / +4.0）——增益大头在 SFI 的动态注入而非特征池本身。SFI 装配位置（表 VI，FLIR mAP）：只装 stage 1 → 41.7；加 stage 2 → 43.3；加 stage 3 → 44.1；再加 stage 4 反而降到 42.7，故最终只装前 3 个 stage——注入并非越多越好，过深注入伤性能，作者未深究机理。SFI 注意力类型（表 VII，FLIR mAP）：deformable attention 44.1，远高于 global attention 36.1、Pale attention 31.6——注意力选型的影响（近 13 个点）远大于模块有无，说明注入的采样方式是该框架的关键环节。训练效率（图 7，正文）：适配器微调的可训练参数约为全量微调的 10%，FLIR 上收敛更快且终点更高（曲线图，无精确数值表）。

## 局限

零鲁棒性设定：无模态退化/损坏/缺失评测，无噪声注入，无一路输入失效的实验；正文对负融合的讨论（融合不如 IR 单模态）只停留在跨方法的表格对比层面，没有受控的退化实验，也无任何「融合不劣于单模态」的保证或机制性补救——SFI 的门控是对干净特征的常规加权，不是质量/健康门控。架构上锁死 RGB 主位：ViT 主干只处理 RGB，IR 只能经旁路补充注入；RGB 一旦损坏，坏的是基础模型本体的输入，适配器无从补位，该结构在原理上与缺失/损坏模态问题正交。「统一」的含金量需看清：统一的是冻结主干 + 适配器结构 + 微调范式；每个任务/数据集仍单独训练、单独存适配器权重，没有联合训练、没有跨数据集泛化测试、没有零样本迁移；标题中的 Unified 是框架通用性，不是权重通用性。检测结论建立在 Cascade R-CNN + ViT-Base 的重型协议上（与 YOLO 系单阶段协议不同构），FLIR/LLVIP 数字不能与单阶段检测器的同名表格直接并列；FLIR 只用对齐子集（4,129/1,013），与未对齐版 FLIR 的口径不同，引用时须注明。消融只在 FLIR 与 PST900 上做；SFI 在 stage 4 掉点、注意力选型敏感（Pale 仅 31.6）等现象只给数字未给解释，框架对注入细节的脆弱性其实不低。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
