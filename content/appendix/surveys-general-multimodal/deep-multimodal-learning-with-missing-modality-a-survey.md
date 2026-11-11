---
title: "Deep Multimodal Learning with Missing Modality: A Survey"
paper_id: "wu2026deep"
authors: "Wu, Wang, Chen, Carneiro"
year: "2026"
venue: "TMLR"
list: "appendix"
scope: "Reference"
section: "Surveys (General Multimodal)"
subsection: ""
fusion_level: "na"
architecture: "na"
tags: ["survey", "missing-modality"]
paper_link: "https://arxiv.org/abs/2409.07825"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：Survey of imputation/representation/distillation approaches to missing modalities.

## 点评

TMLR 2026 发表版的正式题名为 “Deep Multimodal Learning with Missing Modality: A Survey”。问题被严格限定在 q=0 一端：样本只有完整与缺失两态，缺失成因（传感器故障、环境干扰）在建模时全部塌缩为不在场，噪声过大的样本直接当作缺失样本处理；全文没有「在场但输出错误内容」的类别。领域明文目标是「与完整模态训练的系统性能相当」（对标上限而非不劣于最佳幸存子集），§7 八节开放问题无任何判据/保证类条目，且讨论自承缺失条件下没有度量模态贡献与不确定性的原则性框架、真实的系统性/异步传感器失效未被基准建模（多为人工随机掩码）。分类学为数据处理（模态插补、表示聚焦）与策略设计（架构聚焦、模型组合）两方面，恢复派占 75.5%——主流路线是把缺失补回来，其方法谱系全部预设坏模态会自己消失。目标检测覆盖极薄（仅 ProbEn、PME 等三处点名），领域重心在情感分析、医学影像与驾驶场景分割。

## 框架图

![缺失模态学习综述主框图（原文 Figure 2）：分类学总图，顶层之下分数据处理与策略设计两大方面、四种类型、十二个子类](figs/deep-multimodal-learning-with-missing-modality-a-survey.webp)

*原文 Figure 2：分类学总图 “Our taxonomy of deep multimodal learning with missing modality methods”。顶层为 Deep Multimodal Learning with Missing Modality，向下分两个方面——左 Data Processing Aspect（模态插补：Modality Composition / Modality Generation；表示聚焦：Coordinated-Representation / Representation Composition / Representation Generation），右 Strategy Design Aspect（架构聚焦：Attention-Based / Distillation-Based / Graph Learning-Based / MLLMs；模型组合：Ensemble / Dedicated / Discrete Scheduler），与 §2 正文及表 1 的四类十二子类一一对应。图源：Wu et al., TMLR 2026（arXiv:2409.07825 v4，发表版）Figure 2。*

## 问题定义

综述的问题定义严格落在可用性（availability）二值轴上。§1 原文：“Unlike the conventional full-modality setting, where all N modalities are assumed to be consistently available, MLMM must operate when one or more modalities are absent during training or testing.”；“The central goal of MLMM is to robustly exploit the available modalities while maintaining performance comparable to systems trained with complete modality information.”样本被二分为 full-modality 与 missing-modality（“lacking one or more”，图 1b）。在此框架内，综述区分的维度只有：发生的阶段——训练期缺失 vs 测试期缺失（据其统计，36.4% 的工作在不完整训练集上训练，63.6% 只处理测试期缺失；多数蒸馏/生成方法假设训练集完整、只在测试时模拟缺失）；粒度——基本单位是整模态，模态内缺失仅以两种形态出现（视频丢帧与普适计算中的传感器通道缺失/异步间隙），没有“一个模态内部空间区域性损坏”这一类的系统讨论；缺失率——轻度 <30% / 中度 30–70% / 重度 >70%（38% 的工作控制并测试了不同缺失率，其余用随机缺失率）。缺失的成因列举（§1）包括传感器故障、硬件限制、隐私、环境干扰、传输失败——但所有成因都被归一化为“不在场”：§1 的早期情感计算例子中，因麦克风噪声过大或摄像头遮挡而“不可用”的样本被当作缺失模态样本处理，即噪声样本在问题建模层被转成了缺失样本，而不是作为“在场但内容错误”的输入被建模。全篇没有“模态已损坏/被腐化、仍在输出错误内容”这一问题类别：全文检索 corrupt* 仅两处（一处在 §6.5 描述 EEG 数据集时说 EEG 易受 “noise, channel corruption, and abrupt signal loss”，后果被表述为产生结构性缺失；另一处在参考文献标题中）；“sensor impairment”仅出现一次（顺带提及，未成类别、未展开）。换言之，这篇综述把问题严格限定在质量为零的缺失端：传感器要么在、要么不在，“在场但系统性出错”的中间状态不在其概念空间内。注：本笔记据 arXiv:2409.07825 v4（2026-02-04）通读，该版本即 TMLR 正式发表版；发表版题名与预印本题名不同（见卡片标题）。

