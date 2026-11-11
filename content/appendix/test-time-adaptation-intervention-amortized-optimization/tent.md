---
title: "Tent: Fully Test-time Adaptation by Entropy Minimization"
paper_id: "wang2021tent"
authors: "Wang, Shelhamer, Liu, Olshausen, Darrell"
year: "2021"
venue: "ICLR"
list: "appendix"
scope: "Reference"
section: "Test-Time Adaptation, Intervention & Amortized Optimization"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["test-time-adaptation"]
paper_link: "https://arxiv.org/abs/2006.10726"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "Yes"
---

**一句话要点**：Test-time entropy minimization over norm affine parameters.

## 点评

全名 Tent: Fully Test-time Adaptation by Entropy Minimization（ICLR 2021）。机制：只给已训练模型 + 无标签目标流，不用源数据/标签、不改训练；优化目标只有一个——目标 batch 预测的 Shannon 熵；可更新参数只有归一化层的重估统计（源统计直接丢弃）与通道仿射（合计 <1% 参数），其余全冻结，在线模式无终止、无回滚。熵是全模型级自指信号、不定位到模态：低熵既可来自健康证据、也可来自损坏模态的自信误报，目标函数无区别、梯度流向全网共享的仿射——没有任何项能表达「折扣哪一路」。原文自家失败例即成文证据：MNIST→SVHN 上 Tent 把误差从 71.3 推高到 79.8（初始预测大体错误时，熵最小化系统性强化错误）——这是「测试时机制不能只依赖模型自身置信度」最干净的引用。BN 统计通道正是损坏模态的污染入口（结构分析）：重估统计会把一路损坏的特征偏移合法化为「新域常态」；损坏间歇出现时统计被干净样本主导、根本不响应，损坏充满 batch 时更新追逐损坏分布并持续污染其后干净帧。其跨点泛化实验自证它学的是域级统计调制，与逐样本接管决策是不同问题坐标。失效模式的原文覆盖度：类别坍缩未讨论且无多样性正则；作者自陈在 CIFAR-10.1/ImageNetV2 上不改善，并原话承认熵需要 batch、不能逐点 episodic 更新；消融显示更新全部参数从不优于源模型。它是 TTA 谱系的根：MEMO 补单点、MM-TTA 搬到多模态分割、CD-Buffer 做到检测但单模态、READ/SuMi 多模态但只到分类——检测 × 多模态一格仍空，且其归因缺失 + 统计污染 + 域级坐标三层结构决定了它搬不动。

## 框架图

![Tent 方法主框图（原文 Figure 3）：方法总览——源域训练与 fully test-time adaptation 两阶段对照](figs/tent.webp)

*原文 Figure 3：方法总览。左 (a) training——源数据 x^s 经 f(x^s; θ) 得 ŷ^s，与标签 y^s 计监督损失，训练期不被 tent 触碰；右 (b) fully test-time adaptation——目标数据 x^t 经 f(x^t; θ+Δ) 得 ŷ^t，只计 Entropy(ŷ^t)，Δ 为受约束调制（归一化统计重估 + 通道仿射 γ、β 的熵梯度更新）。Figure 4 只是调制模块的局部示意（归一化/仿射两步的通道示意），故以 Figure 3 为主框图。图源：Wang et al., ICLR 2021（arXiv:2006.10726）Figure 3。*

## 问题定义

设定（§2、表 1）：源模型 f_θ 只在源数据上训练；测试时只给模型参数 θ 与无标签目标数据 x^t——不用源数据、不用目标标签、不改训练过程。与 fine-tuning（需目标标签）、domain adaptation（需源+目标联合）、test-time training（需在训练期预埋自监督代理任务并共享参数）逐项对照（表 1）。动机是部署现实：源数据可能因带宽/隐私/商业原因不可得，推理又不能停。要解决的问题：dataset shift（腐化、域偏移、sim-to-real 差异）使测试误差上升，而适应只能靠模型自己的预测。熵作为目标的两支经验依据：图 1——CIFAR-100-C 上预测熵越低、错误率越低；图 2——腐化越重，预测熵与损失同步上升，二者秩相关 ρ = 0.61（图内标注）。即熵既可作无监督适应目标，又可无标签地估计偏移程度。关键界定：这里的偏移是目标分布整体的属性——一个目标域即一种偏移状态、测试流内同分布，适应是往这个新分布上累积统计。全文没有模态概念、没有样本级状态区分，更没有「某一路传感器在场但损坏」的概念。其问题坐标是域级分布漂移，与样本级模态损坏正交。定位：提出 fully test-time adaptation 设定与「测试熵最小化」方法的奠基工作，是附录 TTA 组的谱系根——后续 MEMO、MM-TTA、CD-Buffer、READ、SuMi 全部以它为参照系。

