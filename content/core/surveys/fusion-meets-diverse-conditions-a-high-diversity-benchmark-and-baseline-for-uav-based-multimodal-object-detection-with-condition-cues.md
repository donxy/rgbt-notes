---
title: "Fusion Meets Diverse Conditions: A High-diversity Benchmark and Baseline for UAV-based Multimodal Object Detection with Condition Cues"
paper_id: "chen2025fusion"
authors: "Chen et al."
year: "2025"
venue: "ICCV"
list: "core"
scope: "Core"
section: "Surveys & Benchmarks"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["benchmark", "aerial", "degraded-modality"]
paper_link: "https://openaccess.thecvf.com/content/ICCV2025/papers/Chen_Fusion_Meets_Diverse_Conditions_A_High-diversity_Benchmark_and_Baseline_for_ICCV_2025_paper.pdf"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Introduces ATR-UMOD, a UAV RGB-IR dataset with 11 categories and six per-pair condition attributes, plus the prompt-guided condition-aware dynamic fusion baseline PCDF.

## 点评

11,850/1,503 train/test pairs with conditions annotated, enabling condition-specific robustness evaluation.

## 框架图

![PCDF 方法主框图（原文 Figure 4）：条件提示学习、提示引导条件解耦与条件感知动态融合](figs/fusion-meets-diverse-conditions-a-high-diversity-benchmark-and-baseline-for-uav-based-multimodal-object-detection-with-condition-cues.webp)

*原文 Figure 4：横向三段。左段 SCPL：条件文本表（六属性及取值）拼成初始提示，Condition Hard-gating 结合两模态特征筛掉无关属性（图中以 ✓/✗ 标在各属性块上），得到样本特异提示，经冻结的 CLIP Text Encoder 产出条件嵌入。中段 PCD：RGB/IR 双编码器给出原始特征，两路各经 Condition-invariant Encoder 得到条件不变特征；条件特异编码器在拼接特征上产出 Condition guidance，与条件嵌入之间以 pull（蒸馏对齐）、与不变特征之间以 push（分离）相连。右段 CDF：Channel Normalized Soft-gating 由条件引导生成逐通道的 RGB/IR 权重曲线（图中 0.5 基准线上下两条曲线），分别对两路不变特征做逐元素重加权（Reassigned features），拼接后送 Detection；两路另各有一个 Detection 输出对应单模态判别损失。读图关键：权重曲线的唯一来源是中间的条件引导——全图没有从单路特征自身估计质量的通路。图源：Chen et al., ICCV 2025，Figure 4。*

## 问题定义

面向 UAV 平台的 RGB–IR 目标检测。作者认为既有唯一同类数据集 DroneVehicle 的成像条件过于狭窄——固定飞行高度与相机角度、拍摄时间有限、只有晴好天气、光照变化受限、场景简单、仅 5 类目标、且没有任何条件标注——无法支撑对“条件如何影响多模态融合”的评测与研究。本文的两个交付物对应两个层面的问题：(1) 基准层：构建 ATR-UMOD，在高度、角度、时间、天气、光照、场景六个维度上大幅扩展真实采集的条件多样性，并为每一对图像额外标注 6 个条件属性，使“按条件分档评测”（condition-specific evaluation）成为可能。(2) 方法层：既有条件引导融合有两处缺陷——条件表示不充分（只用光照等单一属性；且条件表示来自一个单独的条件预测模型，多标签预测本身困难）；条件引导管线与检测任务不对齐（用光照预测等前置任务产生可靠性权重，优化目标与检测不一致，得到的模态贡献次优）。PCDF 主张用 CLIP 文本语义把多标签条件编码为提示，并以检测导向的软门控直接学习“条件→模态贡献”的任务特异关系。须先行定性：ATR-UMOD 的“diverse conditions”是真实野外采集的自然环境条件（全天候、全年、多天气、多光照实拍），不是合成腐化；但它们是场景级环境协变量，不是对某一路传感器的受控干预。阅读依据：CVF 开放获取 PDF 正文全文通读；本文补充材料未随开放版 PDF 提供（初始提示模板细节、表 3 的条件合并规则、硬门控阈值 τ 的设定依据未能读到），涉及处以正文口径为准；正文未给出数据集/代码下载链接。

## 方法细节

