---
title: "退化鲁棒性评测：协议类型与覆盖面"
---

> 研究主题综述（REQ-03）分主题页；全文见 [[themes/index|研究主题综述]]。

### 范围与定义

本主题收录在比较表中 robustness_evaluation 判为 Yes 的全部论文，即公开精读记录中存在受控退化评测者：腐化注入、整模态缺失/置零、受控错位或分级严重度扫描至少居其一（来源：compare_fields.csv，robustness_evaluation 列统计，31/102）。评测对象不限于 RGB–热红外检测：31 篇中 core 15 篇、附录 16 篇，后者包含 LiDAR–相机 3D 检测、多模态分类与情感分析、医学分割、单模态测试时适应等相邻任务（来源：本主题成员 list 字段统计，15/31 为 core、16/31 为附录）。各成员的协议细节以其 robustness_detail 字段为准，本节只作类型归纳，不跨协议比较数值。

### 库内图景

- 整模态缺失/丢弃是出现频率最高的退化形态之一，构造方式各异：复制存活模态模拟丢失、整模态置零（blackout）、按缺失率或模态子集枚举扫描均有实例（例：xiao2024gmdetr、kim2021mlpd、ma2021smil）（来源：上述各篇 robustness_detail）。
- 数字腐化套件构成另一主线：-C 式基准以「腐化类型 × 严重度档位」的矩阵组织评测，规模从单模态红外的 14 种腐化到 3D 检测的 27 类 × 5 档不等（例：medeiros2026wiseod、beemelmanns2024multicorrupt、dong2023benchmarking）（来源：上述各篇 robustness_detail）。
- 受控几何错位被多篇 RGB-T 工作当作独立退化轴评测，协议形态为对单路施加给定像素偏移并扫描档位（例：zhang2019weakly、fu2024cfdeformable、hou2026leryolo）（来源：上述各篇 robustness_detail）。
- 「损坏」与「缺失」分开评测的做法只见于少数成员：其协议把整路丢弃、束数削减、视场限制、遮挡等部分损坏与整模态不可用分别成组报告（例：park2025resilient、essl2026sbbevfusion、cha2024robust）（来源：上述各篇 robustness_detail）。
- 退化的施加范围以单路为主：有成员的定义性协议即「恰好一个模态受损、其余保持干净」；把双模态同时受损、缺失与混合偏移纳入同一评测框架的是少数（例：yang2024testtime、guo2025smoothing、wu2026bridging）（来源：上述各篇 robustness_detail）。
- 复合腐化与分级扫描并非标配：部分成员正文每种退化只测单一强度，分级扫描只出现在补充材料或不存在（例：tian2025learning、wu2026bridging、xue2023dynamic）（来源：上述各篇 robustness_detail）。
- 真实传感器故障在库内基本缺席：31 篇 robustness_evaluation=Yes 的论文中，27 篇的 robustness_detail 注明未评测真实传感器故障（条纹噪声、NUC 漂移、坏点、热饱和一类），其余评测均为合成腐化、合成失效或特征级噪声注入（例：tian2025learning、medeiros2026wiseod、han2021trusted）（来源：compare_fields.csv，robustness_detail 列统计，27/31）。

### 代表工作

- dong2023benchmarking：构建 KITTI-C / nuScenes-C / Waymo-C，以 27 类合成腐化 × 5 档严重度统一评测 3D 检测器，含空间失准与时间失准两类对齐腐化（来源：dong2023benchmarking 的 robustness_detail）。
- beemelmanns2024multicorrupt：LiDAR–相机融合鲁棒性开源基准，10 类合成腐化 × 3 档，含双模态时空失准，指标为相对保持率 RA（来源：beemelmanns2024multicorrupt 的 robustness_detail）。
- wu2026bridging：RGB-T 检测中覆盖面较宽的一例——高斯模糊、低光、加性噪声、模态丢弃、错位五类退化，补充材料另有三档强度扫描、五种复合腐化与整路置零，以保持率为指标（来源：wu2026bridging 的 robustness_detail）。
- park2025resilient：LiDAR–相机 3D 检测，缺失与部分损坏分开评测且多为单路施加，束数、视场、框内点删除比例均做分级扫描（来源：park2025resilient 的 robustness_detail）。
- guo2025smoothing：多模态测试时适应评测，按弱 OOD（单模态腐蚀）与强 OOD（双模态同时腐蚀、整模态缺失、缺失与腐蚀混合）分型，并扫混合比例与严重度（来源：guo2025smoothing 的 robustness_detail）。
- medeiros2026wiseod：单模态红外迁移的腐化基准一侧——对红外测试集施加 14 种 ImageNet-C/COCO-C 式数字腐化构建 LLVIP-C / FLIR-C，并给出严重程度曲线（来源：medeiros2026wiseod 的 robustness_detail）。

### 开放问题（论文自述）

