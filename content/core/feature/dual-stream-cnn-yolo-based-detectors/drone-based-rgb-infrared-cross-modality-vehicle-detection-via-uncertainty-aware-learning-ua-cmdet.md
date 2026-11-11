---
title: "Drone-Based RGB-Infrared Cross-Modality Vehicle Detection via Uncertainty-Aware Learning (UA-CMDet)"
paper_id: "sun2022dronebased"
authors: "Sun, Cao, Zhu, Hu"
year: "2022"
venue: "IEEE TCSVT"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Quality-Aware"
tags: ["aerial", "quality-aware"]
paper_link: "https://doi.org/10.1109/TCSVT.2022.3168279"
code_link: "https://github.com/VisDrone/DroneVehicle"
doi: "10.1109/TCSVT.2022.3168279"
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Introduces the DroneVehicle dataset (28,439 RGB-IR pairs) and weights cross-modal learning by per-object uncertainty from cross-modal IoU and illumination, with illumination-aware NMS.

## 点评

「不确定性」定义在标注侧而非输入侧：UAM 的权重全部由真值算出（两模态真值框的多边形 IoU、哪侧漏标、RGB 灰度直方图光照值），只乘进边界框回归损失，训练后移除、推理零开销——量化的是标注不一致，逐目标损坏对它不可见。特征融合是无门控的通道拼接 + 1×1 卷积，红外侧权重 ω_inf 实验中直接设为 1、从不降权；推理期唯一自适应是 IA-NMS 把 RGB 支路全部分数乘以整图光照标量（单向、场景级、不分目标）。仅干净 DroneVehicle：旋转框 mAP@0.5 融合 64.01 > 红外 59.15 > RGB 47.91，UAM 各处贡献不足 1 点、主体增益来自三支路结构。无退化/缺失评测（文中 missing 指标注缺失，SMO 补框是训练数据治理）。本注记据 arXiv 预印本 v2；期刊版据称另含两个数据集的实验，未读到。

## 框架图

![UA-CMDet 方法主框图（原文 Figure 6）：UAM 不确定性感知模块、三支路检测结构与 IA-NMS 合并总览](figs/drone-based-rgb-infrared-cross-modality-vehicle-detection-via-uncertainty-aware-learning-ua-cmdet.webp)

*原文 Figure 6：UA-CMDet 总体架构。左侧为 UAM 块：由两模态真值框计算跨模态 IoU 与缺失目标补充，得到三支路的回归损失权重 ω_R / ω_F / ω_I；中部为三支路——RGB 支路、红外支路与中间的跨模态融合支路（特征拼接 + 1×1 卷积），各接一个 RoITransformer 检测头；顶部光照块由 RGB 灰度直方图算出光照值 ω_iv，同时供训练权重与推理期的 IA-NMS；右侧 IA-NMS 把三支路候选框（RGB 分数先乘 ω_iv）合并做 NMS。金色虚线框为训练期、蓝色虚线框为推理期，直观显示 UAM 只存在于训练框内、推理期被整体移除。图源：Sun et al., IEEE TCSVT 2022（预印本 arXiv:2003.02437v2），Figure 6。*

## 问题定义

无人机平台的 RGB-红外车辆检测。作者的出发点是双模态的互补与冗余并存：低光下 RGB 目标定位不可靠、红外更清晰；但红外缺颜色纹理，白天会出现与车辆外形相似的混淆矩形物，热交叉（thermal crossover）还会产生无车位置的「鬼影」。此外有两个数据层面的不对称：（1）标注不对称——同一目标可能只在某一个模态里被标出（夜间 RGB 中不可见的目标漏标、白天红外中不显著的目标漏标），两模态的真值框集合并不一致；（2）像素级未对齐——双相机位姿差异使成对图像存在错位（数据集构建阶段已用仿射变换 + 裁剪做预对齐，残余错位仍在）。作者把这两类现象统称为逐目标的「不确定性」，问题表述为：如何量化每个目标在每个模态中的不确定性，并用它改善跨模态检测器的学习与推理。须注意，这里的不确定性是标注与对齐层面的量，不是传感器损坏意义上的模态退化——全文没有损坏模态、缺失模态输入或传感器故障的设定。阅读依据：作者预印本 arXiv:2003.02437v2 全文；期刊版（IEEE TCSVT 2022）摘要称实验另含两个 RGB-红外数据集，预印本实验只覆盖 DroneVehicle，下文数字均出自预印本表格。

## 方法细节

总体结构（图 6）：RGB 与红外各过一个 ResNet-50 + FPN 骨干提特征，融合支路把两路特征沿通道拼接后过 1×1 卷积；三支路各接一个 RoITransformer 检测头。两个附加机制是训练期的 UAM 与推理期的 IA-NMS。（1）UAM（不确定性感知模块）只存在于训练期，其输入是成对的真值标注，不是网络预测或特征：对两模态中匹配上的同一目标，计算其两个真值多边形框的 IoU（跨模态 IoU），度量该目标在两模态间的定位分歧；只在一个模态有标注的目标，把其真值框补进另一模态的标注集（SMO），补入的框即被视为「不确定」目标。权重定义上，红外侧补入目标的权重 ω_inf 在实验中直接设为 1（红外支路作参照、只需补齐目标），即红外侧实际不降权；RGB 侧为分段式：漏标补入目标取 ω_rgb = 0.1，未对齐目标（0 < 跨模态 IoU < 0.8）取 IoU 值 × ω_iv，已对齐目标取 ω_iv，其中 ω_iv 是由 RGB 图像灰度直方图算出的光照值；融合支路权重等于红外侧权重。权重只调制边界框回归损失（覆盖 x、y、w、h、θ 五个分量，作用于 RPN 与 RoI Transformer 两处回归），分类损失不加权；三支路损失等权相加。作者明确写道 UAM 训练后移除、推理期不增加任何计算。（2）IA-NMS（光照感知跨模态 NMS）是唯一的推理期自适应：三支路在推理期都保留，各自出框与分数；先把 RGB 支路全部分数乘以当前图像的光照值 ω_iv，再把三支路候选框合并做标准 NMS（阈值 0.1）得最终结果，意图是暗光场景下压低 RGB 支路假阳性对合并结果的干扰。

