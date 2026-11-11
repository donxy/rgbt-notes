---
title: "BAANet: Learning Bi-Directional Adaptive Attention Gates for Multispectral Pedestrian Detection"
paper_id: "yang2022baanet"
authors: "Yang, Qian, Zhu, Wang, Yang"
year: "2022"
venue: "ICRA"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["pedestrian", "quality-aware"]
paper_link: "https://arxiv.org/abs/2112.02277"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Bi-directional adaptive attention gates progressively distil modality-specific noise and recalibrate both streams, with illumination-based weighting of interaction strength.

## 点评

双向自适应注意力门：通道门由两模态联合 GAP 统计经 MLP+sigmoid 生成、乘到供体特征上残差注入对方；空间门由已互注特征拼接过 1×1 卷积生成单通道图；四级（Stage 3–6）重复，无质量真值监督。光照子网络以采集时刻监督昼/夜二分类，输出整图零和标量对，同时调注入强度与最终分数融合。仅 KAIST 干净基准：MR⁻² All 7.92 / Day 8.37 / Night 6.98，0.07 s/图。无退化/缺失评测；门控只能调「加多少对方」、不能调「留多少自己」，本路特征无条件保留。

## 框架图

![BAANet 方法主框图（原文 Figure 2）：双流 ResNet-50 多级嵌入 BAA-Gate 与光照子网络、级联检测头总览](figs/baanet-learning-bi-directional-adaptive-attention-gates-for-multispectral-pedestrian-detection.webp)

*原文 Figure 2：BAANet 总体架构。左/中为特征提取部分：RGB（上，蓝色）与 TIR（下，橙色）双流自 Stage 2 到 Stage 6，每级之间嵌入一个绿色 BAA-Gate，双向箭头表示两路特征互相蒸馏与重校准后以残差相加进入下一级，多级特征以虚线送往检测头；左下为光照子网络：两路原图 Resize 后各过两层卷积、拼接过全连接输出 w_R / w_T；右侧为检测头：双路多尺度特征依次经 First Anchor Proposal Stage、Modality Alignment、Second Anchor Proposal Stage，最终检测结果按 w_R / w_T 加权两路分数。图源：Yang et al., ICRA 2022（arXiv:2112.02277），Figure 2。*

## 问题定义

本文把多光谱行人检测的困难定义为模态特有噪声（modality-specific noise）在网络传播中被叠加放大，外加两模态的本质差异（图 1）：RGB 在弱光下传感器感光受限，不同目标呈现相似外观、难以分辨；TIR 中温度相近的物体容易与周围环境混在一起，且红外相机分辨率有限、缺乏纹理与精确边缘。作者认为，既有方法或把 TIR 直接注入 RGB 框架、或简单集成两路结果，噪声会随传播污染融合特征、导致检测失败；而多数工作只处理「两模态如何统一表征」，没有处理噪声本身。本文的目标因此是在融合过程中逐级蒸馏（distill）掉两路各自的噪声、再用蒸馏后的特征互相重校准（recalibrate），并让交互强度随光照自适应。须注意问题落点：这里的「噪声」是干净配对输入上由成像机理带来的自然表征缺陷（弱光外观混淆、同温物体混淆），是概念性/定性的问题陈述——全文没有把「某一路传感器在测试时被人为损坏/污染」设为问题，没有噪声注入、损坏或缺失的任何实验设定。光照变化是全文唯一的条件轴，且只以昼/夜二分出现。阅读依据：arXiv:2112.02277 v1 全文通读。

## 方法细节

