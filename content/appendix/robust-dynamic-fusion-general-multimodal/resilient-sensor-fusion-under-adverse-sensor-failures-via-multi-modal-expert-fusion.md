---
title: "Resilient Sensor Fusion Under Adverse Sensor Failures via Multi-Modal Expert Fusion"
paper_id: "park2025resilient"
authors: "Park, Kim, Kim, Choi"
year: "2025"
venue: "CVPR"
list: "appendix"
scope: "Reference"
section: "Robust & Dynamic Fusion (General Multimodal)"
subsection: ""
fusion_level: "feature"
architecture: "Other"
mechanisms: "Routing"
tags: ["expert-routing", "degraded-modality", "lidar-camera"]
paper_link: "https://arxiv.org/abs/2503.19776"
code_link: ""
doi: "10.1109/CVPR52734.2025.00630"
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Per-query routing among camera/LiDAR/fused experts by local feature quality.

## 点评

按局部特征质量逐查询路由相机 / LiDAR / 融合专家；自动驾驶 3D 场景，训练使用合成传感器丢弃增广。

## 框架图

![MoME 方法主框图（原文 Figure 3）：多专家解码与自适应查询路由总图](figs/resilient-sensor-fusion-under-adverse-sensor-failures-via-multi-modal-expert-fusion.webp)

*原文 Figure 3：左半为总览——LiDAR 点云与多视角图像分别经 LiDAR / Camera Encoder 得到 F′l、F′c，拼接为 F′lc；虚线框 MED 内三个专家解码器（LiDAR Expert / LiDAR-cam Expert / Camera Expert）共享同一组 object queries，AQR 依据每条 query 的局部特征把 QL、QF、QC 分配给对应专家解码，输出汇入 3D Detection Results；左上虚线框示意训练集的传感器 drop 增广（整路 Drop 的样本对）。右半为 AQR 放大图——query 的 3D 参考点投影生成 LiDAR Mask 与 Image Mask，合成为 Local Attention Mask（灰 = Ignored、白 = Attended），在掩码内对 F′lc 做 Transformer cross-attention，经 Linear + Softmax 得到 Modal Probabilities，训练时与由 drop 身份生成的 Experts Label 计算 Auxiliary Loss。图源：Park et al., CVPR 2025 / arXiv:2503.19776，Figure 3。*

## 问题定义

作者把失效下融合崩溃的根源定位为模态间依赖：主流中间融合把两模态特征耦合在一起，一个传感器受严重噪声、遮挡或故障时，污染会经耦合特征传播到整个感知结果，因此原文指出“融合的性能常常还不如一个完好的单传感器”。其失效谱系分三类：完全故障（整传感器 malfunction）、部分损伤（视场受限、分辨率/束数下降）、不利条件（遮挡、污染）。目标是在 nuScenes-R 的传感器失效场景与极端天气下维持 LiDAR–相机 3D 检测性能。注意：模态是 LiDAR + 多视角相机、任务是自动驾驶 3D 检测，不是 RGB-T。阅读依据：arXiv:2503.19776 v2 全文通读，含补充材料，无降级。

## 方法细节

