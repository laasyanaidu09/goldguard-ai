import React, { useState, useEffect } from "react";
import { api, type Asset } from "../services/api";
import { FileUp, Sparkles, AlertTriangle, ShieldCheck, Info, Check, Calculator, ArrowRight, Printer, X } from "lucide-react";
import { TryOnModal } from "./TryOnModal";

interface PlanPurchaseProps {
  currency: string;
  market: string;
  preloadedRecommendation: any | null;
  onClearPreload: () => void;
}

export const PlanPurchase: React.FC<PlanPurchaseProps> = ({ currency, market, preloadedRecommendation, onClearPreload }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designFileUrl, setDesignFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (designFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setDesignFileUrl(reader.result as string);
      };
      reader.readAsDataURL(designFile);
    } else {
      setDesignFileUrl(null);
    }
  }, [designFile]);
  
  // Selection States
  const [selectedPurity, setSelectedPurity] = useState<string>("22K");
  const [timelineMonths, setTimelineMonths] = useState<number>(12);
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [selectedExchangeIds, setSelectedExchangeIds] = useState<string[]>([]);
  const [latestRate, setLatestRate] = useState<number>(141.72 * (currency === "SGD" ? 1.34 : (currency === "INR" ? 83.5 : (currency === "AED" ? 3.67 : 1))));
  
  // Customization States
  const [customCategory, setCustomCategory] = useState<string>("earrings");
  const [customWeight, setCustomWeight] = useState<number>(10);
  const [customStyle, setCustomStyle] = useState<string>("contemporary");
  const [customColor, setCustomColor] = useState<string>("yellow");

  // Compiled results
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Try-On States
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [tryOnItem, setTryOnItem] = useState<{
    category: string;
    purity: string;
    style: string;
    colour: string;
    image?: string | null;
  } | null>(null);

  // Scheme states
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [comparedSchemeIds, setComparedSchemeIds] = useState<string[]>([]);
  const [filterDuration, setFilterDuration] = useState<string>("all");
  const [filterBudget, setFilterBudget] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedStoreForMap, setSelectedStoreForMap] = useState<any | null>(null);

  const handleOpenTryOn = (item: typeof tryOnItem) => {
    setTryOnItem(item);
    setIsTryOnOpen(true);
  };

  // Load portfolio and apply preloads
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const portRes = await api.getPortfolio(currency);
        setPortfolio(portRes.assets);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchLatestRate = async () => {
      try {
        const rateRes = await api.getPrices(currency);
        if (rateRes && rateRes.latest_price) {
          setLatestRate(rateRes.latest_price);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPortfolio();
    fetchLatestRate();

    if (preloadedRecommendation) {
      setStep(2); // Jump to specifications if preloaded
      setAnalysisResult({
        category: preloadedRecommendation.category,
        style: preloadedRecommendation.style || "contemporary",
        design_features: ["Minimalist design", "High fit recommendation"],
        colour: "yellow",
        recommended_purity_options: preloadedRecommendation.suggested_purity,
        estimated_weight_range_grams: {
          min: preloadedRecommendation.estimated_weight_range.min,
          max: preloadedRecommendation.estimated_weight_range.max
        },
        estimated_price_range: {
          min: preloadedRecommendation.estimated_price_range.min,
          max: preloadedRecommendation.estimated_price_range.max
        },
        confidence: preloadedRecommendation.confidence,
        assumptions: preloadedRecommendation.assumptions
      });
      setSelectedPurity(preloadedRecommendation.suggested_purity[0] || "22K");
      setCustomCategory(preloadedRecommendation.category);
      setCustomWeight(preloadedRecommendation.estimated_weight_range.min || 10);
      setCustomStyle(preloadedRecommendation.style || "contemporary");
      setCustomColor("yellow");
    }
  }, [preloadedRecommendation, currency]);

  const handleImageAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designFile) return;
    setLoading(true);
    try {
      const res = await api.analyzeJewellery(designFile);
      const data = res.data;
      setAnalysisResult(data);
      setSelectedPurity(data.recommended_purity_options?.[0] || "22K");
      setCustomCategory(data.category);
      setCustomWeight(data.estimated_weight_range_grams?.min || 10);
      setCustomStyle(data.style || "contemporary");
      setCustomColor(data.colour || "yellow");
      setStep(2);
    } catch (err) {
      alert("Error analyzing target design image.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSpecsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = preloadedRecommendation?.category || "earrings";
    const minW = cat.toLowerCase() === "necklace" ? 38 : (cat.toLowerCase() === "ring" ? 4 : (cat.toLowerCase() === "pendant" ? 5 : (cat.toLowerCase() === "bangle" ? 25 : 8)));
    const maxW = cat.toLowerCase() === "necklace" ? 45 : (cat.toLowerCase() === "ring" ? 8 : (cat.toLowerCase() === "pendant" ? 10 : (cat.toLowerCase() === "bangle" ? 35 : 12)));
    setAnalysisResult({
      category: cat,
      style: preloadedRecommendation?.style || "contemporary",
      design_features: ["Minimalist design", "High fit recommendation"],
      colour: "yellow",
      recommended_purity_options: preloadedRecommendation?.suggested_purity || ["22K", "18K"],
      estimated_weight_range_grams: { min: minW, max: maxW },
      estimated_price_range: { min: minW * 70, max: maxW * 70 * 1.2 },
      confidence: "High",
      assumptions: ["User manual selection based on recommendation"]
    });
    setCustomCategory(cat);
    setCustomWeight(minW);
    setCustomStyle(preloadedRecommendation?.style || "contemporary");
    setCustomColor("yellow");
    setStep(2);
  };


  const toggleExchangeCandidate = (id: string) => {
    if (selectedExchangeIds.includes(id)) {
      setSelectedExchangeIds(selectedExchangeIds.filter(x => x !== id));
    } else {
      setSelectedExchangeIds([...selectedExchangeIds, id]);
    }
  };


  const totalFineGoldPortfolio = portfolio.reduce((acc, a) => acc + a.net_gold_weight_grams, 0);
  const totalMetalValuePortfolio = portfolio.reduce((acc, a) => acc + a.estimated_current_value, 0);

  // Dynamic Reactive calculations for target plan specs
  const targetCategory = customCategory;
  const targetWeight = customWeight;
  const purityRatio = selectedPurity === "22K" ? 0.9167 : (selectedPurity === "18K" ? 0.75 : 0.999);
  
  const rawGoldValue = targetWeight * latestRate * purityRatio;
  const makingCharges = rawGoldValue * 0.10;
  const subtotal = rawGoldValue + makingCharges;
  const tax = subtotal * 0.07;
  const totalCost = subtotal + tax;

  const exchangeCredit = selectedExchangeIds.reduce((sum, id) => {
    const asset = portfolio.find(a => a.asset_id === id);
    if (!asset) return sum;
    return sum + (asset.net_gold_weight_grams * latestRate * 0.98);
  }, 0);

  const sellProceeds = selectedExchangeIds.reduce((sum, id) => {
    const asset = portfolio.find(a => a.asset_id === id);
    if (!asset) return sum;
    return sum + (asset.net_gold_weight_grams * latestRate * 0.96);
  }, 0);

  const fundingGap = Math.max(0, totalCost - exchangeCredit);
  const monthlySavings = timelineMonths > 0 ? fundingGap / timelineMonths : fundingGap;

  // Scenarios Scopes
  const scenCurrentCost = totalCost;
  const scenCurrentGap = fundingGap;
  const scenCurrentSavings = monthlySavings;

  const scen10Cost = totalCost * 1.10;
  const scen10Gap = Math.max(0, scen10Cost - exchangeCredit);
  const scen10Savings = timelineMonths > 0 ? scen10Gap / timelineMonths : scen10Gap;

  const scen20Cost = totalCost * 1.20;
  const scen20Gap = Math.max(0, scen20Cost - exchangeCredit);
  const scen20Savings = timelineMonths > 0 ? scen20Gap / timelineMonths : scen20Gap;

  // Options A, B, C
  const optA_cost = totalCost;
  const optA_gap = totalCost;
  const optA_savings = timelineMonths > 0 ? totalCost / timelineMonths : totalCost;
  const optB_credit = exchangeCredit;
  const optB_gap = fundingGap;
  const optB_savings = monthlySavings;
  const optC_credit = sellProceeds;
  const optC_gap = Math.max(0, totalCost - sellProceeds);
  const optC_savings = timelineMonths > 0 ? optC_gap / timelineMonths : optC_gap;

  const recommendedStrategy = exchangeCredit > 0 ? "EXCHANGE GOLD" : "BUY NEW";

  // Dynamic Decision Scores
  const ownedCategories = portfolio.map(a => a.category.toLowerCase());
  const isMissing = !ownedCategories.includes(targetCategory.toLowerCase());
  
  const score_diversification = isMissing ? 95 : 45;
  const budget = 1500 * (currency === "SGD" ? 1.34 : (currency === "INR" ? 83.5 : 1));
  const score_budget_fit = totalCost <= budget ? 92 : (totalCost <= budget * 1.5 ? 75 : 40);
  const score_feasibility = monthlySavings <= 200 ? 94 : (monthlySavings <= 500 ? 82 : 55);
  
  const hasNecklaces = ownedCategories.includes("necklace");
  const hasEarrings = ownedCategories.includes("earrings");
  const score_complementarity = (targetCategory.toLowerCase() === "earrings" && hasNecklaces && !hasEarrings) ? 95 : 75;
  const score_market_context = 74; 

  const categoryOwned = portfolio.some(a => a.category.toLowerCase() === targetCategory.toLowerCase());
  const categoryWeight = portfolio.filter(a => a.category.toLowerCase() === targetCategory.toLowerCase())
                                  .reduce((sum, a) => sum + a.gross_weight_grams, 0);
  const totalGrossWeight = portfolio.reduce((sum, a) => sum + a.gross_weight_grams, 0) || 1.0;
  const categoryPct = (categoryWeight / totalGrossWeight) * 100;
  
  let similarityPct = 12;
  if (categoryOwned) {
    similarityPct = Math.round(categoryPct * 0.8 + 20);
  }
  const score_redundancy_avoidance = similarityPct > 50 ? 35 : (similarityPct > 20 ? 65 : 90);

  const purchaseScore = Math.round(
    score_diversification * 0.30 +
    score_budget_fit * 0.25 +
    score_feasibility * 0.20 +
    score_complementarity * 0.15 +
    score_redundancy_avoidance * 0.10
  );

  const decisionConfidence = purchaseScore >= 80 ? "High" : (purchaseScore >= 50 ? "Medium" : "Low");

  const narrativeText = isMissing
    ? `GoldGuard recommends the **${recommendedStrategy}** strategy. Exchanging the selected assets contributes ${currency} ${exchangeCredit.toLocaleString(undefined, {maximumFractionDigits: 0})} trade-in credit, reducing the target cash funding gap to ${currency} ${fundingGap.toLocaleString(undefined, {maximumFractionDigits: 0})}. This piece introduces a new jewellery category (${targetCategory.toLowerCase()}) that is currently missing from your collection, helping diversify your asset mix.`
    : `GoldGuard recommends the **${recommendedStrategy}** strategy. Exchanging the selected assets contributes ${currency} ${exchangeCredit.toLocaleString(undefined, {maximumFractionDigits: 0})} trade-in credit, reducing the target cash funding gap to ${currency} ${fundingGap.toLocaleString(undefined, {maximumFractionDigits: 0})}. This piece complements your existing collection.`;

  const horizonRows = [3, 6, 12, 18].map(m => {
    const hGap = Math.max(0, totalCost - exchangeCredit);
    const hGap10 = Math.max(0, totalCost * 1.10 - exchangeCredit);
    return {
      months: m,
      targetCost: totalCost,
      fundingGap: hGap,
      monthlySavings: hGap / m,
      targetCost10: totalCost * 1.10,
      monthlySavings10: hGap10 / m,
    };
  });

  // Structured Schemes Database (Demo data clearly labelled)
  interface GoldScheme {
    id: string;
    providerName: string;
    schemeName: string;
    country: string;
    region: string;
    city: string;
    currency: string;
    durationMonths: number;
    minimumMonthlyContribution: number;
    maximumMonthlyContribution: number;
    maturityBenefit: string;
    bonusBenefit: number; // multiplier of 1-month installment
    purchaseBenefit: string;
    applicableCategories: string[];
    eligibility: string;
    terms: string;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    website: string;
    latitude: number;
    longitude: number;
    verifiedAt: string;
    source: string;
    type: "Jewellery Savings" | "Gold Purchase Plan" | "Monthly Instalment" | "Store Purchase Scheme";
  }

  const SCHEMES_DATABASE: GoldScheme[] = [
    {
      id: "sg-pohheng-12",
      providerName: "Poh Heng",
      schemeName: "Poh Heng Golden Elite Savings Plan Plan",
      country: "Singapore",
      region: "Central",
      city: "Singapore",
      currency: "SGD",
      durationMonths: 12,
      minimumMonthlyContribution: 100,
      maximumMonthlyContribution: 2000,
      maturityBenefit: "1-month contribution benefit paid by jeweler upon maturity.",
      bonusBenefit: 1.0,
      purchaseBenefit: "Prevailing gold rate lock feature.",
      applicableCategories: ["necklace", "bangle", "earrings", "ring", "pendant"],
      eligibility: "Singapore Residents aged 18 and above.",
      terms: "Redemption must be completed within 3 months of plan maturity.",
      storeName: "Poh Heng Orchard Flagship",
      storeAddress: "270 Orchard Rd, #01-04, Singapore 238857",
      storePhone: "+65 6735 9999",
      website: "https://www.pohheng.example.com",
      latitude: 1.3018,
      longitude: 103.8379,
      verifiedAt: "2026-08-01",
      source: "Verified Provider Brochure",
      type: "Jewellery Savings"
    },
    {
      id: "sg-sk-10",
      providerName: "SK Jewellery",
      schemeName: "SK Gold Accumulation Plan",
      country: "Singapore",
      region: "East",
      city: "Singapore",
      currency: "SGD",
      durationMonths: 10,
      minimumMonthlyContribution: 250,
      maximumMonthlyContribution: 1500,
      maturityBenefit: "Zero making charges (up to 15% discount) on select gold jewelry.",
      bonusBenefit: 0.5,
      purchaseBenefit: "Gold rate lock feature at the date of installment payment.",
      applicableCategories: ["necklace", "bangle", "earrings", "ring"],
      eligibility: "Open to all, minimum age 18.",
      terms: "Redeemable only on standard 916 and 999 gold jewellery.",
      storeName: "SK Jewellery Tampines Mall",
      storeAddress: "4 Tampines Central 5, #01-18 Tampines Mall, Singapore 529510",
      storePhone: "+65 6788 9999",
      website: "https://www.skjewellery.example.com",
      latitude: 1.3526,
      longitude: 103.9452,
      verifiedAt: "2026-08-15",
      source: "Official Website Data",
      type: "Gold Purchase Plan"
    },
    {
      id: "sg-goldheart-6",
      providerName: "Goldheart",
      schemeName: "Goldheart Half-Year Luxe Saver",
      country: "Singapore",
      region: "Central",
      city: "Singapore",
      currency: "SGD",
      durationMonths: 6,
      minimumMonthlyContribution: 500,
      maximumMonthlyContribution: 5000,
      maturityBenefit: "SGD 150 loyalty gift voucher at maturity.",
      bonusBenefit: 0.3,
      purchaseBenefit: "GST waiver on making charges.",
      applicableCategories: ["ring", "earrings", "pendant"],
      eligibility: "Free Goldheart membership sign-up required.",
      terms: "Applies to selected contemporary diamond and gold jewellery ranges.",
      storeName: "Goldheart Orchard ION",
      storeAddress: "2 Orchard Turn, #B2-12 ION Orchard, Singapore 238801",
      storePhone: "+65 6509 8888",
      website: "https://www.goldheart.example.com",
      latitude: 1.3039,
      longitude: 103.8320,
      verifiedAt: "2026-07-28",
      source: "In-store Pamphlet",
      type: "Monthly Instalment"
    },
    {
      id: "in-tanishq-10",
      providerName: "Tanishq",
      schemeName: "Tanishq Golden Harvest Scheme",
      country: "India",
      region: "Karnataka",
      city: "Bengaluru",
      currency: "INR",
      durationMonths: 10,
      minimumMonthlyContribution: 2000,
      maximumMonthlyContribution: 50000,
      maturityBenefit: "75% of one monthly installment as a bonus upon completion.",
      bonusBenefit: 0.75,
      purchaseBenefit: "Redeemable at any Tanishq showroom in India.",
      applicableCategories: ["necklace", "bangle", "earrings", "ring", "pendant"],
      eligibility: "Indian Residents with valid PAN Card.",
      terms: "Redemption must be completed within 400 days of start date.",
      storeName: "Tanishq Indiranagar",
      storeAddress: "100 Feet Rd, Hal 2nd Stage, Indiranagar, Bengaluru, KA 560038",
      storePhone: "+91 80 4125 1234",
      website: "https://www.tanishq.example.co.in",
      latitude: 12.9719,
      longitude: 77.6412,
      verifiedAt: "2026-08-20",
      source: "Verified Corporate Policy",
      type: "Jewellery Savings"
    },
    {
      id: "in-malabar-11",
      providerName: "Malabar Gold",
      schemeName: "Malabar Smart Buy jewellery Plan",
      country: "India",
      region: "Maharashtra",
      city: "Mumbai",
      currency: "INR",
      durationMonths: 11,
      minimumMonthlyContribution: 5000,
      maximumMonthlyContribution: 100000,
      maturityBenefit: "Flat 10% discount on making charges + rate protection feature.",
      bonusBenefit: 0.9,
      purchaseBenefit: "Locks lowest rate between booking and delivery.",
      applicableCategories: ["necklace", "bangle", "earrings"],
      eligibility: "Indian Citizens aged 18 and above.",
      terms: "Excludes gold coins and raw bars.",
      storeName: "Malabar Gold Andheri",
      storeAddress: "Andheri West, Link Rd, Mumbai, MH 400053",
      storePhone: "+91 22 2634 5678",
      website: "https://www.malabargold.example.com",
      latitude: 19.1136,
      longitude: 72.8697,
      verifiedAt: "2026-08-11",
      source: "Official Mobile App",
      type: "Store Purchase Scheme"
    },
    {
      id: "in-kalyan-12",
      providerName: "Kalyan Jewellers",
      schemeName: "Kalyan Dhanvarsha Gold Scheme",
      country: "India",
      region: "Tamil Nadu",
      city: "Chennai",
      currency: "INR",
      durationMonths: 12,
      minimumMonthlyContribution: 3000,
      maximumMonthlyContribution: 75000,
      maturityBenefit: "1 full month contribution as bonus at completion.",
      bonusBenefit: 1.0,
      purchaseBenefit: "No making charges on select traditional designs.",
      applicableCategories: ["necklace", "bangle", "pendant"],
      eligibility: "Indian Residents.",
      terms: "Redemption only against gold jewelry.",
      storeName: "Kalyan Jewellers T-Nagar",
      storeAddress: "G N Chetty Rd, T-Nagar, Chennai, TN 600017",
      storePhone: "+91 44 2815 4321",
      website: "https://www.kalyanjewellers.example.com",
      latitude: 13.0405,
      longitude: 80.2337,
      verifiedAt: "2026-08-05",
      source: "Verified Showroom Pamphlet",
      type: "Monthly Instalment"
    }
  ];

  // Country filtering based on active currency/market settings
  const userCountry = (market.toLowerCase().includes("singapore") || currency === "SGD") ? "Singapore" : "India";

  // Filter schemes List
  const filteredSchemes = SCHEMES_DATABASE.filter(s => {
    if (s.country !== userCountry) return false;
    if (filterDuration !== "all" && s.durationMonths.toString() !== filterDuration) return false;
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterBudget !== "all") {
      if (filterBudget === "under250" && s.minimumMonthlyContribution >= 250) return false;
      if (filterBudget === "250to500" && (s.minimumMonthlyContribution > 500 || s.maximumMonthlyContribution < 250)) return false;
      if (filterBudget === "500to1000" && (s.minimumMonthlyContribution > 1000 || s.maximumMonthlyContribution < 500)) return false;
      if (filterBudget === "1000plus" && s.maximumMonthlyContribution < 1000) return false;
    }
    return true;
  });

  // Calculate Match Score for each scheme
  const schemesWithScores = filteredSchemes.map(s => {
    let score = 50;
    
    // Timeline match
    if (s.durationMonths === timelineMonths) {
      score += 25;
    } else if (Math.abs(s.durationMonths - timelineMonths) <= 2) {
      score += 15;
    }

    // Budget match
    const targetMonthly = monthlySavings;
    if (targetMonthly >= s.minimumMonthlyContribution && targetMonthly <= s.maximumMonthlyContribution) {
      score += 25;
    } else if (targetMonthly < s.minimumMonthlyContribution && targetMonthly >= s.minimumMonthlyContribution * 0.7) {
      score += 15;
    }

    // Category match
    if (s.applicableCategories.includes(customCategory.toLowerCase())) {
      score += 10;
    }

    // Cap at 99
    score = Math.min(99, score);

    // Recommendation subtext
    const recBullet = [];
    if (s.durationMonths === timelineMonths) {
      recBullet.push(`Matches your ${timelineMonths}-month purchase timeline.`);
    } else {
      recBullet.push(`Close to your ${timelineMonths}-month purchase goal.`);
    }
    if (targetMonthly >= s.minimumMonthlyContribution && targetMonthly <= s.maximumMonthlyContribution) {
      recBullet.push(`Fits your ${currency} ${Math.round(targetMonthly).toLocaleString()}/mo budget requirement.`);
    } else if (targetMonthly < s.minimumMonthlyContribution) {
      recBullet.push(`Minimum contribution is ${currency} ${s.minimumMonthlyContribution}/mo, slightly above budget.`);
    } else {
      recBullet.push(`Maximum contribution limit is ${currency} ${s.maximumMonthlyContribution}/mo.`);
    }
    recBullet.push(`Available in your selected region (${s.region}).`);
    recBullet.push(`Compatible with your target ${customCategory}.`);

    return {
      ...s,
      matchScore: score,
      reasons: recBullet
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  // Selected scheme calculations
  const selectedScheme = SCHEMES_DATABASE.find(s => s.id === selectedSchemeId);
  let schemeMonthlyContribution = 0;
  let schemeTotalContribution = 0;
  let schemeBonus = 0;
  let schemeExpectedFunding = exchangeCredit;
  let schemeRemainingFundingGap = fundingGap;

  if (selectedScheme) {
    schemeMonthlyContribution = Math.min(selectedScheme.maximumMonthlyContribution, Math.max(selectedScheme.minimumMonthlyContribution, Math.round(monthlySavings)));
    schemeTotalContribution = schemeMonthlyContribution * selectedScheme.durationMonths;
    schemeBonus = Math.round(schemeMonthlyContribution * selectedScheme.bonusBenefit);
    schemeExpectedFunding = exchangeCredit + schemeTotalContribution + schemeBonus;
    schemeRemainingFundingGap = Math.max(0, totalCost - schemeExpectedFunding);
  }

  const handleStepChange = (targetStep: number) => {
    if (targetStep === 1) {
      setStep(1);
      scrollToTop();
    } else if (targetStep === 2 && analysisResult) {
      setStep(2);
      scrollToTop();
    } else if (targetStep === 3 && analysisResult) {
      setStep(3);
      scrollToTop();
    }
  };

  const scrollToTop = () => {
    const el = document.getElementById("purchase-planner-wizard");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const grossTotal = portfolio.reduce((sum, a) => sum + a.gross_weight_grams, 0);
  const newGrossTotal = grossTotal + customWeight;

  const currentCategoryWeights: Record<string, number> = {
    necklace: 0, bangle: 0, bracelet: 0, ring: 0, earrings: 0, pendant: 0
  };
  portfolio.forEach(a => {
    const c = a.category.toLowerCase();
    if (c in currentCategoryWeights) {
      currentCategoryWeights[c] += a.gross_weight_grams;
    }
  });

  const projectedCategoryWeights = { ...currentCategoryWeights };
  const catLowerSim = customCategory.toLowerCase();
  projectedCategoryWeights[catLowerSim] = (projectedCategoryWeights[catLowerSim] || 0) + customWeight;

  let projectedHighestPct = 0;
  Object.keys(projectedCategoryWeights).forEach(k => {
    const pct = projectedCategoryWeights[k] / newGrossTotal;
    if (pct > projectedHighestPct) projectedHighestPct = pct;
  });

  return (
    <div id="purchase-planner-wizard" className="mx-auto max-w-4xl space-y-6">
      {/* Wizard Progress bar */}
      <div className="flex justify-between items-center rounded-xl border border-border bg-card p-4 text-xs font-semibold uppercase tracking-wider text-mutedText">
        <button
          onClick={() => handleStepChange(1)}
          className={`flex items-center gap-1.5 font-bold transition focus:outline-none ${
            step === 1 ? "text-gold" : "text-emerald-400 hover:text-emerald-300"
          }`}
        >
          {step > 1 ? "✓" : "●"} 1. Target Design
        </button>
        <ArrowRight className="h-3.5 w-3.5 text-mutedText" />
        <button
          onClick={() => handleStepChange(2)}
          disabled={!analysisResult}
          className={`flex items-center gap-1.5 font-bold transition focus:outline-none ${
            step === 2 
              ? "text-gold" 
              : (step > 2 
                  ? "text-emerald-400 hover:text-emerald-300" 
                  : (analysisResult ? "text-white hover:text-gold" : "text-mutedText cursor-not-allowed"))
          }`}
        >
          {step > 2 ? "✓" : (step === 2 ? "●" : "○")} 2. Customise & Optimise
        </button>
        <ArrowRight className="h-3.5 w-3.5 text-mutedText" />
        <button
          onClick={() => handleStepChange(3)}
          disabled={!analysisResult}
          className={`flex items-center gap-1.5 font-bold transition focus:outline-none ${
            step === 3 
              ? "text-gold" 
              : (analysisResult ? "text-white hover:text-gold" : "text-mutedText cursor-not-allowed")
          }`}
        >
          {step === 3 ? "●" : "○"} 3. Purchase Plan
        </button>
      </div>

      {/* STEP 1: Target Design Selection/Inspection */}
      {step === 1 && (
        <div className="space-y-6">
          {analysisResult ? (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Your Selected Target Design</h3>
                  <p className="text-xs text-mutedText mt-0.5">This visual target will be customized and optimized in the next steps.</p>
                </div>
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setDesignFile(null);
                    onClearPreload();
                  }}
                  className="rounded border border-red-500/40 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition"
                >
                  Reset & Choose New Design
                </button>
              </div>

              {/* Specs card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mutedText">Design Attributes</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-mutedText block uppercase">Estimated Category</span>
                      <span className="font-semibold text-white capitalize">{customCategory}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mutedText block uppercase">Design Style</span>
                      <span className="font-semibold text-white capitalize">{customStyle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mutedText block uppercase">Visual Color</span>
                      <span className="font-semibold text-white capitalize">{customColor} Gold</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-mutedText block uppercase">Estimated Weight Range</span>
                      <span className="font-semibold text-white">{analysisResult.estimated_weight_range_grams?.min || 10}g - {analysisResult.estimated_weight_range_grams?.max || 15}g</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mutedText">Collection Similarity check</h4>
                  {similarityPct >= 50 ? (
                    <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3 text-xs flex gap-2">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-300">Similarity: {similarityPct}% (High Redundancy)</span>
                        <p className="text-mutedText mt-1">You already own a similar piece of {customCategory.toLowerCase()}s in your collection ({categoryWeight.toFixed(1)}g).</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 text-xs flex gap-2">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-emerald-300">Similarity: {similarityPct}% (Diversification Added)</span>
                        <p className="text-mutedText mt-1">
                          {categoryOwned 
                            ? `This piece matches your existing ${customCategory.toLowerCase()} collection but has low category concentration weight.`
                            : `This piece introduces a new jewellery category (${customCategory.toLowerCase()}) that is currently missing from your collection.`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 flex justify-end gap-3">
                <button
                  onClick={() => handleOpenTryOn({
                    category: customCategory,
                    purity: selectedPurity,
                    style: customStyle,
                    colour: customColor,
                    image: designFileUrl
                  })}
                  className="rounded border border-gold hover:border-gold-light px-6 py-2.5 text-xs font-bold text-gold hover:text-gold-light transition flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Try On Design
                </button>
                <button
                  onClick={() => handleStepChange(2)}
                  className="rounded bg-gold px-6 py-2.5 text-xs font-bold text-background hover:bg-gold-light transition flex items-center gap-1.5"
                >
                  Proceed to Customise & Optimise <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Design Image */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Option A: Design Photo Upload
                </h3>
                <p className="text-sm text-mutedText">
                  Upload a picture of the jewelry you desire. Gemini will extract design styles, weight ranges, and purity recommendations.
                </p>
                
                <form onSubmit={handleImageAnalyze} className="space-y-4 text-center">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-gold/50 rounded-xl p-8 transition cursor-pointer bg-cardHover/10">
                    <FileUp className="h-10 w-10 text-gold mb-3" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                      className="block text-sm text-mutedText file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold file:text-background file:font-semibold hover:file:bg-gold-light file:cursor-pointer"
                    />
                    {designFile && (
                      <span className="mt-3 text-sm text-gold font-medium">Selected: {designFile.name}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !designFile}
                    className="w-full rounded-lg bg-gold py-3 text-sm font-bold text-background transition hover:bg-gold-light disabled:opacity-50"
                  >
                    {loading ? "AI Running Visual Estimation..." : "Analyze Image & Proceed"}
                  </button>
                </form>
              </div>

              {/* Manual Entry */}
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-1.5">
                    <Calculator className="h-5 w-5 text-gold" />
                    Option B: Manual Plan Setup
                  </h3>
                  <p className="text-sm text-mutedText">
                    Configure a purchase goal without a photo using standard catalog jewelry options (e.g. 10g contemporary bracelet).
                  </p>
                </div>
                
                <form onSubmit={handleManualSpecsSubmit} className="space-y-4">
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-border hover:border-gold py-3 text-sm font-bold text-white hover:bg-cardHover transition"
                  >
                    Set Up Manually
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Customise & Optimise */}
      {step === 2 && analysisResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Customise inputs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gold-light">Customise Your Purchase</h3>
                
                {/* Category selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block">Category</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["necklace", "bangle", "bracelet", "earrings", "ring", "pendant"].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCustomCategory(cat)}
                        className={`py-2 rounded-lg font-bold border transition capitalize ${
                          customCategory.toLowerCase() === cat ? "bg-gold border-gold text-background" : "border-border text-white hover:bg-background"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purity selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block">Purity</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["24K", "22K", "18K"].map(pur => (
                      <button
                        key={pur}
                        type="button"
                        onClick={() => setSelectedPurity(pur)}
                        className={`py-2 rounded-lg font-bold border transition ${
                          selectedPurity === pur ? "bg-gold border-gold text-background" : "border-border text-white hover:bg-background"
                        }`}
                      >
                        {pur}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight controls */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block">Target Weight (grams)</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setCustomWeight(prev => Math.max(1, prev - 1))}
                      className="bg-card hover:bg-cardHover border border-border text-white font-bold h-10 w-10 rounded-lg flex items-center justify-center text-lg focus:outline-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(Math.max(1, Number(e.target.value)))}
                      className="flex-1 bg-background border border-border text-center h-10 rounded-lg text-sm text-white focus:outline-none focus:border-gold font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomWeight(prev => prev + 1)}
                      className="bg-card hover:bg-cardHover border border-border text-white font-bold h-10 w-10 rounded-lg flex items-center justify-center text-lg focus:outline-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Design Style */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block">Design Style</label>
                  <select
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-gold capitalize"
                  >
                    <option value="contemporary">Contemporary</option>
                    <option value="traditional">Traditional</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="bridal">Bridal</option>
                  </select>
                </div>

                {/* Visual Color */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block">Visual Color</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["yellow", "white", "rose"].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setCustomColor(col)}
                        className={`py-2 rounded-lg font-bold border transition capitalize ${
                          customColor === col ? "bg-gold border-gold text-background" : "border-border text-white hover:bg-background"
                        }`}
                      >
                        {col} Gold
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Similar Jewelry Alert */}
              {portfolio.filter(a => a.category.toLowerCase() === customCategory.toLowerCase()).length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
                    <span>Similar Jewelry Already Present</span>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    You currently have <strong className="text-amber-400">{portfolio.filter(a => a.category.toLowerCase() === customCategory.toLowerCase()).length}</strong> item(s) in the <strong className="text-amber-400 capitalize">{customCategory}</strong> category in your portfolio. To optimize diversification, consider using them as trade-in/exchange assets below, or review if a new purchase in this category fits your long-term plan.
                  </p>
                  <div className="bg-background/50 border border-border/60 rounded-lg divide-y divide-border/40 overflow-hidden text-xs">
                    {portfolio.filter(a => a.category.toLowerCase() === customCategory.toLowerCase()).map(a => (
                      <div key={a.asset_id} className="p-3 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white block">{a.name}</span>
                          <span className="text-[10px] text-mutedText block mt-0.5">{a.purity} • {a.gross_weight_grams}g Gross ({a.net_gold_weight_grams}g Fine)</span>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                          Already Owned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Impact section */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gold-light">Portfolio Impact</h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-mutedText block text-[10px] uppercase">Current Portfolio Weight:</span>
                    <span className="text-white text-lg font-bold">{grossTotal.toFixed(2)} g</span>
                  </div>
                  <div>
                    <span className="text-mutedText block text-[10px] uppercase">After Purchase Weight:</span>
                    <span className="text-gold text-lg font-bold">{newGrossTotal.toFixed(2)} g</span>
                  </div>
                </div>
                <div className="border-t border-border/40 pt-3 space-y-2">
                  <span className="text-xs font-bold text-white block">Category Mix Changes:</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs">
                    {["necklace", "bangle", "bracelet", "ring", "earrings", "pendant"].map(cat => {
                      const curW = currentCategoryWeights[cat] || 0;
                      const curPct = grossTotal > 0 ? Math.round((curW / grossTotal) * 100) : 0;
                      
                      const projW = projectedCategoryWeights[cat] || 0;
                      const projPct = newGrossTotal > 0 ? Math.round((projW / newGrossTotal) * 100) : 0;
                      
                      if (curW === 0 && projW === 0) return null;
                      
                      return (
                        <div key={cat} className="bg-background border border-border p-2.5 rounded-lg text-xs space-y-1">
                          <span className="capitalize font-bold text-white block">{cat}</span>
                          <div className="flex justify-between text-mutedText text-[10px]">
                            <span>Before:</span>
                            <span>{curPct}%</span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-gold">
                            <span>After:</span>
                            <span>{projPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Planning Settings & Exchanges */}
            <div className="space-y-6">
              
              {/* Settings Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mutedText">Planning Settings</h3>
                
                {/* Timeline months */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-mutedText uppercase tracking-wider block">Savings Timeline</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[6, 12, 18].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTimelineMonths(m)}
                        className={`py-2 rounded-lg font-bold border transition ${
                          timelineMonths === m ? "bg-gold border-gold text-background" : "border-border text-white hover:bg-background"
                        }`}
                      >
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3 text-xs space-y-1 text-mutedText">
                  <div className="flex justify-between font-bold text-white">
                    <span>Estimated Cost:</span>
                    <span>{currency} {Math.round(totalCost).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly savings gap:</span>
                    <span>{currency} {Math.round(fundingGap / timelineMonths).toLocaleString()}/mo</span>
                  </div>
                </div>
              </div>

              {/* Similarity insight preview */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-mutedText">Collection Similarity check</h3>
                {similarityPct >= 50 ? (
                  <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-3 text-xs flex gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Similarity: {similarityPct}% (High Redundancy)</span>
                      <p className="text-mutedText mt-1">You already own a traditional gold necklace weighing 48.5g.</p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-3 text-xs flex gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-300">Similarity: {similarityPct}% (Diversification Added)</span>
                      <p className="text-mutedText mt-1">
                        {categoryOwned 
                          ? `Matches existing ${customCategory.toLowerCase()} collection but has low category concentration.`
                          : `Introduces a new category (${customCategory.toLowerCase()}) missing from your collection.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2 Navigation buttons */}
          <div className="flex gap-4 border-t border-border pt-4">
            <button
              onClick={() => handleStepChange(1)}
              className="flex-1 py-3 rounded-lg border border-border hover:bg-cardHover text-xs font-bold text-white transition"
            >
              ← Back to Target Design
            </button>
            <button
              onClick={() => handleOpenTryOn({
                category: customCategory,
                purity: selectedPurity,
                style: customStyle,
                colour: customColor,
                image: designFileUrl
              })}
              className="flex-1 py-3 rounded-lg border border-gold hover:border-gold-light text-xs font-bold text-gold hover:text-gold-light transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Try On Design
            </button>
            <button
              onClick={() => handleStepChange(3)}
              className="flex-1 py-3 rounded-lg bg-gold hover:bg-gold-light text-xs font-bold text-background transition"
            >
              Continue to Purchase Plan →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Upgraded Purchase Decision Plan */}
      {step === 3 && (
        <div className="space-y-6">
          
          {/* HERO DECISION SCREEN */}
          <div className="rounded-xl border border-gold/40 bg-card p-6 space-y-6" id="printable-plan">
            
            {/* Plan Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">GoldGuard Decision Intelligence Engine</span>
                <h2 className="text-2xl font-black text-white tracking-wide">Your Gold Purchase Decision</h2>
                <p className="text-xs text-mutedText mt-0.5">Reference: GG-PLAN-{Math.floor(1000 + Math.random() * 9000)} • Grounded Planning Range</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gold block capitalize">{selectedPurity} {analysisResult.style} {targetCategory}</span>
                <span className="text-xs text-mutedText block mt-0.5">Estimated Weight: {targetWeight} g</span>
              </div>
            </div>

            {/* Target & Portfolio Summary parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-background border border-border p-3 rounded-lg">
                <span className="text-mutedText block uppercase">Target Price Range</span>
                <span className="text-sm font-bold text-white">
                  {currency} {Math.round(totalCost * 0.95).toLocaleString()} - {currency} {Math.round(totalCost * 1.05).toLocaleString()}
                </span>
              </div>
              <div className="bg-background border border-border p-3 rounded-lg">
                <span className="text-mutedText block uppercase">Current Portfolio</span>
                <span className="text-sm font-bold text-white">{totalFineGoldPortfolio.toFixed(2)} g fine gold</span>
              </div>
              <div className="bg-background border border-border p-3 rounded-lg">
                <span className="text-mutedText block uppercase">Current Metal Value</span>
                <span className="text-sm font-bold text-white">{currency} {Math.round(totalMetalValuePortfolio).toLocaleString()}</span>
              </div>
              <div className="bg-background border border-border p-3 rounded-lg">
                <span className="text-mutedText block uppercase">Purchase Timeline</span>
                <span className="text-sm font-bold text-white">{timelineMonths} Months</span>
              </div>
            </div>

            {/* Selected Purchase Scheme linked block */}
            {selectedScheme && (
              <div className="bg-emerald-500/5 border border-emerald-500/30 p-4.5 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Linked Gold Purchase Scheme</span>
                    <h3 className="text-sm font-extrabold text-white">{selectedScheme.providerName} — {selectedScheme.schemeName}</h3>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                    {selectedScheme.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs leading-relaxed">
                  <div>
                    <span className="text-mutedText block text-[10px]">Jewellery Target</span>
                    <span className="text-white font-bold">{currency} {Math.round(totalCost).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-mutedText block text-[10px]">Gold Contribution</span>
                    <span className="text-white font-bold">{currency} {Math.round(exchangeCredit).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-mutedText block text-[10px]">Scheme Savings</span>
                    <span className="text-white font-bold">{currency} {schemeTotalContribution.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-mutedText block text-[10px]">Scheme Bonus</span>
                    <span className="text-emerald-400 font-bold">+{currency} {schemeBonus.toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-border/40 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-mutedText block text-[10px] uppercase font-bold">Funding Gap</span>
                    <span className={`text-sm font-black ${schemeRemainingFundingGap === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {currency} {schemeRemainingFundingGap.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs">
                  {schemeRemainingFundingGap === 0 ? (
                    <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider">
                      ✓ Goal fully funded by linked gold scheme and trade-in candidates.
                    </span>
                  ) : (
                    <span className="text-amber-400/90 text-[11px]">
                      Funding Gap is {currency} {schemeRemainingFundingGap.toLocaleString()}. Savings need to be increased by {currency} {Math.round(schemeRemainingFundingGap / selectedScheme.durationMonths)}/mo.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Recommendation block */}
            <div className="border border-gold/40 bg-gradient-to-r from-gold/10 via-card to-background rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-mutedText block">Recommended Strategy</span>
                  <span className="text-2xl font-black text-white">{recommendedStrategy}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-mutedText block">Decision Score</span>
                  <span className="text-xl font-bold text-gold">{purchaseScore} / 100 ({decisionConfidence} Confidence)</span>
                </div>
              </div>
              <p className="text-xs text-white leading-relaxed font-semibold italic">
                {narrativeText}
              </p>
              {portfolio.filter(a => a.category.toLowerCase() === targetCategory.toLowerCase()).length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-gold/20 flex gap-2 items-start text-left text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-400 block">Similar Jewelry Owned:</span>
                    <span className="text-mutedText">
                      You already own {portfolio.filter(a => a.category.toLowerCase() === targetCategory.toLowerCase()).length} item(s) in this category:{" "}
                      {portfolio
                        .filter(a => a.category.toLowerCase() === targetCategory.toLowerCase())
                        .map(a => `${a.name} (${a.gross_weight_grams}g)`)
                        .join(", ")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SELECT ASSETS TO EXCHANGE SECTION */}
            <div className="bg-background/40 border border-border rounded-xl p-5 space-y-4">
              <span className="text-xs font-bold text-gold uppercase tracking-wider block">Select Assets to Exchange</span>
              <p className="text-xs text-mutedText">Toggle items in your collection to trade-in and offset cash requirements.</p>
              {portfolio.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {portfolio.map(a => (
                    <div 
                      key={a.asset_id}
                      onClick={() => toggleExchangeCandidate(a.asset_id)}
                      className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition ${
                        selectedExchangeIds.includes(a.asset_id) ? "border-gold bg-gold/5" : "border-border bg-background hover:border-gold/30"
                      }`}
                    >
                      <div className="flex gap-3 items-center">
                        <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center ${selectedExchangeIds.includes(a.asset_id) ? "border-gold bg-gold text-background" : "border-border"}`}>
                          {selectedExchangeIds.includes(a.asset_id) && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white block">{a.name}</span>
                          <span className="text-xs text-mutedText capitalize">{a.purity} • {a.gross_weight_grams}g</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {currency} {Math.round(a.net_gold_weight_grams * latestRate * 0.98).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-mutedText text-center py-4">No portfolio items available for trade-in comparison.</p>
              )}
              <div className="border-t border-border/40 pt-3 flex justify-between text-xs font-bold">
                <span className="text-mutedText uppercase">Estimated Trade-In Credit:</span>
                <span className="text-emerald-400">{currency} {Math.round(exchangeCredit).toLocaleString()}</span>
              </div>
            </div>

            {/* WHAT-IF SCENARIO ENGINE */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-4.5 w-4.5 text-gold" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-mutedText">What-If Scenario Analysis</h3>
              </div>
              <p className="text-[10px] text-mutedText font-semibold">These are planning scenarios, not gold-price predictions.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 0% scenario */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative overflow-hidden">
                  <span className="text-xs font-bold text-white uppercase block">Current Market (0%)</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mutedText">Target Cost:</span><span className="text-white font-bold">{currency} {Math.round(scenCurrentCost).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Funding Gap:</span><span className="text-white font-bold">{currency} {Math.round(scenCurrentGap).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-gold"><span className="text-mutedText">Monthly Savings:</span><span>{currency} {Math.round(scenCurrentSavings).toLocaleString()}/mo</span></div>
                  </div>
                </div>

                {/* +10% scenario */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative overflow-hidden">
                  <span className="text-xs font-bold text-white uppercase block">Moderate Increase (+10%)</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mutedText">Target Cost:</span><span className="text-white font-bold">{currency} {Math.round(scen10Cost).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Funding Gap:</span><span className="text-white font-bold">{currency} {Math.round(scen10Gap).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-gold"><span className="text-mutedText">Monthly Savings:</span><span>{currency} {Math.round(scen10Savings).toLocaleString()}/mo</span></div>
                  </div>
                </div>

                {/* +20% scenario */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-2 relative overflow-hidden">
                  <span className="text-xs font-bold text-white uppercase block">High Increase (+20%)</span>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mutedText">Target Cost:</span><span className="text-white font-bold">{currency} {Math.round(scen20Cost).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Funding Gap:</span><span className="text-white font-bold">{currency} {Math.round(scen20Gap).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-gold"><span className="text-mutedText">Monthly Savings:</span><span>{currency} {Math.round(scen20Savings).toLocaleString()}/mo</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BUY NOW VS WAIT TIMELINE */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Info className="h-4.5 w-4.5 text-gold" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-mutedText">Savings Timeline — Today's Target Price</h3>
              </div>
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background text-[10px] uppercase tracking-wider text-mutedText">
                      <th className="p-3">Horizon</th>
                      <th className="p-3">Estimated Target Cost</th>
                      <th className="p-3">Funding Gap</th>
                      <th className="p-3">Required Monthly Savings</th>
                      <th className="p-3">Estimated Cost (+10% Scenario)</th>
                      <th className="p-3 text-right">Monthly Savings (+10% Scenario)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {horizonRows.map((h, idx) => (
                      <tr key={idx} className="hover:bg-cardHover/30 text-white">
                        <td className="p-3 font-semibold">{h.months} Months</td>
                        <td className="p-3">{currency} {Math.round(h.targetCost).toLocaleString()}</td>
                        <td className="p-3 font-bold text-gold">{currency} {Math.round(h.fundingGap).toLocaleString()}</td>
                        <td className="p-3 font-bold">{currency} {Math.round(h.monthlySavings).toLocaleString()}/mo</td>
                        <td className="p-3 text-mutedText">{currency} {Math.round(h.targetCost10).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-gold">{currency} {Math.round(h.monthlySavings10).toLocaleString()}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* REGIONAL GOLD SAVINGS SCHEMES DISCOVERY PANEL */}
            <div className="space-y-4 border-t border-border/40 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5" />
                    Available Gold Purchase Schemes
                  </h3>
                  <p className="text-[11px] text-mutedText mt-0.5">
                    Gold purchase schemes verified in your selected region ({userCountry}). <span className="text-amber-500 font-bold">Demo data — verify with provider before purchase.</span>
                  </p>
                </div>
                {comparedSchemeIds.length > 0 && (
                  <button 
                    onClick={() => setComparedSchemeIds([])}
                    className="text-[10px] text-red-400 hover:text-white underline font-semibold"
                  >
                    Clear Comparison ({comparedSchemeIds.length})
                  </button>
                )}
              </div>

              {/* FILTER CONTROLS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background/50 border border-border p-3.5 rounded-xl text-xs">
                <div className="space-y-1">
                  <label className="text-mutedText uppercase text-[9px] font-bold block">Tenure Duration</label>
                  <select 
                    value={filterDuration}
                    onChange={(e) => setFilterDuration(e.target.value)}
                    className="w-full bg-background border border-border rounded p-1.5 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="all">All Durations</option>
                    <option value="6">6 Months</option>
                    <option value="10">10 Months</option>
                    <option value="11">11 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-mutedText uppercase text-[9px] font-bold block">Monthly Budget</label>
                  <select 
                    value={filterBudget}
                    onChange={(e) => setFilterBudget(e.target.value)}
                    className="w-full bg-background border border-border rounded p-1.5 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="all">All Budgets</option>
                    <option value="under250">Under {currency} 250</option>
                    <option value="250to500">{currency} 250–500</option>
                    <option value="500to1000">{currency} 500–1,000</option>
                    <option value="1000plus">{currency} 1,000+</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-mutedText uppercase text-[9px] font-bold block">Scheme Type</label>
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full bg-background border border-border rounded p-1.5 text-white focus:outline-none focus:border-gold"
                  >
                    <option value="all">All Types</option>
                    <option value="Jewellery Savings">Jewellery Savings</option>
                    <option value="Gold Purchase Plan">Gold Purchase Plan</option>
                    <option value="Monthly Instalment">Monthly Instalment</option>
                    <option value="Store Purchase Scheme">Store Purchase Scheme</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC SELECTED SCHEME PARAMETERS RECALCULATION */}
              {selectedScheme && (
                <div className="border border-emerald-500/40 bg-emerald-500/5 p-4 rounded-xl space-y-3.5">
                  <div className="flex justify-between items-start border-b border-emerald-500/20 pb-2">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase block">Selected Purchase Scheme Linked</span>
                      <h4 className="text-sm font-extrabold text-white">{selectedScheme.providerName} — {selectedScheme.schemeName}</h4>
                    </div>
                    <button 
                      onClick={() => setSelectedSchemeId(null)}
                      className="text-[10px] text-emerald-400 hover:text-white underline font-semibold"
                    >
                      Deselect Scheme
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-mutedText block text-[10px]">Monthly Contribution:</span>
                      <span className="text-white font-bold">{currency} {schemeMonthlyContribution.toLocaleString()}/mo</span>
                    </div>
                    <div>
                      <span className="text-mutedText block text-[10px]">Total Scheme Savings:</span>
                      <span className="text-white font-bold">{currency} {schemeTotalContribution.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-mutedText block text-[10px]">Maturity Bonus Benefit:</span>
                      <span className="text-emerald-400 font-bold">+{currency} {schemeBonus.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-mutedText block text-[10px]">Expected Funding:</span>
                      <span className="text-white font-bold">{currency} {schemeExpectedFunding.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-emerald-500/25 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <span className="text-mutedText uppercase font-semibold">Remaining Funding Gap:</span>
                      <span className={`ml-2 text-sm font-black ${schemeRemainingFundingGap === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {currency} {schemeRemainingFundingGap.toLocaleString()}
                      </span>
                    </div>
                    {schemeRemainingFundingGap === 0 ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                        ✓ Goal fully funded
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/90 font-medium">
                        💡 Increment monthly contributions by {currency} {Math.round(schemeRemainingFundingGap / selectedScheme.durationMonths)} or trade in more items to close the gap.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* SCHEMES LIST GRID */}
              {schemesWithScores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schemesWithScores.map((s) => {
                    const isSelected = selectedSchemeId === s.id;
                    const isCompared = comparedSchemeIds.includes(s.id);
                    return (
                      <div 
                        key={s.id} 
                        className={`bg-background border rounded-xl p-4.5 space-y-4 flex flex-col justify-between transition ${
                          isSelected ? "border-gold bg-gold/5" : "border-border hover:border-gold/20"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start border-b border-border/40 pb-2.5">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gold block">{s.providerName}</span>
                              <h4 className="text-sm font-extrabold text-white mt-0.5">{s.schemeName}</h4>
                              <span className="text-[9px] text-mutedText block mt-0.5">{s.type}</span>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                s.matchScore >= 80 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {s.matchScore}/100 Match
                              </span>
                            </div>
                          </div>

                          {/* Recommender why bullets */}
                          <div className="bg-background/40 p-2.5 rounded-lg border border-border/60 my-3 text-[11px] text-gold-light/95 space-y-1">
                            <span className="font-bold block uppercase text-[8px] text-mutedText">Why GoldGuard recommends this:</span>
                            <ul className="list-disc pl-3.5 space-y-0.5">
                              {s.reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>

                          <p className="text-xs text-white leading-relaxed mb-3">
                            <strong className="text-gold">Maturity Benefit:</strong> {s.maturityBenefit}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-mutedText bg-background p-2.5 rounded border border-border/40 font-mono">
                            <div>Duration: <span className="text-white font-bold">{s.durationMonths} Months</span></div>
                            <div>Monthly limit: <span className="text-white font-bold">{currency} {s.minimumMonthlyContribution}-{s.maximumMonthlyContribution}</span></div>
                            <div className="col-span-2 border-t border-border/40 pt-1.5 mt-1.5">Purchase lock: <span className="text-white font-semibold">{s.purchaseBenefit}</span></div>
                          </div>
                        </div>

                        {/* Store & Contact details */}
                        <div className="border-t border-border/40 pt-3 text-[10px] text-mutedText space-y-1 bg-background/20 p-2 rounded">
                          <div className="flex justify-between"><strong>Store:</strong> <span className="text-white">{s.storeName}</span></div>
                          <div className="flex justify-between"><strong>Address:</strong> <span className="text-white line-clamp-1">{s.storeAddress}</span></div>
                          <div className="flex justify-between"><strong>Phone:</strong> <span className="text-white">{s.storePhone}</span></div>
                          <div className="flex justify-between"><strong>Website:</strong> <a href={s.website} target="_blank" rel="noreferrer" className="text-gold underline">{s.providerName.toLowerCase()}-example.com</a></div>
                        </div>

                        {/* Card actions */}
                        <div className="flex gap-2 pt-2 text-xs">
                          <button
                            onClick={() => setSelectedStoreForMap(s)}
                            className="flex-1 bg-background border border-border text-white py-2 rounded font-bold hover:bg-cardHover transition text-center"
                          >
                            View Store Map
                          </button>
                          <button
                            onClick={() => {
                              if (isCompared) {
                                setComparedSchemeIds(comparedSchemeIds.filter(id => id !== s.id));
                              } else {
                                if (comparedSchemeIds.length >= 3) {
                                  alert("You can compare up to 3 schemes.");
                                } else {
                                  setComparedSchemeIds([...comparedSchemeIds, s.id]);
                                }
                              }
                            }}
                            className={`px-3 py-2 rounded border font-bold transition ${
                              isCompared ? "bg-amber-500/15 border-amber-500 text-amber-400" : "border-border text-white hover:bg-cardHover"
                            }`}
                          >
                            {isCompared ? "Compared" : "Compare"}
                          </button>
                          <button
                            onClick={() => setSelectedSchemeId(isSelected ? null : s.id)}
                            className={`flex-1 py-2 rounded font-bold transition text-center ${
                              isSelected ? "bg-emerald-500 text-background hover:bg-emerald-400" : "bg-gold text-background hover:bg-gold-light"
                            }`}
                          >
                            {isSelected ? "Selected ✓" : "Select Scheme"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-mutedText text-center py-6 bg-background/30 rounded-xl border border-border/40">
                  No gold savings schemes matched your active filters in {userCountry}.
                </p>
              )}

              {/* MAP DIALOG MOCKUP OVERLAY */}
              {selectedStoreForMap && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60 animate-fadeIn">
                  <div className="bg-card border border-border rounded-xl w-full max-w-lg p-5 space-y-4 shadow-2xl relative text-left">
                    <button 
                      onClick={() => setSelectedStoreForMap(null)}
                      className="absolute top-4 right-4 p-1 text-mutedText hover:text-white rounded hover:bg-cardHover"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div>
                      <span className="text-[9px] text-gold uppercase font-bold tracking-wider">Nearby Provider Locator</span>
                      <h3 className="text-base font-extrabold text-white mt-0.5">{selectedStoreForMap.storeName}</h3>
                      <p className="text-xs text-mutedText mt-1">{selectedStoreForMap.storeAddress}</p>
                    </div>

                    {/* MOCK GOOGLE MAP PANEL */}
                    <div className="h-44 bg-background border border-border rounded-lg relative overflow-hidden flex flex-col justify-end">
                      {/* Stylized Grid representing road patterns */}
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                      
                      {/* Stylized Road segments */}
                      <div className="absolute w-full h-3 bg-cardHover/50 top-1/2 left-0 transform -translate-y-1/2"></div>
                      <div className="absolute h-full w-4 bg-cardHover/50 left-1/3 top-0"></div>
                      
                      {/* Active Store Pin */}
                      <div className="absolute left-[33%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                        <div className="bg-gold text-background rounded-full p-1 text-[9px] font-black border border-white shadow-lg">
                          📍 {selectedStoreForMap.providerName}
                        </div>
                      </div>

                      {/* Map Controls */}
                      <div className="absolute right-2 top-2 bg-black/80 border border-border text-[9px] text-white px-2 py-1 rounded flex flex-col gap-1 z-10 font-mono">
                        <button className="hover:text-gold font-extrabold text-center select-none">+</button>
                        <button className="hover:text-gold font-extrabold text-center select-none">-</button>
                      </div>

                      <div className="bg-black/90 p-2.5 text-[10px] text-mutedText flex justify-between items-center border-t border-border z-10">
                        <span>Coordinates: {selectedStoreForMap.latitude}, {selectedStoreForMap.longitude}</span>
                        <span className="text-gold font-bold">~1.2 km away</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 text-xs">
                      <button 
                        onClick={() => alert(`Directions loaded for store: ${selectedStoreForMap.storeAddress}`)}
                        className="flex-1 py-2 bg-gold text-background rounded font-bold hover:bg-gold-light transition"
                      >
                        Get Directions
                      </button>
                      <button 
                        onClick={() => window.open(selectedStoreForMap.website, "_blank")}
                        className="flex-1 py-2 border border-border text-white rounded font-bold hover:bg-cardHover transition"
                      >
                        Visit Website
                      </button>
                      <button 
                        onClick={() => setSelectedStoreForMap(null)}
                        className="px-4 py-2 border border-border text-mutedText hover:text-white rounded font-medium transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* COMPARE SCHEMES MODAL / COMPARISON GRID */}
              {comparedSchemeIds.length > 0 && (
                <div className="border border-gold/30 bg-background/60 p-4.5 rounded-xl space-y-4">
                  <div className="border-b border-border/40 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Compare Savings Schemes</h4>
                    <p className="text-[10px] text-mutedText mt-0.5">Side-by-side analysis of up to 3 compared schemes based on your {timelineMonths}-month purchase plan.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-background/80 text-[9px] uppercase tracking-wider text-mutedText font-bold">
                          <th className="p-2.5">Feature Parameters</th>
                          {comparedSchemeIds.map(id => {
                            const sc = SCHEMES_DATABASE.find(s => s.id === id);
                            const recScore = sc ? (sc.durationMonths === timelineMonths ? 95 : 75) : 50;
                            return (
                              <th key={id} className="p-2.5 min-w-[130px] border-l border-border/40 relative">
                                <span className="text-white block font-black">{sc?.providerName}</span>
                                <span className="text-[9px] text-gold">{sc?.schemeName}</span>
                                {recScore >= 90 && (
                                  <span className="absolute top-1 right-2 bg-gold text-background text-[8px] px-1.5 py-0.2 rounded font-black uppercase">
                                    Rec
                                  </span>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-mutedText leading-relaxed">
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Scheme Type</td>
                          {comparedSchemeIds.map(id => (
                            <td key={id} className="p-2 border-l border-border/40 text-white font-mono">{SCHEMES_DATABASE.find(s => s.id === id)?.type}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Tenure Duration</td>
                          {comparedSchemeIds.map(id => (
                            <td key={id} className="p-2 border-l border-border/40 text-white font-bold">{SCHEMES_DATABASE.find(s => s.id === id)?.durationMonths} Months</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Monthly Contribution</td>
                          {comparedSchemeIds.map(id => {
                            const sc = SCHEMES_DATABASE.find(s => s.id === id);
                            const calcM = Math.min(sc?.maximumMonthlyContribution || 1000, Math.max(sc?.minimumMonthlyContribution || 10, Math.round(monthlySavings)));
                            return (
                              <td key={id} className="p-2 border-l border-border/40 text-white font-mono">{currency} {calcM.toLocaleString()}</td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Total Savings</td>
                          {comparedSchemeIds.map(id => {
                            const sc = SCHEMES_DATABASE.find(s => s.id === id);
                            const calcM = Math.min(sc?.maximumMonthlyContribution || 1000, Math.max(sc?.minimumMonthlyContribution || 10, Math.round(monthlySavings)));
                            const totalS = calcM * (sc?.durationMonths || 1);
                            return (
                              <td key={id} className="p-2 border-l border-border/40 text-white font-mono">{currency} {totalS.toLocaleString()}</td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Bonus Benefit Value</td>
                          {comparedSchemeIds.map(id => {
                            const sc = SCHEMES_DATABASE.find(s => s.id === id);
                            const calcM = Math.min(sc?.maximumMonthlyContribution || 1000, Math.max(sc?.minimumMonthlyContribution || 10, Math.round(monthlySavings)));
                            const bonus = Math.round(calcM * (sc?.bonusBenefit || 0));
                            return (
                              <td key={id} className="p-2 border-l border-border/40 text-emerald-400 font-bold font-mono">+{currency} {bonus.toLocaleString()}</td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Store Address</td>
                          {comparedSchemeIds.map(id => (
                            <td key={id} className="p-2 border-l border-border/40 text-[10px] text-white line-clamp-2">{SCHEMES_DATABASE.find(s => s.id === id)?.storeAddress}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Match Score</td>
                          {comparedSchemeIds.map(id => {
                            const sc = SCHEMES_DATABASE.find(s => s.id === id);
                            const recScore = sc ? (sc.durationMonths === timelineMonths ? 95 : 75) : 50;
                            return (
                              <td key={id} className="p-2 border-l border-border/40 text-gold font-bold">{recScore}/100 Match</td>
                            );
                          })}
                        </tr>
                        <tr>
                          <td className="p-2 bg-background/20 font-semibold">Actions</td>
                          {comparedSchemeIds.map(id => (
                            <td key={id} className="p-2 border-l border-border/40">
                              <button 
                                onClick={() => setSelectedSchemeId(id)}
                                className="bg-gold text-background text-[10px] font-bold px-3 py-1 rounded hover:bg-gold-light transition"
                              >
                                Select Scheme
                              </button>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* BUY NEW VS EXCHANGE VS SELL COMPARE */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4.5 w-4.5 text-gold" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-mutedText">Comparative Strategies Optimization</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Option A */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-3">
                  <div className="border-b border-border pb-1">
                    <span className="text-[10px] uppercase font-bold text-mutedText block">Option A</span>
                    <span className="text-sm font-bold text-white">BUY NEW</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mutedText">Target Cost:</span><span>{currency} {Math.round(optA_cost).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Trade-in Credit:</span><span>{currency} 0</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Funding Gap:</span><span className="text-white font-bold">{currency} {Math.round(optA_gap).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-gold"><span className="text-mutedText">Monthly Savings:</span><span>{currency} {Math.round(optA_savings).toLocaleString()}/mo</span></div>
                  </div>
                  <p className="text-[10px] text-mutedText leading-tight italic">None (Preserves 100% of current holdings)</p>
                </div>

                {/* Option B */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gold text-background text-[9px] font-bold px-2 py-0.5 rounded-bl">RECOMMENDED</div>
                  <div className="border-b border-border pb-1">
                    <span className="text-[10px] uppercase font-bold text-mutedText block">Option B</span>
                    <span className="text-sm font-bold text-white">EXCHANGE GOLD</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mutedText">Trade-In Credit:</span><span className="text-emerald-400 font-bold">{currency} {Math.round(optB_credit).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Funding Gap:</span><span className="text-white font-bold">{currency} {Math.round(optB_gap).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-gold"><span className="text-mutedText">Monthly Savings:</span><span>{currency} {Math.round(optB_savings).toLocaleString()}/mo</span></div>
                  </div>
                  <p className="text-[10px] text-mutedText leading-tight italic">Medium (Selected items are exchanged to offset cost)</p>
                </div>

                {/* Option C */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-3">
                  <div className="border-b border-border pb-1">
                    <span className="text-[10px] uppercase font-bold text-mutedText block">Option C</span>
                    <span className="text-sm font-bold text-white">SELL GOLD</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-mutedText">Sale Proceeds:</span><span className="text-emerald-400 font-bold">{currency} {Math.round(optC_credit).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-mutedText">Funding Gap:</span><span className="text-white font-bold">{currency} {Math.round(optC_gap).toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-border pt-1 font-bold text-gold"><span className="text-mutedText">Monthly Savings:</span><span>{currency} {Math.round(optC_savings).toLocaleString()}/mo</span></div>
                  </div>
                  <p className="text-[10px] text-mutedText leading-tight italic">High (Exchanged for raw cash sale, reduces holdings)</p>
                </div>
              </div>
            </div>

            {/* RECOMMENDED STRATEGY CHECKLIST */}
            <div className="bg-background border border-border rounded-xl p-5 space-y-4">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">🟢 Recommended Strategy</span>
              <h3 className="text-xl font-extrabold text-white uppercase">{recommendedStrategy}</h3>
              <p className="text-sm font-bold text-gold capitalize">{selectedPurity} {targetCategory}</p>
              <p className="text-xs text-white">Weight: {targetWeight}g</p>
              <div className="space-y-1.5 text-xs">
                <span className="text-mutedText uppercase block font-bold mt-2">Planning Range</span>
                <span className="text-sm font-bold text-white">
                  {currency} {Math.round(totalCost * 0.95).toLocaleString()} - {currency} {Math.round(totalCost * 1.05).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-border/40 pt-3 space-y-2">
                <strong className="text-mutedText uppercase text-xs block mb-1">Why?</strong>
                <ul className="space-y-1 text-xs">
                  {isMissing && <li className="text-emerald-400 font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Adds a missing jewellery category</li>}
                  {!isMissing && <li className="text-white flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Complements existing collection</li>}
                  {similarityPct <= 20 && <li className="text-emerald-400 font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Low similarity minimizes collection redundancy</li>}
                  {totalCost <= budget && <li className="text-emerald-400 font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Fits the selected budget</li>}
                  <li className="text-emerald-400 font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Fits the {timelineMonths}-month timeline</li>
                  {selectedExchangeIds.length === 0 ? (
                    <li className="text-emerald-400 font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Preserves existing gold holdings</li>
                  ) : (
                    <li className="text-emerald-400 font-semibold flex items-center gap-1.5"><Check className="h-4 w-4 shrink-0" /> Offsets cash outflow via trade-in</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Score & Explanator Section */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-4 text-xs leading-relaxed">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-xs font-bold text-gold uppercase tracking-wider block">Decision Score & Why?</span>
                <span className="font-extrabold text-white text-sm">Purchase Score: {purchaseScore} / 100 ({decisionConfidence} Confidence)</span>
              </div>
              <p className="text-white font-medium text-sm leading-relaxed">{narrativeText}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-3 mt-3">
                <div>
                  <strong className="text-mutedText uppercase block mb-1">Scoring parameters</strong>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div>Diversification: {score_diversification}</div>
                    <div>Budget Fit: {score_budget_fit}</div>
                    <div>Feasibility: {score_feasibility}</div>
                    <div>Category Complementarity: {score_complementarity}</div>
                    <div>Market Context: {score_market_context}</div>
                    <div>Redundancy Avoidance: {score_redundancy_avoidance}</div>
                  </div>
                </div>
                <div>
                  <strong className="text-mutedText uppercase block mb-1">Grounded Assumptions</strong>
                  <ul className="list-disc pl-4 space-y-0.5 text-mutedText">
                    <li>Making charges set at a standard retail rate of 10.0%</li>
                    <li>Gold prices modeled with 12.0% standard deviation of annual return</li>
                    <li>Exchange candidates valued at 98% of spot rate in local currency</li>
                  </ul>
                  <span className="text-[9px] text-mutedText block mt-2">* Disclaimer: GoldGuard provides data-driven planning insights, not guaranteed price forecasts or financial advice.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-3">
            <button
              onClick={() => handleStepChange(2)}
              className="flex-1 rounded-lg border border-border py-3 text-sm font-semibold hover:bg-cardHover text-white transition"
            >
              ← Back to Customise & Optimise
            </button>
            <button
              onClick={() => handleOpenTryOn({
                category: customCategory,
                purity: selectedPurity,
                style: customStyle,
                colour: customColor,
                image: designFileUrl
              })}
              className="flex-1 rounded-lg border border-gold hover:border-gold-light py-3 text-sm font-bold text-gold hover:text-gold-light transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-4.5 w-4.5" />
              Try On Design
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-lg bg-gold py-3 text-sm font-bold text-background hover:bg-gold-light transition flex items-center justify-center gap-2"
            >
              <Printer className="h-4.5 w-4.5" />
              Print Gold Purchase Plan
            </button>
          </div>
        </div>
      )}

      <TryOnModal 
        isOpen={isTryOnOpen} 
        onClose={() => setIsTryOnOpen(false)} 
        jewellery={tryOnItem} 
        portfolio={portfolio}
      />
    </div>
  );
};
