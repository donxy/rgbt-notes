---
title: "Thermal-Det: Language-Guided Cross-Modal Distillation for Open-Vocabulary Thermal Object Detection"
paper_id: "ranasinghe2026thermaldet"
authors: "Ranasinghe et al."
year: "2026"
venue: "CVPR"
list: "core"
scope: "Related"
section: "Feature-Level Fusion"
subsection: "Attention, Transformers & Foundation Models"
fusion_level: "feature"
architecture: "Transformer"
mechanisms: "Distillation"
tags: ["foundation-model", "distillation", "thermal-only-inference"]
paper_link: "https://arxiv.org/abs/2605.10130"
code_link: ""
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "No"
req04_robustness_evaluation: "No"
---

**一句话要点**：First LLM-supervised open-vocabulary thermal detector: over a million synthetic thermal-aligned samples built from GroundingCap-1M, plus distillation from a frozen RGB teacher on unlabelled paired RGB-T data; thermal-only at inference.

## 点评

部署形态钉死在缺失端、且比 PFGF 更彻底：推理输入只有热红外 + 文本查询，可见光的三重角色全在训练期（合成数据母本、冻结蒸馏教师、跨模态注意力的第二路键值），LLM 推理时整体丢弃、其 β 门推理时恒置 0——没有第二路能在热路损坏时顶上，「接管」在此无对象，与 present-but-damaged 正交。蒸馏蒸的是响应级三件套（框几何 GIoU、区域语义嵌入 InfoNCE、类别置信分布 KL），教师是冻结的 RGB Grounding DINO，开放词汇能力被「编译」进学生权重、推理期不保留任何跨模态通路；唯一活到推理期的自适应在文本侧（按与热区域特征的相似度现场选热子标签变体——由被检热特征自身驱动，又一例自指信号）。退化/传感器故障评测严格为零：7 个基准全是干净真实热图，文本先验只条件化分类相似度、不能恢复空间证据；作者在补充材料中自承连其合成训练数据都不能完全复现传感器特性（如噪声模式）。与 PFGF 构成补位两极：彼为推理期生成补位（有幻觉伪证据风险），此为训练期蒸馏补位（连伪冗余都没有，热传感器在役退化时无任何在线纠正机制）。数字口径有未澄清的硬伤：表 1 头条与表 2–4 最终模型在同名数据集上对不上、划分差异未注明，摘要的「一致 2–4% 增益」在 MFAD 不成立，引用须带警示；对照组只有零样本 RGB 开放词汇方法与全监督上限，没有任何闭集热/RGBT 检测器。

## 框架图

![Thermal-Det 方法主框图（原文 Figure 2）：左为跨模态蒸馏（冻结 RGB 教师教热学生），右为语言驱动的热适应（LLM caption 监督）](figs/thermal-det-language-guided-cross-modal-distillation-for-open-vocabulary-thermal-object-detection.webp)

*原文 Figure 2：左「Cross-Modal Distillation」——上路 RGB 图像经带冻结标记（雪花）的 RGB 编码器与解码器（教师），下路热红外图像经热编码器与解码器（学生）；编码器特征之间挂语义蒸馏损失，解码器 proposals/queries 之间挂框与置信蒸馏损失。右「Language-driven Thermal Adaptation」——底部 token 序列（proposals、视觉特征、热特征、文本 token）经自注意力、α/β 门控与交叉注意力（Q 来自 proposal、K/V 来自门控融合特征）后由 FFN 输出 caption 监督；下方虚线标出对象级与场景级两种监督的 token 跨度。图注末句明言 LLM 在推理时被丢弃（The LLM is discarded at inference）。图中未画出的部分：TTAH 文本校准头只有公式、无结构图；合成数据管线（F-ViTA 转换）亦未入图。图源：Ranasinghe et al., arXiv:2605.10130 Figure 2。*

## 问题定义

