---
title: "Fusion-Mamba for Cross-modality Object Detection"
nickname: "Fusion-Mamba"
paper_id: "dong2025fusionmamba"
authors: "Dong, Zhu, Lin, Luo, Shen, Liu, Zhang, Guo, Zhang"
year: "2025"
venue: "IEEE TMM"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "State-Space Models (Mamba)"
fusion_level: "feature"
architecture: "Mamba"
tags: ["mamba"]
paper_link: "https://doi.org/10.1109/TMM.2025.3599020"
code_link: ""
doi: "10.1109/TMM.2025.3599020"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：State-space (Mamba) cross-modal fusion for IR-VIS detection.

## 点评

状态空间路线代表作；对比表中 M3FD mAP 61.9（数字来自二次对比表，引用时留意）。

## 框架图

![Fusion-Mamba 方法主框图（原文 Figure 2）：双流骨干最后三个 stage 各插入一个 Fusion-Mamba Block（FMB），FMB 由 SSCS 与 DSSF 两个模块组成](figs/fusion-mamba.webp)

*原文 Figure 2：Fusion-Mamba 总体结构。双流卷积骨干（与 YOLOv5-l / YOLOv8-l 相同的骨干、neck 与 head）在最后三个 stage 各插入一个 Fusion-Mamba Block（FMB）；两路经 FMB 增强的特征逐元素相加得到 P3、P4、P5，送 YOLOv8 的 neck / head 出检测结果。FMB 由 SSCS 与 DSSF 两个模块组成（默认 SSCS 1 个、DSSF 堆叠 8 个）：SSCS 先沿通道互换两路特征的一半通道再过 VSS block 做浅层融合，DSSF 再把两路特征投影到隐状态空间、用各自的门控做交叉门控状态转移完成深层融合。图源：Dong et al., arXiv:2404.09146 Figure 2。*

## 问题定义

作者的问题设定是跨模态特征融合中的模态差异（modality disparity）：RGB 与 IR 来自不同相机（焦距、位置、角度不同），两路特征的表征不一致，直接融合难以建模跨模态目标之间的相关性。图 1 用热力图论证：CNN 融合（YOLO-MS）与 Transformer 融合（ICAFusion、CFT）的融合特征定位都不好，而其 FMB 的热力图定位更准。由此提出的研究问题：能否构建一个隐状态空间（hidden state space），让跨模态特征在其中做关联与互补，并借 Mamba 的线性复杂度替代 Transformer 融合的二次复杂度。这是作者自称的首个把 Mamba 用于跨模态融合的工作。定性说明：这是一个干净数据上的表征一致性问题，不是模态质量问题——全文从未把任何一路模态变差（损坏、缺失、低质量）设为问题或变量；摘要中的 robust 在摘要中只是泛指检测性能的修辞。

## 方法细节

总体结构：双流卷积骨干（与 YOLOv5-l / YOLOv8-l 相同的骨干、neck 与 head），在最后三个 stage 各插入一个 Fusion-Mamba Block（FMB）；两路经 FMB 增强的特征逐元素相加得到 P3、P4、P5，送 YOLOv8 的 neck / head 出检测结果。FMB 由 SSCS 与 DSSF 两个模块组成（默认 SSCS 1 个、DSSF 堆叠 8 个）。SSCS（状态空间通道互换，浅层融合）：把两路特征沿通道四等分，RGB 新特征取 RGB 的第 1、3 份与 IR 的第 2、4 份拼接，IR 新特征反向取份——即每一路的特征图里先物理掺入对侧一半通道；互换后的两路特征各过一个 VSS block（VMamba 的视觉状态空间块，内含 SS2D 四向选择性扫描），得到浅层融合特征。DSSF（双状态空间融合，隐状态空间深层融合）：两路浅层特征各经一个无门控的 VSS block 投影到隐状态空间；两路特征另经线性投影 + SiLU 生成各自的门控参数；交叉门控状态转移让每一侧的隐状态由自身隐状态 + 对侧隐状态按本侧门控逐元素加权混合（注意：两项用的是同一侧的门控，并非用对侧门控交叉加权——原文公式如此）；再投影回原空间并残差得到互补特征，与原始局部特征相加得增强特征；堆叠多层 DSSF 时，后续层以上一层的互补特征为输入继续迭代。门控的性质：门控完全由检测损失端到端学出，没有任何模态质量、可靠性监督信号；两路特征始终都被使用，构造上不存在丢弃或整体压制某一路的路径，也没有单模态回退模式。损失就是 YOLO 的坐标、置信度、分类三项，没有为融合或门控设计的额外损失。复杂度论证：Transformer 全局注意力为二次复杂度，Mamba 为线性复杂度；同检测架构下，把 Transformer 融合模块换成 FMB 可省 7–19 ms 每对图像的推理时间（其实际参数量与时延见关键数字与局限）。

## 实验设置

