import React, { useEffect, useState } from "react";
import { api, type Asset, type PortfolioSummary } from "../services/api";
import { 
  Trash2, Sparkles, ChevronDown, ChevronUp, Send, Edit, AlertTriangle, X, 
  Calculator, Camera, Info, Grid, List, Maximize2, Eye 
} from "lucide-react";
import { TryOnModal } from "./TryOnModal";


interface DashboardProps {
  currency: string;
  refreshTrigger: number;
  onAssetAddedOrDeleted: () => void;
  viewMode?: "summary" | "collection";
  onPlanPurchase?: (rec: any) => void;
}

interface ChatMessage {
  sender: "user" | "goldguard";
  text: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currency, refreshTrigger, onAssetAddedOrDeleted, viewMode = "summary", onPlanPurchase }) => {
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestRate, setLatestRate] = useState<number>(141.72 * (currency === "SGD" ? 1.34 : (currency === "INR" ? 83.5 : (currency === "AED" ? 3.67 : 1))));
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);

  // Try-On States
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [tryOnItem, setTryOnItem] = useState<{
    category: string;
    purity: string;
    style: string;
    colour: string;
    image?: string | null;
  } | null>(null);

  const handleOpenTryOn = (item: typeof tryOnItem) => {
    setTryOnItem(item);
    setIsTryOnOpen(true);
  };

  // Visual Collection Showcase States
  const [collectionViewStyle, setCollectionViewStyle] = useState<"gallery" | "table">("gallery");
  const [selectedImageModal, setSelectedImageModal] = useState<{
    url: string;
    name: string;
    purity: string;
    gross_weight: number;
    fine_weight: number;
    value: number;
    asset_id: string;
    category: string;
  } | null>(null);

  const resolveImageUrl = (imgRef: string | null | undefined, category?: string): string => {
    if (imgRef && typeof imgRef === "string" && imgRef.trim() !== "") {
      if (imgRef.startsWith("http://") || imgRef.startsWith("https://") || imgRef.startsWith("data:")) {
        return imgRef;
      }
      if (imgRef.startsWith("/")) {
        return imgRef;
      }
      return `/jewellery/${imgRef}`;
    }
    const cat = (category || "").toLowerCase();
    if (cat.includes("necklace") || cat.includes("haram") || cat.includes("choker")) {
      return "/jewellery/user_necklace_traditional.jpg";
    }
    if (cat.includes("bangle") || cat.includes("kada")) {
      return "/jewellery/user_bangles_filigree.jpg";
    }
    if (cat.includes("ring") || cat.includes("band")) {
      return "/jewellery/user_geometric_ring.jpg";
    }
    if (cat.includes("bracelet") || cat.includes("chain")) {
      return "/jewellery/user_paperclip_bracelet.jpg";
    }
    if (cat.includes("earring") || cat.includes("stud") || cat.includes("jhumka")) {
      return "/jewellery/user_geometric_ring.jpg";
    }
    if (cat.includes("pendant")) {
      return "/jewellery/user_antique_haram.jpg";
    }
    return "/jewellery/user_necklace_traditional.jpg";
  };

  // Conversational widget states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { sender: "goldguard", text: "Hello! I am GoldGuard. Ask me anything about your gold portfolio, valuations, concentration risk, or planning details." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [estimating, setEstimating] = useState(false);

  // Portfolio edit & delete modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "necklace",
    purity: "22K",
    gross_weight_grams: "",
    purchase_price: "",
    purchase_date: "",
    currency: "USD",
    documentation_status: "self_reported" as any,
    notes: "",
    purchase_price_status: "EXACT" as any,
    purchase_price_source: "USER_EXACT" as any,
    provenance_status: "SELF_REPORTED" as any,
    historical_gold_value: null as number | null,
    estimated_jewellery_value_min: null as number | null,
    estimated_jewellery_value_max: null as number | null,
    estimated_liquidation_value_min: null as number | null,
    estimated_liquidation_value_max: null as number | null,
    historical_gold_price: null as number | null,
    historical_gold_price_currency: "USD",
    historical_gold_price_date: null as string | null,
    estimation_confidence: null as string | null,
    estimation_method: null as string | null
  });
  
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTargetAssetId, setDeleteTargetAssetId] = useState<string | null>(null);
  
  const [showSuspiciousPriceWarning, setShowSuspiciousPriceWarning] = useState(false);
  const [priceWarningInfo, setPriceWarningInfo] = useState<{
    weight: number;
    purity: string;
    enteredPrice: number;
    baseValue: number;
    currency: string;
    differencePercent: number;
    isManualAdd: boolean;
  } | null>(null);
  
  const [activeProvFilter, setActiveProvFilter] = useState<string>("ALL");
  const [selectedAuditAsset, setSelectedAuditAsset] = useState<Asset | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [pendingSaveAssetPayload, setPendingSaveAssetPayload] = useState<any | null>(null);

  // Market mode & UI states
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [showWhyNotNecklace, setShowWhyNotNecklace] = useState<boolean>(false);
  const [expandedAiAssetId, setExpandedAiAssetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const healthRes = await api.getHealth();
        setIsDemoMode(healthRes.demo_mode);

        const portRes = await api.getPortfolio(currency);
        setPortfolio(portRes.assets);
        setSummary(portRes.summary);

        const priceRes = await api.getPrices(currency);
        setLatestRate(priceRes.latest_price);
        
        // Load initial simulated plan to fill agent debug details
        await api.compilePurchasePlan({
          user_id: "user_bride",
          target_purity: "22K",
          timeline_months: 12,
          exchange_candidate_asset_ids: ["ASSET_002"],
          home_currency: currency
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currency, refreshTrigger]);

  const handleDeleteClick = (assetId: string) => {
    setDeleteTargetAssetId(assetId);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetAssetId) {
      setLoading(true);
      try {
        await api.deleteAsset(deleteTargetAssetId);
        setShowDeleteConfirmModal(false);
        setDeleteTargetAssetId(null);
        onAssetAddedOrDeleted();
      } catch (err: any) {
        console.error("Delete error:", err);
        alert(`Error deleting item: ${err?.message || err}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAuditClick = (asset: Asset) => {
    setSelectedAuditAsset(asset);
    setShowAuditModal(true);
  };

  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset);
    setEditForm({
      name: asset.name,
      category: asset.category,
      purity: asset.purity,
      gross_weight_grams: String(asset.gross_weight_grams),
      purchase_price: String(asset.purchase_price || ""),
      purchase_date: asset.purchase_date,
      currency: asset.currency || "USD",
      documentation_status: asset.documentation_status,
      notes: asset.notes || "",
      purchase_price_status: asset.purchase_price_status || "EXACT",
      purchase_price_source: asset.purchase_price_source || "USER_EXACT",
      provenance_status: asset.provenance_status || "SELF_REPORTED",
      historical_gold_value: asset.historical_gold_value || null,
      estimated_jewellery_value_min: asset.estimated_jewellery_value_min || null,
      estimated_jewellery_value_max: asset.estimated_jewellery_value_max || null,
      estimated_liquidation_value_min: asset.estimated_liquidation_value_min || null,
      estimated_liquidation_value_max: asset.estimated_liquidation_value_max || null,
      historical_gold_price: asset.historical_gold_price || null,
      historical_gold_price_currency: asset.historical_gold_price_currency || "USD",
      historical_gold_price_date: asset.historical_gold_price_date || asset.purchase_date,
      estimation_confidence: asset.estimation_confidence || null,
      estimation_method: asset.estimation_method || null
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (editForm.purchase_date && editForm.purchase_date > todayStr) {
      alert(`Invalid Purchase Date (${editForm.purchase_date}): Purchase date cannot be in the future. Today is ${todayStr}.`);
      return;
    }

    const rates: Record<string, number> = { USD: 1, SGD: 1.34, INR: 83.5, AED: 3.67, EUR: 0.9, GBP: 0.77 };
    const mult = rates[editForm.currency] || 1.34;
    const rateInFormCurrency = (latestRate / rates[currency]) * mult;
    const ratio = editForm.purity === "24K" ? 0.999 : editForm.purity === "18K" ? 0.75 : 0.9167;
    const baseValue = Number(editForm.gross_weight_grams) * ratio * rateInFormCurrency;
    
    const enteredPrice = editForm.purchase_price_status === "UNKNOWN" ? null : Number(editForm.purchase_price);
    const isSuspicious = editForm.purchase_price_status === "EXACT" && 
      (enteredPrice !== null && (enteredPrice > baseValue * 3.0 || enteredPrice < baseValue * 0.25));

    const payload = {
      user_id: "user_bride",
      asset_id: editingAsset!.asset_id,
      name: editForm.name,
      category: editForm.category,
      purity: editForm.purity,
      gross_weight_grams: Number(editForm.gross_weight_grams),
      purchase_price: enteredPrice,
      purchase_date: editForm.purchase_date,
      currency: editForm.currency,
      documentation_status: editForm.documentation_status,
      notes: editForm.notes,
      purchase_price_status: editForm.purchase_price_status,
      purchase_price_source: editForm.purchase_price_source,
      provenance_status: editForm.provenance_status,
      historical_gold_value: editForm.historical_gold_value,
      estimated_jewellery_value_min: editForm.estimated_jewellery_value_min,
      estimated_jewellery_value_max: editForm.estimated_jewellery_value_max,
      estimated_liquidation_value_min: editForm.estimated_liquidation_value_min,
      estimated_liquidation_value_max: editForm.estimated_liquidation_value_max,
      historical_gold_price: editForm.historical_gold_price,
      historical_gold_price_currency: editForm.historical_gold_price_currency,
      historical_gold_price_date: editForm.historical_gold_price_date || editForm.purchase_date,
      estimation_confidence: editForm.estimation_confidence,
      estimation_method: editForm.estimation_method,
      image_reference: editingAsset?.image_reference || null
    };

    if (isSuspicious) {
      setPriceWarningInfo({
        weight: Number(editForm.gross_weight_grams),
        purity: editForm.purity,
        enteredPrice: enteredPrice!,
        baseValue,
        currency: editForm.currency,
        differencePercent: Math.round(((enteredPrice! - baseValue) / baseValue) * 100),
        isManualAdd: false
      });
      setPendingSaveAssetPayload(payload);
      setShowSuspiciousPriceWarning(true);
    } else {
      await executeSaveAsset(payload);
    }
  };

  const handleEstimateHistoricalEdit = async () => {
    if (!editForm.gross_weight_grams || !editForm.purchase_date) {
      alert("Please fill in Gross Weight and Purchase Date first.");
      return;
    }
    setEstimating(true);
    try {
      const res = await api.estimateHistoricalValue({
        gross_weight: Number(editForm.gross_weight_grams),
        purity: editForm.purity,
        date_or_year: editForm.purchase_date,
        currency: editForm.currency
      });
      if (res) {
        setEditForm(prev => ({
          ...prev,
          historical_gold_value: res.historical_gold_value,
          estimated_jewellery_value_min: res.estimated_jewellery_value_min,
          estimated_jewellery_value_max: res.estimated_jewellery_value_max,
          estimated_liquidation_value_min: res.estimated_liquidation_value_min,
          estimated_liquidation_value_max: res.estimated_liquidation_value_max,
          historical_gold_price: res.historical_gold_price_24k,
          historical_gold_price_currency: "USD",
          historical_gold_price_date: res.historical_gold_price_date,
          estimation_confidence: res.confidence,
          estimation_method: res.method,
          purchase_price: String(res.historical_gold_value), // midpoint fallback
          purchase_price_source: "AI_ESTIMATED",
          provenance_status: "AI_ESTIMATED"
        }));
      }
    } catch (err) {
      console.error("Historical estimation failed:", err);
    } finally {
      setEstimating(false);
    }
  };

  const executeSaveAsset = async (payload: any) => {
    setLoading(true);
    try {
      await api.editAsset(payload);
      setShowEditModal(false);
      setShowSuspiciousPriceWarning(false);
      onAssetAddedOrDeleted();
    } catch (err: any) {
      console.error("Edit error:", err);
      alert(`Error updating item: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnyway = async () => {
    if (pendingSaveAssetPayload) {
      await executeSaveAsset(pendingSaveAssetPayload);
    }
  };

  const handleReviewClick = () => {
    const suspAsset = portfolio.find(a => a.is_suspicious);
    if (suspAsset) {
      handleEditClick(suspAsset);
    }
  };

  const filteredPortfolio = portfolio.filter(a => {
    if (activeProvFilter === "ALL") return true;
    if (activeProvFilter === "NEEDS_REVIEW") return a.is_suspicious;
    if (activeProvFilter === "AI_ESTIMATED") {
      return a.provenance_status === "AI_ESTIMATED" || a.provenance_status === "AI_ESTIMATED_USER_CONFIRMED";
    }
    return a.provenance_status === activeProvFilter;
  });


  // Safe percentage helper
  const getPercentageOfTotalWeight = (weight: number) => {
    const total = summary?.total_gross_weight_grams || 1.0;
    return Math.round((weight / total) * 100);
  };

  // Purity details aggregation (Gross Weight and Fine Gold)
  const getPurityDistribution = () => {
    const data: Record<string, { gross: number; fine: number; ratio: number }> = {
      "24K": { gross: 0, fine: 0, ratio: 0.999 },
      "22K": { gross: 0, fine: 0, ratio: 0.9167 },
      "18K": { gross: 0, fine: 0, ratio: 0.75 }
    };
    portfolio.forEach(a => {
      const purity = a.purity.toUpperCase();
      const gw = a.gross_weight_grams || 0;
      if (purity.includes("24K")) {
        data["24K"].gross += gw;
        data["24K"].fine += a.net_gold_weight_grams || (gw * 0.999);
      } else if (purity.includes("22K")) {
        data["22K"].gross += gw;
        data["22K"].fine += a.net_gold_weight_grams || (gw * 0.9167);
      } else if (purity.includes("18K")) {
        data["18K"].gross += gw;
        data["18K"].fine += a.net_gold_weight_grams || (gw * 0.75);
      }
    });
    return Object.keys(data).map(k => ({
      name: k,
      weight: data[k].gross,
      fineGold: data[k].fine,
      ratio: data[k].ratio
    })).filter(x => x.weight > 0);
  };

  // Category details aggregation
  const getCategoryDistribution = () => {
    const data: Record<string, number> = {};
    portfolio.forEach(a => {
      const cat = a.category.charAt(0).toUpperCase() + a.category.slice(1);
      data[cat] = (data[cat] || 0) + a.gross_weight_grams;
    });
    return Object.keys(data).map(k => ({ name: k, weight: data[k] }));
  };

  // Confidence details aggregation
  const getConfidenceDistribution = () => {
    const data = { verified_invoice: 0, self_reported: 0, ai_estimated: 0 };
    portfolio.forEach(a => {
      const status = (a.documentation_status || "").toLowerCase().replace("_", "").trim();
      if (status === "verifiedinvoice" || status === "invoiceverified") {
        data.verified_invoice += a.gross_weight_grams || 0;
      } else if (status === "aiestimated" || status === "ai") {
        data.ai_estimated += a.gross_weight_grams || 0;
      } else {
        data.self_reported += a.gross_weight_grams || 0;
      }
    });
    return [
      { name: "Invoice Verified", key: "verified_invoice", weight: data.verified_invoice, color: "bg-emerald-500", text: "extracted from uploaded invoice" },
      { name: "Self Reported", key: "self_reported", weight: data.self_reported, color: "bg-amber-500", text: "manually entered by user" },
      { name: "AI Estimated", key: "ai_estimated", weight: data.ai_estimated, color: "bg-blue-500", text: "inferred from image or incomplete information" }
    ];
  };

  // Calculations for specific purity rates (calibrated to official retail rates e.g. Joyalukkas: 24K 189.90, 22K 173.90, 18K 142.50)
  const goldRate24K = latestRate;
  const goldRate22K = currency === "SGD" ? 173.90 : latestRate * (173.90 / 189.90);
  const goldRate18K = currency === "SGD" ? 142.50 : latestRate * (142.50 / 189.90);



  // Chat question handlers
  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;
    setChatHistory(prev => [...prev, { sender: "user", text: questionText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.askGoldGuard("user_bride", questionText, currency, summary, portfolio);
      setChatHistory(prev => [...prev, { sender: "goldguard", text: res.answer }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: "goldguard", text: "Sorry, I had trouble parsing that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestedQuestions = [
    "Why is my portfolio value different from what I paid?",
    "Which jewellery should I exchange?",
    "Which category am I over-concentrated in?",
    "Should I buy 18K or 22K?"
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
      </div>
    );
  }

  const purityDist = getPurityDistribution();

  const categoryDist = getCategoryDistribution();
  const highestCategoryItem = categoryDist.length > 0 ? [...categoryDist].sort((a,b) => b.weight - a.weight)[0] : null;
  const highestCategoryName = highestCategoryItem ? highestCategoryItem.name : "Necklace";
  const highestCategoryPct = highestCategoryItem ? getPercentageOfTotalWeight(highestCategoryItem.weight) : 82;
  const categoryMixText = `${highestCategoryPct}% of your tracked gold weight is concentrated in ${highestCategoryName.toLowerCase()}s.`;

  const confidenceDist = getConfidenceDistribution();
  const aiEstimatedItem = confidenceDist.find(d => d.key === "ai_estimated");
  const aiEstimatedPct = aiEstimatedItem ? getPercentageOfTotalWeight(aiEstimatedItem.weight) : 0;

  const totalWeight = summary?.total_gross_weight_grams || 1.0;
  const recs = summary?.category_recommendations;
  const isOverConcentrated = recs ? !recs.is_balanced : false;
  const maxCatName = recs?.max_concentration_category || "Necklace";
  const maxCatPct = recs?.max_concentration_percentage || 0;

  const invoiceWeight = confidenceDist.find(d => d.key === "verified_invoice")?.weight || 0;
  const invoicePctRaw = totalWeight > 0 ? (invoiceWeight / totalWeight) * 100 : 0;
  let confidenceLevel = "Low";
  if (invoicePctRaw >= 70) {
    confidenceLevel = "High";
  } else if (invoicePctRaw >= 30) {
    confidenceLevel = "Medium";
  }

  return (
    <div className="space-y-6 text-left">
      {viewMode === "summary" && (
        <>
          {/* SECTION 1 — Your Gold Wealth */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-border bg-background flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Your Gold Wealth</h3>
              <span className="text-[10px] text-mutedText">Home Currency: {currency}</span>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-gradient-to-br from-card to-cardHover">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-mutedText block font-semibold">Gold Owned (Gross)</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block font-mono">
                  {summary?.total_gross_weight_grams.toFixed(2)} g
                </span>
                <p className="text-[10px] text-mutedText mt-1">Total weight of physical jewellery items</p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-mutedText block font-semibold">Fine Gold</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block font-mono">
                  {summary?.total_net_gold_weight_grams.toFixed(2)} g
                </span>
                <p className="text-[10px] text-mutedText mt-1">Pure gold content weight</p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-mutedText block font-semibold">Current Gold Value</span>
                <span className="text-2xl sm:text-3xl font-black text-white mt-1 block font-mono text-gold break-words">
                  {currency} {summary?.estimated_current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] text-mutedText mt-1">Market value of pure gold content today</p>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-mutedText block font-semibold text-gold-light">Gold Metal Value Growth</span>
                <span className={`text-2xl sm:text-3xl font-black mt-1 block ${summary && summary.gain_loss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {summary && summary.gain_loss >= 0 ? "+" : ""}
                  {summary?.gain_loss_percent.toFixed(2)}%
                </span>
                <p className="text-[10px] text-mutedText mt-1">
                  Growth in estimated gold-metal value from the purchase date to today.
                </p>
              </div>
            </div>
          </div>

          {/* Current Gold Market */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-border bg-background flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Current Gold Market</h3>
              <span className="text-[10px] text-mutedText font-semibold flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isDemoMode ? "bg-amber-400" : "bg-emerald-500"}`}></span>
                {isDemoMode ? "Demo Market Data" : "Live Market Data"}
              </span>
            </div>
            
            <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-border">
              <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm font-semibold">
                <div className="group relative">
                  <span className="text-mutedText hover:underline cursor-help">24K Gold Rate: </span>
                  <span className="text-gold">{currency} {goldRate24K.toFixed(2)}/g</span>
                  <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-background border border-border text-[10px] rounded shadow-lg hidden group-hover:block z-20 text-mutedText">
                    Official market retail price for pure 24K gold (Joyalukkas / SG Bullion).
                  </div>
                </div>
                <div className="group relative">
                  <span className="text-mutedText hover:underline cursor-help">22K Gold Rate: </span>
                  <span className="text-gold-light">{currency} {goldRate22K.toFixed(2)}/g</span>
                  <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-background border border-border text-[10px] rounded shadow-lg hidden group-hover:block z-20 text-mutedText">
                    Official retail jewellery store board rate for 22K gold.
                  </div>
                </div>
                <div className="group relative">
                  <span className="text-mutedText hover:underline cursor-help">18K Gold Rate: </span>
                  <span className="text-gold-light">{currency} {goldRate18K.toFixed(2)}/g</span>
                  <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-background border border-border text-[10px] rounded shadow-lg hidden group-hover:block z-20 text-mutedText">
                    Official retail jewellery store board rate for 18K gold.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCalculationInfo(!showCalculationInfo)}
                className="text-xs text-gold hover:text-gold-light font-bold flex items-center gap-1 focus:outline-none shrink-0"
              >
                How is this calculated?
                {showCalculationInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* Transparent Info panel */}
            <div className="px-4 sm:px-6 py-3 bg-background/30 text-[11px] sm:text-xs text-mutedText grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 border-b border-border">
              <div><strong className="text-white">Updated:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong className="text-white">Currency:</strong> {currency}</div>
              <div><strong className="text-white">Unit:</strong> per gram</div>
              <div><strong className="text-white">Market Source:</strong> Joyalukkas / Live Market Data</div>
            </div>

            {/* Calculation flow diagram */}
            {showCalculationInfo && (
              <div className="p-5 bg-background border-b border-border space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-gold-light">Calculation Methodology</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                  <div className="bg-card border border-border p-4 rounded-lg space-y-2">
                    <span className="text-white font-bold block">1. Direct Gold Rate Calculation (Recommended for Jewellery)</span>
                    <p className="text-mutedText text-[11px]">
                      Calculate value directly from the physical gross weight and the purity-specific gold rate.
                    </p>
                    <div className="bg-background border border-border/40 p-2.5 rounded font-mono text-[10px] text-emerald-400 space-y-1">
                      <div>Current Gold Value = Gross Weight × Current Gold Rate</div>
                      <div className="text-white mt-1">Example for 22K:</div>
                      <div className="pl-2">48.5g (Weight) × {currency} {goldRate22K.toFixed(2)}/g (22K Gold Rate) = {currency} {(48.5 * goldRate22K).toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                    </div>
                  </div>
                  <div className="bg-card border border-border p-4 rounded-lg space-y-2">
                    <span className="text-white font-bold block">2. Equivalent Fine Gold Calculation (Standard Spot Rate)</span>
                    <p className="text-mutedText text-[11px]">
                      Convert item to pure 100% fine gold content first, then multiply by the 24K Spot Gold rate.
                    </p>
                    <div className="bg-background border border-border/40 p-2.5 rounded font-mono text-[10px] text-emerald-400 space-y-1">
                      <div>Fine Gold Weight = Gross Weight × Purity Factor</div>
                      <div>Current Gold Value = Fine Gold Weight × 24K Spot Gold</div>
                      <div className="text-white mt-1">Example:</div>
                      <div className="pl-2">44.46g (Fine Gold) × {currency} {goldRate24K.toFixed(2)}/g (24K Spot) = {currency} {(44.46 * goldRate24K).toLocaleString(undefined, {maximumFractionDigits:2})}</div>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-mutedText leading-relaxed">
                  <strong>Notice:</strong> Both calculations yield the same total gold-metal value. Gold rates for 22K and 18K are calculated by adjusting the 24K spot price: 22K Rate = 24K Spot × 22/24; 18K Rate = 24K Spot × 18/24. Value excludes design markups, making charges, or taxes.
                </p>
              </div>
            )}
          </div>

          {/* Portfolio Concentration Status */}
          <div className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
            isOverConcentrated 
              ? "border-amber-500/20 bg-amber-500/5 text-amber-300"
              : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block text-mutedText">Portfolio Concentration Status</span>
              <span className="text-lg font-black">{isOverConcentrated ? "Moderate Concentration" : "Balanced / Low Concentration"}</span>
            </div>
            <p className="text-xs leading-relaxed max-w-2xl">
              {isOverConcentrated 
                ? `${maxCatPct}% of your tracked gold weight is concentrated in ${maxCatName.toLowerCase()}s. A different category reduces this concentration risk.`
                : "Your portfolio weight is evenly balanced. Category and style diversity scores look healthy."
              }
            </p>
          </div>

          {/* SECTION 4 — Your Next Best Decision */}
          <div className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/10 via-card to-background p-6 space-y-6">
            {(() => {
              const recs = summary?.category_recommendations;
              const selectedRec = recs?.selected_recommendation;
              const maxCatName = recs?.max_concentration_category || "Necklace";
              const maxCatPct = recs?.max_concentration_percentage || 0;
              const whyNotDominant = recs?.why_not_another_dominant_category;

              const decisionHeading = recs?.decision_title || (maxCatPct >= 50 ? `Don't add another ${maxCatName.toLowerCase()} right now.` : `Diversify your collection.`);
              const recommendedCategory = selectedRec?.category || "Bracelet";
              const purchaseScore = selectedRec?.score || 96;

              const suggestedWeightRange = recommendedCategory.toLowerCase() === "necklace" ? "30–50g" : (recommendedCategory.toLowerCase() === "bracelet" ? "6–9g" : "4–8g");
              const suggestedPurity = "18K / 22K";
              const minEstimatedPrice = (recommendedCategory.toLowerCase() === "bracelet" ? 6 : 4) * (latestRate * 0.9167) * 1.15;
              const maxEstimatedPrice = (recommendedCategory.toLowerCase() === "bracelet" ? 9 : 8) * (latestRate * 0.9167) * 1.25;

              return (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gold">
                        <Sparkles className="h-4.5 w-4.5" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">Your Next Best Decision</span>
                      </div>
                      <h3 className="text-xl font-black text-white">{decisionHeading}</h3>
                    </div>
                    <div className="flex gap-2 self-end md:self-center">
                      {onPlanPurchase && selectedRec && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              handleOpenTryOn({
                                category: selectedRec.category,
                                purity: "22K",
                                style: "contemporary",
                                colour: "yellow",
                                image: null
                              });
                            }}
                            className="rounded border border-gold hover:border-gold-light px-4 py-2 text-xs font-bold text-gold hover:text-gold-light transition shrink-0 flex items-center gap-1"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Try On
                          </button>
                          <button
                            onClick={() => {
                              const cat = selectedRec.category;
                              const wt = selectedRec.simulated_weight || 10;
                              const pur = "22K";
                              onPlanPurchase({
                                category: cat,
                                style: "Contemporary",
                                suggested_purity: [pur, "22K", "18K"],
                                estimated_weight_range: {
                                  min: wt,
                                  max: wt * 1.5
                                },
                                estimated_price_range: {
                                  min: wt * 70,
                                  max: wt * 1.5 * 70 * 1.2
                                },
                                confidence: "High",
                                assumptions: `Dynamic purchase plan based on active planning category: ${cat}.`
                              });
                            }}
                            className="rounded bg-gold px-4 py-2 text-xs font-bold text-background hover:bg-gold-light transition shrink-0"
                          >
                            Plan This Purchase
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 Column Decision Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Portfolio Concentration Evidence */}
                    <div className="bg-background/40 border border-border/40 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] text-mutedText uppercase font-bold block">Portfolio Evidence</span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white font-bold">{maxCatName} Concentration:</span>
                          <span className="text-amber-400 font-extrabold font-mono">{maxCatPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${maxCatPct}%` }}></div>
                        </div>
                        <p className="text-xs text-mutedText leading-relaxed pt-1">
                          {maxCatPct}% of your tracked gold weight is concentrated in {maxCatName.toLowerCase()}s. Adding more would exacerbate category imbalance.
                        </p>
                      </div>
                    </div>

                    {/* Middle Column: GoldGuard Recommendation */}
                    <div className="bg-background/40 border border-border/40 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] text-mutedText uppercase font-bold block">Recommended Acquisition</span>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-black text-white">Contemporary {recommendedCategory}</h4>
                          <span className="px-2 py-0.5 rounded bg-gold/10 text-gold text-xs font-extrabold border border-gold/20">
                            {purchaseScore} / 100
                          </span>
                        </div>
                        <div className="text-xs text-mutedText space-y-1">
                          <div>Suggested Weight: <strong className="text-white">{suggestedWeightRange}</strong></div>
                          <div>Suggested Purity: <strong className="text-white">{suggestedPurity}</strong></div>
                          <div>Estimated Price: <strong className="text-gold font-mono">{currency} {minEstimatedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})} – {maxEstimatedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Multi-Factor Decision Breakdown */}
                    <div className="bg-background/40 border border-border/40 rounded-xl p-4 space-y-2">
                      <span className="text-[10px] text-mutedText uppercase font-bold block">Multi-Factor Scoring</span>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="flex justify-between bg-card p-1.5 rounded border border-border/40">
                          <span className="text-mutedText">Diversification:</span>
                          <span className="text-emerald-400 font-bold">100</span>
                        </div>
                        <div className="flex justify-between bg-card p-1.5 rounded border border-border/40">
                          <span className="text-mutedText">Budget Fit:</span>
                          <span className="text-emerald-400 font-bold">100</span>
                        </div>
                        <div className="flex justify-between bg-card p-1.5 rounded border border-border/40">
                          <span className="text-mutedText">Feasibility:</span>
                          <span className="text-emerald-400 font-bold">100</span>
                        </div>
                        <div className="flex justify-between bg-card p-1.5 rounded border border-border/40">
                          <span className="text-mutedText">Complementarity:</span>
                          <span className="text-emerald-400 font-bold">90</span>
                        </div>
                        <div className="flex justify-between bg-card p-1.5 rounded border border-border/40">
                          <span className="text-mutedText">Market Context:</span>
                          <span className="text-emerald-400 font-bold">80</span>
                        </div>
                        <div className="flex justify-between bg-card p-1.5 rounded border border-border/40">
                          <span className="text-mutedText">Redundancy Avoid:</span>
                          <span className="text-emerald-400 font-bold">100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STEP 9 — Why not another necklace? */}
                  <div className="border-t border-border/20 pt-3">
                    <button
                      onClick={() => setShowWhyNotNecklace(!showWhyNotNecklace)}
                      className="text-xs text-gold hover:text-gold-light font-bold flex items-center justify-between w-full focus:outline-none bg-background/50 hover:bg-background/80 p-3 rounded-lg border border-border/60 transition"
                    >
                      <span className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-gold" />
                        Why not another {maxCatName.toLowerCase()}?
                      </span>
                      {showWhyNotNecklace ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showWhyNotNecklace && (
                      <div className="mt-3 bg-background border border-border p-4 rounded-xl space-y-3 text-xs animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-card border border-border p-2.5 rounded">
                            <span className="text-[10px] uppercase text-mutedText block">Current {maxCatName} Share</span>
                            <span className="text-base font-black text-amber-400 font-mono">{maxCatPct}%</span>
                          </div>
                          <div className="bg-card border border-border p-2.5 rounded">
                            <span className="text-[10px] uppercase text-mutedText block">Existing {maxCatName}s Tracked</span>
                            <span className="text-base font-black text-white font-mono">{whyNotDominant?.dominant_count || 2} pieces</span>
                          </div>
                          <div className="bg-card border border-border p-2.5 rounded">
                            <span className="text-[10px] uppercase text-mutedText block">Total {maxCatName} Weight</span>
                            <span className="text-base font-black text-white font-mono">{whyNotDominant?.dominant_weight || 148.5}g</span>
                          </div>
                        </div>
                        <p className="text-mutedText leading-relaxed">
                          {whyNotDominant?.reason || `Adding another traditional ${maxCatName.toLowerCase()} would increase category concentration and create additional redundancy. A ${recommendedCategory.toLowerCase()} fills a missing category while reducing concentration.`}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Portfolio Intelligence */}
          <div className="rounded-xl border border-border bg-card overflow-hidden p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Portfolio Intelligence</h3>
              <p className="text-xs text-mutedText">Detailed metal audit, valuation analysis, and data confidence scores</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 text-left">
              <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-mutedText tracking-wider block font-bold">Fine Gold</span>
                  <Info className="h-3.5 w-3.5 text-mutedText cursor-pointer" />
                </div>
                <p className="text-2xl font-black text-white">{summary?.total_net_gold_weight_grams.toFixed(2)} g</p>
                <p className="text-[10px] text-mutedText">Equivalent 24K pure gold content weight.</p>
                <div className="absolute hidden group-hover:block bg-black text-[11px] text-white p-3 rounded border border-border w-52 z-20 top-12 left-4 shadow-2xl leading-normal">
                  Pure gold content calculated as: Gross Weight × (Purity / 24).
                </div>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-mutedText tracking-wider block font-bold text-gold">Current Gold Metal Value</span>
                  <Info className="h-3.5 w-3.5 text-gold cursor-pointer" />
                </div>
                <p className="text-2xl font-black text-white">
                  {currency} {summary?.estimated_current_value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </p>
                <p className="text-[10px] text-mutedText">Value of the fine-gold content at the current market reference price.</p>
                <div className="absolute hidden group-hover:block bg-black text-[11px] text-white p-3 rounded border border-border w-52 z-20 top-12 left-4 shadow-2xl leading-normal">
                  Calculated directly from fine gold weight and live 24K market gold spot rate. Excludes making charges and tax.
                </div>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-mutedText tracking-wider block font-bold text-amber-400">Estimated Liquidation Value</span>
                  <Info className="h-3.5 w-3.5 text-amber-400 cursor-pointer" />
                </div>
                <p className="text-2xl font-black text-white">
                  {currency} {summary && (summary.estimated_current_value * 0.98).toLocaleString(undefined, {maximumFractionDigits: 0})} – {summary && (summary.estimated_current_value * 1.00).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </p>
                <p className="text-[10px] text-mutedText leading-tight">
                  Estimated recoverable value if the jewellery were sold or exchanged based primarily on its gold content.
                </p>
                <div className="absolute hidden group-hover:block bg-black text-[11px] text-white p-3 rounded border border-border w-52 z-20 top-12 left-4 shadow-2xl leading-normal">
                  Actual offers may vary depending on the buyer, gold purity verification, workmanship, stones, deductions and applicable dealer policies.
                </div>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative group">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-mutedText tracking-wider block font-bold text-blue-400">Estimated Replacement Value</span>
                  <Info className="h-3.5 w-3.5 text-blue-400 cursor-pointer" />
                </div>
                <p className="text-2xl font-black text-white">
                  {currency} {summary && (summary.estimated_current_value * 1.10).toLocaleString(undefined, {maximumFractionDigits: 0})} – {summary && (summary.estimated_current_value * 1.30).toLocaleString(undefined, {maximumFractionDigits: 0})}
                </p>
                <p className="text-[10px] text-mutedText leading-tight">
                  Estimated retail replacement cost based on current gold value plus assumed workmanship/retail premiums.
                </p>
                <div className="absolute hidden group-hover:block bg-black text-[11px] text-white p-3 rounded border border-border w-52 z-20 top-12 left-4 shadow-2xl leading-normal">
                  Approximate retail cost to replace the finished jewellery, including estimated workmanship/retail premium (10% to 30%).
                </div>
              </div>

              <div className="bg-background border border-border p-4 rounded-xl space-y-2">
                <span className="text-xs uppercase text-mutedText tracking-wider block font-bold text-emerald-400">Data Confidence</span>
                <p className="text-2xl font-black text-white">{confidenceLevel}</p>
                <p className="text-[10px] text-mutedText leading-tight">
                  Based on invoice verification, completeness, and price accuracy.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 7 — Portfolio Composition */}
          <div className="rounded-xl border border-border bg-card overflow-hidden p-6 space-y-6">
            <div className="border-b border-border pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Portfolio Composition</h3>
              <p className="text-xs text-mutedText">Breakdown of holdings by purity distribution, jewellery categories, and purchase data confidence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* STEP 4: # Purity Distribution */}
              <div className="rounded-xl border border-border bg-background p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mutedText"># Purity Distribution</h4>
                {portfolio.length > 0 ? (
                  <div className="space-y-3">
                    {purityDist.map(p => {
                      const percent = getPercentageOfTotalWeight(p.weight);
                      return (
                        <div key={p.name} className="space-y-1.5 text-xs bg-card/60 p-3 rounded-lg border border-border/40">
                          <div className="flex justify-between font-bold text-white">
                            <span className="text-gold font-mono">{p.name}</span>
                            <span className="font-mono">{percent}% Portfolio Share</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-mutedText font-mono pt-1">
                            <div>Gross Weight: <strong className="text-white">{p.weight.toFixed(2)}g</strong></div>
                            <div>Fine Gold: <strong className="text-gold-light">{p.fineGold.toFixed(2)}g</strong></div>
                          </div>
                          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-gold rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-mutedText pt-2 border-t border-border/40 mt-2 leading-relaxed">
                      Portfolio share is based on gross jewellery weight. Fine gold represents the actual pure-gold equivalent.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-mutedText">No items to analyze purity</p>
                )}
              </div>

              {/* Jewellery Category Mix */}
              <div className="rounded-xl border border-border bg-background p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-mutedText">Jewellery Category Mix</h4>
                {portfolio.length > 0 ? (
                  <div className="space-y-3">
                    {categoryDist.map(c => {
                      const percent = getPercentageOfTotalWeight(c.weight);
                      return (
                        <div key={c.name} className="space-y-1 text-sm">
                          <div className="flex justify-between font-semibold">
                            <span>{c.name}</span>
                            <span className="text-mutedText">{c.weight} g ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                            <div className="h-full bg-gold/70 rounded-full" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-mutedText pt-2 border-t border-border/40 mt-2">{categoryMixText}</p>
                  </div>
                ) : (
                  <p className="text-xs text-mutedText">No items to analyze categories</p>
                )}
              </div>

              {/* STEP 5: Portfolio Data Confidence */}
              <div className="rounded-xl border border-border bg-background p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mutedText">Portfolio Data Confidence</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    confidenceLevel === "High" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : (confidenceLevel === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20")
                  }`}>
                    {confidenceLevel} Confidence
                  </span>
                </div>

                {portfolio.length > 0 ? (
                  <div className="space-y-3">
                    {confidenceDist.map(doc => {
                      const percent = getPercentageOfTotalWeight(doc.weight);
                      return (
                        <div key={doc.key} className="text-xs space-y-1 bg-card/60 p-2.5 rounded-lg border border-border/40">
                          <div className="flex justify-between items-center font-semibold">
                            <span className="flex items-center gap-1.5 capitalize text-white">
                              <span className={`h-2.5 w-2.5 rounded-full ${doc.color}`}></span>
                              {doc.name}
                            </span>
                            <span className="text-mutedText font-mono font-bold">{doc.weight.toFixed(1)}g ({percent}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${doc.color}`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-2 text-xs">
                      <p className="text-blue-300 leading-tight">
                        <strong className="text-white">{aiEstimatedPct}%</strong> of your tracked gold weight is based on AI-estimated information.
                      </p>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-mutedText">
                          Upload supporting documentation for the {aiEstimatedItem ? aiEstimatedItem.weight.toFixed(1) : "0"}g AI-estimated holding to increase valuation confidence.
                        </span>
                        <button
                          onClick={() => {
                            const aiAsset = portfolio.find(a => a.provenance_status === "AI_ESTIMATED" || a.documentation_status === "ai_estimated");
                            if (aiAsset) {
                              handleEditClick(aiAsset);
                            } else {
                              alert("All items currently have verified or self-reported documentation.");
                            }
                          }}
                          className="bg-gold hover:bg-gold-light text-background font-bold text-[11px] px-3 py-1.5 rounded transition shrink-0"
                        >
                          Verify Holding
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-mutedText">No items to analyze provenance</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 8 — Ask GoldGuard */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="h-5 w-5 text-gold animate-pulse" />
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Ask GoldGuard</h3>
                <p className="text-xs text-mutedText">Conversational decision support using your live portfolio and spot rates</p>
              </div>
            </div>

            {/* Chat message box */}
            <div className="bg-background border border-border rounded-xl p-4 h-60 overflow-y-auto space-y-3 flex flex-col">
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-gold text-background self-end font-bold" 
                      : "bg-card border border-border text-white self-start"
                  }`}
                >
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\?(.*?)\*\?/g, '<strong>$1</strong>') }}></div>
                </div>
              ))}
              {chatLoading && (
                <div className="bg-card border border-border text-white self-start rounded-xl p-3 text-xs flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-gold rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-gold rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-1.5 w-1.5 bg-gold rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskQuestion(q)}
                  className="text-[11px] bg-background hover:bg-cardHover border border-border hover:border-gold rounded-full px-3 py-1.5 transition text-gold-light"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat input form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion(chatInput);
              }} 
              className="flex gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask why value is down, which item to exchange, or about purity options..."
                className="flex-1 bg-background border border-border focus:border-gold text-xs rounded-lg px-4 py-2 text-white focus:outline-none"
              />
              <button
                type="submit"
                className="bg-gold hover:bg-gold-light text-background rounded-lg px-4 py-2 font-bold transition flex items-center gap-1 text-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </form>
          </div>
        </>
      )}

      {viewMode === "collection" && (
        <div className="space-y-6">
          <div className="border border-border bg-background/50 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs uppercase text-mutedText tracking-wider font-bold">Portfolio Data Quality (by weight)</span>
              <div className="flex flex-wrap gap-2 text-[10px] text-mutedText font-semibold">
                {(() => {
                  const totalW = portfolio.reduce((sum, a) => sum + (a.gross_weight_grams || 0), 0) || 1;
                  const invW = portfolio.filter(a => a.provenance_status === "INVOICE_VERIFIED").reduce((sum, a) => sum + (a.gross_weight_grams || 0), 0);
                  const selfW = portfolio.filter(a => a.provenance_status === "SELF_REPORTED").reduce((sum, a) => sum + (a.gross_weight_grams || 0), 0);
                  const aiW = portfolio.filter(a => a.provenance_status === "AI_ESTIMATED" || a.provenance_status === "AI_ESTIMATED_USER_CONFIRMED").reduce((sum, a) => sum + (a.gross_weight_grams || 0), 0);
                  return (
                    <>
                      <button 
                        onClick={() => setActiveProvFilter(activeProvFilter === "INVOICE_VERIFIED" ? "ALL" : "INVOICE_VERIFIED")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition ${
                          activeProvFilter === "INVOICE_VERIFIED" 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold" 
                            : "bg-background border-border hover:bg-cardHover"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Invoice Verified: {Math.round((invW / totalW) * 100)}%
                      </button>
                      <button 
                        onClick={() => setActiveProvFilter(activeProvFilter === "SELF_REPORTED" ? "ALL" : "SELF_REPORTED")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition ${
                          activeProvFilter === "SELF_REPORTED" 
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold" 
                            : "bg-background border-border hover:bg-cardHover"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                        Self Reported: {Math.round((selfW / totalW) * 100)}%
                      </button>
                      <button 
                        onClick={() => setActiveProvFilter(activeProvFilter === "AI_ESTIMATED" ? "ALL" : "AI_ESTIMATED")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition ${
                          activeProvFilter === "AI_ESTIMATED" 
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold" 
                            : "bg-background border-border hover:bg-cardHover"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                        AI Estimated: {Math.round((aiW / totalW) * 100)}%
                      </button>
                    </>
                  );
                })()}
                {activeProvFilter !== "ALL" && (
                  <button 
                    onClick={() => setActiveProvFilter("ALL")}
                    className="text-[10px] text-gold hover:underline font-bold px-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {portfolio.filter(a => a.is_suspicious).length > 0 && (
                <div 
                  onClick={() => setActiveProvFilter(activeProvFilter === "NEEDS_REVIEW" ? "ALL" : "NEEDS_REVIEW")}
                  className={`border border-red-500/20 bg-red-500/5 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer transition ${
                    activeProvFilter === "NEEDS_REVIEW" ? "ring-1 ring-red-500" : ""
                  }`}
                >
                  <div className="flex gap-2.5 items-start text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold block text-red-300">⚠️ {portfolio.filter(a => a.is_suspicious).length} item needs review</span>
                      <span className="text-mutedText">Reason: Logical inconsistency, price anomaly, or impossible weight.</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReviewClick(); }}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg transition shrink-0 self-end sm:self-auto"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
            {/* View Switcher & Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>My Jewellery Collection</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
                    {filteredPortfolio.length} {filteredPortfolio.length === 1 ? "Piece" : "Pieces"}
                  </span>
                </h3>
                <p className="text-xs text-mutedText mt-0.5">
                  Visual gallery & physical audit of all your hallmarked jewellery holdings
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-background/80 border border-border rounded-xl self-stretch sm:self-auto justify-center">
                <button
                  onClick={() => setCollectionViewStyle("gallery")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    collectionViewStyle === "gallery"
                      ? "bg-gold text-background shadow-md shadow-gold/20"
                      : "text-mutedText hover:text-white"
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" />
                  <span>Photos Showcase</span>
                </button>
                <button
                  onClick={() => setCollectionViewStyle("table")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    collectionViewStyle === "table"
                      ? "bg-gold text-background shadow-md shadow-gold/20"
                      : "text-mutedText hover:text-white"
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Data Table</span>
                </button>
              </div>
            </div>

            {portfolio.length > 0 ? (
              collectionViewStyle === "gallery" ? (
                /* Photos Showcase (Gallery View) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPortfolio.map(a => {
                    const status = a.purchase_price_status || "EXACT";
                    const currentMetalVal = a.current_gold_metal_value || a.estimated_current_value;
                    const imgSrc = resolveImageUrl(a.image_reference, a.category);

                    return (
                      <div 
                        key={a.asset_id}
                        className="group relative flex flex-col rounded-2xl border border-border/80 bg-background/60 hover:border-gold/50 hover:bg-cardHover/40 hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 overflow-hidden"
                      >
                        {/* Photo Showcase Container */}
                        <div className="relative aspect-[4/3] w-full bg-black/40 overflow-hidden">
                          <img
                            src={imgSrc}
                            alt={a.name}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                            onClick={() => setSelectedImageModal({
                              url: imgSrc,
                              name: a.name,
                              purity: a.purity,
                              gross_weight: a.gross_weight_grams,
                              fine_weight: a.net_gold_weight_grams,
                              value: currentMetalVal,
                              asset_id: a.asset_id,
                              category: a.category
                            })}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith('/jewellery/user_necklace_traditional.jpg')) {
                                target.src = '/jewellery/user_necklace_traditional.jpg';
                              }
                            }}
                          />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md bg-black/60 text-gold border border-gold/40 shadow-sm">
                              {a.purity} Gold
                            </span>
                            <span className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md bg-black/50 text-white/80 border border-white/10">
                              {a.category}
                            </span>
                          </div>

                          {/* Provenance Badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm border ${
                              a.provenance_status === "INVOICE_VERIFIED"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                                : a.provenance_status === "AI_ESTIMATED"
                                ? "bg-blue-950/80 text-blue-300 border-blue-500/40"
                                : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                            }`}>
                              {a.provenance_status === "INVOICE_VERIFIED" ? "✓ Verified" : a.provenance_status === "AI_ESTIMATED" ? "AI Est." : "Self-Reported"}
                            </span>
                          </div>

                          {/* Hover Overlay Controls */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
                            <div className="flex justify-end">
                              <button
                                onClick={() => setSelectedImageModal({
                                  url: imgSrc,
                                  name: a.name,
                                  purity: a.purity,
                                  gross_weight: a.gross_weight_grams,
                                  fine_weight: a.net_gold_weight_grams,
                                  value: currentMetalVal,
                                  asset_id: a.asset_id,
                                  category: a.category
                                })}
                                className="p-2 rounded-xl bg-black/70 hover:bg-gold hover:text-black text-white backdrop-blur-md border border-white/20 transition shadow-lg"
                                title="Inspect High-Res Photo"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => handleOpenTryOn({
                                  category: a.category,
                                  purity: a.purity,
                                  style: a.style || "traditional",
                                  colour: "Yellow Gold",
                                  image: imgSrc
                                })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-light text-background text-xs font-bold shadow-lg transition"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Virtual Try-On</span>
                              </button>

                              <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] font-semibold border border-white/20 backdrop-blur-md cursor-pointer transition">
                                <Camera className="h-3 w-3 text-gold" />
                                <span>Change Photo</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const res = await api.uploadAssetImage(a.asset_id, file);
                                        if (res.status === "success" || res.image_reference) {
                                          alert("Jewellery picture updated successfully!");
                                          onAssetAddedOrDeleted();
                                        }
                                      } catch (err) {
                                        alert("Error uploading image");
                                      }
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Card Information */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-white text-base leading-snug group-hover:text-gold transition">
                                {a.name}
                              </h4>
                              {a.is_suspicious && (
                                <span className="shrink-0 text-amber-400" title="Price Warning: Check calculations">
                                  <AlertTriangle className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                            {a.notes && (
                              <p className="text-xs text-mutedText italic mt-1 line-clamp-1">
                                "{a.notes}"
                              </p>
                            )}
                          </div>

                          {/* Valuation & Weight Stats */}
                          <div className="bg-background/80 rounded-xl p-3 border border-border/60 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-mutedText">Current Gold Value:</span>
                              <span className="font-mono font-bold text-sm text-gold">
                                {currency} {currentMetalVal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-border/40 text-[11px]">
                              <div>
                                <span className="text-mutedText block">Gross Weight</span>
                                <span className="font-semibold text-white">{a.gross_weight_grams} g</span>
                              </div>
                              <div>
                                <span className="text-mutedText block">Fine Gold (24K eq)</span>
                                <span className="font-semibold text-white">{a.net_gold_weight_grams} g</span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-border/40">
                              <span className="text-mutedText">Est. Jewellery Range:</span>
                              <span className="font-mono text-mutedText">
                                {currency} {a.estimated_jewellery_value_min?.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {a.estimated_jewellery_value_max?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>

                            {status !== "UNKNOWN" && (
                              <div className="flex justify-between items-center text-[10px] text-mutedText">
                                <span>Purchase Price:</span>
                                <span className="font-mono text-white/90">
                                  {currency} {(a.purchase_price_converted ?? a.purchase_price)?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Action Row */}
                          <div className="flex items-center justify-between pt-1 border-t border-border/60">
                            <button
                              onClick={() => handleAuditClick(a)}
                              className="flex items-center gap-1 text-[11px] text-mutedText hover:text-gold transition font-medium"
                            >
                              <Calculator className="h-3.5 w-3.5 text-gold" />
                              <span>Audit Math</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenTryOn({
                                  category: a.category,
                                  purity: a.purity,
                                  style: a.style || "traditional",
                                  colour: "Yellow Gold",
                                  image: imgSrc
                                })}
                                className="p-1.5 text-mutedText hover:text-gold hover:bg-gold/10 rounded-lg transition"
                                title="Virtual Try-On"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleEditClick(a)}
                                className="p-1.5 text-mutedText hover:text-gold hover:bg-gold/10 rounded-lg transition"
                                title="Edit piece details"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(a.asset_id)}
                                className="p-1.5 text-mutedText hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                title="Remove from collection"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Data Table View */
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <span className="md:hidden text-[10px] text-gold/90 bg-gold/10 px-2 py-0.5 rounded border border-gold/20 font-medium">
                      ↔ Swipe table horizontally
                    </span>
                  </div>
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="min-w-[880px] w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border text-xs uppercase tracking-wider text-mutedText">
                          <th className="pb-3 font-semibold">Jewellery</th>
                          <th className="pb-3 font-semibold">Purity</th>
                          <th className="pb-3 font-semibold">Weight</th>
                          <th className="pb-3 font-semibold">Fine Gold</th>
                          <th className="pb-3 font-semibold">Purchase Price</th>
                          <th className="pb-3 font-semibold">Current Gold Value</th>
                          <th className="pb-3 font-semibold">Estimated Jewellery Value</th>
                          <th className="pb-3 font-semibold">Provenance</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {filteredPortfolio.map(a => {
                          const status = a.purchase_price_status || "EXACT";
                          const currentMetalVal = a.current_gold_metal_value || a.estimated_current_value;
                          const imgSrc = resolveImageUrl(a.image_reference, a.category);
                          
                          return (
                            <React.Fragment key={a.asset_id}>
                              <tr className="group hover:bg-cardHover/30">
                                <td className="py-3 font-medium text-white">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      onClick={() => setSelectedImageModal({
                                        url: imgSrc,
                                        name: a.name,
                                        purity: a.purity,
                                        gross_weight: a.gross_weight_grams,
                                        fine_weight: a.net_gold_weight_grams,
                                        value: currentMetalVal,
                                        asset_id: a.asset_id,
                                        category: a.category
                                      })}
                                      className="relative group/img h-12 w-12 shrink-0 bg-background/80 border border-border hover:border-gold/60 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer shadow-sm transition"
                                      title="Click to view full photo"
                                    >
                                      <img 
                                        src={imgSrc} 
                                        alt={a.name} 
                                        className="h-full w-full object-cover group-hover/img:scale-110 transition duration-200"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          if (!target.src.endsWith('/jewellery/user_necklace_traditional.jpg')) {
                                            target.src = '/jewellery/user_necklace_traditional.jpg';
                                          }
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                                        <Eye className="h-4 w-4 text-gold" />
                                      </div>
                                    </div>
                                    <div>
                                      <span className="block font-bold group-hover:text-gold transition">{a.name}</span>
                                      {a.notes && (
                                        <span className="block text-[10px] text-mutedText font-normal italic mt-0.5 max-w-xs truncate">
                                          "{a.notes}"
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 text-white capitalize">{a.purity}</td>
                                <td className="py-3 text-mutedText">{a.gross_weight_grams} g</td>
                                <td className="py-3 text-mutedText">{a.net_gold_weight_grams} g</td>
                                <td className="py-3 text-white font-mono">
                                  {status === "UNKNOWN" ? (
                                    <span className="text-mutedText">Unknown</span>
                                  ) : (
                                    <>
                                      {currency} {(a.purchase_price_converted ?? a.purchase_price)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      {a.currency && a.currency !== currency && (
                                        <span className="block text-[9px] text-mutedText font-sans mt-0.5">
                                          Orig: {a.currency} {a.purchase_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      )}
                                      {a.purchase_price_source && (
                                        <span className="block text-[8px] text-gold/80 font-sans mt-0.5">
                                          Src: {a.purchase_price_source}
                                        </span>
                                      )}
                                      {status === "APPROXIMATE" && (
                                        <span className="block text-[9px] text-amber-400 font-sans font-normal mt-0.5">Approximate</span>
                                      )}
                                      {a.is_suspicious && (
                                        <span className="block text-[9px] text-amber-400 font-sans font-bold mt-0.5 flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3 inline" /> Price Warning
                                        </span>
                                      )}
                                    </>
                                  )}
                                </td>
                                <td className="py-3 font-bold text-white font-mono">
                                  {currency} {currentMetalVal.toLocaleString()}
                                </td>
                                <td className="py-3 text-mutedText font-mono">
                                  {currency} {a.estimated_jewellery_value_min?.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {a.estimated_jewellery_value_max?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                                <td className="py-3">
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border ${
                                      a.provenance_status === "INVOICE_VERIFIED"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : a.provenance_status === "AI_ESTIMATED"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}>
                                      {a.provenance_status === "INVOICE_VERIFIED"
                                        ? "INVOICE VERIFIED"
                                        : a.provenance_status === "AI_ESTIMATED"
                                        ? "AI ESTIMATED"
                                        : "SELF REPORTED"
                                      }
                                    </span>
                                    {(a.provenance_status === "AI_ESTIMATED" || a.documentation_status === "ai_estimated") && (
                                      <button
                                        onClick={() => setExpandedAiAssetId(expandedAiAssetId === a.asset_id ? null : a.asset_id)}
                                        className="block text-[10px] text-gold hover:underline font-bold"
                                      >
                                        {expandedAiAssetId === a.asset_id ? "Hide details ▲" : "How estimated? ▼"}
                                      </button>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                                    <button
                                      onClick={() => handleOpenTryOn({
                                        category: a.category,
                                        purity: a.purity,
                                        style: a.style || "traditional",
                                        colour: "Yellow Gold",
                                        image: imgSrc
                                      })}
                                      className="rounded p-1.5 text-mutedText hover:bg-gold/10 hover:text-gold transition"
                                      title="Virtual Try-On"
                                    >
                                      <Sparkles className="h-4 w-4" />
                                    </button>
                                    {(a.provenance_status === "AI_ESTIMATED" || a.documentation_status === "ai_estimated" || a.documentation_status === "self_reported") && (
                                      <button
                                        onClick={() => handleEditClick(a)}
                                        className="rounded px-2 py-1 bg-gold/10 hover:bg-gold text-gold hover:text-background text-[10px] font-bold transition border border-gold/30"
                                        title="Verify Holding"
                                      >
                                        Verify
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleAuditClick(a)}
                                      className="rounded p-1.5 text-mutedText hover:bg-gold/10 hover:text-gold transition"
                                      title="Audit calculations"
                                    >
                                      <Calculator className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditClick(a)}
                                      className="rounded p-1.5 text-mutedText hover:bg-gold/10 hover:text-gold transition"
                                      title="Edit asset"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteClick(a.asset_id)}
                                      className="rounded p-1.5 text-mutedText hover:bg-red-500/10 hover:text-red-400 transition"
                                      title="Delete asset"
                                    >
                                      <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {expandedAiAssetId === a.asset_id && (
                                <tr key={`${a.asset_id}-estimate-details`} className="bg-background/90 border-b border-border">
                                  <td colSpan={9} className="p-4">
                                    <div className="bg-card border border-gold/30 rounded-xl p-4 space-y-3 text-xs">
                                      <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                        <h5 className="font-extrabold text-gold flex items-center gap-1.5">
                                          <Sparkles className="h-4 w-4" />
                                          How GoldGuard Estimated This: {a.name}
                                        </h5>
                                        <span className="text-[10px] text-mutedText">
                                          Estimation Confidence: <strong className="text-white">{a.estimation_confidence || "Medium"}</strong>
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px]">
                                        <div className="bg-background p-2.5 rounded border border-border/40">
                                          <span className="text-mutedText text-[10px] block">Estimated Gross Weight</span>
                                          <span className="text-white font-bold">{a.gross_weight_grams} g</span>
                                        </div>
                                        <div className="bg-background p-2.5 rounded border border-border/40">
                                          <span className="text-mutedText text-[10px] block">Purity & Factor</span>
                                          <span className="text-white font-bold">{a.purity} ({(a.purity === "24K" ? 99.9 : (a.purity === "18K" ? 75.0 : 91.67))}%)</span>
                                        </div>
                                        <div className="bg-background p-2.5 rounded border border-border/40">
                                          <span className="text-mutedText text-[10px] block">Historical Reference Rate</span>
                                          <span className="text-gold-light font-bold">{currency} {a.historical_gold_price ? a.historical_gold_price.toFixed(2) : latestRate.toFixed(2)}/g</span>
                                        </div>
                                        <div className="bg-background p-2.5 rounded border border-border/40">
                                          <span className="text-mutedText text-[10px] block">Calculated Fine Gold</span>
                                          <span className="text-white font-bold">{a.net_gold_weight_grams} g</span>
                                        </div>
                                      </div>

                                      <div className="space-y-1 text-[11px] text-mutedText bg-background p-3 rounded-lg border border-border/40 leading-relaxed">
                                        <div><strong className="text-white">Estimated Gold Metal Value:</strong> {currency} {(a.historical_gold_value || a.current_gold_metal_value)?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                        <div><strong className="text-white">Workmanship / Retail Premium Assumption:</strong> 10% – 30% standard retail margin</div>
                                        <div><strong className="text-white">Method:</strong> Historical gold rate × estimated fine-gold weight + configured retail premium assumptions.</div>
                                        <p className="text-[10px] text-amber-400/90 pt-1 border-t border-border/30 mt-1 italic">
                                          * Note: This is an estimate based on available information and historical gold rate tables. It is not an exact invoice price.
                                        </p>
                                      </div>

                                      <div className="flex justify-end gap-2 pt-1">
                                        <button
                                          onClick={() => handleEditClick(a)}
                                          className="bg-gold hover:bg-gold-light text-background font-bold text-xs px-4 py-1.5 rounded transition"
                                        >
                                          Verify / Edit Holding
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="py-12 text-center text-sm text-mutedText">No items tracked yet.</div>
            )}
          </div>
        </div>
      )}


      {/* Calculation Audit Modal */}
      {showAuditModal && selectedAuditAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-gold" />
                Calculation Audit Trail
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-mutedText hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-mutedText">
              <div className="border border-border bg-background p-3 rounded-lg space-y-2">
                <span className="font-bold text-white block">Inputs & Parameters:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>Gross Weight: <span className="text-white font-semibold">{selectedAuditAsset.gross_weight_grams} g</span></div>
                  <div>Purity: <span className="text-white font-semibold">{selectedAuditAsset.purity}</span></div>
                  <div>Purchase Date: <span className="text-white font-semibold">{selectedAuditAsset.purchase_date}</span></div>
                  <div>Asset Currency: <span className="text-white font-semibold">{selectedAuditAsset.currency}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-white block">Step-by-Step Mathematical Derivation:</span>
                <div className="space-y-1.5 font-mono text-[11px] bg-black/50 border border-border/40 p-3 rounded-lg leading-relaxed text-emerald-400">
                  <div>1. Applicable Purity Gold Rate ({selectedAuditAsset.purity}):</div>
                  <div className="pl-3 text-white">
                    Current {selectedAuditAsset.purity} Rate: {currency} {((selectedAuditAsset.purity === "24K" ? goldRate24K : selectedAuditAsset.purity === "18K" ? goldRate18K : goldRate22K)).toFixed(2)}/g
                  </div>
                  <div className="pl-3 text-mutedText text-[10px] font-sans">
                    Calculated as: 24K Spot Gold ({currency} {goldRate24K.toFixed(2)}/g) × {(selectedAuditAsset.purity === "24K" ? "100%" : selectedAuditAsset.purity === "18K" ? "75%" : "91.67%")} Purity Ratio
                  </div>

                  <div className="mt-2">2. Current Jewellery Gold Value:</div>
                  <div className="pl-3 text-white">
                    {selectedAuditAsset.gross_weight_grams} g (Gross Weight) × {currency} {((selectedAuditAsset.purity === "24K" ? goldRate24K : selectedAuditAsset.purity === "18K" ? goldRate18K : goldRate22K)).toFixed(2)}/g ({selectedAuditAsset.purity} Rate)
                  </div>
                  <div className="pl-3 font-semibold text-emerald-300">
                    = {currency} {selectedAuditAsset.current_gold_metal_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="pl-3 text-mutedText text-[10px] font-sans">
                    (Note: This is mathematically identical to Fine Gold Weight {selectedAuditAsset.net_gold_weight_grams}g × 24K Spot {currency} {goldRate24K.toFixed(2)}/g)
                  </div>

                  <div className="mt-2">3. Historical Purity Rate & Valuation:</div>
                  <div className="pl-3 text-white">
                    Historical {selectedAuditAsset.purity} Rate: {currency} {selectedAuditAsset.historical_gold_price ? (selectedAuditAsset.historical_gold_price * (selectedAuditAsset.purity === "24K" ? 1.0 : selectedAuditAsset.purity === "18K" ? 0.75 : 0.9167)).toFixed(2) : "N/A"}/g
                  </div>
                  <div className="pl-3 text-white">
                    Estimated Historical Metal Value: {selectedAuditAsset.gross_weight_grams} g × {currency} {selectedAuditAsset.historical_gold_price ? (selectedAuditAsset.historical_gold_price * (selectedAuditAsset.purity === "24K" ? 1.0 : selectedAuditAsset.purity === "18K" ? 0.75 : 0.9167)).toFixed(2) : "0.00"}/g
                  </div>
                  <div className="pl-3 font-semibold text-emerald-300">
                    = {currency} {selectedAuditAsset.historical_gold_value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <div className="mt-2">4. Finished Jewellery Value Markup Range (+10% to +30%):</div>
                  <div className="pl-3 font-semibold text-emerald-300">
                    = Range: {currency} {selectedAuditAsset.estimated_jewellery_value_min?.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {selectedAuditAsset.estimated_jewellery_value_max?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>

                  <div className="mt-2">5. Expected Liquidation Value Range (98% to 100%):</div>
                  <div className="pl-3 font-semibold text-emerald-300">
                    = Range: {currency} {selectedAuditAsset.estimated_liquidation_value_min?.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {selectedAuditAsset.estimated_liquidation_value_max?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

              <div className="border border-border bg-background p-3 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Estimation Confidence:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedAuditAsset.estimation_confidence === "High" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : selectedAuditAsset.estimation_confidence === "Medium"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {selectedAuditAsset.estimation_confidence || "Medium"}
                  </span>
                </div>
                <p className="text-[10px] text-mutedText mt-1 leading-normal">
                  {selectedAuditAsset.estimation_confidence === "High" && "High confidence: backed by direct date-specific retail invoices with verified matching parameters."}
                  {selectedAuditAsset.estimation_confidence === "Medium" && "Medium confidence: year average lookup applied. Exact date is approximate."}
                  {(!selectedAuditAsset.estimation_confidence || selectedAuditAsset.estimation_confidence === "Low") && "Low confidence: fallback calculations used due to missing parameters."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAuditModal(false)}
              className="w-full bg-gold hover:bg-gold-light text-background py-2.5 rounded-lg text-xs font-bold transition mt-2"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="h-4 w-4 text-gold" />
                Edit Gold Item
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-mutedText hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {editingAsset.documentation_status === "verified_invoice" && (
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-3 text-xs text-amber-400 flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Editing this item will override information extracted from the invoice.</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-mutedText uppercase">Jewellery Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-mutedText uppercase">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-white capitalize"
                  >
                    <option value="necklace">necklace</option>
                    <option value="ring">ring</option>
                    <option value="bracelet">bracelet</option>
                    <option value="earrings">earrings</option>
                    <option value="bangle">bangle</option>
                    <option value="pendant">pendant</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-mutedText uppercase">Purity</label>
                  <select
                    value={editForm.purity}
                    onChange={(e) => setEditForm({ ...editForm, purity: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                  >
                    <option value="24K">24K</option>
                    <option value="22K">22K</option>
                    <option value="18K">18K</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-mutedText uppercase">Gross Weight (grams)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.gross_weight_grams}
                    onChange={(e) => setEditForm({ ...editForm, gross_weight_grams: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-mutedText uppercase">Fine Gold (calculated)</label>
                  <input
                    type="text"
                    disabled
                    value={(Number(editForm.gross_weight_grams) * (editForm.purity === "24K" ? 0.999 : editForm.purity === "18K" ? 0.75 : 0.9167)).toFixed(2) + " g"}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-mutedText opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1 bg-background/40 p-3 rounded-lg border border-border/40">
                <label className="text-xs text-mutedText uppercase block font-semibold mb-1">How accurate is your purchase price?</label>
                <div className="flex gap-4 text-xs text-white">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_price_accuracy"
                      checked={editForm.purchase_price_status === "EXACT"}
                      onChange={() => setEditForm({
                        ...editForm,
                        purchase_price_status: "EXACT",
                        purchase_price_source: "USER_EXACT",
                        provenance_status: "SELF_REPORTED"
                      })}
                      className="accent-gold"
                    />
                    Exact
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_price_accuracy"
                      checked={editForm.purchase_price_status === "APPROXIMATE"}
                      onChange={() => setEditForm({
                        ...editForm,
                        purchase_price_status: "APPROXIMATE",
                        purchase_price_source: "USER_APPROXIMATE",
                        provenance_status: "SELF_REPORTED"
                      })}
                      className="accent-gold"
                    />
                    Approximate
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="edit_price_accuracy"
                      checked={editForm.purchase_price_status === "UNKNOWN"}
                      onChange={() => setEditForm({
                        ...editForm,
                        purchase_price_status: "UNKNOWN",
                        purchase_price_source: "UNKNOWN",
                        provenance_status: "SELF_REPORTED"
                      })}
                      className="accent-gold"
                    />
                    Don't remember
                  </label>
                </div>
              </div>

              {editForm.purchase_price_status !== "UNKNOWN" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-mutedText uppercase">Purchase Price</label>
                    <input
                      type="number"
                      value={editForm.purchase_price}
                      onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                      placeholder="Enter amount"
                    />
                    {editForm.purchase_price_status === "APPROXIMATE" && (
                      <span className="text-[10px] text-amber-400 block mt-0.5 leading-normal">
                        This amount is your personal estimate and may differ from the actual purchase price.
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-mutedText uppercase">Purchase Currency</label>
                    <select
                      value={editForm.currency}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="SGD">SGD</option>
                      <option value="INR">INR</option>
                      <option value="AED">AED</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="border border-blue-500/20 bg-blue-500/5 p-3 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-blue-300 block">Historical Value Wizard</span>
                  <p className="text-[10px] text-mutedText leading-normal">
                    Let GoldGuard retrieve historical prices from the purchase date/year to estimate value.
                  </p>
                  
                  {editForm.historical_gold_value ? (
                    <div className="space-y-1.5 text-xs text-white">
                      <div>Estimated Metal Value: <span className="font-semibold text-emerald-400">{editForm.currency} {editForm.historical_gold_value?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                      <div>Jewellery Value Range: <span className="font-semibold text-gold-light">{editForm.currency} {editForm.estimated_jewellery_value_min?.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {editForm.estimated_jewellery_value_max?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                      <div>Confidence: <span className="font-semibold text-blue-300">{editForm.estimation_confidence}</span></div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            purchase_price: String(prev.historical_gold_value),
                            purchase_price_status: "UNKNOWN",
                            purchase_price_source: "AI_ESTIMATED",
                            provenance_status: "AI_ESTIMATED_USER_CONFIRMED"
                          }))}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                        >
                          Use Historical Estimate
                        </button>
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            purchase_price_status: "APPROXIMATE",
                            purchase_price_source: "USER_APPROXIMATE",
                            provenance_status: "SELF_REPORTED"
                          }))}
                          className="bg-amber-500 hover:bg-amber-600 text-background font-bold text-[10px] px-2.5 py-1 rounded"
                        >
                          Enter My Own Approximate Price
                        </button>
                        <button
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            purchase_price: "",
                            purchase_price_status: "UNKNOWN",
                            purchase_price_source: "UNKNOWN",
                            provenance_status: "SELF_REPORTED"
                          }))}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                        >
                          Leave Purchase Price Unknown
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleEstimateHistoricalEdit}
                      disabled={estimating}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      {estimating ? "Calculating..." : "Estimate Historical Value"}
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-mutedText uppercase">Purchase Date</label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={editForm.purchase_date}
                    onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-mutedText uppercase">Provenance Status Override</label>
                  <select
                    value={editForm.provenance_status}
                    onChange={(e) => setEditForm({ ...editForm, provenance_status: e.target.value as any })}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-white"
                  >
                    <option value="INVOICE_VERIFIED">Invoice Verified</option>
                    <option value="SELF_REPORTED">Self Reported</option>
                    <option value="AI_ESTIMATED">AI Estimated</option>
                    <option value="AI_ESTIMATED_USER_CONFIRMED">AI + User Confirmed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-mutedText uppercase">Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg p-2 text-white text-xs resize-none"
                  placeholder="Add details about hallmarks, brand, design etc."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 border border-border py-2.5 rounded-lg text-white text-sm font-semibold hover:bg-cardHover transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-gold hover:bg-gold-light text-background py-2.5 rounded-lg text-sm font-bold transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Remove Gold Item?</h3>
              <p className="text-xs text-mutedText mt-1.5 leading-normal">
                Removing this item will update your portfolio totals, market value, category distribution and AI recommendations.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 border border-border py-2 rounded-lg text-white text-xs font-semibold hover:bg-cardHover transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspicious Price Warning Modal */}
      {showSuspiciousPriceWarning && priceWarningInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold">⚠️ Unusual Purchase Price</h3>
            </div>
            
            <p className="text-xs text-mutedText leading-relaxed">
              This purchase price appears unusually high or low relative to the estimated raw gold value for {priceWarningInfo.weight}g of {priceWarningInfo.purity} gold.
            </p>

            <div className="bg-background border border-border rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-mutedText">Estimated Gold Content:</span>
                <span className="font-semibold text-white">{(priceWarningInfo.weight * (priceWarningInfo.purity === "24K" ? 0.999 : priceWarningInfo.purity === "18K" ? 0.75 : 0.9167)).toFixed(2)} g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mutedText">Estimated Raw Metal Value:</span>
                <span className="font-semibold text-gold">{priceWarningInfo.currency} {priceWarningInfo.baseValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between border-t border-border/40 pt-2 font-bold">
                <span className="text-white">Entered Purchase Price:</span>
                <span className="text-red-400">{priceWarningInfo.currency} {priceWarningInfo.enteredPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-[10px] text-mutedText">
                <span>Price Difference Ratio:</span>
                <span className="text-red-300">{(priceWarningInfo.enteredPrice / priceWarningInfo.baseValue * 100).toFixed(0)}% of spot value</span>
              </div>
            </div>

            <p className="text-[10px] text-mutedText leading-normal">
              Is this purchase price correct? Press **Save Anyway** if this piece has legitimate premiums like intricate workmanship, diamonds/stones, or high antique collection value.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSuspiciousPriceWarning(false)}
                className="flex-1 border border-border py-2 rounded-lg text-white text-xs font-semibold hover:bg-cardHover transition"
              >
                Review Value
              </button>
              <button
                onClick={handleSaveAnyway}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-bold transition"
              >
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Photo Lightbox Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl border border-gold/30 bg-card p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedImageModal.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
                    {selectedImageModal.purity} Gold
                  </span>
                </h3>
                <span className="text-xs text-mutedText uppercase tracking-wider">
                  Category: {selectedImageModal.category}
                </span>
              </div>
              <button 
                onClick={() => setSelectedImageModal(null)} 
                className="rounded-lg p-1.5 text-mutedText hover:text-white hover:bg-cardHover transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Large High-Res Image View */}
            <div className="relative flex-1 min-h-[260px] max-h-[50vh] bg-black/70 rounded-xl overflow-hidden flex items-center justify-center border border-border/60">
              <img
                src={selectedImageModal.url}
                alt={selectedImageModal.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 bg-background/90 p-3 rounded-xl border border-border text-center">
              <div>
                <span className="text-[10px] text-mutedText uppercase tracking-wider block font-medium">Gross Weight</span>
                <span className="text-sm font-bold text-white font-mono">{selectedImageModal.gross_weight}g</span>
              </div>
              <div>
                <span className="text-[10px] text-mutedText uppercase tracking-wider block font-medium">Fine Gold</span>
                <span className="text-sm font-bold text-white font-mono">{selectedImageModal.fine_weight}g</span>
              </div>
              <div>
                <span className="text-[10px] text-mutedText uppercase tracking-wider block font-medium">Current Gold Value</span>
                <span className="text-sm font-bold text-gold font-mono">{currency} {selectedImageModal.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background hover:bg-cardHover text-white text-xs font-semibold border border-border cursor-pointer transition">
                <Camera className="h-4 w-4 text-gold" />
                <span>Upload Custom Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const res = await api.uploadAssetImage(selectedImageModal.asset_id, file);
                        if (res.status === "success" || res.image_reference) {
                          alert("Jewellery picture updated successfully!");
                          setSelectedImageModal(null);
                          onAssetAddedOrDeleted();
                        }
                      } catch (err) {
                        alert("Error uploading image");
                      }
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const modal = selectedImageModal;
                    setSelectedImageModal(null);
                    handleOpenTryOn({
                      category: modal.category,
                      purity: modal.purity,
                      style: "traditional",
                      colour: "Yellow Gold",
                      image: modal.url
                    });
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-background text-xs font-bold transition shadow-md"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Virtual Try-On</span>
                </button>

                <button
                  onClick={() => setSelectedImageModal(null)}
                  className="px-4 py-2 rounded-lg border border-border text-mutedText hover:text-white text-xs font-medium hover:bg-cardHover transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TryOnModal
        isOpen={isTryOnOpen}
        onClose={() => setIsTryOnOpen(false)}
        jewellery={tryOnItem}
      />
    </div>
  );
};
