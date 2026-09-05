# GoldGuard AI Evaluation Methodology

This document outlines the validation framework used to measure model accuracy, consistency, explainability, and hallucination resistance in GoldGuard.

## Core Evaluation Parameters

1. **Invoice Extraction Correctness**:
   - **Metric**: Exact match of parsed numeric fields (weights, prices) vs. ground truth.
   - **Tolerance**: 0% error rate for numbers. Text matching allows string distance similarity.

2. **Jewellery Recognition Consistency**:
   - **Metric**: Ability to consistently classify jewelry categories (e.g. necklace, ring) and styles (traditional, contemporary).
   - **Test Set**: 10 standard test images with known labels.

3. **Similarity Engine Groundedness**:
   - **Metric**: Correct similarity classification (Highly Similar vs. Different) based on metadata attributes.
   - **Validation**: Deterministic checks verify that items with similar weights, styles, and categories receive high similarity scores, and vice versa.

4. **Recommendation Personalization & Integrity**:
   - **Metric**: Recommending only items that fill gaps or complement existing items, without recommending categories the user already over-owns (redundancy prevention).

5. **Strict Calculation Verification**:
   - **Metric**: 100% correct financial planning numbers.
   - **Validation**: Checked via unit tests comparing Python calculations with expected values.
