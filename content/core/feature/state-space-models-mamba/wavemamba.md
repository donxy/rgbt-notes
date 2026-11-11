---
title: "WaveMamba: Wavelet-Driven Mamba Fusion for RGB-Infrared Object Detection"
paper_id: "zhu2025wavemamba"
authors: "Zhu, Dong, Yang, Li, Yang, Ren, Zhu, Feng, Li, Lin, Wang, Luo, Zhang"
year: "2025"
venue: "ICCV"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "State-Space Models (Mamba)"
fusion_level: "feature"
architecture: "Mamba"
mechanisms: "Frequency-Domain"
tags: ["mamba", "frequency-domain"]
paper_link: "https://arxiv.org/abs/2507.18173"
code_link: "https://github.com/EhanDong/WaveMamba"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Wavelet frequency-decomposed Mamba fusion with YOLOv8 head.

## 点评

小波频域分解 + Mamba 融合，配 YOLOv8 检测头，覆盖 M3FD / LLVIP / FLIR-Aligned。

## 框架图

![WaveMamba 方法主框图（原文 Figure 2）：双流骨干经 DWT 分频、三处 WMFB 融合与改进 YOLOv8 检测头总览，及 WMFB、SFM、DFM、VSS 子模块](figs/wavemamba.webp)

*原文 Figure 2：(a) 总览——RGB 与 IR 双流骨干逐层特征先经 DWT 分出低频与高频，三处 WMFB（橙色带）跨模态融合后，融合的低频（两模态相加）与高频子带送入右上改进 YOLOv8 头，经 IDWT + C2f + Concat 逐级重构至 Detect 输出；(b) WMFB 结构——低频入 LMFB（SFM → DFM 串联）、高频入 HFE 策略；(c) SFM——通道交换后各过一个 VSS 块；(d) DFM——主/辅双流与门控注意力的细节；(e) VSS 块——LN → Linear → DW-Conv → SS2D → LN 并带 SiLU 门控支路。图源：Zhu et al., arXiv:2507.18173，Figure 2。*

## 问题定义

出发点是一个频率域统计观察（图 1(a)）：对 M3FD 验证集图像做离散小波变换（DWT）后，红外图像在低频子带（LL）的归一化信息熵更高，RGB 在高频子带（LH/HL/HH）更高——即红外主要承载低频结构信息、RGB 主要承载高频细节。作者指出现有融合（无论 CNN、Transformer 还是 Mamba 路线）都在空间域对两模态一视同仁地混合，没有利用这种模态与频率的固有分工；已有小波类工作要么对高低频用同一套处理、要么干脆不处理高频。目标是在干净数据上以线性复杂度的状态空间模型实现按频率分工的融合，提升 RGB–红外检测精度与效率。问题设定里没有鲁棒性、退化或模态失效的成分——引言提到的低光与恶劣天气只是数据集属性，不是受控压力测试。阅读依据：arXiv:2507.18173 v1 全文通读（含正文与 PDF 内附补充材料）；arXiv 迄今只有 v1，ICCV 2025 正式版未核对，若正式版有修订数字以正式版为准。

## 方法细节

总流程是频率分解在前、状态空间混合在后：双流骨干取前两层特征，每流先做 Haar DWT，得到低频与高频（分辨率减半），随后由 WMFB 按子带分别跨模态融合；再对融合后特征在第 3、5 层重复 DWT + WMFB（多级小波），共三个 WMFB，按补充材料消融置于 P2、P3、P5。最后把各层融合后的低频（两模态聚合）与高频子带送入改进 YOLOv8 检测头，用逆小波变换（IDWT）代替常规上采样重构特征后出检测结果。关键结构事实：Mamba 只见低频带——高频带完全不进状态空间模型，走一条无参数的硬选择通路。WMFB 由两部分组成：LMFB（低频 Mamba 融合块）分浅、深两步——SFM 先对两模态低频特征做通道交换（通道切分后交叉拼接），再每流各过一个 VSS 块（SS2D 四向选择性扫描）；DFM 让两流交替担任主、辅模态，主流分两路处理，门控注意力用主流第二路输出调制主流第一路与辅流的输出，相加得该流结果。门控是内容驱动的特征筛选（压冗余、扬互补），没有任何模态质量或可靠性语义；LMFB 输出仍保持两条分开的模态流，真正的合并推迟到检测头。HFE（高频增强策略）对 LH/HL/HH 三个子带逐个做逐元素绝对值最大选择：比较两模态高频特征的绝对值，谁大取谁（二值掩码互补），依据是高频子带绝对值越大信息越显著；无参数、无学习、赢家通吃。改进 YOLOv8 头先聚合两模态融合低频，再以 IDWT（与融合高频一起）上采样，余下与原 YOLOv8 头一致；消融显示该头单独贡献 +1.1 mAP50 / +1.1 mAP 且参数减少 7.6M——头条数字里有可观的一份来自检测头改造而非融合本身。实现：骨干有 ResNet50 / YOLOv5 / YOLOv8 三套变体（主表用 YOLOv8l 量级）；损失与训练管线与标准 YOLOv8 相同；SGD（学习率 0.01、动量 0.937、权重衰减 0.0005），250 epoch，batch 16，输入 640×640，单张 A800。

