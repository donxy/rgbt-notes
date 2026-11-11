---
title: "Benchmarking Robustness of 3D Object Detection to Common Corruptions"
paper_id: "dong2023benchmarking"
authors: "Dong, Kang, Zhang, Zhu, Wang, Yang, Su, Wei, Zhu"
year: "2023"
venue: "CVPR"
list: "appendix"
scope: "Related"
section: "Benchmarks & Evaluation Studies"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["benchmark", "corruption"]
paper_link: "https://arxiv.org/abs/2303.11040"
code_link: ""
doi: "10.1109/CVPR52729.2023.00105"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：27-corruption benchmark; fusion models more robust, motion corruptions worst.

## 点评

腐化分类学的源头工作（CVPR 2023)：27 类 × 5 档分五层（天气/传感器/运动/目标/对齐），LiDAR-only、相机-only、融合三类模型全覆盖（各类别适用的腐化集合不同、AP_cor 跨类别不可比），指标为 AP_cor + 相对自身干净精度的 RCE。融合的鲁棒性是条件性的、由依赖结构决定：融合只在腐化命中一路时占优，LiDAR 与相机噪声并发时 Focals Conv 跌破 LiDAR-only——双重暴露反转红利；融合内部亦无全谱胜者（同一模型在图像噪声下的平均跌幅可从 2.5% 到 12.9% 不等、在运动补偿下排名完全反转）。被测的全是被动耐受，全文没有任何模态健康估计/折扣/弃权机制。两个对协议设计重要的空档：27 类中没有整模态缺失（坐标轴是退化程度、不是可用性状态，damaged/missing 区分在此谱系无对应物）；传感器层只有通用噪声与丢点、零器件物理故障模型。另有两条实证：增广防御在其附录中全面失败（双模态增广组合使 AP_cor 大幅下跌）——「训练时见过」不等于免疫，而 nuScenes 的天气抗性则来自训练集原生含雨的分布覆盖；失准超参没有跨数据集的物理标尺（同一组超参在一个数据集上重伤、在另一个上几乎无损）。MultiCorrupt 是其收窄后的多模态后继（nuScenes BEV 融合、10 类 × 3 档、双路原始流施加、RA/mRA 汇总）。

## 框架图

![3D 腐化鲁棒性基准主框图（原文 Figure 1）：27 类腐化五层分类学总览（天气/传感器/运动/目标/对齐）](figs/benchmarking-robustness-of-3d-object-detection-to-common-corruptions.webp)

*原文 Figure 1：27 类腐化分类学总览。左端为 LiDAR（蓝色系）、右端为 Camera（绿色系），中间五行对应天气 / 传感器 / 运动 / 目标 / 对齐五层；虚线框的交叠方式编码模态归属——横贯两端的框表示双模态腐化（如 Snow、Moving Object、Shear / Scale / Rotation），分开的框表示单模态专属（如 LiDAR 的 Density Decrease、Crosstalk、FOV Lost 与相机的三种噪声），对齐层整行横贯两端、只对融合模型有意义。图源：Dong et al., CVPR 2023（arXiv:2303.11040）Figure 1。*

## 问题定义

3D 检测器在干净基准上精度不断刷新，但真实部署中的腐化——恶劣天气、传感器噪声、运动畸变、跨传感器失准——会使其大幅退化，而这种鲁棒性此前从未被统一、严格地基准化。已有路线各有硬伤：真实恶劣天气数据集（STF、CADC、Ithaca365）规模小、采集昂贵，且与训练集之间存在城市/车辆/传感器层面的域差距，无法分离出「天气本身」的影响；ImageNet-C 式合成腐化此前只覆盖分类与点云识别，腐化种类少且多为假设性的、不贴合驾驶场景。本文的做法：在 KITTI、nuScenes、Waymo 的验证集上合成 27 类按真实驾驶场景设计的腐化，建立 KITTI-C、nuScenes-C、Waymo-C 三个基准，对 LiDAR-only、camera-only、融合三类共 24 个检测器做大规模评测，并初步试探数据增广作为防御（附录 E）。须先钉死问题边界：受评的全是现成检测器，无一带有模态健康估计、可靠性加权或弃权机制；腐化按模态分别施加，融合模型可只遭遇单路腐化、也可遭遇双路并发腐化——后者正是本文能测出「融合的双重暴露」的协议前提。领域为自动驾驶 3D 目标检测（LiDAR / 相机 / LiDAR-相机融合），是把 ImageNet-C 式合成腐化协议首次成体系地搬到 3D 检测并覆盖融合模型的工作。

