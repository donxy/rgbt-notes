---
title: "Balanced Multimodal Learning via On-the-fly Gradient Modulation"
paper_id: "peng2022balanced"
authors: "Peng, Wei, Deng, Wang, Hu"
year: "2022"
venue: "CVPR (Oral)"
list: "appendix"
scope: "Reference"
section: "Modality Imbalance & Missing-Modality Learning (General)"
subsection: ""
fusion_level: "feature"
architecture: "Other"
tags: ["modality-imbalance"]
paper_link: "https://arxiv.org/abs/2203.15332"
code_link: ""
doi: "10.1109/CVPR52688.2022.00806"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：On-the-fly gradient modulation by modality contribution discrepancy.

## 点评

全名 Balanced Multimodal Learning via On-the-fly Gradient Modulation（CVPR 2022 Oral）。贡献差异比 ρ 取自融合模型自身的 logits 可加分解（用联合分类器的模态专属权重块作用于该模态特征、softmax 后在真类上的概率，两模态求和取比）——不训练任何独立单模态分类器，度量的是「干净训练数据上谁占优」，且计算需要真标签：监督的、批统计的、自指的信号；若挪到测试时判模态健康，一个高置信出错的损坏模态会恰好读作「占优模态」（结构推断）。调制只压强者、永不触零、只动幅值：弱模态梯度原样不动，平衡靠给强模态减速实现——平衡族连「丢弃」这个动作都不在词表里；GE 是向被调制梯度加一份协方差等于当前 SGD 梯度噪声的高斯噪声，防梯度缩放后的泛化掉点、与模态内容无关。推理期什么都不剩（双编码器 + vanilla 融合 + 线性分类器，双模态必须完备在场），缺失/损坏评测严格为零（表中的 Modality-Drop 只是竞争的训练策略基线、不是缺失评测协议，引用须防误读）。动机侧有两条成文材料：CREMA-D 上 audio-only 高于全部四个 vanilla 融合（干净数据负融合实例）；VGGSound 上联合模型内两编码器双双劣于各自单训，且作者自承加了 OGM-GE 后仍不超过最佳单模态模型——纯优化手段的天花板自陈，与 RSC-MD、ReconBoost 的分支探测同向（联合训练侵蚀分支质量，而接管下限正由幸存分支质量决定）。谱系：它是平衡族梯度幅值一支的源头，PMR 正以其为靶（病理在梯度方向污染、幅值缩放治不了），MMPareto 转向 Pareto 梯度合成，ReconBoost 改训练顺序——四者推理期融合形态一律不变。引用纪律：GE 单用即几乎追平完整方法（CREMA-D），其增益归因须带保留。

## 框架图

![OGM-GE 方法主框图（原文 Figure 2）：拼接基例下的梯度调制管线（贡献差异比估计、梯度调制与高斯噪声注入）](figs/ogm-ge.webp)

*原文 Figure 2：拼接基例下的 OGM-GE 管线。左为配对音视频数据与双编码器（Audio/Visual Encoder），特征 Concat 后接按模态分块着色的 FC 层与交叉熵损失；中部虚线框为贡献差异比的估计——logits-a / logits-v 各自 softmax 后汇成 Discrepancy Ratio，再生成两模态的调制系数；下方虚线框为反向通路上的梯度调制（系数乘梯度）与高斯噪声注入（图中标注 Gaussian Noise）。图 1 为动机性的单模态/联合/OGM-GE 性能曲线，图 3 为训练中贡献差异比的变化曲线，均非框架图。图源：Peng et al., CVPR 2022（arXiv:2203.15332）Figure 2。*

## 问题定义

针对的是联合训练的优化失衡（optimization imbalance），不是测试期模态状态问题。多模态判别模型对所有模态用统一目标联合训练时，表现更好的「主导模态」会通过共享的损失项把联合损失压低，使另一模态只能获得有限的梯度与优化努力；联合模型收敛时，其内部编码器仍处于欠优化状态。作者给出的标志性观察（图 1，VGGSound）：联合多模态模型的事件分类总分最好，但其内部的音频、视觉编码器（冻结编码器、只微调一个单模态分类器测得）双双劣于各自单独训练的模型，且视觉跌得更深——与 VGGSound 本身是声音导向数据集的偏好一致。即「多模态胜过单模态」与「两模态都没学好」可以同时成立。问题定义的三条边界须钉死：(i) 前提是双模态健康、数据完备、训练同分布；(ii) 其 imbalance 是训练期的学习动态量（谁学得快、谁贡献大），度量需要真标签与训练 batch；(iii) 问题定义里没有测试期模态状态轴——无缺失、无损坏、无传感器故障、无域偏移。谱系位置：「模态平衡」一族中梯度幅值调制的源头工作——PMR（CVPR 2023）正面以其为靶，MMPareto、ReconBoost（均 ICML 2024）为其后继。

