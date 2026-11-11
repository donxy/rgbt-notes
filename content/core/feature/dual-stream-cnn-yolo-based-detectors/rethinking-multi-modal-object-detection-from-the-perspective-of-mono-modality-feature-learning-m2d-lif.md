---
title: "Rethinking Multi-modal Object Detection from the Perspective of Mono-Modality Feature Learning (M2D-LIF)"
paper_id: "zhao2025rethinking"
authors: "Zhao et al."
year: "2025"
venue: "ICCV"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Distillation"
tags: ["modality-imbalance", "distillation"]
paper_link: "https://arxiv.org/abs/2503.11780"
code_link: "https://github.com/Zhao-Tian-yi/M2D-LIF"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Identifies 'fusion degradation' from insufficient mono-modality learning in joint training; counters it with mono-modality distillation plus a local illumination-aware fusion module.

## 点评

A training-dynamics perspective distinct from weighting modules.

## 框架图

![M2D-LIF 方法主框图（原文 Figure 3）：上部 LIF 局部光照感知融合模块，中部 RGB 学生分支与检测头，下部训练期冻结教师骨干与单模态蒸馏模块](figs/rethinking-multi-modal-object-detection-from-the-perspective-of-mono-modality-feature-learning-m2d-lif.webp)

*原文 Figure 3：M2D-LIF 框架总览。上半部为 LIF 模块——RGB 图转 LAB 取 L 通道（池化后）作为亮度真值监督亮度预测支路（Conv 3×3 ×3 + Conv 1×1）输出亮度图 B，经 Weight Mapping 生成 W_V、W_I；中部为 RGB 学生分支——骨干提取特征 f_V，与 IR 特征在 LIF 处按 W_V⊙f_V + W_I⊙f_I 融合后送检测头；下部为训练期才有的冻结教师骨干（❄ 表示权重冻结），其特征与学生特征共同进入图中标注为 “MMD” 的 Mono-Modality Distillation 模块（应为 M2D；虚线 / 点线均为仅训练期通路）。图例：实线箭头为前向通路，红 / 蓝点线为仅训练期的监督与蒸馏通路，⊙ 为 Hadamard 积。因两分支结构对称，图中只强调 RGB 分支的处理流程，IR 分支省略。图源：Zhao et al. 2025, arXiv:2503.11780 Figure 3。*

## 问题定义

作者命名了一个现象——Fusion Degradation（融合退化）：某些目标单模态检测器能检出、多模态检测器反而漏检。作者在 LLVIP、FLIR、DroneVehicle 三个常用集上统计了该现象的案例数，称其在不同类型的多模态检测器中普遍存在。作者给出的成因解释是 mono-modality insufficient learning（单模态学习不充分）：多模态联合训练时，由于融合模块的存在，每个骨干网络的特征提取能力被限制，单模态表征没有被学足，于是融合的上限被单模态表征的质量拖住。因此核心研究问题不是“融合模块怎么设计”，而是“如何在联合训练中保证每个模态被充分学习”，并在此基础上配一个轻量、显式的互补融合。作者声称这是首次把线性探针评估引入多模态检测器、并从单模态学习视角重审多模态检测（MMOD）。

## 方法细节

框架 M2D-LIF 由两部分组成：训练期的 Mono-Modality Distillation（M2D）与推理保留的 Local Illumination-aware Fusion（LIF）。M2D：每个模态各有一个在单模态数据上预训练好的同模态编码器作教师，训练中冻结；学生是多模态检测器的双骨干，骨干均为 CSPDarknet53。模态内蒸馏让学生骨干的中间层响应对齐同模态教师；跨模态蒸馏先用无参数注意力 SimAM 从教师特征算显著目标注意力图作为位置先验，再用一个模态教师的注意力图同时掩膜另一模态学生特征与该教师特征做蒸馏——直觉是用跨模态一致的目标位置先验，逼学生骨干学“与目标相关”的特征。总损失为检测损失 + M2D 蒸馏损失 + LIF 光照损失。推理时教师骨干与全部蒸馏损失全部移除，只用学生双骨干 + LIF + 检测头——M2D 是纯训练期机制，零推理开销。LIF：一个小卷积块从 RGB 图像预测亮度图，用 RGB 转 LAB 后的 L 通道以 L2 损失监督；再由亮度图生成逐区域的权重图（与以往加权融合只给整图一个标量权重不同），融合为逐元素加权 W_V⊙f_V + W_I⊙f_I。关键性质：权重被公式显式夹住，最优 β=0.4 时任一模态权重只能在 [0.3, 0.7] 之间——构造上不允许把任一模态完全压掉。且 LIF 感知的“质量”只有 RGB 的局部光照（亮度），不感知模糊、噪声等其他退化，也不感知 IR 侧的质量（权重完全由 RGB 亮度决定，W_I 只是 1−W_V）。开销：LIF 相对基线只加约 +0.06M 参数、+6.5 GFLOPs。复现缺口（正文未给）：蒸馏距离的具体形式只写了“denotes the specific distillation method”，正文没有指明用哪一种；蒸馏与光照损失的权重、LIF 的阈值取值均未在正文报告；教师的预训练流程细节正文也未展开。

## 实验设置

