---
title: "GM-DETR"
paper_id: "xiao2024gmdetr"
authors: "Xiao, Meng, Wu, Xu, He, Li"
year: "2024"
venue: "CVPR Workshops"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer; DETR"
tags: ["transformer", "detr", "efficiency"]
paper_link: "https://openaccess.thecvf.com/content/CVPR2024W/JRDB/papers/Xiao_GM-DETR_Generalized_Muiltispectral_DEtection_TRansformer_with_Efficient_Fusion_Encoder_for_CVPRW_2024_paper.pdf"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Lightweight DETR-style RGB-T detector.

## 点评

轻量 DETR 风格检测器，在 FLIR 与 LLVIP 上提供补充结果。

## 框架图

![GM-DETR 方法主框图（原文 Figure 2）：参数共享骨干、MSFI 模块与 CMSF 模块总览](figs/gm-detr.webp)

*原文 Figure 2：GM-DETR 架构。(a) 总览：红外与可见光分别进入参数共享的骨干（图中 Shared 双向箭头），各得三个尺度的特征；Efficient Fusion Encoder 内两路最高层特征各自过 MSFI 得 F5，CMSF 完成跨模态跨尺度融合；融合特征序列经 Query Selection 选出查询，送 Decoder & Head。(b) MSFI：最高层特征 Flatten 成 token 序列做多头自注意力，再 Reshape 回原尺寸。(c) CMSF：Fusion3/4/5 三个融合块，红实线为 Top-Down FPN、蓝虚线为 Bottom-up PAN，D 为 3×3 步长 2 下采样、U 为 1×1 卷积上采样，最终拼接（C）输出。读图关键：骨干共享是整个「泛化」叙事（单模态复制输入、孤立数据训练）能成立的结构前提；融合的实际运算在 (c) 的卷积通路里完成，注意力只出现在 (b) 的模态内顶层特征上。图源：Xiao et al., CVPR 2024 Workshop (JRDB) Figure 2。*

## 问题定义

面向可见光–红外多光谱目标检测。作者指出现有方法有两个被忽视的约束：(1) 训练几乎只使用像素对齐的 RGB+IR 配对数据，数量本就稀缺的标注里，孤立单模态数据（只有 IR 或只有 RGB 标注的数据集）完全用不上；(2) 模型输入形式被固定为「一路 RGB + 一路 IR」，实际部署中一路传感器失效造成 modality drop（整路模态丢失）时性能大幅劣化（文中引 ICAFusion 的观察为据）。因此作者把「泛化（Generalized）」定义在两个轴上：训练数据形态的泛化（对齐配对与孤立单模态数据都能用于训练）与推理输入形态的泛化（双模态输入与单模态输入都能检测）。必须先钉住口径：这里的「泛化」不是跨数据集/跨域泛化——实验只在 FLIR 与 LLVIP 各自的训练/测试划分内进行；且尽管本文是 JRDB workshop 论文，全文没有任何 JRDB 数据上的实验。另经全文核查：原文未给出代码链接；全文没有任何 MR（log-average miss rate）指标——KAIST 未评测，只有 COCO 式 AP。

## 方法细节

基座为 RT-DETR（基于 PaddleDetection 实现），骨干为 ImageNet 预训练的 HGNetv2，两路共用同一骨干（参数共享）——这是全方法的结构前提：共享骨干使「同一网络处理任意一路模态」成为可能。两路各提取三个尺度的特征，送入高效融合编码器（Efficient Fusion Encoder），再经 Query Selection 从编码器输出序列中选固定数目的特征作初始目标查询，送 6 层 Transformer 解码器与预测头。融合编码器由两个模块构成。(1) MSFI（模态特有特征交互）：只作用于最高层特征，每路独立做自注意力（Flatten 成 token 序列、多头自注意力后 Reshape 回原尺寸），实现为 1 层 Transformer。名实须注意：MSFI 阶段两模态之间不发生任何交互，它是模态内的全局自注意力（在分辨率最低、语义最强的最高层上做，计算量可控）；真正的跨模态交互全部发生在 CMSF。(2) CMSF（跨模态跨尺度融合）：PANet 式结构 = Top-Down FPN + Bottom-Up PAN。FPN 路径以 RGB 的最高层特征为自顶向下上采样的源，逐层并入两模态的同尺度特征；PAN 路径自底向上逐层并入 IR 特征聚合。融合块的做法是多路特征拼接后经两路 1×1 卷积、一路过 3 个 RepBlock 再逐元素相加——即跨模态融合靠的是卷积式金字塔通路，不是跨模态注意力。结构上有一个原文未讨论的不对称：FPN 锚在 RGB 高层语义、PAN 逐层掺 IR，两条通路的模态分工不同。(3) 两阶段训练：Isolation 阶段把孤立 IR 数据与 RGB 数据合并成一个数据集，模型输入是同一单模态图像的双份复制，用各自模态的标签监督，先练 10 epoch；Fusion 阶段换成时空对齐的配对数据与共享标签，练 50 epoch；两阶段使用同一个检测损失（框损失 + 分类损失）。需要指出：实验里 Isolation 阶段用的「孤立数据」是从同一批对齐数据中拆分自造的，并未引入任何外部新数据——「可引入外部孤立数据集」是结论里列的未来工作，不是已验证的收益。

