---
title: "When Pedestrian Detection Meets Multi-Modal Learning: Generalist Model and Benchmark Dataset (MMPedestron)"
paper_id: "zhang2024when"
authors: "Zhang et al."
year: "2024"
venue: "ECCV"
list: "core"
scope: "Core"
section: "Surveys & Benchmarks"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["benchmark", "pedestrian", "foundation-model"]
paper_link: "https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/06487.pdf"
code_link: "https://github.com/BubblyYi/MMPedestron"
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：A generalist pedestrian detector handling dynamic combinations of RGB, IR, depth, LiDAR and event inputs, plus the MMPD benchmark.

## 点评

Handles missing/dynamic modality combinations by design.

## 框架图

![MMPedestron 方法主框图（原文 Figure 4）：统一多模态编码器与 Modality Unifier](figs/when-pedestrian-detection-meets-multi-modal-learning-generalist-model-and-benchmark-dataset-mmpedestron.webp)

*原文 Figure 4：(a) MMPedestron 总体架构——统一多模态编码器由四个阶段串联，每阶段含模态专属 patch embedding、共享 Transformer block 与 Modality Unifier，四阶段的统一 token 一并送入检测头（实现为 Co-DINO）；(b) Modality Unifier 细节（以 RGB+IR 两模态为例）——MAF token 经 MLP 产出各模态置信度并对两路 token 加权，MAA token 的特征加到加权结果上，得到统一 token。图源：Zhang et al., ECCV 2024 / arXiv:2407.10125，Figure 4。*

## 问题定义

既有多模态行人检测是“专家模型”范式：一对模态一个模型（如 RGB-T 模型不能用于 RGB-D），换模态组合就要换模型；既有基准也多是单模态对，缺乏跨模态、跨场景的统一评测。引言还明确点名一个被以往融合方法忽略的情形：默认所有模态都可用，不考虑模态可能缺失。本文的“generalist”因此有确切边界——单一任务（行人检测）内，一个模型通吃多种模态、模态的动态组合以及多数据集/多场景；它不是多任务统一，也不是语言驱动的 VLM：全文没有语言成分，所有模态都被压平成 2D 图像输入（LiDAR 投影为稀疏深度图、事件流按时间窗积分成帧图）。配套交付物是基准 MMPD（整合既有数据集 + 新采集 EventPed，总计约 260K 图）。模型规模 62M 参数，Dual ViT 骨干（ImageNet-1K 预训练）+ Co-DINO 检测头。阅读依据：arXiv:2407.10125 v1 全文通读；补充材料未读，单模态评测的逐数据集精确 AP 正文只给了柱状图、无数值表，相关结论按定性处理。

## 方法细节

统一多模态编码器 + 通用检测头（实现用 Co-DINO）。编码器四阶段（hierarchical），每阶段由三部分组成：模态专属 patch embedding（每种模态一个，其余参数全模态共享）、若干 Dual Vision Transformer block、一个 Modality Unifier。每阶段在视觉 token 前拼入两个可学习 token：MAF（Modality-Aware Fuser）经 MLP + Sigmoid 给出每种模态的置信度 c = Sigmoid(MLP(x_MAF))，作为融合权重；MAA（Modality-Aware Abstractor）汇集与输入模态组合相关的“领域知识”，以加性方式并入统一 token。Unifier 的融合公式为 X_uni = Σᵢ wᵢcᵢXᵢ / Σᵢ wᵢ + x_MAA，其中 wᵢ∈{0,1} 是模态有效性指示：模态缺失时填空图、其 token 在注意力与 unifier 中全程 mask，wᵢ=0 直接出局——这是硬掩码式的缺失处理，不是软降权。各阶段 unifier 输出的统一 token 汇总后进检测头。训练两阶段：(1) RGB 预训练——Objects365-Persons + COCO-Persons + CrowdHuman 混合，12 epoch；(2) 多模态训练——CrowdHuman + LLVIP + InOutDoor + STCrowd + EventPed 混合 550k iteration，并施加 modality dropout（p=0.3）随机丢弃一路模态，迫使模型同时学会单模态与组合输入。损失沿 Co-DINO 配方：quality focal loss + CE 分类、GIoU + L1 回归。

## 实验设置

