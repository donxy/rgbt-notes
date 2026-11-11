---
title: "Multispectral Pedestrian Detection via Simultaneous Detection and Segmentation (MSDS-RCNN)"
paper_id: "li2018multispectral"
authors: "Li, Song, Tong, Tang"
year: "2018"
venue: "BMVC"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
tags: ["pedestrian", "dual-stream"]
paper_link: "https://arxiv.org/abs/1808.04818"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Two-stage multispectral R-CNN jointly optimising detection and semantic segmentation, with a sanitised re-annotation of KAIST training data.

## 点评

A standard KAIST-era strong baseline; its sanitised annotations are still used by later work.

## 框架图

![MSDS-RCNN 方法主框图（原文 Figure 2）：MPN 候选网络与 MCN 分类网络总览](figs/multispectral-pedestrian-detection-via-simultaneous-detection-and-segmentation-msds-rcnn.webp)

*原文 Figure 2：左半为 MPN——Color / Thermal 双 VGG 流在 conv3 后经 concat + NIN 融合出第三条融合流，三流各带 conv-prop（RPN）与 conv-seg 头（两侧单模态流的头标注 Training phase only，推理只用融合流）；中间 crop_resize 把候选送入右半 MCN——同样的双流 + 融合流结构处理裁剪区域，三流 FC7 出分类分数、conv5 带 conv-seg 头；顶部 Score fusion（+ 节点）把四源分数求和得 final_cls 输出 Detection。图源：Li et al., BMVC 2018 / arXiv:1808.04818，Figure 2。*

## 问题定义

全天候（尤其夜间低光）行人检测：可见光与热红外天然互补，但如何有效融合仍是非平凡问题。作者先做了一个 KAIST 人类基线（标注员在随机打乱的单帧上、须同时查看两模态后画框）：人类 MR 仅 3.09%，在约 0.02 FPPI 处当时的顶级检测器漏检率是人类的 8 倍——以此论证融合设计远未到上限。第二个问题意识是训练标注噪声：KAIST 原始标注有大量问题框，作者认为约三分之一的检测误差来自标注噪声本身，并把“净化训练标注 + 量化各类标注错误的影响”列为与方法并列的贡献。问题设定默认两模态输入完好、对齐（残余未对齐只作为标注错误的一类在标签层处理）；鲁棒性、退化、缺失均不在问题之内。身份说明：MSDS-RCNN 是浙江大学组 Li, Song, Tong, Tang 的 BMVC 2018 论文；其“分割”是把检测框当作掩码的弱监督辅助分支（思路源头为单模态的 SDS-RCNN），并非显著图输入或显著性模块。阅读依据：arXiv:1808.04818 v1 全文通读，无降级。

## 方法细节

整体是两个级联的多光谱融合网络（图 2）：前级 MPN 负责出候选框，后级 MCN 专门复核难例；两级都内嵌分割分支做辅助监督；最终分数由多源分数融合产生。MPN（多光谱候选网络）：两条去掉全连接层的 VGG-16 支路分别吃可见光与热红外，在第三个卷积块之后 halfway 融合——特征图拼接后用 NIN（1×1 卷积）降维，融合流复用 VGG-16 后续层；两条单模态支路在训练期不截断（保留，为训练 MCN 提供更多样的候选），推理时只用融合流出候选以提速。移除第四个池化层使特征步幅为 8（利于小目标）。三条流各自在 conv5_3 上挂标准 RPN 头（3×3 卷积 + 两个 1×1 兄弟层出回归与分类），外加一个分割头（单个 1×1 卷积）。锚框按行人任务定制：训练尺度分 8 个分位箱得 9 个尺度端点，长宽比固定 0.41，IoU>0.5 为正。损失为九项联合损失（三条流 × 分类 + 回归 + 分割），全 λ=1；分割损失是逐像素交叉熵，监督信号是把行人框当作掩码的弱分割标注（person/person?/people 为前景）。MCN（多光谱分类网络）：取 MPN 分数 >0.01 的候选，四边外扩 0.2 倍纳入上下文，裁剪缩放至固定 112×56 输入；同样是双 VGG-16 支路 + halfway 融合（concat+NIN），三条流各自在 FC7 上挂二分类头、conv5_3 上挂分割头；正样本阈值 IoU>0.7。效率改造：去掉第五个池化层、第四个池化改为 2×1；推理只取 top-K=50 个候选。损失六项（三条流 × 分类 + 分割），全 λ=1。MCN 权重由 MPN 权重初始化。分数融合：最终行人分数 = 对四个来源的二分类 logit 向量直接求和后再 softmax——四源为 MPN 融合流分数 + MCN 的可见光 / 热红外 / 融合三流分数。全程等权、无任何学出的或手工的模态权重；作者明说本文没有采用光照感知加权（同组前作的招牌机制），并称即便如此也已大幅超过它们。特征层融合同样是无权重的拼接 + NIN。

## 实验设置

