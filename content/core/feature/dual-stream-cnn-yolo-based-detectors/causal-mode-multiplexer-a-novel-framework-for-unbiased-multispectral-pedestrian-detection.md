---
title: "Causal Mode Multiplexer: A Novel Framework for Unbiased Multispectral Pedestrian Detection"
paper_id: "kim2024causal"
authors: "Kim et al."
year: "2024"
venue: "CVPR"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
tags: ["pedestrian", "modality-imbalance"]
paper_link: "https://arxiv.org/abs/2403.01300"
code_link: "https://github.com/ssbin0914/Causal-Mode-Multiplexer"
notes_basis: "full-text"
req04_quality_estimation: "Unknown"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Causal-inference framework removing dataset statistical bias between modalities, with a new ROTX-MP evaluation set for modality bias.

## 点评

Modality bias treated causally rather than by reweighting.

## 框架图

![Causal Mode Multiplexer 方法主框图（原文 Figure 4）：SCM 因果图与多路复用框架总图](figs/causal-mode-multiplexer-a-novel-framework-for-unbiased-multispectral-pedestrian-detection.webp)

*原文 Figure 4：(a) ROTO 的因果图：X_R、X_T 两路特征汇入多模态知识 M 再到预测 Y，并补上两条单模态直接链 X_R→Y、X_T→Y 以便判别模式与量测直接效应；(b) RXTO/ROTX 的因果图：红色弯箭头即要剪除的热红外直接效应 X_T→Y；(c) TIE 的构成图示：factual 的 TE 减去 counterfactual 的 NDE（灰色节点为无处理条件、M* 被阻断、叉号表示直接链被剪断），剩下经 M 传导的间接效应，下方小条形图对比 RXTO（黄）与 ROTX（蓝）在 TE/NDE/TIE 三种量下的分数结构；(d) 多路复用器总图：X_R、X_T 输入在 Common Mode（上，ROTO 训练/测试图，输出接 L_CMM）与 Differential Mode（下，RXTO 训练 / RXTO、ROTX 测试图，含灰色无处理节点与被剪断的直接链）之间交替切换。读图关键：整张图里没有“输入质量/传感器健康度”节点——切换依据是两个单模态头预测符号的一致性，被干预的对象是损失与打分中的效应量，而不是输入或特征流本身；且只有热红外一侧画了红色直接效应，结构上预设了“有偏模态恒为热红外”。图源：Kim et al., CVPR 2024 / arXiv:2403.01300，Figure 4。*

## 问题定义

作者提出多光谱行人检测中一个此前未被命名的统计结构问题——模态偏倚（modality bias）。记 R*/T* 中 O/X 表示行人在该模态中可见/不可见：现有数据集（KAIST、CVC-14、FLIR）几乎只由 ROTO（白天，两模态都可见）与 RXTO（夜晚，仅热红外可见）构成，经作者逐集统计，ROTX 数据为零。由于热红外全天都能捕获行人轮廓，训练分布中“行人标签”与“热红外特征存在”高度统计共现，模型于是学到一条捷径先验——大意是“没有热红外特征就没有行人”。当测试出现 ROTX 场景（白天，但行人的热辐射被中间介质物理阻挡：玻璃窗不透热辐射、消防隔热服/低辐射率服装使人热隐形，目标仅在 RGB 中可见）时，检测器仅凭“热红外特征缺席”就漏检明明在 RGB 里清晰可见的行人。两个定性要点必须说清：(1) 这个 bias 是训练分布层面的统计共现先验，是被记进参数的“记忆先验”，其成因是数据集昼/夜构成，与测试时输入是否损坏无关；(2) ROTX 中传感器本身完全正常，是目标的热信号在到达传感器之前被物理遮挡——该目标在热图中呈现为正常背景纹理，属于“证据缺席”，不是“证据被污染”。作者刻意采用不改变训练先验的问题设定（明确不往训练集里加 ROTX、不与数据增广/反事实生成类方法比较），要验证的命题是：只靠学习因果关系，能否把“多模态知识”与“记忆先验”从同一个模型里解耦出来。为此作者自建评测集 ROTX-MP。基座模型为 Kim et al. 的 Uncertainty-Guided 跨模态学习模型（TCSVT 2022；Faster R-CNN 系 + 不确定性模块），CMM 只改其 ROI 分类分支的损失与推理打分，RPN、回归与不确定性模块沿用基座。阅读依据：arXiv:2403.01300 v2 全文通读；补充材料未读，“无处理条件”的实现细节与 Gumbel-softmax 温度数值只在补充材料中给出，正文未载。

## 方法细节

