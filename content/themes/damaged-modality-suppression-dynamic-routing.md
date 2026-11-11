---
title: "受损模态抑制、权重折扣与动态路由"
---

> 研究主题综述（REQ-03）分主题页；全文见 [[themes/index|研究主题综述]]。

### 范围与定义

本主题收录在融合中由质量、可靠性、冲突或场景条件信号驱动，实际降低某一模态贡献的机制，包括连续权重衰减、证据折扣、专家路由改道与整路关断。成员论文的问题设定多为模态失衡、传感器失效或分布偏移下受损模态经耦合通路污染融合结果（来源：compare_fields.csv，成员论文 problem 字段）。

### 库内图景

102 篇论文中，suppression 列为 Yes 的共 20 篇（来源：compare_fields.csv，suppression 列统计，20/102）。按其证据字段，抑制的实现形态可归纳为：

- **连续权重衰减**：融合权重直接取质量/不确定性量的函数——权重为不确定性的负线性函数（zhang2023provable），RGB 注入权重直接取标量 q（feng2026infranet），或由光照门导出两路权重在提议前缩放特征图（zhou2020improving）（来源：compare_fields.csv，上述论文 suppression_evidence 字段）。
- **硬关断与整路出局**：受损模态通路被完全切断——LiDAR 整路丢弃时 92% 的 query 被路由改走相机专家、相机丢弃时 100% 改走 LiDAR 专家（park2025resilient）；模态缺失时以 w=0 硬掩码整路出局（zhang2024when）；两支提议按置信度 top-k 竞争，一支的查询可整批落选（tian2026modalitydecoupled）（来源：compare_fields.csv，上述论文 suppression_evidence 字段）。
- **分歧 / 冲突驱动的压制**：以两模预测不一致为信号只压被感知一侧——分歧权重 Wd=1−|p1r−p1s| 只乘在 sensed 特征上（zhang2019weakly、zhang2025weakly）；两路单模态预测异号时减去热红外自然直接效应（kim2024causal）；不确定性在 Dempster 组合中起结构性折扣作用、u→1 时视图近乎自动退出（han2021trusted）（来源：compare_fields.csv，上述论文 suppression_evidence 字段）。
- **场景条件先验驱动**：驱动信号是光照或条件语义而非对当前输入健康度的测量——光照门使光照差时 w_color 趋近于 0（li2019illuminationaware）、夜间 w_R 急剧下降（yang2022baanet）、CLIP 条件提示产生逐通道软门控权重（chen2025fusion）（来源：compare_fields.csv，上述论文 suppression_evidence 字段）。
- **测试时再配权**：适应发生在融合环节——测试时更新跨模态注意力投影后，干净模态获得更高关注、受损模态的自注意力与被关注权重被压低（yang2024testtime）（来源：compare_fields.csv，yang2024testtime 的 suppression_evidence）。
- **软门控的关断上限**：多个成员的权重结构上不可归零——li2024multiscale 的 Sigmoid 软权重不可归零且无跨模态归一化；hu2025eidet 的 w_v + w_t ≡ 1 使两路恒同时进入融合、无弃权通路；chen2025fusion 的 softmax 恒正、无完全关断（来源：compare_fields.csv，上述论文 limitations 字段）。
- **非对称抑制**：若干成员只压一路、另一路从不被压制——zhang2019weakly 与 zhang2025weakly 的分歧权重只作用于 sensed 侧、reference 侧从不被分歧压制；hou2026leryolo 的软门控只调制对齐后的 RGB 特征、红外一路不调制（来源：compare_fields.csv，上述论文 suppression_evidence 字段）。

### 代表工作

（本节来源：compare_fields.csv 各论文 problem 与 fusion_strategy 字段）

- park2025resilient — 针对中间融合下单传感器故障污染整体感知的问题，在拼接特征上按 object query 硬路由至 LiDAR / 相机 / 融合三专家之一。
- feng2026infranet — 面向 RGB 严重退化时的负迁移，以标量 q 调制 RGB 指导向 IR 的注入权重与 IR 增益，只在 RGB 可靠时借用其塑造 IR 表示。
- zhang2023provable — 以能量分数不确定性的负线性函数为决策级融合权重，不确定性越高的模态权重被压得越低。
- tian2026modalitydecoupled — 两支独立检测器仅在解码器阶段交换查询与提议，按置信度 top-k 竞争组成共享提议集，全管线无特征级融合。
- yang2024testtime — 针对多模态 TTA 的可靠性偏倚，测试时仅更新注意力融合层参数，使受损模态在融合环节被重新配权压低。
- wu2026bridging — 谱可靠性描述符驱动的逐通道门在光谱残差分支与保守双路均值之间混合，一致性弱时自动退回均值，压低不可靠跨模态交互的贡献。

