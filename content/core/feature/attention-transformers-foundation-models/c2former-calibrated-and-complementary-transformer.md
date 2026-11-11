---
title: "C2Former: Calibrated and Complementary Transformer"
paper_id: "yuan2024c2former"
authors: "Yuan & Wei"
year: "2024"
venue: "IEEE TGRS"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Alignment; Attention"
tags: ["alignment", "cross-attention", "transformer"]
paper_link: "https://arxiv.org/abs/2306.16175"
code_link: "https://github.com/yuanmaoxun/C2Former"
doi: "10.1109/TGRS.2024.3376819"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Cross-attention calibration + adaptive sampling for misaligned RGB-T pairs.

## 点评

以跨注意力校准处理未对齐配对；在 DroneVehicle 与 KAIST 上评测。

## 框架图

![C2Former 方法主框图（原文 Figure 5）：双流 ResNet-50 支路在 Stage 2、3、4 后各接一个 C2Former 模块（内含 AFS + ICA）](figs/c2former-calibrated-and-complementary-transformer.webp)

*原文 Figure 5：C2Former 检测器框架。RGB 与 IR 两条 ResNet-50 支路（Stage 1–4）并行；Stage 2、3、4 后各接一个 C2Former 模块（粉色虚线框，内含 AFS 自适应特征采样 + ICA 跨模态交叉注意力），其互补特征输出经 ⊕ 加回对侧支路的下一阶段输入；最后一级两模态特征相加后送入检测头（图中未画 FPN）。图源：Yuan & Wei, IEEE TGRS 2024（arXiv:2306.16175）Figure 5。*

## 问题定义

作者把 RGB–IR 检测的困难归结为两个相互耦合的问题。（1）模态失准（modality miscalibration）：现有方法默认配准后的图像对已严格对齐，但两传感器视场与成像时刻不同、运动目标不同步，配准后实际只是弱对齐（weakly aligned），同一目标在两模态中的位置存在偏移。（2）融合不精确（fusion imprecision）：两模态特征在颜色、纹理、物理属性上差异大，简单拼接或光照感知融合没有利用互补信息，甚至出现融合特征不如红外单模态特征的情况（图 1(b) 以 MBNet 为例）。既有工作把两件事分开处理：AR-CNN 一类在检测头预测 proposal 级偏移（只适用于两阶段、且不保证 proposal 内部特征对齐），融合一侧则停留在拼接/求和。作者主张二者必须在同一个机制里同时解决，并声称这是首个把 Transformer 引入 RGB-T 检测的工作。问题设定的默认前提仍是两路输入完好；「鲁棒」只出现在「全天候应用」的动机层面。

## 方法细节