## 方法细节

腐化分类学为五层 27 类（§3、图 1），每类 5 档严重度，全部超参在附录 A.1 给出。天气层（4 类，双模态）：Snow、Rain、Fog、Strong Sunlight。两侧实现保真度不对称：LiDAR 侧用物理仿真（雪、雨用 LISA 类模型，雾用衰减-后向散射模型，强光按太阳方向对 1–5% 点加 2 m 高斯噪声）；相机侧用 imgaug/automold 的图像增广近似（外加灰度罩与降亮度）。传感器层（10 类）：LiDAR 7 类——Density Decrease（随机删 6%/12%/18%/24%/30% 点）、Cutout（球域成组删点）、LiDAR Crosstalk（对 0.4–2% 点加 3 m 高斯噪声，模拟多台 LiDAR 近距互扰）、FOV Lost（保留角收窄至 ±105°…±45°）、Gaussian / Uniform / Impulse Noise（坐标噪声 0.02–0.10 m 等）；相机 3 类——Gaussian / Uniform / Impulse Noise（imgaug 预设档位）。全是通用噪声与丢点，没有按成像器件物理构造的故障模型。运动层（3 类，本文首创，此前基准未覆盖）：Motion Compensation（对自车位姿的旋转/平移矩阵加高斯噪声，仅 LiDAR）、Moving Object（框内点云分段前移 + 图像 patch 缩放，双模态）、Motion Blur（仅相机）。目标层（8 类）：前 5 类是框内局部版传感器腐化（Local Density Decrease、Local Cutout、Local Gaussian / Uniform / Impulse Noise，仅 LiDAR，模拟目标材质与遮挡造成的局部点云畸变）；Shear、Scale、Rotation 为几何形变，双模态施加同一变换以保持跨模态一致（点云直接变换，图像按 3D 框角点投影做 TPS 变形）。对齐层（2 类，仅融合模型）：Spatial Misalignment（对标定矩阵加噪：旋转 0.02–0.10、平移 0.002–0.010）、Temporal Misalignment（一路输入冻结在前 {2, 4, 6, 8, 10} 帧）。基准与指标（§4）：KITTI-C 只有 24 类（缺 FOV Lost、Motion Compensation、Temporal Misalignment，因 KITTI 无位姿/时间戳且仅前视标注）。指标两件：(i) AP_cor——对腐化类型与 5 档双重平均后的 AP（nuScenes 对应 mAP_cor / NDS_cor，Waymo 用 L2 mAP/mAPH）；(ii) RCE——相对自身干净精度的百分比跌幅，可整体算也可逐腐化、逐档算。与 ImageNet-C 的 CE 不同，本文没有以固定基线模型误差做跨模型归一化的常数，RCE 是自参照的。协议警示（作者明言）：不同模型类别适用的腐化集合不同（如 LiDAR-only 模型不测相机噪声），AP_cor 跨类别不可直接比较，只能逐腐化细粒度分析。受评模型（表 1）：KITTI-C 11 个——LiDAR-only 6（SECOND、PointPillars、PointRCNN、Part-A²、PV-RCNN、3DSSD）、camera-only 3（SMOKE、PGD、ImVoxelNet）、融合 2（EPNet、Focals Conv，均为点级融合）；nuScenes-C 10 个——LiDAR 3（PointPillars、SSN、CenterPoint）、相机 4（FCOS3D、PGD、DETR3D、BEVFormer）、融合 3（FUTR3D、TransFusion、BEVFusion）；Waymo-C 3 个——PointPillars、BEVFormer、TransFusion（因许可无公开预训练权重，由作者在训练子集上自训）。合成真实性校验（附录 A.4）：利用 nuScenes 自带的 Sunny / Rainy / Day / Night 标注对比合成天气与真实条件——合成雨与真实雨下的性能大体一致、模型相对排名一致；唯一例外是 camera-only 模型，图像天气合成保真度不足、差距较大。数据质量方面作者自承一个口径瑕疵：Cutout / FOV Lost 可能使目标在点云中已不可见但标注仍保留，他们最终保留原始标注评测、未做剔除。

## 实验设置