## 方法细节

（综述类：此节为分类学框架。）分类学（§2、图 2）沿两个方面、四种类型、十二个子类组织。方面一：数据处理（Data Processing）——在数据/表示层“补”缺失信息。模态插补（§3.1）在原始数据层补：模态合成——零值/随机值填充（常作 baseline）、检索式合成（KNN 等从同类完整样本复制/平均缺失模态、Modal-mixup 等），综述指出其不适用于像素级任务、且多数依赖训练标签、无法处理测试期缺失；模态生成——逐模态生成器 vs 统一生成器，技术代际为高斯过程/Boltzmann 机 → AE → GAN（SensorGAN 等）→ Diffusion（IMDer 等），代价是生成器随模态数膨胀、重度缺失时生成质量无保障。表示聚焦（§3.2）在表示层补：协同表示——用约束使各模态表示语义对齐（正则化式如 Tensor Rank Regularization 与相关驱动式如 DCCA）；表示合成——检索特征池平均、或算术运算（平均/最大池化、sign-max、token merging）融合任意数量模态，无新增可学习参数；表示生成——间接式（重构作辅助任务、推理时丢弃解码器，含 MAE 式两阶段如 ActionMAE、M3AE）与直接式（小型生成网络直接映射到缺失模态表示；谱系源头是 Hoffman et al. 的 Hallucination Network，代表作 SMIL）。方面二：策略设计（Strategy Design）——不补数据，靠架构/模型组织适应任意可用子集。架构聚焦（§4.1）：注意力式（模态内注意力与模态间掩码注意力——把缺失模态 token 置零/负无穷；Transformer 联合表示学习与参数高效学习，缺失模态作 masked token）、蒸馏式（结果蒸馏、中间蒸馏、过程蒸馏如 Mean Teacher、自蒸馏如 ShaSpec；多数要求教师见过完整数据）、图学习式（图融合与 GNN 式先图补全再预测）、MLLM 式（把 LLM 当特征处理器/调度者，天然接受可变数量模态 token；综述明确指出尚无 MLLM 的缺失模态专用基准）。模型组合（§4.2）：集成（多模态模型集成与单模态模型集成，仅可用模态参与决策；检测方向的代表是 Chen et al. 2022 的概率集成与 Cha et al. 2024 的 PME）、专用训练（为每种模态组合训/选一个模型，KDNet 为源头）、离散调度（LLM 作控制器在模块库中调度）。第二套交叉分类（§5.3、表 2）：按是否恢复缺失信息 × 早期/中间/晚期阶段再切一刀——315 篇统计中恢复派占 75.5%、非恢复派仅 24.5%，恢复派内部中间阶段（特征层恢复）占 45.8% 为最大宗；综述的解释是特征层恢复“能避开原始数据的噪声与偏差”，这句话反向说明该领域对原始层噪声的态度是绕开而非建模。

## 实验设置

（综述无自有实验；此节记录其覆盖范围。）文献池：2012–2025 年 8 月共收集 354 篇（自称该领域第一篇全面综述），其中 315 篇进入 §5.3 的分类统计；检索关键词为 incomplete / missing / partial / absent / imperfect × multimodal learning 等（§1）。应用域（§6）：情感计算、医疗（MRI 分割、临床预测）、信息检索、遥感、普适计算（HAR、生理监测）、机器人视觉与感知，外加零散领域；综述自己在 §6 讨论中承认研究重心集中在三处——情感分析（RGB/文本/音频）、MRI 分割与临床预测、自动驾驶多传感器分割，即分类与分割主导。目标检测的覆盖非常薄：全文 “object detection” 仅在三处实质出现——§4.2.1 的概率集成（Chen et al. 2022）、§6.6 把 “Multimodal Detection” 列为机器人视觉五任务之一（数据集组合只举 RGB+Depth 与 RGB+Thermal，如 KAIST），外加 §4.1.1 的 BEV-Evolving Decoder（3D 检测传感器失效）与 §4.2.1 的 PME（框预测集成）两处点名；没有任何检测专属的方法类别、基准表或协议讨论，RGB-T 检测文献（KAIST 之后的融合检测谱系）基本不在其视野内。评测形态：绝大多数数据集本身模态完整，缺失是人工按缺失率随机掩码模拟的（§6 讨论：自然缺失数据集罕见）；评测协议高度不一致（缺失率定义、训练/测试配置各异），是综述反复抱怨的点（§5 Limitations、§7.3）。

## 关键数字

