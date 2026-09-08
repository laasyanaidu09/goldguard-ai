import React, { useState, useEffect, useMemo } from "react";
import { api, type Asset } from "../services/api";
import { 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  RotateCcw, 
  Layers, 
  Eye, 
  Gem,
  Check
} from "lucide-react";
import { TryOnModal } from "./TryOnModal";

interface PlanPurchaseProps {
  currency: string;
  market: string;
  preloadedRecommendation: any | null;
  onClearPreload: () => void;
}

interface SchemeOption {
  id: string;
  providerName: string;
  schemeName: string;
  country: string;
  durationMonths: number;
  bonusBenefitDescription: string;
  bonusBenefitMultiplier: number;
  highlight: string;
}

const REGIONAL_SCHEMES: SchemeOption[] = [
  {
    id: "in-tanishq-10",
    providerName: "Tanishq",
    schemeName: "Tanishq Golden Harvest (10+1)",
    country: "India",
    durationMonths: 10,
    bonusBenefitDescription: "75% of one monthly installment as a bonus at maturity",
    bonusBenefitMultiplier: 0.75,
    highlight: "Popular 10+1 Month Plan"
  },
  {
    id: "in-kalyan-12",
    providerName: "Kalyan Jewellers",
    schemeName: "Kalyan Dhanvarsha Gold Scheme (11+1)",
    country: "India",
    durationMonths: 11,
    bonusBenefitDescription: "1 full month installment contributed free by Kalyan Jewellers",
    bonusBenefitMultiplier: 1.0,
    highlight: "Full 1-Month Bonus"
  },
  {
    id: "in-malabar-11",
    providerName: "Malabar Gold",
    schemeName: "Malabar Smart Buy jewellery Plan",
    country: "India",
    durationMonths: 11,
    bonusBenefitDescription: "Flat 10% discount on making charges + gold rate lock protection",
    bonusBenefitMultiplier: 0.9,
    highlight: "Rate Lock & Making Discount"
  },
  {
    id: "sg-sk-10",
    providerName: "SK Jewellery",
    schemeName: "SK 10-Month Gold Savings Plan",
    country: "Singapore",
    durationMonths: 10,
    bonusBenefitDescription: "50% off workmanship fees + gold price protection lock",
    bonusBenefitMultiplier: 0.5,
    highlight: "Gold Price Protection"
  },
  {
    id: "sg-goldheart-6",
    providerName: "Goldheart",
    schemeName: "Goldheart Half-Year Luxe Saver",
    country: "Singapore",
    durationMonths: 6,
    bonusBenefitDescription: "SGD 150 loyalty gift voucher at maturity + GST waiver on making charges",
    bonusBenefitMultiplier: 0.3,
    highlight: "6-Month Quick Maturity"
  }
];