数据与口径：KITTI 验证集（3769 帧；Car / Pedestrian / Cyclist，IoU 阈值 0.7 / 0.5 / 0.5，AP 取 40 召回点）；主表（表 2）只报 Car 类 moderate 难度，其余类别/难度在附录 B。nuScenes 验证集（10 类；mAP 基于地面中心距离，另报 NDS），主表为表 3（mAP），NDS 在附录。Waymo 验证集用官方 L2 mAP/mAPH。规模感：KITTI-C 是原验证集的 120 倍（24 类 × 5 档），需 750G 以上存储，nuScenes-C 与 Waymo-C 更大，作者称将陆续发布。防御实验（附录 E）：点云增广 PA-AUG、Dropout、PointCutMix-R，图像增广 Mixup、CutMix；LiDAR-only 侧在 SECOND 与 PV-RCNN 上试，融合侧在 Focals Conv 上试双模态增广组合。并发对照：作者另设一组实验（图 4），对 Focals Conv 同时向 LiDAR 与相机施加传感器噪声，检验融合在双路同时受损时的表现。

## 关键数字

KITTI-C（表 2，Car moderate）：干净 AP——Focals Conv 85.88、PV-RCNN 84.39、EPNet 82.72；camera-only 只有 SMOKE 7.09、PGD 8.10、ImVoxelNet 11.49。AP_cor：PV-RCNN 72.59（LiDAR 最佳）、Focals Conv 71.87、EPNet 67.81；camera-only 的 AP_cor 只有 2.68 / 2.42 / 3.05，近乎全灭。Snow 与 Rain 对全体模型 RCE 均超过 35%（如 SECOND 在 Snow 下 52.34、Rain 下 52.55，干净 81.59）。Shear（目标几何形变）重创所有模型：SECOND 41.64、PV-RCNN 47.72、Focals Conv 45.77。Spatial Misalignment 把融合模型打穿：EPNet 82.72 → 35.14，Focals Conv 85.88 → 43.01。LiDAR-only 模型总体 RCE：SECOND 13.65%、PointRCNN 13.61%、PV-RCNN 13.99%；最差是效率导向的 3DSSD，24.34%（PointPillars 同样靠后）——作者据此提示鲁棒性与效率之间存在权衡。传感器层与目标层腐化对 LiDAR 模型大多只造成可忽略的跌幅，作者归因于这类扰动在训练数据中本就无处不在。nuScenes-C（表 3，mAP）：干净 mAP——BEVFusion 68.45、TransFusion 66.38、FUTR3D 64.17、CenterPoint 59.28；mAP_cor：BEVFusion 61.03、TransFusion 58.73、FUTR3D 56.99、CenterPoint 49.81——融合模型居前。Motion Compensation 是全表最伤的单项：CenterPoint 59.28 → 11.02、PointPillars 27.69 → 3.85、TransFusion 66.38 → 9.01、FUTR3D 31.87、BEVFusion 27.57；运动层整体使 LiDAR-only 跌幅超过 50%、融合约 30%。FOV Lost 同样重创：PointPillars 8.87、CenterPoint 20.84，融合模型也只有 24.63–27.17。camera-only 在天气下崩塌：FCOS3D 的 Snow 只有 2.01、PGD 2.30（干净 23.86 / 23.19）；总体 RCE 单目模型 FCOS3D 57%、PGD 54%，多视角 DETR3D 46%、BEVFormer 45%——多视角明显优于单目。与 KITTI-C 相反，nuScenes-C 上各模型对天气层相当耐受；作者的解释是 nuScenes 训练集本身就含雨天等恶劣天气数据——这是训练分布覆盖效应，不是架构机制。失准层跨数据集结论不一致：Spatial 在 nuScenes-C 上对三个融合模型几乎无损（BEVFusion 68.39 vs 干净 68.45），与 KITTI-C 的腰斩形成对照；Temporal 则有实质代价（FUTR3D 51.43、TransFusion 43.65、BEVFusion 49.02）。Waymo-C（表 D.1，L2 mAPH）：PointPillars 59.13 → 46.96，BEVFormer 22.96 → 12.13，TransFusion 60.16 → 50.91。Fog 对 LiDAR 系近乎归零：PointPillars 0.92、TransFusion 0.81；不依赖点云的 BEVFormer 反而保留 18.50。TransFusion 对相机噪声几乎免疫（Gaussian / Uniform / Impulse (C) 下 59.98 / 60.01 / 59.95，Motion Blur 59.29），与其 LiDAR 主导的查询式融合结构一致。

## 消融说明了什么