C2Former 是一个可插拔的特征级融合模块，由 ICA 与 AFS 两个子模块串联：骨干特征先经 AFS 降采样，再经 ICA 产出「已校准的互补特征」，加回对侧骨干流（图 5），最后一级两模态特征求和后送 FPN 与检测头。「Calibrated」的确切含义需分清两层：主层是隐式校准——ICA 的跨模态注意力本身完成对齐：对一个模态的每个特征点（query），在另一模态全部特征点（key）上算相似度，softmax 后对 value 加权求和；最相关的点权重最大，因此聚合出的特征天然落在参考模态的空间布局上——校准是注意力聚合的副产品，没有显式形变场、没有偏移监督。显式校准只存在于 AFS 的采样环节：AFS 先预测两模态间的粗偏移，采样 RGB 时把采样网格加上偏移（IR 网格不动，作参考），使被保留下来的特征点对大致对齐，避免均匀采样把对应点整对丢掉。ICA（跨模态交叉注意力）三步：(1) 模态归一化（仅作用于 query 的生成）：先对一模态特征做 instance normalization，再用由另一模态特征经 CNN 预测的缩放/平移参数（并叠加另一模态自身的均值与标准差）做仿射变换，把该模态特征「搬进」另一模态的分布（AdaIN 式分布迁移），以减小跨谱描述子方差、让相似度可比；注意不对称设计——只有 query 由归一化后的特征生成，key、value 仍由原始特征生成。(2) 跨相关对齐：两个方向的相似度矩阵分别由 IR 的 query 与 RGB 的 key、RGB 的 query 与 IR 的 key 构成（带缩放），softmax 列归一化得到相似度矩阵。(3) 软注意力融合：每个模态的互补特征是用跨模态相似度加权聚合本模态自己的 value——RGB 内容在 IR 查询的引导下重组，IR 内容在 RGB 查询的引导下重组；再经卷积（用 AFS 时为 1×1 反卷积上采样）回到原尺寸；最终每个 C2Former 的输出加回对侧骨干，实现双向互补注入。AFS（自适应特征采样）：两模态特征拼接后 1×1 卷积降维，偏差网络（两层卷积 + ReLU）预测偏移（经 2·tanh 限幅）；以步长 s 对 IR 规则采样、对 RGB 按偏移后的网格双线性采样；其首要目的是把 ICA 的全局注意力成本降下来（无 AFS 时 FLOPs 约 +42G），顺带做粗对齐。挂载方式：双流 ResNet-50-FPN，在 Stage 2、3、4 后各插一个 C2Former（消融确定的最优配置）。作者构建了两个检测器验证可插拔性：单阶段旋转检测 S²A-Net（DroneVehicle）与两阶段水平检测 Cascade R-CNN（KAIST），均基于 MMRotate/MMDetection 修改。

## 实验设置

数据集两个，均为干净基准。DroneVehicle（无人机 RGB-IR 车辆）：56,878 张图、953,087 个实例，5 类（car/truck/freight-car/bus/van）旋转框标注，场景从白天到夜间；测试集报告 mAP@IoU 0.5。KAIST（多光谱行人）：95,328 对；用 Zhang et al. 的新标注训练、用改进标注测试；测试集 All 2,252 帧（Day 1,455 / Night 797）。指标为 MR⁻²（FPPI ∈ [10⁻², 10⁰] 的平均漏检率），给出 IoU 0.5 与 0.75 两张表，并按距离（Near/Medium/Far）、遮挡（None/Partial/Heavy）、昼/夜拆分子集。训练：24 epoch，单张 TITAN V，SGD（动量 0.9、权重衰减 1e-4），初始 lr 1e-3（第 16、22 epoch 除以 10），batch 为 2 张 640×512 图像对，NMS IoU 0.3，增广 flip/crop/mosaic。对照含单模态检测器（分别在 RGB、IR 上训练）、双流特征相加基线，以及 Halfway Fusion、CIAN、MBNet、AR-CNN、TSFADet 等多光谱方法（在旋转检测器上由作者复现）。

## 关键数字

DroneVehicle（表 IV，mAP）：C2Former-S²ANet 74.2（Car 90.2 / Truck 68.3 / Freight-car 64.4 / Bus 89.8 / Van 58.5），高于双流相加基线 71.5、MBNet 71.9、AR-CNN 71.6、TSFADet 73.1、CIAN 70.8、Halfway Fusion 70.0；单模态最强为 IR 的 S²A-Net 67.5（RGB 仅 61.0）——该数据集上 IR 全面强于 RGB。KAIST IoU 0.5（表 V，MR⁻²，越低越好）：All 28.39，优于此前最好 MBNet 31.87 与原版 Cascade R-CNN 33.35；Day 28.48 / Night 26.67 均为各列最好；Far 子集 48.14，比 MBNet 的 55.99 低约 8 个点（小目标是其相对优势最大处）；Heavy 遮挡 57.81（最好，但绝对值仍高）。KAIST IoU 0.75（表 VI）：All 75.50 vs MBNet 77.53，定位更严口径下仍领先约 2 个点。成本（表 III，统一挂到 Oriented R-CNN 上与 TSFADet 公平对比）：本文 73.8 mAP / 89.9G FLOPs / 100.8M 参数，优于 TSFADet 的 73.1 / 109.8G / 104.7M。口径提醒（两个头条数字不可混引）：74.2 是 S²A-Net 版本的数字，73.8 是 Oriented R-CNN 版本与表 I 中 ICA-only 配置的数字，引用时必须注明基检测器。全配置参数量（表 II）：Stage 2+3+4 三处挂载时 132.5M 参数。

