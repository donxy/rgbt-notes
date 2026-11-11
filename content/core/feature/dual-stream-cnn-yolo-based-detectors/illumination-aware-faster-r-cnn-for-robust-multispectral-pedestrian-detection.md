---
title: "Illumination-Aware Faster R-CNN for Robust Multispectral Pedestrian Detection"
paper_id: "li2019illuminationaware"
authors: "Li, Song, Tong, Tang"
year: "2019"
venue: "Pattern Recognition"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["pedestrian", "quality-aware"]
paper_link: "https://doi.org/10.1016/j.patcog.2018.08.005"
code_link: ""
doi: "10.1016/j.patcog.2018.08.005"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Estimates scene illumination and uses it as a gate to adaptively weight the RGB and thermal sub-networks' detection scores.

## 点评

「光照感知加权」一词与浙江组 IAF→MSDS-RCNN→CMPD→EHF 谱系的源头。六种 Faster R-CNN 融合架构对照发现：夜间六种融合无一超过热红外单模态——负融合的早期完整记录。方法取 Score Fusion II 并摘掉等权层：独立光照网络 IAN 只吃彩色图（缩至 56×56）估「白天」类 softmax 概率 i_v，门函数 w=1/(1+α·exp(−(i_v−0.5)/β)) 给出一对全局标量，加权两子网络的分数与框回归；学到的门全程不饱和（光照最好时热红外仍保留约 0.37 权重）。KAIST MR^I：All 15.73 / Day 14.55 / Night 18.26，夜间仍逊于热红外单模态的 16.79。仅干净 KAIST + 昼/夜自然划分，无腐化/缺失评测；引用数字须连标注版本（MR^I）。

## 框架图

![IAF R-CNN 方法主框图（原文 Figure 5）：双 VGG-16 子网络、共享 RPN 与 IAN 光照门控加权总览](figs/illumination-aware-faster-r-cnn-for-robust-multispectral-pedestrian-detection.webp)

*原文 Figure 5：IAF R-CNN 总体架构。两子网络分别以彩色/热红外图像为输入、各自输出分类置信分数与框坐标；侧分支 IAN 从彩色图像估计光照值，光照感知加权层经门函数算出两模态融合权重，最终结果为两子网络输出的加权合并；紫色块为分割层，仅训练期使用。图中可见：共享 RPN 模块同时接两路 conv5 特征、IAN 的输入箭头只来自彩色图像、Weight_c / Weight_t 在分数与框预测两处汇合（图中个别标签有原文排版小误，不影响结构判读）。图源：Li et al., Pattern Recognition 2019（arXiv:1803.05347），Figure 5。*

## 问题定义

本文有两个层次的问题。第一层是工程摸底：此前 convnet 多光谱行人检测缺乏对融合架构的系统比较，不知道一个经适当适配（adaptation）的「素」Faster R-CNN 能走多远。第二层是核心发现驱动的问题：作者在六种融合架构的对照实验中发现，单模态检测置信度与光照条件系统相关——白天彩色略优于热红外、六种融合全部优于任一单模态；夜间热红外大幅占优，而六种融合架构无一能超过热红外单模态，彩色模态在夜间不是提供帮助而是制造混淆。由此问题被重新表述为：融合权重不应是固定的或等权的，而应以场景光照为条件——光照好时让彩色多贡献、热红外保留一份；光照差时让热红外主导、彩色近乎退出。须钉死的前提：这里的「条件」是自然场景的光照（昼/夜及其连续过渡），输入始终是干净、配对的双模态图像；全文没有损坏模态、缺失模态或传感器故障的设定，标题中的 robust 指对光照变化的鲁棒，不是抗腐化。阅读依据：arXiv:1803.05347 v2 预印本全文通读（期刊版为 Pattern Recognition 2019, vol. 85, pp. 161–171，排版版未逐行比对）。

## 方法细节

