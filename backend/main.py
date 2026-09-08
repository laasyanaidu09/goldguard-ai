import os
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import database
import calculations
import agents

app = FastAPI(title="GoldGuard API", version="2.0")

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Endpoints
# ==========================================

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "demo_mode": database.DEMO_MODE}

@app.post("/api/prices")
@app.get("/api/prices")
def get_gold_prices(currency: str = "USD"):
    """
    Returns historical gold prices, converted to the user's preferred currency,
    with strict chronological deduplication, 50-day SMA, 200-day SMA, percentile, and volatility calculations.
    """
    from datetime import datetime, timedelta

    raw_prices = database.load_gold_prices()
    raw_count = len(raw_prices)

    # 1. Sanity filter: keep realistic historical prices between 30.0 and 120.0 USD/gram
    clean_history = [p for p in raw_prices if 30.0 <= float(p.get("gold_price", 0)) <= 120.0]
    if not clean_history:
        clean_history = raw_prices

    unique_prices_dict = {}
    for p in clean_history:
        date_str = p["date"]
        unique_prices_dict[date_str] = {
            "date": p["date"],
            "gold_price": float(p["gold_price"]),
            "currency": p.get("currency", "USD"),
            "market_region": p.get("market_region", "Global"),
            "source_type": p.get("source_type", "market_close")
        }

    sorted_dates = sorted(unique_prices_dict.keys())
    deduped_prices = [unique_prices_dict[d] for d in sorted_dates]
    unique_count = len(deduped_prices)
    dup_removed = raw_count - unique_count

    # Append or update today's live verified gold spot price
    live_price_usd = database.get_current_gold_price_usd()
    today_str = datetime.now().strftime("%Y-%m-%d")
    if deduped_prices and deduped_prices[-1]["date"] == today_str:
        deduped_prices[-1]["gold_price"] = live_price_usd
    elif deduped_prices:
        deduped_prices.append({
            "date": today_str,
            "gold_price": live_price_usd,
            "currency": "USD",
            "market_region": "Global",
            "source_type": "market_close"
        })

    # 2. Calculate 50-day and 200-day SMAs on the entire chronological series
    for i in range(len(deduped_prices)):
        if i >= 49:
            subset_50 = [float(x["gold_price"]) for x in deduped_prices[i-49:i+1]]
            deduped_prices[i]["sma_50"] = sum(subset_50) / 50.0
        else:
            subset_50 = [float(x["gold_price"]) for x in deduped_prices[:i+1]]
            deduped_prices[i]["sma_50"] = sum(subset_50) / len(subset_50)

        if i >= 199:
            subset_200 = [float(x["gold_price"]) for x in deduped_prices[i-199:i+1]]
            deduped_prices[i]["sma_200"] = sum(subset_200) / 200.0
        else:
            subset_200 = [float(x["gold_price"]) for x in deduped_prices[:i+1]]
            deduped_prices[i]["sma_200"] = sum(subset_200) / len(subset_200)

    # 3. Convert all prices consistently to the selected currency
    converted_prices = []
    for p in deduped_prices:
        usd_price = float(p["gold_price"])
        usd_sma_50 = float(p.get("sma_50", usd_price))
        usd_sma_200 = float(p.get("sma_200", usd_price))
        
        converted_price = calculations.convert_currency(usd_price, currency)
        converted_sma_50 = calculations.convert_currency(usd_sma_50, currency)
        converted_sma_200 = calculations.convert_currency(usd_sma_200, currency)
        
        converted_prices.append({
            "date": p["date"],
            "gold_price": round(converted_price, 2),
            "sma_50": round(converted_sma_50, 2),
            "sma_200": round(converted_sma_200, 2),
            "currency": currency,
            "market_region": p["market_region"],
            "source_type": p["source_type"]
        })

    if not converted_prices:
        raise HTTPException(status_code=500, detail="Insufficient data: Historical series is empty.")

    # 4. Extract latest spot price and latest daily close
    live_price_usd = database.get_current_gold_price_usd()
    latest_spot = round(calculations.convert_currency(live_price_usd, currency), 2)
    latest_close = converted_prices[-1]["gold_price"]
    prev_close = converted_prices[-2]["gold_price"] if len(converted_prices) >= 2 else latest_close

    # 5. Calculate 5-year historical percentile based on exact daily closes within [latest_date - 5 years, latest_date]
    latest_date_str = converted_prices[-1]["date"]
    try:
        latest_dt = datetime.strptime(latest_date_str, "%Y-%m-%d")
        five_years_ago_dt = latest_dt - timedelta(days=5 * 365)
        five_years_ago_str = five_years_ago_dt.strftime("%Y-%m-%d")
    except Exception:
        five_years_ago_str = "1970-01-01"

    five_year_prices = [x["gold_price"] for x in converted_prices if x["date"] >= five_years_ago_str]
    less_count = sum(1 for x in five_year_prices if x < latest_close)
    percentile = (less_count / len(five_year_prices)) * 100 if five_year_prices else 83.6
    percentile = round(percentile, 1)

    # 6. Calculate 90-day Annualised Volatility using daily gold returns
    volatility = 12.4
    if len(converted_prices) >= 91:
        subset = converted_prices[-91:]
        returns = []
        for j in range(1, len(subset)):
            p_prev = subset[j-1]["gold_price"]
            p_curr = subset[j]["gold_price"]
            if p_prev > 0:
                returns.append((p_curr - p_prev) / p_prev)
        if returns:
            mean_r = sum(returns) / len(returns)
            variance = sum((r - mean_r) ** 2 for r in returns) / (len(returns) - 1)
            std_r = variance ** 0.5
            volatility = std_r * (252 ** 0.5) * 100
            volatility = round(volatility, 1)

    # 7. Trend classification based on 50-day & 200-day SMAs
    latest_sma_50 = converted_prices[-1]["sma_50"]
    latest_sma_200 = converted_prices[-1]["sma_200"]

    if latest_close > latest_sma_50:
        if latest_sma_50 > latest_sma_200:
            trend = "Positive Momentum"
            trend_desc = "Current price is above 50D SMA, and the 50D SMA is above the 200D SMA, confirming robust upward momentum."
        else:
            trend = "Positive Short-Term Momentum"
            trend_desc = "Current price is above 50D SMA, but 50D SMA remains below 200D SMA, indicating early positive momentum."
    else:
        if latest_sma_50 > latest_sma_200:
            trend = "Weakening / Pullback"
            trend_desc = "Current price is below 50D SMA, but 50D SMA remains above 200D SMA, suggesting a short-term pullback."
        else:
            trend = "Bearish Momentum"
            trend_desc = "Current price is below 50D SMA, and 50D SMA is below 200D SMA, indicating weaker recent price momentum."

    # Distance from 50-day SMA
    distance_50 = ((latest_close - latest_sma_50) / latest_sma_50) * 100 if latest_sma_50 > 0 else 0.0
    distance_50 = round(distance_50, 2)

    # 8. Outlier Detection and diagnostics
    largest_move = {"date": None, "previous": 0.0, "current": 0.0, "return_pct": 0.0}
    extreme_moves = []
    for i in range(1, len(converted_prices)):
        p_prev = converted_prices[i-1]["gold_price"]
        p_curr = converted_prices[i]["gold_price"]
        if p_prev > 0:
            ret = ((p_curr - p_prev) / p_prev) * 100
            abs_ret = abs(ret)
            if abs_ret > 10.0:
                extreme_moves.append({
                    "date": converted_prices[i]["date"],
                    "previous": p_prev,
                    "current": p_curr,
                    "return_pct": round(ret, 2)
                })
            if abs_ret > abs(largest_move["return_pct"]):
                largest_move = {
                    "date": converted_prices[i]["date"],
                    "previous": p_prev,
                    "current": p_curr,
                    "return_pct": round(ret, 2)
                }

    # Print debugging metrics block to terminal
    print("\n================ MARKET INTELLIGENCE VALIDATION ================")
    print(f"Raw records: {raw_count}")
    print(f"Duplicates removed: {dup_removed}")
    print(f"Unique dates: {unique_count}")
    print(f"Date range: {converted_prices[0]['date']} -> {converted_prices[-1]['date']}")
    print(f"Normalized unit: {currency}/g")
    print(f"Purity: 24K")
    print(f"Latest close: {currency} {latest_close}")
    print(f"Previous close: {currency} {prev_close}")
    print(f"30-day reference close: {currency} {converted_prices[-22]['gold_price'] if len(converted_prices) >= 22 else latest_close}")
    print(f"50D SMA: {currency} {latest_sma_50}")
    print(f"200D SMA: {currency} {latest_sma_200}")
    print(f"Distance from 50D SMA: {distance_50}%")
    print(f"90D annualised volatility: {volatility}%")
    print(f"5Y percentile: {percentile}%")
    print(f"Largest daily return: {largest_move['return_pct']}% on {largest_move['date']}")
    if extreme_moves:
        print("Flagged extreme daily moves (>10%):")
        for m in extreme_moves:
            print(f"  * {m['date']}: {currency} {m['previous']} -> {currency} {m['current']} ({m['return_pct']}%)")
    print("================================================================\n")

    # Validate data consistency
    is_chronological = all(sorted_dates[i] <= sorted_dates[i+1] for i in range(len(sorted_dates)-1))
    validation_status = "Success" if (is_chronological and len(converted_prices) >= 200) else "Insufficient data"

    return {
        "prices": converted_prices[-365:],  # 1-year historical window
        "latest_price": latest_spot,
        "latest_daily_close": latest_close,
        "daily_change_percent": round(((latest_close - prev_close) / prev_close) * 100, 2) if prev_close > 0 else 0.0,
        "monthly_change_percent": round(((latest_close - converted_prices[-22]["gold_price"]) / converted_prices[-22]["gold_price"]) * 100, 2) if len(converted_prices) >= 22 else 0.0,
        "currency": currency,
        "percentile": percentile,
        "volatility": volatility,
        "trend": trend,
        "trend_desc": trend_desc,
        "sma_50": latest_sma_50,
        "sma_200": latest_sma_200,
        "distance_50": distance_50,
        "validation": {
            "status": validation_status,
            "raw_records": raw_count,
            "unique_records": unique_count,
            "duplicates_removed": dup_removed,
            "is_chronological": is_chronological
        }
    }

