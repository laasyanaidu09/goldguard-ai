import threading
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

# Absolute paths relative to this file's folder to ensure robust loading across local and Docker environments
_curr_dir = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(os.path.join(_curr_dir, "data")):
    DATA_DIR = os.path.join(_curr_dir, "data")
elif os.path.exists(os.path.join(os.path.dirname(_curr_dir), "data")):
    DATA_DIR = os.path.join(os.path.dirname(_curr_dir), "data")
elif os.path.exists("/data"):
    DATA_DIR = "/data"
else:
    DATA_DIR = os.path.join(os.getcwd(), "data")

# Local cache and persistent store for portfolios in Demo / Local Mode
_demo_portfolios = {}
_db_lock = threading.Lock()
_demo_db_initialized = False
STORE_FILE = os.path.join(DATA_DIR, "user_portfolios_store.json")

def _save_portfolios_to_store():
    """
    Persists _demo_portfolios to user_portfolios_store.json in an atomic, thread-safe way.
    Ensures newly added, edited, or deleted items survive server restarts and browser refreshes.
    """
    try:
        temp_file = STORE_FILE + ".tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(_demo_portfolios, f, indent=2, default=str)
        os.replace(temp_file, STORE_FILE)
    except Exception as e:
        print(f"Error saving portfolios store: {e}")

def _load_portfolios_from_store():
    """
    Loads portfolios from user_portfolios_store.json if it exists and contains valid data.
    """
    if os.path.exists(STORE_FILE):
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and data.get("user_bride"):
                    return data
        except Exception as e:
            print(f"Error reading portfolios store: {e}")
    return None

def init_demo_db():
    global _demo_portfolios, _demo_db_initialized
    with _db_lock:
        if _demo_db_initialized and _demo_portfolios:
            return

        # 1. Try loading from persistent disk store first
        stored_data = _load_portfolios_from_store()
        if stored_data:
            _demo_portfolios = stored_data
            _demo_db_initialized = True
            return

        # 2. If no store exists, initialize from synthetic_user_portfolios.csv
        try:
            csv_path = os.path.join(DATA_DIR, "synthetic_user_portfolios.csv")
            df = pd.read_csv(csv_path)
            temp_portfolios = {}
            for _, row in df.iterrows():
                user_id = row["user_id"]
                if user_id not in temp_portfolios:
                    temp_portfolios[user_id] = []
                
                # Prevent duplicate seed entries
                if any(a["asset_id"] == row["asset_id"] for a in temp_portfolios[user_id]):
                    continue
                
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
                    "image_reference": (f"/jewellery/{row['image_reference']}" if pd.notna(row["image_reference"]) and not str(row["image_reference"]).startswith("/") and not str(row["image_reference"]).startswith("http") else (row["image_reference"] if pd.notna(row["image_reference"]) else None)),
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
                temp_portfolios[user_id].append(asset)
            
            # Check if user had uploaded Lakshmi haaram image, restore it if present
            upload_dir = os.path.join(_curr_dir, "static", "uploads")
            if os.path.exists(os.path.join(upload_dir, "ASSET_103_Lakshmi_haaram.png")):
                if "user_bride" in temp_portfolios and not any(a["asset_id"] == "ASSET_103" for a in temp_portfolios["user_bride"]):
                    temp_portfolios["user_bride"].append({
                        "asset_id": "ASSET_103",
                        "name": "Lakshmi Haaram",
                        "category": "necklace",
                        "style": "traditional",
                        "purity": "22K",
                        "gross_weight_grams": 45.0,
                        "net_gold_weight_grams": 41.25,
                        "purchase_date": "2023-11-20",
                        "purchase_price": 3200.0,
                        "gold_rate": 141.72,
                        "making_charges": 250.0,
                        "wastage": 0.0,
                        "taxes": 0.0,
                        "currency": "SGD",
                        "invoice_reference": None,
                        "image_reference": "/uploads/ASSET_103_Lakshmi_haaram.png",
                        "colour": "yellow",
                        "documentation_status": "self_reported",
                        "data_sources": {"name": "user_input", "purity": "user_input", "weight": "user_input"},
                        "estimated_current_value": 0.0,
                        "last_updated": datetime.now().isoformat(),
                        "purchase_price_status": "EXACT",
                        "purchase_price_source": "USER_EXACT",
                        "provenance_status": "SELF_REPORTED",
                        "notes": "Restored user vault item."
                    })

            _demo_portfolios = temp_portfolios
            _demo_db_initialized = True
            # Persist to store file immediately
            _save_portfolios_to_store()
        except Exception as e:
            print(f"Error loading demo user portfolios: {e}")

# Call init_demo_db unconditionally on module load to guarantee ready data
init_demo_db()

_firestore_client = None
_firestore_checked = False

def get_db():
    global _firestore_client, _firestore_checked
    if DEMO_MODE or not PROJECT_ID:
        return None
    if _firestore_checked:
        return _firestore_client
    try:
        from google.cloud import firestore
        _firestore_client = firestore.Client(project=PROJECT_ID)
    except Exception as e:
        print(f"Firestore not available or credentials missing: {e}. Falling back to local data.")
        _firestore_client = None
    _firestore_checked = True
    return _firestore_client

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

CALIBRATED_GOLD_PRICE_USD = 141.72  # Retail 24K benchmark matching Joyalukkas: SGD 189.90 (24K), SGD 173.90 (22K), SGD 142.50 (18K)
_cached_gold_price = None
_last_price_fetch_time = 0.0