## 实验设置

数据集：FLIR（对齐版：原始 FLIR 多未对齐且只有 IR 标注；对齐版共 5,142 对，训练 4,129 / 测试 1,013，3 类 person/car/bicycle）与 LLVIP（15,488 对，训练 12,025 / 测试 3,463，仅行人类，严格对齐）。Isolation 阶段的数据即从这两个对齐数据集拆分合并而来。实现：RTX 4090 单卡，输入 640×640，batch size 4，共 60 epoch（Isolation 10 + Fusion 50）；增强与超参大体沿 RT-DETR。指标为 mAP50 / mAP75 / mAP（COCO 式），无 MR。模态丢失的模拟方式（表 3 的输入消融）：缺失一路时，把存活模态复制两份喂双流输入（记 IR+IR / RGB+RGB），既不是置零、也不是掩码或单流推理。单模态基线（表 3 上半）为单独在该模态上训练的 YOLOv5 与 RT-DETR。对照：单模态 YOLOv5 / RT-DETR（RGB、IR）；融合方法 CFT、CSAA、ICAFusion、LRAF-Net、MS-DETR（其中 LLVIP 侧 ICAFusion 数字缺失，原文表格留空）。

## 关键数字

FLIR 主结果（表 2）：仅融合阶段 mAP50 83.6 / mAP75 42.0 / mAP 45.3；两阶段 83.9 / 42.6 / 45.8。相对此前 SOTA（LRAF-Net mAP 42.8）融合单阶段 +2.5 mAP，两阶段再 +0.5。必须同时看基座：单模态 RT-DETR-IR 基线已有 mAP 43.6，高于此前全部融合方法——本文增益有相当部分是 RT-DETR 基座红利，作者自己也点明了这一点。LLVIP 主结果（表 2）：两阶段 AP50 97.4 / AP75 81.4 / AP 70.2。相对单模态 RT-DETR-IR（AP 67.9）+2.3，相对 SOTA 融合方法（MS-DETR 66.1、LRAF-Net 66.3）约 +3.9 AP；但 AP50 97.4 略低于 LRAF-Net 与 MS-DETR 的 97.9——优势集中在高 IoU 段（定位精度），作者对此口径是诚实的。合并训练的经验前提（表 1，FLIR，mAP）：把 IR+RGB 数据直接合并训练，单模态测试反而变好——YOLOv5：RGB 测试 28.1→31.5、IR 测试 39.5→41.4；RT-DETR：33.5→34.4、43.6→44.5。「混训不造成模态混淆」是两阶段策略成立的经验依据。模态丢失（表 3，FLIR mAP50）：两阶段版本融合输入 83.9；IR+IR 80.6（与 IR 单模态基线 80.5 基本持平，即丢 RGB 几乎无损）；RGB+RGB 64.3（仍比 RGB 单模态基线 69.7 低 5.4 点）。只训 Fusion 阶段的版本为 78.7 / 57.6——两阶段主要救的是 RGB 丢失情形（57.6→64.3，+6.7）。对照 ICAFusion：79.2 → 66.0 / 57.8，劣化显著更重。注：表 3 括号内的差值经核对是相对单模态基线之差而非相对融合值之差，原文未明言，引用时须小心；按融合值计，两阶段版本的 RGB 丢失代价是 83.9→64.3。效率（表 5，RTX 4090 + TensorRT fp16）：GM-DETR 70M 参数 / 176 GFLOPs / 218 FPS，单模态 RT-DETR 为 66M / 117G / 336 FPS。「Efficient」是相对双流融合的定位：对基座本身是约 +59 GFLOPs（约 +50%）、FPS 降约 35%，且原文未给出与其他融合方法的效率对照。