骨干：VoxelNet 编码 LiDAR 点云并投影为 BEV 特征 Fl；VoVNet 编码 6 路相机图像得 Fc；两者展平后拼接为联合特征 F′lc。MED（多专家解码）：三个并行的 DETR 式 6 层 Transformer 解码器，实现细节注明三者共享权重，差异只在 key/value 用哪组特征——LiDAR 专家用 F′l、相机专家用 F′c、LiDAR-相机专家用 F′lc，解码同一组共享 object queries；每个 query 只被分配给一个专家（argmax 硬路由，Switch Transformer 式 top-1），被选中的专家独立产出该 query 的框与类别，最后统一过 FFN，解码复杂度与单解码器相当。AQR（自适应查询路由）：单层 cross-attention 路由器，做局部感知路由——对每条 query 取其 3D 参考点分别投影到 LiDAR BEV 平面与一路相机视图，以窗口 ll=5、lc=15 在 F′lc 上构造二值 Local Attention Mask（LAM），在掩码限定的局部特征上做 masked cross-attention，softmax 输出三路选择概率；粒度是 object query 级（比场景级细，但仍是整条 query 的全有全无切换）。训练两阶段：阶段一（20 epoch）三个专家并行解码全部 query、各自与 GT 二分匹配，总损失为三路 focal + L1 之和，无传感器 drop 增广，用 CBGS 采样；阶段二冻结骨干与专家、只训 AQR（2 epoch），加传感器 drop 增广：相机、LiDAR 各以 1/3 概率被整路丢弃，1/3 概率双路保留。AQR 的监督标签直接由“丢了哪个传感器”生成：丢 LiDAR → 选相机专家，丢相机 → 选 LiDAR 专家，都不丢 → 选融合专家，交叉熵训练。

## 实验设置

数据：nuScenes（32 线 LiDAR + 6 相机 360°，700/150/150 scenes）训练；评测用 nuScenes 验证集（clean，并以场景描述切出 Rainy / Night 子集）、nuScenes-R、nuScenes-C。指标为 mAP（BEV 平面、距离阈值 0.5/1/2/4 m、10 类）与 NDS，鲁棒性另报相对性能比 R（各不利条件性能均值 ÷ clean 性能）。nuScenes-R 失效场景中缺失与损坏分开、分列报告：缺失型有 LiDAR Drop（点云全部删除）、Camera View Drop（主表为 6 个视角全部置零，补充材料扫 1–6 个）；部分损坏型有 Beam Reduction（LiDAR 降至 4 束；补充材料扫 1/4/8/16/32 束）、Limited FOV（扫描角限制在 [-60°, 60°]；补充材料扫至 [-30°, 30°]）、Object Failure（每个 GT 框内的 LiDAR 点以 0.5 概率删除；补充材料扫 ratio 0–0.9）、Occlusion（相机图像加预定义泥点遮挡 mask）。nuScenes-C 该基准共有 27 种腐化（天气/传感器/运动/目标/对齐五组），本文只取极端天气三项 Fog / Snow / Sunlight。对照以 CMT 为主要对手（同样用 drop 增广训练），另有 MetaBEV、UniBEV、TransFusion、BEVFusion（两版）、DeepInteraction、UniTR、SparseFusion，带 † 者为作者用官方代码复现；单模态的 DETR3D（纯相机）与 CenterPoint（纯 LiDAR）也在表内，但只报 clean 与个别失效列。

## 关键数字

表 1（nuScenes-R，mAP/NDS）：Clean——MoME 71.2/73.6，CMT 70.3/72.9，SparseFusion 71.0/73.1，干净条件下只比最强基线高 0.2–0.9。相对性能比 R：MoME 80.5/86.2 vs CMT 78.4/84.4（+2.1/+1.8）。LiDAR Drop：42.5/48.2 vs CMT 38.3/44.7（+4.2 mAP）；多数耦合融合基线直接归零——TransFusion、BEVFusion、DeepInteraction、SparseFusion 的 mAP 均为 0.0，UniTR 0.1。Limited FOV [-60°, 60°]：50.6/58.3 vs CMT 43.9/54.0（+6.7 mAP，全文最大增益）；补充材料中 FOV 收紧到 [-30°, 30°] 时 44.0 vs 35.0，差距随损伤加重而扩大。Beam Reduction（4 束）：55.0/63.0 vs CMT 54.9/62.2；降到 1 束时 30.5 vs 25.9。Object Failure（rate=0.5）：67.0/71.0 vs 66.7/70.4。View Drop（6 视角全丢）：63.6/69.5 vs CMT 61.7/68.1（+1.9 mAP）。Occlusion：65.6/70.5 vs 65.0/69.8。天气：Rainy（val 子集）72.2/74.8 全表最佳；Night 43.0/46.6——NDS 最佳但 mAP 并非最佳（GraphBEV 45.1、SparseFusion 43.8 更高）。nuScenes-C（表 3，mAP）：Fog 67.9 / Snow 63.5 / Sunlight 65.2，vs CMT 66.3/62.6/63.6。延迟：274 ms vs 单解码器基线 270 ms（+4 ms）。Query 分配（表 5）：clean 时 94% 走融合专家、6% 走相机专家；LiDAR Drop 时 92% 转相机专家；Camera Drop 时 100% 走 LiDAR 专家；Limited FOV 时 62% 相机 / 38% 融合；Occlusion 时 81% 融合 / 15% LiDAR；天气类与 clean 几乎无异，94–99% 仍走融合专家。

