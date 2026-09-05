import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { AddGold } from "./components/AddGold";
import { CollectionAdvisor } from "./components/CollectionAdvisor";
import { PlanPurchase } from "./components/PlanPurchase";
import { MarketIntelligence } from "./components/MarketIntelligence";
import { Coins, Layout, Plus, Sparkles, TrendingUp, HelpCircle, Gem } from "lucide-react";

type TabType = "dashboard" | "collection" | "add" | "advisor" | "plan" | "market";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [homeCurrency, setHomeCurrency] = useState<string>("SGD"); // default SGD
  const [market, setMarket] = useState<string>("Singapore 🇸🇬"); // default SG
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [preloadRec, setPreloadRec] = useState<any | null>(null);

  const marketToCurrency: Record<string, string> = {
    "Singapore 🇸🇬": "SGD",
    "India 🇮🇳": "INR",
    "United States 🇺🇸": "USD",
    "United Arab Emirates 🇦🇪": "AED",
    "United Kingdom 🇬🇧": "GBP",
    "Europe 🇪🇺": "EUR"
  };

  const currencyToMarket: Record<string, string> = {
    "SGD": "Singapore 🇸🇬",
    "INR": "India 🇮🇳",
    "USD": "United States 🇺🇸",
    "AED": "United Arab Emirates 🇦🇪",
    "GBP": "United Kingdom 🇬🇧",
    "EUR": "Europe 🇪🇺"
  };

  const handleMarketChange = (newMarket: string) => {
    setMarket(newMarket);
    const cur = marketToCurrency[newMarket];
    if (cur) setHomeCurrency(cur);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setHomeCurrency(newCurrency);
    const mkt = currencyToMarket[newCurrency];
    if (mkt) setMarket(mkt);
  };

  const handleAssetAddedOrDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePlanRecommendation = (rec: any) => {
    setPreloadRec(rec);
    setActiveTab("plan");
  };

  const clearPreload = () => {
    setPreloadRec(null);
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans">
      {/* Top Premium Navbar */}
      <header className="border-b border-border bg-card px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <Coins className="h-6 w-6 text-gold" />
            <div>
              <h1 className="text-lg font-bold tracking-wide text-white uppercase">Gold<span className="text-gold">Guard</span></h1>
              <span className="text-[9px] uppercase tracking-widest text-mutedText block -mt-1 font-semibold">Wealth Intelligence</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-mutedText">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "dashboard" ? "bg-background text-gold" : "hover:text-white"
              }`}
            >
              <Layout className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("collection")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "collection" ? "bg-background text-gold" : "hover:text-white"
              }`}
            >
              <Gem className="h-4 w-4" />
              My Collection
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "add" ? "bg-background text-gold" : "hover:text-white"
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Gold
            </button>
            <button
              onClick={() => setActiveTab("advisor")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "advisor" ? "bg-background text-gold" : "hover:text-white"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Collection Advisor
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "plan" ? "bg-background text-gold" : "hover:text-white"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              Plan Purchase
            </button>
            <button
              onClick={() => setActiveTab("market")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition ${
                activeTab === "market" ? "bg-background text-gold" : "hover:text-white"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Market Intelligence
            </button>
          </nav>

          {/* Market & Currency dropdowns */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase text-mutedText tracking-wider font-semibold">Select Market</span>
              <select
                value={market}
                onChange={(e) => handleMarketChange(e.target.value)}
                className="bg-background border border-border text-white text-xs font-bold rounded p-1 focus:outline-none focus:border-gold"
              >
                <option value="Singapore 🇸🇬">Singapore 🇸🇬</option>
                <option value="India 🇮🇳">India 🇮🇳</option>
                <option value="United States 🇺🇸">United States 🇺🇸</option>
                <option value="United Arab Emirates 🇦🇪">United Arab Emirates 🇦🇪</option>
                <option value="United Kingdom 🇬🇧">United Kingdom 🇬🇧</option>
                <option value="Europe 🇪🇺">Europe 🇪🇺</option>
              </select>
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase text-mutedText tracking-wider font-semibold">Home Currency</span>
              <select
                value={homeCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-background border border-border text-white text-xs font-bold rounded p-1 focus:outline-none focus:border-gold"
              >
                <option value="SGD">SGD (S$)</option>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (Dh)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main page content container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <Dashboard 
            currency={homeCurrency} 
            onPlanPurchase={handlePlanRecommendation}
            refreshTrigger={refreshTrigger}
            onAssetAddedOrDeleted={handleAssetAddedOrDeleted}
            viewMode="summary"
          />
        )}
        
        {activeTab === "collection" && (
          <Dashboard 
            currency={homeCurrency} 
            onPlanPurchase={handlePlanRecommendation}
            refreshTrigger={refreshTrigger}
            onAssetAddedOrDeleted={handleAssetAddedOrDeleted}
            viewMode="collection"
          />
        )}
        
        {activeTab === "add" && (
          <AddGold 
            onAssetAdded={handleAssetAddedOrDeleted}
            onNavigate={(tab: any) => {
              setActiveTab(tab);
            }}
            currency={homeCurrency}
          />
        )}

        {activeTab === "advisor" && (
          <CollectionAdvisor 
            currency={homeCurrency}
            onPlanPurchase={handlePlanRecommendation}
          />
        )}

        {activeTab === "plan" && (
          <PlanPurchase 
            currency={homeCurrency}
            market={market}
            preloadedRecommendation={preloadRec}
            onClearPreload={clearPreload}
          />
        )}

        {activeTab === "market" && (
          <MarketIntelligence 
            currency={homeCurrency}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-mutedText mt-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© 2026 GoldGuard • Google Patchamomma Open Innovation Challenge Submission</span>
          <div className="flex gap-4">
            <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">Demo Mode Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
