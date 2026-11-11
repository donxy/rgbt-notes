---
title: "Multi-modal Learning with Missing Modality via Shared-Specific Feature Modelling"
paper_id: "wang2023multimodal"
authors: "Wang, Chen, Ma, Avery, Hull, Carneiro"
year: "2023"
venue: "CVPR"
list: "appendix"
scope: "Reference"
section: "Modality Imbalance & Missing-Modality Learning (General)"
subsection: ""
fusion_level: "feature"
architecture: "Other"
tags: ["missing-modality"]
paper_link: "https://arxiv.org/abs/2307.14126"
code_link: ""
doi: "10.1109/CVPR52729.2023.01524"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "Yes"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Shared-specific features + residual fusion for missing modality at train/test.

## 点评

全名 Multi-modal Learning with Missing Modality via Shared-Specific Feature Modelling（医学分割 + 音视频分类）。解耦纯任务驱动、非正交非互信息：一个 shared encoder 出模态不可辨的 r（辅助任务把 r 压向模态不可辨），每模态一个 specific encoder 出可辨模态的 s，两空间之间没有任何显式几何约束；解码器恒消费全部模态槽位（残差融合）。缺失处理是「均值顶替」：缺失槽位填幸存模态 shared 特征的无权均值、不含任何 specific 成分——顶替向量是跨模态共识先验而非缺失模态的证据；两模态时退化为把幸存者的 r 原样复制进缺失槽（特征版的 copied-input）。失效模型只有二值缺席：无质量估计、无门控、融合权重由架构写死；损坏在场在其框架中比缺席更糟且无从察觉（结构推断）——损坏模态的 r/s 照常全额进入自身槽位，若同时另一路缺失、其 r 还会污染顶替向量（双通道污染），且对齐假设在损坏下先行失效而模型无信号知晓。它是缺失模态标准解法在 damaged 端原理上不适用的干净代表：damaged 在其词汇中不存在。消融暴露增益归因要打折（去掉解耦辅助任务模型仍能工作，缺失鲁棒性的主要载体是均值顶替规则 + 残差结构）；单模态行摆幅极大（缺了哪一路远比怎么处理缺失重要）。在缺失模态综述的问题设定内（q=0、对标完整模态上限）它是「表征替代派」的锚点，与 SMIL 的「重构派」相对；对「融合不劣于丢弃一路」的下限判据零贡献（其唯一单模态对照是单独训练的模型、不是同一模型丢弃一路）。

## 框架图

![ShaSpec 方法主框图（原文 Figure 2）：缺失模态情形的训练/评估图（共享-特有编码与缺失特征生成顶替）](figs/shaspec.webp)

*原文 Figure 2：缺失模态情形的 ShaSpec 训练/评估图。图中第 n 路输入 x^(n) 灰显为缺失，其融合特征 f^(n) 由中间的「Missing Modality Feature Generation」模块从可用模态的 shared 特征生成（即式 (4) 的均值顶替）；其余模态经各自 Specific Encoder 得 s^(i)、经共用 Shared Encoder 得 r^(i)，再由残差融合块（投影 + Skip Connection）得 f^(i)；全部 N 个槽位（含顶替的 f^(n)）送入 Decoder 输出 y。蓝色虚线箭头标出两个辅助目标：Distribution Alignment Objective 作用于 shared 特征列、Domain Classification Objective 作用于 specific 特征列。原文图 1 是同一架构的全模态版本（无 generation 模块、x^(n) 正常在场），两图共享同一骨架；选图 2 是因顶替机制为本文核心贡献所在。图源：Wang et al., CVPR 2023（arXiv:2307.14126）Figure 2。*

## 问题定义

处理的全名是 Multi-modal Learning with Missing Modality via Shared-Specific Feature Modelling（方法简称 ShaSpec）。其失效模式只有一个：整模态缺席，且训练期与测试期都可缺失。缺失是二值的——一路模态要么完整在场、要么整体消失；全文没有分级退化、没有「在场但损坏」的设定，损坏/噪声/传感器故障从未出现。两种训练制度都覆盖：dedicated（为每种缺失组合单独训一个模型，即 ACN 等医学分割前作的做法）与 non-dedicated（训练时随机丢弃模态、一个模型处理全部组合）。对既有路线的批评定位：重构派（SMIL 的元学习特征重构、HeMIS 的均值/方差统计融合、MVAE 生成补全）架构复杂且任务绑定（分类模型改不了分割）；解耦派前作 Robust-MSeg 用 appearance code 做重构、与分割任务弱关联且不能处理训练期缺失。ShaSpec 的主张是：把表征学成 shared（模态鲁棒）+ specific（模态专属）两部分，缺失时用 shared 部分顶替即可，无需任何生成。定位是缺失模态学习中「共享表征替代」路线的最简代表作之一：不重构缺失模态、不训练生成器，直接用幸存模态的共享特征顶替缺失槽位。任务与模态为医学影像分割（BraTS2018 脑肿瘤，四种 MRI 序列）+ 音视频分类（Audiovision-MNIST：MNIST 图像 + 语音音频），§4.5 另附一个 X 光图像 + 临床文本分类实验（OpenI）——刻意用「一个方法同时适配分割与分类」立论。

