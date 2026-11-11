---
title: "WiSE-OD: Benchmarking Robustness in Infrared Object Detection"
nickname: "WiSE-OD"
paper_id: "medeiros2026wiseod"
authors: "Medeiros, Belal, Aminbeidokhti, Granger, Pedersoli"
year: "2026"
venue: "WACV"
list: "core"
scope: "Core"
section: "Surveys & Benchmarks"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["degraded-modality", "benchmark", "thermal-only-inference"]
paper_link: "https://arxiv.org/abs/2507.18925"
code_link: "https://github.com/heitorrapela/wiseod"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Weight-space ensembling for OOD RGB-T detection; introduces LLVIP-C / FLIR-C.

## 点评

引入 LLVIP-C / FLIR-C 腐蚀基准，以 AP50 与 mPC 评估分布外鲁棒性。

## 框架图

![WiSE-OD 方法主框图（原文 Figure 3）：WiSE-OD_ZS 与 WiSE-OD_LP 两个变体的权重空间插值方法总图](figs/wise-od.webp)

*原文 Figure 3：WiSE-OD 及其两个变体的方法总图。读图顺序：先看大灰框内的 WiSE-OD_ZS——粉色方框中的插值公式 (1−λ)·θ_RGB^COCO + λ·θ_IR^FT，把 COCO 预训练 RGB 检测器权重与 IR 全量微调权重在权重空间混合；再看黄色大框内的 WiSE-OD_LP——蓝色方框中的公式相同，但 IR 一侧换成线性探测权重（骨干冻结、只训检测头）；默认 λ=0.5。图中两个变体共用同一条插值主线，区别只在 IR 一侧的权重来源。图源：Medeiros et al. 2026, arXiv:2507.18925 Figure 3；链接为官方代码仓同款方法图。*

## 问题定义

红外检测缺乏大规模预训练数据，只能以 COCO 预训练的 RGB 检测器为起点再在红外数据上微调；微调提升域内精度，却因 RGB→IR 的模态鸿沟而牺牲分布外（OOD）鲁棒性。已有鲁棒性工作多针对 RGB 分类（WiSE-FT、LP/LP-FT）或 RGB 检测（ImageNet-C/COCO-C），红外检测既无腐化基准，也无检测原生的鲁棒微调方法。关键界定：本文部署的是单模态红外检测器，RGB 只是预训练来源——它衡量的是跨模态迁移鲁棒性，而非配对 RGB-IR 融合退化。

## 方法细节

WiSE-OD 是权重空间插值：f_wod=(1−λ)·θ_RGB^COCO+λ·θ_IR^FT（式 3），一次权重合并，不加模块、不改推理，模型无关。两变体：WiSE-OD_ZS 插值零样本 COCO 权重与 IR 全量微调权重；WiSE-OD_LP 插值零样本权重与线性探测权重（骨干冻结、只训检测头）。对照基线：零样本（ZS）、线性探测（LP）、全量微调（FT）、LP-FT。默认 λ=0.5（等权），作者有意不在目标数据上调 λ，以贴合部署实际。

## 实验设置

基准 LLVIP-C/FLIR-C：把 14 种 ImageNet-C/COCO-C 式腐化（去掉无快速实现的 glass blur）施加于红外测试集；LLVIP-C 严重程度 5，FLIR-C 严重程度 2（FLIR 已是 JPEG 压缩图，5 级会彻底破坏图像）；指标为 AP50 与 14 种腐化平均 mPC。数据集：LLVIP 训练 12,025 / 测试 3,463 对（1280×1024，仅行人）；FLIR 对齐清洗版训练 4,129 / 测试 1,013 对（640×512，自行车/狗/汽车/行人）；M3FD 真实 OOD：以白天红外训练，在雾/夜/雨/室内上测试（4,200 对，1024×768，行人/汽车/公交/摩托/卡车/路灯六类）。检测器：Faster R-CNN、FCOS、RetinaNet、YOLOv8（均为 COCO 预训练）；PyTorch、Adam、A100，上限 200 epoch（微调通常 10–20 epoch 收敛），余弦退火、验证集 AP50 早停，训练/验证 80/20 划分。

## 关键数字

Faster R-CNN，LLVIP-C（5 级）mPC：零样本 40.96、全量微调 56.40、线性探测 70.96、LP-FT 70.02、WiSE-OD_ZS 75.08、WiSE-OD_LP 75.83；干净 AP50：微调 93.68，WiSE-OD_ZS 96.06、WiSE-OD_LP 96.24——插值后干净精度也高于两个父模型。FLIR-C（2 级）Faster R-CNN mPC：零样本 33.67、微调 44.80、线性探测 47.11、WiSE-OD_ZS 50.52、WiSE-OD_LP 51.59。跨检测器 LLVIP-C mPC：FCOS 的 WiSE-OD_ZS 76.50（微调 61.17），RetinaNet 的 WiSE-OD_LP 74.39（微调 61.13）。M3FD 文中 headline 增益是 YOLOv8 的（相对微调，mAP）：雨 +10.8、雾 +7.2、夜 +7.1、室内 +0.2、平均 +6.3；Faster R-CNN 在夜晚反而下降（29.4→27.9）。单项警示：LLVIP 5 级对比度腐化下微调 AP50=0.00，线性探测 51.53，WiSE-OD_ZS 仅 10.57、WiSE-OD_LP 14.30。

## 消融说明了什么

λ 扫描（Faster R-CNN，LLVIP-C）：mPC 从 λ=0（零样本）40.96，经 λ=0.2 的 75.82、λ=0.3 的 76.98（OOD 最优），到 λ=0.5 的 75.08、λ=1.0（微调）56.40；干净 AP50 在 λ=0.5 最高（96.06）——λ=0.5 是域内/域外折中，而非 OOD 最优；分腐化看，pixelate 偏好大 λ，对比度则随 λ→1 崩塌。线性探测单用已很强（mPC 70.96 vs 微调 56.40），说明冻结骨干保留了预训练鲁棒性；LP-FT（70.02）并未超过 LP。严重程度曲线（图 4）与 Grad-CAM（图 5）一致：随严重程度上升，零样本与微调陡降，WiSE-OD_ZS 保持平稳且在脉冲噪声/变焦模糊下仍激活目标区域。

## 局限

须同时持有零样本与微调（或线性探测）两个检查点，受限部署中未必可行；固定 λ=0.5 并非处处最优，而作者拒绝在目标数据上调参，等于放弃了分腐化增益；插值会继承父模型灾难性失效（5 级对比度：微调 0.00 时插值仅 10.57/14.30，远低于线性探测的 51.53），是“继承失败”而非“治愈失败”；极端腐化（大雪、重模糊、极低亮度、低对比度，FLIR-C 最严重）下仍退化；基准是单模态红外迁移，无配对融合退化、无缺失模态协议；自适应 λ 只列为未来工作；主表实际只覆盖三个检测器（YOLOv8 仅出现在 M3FD 表），与“四个检测器”的说法有出入。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