@app.get("/api/catalog")
def get_catalog():
    """
    Returns the store designs catalog.
    """
    return database.load_catalog()

@app.get("/api/portfolio")
def get_portfolio(user_id: str = "user_bride", currency: str = "USD"):
    """
    Returns the user's gold assets with real-time valuations.
    """
    assets = database.load_user_portfolio(user_id)
    latest_gold_price_usd = database.get_current_gold_price_usd()
    
    total_gross_weight = 0.0
    total_net_weight = 0.0
    total_estimated_value = 0.0
    total_historical_gold_value = 0.0
    total_purchase_cost = 0.0
    total_estimated_purchase_price = 0.0
    
    evaluated_assets = []
    
    for asset in assets:
        # Recalculate weights dynamically if they were modified
        net_weight = calculations.calculate_net_gold_weight(
            asset["gross_weight_grams"], asset["purity"]
        )
        asset["net_gold_weight_grams"] = net_weight
        
        # Calculate current valuation in home currency (Current Gold Value)
        current_value_converted = calculations.calculate_gold_value(
            net_weight, latest_gold_price_usd, currency
        )
        asset["estimated_current_value"] = current_value_converted
        asset["current_gold_metal_value"] = current_value_converted
        
        # 1. Historical Estimation mapping (Section 8 & 17)
        purchase_date = asset.get("purchase_date", "2020-01-01")
        price_info = calculations.get_historical_gold_price(purchase_date)
        hist_gold_price_usd = price_info["gold_price"]
        
        asset["historical_gold_price_24k"] = hist_gold_price_usd
        asset["historical_gold_price_currency"] = "USD"
        asset["historical_gold_price_date"] = price_info["date_used"]
        asset["historical_gold_price"] = round(calculations.convert_between_currencies(
            hist_gold_price_usd, "USD", asset.get("currency", "USD")
        ), 2)
        
        # Calculate Historical Gold Value in user-selected currency
        hist_val_usd = net_weight * hist_gold_price_usd
        hist_val_converted = calculations.convert_currency(hist_val_usd, currency)
        asset["historical_gold_value"] = round(hist_val_converted, 2)
        
        # 2. Jewellery Value & Liquidation range estimations
        asset["estimated_jewellery_value_min"] = round(current_value_converted * 1.10, 2)
        asset["estimated_jewellery_value_max"] = round(current_value_converted * 1.30, 2)
        asset["estimated_liquidation_value_min"] = round(current_value_converted * 0.98, 2)
        asset["estimated_liquidation_value_max"] = round(current_value_converted * 1.00, 2)
        
        # 3. Handle accuracy status for purchase price
        status = asset.get("purchase_price_status", "EXACT")
        if status == "UNKNOWN":
            asset["purchase_price_converted"] = None
            total_estimated_purchase_price += hist_val_converted * 1.20 # raw + workmanship
        else:
            purchase_price = asset.get("purchase_price") or 0.0
            purchase_price_converted = calculations.convert_between_currencies(
                purchase_price, asset.get("currency", "USD"), currency
            )
            asset["purchase_price_converted"] = round(purchase_price_converted, 2)
            total_purchase_cost += purchase_price_converted
            total_estimated_purchase_price += purchase_price_converted
            
        # 4. Price consistency verification
        is_suspicious = False
        if status == "EXACT":
            gold_price_usd_for_check = hist_gold_price_usd
            if asset.get("gold_rate") and asset.get("currency", "USD") != "USD":
                gold_price_usd_for_check = asset["gold_rate"] / calculations.EXCHANGE_RATES.get(asset["currency"], 1.0)
            
            is_suspicious = calculations.is_purchase_price_suspicious(
                asset["gross_weight_grams"], asset["purity"], gold_price_usd_for_check, asset.get("purchase_price", 0.0), asset.get("currency", "USD")
            )
            
        asset["is_suspicious"] = is_suspicious
        if is_suspicious:
            asset["suspicious_reason"] = "Purchase price appears inconsistent with its jewellery weight and purity context."
            
        total_gross_weight += asset["gross_weight_grams"]
        total_net_weight += net_weight
        total_estimated_value += current_value_converted
        total_historical_gold_value += hist_val_converted
        
        evaluated_assets.append(asset)
        
    gain_loss = total_estimated_value - total_historical_gold_value
    gain_loss_percent = ((gain_loss / total_historical_gold_value) * 100) if total_historical_gold_value > 0 else 0.0
    
    recs = calculations.generate_category_recommendations(evaluated_assets)
    
    health_score = calculations.calculate_portfolio_health_score(evaluated_assets, currency)
    
    return {
        "assets": evaluated_assets,
        "summary": {
            "total_assets": len(evaluated_assets),
            "total_gross_weight_grams": round(total_gross_weight, 2),
            "total_net_gold_weight_grams": round(total_net_weight, 2),
            "estimated_current_value": round(total_estimated_value, 2),
            "total_historical_gold_value": round(total_historical_gold_value, 2),
            "total_purchase_cost": round(total_purchase_cost, 2),
            "total_estimated_purchase_price": round(total_estimated_purchase_price, 2),
            "gain_loss": round(gain_loss, 2),
            "gain_loss_percent": round(gain_loss_percent, 2),
            "category_recommendations": recs,
            "health_score": health_score,
            "currency": currency
        }
    }

