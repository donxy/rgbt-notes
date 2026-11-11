---
title: "Pseudo Visible Feature Fine-Grained Fusion for Thermal Object Detection (PFGF)"
paper_id: "li2025pseudo"
authors: "Li et al."
year: "2025"
venue: "CVPR"
list: "core"
scope: "Related"
section: "Feature-Level Fusion"
subsection: "State-Space Models (Mamba)"
fusion_level: "feature"
architecture: "Mamba"
tags: ["mamba", "missing-modality", "thermal-only-inference"]
paper_link: "https://openaccess.thecvf.com/content/CVPR2025/papers/Li_Pseudo_Visible_Feature_Fine-Grained_Fusion_for_Thermal_Object_Detection_CVPR_2025_paper.pdf"
code_link: "https://github.com/liting1018/PFGF"
notes_basis: "full-text"
req04_quality_estimation: "No"
req04_suppression: "No"
req04_compensation: "Yes"
req04_robustness_evaluation: "No"
---

**一句话要点**：Fuses thermal features with pseudo-visible features via a graph-Mamba module; training uses paired data but testing is thermal-only.

## 点评

部署形态钉死在缺失端：训练与测试都只输入热红外，可见光整体缺席、由生成模型补位——处理的是 missing 而非 damaged。伪可见光特征来自第一阶段 Pearl-GAN 的热→可见翻译先验（潜码 z），第二阶段 GAN 冻结、检测网络只有标准检测损失，没有配对特征蒸馏或对齐/重建损失，生成质量不可被检测目标纠正、且随先验训练域变化（LLVIP 最佳数字 67.3 须换用 LLVIP 训练的先验，未加星号的默认配置为 66.8，引用须带口径）。真正的跨模态融合只发生一处——最低层的 Inter-Mamba 把 z 与热特征做 SSM 隐状态门控相加，高层靠通道注意力逐级传播。两路「模态」都是同一热输入的确定性函数、不构成独立证据：热红外一旦退化，骨干拼接输入、生成潜码与伪可见光图像三处同时被污染，生成器还会把受损证据翻译成貌似合理的错误内容（结构推断，作者无相关实验）。干净数据上只输热红外的 PFGF 在 FLIR mAP 47.1 追平真实双路 Fusion-Mamba 的 47.0、LLVIP 67.3 反超其 64.3，但全在干净基准、无任何退化评测。

## 框架图

![PFGF 方法主框图（原文 Figure 2）：热红外单输入 + Pearl-GAN 伪可见光生成 + Graph-Mamba 融合的总体框架](figs/pseudo-visible-feature-fine-grained-fusion-for-thermal-object-detection-pfgf.webp)

*原文 Figure 2：(a) 框架总览——热红外图像一路进入 Pearl-GAN（编码器 ε → 潜码 z → 解码器 μ → 伪可见光图像），热红外与伪可见光经通道拼接送入骨干，c^3/c^4/c^5 各过 VMamba 块得 f^3/f^4/f^5，与 z 一同进入 Graph-Mamba 模块输出 g^3/g^4/g^5，与 f^i 逐元素相加后经 Neck 与 YOLOX 解耦头输出结果；(b) Graph-Mamba 融合模块——z 节点经 Inter-Mamba 与 f^3 子图融合，leader node g^3/g^4 逐级引导 f^4/f^5 子图的 CKI 级联；(c) Inter-Mamba 块的双路 Norm → Linear/Conv → SSM + 门控结构；(d) VMamba 块结构。图源：Li et al., CVPR 2025，Figure 2。*

## 问题定义

设定先钉死（§3.1、§3 总览）：训练集由带标签的热红外图像集与未配对可见光图像集组成，测试集只含热红外图像——原文总览明言训练与测试都只用热红外图像。目标是在测试时仅用热红外输入的前提下，把可见光知识补回来。动机有两层：其一，真双路多光谱检测训练与推理都需配对的可见光–热红外图像，硬件成本高且要求精确对齐，限制落地；热红外单模态又缺纹理细节（白天尤甚）。其二，既有图像域翻译路线（如 TIRDet）受遮挡与生成图像噪声之苦——生成的可见光图像本身不可靠、会引入噪声损害检测精度，且既有注意力融合没有充分建模伪可见光与热红外之间的细粒度关系。须分清：这里要解决的是可见光整体缺席（missing），不是可见光在场但损坏（damaged）——测试时根本不存在真实可见光输入；生成图像的不可靠只是动机叙述，从未被操作化为评测条件。

## 方法细节

