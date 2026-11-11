---
title: "Smoothing the Shift: Towards Stable Test-Time Adaptation under Complex Multimodal Noises"
paper_id: "guo2025smoothing"
authors: "Guo, Jin"
year: "2025"
venue: "ICLR"
list: "appendix"
scope: "Reference"
section: "Test-Time Adaptation, Intervention & Amortized Optimization"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["test-time-adaptation", "degraded-modality"]
paper_link: "https://arxiv.org/abs/2503.02616"
code_link: "https://github.com/zrguo/SuMi"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：SuMi targets in-the-wild multimodal test-time adaptation: IQR smoothing for abrupt distribution shifts, single-modality-guided selection of low-entropy informative samples, and cross-modal mutual-information sharing.

## 点评

SuMi 面向野外多模态测试时自适应：IQR 平滑应对突发的分布偏移，单模态引导挑选低熵、信息量大的样本，跨模态互信息共享；音视频分类中同时处理多模态腐化与模态缺失（ICLR 2025）。

## 框架图

![SuMi 方法主框图（原文 Figure 2）：视频/音频编码、IQR 平滑样本识别、单模态辅助选样与总体优化总览](figs/smoothing-the-shift-towards-stable-test-time-adaptation-under-complex-multimodal-noises.webp)

*原文 Figure 2：SuMi 总览。视频/音频编码后先做样本识别——IQR 平滑（区间随迭代渐进放宽）加单模态辅助（双熵门控）挑出可用于适应的样本；总体优化在选中样本上联合多模态熵最小化与互信息共享损失（单模态分布向互补模态与融合分布的平均对齐），只更新归一化层仿射参数。图源：Guo & Jin, ICLR 2025（arXiv:2503.02616）。*

## 问题定义

作者把 READ 只处理“一个模态受损”的温和设定往前推了一步，提出 multimodal wild TTA（多模态野外 TTA）：真实目标域里多种偏移是混在一起来的，且多模态噪声比单模态复杂得多——既有弱 OOD（仅一个模态被腐蚀），也有强 OOD（多个模态同时被腐蚀、或模态直接缺失）。关键实证观察是：源域与强 OOD 之间的分布落差大到会直接摧毁源模型的先验知识，多数已有 TTA 方法在强 OOD 上甚至跑不过不适应的源模型；而先在弱 OOD 上适应、再过渡到强 OOD，效果反而好——这启发了“适应过程需要被平滑、不能一步跳到最难样本”的核心思路。

## 方法细节

SuMi 由“选哪些样本适应”和“跨模态怎么共享信息”两部分组成，骨干与 READ 相同、为 CAV-MAE，更新对象回到归一化层的仿射参数。(1) IQR 平滑的样本识别：不用原始输入、而在两模态编码特征拼接后的表示上算四分位距，以 Tukey 规则给出稳定样本区间；区间宽度由随迭代增长的线性平滑函数 f(t)=t/iter 控制——早期只纳入离源分布近的弱 OOD 样本，随迭代推进才逐步放进强 OOD 样本，人为把“突变式适应”改造成“渐进式适应”。(2) 单模态辅助选样：在 IQR 入围样本中再做熵筛选，判据是反直觉的一对条件：多模态熵要低（整体预测确定），单模态熵之和却不能太低（多模态熵 ≤γ_m 且单模态熵组合 ≥γ_u），以此挑出“确实靠多模态信息才判得准”的样本，剔除那种只靠单个模态就能轻松判对、对融合优化没多少信息量的样本。(3) 互信息共享（MIS）：把每个模态的单模态预测分布向“另一模态分布与多模态融合分布的平均”拉近（KL 散度），使受损/缺失模态能借用其余模态的信息对齐；为防强 OOD 后期多模态俱损时互相污染，强 OOD 设定下该损失只在前一半迭代启用，弱 OOD 设定下全程启用。总体损失：被双重选中的样本上，以按熵构造的样本权重加权“多模态熵最小化 + λ·MIS 损失”，λ 默认 5.0；没有伪标签、没有教师–学生一致性、不用能量分数。

