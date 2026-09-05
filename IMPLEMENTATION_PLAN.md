# GoldGuard AI Gold Wealth Decision Engine Upgrade Plan

This plan outlines the enhancements to upgrade GoldGuard from a tracking dashboard to a data-driven personal gold wealth decision engine, keeping existing structures intact.

## Upgrade Phases

### Phase 1: Core Financial Re-alignment
- **Visual Re-positioning**: Update all titles and descriptors to `"GoldGuard — AI Gold Wealth Intelligence"`.
- **Top Summary Card**: Rename metrics to *Estimated Metal Value*, *Fine Gold*, and *Metal Value vs Purchase Cost* (replacing Profit/Loss). Add the expandable "How is this calculated?" formula display.
- **Next Best Action Banner**: Create a dynamic header notification that flags the highest priority action based on portfolio state (e.g., advising category diversification or warning about funding gaps).

### Phase 2: Portfolio Intelligence & Risk Audit
- **Portfolio Intelligence Section**: Integrate a summary of Fine Gold weight, Category Concentration (Necklace/Bangle/Ring ratios), Purity Concentration, and Data Confidence into the Dashboard.
- **Concentration Risk Analyzer**: Implement a deterministic analyzer that computes a "collection concentration score" and outputs a data-grounded risk classification (Low/Moderate/High) with corresponding advice.

### Phase 3: GoldGuard Decision Score
- **Multi-Factor Purchase Score**: In `backend/calculations.py` and `backend/agents.py`, implement a configurable weighted scoring model for recommendations:
  - *Factors*: Diversification, Budget Fit, Feasibility, Complementarity, Volatility Context, Redundancy Avoidance, and Data Confidence.
- **Gemini Explanator**: Equip the `COLLECTION_ADVISOR_AGENT` to provide a qualitative "Why this score?" paragraph for each recommendation.

### Phase 4: What-If Scenario Engine
- **Multi-scenario savings calculator**: Build a scenario analysis module into the purchase planner (`frontend/src/components/PlanPurchase.tsx` and `backend/calculations.py`) modeling **0% (Current)**, **+10% (Moderate)**, and **+20% (High)** price adjustments.
- **Impact Projections**: Calculate target costs, funding gaps, and monthly savings requirements for each scenario.

### Phase 5: Buy Now vs. Wait Horizer
- **Horizon Evaluator**: Add an interactive grid comparing 3, 6, 12, and 18-month horizons for the target purchase.
- **Gemini Decision Advice**: Feed the spot percentile, annualized volatility, and current funding gap into the model to produce a grounded "Buy Now vs. Wait" recommendation (e.g., "Wait 6 months due to high price percentile and moderate volatility").

### Phase 6: Buy vs. Exchange vs. Sell Optimizer
- **Tri-strategy Analysis**: Implement a strategy evaluator in the planner:
  - *Option A: Buy New* (Funding gap & savings).
  - *Option B: Exchange* (Melt-value contribution of selected portfolio items, updated funding gap, and savings).
  - *Option C: Sell* (Full metal value sale of selected items, updated funding gap, and portfolio diversity impact).
- **Strategy Recommendation**: Deterministically recommend the optimal path based on savings effort and portfolio diversification metrics.

### Phase 7: Ask GoldGuard (Conversational Decision Support)
- **Context-Aware Q&A**: Implement a conversational UI panel on the dashboard.
- **Data-Grounded System Prompt**: Guide Gemini to answer questions *only* using the user's actual portfolio, market rates, and purchase planner states. Prevent hallucinations or general financial predictions.

### Phase 8: AI Trust & Observability Panel
- **AI Trust Badge**: Add an indicator list showing evidence status, validated calculations %, and data confidence.
- **Agent Pipeline Console**: Create an internal/debug view in the footer showing: status, inputs, outputs, confidence, execution time, and evidence sources for all 8 agents (Market, Invoice, Jewellery, Portfolio, Planning, Exchange, Scenario, Orchestrator).

---

## Technical Design & Calculations

1. **Portfolio Concentration**:
   `concentration = Max(category_weight) / total_weight`
   - If `concentration >= 0.6` -> Moderate/High Risk (Over-concentrated in one category).
2. **Weighted Purchase Score**:
   `Score = w1*Div + w2*Budget + w3*Feas + w4*Comp + w5*Market + w6*Redun`
   - Configurable weights: `[0.2, 0.2, 0.15, 0.15, 0.15, 0.15]`.
3. **Purity spot rates display**:
   - 24K Rate: Spot Rate.
   - 22K Rate: Spot Rate * 0.9167.
   - 18K Rate: Spot Rate * 0.75.

---

## Verification Plan

### Automated Tests
- Extend `backend/test_calculations.py` to assert the correctness of:
  - Portfolio concentration scores.
  - Multi-scenario savings requirements.
  - Weighted purchase score calculations.
- Verify that no NaN values or mathematical errors occur when inputs are boundary values.

### Manual Walkthrough
- Test the full 16-step demo journey outlined in Section 16 of the upgrade prompt.
- Confirm that all data is presented transparently with disclaimers.
