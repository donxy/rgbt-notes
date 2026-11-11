---
title: "Bridging Multimodal Fusion and Expert Routing via Spectral Reliability Descriptors for Robust Object Detection"
nickname: "SAFER-DEIM"
paper_id: "wu2026bridging"
authors: "Wu"
year: "2026"
venue: "arXiv"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer; DETR"
mechanisms: "Quality-Aware; Routing"
tags: ["quality-aware", "expert-routing", "degraded-modality", "aerial"]
paper_link: "https://arxiv.org/abs/2606.01173"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Parameter-free 7-D spectral reliability descriptors computed at fusion time drive both spectral reliability fusion (SRF) and reliability-conditioned expert routing (RCER) for RGB-infrared detection.

## 点评

在融合时刻计算的无参数 7 维光谱可靠性描述子，同时驱动光谱可靠性融合（SRF）与可靠性条件专家路由（RCER），面向 RGB–红外检测；在 DroneVehicle 上以六种合成退化与昼夜划分评测。

## 框架图

![SAFER-DEIM 方法主框图（原文 Figure 1）：上为整体管线（双分支 HGNetv2-B0，P4/P5 处 SRF 融合与 RCER 专家路由），下为 SRF 与 RCER 细节（7 维光谱可靠性描述子驱动门控与路由）](figs/bridging-multimodal-fusion-and-expert-routing-via-spectral-reliability-descriptors-for-robust-object-detection.webp)

*原文 Figure 1：SAFER-DEIM 总览。双分支 HGNetv2-B0 提取 RGB 与热红外特征 {P3,P4,P5}，在 P4/P5 处由 SRF（光谱可靠性描述子门控的融合）与 RCER（描述子复用的专家路由）处理，描述子在特征谱上一次算出、两处共享；后端接 DEIM 编码器与 D-FINE 解码器。图源：Wu 2026, arXiv:2606.01173。*

## 问题定义

常规 RGB–红外检测器只保留融合后的特征张量，融合过程中产生的“这次跨模态交互是否可信”的统计量被用完即弃；下游模块只能从融合内容本身间接猜可靠性，而内容复杂度与融合可靠性是两回事。失效往往不是语义难，而是低光、模糊、噪声、错位、单模态缺失导致的跨模态一致性塌陷——融合张量表面仍“像样”，路由器无从知道该不该信它。作者把问题重构为：融合时应显式暴露一个可复用的可靠性状态变量，并检验同一个状态同时驱动融合门控与融合后的专家路由，收益是否大于单纯堆专家容量。

## 方法细节

基座 DEIM/D-FINE，双分支 HGNetv2-B0 提 RGB 与热红外特征 {P3,P4,P5}，只在 P4/P5 插入新模块。(1) 光谱可靠性描述子：在特征空间（非原图）对对齐后的双路特征做二维实 FFT，半径阈值 0.25 只分低/高两频带，无参数算出 7 个标量——分带能量 E、幅度比 A、相位一致性 P 与全谱幅度 Pearson 相关 ρ；再经 stop-gradient + LayerNorm 固定为对当前输入对的“测量”，不被检测损失扭曲。(2) SRF 融合：局部分支（双路均值的深度卷积）作保守基底，光谱残差分支做频域交互（低频均匀平均、高频按幅度自适应加权、逆 FFT 回空间域）；逐通道门只看描述子、不看内容，在光谱特征与双路均值（保守回退）之间混合——一致性强多用光谱分支，退化时自动退回均值。(3) RCER 路由：把同一个描述子与融合特征的 GAP 拼接为路由输入，对 Texture / Saliency / Recovery 三个任务专家做 top-2 稀疏选择（另有共享专家恒开），专家分工与描述子线索的对应在文中明示（如 ρ 与 P_high 同低 → Recovery）。全模型 19.8M 参数、17.2 GFLOPs，描述子抽取仅 0.3 ms。

## 实验设置

M3FD、DroneVehicle、FLIR-Aligned 三个 RGB-IR 配对集（辅助模态热图经 min-max 归一化与 RGB 同分辨率）。关键的鲁棒性协议在 DroneVehicle 上：六种合成退化各自独立、每种只取一个强度——模糊（高斯 k=7/σ=2.0，双路）、低光（亮度 ×0.35，仅 RGB）、加性噪声（σ=0.08，仅 RGB）、模态丢弃（丢热红外一路）、错位（热红外平移 10 / 20 px）；指标为保持率 Retention = 退化 mAP50 / 干净 mAP50，另以 DroneVehicle 自带昼/夜划分作自然对照。受控消融同配方、5 种子均值±标准差。

## 关键数字

上下文成绩（表 2 为转录异配方、作者明示只作定位）：M3FD 90.3 mAP50 / 62.1 mAP、DroneVehicle 80.5 / 62.0、FLIR-Aligned 85.8 / 46.5。主证据在受控消融：M3FD 上拼接基线 84.5 → 固定插值最高 86.5 → 内容门控 87.2 → 描述子门控（SRF）87.8；2×2 析因显示换路由信号（+0.7~0.9）的边际收益大于换专家结构（+0.6~0.8）。保持率：拼接基线平均 87.9%（干净 75.5）→ 全模型 95.0%（干净 80.5）；逐项（全模型）模糊 96.0%、低光 97.9%、噪声 95.4%、模态丢弃 90.9%、错位-10 96.6%、错位-20 93.4%，其中模态丢弃相对内容路由 +6.7pp 为最大单项增益。描述子分量里 ρ 最重要（去掉 −1.1 mAP50、保持率 −2.5pp），其次 P、A；随机 7 维向量只 +0.1、跨样本打乱描述子 +0.4——收益来自逐样本对齐的可靠性语义，不是多给特征。自然对照：昼 83.2 / 夜 76.8（基线 78.0 / 71.5）。

## 消融说明了什么

三点最有信息量：同一可靠性测量被融合与路由复用时收益大于单独任一处使用（“复用”本身是贡献）；可靠性信号的质量比专家容量更值钱（析因结论）；描述子的退化指纹可验证——模糊使高频能量约减半（−51%）、噪声最强压低高频相位一致性（−59%）、错位同时压低 P_high（−56%）与 ρ（−44%）、低带变化 ≤4%，说明这 7 个标量确实测到了退化类型而非黑箱代理。

## 局限

作者自承：二值频带划分 + 全局 Pearson 相关刻画不了空间非平稳（局部可靠性不同）的情形；更广的自然鲁棒性基准超出本文范围。证据结构上：主鲁棒性证据正文只来自 DroneVehicle 一个数据集、六种退化在正文各只有一个强度点；补充已核实三档强度扫描（S5）与错位/衰减两条连续扫描（S27/S28），同一协议亦复现于 M3FD 与 FLIR-Aligned（S8）；补充有五种复合腐化（含热红外衰减 λ=0.5/0.25 + 平移），但复合均耦合一致性损伤与单路质量损伤，两路独立同时受损仍未测；没有遮挡类退化。错位只测整数像素平移这一理想化形式；表 2 的跨方法对照是异配方转录、作者自己限定只作上下文。描述子是全局量——一路局部受损（如画面一角过曝）时全局统计会被平均掉。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
