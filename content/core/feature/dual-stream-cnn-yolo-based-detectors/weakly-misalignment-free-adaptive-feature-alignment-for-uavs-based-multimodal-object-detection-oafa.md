---
title: "Weakly Misalignment-free Adaptive Feature Alignment for UAVs-based Multimodal Object Detection (OAFA)"
paper_id: "chen2024weakly"
authors: "Chen et al."
year: "2024"
venue: "CVPR"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Alignment"
tags: ["alignment", "aerial"]
paper_link: "https://openaccess.thecvf.com/content/CVPR2024/papers/Chen_Weakly_Misalignment-free_Adaptive_Feature_Alignment_for_UAVs-based_Multimodal_Object_Detection_CVPR_2024_paper.pdf"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Estimates cross-modal offsets in a modality-invariant common subspace and performs offset-guided deformable alignment.

## 点评

「弱失准」的确切所指是数据已经过数据集侧预配准后的残差——它实测 DroneVehicle 约 35% 的 GT 框存在跨模态偏移、量级多在 0–15px，是可引用的真实残余失准量级；标题的 misalignment-free 指方法不依赖严格对齐、不需要 GT 偏移监督，不是数据无失准。其基础偏移只从模态不变特征估计，总损失只有检测损失 + 解耦损失、无任何对齐损失，全文未报告任何对齐误差指标——所谓精确偏移不可证伪，只是对检测有用的采样先验。对齐后融合是纯通道拼接，无门控、无加权、无任何可靠性量。§4.4 有受控失准评测（固定 IR、只平移 RGB、Δ∈[−15,15] 网格，协议规范），但结果仅三维曲面图、无数值表，且训练集本身含同量级天然失准、不是未见失准泛化测试，可引用性弱于 AR-CNN。头条数字（验证集 mAP@IoU 0.4）79.4，高于单模态 YOLOv5s-IR 的 70.7；消融显示报告数字对训练配方高度敏感（两阶段训练净值约 +2.1）。退化/缺失/故障评测为零；结构上 IR 被无条件信任为几何参考，RGB 内容退化时注意力会把退化纹理读作差异信号污染偏移估计、仍以全权重拼入融合——无模态健康判断、无折扣、无弃权。

## 框架图

![OAFA 方法主框图（原文 Figure 2）：双流特征提取、CSOM 偏移建模与 ODAF 偏移引导可变形对齐融合的总体架构](figs/weakly-misalignment-free-adaptive-feature-alignment-for-uavs-based-multimodal-object-detection-oafa.webp)

*原文 Figure 2：自左至右为双流特征提取（RGB 为被感知模态 Sensed Modality、IR 为参考模态 Reference Modality）→ 上半 CSOM 模块（子图 (a) 解耦多模态学习 DML 与 (b) 空间偏移建模 SOM，输出预测偏移 φ_c）→ 下半 ODAF 模块（子图 (c) 偏移引导可变形对齐把原始被感知特征自适应调整为对齐特征；子图 (d) 解耦特征融合把对齐后的 RGB 不变/特有特征与原始 IR 特征拼接为融合特征 F_f）→ DetNet 输出检测结果；图底部附完整的算子图例。图源：Chen et al., CVPR 2024 Figure 2。*

## 问题定义

针对的是「弱失准」（weakly misalignment），其确切含义须拆开看：数据状态假设是图像对已经过预配准——DroneVehicle 本身对每对 RGB–IR 做过预配准，但因两传感器成像原理、分辨率与视场不同，加上采集时间差与目标运动，预配准后仍残留局部空间不一致，这就是弱失准。作者用图 4 给出量化：DroneVehicle 中约 35% 的 GT 框在两模态间存在偏移，偏移距离大多在 0–15 像素。它与两端的关系是：不是完全未对齐（不存在大范围平移/尺度/旋转的待搜索对应关系，偏移量级是十余像素的局部残差），也不是严格对齐（像素级一一对应被明确否定为不可达且代价高）。标题中的 misalignment-free 指方法侧不依赖严格对齐——不需要 GT 偏移量等额外标注来监督对齐，不是说数据无失准。作者归纳的两个困难：（1）模态鸿沟污染偏移估计——外观差异会被误读为空间偏移；（2）既有方法对严格对齐的依赖使检测性能被对齐质量绑架，且对齐失败会把误差传导到检测。因此目标不是把特征「对齐到正确位置」，而是为检测任务自适应地找到「最优融合位置」（optimal fusion positions），对齐从属于检测损失。

## 方法细节