（1）六架构对照与适配：六种 Faster R-CNN 派生融合架构——Input Fusion（输入通道堆叠）、Early Fusion（conv1 后拼接 + NIN 降维）、Halfway Fusion（conv4 后拼接 + NIN）、Late Fusion（fc 层拼接）、Score Fusion I（两子网络级联互评、分数等权 0.5 合并）、Score Fusion II（非级联：共享提议、两子网络各自出分数与框回归、直接平均）。四项适配：更细的特征步长（去掉 VGG-16 最后一个最大池化，步长 16→8）、输入上采样 ×2（评测后未保留）、训练纳入部分遮挡实例、ignore 区域处理（person?/people 标注区与 <50 px 实例不参与采样）；适配使六架构平均 MR^I 降低 10.41 点。（2）主干：取 Score Fusion II 架构并摘掉其平均加权层——两路 VGG-16 子网络的 conv5 特征拼接后建一个共享 RPN，提议同时送入两个子网络，各自经 RoI pooling + fc 层输出每个提议的分类置信分数 s 与框回归偏移 t；另按 Brazil et al. 给两路各加行人分割监督（单个 1×1 卷积；图像级 + RoI 级逐像素分割损失），仅训练期使用。作者选分数级融合的理由是其更语义化、更显式，「can be better weighted」。（3）光照估计：候选三种——手工统计量 Key（平均亮度）与 Range（90 分位 − 10 分位像素值），以及学出来的 IAN（Illumination-aware Network），实验胜出并被采用。IAN 只吃彩色图像（理由：热红外对光照不敏感），缩至 56×56；两层 3×3 卷积（各接 ReLU + 2×2 最大池化）+ 全连接 256、2，第一个 FC 后加 dropout 0.5；用粗粒度昼/夜标签以 softmax 损失训练（数据集没有光照真值），输出的「白天」类 softmax 概率即光照值 i_v ∈ [0,1]——连续量，不是昼/夜开关。作者特意不复用主干特征估光照：主干经分类/检测训练被调成对光照不变，且主干用 image-centric 小批量采样、与光照估计所需的大批量冲突。IAN 独立先行训练（Adam，lr 1e-4，batch 64，2 epochs），之后全程冻结。（4）门控融合：门函数定义在光照值上：w = 1 / (1 + α·exp(−(i_v − 0.5)/β))，w_color = w、w_thermal = 1 − w，α、β 为可学习参数（初值 0.1、1）。最终输出是对两子网络输出的同一对全局标量加权：s_final = w_color·s_color + w_thermal·s_thermal，t_final = w_color·t_color + w_thermal·t_thermal——权重对全图所有提议一视同仁，无空间粒度。作者给门函数定的设计约束：光照好时 w_color 高但 w_thermal「不应太小」；光照差时 w_thermal 主导、w_color「可忽略」。学到的门函数是一条平滑单调曲线，w_color 随 i_v 从 ≈0 升至 i_v=1 处的 ≈0.63，全程不饱和——即便光照最好，热红外也恒保留约 0.37 的权重；示例：i_v=0.914 时权重为 0.559/0.441。（5）优化：两阶段——阶段一训主干（七项联合损失：RPN 损失 + 两模态各自的检测损失 + 两模态各自的图像级与 RoI 级分割损失，全部 λ=1）；阶段二冻结其余一切，只训门参数 α、β，损失取最终检测输出上的检测损失（lr 0.01，第 2 epoch 后 ÷10，共 3 epochs）——作者注明全量反向传播并无进一步收益。

## 实验设置

数据集只有 KAIST（95,328 对）。训练按每 2 帧采样；默认过滤（≥50 px、去遮挡/截断）得 7,095 图 / 12,790 实例，纳入遮挡实例后 7,601 图 / 14,911 实例。测试集 2,252 图（白天 1,455 / 夜间 797，每 20 帧采样）。指标为 reasonable 配置下 FPPI∈[10⁻², 10⁰] 的对数平均漏检率（log-average MR）；同时报原始标注（MR^O）与 Liu et al. 改进测试标注（MR^I）两套——作者论证原始标注漏标严重、MR^I 低于约 25% 后 MR^O 失去区分度，故后续数字一律用 MR^I，引用其数字必须连标注版本一起引。实现：TensorFlow；VGG-16 ImageNet 初始化；image-centric 训练，每批量 1 图 + 120 锚、正负比 1:5，lr 0.001 第 4 epoch 后 ÷10、共 6 epochs；锚宽高比去掉 0.5。推理速度 0.21 s/图（GTX TITAN X），为同表最快。评测足迹核查：仅 KAIST 干净基准 + 昼/夜自然子集拆分；无任何噪声/腐化注入、无模态丢弃或置零实验、无热成像故障模型。