class EstimateHistoricalPayload(BaseModel):
    gross_weight: float
    purity: str
    date_or_year: str
    currency: str

@app.post("/api/portfolio/estimate-historical")
def estimate_historical(payload: EstimateHistoricalPayload):
    """
    Deterministically calculates historical price, finished range, and confidence.
    """
    try:
        result = calculations.estimate_historical_valuation(
            payload.gross_weight, payload.purity, payload.date_or_year, payload.currency
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ManualAssetPayload(BaseModel):
    user_id: str
    name: str
    category: str
    purity: str
    gross_weight_grams: float
    purchase_date: str
    style: Optional[str] = "traditional"
    purchase_price_usd: Optional[float] = None
    currency: Optional[str] = "USD"
    purchase_price_status: Optional[str] = "EXACT"
    purchase_price_source: Optional[str] = "USER_EXACT"
    provenance_status: Optional[str] = "SELF_REPORTED"
    historical_gold_value: Optional[float] = None
    estimated_jewellery_value_min: Optional[float] = None
    estimated_jewellery_value_max: Optional[float] = None
    estimated_liquidation_value_min: Optional[float] = None
    estimated_liquidation_value_max: Optional[float] = None
    historical_gold_price: Optional[float] = None
    historical_gold_price_currency: Optional[str] = "USD"
    historical_gold_price_date: Optional[str] = None
    estimation_confidence: Optional[str] = None
    estimation_method: Optional[str] = None
    notes: Optional[str] = ""
    colour: Optional[str] = "yellow"
    image_reference: Optional[str] = None

@app.post("/api/portfolio")
def add_manual_asset(payload: ManualAssetPayload):
    # Purchase Date Future Validation Check
    if payload.purchase_date:
        today_str = datetime.now().strftime("%Y-%m-%d")
        if str(payload.purchase_date).strip() > today_str:
            raise HTTPException(
                status_code=400, 
                detail="Invalid purchase date: Purchase date cannot be in the future."
            )

    # Backend Duplicate Prevention Check
    user_portfolio = database.load_user_portfolio(payload.user_id)
    for existing_asset in user_portfolio:
        if (existing_asset.get("name", "").strip().lower() == payload.name.strip().lower() and
            abs(existing_asset.get("gross_weight_grams", 0.0) - payload.gross_weight_grams) < 0.01 and
            existing_asset.get("purity") == payload.purity and
            existing_asset.get("category") == payload.category and
            existing_asset.get("purchase_date") == payload.purchase_date):
            raise HTTPException(status_code=400, detail="This exact jewelry item already exists in your portfolio.")

    net_weight = calculations.calculate_net_gold_weight(
        payload.gross_weight_grams, payload.purity
    )
    current_gold_price_usd = database.get_current_gold_price_usd()
    
    purchase_price = payload.purchase_price_usd
    historical_gold_value = payload.historical_gold_value
    historical_gold_price = payload.historical_gold_price
    historical_gold_price_date = payload.historical_gold_price_date
    estimation_confidence = payload.estimation_confidence
    estimation_method = payload.estimation_method
    purchase_price_status = payload.purchase_price_status or "EXACT"
    purchase_price_source = payload.purchase_price_source or "USER_EXACT"
    provenance_status = payload.provenance_status or "SELF_REPORTED"

    # If purchase price is omitted, empty, or set to UNKNOWN, auto-estimate based on purchase date gold rate!
    if purchase_price is None or purchase_price_status == "UNKNOWN":
        if payload.purchase_date:
            try:
                hist_est = calculations.estimate_historical_valuation(
                    gross_weight=payload.gross_weight_grams,
                    purity=payload.purity,
                    date_or_year=payload.purchase_date,
                    currency=payload.currency or "USD"
                )
                if hist_est:
                    purchase_price = hist_est.get("historical_gold_value")
                    historical_gold_value = hist_est.get("historical_gold_value")
                    historical_gold_price = hist_est.get("historical_gold_price_per_gram")
                    historical_gold_price_date = hist_est.get("date_used")
                    estimation_confidence = hist_est.get("confidence", "Medium")
                    estimation_method = "Historical Gold Price (Date Rate)"
                    purchase_price_status = "AI_ESTIMATED"
                    purchase_price_source = "HISTORICAL_GOLD_RATE"
                    if provenance_status == "SELF_REPORTED":
                        provenance_status = "AI_ESTIMATED"
            except Exception as e:
                print(f"Historical valuation estimation failed: {e}")

    asset = {
        "name": payload.name,
        "category": payload.category,
        "style": payload.style if payload.style else "traditional",
        "purity": payload.purity,
        "gross_weight_grams": payload.gross_weight_grams,
        "net_gold_weight_grams": net_weight,
        "purchase_date": payload.purchase_date,
        "purchase_price": purchase_price,
        "gold_rate": current_gold_price_usd,
        "making_charges": 0.0,
        "wastage": 0.0,
        "taxes": 0.0,
        "currency": payload.currency if payload.currency else "USD",
        "invoice_reference": None,
        "image_reference": payload.image_reference,
        "colour": payload.colour,
        "documentation_status": (
            "verified_invoice" if provenance_status == "INVOICE_VERIFIED"
            else ("ai_estimated" if provenance_status == "AI_ESTIMATED" else "self_reported")
        ),
        "data_sources": {
            "name": "user_input",
            "purity": "user_input",
            "weight": "user_input",
            "purchase_price": "historical_rate" if purchase_price_source == "HISTORICAL_GOLD_RATE" else "user_input"
        },
        "purchase_price_status": purchase_price_status,
        "purchase_price_source": purchase_price_source,
        "provenance_status": provenance_status,
        "historical_gold_value": historical_gold_value,
        "estimated_jewellery_value_min": payload.estimated_jewellery_value_min,
        "estimated_jewellery_value_max": payload.estimated_jewellery_value_max,
        "estimated_liquidation_value_min": payload.estimated_liquidation_value_min,
        "estimated_liquidation_value_max": payload.estimated_liquidation_value_max,
        "historical_gold_price": historical_gold_price,
        "historical_gold_price_currency": payload.historical_gold_price_currency or "USD",
        "historical_gold_price_date": historical_gold_price_date or payload.purchase_date,
        "estimation_confidence": estimation_confidence,
        "estimation_method": estimation_method,
        "notes": payload.notes
    }
    
    added_asset = database.add_user_asset(payload.user_id, asset)
    return added_asset

class EditAssetPayload(BaseModel):
    user_id: str
    asset_id: str
    name: str
    category: str
    style: Optional[str] = "traditional"
    purity: str
    gross_weight_grams: float
    purchase_price: Optional[float] = None
    purchase_date: str
    currency: str
    documentation_status: str
    notes: Optional[str] = None
    purchase_price_status: Optional[str] = "EXACT"
    purchase_price_source: Optional[str] = "USER_EXACT"
    provenance_status: Optional[str] = "SELF_REPORTED"
    historical_gold_value: Optional[float] = None
    estimated_jewellery_value_min: Optional[float] = None
    estimated_jewellery_value_max: Optional[float] = None
    estimated_liquidation_value_min: Optional[float] = None
    estimated_liquidation_value_max: Optional[float] = None
    historical_gold_price: Optional[float] = None
    historical_gold_price_currency: Optional[str] = "USD"
    historical_gold_price_date: Optional[str] = None
    estimation_confidence: Optional[str] = None
    estimation_method: Optional[str] = None
    image_reference: Optional[str] = None

@app.post("/api/portfolio/edit")
def edit_user_asset(payload: EditAssetPayload):
    """
    Endpoint to edit an existing asset details.
    """
    if payload.purchase_date:
        today_str = datetime.now().strftime("%Y-%m-%d")
        if str(payload.purchase_date).strip() > today_str:
            raise HTTPException(
                status_code=400, 
                detail="Invalid purchase date: Purchase date cannot be in the future."
            )

    net_weight = calculations.calculate_net_gold_weight(
        payload.gross_weight_grams, payload.purity
    )

    purchase_price = payload.purchase_price
    historical_gold_value = payload.historical_gold_value
    historical_gold_price = payload.historical_gold_price
    historical_gold_price_date = payload.historical_gold_price_date
    estimation_confidence = payload.estimation_confidence
    estimation_method = payload.estimation_method
    purchase_price_status = payload.purchase_price_status or "EXACT"
    purchase_price_source = payload.purchase_price_source or "USER_EXACT"
    provenance_status = payload.provenance_status or "SELF_REPORTED"

    # If purchase price is omitted or unknown, estimate based on purchase date gold rate!
    if purchase_price is None or purchase_price_status == "UNKNOWN":
        if payload.purchase_date:
            try:
                hist_est = calculations.estimate_historical_valuation(
                    gross_weight=payload.gross_weight_grams,
                    purity=payload.purity,
                    date_or_year=payload.purchase_date,
                    currency=payload.currency or "USD"
                )
                if hist_est:
                    purchase_price = hist_est.get("historical_gold_value")
                    historical_gold_value = hist_est.get("historical_gold_value")
                    historical_gold_price = hist_est.get("historical_gold_price_per_gram")
                    historical_gold_price_date = hist_est.get("date_used")
                    estimation_confidence = hist_est.get("confidence", "Medium")
                    estimation_method = "Historical Gold Price (Date Rate)"
                    purchase_price_status = "AI_ESTIMATED"
                    purchase_price_source = "HISTORICAL_GOLD_RATE"
            except Exception as e:
                print(f"Historical valuation estimation failed on edit: {e}")
    
    updated_fields = {
        "name": payload.name,
        "category": payload.category,
        "style": payload.style if payload.style else "traditional",
        "purity": payload.purity,
        "gross_weight_grams": payload.gross_weight_grams,
        "net_gold_weight_grams": net_weight,
        "purchase_price": purchase_price,
        "purchase_date": payload.purchase_date,
        "currency": payload.currency,
        "documentation_status": payload.documentation_status,
        "notes": payload.notes,
        "purchase_price_status": purchase_price_status,
        "purchase_price_source": purchase_price_source,
        "provenance_status": provenance_status,
        "historical_gold_value": historical_gold_value,
        "estimated_jewellery_value_min": payload.estimated_jewellery_value_min,
        "estimated_jewellery_value_max": payload.estimated_jewellery_value_max,
        "estimated_liquidation_value_min": payload.estimated_liquidation_value_min,
        "estimated_liquidation_value_max": payload.estimated_liquidation_value_max,
        "historical_gold_price": historical_gold_price,
        "historical_gold_price_currency": payload.historical_gold_price_currency,
        "historical_gold_price_date": historical_gold_price_date or payload.purchase_date,
        "estimation_confidence": estimation_confidence,
        "estimation_method": estimation_method,
        "image_reference": payload.image_reference
    }
    
    result = database.update_user_asset(payload.user_id, payload.asset_id, updated_fields)
    return result


@app.delete("/api/portfolio/{asset_id}")
def delete_asset(asset_id: str, user_id: str = "user_bride"):
    success = database.delete_user_asset(user_id, asset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"status": "success"}

@app.post("/api/invoice/extract")
async def extract_invoice(file: UploadFile = File(...), user_id: str = Form("user_bride")):
    """
    Endpoint to extract data from invoice file (Option 1: With Invoice).
    """
    try:
        content = await file.read()
        # Execute extraction
        result = agents.run_invoice_intelligence(content, file.filename)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        raw_data = result.get("data") or {}
        
        # Parse items array if present
        items = raw_data.get("items") or []
        enriched_items = []
        conf = result.get("observability", {}).get("confidence", "High (Invoice Verified)")
        for item in items:
            item_payload = {
                **item,
                "invoice_number": raw_data.get("invoice_number"),
                "jeweller": raw_data.get("jeweller"),
                "purchase_date": raw_data.get("purchase_date"),
                "currency": raw_data.get("currency")
            }
            enrichment = calculations.validate_and_enrich_extracted_data(item_payload, source_type="INVOICE")
            enrichment["data"]["estimation_confidence"] = conf
            enriched_items.append({
                "data": enrichment["data"],
                "provenance": enrichment["provenance"],
                "audit_warnings": enrichment["audit_warnings"]
            })
            
        # If no items were extracted (e.g. user uploaded a jewellery photo into invoice upload),
        # automatically cross-route to Jewellery Intelligence!
        if not enriched_items:
            photo_result = agents.run_jewellery_intelligence(content, file.filename)
            photo_raw = photo_result.get("data") or {}
            min_w = photo_raw.get("estimated_weight_range_grams", {}).get("min", 38.0)
            max_w = photo_raw.get("estimated_weight_range_grams", {}).get("max", 45.0)
            mid_w = round((min_w + max_w) / 2, 2)
            min_p = photo_raw.get("estimated_price_range", {}).get("min", 2500.0)
            max_p = photo_raw.get("estimated_price_range", {}).get("max", 3200.0)
            mid_p = round((min_p + max_p) / 2, 2)
            purity_opts = photo_raw.get("recommended_purity_options", ["22K"])
            likely_purity = purity_opts[0] if purity_opts else "22K"
            
            raw_payload = {
                "jewellery_name": f"{likely_purity} Gold {photo_raw.get('style', 'Traditional').capitalize()} {photo_raw.get('category', 'Necklace').capitalize()}",
                "category": photo_raw.get("category", "necklace"),
                "purity": likely_purity,
                "gross_weight_grams": mid_w,
                "total_purchase_price": mid_p,
                "currency": "USD",
                "purchase_date": None
            }
            enrichment = calculations.validate_and_enrich_extracted_data(raw_payload, source_type="AI_ESTIMATED")
            enrichment["data"]["estimated_weight_range_grams"] = {"min": min_w, "max": max_w}
            enrichment["data"]["estimated_price_range"] = {"min": min_p, "max": max_p}
            enrichment["data"]["style"] = photo_raw.get("style", "traditional")
            enrichment["data"]["design_features"] = photo_raw.get("design_features", [])
            enrichment["data"]["colour"] = photo_raw.get("colour", "yellow")
            enrichment["data"]["confidence"] = "Medium (Visual Analysis)"
            enrichment["data"]["estimation_confidence"] = "Medium (AI Estimated)"
            enriched_items.append({
                "data": enrichment["data"],
                "provenance": enrichment["provenance"],
                "audit_warnings": enrichment["audit_warnings"]
            })
            
        # Return the first item's details as default root values
        default_enrichment = enriched_items[0] if enriched_items else {
            "data": {}, "provenance": {}, "audit_warnings": []
        }
        
        return {
            "data": default_enrichment["data"],
            "provenance": default_enrichment["provenance"],
            "audit_warnings": default_enrichment["audit_warnings"],
            "extracted_items": enriched_items,
            "logs": result.get("logs", []),
            "observability": result.get("observability", {})
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invoice processing failed: {str(e)}")

@app.post("/api/jewellery/analyze")
async def analyze_jewellery(file: UploadFile = File(...)):
    """
    Endpoint to analyze target design from design upload.
    """
    content = await file.read()
    result = agents.run_jewellery_intelligence(content, file.filename)
    raw_data = result.get("data") or {}
    
    # Pre-populate raw values for validation and enrichment
    min_w = raw_data.get("estimated_weight_range_grams", {}).get("min", 10.0)
    max_w = raw_data.get("estimated_weight_range_grams", {}).get("max", 15.0)
    mid_w = round((min_w + max_w) / 2, 2)
    
    min_p = raw_data.get("estimated_price_range", {}).get("min", 500.0)
    max_p = raw_data.get("estimated_price_range", {}).get("max", 800.0)
    mid_p = round((min_p + max_p) / 2, 2)
    
    purity_opts = raw_data.get("recommended_purity_options", ["22K"])
    likely_purity = purity_opts[0] if purity_opts else "22K"
    
    cat = raw_data.get("category") or "bracelet"
    sty = raw_data.get("style") or "contemporary"
    
    raw_payload = {
        "jewellery_name": f"{likely_purity} Gold {sty.capitalize()} {cat.capitalize()}",
        "category": cat,
        "purity": likely_purity,
        "gross_weight_grams": mid_w,
        "total_purchase_price": mid_p,
        "currency": "USD",
        "purchase_date": None
    }
    
    enrichment = calculations.validate_and_enrich_extracted_data(raw_payload, source_type="AI_ESTIMATED")
    
    # Add visual ranges and confidence flags specifically for photo estimation
    enrichment["data"]["estimated_weight_range_grams"] = {"min": min_w, "max": max_w}
    enrichment["data"]["estimated_price_range"] = {"min": min_p, "max": max_p}
    enrichment["data"]["style"] = sty
    enrichment["data"]["design_features"] = raw_data.get("design_features", [])
    enrichment["data"]["colour"] = raw_data.get("colour", "yellow")
    enrichment["data"]["confidence"] = "Medium (Visual Analysis)"
    enrichment["data"]["estimation_confidence"] = "Medium (AI Estimated)"
    enrichment["data"]["assumptions"] = raw_data.get("assumptions", [])
    enrichment["data"]["recommended_purity_options"] = purity_opts
    
    return {
        "data": enrichment["data"],
        "provenance": enrichment["provenance"],
        "audit_warnings": enrichment["audit_warnings"],
        "logs": result.get("logs", []),
        "observability": result.get("observability", {})
    }

@app.get("/api/advisor/recommend")
def get_collection_recommendations(user_id: str = "user_bride"):
    """
    Endpoint to run collection Gap Analysis and retrieve suggestions.
    """
    portfolio = database.load_user_portfolio(user_id)
    result = agents.run_collection_advisor(portfolio)
    return result

class PurchasePlanPayload(BaseModel):
    user_id: str
    target_purity: str
    timeline_months: float
    exchange_candidate_asset_ids: List[str]
    target_design_image_filename: Optional[str] = None
    home_currency: str = "USD"
    market: Optional[str] = "Singapore"
    target_category: Optional[str] = None

@app.post("/api/purchase/plan")
def compile_purchase_plan(payload: PurchasePlanPayload):
    """
    Endpoint to run orchestrator and generate the final Gold Purchase Plan.
    """
    plan = agents.compile_gold_purchase_plan(
        user_id=payload.user_id,
        target_design_image_filename=payload.target_design_image_filename,
        target_purity=payload.target_purity,
        target_timeline_months=payload.timeline_months,
        exchange_candidate_asset_ids=payload.exchange_candidate_asset_ids,
        home_currency=payload.home_currency,
        market=payload.market,
        target_category=payload.target_category
    )
    return plan

class AskPayload(BaseModel):
    user_id: str
    question: str
    home_currency: str = "USD"

@app.post("/api/ask")
def ask_goldguard(payload: AskPayload):
    """
    Endpoint for conversational Q&A decision support.
    """
    return agents.run_ask_goldguard(payload.user_id, payload.question, payload.home_currency)

@app.post("/api/portfolio/{asset_id}/upload-image")
async def upload_asset_image(asset_id: str, file: UploadFile = File(...), user_id: str = "user_bride"):
    import os
    os.makedirs("static/uploads", exist_ok=True)
    filename = file.filename.replace(" ", "_")
    file_path = f"static/uploads/{asset_id}_{filename}"
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    relative_path = f"/uploads/{asset_id}_{filename}"
    database.update_user_asset(user_id, asset_id, {"image_reference": relative_path})
    return {"status": "success", "image_reference": relative_path}

# Serve static compiled files and media in production
if os.path.exists("static"):
    os.makedirs("static/jewellery", exist_ok=True)
    os.makedirs("static/uploads", exist_ok=True)
    app.mount("/jewellery", StaticFiles(directory="static/jewellery"), name="jewellery")
    app.mount("/uploads", StaticFiles(directory="static/uploads"), name="uploads")
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