整体管线（图 2(a)）：热红外图像 → 预训练 Pearl-GAN 生成伪可见光图像与潜码 z → 骨干对拼接输入提多层特征 → VMamba 增强 → GMF 图融合 → 残差相加 → Neck → YOLOX 解耦检测头。生成与监督：先验模型即 Pearl-GAN（热→可见翻译模型），编码器潜码 z 被定义为生成特征，解码器给出白天风格的伪可见光图像。关键点是监督来源：检测阶段 Pearl-GAN 参数冻结，检测网络只用标准检测损失训练，没有任何把 z 或伪可见光图像与真实可见光特征对齐的损失——伪可见光的监督完全来自第一阶段 Pearl-GAN 自身的翻译训练，是前置的图像域翻译监督，不是配对特征蒸馏，也不是与检测联合优化的重建损失。判别特征：CSPDarknet 骨干的输入是通道拼接（1 通道热红外 + 3 通道伪可见光），故骨干特征本身已是双源混合特征；每层再过 VMamba 块细化（MEM）。图构造：对 f^3、f^4、f^5 与 z 各建一个子图，节点由多粒度池化副本（金字塔池化到 3 种尺度 → 1×1 卷积降维 → 双线性上采样）生成；边只建子图内边，由节点差分经卷积学得，节点以 Sigmoid(边) 为权重聚合邻居、迭代 3 次、用 GRU 更新；子图之间不建边，跨子图信息流靠 leader node。Inter-Mamba 是唯一的跨模态融合点：z 的节点与 f^3 的节点各自投影到 SSM 隐状态空间，隐状态相加后被由 f^3 另生成的门控权重 r 门控、投影回并残差写回；f^4、f^5 子图不直接接触 z，生成信息向高层走的是 CKI 级联——每个子图聚合出 leader node，以通道注意力（GAP + Sigmoid）门控下一子图的全部节点。细粒度指同一特征层内多粒度池化副本构成的图节点之间的融合，不是像素级或实例级。全程没有模态级权重、没有可靠性估计——因为根本不存在第二路真实输入。训练为两阶段：先训 Pearl-GAN，再冻结它训其余部分；SGD，lr 5e-4，batch 4，输入 640×640，三个数据集均训 8 epochs。

## 实验设置

数据集：FLIR-aligned（5,142 对，训练 4,129 / 测试 1,013，3 类）；LLVIP（15,488 对，训练 12,025 / 测试 3,463，单类行人，极暗环境采集）；Autonomous Vehicles（训练 6,009 / 测试 1,503，5 类）。配对数据只用于 Pearl-GAN 的先验训练与对比方法的评测，PFGF 检测管线的输入在训练与测试时均为热红外（加由其生成的伪可见光）。指标为 mAP（IoU 0.50:0.05:0.95）、mAP50、mAP75。对比方法分两组：热单模态组（训练用配对、测试只用热红外，含同属可见光知识辅助路线的 IAH、DIP、TIRDet、IDA）与多光谱组（训练与测试都用真实双路输入，含 CFR、GAFF、CMX、Fusion-Mamba 等）。表 1–3 的对比数字为作者转引各原文，例外是 LLVIP 上 TIRDet 被作者用同管线复现（记 TIRDet*，PFGF 对应记 PFGF*，用 LLVIP 训练的 Pearl-GAN；未加星号的 PFGF 在 LLVIP 上用 FLIR 训练的 Pearl-GAN）。评测足迹：只有三个干净基准上的标准检测指标，没有任何退化/损坏评测——无对热红外输入加噪/模糊/遮挡的压力测试，无昼夜分组数字（图 3 只有 leader node 有无的定性可视化）。随机种子固定为 0、单次运行，无方差报告。

## 关键数字

FLIR（表 1，mAP50 / mAP75 / mAP）：PFGF（仅热输入）84.8 / 44.6 / 47.1。热单模态组：YOLOX-L 78.1 / 39.4 / 42.6，TIRDet 81.4 / 41.1 / 44.3，IDA 81.1 / 43.4 / 46.3。多光谱组（真实双路）：Fusion-Mamba 84.9 / – / 47.0，IGT 85.0 / 36.9 / 43.6，CMX 82.2 / 37.1 / 42.3——只输入热红外的 PFGF 在 mAP 与 mAP75 上高于全部真实双路方法，mAP50 为全场第二。LLVIP（表 2）：PFGF 96.6 / 77.9 / 66.8，PFGF*（LLVIP 训练先验）96.9 / 78.4 / 67.3；TIRDet 96.3 / 73.1 / 64.2，TIRDet* 96.8 / 74.7 / 65.2；YOLOX-L 95.2 / 72.7 / 63.6；Fusion-Mamba 97.0 / – / 64.3（mAP50 全场最高）。AV（表 3）：PFGF 78.8 / 46.6 / 45.9，对 IDA（73.1 / 43.8 / 43.1）三项分别 +5.7 / +2.8 / +2.8（该表未列多光谱组）。融合策略对照（表 5，同一框架内换融合算子，mAP / mAP50，FLIR）：Add 42.6/77.5、Concat 43.7/79.9、CMA 44.3/81.4、MMFT 44.6/82.1、GIM 46.0/81.8、FMB 45.7/82.4、GMF（本文）47.1/84.8，LLVIP 与 AV 两列同序、GMF 均为最高。效率（表 6，FLIR）：把全部 VMamba/Inter-Mamba 换成 Transformer 的变体 GMTF 为 mAP 46.2、604.1 GFLOPs、71.8M 参数；PFGF 为 47.1、409.0 GFLOPs、66.9M 参数。

