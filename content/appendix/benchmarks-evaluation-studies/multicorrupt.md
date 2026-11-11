---
title: "MultiCorrupt: A Multi-Modal Robustness Dataset and Benchmark of LiDAR-Camera Fusion for 3D Object Detection"
paper_id: "beemelmanns2024multicorrupt"
authors: "Beemelmanns, Zhang, Geller, Eckstein"
year: "2024"
venue: "IEEE IV"
list: "appendix"
scope: "Related"
section: "Benchmarks & Evaluation Studies"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["benchmark", "corruption"]
paper_link: "https://arxiv.org/abs/2402.11677"
code_link: ""
doi: "10.1109/IV55156.2024.10588664"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：10 LiDAR-camera corruptions × 3 severities with Resistance Ability metric.

## 点评

全名 MultiCorrupt: A Multi-Modal Robustness Dataset and Benchmark of LiDAR-Camera Fusion for 3D Object Detection（RWTH Aachen)，是 SB-BEVFusion 所用 mRA 的来源基准。腐化分类学为 10 类 × 3 档、按作用模态分三组：仅相机 3 类（低光噪声、加亮、随机丢帧）、仅 LiDAR 2 类（随机丢点、降束 32→16/8/4——按传感器采样工作原理构造的几何退化）、双模态 5 类（时/空失准、运动模糊、雾、雪；雾/雪用同一套物理参数在点云与图像上成对生成、保场景一致）；相机侧仍是全图光度变换——两模态的故障建模深度不对称，热故障（条纹/NUC/坏点/饱和）在其分类学中无对应物。指标是相对保持率（RA = 腐化下指标 / 干净指标，mRA 为 10 类均值）——归一化掉了绝对性能，高 RA 不等于腐化下可用，引用须带此口径。伤情次序从 AV 侧独立佐证受损重于缺失：整路缺失（Missing Camera，RA 0.842–0.985）是最温和的一档，最伤的是雾、雪与降束——「两路在场但物理退化」与「一路在场但按工作原理劣化」都比「一路整体缺失」更伤。「紧耦合放大腐化」有成表证据（早期等权深度交互的 DeepInteraction mRA 最低、雾下相对劣势 −25%；靠模态专属并行分支 + 稀疏交换的 SparseFusion 与训练期随机缺失模态的 CMT 最稳），但被测 5 个模型全是融合模型、无单模态行、无晚期融合行——只能给融合架构间的相对脆弱性排序，不能引作「融合劣于丢弃一路」的直接证据。

## 框架图

![MultiCorrupt 主框图（原文 Figure 1）：十类腐化分类学总览与五检测器在干净/雪/雾下的 NDS 对照](figs/multicorrupt.webp)

*原文 Figure 1：(a) 十类腐化按作用模态（边缘标注 L / C / LC）连向 MultiCorrupt 中心节点的总览图，下半为 Fog 与 Snow 在三档严重度下的 LiDAR + 相机成对可视化拼图；(b) 五个检测器在 Clean、Snow 档 2、Fog 档 2 下的 NDS 柱状图。图注原文为「MultiCorrupt: A benchmark of state-of-the-art LiDAR-camera 3D detection methods under corruption」。图源：Beemelmanns et al., IEEE IV 2024（arXiv:2402.11677）Figure 1。*

## 问题定义

nuScenes 等干净基准上的融合检测器在真实部署中面对三类系统性扰动：传感器失准与标定漂移、采样频率不一致带来的时空失准、恶劣天气造成的遮挡与噪声。既有工作（尤其 LiDAR-camera 噪声工具包类先行工作）在数据加载时在线施加扰动，难以跨检测框架复用，且缺少成体系的天气腐化与严重度分档。本文的问题是：如何以一致、开源、可复现的方式量化融合检测器对多模态腐化的抵抗力，并从跨架构对照中反推出哪些融合设计选择（表示、对齐、融合机制）带来或损害鲁棒性。它是基准/数据集论文，不是方法论文：在 nuScenes 之上物化 10 类合成腐化 × 3 档严重度，评测 5 个 LiDAR–相机融合 3D 检测器，提出相对保持率指标 RA / mRA 与相对鲁棒性指标 RRA / mRRA；它只测「腐化下掉多少」，不提任何修复机制。数据生成代码与基准开源。

