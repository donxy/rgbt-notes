---
title: "Missing-Modality Compensation: Generation, Substitution, and Prior-Based Reconstruction"
lang: "en"
---

> Research theme survey (REQ-03), per-theme page; full text at [[en/themes/index|Research theme surveys]].

### Scope and Definition

This theme collects work that reconstructs or substitutes missing modality information at inference time: when an entire modality is absent, the missing slot is filled by cross-modal generation, shared-representation substitution, or prior-based reconstruction, and the task is then completed along the same fusion pathway. The problem setting of the member papers is in all cases the absence of an entire modality during training and/or testing, requiring a single model to handle all missing combinations (source: compare_fields.csv, the problem field of the member papers).

### Landscape in the Library

Of the 102 papers, 3 have compensation marked as Yes, the smallest number of members among the four comparison dimensions (source: compare_fields.csv, statistics for the compensation column, 3/102). The three members correspond exactly to three different routes for filling in the missing information:

- **Shared-representation substitution (without generation)**: The slot of the missing modality in the decoder is directly filled with the unweighted mean of the shared features of the surviving modality, without the need to train a generator (wang2023multimodal) (source: compare_fields.csv, the compensation_evidence for wang2023multimodal).
- **Prior-based reconstruction**: At test time, the reconstruction network is activated as soon as one pathway is missing; the available modality predicts the distribution parameters of a prior weight ω, and the reconstructed feature is a stochastically weighted combination of K-means modality priors, filling the missing slot at inference time (ma2021smil) (source: compare_fields.csv, the compensation_evidence for ma2021smil).
- **Cross-modal generation**: At inference time, a frozen Pearl-GAN generates a pseudo-visible image and a latent code z from the thermal input, which are then fused with thermal features for detection, constituting a generative substitution for the entirely absent visible modality (li2025pseudo) (source: compare_fields.csv, the compensation_evidence for li2025pseudo).
- **The common failure model of the three papers is binary absence**: The limitations of the members all point out that what they address is the presence/absence of an entire modality, with no corresponding mechanism for a modality that is present but damaged and untrustworthy (wang2023multimodal, ma2021smil, li2025pseudo) (source: compare_fields.csv, the limitations field of the above papers).
- **Contrast (non-members)**: A training-time route does not constitute inference-time compensation — the patch mixing of medeiros2025mixed occurs only during training, inference takes purely single-modality input and does not supplement information from another pathway (source: compare_fields.csv, the compensation_evidence for medeiros2025mixed, with the compensation column marked as No); a single-stream structure, in turn, has no second pathway at all that could be reconstructed or substituted (han2026moda) (source: compare_fields.csv, the compensation_evidence for han2026moda, with the compensation column marked as No).

### Representative Work

(Sources for this section: compare_fields.csv, the problem and fusion_strategy fields of each paper)

- wang2023multimodal — Uses shared-specific feature modelling to let a single non-specialised model handle all missing combinations; when a modality is missing, a shared representation substitutes for it without generative reconstruction, and the decoder constantly consumes all modality slots.
- ma2021smil — Addresses a severe missing-modality setting in which up to 90% of the training samples have only one modality, and uses Bayesian meta-learning and prior-based reconstruction to let a unified model handle all missing cases.
- li2025pseudo — Under a setting in which only thermal input is used in both training and testing, recovers visible knowledge with the help of a generated pseudo-visible image; the thermal and pseudo-visible images are concatenated at the input end of the backbone and then fused to generate a latent code.

### Open Questions (As Stated by the Papers Themselves)

- The substitution rule silently assumes that the surviving modality is healthy; the mean involves no screening, so noisy surviving features contaminate both their own slot and the substitution vector; when the number of modalities is N=2, substitution degenerates into copying the shared features of the surviving modality and produces no new evidence (source: the Limitations of wang2023multimodal).
- The failure model has only the single level of binary absence, with no evaluation of "present but damaged" at all; the reconstruction switch is determined by the binary fact of whether a modality is missing (source: the Limitations of ma2021smil).
- Reconstruction fidelity cannot be verified: only downstream classification metrics are available, with no reconstruction distance, failure cases, or sensitivity to the number of priors (source: the Limitations of ma2021smil).
- Generation quality is determined by a frozen generative prior, and the detection loss cannot correct generation errors; the training domain of the prior directly affects the results, and cross-domain mismatch has not been evaluated (source: the Limitations of li2025pseudo).
- The pseudo-visible image is a deterministic function of the thermal input, not independent evidence; the two pathways cannot cross-validate each other, constituting a single-point-of-failure structure (source: the Limitations of li2025pseudo).

### Indexed papers

[[en/appendix/modality-imbalance-missing-modality-learning-general/shaspec|wang2023multimodal]], [[en/appendix/modality-imbalance-missing-modality-learning-general/smil|ma2021smil]], [[en/core/feature/state-space-models-mamba/pseudo-visible-feature-fine-grained-fusion-for-thermal-object-detection-pfgf|li2025pseudo]]
