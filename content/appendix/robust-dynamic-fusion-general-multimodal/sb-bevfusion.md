---
title: "SB-BEVFusion: Enhancing the Robustness against Sensor Malfunction and Corruptions"
paper_id: "essl2026sbbevfusion"
authors: "Essl, Moscati, Noman, Zaheer, Naseem, Nawaz, Schedl"
year: "2026"
venue: "arXiv (ICIP 2026)"
list: "appendix"
scope: "Reference"
section: "Robust & Dynamic Fusion (General Multimodal)"
subsection: ""
fusion_level: "feature"
architecture: "CNN"
tags: ["degraded-modality", "lidar-camera"]
paper_link: "https://arxiv.org/abs/2605.11799"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：BEV fusion explicitly treating corrupted vs missing sensors as distinct cases.

## 点评

全名 SB-BEVFusion: Enhancing the Robustness against Sensor Malfunction and Corruptions，「SB」= Single-Branch：两路 BEV 特征先对齐通道宽，下游 BEV 编码器与检测头在相机/LiDAR/融合三种输入间共享权重，缺一路时融合算子退化为恒等映射、存活模态直通；鲁棒性来自训练期的可用性混合（每样本枚举 {L+C, L, C} 并打散）。全管线没有任何质量/可靠性量（平均是固定 w = 0.5），可用性标志是架构的给定输入（oracle）、不是估计量。它只解决「已知缺失」、不解决「在场但损坏」：模态在场但损坏时融合照常进行、无损坏检测、无逐模态折扣，损坏鲁棒性只是混合训练带来的平均耐受（mRA 相对基线仅 +0.02 量级）——从外部加固了「缺失端已有简单有效解、空白在损坏在场端」的切分，与模态丢弃微调同族且互证。损坏与缺失是两套分开的协议：损坏走 MultiCorrupt 五类 × 三档（其中 LiDAR beam reduction 是按传感器工作原理构造的退化，比纯光度损坏更靠近故障一端），缺失走整模态移除。下限是非对称的：仅 LiDAR 近无损（NDS 0.6959 ≈ 双模态 0.6970），仅相机远逊专用方法；且其单模态行都是融合模型自身的降级模式、无与专门训练的单模态检测器的对照，回答不了「融合 ≥ 最佳单模态」。另有一个干净的负结果：渐进模态衰减课程反而劣于未改的基线——软衰减课程不如硬性状态枚举。可迁移的是通道对齐 + 共享下游的结构配方，不可迁移的是 oracle 可用性前提（RGB-T 面对的是无标志的静默退化）与 BEV 的度量网格对齐。

## 框架图

![SB-BEVFusion 方法主框图（原文 Figure 1）：BEVFusion、UniBEV 与 SB-BEVFusion 三方框架对比，(c) 为本文的单分支共享下游设计](figs/sb-bevfusion.webp)

*原文 Figure 1：三方框架对比图。(a) BEVFusion：相机 BEV 与 LiDAR BEV 拼接后送入 BEV 编码器；(b) UniBEV：变换到 BEV 前先过可变形注意力，再以 CNW 融合；(c) SB-BEVFusion（本文）：两路 BEV 经 Fusion Operator 合并（缺失时直通），融合结果与任一单路 BEV 共用同一个 BEV 编码器（图中以 shared weights 标注）。本文的「框架图」即此图，(c) 面板为所提架构；四种融合算子的示意在原文图 2，未在此图内。图源：Essl et al., arXiv:2605.11799 Figure 1。*

## 问题定义

BEV 融合默认两模态齐备且数据干净；真实部署中传感器可能缺失、损坏或带噪，拼接式融合在这些条件下性能大幅退化。本文要解决的是：做一个框架无关的融合模块，使同一个网络在 L+C（双模态）、L（仅 LiDAR）、C（仅相机）三种可用性状态下都能工作，并分别对「损坏在场」与「整模态缺失」两种情形给出评测。方法全名 SB-BEVFusion: Enhancing the Robustness against Sensor Malfunction and Corruptions，SB = Single-Branch（单分支）；以 BEVFusion（MIT 版）为基座框架，领域是相机 + LiDAR 的 BEV 3D 目标检测（自动驾驶）。须先钉死一个限定：本文对缺失的处理只针对已知缺失——哪一路可用是给定的二值标志（可用性变量是架构的输入条件），不是模型从数据中估计出来的。模态在场但已损坏时，本文没有任何检测或折扣机制，融合照常进行——这是它与「退化模态折扣/回退」问题之间最关键的分野。