数据集：LLVIP（15,488 对，官方划分 12,025 训 / 3,463 测，低光行人）、M3FD（4,200 对，6 类，无官方划分，采用所引文献的划分）、FLIR-Aligned（4,129 训 / 1,013 测，5 类：people / car / bike / dog / other cars）。指标：mAP50 与 mAP@[.5:.95]；另报参数量与单对图像推理时间（A800、640×640、5 次平均）。实现：单卡 A800；输入 640×640；batch size 4；SGD（动量 0.9、权重衰减 0.001）；150 epoch；初始学习率 0.01；FMB 只放在最后三个 stage。退化、鲁棒性协议：无。全文与补充材料中没有任何受控退化、噪声注入、模态损坏或模态缺失实验，也没有损坏与缺失的区分（两个概念均未出现）。补充材料所说的复杂场景鲁棒性只是对数据集天然挑战（低光、恶劣天气、遮挡、目标密集、小目标）的定性描述，配检测可视化图，无任何定量鲁棒性结果。全文依据：已通读 arXiv PDF v1 全文（§1–§5、表 1–表 7、图 1–图 5、算法 1）并读完文末补充材料（只有热力图与检测结果可视化，无额外定量实验）；唯一限定是 TMM 2025 期刊版未读，全部数字以 arXiv 版为准。作者名单说明：本卡片作者字段按 arXiv 全文首页所印的 9 人名单著录（Dong、Zhu 为共同一作，Lin 为通讯作者）；本文官方代码仓库的 BibTeX 只列 7 位，与 arXiv 相比少了 Liu 与一位 Zhang，两个版本何者为准未定，此处只记录 arXiv 全文版本。

## 关键数字

LLVIP（表 1）：YOLOv8 版 mAP50 97.0 / mAP 64.3；YOLOv5 版 96.8 / 62.8。对照：单模态最强 YOLOv8-l 仅 IR 为 95.2 / 62.1、仅 RGB 为 91.9 / 54.0；此前融合最好 RSDet 95.8 / 61.3。正文自述 YOLOv5 版仅比同骨干 IR 单模态高 +0.9 mAP。M3FD（表 2）：YOLOv8 版 mAP50 88.0 / mAP 61.9（六类中 People / Bus / Motorcycle / Truck 最好）；YOLOv5 版 85.0 / 57.5。对照：YOLOv7 骨干的 SuperFusion 83.5 / 56.0；同表 YOLOv8l 单模态 IR 79.5 / 53.1、RGB 80.9 / 52.5。摘要 +5.9 mAP 的口径即 61.9 vs SuperFusion 56.0。FLIR-Aligned（表 3）：YOLOv8 版 mAP50 84.9 / mAP 47.0，参数 287.6M、时延 78 ms；YOLOv5 版 84.3 / 44.4，244.6M、61 ms。对照：CFT 78.7 / 40.2（206.0M、68 ms）、CrossFormer 79.3 / 42.1（340.0M、80 ms）、RSDet 81.1 / 41.4；同表单模态 YOLOv8l-IR 72.9 / 38.3、RGB 66.3 / 28.2（均 76.7M、22 ms）。摘要 +4.9 mAP 的口径即 47.0 vs CrossFormer 42.1。任务范围著录：本文只做 RGB-IR 检测一件事，没有融合图像质量评测、没有分割或其他任务；此处的 Fusion 指特征级融合模块，不是图像融合方法。

## 消融说明了什么

全部消融在 FLIR-Aligned、YOLOv8 骨干上做（§4.3）。组件（表 4）：全量 84.9 / 47.0（mAP50 / mAP）；去 SSCS 降到 82.9 / 45.9；去 DSSF 降到 82.4 / 44.6（参数从 287.6M 降到 138.0M）；两者全去（两路特征直接相加）为 80.1 / 39.4。FMB 位置（表 5）：{P3, P4, P5} 最好（84.9 / 47.0）；{P2, P3, P5} 83.9 / 46.7；{P2, P4, P5} 骤降到 76.1 / 42.3——位置选择对结果影响很大。DSSF 个数（表 6）：2 个 82.3 / 45.5；4 个 82.6 / 45.9；8 个 84.9 / 47.0（最优）；16 个回落到 83.4 / 46.3，且参数暴涨至 437.2M、时延 148 ms，作者解释为堆叠过多时互补特征发生漂移。双路门控（表 7）：去掉 IR 隐状态的门控混合项降到 83.3 / 45.3；去掉 RGB 的对应项降到 83.8 / 46.2；两项全去（DSSF 退化为堆叠 VSS）为 82.9 / 44.8。门控支路与主干共享权重，几乎不增加参数与时延。

## 局限

作者自述：正文没有独立的 Limitations 一节；作者明确承认的只有一条——DSSF 堆叠过多（16 个）时互补特征漂移、性能下降（§4.3）。其余为笔记评注（非作者结论）：(1) 零鲁棒性评测：没有任何模态损坏、缺失、噪声协议；当某一路在推理时真的退化时，这套门控会如何表现，全文无证据；摘要与结论中的 robust 无实验对应物。(2) 门控无质量语义：门控是特征自身的线性投影，无监督、无校准，不对应任何可解释的模态质量或可靠性量；两路特征始终都被使用，构造上不存在丢弃一路或单模态回退的路径。(3) 复杂度卖点与实际体量有张力：Mamba 相对注意力的线性复杂度成立，但全模型在 FLIR-Aligned 上参数达 287.6M、时延 78 ms，明显重于同表单模态模型（76.7M、22 ms），省下的只是相对 Transformer 融合模块的时间。(4) 结构配置敏感：FMB 放置位置换错一组即骤降约 8.8 个 mAP 点，DSSF 堆叠数从 8 增到 16 即回落，增益对配置的依赖较强。(5) 依据限定：本笔记数字以 arXiv v1 为准，TMM 2025 期刊版未读，若期刊版有修订未覆盖。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
