---
title: "Efficient RGB-T Object Detection via Sparse Cross-Modality Fusion"
nickname: "SFEDet"
paper_id: "tian2026efficient"
authors: "Tian et al."
year: "2026"
venue: "arXiv"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
tags: ["efficiency"]
paper_link: "https://arxiv.org/abs/2606.30215"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Two-stage sparse fusion: lightweight single-modality detectors first propose high-recall RoIs, and only those sparse candidates receive fusion-driven re-checking and box refinement.

## 点评

「sparse」指融合的空间范围、不是权重稀疏：两个单模态 YOLOv8-S RPN 各自全图出候选、取并集 + NMS，稠密融合只在这些稀疏 RoI 内发生（FER 计算面积占比 LLVIP 约 2–8%、FLIR 20–80%），RoI 内仍是稠密的分组 softmax 凸加权；出自 Tian 2025 同组（哈工大深圳）。结构上有冗余、无接管：模型内装了两个完整独立的单模态检测器，但最终输出恒由 FER 给出、FER 对每个 proposal 无条件消费两模态 RoI 特征，全管线无任何质量/可靠性量，分组权重由待加权特征自身预测（内生信号），主表无任何单模态对照行——「融合 vs 丢弃一路」在其自家框架内唾手可得而未做。退化/缺失/故障的测试端评测严格为零：只有训练期借自同组 RDMI 的随机单模态加噪增广（无测试协议）、空间平移失准曲线与差框容忍三处相邻项。损坏模态在该结构下会被放大而非排除（结构推断）：并集 + 高召回取向使损坏模态的高响应伪影被提出更多候选、成对进入 FER 全额复查，成本随 proposal 数上升、效率优势恰在损坏场景先崩；其差分增强把「与融合结果的差异」当补充信息回注，与 IRDFusion 同属「差异即信息」符号。效率证据成立但有条件（FLOPs 是输入相关量、稠密场景下向稠密成本回归），精度是取舍而非胜出（FLIR 43.0 低于 Fusion-Mamba 45.9）。

## 框架图

![SFEDet 方法主框图（原文 Figure 2）：双 RPN 并集提案、分组融合、差分增强与两轮辅助增强精修的总管线](figs/efficient-rgb-t-object-detection-via-sparse-cross-modality-fusion.webp)

*原文 Figure 2：SFEDet 总体架构。上方主流程：左端双路（RGB 绿 / TIR 橙）骨干 + FPN 各自检测，经 NMS 取并集得初始框（训练期另有去噪策略注入加噪 GT 框）；两路 RoI Align 配对后依次经分组加权融合、差分增强，再经两轮辅助特征增强 + 检测头逐步精修，两头的分类与回归输出汇总计损失。右侧两子图为分组融合（通道分组后由 Pooling 与 Linear–LN–Linear–Softmax 产生分组权重对，图内示例为 0.1/0.9、0.7/0.3、0.6/0.4）与差分增强（差值经卷积块与 Sigmoid 后以 Hadamard 乘积回乘本路特征）。底部四子图为辅助特征增强、卷积块与 Rolling Conv 结构、去噪策略。图源：Tian et al., arXiv:2606.30215 Figure 2。*

## 问题定义

出发点是一个计算分配观察：图像的大部分区域是平滑背景（天空、地面），轻量单模态模型即可处理，重型融合只应花在潜在前景上。作者先用 YOLOv8-Large/Small 在 FLIR 上的 P–R 曲线做分析实验（图 1(b)）：轻量检测器在 IoU=50% 下的截断召回与重量级检测器相当、均接近 100%，但误检多、IoU=75% 下召回骤降、定位差——由此推出两段式设计：轻量模型负责高召回地「找」，融合模块负责逐 RoI「验」（滤误检）与「修」（精修框），其 RPN 召回与大型检测器可比（图 1(c)）。问题定义全程是计算分配问题，不涉及模态可信度：哪一路模态更可靠、在什么条件下应少用某一路，均不在其问题空间内。

## 方法细节

