---
title: "TFDet: Target-Aware Fusion for RGB-T Pedestrian Detection"
paper_id: "zhang2025tfdet"
authors: "Zhang et al."
year: "2025"
venue: "IEEE TNNLS"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
tags: ["pedestrian", "task-coupled"]
paper_link: "https://arxiv.org/abs/2305.16580"
code_link: ""
doi: "10.1109/TNNLS.2024.3443455"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Fusion-then-refinement with a segmentation branch and a correlation-maximum loss enhancing pedestrian/background feature contrast to suppress false positives.

## 点评

「target-aware」信号内生于融合特征本身：由初始融合特征经分割分支预测框级掩码（训练时以真值框监督），掩码与融合特征做通道级余弦相似度得相关向量、经投影 + sigmoid 生成门控——最终调制是纯通道级全局标量，掩码虽是空间图，却无空间门控、无实例级门控。门控模块作用于已经混完的融合特征，此处不存在模态维度的通路；且负相关损失明确把每个门值推向 1.0，训练目标本身反对关断任何通道。一路模态损坏时污染先混入融合特征、再由受污染特征预测掩码与门控，无独立锚点。KAIST MR 4.47 为当前头条精度（表 III 自报），但四个数据集全是干净基准、无退化/缺失评测，表内单模态行是独立训练的检测器而非撤除实验。LLVIP 头条 AP 71.1 是 YOLOv5 版（Faster R-CNN 版仅 59.4），不可混引；Far 子集 55.50 明显弱于同期多个方法，优势集中于 All/Near/Medium。

## 框架图

![TFDet 方法主框图（原文 Figure 5）：权重共享双路骨干、目标感知融合策略（FFM + FRM）与两种检测头总览](figs/tfdet-target-aware-fusion-for-rgb-t-pedestrian-detection.webp)

*原文 Figure 5：TFDet 总体架构。左为权重共享的双路 CNN 骨干（RGB/Thermal 各一路、Weights Sharing）；中为颈部的目标感知融合策略：上半 FFM——两路特征各过可变形卷积（DConv），经 riffle shuffle 把同一通道位置的两张通道图配组、分组卷积（GWConv）做平行通道融合，再由 GlobalCC 做跨通道重标定，得初始融合特征 Fx；下半 FRM——分割分支（Seg）从 Fx 预测框级掩码 m，掩码与 Fx 各通道图做通道级余弦相似度（CCS）得相关向量 v，经投影模块（Proj）得门值 s，与 Fx 逐通道相乘得精修特征 Fy；FRM 下方虚线框为仅训练期使用的相关性最大化损失（分割损失作用于 m、负相关损失作用于 s）。右为一阶段头（YOLO Head）/ 两阶段头（Faster R-CNN head）二选一。图底部附 CBR、GWConv、Seg、Proj 四个子模块的内部结构与符号图例（DConv、GlobalCC、CCS、拼接、通道乘）。图源：Zhang et al., IEEE TNNLS 2025（预印本 arXiv:2305.16580v4），Figure 5。*

## 问题定义

问题切口不在融合不足，而在融合的副作用：既有 halfway fusion 只管汇合两模态互补信息、不区分目标与非目标特征，融合特征图带噪，在背景区域产生大量假正例（FP）。作者先做了一组先导实验（§III-A、图 2）：在现成检测器输出上按（a）置信度、（b）与真值的 IoU 从高到低人工移除 FP，log-average MR 随之快速下降，且移除高分、低 IoU 的 FP 时下降最陡——即危害最大的 FP 是背景里与行人形状相似的结构（图 1(a)）被融合噪声抬成了高分误检。由此问题被表述为：融合策略除汇合互补信息外，还须做特征精修（fusion-refinement 范式）——增强目标区域表示、抑制非目标区域表示，把行人特征与背景特征的对比拉开，从而压低 FP。须注意，这里的「噪声特征」指融合算子自身产生的语义噪声，不是传感器噪声、不是模态退化；输入始终是干净、配对、对齐的双模态图像，全文没有损坏模态、缺失模态或传感器故障的设定。阅读依据：预印本 arXiv:2305.16580v4 全文；期刊正式版（IEEE TNNLS 2025）未逐字比对，版本差异以预印本 v4 为准记录。

## 方法细节