问题有三层。第一，RGB 开放词汇检测器（GLIP、Grounding DINO、LLMDet 等）的语义建立在可见光纹理与色彩统计上，直接迁移到热红外时因低纹理、发射率变化导致性能骤降，零样本基线数字即其量化。第二，热红外标注稀缺且昂贵，既有闭集热检测器只能覆盖 person/car 等少数类，无法扩展到开放世界；近期以 PEFT/adapter 把 RGB 开放词汇检测适配到热域的工作仍依赖有限热标注，且在适配中丢掉文本嵌入的泛化能力。第三，目标因此被设定为零热标注：训练只许用合成热数据与无标注配对数据，得到一个能以自然语言提示检测任意类别的热红外检测器。这里的「zero-shot」是跨域零样本，须钉死其含义：评测基准（FLIR、CAMEL、LLVIP 等）的热标注在训练中为零，但模型训练时见过大量合成热图与真实无标注配对热图；它不是 OV-COCO 式的 base/novel 类别划分协议，评测时查询的仍是各基准自带的少数原生类名，开放词汇性只由训练语料的 13k+ 类别与文本提示接口在原则上支撑，未以新类划分实验单独检验。

## 方法细节

基座为 Grounding DINO（Swin-T）全量微调（明确与 adapter/PEFT 路线对立）；文本侧为冻结 CLIP 文本编码器加可学习校准头 TTAH；训练期另挂一个插入 Thermal Adapters 的 LLM 做 caption 监督。总损失为检测、蒸馏、TTAH 与 caption 四路之和。(1) 基础检测与合成监督：检测器沿用 Grounding DINO 式开放词汇形式化，热图与冻结 CLIP 编码的文本查询输入，解码出框与相似度分；检测器卷积与注意力层全量微调以「内化热对比度模式」，文本空间保持冻结对齐。合成数据提供带标注监督：RGB 原图经 F-ViTA 逐像素翻译到热域构建 GroundingCap-1M（100 万+ 样本、继承 13k+ 类别），几何保持、原框与 grounding 文本原样复用，场景 caption 仅做删除 RGB 专属描述词（如颜色）的轻量过滤。(2) 跨模态蒸馏：教师是冻结的预训练 Grounding DINO（Swin-T）RGB 检测器（另比较了 MM-GDINO、LLMDet 作教师，相对增益以 MM-GDINO 最高，但适配后绝对值以 G-DINO 教师最好，故全篇采用 G-DINO）。教师在空间对齐的配对帧上对 RGB 图出伪标签，学生对同一场景的热图预测，三项蒸馏对齐响应级三件套：几何——学生框与教师框的 1 − GIoU；语义嵌入——区域特征的余弦 InfoNCE，把学生区域特征拉向教师区域特征；置信——类别概率分布的 KL，对齐教师的软决策边界。蒸馏损失只对配对批次激活，合成批次绕过。其实质是把 RGB 检测能力「编译」进学生权重，推理期不保留任何跨模态通路。(3) LLM 语言监督（仅训练期）：LLM 接收检测器（及训练时可得的 RGB 教师）投影后的特征 token，其每个 transformer 块的 FFN 子层插入 Thermal Adapters（LoRA 式残差 MLP），专攻温度语义而不动原语言知识；caption 头内有模态融合交叉注意力（MFCA），以可学习门 α、β 联合注意双模态特征。场景级 caption 加对象级 caption 构成语言监督。推理时 RGB 输入缺席，MFCA 以 β = 0 自动塌缩为纯热注意力；而更根本的是整个 LLM 及其 caption 头在推理时被丢弃，MFCA 只活在训练期。(4) TTAH 热–文本对齐头——唯一活到推理期的「语言引导」：它只动文本支路，冻结 CLIP 词嵌入拼接一个从可学习辐射属性库取的属性向量（库内为 hot、silhouette、reflective、high-emissivity 等辐射描述子），经两层 MLP + LayerNorm 得校准嵌入，以对比损失训练，并以漂移正则拴住不许偏离原 CLIP 流形；每类展开为多个热子标签，分类分取与当前图像热区域特征相似度最高的子标签——该机制在推理期同样运行，按实例现场选最贴合的辐射变体（如 hot person、silhouette vehicle）。部署形态小结：推理输入只有热红外图像 + 文本查询；可见光的三重角色（合成数据的母本、冻结蒸馏教师、MFCA 的第二路键值）全在训练期。实现为 MMDetection，输入 800×800，8× RTX A6000、batch 16、150K 迭代。