整体（图 2）：RGB 为被感知模态（sensed modality，其特征被移动），IR 为参考模态（reference modality，特征从不形变）。双流提取多尺度特征后依次过 CSOM 与 ODAF，最后拼接融合送检测头；框架为双流 YOLOv5s（基线即双流拼接融合的 SLBAF-Net），旋转框（OBB）检测头，监督标注只用 IR 模态的 GT（因 IR 标注的目标更完整）。CSOM 之一是解耦多模态学习（DML，图 2a）：每路特征被拆为模态不变特征与模态特有特征；不变编码器跨模态共享参数（结构为一层卷积 + SiLU，走浅层），特有编码器各模态独立参数（卷积 + C3 模块，更深）——依据是「低层特征跨模态更相关、高层更不相关」的假设。三项约束：相似性损失用中心矩差异（CMD）拉近两路不变特征的分布；差异损失用 Frobenius 范数式度量推远不变/特有之间及两路特有之间的相关；语义损失把 YOLOv5 的分类/回归/目标性损失直接加在不变特征上，防止不变分支学到无用噪声——该辅助检测分支推理时移除；三项权重 λ = 0.03/0.01/0.03。CSOM 之二是空间偏移建模（SOM，图 2b）：偏移只从不变特征估计，以隔绝模态鸿沟——两路不变特征各过空间注意力（CBAM 式结构）后不做减法而做拼接得到差异特征（作者称拼接可减轻无人机复杂背景的干扰），再经通道注意力（平均/最大池化后过共享 MLP）加权并残差得到增强特征，两路增强特征经一非线性层融合，输出基础偏移 φ_c。关键点：φ_c 没有任何 GT 偏移监督，全文亦无单独的对齐损失——它只由检测损失与解耦损失端到端塑造（对齐子任务并入主检测任务）。因此 φ_c 是「对检测有用的采样先验」，其数值是否等于真实几何偏移，文中没有任何度量验证。ODAF 之一是偏移引导的可变形对齐（图 2c）：对被感知模态 RGB 的不变与特有特征做可变形卷积采样，采样位置 = 参考点 + φ_c + 3×3 规则网格 + 残差偏移，其中残差偏移与调制标量都由 φ_c 映射生成，而非像标准可变形卷积那样从被采样特征本身预测——作者动机是引用 BasicVSR++ 一脉的结论：无引导的可变形对齐训练不稳定、易偏移溢出，φ_c 作为显式先验降低学习负担；分数位置用双线性插值，IR 特征不做任何采样移动。ODAF 之二是解耦特征融合：对齐后融合算子是纯拼接，无门控、无加权——不变部分先把对齐后的 RGB 不变特征与原始 IR 不变特征拼接并过 1×1 卷积，再与对齐后的 RGB 特有特征、原始 IR 特有特征沿通道拼接得融合特征，送检测头。总损失 = 检测三项损失 + 解耦损失。训练分两阶段：阶段 I 只用检测损失训练特征提取与朴素拼接融合，让单模态表征先充分（50 epoch）；阶段 II 以阶段 I 权重初始化骨干，加入全部模块用总损失联合训练（100 epoch）。

## 实验设置

数据集仅 DroneVehicle 一个：28,439 对 RGB–IR 图像、953,087 辆车，5 类（car、truck、bus、van、freightcar），旋转框标注；划分 17,990 训练 / 1,469 验证 / 8,980 测试。注意其图像对已经过数据集侧预配准，弱失准是预配准后的残差（图 4 统计）。指标口径：验证集 mAP，IoU 阈值 0.4（DroneVehicle 惯例，明显低于通行的 0.5，跨数据集引用时须注明），全部对比方法统一用 OBB 头。实现：单张 RTX A6000 48GB；PyTorch；SGD（动量 0.937、权重衰减 0.0005），初始学习率 0.01、余弦退火至 0.002；输入 640×640，batch 16，共 150 epoch；标签用 IR 的 GT。对比方法（表 1）：单模态 6 种定向检测器（RetinaNet、Faster R-CNN、Oriented R-CNN、S2ANet、RoITransformer、YOLOv5s）分别在 RGB 与 IR 上；融合 8 种（UA-CMDet、Halfway Fusion、CIAN、AR-CNN、MBNet、TSFADet、C2Former、SLBAF-Net），各自用原论文设置。位移鲁棒性协议（§4.4）：模型在原始训练对上训练，在人工平移的验证对上评测——固定 IR，只把 RGB 沿 x、y 方向平移，Δx、Δy ∈ [−15, 15] 像素整数步进（即 31×31 种组合），结果以图 5 三维曲面（基线 vs OAFA）呈现。

## 关键数字

