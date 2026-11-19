---
title: "Modality Quality Estimation and Reliability-Aware Fusion"
lang: "en"
---

> Research theme survey (REQ-03), per-theme page; full text at [[en/themes/index|Research theme surveys]].

### Scope and Definitions

This theme includes work that explicitly estimates the quality, reliability, or uncertainty of each modality (or of each spatial location, or of each object) within the fusion pathway, and uses that estimate to actually modulate fusion: the estimation product must be an identifiable quantity (a mask, a weight, a descriptor, evidence parameters, etc.), and must be described by the paper itself as a measure of quality / reliability / uncertainty. The problem settings of the member papers are concentrated on cases in which fixed fusion fails under conditions such as modality degradation, modality imbalance, and collapse of cross-modal consistency (source: compare_fields.csv, the problem field of the member papers).

### Overview within the Corpus

Of the 102 papers, 12 have Yes in the quality_estimation column (source: compare_fields.csv, count of the quality_estimation column, 12/102). The estimation products and modulation modes of the members take the following forms:

- **Spatial quality masks / reliability maps**: a per-location quality quantity is predicted from the features of each modality itself, and then cross-gates the injection of the other modality's features or participation in expert routing, as in tian2025learning, hou2026leryolo, and zhang2021guided (source: compare_fields.csv, the qe_evidence fields of the above papers).
- **Parameter-free statistical descriptors**: no estimation network is trained; a reliability measurement is constructed directly from feature statistics and fixed with stop-gradient, as in the 7-dimensional spectral reliability descriptor of wu2026bridging (source: compare_fields.csv, the qe_evidence of wu2026bridging).
- **Uncertainty / confidence intervals derived from classification outputs**: fusion weights are generated from the energy scores of each modality's logits (zhang2023provable), or the classification margin |p1−p0| is used as a confidence weight multiplied onto region features (zhang2019weakly, zhang2025weakly) (source: compare_fields.csv, the qe_evidence fields of the above papers).
- **Evidence and per-object uncertainty**: view-level uncertainty u=K/S is given by Dirichlet evidence parameters and participates in the combination (han2021trusted); or uncertainty is defined at the per-object level, computed from cross-modal ground-truth box IoU and illumination values, and participates in output merging at inference time (sun2022dronebased) (source: compare_fields.csv, the qe_evidence fields of the above papers).
- **Self-referentiality of the estimator recurs**: the evidence pointers of multiple members note that the estimator is produced from the features of the modality being evaluated itself, with no independent calibration — the quality mask of tian2025learning is estimated from the degraded features themselves, and its correlation with the true degree of degradation has not been verified; the confidence of li2024multiscale is fully self-referential, with no explicit supervision or calibration; the reliability map of hou2026leryolo is self-supervised by feature consistency, and its absolute values are uncalibrated; the routing supervision of park2025resilient is sensor drop identity labels rather than continuous quality (source: compare_fields.csv, the qe_evidence and limitations fields of the above papers).
- **Contrast**: if gating is merely learned end-to-end from the two streams of features, with no independent quality estimation product, it is not counted in this theme, as in dong2025fusionmamba and shen2026multispectral (source: compare_fields.csv, No in the quality_estimation column and the qe_evidence of the two papers).

### Representative Work

(Source of this section: compare_fields.csv, the problem and fusion_strategy fields of each paper)

- wu2026bridging — Addressing the problem that reliability statistics in fusion are used and then discarded, it uses a parameter-free spectral reliability descriptor to drive frequency-domain fusion and reliability-conditioned expert routing.
- hou2026leryolo — Addressing the problem that whether local correspondence is trustworthy is unknown under unaligned RGB–infrared, it first performs uncertainty-aware alignment, and then a reliability map guides sparse MoE fusion.
- tian2025learning — It models modality degradation as extreme modality imbalance, and each modality cross-gates the injection of the other modality's features with a quality mask predicted by itself.
- zhang2023provable — For low-quality multimodal data, it uses energy-score uncertainty to drive decision-level dynamic weights, and provides a robustness theorem in the sense of generalization error.
- han2021trusted — Per sample and per view, it evaluates quality with Dirichlet evidence, and fuses multi-view classification at the evidence level via the Dempster combination rule.
- zhang2021guided — It uses inter-modal attention to output per-pixel modality weight pairs, whose ideal supervision is described by the paper itself as "per-pixel best modality quality", and learns the dynamic weighting of the two modalities in a fully adaptive manner.

