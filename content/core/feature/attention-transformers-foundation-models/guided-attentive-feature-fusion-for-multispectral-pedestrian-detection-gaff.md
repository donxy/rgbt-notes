---
title: "Guided Attentive Feature Fusion for Multispectral Pedestrian Detection (GAFF)"
paper_id: "zhang2021guided"
authors: "Zhang, Fromont, Lefèvre, Avignon"
year: "2021"
venue: "WACV"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Attention"
tags: ["pedestrian", "cross-attention", "efficiency"]
paper_link: "https://openaccess.thecvf.com/content/WACV2021/html/Zhang_Guided_Attentive_Feature_Fusion_for_Multispectral_Pedestrian_Detection_WACV_2021_paper.html"
code_link: ""
doi: "10.1109/WACV48630.2021.00012"
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Inter- and intra-modality attention modules dynamically weigh and fuse multispectral features at low computational cost.

## 点评

A widely used comparison point in CFT-era papers; an efficiency-conscious attention baseline.

## 框架图

![GAFF 方法主框图（原文 Figure 3）：引导注意力特征融合总架构](figs/guided-attentive-feature-fusion-for-multispectral-pedestrian-detection-gaff.webp)

*原文 Figure 3：左侧为双流总览——热红外（绿）与可见光（蓝）两条特征提取支路在多光谱特征融合处汇合，送入行人检测网络（紫）；右侧虚线框为 GAFF 模块放大：黄色路径为模态内注意力——每路特征各自经卷积 + sigmoid 生成本模态行人掩码（黑色掩码图），与原特征在乘法节点处残差式结合；红色路径为模态间注意力——两路特征拼接后经卷积 + softmax 生成一对互补的灰度权重图，分别作用于两路；两路增强结果在加法节点汇合为融合特征（紫）。图底部图例条给出热红外/可见光输入示例、真值掩码以及黄/红路径与乘法/加法算子的图例。图源：Zhang et al., WACV 2021，Figure 3。*

## 问题定义

多光谱行人检测中，两模态的相对价值随条件变化：可见光在光照良好时提供颜色与纹理细节，热红外对温度敏感、在夜间与阴影中更可靠。既有自适应融合多为手工机制——典型如光照感知网络，按估计的光照值在日/夜子网络或两路检测结果之间加权——其缺陷是手工枚举的场景覆盖不全，且同一场景内条件也可完全不同（夜间城市与乡村光照迥异）。GAFF 的问题设定是：让网络在每个空间位置上全自适应地学习两模态特征的动态加权与融合，不依赖任何手工场景假设与额外标注。作者自称这是首个把多光谱特征融合视为网络优化中的一个子任务、并为该子任务引入专门引导（guidance）的工作。问题的默认前提仍是两模态输入完好且对齐；摘要中的“robust and reliable”是对多光谱系统一般性的陈述，不构成鲁棒性实验问题。阅读依据：CVF 开放获取官方 PDF 全文通读（WACV 2021，pp. 72–80），无降级；本文无 arXiv 版本。

## 方法细节

