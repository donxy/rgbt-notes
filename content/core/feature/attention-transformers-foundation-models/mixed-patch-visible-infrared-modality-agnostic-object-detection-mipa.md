---
title: "Mixed Patch Visible-Infrared Modality Agnostic Object Detection (MiPa)"
paper_id: "medeiros2025mixed"
authors: "Medeiros et al."
year: "2025"
venue: "WACV"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer; DETR"
tags: ["missing-modality", "modality-imbalance", "transformer"]
paper_link: "https://openaccess.thecvf.com/content/WACV2025/html/Medeiros_Mixed_Patch_Visible-Infrared_Modality_Agnostic_Object_Detection_WACV_2025_paper.html"
code_link: "https://github.com/heitorrapela/MiPa"
doi: "10.1109/WACV61041.2025.00874"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Trains a single shared transformer encoder on patch-mixed RGB/IR inputs so the detector needs only one modality at inference.

## 点评

A genuine missing-modality-at-inference detection method; same lab as WiSE-OD.

## 框架图

![MiPa 方法主框图（原文 Figure 2）：RGB/IR 图像经 Patchify 切块后由 MiPa 模块按比例互补采样拼成马赛克图，送入共享编码器与检测头；下方为逐块模态无关（MA）模块与梯度反转支路](figs/mixed-patch-visible-infrared-modality-agnostic-object-detection-mipa.webp)

*原文 Figure 2：MiPa 总览。左端一对 RGB/IR 图像经 Patchify（黄色）切块，MiPa 模块（紫色）按比例互补采样、拼成一幅马赛克图，送入共享编码器 f_θ 与检测头（粉色），由检测损失监督；下方支路是逐块模态无关（MA）模块——编码器 stage-1 特征经模态分类器（绿色）预测模态图，与混合时生成的真值模态图计算损失，梯度经 Gradient Reversal 反向回传骨干。整图只有训练期存在，推理时只剩 f_θ + head 一条通路。图源：Medeiros et al. 2025, WACV 2025 Figure 2。*

## 问题定义

本文设定的不是融合，而是一个部署契约不同的问题：模态无关（modality agnostic）检测——训练时可用配对 RGB/IR，但推理时只允许输入其中任意一路，且事先不知道部署端接的是哪种传感器；两路共用同一个视觉编码器，无融合模块、无模态专用参数。动机是单编码器内存占用低、一个模型服务混合传感器部署（如全天候运行的监控服务器轮流处理 RGB 与 IR 传感器流）。核心障碍是模态失衡（modality imbalance）：在共享编码器上混合训练两路时，易学 / 强势的一路（本文中为 IR）会主导学习过程，使单编码器在两路上的表现严重不均。朴素解法——把两路图像混在一个数据集里训练（文中称 Both）——被作者实证为失衡的来源。本文要回答的是：怎样只靠训练技巧，让一个普通 Transformer 检测器在任一单路输入下都接近“在该路上专门训练”的水平，全程不增加任何推理开销。

## 方法细节

两个部件，都是纯训练期机制，推理架构与原始检测器完全一致。(1) MiPa（Mixed Patches）混合块训练：把一对已对齐的 RGB/IR 图像各自切块（patchify），按采样比 ρ 互补采样——每个块位置取自其中一路：一路贡献约 n·ρ 块、另一路贡献其余块，拼成一幅马赛克图喂给共享编码器。每个训练样本在单幅图内同时含两路信息，迫使编码器学共同表示、不能长出模态专用通路。ρ 的取法系统比较了三种：Fixed（固定 0 / 0.25 / 0.50 / 0.75 / 1.0）、Curriculum（前期偏向难学的一路——只给 0–25% 的 IR 块、即多看 RGB，后期转 Variable）、Variable（每个 batch 从 U(0,1) 重抽 ρ）——Variable 最优（见关键数字）。混合仅发生在训练期：测试输入是纯单模态原图，不做任何拼贴，零推理开销。主文未注明拼贴所用块的像素粒度（跟随骨干的 patchify，未给数值）。作者另给一段信息论解释：把两传感器看作场景的带噪观测，马赛克近似保留两路互信息，即声称混合输入保留了两路信息之并、且冗余与噪声在训练中被滤除——这是建立在“两传感器噪声相似”假设上的近似论证，不是性能界。(2) Patch-wise Modality Agnostic（MA）模块：梯度反转层（GRL）的逐块改造。混合时同步生成模态图（modality map），记录每个块来自哪一路；一个模态分类器接在骨干 stage-1 特征上预测模态图，以 BCE 损失与真值比较，梯度经反转层以权重 λ 回传骨干，使特征对模态不可区分；λ 随训练进程按调度爬升。总损失 = 检测损失 + λ × 模态无关损失。

