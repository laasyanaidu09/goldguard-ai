# GoldGuard AI & Agent Architecture

This document describes the AI integrations, prompt strategies, multi-agent communication, and the boundaries between AI reasoning and deterministic logic in GoldGuard.

## AI Roles & Boundaries

An important principle of GoldGuard is that **AI does not perform math**. All metrics, savings plans, currency exchanges, and gold values are calculated deterministically in TypeScript/Python code using verified formulas. Gemini is used strictly for what it excels at:
- Natural-language reasoning and summarization.
- Image classification, style analysis, and pattern matching.
- Structured document parsing and OCR validation.
- Explainable recommendation synthesis.

---

## The Orchestrator & Multi-Agent Design

GoldGuard uses a **Coordinated Multi-Agent Architecture**. The orchestrator (`GOLDGUARD_ORCHESTRATOR`) acts as the central router, feeding the verified outputs of one agent into the inputs of another, ensuring no hallucinations cascade through the system.

### Agent Registry & Data Payloads

All agent communications are typed as JSON schemas:

1. **`INVOICE_INTELLIGENCE_AGENT`**
   - **Input**: Image/PDF byte stream.
   - **Output**: Structured JSON of invoice fields.
   - **System Instruction**: Extract raw numbers. If a value is missing, return `null`. Never estimate or assume.

2. **`JEWELLERY_INTELLIGENCE_AGENT`**
   - **Input**: Desired jewellery design image.
   - **Output**: JSON payload detailing category, style, design features, color, visual density, and estimated weight range (min/max).

3. **`JEWELLERY_SIMILARITY_AGENT`**
   - **Input**: Target design features + User's existing portfolio items (JSON).
   - **Output**: Matching portfolio items, similarity percentage, design overlap details, and category match classification (Highly Similar, Complementary, or Different).

4. **`COLLECTION_ADVISOR_AGENT`**
   - **Input**: Structured summary of user's portfolio.
   - **Output**: 3-5 recommendations (`CollectionRecommendation[]`) containing target category, style, type, fit score, diversification score, suggested weight/purity ranges, and the detailed explainable "Why".

5. **`MARKET_INTELLIGENCE_AGENT`**
   - **Input**: Historical price series, currency context.
   - **Output**: Trend summary, historical percentile analysis, and volatility metrics (calculated deterministically in code but summarized in narrative by the agent).

6. **`EXCHANGE_OPTIMIZATION_AGENT`**
   - **Input**: Target purchase cost + Portfolio assets.
   - **Output**: List of assets that could be sold/exchanged, their estimated contribution, and the resulting change in the savings timeline.

7. **`PURCHASE_PLANNING_AGENT`**
   - **Input**: Target asset parameters + Timeline selections + Exchange decisions + Volatility.
   - **Output**: Savings requirements (weekly, monthly) and scenario plans (Lower, Current, Moderate, Higher).

---

## Explainable AI (XAI) Framework

Every recommendation presented to the user must include:
1. **WHAT**: The specific item, purity, weight range, and occasion recommended.
2. **WHY**: The detailed qualitative reason explaining how it complements or diversifies the current portfolio.
3. **DATA USED**: The exact subset of the user's portfolio that informed the decision.
4. **ASSUMPTIONS**: Any visual or market-derived assumptions made (e.g. "We assume standard making charges of 12%").
5. **UNCERTAINTY**: The confidence level and a statement of what cannot be determined (e.g. "We cannot verify actual gold content from an image").

---

## Hallucination & Output Validation

To prevent schema mismatch and AI hallucinations:
- **Pydantic Validation**: All FastAPI endpoints parsing Gemini responses use Pydantic models for strict type checking. If a model fails to parse, a fallback handler sanitizes the response or retries with a repair prompt.
- **Strict Bounds Check**: Weights must be positive, purities must belong to standard ranges (10K, 14K, 18K, 22K, 24K), and dates must be valid ISO strings.
