---
title: "模态质量估计与可靠性感知融合"
---

> 研究主题综述（REQ-03）分主题页；全文见 [[themes/index|研究主题综述]]。

### 范围与定义

本主题收录在融合通路中显式估计每个模态（或每个空间位置、每个目标）的质量、可靠性或不确定性，并以该估计量实际调制融合的工作：估计产物须是可辨识的量（掩码、权重、描述符、证据参数等），且被论文自述为质量/可靠性/不确定性度量。成员论文的问题设定集中在模态退化、模态失衡与跨模态一致性塌陷等条件下固定融合失效的情形（来源：compare_fields.csv，成员论文 problem 字段）。

### 库内图景

102 篇论文中，quality_estimation 列为 Yes 的共 12 篇（来源：compare_fields.csv，quality_estimation 列统计，12/102）。成员的估计产物与调制方式呈现以下形态：

- **空间质量掩码 / 可靠性图**：由各模态自身特征预测逐位置的质量量，再交叉门控对方特征的注入或参与专家路由，如 tian2025learning、hou2026leryolo、zhang2021guided（来源：compare_fields.csv，上述论文 qe_evidence 字段）。
- **无参数统计描述符**：不训练估计网络，直接以特征统计构造可靠性测量并以 stop-gradient 固定，如 wu2026bridging 的 7 维光谱可靠性描述符（来源：compare_fields.csv，wu2026bridging 的 qe_evidence）。
- **分类输出导出的不确定性 / 置信间隔**：由各模态 logits 的能量分数生成融合权重（zhang2023provable），或以分类间隔 |p1−p0| 作为置信权重乘在区域特征上（zhang2019weakly、zhang2025weakly）（来源：compare_fields.csv，上述论文 qe_evidence 字段）。
- **证据与逐目标不确定性**：以 Dirichlet 证据参数给出视图级不确定性 u=K/S 并参与组合（han2021trusted）；或把不确定性定义在逐目标层面、由跨模态真值框 IoU 与光照值算出并在推理期参与输出合并（sun2022dronebased）（来源：compare_fields.csv，上述论文 qe_evidence 字段）。
- **估计量的自指性反复出现**：多个成员的证据指针注明估计量由被评估模态自身特征产生、无独立校准——tian2025learning 的质量掩码由退化特征本身估计、未验证与真实退化程度的相关性；li2024multiscale 的置信完全自指、无显式监督或校准；hou2026leryolo 的可靠性图由特征一致性自监督、绝对值未校准；park2025resilient 的路由监督是传感器 drop 身份标签而非连续质量（来源：compare_fields.csv，上述论文 qe_evidence 与 limitations 字段）。
- **对照**：门控若只是由两路特征端到端学出、无独立质量估计产物，则不计入本主题，如 dong2025fusionmamba 与 shen2026multispectral（来源：compare_fields.csv，quality_estimation 列为 No 及两篇 qe_evidence）。

### 代表工作

（本节来源：compare_fields.csv 各论文 problem 与 fusion_strategy 字段）

- wu2026bridging — 针对融合中可靠性统计用完即弃的问题，以无参数光谱可靠性描述符驱动频域融合与可靠性条件专家路由。
- hou2026leryolo — 针对未对齐 RGB–红外下局部对应是否可信未知的问题，先不确定性感知对齐，再由可靠性图引导稀疏 MoE 融合。
- tian2025learning — 将模态退化建模为极端模态失衡，每模态以自身预测的质量掩码交叉门控对方特征注入。
- zhang2023provable — 面向低质量多模态数据，以能量分数不确定性驱动决策级动态权重，并给出泛化误差意义下的鲁棒性定理。
- han2021trusted — 逐样本、逐视图以 Dirichlet 证据评估质量，经 Dempster 组合规则在证据层融合多视图分类。
- zhang2021guided — 以模态间注意力输出逐像素模态权重对，其理想监督自述为「逐像素最佳模态质量」，全自适应地学习两模态动态加权。

### 开放问题（论文自述）

- 质量掩码由退化特征本身估计（自指），未验证与真实退化程度的相关性；鲁棒性仅测单点强度、无严重程度曲线（来源：tian2025learning 的 Limitations）。
- 不确定性未做定量校准（无 ECE）；视图间冲突质量 C 在归一化中被丢弃、无冲突告警量（来源：han2021trusted 的 Limitations）。
- 路由监督是 drop 身份而非质量估计，训练未见连续退化样本，对在场但被污染且自信出错的模态无训练信号（来源：park2025resilient 的 Limitations）。
- 理论保证依赖「不确定性–损失相关」假设，该相关靠正则训出且在 NYU/SUN 上仅温和；实验只有 2 个模态，≥3 模态未验证未证明（来源：zhang2023provable 的 Limitations）。
- 二值频带划分与全局相关刻画不了空间非平稳的局部可靠性，一路局部受损时全局描述子会被平均掉（来源：wu2026bridging 的 Limitations）。
- 可靠性图由对齐后特征一致性自监督、自指且未用偏移标签校验，绝对值约 0.33 未校准（来源：hou2026leryolo 的 Limitations）。
- 模态间权重的「质量」只是干净数据上相对任务表现的代理，无绝对质量尺度、无不确定性与校准验证；两路同时不可靠时仍被迫分出赢家（来源：zhang2021guided 的 Limitations）。

### 相关论文索引

[[core/feature/dual-stream-cnn-yolo-based-detectors/learning-a-robust-rgb-thermal-detector-for-extreme-modality-imbalance|tian2025learning]], [[appendix/robust-dynamic-fusion-general-multimodal/resilient-sensor-fusion-under-adverse-sensor-failures-via-multi-modal-expert-fusion|park2025resilient]], [[appendix/robust-dynamic-fusion-general-multimodal/provable-dynamic-fusion-for-low-quality-multimodal-data-qmf|zhang2023provable]], [[appendix/robust-dynamic-fusion-general-multimodal/trusted-multi-view-classification-tmc|han2021trusted]], [[core/feature/attention-transformers-foundation-models/guided-attentive-feature-fusion-for-multispectral-pedestrian-detection-gaff|zhang2021guided]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-cross-modal-learning-for-multispectral-pedestrian-detection-ar-cnn|zhang2019weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-feature-fusion-for-multimodal-object-detection|zhang2025weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/drone-based-rgb-infrared-cross-modality-vehicle-detection-via-uncertainty-aware-learning-ua-cmdet|sun2022dronebased]], [[core/feature/dual-stream-cnn-yolo-based-detectors/multiscale-cross-modal-homogeneity-enhancement-and-confidence-aware-fusion-for-multispectral-pedestrian-detection|li2024multiscale]], [[core/surveys/when-pedestrian-detection-meets-multi-modal-learning-generalist-model-and-benchmark-dataset-mmpedestron|zhang2024when]], [[core/feature/attention-transformers-foundation-models/bridging-multimodal-fusion-and-expert-routing-via-spectral-reliability-descriptors-for-robust-object-detection|wu2026bridging]], [[core/feature/dual-stream-cnn-yolo-based-detectors/ler-yolo-reliability-aware-expert-routing-for-misaligned-rgb-infrared-uav-detection|hou2026leryolo]]
