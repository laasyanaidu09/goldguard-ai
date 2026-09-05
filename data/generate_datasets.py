import csv
import os
import random
from datetime import datetime, timedelta

def generate_gold_prices():
    """
    Generates historical daily gold prices per gram in USD from 2020-01-01 to 2026-08-27
    with a realistic trend starting at ~$48/gram and ending at ~$76/gram with daily volatility.
    """
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2026, 8, 27)
    current_date = start_date

    # Initial gold price per gram in USD (~$1500/troy ounce = ~$48.22/gram)
    price = 48.22
    records = []

    # Simple random walk with upward drift
    # Standard deviation of daily return ~0.7%
    random.seed(42)  # For deterministic output
    while current_date <= end_date:
        # Exclude weekends for typical trading days
        if current_date.weekday() < 5:
            drift = 0.00018  # daily upward drift
            volatility = 0.0075
            change_percent = random.normalvariate(drift, volatility)
            price = price * (1 + change_percent)
            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "gold_price": round(price, 2),
                "currency": "USD",
                "market_region": "Global",
                "source_type": "market_close"
            })
        current_date += timedelta(days=1)

    os.makedirs("data", exist_ok=True)
    with open("data/gold_prices.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "gold_price", "currency", "market_region", "source_type"])
        writer.writeheader()
        writer.writerows(records)
    print(f"Generated {len(records)} gold price records.")

def generate_jewellery_catalog():
    """
    Generates a realistic catalog of 30 jewelry pieces across different styles,
    categories, and price tiers to use for recommendations and similarity searches.
    """
    categories = ["necklace", "ring", "bracelet", "earrings", "bangle", "pendant"]
    styles = ["traditional", "contemporary", "antique", "minimalist", "fusion"]
    colors = ["yellow", "rose", "white", "two-tone"]
    occasions = ["everyday", "bridal", "festive", "workwear", "party"]

    # Hand-crafted base designs to ensure realistic styling
    catalog_templates = [
        # Necklaces
        ("Traditional Bridal Choker", "necklace", "traditional", 35, 45, "bridal", "filigree, intricate, gold beads, heavy design", "yellow"),
        ("Antique Temple Haram Necklace", "necklace", "antique", 50, 70, "festive", "deity motif, rubies, emeralds, matte gold", "yellow"),
        ("Contemporary Minimalist Pendant Necklace", "necklace", "minimalist", 8, 12, "everyday", "thin chain, geometric pendant, clean lines", "rose"),
        ("Fusion Layered Gold Necklace", "necklace", "fusion", 18, 25, "party", "double chain, textured discs, modern chic", "two-tone"),
        
        # Rings
        ("Classic Gold Wedding Band", "ring", "minimalist", 3, 5, "everyday", "polished band, half-round profile, simple", "yellow"),
        ("Contemporary Stackable Ring", "ring", "contemporary", 2, 4, "workwear", "geometric cutouts, thin band, matte finish", "rose"),
        ("Intricate Traditional Cocktail Ring", "ring", "traditional", 8, 12, "party", "floral motif, adjustable size, detailed embossing", "yellow"),
        
        # Bracelets
        ("Lightweight Contemporary Chain Bracelet", "bracelet", "contemporary", 6, 9, "workwear", "paperclip link, toggle clasp, charms", "yellow"),
        ("Minimalist Tennis Bracelet (Solid Gold)", "bracelet", "minimalist", 10, 14, "everyday", "square links, hidden clasp, sleek profile", "two-tone"),
        ("Antique Textured Cuff Bracelet", "bracelet", "antique", 20, 28, "bridal", "embossed filigree, hinged clasp, vintage finish", "yellow"),
        
        # Earrings
        ("Traditional Jhumka Earrings", "earrings", "traditional", 12, 18, "festive", "bell shape, hanging beads, floral stud", "yellow"),
        ("Minimalist Gold Huggie Hoops", "earrings", "minimalist", 2, 4, "everyday", "click closure, small hoop, polished gold", "yellow"),
        ("Contemporary Geo Drop Earrings", "earrings", "contemporary", 6, 10, "party", "dangling triangles, brushed metal finish", "rose"),
        
        # Bangles
        ("Traditional Solid Bangles (Set of 2)", "bangle", "traditional", 24, 30, "bridal", "carved leaf pattern, high-polish, rigid", "yellow"),
        ("Contemporary Lightweight Slip-on Bangle", "bangle", "contemporary", 8, 12, "workwear", "slender band, polished finish, daily wear", "rose"),
        ("Antique Kada Bangle", "bangle", "antique", 18, 24, "festive", "screw-open clasp, elephant-head terminals, matte gold", "yellow"),
        
        # Pendants
        ("Minimalist Solitaire Pendant", "pendant", "minimalist", 1.5, 3, "everyday", "bezel setting, small bail, loop-thru", "rose"),
        ("Traditional Lakshmi Pendant", "pendant", "traditional", 6, 10, "festive", "deity carving, coin shape, textured border", "yellow")
    ]

    catalog = []
    # Expand templates to 30 items
    random.seed(42)
    for idx, t in enumerate(catalog_templates):
        name, cat, style, min_w, max_w, occasion, features, color = t
        item_id = f"CATALOG_{100 + idx}"
        
        # Typical purities for styles
        if style == "minimalist" or style == "contemporary":
            purity = random.choice(["18K", "22K"])
        elif style == "traditional" or style == "antique":
            purity = "22K"
        else:
            purity = "22K"

        catalog.append({
            "item_id": item_id,
            "name": name,
            "category": cat,
            "style": style,
            "purity": purity,
            "weight_range": f"{min_w}g - {max_w}g",
            "min_weight": min_w,
            "max_weight": max_w,
            "occasion": occasion,
            "design_features": features,
            "colour": color,
            "image_reference": f"catalog_{cat}_{style}.jpg"
        })

    # Add a few more variants to bring count to 30
    for i in range(12):
        base = random.choice(catalog_templates)
        name, cat, style, min_w, max_w, occasion, features, color = base
        item_id = f"CATALOG_{118 + i}"
        suffix = random.choice(["II", "Elegant", "Lux", "Daily"])
        purity = "22K" if style in ["traditional", "antique"] else "18K"
        
        catalog.append({
            "item_id": item_id,
            "name": f"{name} {suffix}",
            "category": cat,
            "style": style,
            "purity": purity,
            "weight_range": f"{int(min_w*0.9)}g - {int(max_w*1.1)}g",
            "min_weight": int(min_w*0.9),
            "max_weight": int(max_w*1.1),
            "occasion": occasion,
            "design_features": features + f", {suffix.lower()}",
            "colour": random.choice(colors),
            "image_reference": f"catalog_{cat}_{style}_{i}.jpg"
        })

    with open("data/jewellery_catalog.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "item_id", "name", "category", "style", "purity", 
            "weight_range", "min_weight", "max_weight", 
            "occasion", "design_features", "colour", "image_reference"
        ])
        writer.writeheader()
        writer.writerows(catalog)
    print(f"Generated {len(catalog)} store catalog items.")