MMPD 基准由 Objects365-Persons、COCO-Persons、CrowdHuman、LLVIP（15K 对 RGB-IR）、InOutDoor（RGB-Depth，训练 6,316 / 评测 1,028 对）、STCrowd（RGB-LiDAR，训练 5,262 / 评测 2,988 对）拼成，外加新采集的 EventPed（RGB-Event：IMX636 事件相机 + IMX586 RGB 相机，2023 年 3–7 月采集，训练 7,195 对 / 测试 2,435 对，昼夜户外场景，人工全框标注）。两种评测设定：单模态评测（逐数据集逐模态单输入，与 Faster R-CNN、YOLOX、Co-DINO、Meta-Transformer 比）与多模态融合评测（LLVIP、InOutDoor、STCrowd、EventPed，与 early-fusion、FPN-Fusion、ProbEN、HRFuser、CMX 比）；指标除注明外统一为 COCO AP（IoU 0.5:0.95），CrowdHuman 另报 MR⁻² 与 JI。跨数据集迁移评测：PEDRo（Event）微调、FLIR aligned（训练 4,192 对 / 测试 1,013 对，三类 person/bicycle/car）多类别微调。算力：RGB 预训练 64×V100 共 27,648 GPU 小时；多模态阶段 32×V100 共 1,056 GPU 小时。FLIR 上 RTX 4090 单线程 batch 1 约 24 fps。须先纠正一个常见误传：本文没有 KAIST 实验，LLVIP 报告的是 COCO AP 而非 MR——全文“KAIST”零命中，唯一 MR 数字是 CrowdHuman 的 MR⁻²。

## 关键数字

融合评测（表 3，无目标数据集微调、直接评测）：LLVIP 72.6 AP、STCrowd 74.9、InOutDoor 65.7、EventPed 79.0，全面高于 CMX（59.6 / 61.0 / 62.3 / 58.0）、ProbEN（54.8 / 60.0 / 62.4 / 60.1）等；仅 RGB 预训练的版本为 50.0 / 59.5 / 36.8 / 71.9，多模态训练带来 +13~+29 的跃升。COCO-Persons：直接评测 68.2 AP，微调后 71.1 AP（62M），高于 387M 的 InternImage-XL（64.8）。CrowdHuman：AP 97.1、MR⁻² 30.8、JI 88.0，与参数量 17 倍于己的 InternImage-H（95.4 / 37.9 / 86.6）相当或更好（这是全文唯一的 MR 数字）。PEDRo 迁移：仅用 10% 训练数据微调即达 Val 79.3 / Test 72.7 AP（超过在全量数据上专门训练的 YOLOX 68.8 等），全量微调达 81.5 / 73.3。FLIR aligned 微调（三类）：AP50 86.4，高于 CMX 82.2、CFT 77.7、GAFF 72.9。注意口径：表 5 消融里完整模型（MAF+MAA）的 LLVIP 融合 AP 是 68.9，与表 3 头条的 72.6 对不上，正文未解释（推测消融用了缩减的训练设定）——引用其 LLVIP 数字时须注明出自哪张表。

## 消融说明了什么

LLVIP 消融（表 5，报告融合 / RGB 单模态 / IR 单模态三列 AP）：基线（Dual-ViT + Co-DINO，无 MAF/MAA）61.7 / 47.5 / 61.2；+MAF → 68.2（+6.5）/ 49.8 / 68.2（+7.0）——MAF 是主力增益，且连单模态 IR 臂也大幅受益，说明置信加权主要在改善融合表示本身；+MAA → 68.9（+0.7）/ 52.9（+3.1）/ 68.4（+0.2）——MAA 的增益集中在较弱的 RGB 单模态臂。图 5 的 t-SNE 显示 MAF/MAA token 特征按模态及模态组合聚类，佐证两 token 确实“感知”输入构成。但消融只拆了两个 token：modality dropout 的概率、缺失率扫描、缺失模式均无消融或专项评测——缺失鲁棒性靠架构（填空 + 掩码）与单模态评测间接背书，没有一条“缺失率—性能”曲线。

## 局限

(1) 没有 KAIST：RGB-T 行人检测最经典的基准缺席，RGB-T 证据只有 LLVIP + FLIR aligned 两处。(2) 缺失处理是二值的整模态有/无（填空 + w=0 硬掩码），且只在训练时以 dropout 模拟、评测时以单模态设定代偿；损坏但仍在场的模态完全不在其问题框架内——全文 corrupt / noise / degrad 零命中，无任何退化、噪声、错位评测，MAF 置信度在模态被污染时是否还会给出高权重从未检验（它只在干净/缺失两种模式上训练过）。(3) “通才”的代价：所有模态压平成 2D 图像，LiDAR 的几何结构与事件流的时间分辨率被丢弃；任务仍限行人/通用检测单域。(4) 训练成本极端（RGB 阶段约 2.8 万 GPU 小时），62M + Co-DINO 的体量与边缘部署无关。(5) 表 3 与表 5 的 LLVIP 数字不一致（72.6 vs 68.9）且正文无说明。(6) MMPD 以拼凑既有数据集为主，EventPed 为自采数据，基准的独立性有限。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
