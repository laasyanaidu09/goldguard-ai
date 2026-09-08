import { useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { AddGold } from "./components/AddGold";
import { CollectionAdvisor } from "./components/CollectionAdvisor";
import { PlanPurchase } from "./components/PlanPurchase";
import { MarketIntelligence } from "./components/MarketIntelligence";
import { Coins, Layout, Plus, Sparkles, TrendingUp, HelpCircle, Gem, Menu, X } from "lucide-react";

type TabType = "dashboard" | "collection" | "add" | "advisor" | "plan" | "market";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      <header className="border-b border-border bg-card px-3 sm:px-6 py-2.5 sm:py-4 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}>
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-wide text-white uppercase leading-none">
                Gold<span className="text-gold">Guard</span>
              </h1>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-mutedText block font-semibold mt-0.5">
                Wealth Intelligence
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
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

          {/* Market & Currency dropdowns + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="flex flex-col text-right">
              <span className="hidden sm:block text-[10px] uppercase text-mutedText tracking-wider font-semibold">Select Market</span>
              <select
                value={market}
                onChange={(e) => handleMarketChange(e.target.value)}
                className="bg-background border border-border text-white text-[11px] sm:text-xs font-bold rounded px-1.5 py-1 focus:outline-none focus:border-gold"
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
              <span className="hidden sm:block text-[10px] uppercase text-mutedText tracking-wider font-semibold">Home Currency</span>
              <select
                value={homeCurrency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-background border border-border text-white text-[11px] sm:text-xs font-bold rounded px-1.5 py-1 focus:outline-none focus:border-gold"
              >
                <option value="SGD">SGD (S$)</option>
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="AED">AED (Dh)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-1.5 text-mutedText hover:text-white rounded-lg bg-background border border-border focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5 text-gold" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border mt-2.5 pt-2 pb-1 space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "dashboard" ? "bg-background text-gold border border-gold/30" : "text-mutedText hover:text-white"
              }`}
            >
              <Layout className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab("collection"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "collection" ? "bg-background text-gold border border-gold/30" : "text-mutedText hover:text-white"
              }`}
            >
              <Gem className="h-4 w-4" />
              My Collection
            </button>
            <button
              onClick={() => { setActiveTab("add"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "add" ? "bg-background text-gold border border-gold/30" : "text-mutedText hover:text-white"
              }`}
            >
              <Plus className="h-4 w-4" />
              Add Gold
            </button>
            <button
              onClick={() => { setActiveTab("advisor"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "advisor" ? "bg-background text-gold border border-gold/30" : "text-mutedText hover:text-white"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Collection Advisor
            </button>
            <button
              onClick={() => { setActiveTab("plan"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "plan" ? "bg-background text-gold border border-gold/30" : "text-mutedText hover:text-white"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              Plan Purchase
            </button>
            <button
              onClick={() => { setActiveTab("market"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === "market" ? "bg-background text-gold border border-gold/30" : "text-mutedText hover:text-white"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Market Intelligence
            </button>
          </div>
        )}
      </header>

      {/* Main page content container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-24 md:pb-8">
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

      {/* Sleek Mobile Bottom Navigation Bar (Persistent across all tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border md:hidden px-1 py-1.5 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-[10px] font-semibold ${
            activeTab === "dashboard" ? "text-gold bg-gold/10" : "text-mutedText hover:text-white"
          }`}
        >
          <Layout className="h-4.5 w-4.5 mb-0.5" />
          <span>Home</span>
        </button>
        <button
          onClick={() => { setActiveTab("collection"); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-[10px] font-semibold ${
            activeTab === "collection" ? "text-gold bg-gold/10" : "text-mutedText hover:text-white"
          }`}
        >
          <Gem className="h-4.5 w-4.5 mb-0.5" />
          <span>Collection</span>
        </button>
        <button
          onClick={() => { setActiveTab("add"); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition text-[10px] font-semibold ${
            activeTab === "add" ? "text-gold bg-gold/10" : "text-mutedText hover:text-white"
          }`}
        >
          <div className="h-6 w-6 rounded-full bg-gold/20 text-gold flex items-center justify-center mb-0.5 border border-gold/40">
            <Plus className="h-4 w-4" />
          </div>
          <span>Add</span>
        </button>
        <button
          onClick={() => { setActiveTab("advisor"); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-[10px] font-semibold ${
            activeTab === "advisor" ? "text-gold bg-gold/10" : "text-mutedText hover:text-white"
          }`}
        >
          <Sparkles className="h-4.5 w-4.5 mb-0.5" />
          <span>Advisor</span>
        </button>
        <button
          onClick={() => { setActiveTab("plan"); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-[10px] font-semibold ${
            activeTab === "plan" ? "text-gold bg-gold/10" : "text-mutedText hover:text-white"
          }`}
        >
          <HelpCircle className="h-4.5 w-4.5 mb-0.5" />
          <span>Plan</span>
        </button>
        <button
          onClick={() => { setActiveTab("market"); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition text-[10px] font-semibold ${
            activeTab === "market" ? "text-gold bg-gold/10" : "text-mutedText hover:text-white"
          }`}
        >
          <TrendingUp className="h-4.5 w-4.5 mb-0.5" />
          <span>Market</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
