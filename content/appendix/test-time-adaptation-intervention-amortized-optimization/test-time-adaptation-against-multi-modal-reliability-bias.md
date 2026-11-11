---
title: "Test-time Adaptation against Multi-modal Reliability Bias"
paper_id: "yang2024testtime"
authors: "Yang, Li, Zhang, Hu, Peng"
year: "2024"
venue: "ICLR"
list: "appendix"
scope: "Reference"
section: "Test-Time Adaptation, Intervention & Amortized Optimization"
subsection: ""
fusion_level: "na"
architecture: "na"
mechanisms: "Quality-Aware"
tags: ["test-time-adaptation", "quality-aware"]
paper_link: "https://iclr.cc/virtual/2024/poster/18574"
code_link: "https://github.com/XLearning-SCU/2024-ICLR-READ"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：READ identifies the reliability-bias failure of multi-modal TTA — per-modality shifts making cross-modal reliability uneven — and counters it with adaptive attention modulation plus a robust objective.

## 点评

READ 指出多模态 TTA 的可靠性偏置失效（各模态偏移使跨模态可靠性不均），以自适应注意力调制加鲁棒目标（放大自信预测、抑制噪声预测）应对；音视频分类基准（VGGSound、Kinetics）逐模态腐化设定。

## 框架图

![READ 方法主框图（原文 Figure 2）：受损视频与干净音频分别编码，token 拼接后进入自适应注意力融合层（测试时只更新 Q/K/V 投影），分类器输出由置信感知损失（右侧损失曲线）驱动适应](figs/test-time-adaptation-against-multi-modal-reliability-bias.webp)

*原文 Figure 2：READ 框架（官方代码仓库图）。受损视频与干净音频分别编码，token 拼接后进入自适应注意力融合——测试时只更新其 Q/K/V 投影，使注意力按模态可靠性重新配权；分类器输出再由置信感知损失（右侧损失曲线：高置信放大、低置信反转抑制）驱动适应。图源：Yang et al., ICLR 2024 官方代码仓库。*

## 问题定义

已有 TTA 几乎都为单模态设计，多模态场景多出一个单模态里不存在的失效模式，作者将其命名为可靠性偏倚（reliability bias）：某个模态自身遭遇分布偏移（雾、传感器退化等）后，它与未受损模态之间的信息量差距被拉大，融合时受损模态仍被同等对待、甚至污染融合结果，使多模态预测反而差于单模态。作者给出两条现成 TTA 解不了的理由：其一，只更新归一化层参数无法真正弥合模态内偏移，偏倚必然残留；其二，主导模态一旦受损，预测整体变噪、熵变得极不稳定，对全部预测做熵最小化会过拟合噪声，只挑高置信样本又会欠拟合。

## 方法细节

READ 由两个互相配套的部件组成，骨干为音视频预训练模型 CAV-MAE。(1) 自适应注意力融合（SAF）——改“适应哪里”：不再把可调参数放在归一化层，而是放在跨模态注意力融合层。两模态编码输出先在 token 级拼接，再投影出 Q/K/V；测试时只更新这组注意力投影参数，使注意力图本身随测试分布重估——干净模态获得更高关注、受损模态的自注意与被关注权重被压低，从而在融合环节实现按可靠性重新配权。(2) 置信感知损失——改“用什么信号适应”：以预测最大概率为置信度、以固定阈值 γ=e⁻¹ 划分样本；损失被设计成梯度非单调——置信度高于阈值的样本梯度随置信度增大而放大（鼓励模型向可靠预测靠拢），低于阈值的样本梯度被抑制/反转且随置信度降低而减弱（防止噪声预测主导更新）；两个定理在正文给出结论、证明在附录。最终目标 = 该鲁棒适应损失 + 类别平衡的负熵正则（防预测塌缩到少数类）；可调参数集合仅为注意力融合层的 Q/K/V 投影。它不是伪标签法、不是一致性正则、不依赖缓冲统计。

## 实验设置

作者新建两个多模态 TTA 基准：Kinetics50-C（动作识别）与 VGGSound-C（音视频事件分类），均在 CAV-MAE 源模型上评测，指标为准确率、5 个随机种子取均值；在线设置批大小 64、单遍、Adam 学习率 1e-4，适应阶段不见源数据、只见无标签测试流。定义性协议是单模态受损、其余模态保持干净：沿 Hendrycks & Dietterich 腐蚀体系，视频侧 15 种腐蚀（噪声/模糊/天气/数字四类）、音频侧 6 种（高斯、交通、人群、雨、雷、风），每种 5 档严重度；每个评测样本只腐蚀一个模态，另一模态原样输入，以此专门制造模态间可靠性失衡；主表统一报告 severity 5。另与训练期鲁棒融合方法 QMF 做对照。

## 关键数字

视频受损、Kinetics50-C：晚融合口径下 READ 54.8（源模型 52.2，Tent 甚至跌到 49.4）；注意力融合口径下 READ(SAF) 62.5 为全表最佳（源模型 59.9、Tent 59.4、EATA 60.1、SAR 59.8）。雾一项差距最醒目：57.4 对源模型 46.7——普通 TTA 在雾上普遍翻车（Tent 34.9），READ 是少数能救回来的。音频受损：Kinetics50-C 上 READ(SAF) 71.1（源模型 69.3）；VGGSound-C 上差距被放大，READ(SAF) 32.4 对源模型 25.6，而 Tent / MM-TTA 崩到 4.5 / 7.6 附近——VGGSound 以音频为主导模态，主导模态受损正是可靠性偏倚最毒的情形。视频受损、VGGSound-C：READ(SAF) 56.9 对源模型 56.0、次优 EATA 56.2，优势较小——视频非主导模态时偏倚危害本就有限。与 QMF 的对照：READ 在音、视频两种受损方向上都优于需要改训练流程的 QMF，作者据此论证可靠性融合必须发生在测试时而非训练时。

## 消融说明了什么

两部件缺一不可：只把 SAF 配上普通 Tent 熵损失，视频雾条件下准确率反而从 34.9 掉到 22.7——适应位置对了、信号错了，注意力被噪声预测带偏，比不适应还糟；而把新损失配在旧的晚融合 + 归一化更新范式上也能把 34.9 拉到 50.9；默认配置（静态 LN + SAF + 新损失）为 57.4，再叠加动态 LN 更新仅微升至 58.1、故出于效率未采用。

## 局限

论文没有单设局限章节，结论仅说未来将拓展到更多应用场景。以下为基于全文的判断。协议覆盖窄：只评测“恰好一个模态受损”的温和设定；双模态同时受损、模态缺失、多种偏移在同一测试流中混合出现的情形均未覆盖（这些正是后续 SuMi 的 wild TTA 要补的口子），其损失在强偏移下是否仍稳定无证据。任务与架构绑定：只做音视频分类（动作识别/事件分类），骨干单一（CAV-MAE）；方法成立的前提是模型本身带注意力融合层，无注意力融合或非 Transformer 的多模态模型无法直接套用。阈值靠先验拍定：置信划分阈值在全部实验中固定为同一常数，未给自适应确定方法，不同任务的置信分布差异可能使该值失配。理论与实证的缝：损失的非单调梯度性质有定理支撑，但“高置信即干净”仍是启发式假设——主导模态受损时高置信也可能系统性错误，文中未给这类反例分析。双模态展示：形式化只以两模态为例，三模态以上时注意力配权的扩展未做实验验证。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
