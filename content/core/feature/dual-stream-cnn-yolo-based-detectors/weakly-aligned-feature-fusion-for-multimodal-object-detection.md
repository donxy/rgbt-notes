---
title: "Weakly Aligned Feature Fusion for Multimodal Object Detection"
paper_id: "zhang2025weakly"
authors: "Zhang et al."
year: "2025"
venue: "IEEE TNNLS"
list: "core"
scope: "Core"
section: "Feature-Level Fusion"
subsection: "Dual-Stream CNN & YOLO-Based Detectors"
fusion_level: "feature"
architecture: "CNN"
mechanisms: "Alignment"
tags: ["alignment", "dual-stream"]
paper_link: "https://doi.org/10.1109/TNNLS.2021.3105143"
code_link: ""
doi: "10.1109/TNNLS.2021.3105143"
notes_basis: "full-text"
req04_quality_estimation: "Yes"
req04_suppression: "Yes"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Journal extension of the AR-CNN line: weakly aligned feature fusion generalised from pedestrian detection to multimodal object detection.

## 点评

本文 = AR-CNN（ICCV 2019）的期刊扩展版（TNNLS，DOI 10.1109/TNNLS.2021.3105143，early access 2021、期号年 2025），方法同名、机制同构；期刊版三点增量：RFA 新增相邻相似性约束（消融增益最小）、给「弱对齐」补定量定义、任务面扩张（自采无人机 RGB-T 集 + RGB-D 任务）。「弱对齐」是数据的几何状态、不是监督的弱：指图像对存在位置偏移、像素对应不成立；训练监督反而更强——偏移真值来自逐目标双模配对标注、偏移估计显式有监督、逐 RoI 平移回归，热红外写死为 reference、只对齐 sensed 一侧。期刊版给「弱对齐」的操作性边界：使性能退化 50% 的位移量即上界（以 Halfway Fusion 为参照）——量程由退化率定义、随参照模型变。受控位移评测有两套（[−6,6]² 共 169 模式的表面图 + 四方向 µ/σ 量测），但与会议版的 ±10px、OAFA 的 ±15px 网格、CF-Deformable DETR 的 {0,5,10,20,30,50}px 固定扫描口径互不可比、并列引用必须注明量程定义不同；且合成位移全是整图刚性平移。损坏/缺失评测为零：内容完好假设贯穿全文，唯一沾边的是视场差异造成的目标级「未配对」处理（分歧权重在两模预测矛盾时压低 sensed 特征），从未被单独量测、且只压 sensed 一侧；主融合权重仍是各模自己的分类间隔（果断度），自指问题与会议版相同、未改。两版 KAIST 数字不可混引。跨家族交易结构再添一例：原点精度不敌对手、只赢位移下的均值与方差——与 CF-Deformable DETR「卖平坦度不卖精度」同形；且其消融显示融合权重与位移鲁棒轻微互斥。

## 框架图

![AR-CNN 整体架构图（原文 Figure 6）：双流骨干、融合 RPN、RFA 对齐与置信度感知融合](figs/weakly-aligned-feature-fusion-for-multimodal-object-detection.webp)

*原文 Figure 6：AR-CNN 整体架构——双流骨干（sensed 在上、reference 在下）→ Conv4 聚合经融合 RPN 生成 proposals → RoI Jitter 与 RFA（Region Shift 预测 + ShiftLoss）对齐 sensed 区域特征 → Confidence-Aware Fusion 按 Ws/Wr 加权 → FC 层与多任务损失。图源：Zhang et al., IEEE TNNLS（arXiv:2204.09848 作者自存稿）Figure 6。*

## 问题定义

