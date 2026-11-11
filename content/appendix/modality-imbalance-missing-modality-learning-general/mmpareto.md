---
title: "MMPareto: Boosting Multimodal Learning with Innocent Unimodal Assistance"
paper_id: "wei2024mmpareto"
authors: "Wei & Hu"
year: "2024"
venue: "ICML"
list: "appendix"
scope: "Reference"
section: "Modality Imbalance & Missing-Modality Learning (General)"
subsection: ""
fusion_level: "feature"
architecture: "Other"
tags: ["modality-imbalance"]
paper_link: "https://arxiv.org/abs/2405.17730"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Pareto-integrated gradients resolving multimodal/unimodal gradient conflict.

## 点评

全名 MMPareto: Boosting Multimodal Learning with Innocent Unimodal Assistance（ICML 2024，与 OGM-GE 同组）。整合对象是同一编码器上的两个目标梯度、不是模态间权重：框架 = 多模态损失 + 每模态一个单模态辅助损失；传统 Pareto（MGDA）有解析层面的系统性偏袒——多模态损失梯度幅值与协方差都更小、Pareto 恒给小幅值梯度更大权重、把 SGD 噪声协方差压小导致尖锐极小与泛化受损，故传统 Pareto 反而低于等权基线；MMPareto 按梯度余弦分情形：非冲突时退化为等权和，冲突时先取 Pareto 共同方向、再把幅值重标定并整体放大（γ=1.5）把噪声补回来。与 OGM-GE 的本质区别：OGM 在模态之间按贡献比调幅值（只压强模态、从不看方向），MMPareto 在同一参数的两个目标之间做方向合成 + 噪声修复；与 PMR 共享「加单模态辅助目标」前提，但 PMR 从未建模两目标在同一参数上的方向冲突（其表中 PMR 两数据集都低于等权基线、恰成旁证）。推理期什么都不剩（原架构原样跑，无权重、无门控、无模态健康量）；其表中的「单模态精度」是冻结编码器另训分类头的离线探测、不是模型真能输出的单模态预测，引用须带此口径、不可误读为「融合不劣于丢弃一路」的正面证据。缺失/损坏评测严格为零（唯一的噪声是训练/测试同分布的静态数据集构造）。模态平衡四件套至此集齐（OGM-GE 幅值 / PMR 损失 / ReconBoost 排程 / MMPareto 方向合成）：抓手互不相同，但共享三事实——干预全在训练期、评测全在干净完整模态分类、问题坐标里没有「测试时模态健康状态」这个变量，对下限判据是结构性的零贡献。它额外提供一个修辞支点：连训练期的「无害辅助」都会经梯度冲突反噬主目标（传统 Pareto 不如等权和），测试期把损坏证据原样喂入融合更谈不上自动鲁棒。

## 框架图

![MMPareto 方法主框图（原文 Figure 2）：多任务式框架下同一编码器的双路梯度与方向/幅值分开处理的整合规则](figs/mmpareto.webp)

*原文 Figure 2：左半「Multitask-like framework」示意每个单模态编码器同时承受多模态损失与单模态损失两路梯度；右半「MMPareto algorithm」以向量图分别示意非冲突情形的等权合成 g = g^m + g^u 与冲突情形下先取共同方向、再放大为最终梯度 h^MMPareto。图源：Wei & Hu, ICML 2024（arXiv:2405.17730）Figure 2。*

## 问题定义