## 实验设置

数据集：LLVIP（训练 12,025 / 测试 3,463 对，1280×1024 缩至 640×512，仅行人类）与 FLIR Aligned（Zhang et al. 的清洗对齐版，训练 4,129 / 测试 1,013 对，640×512，自行车 / 狗 / 汽车 / 行人四类；作者明知“狗”类被先前工作认为不适合训练，仍故意保留）。无第三个数据集，无 M3FD。检测器与训练：DINO 与 Deformable DETR，均用 Swin 骨干（ImageNet 预训练）；PyTorch、单张 A100、AdamW、lr 1e-4、batch size 6、DINO 训 12 epoch；IR 单通道复制为 3 通道输入。主表报 ± 标准差（重复次数主文未注明）。评测协议（本文的轴心）：推理时一次只给一路——分别测 RGB-only 与 IR-only 的 AP50，并以两者均值（Average）为标题指标，表征“平衡程度”。模型不存在双路同时输入的推理模式。基线三组：单模态专门训练（只训 RGB / 只训 IR）、朴素混合 Both（按 25% / 50% / 75% 的整图级数据集配比混合两路图像训练）。与融合方法的对照（表 5）中竞品在训练与推理都用双路，MiPa 只用 IR 一路推理。退化协议：无。全文没有任何受控退化评测——不对任一路施加噪声、模糊、天气、对比度等损坏，不测错位，不测部分退化；唯一的“不利条件”变化是 LLVIP 天然的日 / 夜场景（图 3 定性展示）。被评的只有“输入是完整的一路还是完整的另一路”这一模态身份轴。

## 关键数字

均为 AP50（RGB / IR / 均值）。ρ 采样方式之争（表 2，LLVIP，DINO-Swin）：Fixed ρ=0.25 / 0.50 / 0.75 的均值分别为 88.55 / 85.30 / 87.45；Curriculum（4 / 8 epoch 版）87.20 / 88.95；Variable（逐 batch 重抽 ρ∼U(0,1)）93.00（88.5 / 97.5），是唯一把 RGB 侧拉过 88 的方案——固定配比无论偏哪边都牺牲另一边。主表（表 3，LLVIP，DINO）：只训 RGB 的专门模型 90.87 / 94.23 / 92.55；只训 IR 的 66.87 / 96.87 / 81.87；Both 三种配比均值仅 88.57 / 89.45 / 89.15；MiPa 88.70 / 96.97 / 92.83；MiPa+MA 89.10 / 96.83 / 92.90。读法：MiPa+MA 的均值（92.90）追平甚至微超 RGB 专门模型的均值（92.55），IR 侧 96.83 ≈ IR 专门模型的 96.87；但 RGB 侧 89.10 仍低于 RGB 专门模型的 90.87（−1.77）——“与专门训练相当”是均值意义上的，逐路看 RGB 侧仍有小缺口。FLIR（表 3，DINO）：RGB 专门 61.33、IR 专门 63.43、Both 最好 64.72（ρ=0.5）；MiPa 66.52；MiPa+MA 67.62（64.80 / 70.43）——在 FLIR 上 MiPa 均值超过两个单模态专门模型。Deformable DETR（表 3）：朴素 Both 在此基座上崩坏（LLVIP 均值 67.47–68.72，FLIR 仅 38.52–39.37 且 IR 侧标准差高达 ±13.5–16.6，训练极不稳定）；MiPa / MiPa+MA 为 LLVIP 86.90 / 87.19、FLIR 51.48 / 52.03。MiPa 相对 Both 的优势在弱基座上远大于在 DINO 上。与融合方法对照（表 5，MiPa 为 IR-only 推理，竞品为双路推理）：FLIR AP50 81.3（AP75 41.8 / AP 44.8），高于 RSDet 81.1、CSSA 79.2、CrossFormer 79.3、ProbEn 75.5、GAFF 74.6、Halfway Fusion 71.5；LLVIP AP50 98.2（AP75 78.1 / AP 66.5），高于 CFT 97.5、CrossFormer 97.4、RSDet 95.8。注意此表与表 3 不是同一评测口径（该结果用了 25% RGB / 75% IR 的采样配方），且正文把 LLVIP 数字写成 98.8、与表 5 的 98.2 不一致，原文未解释。