## 方法细节

目标（§3.1）：最小化目标 batch 预测的 Shannon 熵 H(ŷ) = −Σ_c p(ŷ_c) log p(ŷ_c)。原文明确指出：对单个预测优化熵有平凡解（把全部概率压给最大类），靠「在 batch 上联合优化、参数在 batch 内共享」防住。注意这只防单点退化——全文没有任何多样性/抗坍缩项（对照 §5 转述的 SHOT：其 information maximization = 熵最小化 + 多样性正则，tent 没有后者）。参数（§3.2、图 4）：只动特征调制，直接复用源模型的归一化层（实验中为 BN）：归一化步——统计量 μ、σ 在当前目标 batch 的前向中逐层重新估计，源统计在初始化时直接丢弃；变换步——通道级仿射参数 γ（scale）、β（shift）由熵梯度 ∇H(ŷ) 更新。其余参数 θ 全部冻结。γ、β 合计占模型参数 <1%——原文拒绝更新全 θ 的理由是：θ 是源数据在该设定下唯一的载体，动它既可能使模型偏离训练、又高维敏感、测试时算不起。算法（§3.3）：初始化收集全部归一化层的 {γ_l,k, β_l,k} 并丢弃源统计 {μ_l,k, σ_l,k}；每步前向逐层估计当前 batch 统计、反向更新 γ、β。一个容易被引错的细节：当前 batch 的预测用更新前的参数算出，变换更新只影响下一个 batch（除非重复前向），故每点只需一次梯度。在线模式无终止条件、随测试流持续更新；离线模式先在目标集上更新、再重复推理，可多 epoch。优化设置（§4）：ImageNet 用 SGD + momentum，BS = 64、LR = 0.00025；其余数据集用 Adam，BS = 128、LR = 0.001（由训练 BS 按因子缩减以省显存，LR 同步按因子缩减）。模型要求：已监督训练、概率输出、可微。

## 实验设置

腐化鲁棒：CIFAR-10-C / CIFAR-100-C / ImageNet-C（15 类腐化 × 5 档，Hendrycks & Dietterich 基准）；骨干 R-26（CIFAR）/ R-50（ImageNet），均带 BN。表 2 口径为最高档（level 5）对腐化类型平均的误差；图 5 为 ImageNet-C 逐类型、对 5 档平均的误差。域适应：SVHN → MNIST / MNIST-M / USPS（R-26），离线适应以便与 DA 方法公平对照。扩展评测：GTA → Cityscapes 语义分割（HRNet-W18，报 IoU）；VisDA-C（ResNet-50，报验证误差）。基线：source（不适应）、RG（对抗域适应）、UDA-SS（自监督域适应）、TTT（test-time training）、BN（test-time normalization，仅重估统计）、PL（伪标签）。其中只有 BN、PL、tent 是 fully test-time 方法；RG/UDA-SS/TTT 都需要源数据与多轮联合优化。

## 关键数字

ImageNet-C（§4.1、图 5，误差 %）：source 59.5、test-time norm (BN) 49.9、稳健训练 SOTA ANT 50.2、AugMix 51.7、ANT+SIN 47.4；tent 在线 44.0、离线 42.3，为当时新 SOTA。相对 BN 的相对改进 18%（对 Schneider et al. 所报 BN 的 49.3 亦有 14% 相对改进）。对 ANT 仅在 noise 一类上不占优——ANT 训练时见过噪声。口径注意：44.0 是 15 类 × 5 档平均误差，不是最高档。CIFAR-C 最高档（表 2，C10-C / C100-C 误差 %）：source 40.8 / 67.2；RG 18.3 / 38.9；UDA-SS 16.7 / 47.0；TTT 17.5 / 45.0；BN 17.3 / 42.6；PL 15.7 / 41.2；tent 14.3 / 37.3 最低，且只用目标数据过一遍。数字适应（表 3，MNIST / MNIST-M / USPS 误差 %）：source 18.2 / 39.7 / 19.3；BN 15.7 / 39.7 / 18.0；tent（1 epoch）10.0 / 37.0 / 16.3；tent（10 epochs）8.2 / 36.8 / 14.4。1 epoch 时 3 例中 2 例优于 RG/UDA-SS，而计算量约少 80×（RG/UDA-SS 用约 7 倍于目标集的源数据训 10 epoch）。MNIST 上继续更新：离线 100 epochs 达 6.5；在线 1 epoch 12.5、10 epochs 8.4。成文失败例（§4.2，全文最重要的一行负结果）：反向 MNIST → SVHN（源误差 71.3 的难偏移）：tent 使误差升至 79.8，而 DIRT-T 45.5、UDA-SS 38.7。作者自承此例「success presently requires joint optimization over source and target」——源模型已大体错误时，熵自训练沿错误方向自我强化。分割与 VisDA-C：GTA→Cityscapes IoU——source 28.8、BN 31.4、tent 35.8（离线）；单图 episodic 10 次迭代 36.4（单图即像素 batch）。VisDA-C 验证误差：source 56.1 → tent 45.6；若改参数化为「更新除最后分类层外的全部层」（SHOT 式）可达 39.6——大偏移下只调 BN 仿射不够，作者以此承认参数化是偏移量级的函数。跨架构（表 4，CIFAR-100-C 误差 %，源 / BN / tent）：SAN-10（pair）55.3 / 39.7 / 36.7；SAN-10（patch）48.0 / 31.8 / 29.2；MDEQ（large）53.3 / 44.9 / 41.7——未调参直接迁移设定。

