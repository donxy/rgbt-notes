---
title: "InfraNet: Quality-Aware RGB Guidance for Infrared Object Detection"
nickname: "InfraNet"
paper_id: "feng2026infranet"
authors: "Feng, Zhu, Yang, Xu, Ren, Yang, Liu, Zhang, Wang, Yang, Zhang"
year: "2026"
venue: "ECCV"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["quality-aware", "missing-modality"]
paper_link: "https://eccv.ecva.net/virtual/2026/poster/3873"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "Unknown"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：IR-centric asymmetric detector whose QualGate module learns a task-oriented control signal to suppress unreliable RGB guidance during cross-modal training; supports RGB-IR or IR-only deployment.

## 点评

Evaluated on LLVIP, FLIR-Aligned, M3FD and DroneVehicle, including low-light and adverse-weather conditions.

## 框架图

![InfraNet 方法主框图（原文 Figure 2）：InfraNet-IR 总览——IR 主路（黑）与 RGB 辅路（蓝）在三个融合位点 A3/A4/A5 经 QualGate 交互，推理时只保留 IR 通路](figs/infranet-quality-aware-rgb-guidance-for-infrared-object-detection.webp)

*原文 Figure 2：InfraNet-IR 总览（以 YOLOv9 组件示范）。训练时 IR 主路（黑）与 RGB 辅路（蓝）在三个融合位点 A3/A4/A5 经 QualGate 交互：标量 q 同时压低 RGB 贡献并反向放大 IR；推理时 RGB 支与融合算子全部删除，只剩 IR 通路出结果（图中 IR-Only Results）。图源：Feng et al., ECCV 2026（arXiv:2607.03795）。*

## 问题定义

传统 RGB-IR 融合在训练与推理时都对两路一视同仁、且推理必须双模输入；但 RGB 在低光、眩光、恶劣天气下会严重退化（全黑、噪声、无结构），无差别融合会把噪声注入本来可靠的 IR 特征，造成负迁移、反而拉低检测——作者用 M3FD 夜间样本的特征可视化佐证：CFT、FusionMamba、WaveMamba 融合后的特征噪声比纯 IR 特征还多。因此问题被重新定义为非对称的：怎样只在 RGB 可靠时借用它来塑造 IR 表示，不可靠时自动切断其污染，并且在部署端允许 RGB 完全缺席。这与特权信息（LUPI）/知识蒸馏一脉相承，但作者强调那些范式假设特权信息固定可靠，不处理模态可靠性随样本变化的问题。

## 方法细节

核心是 QualGate——一个标量管两条路。可靠性分数 q∈(0,1) 由辅助特征经全局平均池化 + 两层瓶颈 MLP + sigmoid 得到，没有任何质量标注监督、只由检测目标学出；作者反复强调 q 是任务导向的控制信号，不是手工图像质量指标的估计器。RGB 抑制路：辅助贡献的权重直接取 w_rgb=q，即以 q·A_in 注入，q 小则 RGB 指导被压低。IR 放大路：对 IR 流施加反向增益 α(q)=clip(1.5−q; 1.0, 1.5)，RGB 越不可靠、IR 补偿越强；常数 1.5 只是默认的非抑制式补偿规则，作者不声称其最优。架构非对称：主路 IR 提取多尺度特征 {P3,P4,P5} 供检测，辅路 RGB 只经轻量 stem + 一个模块提取基础特征，在三个融合位点由 QualGate 做质量感知交互（每尺度 IR 特征另经内容门 g_k 调制）；训练损失不对称加权 L = L_det(main) + 0.25·L_det(aux)。两个独立训练的变体：InfraNet-IR 训练用 RGB-IR 配对、RGB 作特权指导，推理只用 IR（RGB 辅路与全部融合算子删除，只留 IR backbone-neck + 检测头，零额外部署开销）；InfraNet-RGB-IR 训练与推理都双路，QualGate 在推理时继续调节跨模态交互。

## 实验设置