出发点是不平衡多模态学习：只用多模态联合损失训练时，优化被易学模态主导，弱模态编码器训练不足。当时主流的补救是 multitask-like 框架（本文称之为 innocent unimodal assistance，无害的单模态辅助）：总损失 L = Lm + Σ_k L_k^u（式 1），即在多模态联合损失之外给每个模态再挂一个单模态辅助损失，强迫每个编码器单独学好。本文指认了这个框架里被忽视的病理：在每个共享的单模态编码器 θ^k 上，多模态损失的梯度 g^m 与该模态单模态损失的梯度 g^u 方向冲突——两者余弦相似度在训练中频繁为负（图 1a 的 Kinetics Sounds、图 4a 的 CREMA-D），且冲突多发于训练早期。等权相加时，单模态辅助梯度会把编码器往偏离多模态目标的方向拉，「无害的辅助」并不无害。更反直觉的是现成解法失效：多任务学习里处理梯度冲突的标准工具——传统 Pareto 整合（MGDA，Sener & Koltun 2018）——搬到这个框架后比等权相加的 uniform 基线还差（图 1c）。本文的问题就是：解释 Pareto 为何在多模态情形翻车，并给出修正版整合规则。问题坐标须钉死：这是纯训练期优化问题，全文没有测试时模态状态这根轴——无缺失、无损坏、无偏移协议。定位：「模态平衡」一族中的方向合成分支——不调梯度幅值、不改损失构成、不换训练排程，而是对同一编码器上的多模态梯度与单模态梯度做 Pareto 共同下降方向合成，再单独修复被 Pareto 压掉的梯度幅值与 SGD 噪声。作者组与 OGM-GE 同组（Wei 为 OGM-GE 作者之一），属组内谱系的自我推进。

## 方法细节

关键观察（Hypothesis 1）。多模态损失因为用上了全部模态的信息，天然比单模态损失「更容易学」（训练误差更低、收敛更快）；落到梯度上，对同一编码器，多模态梯度 g^m 的幅值更小、mini-batch 采样协方差也更小（图 1d、图 4b，两数据集上协方差差距可达 3 倍以上）。这一不对称是后面一切分析的支点。传统 Pareto 为何失败（§3.3.2–3.3.3）。Pareto 整合对每个编码器解 min ‖α^m g^m + α^u g^u‖²，s.t. α^m, α^u ≥ 0，α^m + α^u = 1（式 5），即在两梯度的凸包里找最小范数点，其方向是对所有目标共同的下降方向。由解析解可证：当 ‖g^m‖ < ‖g^u‖（即 Hypothesis 1 成立）时，传统 Pareto 恒给小幅值的多模态梯度更大的权重（Remark 1：α^m > 1/2）——它系统性偏袒已经更容易的那个目标。而真正的杀伤走 SGD 噪声通道：给两梯度按 2α 加权后，整合梯度的噪声协方差变为 (2α^m)²C^m + (2α^u)²C^u；当协方差比 k = C^u/C^m 且 1/2 < α^m < (3k−1)/(2k+2) 时，该协方差小于 uniform 基线的 C^m + C^u，即噪声强度被压小了。按 SGD 噪声—极小尖锐度的已知关系，噪声变弱 → 收敛到更尖锐的极小 → 泛化变差。图 5 的损失景观可视化与此同序：传统 Pareto 的极小最尖、测试误差最高。MMPareto 的修法（§3.4，Algorithm 1）：方向与幅值分开处理，按 cos β 分情形。非冲突情形（cos β ≥ 0）：任意凸组合都是共同下降方向，无需 Pareto 解；直接取等权和 2α^m = 2α^u = 1，即 h = g^m + g^u——与 uniform 基线完全相同，噪声强度原样保住。冲突情形（cos β < 0）：先解式 (5) 取 Pareto 共同方向，再把合成梯度的幅值重标定到 uniform 基线的幅值 ‖g^m + g^u‖（式 16）。由 Remark 1 可知 Pareto 合成幅值小于等权和幅值，故重标定因子 λ > 1，等于把被压掉的 SGD 噪声强度补回来（并放大）。两情形之后再整体乘一个重缩放因子 γ > 1（实验固定 γ = 1.5）进一步增强噪声。融合头等其余参数（θ_other）不做整合、普通更新；每个模态编码器独立执行同一流程。收敛性：Remark 2 + 附录 E 给出迭代序列收敛到 Pareto 平稳点的证明（作者在 Discussion 自承假设 relatively ideal）。梯度权重计算开销 0.05–0.16 s/iter（表 8），可忽略。与 OGM-GE 的本质区别：OGM-GE 在模态之间做幅值调制——按各模态对融合输出的贡献比 ρ，只缩放各编码器梯度的幅值（压主导模态、弱模态不动），再对梯度加高斯噪声（GE）防泛化掉点；它从不看同一编码器上两个损失之间的方向关系。MMPareto 在同一编码器的两个目标之间做整合：对象是 (g^m, g^u) 这一对梯度，先用 MGDA 求方向（方向合成），再从噪声统计出发修幅值。噪声观也不同：OGM-GE 的噪声是外加的正则；MMPareto 的噪声是 SGD 固有噪声，工作是「别把它压掉、还要放大」。与 PMR 的分界：PMR 在损失层操作（原型度量学习差距、对慢模态加原型交叉熵、对主导模态加熵正则），其辅助梯度按构造只回流本模态编码器，从未建模该梯度与多模态梯度在同一参数上的方向冲突；MMPareto 的全部对象正是这个冲突及其噪声后果。本文表 1 里 PMR 在两数据集上都低于 uniform 基线（带 ↓），恰是「加了辅助损失 ≠ 冲突已处理」的成表旁证。