基座是双流 RetinaNet（骨干 ResNet18 或 VGG16，ImageNet 预训练），基线融合为逐元素相加；GAFF 插入在特征融合阶段，仅含 3 层卷积，由两个注意力模块串联组成，融合分三步。模态内注意力（intra-modality，图 3 黄色路径）：每一模态用自身特征经一层卷积 + sigmoid 预测一张行人掩码 m_intra（该模态视角下行人所在区域），再以残差形式增强自身特征：f_intra = f ⊗ (1 + m_intra)。掩码预测由分割损失监督：真值掩码由检测框标注转换而来（把框填充为椭圆近似行人形状），损失为 DICE 损失。方向性是对称的自引导——每路只看自己，不存在跨模态引导。模态间注意力（inter-modality，图 3 红色路径）：两模态特征拼接后经卷积 + softmax，输出逐像素的一对权重 (m^t_inter, m^v_inter)，两数之和恒为 1；增强方式同为残差式 f_inter = f ⊗ (1 + m_inter)。组合（hybrid）：每路特征先后被两个掩码增强，f_hybrid = f ⊗ (1 + m_intra) ⊗ (1 + m_inter)；最终融合特征是两路 hybrid 特征的直接平均。“引导”的确切含义与方向（本文命名来源，需精确表述）：inter 掩码的理想监督应是“逐像素最佳模态质量”真值，作者明言这种标注代价太高，于是用 intra 模块自生成伪标签——先算两路掩码预测与真值掩码的 L1 误差图，若某位置两路误差差超过 margin，则把该位置的 inter 标签定为选误差小的一路（硬标签 1,0 或 0,1）；差在 margin 内的位置标为 ignored、不参与损失；inter 损失为交叉熵。即引导链条是训练信号层面的纵向传递：真值掩码 → 监督 intra 预测；intra 的两路预测误差比较 → 生成标签监督 inter 选择。推理时无真值参与，两张掩码都由特征预测。margin 取 0.1（消融最优）；margin 机制同时被作者用来规避训练初期的“冷启动”（初期两路掩码都近零、误差差小，绝大多数位置被 ignore）。总损失 L_total = L_det + L_intra + L_inter，其中 L_det 为 focal loss + balanced L1 loss。一个结构性事实：由于两个模块都采用 (1 + m) 残差增强、m ∈ (0,1)，任一模态的特征增强因子恒在 (1, 2) 区间，最终融合又是直接平均——该机制没有任何把某一路压低到其原始强度以下的通路；inter 的“选择”只是相对放大偏好的一路。

## 实验设置

数据集两个，均为干净基准。KAIST：7,601 对训练 / 2,252 对测试；同时报告原始标注与 MSDS-RCNN 提出的 sanitized（去标注错误）版本两套结果；全部模型用改进版测试标注评测；指标为合理设置（行人高度 > 50 px、无或部分遮挡）下 FPPI ∈ [10⁻², 10⁰] 的对数平均漏检率（MR），评测代码用 MSDS-RCNN 仓库的 KAISTdevkit。FLIR ADAS：用对齐版，5,142 对（训练 4,129 / 测试 1,013），person/car/bicycle 三类，指标为 COCO 式 mAP（10 个 IoU 阈值平均）及 AP50/AP75。输入分辨率固定 640×512。运行时间在 GTX 1080Ti 与 Jetson TX2 两平台实测（含 TensorRT），不含 NMS 等后处理。

## 关键数字

KAIST MR（All / Day / Night），原始标注：GAFF（VGG16）10.62 / 10.82 / 10.14。对照：CFR 10.05 / 9.72 / 10.80（All 与 Day 优于 GAFF，Night 不如 GAFF），MSDS-RCNN 11.63 / 10.60 / 13.73，CIAN 14.12 / 14.77 / 11.13，IATDNN+IASS 15.78，Halfway Fusion 26.15。KAIST MR，sanitized 标注：GAFF 6.48 / 8.35 / 3.46；CFR 6.13 / 7.68 / 3.19（三项仍全面领先 GAFF），MSDS-RCNN 7.49 / 8.09 / 5.92。即两种标注口径下 GAFF 在 KAIST 上都位列第二、次于作者自家更贵的 CFR，其定位是“以约 1/5 的推理时间逼近 CFR”。单模态参照（正文，sanitized，独立训练的单模态模型）：热红外-only MR 18.8，可见光-only 20.74——注意这不是融合模型缺一路输入的测试。FLIR 对齐版（mAP / AP75 / AP50）：ResNet18 相加基线 36.6 / 31.9 / 72.8 → GAFF 37.5 / 32.9 / 72.9；VGG16 基线 36.3 / 30.2 / 71.9 → GAFF 37.3 / 30.9 / 72.7。增益仅约 +1 mAP，远小于 KAIST；CFR 在该集 AP50 为 72.39；后续工作在 FLIR 表中引用的“GAFF 72.9”即 ResNet18 行的 AP50。代价：GAFF 只增加 13,828 个参数（ResNet18 与 VGG16 两种骨干均 < 0.1%）；1080Ti 推理 ResNet18 10.31 → 10.85 ms、VGG16 8.87 → 9.34 ms，TX2 上分别 10.5 → 12.1 ms、10.3 → 11.6 ms。跨方法运行时间（平台不尽相同）：GAFF 9.34 ms（1080Ti）vs CIAN 70 ms（1080Ti）、CFR 50 ms（1080Ti）、MSDS-RCNN 220 ms（Titan X）。

