---
title: "YOLOv11-RGBT: Towards a Comprehensive Single-Stage Multispectral Object Detection Framework"
paper_id: "wan2025yolov11rgbt"
authors: "Wan, Lu, Fang, Lang, Shu, Chen, Shen, Xu, Ye"
year: "2025"
venue: "arXiv"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN; YOLO"
tags: ["yolo", "efficiency"]
paper_link: "https://arxiv.org/abs/2506.14696"
code_link: "https://github.com/wandahangFY/YOLOv11-RGBT"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Six-fusion-mode study over YOLO/RT-DETR with P3 mid-fusion + controllable fine-tuning (MCF).

## 点评

系统比较六种融合方式，提出 P3 中层融合与可控微调（MCF），FLIR 上带来明显的 mAP 提升。

## 框架图

![YOLOv11-RGBT 方法主框图（原文 Figure 1）：上半为端到端流水线与四类任务，下半为六种融合模式的结构示意](figs/yolov11-rgbt.webp)

*原文 Figure 1：YOLOv11-RGBT 总体架构。上半为端到端流水线——配对样本经预处理（Split / Merge）拼成 Ch=4（默认）或 Ch=6 输入，增强后送入 YOLOv11-RGBT 模型族（YOLOv3–YOLOv12、RT-DETR 的 RGBT 版本），右侧列出检测（主任务）、实例分割、姿态、图像分类四类任务。下半为六种融合模式的结构示意：不共享权重组中，早融合把拼接通道直接送单骨干；中期融合用通道拆分模块把 4 通道拆成 RGB 的 3 通道与 IR 的 1 通道，两条骨干各自提特征后在 fusion 块融合，再共享 Neck / Head；中后期融合在各自 Neck-1 之后融合、再过 Neck-2；晚融合在各自 Neck 之后融合；分数融合双路各自出检测结果后经 NMS 合并。底部为共享权重组：CTB（Channel To Batch）把两模态排入 batch 维过同一骨干，BTC（Batch To Channel）还原后在中、晚、分数位置融合。注：原图把中后期与晚融合都标作 (d)，系原文标注重复。图源：Wan et al. 2025, arXiv:2506.14696 Figure 1。*

## 问题定义

单阶段多光谱（RGB + 热红外）目标检测的三个工程性缺口：(1) 缺统一框架——既有方法多为单一模型、单一场景定制，无法跨检测器与任务复用；(2) 融合策略与性能难兼顾——融合位置、节点数的选择对结果影响大且无定规；(3) 模态权重分配不合理——多数网络把两模态等权处理，但实际中总有一路更强（VEDAI 上可见光更强，LLVIP / KAIST / FLIR 上红外更强），均匀融合会把融合模型拖到低于强单模态的水平。本文的解法是把问题收成框架 + 配方：以 YOLOv11 为基座搭一个覆盖多模型、多任务的统一 RGBT 框架，再通过重估模态重要性给出两个配方——P3 单点中期融合与多光谱可控微调（MCF）。注意其模态失衡是静态、数据集级的概念（一路在整个数据集上整体更强），全部证据来自干净配对数据；测试时模态损坏、缺失不在其问题定义内。

## 方法细节

框架总览（图 1）：输入侧把 RGB（3 通道）与 IR（1 通道）经 Split / Merge 预处理拼为 4 通道（默认）或 6 通道张量；框架定义六种融合模式——权重不共享组的早融合、中期融合、中后期融合、晚融合、分数融合，外加权重共享模式（CTB 把两模态排进 batch 维过同一骨干、BTC 还原后再融合）。模式被移植到 YOLOv3–YOLOv12、PP-YOLOE、RT-DETR，并支持检测、分类、实例分割、关键点四类任务。常规 Midfusion：把 YOLOv11 骨干复制为 RGB、IR 两条独立骨干（权重不共享），在 P3 / P4 / P5 三个尺度于 neck 内做 Concat / Add 融合，共享 neck 与 head；迁移配方是 COCO 预训练权重直接复制到双骨干与 neck / head，通道不一致时用通道平均、复制或插入 1×1 卷积对齐。Midfusion-P3：只在 P3 一个节点融合——两路 P3 特征 concat 后过一个可训练模块，其余尺度不再跨模态融合；以 YOLOv11n 计，参数量从 Midfusion 的 3.62M 降到 2.57M、FLOPs 从 9.51G 降到 8.32G，动机是多节点融合带来特征冗余与互相干扰。MCF（多光谱可控微调，仿 ControlNet）：先训好强模态的单模态模型（FLIR / LLVIP / KAIST 用红外主分支，VEDAI / M3FD 用可见光主分支），把整网冻结；另一模态的特征经一个权重零初始化的 Zero Conv2d 注入中期融合位置，只训练注入支路——零初始化保证微调起点严格等于原单模态模型，注入幅度由训练受控增长。损失与 YOLOv11 原版一致（DFL + BCE 分类 + CIoU 定位）；数据增广只提旋转、缩放、裁剪等常规项，全文无模态 dropout、无任何退化或损坏增广。

## 实验设置

