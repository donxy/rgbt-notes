---
title: "CD-Buffer: Complementary Dual-Buffer Framework for Test-Time Adaptation in Adverse Weather Object Detection"
nickname: "CD-Buffer"
paper_id: "song2026cdbuffer"
authors: "Song, Kim, Hwang"
year: "2026"
venue: "CVPR"
list: "appendix"
scope: "Reference"
section: "Test-Time Adaptation, Intervention & Amortized Optimization"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["test-time-adaptation", "corruption"]
paper_link: "https://openaccess.thecvf.com/content/CVPR2026/papers/Song_CD-Buffer_Complementary_Dual-Buffer_Framework_for_Test-Time_Adaptation_in_Adverse_Weather_CVPR_2026_paper.pdf"
code_link: "https://github.com/wkfsksdl99/cd_buffer"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Couples the additive (feature refinement) and subtractive (domain-sensitive channel pruning) test-time adaptation paradigms in a complementary dual-buffer framework, balanced per channel by a unified feature-level discrepancy measure.

## 点评

把加性（特征精修）与减性（域敏感通道剔除）两种测试时自适应范式耦合进互补双缓冲框架，按统一的特征级差异度量逐通道平衡；单模态可见光恶劣天气检测（KITTI、Cityscapes、ACDC）的检测 TTA 参照（CVPR 2026 Highlight, pp. 15050–15059）。

## 框架图

![CD-Buffer 方法主框图（原文 Figure 2）：左侧为源/目标特征统计与通道级域差异 D，右侧为互补双缓冲块（加性缓冲与减性缓冲）细节](figs/cd-buffer-complementary-dual-buffer-framework-for-test-time-adaptation-in-adverse-weather-object-detection.webp)

*原文 Figure 2：CD-Buffer 框架总览。Faster R-CNN 骨干的瓶颈块上挂互补双缓冲块：通道级域差异 D（源—目标特征统计距离）一方面经差异加权正则驱动减性缓冲的通道掩码（剪除偏移重的通道），另一方面其掩码分数反转成逆软掩码、决定加性缓冲适配器对各通道的补偿强度——同一把偏移尺子同时管剪与补。图源：Song et al., CVPR 2026（arXiv:2603.26092）。*

## 问题定义

晴空训练的检测器在雾、雨、雪等恶劣天气下因散射、遮挡与能见度下降出现显著域偏移，离线域适应又需要预先收集目标域数据或重训练，不适合动态驾驶场景。作者进一步指出一个被已有检测 TTA 忽视的结构性问题：加性路线（插入轻量适配模块做特征修正）与减性路线（剪除域敏感通道）各只在一段偏移强度内有效——重偏移时特征已严重损坏、修正救不回来，减性剪除反而有效；中等偏移时特征只需微调，加性修正占优、剪除则误删可挽救信息。且同场景内不同通道的偏移程度本就异质，已有方法却对所有通道一视同仁。因此核心问题是：能否用一个统一的特征级偏移度量，按通道自动配比“剪除”与“补偿”。

## 方法细节

框架以 Faster R-CNN（ResNet-50）为基座，在骨干瓶颈块上同时挂两个由同一差异度量驱动、方向相反的缓冲。(1) 通道级域差异 D：离线预计算源域的图像级特征均值与 RoI 对齐得到的实例级特征均值，测试时逐通道算当前批次目标特征与之的 L1 距离、两路归一化后相加；D 越大表示该通道偏移越重，D 本身不参与求导、只作调度信号。(2) 减性缓冲：每通道设可学习掩码分数（初值取 BN 权重幅值），其 L1 正则按 D 加权——偏移越重的通道受到越强的分数压低压力、越容易跌破全网分位阈值被二值硬掩码抑制（前向硬掩码、反向软掩码直通）；被抑制通道有随机再激活防永久误删。(3) 加性缓冲：残差捷径上插入 1×1 与 3×3 卷积并联的轻量适配器（通道缩放近零初始化），输出再乘“逆软掩码”——由同一掩码分数反转归一化得到：被抑制得越狠的通道补偿越强，中等偏移适度修正，稳定通道几乎不动。训练信号为源—目标特征统计对齐损失（逐层把目标特征的均值与方差向离线源统计 L1 拉近）+ 差异加权掩码正则（λ_reg=0.05）；可更新参数只有加性缓冲、BN 仿射与掩码分数；另有层级梯度缩放——按 D 的层均值放大加性缓冲的梯度，把更新集中到偏移最重的层。自监督信号不用熵最小化、不用伪标签，属特征对齐型 TTA。