## 消融说明了什么

margin（表 1，sanitized）：0.05 → MR 6.92/8.47/3.68；0.1 → 6.48/8.35/3.46（最优）；0.2 → 7.47/9.31/4.22。死区太小则伪标签噪声大，太大则监督位置太少。残差式 vs 直接相乘（表 2）：把掩码直接乘到特征上（f ⊗ m）得 7.46/8.88/4.85，残差式 (1 + m) 得 6.48/8.35/3.46——残差形式是实质性设计点；换言之，让 GAFF 胜出的恰是那个使它无法抑制任何一路的形式。模块消融（表 3，sanitized，VGG16）：相加基线 9.28/11.73/5.17 → 仅 intra 8.70/11.42/3.55 → 仅 inter 7.73/10.35/2.81 → 两者 6.48/8.35/3.46。两点：inter 单独贡献大于 intra；且 Night 子集上仅 inter（2.81）反优于两者组合（3.46），组合并非在每个子集都最优，作者未讨论这一反常。引导消融（表 4，sanitized）：同架构去掉 L_intra、L_inter（注意力只受检测损失监督）：VGG16 8.38/10.39/4.44 → 加引导 6.48/8.35/3.46；ResNet18 9.05/10.63/6.01 → 7.93/9.79/4.33。引导值约 1.9 个 MR 点——本文核心主张（融合子任务需要专门引导）有消融支撑。掩码可视化与演化（图 4–6）：有引导的 inter 掩码呈现可解释偏好——光照良好/色彩鲜明区域（路牌、车尾灯等）选可见光，暗区与均匀区域（天空、路面）选热红外；无引导的掩码难以解释。训练演化显示随两路掩码 Dice 上升，“模态选择”任务反而变难；热红外掩码整体优于可见光，与单模态 MR 排序一致。图 5c 给出一个错误案例：台阶上的行人在热红外图中不可见，GAFF 依其“均匀区域选热红外”的学得偏好选了热红外而漏检，无引导模型反而检出——作者自承的选择机制失败例（注意这是目标在某模态中缺席的情形，不是传感器损坏）。

## 局限

（1）鲁棒性评测为零（已逐项核查全文）：无任何模态退化、噪声、腐化、缺失模态实验，全文检索不到 noise/corrupt/degrad 类表述；Day/Night 拆分是自然分布拆分。结论段注意到数据集中存在轻微未对齐对，并把“基于注意力掩码的特征校准模块”列为未来工作——GAFF 本身假设输入对齐。（2）“质量”只是代理而非估计：inter 掩码的训练信号是“哪一路的行人掩码预测更接近真值”，度量的是干净训练数据上的相对任务表现，不是传感器质量或可靠性；推理时无真值，掩码只是由拼接特征预测出的相对偏好。softmax 双权重恒和为 1，两路同时不可靠时仍被迫分出赢家，无绝对质量尺度、无不确定性、无校准验证。文中“select the most reliable modality”“higher quality”一类措辞强于其机制实质。（3）结构上不能折扣：(1 + m) 残差增强 + 最终直接平均意味着一路模态即使完全被污染，也至少以原始强度进入融合特征；该机制能放大偏好，不能抑制任何一路。（4）intra 的监督掩码本身是粗糙近似：真值掩码由检测框填充椭圆生成，并非真实行人分割，掩码语义先天带噪。（5）FLIR 上增益（约 +1 mAP）远小于 KAIST；且 sanitized 标注下所有方法的数字都大幅变好，跨标注版本引用 GAFF 的 6.48 时必须注明口径。其 KAIST 头条在两种口径下都次于 CFR，“SOTA”表述需带成本语境理解。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