## 关键数字

以下均为 MR^I（改进标注）、reasonable 配置，越低越好。IAF R-CNN：All 15.73（当时 SOTA；次席 Fusion RPN+BF 16.53）、Day 14.55（全场最佳）、Night 18.26。夜间单模态锚点：热红外 alone Night 16.79——夜间仍是热红外单模态最好，IAF（18.26）与 RPN+BF（18.16）只居其次，即门控融合在它专为之设计的夜间场景里，依然没有超过丢弃彩色模态。单模态 All：彩色 34.62、热红外 22.71。适配后六架构 All：Halfway 17.57、Score Fusion I 17.43、Late 18.89、Score Fusion II 18.42、Input 22.47、Early 22.72（默认设置平均 29.99 → 全适配 19.58）。图 4 的昼夜对照：白天六种融合全部优于两个单模态；夜间六种融合全部低于热红外单模态——负融合现象的完整对照就在这一张图里。

## 消融说明了什么

消融在图 8（reasonable-all，MR^I）。加权机制三方对比：光照感知加权（IAN）15.73 vs 等权平均 16.40 vs 硬 0-1 切换（IAN）20.76——软门控只比等权平均好 0.67 点，但比硬切换好 5.03 点：本文自己的数据表明，把模态选择做成离散开关代价惨重，连续软加权是必要的；等权平均的 16.40 也说明 All 口径下大部分成绩来自主干 + 适配，门控的增量主要体现在夜间子集（平均权重被夜间彩色拖累）而非全局均值。光照估计三方对比：IAN 15.73 vs Range 17.99 vs Key 21.24；硬切换下差距更夸张（IAN 20.76 / Range 26.31 / Key 27.82）；作者归因：户外复杂背景不是像素统计量能处理的，且只用昼/夜二值标签训练，IAN 已能学出昼夜的可分特征。适配消融（表 1）：细步长单独 −5.56、上采样单独 −6.15，但两者叠加只有 −4.53（互相干扰），故最终弃上采样；再加遮挡实例与 ignore 处理补足至 −10.41——这组消融是「素 Faster R-CNN 经适配可逼近 SOTA」这一主张的全部证据。

## 局限

（据全文指出的结构性局限；作者自陈的局限仅有「希望有更丰富光照标注」与未来融合 LiDAR 两点。）（1）门控信号是场景属性，不是模态健康估计：i_v 只由彩色图像算出、只受昼/夜标签监督，编码的是「场景有多暗」这一先验，它与「哪一路可信」的关联完全经由固定的昼夜先验中介；它对热红外一路的状态不提供任何信息；彩色图像本身若被腐化（过曝、噪声、镜头污损），i_v 是在腐化输入上算出的、无有效性校验。（2）全局标量、无空间粒度：一对权重管全图所有提议，混合光照场景（一半强光一半暗角）只能取一个折中权重对。（3）按设计不能把热红外压到零：「光照好时 w_thermal 不应太小」是写进设计约束的，学到的门也确实在 i_v=1 时停在 w_color≈0.63；这个不对称来自先验（热红外白天不添乱、彩色夜间添乱），不是来自对当前输入的证据——机制上不存在「发现热红外坏了并把它丢掉」的通路（反方向在夜间近似成立：i_v→0 时 w_color→≈0）。（4）无「不劣于更强单模态」的保证，且自家结果即反例：夜间 IAF 18.26 劣于热红外单模态 16.79——门控只是缩小了负融合的幅度，没有消除它。（5）退化/缺失评测为零（已核查全文）：无腐化注入、无整路模态丢弃、无条纹噪声/NUC 漂移/坏点/热饱和等真实故障模型；昼/夜是数据集固有内容划分，不是受控退化协议。（6）数字的口径依赖：头条 15.73 是改进标注（MR^I）口径；同一批方法在原始标注下读数高出一大截，跨论文拼表必须核对标注版本。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 对比表：[[compare|REQ-04 四维对比表]]