def get_current_gold_price_usd() -> float:
    """
    Retrieves the latest verified 24K retail gold rate per gram in USD.
    Validates sanity bounds (110.00 <= price <= 180.00 USD/g) aligned with
    official Singapore & international jeweller display board rates.
    Cached for 5 minutes (300s) to prevent blocking HTTP requests.
    """
    global _cached_gold_price, _last_price_fetch_time
    import time
    now = time.time()
    if _cached_gold_price is not None and (now - _last_price_fetch_time < 300.0):
        return _cached_gold_price

    import urllib.request
    import json
    
    # 1. Attempt live fetch from public spot rate API
    try:
        req = urllib.request.Request(
            "https://api.gold-api.com/price/XAU", 
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=2) as response:
            data = json.loads(response.read().decode())
            raw_price = float(data.get("price", 0.0))
            
            # Check if price is per troy ounce or per gram
            if 3500.0 <= raw_price <= 6000.0:
                price_per_gram = round(raw_price / 31.1035, 2)
            elif 110.0 <= raw_price <= 180.0:
                price_per_gram = round(raw_price, 2)
            else:
                price_per_gram = None
                
            if price_per_gram is not None and 110.0 <= price_per_gram <= 180.0:
                _cached_gold_price = price_per_gram
                _last_price_fetch_time = now
                return _cached_gold_price
    except Exception:
        pass
        
    # 2. Check cached gold price history CSV
    prices = load_gold_prices()
    if prices:
        last_p = float(prices[-1]["gold_price"])
        if 110.0 <= last_p <= 180.0:
            _cached_gold_price = last_p
            _last_price_fetch_time = now
            return _cached_gold_price
            
    _cached_gold_price = CALIBRATED_GOLD_PRICE_USD
    _last_price_fetch_time = now
    return _cached_gold_price

def load_user_portfolio(user_id: str) -> list:
    """
    Loads a user's gold portfolio assets with strict deduplication by asset_id.
    """
    init_demo_db()
    raw_assets = []
    
    if DEMO_MODE:
        raw_assets = _demo_portfolios.get(user_id, [])
    else:
        # Live Firestore mode
        db = get_db()
        if db is None:
            raw_assets = _demo_portfolios.get(user_id, [])
        else:
            try:
                assets_ref = db.collection("users").document(user_id).collection("gold_assets")
                docs = assets_ref.stream()
                assets = []
                for doc in docs:
                    asset = doc.to_dict()
                    asset["asset_id"] = doc.id
                    assets.append(asset)
                if not assets:
                    raw_assets = _demo_portfolios.get(user_id, [])
                else:
                    raw_assets = assets
            except Exception as e:
                print(f"Firestore error: {e}. Falling back to demo data.")
                raw_assets = _demo_portfolios.get(user_id, [])

    # Strictly deduplicate by asset_id to guarantee unique collection items
    seen_ids = set()
    deduped_assets = []
    for a in raw_assets:
        aid = a.get("asset_id")
        if aid and aid not in seen_ids:
            seen_ids.add(aid)
            deduped_assets.append(a)
        elif not aid:
            deduped_assets.append(a)
    return deduped_assets

def add_user_asset(user_id: str, asset: dict) -> dict:
    """
    Adds a new gold asset to a user's portfolio and persists to disk.
    """
    asset["last_updated"] = datetime.now().isoformat()
    init_demo_db()
    db = get_db() if not DEMO_MODE else None

    if db is None:
        with _db_lock:
            if user_id not in _demo_portfolios:
                _demo_portfolios[user_id] = []
            # Ensure unique asset ID (find next unused ASSET_xxx)
            existing_ids = {a.get("asset_id") for a in _demo_portfolios[user_id] if a.get("asset_id")}
            idx = 100 + len(_demo_portfolios[user_id])
            while f"ASSET_{idx}" in existing_ids:
                idx += 1
            asset["asset_id"] = f"ASSET_{idx}"
            _demo_portfolios[user_id].append(asset)
            _save_portfolios_to_store()
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
    Removes a gold asset from the portfolio and persists to disk.
    """
    init_demo_db()
    db = get_db() if not DEMO_MODE else None

    if db is None:
        with _db_lock:
            if user_id in _demo_portfolios:
                initial_len = len(_demo_portfolios[user_id])
                _demo_portfolios[user_id] = [a for a in _demo_portfolios[user_id] if a.get("asset_id") != asset_id]
                changed = len(_demo_portfolios[user_id]) < initial_len
                if changed:
                    _save_portfolios_to_store()
                return changed
        return False
        
    try:
        db.collection("users").document(user_id).collection("gold_assets").document(asset_id).delete()
        return True
    except Exception as e:
        print(f"Firestore delete error: {e}")
        return False

def update_user_asset(user_id: str, asset_id: str, updated_fields: dict) -> dict:
    """
    Updates an existing gold asset with audit trails and persists to disk.
    """
    updated_fields["last_updated"] = datetime.now().isoformat()
    init_demo_db()
    db = get_db() if not DEMO_MODE else None

    if db is None:
        with _db_lock:
            if user_id in _demo_portfolios:
                for i, asset in enumerate(_demo_portfolios[user_id]):
                    if asset.get("asset_id") == asset_id:
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
                        _save_portfolios_to_store()
                        return asset
        return {}

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