第一阶段为双 RPN：RGB、TIR 各一个独立的 YOLOv8-Small 作模态专属候选生成器，全图初步检测，候选集取两路检测的并集再做 NMS，得到稀疏、无重叠的 proposal 集合——并集是刻意的召回冗余，任一路看到的目标都不会在提案层被漏掉。第二阶段在配对 RoI 内融合：同一 proposal 框在两模态三层 FPN 特征上各做 RoI Align（假设两模态同框可用，即已配准；池化前 proposal 按 1.1 倍放大），跨层压成每 proposal 的 C×5×5 表征。融合模块 FER 的核心是 DEGF（差分增强分组融合）：先分组加权融合——两路特征沿通道分 4 组，组内权重由 Pooling & stack 后的 Linear–LN–Linear–Softmax 预测，对每一通道对在两模态间做 softmax 归一化（权重和为 1 的凸组合）；再做差分增强——每路特征被「融合结果与自身的差」经 Sigmoid 门控的卷积块调制后回加进融合特征，即差异被当作待挖掘的补充表征，而非待抑制的成分。FER 还包括：从骨干低层（而非 FPN）重新 RoI Align 取辅助特征注入、以 Rolling Convolution（先沿通道滚动半组再卷积以补组间交互）替换内部常规卷积、两个检测头逐步预测残差的两步框精修（框编解码用 proposal 尺度归一化，弥补 RoI 特征丢失 stride 尺度信息的问题）。训练期另有去噪训练：把 10 组加噪 GT 框加入 proposal 列表，使 FER 学会处理定位很差的候选，推理时无此项。训练流程为两段式：双 RPN 先各自独立训练，再端到端联合训练（RPN 学习率另乘衰减因子 0.005）；总损失为四个 YOLOv8 式检测头损失之和。附录另述一项借自同组 RDMI 的训练期随机单模态加噪增广（随机对一路加 Gaussian / Contrast / Blur 之一），仅训练期使用。稀疏度定义为实际发生卷积计算的面积占 FPN 总面积之比，实现上靠调 RPN 输出分数阈值改变 proposal 数；SFEDet-Lite 即更高稀疏（更少 proposal）的配置。骨干为 CSP-S（YOLOv8-Small 级），总参数 24.5M。

## 实验设置

数据集为 M3FD（4.2K 对，1024×768，6 类，含极端光照与天气场景，均为数据集原生条件、非受控退化）、FLIR relabeled 版（640×512，3 类：Bicycle/Car/Person）与 LLVIP（15K+ 对，1280×1024，行人）。指标为 COCO mAP（0.5:0.95）与 AP50。对比方法含 ICAFusion、EME、RDMI、MMFN、EI²Det、Fusion-Mamba、CFT、Cro-Former、COFNet 等，多家 FLOPs 由作者用 fvcore 依官方代码在同一分辨率下重测。SFEDet 自身 FLOPs 是输入相关量（正比于 proposal 数），以 25%/50%/75% 分位与均值报告（如 M3FD 均值 112.6G），主表取均值——引用其效率数字时须注明此点。主对比表只有融合方法，没有单模态检测器对照行；单模态信息仅有图 1(b) 的 YOLOv8-S/L 召回分析与附录的 RPN 损失曲线讨论（定性）。另有同设置下不同稠密融合位置（图像级/骨干级/FPN 级拼接融合）的自建对照（表 3）。

## 关键数字

M3FD（表 1，1024×768）：SFEDet 24.5M / 112.6G，mAP 61.0、AP50 89.8（AP50 为表内最高；mAP 略低于 Fusion-Mamba 的 61.9，但后者代价为 288M / 1133G）。逐类 AP50：People 88.7、Bus 96.7、Car 91.2、Motor 88.2、Lamp 91.0、Truck 83.2。对照成本：ICAFusion 120M / 370G（AP50 88.2）、EI²Det 116M / 391G（86.2）、RDMI 72.0M / 320G（79.2）；正文称其计算量约为同类方法的 30%。FLIR（表 2，640×512）：SFEDet 69.0G，mAP 43.0、AP50 81.7（Bicycle 70.6、Car 89.3、Person 85.2）；低于 Fusion-Mamba 的 45.9 / 84.9 与 COFNet 的 44.6 / 83.6，高于 ICAFusion 的 41.1 / 79.2；SFEDet-Lite 为 53.6G、42.8 / 81.6。LLVIP（表 2，1280×1024）：SFEDet 163G，mAP 65.9（与 COFNet 并列最高）、AP50 96.8（低于 EI²Det 的 98.0 与 CFT 的 97.5）。分辨率面积 ×4 时 FLOPs 增长倍数 SFEDet 为 2.4×、EI²Det 为 3.8×，是其高分辨率可扩展性主张的主要证据；稀疏度采用点约为 LLVIP 2–8%、M3FD 5–20%、FLIR 20–80%（图 5 图形读数）。同设置稠密对照（表 3）：M3FD 上 FPN 级稠密融合 + DEGF 为 59.6 / 88.4 @180.4G，SFEDet 为 61.0 / 89.8 @112.6G。FER 滤误检效果（附录表 H，等召回下每图误检数）：M3FD（召回 0.96）双 RPN 18.0、朴素融合 26.5、FER 2.1；FLIR（召回 0.95）65.0 / 38.0 / 33.5。对劣质 proposal 的容忍（表 6，无重训练）：把 proposal 与 GT 的 IoU 上限从 1.0 压到 0.5，AP50 在 FLIR 由 81.7 降至 62.7、M3FD 由 89.8 降至 75.3，0.7 以上近无损（FLIR 81.5、M3FD 89.5）——注意这是定位质量鲁棒性，不是模态退化鲁棒性。