## 方法细节

管线沿用 BEVFusion：模态专属编码器分别提取相机多视图图像与 LiDAR 点云特征，各自投影到统一 BEV 空间，得两路 BEV 张量。通道宽对齐：令两路 BEV 张量的通道数相等，使两路同形——这是单分支成立的结构前提，任一路（或其融合结果）都能以同一张量接口喂入同一下游。融合算子只在双模态齐备时启用；缺一路时融合算子退化为恒等映射，存活模态的 BEV 张量直通共享的卷积 BEV 编码器与检测头。下游编码器与检测头在相机/LiDAR/融合三种输入间共享权重，这就是「single-branch」的含义（图 1(c)）。共考察四个融合算子（图 2）：(1) 无权平均——融合输入为 w·相机 BEV + (1−w)·LiDAR BEV，w = 0.5；综合表现最好，为默认算子（变体名 SB-BEVFusion-Avg）。(2) 逐元素 Max-Pooling（SB-BEVFusion-MP）。(3) 交叉注意力——以 LiDAR 为 query、相机为 key/value，融合输入为 LiDAR BEV 加 γ 倍的注意力输出，γ 为可学标量门（SB-BEVFusion-CA）；注意这是非对称的：LiDAR 是锚，相机只被注意力读入。(4) Progressive Modality Decay (PMD)——融合输入为锚模态加 α 倍另一模态，α 在训练中由 1 衰减到 0，锚模态每样本轮换（SB-BEVFusion-D）；这是训练期课程，意图让模型渐进适应缺模态情形。训练策略（鲁棒性的主要来源）：可用性混合——对三状态算子，每样本枚举 {L+C, L, C} 三种状态（PMD 为两个锚定 pass），展开后的 epoch 全局打散，使每个 mini-batch 混合三种状态；下游只训 3 个 epoch（PMD 4 个）。上游编码器冻结，由与基线同配的检查点初始化，以隔离下游效应。有无质量/可靠性量：没有。全文不存在任何从数据推断模态健康度/可靠性的量：平均是固定 0.5 权重，max 是逐元素硬选，交叉注意力的 γ 只是全局可学标量（不是逐样本、逐模态的可靠性估计）。模态丢弃是结构性的恒等直通，前提是可用性已知；不存在「估计某路已坏并将其权重压低」的通路。

## 实验设置

数据集为 nuScenes（官方 train 850 / val 150 场景；6 路相机 + 32 线 LiDAR，丢弃 radar；LiDAR 累积前 10 个 sweep；10 个检测类）。指标 mAP 与 NDS，结果均在官方 val 集。损坏评测（表 1）：MultiCorrupt 基准在 nuScenes val 上施加 5 类损坏——LiDAR beam reduction（光束削减）、空间失准、时间失准、相机 fog、motion blur——每类 3 档严重度（s1–s3），施加于原始传感器流（BEV 投影之前）。除逐项 NDS 外报告 mRA（mean Resistance Ability）：损坏下 NDS 与干净 NDS 之比在 5 类 × 3 档上的平均。缺失评测（表 2）：三种可用性状态 × mAP/NDS。对照为 BEVFusion（经本文同样修改通道宽后重训的版本）与 UniBEV（CNW 融合）。口径注意：表 2 中的「仅相机/仅 LiDAR」行都是同一批融合模型在缺模态模式下的运行结果；全文没有与专门训练的单模态检测器（如纯 LiDAR 或纯相机检测器）的对照行。实现细节与官方 BEVFusion 配置一致，仅改三处——相机 BEV 投影宽对齐 LiDAR 通道（基线同改）、融合段替换为单分支模块、可用性混合训练。