本文没有模块消融，其「消融」是三组协议层面的对照分析，恰恰是全文信息量最高的部分。其一，双路并发噪声对照（图 4）：腐化只命中一路时融合模型占优；当 LiDAR 与相机噪声同时施加，Focals Conv 的精度进一步下跌、跌破不受相机噪声影响的 LiDAR-only 模型。结论：融合的鲁棒性红利以「另一路完好」为前提，前提不成立时融合反转为双重暴露——两个传感器的腐化面同时敞开。其二，融合模型间的模态依赖权衡（§5.2）：FUTR3D 在图像噪声下平均跌 12.9%，远差于 TransFusion 的 2.5% 与 BEVFusion 的 5.3%；但在 Motion Compensation（点云被严重畸变）下 FUTR3D 反而最好（31.87，TransFusion 只有 9.01）。即融合模型的腐化鲁棒性由其对两模态的依赖结构决定：越依赖哪一路，就越怕哪一路的腐化，不存在全谱占优的融合方式。其三，数据增广防御（附录 E）：训练期增广不能带来免疫。LiDAR-only 侧结果不一致——Dropout 只让 SECOND 的 AP_cor +0.84（70.45 → 71.29），对 PV-RCNN 却从 72.59 降到 67.91；PA-AUG 使 PV-RCNN 降到 65.93；PointCutMix-R 对两者都降。融合侧更糟：双模态增广组合使 Focals Conv 的 AP_cor 从 71.87 跌到 25.07–55.32，最差是 Mixup + Dropout 的 25.07。作者据此明言：数据增广至多提供微小鲁棒性收益，3D 检测的鲁棒性提升仍是开放问题。另注：逐档曲线显示多数腐化下性能随严重度单调下降，说明 5 档划分确实张成了有区分度的难度轴，而非摆设。

## 局限

其一，腐化全部为合成，且两侧保真度不对称：天气对 LiDAR 用物理模型、对相机用 imgaug 近似；合成-真实校验（附录 A.4）也只覆盖天气层，且承认 camera-only 模型上差距较大。其余四层（传感器/运动/目标/对齐）没有任何真实数据校验。其二，传感器层与器件物理脱节：只有通用噪声（高斯/均匀/脉冲）与丢点/密度/视场类操作，没有按传感器件工作原理构造的故障模型。点云侧的 Crosstalk（多机互扰）与 FOV Lost 尚属环境/系统层，相机侧连这类都没有——「传感器故障」在该基准中实际等于「传感器噪声」；热成像的条纹、非均匀性漂移、坏点、饱和在此更无对应物。其三，分类学里没有「模态缺失」这一类——最接近的是 FOV Lost（LiDAR 部分视场丢失）与 Temporal Misalignment（一路冻结在旧帧、本质是「在场但过期」）。整模态缺失不在 27 类之内：该谱系的坐标轴是「退化程度」，不是「可用性状态」。其四，目标层依赖 GT 框：局部腐化与 Shear/Scale/Rotation 都用标注框定位施加，部署时不可得，只适合离线基准；且 Cutout / FOV Lost 下目标已不可见但标注保留的口径问题作者自承未解决，这类样本对融合模型（可凭相机检出）与 LiDAR-only 模型并不同等公平。其五，指标混淆干净精度与鲁棒性：AP_cor 是绝对量，作者自己发现它与干净 AP 高度相关；RCE 是自参照相对量，掩盖绝对水平。加之腐化集合随模型类别而异、AP_cor 跨类别不可比，横向结论只能逐腐化逐档地读，不能读总排名。其六，失准严重度无跨数据集标尺：同一组标定噪声超参在 KITTI-C 打穿融合模型、在 nuScenes-C 几乎无损——对标定矩阵加同分布噪声不等于同等几何偏移，该基准内部的失准结论无法跨集对齐；时间失准也只模拟整帧冻结（卡死/延迟），不模拟连续漂移与抖动。其七，受评面与机制面都窄：融合模型总共只有 5 种（点级 2 + 查询/BEV 级 3），且无一带可靠性估计、门控或弃权。整个基准测的是现成检测器的被动耐受，没有任何「检出损坏并折扣某一路」的机制在评测之列——鲁棒性从哪来只能从对照中归因，不能从机制上验证。其八，只有单腐化、没有复合腐化：真实场景中天气与失准、噪声与运动常同时出现，作者在 §3 讨论中承认现实腐化是复合的，但基准只测单一腐化（图 4 的双路并发噪声是唯一例外，且只是同层噪声的并发）。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