def generate_synthetic_user_portfolios():
    """
    Generates three template portfolios for testing different user archetypes:
    - User 1: 'Traditional Bride' (heavy weight, traditional styles, invoice backed)
    - User 2: 'Modern Minimalist' (lightweight, contemporary, self-reported)
    - User 3: 'Balanced Accumulator' (mix of categories, invoice and AI estimated)
    """
    portfolios = [
        # User 1: Traditional Bride (heavy yellow gold)
        {
            "user_id": "user_bride",
            "asset_id": "ASSET_001",
            "name": "Traditional Marriage Haram",
            "category": "necklace",
            "style": "traditional",
            "purity": "22K",
            "gross_weight_grams": 48.5,
            "net_gold_weight_grams": 46.2,
            "purchase_date": "2022-10-15",
            "purchase_price": 2850.00,  # in USD
            "gold_rate": 55.40,
            "making_charges": 250.00,
            "wastage": 5.0,
            "taxes": 120.00,
            "currency": "USD",
            "invoice_reference": "inv_2022_1098.pdf",
            "image_reference": "user_necklace_traditional.jpg",
            "documentation_status": "verified_invoice",
            "data_sources": "{\"name\":\"invoice\",\"purity\":\"invoice\",\"weight\":\"invoice\",\"purchase_price\":\"invoice\"}"
        },
        {
            "user_id": "user_bride",
            "asset_id": "ASSET_002",
            "name": "Heavy Filigree Bangles (Pair)",
            "category": "bangle",
            "style": "traditional",
            "purity": "22K",
            "gross_weight_grams": 32.0,
            "net_gold_weight_grams": 31.5,
            "purchase_date": "2023-04-12",
            "purchase_price": 1950.00,
            "gold_rate": 58.10,
            "making_charges": 180.00,
            "wastage": 2.0,
            "taxes": 90.00,
            "currency": "USD",
            "invoice_reference": "inv_2023_8892.pdf",
            "image_reference": "user_bangles_filigree.jpg",
            "documentation_status": "verified_invoice",
            "data_sources": "{\"name\":\"invoice\",\"purity\":\"invoice\",\"weight\":\"invoice\",\"purchase_price\":\"invoice\"}"
        },
        {
            "user_id": "user_bride",
            "asset_id": "ASSET_005",
            "name": "Ong Antique Gold Haram",
            "category": "necklace",
            "style": "traditional",
            "purity": "22K",
            "gross_weight_grams": 100.0,
            "net_gold_weight_grams": 91.67,
            "purchase_date": "2019-06-15",
            "purchase_price": 6419.00,
            "gold_rate": 45.00,
            "making_charges": 1200.00,
            "wastage": 6.0,
            "taxes": 400.00,
            "currency": "SGD",
            "invoice_reference": None,
            "image_reference": None,
            "documentation_status": "self_reported",
            "data_sources": "{\"name\":\"user_input\",\"purity\":\"user_input\",\"weight\":\"user_input\",\"purchase_price\":\"user_input\"}"
        },
        
        # User 2: Modern Minimalist (rose gold, everyday wear)
        {
            "user_id": "user_minimalist",
            "asset_id": "ASSET_003",
            "name": "Geometric Daily Ring",
            "category": "ring",
            "style": "minimalist",
            "purity": "18K",
            "gross_weight_grams": 3.8,
            "net_gold_weight_grams": 2.85,  # 75% for 18K
            "purchase_date": "2024-05-10",
            "purchase_price": 280.00,
            "gold_rate": 65.20,
            "making_charges": 60.00,
            "wastage": 0.0,
            "taxes": 15.00,
            "currency": "USD",
            "invoice_reference": None,
            "image_reference": None,
            "documentation_status": "self_reported",
            "data_sources": "{\"name\":\"user_input\",\"purity\":\"user_input\",\"weight\":\"user_input\",\"purchase_price\":\"user_input\"}"
        },
        {
            "user_id": "user_minimalist",
            "asset_id": "ASSET_004",
            "name": "Paperclip Gold Bracelet",
            "category": "bracelet",
            "style": "contemporary",
            "purity": "18K",
            "gross_weight_grams": 6.5,
            "net_gold_weight_grams": 4.87,
            "purchase_date": "2025-01-20",
            "purchase_price": 490.00,
            "gold_rate": 69.80,
            "making_charges": 80.00,
            "wastage": 0.0,
            "taxes": 30.00,
            "currency": "USD",
            "invoice_reference": None,
            "image_reference": "user_paperclip_bracelet.jpg",
            "documentation_status": "ai_estimated",
            "data_sources": "{\"name\":\"user_input\",\"purity\":\"ai_estimate\",\"weight\":\"ai_estimate\",\"purchase_price\":\"user_input\"}"
        }
    ]

    with open("data/synthetic_user_portfolios.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "user_id", "asset_id", "name", "category", "style", "purity",
            "gross_weight_grams", "net_gold_weight_grams", "purchase_date",
            "purchase_price", "gold_rate", "making_charges", "wastage",
            "taxes", "currency", "invoice_reference", "image_reference",
            "documentation_status", "data_sources"
        ])
        writer.writeheader()
        writer.writerows(portfolios)
    print("Generated user portfolio templates.")