## 消融说明了什么

组件消融（表 4）：仅 Add 融合、无其余组件的 Base 在 M3FD 为 57.2 / 85.4、FLIR 为 41.9 / 79.9，完整 FER 为 61.0 / 89.8、43.0 / 81.7。分组加权融合在不增成本下有正增益；差分增强优于 Add 且不增成本；辅助特征取自骨干低层优于 FPN 高层；两步精修与去噪训练各自有贡献——去掉去噪训练，M3FD 降至 59.9 / 88.0、FLIR 降至 42.7 / 81.0。卷积算子（表 5）：Rolling Conv（G=8）24.5M、M3FD 61.0 / 89.8 @均值 112.6G；普通 Conv2d 29.0M、61.1 / 88.9 @144.4G——mAP 相当而 AP50 与成本占优，效率主张成立；Shuffle / DW+1×1 更省（98.4G）但 AP50 低 0.9–1.3。超参（表 7）：RoI 尺寸 5 与 7 的 mAP 同为 61.0，尺寸 5 的 AP50 更高（89.8 vs 88.9）且更省，尺寸 3 降至 60.0 / 88.7；Rolling 分组数取 8，各配置差异在 0.3 量级，结论是对超参不敏感。消融的空白：没有「并集 vs 单路 proposal」的消融，其召回冗余结构从未被单独定价；分组 softmax 权重从未按模态、昼夜或条件做统计分析——权重只是融合内部量，未被当作模态贡献或可靠性读数来验证；也没有任何损坏/缺失模态下的消融。

## 局限

其一，退化/缺失/传感器故障的测试端评测为零。全文与「损坏」相关的只有三处，均非受控退化评测：§4.5 的空间失准讨论（X/Y 方向像素平移使 SFEDet 与稠密基线 EI²Det 的 mAP 都下降，加 shift 增广训练可缓解；仅曲线图、无数值表，且属几何错位轴而非内容退化轴）；附录 B 的训练期随机单模态加噪增广（只有训练用途、无测试端损坏协议与之对应，加噪幅度与概率未给数值）；表 6 的 proposal 定位劣化实验（考验对差框的容忍，与模态健康无关）。热红外条纹、非均匀性漂移、坏点、饱和等传感器故障模型全文未出现。其二，单模态下限从未测量：立论前提「背景可由单模态轻量模型处理」只在召回意义上验证过（图 1(b)(c)），主表无 RGB-only / TIR-only 检测行；两个 RPN 本身就是现成的单模态检测器，其独立检测精度从未作为结果报告。其三，效率数字有条件性：FLOPs 随场景 proposal 数浮动（分位区间见表 5），稠密场景下成本向稠密融合回归，其成本优势在高分辨率稀疏行人场景最大、在 FLIR 已明显收窄；FPS 仅有相对曲线，无绝对时延数值。其四，召回即上限：两路 RPN 同时漏检的目标 FER 无从挽回，该风险只在 FLIR 上用 YOLOv8-S/L 曲线论证过，未在 M3FD/LLVIP 上单独报告 RPN 召回上限。其五，精度定位是「有竞争力」而非最优：FLIR mAP 低于 Fusion-Mamba（45.9）与 COFNet（44.6），LLVIP AP50 低于 EI²Det（98.0）；换来的是数分之一的参数量与数倍低的 FLOPs，引用标题的 efficient 时应连同精度差一并说明。其六，RoI 配对假设同框跨模态对齐，对未配准数据只有 §4.5 的增广对策，无机制层处理。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
