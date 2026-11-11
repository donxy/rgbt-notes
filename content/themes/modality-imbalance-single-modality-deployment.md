---
title: "模态失衡、训练动态与单模态部署"
---

> 研究主题综述（REQ-03）分主题页；全文见 [[themes/index|研究主题综述]]。

### 范围与定义

本主题由 papers.csv 的 modality-imbalance 与 thermal-only-inference 两标签的并集构成，共 14 篇，其中 core 10 篇、附录 4 篇（来源：本主题 pack 成员名单与 list 字段统计，14 篇）。「失衡」在成员间有三种不同所指：联合训练中主导模态对弱模态的优化压制；推理期两模态贡献随条件（光照、退化）系统性翻转；以及联合训练中单模态学习不充分、使融合上限被单模态表征质量拖住。与之相连的另一端是部署形态：训练可用配对数据、推理只用一路（多为热红外）单模态运行。

### 库内图景

- 训练期优化失衡是附录成员的共同问题设定：多模态梯度与单模态梯度方向冲突、主导模态在梯度幅值与方向上压制慢学模态，使融合甚至劣于最佳单模态（例：peng2022balanced、fan2023pmr、wei2024mmpareto）（来源：上述各篇 problem）。
- 对应的再平衡手段都是训练期插件，不改变推理结构：在线梯度调制、原型级损失再平衡、修正的 Pareto 梯度整合、模态交替训练加 KL 调和，推理期或无机制、或仍是基座的拼接/求和/等权分数求和（例：peng2022balanced、fan2023pmr、hua2024reconboost）（来源：上述各篇 fusion_strategy）。
- 推理期贡献失衡在 core 成员中以两种形态出现：把模态退化统一建模为极端失衡、以逐模态质量掩码交叉门控应对；或把失衡索引到昼夜光照、以差分融合加光照门控应对（例：tian2025learning、zhou2020improving）（来源：上述各篇 problem 与 fusion_strategy）。
- 「融合退化」是另一条归因路径：某些目标单模态能检出、多模态反而漏检，被归因于联合训练中单模态学习不充分或正样本梯度被耦合项抑制，对策是训练期的单模态蒸馏或梯度解耦，推理期移除（例：zhao2025rethinking、shao2025representation）（来源：上述各篇 problem 与 fusion_strategy）。
- 单模态部署构成主题的另一端：训练期用配对数据、推理只输入任意一路；训练与测试都只用热红外、靠生成伪可见光补回知识；训练期由 RGB 教师蒸馏、推理仅热红外，三种形态的共性是推理期不存在双路融合（例：medeiros2025mixed、li2025pseudo、ranasinghe2026thermaldet）（来源：上述各篇 problem 与 fusion_strategy）。
- 训练动态一类的工作普遍没有损坏/缺失维度的评测：多篇成员在局限中自述缺失、损坏、故障评测为零，其结论只适用于训练完整干净、测试分布不变的设定（例：peng2022balanced、fan2023pmr、wei2024mmpareto、shao2025representation）（来源：上述各篇 Limitations）。

### 代表工作

- peng2022balanced：以在线梯度调制（OGM-GE）在训练期再平衡联合训练，是梯度级再平衡的代表作，不改变融合与推理结构（来源：peng2022balanced 的 problem 与 fusion_strategy）。
- fan2023pmr：原型级模态再平衡（PMR），以训练期损失级插件形式验证于拼接、求和、FiLM、门控等多种基座融合算子（来源：fan2023pmr 的 problem 与 fusion_strategy）。
- hua2024reconboost：模态交替训练加 KL 调和正则实现模态调和，并证明其与梯度提升的等价性；推理期为各模态学习器分数等权求和（来源：hua2024reconboost 的 problem 与 fusion_strategy）。
- zhao2025rethinking：命名并归因 Fusion Degradation 现象——单模态学习不充分拖住融合上限；以仅训练期保留的单模态蒸馏加轻量光照感知融合应对（来源：zhao2025rethinking 的 problem 与 fusion_strategy）。
- medeiros2025mixed：训练期以输入级 patch 马赛克混合加梯度反转实现模态不可区分化，推理只输入任意一路即可检测，训练技巧换单模态部署（来源：medeiros2025mixed 的 problem 与 fusion_strategy）。
- ranasinghe2026thermaldet：RGB 教师响应级蒸馏加语言监督，零热红外标注得到开放词汇热检测，推理期仅热红外单模态（来源：ranasinghe2026thermaldet 的 problem 与 fusion_strategy）。