## 实验设置

数据共六个：正文四个——M3FD（无官方划分，沿用所引文献的 3,360 训 / 840 测）、DroneVehicle（官方划分，报测试集）、LLVIP（12,025 / 3,463）、FLIR-Aligned（4,129 / 1,013）；补充材料另加 VEDAI（1,089 / 121）与 KAIST（8,963 / 2,252，用改进标注）。指标以 mAP50 与 mAP 为主；FLIR-Aligned 另报 Precision / Recall / F1、参数量与推理时延（A800、640×640、15 次平均）。注意 KAIST 在补充材料里报的是 mAP50 / mAP 而非该数据集惯例的漏检率（MR），与行人检测文献的 MR 数字不可比。对照按骨干分组与同组 SOTA 比较（M3FD 表含 DAMSDet、TarDAL、CDDFuse 等，并含 YOLOv8l 的 RGB-only / IR-only 单模态行）。鲁棒性协议：无。全文经定向核查，没有任何退化、损坏或缺失模态评测。

## 关键数字

以下均为 YOLOv8 变体（原文主推配置），mAP50 / mAP：M3FD 92.1 / 64.4（YOLOv5 版 91.5 / 63.8，ResNet50 版 90.9 / 62.3）；同表单模态 YOLOv8l 为 IR-only 79.5 / 53.1、RGB-only 80.9 / 52.5；分类别对第四名领先幅度为 car +1.1、lamp +6.0、people +8.5。DroneVehicle 79.8 / 60.5（ResNet50 版 79.3 / 59.9）。LLVIP 98.3 / 66.0；IR-only 95.2 / 62.1、RGB-only 91.9 / 54.0。FLIR-Aligned 88.4 / 48.1，Precision 84.2 / Recall 80.9 / F1 82.5，69.1M 参数、40.0 ms；IR-only 72.9 / 38.3、RGB-only 66.3 / 28.2；效率对照：其 YOLOv5 版 45.6M / 44.1 ms，CrossFormer 为 340M / 80.0 ms。VEDAI（补充材料）88.4 / 59.8。KAIST（补充材料）75.8 / 34.8（mAP 口径，非 MR）。摘要的总括主张是四个基准上平均 mAP 超过第二名 4.5%，各表第二名随骨干组而异，引用时宜落到具体表。

## 消融说明了什么

全部在 M3FD、YOLOv8 骨干上做。融合策略（表 7，为公平用原 YOLOv8 头）：无 DWT 的平均融合基线 83.2 / 55.1 → 加 DWT 后（双路平均）86.6 / 58.2 → 低频换 LMFB 90.6 / 62.6，或高频换 HFE 90.4 / 62.3 → 全套（HFE + LMFB）91.0 / 63.3；两条子带通路各自约值 +4 个点，且大致可加。模块去除（表 6）：去 SFM −1.5 / −2.1，去 DFM −1.9 / −2.2——深融合略重于浅融合。改进头（表 5）：IDWT 头 92.1 / 64.4（69.1M）对比原头 91.0 / 63.3（76.7M）。WMFB 位置与数量（补充材料）：置于 P2、P3、P5 最佳；含 P1 的组合最差（91.1 / 62.8，作者归因于第一层特征不适合融合）；WMFB 数量 3 → 2 → 1 时 mAP50 为 92.1 → 91.6 → 91.3。小波基（补充材料）：Haar 最好，但与 MEYR / SYM3 / COIF3 / DB3 的差距小于 0.4 mAP50——方法对小波基不敏感，增益来自按频率分开处理的框架本身而非特定基。

## 局限

鲁棒性零评测（全文核查）：无合成腐化、无噪声注入、无缺失模态、无未对齐实验；M3FD 自带的恶劣天气是自然采集的干净标注数据，不构成退化协议。HFE 的结构性脆弱点（机制层推断，非原文主张）：逐元素绝对值最大等于对高频幅值大的那一路赢家通吃，而常见损坏（如热条纹噪声、传感器噪声、锐化伪影）恰恰会抬高高频幅值——在退化条件下，该策略在结构上倾向于把受损模态的噪声当作细节选进融合结果；作者未做任何实验检验这一点。无质量感知：LMFB 的门控只按内容压冗余，通道交换更是无条件硬混合——一路模态整体变质时，没有任何机制能降低它的权重，两条流恒被完整消费。规模与协议口径：头条数字建立在 YOLOv8l 量级（69.1M）上，无 nano / small 变体，与轻量检测器不在同一部署区间；M3FD 用所引文献的划分，与用其他划分的工作同表比较时须注口径；KAIST 用 mAP 而非 MR，与行人文献不可直接比。增益构成需拆分引用：92.1 这个数字捆绑了骨干（YOLOv8l）、IDWT 头（单独 +1.1）与 WMFB 三者；表 7 的策略消融从弱基线（无 DWT 直接平均，83.2）起算，引用增益幅度时须注明参照系。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