## 消融说明了什么

消融在三个数据集上做（表 4，mAP；LLVIP 列为 PFGF* 配置）。全模型：FLIR 47.1 / LLVIP 67.3 / AV 45.9。去掉 Pearl-GAN（只剩热红外、无任何生成信息）：45.2 / 65.0 / 44.4，FLIR 与 LLVIP 上跌幅最大（−1.9 / −2.3）——生成流在干净数据上确有实打实的贡献，量级约 2 个点；同时这也是全文唯一与模态可用性相关的消融，它测的是生成流整体有无，不是生成流被污染时会怎样。去掉 GMF（增强特征直送检测头）：45.6 / 65.6 / 44.3，跌幅 −1.5 / −1.7 / −1.6。去掉 Inter-Mamba（z 不与 f^3 融合）：45.9 / 66.2 / 45.1；去掉 CKI（不做低层→高层级联）：46.1 / 66.4 / 45.3——Inter-Mamba 的贡献大于 CKI；作者据此称 Inter-Mamba 能过滤冗余可见光信息，但这是对消融差值的解释而非机制证据：门控 r 没有任何可靠性监督，其过滤行为未被单独验证。去掉 MEM：46.0 / 66.1 / 45.4，各数据集跌幅不一致。leader node 的实验（图 3）只有定性可视化（去掉后误检增多、置信度降低），无数字。表 5 说明在生成特征 + 判别特征的融合上，图 + Mamba 组合优于注意力（CMA）、Transformer（MMFT）、纯 GNN（GIM）与纯 Mamba（FMB）；作者对 FMB 落败的解释是其不适应生成可见光信息的不可靠性，同样是叙述性归因，无生成质量分层实验支撑。

## 局限

作者无独立局限节，结论只宣称最优性能；引言承认生成可见光图像不可靠、会引入噪声与遮挡问题，但全文未给出任何量化这一不可靠性的实验。结构性局限有四。其一，先验依赖且不可纠正：生成质量由冻结的 Pearl-GAN 先验决定，检测损失无法回头修正生成错误；先验的训练域直接影响结果——LLVIP 上须换用 LLVIP 训练的 Pearl-GAN 才得到最佳数字（67.3 vs 默认配置 66.8），跨域部署时先验失配的影响未评测。其二，单点故障结构：伪可见光图像与潜码 z 都是热红外输入的确定性函数，两路模态不是两份独立证据，伪可见光流不可能与热红外流分歧，也就无从交叉校验；热红外一旦退化，骨干拼接输入、生成潜码与伪可见光图像三处会同时受影响（此为结构推断，作者未做相关实验）。其三，污染从第一层进入：骨干输入是热红外与伪可见光的通道拼接，伪可见光的伪影在骨干入口即与热红外混合，后续模块处理的已是混合特征；管线中没有位置能把生成流整体关掉或降权——Inter-Mamba 的门控 r 与 CKI 的通道注意力都由检测损失在干净数据上学得，无可靠性语义、无输入相关的健康度估计。其四，评测面窄：三个干净基准、单次运行无方差、训练仅 8 epochs，无昼夜分组、无损坏/缺失压力测试；表 1–3 对比数字除 TIRDet* 外均为转引，各原文训练协议并不一致。可复现性缺口：GRU 更新细节与超参数敏感性在未随开放版发布的附录中，Pearl-GAN 的训练细节需回溯其原文。

## 相关页面

- 主题综述：[[themes/missing-modality-compensation|缺失模态补偿：生成、替代与先验重建]]
- 主题综述：[[themes/modality-imbalance-single-modality-deployment|模态失衡、训练动态与单模态部署]]
- 对比表：[[compare|REQ-04 四维对比表]]
