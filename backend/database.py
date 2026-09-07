import os
import csv
import json
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv

# Load env vars
load_dotenv()

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "")

# Absolute paths relative to this file's folder to ensure robust loading
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

# Local cache for portfolios in Demo Mode to support dynamic in-memory modifications
_demo_portfolios = {}

def init_demo_db():
    global _demo_portfolios
    if not _demo_portfolios:
        try:
            csv_path = os.path.join(DATA_DIR, "synthetic_user_portfolios.csv")
            df = pd.read_csv(csv_path)
            for _, row in df.iterrows():
                user_id = row["user_id"]
                if user_id not in _demo_portfolios:
                    _demo_portfolios[user_id] = []
                
                # Parse JSON representation of data_sources
                try:
                    data_sources = json.loads(row["data_sources"])
                except Exception:
                    data_sources = {}
                    
                doc_status = row["documentation_status"]
                is_inv = doc_status == "verified_invoice"
                is_ai = doc_status == "ai_estimated"
                is_ong = row["asset_id"] == "ASSET_005"
                
                status_default = "APPROXIMATE" if is_ong else ("EXACT" if is_inv else ("UNKNOWN" if is_ai else "EXACT"))
                source_default = "USER_APPROXIMATE" if is_ong else ("INVOICE" if is_inv else ("AI_ESTIMATED" if is_ai else "USER_EXACT"))
                prov_default = "SELF_REPORTED" if is_ong else ("INVOICE_VERIFIED" if is_inv else ("AI_ESTIMATED" if is_ai else "SELF_REPORTED"))

                asset = {
                    "asset_id": row["asset_id"],
                    "name": row["name"],
                    "category": row["category"],
                    "style": row["style"],
                    "purity": row["purity"],
                    "gross_weight_grams": float(row["gross_weight_grams"]),
                    "net_gold_weight_grams": float(row["net_gold_weight_grams"]),
                    "purchase_date": row["purchase_date"],
                    "purchase_price": float(row["purchase_price"]) if pd.notna(row["purchase_price"]) else None,
                    "gold_rate": float(row["gold_rate"]) if pd.notna(row["gold_rate"]) else None,
                    "making_charges": float(row["making_charges"]) if pd.notna(row["making_charges"]) else 0.0,
                    "wastage": float(row["wastage"]) if pd.notna(row["wastage"]) else 0.0,
                    "taxes": float(row["taxes"]) if pd.notna(row["taxes"]) else 0.0,
                    "currency": row["currency"],
                    "invoice_reference": row["invoice_reference"] if pd.notna(row["invoice_reference"]) else None,
                    "image_reference": row["image_reference"] if pd.notna(row["image_reference"]) else None,
                    "colour": row["colour"] if "colour" in row and pd.notna(row["colour"]) else "yellow",
                    "documentation_status": doc_status,
                    "data_sources": data_sources,
                    "estimated_current_value": 0.0,  # calculated later
                    "last_updated": datetime.now().isoformat(),
                    
                    # New database fields (Section 17 & 18)
                    "purchase_price_status": status_default,
                    "purchase_price_source": source_default,
                    "provenance_status": prov_default,
                    "historical_gold_value": None,
                    "estimated_jewellery_value_min": None,
                    "estimated_jewellery_value_max": None,
                    "estimated_liquidation_value_min": None,
                    "estimated_liquidation_value_max": None,
                    "historical_gold_price": None,
                    "historical_gold_price_currency": "USD",
                    "historical_gold_price_date": row["purchase_date"],
                    "estimation_confidence": "High" if is_inv else ("Medium" if is_ong else None),
                    "estimation_method": None,
                    "notes": ""
                }
                _demo_portfolios[user_id].append(asset)
        except Exception as e:
            print(f"Error loading demo user portfolios: {e}")

# Call init_demo_db on module load
if DEMO_MODE:
    init_demo_db()

def get_db():
    if not DEMO_MODE:
        try:
            from google.cloud import firestore
            return firestore.Client(project=PROJECT_ID)
        except Exception as e:
            print(f"Firestore not available or credentials missing: {e}. Falling back to local data.")
    return None

def load_catalog() -> list:
    """
    Loads jewelry design items from data/jewellery_catalog.csv.
    """
    try:
        csv_path = os.path.join(DATA_DIR, "jewellery_catalog.csv")
        df = pd.read_csv(csv_path)
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Error loading jewelry catalog: {e}")
        return []

def load_gold_prices() -> list:
    """
    Loads daily gold prices from data/gold_prices.csv.
    """
    try:
        csv_path = os.path.join(DATA_DIR, "gold_prices.csv")
        df = pd.read_csv(csv_path)
        return df.to_dict(orient="records")
    except Exception as e:
        print(f"Error loading gold prices: {e}")
        return []

CALIBRATED_GOLD_PRICE_USD = 80.50  # Real-world benchmark: ~$2,504 / troy oz = ~$80.50 / gram (24K)

