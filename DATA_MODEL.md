# GoldGuard Data Model Reference

This file outlines the schemas and models for the portfolio assets, jewellery catalog, market price entries, and agent results.

## 1. Gold Portfolio Asset (`gold_assets` collection / synthetic)

Tracks owned physical gold items.

```typescript
interface GoldAsset {
  user_id: string;
  asset_id: string;
  name: string;
  category: "necklace" | "ring" | "bracelet" | "earrings" | "bangle" | "pendant" | "other";
  style: "traditional" | "contemporary" | "antique" | "modern" | "fusion" | "minimalist";
  purity: "24K" | "22K" | "18K" | "14K" | "10K";
  gross_weight_grams: number;
  net_gold_weight_grams: number;
  purchase_date: string; // ISO 8601 YYYY-MM-DD
  purchase_price: number; // in localized currency (default SGD)
  gold_rate: number; // rate per gram at purchase
  making_charges: number; // manufacturing cost
  wastage: number; // percentage or weight wastage
  taxes: number; // tax amount
  currency: string; // e.g. "SGD", "USD"
  invoice_reference: string | null; // Cloud Storage URI or base64 key
  image_reference: string | null; // Cloud Storage URI or base64 key
  documentation_status: "verified_invoice" | "self_reported" | "ai_estimated";
  data_sources: {
    [key: string]: "invoice" | "user_input" | "ai_estimate" | "market_derived";
  };
  estimated_current_value: number;
  last_updated: string; // ISO 8601 Timestamp
}
```

## 2. Jewellery Catalog (`data/jewellery_catalog.csv`)

Synthetic store catalog for similarity searches, gap analysis, and suggestions.

```typescript
interface JewelleryCatalogItem {
  item_id: string;
  category: string;
  style: string;
  sub_style: string;
  purity: string;
  weight_range: string; // e.g., "12g - 15g"
  min_weight: number;
  max_weight: number;
  occasion: "everyday" | "bridal" | "festive" | "workwear" | "party";
  design_features: string; // comma-separated keywords
  colour: "yellow" | "rose" | "white" | "two-tone";
  estimated_price_range: string; // e.g., "$1200 - $1500"
  min_price: number;
  max_price: number;
  image_reference: string; // path or URL
}
```

## 3. Gold Prices (`data/gold_prices.csv`)

Historical price analytical data.

```typescript
interface GoldPriceRecord {
  date: string; // YYYY-MM-DD
  gold_price: number; // price per gram
  currency: string; // SGD / USD
  market_region: string; // SG / Global
  source_type: "market_close" | "synthetic";
}
```

## 4. Collection Recommendation

Format returned by the `COLLECTION_ADVISOR_AGENT`.

```typescript
interface CollectionRecommendation {
  category: string;
  style?: string;
  recommendationType: "complement" | "diversify" | "fill_gap" | "match" | "avoid_duplication";
  reason: string;
  collectionFitScore: number; // 0 to 100
  diversificationScore: number; // 0 to 100
  estimatedWeightRange?: {
    min: number;
    max: number;
  };
  suggestedPurity?: string[];
  estimatedPriceRange?: {
    min: number;
    max: number;
  };
  confidence: "low" | "medium" | "high";
  assumptions: string[];
}
```