## 实验设置

基准沿用 READ 的两个集并扩成 wild 版：Kinetics50-C 与 VGGSound-C，指标为准确率、5 个种子取均值；CAV-MAE 源模型，Adam，批大小 16 / 64（两集不同）。退化协议分三层：① 弱 OOD：沿用 READ 的单模态腐蚀——视频 15 种、音频 6 种、各 5 档严重度，一次只腐蚀一个模态；② 强 OOD：新定义四种形态——双模态同时腐蚀（Both）、视频缺失（Vmiss）、音频缺失（Amiss）、一模态缺失且另一模态被腐蚀（Mix）；③ wild / 混合域：把弱与强 OOD 按十种不同比例混合（消融用 50% 强 OOD），并另设混合严重度条件，模拟真实流中偏移强度与类型同时多变。主表报告 severity 5，另有多档严重度曲线。缺失模态在此被处理为强 OOD 的一种形态，靠 MIS 在适应早期借另一模态对齐，而不是靠专门的缺失重构模块。

## 关键数字

弱 OOD 已接近天花板、增益有限：Kinetics50-C 视频受损 SuMi 63.9，略高于 READ 的 63.5 与源模型 60.2；VGGSound-C 视频受损 SuMi 57.3 对 READ 56.4。强 OOD 才是分水岭：Kinetics50-C 音频受损设定下，强 OOD 平均 SuMi 33.4，而 Tent 直接崩到 11.2、SAR 12.8，连 READ（29.1）与源模型（30.0）都守不住；最难的 Mix（一个模态缺失 + 另一个被腐蚀）SuMi 18.4 仍为最佳但绝对值很低。VGGSound-C 音频受损设定下 SuMi 弱 / 强 OOD 为 33.2 / 19.7，次优的 EATA 为 32.5 / 17.4，Tent 强 OOD 仅 5.1。混合比例实验：随强 OOD 样本占比升高，基线普遍快速跌破源模型，SuMi 在十种混合比例与混合严重度下保持一致领先。消融（含 50% 强 OOD）：无任何组件时 Kinetics50-C severity 5 仅 31.7；单加 IQR 平滑升到 45.1（单项贡献最大），单加单模态辅助 39.4、单加 MIS 38.1；三者齐全达到 52.0；VGGSound-C 同口径从 23.5 升到 35.1。

## 消融说明了什么

IQR 平滑一个组件就贡献了从 31.7 到 45.1 的大头——在 wild 设定下“适应顺序”比“适应信号”更决定成败；单模态辅助与 MIS 各有约 +7 的独立贡献，且 MIS 必须有时序开关（强 OOD 下全程开会互相污染，这是消融支持的设计而非装饰）。

## 局限

论文没有单设局限章节，结论只复述贡献。以下为基于全文的判断。仍是音视频分类、同骨干同基准：任务、数据集与源模型（CAV-MAE）与 READ 完全同源，没有跨任务（如检测/分割）、跨骨干的证据，wild TTA 的结论能否迁移到感知任务未知。强 OOD 的绝对性能依然很低：Mix 条件下 Kinetics50-C 只有 18.4、VGGSound-C 只有 6.7，“优于基线”更多是相对不崩，而非可用；作者未讨论这一可用性门槛。超参与时序开关较多：IQR 的 β、多/单模态熵阈值、μ、λ、以及 MIS 只开前半程的时序开关等都需要预设，其中 μ 的最优方向还随数据集的主导模态而反转（Kinetics 偏视频、VGGSound 偏音频），说明这些量并非与任务无关的常数。平滑的代价未量化：IQR 渐进放行意味着早期迭代主动不用最难的样本，适应速度 / 需要的总迭代数与在线延迟没有报告；表示级 IQR 对批组成也敏感，小批次下分位数估计的稳定性未验证。缺失只作类型、未作剂量：模态缺失只以 Vmiss / Amiss / Mix 三种定性形态出现，没有缺失率连续变化的曲线，无法回答“缺多少时方法失效”。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