## 消融说明了什么

模块消融（表 4，FLIR mAP50，列为 RGB+IR / IR+IR / RGB+RGB 三种输入；基线为用逐层相加代替 CMSF 的自建版本）：基线 82.4 / 77.9 / 58.6；只加 MSFI：81.8 / 78.3 / 56.0——融合输入反而 −0.6，作者归因于「只对骨干特征做加权融合已足够直观有效」，即 MSFI 单独使用无益，它只在与 CMSF 合用（为 CMSF 提供全局信息引导）时才有位置；只加 CMSF：82.5 / 79.1 / 56.6——融合侧小涨，但 RGB+RGB 输入变差；MSFI+CMSF：83.6 / 78.7 / 57.6——融合输入 +1.2，但 RGB+RGB（57.6）低于基线（58.6），作者自承此时模型对双模态输入类型出现「过拟合」；再加两阶段：83.9 / 80.6 / 64.3——两阶段对融合输入只有 +0.3，对缺失输入的增益才是主体（IR+IR +1.9、RGB+RGB +6.7）。合起来读：本文真正的贡献排序是「训练策略（解决缺失输入）> CMSF（解决多尺度跨模态融合）> MSFI（单独无用，合用时锦上添花）」；融合精度的大头其实来自 RT-DETR 基座与 CMSF，两阶段的价值几乎全部体现在 modality drop 场景。全部消融为单次运行口径，无随机种子、无方差、无逐类拆分。

## 局限

作者自陈很少（结论仅展望引入更多孤立数据集与半监督学习），以下据原文事实指出。损坏模态零评测（定向核查）：全文没有任何对一路模态施加噪声、模糊、曝光异常、低光合成等部分退化的实验；引言中的 robust 只是修辞。模态层面的评测只有整路丢失一种形态，且丢失的实现是「复制存活模态」，不是置零、掩码或真实传感器失效——它测的是「模型见没见过这种输入形态」，不是「模型对损坏输入的承受力」。缺失评测的不对称值得注意：IR 丢失几乎无损（80.6 ≈ IR 基线 80.5），但 RGB 丢失时 64.3 仍低于一个纯 RGB 检测器（69.7）——在只有 RGB 可用的场景里，用 GM-DETR 反而不如直接部署单模态模型；作者只报「比融合单阶段版本少掉多少」，没有与「丢弃融合」作正面对照，更没有任何「融合不劣于更强单模态」的保证或结论。「Generalized」的实际覆盖面窄：(a) 训练可用孤立数据——但实验中的孤立数据是对齐数据拆分自造的，引入真正外部孤立数据的收益未验证；(b) 推理可吃复制输入。无跨数据集迁移实验、无未对齐输入评测（FLIR 用的仍是对齐版）、无 JRDB 实验（尽管发表于 JRDB workshop）。MSFI 名实与机制定位：跨模态交互不在 MSFI 发生（纯模态内自注意力，且只在最高层一层）；融合实质是 CMSF 的拼接 + 卷积金字塔；归类时应记为「编码器内特征级融合（卷积式）+ 顶层模态内自注意力」，而不是跨模态注意力融合。表格口径的审计性：表 3 括号差值的基准原文未说明（需反推为相对单模态基线）；表 4 的「基线」是逐层相加的自建版本，与表 2 的 RT-DETR 行不是同一个东西，跨表相减会得出错误结论；表 2 中 ICAFusion 的 LLVIP 数字缺失未作说明。实验规模：仅 FLIR、LLVIP 两个数据集；两阶段在融合指标上的净增益只有 +0.5 mAP（FLIR）/+0.6 AP（LLVIP）量级；单卡单次运行，无种子与显著性。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
