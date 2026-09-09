import React, { useState, useEffect } from "react";
import { api, type Asset } from "../services/api";
import { 
  Upload, 
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw, 
  Layers,
  ScanSearch,
  ShoppingBag
} from "lucide-react";

interface SimilarityFinderProps {
  currency: string;
  onPlanPurchase?: (recommendation: any) => void;
}

export const SimilarityFinder: React.FC<SimilarityFinderProps> = ({
  currency,
  onPlanPurchase
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "same">("all");
  const [portfolio, setPortfolio] = useState<Asset[]>([]);

  // Load user collection
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.getPortfolio(currency);
        if (res && res.assets) {
          const seen = new Set<string>();
          const unique = res.assets.filter((a: any) => {
            if (!a.asset_id || seen.has(a.asset_id)) return false;
            seen.add(a.asset_id);
            return true;
          });
          setPortfolio(unique);
        }
      } catch (err) {
        console.error("Failed to load portfolio:", err);
      }
    };
    fetchPortfolio();
  }, [currency]);

  // Convert uploaded file to preview URL
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, [file]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  // Quick sample loaders for fast verification & user convenience
  const loadSample = async (sampleType: "choker" | "haram" | "ring" | "blurry") => {
    setResult(null);
    let filename = "sample_jewellery.jpg";
    let url = "/jewellery/user_necklace_traditional.jpg";

    if (sampleType === "choker") {
      filename = "modern_geometric_choker_necklace.jpg";
      url = "/jewellery/user_necklace_traditional.jpg";
    } else if (sampleType === "haram") {
      filename = "traditional_temple_marriage_haram.jpg";
      url = "/jewellery/user_antique_haram.jpg";
    } else if (sampleType === "ring") {
      filename = "solitaire_gold_ring.jpg";
      url = "/jewellery/user_geometric_ring.jpg";
    } else if (sampleType === "blurry") {
      filename = "blurry_unclear_photo.jpg";
      url = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%23222'/><text x='50%25' y='50%25' fill='%23666' text-anchor='middle'>Blurry/Corrupt</text></svg>";
    }

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const sampleFile = new File([blob], filename, { type: blob.type || "image/jpeg" });
      setFile(sampleFile);
    } catch {
      // Create minimal blob fallback
      const dummyBlob = new Blob([new Uint8Array(sampleType === "blurry" ? 100 : 5000)], { type: "image/jpeg" });
      const sampleFile = new File([dummyBlob], filename, { type: "image/jpeg" });
      setFile(sampleFile);
    }
  };

  const handleRunComparison = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await api.findSimilarity(file);
      if (res && res.data) {
        setResult(res.data);
      } else {
        setResult({
          status: "error",
          is_clear: false,
          error_message: "Unable to process image. Please provide a clear photo.",
          comparisons: []
        });
      }
    } catch (err) {
      console.error("Similarity finder failed:", err);
      setResult({
        status: "error",
        is_clear: false,
        error_message: "The image is not clear for comparison. Please provide a clear, well-lit image of the jewellery item to enable accurate design comparison.",
        comparisons: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview(null);
    setResult(null);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-gold/10 text-gold text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <ScanSearch className="h-3.5 w-3.5" /> Similarity Finder
            </span>
            <span className="bg-white/5 text-mutedText text-xs font-semibold px-2.5 py-1 rounded-full">
              Zero-Hallucination Visual AI
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            AI Jewellery Design Similarity Finder
          </h1>
          <p className="text-sm text-mutedText mt-0.5">
            Upload any jewellery photo. GoldGuard inspects visual craftsmanship, silhouette, and motifs to compare against your {portfolio.length > 0 ? `${portfolio.length} collection pieces` : "collection"} and check whether it's already in your collection or genuinely new.
          </p>
        </div>

        {file && (
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-mutedText hover:text-white hover:bg-cardHover transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New Search
          </button>
        )}
      </div>

      {/* Upload & Input Section */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-white">Select a Jewellery Photo to Compare</h2>
          <p className="text-xs text-mutedText">
            Supports showroom photos, catalog shots, or online items (JPG, PNG, WEBP).
          </p>
        </div>

        {/* Dropzone */}
        <div className="border-2 border-dashed border-border/80 hover:border-gold/60 rounded-2xl p-6 transition-all bg-background/50 relative text-center">
          {filePreview ? (
            <div className="space-y-4">
              <div className="relative inline-block mx-auto rounded-xl overflow-hidden border border-border shadow-md max-h-60">
                <img 
                  src={filePreview} 
                  alt="Uploaded jewellery" 
                  className="max-h-60 object-contain rounded-xl"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs text-mutedText">{file?.name}</span>
                <span className="text-mutedText">•</span>
                <label className="cursor-pointer text-xs font-semibold text-gold hover:underline">
                  Change photo
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
              <div className="w-12 h-12 mx-auto rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white">Click to upload photo or drag & drop</span>
                <p className="text-xs text-mutedText mt-1">Clear, well-lit photos give the most accurate design comparison</p>
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

        {/* Quick Sample Pickers for Testing */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <span className="text-[10px] uppercase font-bold text-mutedText tracking-wider block text-center">
            Or test with sample scenarios:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => loadSample("choker")}
              className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-gold/50 text-xs text-mutedText hover:text-white transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-emerald-400" />
              <span>Modern Choker (New Design Test)</span>
            </button>
            <button
              onClick={() => loadSample("haram")}
              className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-gold/50 text-xs text-mutedText hover:text-white transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Temple Haram (Redundant Overlap Test)</span>
            </button>
            <button
              onClick={() => loadSample("ring")}
              className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-gold/50 text-xs text-mutedText hover:text-white transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-blue-400" />
              <span>Gold Ring (Different Type Test)</span>
            </button>
            <button
              onClick={() => loadSample("blurry")}
              className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-gold/50 text-xs text-mutedText hover:text-white transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span>Blurry Photo (Clarity Check Test)</span>
            </button>
          </div>
        </div>

        {/* Action Button */}
        {file && !result && (
          <button
            onClick={handleRunComparison}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-sm hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
          >
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Inspecting Craftsmanship, Motifs & Comparing Collection...</span>
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" />
                <span>Run Visual Design Comparison →</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* UNCLEAR IMAGE STATE (CRITICAL NO-HALLUCINATION REQUIREMENT)                */}
      {/* ========================================================================= */}
      {result && !result.is_clear && (
        <div className="bg-amber-950/20 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
              Image Clarity Validation
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Image Not Clear for Comparison</h3>
            <p className="text-sm font-semibold text-amber-200/90 leading-relaxed">
              {result.error_message || "The image is not clear for comparison. Please provide a clear, well-lit image of the jewellery item to enable accurate design comparison."}
            </p>
            {result.clarity_issue && (
              <p className="text-xs text-mutedText mt-1">
                <span className="font-semibold text-white/80">Issue detected:</span> {result.clarity_issue}
              </p>
            )}
          </div>
          <div className="pt-2 flex justify-center">
            <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-gold text-black font-extrabold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow">
              <Upload className="h-4 w-4" /> Upload Clearer Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload} 
              />
            </label>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESULTS VIEW                                                              */}
      {/* ========================================================================= */}
      {result && result.is_clear && result.detected_item && (
        <div className="space-y-6">
          {/* Target Piece Detected Attributes Card */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {filePreview && (
                <img 
                  src={filePreview} 
                  alt="Target piece" 
                  className="w-20 h-20 rounded-xl object-cover border border-gold/40 shrink-0 shadow-md"
                />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gold/10 text-gold tracking-wider">
                    Analyzed Target
                  </span>
                  <span className="text-xs capitalize font-bold text-white">
                    {result.detected_item.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white capitalize">
                  {result.detected_item.style} {result.detected_item.category}
                </h3>
                <p className="text-xs text-mutedText">
                  Silhouette: <span className="text-white capitalize">{result.detected_item.silhouette}</span> • Tone: <span className="text-white capitalize">{result.detected_item.colour} Gold</span> • ~{result.detected_item.estimated_weight_grams}g
                </p>
                {result.detected_item.craftsmanship && (
                  <p className="text-[11px] text-gold/90 font-medium">
                    Craft: {result.detected_item.craftsmanship}
                  </p>
                )}
              </div>
            </div>

            {onPlanPurchase && (
              <button
                onClick={() => onPlanPurchase({
                  category: result.detected_item.category,
                  style: result.detected_item.style,
                  target_weight: result.detected_item.estimated_weight_grams,
                  colour: result.detected_item.colour,
                  reason: result.overall_verdict?.description
                })}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
              >
                <ShoppingBag className="h-4 w-4" /> Plan This Purchase →
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* OVERALL VERDICT BANNER                                                    */}
          {/* ========================================================================= */}
          {result.overall_verdict && (
            <div className={`rounded-2xl p-6 border-2 shadow-xl ${
              result.overall_verdict.verdict_type === "HIGH_REDUNDANCY"
                ? "bg-amber-950/25 border-amber-500/50"
                : result.overall_verdict.verdict_type === "NEW_DESIGN" || result.overall_verdict.verdict_type === "NEW_CATEGORY"
                ? "bg-emerald-950/25 border-emerald-500/50"
                : "bg-card border-gold/40"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    result.overall_verdict.verdict_type === "HIGH_REDUNDANCY"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  }`}>
                    {result.overall_verdict.verdict_type === "HIGH_REDUNDANCY" ? (
                      <AlertTriangle className="h-6 w-6" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded inline-block ${
                      result.overall_verdict.verdict_type === "HIGH_REDUNDANCY"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {result.overall_verdict.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {result.overall_verdict.headline}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-mutedText block">Max Overlap Score</span>
                  <span className={`text-2xl font-black ${
                    result.overall_verdict.score >= 65
                      ? "text-amber-400"
                      : result.overall_verdict.score < 45
                      ? "text-emerald-400"
                      : "text-gold"
                  }`}>
                    {Math.round(result.overall_verdict.score)}%
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-white/90 mt-4 leading-relaxed">
                {result.overall_verdict.description}
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* COLLECTION COMPARISON BREAKDOWN                                           */}
          {/* ========================================================================= */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-gold" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Collection Comparison Breakdown
                  </h3>
                </div>
                <p className="text-xs text-mutedText mt-0.5">
                  Detailed comparison against each jewellery asset in your collection.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border self-start sm:self-auto text-xs">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded font-semibold transition-all ${
                    categoryFilter === "all" ? "bg-gold text-black font-bold shadow" : "text-mutedText hover:text-white"
                  }`}
                >
                  All Items ({result.comparisons.length})
                </button>
                <button
                  onClick={() => setCategoryFilter("same")}
                  className={`px-3 py-1.5 rounded font-semibold transition-all ${
                    categoryFilter === "same" ? "bg-gold text-black font-bold shadow" : "text-mutedText hover:text-white"
                  }`}
                >
                  Matching Category ({result.matching_category_count || 0})
                </button>
              </div>
            </div>

            {/* Comparison Entries List */}
            <div className="space-y-3">
              {result.comparisons
                .filter((comp: any) => categoryFilter === "all" || comp.is_same_category)
                .map((comp: any, idx: number) => {
                  const isZero = comp.similarity_score === 0;
                  const isHigh = comp.similarity_score >= 65;
                  const isDistinct = comp.similarity_score > 0 && comp.similarity_score < 35;

                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        isZero
                          ? "bg-background/60 border-border/60 text-mutedText"
                          : isHigh
                          ? "bg-amber-950/20 border-amber-500/40"
                          : isDistinct
                          ? "bg-emerald-950/20 border-emerald-500/40"
                          : "bg-gold/5 border-gold/30"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Collection Asset Info */}
                        <div className="flex items-center gap-3">
                          {comp.image_reference ? (
                            <img 
                              src={comp.image_reference} 
                              alt={comp.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gold font-bold text-xs shrink-0">
                              {comp.purity}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{comp.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-mutedText uppercase font-semibold">
                                {comp.category}
                              </span>
                            </div>
                            <p className="text-xs text-mutedText mt-0.5">
                              {comp.gross_weight_grams}g • {comp.purity} • {comp.style}
                            </p>
                          </div>
                        </div>

                        {/* Similarity Score Badge */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${
                            isZero
                              ? "bg-white/5 border-border text-mutedText"
                              : isHigh
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : isDistinct
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-gold/10 border-gold/30 text-gold"
                          }`}>
                            <span>{Math.round(comp.similarity_score)}% Similarity</span>
                            {isHigh && <AlertTriangle className="h-3.5 w-3.5" />}
                            {isDistinct && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>

                      {/* Explanation note */}
                      <div className="mt-3 pt-2.5 border-t border-border/40 text-xs flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 mt-1.5"></span>
                        <span className="text-mutedText leading-relaxed">
                          {comp.reason}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {result.comparisons.filter((comp: any) => categoryFilter === "all" || comp.is_same_category).length === 0 && (
                <div className="text-center py-8 text-xs text-mutedText">
                  No existing items match this filter.
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-mutedText hover:text-white hover:bg-cardHover transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> Compare Another Photo
            </button>

            {onPlanPurchase && (
              <button
                onClick={() => onPlanPurchase({
                  category: result.detected_item.category,
                  style: result.detected_item.style,
                  target_weight: result.detected_item.estimated_weight_grams,
                  colour: result.detected_item.colour,
                  reason: result.overall_verdict?.description
                })}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-black font-extrabold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-md"
              >
                <span>Plan This Purchase</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