## 关键数字

干净双模态（表 2）：SB-BEVFusion-Avg mAP 0.6737 / NDS 0.6970；BEVFusion 0.6691 / 0.7033；UniBEV 0.642 / 0.685。共享单分支 + 混合训练没有牺牲峰值：mAP 略高于拼接基线，NDS 略低。整模态缺失（表 2）：仅 LiDAR——SB-Avg 0.6448 / 0.6959，NDS 与自身双模态（0.6970）几乎无损；BEVFusion 0.5639 / 0.5361；UniBEV 0.582 / 0.653。仅相机——SB-Avg 0.2002 / 0.2440；BEVFusion 0.0109 / 0.1074（接近崩溃）；UniBEV 0.35 / 0.424，明显最好。非对称性显著：单分支的下限只在 LiDAR 侧成立。损坏（表 1）：综合 mRA——SB-Avg 0.7683（最高）> UniBEV 0.7656 > SB-MP 0.7592 > SB-CA 0.7537 > BEVFusion 0.7490 > SB-D（PMD）0.7313。相对拼接基线的提升只有约 +0.02，且所有方法随严重度都大幅退化。分项例（NDS）：beam reduction s3 以 UniBEV 0.3981 最高（SB-MP 0.3303，BEVFusion 0.3052，SB-Avg 0.3192）；fog s3 以 SB-CA 0.3740 最高；motion blur s3 以 SB-CA 0.5250 最高（BEVFusion 0.4991）。即平均融合赢在综合，单损坏类型上注意力/max 变体常更好。定性图 3：fog s3 与 motion blur s2 下 BEVFusion 漏检大目标，SB 保持检出，与定量趋势一致（仅定性，无数字）。

## 消融说明了什么

本文没有独立的消融表；融合算子对比（表 1）即事实上的消融。它说明：其一，不存在全域最优算子——作者结论亦承认最优算子依损坏类型而定；其二，拼接是次优的融合方式（干净时不差、损坏/缺失时最脆）。PMD 是一个干净的负结果：渐进衰减课程（mRA 0.7313）劣于未改的 BEVFusion 基线（0.7490），更远劣于硬性的状态枚举混合——软性衰减不如直接在训练中全枚举可用性状态。可用性混合训练本身没有被单独消融（无「单分支但只用 L+C 训练」的对照行），其贡献只能由与 BEVFusion 的整体对比间接承载；好在作者对基线施加了同样的通道宽修改、冻结同样的上游，归因相对干净，但仍非单变量。干净性能无代价这一点成立，是该配方可被低成本采纳的前提。

## 局限

其一，缺失处理的前提是 oracle 可用性：传感器是否缺失由外部标志给定。真实故障中更难的是「在场但静默退化」——本文对此无机制、无评测；损坏鲁棒性只是混合训练带来的平均耐受，幅度有限（mRA +0.02 量级）。其二，下限不对称：仅相机时（0.2002 mAP）远逊 UniBEV（0.35），恒等直通 + 共享分支并不保证每一路的下限；哪一路能「近无损接管」取决于该模态本身的信息量（LiDAR 几何主导）。相机侧的弱势作者归因于 UniBEV 在 BEV 投影前用了可变形注意力，属推测（原文用 conjecture 表述）。其三，无专用单模态检测器对照，故无法回答「融合结果是否不劣于最佳单模态模型」；表 2 的单模态行是融合模型自身的降级模式。其四，损坏全部为 MultiCorrupt 的合成损坏：beam reduction 属传感器层面的退化模型（削减光束数），fog / motion blur / 失准为模拟注入；无真实故障数据，无逐传感器的健康监测评测。其五，文表小不一致：正文称 SB-CA 对空间/时间失准 consistently superior，但表 1 中空间失准 s2/s3 实为 SB-Avg 更高（0.5110 / 0.4408 对 CA 的 0.4891 / 0.4215）；引用分项结论时以表为准。其六，作者自陈局限：只验证了相机 + LiDAR，radar 等其他模态的 BEV 化融合未测；且实验只训下游 3–4 epoch、上游冻结，结论限于此设定。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