「weakly aligned（弱对齐）」的确切含义：指输入图像对的几何状态——同一目标在两模态中的位置不同（position shift），像素级对应不成立。成因是传感器物理特性（基线位移、分辨率与视场不一致）、标定本身困难（RGB–热标定需专用加热标定板）且易被振动、温变、硬件老化在运行中破坏。它不是监督意义上的「弱」：训练恰恰需要比标准标注更强的监督——逐目标的双模配对标注（KAIST-Paired）来构造 RFA 的偏移真值；标准 KAIST 的单框共享标注正是作者批评的对象（大框含背景、单模标注对另一模引入定位偏差）。换言之，「弱」在数据几何，「强」在标注要求。期刊版给这一概念补了定量边界：以性能退化率 Rd（MR 口径 Rd = (MR_degraded − MR_original)/MR_original；mAP 口径取反向，式 7–8）度量，使检测性能退化 50%（Rd = 0.5）的位移量定义为该方向上的弱对齐上界，实验中以 Halfway Fusion 为参照模型算此界。超出此界的位移不再属于本文所称的弱对齐。这一定义使「弱对齐」从形容词变成依模型而定的量——同一数据集对不同检测器有不同的弱对齐量程（见局限）。位移的经验事实（§III-A）：KAIST 中过半行人存在位置偏移、多在 0–10 像素（图 3(a)，由 KAIST-Paired 统计）；位移随图像内位置变化（近边缘大、近中心小）；CVC-14 中约 12.5%（2,245 / 18,017）的行人只出现在一个模态（视场不一致所致的「未配对目标」）。病理有二：同位置跨模特征空间错位、扰乱 CNN 训练；共享框标注的定位偏差污染以 IoU 为核心的现代检测器监督。问题设定的边界：两路输入的内容均被假定完好，唯一病理是几何位置偏移；模态损坏、模态缺失（整模级）不在问题定义内（目标级单模未配对有专门处理，见方法细节的 CAF 分歧权重，但那是定位层面的对象缺席，不是传感器层面的模态失效）。定位：AR-CNN（ICCV 2019）的期刊扩展版——期刊版相对会议版的增量为：(1) RFA 新增相邻相似性约束（ASC）；(2) 给出「弱对齐」的定量定义；(3) 任务面扩张（新增自采无人机 RGB-T 检测集、自建 SL-RGBD 室内 RGB-D 集与 NYUv2 上的 RGB-D 3D 检测实验），方法从行人专用推广为通用多模态检测框架。

## 方法细节

整体为双流 VGG-16 + Faster R-CNN（图 6）：两模 Conv4 特征聚合后由融合 RPN 生成共享 proposals；RFA 对齐 sensed 模区域特征；CAF 加权融合；FC 头分类与（2D/3D）框回归，多任务损失联合优化（Algorithm 1、式 3）。RFA——显式、有监督、逐 RoI 的平移回归。借图像配准术语固定角色：成像稳定的模态为 reference（RGB-T 实验中热红外）、被对齐的为 sensed（彩色），方向写死、单向对齐。流程（图 7）：放大 proposal 取上下文 → 两模各 RoI 池化至 7×7 → 逐元素相加得跨模表征 → 两层 FC 回归该 RoI 的平移 (tx, ty)；真值由配对标注算得 t*x = (xs − xr)/wr、t*y = (ys − yr)/hr（式 1，xr/xs 为两模 GT 框中心），smooth L1 形式的 shift loss 监督（式 2，多任务损失中 λ1 = 0.75）；再按预测偏移在 sensed 特征图上重新池化，得到对齐后的 sensed 区域特征。有显式偏移估计（每 RoI 一个二维平移向量），且偏移有真值监督——与后续无监督路线（隐式校准、无监督跨模寻址）正相对照。ASC——期刊版新增件。假设位移场空间平滑：训练时随机取某 RoI 的四邻域之一（按特征步长取邻近像素处的区域），令其与原 RoI 共用同一对齐目标，以 Lasc（λ2 = 0.25）鼓励相邻区域的偏移预测相近，稳定 RFA 训练。本质是把「位移场平滑」先验做成一条自监督式一致性约束，不引入新标注。RoI jitter——训练期位移模式增广。训练时对 sensed 模 RoI 位置加高斯随机扰动 tjx, tjy ~ N(0, σ0²; 0, σ1²)（式 4，默认 σ0 = σ1 = 0.05），RFA 的偏移目标相应合成富集，使模型见过超出数据集固有模式的位移分布；正负样本判定恒以 reference 侧 RoI 的 IoU 为准。CAF——置信度感知融合。每模各加一个分类分支得前景/背景概率 p1/p0，权重 Wr = |p1r − p0r|、Ws = |p1s − p0s|（图 9），即各模用自己分类头的果断度（分类间隔）给自己打分，权重乘在对齐后的区域特征上再相加。针对未配对目标另设分歧权重 Wd = 1 − |p1r − p1s|：两模预测矛盾时压低 sensed 特征，缓解单模独有目标的歧义分类。须注意 Wd 只压 sensed 一侧，reference 永远不被分歧压制——非对称写死在算子里。KAIST-Paired 标注：在 KAIST 上逐模定位行人、同一 ID 跨模关联、单模独有者标记为 unpaired；既供 RFA 的偏移真值，也导出 MRC/MRT（分别以彩色/热红外标注为参照的 MR）两个分模口径。RGB-D 扩展（§IV-D、§VI）：同一 RFA 对齐 2D proposals 后，接 3D 框初始化（区域深度中位数定 zini、由相机内参反算 xini/yini、尺寸取类平均、角度默认 0，式 5）与七参数 3D 回归（式 6）；3D 部分基本沿袭 Amodal3Det 的参数化，本文的增量仍只是前端对齐。