## 方法细节

腐化分类学（§III.A 与表 I）：10 类腐化按作用模态分三组，全部 3 档严重度。仅相机（3 类）：Darkness（Poisson–Gaussian 噪声模拟低光，强度参数 25 / 12 / 5）；Brightness（HSV 空间整体加亮，0.5 / 0.6 / 0.7）；Missing Camera（以概率 0.2 / 0.4 / 0.6 独立随机丢弃多相机帧，模拟时序丢帧）。仅 LiDAR（2 类）：Points Reducing（以概率 0.7 / 0.8 / 0.9 随机丢点）；Beams Reducing（把 32 束扫描降为 16 / 8 / 4 束保留）——这两类是按 LiDAR 采样工作原理构造的几何退化，不是光度滤镜。双模态（5 类）：Temporal Misalignment（以概率 0.2 / 0.4 / 0.6 施加冻结帧，模拟跨模态时间戳不同步）；Spatial Misalignment（外参旋转失准 1° / 2° / 3°，按同档概率施加于部分数据）；Motion Blur（标准差 0.06 / 0.10 / 0.13 的高斯抖动噪声同时作用于点云与图像，模拟运动、振动与滚动快门）；Fog（LiDAR 侧用物理雾模拟，并把其参数平移到图像雾生成以保持场景一致；近似能见度 300 / 150 / 50 m）；Snow（雪粒建模为不透明球体 + 湿地面光学反射模型，降雪强度 5 / 35 / 70 mm/h，两模态成对生成）。关键设计点：Fog / Snow 不是对两路各自独立套滤镜，而是用同一套物理参数在点云与图像上成对生成（scene consistency，场景一致性）；腐化由转换工具直接物化进数据集文件，而非训练/推理时在线注入，因此任何框架可直接取用。指标（§III.B）：基础性能用官方 nuScenes mAP 与 NDS。Resistance Ability：RA_{c,s} 为腐化 c、档位 s 下的指标与自身干净指标之比，逐腐化三档平均得 RA_c，再对 10 类平均得 mRA——是相对保持率，归一化掉了绝对性能差异。Relative RA：RRA_c 为某腐化下模型三档指标之和相对基线（本文以 BEVFusion 为 baseline）三档指标之和的相对差，mRRA 为其 10 类平均；正值表示相对基线更鲁棒。

## 实验设置

数据为 nuScenes（腐化施加于其验证集口径的数据），5 个被测模型全部使用公开权重、未在腐化数据上重训（零样本腐化评测）。被测融合检测器（表 II，干净 nuScenes 验证集 mAP / NDS）：CMT 70.28 / 72.90；SparseFusion 71.02 / 73.15；BEVFusion 68.72 / 71.44；TransFusion 66.72 / 70.84；DeepInteraction 68.72 / 69.09。架构对照维度（§III.C）：表示（BEV / BEV+图像特征）、对齐（投影 / 学习+投影）、融合机制（拼接、自注意力、交叉注意力、image-as-Q 的 Transformer 融合）。五者全部为深度融合（deep fusion）；BEVFusion 是唯一的非 Transformer 融合（拼接），并作为 RRA 的参照基线。协议内不存在单模态检测器，也没有晚期融合方法——「融合 vs 丢弃一路」的对比不在其评测范围内（见局限）。

## 关键数字