（综述类无自有实验数字；以下为其统计结果与核心论断，均注明出处。）（1）领域目标函数的参照系是完整模态系统，不是幸存子集（§1）：MLMM 的目标是与“用完整模态信息训练的系统”性能相当；全文没有出现“融合结果不得劣于最佳单模态/最佳可用子集”式的判据——参照点向上（补回缺失）而非向下（不劣于丢弃）。（2）恢复派是绝对主流（§5.3）：75.5% 的工作在恢复缺失信息，只有 24.5% 走非恢复路线；中间阶段特征恢复占 45.8%。（3）训练期不完整仍是少数派设置（§6 讨论）：36.4% 在不完整训练集上训练，63.6% 只研究测试期缺失；缺失率受控评测仅 38%。（4）恢复的信息可能被“无视或主导”（§7.2 引 Yao et al. 2024、Lin et al. 2024）：因训练集各模态缺失率不均衡，生成/恢复出的模态信息可能被已有模态淹没；反过来，关键模态缺失时模型又可能被不重要的已有模态“过度影响”而出错——这是全篇最接近“融合可能被坏信息拖累”的表述，但它讨论的是缺失语境下的影响失衡，且停留在经验观察层。（5）缺失条件下没有度量模态贡献/不确定性的原则性框架（§6 讨论）：原文 “there is no principled framework for measuring modality contribution or uncertainty under missing conditions”。（6）真实缺失模式未被基准建模（§6 讨论、§7.8）：系统性、异步传感器失效在真实部署中普遍存在，但现有基准多用随机掩码，“rarely captured by existing benchmarks”。

## 消融说明了什么

（综述无消融；此节记录其方法讨论与开放问题说明了什么。）§5.1–5.2 的优劣账：生成与蒸馏最常用、易实现、性能强，但大多数方法（含几乎全部蒸馏）处理不了训练集本身不完整的情形；注意力式可扩展但数据/算力饥渴；模型组合随模态数组合爆炸且存储昂贵（表 1、§5.2）。§7 的八个开放问题合起来是这个领域的自我诊断：§7.1 生成保真——恢复内容带伪影/幻觉，未来方向是理解模态间互补与冗余（哪些信息可安全推断、哪些是不可重构的独有信息）；§7.2 恢复还是不恢复——全篇最有张力的一节，开放问题被表述为“在什么情形下恢复更有利、如何度量恢复信息是否被主导/有偏”，是条件与度量问题，不是判据问题：没有提出任何最坏情形保证、单调性要求或“不劣于丢弃”的验收标准；§7.3 基准与评测——呼吁建一个 MultiBench 式的统一基准，覆盖 §6 数据集与各种缺失设置，并提醒大模型时代数据规模差异使跨方法比较更不可比；§7.4–7.7 效率/轻量化（资源受限设备恰恰最易传感器损坏）、流式/时序缺失（异步缺失造成时间错位）、多模态强化学习缺失、自然科学领域缺失——都是把缺失设定扩展到更多场景的方向，没有一条把问题从“缺失”推进到“损坏但在场”；§7.8 真实世界缺失——IoT/可穿戴中缺失是结构性、持续性的（电池、带宽、硬件退化、异步采样），呼吁真实传感器损坏数据的基准与统一鲁棒性原则，但其图景仍是 dropout 与长间隙，不是错误内容注入。通读 §7 全部八节与 §5、§6 讨论的核查结论：没有任何一处提出“融合不得劣于丢弃受损模态”式的判据、保证或开放问题；最接近的三处是 §1 的目标陈述（参照系为完整模态系统，方向相反）、§7.2 的恢复信息被主导/被过度影响（经验观察，无判据化）、§6 讨论的“缺失条件下模态贡献无原则性度量框架”（度量空白，非保证空白）。

## 局限

（1）问题空间自我设限（据全文核查）：把“不可用”一律建模为不在场，可用性是二值的；传感器在场但输出系统性错误内容（腐化、漂移、饱和、条纹）这一状态既无定义、无类别，也无任何方法条目——成因列举里明明写了 sensor malfunctions 与 environmental interference，建模时却全部塌缩为缺失。（2）任务覆盖偏斜：分类（情感、HAR、临床预测）与分割（MRI、驾驶场景）占绝大多数；目标检测只有集成类两三个条目与数据集罗列，无检测协议讨论——对 RGB-T 检测而言，它只能作为“缺失模态学习全景”的引用，不能作为检测鲁棒性的引用。（3）评测生态自承混乱：数据集多为完整数据 + 人工随机掩码，缺失率定义与训练/测试配置各行其是（§5 Limitations、§6 讨论、§7.3）；其统计数字（315 篇的百分比）建立在这种异质语料上，跨类比较需谨慎。（4）分类学是实践视角、无理论分析（§8 Limitations 作者自陈）：分类学按机器学习实践组织，不做理论剖析；对方法的优劣判断多为定性归纳。（5）时效：文献截至 2025 年 8 月；MLLM 部分自承发展过快、且无专用基准（§4.1.4）。

## 相关页面

- 对比表：[[compare|REQ-04 四维对比表]]
