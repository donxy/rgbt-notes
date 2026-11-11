---
title: "TarDAL: Target-aware Dual Adversarial Learning and a Multi-scenario Multi-Modality Benchmark to Fuse Infrared and Visible for Object Detection"
paper_id: "liu2022tardal"
authors: "Liu, Fan, Huang, Wu, Liu, Zhong, Luo"
year: "2022"
venue: "CVPR"
list: "core"
scope: "Related"
section: "Pixel-Level Fusion for Detection"
subsection: ""
fusion_level: "pixel"
architecture: "CNN"
tags: ["image-fusion", "task-coupled"]
paper_link: "https://arxiv.org/abs/2203.16220"
code_link: "https://github.com/JinyuanLiu-CV/TarDAL"
doi: "10.1109/CVPR52688.2022.00571"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Target-aware dual adversarial learning that fuses infrared and visible images for detection; introduced the M3FD benchmark.

## 点评

经典任务耦合融合工作，同时发布多场景多模态基准 M3FD。

## 框架图

![TarDAL 方法主框图（原文 Figure 2）：问题形式化、双对抗融合网络与协同训练三联图](figs/tardal-target-aware-dual-adversarial-learning-and-a-multi-scenario-multi-modality-benchmark-to-fuse-infrared-and-visible-for-object-detection.webp)

*原文 Figure 2：TarDAL 方法框架三联图。(a) 问题形式化：融合 Φ 在 target-aware 约束下产生融合图 u* 喂给检测 Ψ，目标是找到同时利于融合与检测的最优点；(b) 双对抗融合网络：生成器居中，红外 x 与可见光 y 输入，上方目标判别器比对红外前景目标与融合图前景的真假，下方细节判别器比对可见光梯度与融合图梯度；(c) 协同训练：检测损失对融合参数的梯度由经检测网络回传与 λ 加权的融合损失梯度两条路径组成，ω_d 与 ω_f 联合更新。图源：Liu et al. 2022, arXiv:2203.16220 Figure 2。*

## 问题定义

既有红外–可见光融合（IVIF）方法以生成视觉质量高的融合图为目标，只在两模态的公共空间里求同，忽略了模态差异所携带的互补信息——红外突出热目标的结构、可见光提供背景纹理细节——而这些差异恰恰对下游检测最关键。同时，既有数据集场景单一（多为道路、监控，昼夜有限），不足以学互补信息，更不足以支撑融合后检测的评测。本文因此做两件事：把融合与检测写成一个双层优化问题，提出面向检测的融合网络 TarDAL；自建同步成像系统采集多场景多模态基准 M3FD。注意其问题设定始终是干净、对齐的双模态输入：全文没有任何模态退化、损坏或缺失的设定。

## 方法细节

双层优化形式化：上层最小化检测损失，下层要求融合图同时满足对红外与可见光的保真约束；再把下层换成可学习融合网络、检测网络采用 YOLOv5，展开为可训练的单层问题。融合网络为一个生成器加双判别器：生成器（5 层 dense block 提公共特征 + 3 层卷积 merge block）须同时骗过两者——目标判别器在强度域判别融合图中的前景热目标与红外原图是否一致，细节判别器在梯度域（Sobel）判别融合图背景纹理与可见光原图是否一致；两判别器靠预训练显著性网络（R3Net）从红外图算出的目标掩码分工，掩码内走目标判别器、掩码外走细节判别器。对抗损失为 Wasserstein 距离 + 梯度惩罚，生成器另有 SSIM 损失与带显著性权重（按像素与全图直方图的偏离定权）的 L1 像素损失。协同训练把双层问题改写为检测损失 + λ·融合损失的联合优化，检测损失的梯度可回传进融合网络，使融合图直接受检测任务塑造——这是 target-aware 的落点。判别器只在训练时存在，推理是生成器生成融合图、检测器再检测的串行管线。

## 实验设置