def get_current_gold_price_usd() -> float:
    """
    Retrieves the latest verified 24K gold spot price per gram in USD.
    Validates sanity bounds (65.00 <= price <= 95.00 USD/g) to protect against
    corrupted or out-of-scale external API responses.
    """
    import urllib.request
    import json
    
    # 1. Attempt live fetch from public spot rate API
    try:
        req = urllib.request.Request(
            "https://api.gold-api.com/price/XAU", 
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            raw_price = float(data.get("price", 0.0))
            
            # Check if price is per troy ounce (~2000-3500) or per gram (~65-95)
            if 2000.0 <= raw_price <= 3500.0:
                price_per_gram = round(raw_price / 31.1035, 2)
            elif 65.0 <= raw_price <= 95.0:
                price_per_gram = round(raw_price, 2)
            else:
                price_per_gram = None
                
            if price_per_gram is not None and 65.0 <= price_per_gram <= 95.0:
                return price_per_gram
    except Exception:
        pass
        
    # 2. Check cached gold price history CSV
    prices = load_gold_prices()
    if prices:
        last_p = float(prices[-1]["gold_price"])
        if 65.0 <= last_p <= 95.0:
            return last_p
            
    return CALIBRATED_GOLD_PRICE_USD

def load_user_portfolio(user_id: str) -> list:
    """
    Loads a user's gold portfolio assets.
    """
    if DEMO_MODE:
        init_demo_db()
        return _demo_portfolios.get(user_id, [])
    
    # Live Firestore mode
    db = get_db()
    if db is None:
        return _demo_portfolios.get(user_id, [])
        
    try:
        assets_ref = db.collection("users").document(user_id).collection("gold_assets")
        docs = assets_ref.stream()
        assets = []
        for doc in docs:
            asset = doc.to_dict()
            asset["asset_id"] = doc.id
            assets.append(asset)
        return assets
    except Exception as e:
        print(f"Firestore error: {e}. Falling back to demo data.")
        return _demo_portfolios.get(user_id, [])

def add_user_asset(user_id: str, asset: dict) -> dict:
    """
    Adds a new gold asset to a user's portfolio.
    """
    asset["last_updated"] = datetime.now().isoformat()
    
    if DEMO_MODE:
        init_demo_db()
        if user_id not in _demo_portfolios:
            _demo_portfolios[user_id] = []
        
        # Ensure unique asset ID
        asset["asset_id"] = f"ASSET_{100 + len(_demo_portfolios[user_id])}"
        _demo_portfolios[user_id].append(asset)
        return asset
        
    db = get_db()
    if db is None:
        # Fallback to in-memory demo data
        if user_id not in _demo_portfolios:
            _demo_portfolios[user_id] = []
        asset["asset_id"] = f"ASSET_{100 + len(_demo_portfolios[user_id])}"
        _demo_portfolios[user_id].append(asset)
        return asset
        
    try:
        # Let Firestore generate a document ID or use asset_id
        doc_ref = db.collection("users").document(user_id).collection("gold_assets").document()
        asset["asset_id"] = doc_ref.id
        doc_ref.set(asset)
        return asset
    except Exception as e:
        print(f"Firestore add error: {e}")
        return asset

def delete_user_asset(user_id: str, asset_id: str) -> bool:
    """
    Removes a gold asset from the portfolio.
    """
    if DEMO_MODE:
        init_demo_db()
        if user_id in _demo_portfolios:
            initial_len = len(_demo_portfolios[user_id])
            _demo_portfolios[user_id] = [a for a in _demo_portfolios[user_id] if a["asset_id"] != asset_id]
            return len(_demo_portfolios[user_id]) < initial_len
        return False
        
    db = get_db()
    if db is None:
        if user_id in _demo_portfolios:
            initial_len = len(_demo_portfolios[user_id])
            _demo_portfolios[user_id] = [a for a in _demo_portfolios[user_id] if a["asset_id"] != asset_id]
            return len(_demo_portfolios[user_id]) < initial_len
        return False
        
    try:
        db.collection("users").document(user_id).collection("gold_assets").document(asset_id).delete()
        return True
    except Exception as e:
        print(f"Firestore delete error: {e}")
        return False

def update_user_asset(user_id: str, asset_id: str, updated_fields: dict) -> dict:
    """
    Updates an existing gold asset with audit trails.
    """
    updated_fields["last_updated"] = datetime.now().isoformat()
    
    if DEMO_MODE:
        init_demo_db()
        if user_id in _demo_portfolios:
            for i, asset in enumerate(_demo_portfolios[user_id]):
                if asset["asset_id"] == asset_id:
                    # Capture audit information
                    audit = {
                        "updatedAt": datetime.now().isoformat(),
                        "lastEditedBy": "user",
                        "previousPurchasePrice": asset.get("purchase_price"),
                        "newPurchasePrice": updated_fields.get("purchase_price"),
                        "previousWeight": asset.get("gross_weight_grams"),
                        "newWeight": updated_fields.get("gross_weight_grams"),
                        "previousPurity": asset.get("purity"),
                        "newPurity": updated_fields.get("purity")
                    }
                    if "audit_history" not in asset:
                        asset["audit_history"] = []
                    asset["audit_history"].append(audit)
                    
                    # Update fields
                    for k, v in updated_fields.items():
                        asset[k] = v
                    return asset
        return {}

    db = get_db()
    if db is None:
        return update_user_asset(user_id, asset_id, updated_fields) # fallback to memory
        
    try:
        doc_ref = db.collection("users").document(user_id).collection("gold_assets").document(asset_id)
        doc = doc_ref.get()
        if doc.exists:
            current_data = doc.to_dict()
            audit = {
                "updatedAt": datetime.now().isoformat(),
                "lastEditedBy": "user",
                "previousPurchasePrice": current_data.get("purchase_price"),
                "newPurchasePrice": updated_fields.get("purchase_price"),
                "previousWeight": current_data.get("gross_weight_grams"),
                "newWeight": updated_fields.get("gross_weight_grams"),
                "previousPurity": current_data.get("purity"),
                "newPurity": updated_fields.get("purity")
            }
            if "audit_history" not in current_data:
                current_data["audit_history"] = []
            current_data["audit_history"].append(audit)
            
            # Combine updates
            for k, v in updated_fields.items():
                current_data[k] = v
            doc_ref.set(current_data)
            return current_data
        return {}
    except Exception as e:
        print(f"Firestore update error: {e}")
        return {}