## 实验设置

骨干：ResNet-18 从头训练 + 晚期融合（CNN 设定，表 1）；MBT 多模态 Transformer（含跨模态交互层），从头与带 ImageNet 预训练两档（表 2）；CG-MNIST 用 4 层卷积小网络。数据集（多模态部分全是分类）：CREMA-D（音视频情感，6 类）、Kinetics Sounds（音视频动作，31 类）、Colored-and-gray-MNIST（灰度 + 单色双视图）、ModelNet40（多视图 3D 形状分类）；附录 D 另有 CMU-MOSI 三模态情感（表 7）。多任务扩展：NYUv2 语义分割 + 深度估计（表 4）；MultiMNIST 左右双数字双任务，右半人为加 50% 椒盐噪声以拉大两任务难度差（表 5）。优化：SGD（momentum 0.9，lr 1e-3），γ = 1.5 固定。单模态精度（Acc audio / Acc video）的评测口径是冻结训练好的编码器、另行微调一个单模态分类头（借 Peng et al. 2022 的做法，表 1 注 *），不是模型推理时真能独立输出的单模态预测。对照：uniform 基线（多模态 + 单模态损失等权求和）、one joint loss（只有多模态损失）、Audio-only / Video-only 单独训练、Unimodal pre-trained & fine-tune、G-Blending、OGM(-GE)、Greedy、PMR、AGM；多任务整合方法另有传统 Pareto、GradNorm、PCGrad、MetaBalance。

## 关键数字

表 1（ResNet-18，CREMA-D）：多模态 Acc——MMPareto 75.13，G-Blending 72.01，uniform 基线 71.10，AGM 70.06（↓），OGM 69.19（↓），Greedy 67.61（↓），PMR 66.32（↓），one joint loss 66.13。单模态 Acc（冻结编码器探测）：MMPareto audio 65.46 / video 55.24；uniform 63.44 / 51.34；单独训练 Audio-only 61.69、Video-only 56.05。即 MMPareto 的 audio 探测精度超过单训模型（65.46 > 61.69），但 CREMA-D 的 video（55.24）仍低于 Video-only（56.05）。表 1（Kinetics Sounds）：MMPareto 70.13（audio 56.40 / video 53.05）vs uniform 68.31（53.20 / 40.55）——总增益 +1.82，主要来自弱模态 video 的探测精度 +12.50；且 audio、video 双双超过各自单训模型（53.63 / 49.20）。表 1 中最有分量的一行观察：OGM、Greedy、PMR、AGM 四个先行平衡方法在两个数据集上多模态 Acc 全部带（↓）——即全部输给什么整合都不做的 uniform 基线。「加单模态辅助损失」本身已吃掉这一族的大部分收益，多数再平衡方法反而负贡献；这是出自该族内部作者之手的成表证据。表 3（对多任务整合方法）：传统 Pareto 全面低于 uniform（CG-MNIST 62.00 vs 75.68；ModelNet40 88.05 vs 89.18；Kinetics Sounds 66.64 vs 68.31），证实其在多模态梯度不对称下系统性失效；MMPareto 三者皆最佳（81.88 / 89.95 / 70.13），相对 uniform 的增益分别为 +6.20 / +0.77 / +1.82。表 2（MBT Transformer）：MMPareto 八格全胜，但带预训练时领先收窄（CREMA-D Acc 70.43 vs uniform 69.89；Kinetics 70.28 vs 69.40）；OGM-GE 在从头训练时明显掉队（CREMA-D 42.88，甚至低于 one joint loss 的 44.96）。表 7（CMU-MOSI，三模态）：MMPareto Acc 76.53 vs uniform 75.95、PMR* 76.28——第一名但边际只有 +0.3~0.6。表 4（NYUv2，多任务扩展）：并非全胜——语义分割 mIoU 26.35 低于传统 Pareto 的 27.66 与 MetaBalance 的 27.04，只在深度估计上最好（Abs Err 0.6216）；其「可扩展到多任务」的说法应按此表打折引用。表 5（MultiMNIST）：MMPareto 87.72 / 80.64 仍最佳（uniform 86.63 / 78.42，传统 Pareto 86.95 / 77.04（↓））；但此处的椒盐噪声是训练/测试同分布的静态数据集构造，不是腐化评测（见局限）。机制侧数字：图 1d / 图 4b 显示多模态梯度与单模态梯度的 batch 采样协方差差距可达 3 倍以上，这是噪声压制分析能成立的经验前提。