## 方法细节

病理的机制解释（§3.1）：以拼接 + 线性分类器为基例，联合 logits 可加分解为两模态分量之和加偏置。两编码器与分类器权重块的更新除共享标量项（损失对 logits 的梯度）外近乎互不相关；而该共享项由两模态 logits 之和决定——强模态对正确类的置信更高、把联合交叉熵压得更低，弱模态的模态专属参数便只得到有限的优化努力，收敛时仍欠优化。贡献差异比 ρ（式 (8)–(9)）：用联合分类器的模态专属权重块作用于该模态特征（偏置取一半，受 Deep Boltzmann Machine 启发）、softmax 后在真类上的概率，近似该模态在联合模型内的单模态预测；两模态在 mini-batch 内求和后取比值。自指核查结论：该信号完全取自融合模型自身的 logits 分量分解，不训练任何独立的单模态分类器（与 Grad-Blending 需额外单模态分类器、按过拟合率混合形成对照）；它度量的是「在干净训练数据上谁更占优」，且计算需要真标签——是监督的、批统计的、按构造只能存在于训练期的量。梯度调制（式 (10)–(11)）：仅当某模态的 ρ > 1（该模态占优）时，其调制系数为 1 − tanh(α·ρ) ∈ (0, 1)；否则系数为 1。更新为学习率乘调制系数再乘梯度。三个结构事实：(i) 只压占优模态、从不放大弱模态——平衡靠给强者减速实现；(ii) 系数恒大于 0，即便在训练期也不存在把任一路梯度关到零的设定，没有任何「丢弃」动作；(iii) 作用对象是各模态编码器梯度的幅值——不改梯度方向、不改损失构成、不改推理结构。α ∈ [0, 1] 为调制强度超参，按验证集选。泛化增强 GE（§3.3）：系数 < 1 会把 SGD 噪声协方差按系数平方缩放；按其 Theorem 1（引先行工作：SGD 噪声强度与泛化能力正相关）这会伤泛化。故向被调制的梯度再加一份独立高斯噪声，其协方差与该模态当前 SGD 梯度噪声相同、随训练动态变化（实践中按梯度协方差采样）；合成噪声协方差变为 (k² + 1) 倍——恢复且超过调制前的噪声强度。所以 GE 加在编码器的更新量上，防的是调制本身引起的泛化掉点，与输入数据、模态内容无关。适用面：拼接/求和是分析基例（求和的分析在补充材料，未随主文提供）；对 FiLM、以及融合前已有多阶段跨模态交互的 PSP，OGM-GE 仍可插入并有增益，但作者自承交互使单模态性能的估计变难、增益随之缩小。

## 实验设置

骨干为双 ResNet18 编码器（视觉取多帧 2D 输入；音频为谱图，输入通道改为 1）。优化器 SGD（momentum 0.9、weight decay 1e-4、lr 1e-3 每 70 epoch ×0.1）；另有 Adam 对照（表 6）。数据集：CREMA-D（音视频语音情感，6 类，7,442 clips，随机 9:1 划训练/验证 + 744 测试）；Kinetics-Sounds（31 类动作，19k clips）；VGGSound（309 类音频事件，168,618 训练/验证、13,954 测试）；AVE（音视频事件定位，帧级标注，将 OGM-GE 插入 AVGA 与 PSP 两框架）。融合基例：baseline（一类以激活标记相关分量的 vanilla 融合）、concatenation、summation、FiLM；另插入 TSN/TSM/TBN/PSP 及 i-vector/x-vector/MWTSM 等已有方法。单模态对照口径：audio-only / visual-only 为单独训练的模型；联合模型内编码器的单模态表现按「冻结编码器 + 微调单模态分类器」测得（图 1 脚注）。全部实验：模态完备、干净、同分布划分。无任何缺失/损坏/故障/域偏移评测。

## 关键数字