export const PlanPurchase: React.FC<PlanPurchaseProps> = ({
  currency,
  market,
  preloadedRecommendation,
  onClearPreload
}) => {
  // Steps: 1 = Upload, 2 = Manual Data Entry, 3 = Focused Results
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [latestRate, setLatestRate] = useState<number>(
    141.72 * (currency === "SGD" ? 1.34 : (currency === "INR" ? 83.5 : (currency === "AED" ? 3.67 : 1)))
  );

  // Uploaded photo state
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designFileUrl, setDesignFileUrl] = useState<string | null>(null);

  // Manual & AI confirmed specifications
  const [category, setCategory] = useState<string>("ring");
  const [style, setStyle] = useState<string>("traditional");
  const [purity, setPurity] = useState<string>("22K");
  const [weightGrams, setWeightGrams] = useState<number>(6.0);
  const [colour, setColour] = useState<string>("yellow");
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [timelineMonths, setTimelineMonths] = useState<number>(11);

  // Selected scheme (null means "Outright / Direct Purchase")
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);

  // Exchange candidate asset IDs (if applied by user when exchange is recommended)
  const [appliedExchangeIds, setAppliedExchangeIds] = useState<string[]>([]);

  // Try-On modal
  const [isTryOnOpen, setIsTryOnOpen] = useState<boolean>(false);

  // Convert uploaded image to DataURL
  useEffect(() => {
    if (designFile) {
      const reader = new FileReader();
      reader.onload = () => setDesignFileUrl(reader.result as string);
      reader.readAsDataURL(designFile);
    } else {
      setDesignFileUrl(null);
    }
  }, [designFile]);

  // Load portfolio and latest gold rate
  useEffect(() => {
    const initData = async () => {
      try {
        const portRes = await api.getPortfolio(currency);
        if (portRes && portRes.assets) {
          setPortfolio(portRes.assets);
        }
      } catch (e) {
        console.error("Failed to load portfolio:", e);
      }
      try {
        const rateRes = await api.getPrices(currency);
        if (rateRes && rateRes.latest_price) {
          setLatestRate(rateRes.latest_price);
        }
      } catch (e) {
        console.error("Failed to load gold price:", e);
      }
    };
    initData();
  }, [currency]);

  // Handle preloaded recommendation from Collection Advisor
  useEffect(() => {
    if (preloadedRecommendation) {
      setCategory(preloadedRecommendation.category?.toLowerCase() || "ring");
      setStyle(preloadedRecommendation.style?.toLowerCase() || "contemporary");
      setPurity("22K");
      const estWeight = preloadedRecommendation.category?.toLowerCase() === "necklace" ? 42.0 :
                        preloadedRecommendation.category?.toLowerCase() === "bangle" ? 30.0 :
                        preloadedRecommendation.category?.toLowerCase() === "ring" ? 6.0 :
                        preloadedRecommendation.category?.toLowerCase() === "earrings" ? 10.0 : 8.0;
      setWeightGrams(estWeight);
      setStep(2);
    }
  }, [preloadedRecommendation]);

  // Auto-calculate suggested target price when weight or purity changes
  useEffect(() => {
    const purityMultiplier = purity === "24K" ? 0.999 : purity === "22K" ? 0.9167 : 0.75;
    const goldValue = weightGrams * latestRate * purityMultiplier;
    const makingCharge = goldValue * 0.12; // typical 12% making charges
    const tax = (goldValue + makingCharge) * 0.03; // typical 3% GST
    const estimated = Math.round(goldValue + makingCharge + tax);
    setTargetPrice(estimated);
  }, [weightGrams, purity, latestRate]);

  // Handle File Upload and AI Analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDesignFile(e.target.files[0]);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!designFile) return;
    setLoading(true);
    try {
      const result = await api.analyzeJewellery(designFile);
      const data = result.data || {};
      
      if (data.category) setCategory(data.category.toLowerCase());
      if (data.style) setStyle(data.style.toLowerCase());
      if (data.colour) setColour(data.colour.toLowerCase());
      if (data.recommended_purity_options && data.recommended_purity_options.length > 0) {
        setPurity(data.recommended_purity_options[0]);
      }
      if (data.estimated_weight_range_grams) {
        const midW = (data.estimated_weight_range_grams.min + data.estimated_weight_range_grams.max) / 2;
        setWeightGrams(Number(midW.toFixed(1)));
      }
      // Advance to manual verification step
      setStep(2);
    } catch (err) {
      console.error("AI Analysis failed:", err);
      // Fallback: advance to manual data entry
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Determine user's country for regional schemes
  const userCountry = (market.toLowerCase().includes("singapore") || currency === "SGD") ? "Singapore" : "India";
  const matchingSchemes = useMemo(() => {
    return REGIONAL_SCHEMES.filter(s => s.country === userCountry);
  }, [userCountry]);

  // ==========================================
  // DEEP DESIGN SIMILARITY ENGINE
  // ==========================================
  const similarityAnalysis = useMemo(() => {
    const targetCat = category.toLowerCase().trim();
    const targetSty = style.toLowerCase().trim();
    const targetCol = colour.toLowerCase().trim();
    const targetWt = weightGrams;

    const categoryMatches: Array<{
      asset: Asset;
      score: number;
      reasons: string[];
      isDirectCategoryMatch: boolean;
    }> = [];

    portfolio.forEach(asset => {
      const assetCat = (asset.category || "").toLowerCase().trim();
      const assetSty = (asset.style || "traditional").toLowerCase().trim();
      const assetCol = (asset.colour || "yellow").toLowerCase().trim();
      const assetWt = Number(asset.gross_weight_grams || asset.net_gold_weight_grams || 0);

      const isSameCategory = assetCat === targetCat;
      let score = 0;
      const reasons: string[] = [];

      if (isSameCategory) {
        score += 40; // 40 points for same category (e.g. Ring vs Ring)
        reasons.push(`Same category (${assetCat})`);

        // Style motif match (e.g. Traditional vs Traditional)
        if (assetSty === targetSty) {
          score += 30;
          reasons.push(`Identical ${assetSty} design motif`);
        } else if (
          (targetSty === "traditional" && assetSty === "antique") ||
          (targetSty === "antique" && assetSty === "traditional")
        ) {
          score += 20;
          reasons.push("Harmonious heritage craft style");
        } else {
          reasons.push(`Contrasting aesthetic: ${assetSty} vs ${targetSty}`);
        }

        // Weight / Scale Proximity
        const wtDiff = Math.abs(assetWt - targetWt);
        if (wtDiff <= 2.5) {
          score += 20;
          reasons.push(`Nearly identical scale & heft (~${assetWt}g vs ~${targetWt}g)`);
        } else if (wtDiff <= 8.0) {
          score += 10;
          reasons.push(`Comparable weight scale (~${assetWt}g vs ~${targetWt}g)`);
        } else {
          reasons.push(`Distinct weight category (${assetWt}g vs ${targetWt}g)`);
        }

        // Colour Tone Match
        if (assetCol === targetCol) {
          score += 10;
          reasons.push(`Identical ${assetCol} gold tone`);
        }

        categoryMatches.push({
          asset,
          score: Math.min(100, Math.round(score)),
          reasons,
          isDirectCategoryMatch: true
        });
      }
    });

    categoryMatches.sort((a, b) => b.score - a.score);

    const highestMatch = categoryMatches[0] || null;
    const highestScore = highestMatch ? highestMatch.score : 0;
    const hasCategoryInCollection = categoryMatches.length > 0;

    return {
      hasCategoryInCollection,
      categoryMatches,
      highestMatch,
      highestScore
    };
  }, [portfolio, category, style, colour, weightGrams]);

  // ==========================================
  // STRATEGY & FINANCIAL REASONING
  // ==========================================
  const selectedScheme = matchingSchemes.find(s => s.id === selectedSchemeId) || null;
  const isHighRedundancy = similarityAnalysis.highestScore >= 65;

  const recommendedStrategy = useMemo(() => {
    if (isHighRedundancy && similarityAnalysis.highestMatch) {
      return {
        type: "EXCHANGE",
        badge: "Smart Exchange & Upgrade",
        headline: "Exchange Existing Piece to Prevent Redundancy",
        rationale: `You already own a very similar ${category} ("${similarityAnalysis.highestMatch.asset.name}") with an estimated ${similarityAnalysis.highestScore}% design overlap. Adding another identical piece locks capital into duplicate gold. Exchanging your existing item frees up trade-in credit and fully covers your new purchase.`,
        requiresExchange: true
      };
    } else if (selectedScheme) {
      return {
        type: "SCHEME",
        badge: "Disciplined Scheme Accumulation",
        headline: `Spread Cost with ${selectedScheme.providerName} Bonus Scheme`,
        rationale: `This ${category} adds fresh style variety to your jewellery box with zero redundancy (${similarityAnalysis.highestScore}% similarity). Enrolling in the ${selectedScheme.schemeName} lets you accumulate this piece systematically while locking in a valuable jeweler bonus upon maturity.`,
        requiresExchange: false
      };
    } else {
      return {
        type: "DIRECT",
        badge: "Direct Outright Purchase",
        headline: "Direct Purchase / Self-Funded Savings",
        rationale: `This ${category} brings excellent diversification to your collection with no duplicate designs. You do not need to part with any existing gold pieces. Proceed with an outright purchase or self-directed savings over ${timelineMonths} months.`,
        requiresExchange: false
      };
    }
  }, [isHighRedundancy, similarityAnalysis, selectedScheme, category, timelineMonths]);

  // Calculate Exchange Credit from applied candidate assets
  const exchangeCredit = useMemo(() => {
    let credit = 0;
    appliedExchangeIds.forEach(id => {
      const asset = portfolio.find(a => a.asset_id === id);
      if (asset) {
        const purityRatio = asset.purity === "24K" ? 0.999 : asset.purity === "22K" ? 0.9167 : 0.75;
        const netWeight = asset.net_gold_weight_grams || (asset.gross_weight_grams * purityRatio);
        credit += netWeight * latestRate * 0.98;
      }
    });
    return Math.round(credit);
  }, [appliedExchangeIds, portfolio, latestRate]);

  // Financial calculations
  const grossCost = targetPrice;
  const schemeBonusValue = useMemo(() => {
    if (!selectedScheme) return 0;
    const effectiveMonthly = grossCost / selectedScheme.durationMonths;
    return Math.round(effectiveMonthly * selectedScheme.bonusBenefitMultiplier);
  }, [selectedScheme, grossCost]);

  const netOutPocket = Math.max(0, grossCost - exchangeCredit - schemeBonusValue);
  const monthlyPayment = selectedScheme 
    ? Math.round(netOutPocket / selectedScheme.durationMonths)
    : (timelineMonths > 0 ? Math.round(netOutPocket / timelineMonths) : netOutPocket);

  // Auto-select candidate exchange asset when exchange strategy is triggered
  useEffect(() => {
    if (recommendedStrategy.requiresExchange && similarityAnalysis.highestMatch && appliedExchangeIds.length === 0) {
      setAppliedExchangeIds([similarityAnalysis.highestMatch.asset.asset_id]);
    }
  }, [recommendedStrategy.requiresExchange, similarityAnalysis.highestMatch]);

  const handleReset = () => {
    setStep(1);
    setDesignFile(null);
    setDesignFileUrl(null);
    setSelectedSchemeId(null);
    setAppliedExchangeIds([]);
    onClearPreload();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gold/10 text-gold text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI Purchase Planner
            </span>
            {step === 3 && (
              <span className="bg-white/5 text-mutedText text-xs font-semibold px-2.5 py-1 rounded-full">
                Step 3 of 3 • Plan Ready
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Plan a Jewellery Purchase</h1>
          <p className="text-sm text-mutedText mt-0.5">
            Upload your target piece, verify details, and let GoldGuard compare your collection and recommend the smartest financing route.
          </p>
        </div>

        {step > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-mutedText hover:text-white hover:bg-cardHover transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-mutedText hover:text-white hover:bg-cardHover transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </button>
          </div>
        )}
      </div>

      {/* Progress Tabs */}
      <div className="flex items-center gap-3 border-b border-border/30 pb-3 text-xs font-semibold">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 pb-1 transition-colors ${
            step === 1 ? "text-gold border-b-2 border-gold font-bold" : "text-mutedText hover:text-white"
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white/10 text-white">1</span>
          Upload Photo
        </button>
        <span className="text-mutedText">›</span>
        <button
          onClick={() => (designFile || preloadedRecommendation) && setStep(2)}
          disabled={!designFile && !preloadedRecommendation}
          className={`flex items-center gap-1.5 pb-1 transition-colors ${
            step === 2 ? "text-gold border-b-2 border-gold font-bold" : "text-mutedText hover:text-white disabled:opacity-40"
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white/10 text-white">2</span>
          Confirm Specifications
        </button>
        <span className="text-mutedText">›</span>
        <button
          onClick={() => step >= 2 && setStep(3)}
          disabled={step < 3}
          className={`flex items-center gap-1.5 pb-1 transition-colors ${
            step === 3 ? "text-gold border-b-2 border-gold font-bold" : "text-mutedText hover:text-white disabled:opacity-40"
          }`}
        >
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-white/10 text-white">3</span>
          Purchase Strategy & Similarity
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD TARGET PHOTO                                               */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto space-y-6 pt-4">
          {preloadedRecommendation && (
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gold uppercase tracking-wider">Advisor Recommendation</span>
                <h4 className="text-sm font-semibold text-white capitalize mt-0.5">
                  Target: {preloadedRecommendation.category} ({preloadedRecommendation.style || "Contemporary"})
                </h4>
                <p className="text-xs text-mutedText mt-0.5">{preloadedRecommendation.reason}</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="px-3.5 py-2 bg-gold text-black font-bold text-xs rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0"
              >
                Proceed with Specs <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-xl">
            <div className="space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-inner">
                <Upload className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-white">Upload Your Target Jewellery Photo</h2>
              <p className="text-xs text-mutedText max-w-md mx-auto">
                Snap or upload a photo of the jewellery item you are planning to purchase (from a store showcase, catalog, or online).
              </p>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-border/80 hover:border-gold/60 rounded-2xl p-6 transition-all bg-background/50 hover:bg-background/80 relative">
              {designFileUrl ? (
                <div className="space-y-4">
                  <div className="relative inline-block mx-auto rounded-xl overflow-hidden border border-border shadow-md max-h-64">
                    <img 
                      src={designFileUrl} 
                      alt="Selected target jewellery" 
                      className="max-h-64 object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer text-xs font-semibold text-gold hover:underline">
                      Choose another photo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block py-8 space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-mutedText">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Click to browse or drag & drop</span>
                    <p className="text-xs text-mutedText mt-1">Supports JPG, PNG, WEBP (Up to 10MB)</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </label>
              )}
            </div>

            {/* CTA Button */}
            {designFile && (
              <button
                onClick={handleAnalyzePhoto}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Analyzing Craftsmanship & Specifications with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analyse Photo with AI & Continue →</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: VERIFY & MANUALLY FEED IN DATA                                    */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-6 pt-2">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xl">
            {/* Header Banner with uploaded photo thumbnail */}
            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              {designFileUrl ? (
                <img 
                  src={designFileUrl} 
                  alt="Target thumbnail" 
                  className="w-16 h-16 rounded-xl object-cover border border-border shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                  <Gem className="h-8 w-8" />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-gold uppercase tracking-wider">Specifications Review</span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Confirm or Enter Your Target Item Details
                </h2>
                <p className="text-xs text-mutedText">
                  AI extracted these initial estimates. Please verify or adjust the values below to match your intended purchase.
                </p>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">Jewellery Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "ring", label: "Ring 💍" },
                    { key: "necklace", label: "Necklace 📿" },
                    { key: "earrings", label: "Earrings ✨" },
                    { key: "bangle", label: "Bangle 💫" },
                    { key: "bracelet", label: "Bracelet ⌚" },
                    { key: "pendant", label: "Pendant 💎" }
                  ].map(cat => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        category === cat.key 
                          ? "bg-gold text-black border-gold font-bold shadow" 
                          : "bg-background border-border text-mutedText hover:text-white hover:border-border/80"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Design Style / Motif */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">Design Style & Motif</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "traditional", label: "Traditional / Temple" },
                    { key: "contemporary", label: "Contemporary Modern" },
                    { key: "antique", label: "Antique Heritage" },
                    { key: "filigree", label: "Floral Filigree" },
                    { key: "minimalist", label: "Minimalist Daily" }
                  ].map(sty => (
                    <button
                      key={sty.key}
                      type="button"
                      onClick={() => setStyle(sty.key)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        style === sty.key 
                          ? "bg-gold text-black border-gold font-bold shadow" 
                          : "bg-background border-border text-mutedText hover:text-white hover:border-border/80"
                      }`}
                    >
                      {sty.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Gold Purity */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">Target Gold Purity</label>
                <div className="grid grid-cols-3 gap-2">
                  {["22K", "18K", "24K"].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurity(p)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        purity === p 
                          ? "bg-gold text-black border-gold font-bold shadow" 
                          : "bg-background border-border text-mutedText hover:text-white"
                      }`}
                    >
                      {p} ({p === "22K" ? "916 Gold" : p === "18K" ? "750 Gold" : "999 Pure"})
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal Colour Tone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">Gold Colour Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "yellow", label: "🟡 Yellow Gold" },
                    { key: "rose", label: "🌸 Rose Gold" },
                    { key: "white", label: "⚪ White Gold" }
                  ].map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColour(c.key)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        colour === c.key 
                          ? "bg-gold text-black border-gold font-bold shadow" 
                          : "bg-background border-border text-mutedText hover:text-white"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Weight in Grams */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">
                  Estimated Gross Weight (Grams)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={weightGrams}
                    onChange={e => setWeightGrams(Math.max(0.5, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-white focus:outline-none focus:border-gold"
                  />
                  <span className="text-xs font-bold text-mutedText px-2">grams</span>
                </div>
              </div>

              {/* Target Price / Budget */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">
                  Estimated Target Price / Budget ({currency})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={targetPrice}
                    onChange={e => setTargetPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-bold text-white focus:outline-none focus:border-gold"
                  />
                  <span className="text-xs font-bold text-mutedText px-2">{currency}</span>
                </div>
                <p className="text-[10px] text-mutedText">Auto-calculated using live gold rate + standard making charge.</p>
              </div>

              {/* Savings Timeline */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-mutedText">Target Purchase Timeline</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { months: 6, label: "6 Months" },
                    { months: 10, label: "10 Months (Scheme)" },
                    { months: 11, label: "11 Months (Scheme)" },
                    { months: 12, label: "12 Months (1 Year)" }
                  ].map(t => (
                    <button
                      key={t.months}
                      type="button"
                      onClick={() => setTimelineMonths(t.months)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                        timelineMonths === t.months 
                          ? "bg-gold text-black border-gold font-bold shadow" 
                          : "bg-background border-border text-mutedText hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Next CTA */}
            <div className="pt-3 border-t border-border/50 flex justify-end">
              <button
                onClick={() => setStep(3)}
                className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Check Collection Similarity & Generate Strategy</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: FOCUSED PURCHASE STRATEGY & SIMILARITY VIEW                       */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="max-w-4xl mx-auto space-y-6 pt-2">
          {/* Target Item Summary Banner */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {designFileUrl ? (
                <img 
                  src={designFileUrl} 
                  alt="Target jewellery" 
                  className="w-16 h-16 rounded-xl object-cover border border-gold/30 shrink-0 shadow"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                  <Gem className="h-8 w-8" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold">Target Piece</span>
                <h3 className="text-base font-bold text-white capitalize">
                  {purity} Gold {style} {category}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-mutedText">
                  <span className="font-semibold text-white">{weightGrams}g</span>
                  <span>•</span>
                  <span className="capitalize">{colour} Tone</span>
                  <span>•</span>
                  <span>{timelineMonths}-Month Horizon</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-mutedText block">Target Budget</span>
                <span className="text-lg font-black text-gold">{currency} {targetPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setIsTryOnOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-border text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              >
                <Eye className="h-4 w-4 text-gold" /> Try On
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. COLLECTION SIMILARITY CHECK                                            */}
          {/* ========================================================================= */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-gold" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Collection Similarity Check</h3>
                  <p className="text-xs text-mutedText">
                    Comparing your target {category} with existing items in your collection to avoid duplicate designs.
                  </p>
                </div>
              </div>
            </div>

            {similarityAnalysis.hasCategoryInCollection ? (
              <div className="space-y-3">
                {similarityAnalysis.categoryMatches.map((match, idx) => {
                  const isHigh = match.score >= 65;
                  const isMedium = match.score >= 35 && match.score < 65;
                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isHigh 
                          ? "bg-amber-950/20 border-amber-500/40" 
                          : isMedium
                          ? "bg-gold/5 border-gold/30"
                          : "bg-emerald-950/20 border-emerald-500/30"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Existing Asset Info */}
                        <div className="flex items-center gap-3">
                          {match.asset.image_reference ? (
                            <img 
                              src={match.asset.image_reference} 
                              alt={match.asset.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gold font-bold text-xs shrink-0">
                              {match.asset.purity}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{match.asset.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-mutedText uppercase font-semibold">
                                {match.asset.category}
                              </span>
                            </div>
                            <p className="text-xs text-mutedText mt-0.5">
                              {match.asset.gross_weight_grams}g • {match.asset.purity} • {match.asset.style || "Traditional"}
                            </p>
                          </div>
                        </div>

                        {/* Similarity Score Badge */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className={`text-right px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${
                            isHigh
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : isMedium
                              ? "bg-gold/10 border-gold/30 text-gold"
                              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          }`}>
                            <span>{match.score}% Design Overlap</span>
                            {isHigh ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reasons & Comparison Breakdown */}
                      <div className="mt-3 pt-2.5 border-t border-border/40 text-xs text-mutedText flex flex-wrap gap-x-4 gap-y-1">
                        {match.reasons.map((r, rIdx) => (
                          <span key={rIdx} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold/60"></span>
                            <span>{r}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    0% Redundancy — 100% Diversification
                  </h4>
                  <p className="text-xs text-mutedText mt-0.5">
                    You do not currently own any {category}s in your collection. Adding this piece fills a jewellery gap and brings fresh variety to your collection!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. AVAILABLE GOLD PURCHASE SCHEMES / EMI OPTIONS                          */}
          {/* ========================================================================= */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
            <div>
              <span className="text-xs font-bold text-gold uppercase tracking-wider">Financing Choices</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-0.5">
                Available Purchase Schemes & EMI Options (Optional)
              </h3>
              <p className="text-xs text-mutedText">
                Interested in an installment plan? Select a verified regional scheme to earn bonus contributions from jewellers, or proceed with outright purchase:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Direct / Outright Purchase */}
              <div
                onClick={() => setSelectedSchemeId(null)}
                className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  selectedSchemeId === null
                    ? "bg-gold/10 border-gold shadow-md"
                    : "bg-background border-border/70 hover:border-border hover:bg-cardHover"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">Outright Purchase</span>
                    {selectedSchemeId === null && (
                      <span className="w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center text-xs font-bold">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mutedText mt-2">
                    Pay in full or save independently over {timelineMonths} months. No lock-in, immediate purchase flexibility.
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-border/40 text-xs font-bold text-mutedText">
                  Zero Lock-In
                </div>
              </div>

              {/* Regional Schemes Options */}
              {matchingSchemes.slice(0, 2).map(scheme => {
                const isSelected = selectedSchemeId === scheme.id;
                const monthlyInstalment = Math.round(targetPrice / scheme.durationMonths);
                return (
                  <div
                    key={scheme.id}
                    onClick={() => setSelectedSchemeId(scheme.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-gold/10 border-gold shadow-md"
                        : "bg-background border-border/70 hover:border-border hover:bg-cardHover"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white">{scheme.providerName}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center text-xs font-bold">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-gold block mt-0.5">{scheme.schemeName}</span>
                      <p className="text-xs text-mutedText mt-2">
                        {scheme.bonusBenefitDescription}
                      </p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between text-xs font-bold">
                      <span className="text-mutedText">{scheme.durationMonths} Mo Plan:</span>
                      <span className="text-gold font-extrabold">{currency} {monthlyInstalment.toLocaleString()}/mo</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. RECOMMENDED STRATEGY                                                   */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-card to-background border-2 border-gold/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gold px-2.5 py-1 rounded bg-gold/10 inline-block">
                  {recommendedStrategy.badge}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{recommendedStrategy.headline}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-mutedText block">Net Monthly Commitment</span>
                <span className="text-xl font-black text-emerald-400">
                  {currency} {monthlyPayment.toLocaleString()}/mo
                </span>
              </div>
            </div>

            <p className="text-xs text-mutedText leading-relaxed">
              {recommendedStrategy.rationale}
            </p>

            {/* Financial Summary Calculation Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background/60 p-4 rounded-xl border border-border/60 text-xs">
              <div>
                <span className="text-mutedText block text-[11px]">Gross Target Price</span>
                <span className="text-white font-bold text-sm">{currency} {grossCost.toLocaleString()}</span>
              </div>
              {selectedScheme && (
                <div>
                  <span className="text-mutedText block text-[11px]">Scheme Maturity Bonus</span>
                  <span className="text-emerald-400 font-bold text-sm">-{currency} {schemeBonusValue.toLocaleString()}</span>
                </div>
              )}
              {appliedExchangeIds.length > 0 && (
                <div>
                  <span className="text-mutedText block text-[11px]">Trade-in Credit Applied</span>
                  <span className="text-emerald-400 font-bold text-sm">-{currency} {exchangeCredit.toLocaleString()}</span>
                </div>
              )}
              <div>
                <span className="text-mutedText block text-[11px]">Net Out-of-Pocket</span>
                <span className="text-gold font-extrabold text-sm">{currency} {netOutPocket.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. EXCHANGE ASSETS SECTION (STRICTLY CONDITIONAL)                         */}
          {/* ========================================================================= */}
          {recommendedStrategy.requiresExchange && (
            <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recommended Exchange Candidates
                  </h3>
                  <p className="text-xs text-mutedText">
                    Trading in an existing redundant item from your collection will offset your purchase cost:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {similarityAnalysis.categoryMatches.map(match => {
                  const isChecked = appliedExchangeIds.includes(match.asset.asset_id);
                  const purityRatio = match.asset.purity === "24K" ? 0.999 : match.asset.purity === "22K" ? 0.9167 : 0.75;
                  const netWeight = match.asset.net_gold_weight_grams || (match.asset.gross_weight_grams * purityRatio);
                  const tradeInVal = Math.round(netWeight * latestRate * 0.98);

                  return (
                    <div 
                      key={match.asset.asset_id}
                      onClick={() => {
                        if (isChecked) {
                          setAppliedExchangeIds(appliedExchangeIds.filter(id => id !== match.asset.asset_id));
                        } else {
                          setAppliedExchangeIds([...appliedExchangeIds, match.asset.asset_id]);
                        }
                      }}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isChecked 
                          ? "bg-amber-500/10 border-amber-500/50" 
                          : "bg-background border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded border-border text-gold focus:ring-0 cursor-pointer"
                        />
                        {match.asset.image_reference ? (
                          <img 
                            src={match.asset.image_reference} 
                            alt={match.asset.name} 
                            className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gold font-bold text-xs shrink-0">
                            {match.asset.purity}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-white block">{match.asset.name}</span>
                          <span className="text-[11px] text-mutedText">
                            {match.asset.gross_weight_grams}g ({match.asset.purity}) • {match.score}% Design Overlap
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-mutedText block">Trade-in Credit</span>
                        <span className="text-xs font-black text-emerald-400">+{currency} {tradeInVal.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. ACTIONS & UTILITIES                                                    */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-mutedText hover:text-white hover:bg-cardHover transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Edit Specifications
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-white hover:bg-cardHover transition-colors flex items-center gap-2"
              >
                <Printer className="h-4 w-4 text-gold" /> Print Plan
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-xs hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-1.5 shadow-md"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Plan Another Piece
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Try-On Modal */}
      {isTryOnOpen && (
        <TryOnModal
          isOpen={isTryOnOpen}
          onClose={() => setIsTryOnOpen(false)}
          jewellery={{
            category,
            purity,
            style,
            colour,
            image: designFileUrl
          }}
          portfolio={portfolio}
        />
      )}
    </div>
  );
};