- 整路丢失是唯一的失效形态、且以复制存活模态模拟而非置零或真实传感器失效；同一评测中 RGB 丢失时融合结果仍低于纯 RGB 单模态基线，原文未给出融合不劣于单模态的正面对比（来源：xiao2024gmdetr 的 Limitations）。
- 基准只有相对保持率 RA、没有单模态或晚期融合对照，「融合是否劣于丢弃一路」在该协议内未被测量；腐化全为合成且仅 nuScenes 单一数据源（来源：beemelmanns2024multicorrupt 的 Limitations）。
- 缺失处理依赖外部给定的 oracle 可用性标志，「在场但静默退化」的情形无机制、也无评测（来源：essl2026sbbevfusion 的 Limitations）。
- 路由监督是模态丢弃的身份标签而非质量估计，训练未见连续退化样本，对在场但被污染且自信出错的模态没有训练信号；失效建模以信息移除为主、无真实传感器故障模型（来源：park2025resilient 的 Limitations）。
- 评测协议只覆盖「恰好一个模态受损」的设定，双模态同时受损、模态缺失与混合偏移均未覆盖（来源：yang2024testtime 的 Limitations）。
- 受控退化只用全局仿射一族，质量掩码由退化特征本身估计（自指）、未验证其与真实退化程度的相关性，鲁棒性只测单点强度、无严重程度曲线（来源：tian2025learning 的 Limitations）。
- 过曝、欠曝、模糊三类退化的生成方式、强度参数与子集样本量原文均未报告，跨退化结论无法按原文精确复现（来源：hao2026distributionaligned 的 Limitations）。

### 相关论文索引

[[core/surveys/wise-od|medeiros2026wiseod]], [[core/feature/attention-transformers-foundation-models/gm-detr|xiao2024gmdetr]], [[core/feature/dual-stream-cnn-yolo-based-detectors/learning-a-robust-rgb-thermal-detector-for-extreme-modality-imbalance|tian2025learning]], [[appendix/robust-dynamic-fusion-general-multimodal/resilient-sensor-fusion-under-adverse-sensor-failures-via-multi-modal-expert-fusion|park2025resilient]], [[appendix/robust-dynamic-fusion-general-multimodal/meformer|cha2024robust]], [[appendix/robust-dynamic-fusion-general-multimodal/dynamic-multimodal-fusion|xue2023dynamic]], [[appendix/robust-dynamic-fusion-general-multimodal/provable-dynamic-fusion-for-low-quality-multimodal-data-qmf|zhang2023provable]], [[appendix/robust-dynamic-fusion-general-multimodal/trusted-multi-view-classification-tmc|han2021trusted]], [[appendix/robust-dynamic-fusion-general-multimodal/sb-bevfusion|essl2026sbbevfusion]], [[appendix/benchmarks-evaluation-studies/multicorrupt|beemelmanns2024multicorrupt]], [[appendix/benchmarks-evaluation-studies/benchmarking-robustness-of-3d-object-detection-to-common-corruptions|dong2023benchmarking]], [[appendix/modality-imbalance-missing-modality-learning-general/mm-ckd|sang2024contrastive]], [[appendix/modality-imbalance-missing-modality-learning-general/shaspec|wang2023multimodal]], [[appendix/modality-imbalance-missing-modality-learning-general/smil|ma2021smil]], [[appendix/test-time-adaptation-intervention-amortized-optimization/memo|zhang2022memo]], [[appendix/test-time-adaptation-intervention-amortized-optimization/tent|wang2021tent]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-cross-modal-learning-for-multispectral-pedestrian-detection-ar-cnn|zhang2019weakly]], [[core/feature/dual-stream-cnn-yolo-based-detectors/mlpd-multi-label-pedestrian-detector-in-multispectral-domain|kim2021mlpd]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-feature-fusion-for-multimodal-object-detection|zhang2025weakly]], [[core/feature/attention-transformers-foundation-models/distribution-aligned-multimodal-fusion-for-robust-object-detection|hao2026distributionaligned]], [[core/feature/dual-stream-cnn-yolo-based-detectors/infranet-quality-aware-rgb-guidance-for-infrared-object-detection|feng2026infranet]], [[core/feature/state-space-models-mamba/multispectral-state-space-feature-fusion-bridging-shared-and-cross-parametric-interactions-for-object-detection|shen2026multispectral]], [[core/surveys/when-pedestrian-detection-meets-multi-modal-learning-generalist-model-and-benchmark-dataset-mmpedestron|zhang2024when]], [[core/feature/attention-transformers-foundation-models/cf-deformable-detr-an-end-to-end-alignment-free-model-for-weakly-aligned-visible-infrared-object-detection|fu2024cfdeformable]], [[core/feature/dual-stream-cnn-yolo-based-detectors/weakly-misalignment-free-adaptive-feature-alignment-for-uavs-based-multimodal-object-detection-oafa|chen2024weakly]], [[core/feature/attention-transformers-foundation-models/bridging-multimodal-fusion-and-expert-routing-via-spectral-reliability-descriptors-for-robust-object-detection|wu2026bridging]], [[core/feature/dual-stream-cnn-yolo-based-detectors/ler-yolo-reliability-aware-expert-routing-for-misaligned-rgb-infrared-uav-detection|hou2026leryolo]], [[core/feature/attention-transformers-foundation-models/modality-decoupled-rgb-thermal-object-detector-via-query-fusion|tian2026modalitydecoupled]], [[appendix/test-time-adaptation-intervention-amortized-optimization/cd-buffer-complementary-dual-buffer-framework-for-test-time-adaptation-in-adverse-weather-object-detection|song2026cdbuffer]], [[appendix/test-time-adaptation-intervention-amortized-optimization/test-time-adaptation-against-multi-modal-reliability-bias|yang2024testtime]], [[appendix/test-time-adaptation-intervention-amortized-optimization/smoothing-the-shift-towards-stable-test-time-adaptation-under-complex-multimodal-noises|guo2025smoothing]]