数据集（§4.2，共 5 个）：FLIR（预对齐版，训练 4,124 对 / 测试 1,013 对，行人、汽车、自行车 3 类）、M3FD（4,200 对，训练 3,360 / 验证 840，6 类）、KAIST（Li 重标注版，仅行人，训练 8,956 / 验证 2,252）、LLVIP（15,488 对，训练 12,025 / 测试 3,463，行人）、VEDAI（约 1,050 对，无官方划分，按 8:2 自行划分）。定量实验实际只在 FLIR、LLVIP、M3FD 三个数据集上完成（表 2–表 15）；KAIST 无结果表，VEDAI 只有图 8 的定性检测图；DroneVehicle 未使用。训练：输入统一 640×640，batch 16（显存不足降至 8）；YOLO 系框架训练 300 epoch；MMDetection 对照组为 ResNet50、30 epoch、3 次重复。两套结果口径必须分清：表 2–表 5、表 8、表 11 为无预训练权重从头训练；表 6、表 7、表 9、表 10、表 12–表 15 为 COCO 预训练迁移、MCF 口径，两套口径的数字不可混用。指标：P / R / AP50 / AP（mAP@[.5:.95]），以及参数量、FLOPs。依据说明：本文以大规模对照表为主体，表 2–表 5 中非 YOLOv11 系列的逐行数字未逐一复核，本笔记只引用 YOLOv11 系列行与正文明确讨论的数字。

## 关键数字

以 YOLOv11n 为主线（AP50 / AP）。FLIR、无预训练：RGB-only 60.37 / 29.15；IR-only 70.53 / 37.31；Midfusion 73.22 / 38.41；Midfusion-P3 74.41 / 39.70——P3 较三节点 Midfusion 的 AP +1.29。FLIR、COCO 预训练（表 7）：RGB-only 68.16 / 33.86；IR-only 73.45 / 40.30；Midfusion 75.20 / 40.28；P3 76.91 / 41.03；MCF 76.23 / 41.18。系列上限是 YOLOv11x-MCF 的 83.48 / 47.61（摘要头条，称 MCF 使 YOLOv11 各尺度 mAP 提升 3.41–5.65 个百分点，但摘要未指明对照基线）。LLVIP、无预训练（表 8）：YOLOv11n RGB-only 89.10 / 51.06；IR-only 96.19 / 66.31；Midfusion 95.69 / 63.56——融合低于红外单模态；P3 96.46 / 65.57，仍低于 IR-only。LLVIP、COCO 预训练（表 9）：YOLOv11n IR-only 96.94 / 67.17；Midfusion 96.66 / 65.83（仍低于 IR-only）；P3 96.57 / 65.48；MCF 96.69 / 67.88（AP 反超 IR-only、AP50 未反超）。M3FD：融合在此普遍有益（与 FLIR / LLVIP 相反）——无预训练 YOLOv11n 的 Midfusion 为 82.02 / 55.38、P3 为 80.58 / 54.93；COCO 口径下 Midfusion 83.63 / 57.61、P3 83.03 / 57.87、MCF 82.34 / 55.81 反而最弱。六种融合模式对照（表 15，M3FD、无预训练）：YOLOv11n 上 Midfusion 最好，其后依次为中后期、权重共享、晚融合、分数融合、早融合；但 YOLOv11m 上早融合反超中期融合——最优融合位置随尺度与数据集而变。

## 消融说明了什么

本文没有独立消融章，其消融就是三组对照实验。融合节点数（表 4 vs 表 5）：P3 单点融合在 FLIR / LLVIP 上多数优于三节点融合且参数更少——多节点融合引入的是冗余与干扰，不是单调收益；作者同时承认单点与多点结果互有胜负，P3 并非普适最优。MCF 的主分支选择与优化器（表 6 / 10 / 13 / 14）：M3FD 上 RGB 主分支的 MCF 全面优于 IR 主分支，且 IR 主分支的 MCF 只能保证超过 IR 单模态、超过不了 RGB 单模态——选哪一路当主分支，决定了 MCF 的上限；优化器无定规，Adam 对部分尺度更好、SGD 对另一些更好，只能逐模型试。预训练迁移的反常（图 5、表 9）：双骨干复制同一份 COCO 权重导致两路特征高度冗余，迁移后的融合模型在 FLIR / LLVIP 上常打不过 IR 单模态——这正是 MCF 冻结主分支、只注入另一路设计的直接动机；作者最终的建议是先试全网迁移学习，效果不满意再考虑 MCF。

## 局限

损坏与缺失模态：零评测、零机制。全部实验在干净配对数据上进行；无任何腐化、退化协议，无模态丢弃或整路缺失实验（全文无 missing modality 表述），训练配方中也无模态 dropout 或退化增广。其所称 robustness 仅指 MCF 的训练稳定性与跨数据集泛化，不是 corrupted-modality robustness，不可转引为损坏鲁棒性证据。无融合不劣于强单模态的保证，且其负融合证据是聚合口径的：融合低于强单模态的现象只在数据集整体 AP 上呈现，没有逐样本、逐区域的条件分析，更没有测试时模态质量变化的情形；该现象还随数据集翻转（M3FD 上融合普遍占优），作者的处理是换配方（P3 / MCF），不是给出下限保证。无测试时适应：全部机制（融合模式、P3、MCF）都在训练期定型，推理为冻结前向；MCF 的可控指训练时的注入幅度可控，不是测试时可调。MCF 的结构性上限：冻结主分支 + 零初始化注入，实质是把弱模态当增量信息，受主分支选择的硬约束；在 M3FD 上 MCF 输给普通全网 Midfusion，作者自己也只把它定位为迁移学习不佳时的备选。报告质量问题（引用时须知）：正文转述与表格多处对不上（§4.5、§4.6 的多处数字在表内无对应行或张冠李戴），引用本文数字一律直接查表，不要引正文转述。证据范围：外部方法数字多转引自二手文献；定量实验只覆盖所列 5 个数据集中的 3 个；框架本身无新融合算子、无理论分析，属工程框架 + 配方研究。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