## 实验设置

源域为晴空驾驶数据 KITTI 与 Cityscapes；目标域包括物理渲染合成的 KITTI-Fog（能见度 50/75/150m 三档）与 KITTI-Rain（75/100/200mm 三档）、Cityscapes 合成雾（雾化参数 0.01/0.02），以及真实恶劣天气集 ACDC（雾/雪/雨/夜跨数据集迁移）；指标统一 mAP@50，三次独立运行取均值，基座 Faster R-CNN + ResNet-50。另设持续 TTA 协议：KITTI 雾按 50m→75m→150m 渐进、共 10 轮循环适应，上一强度终点作下一强度起点，考察误差累积与遗忘。全程单模态 RGB、无标签在线适应。

## 关键数字

离散强度：最重雾 KITTI fog 50m 从直接测试的 21.27 提升到 44.80（+23.53），高于次优 ActMAD 的 39.65（+5.15）；fog 75m / 150m 为 56.06 / 68.42；rain 200mm 为 63.22。但非全胜：中等雨量 rain 100mm / 75mm 上 WHW（73.15 / 74.33）略高于本文（71.40 / 73.03）。真实天气 ACDC：雾 / 雨 / 夜三项最佳（24.45 / 13.71 / 8.92），雪一项 15.41 不敌 BufferTTA 的 17.18。持续 TTA：10 轮平均 55.66，高于 WHW 50.17 与 ActMAD 48.32（+5.49），且 ActMAD 后期出现遗忘式下滑、本文全程更稳。消融（Cityscapes Fog 0.02）：只调 BN 仅 8.69；带差异正则的减性缓冲 16.81（去掉差异加权正则掉到 15.69）；单加性缓冲 18.66；双缓冲 + 梯度缩放完整版 19.13（较只调 BN +10.44）。

## 消融说明了什么

双缓冲的互补是真实的：单减性 16.81、单加性 18.66、合用 19.13，且减性侧的关键不是“剪通道”结构本身而是 D 的差异引导（去掉差异加权正则即掉 1.1 点）；加性侧的补偿强度由减性侧的抑制程度反向决定，而非自由学习——两缓冲共用同一组掩码分数是设计的核心耦合。正则权重约 0.05 最优、过大（0.5）因信息丢失明显变差。

## 局限

论文没有单设局限章节，以下为基于全文的判断。基座与规模单一：只验证了 Faster R-CNN + ResNet-50 一套两阶段检测器，未涉及单阶段 / DETR 系检测器与不同骨干，通道抑制对 BN 结构的依赖在无 BN 架构上如何成立未讨论。合成退化占主导：KITTI / Cityscapes 的雾雨均为渲染合成，真实天气只有 ACDC 一个集、且雪一项并非最佳，合成到真实的差距没有被单独分析。在线成本：完整版把双缓冲铺满全部基本块，补充材料承认其推理速度慢于多数基线、需另行推出只挂部分阶段的 CD-Buffer Light 才适合实时场景。协议内部不一致（精读发现）：实现细节写目标抑制比例为 5%，而消融讨论又称抑制比例在 2–3% 内稳定、最终按此选参，两处口径不一致，复现时需以图 4 为准。仍需源统计与批次：源域特征均值要离线预计算随模型携带，差异估计基于批次特征（实验批大小 16），小批次 / 单帧流式条件下的稳定性未验证。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