PCDF 由三段串联（图 4）：条件提示学习（SCPL）→ 提示引导条件解耦（PCD）→ 条件感知动态融合（CDF）。双分支编码器先提取两模态原始特征。（1）SCPL（样本特异条件提示学习）：把 6 个条件属性（高度 AL / 角度 AN / 时间 TI / 天气 WE / 光照 IL / 场景 SC，各含若干类别）按固定模板拼成初始提示，其中每个属性块 = 条件前缀 + 该样本的属性取值。由于并非每个属性都与每个样本的模态可靠性相关（如夜间时场景属性常无关），SCPT 用一个硬门控网络从两模态池化特征与初始提示预测每个属性的可用概率，经阈值 τ=0.15 的指示函数得到二值掩码，只保留被选中的条件块，得到样本特异提示，再经冻结的 CLIP ViT-B/16 文本编码器得到条件嵌入。注意：SCPL 只在训练期使用，因为它需要真实条件标注。（2）PCD（提示引导条件解耦）：测试时没有条件标注，条件引导必须从视觉特征自身产生。三分支解耦网络：条件特异编码器在（融合后的）双模态特征上产生条件特异特征；两个条件不变编码器各自从单模态特征产生条件不变特征。解耦损失由三项组成（权重 λ=0.01/0.003/0.01）：以 CMD（中心矩差异）度量把条件特异特征蒸馏对齐到 CLIP 条件嵌入——这是“提示引导”的落点，测试时条件特异特征即充当条件引导；以 Frobenius 范数平方惩罚条件不变特征与条件特异特征的相关，迫使不变特征与条件信息分离；对每一路的条件不变特征直接施加分类/回归/objectness 检测损失，保证不变特征本身可检测。（3）CDF（条件感知动态融合）：多模态权重完全由条件引导决定，经非线性投影与通道维归一化的 soft-gating 得到逐通道标量权重（每通道一个 RGB/IR 二选 softmax 对），在空间上全图共享；权重恒在 (0,1) 开区间、永不精确为 0。权重只作用于条件不变特征，最终融合特征为两路加权特征拼接，送检测头。作者基线是一个双流单阶段检测器 + 直接拼接融合（消融表中 Baseline=58.4）。

## 实验设置

数据集 ATR-UMOD：13,353 对已对齐 RGB–IR 图像对，640×512；训练 11,850 对 / 测试 1,503 对，且两子集来自不重叠场景。RGB 标注 161,799 个目标、IR 标注 162,253 个目标（两模态分别以旋转框 OBB 独立标注），共 11 类：car、SUV、van、bus、freight car、truck、motorcycle、trailer、excavator、crane、tank truck（长尾分布，car 占主导）。原始双传感器数据存在跨模态失准，作者以单应变换 + 区域裁剪做空间标定、时间戳对齐做时间标定，未报告残余失准量。条件标注：每对图像标注 6 个属性——高度 80–300 m、俯仰角 0°–75°、时间（黎明至夜间、全年四季）、天气 7 类、光照 6 级（从 lightless 到 high-light：含 Overexposure/Normal/Dim/Twilight/Near Night/Night）、场景 11 类。这些条件全部来自实拍采集的多样性，非后期合成。对照：7 个单模态检测器（RetinaNet、S²A-Net、Faster R-CNN、ReDet、RoITransformer、Oriented R-CNN、YOLOv5s，各在 RGB 与 IR 上分别评）+ 8 个多模态检测器（IAF R-CNN、Halfway Fusion、UA-CMDet、C²Former、TINet、CALNet、OAFA、YOLOrs）；多模态方法一律用 IR 标注训练。指标为 mAP@IoU=0.5（OBB 头）。条件分档评测（表 3）：对 CALNet、OAFA、YOLOrs 与 PCDF 按六个属性逐档报告 mAP；因单档样本量不足，条件在表中做了合并（如高度并为 [0,120] 与 (120,300] 两档；合并细则在补充材料中，未读到）。表 3 只含多模态方法，没有单模态方法的逐条件数字。实现：PyTorch，单卡 RTX 4090；SGD，初始 lr 0.01 指数衰减，momentum 0.937，weight decay 0.0005；输入 640×512，batch 16；两个可训练过程各训 50 epoch；CLIP ViT-B/16 文本编码器冻结。缺失/损坏模态协议：没有（已定向核查）——全部实验假设两路完整、对齐的输入；无任一路丢弃/置零/加噪/腐化的评测，无传感器故障模拟。

## 关键数字