## 方法细节

编码器结构：所有模态共用一个 shared encoder 得共享特征 r^(i)；每个模态另有自己的 specific encoder 得专属特征 s^(i)。解耦不在结构上做硬划分，而靠两个辅助任务塑造。残差融合：投影层吃 [r; s] 拼接，输出作为残差加回 shared 特征，得该模态的融合特征 f^(i)。解码器恒定消费全部 N 个槽位的融合特征（分割为 UNet 解码器、融合发生在 UNet 底部；分类为 FC 层）。shared/specific 的解耦方式——没有正交、没有互信息约束：作者明确反对 Jia et al. 的正交性判据（称之为 arbitrary orthogonality criterion），解耦完全由两个辅助分类任务完成：DAO（分布对齐目标）作用于 r——让 shared 特征不可辨模态。论文给出三种等价形式：(i) 混淆式 CE：驱动模态分类器输出趋向均匀分布 1/N（源自 Ganin & Lempitsky 的域适应）；(ii) 各模态 r 经线性投影 + softmax 后的两两 KL 散度；(iii) 两两 p-范数距离。实验最终用 L1 形式，权重 α = 0.1。DCO（域分类目标）作用于 s——用 CE 损失从 s^(i) 分类其所属模态，specific 特征必须可辨模态，权重 β = 0.02。总损失为任务损失 + α·DAO + β·DCO；除此之外，共享与专属两个空间之间没有任何显式几何约束。缺失模态特征生成（核心机制）：缺失模态在解码器中的槽位，直接填幸存模态 shared 特征的无权均值（多路缺失时在可用集上适配系数）。不是网络生成的、不是检索的，且不含任何 specific 成分：顶替向量是跨模态共识，不是缺失模态的证据。特例：模态数 N = 2 时，顶替特征恰等于幸存模态的 r——特征层面的「复制幸存者共享表征」。缺失训练细节：non-dedicated 训练随机丢模态；缺失槽位的 r、s 从 DAO/DCO 损失中剔除，任务损失用生成特征计算。推理期架构对缺失的处理与训练期完全同构。另有 ShaSpec* = ShaSpec + prediction smoothness enhancement 后处理（两跳邻域连通 + 删除小于阈值的小区域），仅用于 BraTS 分割数字。

## 实验设置

BraTS2018（表 1、表 2）：Flair/T1/T1c/T2 四序列；285 例训练（210 高级别 + 75 低级别胶质瘤），66 例经官方在线评测（标注隐藏）；Dice 指标，子区 ET/TC/WT。3D UNet 骨干，SGD（Nesterov 0.99）+ 学习率 1e-2 余弦退火，180k 次迭代、无模型选择。表 1（non-dedicated）枚举全部 15 个非空模态子集；表 2（dedicated）只报 4 个单模态可用设定，对手为 KD-Net 与 ACN。Audiovision-MNIST（表 3、图 3）：完全沿用 SMIL 的协议与编码器——1500 对图像（28×28）+ 音频（FSDD 经 MFCC 转 20×20×1），70/30 划分；训练子集的音频可用率设为 5%/10%/15%/20%（即训练期重度缺失），评测只喂图像。Adam、60 epochs。OpenI（§4.5 附加实验）：3851 对胸片 + 报告文本，二分类；训练时 30% 缺失图像、只用文本评测。评测边界：全部协议中「缺失」都是整模态移除，训练期缺失由随机丢弃模拟；没有任何损坏/退化/噪声注入评测，「幸存模态本身不可靠」的情形不在其问题设定内。

## 关键数字