## 实验设置

数据集为本文构建的 DroneVehicle：28,439 对 RGB-红外图像，分辨率统一为 840×712；5 类（car、truck、bus、van、freight car），共 953,087 个旋转框实例，其中 RGB 标注 452,570、红外标注 500,517，两侧数目不等正源于标注不对称。按光照分 Day 14,478 / Night 5,468 / Dark night 8,493 对；高度 80/100/120 m，视角含垂直与 15°/30°/45°。划分：训练 17,990 对 / 验证 1,469 对 / 测试 8,980 对，全部实验在训练集训练、测试集评测。指标为 mAP，预测框与最近真值框 IoU > 0.5 判为真阳性（PASCAL 式口径，旋转框）。实现：ResNet-50 + FPN 以 ImageNet 预训练初始化，SGD 训练 12 epochs，lr 0.005，batch size 2，随机水平翻转（0.5）；代码基于 MMDetection 修改。基线为 7 个单模态旋转框检测器（RetinaNet(OBB)、Faster R-CNN(OBB)、Faster R-CNN(Dpool)、Mask R-CNN、Cascade Mask R-CNN、Hybrid Task Cascade、RoITransformer），在统一代码库、同一设置下分别在 RGB 与红外上训练评测，单模态对照行齐全。没有的设置：无模态丢弃、无噪声/腐化注入、无传感器故障模型；Day/Night/Dark night 只作数据统计，未报告分光照子集的检测指标。

## 关键数字

均为 DroneVehicle 测试集 mAP（IoU 0.5，旋转框）。头条（表 VI）：UA-CMDet（RGB+红外）64.01（car 87.51 / freight car 46.80 / truck 60.70 / bus 87.08 / van 37.95）；最强单模态基线 RoITransformer：红外 59.15、RGB 47.91，即融合相对红外单模态 +4.86、相对 RGB 单模态 +16.10。消融（表 IV）：单模态 + UAM：RGB 47.91 → 49.36（+1.45），红外 59.15 → 59.52（+0.37）；融合支路（拼接融合）无 UAM 的 CMDet 62.53 → 加 UAM 的 UA-CMDet 63.25（+0.72）→ 再加 IA-NMS 64.01（+0.76）；逐元素加融合对应为 62.58 → 63.02（+0.44）→ 63.48（+0.46）。UAM 三操作分解（表 V）：RGB 侧补缺失目标（SMO）+0.42、再加未对齐感知 +0.61、再加光照感知 +0.42；红外侧 SMO +0.27、未对齐感知 +0.10（红外侧无光照感知）。读法：总增益（59.15 → 64.01）的主体来自三支路融合结构本身（朴素拼接融合的 CMDet 已达 62.53），UAM 与 IA-NMS 各自的贡献都在 1 个点以内。

## 消融说明了什么

表 IV/V 支持的是「每个部件在干净测试分布上都有小幅正贡献」：UAM 的三个操作（补缺失目标、未对齐降权、光照降权）逐项累加单调为正，IA-NMS 对 bus 类 AP 的提升超过 6 个点（作者特别指出）。但所有消融都跑在同一个干净测试集上，没有任何一组消融改变测试输入的模态状态——消融证明的是这些权重在标注不一致/对齐残差下的训练正则价值，而不是对测试期模态损坏的适应能力。作者还自陈一个 IA-NMS 的副作用：三支路框合并后重叠过多，NMS 会误滤部分真阳性（用以解释 car 类 AP 相对红外单模态最佳值不升反降的现象）。

## 局限

（1）不确定性是标注先验而非输入量：权重全部由真值框（跨模态 IoU、哪侧漏标）与图像级光照统计算出，依赖两模态分别标注的真值集合；推理期 UAM 整体移除，测试输入发生逐目标损坏时，系统没有任何量能感知到。（2）红外侧名义降权、实际不降：ω_inf = 1 使红外支路与融合支路的回归损失从不因「不确定」被压低，真正被降权的只有 RGB 侧补入目标（0.1）与未对齐目标；且分类损失全程不加权——被补入的框仍以全权重训练分类，只有其回归被折扣。（3）推理期适应只有一个全局标量：IA-NMS 只按整图光照值折扣 RGB 支路分数，不动红外与融合支路，不区分目标、不区分损坏类型；融合支路本身是固定拼接 + 1×1 卷积，无门控。（4）评测足迹窄：只有干净 DroneVehicle 测试集的总 mAP；文中「missing」始终指标注缺失，不是输入模态缺失。（5）ω_iv 的具体计算（灰度直方图如何映射为光照值）在预印本中无显式公式，复现需查代码。作者自陈的局限仅结论中提到数据集的长尾分布问题，留作未来工作。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 对比表：[[compare|REQ-04 四维对比表]]