BAANet = 双流 ResNet-50 特征提取（Stage 2–6）+ 嵌入多级的 BAA-Gate（双向自适应注意力门）+ 光照子网络 + 级联检测头（ALFNet 式级联双阶段锚框提议）。BAA-Gate 在每个融合级重复执行，先做通道蒸馏、再做空间聚合，双向对称。（1）通道蒸馏：把两路输入特征拼接后做全局平均池化，得通道描述子 v_c——它来自两模态的联合全局统计，不是被门控模态自己的统计、也不是任何外部质量信号；v_c 过 MLP + sigmoid 得蒸馏权重（每通道一个标量、全空间共享，取值 (0,1)），乘到供体特征上，再以残差相加形式重校准对方。门控只受最终检测损失监督，无任何噪声程度/质量真值监督，也无与真实退化量的相关性验证——形式上是 SE/CBAM 式的跨模态通道注意力，「用高置信激活压低置信激活」只是作者的叙事，权重本身学的是对检测损失有用的通道重标定。（2）空间聚合：把双向重校准后的两路特征拼接，过 1×1 卷积得单通道空间门（逐像素一个标量，两模态共用一张空间图的互补形式），同样来自已重校准特征本身、无外部信号。（3）光照加权——全文唯一有显式监督的自适应量：子网络把 RGB 与 TIR 图都缩到 56×56，各过 2 层卷积后拼接，过 2 层全连接 + softmax 输出昼/夜概率 (w_D, w_N)，以采集时刻的昼/夜真值用交叉熵监督训练，本质是受监督的二值昼/夜分类器，不是连续照度或质量测量；经非对称修正 sigmoid 得全局标量权重对 (w_R, w_T)（白天变化平缓、夜间 w_R 急剧下降，且恒有 w_T = 1 − w_R，零和），被用在三处：通道蒸馏的跨模态注入强度、空间聚合强度、以及最终检测分数融合。（4）其余结构：多级 BAA-Gate 使两路特征在 Stage 3–6 间渐进地互相蒸馏/重校准并保留各自特异性；检测头为第一锚框提议阶段 → DCN 模态对齐模块（缓解弱对齐）→ 第二锚框提议阶段，框回归量逐级相加。总损失含光照交叉熵与两阶段的分类（focal，α=0.25、γ=2）/回归（smooth L1）损失。结构上的硬事实：所有跨模态注入都是残差相加——本路特征永远原样通过，门控只能调节「对方注入多少」，没有任何通路能把本路自身的特征压低或归零；被蒸馏的是「作为供体注入对方的那一份」。

## 实验设置

数据集只有 KAIST 一个（95,328 对齐 RGB-T 对、1,182 名行人、103,128 个框）：训练用 Zhang et al.（AR-CNN）的改进标注，测试用 Liu et al. 的改进标注；测试集 2,252 对（白天 1,455 / 夜间 797）。指标为 reasonable 子集（身高 ≥55 px、无/部分遮挡）上的 log-average Miss Rate MR⁻²（FPPI ∈ [10⁻², 10⁰]），另报九个子集（All / Day / Night × 尺度 Near/Medium/Far × 遮挡 None/Partial/Heavy）。实现：Adam，lr 1e-4，batch 8，仅训 8 epoch；两提议阶段训练 IoU 阈值分别为 {0.3, 0.5} 与 {0.5, 0.7}；锚框比例 0.41；卷积层 Xavier 初始化；单张 GTX 1080 Ti 测速。对照十种方法（ACF、Halfway Fusion、Fusion RPN+BF、MSDS-RCNN、IAF R-CNN、IATDNN+IASS、CIAN、AR-CNN、CFR、MBNet），数字为各原文转引。没有的设置（核查结论）：无 FLIR/LLVIP/CVC-14 等第二数据集；无 RGB-only / TIR-only 单模态臂；无任何人为退化、噪声注入、模态缺失或传感器故障实验；昼/夜子集是自然采集划分，不是受控退化。

## 关键数字