病理的成文证据（表 1）：CREMA-D 上 audio-only Acc 52.5 高于全部四个 vanilla 融合（baseline 50.8、concatenation 51.7、summation 51.5、FiLM 50.6）——干净数据上朴素融合劣于最佳单模态的成文实例；VGGSound 上则融合（48.4–49.1）高于 audio-only 44.3、visual-only 31.0，失衡表现为强弱分化而非融合总分落败。主结果（表 1，† = 加 OGM-GE，Acc）：CREMA-D——concatenation 51.7→61.9、summation 51.5→62.2、FiLM 50.6→55.6、baseline 50.8→54.4；VGGSound——concatenation 49.1→50.6、summation 49.1→50.4、FiLM 48.5→50.0、baseline 48.4→50.1。VGGSound 上 mAP 同步小幅上升（如 concatenation 52.5→53.9）。与其他调制策略比（表 2，Acc）：CREMA-D——OGM 单用 59.0、OGM-GE 61.9 > Grad-Blending 56.8 > Modality-Drop（audio）54.4 /（visual）53.3；Kinetics-Sounds——OGM-GE 62.3 与 Grad-Blending 62.2 接近（OGM 单用 61.1）。插入已有方法（表 3，Acc）：Kinetics-Sounds——TBN 60.8→63.1、TSM-AV 60.3→62.4、TSN-AV 58.6→59.1、PSP 59.7→60.4；VGGSound 增益普遍 ≤ +1.0（如 TSN-AV 49.0→49.6、TBN 49.4→50.4）。CREMA-D 语音情感（表 4，Acc）：MWTSM 54.1→58.0、x-vector 55.6→57.1、i-vector 53.6→55.3。事件定位迁移（表 5，AVE）：AVGA 72.0→72.8、PSP 76.2→76.9。优化器（表 6）：CREMA-D——SGD 51.7→61.9、Adam 49.7→54.6；同设定下 SGD 整体优于 Adam（Kinetics-Sounds 63.1 vs 58.9，均为加 OGM-GE 后）。

## 消融说明了什么

OGM 与 GE 各自承重，且归因随数据集变：表 2 显示 OGM 单用在 CREMA-D 已拿 59.0（完整 61.9）；但表 7 显示 GE 单用（vanilla concatenation）CREMA-D 即 51.8→60.2，几乎追平完整方法——CREMA-D 上相当一部分增益来自噪声注入本身而非「平衡」，引用其增益时须带此保留。VGGSound 上 GE 单用仅 49.1→50.3，与完整方法（concatenation 50.6）接近，整体增益量级小得多。失衡被缓解但未消除：图 3 显示训练中音频侧贡献差异比明显下降，是调制起效的直接证据；但该比值不回到 1，作者承认数据集的天然失衡（模态对任务的固有贡献差）不可消除，也不应消除。噪声强度方向的验证（表 7）：小 batch / 大 lr（等效噪声更强）本身即更好，与 Theorem 1 同向；这同时说明 OGM 的泛化风险真实存在、GE 是必要补丁而非装饰。训练动态：调制使模型早期表现不如对照、后期反超——先压强模态、腾出优化努力给弱模态，再吃到更充分的双模信息。Modality-Drop 作为基线的读法：表 2 中 Modality-Drop 是与之竞争的训练策略（以一定概率丢弃一路输入做训练），不是缺失评测协议；其分数低于 OGM-GE 只说明调制优于随机丢弃式训练，不构成任何模态缺失鲁棒性证据。

## 局限

其一，作者自承的天花板（§5 Limitation）：即便加了 OGM-GE，联合模型内的单模态表现仍不超过最佳单模态模型；作者判断纯优化手段不能彻底解决失衡，需更先进的融合策略或架构。即本文改善的是融合总分与编码器欠优化程度，不提供任何「融合不劣于丢弃一路」式的下限，更没有该判据的对照实验设计。其二，信号的适用条件：ρ 依赖 logits 的可加分解与真标签；融合前强交互的架构中只能近似估计单模态贡献，增益随之缩小（PSP 类与 AVE 定位上仅 +0.7~+1.3）。多模态（>2）情形只作展望、未验证。其三，评测面严格为零的一侧：缺失/损坏/传感器故障/域偏移评测全部为零；其 imbalance 需标签与训练 batch，逐样本的测试时健康判断按构造不可能由此导出。其四，α 需按验证集逐数据集调（[0, 1] 内选），调制强度没有免调的设定。

## 相关页面

- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