def generate_synthetic_invoices():
    """
    Generates structured invoice content mock definitions.
    """
    invoices = [
        {
            "invoice_id": "inv_traditional_necklace",
            "jeweller": "Golden Heritage Jewellers",
            "invoice_number": "GH-2023-9941",
            "purchase_date": "2023-06-12",
            "jewellery_name": "Gold Traditional Necklace",
            "category": "necklace",
            "purity": "22K",
            "gross_weight_grams": 38.4,
            "net_gold_weight_grams": 36.8,
            "gold_rate": 60.15,
            "making_charges": 420.00,
            "wastage": 3.5,
            "taxes": 180.00,
            "total_purchase_price": 2813.52,
            "currency": "USD"
        },
        {
            "invoice_id": "inv_contemporary_earrings",
            "jeweller": "Modern Carats Co.",
            "invoice_number": "MC-8812",
            "purchase_date": "2024-11-03",
            "jewellery_name": "Elegant Huggie Hoops",
            "category": "earrings",
            "purity": "18K",
            "gross_weight_grams": 4.2,
            "net_gold_weight_grams": 3.15,
            "gold_rate": 67.80,
            "making_charges": 95.00,
            "wastage": 0.0,
            "taxes": 25.00,
            "total_purchase_price": 333.57,
            "currency": "USD"
        }
    ]

    with open("data/synthetic_invoices.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "invoice_id", "jeweller", "invoice_number", "purchase_date",
            "jewellery_name", "category", "purity", "gross_weight_grams",
            "net_gold_weight_grams", "gold_rate", "making_charges", "wastage",
            "taxes", "total_purchase_price", "currency"
        ])
        writer.writeheader()
        writer.writerows(invoices)
    print("Generated synthetic invoice OCR templates.")

if __name__ == "__main__":
    generate_gold_prices()
    generate_jewellery_catalog()
    generate_synthetic_user_portfolios()
    generate_synthetic_invoices()
    print("All synthetic datasets generated successfully.")