KAIST reasonable，MR⁻²（表 I，越低越好）：BAANet All 7.92 / Day 8.37 / Night 6.98，总分第一（次好 MBNet 8.13 / 8.28 / 7.86）；九子集中七个第一，例外是 Day 子集 MBNet 8.28 略优于 BAANet 8.37。分项：尺度 Near 0.00 / Medium 13.72 / Far 51.25（Far 比次好 CIAN 55.82 低 4.57 点，是全文最大的单项优势）；遮挡 None 25.15 / Partial 34.07 / Heavy 57.92，均为表内最佳。夜间读法：Night 6.98 比 MBNet 7.86 低 0.88、比 AR-CNN 8.38 低 1.40；BAANet 是表内少数 Night 优于 Day 的方法（6.98 vs 8.37）——但这只是自然昼/夜划分上的结果，不是受控退化曲线。速度（表 II）：0.07 s/图（1080 Ti），与 CIAN、MBNet 并列最快，远快于 MSDS-RCNN 0.22、AR-CNN 0.12。全文没有单模态行：无法从本文读出「融合 vs 任一单模态」的差值，也没有任何把任一路关掉/损坏的结果。

## 消融说明了什么

组件递进（表 III，KAIST reasonable MR⁻²）：简单拼接基线 All 10.62 / Day 11.05 / Night 9.42 → + BA-Gate（无自适应交互）9.44 / 10.49 / 7.45 → + 光照加权 8.22 / 8.61 / 7.66 → + 模态对齐 DCN（完整）7.92 / 8.37 / 6.98。BAA-Gate 本体贡献最大（All −1.18，Night −1.97）；光照加权再降 All 1.22 点，但 Night 反而从 7.45 升到 7.66——中间配置下光照加权的收益主要在白天，夜间略有反噬，直到加上 DCN 对齐才把 Night 拉到 6.98，引用「光照加权提升夜间鲁棒性」时须注意这个非单调细节；DCN 对齐单独贡献 All −0.30 / Night −0.68，是三件中最小的一步。消融的边界：只拆了三个大组件，没有拆通道蒸馏 vs 空间聚合、没有门控可视化或门值与噪声程度的相关性分析、没有 k1/k2 敏感性、没有去掉光照监督（改用无监督权重）的对照——「门控确实在按噪声程度工作」这一机制主张在消融层面没有直接证据，增益也可以由「多级跨模态残差交互本身」解释。

## 局限

（1）退化/缺失评测为零（逐项核查）：全文不存在 corrupt / degrad / missing 类设定；唯一的「噪声」是问题陈述中成像机理带来的自然表征噪声（图 1 定性示意），没有被操作化为任何可控实验变量；昼/夜拆分是自然分布，不是退化协议。因此本文对「一路被损坏时融合会怎样」不提供任何证据。（2）门控是内容注意力，不是质量估计：通道门来自两模态联合 GAP 统计过 MLP+sigmoid、空间门来自重校准特征拼接过 1×1 卷积，两者都只受检测损失监督，无质量真值、无校准验证；门值高低与该模态当下是否受损之间没有被测过的对应关系。且通道门的输入是两模态拼接后的联合统计——某一路被污染时，它自己的全局统计先被污染、再经 MLP 生成门值，且 GAP 把空间信息全压掉，局部损坏在通道描述子里会被平均稀释；空间门的输入是已经互相重校准过的特征，第一步注入若已带入污染，第二步的门就在污染后的特征上计算，多级（Stage 3–6 共四级）重复这一过程、无任何一级有外部锚点纠偏。（3）光照权重是粗粒度的零和全局标量：整图一对 (w_R, w_T)、w_T = 1 − w_R，索引的是昼/夜类别而非任一路的实际健康状态——白天发生的热相机故障、黄昏/人工照明等昼夜分类器本身失效的情形，机制上都无信号；其监督标签（采集时刻）是场景先验，不是样本级测量。（4）结构上不能弃权：跨模态注入是残差相加，本路特征恒原样通过，门控调的是「对方注入强度」，不存在把一路特征整体压零的通路；被污染的供体特征既会经通道门注入对方、也以重校准特征的形式继续在本流内传播，双向结构在此不是隔离机制，而是双向传播通道。（5）评测面窄：单一 KAIST 数据集、单一 MR⁻² 指标、仅 8 epoch 训练；对照数字为转引而非同协议重跑；正文称表 III 比较「五个版本」但表中只有四行，属原文小不一致，引用以表为准。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 对比表：[[compare|REQ-04 四维对比表]]
