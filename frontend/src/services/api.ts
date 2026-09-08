const API_BASE = typeof window !== "undefined" && window.location.port === "5173"
  ? "http://localhost:8000/api" 
  : "/api";

export interface Asset {
  asset_id: string;
  name: string;
  category: string;
  style: string;
  purity: string;
  gross_weight_grams: number;
  net_gold_weight_grams: number;
  purchase_date: string;
  purchase_price: number | null;
  purchase_price_converted?: number | null;
  gold_rate: number;
  making_charges: number;
  wastage: number;
  taxes: number;
  currency: string;
  invoice_reference: string | null;
  image_reference: string | null;
  documentation_status: "verified_invoice" | "self_reported" | "ai_estimated";
  data_sources: Record<string, string>;
  estimated_current_value: number;
  current_gold_metal_value?: number;
  last_updated: string;
  is_suspicious?: boolean;
  suspicious_reason?: string;
  notes?: string | null;

  // New fields (Section 17 & 18)
  purchase_price_status?: "EXACT" | "APPROXIMATE" | "UNKNOWN";
  purchase_price_source?: "INVOICE" | "USER_EXACT" | "USER_APPROXIMATE" | "AI_ESTIMATED" | "UNKNOWN";
  provenance_status?: "INVOICE_VERIFIED" | "SELF_REPORTED" | "AI_ESTIMATED" | "AI_ESTIMATED_USER_CONFIRMED";
  historical_gold_value?: number | null;
  estimated_jewellery_value_min?: number | null;
  estimated_jewellery_value_max?: number | null;
  estimated_liquidation_value_min?: number | null;
  estimated_liquidation_value_max?: number | null;
  historical_gold_price?: number | null;
  historical_gold_price_currency?: string | null;
  historical_gold_price_date?: string | null;
  estimation_confidence?: "High" | "Medium" | "Low" | null;
  estimation_method?: string | null;
}

export interface PortfolioSummary {
  total_assets: number;
  total_gross_weight_grams: number;
  total_net_gold_weight_grams: number;
  estimated_current_value: number;
  total_historical_gold_value: number;
  total_purchase_cost: number;
  total_estimated_purchase_price: number;
  gain_loss: number;
  gain_loss_percent: number;
  category_recommendations?: any;
  health_score?: {
    overall_score: number;
    grade: string;
    components: {
      diversification: number;
      data_confidence: number;
      liquidity: number;
      purity: number;
      purchase_readiness: number;
    };
    explanations: Record<string, string>;
  };
  currency: string;
}

export interface PortfolioResponse {
  assets: Asset[];
  summary: PortfolioSummary;
}

export interface MarketResponse {
  prices: Array<{ date: string; gold_price: number }>;
  latest_price: number;
  daily_change_percent: number;
  monthly_change_percent: number;
  currency: string;
}

// Fallback Mock Data for Client Resilience
const mockPrices = (currency: string): MarketResponse => {
  const rates: Record<string, number> = { USD: 1, SGD: 1.34, INR: 83.5, AED: 3.67, EUR: 0.9, GBP: 0.77 };
  const mult = rates[currency] || 1.34;
  return {
    prices: [
      { date: "2026-08-20", gold_price: 139.80 * mult },
      { date: "2026-08-21", gold_price: 140.20 * mult },
      { date: "2026-08-22", gold_price: 140.70 * mult },
      { date: "2026-08-23", gold_price: 141.10 * mult },
      { date: "2026-08-24", gold_price: 141.72 * mult },
      { date: "2026-08-25", gold_price: 141.90 * mult },
      { date: "2026-08-26", gold_price: 141.50 * mult },
      { date: "2026-08-27", gold_price: 141.72 * mult }
    ],
    latest_price: 141.72 * mult,
    daily_change_percent: 0.27,
    monthly_change_percent: 2.14,
    currency
  };
};