## 实验设置

RGB-T 行人：KAIST（95,328 对，测试 2,252 对用 Liu et al. 改进标注，reasonable 设定，指标 log-average MR；另以 KAIST-Paired 报 MRC/MRT）、CVC-14（8,518 帧，训练 7,085 / 测试 1,433，协议从 Park et al.，两相机标定差、天然位移重）。无人机 RGB-T（自采）：DJI MATRICE 300 RTK、预标定 RGB-T 相机，831 对全天候图像、6,763 对标注、4 类（car、bus、truck、cyclist），指标 mAP。RGB-D：SL-RGBD（自建结构光系统采集，214 对、1,297 标注、7 类 YCB 子集，2D mAP）；NYUv2（1,449 对、19 类，用 Amodal3Det 改进的 3D 标注，3D 检测以 IoU > 0.25 判 TP 报 mAP）。实现：ImageNet 预训练 VGG-16；KAIST 学习率 0.005 训 2 epoch 后 ×0.1 再 1 epoch；jitter σ0 = σ1 = 0.05；增广仅水平翻转。受控位移协议共两套：(i) §III-B 灵敏度分析——固定热红外、彩色图在 (∆x, ∆y) ∈ [−6, 6]² 整数网格共 169 种模式平移，报 MR 表面图（图 5(a)）；(ii) §V-D 鲁棒性量测——四方向（0°、45°、90°、135°），每方向在原点与弱对齐上界之间等距取 10 种位移模式，报每方向 MR 的均值 µ 与标准差 σ（表 III，热红外参考/MRT 口径）；另交换角色固定彩色、平移热红外重复一遍（表 IV，MRC 口径）。RGB-D 侧 NYUv2 用同一四方向协议（表 VI）。LLVIP、FLIR、DroneVehicle 均未用（年代与定位所限）；KAIST/CVC-14 是行人主战场，无人机集是通用检测的验证集。

## 关键数字

全部出自 arXiv 作者稿（与刊文同文），逐项标注出处。KAIST 主结果（图 10）：全模型（+ASC）Day 9.79 / Night 8.07 / All 9.03 MR（改进标注口径）；KAIST-Paired 分模口径 MRC All 8.52、MRT All 8.01。对照 MSDS-RCNN All 11.63、CIAN 14.12。版本纪律：与会议版报告的 Day 9.94 / Night 8.38 / All 9.34 不同——期刊版为 ASC 增补后的模型且评测口径细节有别，两版数字不可混引。CVC-14（表 I）：24.3 / 18.1 / 22.0 MR（Day/Night/All），次好 Park et al. All 31.4；夜间优势最大（18.1 vs 30.8）。无人机 RGB-T（表 II）：mAP 36.4（car 59.8 / bus 40.6 / truck 29.9 / cyclist 15.1），CIAN 34.8、Halfway Fusion 31.9、RGB-only Faster R-CNN 26.7、RGB-only SSD 23.6。位移的代价（§III-B，图 5）：强基线（Adapted Faster R-CNN + halfway fusion）原点 15.2 MR → 最坏偏移 (−6, +6) 25.1 MR（相对退化约 65%）；偏移 (1, −1) 反而改善到 14.7——原点并非最优，说明 KAIST 本身带系统性偏移方向，恰当处理位移可以净赚。位移鲁棒性（表 III，热红外参考）：全模型原点 MRT 8.01，四方向 µ = 9.17 / 8.92 / 9.66 / 8.99、σ = 0.93 / 0.95 / 1.05 / 0.90；对比 MSDS-RCNN 原点 12.51、µ 20.10–23.36、σ 6.93–10.93；Halfway Fusion 原点 25.51、σ 7.95–8.87。即位移下 AR-CNN 不仅均值最好，波动比次优方法小约一个数量级。交换参考（表 IV，彩色参考、平移热红外）：期刊版（+ASC）原点 MRC 8.52、四方向 µ 10.58–11.79、σ 1.28–2.16，整体略逊于热红外参考配置——作者据此主张成像更稳定的模态应作 reference。NYUv2 3D（表 VI，彩色参考）：原点 mAP AR-CNN 41.2，与 Halfway Fusion 41.0 相当、低于 Rahman et al. 的 43.1；位移下 µ 33.5–34.6、σ 3.8–4.0，为全场最优最稳（对照各方法 µ ≈ 29.0–31.5、σ ≈ 6.7–7.5）——原点精度换位移平坦度的交易。SL-RGBD 2D（表 VII）：66.3 mAP，CIAN 59.3、Halfway Fusion 58.7、RGB-only Faster R-CNN 52.9；图 14 定性例给出大位移读数：位移模式 (50, −50) 时 AR-CNN 32.1 vs Halfway Fusion 23.3 mAP（该数字为定性图注口径，非表格量测）。