数据集只有三个干净基准：DroneVehicle（28,439 对 RGB-IR，5 类车辆，旋转框 OBB；训练 17,990 / 验证 1,469 / 测试 8,980）、FLIR-aligned（5,142 对，训练 4,129 / 测试 1,013，person / car / bicycle 三类，去掉稀有 dog 类）、LLVIP（15,488 对严格对齐，训练 12,025 / 测试 3,463，低光行人）；全文没有 RGBT-Tiny、没有 M3FD。指标：mAP 指 COCO 式 mAP@[.5:.95]，另报 mAP50。实现：CSPDarknet53 双模态骨干；SGD（动量 0.937、权重衰减 5×10⁻⁴），学习率 1e-2 → 1e-4；测试置信度阈值 0.25；RTX 4090；消融默认在 DroneVehicle 验证集上做。退化 / 鲁棒性协议：无。全文没有任何模态损坏、模态缺失、噪声 / 模糊 / 曝光扰动的评测；Fusion Degradation 是在干净数据上定义与度量的现象（单模态能检出、融合漏检），不是损坏模态协议。LIF 处理的是干净数据内部天然的光照差异（LLVIP 本身是低光集、DroneVehicle 含昼夜），而非人为施加的退化。

## 关键数字

主结果：FLIR mAP 46.1、LLVIP mAP 70.8（此前最好：FLIR UniRGB-IR 44.3、LLVIP ICAFusion 64.3）；DroneVehicle 测试集 mAP50 81.4 / mAP 68.1、验证集 mAP50 84.5（此前最好 OAFA 测试 mAP50 79.4、CALNet 验证 mAP50 76.4）。参数量 36.5M（表 5）/ 37.1M（表 4），在多模态方法中属最少一档。与单模态对比：最强单模态（IR、YOLOv8m）FLIR 36.5 / LLVIP 58.9，M2D-LIF 高出约 +9.6 / +11.9——在其干净基准口径下融合显著优于单模态，Fusion Degradation 表现为个案级而非总体级。Fusion Degradation 统计（图 1 雷达图，读图近似，正文无数字）：统计量是“单模态检出、融合漏检”的案例数，按数据集 × 哪一侧单模态检出拆成 6 个轴；朴素相加融合（Naive Add）最严重（如 DroneVehicle-IR 轴约 870 例、DroneVehicle-RGB 约 630、FLIR-IR 约 460）；M2D-LIF 在每个轴上都是最少（分别约 750 / 530 / 320 量级），但没有归零。线性探针证据（图 2）：把单模态训练与多模态联合训练（Halfway Fusion / IWM / CMX 三种融合）得到的骨干冻结、接新检测头重训，FLIR 上三种融合的骨干探针结果都低于单模态训练的骨干——这是“单模态学习不充分”的直接度量；精确探针数值只在图 2 图表中，正文只给定性结论。

## 消融说明了什么

组件消融（表 2，基线 = Naive Add；三元组为 FLIR / DroneVehicle / LLVIP 的 mAP）：基线 43.5 / 66.9 / 68.2；+M2D → 45.1 / 69.2 / 70.7（+1.6 / +2.3 / +2.5）；+LIF → 45.0 / 68.5 / 69.4（+1.5 / +1.6 / +1.2）；两者都加 → 46.1 / 70.6 / 70.8（合计 +2.6 / +3.7 / +2.6），参数只从 36.47M 增至 36.53M、FLOPs 116.7G → 123.2G。M2D 的可迁移性（表 1）：M2D 是即插的训练方法，加到别的融合上也涨——CMX 43.8→44.1（FLIR）、IWM 44.0→44.9、LIF 44.9→46.1；三个集上趋势一致。LIF 权重消融（表 3）：直接拿归一化 L 通道当权重 44.2 / 67.4 / 70.2（FLIR 上甚至不如基线）；学权重但无 L 通道监督 45.0 / 69.8 / 70.3；有监督的完整 LIF 46.1 / 70.6 / 70.8——“学 + 监督”两者都必要。超参 β（图 4）：β=0.4 最好；作者明确写道 β 超过 0.8 后会引发 modality imbalance、性能严重下降——即权重允许的摆动幅度过大时，模态失衡会回来。

## 局限

正文没有独立的 Limitations 一节；作者明确承认的只有一条——β 过大（>0.8）导致模态失衡与性能骤降。其余据原文事实指出：(1) 只有干净基准：没有任何损坏 / 缺失模态评测。Fusion Degradation 的“缓解”只用干净数据上的案例计数与总体 mAP 佐证；当某一模态在推理时真的被损坏（如过曝、噪声、热成像故障）时，M2D 与 LIF 是否还成立，全文无证据。且 Fusion Degradation 案例数并未归零（图 1），只是减少。(2) LIF 的质量感知过于单一：只看 RGB 亮度。IR 侧质量完全不感知；RGB 的模糊、噪声、遮挡等非光照退化也不在感知范围内。且权重下限 0.3 的构造意味着：RGB 彻底失效的区域，融合仍强制保留至少 30% 的 RGB 特征。(3) 复现缺口：蒸馏距离未指明，关键损失权重与阈值未报告，更多消融在未随 arXiv 正文发布的补充材料里，本笔记未覆盖补充材料；线性探针与退化统计的精确数值只在图表中。(4) 正文与表格数字不一致（原文如此，引用时需小心）：正文称基线 FLIR 为 44.4，表 2 为 43.5；正文称 DroneVehicle 验证集 mAP50 为 85.2，表 4 为 84.5；参数量表 4 写 37.1M、表 5 写 36.5M（口径可能分别为 OBB 与普通检测配置，但原文未说明）。(5) 训练成本口径：推理只多 0.06M 参数的说法成立，但训练前需先训好两个单模态教师检测器，这部分成本不在其“轻量”叙事内。另注：本文并未评测 RGBT-Tiny（全文无 “Tiny”），个别对比表中出现的 M2D-LIF 在 RGBT-Tiny 上的数字只能出自引用方的对比表，引用时须标引用方为出处，不能标本文。图 3 中蒸馏模块被标成 “MMD”（应为 M2D），属图中笔误。

## 相关页面

- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
