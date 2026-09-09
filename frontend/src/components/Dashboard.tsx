import React, { useEffect, useState } from "react";
import { api, type Asset, type PortfolioSummary } from "../services/api";
import { logger } from "../services/logger";
import { compressImageToDataUrl } from "../utils/imageCompression";
import { 
  Trash2, Sparkles, ChevronDown, ChevronUp, Send, Edit, AlertTriangle, X, 
  Calculator, Camera, Info, Grid, List, Maximize2, Eye, ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, RefreshCw, Upload
} from "lucide-react";
import { TryOnModal } from "./TryOnModal";


interface DashboardProps {
  currency: string;
  refreshTrigger: number;
  onAssetAddedOrDeleted: () => void;
  viewMode?: "summary" | "collection";
  onPlanPurchase?: (rec: any) => void;
  onNavigateToCollection?: () => void;
}

interface ChatMessage {
  sender: "user" | "goldguard";
  text: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  currency, 
  refreshTrigger, 
  onAssetAddedOrDeleted, 
  viewMode = "summary", 
  onPlanPurchase,
  onNavigateToCollection 
}) => {
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestRate, setLatestRate] = useState<number>(141.72 * (currency === "SGD" ? 1.34 : (currency === "INR" ? 83.5 : (currency === "AED" ? 3.67 : 1))));
  const [showCalculationInfo, setShowCalculationInfo] = useState(false);
  const [showDetailedAudit, setShowDetailedAudit] = useState(false);

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
      if (imgRef.startsWith("/uploads/")) {
        if (typeof window !== "undefined" && window.location.port === "5173") {
          const host = window.location.hostname || "localhost";
          return `http://${host}:8000${imgRef}`;
        }
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
  const [isChatExpanded, setIsChatExpanded] = useState(false);

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
    estimation_method: null as string | null,
    image_reference: null as string | null
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
      logger.info("Dashboard", `Loading ${viewMode === "collection" ? "My Collection" : "Dashboard"} (currency: ${currency})...`);
      try {
        const healthRes = await api.getHealth();
        setIsDemoMode(healthRes.demo_mode);

        const portRes = await api.getPortfolio(currency);
        const rawAssets = portRes.assets || [];
        const seenIds = new Set<string>();
        const assets = rawAssets.filter((a: any) => {
          if (!a.asset_id || seenIds.has(a.asset_id)) return false;
          seenIds.add(a.asset_id);
          return true;
        });
        setPortfolio(assets);
        setSummary(portRes.summary || null);

        const priceRes = await api.getPrices(currency);
        const rate = priceRes.latest_price || 189.9;
        setLatestRate(rate);

        logger.info("Dashboard", `Vault loaded: ${assets.length} items, total value: ${currency} ${portRes.summary?.estimated_current_value?.toLocaleString() || "0"}`);
        logger.valuation("Dashboard", `Spot gold rate configured at ${currency} ${rate.toFixed(2)}/g`);

        // Warm up purchase plan in background asynchronously without blocking the UI render
        api.compilePurchasePlan({
          user_id: "user_bride",
          target_purity: "22K",
          timeline_months: 12,
          exchange_candidate_asset_ids: ["ASSET_002"],
          home_currency: currency
        }).catch((err) => {
          logger.warn("Dashboard", "Background purchase plan simulation deferred", err);
        });

      } catch (err: any) {
        logger.error("Dashboard", `Failed to load dashboard data: ${err.message || err}`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currency, refreshTrigger, viewMode]);

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

  const [editImageUploading, setEditImageUploading] = useState(false);

  const handleEditPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setEditImageUploading(true);
      const dataUrl = await compressImageToDataUrl(file);
      setEditForm(prev => ({ ...prev, image_reference: dataUrl }));
    } catch (err) {
      console.error("Failed to process image:", err);
      alert("Failed to process the uploaded photo. Please try again.");
    } finally {
      setEditImageUploading(false);
    }
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
      estimation_method: asset.estimation_method || null,
      image_reference: asset.image_reference || null
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
      image_reference: editForm.image_reference || editingAsset?.image_reference || null
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
    setIsChatExpanded(true);
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

  const confidenceDist = getConfidenceDistribution();
  const aiEstimatedItem = confidenceDist.find(d => d.key === "ai_estimated");
  const aiEstimatedPct = aiEstimatedItem ? getPercentageOfTotalWeight(aiEstimatedItem.weight) : 0;

  const safeSummary: PortfolioSummary = summary || {
    total_assets: portfolio.length,
    total_gross_weight_grams: portfolio.reduce((acc, a) => acc + (a.gross_weight_grams || 0), 0),
    total_net_gold_weight_grams: portfolio.reduce((acc, a) => acc + (a.net_gold_weight_grams || 0), 0),
    estimated_current_value: portfolio.reduce((acc, a) => acc + (a.estimated_current_value || 0), 0),
    total_historical_gold_value: portfolio.reduce((acc, a) => acc + (a.historical_gold_value || 0), 0),
    total_purchase_cost: portfolio.reduce((acc, a) => acc + (a.purchase_price_converted || a.purchase_price || 0), 0),
    total_estimated_purchase_price: portfolio.reduce((acc, a) => acc + (a.purchase_price_converted || a.purchase_price || 0), 0),
    gain_loss: 0,
    gain_loss_percent: 0,
    health_score: {
      overall_score: 92,
      grade: "A",
      components: {
        diversification: 85,
        data_confidence: 88,
        liquidity: 90,
        purity: 95,
        purchase_readiness: 92
      },
      explanations: {
        purity: "High purity standard",
        diversification: "Balanced gold allocation"
      }
    },
    currency
  };
  const s = safeSummary;

  const totalWeight = s.total_gross_weight_grams || 1.0;
  const recs = s.category_recommendations;
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
          {/* BEAT 1: THE PRIVATE GOLD VAULT MASTER CARD (Apple Card Style) */}
          <div className="rounded-3xl border border-gold/40 bg-gradient-to-br from-[#1c1917] via-[#12110e] to-[#1c1917] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Background luxury shimmer / radial glow */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-gold-light/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Card Header: Vault identity & live health */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-gold-light">
                    Private Gold Vault
                  </span>
                  <span className="text-[10px] text-mutedText border-l border-border/60 pl-2">
                    Official Reference: {currency}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-background/80 border border-gold/30 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                    <span>Vault Health:</span>
                    <span className="text-gold font-mono">{s.health_score?.overall_score || 92}/100</span>
                    <span className="text-[10px] text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                      Grade {s.health_score?.grade || "A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Hero: Total Gold Wealth & All-Time Metal Growth */}
              <div className="py-2">
                <span className="text-[11px] uppercase tracking-widest text-mutedText block font-bold mb-1.5">
                  Total Estimated Gold Wealth
                </span>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-gold">
                    {currency} {s.estimated_current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <div className={`inline-flex items-center gap-1 text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg w-fit ${
                    s.gain_loss >= 0 
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                  }`}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>
                      {s.gain_loss >= 0 ? "+" : ""}
                      {s.gain_loss_percent.toFixed(2)}%
                    </span>
                    <span className="text-[11px] opacity-80 font-normal">
                      ({currency} {s.gain_loss.toLocaleString(undefined, { maximumFractionDigits: 0 })} gain)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-mutedText mt-2">
                  Live market valuation calibrated to official 24K bullion & 22K board rates.
                </p>
              </div>

              {/* Bottom Row: 3 Core Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-border/50">
                <div className="bg-card/70 border border-border/60 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider block">
                    Physical Gold Weight
                  </span>
                  <span className="text-xl font-black text-white font-mono block">
                    {s.total_gross_weight_grams.toFixed(2)} g
                  </span>
                  <p className="text-[10px] text-gold-light">
                    {purityDist[0]?.name || "22K"} dominant holdings across {portfolio.length} pieces
                  </p>
                </div>

                <div className="bg-card/70 border border-border/60 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider block">
                    Fine Pure Gold (24K Equiv.)
                  </span>
                  <span className="text-xl font-black text-white font-mono block">
                    {s.total_net_gold_weight_grams.toFixed(2)} g
                  </span>
                  <p className="text-[10px] text-mutedText">
                    100% fine gold metal content
                  </p>
                </div>

                <div className="bg-card/70 border border-border/60 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider block">
                    Instant Cash Liquidity
                  </span>
                  <span className="text-xl font-black text-amber-300 font-mono block">
                    {currency} {(s.estimated_current_value * 0.98).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <p className="text-[10px] text-mutedText">
                    Immediate melt / exchange cash value today
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BEAT 2: AI COPILOT & LIVE GOLD MARKET HEADER */}
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-card via-card to-background p-4 sm:p-5 space-y-3.5 shadow-lg shadow-black/20">
            {/* Top Bar: Copilot Title & Live Gold Rates Ticker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                  <Sparkles className="h-4 w-4 text-gold animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black tracking-wide text-white uppercase">Ask GoldGuard</h3>
                    <span className="text-[10px] bg-gold/15 text-gold-light border border-gold/30 px-2 py-0.5 rounded-full font-bold">
                      AI Copilot
                    </span>
                  </div>
                  <p className="text-[11px] text-mutedText">Instant portfolio intelligence & purchase decisions</p>
                </div>
              </div>

              {/* Compact Live Gold Rates Pill */}
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-background/90 border border-border/80 px-3 py-1.5 rounded-full text-xs font-semibold shadow-inner">
                  <span className="flex items-center gap-1.5 text-mutedText text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${isDemoMode ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`}></span>
                    Live Rates:
                  </span>
                  <span className="text-gold font-mono text-[11px] sm:text-xs">24K: {currency} {goldRate24K.toFixed(1)}</span>
                  <span className="text-border">|</span>
                  <span className="text-gold-light font-mono text-[11px] sm:text-xs">22K: {currency} {goldRate22K.toFixed(1)}</span>
                  <span className="text-border">|</span>
                  <span className="text-amber-200/80 font-mono text-[11px] sm:text-xs">18K: {currency} {goldRate18K.toFixed(1)}/g</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCalculationInfo(!showCalculationInfo)}
                  className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1 ${
                    showCalculationInfo 
                      ? "border-gold bg-gold/15 text-gold" 
                      : "border-border bg-background/60 hover:border-gold/50 text-mutedText hover:text-white"
                  }`}
                  title="View rate source & calculation methodology"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold hidden sm:inline">Methodology</span>
                </button>

                {chatHistory.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsChatExpanded(!isChatExpanded)}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-border/70 hover:border-gold text-mutedText hover:text-white transition flex items-center gap-1"
                  >
                    {isChatExpanded ? "Hide Chat" : `View Chat (${chatHistory.length})`}
                    {isChatExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>
            </div>

            {/* Calculation Methodology Drawer */}
            {showCalculationInfo && (
              <div className="p-4 bg-background/90 border border-border rounded-xl space-y-3 text-xs animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-border/70 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-gold" />
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">Gold Rate Calculation & Pricing Source</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowCalculationInfo(false)}
                    className="text-mutedText hover:text-white p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-mutedText bg-card/50 p-2.5 rounded-lg border border-border/50">
                  <div><strong className="text-white">Updated:</strong> {new Date().toLocaleDateString()}</div>
                  <div><strong className="text-white">Currency:</strong> {currency}</div>
                  <div><strong className="text-white">Unit:</strong> per gram (/g)</div>
                  <div><strong className="text-white">Market Source:</strong> Joyalukkas / Live Market Data</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                  <div className="bg-card border border-border/80 p-3 rounded-lg space-y-1.5">
                    <span className="text-white font-bold block">1. Direct Gold Rate Calculation (Jewellery Standard)</span>
                    <p className="text-mutedText">
                      Physical gross weight × purity-specific retail board rate:
                    </p>
                    <div className="bg-background border border-border/40 p-2 rounded font-mono text-[10px] text-emerald-400">
                      Current Gold Value = Gross Weight × Current Gold Rate<br />
                      <span className="text-mutedText">Example 22K (48.5g): {currency} {(48.5 * goldRate22K).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                  </div>

                  <div className="bg-card border border-border/80 p-3 rounded-lg space-y-1.5">
                    <span className="text-white font-bold block">2. Equivalent Fine Gold (Spot Metal Rate)</span>
                    <p className="text-mutedText">
                      Gross weight × purity factor × 24K pure bullion spot rate:
                    </p>
                    <div className="bg-background border border-border/40 p-2 rounded font-mono text-[10px] text-emerald-400">
                      Fine Gold Weight = Gross Weight × Purity Factor<br />
                      <span className="text-mutedText">Example (44.46g pure): {currency} {(44.46 * goldRate24K).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-mutedText leading-relaxed">
                  Both methods yield consistent pure metal valuation. Purity rates: 22K = 24K × 22/24, 18K = 24K × 18/24. Value excludes making charges, design markups, and GST.
                </p>
              </div>
            )}

            {/* Search / Prompt Input Bar */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAskQuestion(chatInput);
              }}
              className="relative flex items-center"
            >
              <div className="relative w-full flex items-center">
                <Sparkles className="absolute left-3.5 h-4 w-4 text-gold pointer-events-none" />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything: 'Can I exchange my necklace?', 'Why is portfolio value different?', '18K vs 22K?'..."
                  className="w-full bg-background/90 border border-gold/30 hover:border-gold/50 focus:border-gold rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-white placeholder-mutedText focus:outline-none focus:ring-1 focus:ring-gold/40 shadow-inner transition"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="absolute right-1.5 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-background font-black text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40 transition shadow"
                >
                  {chatLoading ? (
                    <div className="h-3.5 w-3.5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Ask</span>
                </button>
              </div>
            </form>

            {/* Suggested Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider shrink-0">Try:</span>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAskQuestion(q)}
                  className="text-[11px] bg-background/70 hover:bg-gold/10 hover:border-gold/60 border border-border text-gold-light hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Expandable Chat Drawer */}
            {isChatExpanded && (
              <div className="bg-background/90 border border-border/80 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-gold" />
                    GoldGuard AI Response
                  </span>
                  <div className="flex items-center gap-2">
                    {chatHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setChatHistory([
                          { sender: "goldguard", text: "Hello! I am GoldGuard. Ask me anything about your gold portfolio, valuations, concentration risk, or planning details." }
                        ])}
                        className="text-[10px] text-mutedText hover:text-rose-400 transition"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsChatExpanded(false)}
                      className="text-mutedText hover:text-white text-xs"
                      title="Collapse responses"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {chatHistory.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-gold text-background self-end font-bold ml-auto" 
                          : "bg-card border border-border text-white mr-auto"
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ 
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*\?(.*?)\*\?/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br />') 
                      }}></div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-card border border-border text-white mr-auto rounded-xl p-3 text-xs flex items-center gap-2 w-fit">
                      <span className="text-mutedText text-[11px]">GoldGuard is analyzing your portfolio...</span>
                      <div className="h-1.5 w-1.5 bg-gold rounded-full animate-bounce"></div>
                      <div className="h-1.5 w-1.5 bg-gold rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="h-1.5 w-1.5 bg-gold rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BEAT 3: THE PHYSICAL VAULT GALLERY (Show the Gold!) */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Your Physical Pieces</h3>
                  <span className="text-[10px] bg-gold/15 text-gold border border-gold/30 px-2 py-0.5 rounded-full font-bold">
                    {portfolio.length} Pieces
                  </span>
                </div>
                <p className="text-xs text-mutedText">Tap any piece to inspect metal weight, purity certificate, and live valuation</p>
              </div>

              {onNavigateToCollection && (
                <button
                  type="button"
                  onClick={onNavigateToCollection}
                  className="text-xs font-bold text-gold hover:text-gold-light flex items-center gap-1 transition group"
                >
                  <span>View All Collection</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Shelf */}
            <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {portfolio.map((item, idx) => {
                const imgUrl = resolveImageUrl(item.image_reference, item.category);
                return (
                  <div
                    key={`${item.asset_id}-${idx}`}
                    onClick={() => handleAuditClick(item)}
                    className="w-56 sm:w-64 shrink-0 rounded-xl border border-border/80 hover:border-gold/60 bg-background/80 hover:bg-cardHover p-3 space-y-3 cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-gold/10 hover:shadow-md flex flex-col justify-between"
                  >
                    {/* Image Container with Badges */}
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-card border border-border/50">
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const fallback = resolveImageUrl(null, item.category);
                          const target = e.currentTarget as HTMLImageElement;
                          if (target.src !== fallback) {
                            target.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="text-[10px] font-extrabold bg-black/80 backdrop-blur-md text-gold px-2 py-0.5 rounded-md border border-gold/30">
                          {item.purity}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold bg-black/80 backdrop-blur-md text-white px-2 py-0.5 rounded-md border border-white/20 font-mono">
                          {item.gross_weight_grams}g
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="text-[10px] font-bold text-white flex items-center gap-1">
                          <Eye className="h-3 w-3 text-gold" /> Inspect Piece ›
                        </span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {item.documentation_status === "verified_invoice" ? "Verified" : "Tracked"}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-gold transition">
                        {item.name}
                      </h4>
                      <div className="flex items-baseline justify-between pt-1 border-t border-border/40">
                        <span className="text-[10px] text-mutedText">Current Value</span>
                        <span className="text-xs sm:text-sm font-black font-mono text-gold">
                          {currency} {(item.estimated_current_value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BEAT 4: PRIVATE CONCIERGE RECOMMENDATION (Your Next Best Move) */}
          <div className="rounded-3xl border border-gold/40 bg-gradient-to-r from-gold/15 via-card to-background p-6 sm:p-8 space-y-5 shadow-xl relative overflow-hidden">
            {(() => {
              const recs = s.category_recommendations;
              const selectedRec = recs?.selected_recommendation;
              const maxCatName = recs?.max_concentration_category || "Necklace";
              const maxCatPct = recs?.max_concentration_percentage || 0;
              const whyNotDominant = recs?.why_not_another_dominant_category;

              const decisionHeading = recs?.decision_title || (maxCatPct >= 50 ? `Don't add another ${maxCatName.toLowerCase()} right now. Acquire a 22K Bracelet.` : `Diversify your collection with a 22K Bracelet.`);
              const recommendedCategory = selectedRec?.category || "Bracelet";
              const purchaseScore = selectedRec?.score || 96;

              const suggestedWeightRange = recommendedCategory.toLowerCase() === "necklace" ? "30–50g" : (recommendedCategory.toLowerCase() === "bracelet" ? "6–9g" : "4–8g");
              const suggestedPurity = "18K / 22K";
              const minEstimatedPrice = (recommendedCategory.toLowerCase() === "bracelet" ? 6 : 4) * (latestRate * 0.9167) * 1.15;
              const maxEstimatedPrice = (recommendedCategory.toLowerCase() === "bracelet" ? 9 : 8) * (latestRate * 0.9167) * 1.25;

              return (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <span className="text-xs font-black uppercase tracking-widest text-gold">
                        Private Wealth Concierge
                      </span>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 w-fit">
                      Acquisition Score: {purchaseScore}/100 · High Diversification
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    {/* Left 2 Cols: The Rationale & Story */}
                    <div className="lg:col-span-2 space-y-3">
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                        {decisionHeading}
                      </h3>
                      <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
                        {whyNotDominant?.reason || `${maxCatPct}% of your tracked gold weight is concentrated in ${maxCatName.toLowerCase()}s. Adding another piece in the same category locks up redundant capital in making charges. Acquiring a contemporary ${recommendedCategory.toLowerCase()} brings immediate visual balance and daily utility.`}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs pt-2">
                        <div className="bg-background/80 border border-border px-3 py-1.5 rounded-lg">
                          <span className="text-mutedText block text-[10px] uppercase font-bold">Suggested Weight</span>
                          <span className="text-white font-bold">{suggestedWeightRange}</span>
                        </div>
                        <div className="bg-background/80 border border-border px-3 py-1.5 rounded-lg">
                          <span className="text-mutedText block text-[10px] uppercase font-bold">Recommended Purity</span>
                          <span className="text-white font-bold">{suggestedPurity}</span>
                        </div>
                        <div className="bg-background/80 border border-border px-3 py-1.5 rounded-lg">
                          <span className="text-mutedText block text-[10px] uppercase font-bold">Estimated Budget</span>
                          <span className="text-gold font-bold font-mono">
                            {currency} {minEstimatedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})} – {maxEstimatedPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Col: Action Buttons */}
                    <div className="flex flex-col gap-2.5 sm:self-center">
                      {onPlanPurchase && selectedRec && (
                        <button
                          type="button"
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
                          className="w-full bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-background font-black text-xs sm:text-sm py-3 px-5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                        >
                          <span>Plan This Acquisition</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          handleOpenTryOn({
                            category: selectedRec?.category || "Bracelet",
                            purity: "22K",
                            style: "contemporary",
                            colour: "yellow",
                            image: null
                          });
                        }}
                        className="w-full border border-gold/50 hover:border-gold bg-background/70 hover:bg-gold/10 text-gold-light font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-gold" />
                        <span>Virtual Try-On in AR</span>
                      </button>
                    </div>
                  </div>

                  {/* Why not another necklace collapsible accordion */}
                  <div className="border-t border-border/30 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowWhyNotNecklace(!showWhyNotNecklace)}
                      className="text-xs text-mutedText hover:text-white flex items-center justify-between w-full focus:outline-none transition py-1"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-light">
                        <Info className="h-3.5 w-3.5 text-gold" />
                        Why not another {maxCatName.toLowerCase()}? (Deep Concentration Analysis)
                      </span>
                      {showWhyNotNecklace ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {showWhyNotNecklace && (
                      <div className="mt-3 bg-background/90 border border-border p-4 rounded-xl space-y-3 text-xs animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-card border border-border p-2.5 rounded-lg">
                            <span className="text-[10px] uppercase text-mutedText block">Current {maxCatName} Share</span>
                            <span className="text-base font-black text-amber-400 font-mono">{maxCatPct}%</span>
                          </div>
                          <div className="bg-card border border-border p-2.5 rounded-lg">
                            <span className="text-[10px] uppercase text-mutedText block">Existing {maxCatName}s Tracked</span>
                            <span className="text-base font-black text-white font-mono">{whyNotDominant?.dominant_count || 2} pieces</span>
                          </div>
                          <div className="bg-card border border-border p-2.5 rounded-lg">
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

          {/* BEAT 5: VAULT HEALTH TRIAD & COLLAPSIBLE AUDIT */}
          <div className="space-y-4">
            {/* 3 Clean Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Health Card 1: Category Balance */}
              <div className={`p-5 rounded-2xl border ${
                isOverConcentrated 
                  ? "border-amber-500/30 bg-amber-500/5" 
                  : "border-emerald-500/30 bg-emerald-500/5"
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-mutedText">Category Balance</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOverConcentrated ? "bg-amber-400/20 text-amber-300" : "bg-emerald-400/20 text-emerald-300"
                  }`}>
                    {isOverConcentrated ? "Moderate Concentration" : "Balanced"}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">{maxCatName}s Dominant</span>
                    <span className="text-sm font-black font-mono text-gold">{maxCatPct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isOverConcentrated ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${maxCatPct}%` }} />
                  </div>
                </div>
                <p className="text-[11px] text-mutedText leading-relaxed">
                  {isOverConcentrated
                    ? `Over ${maxCatPct}% of gold weight is in ${maxCatName.toLowerCase()}s. Diversifying into other categories reduces portfolio risk.`
                    : "Your jewellery collection is evenly distributed across multiple categories."}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categoryDist.map(c => {
                    const pct = getPercentageOfTotalWeight(c.weight);
                    return (
                      <span key={c.name} className="text-[10px] bg-background/80 border border-border/80 px-2 py-0.5 rounded text-mutedText font-medium">
                        {c.name}: <strong className="text-white font-mono">{pct}%</strong>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Health Card 2: Purity Distribution */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-mutedText">Purity Distribution</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                    22K Dominant
                  </span>
                </div>
                <div className="space-y-2">
                  {purityDist.map(p => {
                    const pct = getPercentageOfTotalWeight(p.weight);
                    return (
                      <div key={p.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-white font-mono">{p.name}</span>
                          <span className="text-mutedText font-mono">{p.weight.toFixed(1)}g ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-mutedText">
                  Physical gold weight mapped to high-purity retail jewellery standards.
                </p>
              </div>

              {/* Health Card 3: Documentation & Provenance */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-mutedText">Documentation Status</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      confidenceLevel === "High" 
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    }`}>
                      {confidenceLevel} Confidence
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-white">Invoice Verified</span>
                      <span className="text-xs font-black font-mono text-emerald-400">{Math.round(invoicePctRaw)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${invoicePctRaw}%` }} />
                    </div>
                  </div>
                  <p className="text-[11px] text-mutedText">
                    {aiEstimatedPct > 0 
                      ? `${aiEstimatedPct}% of weight is AI estimated. Adding receipts boosts liquidation certainty.`
                      : "All physical items have backed documentation and price receipts."}
                  </p>
                </div>

                {aiEstimatedPct > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const aiAsset = portfolio.find(a => a.provenance_status === "AI_ESTIMATED" || a.documentation_status === "ai_estimated");
                      if (aiAsset) handleEditClick(aiAsset);
                      else alert("All items currently have verified documentation.");
                    }}
                    className="w-full bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold-light font-bold text-xs py-1.5 rounded-lg transition"
                  >
                    Verify Missing Holding
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Deep Accounting Audit Drawer */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDetailedAudit(!showDetailedAudit)}
                className="w-full px-5 py-3.5 bg-background/50 hover:bg-cardHover flex items-center justify-between text-xs font-bold text-mutedText hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-gold" />
                  <span>Detailed Metal Audit, Liquidation Haircuts & Accounting Math</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gold">
                  {showDetailedAudit ? "Hide Details" : "Show Deep Audit"}
                  {showDetailedAudit ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {showDetailedAudit && (
                <div className="p-5 border-t border-border space-y-5 text-xs animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-background border border-border p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-mutedText">Fine Gold Content</span>
                      <span className="text-xl font-black text-white font-mono block">
                        {s.total_net_gold_weight_grams.toFixed(2)} g
                      </span>
                      <p className="text-[10px] text-mutedText">Gross Weight × (Purity / 24)</p>
                    </div>

                    <div className="bg-background border border-border p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gold">Current Metal Value</span>
                      <span className="text-xl font-black text-white font-mono block">
                        {currency} {s.estimated_current_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <p className="text-[10px] text-mutedText">Fine gold × 24K spot gold rate</p>
                    </div>

                    <div className="bg-background border border-border p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-amber-400">Estimated Liquidation</span>
                      <span className="text-xl font-black text-white font-mono block">
                        {currency} {(s.estimated_current_value * 0.98).toLocaleString(undefined, {maximumFractionDigits: 0})} – {(s.estimated_current_value * 1.00).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                      <p className="text-[10px] text-mutedText">98% – 100% net melt recovery value</p>
                    </div>

                    <div className="bg-background border border-border p-3.5 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-blue-400">Estimated Replacement Cost</span>
                      <span className="text-xl font-black text-white font-mono block">
                        {currency} {(s.estimated_current_value * 1.10).toLocaleString(undefined, {maximumFractionDigits: 0})} – {(s.estimated_current_value * 1.30).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </span>
                      <p className="text-[10px] text-mutedText">Retail price including 10%–30% making</p>
                    </div>
                  </div>

                  <div className="p-4 bg-background border border-border/80 rounded-xl space-y-2 text-[11px] text-mutedText">
                    <strong className="text-white">Notice on Pricing & Purity Adjustments:</strong>
                    <p>
                      Gold rates are calibrated to Joyalukkas / SG Bullion board rates. Purity rates: 22K = 24K × 22/24; 18K = 24K × 18/24. Direct Gross Weight valuation and Equivalent Fine Gold valuation yield identical metal value results.
                    </p>
                  </div>
                </div>
              )}
            </div>
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
                  {filteredPortfolio.map((a, idx) => {
                    const status = a.purchase_price_status || "EXACT";
                    const currentMetalVal = a.current_gold_metal_value || a.estimated_current_value || 0;
                    const imgSrc = resolveImageUrl(a.image_reference, a.category);

                    return (
                      <div 
                        key={`${a.asset_id}-${idx}`}
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
                              const fallback = resolveImageUrl(null, a.category);
                              const target = e.currentTarget;
                              if (!target.src.endsWith(fallback)) {
                                target.src = fallback;
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
                        {filteredPortfolio.map((a, idx) => {
                          const status = a.purchase_price_status || "EXACT";
                          const currentMetalVal = a.current_gold_metal_value || a.estimated_current_value || 0;
                          const imgSrc = resolveImageUrl(a.image_reference, a.category);
                          
                          return (
                            <React.Fragment key={`${a.asset_id}-${idx}`}>
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
                                          const fallback = resolveImageUrl(null, a.category);
                                          const target = e.currentTarget;
                                          if (!target.src.endsWith(fallback)) {
                                            target.src = fallback;
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
              {/* Photo preview & edit */}
              <div className="flex items-center gap-4 p-3 bg-background/50 rounded-xl border border-border/60">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gold/30 bg-card flex-shrink-0 flex items-center justify-center relative">
                  {editForm.image_reference ? (
                    <img 
                      src={resolveImageUrl(editForm.image_reference, editForm.category)} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-mutedText" />
                  )}
                  {editImageUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-gold animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/40 bg-gold/10 text-gold text-xs font-semibold cursor-pointer hover:bg-gold/20 transition">
                      <Upload className="w-3.5 h-3.5" />
                      {editImageUploading ? "Compressing..." : editForm.image_reference ? "Change Photo" : "Upload Photo"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={editImageUploading}
                        onChange={handleEditPhotoChange}
                      />
                    </label>
                    {editForm.image_reference && (
                      <button 
                        type="button" 
                        onClick={() => setEditForm(prev => ({ ...prev, image_reference: null }))}
                        className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-mutedText">
                    Custom photo is stored directly with your vault asset.
                  </p>
                </div>
              </div>

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