### 开放问题（论文自述）

- 作者自承：加梯度调制后，联合模型内的单模态表现仍不超过最佳单模态模型，且没有「融合不劣于丢弃一路」式的下限或对照实验设计；缺失、损坏、故障、域偏移评测全部为零（来源：peng2022balanced 的 Limitations）。
- 再平衡不等于丢弃一路：CG-MNIST 上再平衡后的融合精度仍远低于灰度单模态；其失衡量度自指——ρ_t 与原型来自正在被训练的编码器自身表示，未与真实单模态精度做校准对照（来源：fan2023pmr 的 Limitations）。
- 模态无关检测没有性能下界保证，信息论论证依赖两传感器噪声相似这一未验证假设，逐路看 RGB 侧仍逊于专门训练的模型（来源：medeiros2025mixed 的 Limitations）。
- Fusion Degradation 的案例数未归零；其光照加权权重下限为 0.3，RGB 彻底失效的区域仍被强制保留至少 30% 的 RGB 特征，模态在推理时真的被损坏时方法是否成立没有证据（来源：zhao2025rethinking 的 Limitations）。
- 去偏结构不对称：只剪热红外一条直接效应链、并预设两个单模态头可信；输入被腐化时模式判别可被翻转，框架无防护、也无讨论（来源：kim2024causal 的 Limitations）。
- 伪可见光是热红外输入的确定性函数、不是独立证据，两路无从交叉校验，构成单点故障结构；生成质量由冻结的生成先验决定，检测损失无法纠正生成错误（来源：li2025pseudo 的 Limitations）。

### 相关论文索引

[[core/feature/dual-stream-cnn-yolo-based-detectors/lraf-net|fu2024lrafnet]], [[core/feature/dual-stream-cnn-yolo-based-detectors/learning-a-robust-rgb-thermal-detector-for-extreme-modality-imbalance|tian2025learning]], [[appendix/modality-imbalance-missing-modality-learning-general/mmpareto|wei2024mmpareto]], [[appendix/modality-imbalance-missing-modality-learning-general/reconboost|hua2024reconboost]], [[appendix/modality-imbalance-missing-modality-learning-general/pmr-prototypical-modal-rebalance|fan2023pmr]], [[appendix/modality-imbalance-missing-modality-learning-general/ogm-ge|peng2022balanced]], [[core/feature/dual-stream-cnn-yolo-based-detectors/improving-multispectral-pedestrian-detection-by-addressing-modality-imbalance-problems-mbnet|zhou2020improving]], [[core/feature/dual-stream-cnn-yolo-based-detectors/rethinking-multi-modal-object-detection-from-the-perspective-of-mono-modality-feature-learning-m2d-lif|zhao2025rethinking]], [[core/feature/attention-transformers-foundation-models/mixed-patch-visible-infrared-modality-agnostic-object-detection-mipa|medeiros2025mixed]], [[core/feature/dual-stream-cnn-yolo-based-detectors/causal-mode-multiplexer-a-novel-framework-for-unbiased-multispectral-pedestrian-detection|kim2024causal]], [[core/feature/dual-stream-cnn-yolo-based-detectors/representation-space-constrained-learning-with-modality-decoupling-for-multimodal-object-detection|shao2025representation]], [[core/surveys/wise-od|medeiros2026wiseod]], [[core/feature/state-space-models-mamba/pseudo-visible-feature-fine-grained-fusion-for-thermal-object-detection-pfgf|li2025pseudo]], [[core/feature/attention-transformers-foundation-models/thermal-det-language-guided-cross-modal-distillation-for-open-vocabulary-thermal-object-detection|ranasinghe2026thermaldet]]