## 消融说明了什么

表 III 的逐行消融（KAIST，热红外参考，MRT 口径）分解得很干净。RFA 是承重件：无 RFA 时原点 12.94、四方向 σ 6.24–8.92；加 RFA 后原点 10.90、σ 砍到 2.01–2.92——对齐模块同时买原点精度与位移稳定性，但大头在稳定性。RoI jitter 主要买泛化不买原点：RFA 之上加 jitter，原点 10.90 → 9.87，而 σ 进一步压到 1.12–1.51（作者原话：该策略对 σ 的帮助大于对原点 MR 的帮助）——它是对训练未见位移模式的保险。CAF 的收益在干净口径：再加 CAF 原点 9.87 → 8.26（全文最大单步原点收益），但作者承认它对 σ 略有压制副作用（slightly suppresses the σ）——融合权重改善的是判别质量，不是位移鲁棒性，两件事在本文数据里甚至轻微互斥。ASC 增益最小：CAF 之上加 ASC，原点 8.26 → 8.01，四方向 µ/σ 变化均在 0.1–0.7 量级——期刊版相对会议版在行人主任务上的实质数字增量很小，其扩展价值主要在任务面（通用检测 + RGB-D）与定义面（弱对齐定量界）。jitter 尺度不敏感（表 V）：σ0 = σ1 ∈ {0.01, 0.02, 0.05, 0.1, 0.2} 时 All MR 为 9.29 / 9.10 / 9.03 / 9.21 / 9.36，平台宽，0.05 最优。

## 局限

其一，偏移监督被标注成本卡住：RFA 的 shift loss 需要逐目标双模配对标注，KAIST-Paired 是作者重标 KAIST 才得到的；没有这套标注的新数据集上机制无法原样构造。这正是其后继工作转向无监督偏移（隐式校准、无监督跨模寻址、掩码驱动对应）的直接动因——有监督对齐精度高，但监督本身不可扩展。其二，对齐非对称且参考写死：只有 sensed 被对齐到 reference；选谁作 reference 靠经验（热红外全天候成像稳定）。reference 本身若不可靠，框架内没有任何切换或降权机制——CAF 的分歧权重也只压 sensed。几何轴上的「参考」不是健康轴上的「可信」，两者在本文里被默认等同。其三，位移表达只有逐 RoI 平移：每 RoI 一个 (tx, ty)；旋转、尺度、视差型非刚性形变不在表达内（作者 §III-A 自承 RGB-D 侧还伴随 milder deformation and rotation，但 RFA 并不建模它们）；RoI 内部的逐像素错位同样不处理。其四，受控位移协议的口径边界：鲁棒性量测（表 III/IV）的位移上限由 Rd = 0.5 界定义，该界依参照模型（Halfway Fusion）而定、非固定像素数，与固定像素扫描（如 {0,5,10,20,30,50}px）不可直接横比；§III-B 的 169 模式网格只到 ±6 px。且合成位移全部是整图刚性平移，与作者自己指出的真实位移场（空间变化、近边缘大）不是同一分布——受控量测证明的是对合成平移的平坦度，天然位移（CVC-14、无人机、SL-RGBD）只报混合口径主结果、没有留出的天然位移分层读数。其五，CAF 权重自指：Wr/Ws 是各模分类头自己的分类间隔（果断度而非正确度）；一路模态可以既错且果断。分歧权重 Wd 用两模预测之差，方向对了，但只压 sensed 一侧。其六，无内容退化评测：噪声、模糊、过曝、热成像非均匀性等模态内容损坏一概没有；模态级缺失评测也没有。未配对目标处理的是视场差异造成的目标级单模缺席，与模态失效是两回事；Wd 是它唯一沾边的机制，且从未被单独量测（无未配对子集上的分开报告）。其七，规模与年代：VGG-16 两阶段框架、KAIST 训练仅 3 epoch；无人机集 831 对、SL-RGBD 214 对，「通用多模态检测」的结论建立在两个很小的自建集 + NYUv2 的平坦度优势上，原点精度在 NYUv2 上并不领先。

## 相关页面

- 主题综述：[[themes/quality-estimation-reliability-aware-fusion|模态质量估计与可靠性感知融合]]
- 主题综述：[[themes/damaged-modality-suppression-dynamic-routing|受损模态抑制、权重折扣与动态路由]]
- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 主题综述：[[themes/cross-modal-misalignment-unaligned-fusion|跨模态错位与未对齐融合]]
- 对比表：[[compare|REQ-04 四维对比表]]
