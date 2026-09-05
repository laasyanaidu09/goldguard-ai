# GoldGuard: AI-Powered Gold Lifecycle & Wealth Intelligence

GoldGuard is a personal gold wealth intelligence platform built for the Google Patchamomma 2026 Open Innovation Challenge. It moves gold jewelry management from physical safety boxes to an active, optimized personal asset portfolio.

```
OWN ➔ UNDERSTAND ➔ TRACK ➔ DISCOVER ➔ PLAN ➔ COMPARE ➔ OPTIMIZE ➔ BUY ➔ TRACK AGAIN
```

---

## 🌟 Core Value Proposition

1. **Own (Digitization & Provenance)**: Users upload invoices (receipts, PDFs) or images of existing gold jewelry. GoldGuard extracts specifications (category, gross/net weight, purity, maker fees, taxes) with clear visual field-level provenance tags:
   - `[Verified Invoice]`
   - `[Self-Reported]`
   - `[AI Estimated]`
   - `[Market Derived]`
2. **Understand & Track (Portfolio)**: A premium dark-mode wealth dashboard aggregates assets, tracking total weight and current estimated values using live gold prices vs. historical purchase prices.
3. **Discover (Collection Advisor)**: A proactive AI agent analyzes the collection's style (traditional vs. contemporary) and category mix (necklace vs. bracelet) to identify gaps, recommending 3-5 next purchases to complement or diversify the collection, and warns if a target design is redundant.
4. **Plan & Optimize (Purchase Planner)**: Users select a target purchase from their recommendations or upload a design photo. GoldGuard estimates parameters (weight, purity), calculates price structures, and runs scenario models (Lower, Current, Moderate, Higher) over 6/12/18-month timelines. An exchange optimizer determines how trading-in low-wear items offsets new costs.

---

## 🛠️ Stack & Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide Icons.
- **Backend**: FastAPI (Python 3.14+) + Google Antigravity SDK (ADK) + Gemini API.
- **Google Cloud Services**: Cloud Run, Firestore, Firebase Auth, BigQuery.
- **Demo Mode**: Built-in toggle (`DEMO_MODE=true`) runs the app using synthetic local databases (`data/*.csv`) and high-fidelity mock agents without requiring cloud credentials.

---

## 📁 Repository Structure

```
├── backend/                  # FastAPI Application
│   ├── main.py               # Main API endpoints & static serving
│   ├── agents.py             # Google ADK / native multi-agent definitions
│   ├── database.py           # Firestore & local CSV database interface
│   ├── calculations.py       # Deterministic financial math (no AI math!)
│   ├── requirements.txt      # Python dependencies
│   └── static/               # Built frontend files served in production
├── frontend/                 # Vite + React + TS App
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Core views (Dashboard, AddGold, Plan, Advisor)
│   │   ├── services/         # API clients (Firebase Auth, Firestore, backend)
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
├── data/                     # Analytical & Synthetic Datasets
│   ├── gold_prices.csv       # Historical gold prices (2010-2026)
│   ├── jewellery_catalog.csv # Store inventory for similarity & suggestions
│   ├── synthetic_user_portfolios.csv
│   └── synthetic_invoices.csv
└── docs/                     # Detailed architectural docs
```

---

## 🚀 Getting Started

Read the [`SETUP.md`](file:///Users/nani/Desktop/untitled%20folder/SETUP.md) for local installation instructions.
Read the [`DEMO_SCRIPT.md`](file:///Users/nani/Desktop/untitled%20folder/DEMO_SCRIPT.md) for details on executing the primary 3-minute hackathon judge flow.