（1）因果图（SCM）：常规链 X_R→M←X_T（两模态特征融合成多模态知识 M）、M→Y（检测头输出预测）。作者额外主张一条热红外直接链 X_T→Y：夜间（RXTO）RGB 退化、预测重度依赖热红外，模型由此学到对热红外的偏斜偏好，这条直接链正是 ROTX 漏检的元凶，目标是训练时把它“剪除”。在 common mode 的图里，作者同时补上 X_R→Y 与 X_T→Y 两条直接链，分别用两个单独训练的单模态模型实现，其用途有二：量出热红外直接效应的大小；为输入类型判别提供信号。（2）三路分数与效应量：融合头分数与两路单模态分数经 Log-Harmonic 融合函数合成总分（三路 sigmoid 乘积取 log，即 logit 级的乘积式组合）。总效应 TE = 该总分减去其无处理条件下的值。自然直接效应 NDE 按反事实方式估计：把中介 M 阻断在无处理值、X_R 取无处理值、仅 X_T 保持实际值时总分的变化——它被等同于热红外直接效应。总间接效应 TIE = TE − NDE：即从总效应里减掉“绕过融合、由热红外直达预测”的那一份，只保留经多模态知识 M 传导的效应。（3）两种模式与多路复用开关：common mode（用于 ROTO）按 TE 学习/推理，保留全部效应；differential mode（用于 RXTO 训练、RXTO 与 ROTX 测试）改为最大化 TIE 而非后验概率，等于把热红外直接链剪掉。当前输入走哪种模式，由两个单模态头自己的预测决定：逐 ROI 取两路单模态预测的前景/背景近似 one-hot（argmax 以 Gumbel-softmax 近似），算符号差 Δπ 并相乘得模式号 K_mode：两路同号（同报行人或同报背景，判为 ROTO）→ K_mode=+1，用 TE；两路异号（一路见行人、一路不见，判为 RXTO/ROTX）→ K_mode=−1，用 TIE。据此定义可切换总间接效应 sTIE = TE − ReLU(−K_mode)·NDE，把二值切换写成一个式子。（4）CMM Loss 与推理：训练目标由常规的 L_Y(TE, y) 改为 L_CMM = L_Y(sTIE, y)；分类分支总损失再加上对两路单模态分数的交叉熵监督（保证直接链的估计本身可信）；总损失另加 bbox 损失与基座的模型损失（RPN + 不确定性模块）。推理同样使用 sTIE 作打分，逐 ROI 按 K_mode 切换，而不是用后验概率排序。（5）结构不对称性（据原文指出）：被剪除的只有热红外直接链——因果图把“有偏模态”按昼/夜统计硬编码为热红外；没有对称的“剪除 RGB 直接效应”的模式，K_mode 的判别也预设两个单模态头的预测本身可信。整套机制作用在损失与打分（效应量）上，不触碰输入或特征流。

## 实验设置

数据集：KAIST（95,328 对；按所比基线取 7,601 训练 / 2,252 测试，测试含 Day 1,455、Night 797；指标 MR）；CVC-14（3,618 训练 / 1,417 测试，灰度 RGBT 640×471，Day 690 / Night 727；MR）；FLIR（Teledyne FLIR Free ADAS v2.0.0，采用对齐划分 4,129 训练 / 1,013 测试；指标 AP）；ROTX-MP（自建，仅测试集）：1,000 对，用 FLIR Duo Pro R 双光相机（640×512）采集，8 名志愿者、距离 0–15 m、人脸打码；其中玻璃窗后行人 737 张（纯 ROTX）+ 隔热服场景 263 张（ROTO/ROTX 混合：消防员 150、低辐射率服装 113）；指标 AP。分布统计：KAIST、CVC-14、FLIR 中 ROTX 计数为零，ROTX-MP 为 737 ROTX + 263 ROTO/ROTX。评测协议：分布内评测在各数据集自身划分上训测；ROTX-MP 评测是跨数据集泛化协议——模型只在常规数据集（KAIST / CVC-14 / FLIR 之一）上训练，直接测 ROTX-MP，训练中从未见过 ROTX。对照：HFF（Halfway Fusion + Faster R-CNN）、CFT、MBNet、Kim et al.（即基座本身）。作者明确声明不与数据增广/反事实样本生成方法比较，理由是改动训练先验违背其问题设定。鲁棒性协议：无合成退化一类——无噪声/模糊/曝光等腐化注入，无整路模态缺失实验；唯一的“分布外”评测是 ROTX-MP 的自然物理遮挡场景。

## 关键数字