## 消融说明了什么

熵降与误差降只是弱—中相关（图 6）：CIFAR-100-C 全部 75 种腐化类型×档位组合上，ΔH 与 ΔL 的秩相关系数仅 0.22，绝大多数点熵与误差同降——熵是误差的统计代理，不是逐样本保证；这与图 2 的 ρ = 0.61（熵的水平值 vs 损失的水平值、随腐化档位共变）不矛盾，但引用时切勿混用两个口径。调制两步缺一不可（§4.3）：不更新归一化统计，误差上升、可劣于 BN 与 PL；不优化仿射参数，方法退化为 test-time normalization；只更新最后一层，先改进、继续优化后退化；更新全部参数 θ 从不优于不适应的源模型（原文原话 never improves）。这是 tent 低维参数化的核心实证：全参熵优化在测试时不稳定，能用的只有通道级调制这一小块。适应跨点泛化（§4.3）：在 target train 上适应、target test 上评测，CIFAR-100-C 误差 37.3 → 34.2、SVHN→MNIST 8.2 → 6.5——学到的是分布级调制而非逐点记忆。这一条同时是它的边界证明：机制的作用对象是「域」，不是「样本状态」。特征几何（图 7、图 10）：BN 把腐化特征拉回去靠近未腐化参考特征；tent 反而把特征推离参考、推向「用目标标签训练的 oracle」的特征。原文结论：tent 的效应是任务导向的、不同于归一化的去偏移。引用时须据此定位——tent 做的是决策侧的置信度再标定，不是输入或特征层面的去腐化/修复。

## 局限

作者自陈（§6）：(1) 对自然复现偏移无效：CIFAR-10.1 与 ImageNetV2 上误差明确更高（确有偏移），tent 却不改善泛化；对抗偏移未处理。(2) 熵损失不能逐点更新：「It needs batches for optimization, and cannot update episodically on one point at a time.」语义分割的单图适应靠「一张图 = 一批像素」绕过，分类无此迂回。(3) 大偏移下参数化不足（VisDA-C 需 SHOT 式近全层更新，见关键数字）；熵与 calibration 的相互作用被点名未解。熵目标失效模式的原文覆盖度（如实登记）：「自信地错」——未以此名讨论，但 MNIST→SVHN（71.3 → 79.8）就是其成文实例——初始预测大体错误时，熵最小化系统性强化错误；图 1 的「低熵 ≈ 低错误」只是腐化基准上的总体统计。「类别坍缩」——未讨论。防线只有 §3.1 的 batch 共享参数（防单点平凡解）；没有 SHOT 式多样性正则，batch 内整体滑向少类预测在原文中既无防护也无检验。「batch 组成敏感性」——未做 batch size 消融，BS（64/128）是按显存与 LR 规则选的。但机制上目标是 batch 预测的平均熵、统计是当前 batch 的经验统计——batch 的类别与偏移构成直接决定更新方向与归一化基线，这是结构事实，非作者实验结论。设定层面的隐含假设：目标流同分布且偏移状态持续足够长，统计才可累积、在线更新才有意义；混合偏移或逐样本异质的状态不在其坐标内。在线更新无回滚、无守门——一旦某批更新把参数推坏，后续所有推理继承之，原文无重置机制。任务覆盖：分类 + 稠密像素分割；无检测（无定位输出、无稀疏框集），无多模态，无模态可用性概念。

## 相关页面

- 主题综述：[[themes/degradation-robustness-evaluation-protocols|退化鲁棒性评测：协议类型与覆盖面]]
- 对比表：[[compare|REQ-04 四维对比表]]