只用 KAIST 一个数据集：95,328 对对齐图像；训练集按协议每 2 帧采样、剔除 <50 px 与重遮挡/截断实例，得 7,601 张；测试集每 20 帧采样 2,252 张（白天 1,455 / 夜晚 797）。评测用 reasonable 设置，指标为 FPPI∈[10⁻², 10⁰] 的对数平均漏检率 MR；测试集标注用 Liu et al. 的改进版（非原始标注，与用原始标注评测的文献数字不可直接比）。实验结果为 5 次重复的平均。实现为 TensorFlow，两阶段训练：MPN 用 SGD（动量 0.9、权重衰减 1e-4、初始 lr 1e-3、4 epoch 后 ÷10、共 6 epoch，ImageNet 预训练 VGG-16 初始化，每图采样 120 锚、正负比 1:5）；MCN 设置近同（每图 60 候选、正负比 1:2）。推理：MPN 输入尺度 S=600，MCN 取 K=50；单张 228 ms（Titan X）。单模态对照（Color / Thermal）是把同一架构删去另一模态后单独重训的模型。另有一整节标注噪声研究：人工重标 7,601 张训练帧得净化版标注，错误分三类——定位不准、误分类（含漏标）、彩色-热红外未对齐区域（双图分别标框、IoU<0.5 时取包围框标为 person? 忽略）；除全净化外还做“留一类错误不修”的半净化对照（Sanitized-ex1/2/3）。

## 关键数字

头条（原始训练标注）：MR All 11.63 / Day 10.60 / Night 13.73，把此前 SOTA IATDNN+IASS 的 15.78 压低 26%（相对）；速度 228 ms/张，亦快于 IATDNN+IASS 的 250 ms。净化训练标注后：MR All 7.49 / Day 8.09 / Night 5.92（图 1、图 6；正文 §5.4 误写 7.45，本笔记以图为准并在此标注）。白天相对降错 24%（三类错误贡献相近），夜晚相对降错 56%（主要来自定位修正）。人类基线：MR 3.09。单模态对照（图 3，同架构单独重训）：Color 33.23 / 22.73 / 56.10（夜晚崩坏）；Thermal 23.54 / 26.46 / 17.47。融合对两者的领先在昼夜都很大，但注意这是“独立训练的单模态模型”口径，不是融合模型缺模态测试。同表对照（图 3，All MR）：ACF+T+THOG 47.24、Halfway Fusion 26.15、Fusion RPN 21.67、Fusion RPN+BF 16.53、IAF R-CNN 16.22、IATDNN+IASS 15.78。口径警告：此表 Halfway Fusion 为 26.15，而原始标注口径的文献常引 25.75——差异来自测试集标注版本（本文用改进版）；作者转引称标注版本可使 MR 相差 >15%，跨论文引 KAIST 数字必须注版本。

## 消融说明了什么

分割监督（表 1）：无分割 13.59 → 只加在 MPN 12.00 → 只加在 MCN 13.03 → 两级都加 11.63。分割辅助在候选阶段（MPN）的收益明显大于分类阶段，作者归因于 KAIST 粗框标注在 MCN 的局部裁剪上与掩码监督更不一致。结论：分割的主要价值是改善候选生成质量，而非最终判别。分数融合（表 2）：单个分数源 MR 分别为——MPN 18.88、MCN-Color 24.32（夜 36.28）、MCN-Thermal 22.50（夜 17.76）、MCN-Merged 14.02；MCN 三流合用 11.95；再加 MPN 分数 → 11.63。说明融合流并未吃掉单模态流的判别信息（单模态流分数仍互补），且两级分数也互补；但全部增益来自“多源求和”本身，没有任何一源的权重被学习或调整过。速度/精度（图 4）：MPN 输入尺度与 MCN 候选数越大越准也越慢；只用融合流出候选（Merged）与三流都出（All）精度相当或更好，故推理定为 Merged + S=600 + K=50。标注噪声（图 6）：半净化对照 All MR——留定位错误 9.39、留误分类 8.68、留未对齐 8.50（全净化 7.49、原始 11.63）；作者据此称约三分之一推理误差源于训练标注噪声。

## 局限

（1）模态权重完全缺席：特征层是拼接 + NIN，决策层是四源 logit 等权求和；求和形式下任一源的高置信错误 logit 都可无界地主导最终分数，全文没有置信度、质量或可靠性估计的任何位置。作者自己把光照感知加权列为“未采用、加了可更好”的留白。（2）鲁棒性评测为零（已逐项核查全文）：无模态退化、噪声、腐化或缺失实验。单流分数与单模态行都是分数源消融或单独重训的模型，不是“融合模型一路输入损坏/缺失”的测试；MCN 永远同时消费两模态裁剪区域。（3）分割监督是框充掩码的弱监督，掩码粗糙（整框即前景），且其收益在 MCN 阶段已明显衰减；该分支是训练期辅助任务，推理时分割输出不参与任何门控或加权——它不是显著图式的空间注意力。（4）两级级联、两对 VGG-16，模型笨重（228 ms/张）；只在 KAIST 单数据集、单一行人类别上验证。（5）数字口径对后世有坑：本文起 KAIST 出现“原始标注 vs 改进/净化标注”多套数字并行，All MR 7.49（净化训练 + 改进测试标注）与 11.63（原始训练 + 改进测试标注）常被后世混引，引用必须连标注版本一起写。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
