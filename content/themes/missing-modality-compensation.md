---
title: "缺失模态补偿：生成、替代与先验重建"
---

> 研究主题综述（REQ-03）分主题页；全文见 [[themes/index|研究主题综述]]。

### 范围与定义

本主题收录在推理期对缺失模态信息做重建或替代的工作：当整模态缺席时，以跨模态生成、共享表征顶替或先验重建补齐缺失槽位，再沿同一融合通路完成任务。成员论文的问题设定均为训练期与/或测试期出现整模态缺失、需以单个模型处理全部缺失组合（来源：compare_fields.csv，成员论文 problem 字段）。

### 库内图景

102 篇论文中，compensation 列为 Yes 的共 3 篇，是四个比较维度中成员最少的一列（来源：compare_fields.csv，compensation 列统计，3/102）。三篇成员恰好对应三条不同的补齐路线：

- **共享表征替代（不生成）**：缺失模态在解码器中的槽位被直接填入幸存模态 shared 特征的无权均值，无需训练生成器（wang2023multimodal）（来源：compare_fields.csv，wang2023multimodal 的 compensation_evidence）。
- **先验重建**：测试时缺一路即开启重构网络，由可用模态预测先验权重 ω 的分布参数，重构特征为 K-means 模态先验的随机加权组合，在推理期补齐缺失槽位（ma2021smil）（来源：compare_fields.csv，ma2021smil 的 compensation_evidence）。
- **跨模态生成**：推理期由热红外输入经冻结的 Pearl-GAN 生成伪可见光图像与潜码 z，再与热特征融合检测，构成对整体缺席的可见光模态的生成式替代（li2025pseudo）（来源：compare_fields.csv，li2025pseudo 的 compensation_evidence）。
- **三篇共同的失效模型是二值缺席**：成员的 limitations 均指出其处理对象是整模态有/无，对在场但损坏、不可信的模态没有对应机制（wang2023multimodal、ma2021smil、li2025pseudo）（来源：compare_fields.csv，上述论文 limitations 字段）。
- **对照（非成员）**：训练期路线不构成推理期补偿——medeiros2025mixed 的 patch 混合仅发生在训练期，推理为纯单模态输入、不由另一路补足信息（来源：compare_fields.csv，medeiros2025mixed 的 compensation_evidence，compensation 列为 No）；单流结构则根本不存在第二条通路可供重建或替代（han2026moda）（来源：compare_fields.csv，han2026moda 的 compensation_evidence，compensation 列为 No）。

### 代表工作

（本节来源：compare_fields.csv 各论文 problem 与 fusion_strategy 字段）

- wang2023multimodal — 以 shared-specific 特征建模让单个非专用模型处理全部缺失组合，缺失时以共享表征顶替、无需生成重构，解码器恒定消费全部模态槽位。
- ma2021smil — 面向训练样本多达 90% 只有一个模态的严重缺失设定，以贝叶斯元学习与先验重构让统一模型处理全部缺失情形。
- li2025pseudo — 在训练与测试都只用热红外输入的设定下，借助生成的伪可见光补回可见光知识，热红外与伪可见光在骨干输入端拼接后再融合生成潜码。

### 开放问题（论文自述）

- 顶替规则静默假设幸存模态健康，均值不做筛选，带噪幸存特征会同时污染自身槽位与顶替向量；模态数 N=2 时顶替退化为复制幸存模态的 shared 特征、不产生新证据（来源：wang2023multimodal 的 Limitations）。
- 失效模型只有二值缺席一档，无任何「在场但损坏」的评测，重构开关由「缺没缺」的二值事实决定（来源：ma2021smil 的 Limitations）。
- 重构保真度无从核查：只有下游分类指标，无重构距离、失败案例或先验个数敏感性（来源：ma2021smil 的 Limitations）。
- 生成质量由冻结的生成先验决定、检测损失无法纠正生成错误，先验训练域直接影响结果且跨域失配未评测（来源：li2025pseudo 的 Limitations）。
- 伪可见光是热红外输入的确定性函数、非独立证据，两路无从交叉校验，构成单点故障结构（来源：li2025pseudo 的 Limitations）。

### 相关论文索引

[[appendix/modality-imbalance-missing-modality-learning-general/shaspec|wang2023multimodal]], [[appendix/modality-imbalance-missing-modality-learning-general/smil|ma2021smil]], [[core/feature/state-space-models-mamba/pseudo-visible-feature-fine-grained-fusion-for-thermal-object-detection-pfgf|li2025pseudo]]