## 消融说明了什么

（1）只有多专家、没有路由（表 4）：三个解码器并行、按各自置信分数选输出，clean mAP 从 70.3 崩到 33.4——独立训练的解码器置信尺度未校准，按分数选会系统性选错；该行的 R=113 是 clean 崩塌造成的比值假象（作者自己点明），说明 R 这类相对指标在 clean 退化时可以“看起来更鲁棒”。（2）加 AQR 但用全局注意力（无 LAM）：clean 恢复到 71.0/73.6，但 R=74.1/83.2 反低于单解码器基线（78.4/84.4）——全局路由解决了置信校准，却选不对局部失效。（3）再加 LAM（完整 MoME）：R 跳到 80.5/86.2（比无 LAM 版 +6.4 mAP / +3.0 NDS），clean 71.2——鲁棒增益几乎全部来自“局部感知”这一项，路由框架本身（全局版）单独不带来鲁棒性。（4）AQR 特征提取方式（补充表 10）：普通 cross-attention 与 deformable attention 在 Limited FOV 上只有 25.7 / 32.1 mAP（LAM 版 50.6），但在 clean 与各 drop 场景与 LAM 版几乎无差——局部掩码是专门针对局部/部分失效的承重组件，对整路缺失型失效并不重要（缺失时全局信号已足够判别）。

## 局限

（1）无任何保证式结论：没有定理、没有下界；“融合可能不如单个完好传感器”只出现在动机里，未被形式化，实验上也没有把失效条件下的 MoME 与同条件下的单模态检测器同协议正面对比——表 1 的单模态行只报 clean 和个别列。（2）路由监督 = drop 身份，不是质量估计：AQR 训练时只见过“整路丢弃”的三状态（1/3/1/3/1/3），没见过任何连续退化样本（噪声、模糊、曝光、强度衰减）；作者称 AQR“基于特征质量”选专家，但其训练信号本质上是合成 drop 的身份标签——路由器学的是“识别哪一路被整路丢弃”，对“模态还在场、但信号被污染且产生自信的错误特征”这一情形没有训练信号；天气场景下 94–99% 的 query 仍走融合专家，意味着污染经拼接特征进入的通道基本敞开。（3）硬路由全有全无：query 一旦分给融合专家，就完整消费含损坏模态的拼接特征，没有部分衰减、局部压制的中间档；粒度止于 object query，不是特征图区域级。（4）失效类型以“信息移除”为主：drop、束数减少、FOV 截断、框内点删除都是删信息；相机侧除泥点遮挡外没有信号级腐化，nuScenes-C 也只用了天气三项（其余 24 种腐化未评），真实传感器故障模型不在其列。（5）评测面窄：单一数据集、验证集评测；多个基线为作者复现；R 为比值指标，clean 崩塌时可超过 100，引用 R 必须同时给出 clean 绝对值；Rainy 子集的 72.2 mAP 高于其自身 clean 的 71.2，是子集构成不同所致，不可直接比。（6）体量与部署：VoVNet + VoxelNet + DETR 解码、274 ms 量级延迟，与轻量 2D 检测器不在同一部署区间。另注：正文称训练“分三个阶段”但只描述了两个，实验节与补充材料均作两阶段，应为原文笔误。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