整体三段：权重共享 CNN 骨干提两模态特征 → 颈部目标感知融合策略（FFM 融合 + FRM 精修）→ 检测头。融合策略与骨干/检测头解耦，可挂一阶段（YOLOv5）或两阶段（Faster R-CNN）头，并在金字塔每个层级重复同一流程。（1）FFM 第一步——平行通道融合。设计前提是一个统计观察：把两模态特征逐通道做内积得通道关系矩阵，对角元普遍大（parallel-channel similarity，同通道位置的两模态特征最像）、非对角元也不小（cross-channel similarity）；作者用 ANR/AIR 两指标在 KAIST/LLVIP 上量化（表 I）。据此第一步用改进可变形卷积做同通道融合：两模态特征各过 DConv 学自适应感受野（应对行人尺度变化与跨模态错位），riffle shuffle 把同一通道位置的两张通道图配成一组（共 c 组），分组卷积（GWConv）逐组融合。（2）FFM 第二步——跨通道融合（GlobalCC）：对第一步输出做通道重标定（结构为拼接 + Conv-BN-ReLU + GAP + Conv + Sigmoid 的自门控），得初始融合特征 Fx。（3）FRM 是「目标感知」的确切所在，其信号来源须钉清：不是检测头反馈、不是外部显著性图，而是由初始融合特征 Fx 本人经一个分割分支预测出的框级掩码。Seg 分支从 Fx 预测掩码 m（sigmoid 输出），训练时以真值框级掩码（框内填 1、其余 0）监督，测试时用预测值。随后以通道级余弦相似度（CCS）算 m 与 Fx 每个通道图的内积，得相关向量 v；v 过投影层 Proj（Conv + ReLU + Conv + sigmoid）得门值 s；精修特征 Fy = s 与 Fx 逐通道相乘。粒度须分清：掩码 m 本身是空间图，但它只经内积被压成通道维向量，最终施加到特征上的调制是纯通道级的——每通道一个标量、空间上均匀。不是空间门控，不是实例级门控，更不是模态级门控：调制对象 Fx 是 FFM 已经混完的双模态特征，FRM 处不存在模态维度的通路。（4）相关性最大化损失（仅训练期）：由分割损失（BCE + Dice，监督预测掩码对真值框级掩码，真值掩码以最近邻下采样至预测尺寸）与负相关损失组成，后者把每个门值 s_i 推向 1.0（系数 α = 0.1）——其理论依据是原文 §III-B 的推导：若处理后相关的每项都趋于 1，则每个通道的加权平均特征都趋于与掩码一致，即全通道被拉向前景模式。多阶段的相关性最大化损失与检测分类/回归损失联合训练。（5）多类扩展时掩码构造改为「所有目标类区域填 1」，其余机制不变。

## 实验设置

KAIST：更新版（改进标注），训练 7,601 对 / 测试 2,252 对，512×640；Faster R-CNN + VGG-16；指标 log-average MR，主表（表 III）口径为 reasonable 子集（无/部分遮挡、高度 > 55 px），另分场景子集 All-Day/Day/Night 与距离子集 Near（高度 ≥115 px）/ Medium（[45,115)）/ Far（[1,45)，仅无遮挡）。LLVIP：训练 12,025 对 / 测试 3,463 对，1024×1280；两版基线——Faster R-CNN + ResNet-50 与 YOLOv5-Large；指标 AP / AP50。FLIR：对齐版（去未配准图像对），3 类（person/car/bicycle），训练 4,129 对 / 验证 1,013 对，512×640；Faster R-CNN + Swin-Transformer-Tiny，AdamW，lr 1e-4。M3FD：6 类；无官方划分，采用既有划分（训练 2,905 / 验证 1,295 对），图像统一处理为 640×640；YOLOv5-Small 训练 36 epochs；全部对比方法由作者按同一划分复现（正文明确说明），图像融合类方法先用其代码生成融合图再训同一检测器。训练通则：Faster R-CNN 训练 12 epochs、总 batch 6、SGD lr 0.01（epoch 8/11 各衰减为十分之一）、增广仅随机水平翻转，MMDetection 实现；YOLOv5 用官方配置（LLVIP 训 100 epochs）；两块 GTX 3090。评测足迹核查（全文核查）：四个数据集均为干净基准；KAIST 的 Day/Night 与 LLVIP 的低光照都是自然采集划分，不是受控退化协议。无模态置零/丢弃、无噪声注入、无损坏或故障评测。各表中的单模态行是独立训练的单模态检测器，不是同一模型撤掉一路输入。对比数字的自报/转引区分（已核查）：M3FD 对比为作者同划分复现；KAIST 表中 M2FNet 一行为作者按 12 epochs 复训（正文自陈其数值与 M2FNet 原文不同）；其余对比行原文未逐行标注，按惯例为转引原论文数值。推理时间为跨硬件比较（见关键数字）。

## 关键数字

