---
title: "跨模态错位与未对齐融合"
---

> 研究主题综述（REQ-03）分主题页；全文见 [[themes/index|研究主题综述]]。

### 范围与定义

本主题收录带 alignment 标签的全部 core 论文（来源：papers.csv alignment 标签，13 篇）。处理对象是配准后仍残留的跨模态空间不一致：从数像素的弱失准，到复合仿射造成的大幅几何差异。方法谱系按机制分四类：显式偏移回归对齐、隐式注意力校准、显式配准回管线、以及对齐后的可靠性评估与上下文补偿；各成员的机制以其 fusion_strategy 字段为准。

### 库内图景

- 显式偏移回归是最早成型的一类：在区域（RoI/proposal）级回归平移乃至平移–尺度–旋转偏差，对齐区域特征后再融合（例：zhang2019weakly、yuan2022translation、zhang2025weakly）（来源：上述各篇 fusion_strategy）。
- 隐式校准路线不对偏移量建模，而是让注意力或可变形采样在另一模态中搜索对应位置完成聚合（例：yuan2024c2former、fu2024cfdeformable、song2024misaligned）（来源：上述各篇 fusion_strategy）。
- 面向大幅失准时，显式配准被重新放回管线：以跨模态仿射配准把一模态特征逐级变换到另一模态坐标系再融合，处理对象是数十至数百像素量级的复合仿射失准（例：ming2026bridging）（来源：ming2026bridging 的 problem 与 robustness_detail）。
- 对齐之后再问「对齐结果可不可信」是较新的一支：以对齐后特征一致性构造可靠性图引导融合，或以全局语义上下文补偿错位处的局部特征退化（例：hou2026leryolo、jin2025contextuallyguided）（来源：上述各篇 fusion_strategy）。
- 受控错位评测的覆盖并不齐：13 篇中 5 篇有给定偏移量的受控错位协议（单路平移、网格或分档扫描），2 篇为摘要级、判定为 Unknown，其余成员或只有数据集自带的天然失准、或失准是训练测试同分布的任务设定而非评测协议（例：fu2024cfdeformable、chen2024weakly、song2024misaligned）（来源：成员 robustness_evaluation 与 robustness_detail 字段统计，Yes 6/13 中 5 篇为受控错位、Unknown 2/13）。
- 对齐的参考模态在多篇工作中被写死为一侧（多为热红外），且参考侧不可靠时无切换或降权机制，这一点在各篇的局限中反复出现（例：zhang2019weakly、zhang2025weakly、chen2024weakly）（来源：上述各篇 Limitations）。
- 成员面对的失准量级差异很大：微小目标场景中几像素位移即可破坏跨模态对应，预配准数据集的残余偏移多在 0–15 像素，而严重失准设定达到数十至数百像素，三者不可直接横向比较（例：hou2026leryolo、chen2024weakly、ming2026bridging）（来源：上述各篇 problem 与 robustness_detail）。

### 代表工作

- zhang2019weakly：以 RFA 逐 proposal 回归偏移对齐区域特征、再置信度加权融合，并给出 169 种网格偏移与四方向 ±10 px 扫描的受控错位评测（来源：zhang2019weakly 的 fusion_strategy 与 robustness_detail）。
- yuan2022translation：在 RoI 级显式回归平移、尺度、旋转三类耦合几何偏差后逐元素相加融合，面向航拍 RGB-IR 图像对（来源：yuan2022translation 的 problem 与 fusion_strategy）。
- fu2024cfdeformable：免对齐路线——跨模态可变形注意力在红外特征中搜索对应关键点采样聚合，配固定偏移六档扫描评测（来源：fu2024cfdeformable 的 fusion_strategy 与 robustness_detail）。
- song2024misaligned：提供原生失准的无人机可见光–热红外基准（DVTOD），基线检测器在内部以注意力校正、全局仿射对齐与通道级校正完成特征级对齐（来源：song2024misaligned 的 problem 与 fusion_strategy）。
- hou2026leryolo：先不确定性感知对齐、再以可靠性图引导稀疏专家路由融合，把对齐后局部对应是否可信纳入融合决策（来源：hou2026leryolo 的 fusion_strategy）。
- ming2026bridging：面向严重失准，把跨模态仿射配准逐级做回特征域、对齐后端到端联合检测，失准由复合仿射（旋转、缩放、平移）注入（来源：ming2026bridging 的 problem 与 fusion_strategy）。

### 开放问题（论文自述）

- 基准提供了失准数据，却没有提供失准的量尺：失准未量化、未分级，后来者无法按失准程度分层比较（来源：song2024misaligned 的 Limitations）。
- 评测中的失准全部是对严格对齐原图的人工刚性平移，天然失准未测；且无单模态对照行，无法判断偏移之下融合是否仍优于丢弃一模态（来源：fu2024cfdeformable 的 Limitations）。
- 偏移量估计无监督、无对齐误差评测，对齐正确性不可证伪；红外参考模态被无条件信任（来源：chen2024weakly 的 Limitations）。
- 隐式校准的幅度从未量测：没有合成偏移的受控实验，小于采样步长的细偏移对注意力不可见；注意力无质量概念且不能弃权，一路模态内容损坏时污染路径全通（来源：yuan2024c2former 的 Limitations）。
- 对齐非对称且参考写死，参考侧不可靠时无切换或降权机制（来源：zhang2025weakly 的 Limitations）。
- 单一图像级仿射的全局刚性假设无法表达视差与非刚性形变，配准精度本身从未被直接评估（来源：ming2026bridging 的 Limitations）。

### 相关论文索引

[[core/feature/attention-transformers-foundation-models/c2former-calibrated-and-complementary-transformer|yuan2024c2former]], [[core/feature/attention-transformers-foundation-models/improving-rgb-infrared-object-detection-with-cascade-alignment-guided-transformer-cagt|yuan2024improving]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-cross-modal-learning-for-multispectral-pedestrian-detection-ar-cnn|zhang2019weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/mlpd-multi-label-pedestrian-detector-in-multispectral-domain|kim2021mlpd]], [[core/feature/dual-stream-cnn-yolo-based-detectors/translation-scale-and-rotation-cross-modal-alignment-meets-rgb-infrared-vehicle-detection-tsfadet|yuan2022translation]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-feature-fusion-for-multimodal-object-detection|zhang2025weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/improving-multispectral-pedestrian-detection-by-addressing-modality-imbalance-problems-mbnet|zhou2020improving]], [[core/feature/state-space-models-mamba/contextually-guided-state-space-fusion-for-misaligned-multi-spectral-object-detection-cssfdet|jin2025contextuallyguided]], [[core/surveys/misaligned-visible-thermal-object-detection-a-drone-based-benchmark-and-baseline-dvtod|song2024misaligned]], [[core/feature/attention-transformers-foundation-models/cf-deformable-detr-an-end-to-end-alignment-free-model-for-weakly-aligned-visible-infrared-object-detection|fu2024cfdeformable]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-misalignment-free-adaptive-feature-alignment-for-uavs-based-multimodal-object-detection-oafa|chen2024weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/ler-yolo-reliability-aware-expert-routing-for-misaligned-rgb-infrared-uav-detection|hou2026leryolo]], [[core/feature/dual-stream-cnn-yolo-based-detectors/bridging-severe-cross-modal-misalignment-end-to-end-visible-infrared-object-detection-via-explicit-feature-domain-affine-registration|ming2026bridging]]
