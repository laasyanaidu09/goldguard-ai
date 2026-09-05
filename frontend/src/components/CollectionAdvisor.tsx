import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { ArrowRight, ShieldAlert, Lightbulb, Compass, Check, AlertTriangle, TrendingUp, Wallet } from "lucide-react";

interface CollectionAdvisorProps {
  currency: string;
  onPlanPurchase: (recommendation: any) => void;
}

export const CollectionAdvisor: React.FC<CollectionAdvisorProps> = ({ currency, onPlanPurchase }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1, SGD: 1.34, INR: 83.5, AED: 3.67, EUR: 0.9, GBP: 0.77 });
  
  // Groundbreaking loan simulator states
  const [subTab, setSubTab] = useState<"advisor" | "loans">("advisor");
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [spotPrice, setSpotPrice] = useState<number>(190.0);
  const [selectedCollateralIds, setSelectedCollateralIds] = useState<string[]>([]);
  const [provider, setProvider] = useState<"bank" | "fintech" | "pawnbroker">("bank");
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanAmountInitialized, setLoanAmountInitialized] = useState<boolean>(false);
  const [loanDuration, setLoanDuration] = useState<number>(12);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.getCollectionRecommendations();
        setData(res.data);
        
        // Fetch current rates to convert prices
        const priceRes = await api.getPrices(currency);
        const latestRate = priceRes.latest_price;
        setSpotPrice(latestRate);
        
        // Estimate rate factor relative to USD rate (~75.50)
        const rateFactor = latestRate / 75.50;
        setExchangeRates(prev => ({ ...prev, [currency]: rateFactor }));

        // Fetch portfolio
        const portRes = await api.getPortfolio(currency);
        const portData = portRes.assets || [];
        setPortfolio(portData);
        setSelectedCollateralIds(portData.map((a: any) => a.asset_id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currency]);

  const convertPrice = (usdAmount: number) => {
    const factor = exchangeRates[currency] || 1.34;
    // If factor is actual rate, convert USD to currency
    // Since mock prices are USD-based in recommendations, convert USD directly
    // If currency is USD, factor is 1, else it multiplies correctly
    return Math.round(usdAmount * (currency === "USD" ? 1.0 : factor));
  };

  const PROVIDERS = {
    bank: { name: "Tier-1 Commercial Bank (DBS / SBI)", rate: 0.075 },
    fintech: { name: "Muthoot / Specialized Gold Finance", rate: 0.115 },
    pawnbroker: { name: "Local Licensed Pawn Broker", rate: 0.24 }
  };

  const selectedCollateralValue = () => {
    let totalVal = 0;
    selectedCollateralIds.forEach(id => {
      const item = portfolio.find(a => a.asset_id === id);
      if (item) {
        const fw = item.fine_gold_weight_grams || (item.gross_weight_grams * (item.purity === "24K" ? 1.0 : item.purity === "18K" ? 0.75 : 0.916));
        totalVal += fw * spotPrice;
      }
    });
    return totalVal;
  };

  const getLoanAmount = () => {
    const maxVal = Math.round(selectedCollateralValue() * 0.75);
    if (!loanAmountInitialized) {
      return maxVal;
    }
    return Math.min(loanAmount, maxVal);
  };

  const getCollateralWarnings = () => {
    const warnings: string[] = [];
    selectedCollateralIds.forEach(id => {
      const item = portfolio.find(a => a.asset_id === id);
      if (item) {
        const nameLower = item.name.toLowerCase();
        if (nameLower.includes("antique") || nameLower.includes("ruby") || nameLower.includes("emerald") || nameLower.includes("diamond") || (item.stone_weight_grams && item.stone_weight_grams > 0)) {
          warnings.push(`"${item.name}" has non-gold stones. Banks deduct stone weight, resulting in up to 15% lower actual loan payout.`);
        }
      }
    });
    return warnings;
  };

  const getCollateralSuccesses = () => {
    const successes: string[] = [];
    selectedCollateralIds.forEach(id => {
      const item = portfolio.find(a => a.asset_id === id);
      if (item) {
        if (item.purity === "24K" || item.category === "bar" || item.category === "coin") {
          successes.push(`"${item.name}" is investment grade gold, qualifying for standard LTV valuation with zero deductions.`);
        }
      }
    });
    return successes;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advisor Header Banner */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-1 text-xs font-semibold text-gold border border-gold/20">
            <Compass className="h-3.5 w-3.5" />
            AI Collection Advisor Active
          </div>
          <h2 className="text-2xl font-bold text-white">Personalised Collection Insights</h2>
          <p className="text-mutedText text-sm max-w-xl">
            GoldGuard analyzes your tracked portfolio assets to spot duplication risks, trace collection style gaps, and recommend optimal next acquisitions.
          </p>
        </div>
      </div>

      {/* Sub-tab selection */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setSubTab("advisor")}
          className={`pb-3 px-4 font-bold text-xs uppercase transition border-b-2 ${subTab === "advisor" ? "border-gold text-gold" : "border-transparent text-mutedText hover:text-white"}`}
        >
          Acquisition & Diversification
        </button>
        <button
          onClick={() => setSubTab("loans")}
          className={`pb-3 px-4 font-bold text-xs uppercase transition border-b-2 ${subTab === "loans" ? "border-gold text-gold" : "border-transparent text-mutedText hover:text-white"}`}
        >
          LTV Collateral & Loan Simulator
        </button>
      </div>

      {subTab === "advisor" && (
        <div className="space-y-6">
          {/* Gap Analysis & Redundancy Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-mutedText flex items-center gap-1.5">
            <Lightbulb className="h-4.5 w-4.5 text-gold" />
            Collection Gaps Identified
          </h3>
          {data?.gaps && data.gaps.length > 0 ? (
            <ul className="space-y-2 text-sm text-white">
              {data.gaps.map((g: string, i: number) => (
                <li key={i} className="flex gap-2 items-start bg-background p-3 rounded-lg border border-border">
                  <span className="h-2 w-2 rounded-full bg-gold mt-1.5 shrink-0"></span>
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mutedText">Your collection style and category distribution is balanced.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-mutedText flex items-center gap-1.5">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-400" />
            Redundancy Warnings
          </h3>
          {data?.warnings && data.warnings.length > 0 ? (
            <ul className="space-y-2 text-sm text-white">
              {data.warnings.map((w: string, i: number) => (
                <li key={i} className="flex gap-2 items-start bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-amber-300">{w}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mutedText">No duplication warnings for your portfolio.</p>
          )}
        </div>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-mutedText">Recommended Next Purchases</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.recommendations && data.recommendations.map((rec: any, idx: number) => (
            <div 
              key={idx}
              className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between hover:border-gold/30 transition-all"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center gap-1 rounded bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/20 uppercase tracking-wider">
                    {rec.recommendation_type.replace("_", " ")}
                  </span>
                  
                  {/* Purchase Score */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-mutedText block">GoldGuard Purchase Score</span>
                    <span className="text-sm font-extrabold text-white">{rec.purchase_score || 92} / 100</span>
                  </div>
                </div>

                {/* Details */}
                <h4 className="text-lg font-bold text-white capitalize">
                  {rec.style} {rec.category}
                </h4>
                
                <p className="mt-2 text-sm text-mutedText leading-relaxed">
                  {rec.reason}
                </p>

                {/* Specifications grid */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs border-t border-border pt-3">
                  <div>
                    <span className="text-mutedText uppercase block">Suggested Weight</span>
                    <span className="font-semibold text-white">{rec.estimated_weight_range.min}g - {rec.estimated_weight_range.max}g</span>
                  </div>
                  <div>
                    <span className="text-mutedText uppercase block">Suggested Purity</span>
                    <span className="font-semibold text-gold">{rec.suggested_purity.join(", ")}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-mutedText uppercase block">Estimated Price Range</span>
                    <span className="font-semibold text-white">
                      {currency} {convertPrice(rec.estimated_price_range.min).toLocaleString()} - {currency} {convertPrice(rec.estimated_price_range.max).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown factors */}
                {rec.score_breakdown && (
                  <div className="mt-3 bg-background border border-border/40 p-2.5 rounded-lg text-[10px] space-y-1.5 font-mono">
                    <span className="text-mutedText font-semibold font-sans uppercase text-[9px] tracking-wider block">Score Breakdown Factors</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-white">
                      <div>Diversification: {rec.score_breakdown.diversification}</div>
                      <div>Budget Fit: {rec.score_breakdown.budget_fit}</div>
                      <div>Feasibility: {rec.score_breakdown.feasibility}</div>
                      <div>Complementarity: {rec.score_breakdown.complementarity}</div>
                      <div>Market Context: {rec.score_breakdown.market_context}</div>
                      <div>Redundancy Avoidance: {rec.score_breakdown.redundancy_avoidance}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onPlanPurchase(rec)}
                className="mt-6 w-full rounded-lg bg-gold py-2.5 text-xs font-bold text-background hover:bg-gold-light transition flex items-center justify-center gap-1"
              >
                Plan This Purchase
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

      {subTab === "loans" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-bold text-white font-sans">Gold Collateralized Loan & Credit Line Simulator</h3>
            </div>
            <p className="text-xs text-mutedText leading-relaxed max-w-3xl">
              Pledge your physical gold holdings to unlock instant liquidity lines. In most markets, central bank regulations allow a maximum <strong>Loan-to-Value (LTV) ratio of 75%</strong> of the raw metal value. Use this simulator to calculate credit limits, monthly interest costs, and identify stone deduction warnings.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* Left Column: Collateral Selection */}
              <div className="lg:col-span-1 space-y-4 bg-background/50 p-4 rounded-xl border border-border/80">
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">1. Select Collateral Items</span>
                {portfolio.length === 0 ? (
                  <p className="text-xs text-mutedText">No items in your collection to simulate collateral.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {portfolio.map(item => {
                      const itemVal = Math.round((item.fine_gold_weight_grams || (item.gross_weight_grams * 0.916)) * spotPrice);
                      const isChecked = selectedCollateralIds.includes(item.asset_id);
                      return (
                        <label 
                          key={item.asset_id}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${isChecked ? "bg-gold/5 border-gold/40 hover:bg-gold/10" : "bg-card/25 border-border/40 hover:bg-card/45"}`}
                        >
                          <div className="flex gap-2 items-center">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedCollateralIds(selectedCollateralIds.filter(id => id !== item.asset_id));
                                } else {
                                  setSelectedCollateralIds([...selectedCollateralIds, item.asset_id]);
                                }
                              }}
                              className="accent-gold h-3.5 w-3.5"
                            />
                            <div>
                              <span className="font-bold text-white block capitalize truncate max-w-[120px]">{item.name}</span>
                              <span className="text-[9px] text-mutedText">{item.purity} • {item.gross_weight_grams}g</span>
                            </div>
                          </div>
                          <span className="font-mono text-white font-bold">{currency} {itemVal.toLocaleString()}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Middle Column: Loan Terms */}
              <div className="lg:col-span-1 space-y-4 bg-background/50 p-4 rounded-xl border border-border/80">
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">2. Select Loan Provider & Terms</span>
                
                {/* Provider select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-mutedText">Lending Institution</label>
                  <select 
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold"
                  >
                    <option value="bank">Commercial Bank (7.5% p.a.)</option>
                    <option value="fintech">Muthoot / Gold Co (11.5% p.a.)</option>
                    <option value="pawnbroker">Licensed Pawn Broker (24.0% p.a.)</option>
                  </select>
                </div>

                {/* Duration select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-mutedText block">Repayment Period: {loanDuration} Months</label>
                  <input 
                    type="range"
                    min="3"
                    max="36"
                    step="3"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(Number(e.target.value))}
                    className="w-full accent-gold bg-card rounded-lg h-2"
                  />
                  <div className="flex justify-between text-[9px] text-mutedText font-mono">
                    <span>3M</span>
                    <span>12M</span>
                    <span>24M</span>
                    <span>36M</span>
                  </div>
                </div>

                {/* Loan Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-mutedText uppercase">Requested Principal</span>
                    <span className="text-gold uppercase">Max LTV: {currency} {Math.round(selectedCollateralValue() * 0.75).toLocaleString()}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="number"
                      min="100"
                      max={Math.round(selectedCollateralValue() * 0.75)}
                      value={getLoanAmount()}
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), Math.round(selectedCollateralValue() * 0.75));
                        setLoanAmount(val);
                        setLoanAmountInitialized(true);
                      }}
                      className="w-full bg-card border border-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-mutedText font-semibold font-mono">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Loan Output Dashboard */}
              <div className="lg:col-span-1 space-y-4 bg-background/50 p-4 rounded-xl border border-border/80 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider block mb-2">3. Monthly Interest Output</span>
                  
                  <div className="grid grid-cols-2 gap-3 bg-card p-3 rounded-lg border border-border/60">
                    <div>
                      <span className="text-[9px] text-mutedText uppercase block">LTV Ratio</span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        {selectedCollateralValue() > 0 ? Math.round((getLoanAmount() / selectedCollateralValue()) * 100) : 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-mutedText uppercase block">Annual Interest</span>
                      <span className="text-sm font-extrabold text-gold font-mono">
                        {(PROVIDERS[provider].rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-2 flex justify-between items-center mt-1">
                      <span className="text-[10px] text-mutedText uppercase">Monthly Payment:</span>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        {currency} {Math.round(getLoanAmount() * (PROVIDERS[provider].rate / 12)).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs bg-background/60 p-2.5 rounded-lg text-white font-mono leading-relaxed space-y-1">
                    <div>Principal: {currency} {getLoanAmount().toLocaleString()}</div>
                    <div>Total Interest: {currency} {Math.round(getLoanAmount() * (PROVIDERS[provider].rate / 12) * loanDuration).toLocaleString()}</div>
                    <div>Total Repayment: {currency} {Math.round(getLoanAmount() + getLoanAmount() * (PROVIDERS[provider].rate / 12) * loanDuration).toLocaleString()}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gold uppercase mb-1">
                    <Wallet className="h-3.5 w-3.5" />
                    Lending Advisory
                  </div>
                  <p className="text-[10px] text-mutedText leading-relaxed">
                    Gold loans are interest-only: pay interest monthly and principal at maturity. Keep LTV under 50% to prevent margin liquidation alerts.
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Collateral Optimization Rules */}
            <div className="mt-4 border-t border-border/40 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Strategic Collateral Optimization Advice</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Collateral Warnings */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Weight Deduction Warnings
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {getCollateralWarnings().length > 0 ? (
                      getCollateralWarnings().map((w, idx) => (
                        <div key={idx} className="text-[10px] text-white flex gap-1.5 items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                          <span>{w}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-mutedText">No items with weight deduction warnings selected.</p>
                    )}
                  </div>
                </div>

                {/* Collateral Efficiencies */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    Bullion Pledging Efficiency
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {getCollateralSuccesses().length > 0 ? (
                      getCollateralSuccesses().map((s, idx) => (
                        <div key={idx} className="text-[10px] text-white flex gap-1.5 items-start">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                          <span>{s}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-mutedText">No high-purity investment bullion currently selected.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