总排序（表 III 的 mRA，NDS 口径）：CMT 0.865 最高，SparseFusion 0.834，BEVFusion 0.830，TransFusion 0.824，DeepInteraction 0.795 最低。相对 BEVFusion 的 mRRA（表 IV）：CMT +7.161、SparseFusion +3.033、TransFusion −1.718、DeepInteraction −7.221。最伤融合的腐化（表 III 的逐腐化 RA_c，跨模型看）：Fog 最具破坏性——DeepInteraction 仅 0.583，其余四者 0.752–0.806；其次 Snow（0.748–0.833）、Beams Reducing（0.633–0.786，TransFusion 0.633 为该列最低）、Spatial Misalignment（0.685–0.809）、Temporal Misalignment（0.742–0.788）、Points Reducing（0.851–0.925）。最不伤的恰是相机侧的整路缺失与全图光度类：Missing Camera 的 RA_c 为 0.842–0.985，Brightness 0.937–0.993，Darkness 0.929–0.988。即在本基准内，「一路整体缺失」比「两路在场但物理退化（Fog/Snow）」或「一路按工作原理降采样（Beams）」温和得多。图 1(b) 的绝对量级：Snow 档 2 下五模型 NDS 由干净的 73 / 73 / 71 / 71 / 69 跌至 65 / 57 / 56 / 54 / 53；Fog 档 2 下跌至 65 / 63 / 60 / 60 / 48，其中 DeepInteraction 单格跌 21 个点为全图最大。「紧耦合放大腐化」的成表单格（表 IV，RRA 相对 BEVFusion）：DeepInteraction 在 Fog 为 −25.037、Missing Camera 为 −16.386、Darkness −7.215、Beams Reducing −6.361；其架构是两模态在早期以等权深度交互，原文 §IV.B 将其脆弱性明确归因于此（任一模态的噪声/干扰直达整体）。对照地，CMT 在 Spatial Misalignment 的 RRA 为 +17.053、Beams Reducing +18.642。单点失效模式（§IV.B 的定性分析，均有表 III 数值对应）：TransFusion 的 object query 仅由点云初始化，故一切 LiDAR 侧扰动（Motion Blur、Spatial Misalignment、Beams Reducing）对其打击异常强（Beams RA 0.633、Spatial 0.685，均为列最低或近最低）；BEVFusion 早期依赖投影矩阵，对 Spatial Misalignment 特别敏感（RA 0.705）。

## 消融说明了什么

本文没有方法消融，其「消融式」证据是固定腐化协议、只换架构的跨模型对照，结论（§IV.B 与 §V）可归纳为三条设计因子。其一，模态独立性是正因子：SparseFusion 用模态专属的并行分支各自独立检测、仅以稀疏信息交换 + 轻量注意力做最终预测，原文明确指出该设计使「一路输入被腐化对另一路的影响相对最小」，其 mRA 次优（0.834）、mRRA +3.033；CMT 以模态专属位置编码让两模态 token/查询保持独立空间，是其全项领先的结构原因之一。其二，训练期的模态随机缺失是正因子（初步）：CMT 训练含随机缺失模态（masked-modal / random missing modalities），结论节称 masked-modal training「似乎能提升鲁棒性」，但作者自己标注需进一步验证其跨架构适用性。其三，早期深度耦合与单模态依赖是负因子：DeepInteraction 的早期等权交互最脆（mRA 最低）；TransFusion 的纯点云 query 初始化、BEVFusion 的早期投影对齐分别是单点失效来源。结论节原文将鲁棒性受损因子归为「singular modality-dependant query initialization」（单一模态依赖的 query 初始化）与「deep coupling of multi-modal features early in the detection pipeline」（检测管线早期对多模态特征的深度耦合）。另，图 3 给出逐档 RA 曲线，多数腐化随档位单调恶化，可读退化曲线形状而非仅单点值。

## 局限

其一，只有相对保持率，没有下限对照：RA 把每个模型对自身干净性能归一化，高 RA 不等于腐化下绝对可用；且被测集合全是融合模型、无单模态行、无晚期融合行，因此「融合在腐化下是否反而劣于丢弃受损一路」这一判据在 MultiCorrupt 协议内根本未被测量——它能给的只是融合架构之间的相对脆弱性排序与设计因子归因。其二，腐化全为合成：Fog/Snow 依赖物理模拟近似（LiDAR 雾/雪模型 + 图像侧参数平移），与真实传感器（含热像仪）在雾雪中的响应仍有差距；数据只有 nuScenes 一个来源（单一城市域、32 束 LiDAR、6 路相机）。其三，两模态的故障建模深度不对称：相机侧退化以全图光度变换（Darkness/Brightness）与整帧丢弃为主，没有针对相机成像链路的故障级注入（如坏点列、读出噪声条纹）；LiDAR 侧则相反，做到了按工作原理的采样退化。热像仪特有的条纹噪声、非均匀性漂移、坏点阵列、热饱和在其 10 类中全部缺席。其四，被测模型只有 5 个且同属一个时代的深度融合范式；masked-modal training 的增益结论未做受控复现，作者自承待验证。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
