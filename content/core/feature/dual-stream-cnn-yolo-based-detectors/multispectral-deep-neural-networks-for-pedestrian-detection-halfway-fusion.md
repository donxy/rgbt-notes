---
title: "Multispectral Deep Neural Networks for Pedestrian Detection (Halfway Fusion)"
paper_id: "liu2016multispectral"
authors: "Liu, Zhang, Wang, Metaxas"
year: "2016"
venue: "BMVC"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
tags: ["pedestrian", "dual-stream"]
paper_link: "https://arxiv.org/abs/1611.02644"
code_link: ""
doi: "10.5244/C.30.73"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Systematically compared early / late / halfway fusion in a two-branch Faster R-CNN and showed mid-level (halfway) fusion works best on KAIST.

## 点评

The founding deep-learning baseline of the KAIST era; nearly every later pedestrian paper benchmarks against it.

## 框架图

![Halfway Fusion 主框图（原文 Figure 5）：Early / Halfway / Late 三种特征融合架构并置图](figs/multispectral-deep-neural-networks-for-pedestrian-detection-halfway-fusion.webp)

*原文 Figure 5：自左至右为低层 Early Fusion（C1 后拼接 + NIN 降维，随后单支路继续上行）、中层 Halfway Fusion（两支路各走完 C1–C4 后拼接 + NIN，再接共享上层与 RPN）、高层 Late Fusion（两支路全程独立至 F7 后拼接，RPN 接两路 C5）；红色为卷积层、黄色为全连接层、蓝色为拼接层、绿色为 NIN（1×1 卷积降维）。第四种 Score Fusion（分数级级联）在原文 Figure 4，未收入本图。图源：Liu et al., BMVC 2016 / arXiv:1611.02644，Figure 5。*

## 问题定义

面向全天候（around-the-clock）应用的行人检测：彩色图像在夜间等弱光下失效，热红外能给出清晰人体轮廓却丢失衣着等精细视觉细节，两模态天然互补（其图 1 给出双向失败案例）。作者先用两个独立训练的单模态检测器实证了这种互补性（见关键数字中的 oracle 分析），随后把问题明确建模为一个 ConvNet 融合问题：双支路网络应当在哪个阶段融合，才能获得最佳检测协同？问题的默认前提是两路输入完好且像素级对齐（KAIST 的分束器硬件保证了这一点）；模态退化、损坏或缺失完全不在问题定义之内——“一路输入可能出错”只以“某模态在某些场景统计上更弱”的形式出现（夜间彩色、昼间热红外），而非传感器故障。身份说明（引用时须分开）：本文是 Liu, Zhang, Wang, Metaxas 的 BMVC 2016 论文，“Halfway Fusion”这一命名与 early/halfway/late/score 四路对照全部源自本文；Hwang et al.（CVPR 2015）是 KAIST 数据集论文，其基线是手工特征的 Multispectral ACF，文中没有任何 CNN 融合位置比较。阅读依据：arXiv:1611.02644 v1 全文通读，无降级。

## 方法细节

基座（Vanilla ConvNet）：把 Faster R-CNN 适配为行人检测器——VGG-16 骨干，去掉第四个最大池化层以保留较大特征图（利于小行人）；锚框 3 尺度 × 3 长宽比并去掉 0.5 长宽比以加速 RPN；RoI Pooling 7×7；ImageNet 预训练 VGG-16 初始化、交替训练，SGD 约 6 epoch（lr 0.001，第 4 epoch 后降至 0.0001），单尺度 600 px 输入；该基座在 Caltech 上取得 reasonable MR 17%。四种融合架构（两支路权重不共享）：Early Fusion（低层）——C1 之后立即拼接两路特征图，接 NIN（1×1 卷积）降维至 128 通道，以便复用预训练 VGG-16 的其余滤波器；Halfway Fusion（中层）——融合模块放在 C4 之后，同样拼接 + NIN，作者的解释是 C4 特征比 C1 更具语义、又保留了精细视觉细节，是细节与语义的平衡点；Late Fusion（高层）——在最后一个全连接层 F7 处拼接，RPN 使用两支路各自的 C5 特征生成候选框；Score Fusion（置信度层）——两个独立训练的 ConvNet 级联：一路的检测框送入另一路经 RoI Pooling 重新打分，双向各做一次，两路分数以固定等权 0.5 合并，最后 NMS 去重。Early / Halfway / Late 三者端到端同时训练，Score Fusion 两支路单独训练；NIN 权重高斯初始化。

## 实验设置

