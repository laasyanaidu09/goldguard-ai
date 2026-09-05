# GoldGuard — Ask GoldGuard & Data Correction Upgrade Walkthrough

GoldGuard has been upgraded with a **deterministic conversational decision agent** and a **trustworthy data correction pipeline**. All features compile and build successfully.

---

## 🛠️ Upgrades Built

### 1. Ask GoldGuard Conversational Intelligence Fixes
- **First-Sentence Direct Answers**: Strict response rules implemented. The assistant answers the exact query immediately rather than summarizing the portfolio first.
- **Intent Classifier & Tool Routing**: Built a deterministic intent detection engine classifying user inputs into:
  - `PURCHASE_PURITY` ("Should I buy 18K or 22K?")
  - `PORTFOLIO_VALUE` ("Why is my portfolio value down?")
  - `EXCHANGE` ("Which jewellery should I exchange?")
  - `CONCENTRATION` ("Which category am I over-concentrated in?")
  - `AFFORDABILITY` ("Can I afford this?")
  - `MARKET_TIMING` ("Should I buy now or wait?")
  - `SCENARIO` ("What happens if gold rises 10%?")
  - `PORTFOLIO_GENERAL` ("Give me an overview.")
- **Data Quality Alerts**: If any item in the portfolio contains suspicious values, Ask GoldGuard flags the issue and suggests a correction rather than blindly performing calculations on distorted inputs.
- **Currency & Rate Sync**: Submissions automatically align with the active home currency (SGD, INR, USD, AED, EUR, GBP) and display matching spot prices.

### 2. Gold Portfolio Editing & Price Verification
- **Edit Action**: Added an `[Edit]` button to every portfolio item in the table.
- **Edit Modal**: Allows changing Name, Category, Purity, Weight, Price, Date, notes, and provenance.
  - *Note: Fine Gold weight is calculated automatically (`Gross Weight * Purity Ratio`) and cannot be manually overridden.*
- **Suspicious Price Warning Dialog**: 
  - Prevents typographical mistakes by verifying entered purchase prices against today's spot metal value.
  - Warns if the price is >3.0x or <0.25x of raw gold content.
  - Displays a detailed comparison card and offers two options: `[Review Value]` (cancels save to let user edit) or `[Save Anyway]` (forces override).
- **Data Quality Dashboard Section**:
  - Displays a breakdown of data source shares (Invoice Verified, Self-Reported, AI Estimated).
  - Highlights a prominent warning badge if there is a suspicious item (e.g. `Long Antique Wedding Haram` initialized with SGD 536,000).
  - Features a `[Review]` button that directly launches the edit modal for the flagged item.
- **Manual Addition Pre-Save Warning**:
  - Integrated the same price validation check into the Add Gold (Without Invoice) manual form, forcing review of suspicious values before adding them.
- **Delete confirmation**:
  - Replaced the browser native dialog with a clean confirmation card highlighting the downstream impacts of removing gold items.

---

## 🔬 How it Was Verified

### 1. Mathematical Test Suite Expansion
- Added unit tests in `backend/test_calculations.py` for:
  - `convert_between_currencies` (asserts conversion precision between USD, SGD, and INR).
  - `is_purchase_price_suspicious` (correctly flags the SGD 536,000 price anomaly as true, while marking a realistic SGD 9,000 price as false).
- **Result**: `All 9 unit tests passed successfully!`

### 2. Frontend Compiles Cleanly
- Vite successfully compiled `dist/assets/index-D1XV2zgf.js` (667 kB) with **zero compilation warnings or TypeScript errors**. Compiled files have been mounted to the static server.