### Open Problems (As Stated in the Papers)

- The quality mask is estimated from the degraded features themselves (self-referential), and its correlation with the true degree of degradation has not been verified; robustness is tested only at a single-point intensity, with no severity curve (source: the Limitations of tian2025learning).
- Uncertainty has not been quantitatively calibrated (no ECE); the inter-view conflict mass C is discarded in normalization, with no conflict alert quantity (source: the Limitations of han2021trusted).
- The routing supervision is drop identity rather than quality estimation, continuous degradation samples have not been seen in training, and there is no training signal for a modality that is present but corrupted and confidently wrong (source: the Limitations of park2025resilient).
- The theoretical guarantee depends on the "uncertainty–loss correlation" assumption, that correlation is trained out by regularization and is only moderate on NYU/SUN; the experiments have only 2 modalities, and ≥3 modalities have not been verified or proved (source: the Limitations of zhang2023provable).
- Binary frequency-band division and global correlation cannot characterize spatially non-stationary local reliability, and when one pathway is locally damaged, the global descriptor will be averaged out (source: the Limitations of wu2026bridging).
- The reliability map is self-supervised by the consistency of aligned features, is self-referential and has not been checked with offset labels, and its absolute value of about 0.33 is uncalibrated (source: the Limitations of hou2026leryolo).
- The "quality" of the inter-modal weights is only a proxy for relative task performance on clean data, with no absolute quality scale and no uncertainty and calibration verification; when both pathways are unreliable at the same time, a winner is still forced to be selected (source: the Limitations of zhang2021guided).

### Indexed papers

[[en/core/feature/dual-stream-cnn-yolo-based-detectors/learning-a-robust-rgb-thermal-detector-for-extreme-modality-imbalance|tian2025learning]], [[en/appendix/robust-dynamic-fusion-general-multimodal/resilient-sensor-fusion-under-adverse-sensor-failures-via-multi-modal-expert-fusion|park2025resilient]], [[en/appendix/robust-dynamic-fusion-general-multimodal/provable-dynamic-fusion-for-low-quality-multimodal-data-qmf|zhang2023provable]], [[en/appendix/robust-dynamic-fusion-general-multimodal/trusted-multi-view-classification-tmc|han2021trusted]], [[en/core/feature/attention-transformers-foundation-models/guided-attentive-feature-fusion-for-multispectral-pedestrian-detection-gaff|zhang2021guided]], [[en/core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-cross-modal-learning-for-multispectral-pedestrian-detection-ar-cnn|zhang2019weakly]], [[en/core/feature/dual-stream-cnn-yolo-based-detectors/weakly-aligned-feature-fusion-for-multimodal-object-detection|zhang2025weakly]], [[en/core/feature/dual-stream-cnn-yolo-based-detectors/drone-based-rgb-infrared-cross-modality-vehicle-detection-via-uncertainty-aware-learning-ua-cmdet|sun2022dronebased]], [[en/core/feature/dual-stream-cnn-yolo-based-detectors/multiscale-cross-modal-homogeneity-enhancement-and-confidence-aware-fusion-for-multispectral-pedestrian-detection|li2024multiscale]], [[en/core/surveys/when-pedestrian-detection-meets-multi-modal-learning-generalist-model-and-benchmark-dataset-mmpedestron|zhang2024when]], [[en/core/feature/attention-transformers-foundation-models/bridging-multimodal-fusion-and-expert-routing-via-spectral-reliability-descriptors-for-robust-object-detection|wu2026bridging]], [[en/core/feature/dual-stream-cnn-yolo-based-detectors/ler-yolo-reliability-aware-expert-routing-for-misaligned-rgb-infrared-uav-detection|hou2026leryolo]]