## 消融说明了什么

本文没有独立的消融表；起消融作用的是 uniform → 传统 Pareto → MMPareto 这条三段对照链，结论有三。其一，方向冲突是真的、且 Pareto 的方向解本身没错：冲突情形下取共同下降方向确实必要（图 1a/4a 的负余弦不是噪声级现象）。其二，只修方向是有害的，幅值/噪声通道是承重的一半：传统 Pareto 的失败不是方向求错，而是它系统性偏袒小幅值梯度、把 SGD 噪声压弱、把模型送进尖锐极小。MMPareto 相对传统 Pareto 的全部改进来自幅值重标定 + γ 放大，即来自「把噪声补回来」，不是来自更好的方向。这也解释了为何非冲突情形它干脆退化为 uniform——没有冲突时，等权和本来就是对的。其三，图 5 的损失景观是理论链的直接可视化：三种方法的极小尖锐度排序（传统 Pareto 最尖 > uniform > MMPareto 最平）与测试误差排序完全一致，「噪声强度 → 平坦极小 → 泛化」这条链在本文内部自洽。归因上的缺口：γ 与幅值恢复（λ）没有单独的敏感性分析。γ = 1.5 是固定经验值，因此无法从原文区分：MMPareto 相对 uniform 的增益中，多少来自冲突步的方向修正与幅值恢复、多少来自最后那个 γ 放大——而 γ 放大原则上 uniform 基线自己乘一个也能得到。引用其增益时应带这一保留。总体量级：相对 uniform 的多模态 Acc 增益在 +0.8~+6.2 之间，且高度依赖数据集（ModelNet40 只有 +0.77）。

## 局限

其一，缺失/损坏评测严格为零（已核实）：全文无 missing / corruption / dropout 类协议（关键词核查无命中，robust 仅出现在引用他人工作处）。唯一的噪声是 MultiMNIST 右半的 50% 椒盐噪声——那是训练与测试同分布的静态数据集构造，目的只是拉大双任务的难度差以复现梯度不对称，不是测试时腐化协议，更不是模态级损坏：在那里「模态」甚至不是独立传感器，而是同一张图的左右两半。所有结论只适用于训练数据完整干净、测试分布不变的世界。其二，任务面窄：多模态实验全部为分类（音视频、多视图、情感），无检测；模态以两路为主，三模态只有附录一张表且边际很薄；多任务扩展（NYUv2）非全胜。其三，理论是启发式的：Hypothesis 1（多模态梯度幅值与协方差更小）是经验观察加直觉论证，非定理；噪声分析假设两损失梯度相互独立、协方差成固定比例 kC^m = C^u；收敛证明作者自承基于较理想的假设。cos β 是 batch 级随机量，冲突/非冲突的逐 iter 二分对噪声敏感，原文未做平滑或稳定性分析。其四，整合范围有限：整合只发生在每个编码器内部的（多模态，单模态）一对梯度之间，融合层与分类头（θ_other）不在整合之列；对「多模态损失 + 多个辅助目标」的一般多梯度情形，式 (5) 需升级为一般 MGDA 求解，本文只在三模态分类上做了附录级验证。其五，头条口径：「单模态精度超过单独训练的模型」中的单模态精度是冻结编码器 + 另训分类头的离线探测值，不是该融合模型在推理时真能给出的单模态预测，引用时须带此口径。

## 相关页面

- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