const mockPortfolio = (currency: string): PortfolioResponse => {
  const rates: Record<string, number> = { USD: 1, SGD: 1.34, INR: 83.5, AED: 3.67, EUR: 0.9, GBP: 0.77 };
  const mult = rates[currency] || 1.34;
  
  const assets: Asset[] = [
    {
      asset_id: "ASSET_001",
      name: "Traditional Marriage Haram",
      category: "necklace",
      style: "traditional",
      purity: "22K",
      gross_weight_grams: 48.5,
      net_gold_weight_grams: 44.46,
      purchase_date: "2022-10-15",
      purchase_price: 2850.00 * mult,
      purchase_price_converted: 2850.00 * mult,
      gold_rate: 55.40 * mult,
      making_charges: 250.00 * mult,
      wastage: 5.0,
      taxes: 120.00 * mult,
      currency,
      invoice_reference: "inv_2022_1098.pdf",
      image_reference: "/jewellery/user_necklace_traditional.jpg",
      documentation_status: "verified_invoice",
      data_sources: { name: "invoice", purity: "invoice", weight: "invoice", purchase_price: "invoice" },
      estimated_current_value: 44.46 * 141.72 * mult,
      current_gold_metal_value: 44.46 * 141.72 * mult,
      last_updated: new Date().toISOString(),
      purchase_price_status: "EXACT",
      purchase_price_source: "INVOICE",
      provenance_status: "INVOICE_VERIFIED",
      historical_gold_value: 44.46 * 55.40 * mult,
      estimated_jewellery_value_min: 44.46 * 141.72 * mult * 1.10,
      estimated_jewellery_value_max: 44.46 * 141.72 * mult * 1.30,
      estimated_liquidation_value_min: 44.46 * 141.72 * mult * 0.98,
      estimated_liquidation_value_max: 44.46 * 141.72 * mult * 1.00,
      historical_gold_price: 55.40 * mult,
      historical_gold_price_currency: "USD",
      historical_gold_price_date: "2022-10-15",
      estimation_confidence: "High"
    },
    {
      asset_id: "ASSET_002",
      name: "Heavy Filigree Bangles (Pair)",
      category: "bangle",
      style: "traditional",
      purity: "22K",
      gross_weight_grams: 32.0,
      net_gold_weight_grams: 29.33,
      purchase_date: "2023-04-12",
      purchase_price: 1950.00 * mult,
      purchase_price_converted: 1950.00 * mult,
      gold_rate: 58.10 * mult,
      making_charges: 180.00 * mult,
      wastage: 2.0,
      taxes: 90.00 * mult,
      currency,
      invoice_reference: "inv_2023_8892.pdf",
      image_reference: "/jewellery/user_bangles_filigree.jpg",
      documentation_status: "verified_invoice",
      data_sources: { name: "invoice", purity: "invoice", weight: "invoice", purchase_price: "invoice" },
      estimated_current_value: 29.33 * 141.72 * mult,
      current_gold_metal_value: 29.33 * 141.72 * mult,
      last_updated: new Date().toISOString(),
      purchase_price_status: "EXACT",
      purchase_price_source: "INVOICE",
      provenance_status: "INVOICE_VERIFIED",
      historical_gold_value: 29.33 * 58.10 * mult,
      estimated_jewellery_value_min: 29.33 * 141.72 * mult * 1.10,
      estimated_jewellery_value_max: 29.33 * 141.72 * mult * 1.30,
      estimated_liquidation_value_min: 29.33 * 141.72 * mult * 0.98,
      estimated_liquidation_value_max: 29.33 * 141.72 * mult * 1.00,
      historical_gold_price: 58.10 * mult,
      historical_gold_price_currency: "USD",
      historical_gold_price_date: "2023-04-12",
      estimation_confidence: "High"
    },
    {
      asset_id: "ASSET_005",
      name: "Ong Antique Gold Haram",
      category: "necklace",
      style: "traditional",
      purity: "22K",
      gross_weight_grams: 100.0,
      net_gold_weight_grams: 91.67,
      purchase_date: "2019-06-15",
      purchase_price: 6419.00 * (mult / 1.34),
      purchase_price_converted: 6419.00 * (mult / 1.34),
      gold_rate: 45.00 * mult,
      making_charges: 1200.00,
      wastage: 6.0,
      taxes: 400.00,
      currency: "SGD",
      invoice_reference: null,
      image_reference: "/jewellery/user_antique_haram.jpg",
      documentation_status: "self_reported",
      data_sources: { name: "user_input", purity: "user_input", weight: "user_input", purchase_price: "user_input" },
      estimated_current_value: 91.67 * 141.72 * mult,
      current_gold_metal_value: 91.67 * 141.72 * mult,
      last_updated: new Date().toISOString(),
      purchase_price_status: "APPROXIMATE",
      purchase_price_source: "USER_APPROXIMATE",
      provenance_status: "SELF_REPORTED",
      historical_gold_value: 91.67 * 45.00 * mult,
      estimated_jewellery_value_min: 91.67 * 141.72 * mult * 1.10,
      estimated_jewellery_value_max: 91.67 * 141.72 * mult * 1.30,
      estimated_liquidation_value_min: 91.67 * 141.72 * mult * 0.98,
      estimated_liquidation_value_max: 91.67 * 141.72 * mult * 1.00,
      historical_gold_price: 45.00 * mult,
      historical_gold_price_currency: "USD",
      historical_gold_price_date: "2019 Estimate",
      estimation_confidence: "Medium",
      is_suspicious: false
    }
  ];

  const totalPurchase = (2850.00 * mult) + (1950.00 * mult) + (6419.00 * (mult / 1.34));
  const totalVal = (44.46 + 29.33 + 91.67) * 141.72 * mult;
  const totalHistVal = ((44.46 * 55.40) + (29.33 * 58.10) + (91.67 * 45.00)) * mult;

  // Dynamic fallback category recommendations calculation
  const SUPPORTED_CATEGORIES = ["NECKLACE", "BANGLE", "BRACELET", "EARRINGS", "RING", "PENDANT"];
  const catWeights: Record<string, number> = { necklace: 0, bangle: 0, bracelet: 0, earrings: 0, ring: 0, pendant: 0 };
  assets.forEach(a => {
    const c = a.category.toLowerCase();
    if (c in catWeights) {
      catWeights[c] += a.gross_weight_grams;
    }
  });
  const totalGross = 180.5;
  const ownedCategories = Object.keys(catWeights).filter(k => catWeights[k] > 0);
  const missingCategories = Object.keys(catWeights).filter(k => catWeights[k] === 0);
  const catPct: Record<string, number> = {};
  Object.keys(catWeights).forEach(k => {
    catPct[k] = (catWeights[k] / totalGross) * 100;
  });
  
  let maxCat = "necklace";
  let maxPct = 0;
  Object.keys(catPct).forEach(k => {
    if (catPct[k] > maxPct) {
      maxPct = catPct[k];
      maxCat = k;
    }
  });

  const recs = SUPPORTED_CATEGORIES.map(cat => {
    const catLower = cat.toLowerCase();
    const isMissing = missingCategories.includes(catLower);
    const simW = catLower === "earrings" || catLower === "ring" ? 10.0 : (catLower === "bracelet" || catLower === "pendant" ? 20.0 : 40.0);
    
    const simWeights = { ...catWeights };
    simWeights[catLower] += simW;
    const simTotal = totalGross + simW;
    const simPct = (simWeights[catLower] / simTotal) * 100;
    
    let simMaxPct = 0;
    Object.keys(simWeights).forEach(k => {
      const p = (simWeights[k] / simTotal) * 100;
      if (p > simMaxPct) simMaxPct = p;
    });

    const isDominant = catLower === maxCat;
    const reason = isMissing 
      ? `${cat} are currently absent from your portfolio. Adding a new category can improve collection diversification without requiring you to sell existing gold.` 
      : (isDominant ? `Your portfolio is already concentrated in ${catLower}s (${maxPct.toFixed(1)}%). Adding another would increase concentration risk.` : `You already own ${catLower}s (${catPct[catLower].toFixed(1)}%), but adding more can still be planned.`);

    const missingScore = isMissing ? 100 : 20;
    const divScore = maxPct > 0 ? Math.max(0, Math.min(100, Math.round((maxPct - simMaxPct) * 10 + 50))) : 100;
    const weightScore = catLower === "earrings" || catLower === "ring" ? 100 : (catLower === "bracelet" || catLower === "pendant" || catLower === "bangle" ? 75 : 40);
    const score = Math.round(missingScore * 0.35 + divScore * 0.35 + 50 * 0.15 + weightScore * 0.15);

    return {
      category: cat,
      score,
      is_missing: isMissing,
      current_weight: catWeights[catLower],
      current_percentage: Math.round(catPct[catLower] * 10) / 10,
      simulated_weight: simW,
      projected_percentage: Math.round(simPct * 10) / 10,
      projected_max_concentration: Math.round(simMaxPct * 10) / 10,
      reason
    };
  });

  recs.sort((a, b) => b.score - a.score);
  const selectedRecommendation = recs[0];

  const category_recommendations = {
    is_balanced: maxPct < 45.0 && ownedCategories.length >= 3,
    max_concentration_category: maxCat.charAt(0).toUpperCase() + maxCat.slice(1),
    max_concentration_percentage: Math.round(maxPct * 10) / 10,
    owned_categories: ownedCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    missing_categories: missingCategories.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
    recommendations: recs,
    selected_recommendation: selectedRecommendation
  };

  return {
    assets,
    summary: {
      total_assets: assets.length,
      total_gross_weight_grams: 180.5,
      total_net_gold_weight_grams: 165.46,
      estimated_current_value: totalVal,
      total_historical_gold_value: totalHistVal,
      total_purchase_cost: totalPurchase,
      total_estimated_purchase_price: totalPurchase,
      gain_loss: totalVal - totalHistVal,
      gain_loss_percent: ((totalVal - totalHistVal) / totalHistVal) * 100,
      category_recommendations,
      currency
    }
  };
};

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return { status: "healthy", demo_mode: true };
    }
  },

  async getPrices(currency: string): Promise<MarketResponse> {
    try {
      const res = await fetch(`${API_BASE}/prices?currency=${currency}`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return mockPrices(currency);
    }
  },

  async getCatalog() {
    try {
      const res = await fetch(`${API_BASE}/catalog`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return []; // empty list fallback
    }
  },

  async getPortfolio(currency: string): Promise<PortfolioResponse> {
    try {
      const res = await fetch(`${API_BASE}/portfolio?currency=${currency}`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return mockPortfolio(currency);
    }
  },

  async estimateHistoricalValue(payload: {
    gross_weight: number;
    purity: string;
    date_or_year: string;
    currency: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/portfolio/estimate-historical`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async addManualAsset(payload: {
    user_id: string;
    name: string;
    category: string;
    purity: string;
    gross_weight_grams: number;
    purchase_date: string;
    purchase_price_usd?: number | null;
    currency?: string;
    purchase_price_status?: string;
    purchase_price_source?: string;
    provenance_status?: string;
    historical_gold_value?: number | null;
    estimated_jewellery_value_min?: number | null;
    estimated_jewellery_value_max?: number | null;
    estimated_liquidation_value_min?: number | null;
    estimated_liquidation_value_max?: number | null;
    historical_gold_price?: number | null;
    historical_gold_price_currency?: string;
    historical_gold_price_date?: string | null;
    estimation_confidence?: string | null;
    estimation_method?: string | null;
    notes?: string;
    image_reference?: string | null;
    colour?: string;
    style?: string;
  }) {
    const res = await fetch(`${API_BASE}/portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Failed to add asset (Status ${res.status})`);
    }
    return await res.json();
  },

  async editAsset(payload: {
    user_id: string;
    asset_id: string;
    name: string;
    category: string;
    style?: string;
    purity: string;
    gross_weight_grams: number;
    purchase_price?: number | null;
    purchase_date: string;
    currency: string;
    documentation_status: string;
    notes?: string | null;
    purchase_price_status?: string;
    purchase_price_source?: string;
    provenance_status?: string;
    historical_gold_value?: number | null;
    estimated_jewellery_value_min?: number | null;
    estimated_jewellery_value_max?: number | null;
    estimated_liquidation_value_min?: number | null;
    estimated_liquidation_value_max?: number | null;
    historical_gold_price?: number | null;
    historical_gold_price_currency?: string;
    historical_gold_price_date?: string | null;
    estimation_confidence?: string | null;
    estimation_method?: string | null;
    image_reference?: string | null;
  }) {
    const res = await fetch(`${API_BASE}/portfolio/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Failed to update asset (Status ${res.status})`);
    }
    return await res.json();
  },

  async uploadAssetImage(assetId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/portfolio/${assetId}/upload-image`, {
        method: "POST",
        body: formData
      });
      return await res.json();
    } catch {
      return { status: "success", image_reference: "/uploads/mock_uploaded.png" };
    }
  },

  async deleteAsset(assetId: string) {
    const res = await fetch(`${API_BASE}/portfolio/${assetId}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Failed to delete asset (Status ${res.status})`);
    }
    return await res.json();
  },

  async extractInvoice(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", "user_bride");
      
      const res = await fetch(`${API_BASE}/invoice/extract`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "We couldn't reliably read this invoice.");
      }
      return await res.json();
    } catch (err: any) {
      console.error("Invoice extraction failed:", err);
      throw new Error(err?.message || "We couldn't reliably read this invoice.");
    }
  },

  async analyzeJewellery(file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${API_BASE}/jewellery/analyze`, {
        method: "POST",
        body: formData
      });
      return await res.json();
    } catch {
      // Return high-fidelity mock design analysis
      const fnLower = file.name.toLowerCase();
      let cat = "bracelet";
      let sty = "contemporary";
      let minW = 8.0;
      let maxW = 12.0;
      let minP = 500.0;
      let maxP = 800.0;
      let feats = ["sleek circular gold contour", "high-polish finish"];
      let purities = ["22K", "18K"];

      if (fnLower.includes("necklace") || fnLower.includes("haram") || fnLower.includes("8494") || fnLower.includes("8482")) {
        cat = "necklace";
        sty = "traditional";
        minW = 38.0;
        maxW = 45.0;
        minP = 2500.0;
        maxP = 3200.0;
        feats = ["filigree", "floral motif"];
        purities = ["22K"];
      } else if (fnLower.includes("earring") || fnLower.includes("jhumka") || fnLower.includes("8520") || fnLower.includes("8521")) {
        cat = "earrings";
        sty = "contemporary";
        minW = 6.0;
        maxW = 10.0;
        minP = 400.0;
        maxP = 750.0;
        feats = ["hanging drops", "stud clasp"];
        purities = ["22K", "18K"];
      } else if (fnLower.includes("ring") || fnLower.includes("band")) {
        cat = "ring";
        sty = "minimalist";
        minW = 3.0;
        maxW = 6.5;
        minP = 200.0;
        maxP = 450.0;
        feats = ["solid band", "mirror polish"];
        purities = ["22K", "18K"];
      } else if (fnLower.includes("bangle") || fnLower.includes("bracelet") || fnLower.includes("8516") || fnLower.includes("8517") || fnLower.includes("wrist") || fnLower.includes("kada")) {
        cat = "bracelet";
        sty = "contemporary";
        minW = 8.0;
        maxW = 12.0;
        minP = 500.0;
        maxP = 800.0;
        feats = ["sleek circular gold contour", "high-polish finish"];
        purities = ["22K", "18K"];
      }

      return {
        data: {
          category: cat,
          style: sty,
          design_features: feats,
          colour: "yellow",
          recommended_purity_options: purities,
          estimated_weight_range_grams: { min: minW, max: maxW },
          estimated_price_range: { min: minP, max: maxP },
          confidence: "high",
          assumptions: ["Visual analysis indicates standard solid hollow structure."]
        },
        logs: [
          {
            agent: "JEWELLERY_INTELLIGENCE_AGENT",
            action: "analyze_jewellery_design",
            thought: `[OFFLINE RUN] Classifying jewelry design features from image. Structural features match ${cat} design specs.`
          }
        ]
      };
    }
  },

  async getCollectionRecommendations(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/advisor/recommend`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return {
        data: {
          portfolio_summary: {
            total_assets: 2,
            categories: { necklace: 2 },
            styles: { traditional: 1, contemporary: 1 },
            purities: { "22K": 2 }
          },
          gaps: [
            "No gold bracelets found. Your collection lacks flexible wrist ornaments.",
            "Collection has high concentration in necklaces. Lacks everyday lightweight bracelet."
          ],
          warnings: [
            "You own 2 necklaces. Adding another traditional necklace may create duplication."
          ],
          recommendations: [
            {
              category: "bracelet",
              style: "contemporary",
              recommendation_type: "diversify",
              reason: "You currently own two traditional style necklaces but zero bracelets. A lightweight contemporary chain bracelet adds a versatile daily-wear option to your collection.",
              collection_fit_score: 92.0,
              diversification_score: 95.0,
              estimated_weight_range: { min: 6.0, max: 9.0 },
              suggested_purity: ["18K", "22K"],
              estimated_price_range: { min: 500.0, max: 800.0 },
              confidence: "high",
              assumptions: ["Weight optimized for high durability during daily active wear"]
            },
            {
              category: "earrings",
              style: "traditional",
              recommendation_type: "match",
              reason: "Your collection contains multiple necklaces but no earrings. Adding traditional Jhumka earrings pairs beautifully with your existing necklaces for festive occasions.",
              collection_fit_score: 87.0,
              diversification_score: 50.0,
              estimated_weight_range: { min: 12.0, max: 18.0 },
              suggested_purity: ["22K"],
              estimated_price_range: { min: 900.0, max: 1400.0 },
              confidence: "high",
              assumptions: ["Assumes matching color tone to traditional yellow gold necklaces"]
            }
          ]
        },
        logs: [
          {
            agent: "COLLECTION_ADVISOR_AGENT",
            action: "audit_collection_gaps",
            thought: "[MOCK RUN] Compiling gaps. Heavy necklace concentration found; advising wrist-wear or pairing earrings."
          }
        ]
      };
    }
  },

  async compilePurchasePlan(payload: {
    user_id: string;
    target_purity: string;
    timeline_months: number;
    exchange_candidate_asset_ids: string[];
    target_design_image_filename?: string;
    home_currency: string;
    market?: string;
    target_category?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/purchase/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch {
      // High fidelity client-side calculations replicating backend orchestrator
      const rates: Record<string, number> = { USD: 1, SGD: 1.34, INR: 83.5, AED: 3.67, EUR: 0.9, GBP: 0.77 };
      const mult = rates[payload.home_currency] || 1.34;
      const spotRate = 141.72 * mult;
      
      const categoryLower = payload.target_category?.toLowerCase() || "bracelet";
      const isNecklace = categoryLower === "necklace" || payload.target_design_image_filename?.toLowerCase().includes("necklace");
      const isEarrings = categoryLower === "earrings" || payload.target_design_image_filename?.toLowerCase().includes("earring");
      const isRing = categoryLower === "ring" || payload.target_design_image_filename?.toLowerCase().includes("ring");
      const isPendant = categoryLower === "pendant" || payload.target_design_image_filename?.toLowerCase().includes("pendant");
      const isBangle = categoryLower === "bangle" || payload.target_design_image_filename?.toLowerCase().includes("bangle");

      let category = "bracelet";
      let weight = 10.0;
      let style = "contemporary";
      let color = "rose";

      if (isNecklace) {
        category = "necklace";
        weight = 42.0;
        style = "traditional";
        color = "yellow";
      } else if (isEarrings) {
        category = "earrings";
        weight = 10.0;
        style = "contemporary";
        color = "yellow";
      } else if (isRing) {
        category = "ring";
        weight = 6.0;
        style = "contemporary";
        color = "yellow";
      } else if (isPendant) {
        category = "pendant";
        weight = 7.0;
        style = "modern";
        color = "yellow";
      } else if (isBangle) {
        category = "bangle";
        weight = 30.0;
        style = "traditional";
        color = "yellow";
      }

      const purityRatio = payload.target_purity === "22K" ? 0.9167 : payload.target_purity === "18K" ? 0.75 : 0.999;
      
      const rawGoldValue = weight * spotRate * purityRatio;
      const makingCharges = rawGoldValue * 0.10;
      const subtotal = rawGoldValue + makingCharges;
      const tax = subtotal * 0.07;
      const totalCost = subtotal + tax;

      // Exchange Calculations
      let exchangeCredit = 0.0;
      const exchangeCandidates: any[] = [];
      
      if (payload.exchange_candidate_asset_ids.includes("ASSET_002")) {
        // Daily Gold Chain
        const chainCredit = 16.5 * spotRate * 0.98; // 2% melt charge
        exchangeCredit += chainCredit;
        exchangeCandidates.push({
          asset_id: "ASSET_002",
          name: "Daily Gold Chain",
          purity: "22K",
          net_weight: 16.5,
          estimated_value: chainCredit
        });
      }

      const fundingGap = Math.max(0, totalCost - exchangeCredit);
      const monthlySavings = fundingGap / payload.timeline_months;
      const weeklySavings = fundingGap / (payload.timeline_months * 4.33);

      // Simple scenarios modeling volatility (12%)
      const scenarios = ["lower", "current", "moderate_increase", "high_increase"];
      const scenData: Record<string, any> = {};
      
      const tYears = payload.timeline_months / 12.0;
      const stdDev = 0.12 * Math.sqrt(tYears);
      const multipliers: Record<string, number> = {
        lower: 1.0 - 1.5 * stdDev,
        current: 1.0,
        moderate_increase: 1.0 + 0.5 * stdDev,
        high_increase: 1.0 + 1.5 * stdDev
      };

      scenarios.forEach(scen => {
        const scenPrice = spotRate * multipliers[scen];
        const scenGoldVal = weight * scenPrice * purityRatio;
        const scenCost = (scenGoldVal + scenGoldVal * 0.10) * 1.07;
        const scenGap = Math.max(0, scenCost - (payload.exchange_candidate_asset_ids.includes("ASSET_002") ? 16.5 * scenPrice * 0.98 : 0));
        
        scenData[scen] = {
          gold_price_per_gram: round(scenPrice, 2),
          total_cost: round(scenCost, 2),
          funding_gap: round(scenGap, 2),
          monthly_savings: round(scenGap / payload.timeline_months, 2),
          weekly_savings: round(scenGap / (payload.timeline_months * 4.33), 2)
        };
      });

      return {
        target_jewellery: {
          category,
          style,
          colour: color,
          target_weight: weight,
          target_purity: payload.target_purity
        },
        price_summary: {
          gold_value: round(rawGoldValue, 2),
          making_charges: round(makingCharges, 2),
          wastage_charges: 0.0,
          taxes: round(tax, 2),
          total_cost: round(totalCost, 2),
          currency: payload.home_currency
        },
        exchange_summary: {
          total_credit: round(exchangeCredit, 2),
          currency: payload.home_currency,
          candidates: exchangeCandidates
        },
        savings_plan: {
          funding_gap: round(fundingGap, 2),
          monthly_savings: round(monthlySavings, 2),
          weekly_savings: round(weeklySavings, 2),
          timeline_months: payload.timeline_months
        },
        scenarios: scenData,
        similarity_insight: {
          similarity_score: isNecklace ? 78.0 : 12.0,
          classification: isNecklace ? "HIGHLY_SIMILAR" : "DIFFERENT",
          reasons: isNecklace 
            ? ["You already own a highly similar traditional gold necklace (Haram) weighing 48.5g."]
            : [`This ${category} style is highly distinct from your current collection layout.`],
          matches: isNecklace ? [{ asset_id: "ASSET_001", name: "Traditional Marriage Haram", similarity_score: 78.0, reason: "Same category, same style." }] : []
        },
        explainable_recommendation: {
          narrative: isNecklace
            ? "WARNING: You already own a similar traditional necklace. Adding this may lead to variety redundancy. Consider purchasing an underrepresented category instead."
            : `GoldGuard recommends this purchase. Adding this ${category} adds variety to your collection.`,
          data_used: "2 portfolio assets, 1 catalog database",
          assumptions: ["Spot price of gold assumed constant in scenarios, making charges at 10.0%, taxes at 7.0%"],
          uncertainty: "Weight and pricing are visual AI estimations based on typical catalog jewelry and should be verified at purchase."
        },
        agent_communication_logs: [
          { agent: "GOLDGUARD_ORCHESTRATOR", action: "orchestrate_purchase_plan", thought: "[MOCK RUN] Compiling details." }
        ]
      };
    }
  },

  async askGoldGuard(
    userId: string, 
    question: string, 
    homeCurrency: string,
    currentSummary?: PortfolioSummary | null,
    currentPortfolio?: Asset[]
  ): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, question, home_currency: homeCurrency })
      });
      return await res.json();
    } catch {
      // Mock answers matching agents.py conversational logic dynamically
      const q = question.toLowerCase();
      const summary = currentSummary;
      const portfolioList = currentPortfolio || [];
      
      const totalGross = portfolioList.reduce((acc, a) => acc + a.gross_weight_grams, 0) || 180.5;
      const totalNet = portfolioList.reduce((acc, a) => acc + a.net_gold_weight_grams, 0) || 165.46;
      const curVal = summary?.estimated_current_value || 32881.34;
      const histVal = summary?.total_historical_gold_value || 11195.04;
      const purchCost = summary?.total_purchase_cost || 12851;
      const growthPct = summary?.gain_loss_percent || 193.71;

      let answer = "";
      if (q.includes("why") && (q.includes("portfolio") || q.includes("value") || q.includes("down") || q.includes("different") || q.includes("loss"))) {
        answer = `Your current gold metal value is **${homeCurrency} ${curVal.toLocaleString(undefined, {maximumFractionDigits: 2})}**, representing a Gold Metal Value Growth of **+${growthPct.toFixed(2)}%** compared with your estimated historical gold value of **${homeCurrency} ${histVal.toLocaleString(undefined, {maximumFractionDigits: 2})}**. Your original purchase cost was **${homeCurrency} ${purchCost.toLocaleString(undefined, {maximumFractionDigits: 2})}** (which includes retail premiums and taxes that do not contribute to raw metal value).`;
      } else if (q.includes("which") && (q.includes("exchange") || q.includes("sell") || q.includes("contribute") || q.includes("trade"))) {
        const topItem = portfolioList.length > 0 ? [...portfolioList].sort((a, b) => b.net_gold_weight_grams - a.net_gold_weight_grams)[0] : null;
        if (topItem) {
          answer = `Your highest contributing asset is **${topItem.name}** (${topItem.purity}). With a fine gold weight of **${topItem.net_gold_weight_grams}g**, it contributes an estimated **${homeCurrency} ${(topItem.net_gold_weight_grams * (curVal / totalNet) * 0.98).toLocaleString(undefined, {maximumFractionDigits: 2})}** trade-in credit at a 98% scrap recovery assumption.`;
        } else {
          answer = `Exchanging underutilized jewelry helps fund new purchases. Traditional heavy ornaments are the highest contributors to trade-in credit.`;
        }
      } else if (q.includes("category") || q.includes("concentrated") || q.includes("over")) {
        answer = `Your gold weight is distributed across categories. GoldGuard suggests acquiring items in underrepresented categories to balance exposure and reduce concentration risk.`;
      } else {
        answer = `Your collection contains **${totalGross.toFixed(2)}g** of jewelry (${totalNet.toFixed(2)}g fine gold) with an estimated current gold metal value of **${homeCurrency} ${curVal.toLocaleString(undefined, {maximumFractionDigits: 2})}**. You can ask me why values differ, which items to exchange, or about category mix!`;
      }

      return {
        answer,
        logs: [{ agent: "GOLDGUARD_ORCHESTRATOR", action: "answer_user_query", thought: "[MOCK RUN] Compiling response." }]
      };
    }
  }
};

function round(num: number, decimalPlaces: number): number {
  const p = Math.pow(10, decimalPlaces);
  return Math.round((num + Number.EPSILON) * p) / p;
}
