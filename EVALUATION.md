# GoldGuard Evaluation Metrics & Results

This file documents the evaluation metrics and benchmark scenarios used to verify the AI accuracy, reasoning performance, and mathematical calculations of GoldGuard.

## 1. Mathematical and Financial Calculations
All financial calculations are tested to be 100% deterministic and free of floating-point inaccuracies.

### Scenario: savings calculation
- **Inputs**:
  - Target gold purchase cost: SGD 6,000
  - Existing portfolio contribution: SGD 2,000
  - Target timeline: 12 months
- **Expected Outputs**:
  - Funding gap: SGD 4,000
  - Monthly savings requirement: SGD 333.33
  - Weekly savings requirement: SGD 76.92
- **Result**: Passed (Validated via deterministic unit tests)

---

## 2. Invoice OCR Extraction (Gemini Multimodal)
We test the accuracy of extracting fields from standard retail gold invoices.

| Field | Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|
| Purity | "22 Carat gold" | "22K" | "22K" | Passed |
| Gross Weight | "Gross wt: 38.400 g" | 38.4 | 38.4 | Passed |
| Making Charges | "Making: SGD 450" | 450.00 | 450.00 | Passed |
| Date | "Invoice Date: 12/06/2023" | "2023-06-12" | "2023-06-12" | Passed |

- **Hallucination Resistance**: Verified that missing fields return `null` or `Unknown` instead of fabricated data.

---

## 3. Jewellery Design Understanding (Gemini Multimodal)
Evaluates Gemini's ability to interpret style, category, and weight parameters from design photos.

- **Test Item**: Gold contemporary bracelet photo
- **Expected category**: `bracelet`
- **Expected style**: `contemporary`
- **Expected weight range**: 8g to 15g
- **Status**: Passed (Vetted against 10 reference images in `jewellery_catalog.csv`)

---

## 4. Collection Gap & Recommendation Analysis
Verifies that the `COLLECTION_ADVISOR_AGENT` correctly identifies gaps in the user's collection.

- **Test Case**: User owns 3 traditional necklaces, 2 traditional rings, and 0 bracelets.
- **Expected Gaps**: "Contemporary" style gap, "Bracelet" category gap.
- **Expected Top Recommendation**: Lightweight Contemporary Bracelet.
- **Expected Redundancy Flag**: Warning if the user attempts to add another traditional necklace.
- **Status**: Passed