主结果（表 2，ATR-UMOD，mAP@0.5，%）：PCDF 63.3，超第二名 YOLOrs（60.0）3.3 点；其余多模态：OAFA 57.9、CALNet 53.8、TINet 50.4、C²Former 49.7、UA-CMDet 46.8、Halfway Fusion 44.9、IAF R-CNN 41.9。单模态最强为 YOLOv5s：IR 52.5、RGB 50.7。注意一个聚合层面的负融合现象：IAF R-CNN、Halfway、UA-CMDet、C²Former、TINet 五个已发表融合方法的总 mAP 低于最强的 IR 单模态检测器（52.5）——但这是跨架构比较（单模态行为 YOLOv5s），只能作数据集层面的旁证，不能当受控结论。PCDF 逐类：bus 84.7、tank truck 83.4、car 71.5、crane 70.5 最高；trailer 43.5、motorcycle 51.7、excavator 51.4 最弱。条件分档（表 3，PCDF 列）：PCDF 在几乎所有分档最优——高度 [0,120] 67.0 / (120,300] 50.3；角度 [0,30] 60.4 / (30,75] 57.2；时间 Morning 58.9 / Afternoon 66.3 / Night 41.7；天气 Cloudy 71.2 / Sunny 60.1 / Snowy 53.4 / Night 41.3；光照 Dim 67.7 / Normal 60.6 / Near Night 48.1 / Night 40.0；场景 Road 62.3 / Parking Lot 40.8 / Neighborhood 35.3 / Construction site 49.0 / Factory 23.0（与 OAFA 并列）。唯一例外：Foggy 档 PCDF 32.6，低于 YOLOrs 的 33.2（作者自陈，见局限）。条件间差距本身很大（如时间 Night 41.7 vs Afternoon 66.3、光照 Night 40.0 vs Dim 67.7），说明条件确实是该数据集上的主导难度因子；一个反直觉点是光照 Dim 档（67.7）高于 Normal 档（60.6）。

## 消融说明了什么

组件消融（表 4，mAP %）：拼接融合基线 58.4 → 完整 PCDF 63.3，总增益 +4.9。SCPL：去掉样本特异门控（w/o SCPT，只用初始提示）62.3（−1.0）；整段去掉 SCPL、以通道注意力的数据引导替代条件引导（w/o SCPL）60.5（−2.8）——条件语义引导是全方法最大的单一增益来源，且“数据引导”（60.5）仍高于基线（58.4），说明动态加权本身有效、条件先验再加一层。PCD：整段去掉 62.1（−1.2），即测试时条件引导不可得的代价；其三个损失分别去掉：w/o 蒸馏对齐 61.6（−1.7，最关键）、w/o 检测损失 62.0（−1.3）、w/o 分离损失 62.7（−0.6）。CDF：把软门控换成简单相加（w/o CDF (add)）62.0、换成拼接（w/o CDF (concat)）61.5——在已有解耦特征之上，条件门控值 +1.3~1.8。整体读数：增益大头在“用什么信号引导”（条件语义 > 数据统计），门控形式本身的贡献次之；所有消融都在干净全配对输入上进行，与退化鲁棒性无关。

## 局限

作者自陈：(1) Foggy 档不是最优（32.6 < YOLOrs 33.2），作者归因于雾浓度和能见度不一致，提出未来需更细的雾分级；(2) 条件过多导致单档样本量不足、易过拟合，表 3 被迫合并条件；(3) 数据长尾（car 主导）。据原文事实指出（非作者原话）：（1）条件 ≠ 模态损伤。ATR-UMOD 的条件是采集时自然发生的环境变化：天气、光照、时间同时改变场景内容与两路成像，传感器本身始终正常工作。它没有对任何一路做受控干预（无同场景“干净 vs 损坏”配对），没有热成像故障模型（条纹噪声、NUC 漂移、坏点、热饱和皆无），也没有合成腐化。因此它能支撑“真实环境条件多样性”的评测，支撑不了“模态受损时融合是否安全”的评测。（2）损坏与缺失模态：两者都没有评测。全文无模态丢弃、无单路腐化、无缺失输入实验；PCDF 的结构也假设两路特征恒在（权重 softmax 恒正）。（3）无“融合不劣于更强单模态”的保证，且表 3 无法检验：逐条件表只列多模态方法，无单模态逐条件行，“在某条件下融合是否不如丢掉一路”从其表格无法回答；总表里五个融合方法低于最强 IR 单模态行只是跨架构旁证。（4）门控粒度是全图通道级、先验驱动：权重对整幅图空间共享，无法做区域级抑制；且权重来自“条件语义→可靠性”的统计关联（训练时由条件标注蒸馏），本质是场景先验而非对当前输入实际质量的测量——若某一路在“正常”条件标签下发生传感器故障，条件引导不会察觉。权重 softmax 恒在 (0,1)，结构上不存在把一路完全关断的通路。（5）条件标注是训练前提：SCPL 需要逐对 6 属性标注，迁移到无条件标注的数据集时只能用 PCD 的解耦近似，引导质量受解耦保真度上限约束；本文未做跨数据集评测，PCDF 的数字只在本数据集成立。（6）证据完整性：表 3 的合并规则、提示模板、τ 依据都在未随开放版提供的补充材料里；数据集构建用了单应+裁剪对齐但未量化残余失准，而该文又是“弱对齐”敏感的任务设定。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 对比表：[[compare|REQ-04 四维对比表]]