KAIST（MR↓，Day / Night / All，表 2）：CMM 9.60 / 5.93 / 8.54，All 为全表最低；基座 Kim et al. 10.11 / 5.05 / 8.67（CMM 在 All 上只赢 0.13，且 Night 反而差于基座 5.93 vs 5.05）；MBNet 9.64 / 8.26 / 9.04；CFT 13.99 / 7.05 / 11.60；HFF 14.24 / 10.26 / 13.04。CVC-14（MR↓，表 2）：CMM 27.81 / 7.71 / 17.13（Night、All 最好），但 Day 27.81 明显差于 CFT 的 18.81 与基座的 23.87；基座 23.87 / 11.08 / 18.70，MBNet 24.70 / 13.50 / 21.10，HFF 50.48 / 36.05 / 44.31。FLIR（AP↑，表 2）：CMM 87.80 > 基座 84.67 > CFT 84.10 > HFF 75.85（MBNet 未报告）。ROTX-MP（AP↑，跨数据集，表 4）：训 KAIST → CMM 70.44，次好 HFF 36.95，MBNet 18.88，基座 21.69，CFT 仅 3.64；训 CVC-14 → CMM 34.96（基座 13.36、HFF 8.80、CFT 8.58）；训 FLIR → CMM 57.09（基座 12.23、HFF 13.21、CFT 5.28）。相对优势极大（作者称至少 +33.49 AP），但绝对水平随训练集在 34.96–70.44 间大幅浮动。

## 消融说明了什么

唯一的消融是去偏策略的“训练用 A + 测试用 B”组合（表 3），以训 KAIST 为例（ROTX-MP AP / KAIST MR All），FLIR 列同理（ROTX-MP AP / FLIR AP）：基线（TE 训练 + 常规后验推理，即基座原样）：21.69 / 8.67；FLIR 12.23 / 84.67——分布内正常、ROTX 崩坏，这是 bias 存在的直接证据。TE+TIE（训练不变、推理时一律改用 TIE，即无条件减掉 NDE）：ROTX 升到 57.05，但分布内严重崩坏——KAIST MR All 8.67 → 27.27，FLIR AP 84.67 → 64.27；全时去偏在分布内的代价不可接受。TIE+TIE（训练测试都最大化 TIE）：ROTX 56.45，分布内 KAIST 12.10、FLIR 79.39，仍明显差于基线。sTIE（本文，按 K_mode 逐 ROI 切换）：ROTX 70.44 且分布内 8.54 / 87.80 反而略优于基线；CVC-14 训练时同样成立（ROTX 34.96、MR All 17.13）。消融真正证明的不是“因果量比后验好”，而是干预必须以输入为条件、选择性地施加：无条件去偏（TE+TIE / TIE+TIE）在分布外与分布内之间只能二选一，只有按单模态预测一致性逐 ROI 切换，才能两边同时保住。

## 局限

作者自陈：正文无独立局限章节；可归纳的自陈约束有二：(1) 刻意不改变训练先验、不与增广类方法比较，是问题设定的主动选择；(2) 无处理条件的实现细节不在正文，须查补充材料。据原文事实指出（非作者原话）：（1）损坏模态零评测——全文没有任何合成腐化协议（噪声、模糊、过曝、条纹、非均匀性漂移、坏点、热饱和均无），也没有传感器故障模型。ROTX 的“热不可见”来自玻璃/隔热材料对热辐射的物理阻挡：传感器工作正常，目标处是正常的背景热纹理——这是证据缺席，与“损坏模态注入错误证据”有本质区别；全文没有错误证据被注入的任何设定。（2）缺失模态也没有——无整路置零/丢弃实验；ROTX 只是同图中的部分目标在热红外里不可见，整幅热图与其它目标都还在，粒度是目标级而非模态级。（3）bias 的定义域是训练统计，不是测试时输入状态：TE/NDE/K_mode 全部由当前输入经三路头现算；若某一路在测试时被腐化，单模态头与融合头同时消费腐化输入，NDE 的反事实项同样由腐化输入算出，且 K_mode 的符号判别可被腐化翻转——框架对此既无防护也无讨论。（4）无任何“不劣于”保证：TIE 是最大化目标，不是性能下界；表 2 里 CMM 在 KAIST Night（5.93 vs 基座 5.05）、CVC-14 Day（27.81 vs CFT 18.81）上实际劣于对照，去偏在分布内子集上确有代价，只是被切换机制在总账上做平。（5）协议与复现注意：ROTX-MP 仅 1,000 对、自采自标，尚无第三方复现；指标口径混用（KAIST/CVC-14 用 MR、FLIR/ROTX-MP 用 AP）；方法为行人单类专用、Faster R-CNN 系基座，未在 LLVIP、M3FD 等多类/通用检测集上评测；无处理条件取值与温度参数缺正文记载，复现须查补充材料与代码。

## 相关页面

- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