融合质量在 TNO、RoadScene、M3FD 上评测（共 400 对测试：TNO 20、RoadScene 40、M3FD 340；指标 MI / EN / SD）；检测在 Multispectral（MS）与 M3FD 上评测，所有融合方法一律重训同一个 YOLOv5 检测器以求公平。训练从图像随机裁出 320×320 patch，Adam，学习率 1e-3 指数衰减，300 epoch，batch 64。M3FD 基准（§4 与表 1）：自研同步双目系统（可见光 1024×768；红外 640×512、8–14 μm；单应矩阵对齐后统一 1024×768），4,200 对齐对、33,603 个标注；四类场景 Daytime / Overcast / Night / Challenge、十个子场景（含道路、校园、街道、恶劣天气、伪装、烟雾、森林等），夜间 1,671 对；六类：People、Car、Bus、Motorcycle、Truck、Lamp。对比方法为 DenseFuse、FusionGAN、RFN、GANMcC、DDcGAN、MFEIF、U2Fusion（均为像素级融合 + 同一检测器）。

## 关键数字

检测（表 2，mAP@.5）：MS 数据集上红外单模态 0.709、可见光单模态 0.739、DenseFuse 0.755、DDcGAN 0.766、TarDAL 0.780。M3FD 上红外单模态 0.781、可见光单模态 0.756、次优 GANMcC 0.797、TarDAL 0.807；TarDAL 在 M3FD 逐类为 People 0.613、Car 0.823、Bus 0.816、Motorcycle 0.846、Truck 0.869、Lamp 0.846。协同训练版 TarDAL-CT 的 mAP@.5 在 MS 为 0.807、M3FD 为 0.811，均高于直接训练（0.780 / 0.807）与任务导向训练（0.755 / 0.809）。效率（表 2）：TarDAL 融合网络参数 0.296M、14.88 GFLOPs、单对推理 0.041 s，为所有对比方法中最快。融合质量方面，正文结论称 TarDAL 在三数据集的 MI / EN / SD 上取得最大或次大均值且方差最小，但具体数值仅见图 7 箱线图、未制表。一个有用的锚点：M3FD 上干净融合（0.807）相对最强单模态（红外 0.781）的领先只有约 2.6 个点。

## 消融说明了什么

判别器消融（表 3，M3FD mAP@.5）：无判别器 0.722；仅细节判别器 0.719（对检测甚至微负，正文承认其引入冗余背景细节）；仅目标判别器 0.781（目标判别器是检测增益的主来源）；双判别器全模型 0.807。一个反直觉点：去掉两个判别器时 TNO 上的 EN / SD 反而最高，作者解释为融合图噪声抬高了这两个无参考指标——等于自证 EN / SD 与检测友好度不一致。训练策略消融（表 4）：协同训练优于直接训练与任务导向训练；只用检测损失训练时融合图视觉效果明显变差，协同训练同时保住视觉质量与检测精度，支撑双层优化须以融合损失作正则的主张。损失项消融（图 10，定性）：去掉显著性权重后显著像素分布与对比度下降；去掉掩码后两判别器无法分区工作，细节（如树叶、烟囱轮廓）丢失。

## 局限

零鲁棒性设定：全文无模态退化、损坏、缺失评测，无噪声注入、无单模态失效实验；表 2 的红外、可见光单模态行只是干净输入下的单传感器基线，不是退化臂，方法对一路输入损坏时的行为完全未知——生成器只在干净对上训练过。融合是像素级（先生成一张融合图再检测），融合质量指标（MI / EN / SD）与检测收益并不一致，检测导向主要靠协同训练的梯度耦合实现，而非融合目标本身。原文数字不一致：M3FD 规模在引言（4,177 对 / 23,635 标注）与 §4、表 1（4,200 对 / 33,603 标注）两处不同，本笔记以 §4 与表 1 为准，引用数据集规模时须注明出处；正文所称相对次优方法的提升幅度与表 2 数值也不能完全对齐。检测器只用 YOLOv5 一家，结论建立在融合图加重训检测器的协议上，未与特征级融合方法比较。掩码依赖额外的预训练显著性网络，是管线外的单点依赖。M3FD 的 Challenge 是自然场景难度（伪装、烟雾等），不是受控退化，场景划分也不能替代合成腐化协议。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