## 实验设置

协议为零样本跨域迁移：训练零热标注（合成带标注 + 配对无标注蒸馏，蒸馏与合成批次比 3:2）；配对数据为 M3FD、MMPD、Multi-Spectral Stereo，约 250K 对。在 7 个真实热基准上评测：FLIR-Aligned、FLIR-V2、CAMEL、SMOD、Utokyo、MFAD、LLVIP，指标为 COCO 风格 AP / AP50 / AP75。对照组为 RGB 开放词汇检测器 GLIP、T-Rex2、YOLO-World、G-DINO、MM-GDINO、LLMDet——统一 Swin-T 骨干、官方预训练权重、同一零样本热推理协议、不做任何微调；全监督参照为在各基准热标注上微调的 G-DINO，用以标示监督上限。对照组中没有任何闭集热红外或 RGB-T 融合检测器——比较只在「RGB 开放词汇检测直接迁移」这一族内进行。其余实验包括教师骨干对照（表 2）、组件增量消融（表 3）、TTAH 子标签选择策略（表 4）、FLIR-V2 类别/尺度分解、漂移权重敏感性与合成–真实域偏移 FID。

## 关键数字

头条（表 1，零样本）：FLIR-Aligned AP 0.372 / AP50 0.664 / AP75 0.359（LLMDet 0.359、MM-GDINO 0.354、G-DINO 0.337）；FLIR-V2 AP 0.096 / AP50 0.173 / AP75 0.091（G-DINO 0.081、LLMDet 0.048）；CAMEL AP 0.511 / AP50 0.758（G-DINO 0.482、LLMDet 0.383）；Utokyo AP 0.065 / AP50 0.137。补充三基准（表 S1）：SMOD AP 0.152 / AP50 0.267（G-DINO 0.135）；MFAD AP 0.100 / AP50 0.180——略低于 LLMDet 的 0.102，摘要「一致 2–4% AP 增益」在此数据集不成立，正文措辞降为 competitive；LLVIP AP 0.566 / AP50 0.856（MM-GDINO 0.561 / 0.800）。监督上限参照（全监督微调的 G-DINO）：FLIR-Aligned 0.414、FLIR-V2 0.200、CAMEL 0.478、SMOD 0.274、MFAD 0.194、Utokyo 0.129、LLVIP 0.706。注意 CAMEL 上零样本本文（0.511）反超全监督参照（0.478）；其余各集仍有大段差距，FLIR-V2 尤甚（0.096 vs 0.200）。FLIR-V2 类别/尺度分解（零样本 vs 全监督）：person 0.366 AP vs 0.512，car 0.35；而 motorcycle 0.006、traffic light 0.006 AP，motorcycle 的小目标 AP 仅 0.001——失败集中于小、稀有、热模糊类，属定位失败而非语义崩溃。教师对照（表 2，验证集口径）：适配相对增益 G-DINO +30.5% AP（FLIR）/ +6.9%（CAMEL），MM-GDINO +37.6% / +15.2%，LLMDet +26.8% / +3.9%；适配后绝对值 FLIR 0.261 / CAMEL 0.585（G-DINO 教师版）。口径警示（引用时必须连带）：表 1 头条（FLIR-Aligned 0.372、CAMEL 0.511）与表 2–表 4 的最终模型数字（FLIR-Aligned 0.261、CAMEL 0.585）在同名数据集上对不上；消融只交代在验证集上做、表 1 未注明划分，全文未解释此差异（推测为测试/验证划分不同，原文未写明）。又，补充材料称「只用合成数据训练的检测器在 FLIR-Aligned 达 0.372」，与表 1 全模型头条数值恰好相同，与表 3 的增量叙事难以自洽；§4.1 正文与表 S2 对 Utokyo 上 G-DINO 的数字亦有一处小不一致。头条数可引，但须标注其口径未澄清。