## 消融说明了什么

组件（表 I，DroneVehicle）：基线（双流相加）71.5；只加 ICA → 73.8（+2.3），但 FLOPs 从 97.8G 涨到 139.8G；再加 AFS → 74.2（再 +0.4），FLOPs 回落到 100.9G。即 AFS 不只是压缩：它在砍掉约 39G 计算的同时还给了 +0.4，作者将其归因于采样阶段的粗对齐保住了对应特征点对。整体口径：+2.7 mAP 只多花约 3G FLOPs。挂载阶段（表 II）：只挂 Stage 4 为 72.1；Stage 3+4 为 73.4；Stage 2+3+4 为 74.2 达到饱和；再加 Stage 1 涨到 133.3M 参数而精度不再升（74.1）——深层语义阶段的跨模态交互有效，浅层只加成本。采样步长 s（图 6）：s ∈ {1,…,6} 性能整体保持高位，s=3 最好；作者据此称对该超参鲁棒（曲线精确数值未列表，此处为定性读图结论）。机制可视化（图 7、图 8）：相似度图上指定点的响应峰确实落在另一模态中对应的未对齐位置，是「注意力图编码了失准偏移」的直接证据；与 MBNet 的特征图对比（白天/夜晚/暗夜三行）显示其目标–背景对比度更高。缺口：模态归一化从未被单独消融——「校准」叙事里归一化与跨相关注意力各自的贡献没有拆开；AFS 偏移预测也没有与「固定均匀采样 + 同等降分辨率」的等成本对照（图 6 的步长扫描控制的是步长而非偏移开关本身，表 I 的 ICA-only 行是全分辨率无采样，不构成对偏移预测的隔离）。

## 局限

鲁棒性/退化评测为零（已逐项核查全文）：没有任何噪声注入、腐化套件、受控退化或缺失模态实验。KAIST 的 Day/Night 拆分与 DroneVehicle 的昼夜场景都是自然分布，不是受控退化协议；表 IV 的单模态行是独立训练的单模态检测器，不是「融合模型去掉一路输入」的缺失模态测试。全文的 robust 全部是定性修辞。「校准」的适用范围从未被量测：它处理的是 DroneVehicle/KAIST 数据分布内自带的弱失准；全文没有合成已知偏移量（如平移若干像素）的受控实验，因此能吸收多大的失准幅度无从得知。且 ICA 实际在 AFS 降采样后的网格上运行（步长最优为 3），小于采样步长的细偏移对注意力不可见。注意力无质量概念、且不能弃权：softmax 在另一模态全部位置上归一化为 1——无论对方模态多不可靠，总要选出「最相关」的位置并据此重组本模态特征；全机制没有任何置信度、可靠性或门控。若一模态退化（非移位而是内容损坏），其 query 会给出无意义的相似度分布去重组另一模态的 value，或其自身被污染的 value 被对方 query 正常加权取用，两条污染路径都通。成本仍高：挂载后总参数 100.8M（Oriented R-CNN 版）至 132.5M（S²A-Net 版），且无 AFS 时 ICA 单模块就让 FLOPs 约 +43%；与轻量单阶段检测器（如 YOLO 系）的部署取向不合。数字口径易混：74.2（S²A-Net）/ 73.8（Oriented R-CNN 公平对比与 ICA-only 消融）两个「本文成绩」并存，引用时必须注明基检测器。

## 相关页面

- 主题综述：[[themes/cross-modal-misalignment-unaligned-fusion|跨模态错位与未对齐融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