KAIST（表 III，自报）：TFDet All-Day MR 4.47 / Day 5.22 / Night 3.36 / Near 0.00 / Medium 9.29 / Far 55.50。此前最好多光谱方法 LG-FAPF 5.12（转引），绝对增益 0.65（与摘要口径一致）；正文称相对最佳单模态（Faster R-CNN）绝对增益 9.46。作者自陈：首个以 12 epochs 训练达到 MR < 5% 的方法。注意 Far 子集 55.50 在表内并不靠前——MCHE-CF 36.75、UCG 37.16、RITA 40.90、LG-FAPF 40.47 均显著更好，TFDet 的优势集中在 All/Day/Night 与 Near/Medium。KAIST 单模态对照（表 III，通用检测器在同协议下的单模态行）：RGB Faster R-CNN All 18.86（Day 13.78 / Night 29.70）；热红外 Faster R-CNN All 13.93（Day 18.79 / Night 4.93）；RGB/热红外 YOLOv5 分别为 22.68 / 15.75。DCMNet 行（表 III/IV，转引 DCMNet 原文）：KAIST All 5.84 / Day 6.48 / Night 4.60 / Near 0.02 / Medium 16.07 / Far 69.70；LLVIP AP 58.4、AP50 未报。LLVIP（表 IV，自报）：TFDet-YOLOv5 AP 71.1 / AP50 97.9；TFDet-FasterRCNN AP 59.4 / AP50 96.0。最佳单模态为热红外 YOLOv5 67.0 / 96.5（正文：+4.1 AP）；此前最好多光谱 LRAF-Net 66.3 / 97.9（转引；正文：+4.8 AP）。引用纪律：头条 LLVIP 数字是 YOLOv5 版；Faster R-CNN 版（59.4）反低于 LRAF-Net 的转引值（66.3），两版不可混引。FLIR（表 V）：TFDet AP 46.6 / AP50 86.6；最佳单模态 TIRDet 44.3 / 81.4（热红外基，正文 +2.3 AP）；此前最好多光谱 Fusion-Mamba 44.4 / 84.3（转引，+2.2 AP，与摘要一致）。M3FD（表 VI，全部自报口径——对比方法均为作者同划分复现）：TFDet AP 41.0 / AP50 64.8；TarDAL 39.1 / 61.9（+1.9，与摘要一致）；单模态基线 RGB 36.1 / 60.2、热红外 34.9 / 57.2。推理时间（表 VII，口径需谨慎）：KAIST 512×640，TFDet 0.13 s/图为作者 RTX 3060 实测；对照值是转引的 TitanX 口径，作者以「公开文档确认算力等效」弥合——属跨硬件比较，引用时注明。

## 消融说明了什么

（1）FFM 内部（表 II，KAIST MR）：固定感受野（Fixed-RP）9.90 → 自适应感受野（Adaptive-RP，DConv）8.96 → 再加普通 1×1 卷积通道重标定（ConvCC）8.94 → 完整 FFM（换 GlobalCC）8.57。自适应感受野贡献大头（−0.94）；GlobalCC 相对普通卷积通道重标定只多 −0.37——FFM 的增益主要来自对齐/感受野，不是通道门控。（2）组件递进（表 VIII，KAIST MR）：仅 FFM 8.57 → +FRM 6.82 → +分割损失 5.41 → +负相关损失（完整 TFDet）4.47。FRM 结构与两个损失分量各值约 1.4–1.7 个 MR 点：增益在精修侧逐件累积，且掩码监督质量与相关拉升缺一不可。（3）FP 计数（图 13 等）：KAIST 上分数 ≥ 0.3 的 FP 数 1,105（仅 FFM）→ 541（+FRM）→ 490（+分割损失）→ 441（完整）；全数据集 FP 总数（无 vs 有 FRM 与相关性最大化损失）KAIST 26,159 → 11,879、LLVIP 6,350 → 2,416。与先导实验构成闭环：高分 FP 减半以上与 MR 下降同步出现，「减 FP」不是叙事而是可计量的。（4）统计前提的强度（表 I）：通道相似性指标 ANR/AIR 在 KAIST 512 通道最显著（3.52 / 8.65），但在 LLVIP 仅 1.48 / 1.76、1024 通道 1.46 / 1.97——FFM 的设计前提在 LLVIP 上证据弱得多，方法却同样有效；结合表 II/VIII 的归因，实际增益主要来自 DConv 对齐与 FRM 精修，而非通道相似性统计本身。

## 局限

（1）退化/缺失评测为零（已核查全文）：无模态置零、无噪声注入、无损坏协议、无热成像故障模型（条纹/非均匀性/坏点/饱和均未出现）；「低光照优势」由 LLVIP 自然低光数据与 KAIST Night 自然子集支撑，是场景划分而非受控退化。表内单模态行不能替代同一模型的模态撤除实验。（2）门控无模态语义：s 是融合后特征的通道门，取值 (0,1)，且负相关损失明确把每个 s_i 推向 1——该门在设计上既不能关断任何通道到零，更没有模态维度的表达；s 不对应任何可解释的物理量（非模态可靠性、非通道质量分），其区分度由检测损失与分割损失间接塑造。（3）信号内生于融合特征：掩码 m 由融合特征 Fx 本人经 Seg 分支预测，门控 s 又由 m 与 Fx 的相关导出，整条「目标感知」链没有独立于融合结果的锚点；若一路模态被损坏，污染先混入 FFM 进入 Fx，再由受污染的 Fx 预测掩码、生成门控。（4）掩码监督粗糙：框级掩码把矩形框内背景一并标为前景，对比增强的监督信号本身带噪；多类扩展时所有类别共用一张二值掩码，不区分类别。t-SNE 可视化是定性证据，无定量分离度指标。（5）短板未讨论：Far 子集 55.50 明显落后于多个对比方法（最小/最远行人恰是 FP 抑制最难惠及的群体），作者未分析；通道相似性统计在 LLVIP 上弱（表 I）亦未讨论。（6）数字口径混排：KAIST/LLVIP/FLIR 表中自报与转引未逐行标注（仅 M2FNet 一行有复训说明、M3FD 全表为复现）；推理时间为跨硬件比较。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