## 消融说明了什么

组件增量消融（表 3，FLIR-Aligned / CAMEL 验证集，AP）：零样本基线 0.200 / 0.547 → +场景级 caption +0.012 / +0.006 → +对象级 caption +0.028 / +0.020 → +蒸馏 +0.021 / +0.012，终值 0.261 / 0.585（累计 +0.061 / +0.038）。可读出的结论有三：其一，对象级区域–短语对齐的增益约为场景级全局 caption 的两倍——低纹理热图里，全局语义一致性不如局部 grounding 实在；其二，蒸馏的增益独立于 caption 监督存在，说明真实配对数据经教师带入的几何/软置信信息是合成数据给不了的；其三，单独去掉 TTAH（其余固定）使 FLIR-Aligned 掉 0.008 AP / 0.019 AP50 / 0.006 AP75——TTAH 是小而稳的文本侧增益，不承担主要迁移。TTAH 子标签选择策略（表 4，FLIR-Aligned AP）：平均池化 0.234 < 随机采样 0.248 < 置信门控 0.261——一个类该贴哪个辐射变体必须由实例的图文相似度现场决定，均匀混合会稀释判别性子标签；这是全文唯一带「按输入条件选择」色彩的机制，且它选的是文本变体，不是模态权重。漂移权重敏感性：峰值在 0.25（AP 0.259），去掉漂移约束伤泛化、权重过大（5）降至 0.226——文本校准需要「不许离开 CLIP 流形太远」的约束，校准自由度本身不是越多越好。消融的盲区同样明确：所有消融都在干净真实热图上进行，没有任何一项回答「输入热图本身退化或带传感器噪声时，哪项组件先失效、TTAH 的变体选择会不会被受损特征误导」——该问题不在本文的实验坐标系内。

## 局限

其一，退化/传感器故障评测为零：全文没有任何损坏条件实验——无注噪、无模糊/条纹/非均匀性/坏点/饱和等热传感器故障模型，无输入质量扫描；7 个评测基准全部是干净真实热图。其鲁棒性话语止于「域间隙」与「低对比度、弱纹理」等分布层面的困难，不涉及在役传感器退化。其二，作者自陈（补充材料 S7）：合成热数据不能完全复现传感器特性，如发射率变化、温度梯度与噪声模式，合成与真实热图间留有残余域间隙；蒸馏依赖 RGB 教师的精度，教师的错误会被学生继承并限制零样本上限；合成数据的区域级短语远多于图像级描述，语言侧监督不平衡，caption 易偏短。其三，绝对水平：FLIR-V2 上全场最优也只有 0.096 AP，零样本热检测离实用尚远；头条增益的参照系是同为零样本迁移的 RGB 开放词汇检测器，而不是在这些基准上训练过的闭集热检测/RGB-T 融合方法——后者完全不在对照组内。其四，数字口径：表 1 与表 2–表 4 的同名数据集数字不一致且未澄清（见关键数字末条），摘要「2–4% AP 一致增益」与 MFAD 实测（0.100 vs LLMDet 0.102）不符。其五，开放词汇性的验证方式：无 base/novel 划分，未见类别的检测能力只由基准原生类间接体现；TTAH 属性库规模、所用 LLM 的具体型号等关键配置正文未给出，复现信息不全。其六，训练成本与前提：150K 迭代、8× A6000、100 万合成图 + 约 250K 配对图，且整条管线以「存在大规模配对 RGB–热数据 + 可用的 RGB→热翻译模型（F-ViTA）」为前提——部署端省下的标注成本，部分转移到了训练端的数据与翻译管线建设上。

## 相关页面

- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