BraTS non-dedicated 全组合平均（表 1）：ShaSpec ET 61.58 / TC 77.45 / WT 85.92；ShaSpec* 63.08 / 77.88 / 86.26。最强基线 mmFormer 为 59.85 / 72.97 / 82.94（U-HeMIS 46.10 / 62.57 / 74.05、U-HVED 46.76 / 64.84 / 79.16、Robust-MSeg 51.02 / 69.78 / 84.39）。正文 §4.3 给的对第二名边距为 ET +3.23、TC +4.91、WT +3.32；48 个格子中 45 个居第一或第二。完整模态行（表 1）：ShaSpec ET 78.08 / TC 85.45 / WT 90.88——注意它与单模态行之间的巨大落差（下条），且论文从未把这两端写成任何判据关系。单模态极端（表 1）：仅 T1c 时 ET 73.29，仅 Flair 时 ET 43.52——幸存子集的身份造成的摆幅（约 30 个 Dice 点）远大于缺失处理机制本身的边距，「缺了哪一路」比「怎么处理缺失」重要得多。BraTS dedicated（表 2，仅单模态设定）：ShaSpec 平均 ET 52.41 / TC 73.92 / WT 83.67（ShaSpec* 53.80 / 74.30 / 83.76），对第二名边距 +2.46 / +1.54 / +0.58，12 格中 11 格最佳。Audiovision-MNIST（表 3），音频可用率 5%/10%/15%/20% 下的分类准确率：ShaSpec 93.33 / 93.56 / 93.78 / 94.67，SMIL 92.89 / 93.11 / 93.33 / 94.44；下限 LowerB（只用图像单独训练的 LeNet）92.35，上限 UpperB（完整双模态）98.22——ShaSpec 处处压 SMIL，但距完整模态上限仍差约 3.5–4.9 点。OpenI（§4.5）：ShaSpec AUC 0.89（30% 缺图训练、纯文本评测）vs 拼接基线 0.87；完整模态拼接 0.90；单模态 AUC 图像 0.77 / 文本 0.86。效率（§4.5，与 SMIL 在 Audiovision-MNIST 上同机对比）：参数 0.22M vs 0.33M；训练单步 0.0257s vs 0.1309s；测试单步 0.0016s vs 0.0019s；显存恒定 1421 MiB，而 SMIL 涨至 24268 MiB 后 OOM。

## 消融说明了什么

DAO 形式不敏感（表 4，仅 T1 可用评测）：CE 41.23 / 62.72 / 73.91、KL 40.41 / 62.83 / 74.19、L1 42.58 / 64.53 / 74.82、MSE 43.19 / 62.44 / 73.25（ET/TC/WT）——四种对齐损失彼此只差 1–3 个 Dice 点，无一占优（正文称 L1 整体最好，但 MSE 的 ET 实际最高）。说明起作用的是「把 shared 空间压向模态不变」这个方向本身，对齐只是一个软正则，谈不上精确机制。两个辅助任务各自都非必需（图 4，α/β 敏感性）：α = β = 1 时性能显著塌陷（辅助损失淹没任务梯度），最优在 α = 0.1、β = 0.02；关键的是 α = 0（只有 specific）与 β = 0（只有 shared）时模型仍能在一定程度上分割肿瘤——缺失鲁棒性的主要载体其实是均值顶替规则 + 残差融合结构，解耦辅助任务只是塑形。论文对增益的归因（shared-specific 表征）因此要打折。缺失率扫描（图 3）：训练期双模态可用率 15%–100% 全程压 SMIL，趋势与表 3 一致。t-SNE（图 5）：训练数据上 shared 特征跨模态聚成一团、specific 特征按模态分开——宣称的几何成立，但只在训练分布上验证。后处理占了部分边距：ShaSpec* 的 smoothness enhancement 对 ET 提升明显（如仅 Flair 时 43.52 → 45.11）——头条边距有一部分来自连通域后处理而非表征学习，引用 ShaSpec* 数字时须注明。

## 局限

其一，失效模型只有二值缺席：没有任何模态质量估计、门控或逐模态加权，融合权重由架构写死。一路模态「在场但不可信」时，模型没有任何量能表达这件事——这不在其问题设定之内，但也意味着该框架对损坏在场原理上无防御。其二，顶替规则静默假设幸存模态健康：均值顶替对幸存模态的 shared 特征无权平均、不做筛选；若某幸存模态本身带噪，它的特征既全额进入自己的槽位、又进入缺失槽位的顶替向量。论文未评测、未讨论这种情形。其三，N = 2 时退化为复制：双模态场景下顶替向量就是幸存模态的 shared 特征本身，没有产生任何新证据；其 Audiovision-MNIST 的优势因此主要来自训练期的表征塑形而非顶替机制。其四，证据强度：BraTS 数字来自 66 例的隐藏在线评测，无重复、无方差报告；分类基准 Audiovision-MNIST 只有 1500 个样本、属玩具量级；表 1 的大边距部分来自 U-HeMIS/U-HVED 等明显更早的基线。其五，「任务无关」只验证了两个任务：分割 + 分类，各配任务头；没有检测实验。dedicated 结果只报单模态设定（表 2），未覆盖全部组合。

## 相关页面

- 主题综述：[[themes/missing-modality-compensation|缺失模态补偿：生成、替代与先验重建]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