### 开放问题（论文自述）

- 门控信号是场景光照先验而非模态健康估计，不存在发现热红外损坏并将其丢弃的通路；夜间门控只缩小负融合幅度、未消除（该设置下仍劣于热红外单模态）（来源：li2019illuminationaware 的 Limitations）。
- 硬路由全有全无、无部分衰减且粒度止于 query；失效以信息移除为主、无真实传感器故障模型（来源：park2025resilient 的 Limitations）。
- 输入被腐化时模式判别可被翻转而框架无防护；损坏模态零评测，无任何合成腐化与传感器故障模型（来源：kim2024causal 的 Limitations）。
- 评测协议只覆盖「恰好一个模态受损」的设定，双模态同时受损、模态缺失与混合偏移均未覆盖（来源：yang2024testtime 的 Limitations）。
- 退化评测只有一个二值全损端点，尤其未评测受损模态仍产出高置信错误提议的情形；全损下的保持主要来自决策级独立性这一结构属性，并非本文机制独有（来源：tian2026modalitydecoupled 的 Limitations）。
- 差分融合无模态隔离能力，一路污染会沿互补通道注入健康模态，机制内没有把一路压到零的通路（来源：zhou2020improving 的 Limitations）。
- 光照权重和恒为 1 且无弃权通路，权重唯一自由度是等权附近的再平衡幅度，局部损坏无法表达（来源：hu2025eidet 的 Limitations）。

### 相关论文索引

[[core/feature/dual-stream-cnn-yolo-based-detectors/learning-a-robust-rgb-thermal-detector-for-extreme-modality-imbalance|tian2025learning]], [[appendix/robust-dynamic-fusion-general-multimodal/resilient-sensor-fusion-under-adverse-sensor-failures-via-multi-modal-expert-fusion|park2025resilient]], [[appendix/robust-dynamic-fusion-general-multimodal/provable-dynamic-fusion-for-low-quality-multimodal-data-qmf|zhang2023provable]], [[appendix/robust-dynamic-fusion-general-multimodal/trusted-multi-view-classification-tmc|han2021trusted]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-cross-modal-learning-for-multispectral-pedestrian-detection-ar-cnn|zhang2019weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/baanet-learning-bi-directional-adaptive-attention-gates-for-multispectral-pedestrian-detection|yang2022baanet]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-feature-fusion-for-multimodal-object-detection|zhang2025weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/improving-multispectral-pedestrian-detection-by-addressing-modality-imbalance-problems-mbnet|zhou2020improving]], [[core/feature/dual-stream-cnn-yolo-based-detectors/drone-based-rgb-infrared-cross-modality-vehicle-detection-via-uncertainty-aware-learning-ua-cmdet|sun2022dronebased]], [[core/feature/dual-stream-cnn-yolo-based-detectors/illumination-aware-faster-r-cnn-for-robust-multispectral-pedestrian-detection|li2019illuminationaware]], [[core/feature/dual-stream-cnn-yolo-based-detectors/infranet-quality-aware-rgb-guidance-for-infrared-object-detection|feng2026infranet]], [[core/surveys/fusion-meets-diverse-conditions-a-high-diversity-benchmark-and-baseline-for-uav-based-multimodal-object-detection-with-condition-cues|chen2025fusion]], [[core/feature/dual-stream-cnn-yolo-based-detectors/multiscale-cross-modal-homogeneity-enhancement-and-confidence-aware-fusion-for-multispectral-pedestrian-detection|li2024multiscale]], [[core/feature/dual-stream-cnn-yolo-based-detectors/causal-mode-multiplexer-a-novel-framework-for-unbiased-multispectral-pedestrian-detection|kim2024causal]], [[core/surveys/when-pedestrian-detection-meets-multi-modal-learning-generalist-model-and-benchmark-dataset-mmpedestron|zhang2024when]], [[core/feature/dual-stream-cnn-yolo-based-detectors/ei-det-edge-guided-illumination-aware-interactive-learning-for-visible-infrared-object-detection|hu2025eidet]], [[core/feature/attention-transformers-foundation-models/bridging-multimodal-fusion-and-expert-routing-via-spectral-reliability-descriptors-for-robust-object-detection|wu2026bridging]], [[core/feature/dual-stream-cnn-yolo-based-detectors/ler-yolo-reliability-aware-expert-routing-for-misaligned-rgb-infrared-uav-detection|hou2026leryolo]], [[core/feature/attention-transformers-foundation-models/modality-decoupled-rgb-thermal-object-detector-via-query-fusion|tian2026modalitydecoupled]], [[appendix/test-time-adaptation-intervention-amortized-optimization/test-time-adaptation-against-multi-modal-reliability-bias|yang2024testtime]]