LLVIP（15,488 对，行人）、FLIR-Aligned（5,142 对）、M3FD（4,200 对，6 类）、DroneVehicle（28,439 对）四个集；横跨 ResNet50 与 YOLOv5/v8/v12 等多种骨干。训练：单张 RTX 4090、300 epoch、SGD（动量 0.937、权重衰减 5e-4）、余弦学习率 1e-2→1e-4、batch 32；指标 mAP50 与 mAP；文中未报告多次运行的均值/方差。受控退化协议只有一处（LLVIP）：只退化 RGB、IR 输入固定不变，类型只有雾（Fog）与亮度（Brightness）两类，强度 0.2–1.0 共五档（等级无物理定义），同表并列 Naive 对照（强制 q≡1、关掉可靠性控制）；其余“低光/恶劣天气”证据来自数据集天然场景子集（如 M3FD 的 Night 子集）。

## 关键数字

LLVIP（YOLOv8）：RGB-IR 版 98.1 mAP50 / 70.5 mAP、IR 版 97.3 / 68.8，对照 WaveMamba（YOLOv8）98.3 / 66.0——mAP50 略低、mAP 高 4.5 点。FLIR-Aligned（YOLOv8）：RGB-IR 版 89.4 / 55.2（54.3M，13.4 ms）、IR 版 88.5 / 54.0（28.2M，12.5 ms）。DroneVehicle（YOLOv8）：RGB-IR 版 85.0 / 64.9、IR 版 84.0 / 63.4。部署灵活性（M3FD）：纯 IR 基线 84.8 / 57.2（28.2M，12.5 ms）；InfraNet-IR 86.2 / 59.0——参数与耗时与基线完全相同，只换训练方式即 +1.4 / +1.8；InfraNet-RGB-IR 89.9 / 64.0（+5.1 / +6.8）。退化保持率（原文未报，由退化表与干净值换算）：最重档 level 1.0 下雾 mAP 保持约 98.5%、亮度约 96.5%；表内读法更稳妥：从 0.2 到 1.0，雾下本文 mAP 67.6→67.8 基本不掉，Naive 同期 66.9→61.8——QualGate 主要在雾退化下把 Naive 约 5.1 点的损失基本抹平。学到的 q：雾加重时仅从 0.441 缓降到 0.434（动态范围约 0.007），亮度扰动下反而从 0.459 微升到 0.484。

## 消融说明了什么

QualGate 拆解（LLVIP，YOLOv8，InfraNet-IR 设置）：完整 QualGate 97.3 / 68.8；去掉 IR 放大 97.1 / 67.2；去掉 RGB 抑制 97.1 / 68.4；Naive（q≡1）96.9 / 67.7——增益来自“抑制 + 放大”的联合调制，而非泛泛的特征重加权；把 QualGate 换成 CAGF / CRLM 分别只有 95.7 / 66.8 与 96.9 / 66.7，用伪 RGB 指导训练为 95.2 / 64.9。辅助损失权重最优在 0.25（mAP 68.0 / 68.2 / 68.8 / 68.3 / 68.1 对应 w_aux 0 / 0.1 / 0.25 / 0.5 / 1.0）。但 q 的实测动态范围很小（雾下仅约 0.007），性能稳定性有多少来自 q 本身、多少来自 IR 主路架构，靠 Naive 对照也只能部分分离。

## 局限

正文没有独立的 Limitations 章节；散见的自我限定有：q 不是感知图像质量指标、亮度扰动下其行为本就不打算对应直观质量；α(q) 中 1.5 这一常数不声称最优；M3FD 子集表只作诊断性对照、非完整 SOTA 排名；可靠性粒度、融合位置、放大范围等关键分析被放进 supplementary，正文未给。实在的缺口：受控退化只动 RGB、只有雾与亮度两类且等级无物理定义（无雾浓度/亮度公式，无法按原文复现）；IR 自身退化、双路同时退化、噪声/模糊/遮挡均未测；没有按缺失率变化的模态缺失曲线——InfraNet-IR 的“推理无 RGB”是架构设定而非缺失鲁棒性评测，反方向的 IR 缺失完全不在设定内（IR 是主路）。所有主表均为单值、无重复运行误差线，0.2–0.4 量级的小差距无法判断显著性。另注：M3FD 子集表中老融合基线与本文差距异常大（约 59–84 对 81–99.5），引用时必须连同协议口径一起说。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