## 消融说明了什么

ρ 方案（表 2）：结论有两层——其一，逐 batch 随机 ρ（Variable）远好于任何固定配比，随机化本身就是关键成分；其二，“少喂弱势（难学）模态反而强化强势模态”这一反直觉观察支撑了表 5 的 25/75 配方。Fixed ρ=0.50（对称配比）反而是固定方案中最差（85.30）。MA 模块（表 3 vs 表 4）：增益小而一致——LLVIP DINO 均值 92.83 → 92.90（+0.07，接近噪声量级）、FLIR DINO 66.52 → 67.62（+1.10）、Deformable DETR 两集 +0.29 / +0.55。真正的主力是块混合本身，GRL 式不可区分化只是边际修正。γ 敏感性（表 4）：γ ∈ {0.05, 0.10, 0.15} 时 LLVIP 均值 92.88 / 93.00 / 92.97、FLIR 67.62 / 66.83 / 67.10，波动 ≤ 约 0.8，最优 γ 随数据集 / 检测器而变（作者自承与所需 epoch 数有关）。

## 局限

评测面窄：只有 LLVIP + FLIR Aligned 两集、AP50 为主；没有任何损坏 / 退化模态评测（见实验设置），也没有缺失率变化曲线——其设定是全有或全无、由部署决定，不模拟“一路在使用中坏掉”；它根本不是“融合模型缺了一路”，而是单编码器、单模态部署协议，缺失由部署决定、不是故障。无保证：作者目标表述是经验性的“almost as good as 专门训练”，属经验主张；信息论部分只是关于训练输入信息含量的近似论证（且假设两传感器噪声相似、未做经验验证），不构成单模态性能的任何下界。逐路数字也显示 RGB 侧仍逊于专门模型（−1.77）。前提依赖对齐配对：块拼贴语义要求训练对严格像素对齐；未对齐配对下马赛克图会把两个场景错位拼合，原文未讨论。方法构造上只适用于 patch 化的 Transformer 检测器（CNN 检测器不在范围内）。MA 模块的性价比：在最强配置（LLVIP + DINO）上增益 +0.07 均值点，却引入分类器、模态图与 γ 调参；γ 需逐数据集挑。文内小不一致：正文 LLVIP AP50 作 98.8、表 5 作 98.2；表 5 与表 3 口径不同（采样配方不同）但正文未并置说明，引用表 5 数字时须连同“IR-only 推理 + 25/75 采样”口径一起说。原文未设局限章节；训练预算较小（12 epoch、batch 6），± 标准差的重复次数未注明。依据降级：补充材料未读——正文称 AP75/AP 的完整报告在补充材料中（表 5 已含竞品对照的 AP75/AP），逐类细分等补充细节未核。

## 相关页面

- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