数据集只有 KAIST（多光谱部分），另用 Caltech 验证基座检测器。KAIST（Hwang et al., CVPR 2015）由分束器（beam splitter）硬件采集严格对齐的彩色–热红外图像对：95,328 对标注图像、103,128 个稠密标注、1,182 名唯一行人；标签为 person / people / cyclist / person?（person? 在评测中忽略）。评测协议沿 Hwang et al. 2015：逐图 FPPI，log-average miss rate（FPPI 区间 [10⁻², 10⁰]），IoU 0.5；reasonable 子集 = 无遮挡或部分遮挡、身高 > 55 px 的行人，并按采集时间拆 reasonable day / night。Liu et al. 的具体取样：训练集自训练视频每 2 帧抽样、按与 Caltech 相同的资格标准（排除遮挡、截断、< 50 px）得 7,095 张；测试集每 30 帧抽样得 2,252 张（昼 1,455 / 夜 797）。融合模型微调 SGD 4 epoch @ lr 0.001 + 2 epoch @ 0.0001。对照：FasterRCNN-C、FasterRCNN-T 与 Hwang et al. 的手工融合基线 ACF-C-T（其最优组合 ACF+T+THOG 在 reasonable all / day / night 的 MR 为 64.76 / 64.17 / 63.99，颜色单通道 ACF 为 79.26 / 81.09 / 90.17）。

## 关键数字

互补性分析（§3.2.1，表 1）：在 KAIST 测试集（2,252 张）上，彩色检测器 FasterRCNN-C 与热红外检测器 FasterRCNN-T 共有 TP 924 个，各自独有 TP 390 / 397 个；昼间 C 占优（TP 1,066 vs 896），夜间 T 反转（248 vs 425）；两者共享 FP 仅 345 个、FP 总数 2,672 个。极端 oracle 假设（保留任一路的全部 TP、只保留共享 FP）下检测率可由 47.9% 升至 62.1%、FPPI 由 0.549 降至 0.125——融合的潜在收益被量化。KAIST reasonable MR（越低越好，出自原文图 6 图例）：全天——Halfway Fusion 36.99% < Score Fusion 40.06% < Early Fusion 40.44% ≈ Late Fusion 40.46% < 热红外单模态 47.59% < 彩色单模态 48.59% < ACF-C-T 54.74%；昼间——Halfway 36.84%，彩色单模态 42.51%，热红外单模态 50.13%，ACF-C-T 51.97%；夜间——Halfway 35.49%，热红外单模态 40.93%，Score Fusion 38.50%，彩色单模态 64.39%——夜间彩色单模态甚至差于手工融合基线 ACF-C-T（61.19%）。作者的两个头条结论：Halfway 相对基线 Faster R-CNN 降低漏检率约 11 个百分点，且比其余三种融合架构低 3.5 个百分点。候选框质量（§4.2）：Halfway 的 RPN 以 50 个候选框达 94% 召回（其余方法约 87%）；30 个候选框达 90% 召回，单模态约需 80 个；300 个候选框、IoU 0.6 时召回 93.9%——融合增益在候选框阶段已经出现。口径警告：以上均为 KAIST 原始标注、reasonable 子集的 MR，与现代 mAP 表格不可直接比较；同一作者后续工作曾发布净化版 KAIST 标注，说明原始标注含噪声，跨论文引用 MR 须注意标注版本。

## 消融说明了什么

本文的核心“消融”就是融合位置对照本身：四种架构除融合点外同构，唯一变量是融合发生的层级。结论有三层。其一，中层胜出支持作者的“细节–语义平衡”解释：C1 低层特征含大量任务无关信息、融合反而受损；F7 高层与分数层融合则“难以消除语义噪声、难以纠正一路通道的决策错误”（原文措辞）——这是文献中很早的一次明确表述：决策层融合无法修正单支路已经犯下的错误。其二，候选框分析表明中层融合的收益不只是分类头层面的，共享 RPN 的候选质量同步提升。其三，未做的消融同样说明问题：NIN 降维、权重共享与否、Score Fusion 的 0.5 等权均未做敏感性分析——等权分数合并被当作不言自明的缺省，从未被检验。

## 局限

（1）鲁棒性评测为零（已逐项核查全文）：没有任何模态退化、噪声、腐化或缺失模态实验；单模态行是独立训练的检测器，不是“融合模型去掉一路输入”的缺失测试；昼/夜拆分是自然分布而非受控退化，热红外真实故障形态（条纹、NUC 漂移、坏点、饱和）更无从谈起。（2）融合是无条件拼接 + 1×1 卷积：没有任何质量感知、置信度或门控——一路模态被污染时，其特征仍以固定地位进入拼接并向下游传播；Score Fusion 的权重是写死的 0.5，与输入内容无关。架构里不存在“折扣某一路模态”的机制位置。（3）对齐被硬件假设掉：KAIST 由分束器共轴采集，本文未处理任何跨模态失准；方法对未对齐数据无适用性讨论。（4）评测面窄：多光谱实验只有 KAIST 一个数据集、一个任务（行人）；基座是两阶段 Faster R-CNN + VGG-16，无融合模型的运行时间分析。（5）数字只以曲线图 + 图例给出、无表格，且基于原始 KAIST 标注；Halfway 相对其他融合架构的 3.5 个百分点优势没有显著性或多次运行方差支撑。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