主结果（表 1，验证集 mAP@IoU 0.4，%）：OAFA 总 mAP 79.4，为全表最高，比第二名基线 SLBAF-Net（76.1）高 3.3 个点；各类 AP：car 90.3、truck 76.8、freightcar 73.3、bus 90.3、van 66.0。优势主要在易混类别：truck 比 SLBAF-Net 高 4.8（76.8 vs 72.0），freightcar 高 4.7（73.3 vs 68.6），van 高 6.1（66.0 vs 59.9）。单模态对照行（表 1）：最强单模态是 YOLOv5s-IR 70.7（RGB 仅 62.1）；RoITransformer-IR 70.3、S2ANet-IR 67.5。即 OAFA 比最强单模态高 8.7 个点，且 IR 单模态整体系统性强于 RGB 单模态。其余融合方法（表 1）：C2Former 74.2、TSFADet 73.1、MBNet 71.9、AR-CNN 71.6、CIAN 70.8、Halfway Fusion 70.0、UA-CMDet 64.0（甚至低于 IR 单模态最强行）。速度（表 1，batch=1、640×640、无后处理）：OAFA 33.1 fps，慢于 SLBAF-Net 的 63.2 fps，快于其余多数融合方法（UA-CMDet 9.1、AR-CNN 18.2、TSFADet 18.6、Halfway 20.4、CIAN/MBNet 21.7）；作者承认以额外耗时换精度。消融（表 2，基线 SLBAF-Net 76.1）：只加 SOM 76.5（+0.4）；只加 DML 77.7（+1.6）；两者合为 CSOM 78.2（+2.1）；只加 ODAF 77.8（+1.7）；CSOM+ODAF 但不用两阶段训练 77.3；完整 OAFA（含两阶段）79.4。位移鲁棒性（§4.4 与图 5）：正文只给曲面图与定性结论——偏移增大时 OAFA 的 mAP 波动小、基线明显下降；图 5 没有数值表，正文也未报任何具体偏移量下的 mAP 数值，故无法引用「偏移 X 像素时掉 Y 点」式数字。失准基线统计（图 4）：DroneVehicle 约 35% 的框存在跨模态偏移，偏移多在 0–15 像素——这正是 §4.4 人工平移范围 [−15, 15] 的取定依据。

## 消融说明了什么

偏移估计的质量瓶颈在模态鸿沟而非偏移头本身：单独 SOM（直接在未解耦特征上建模偏移）只值 +0.4，而先解耦（DML）再建模的组合达 +2.1，DML 单独也有 +1.6——解耦既改善偏移输入，也因融合前去冗余直接有益于检测。ODAF 单独加到基线（无 CSOM 引导）有 +1.7，但作者自承此时「训练稳定性差」——可变形对齐的增益与不稳定性并存，φ_c 引导的价值一半在精度、一半在可训练性。两阶段训练不是边角料：CSOM+ODAF 齐备但单阶段训练只有 77.3，比单独 CSOM（78.2）还低；加上两阶段才到 79.4，净值约 +2.1，是全表最大的单项增量之一。说明该架构的报告数字对训练配方高度敏感，复现时不可只抄结构。消融的盲区：没有对 φ_c 本身的评测（无估计偏移 vs 真实偏移的误差、无对齐前后对应点距离），也没有把「换成 GT 偏移/恒等偏移」作为对照，因此「偏移估计更准」这一核心主张在消融层面未被直接验证，只有下游 mAP 的间接证据。

## 局限

单数据集、单场景：全部结论只建立在 DroneVehicle（无人机车辆、预配准数据）上；无行人数据集（KAIST/LLVIP/FLIR）验证，「弱失准」的量级分布（0–15 px）是否迁移到其他平台未知。鲁棒性评测单一且不可量化引用：受控失准只有刚性平移一种（无尺度/旋转/局部形变，而同数据集上的 TSFADet 恰恰建模平移 + 尺度 + 旋转），且结果仅曲面图、无数值表、无误差棒，无法与他法做同口径曲线对比；训练集本身含天然弱失准，故这不是「训练未见失准」的泛化测试，只是同分布偏移放大测试。对齐正确性不可证伪：φ_c 无监督、无评测，论文从未报告任何对齐误差指标；「precise feature-level offsets」（摘要语）是修辞而非测量结论。参考模态被无条件信任：IR 既是几何参考、又是标注来源；IR 本身若失真/损坏，全框架没有任何察觉或回退机制。退化与缺失评测为零（与失准严格区分）：全文没有模态缺失、噪声/模糊/低照度等光度退化、传感器故障（条纹、坏点、非均匀性）任何一项评测；其「robustness」一词仅指几何位移鲁棒性。低照度等条件只作为 DroneVehicle 的场景多样性被提及，没有分条件结果表。训练成本：两阶段共 150 epoch 且阶段间需权重衔接，33.1 fps 也不及简单拼接基线（63.2 fps），部署友好度一般。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 主题综述：[[themes/cross-modal-misalignment-unaligned-fusion|跨模态错位与未对齐融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
