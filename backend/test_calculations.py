# Calculations tests
from calculations import (
    get_purity_ratio,
    calculate_net_gold_weight,
    calculate_savings_milestones,
    calculate_purchase_cost
)

def test_purity_ratios():
    assert get_purity_ratio("24K") == 0.999
    assert get_purity_ratio("22K") == 0.9167
    assert get_purity_ratio("18K") == 0.750
    assert get_purity_ratio("UNKNOWN") == 0.9167  # default fallback

def test_net_gold_weight():
    # 10g of 22K gold
    assert calculate_net_gold_weight(10.0, "22K") == 9.167
    # 5g of 18K gold
    assert calculate_net_gold_weight(5.0, "18K") == 3.750

def test_savings_milestones():
    # Cost: 6000, Exchange contribution: 2000, Timeline: 12 months
    savings = calculate_savings_milestones(
        total_cost=6000.0,
        exchange_contribution=2000.0,
        timeline_months=12.0
    )
    assert savings["funding_gap"] == 4000.0
    assert savings["monthly_savings"] == 333.33
    # 4000 / (12 * 4.333333333333333) = approx 76.92
    assert abs(savings["weekly_savings"] - 76.92) <= 0.1

def test_purchase_cost():
    # Weight: 10g, Purity: 22K, Gold rate: 75.0, Making charge: 10%, Tax: 7%
    # Gold value: 10 * 75 * 0.9167 = 687.525
    # Making charges: 687.525 * 0.10 = 68.7525
    # Subtotal: 687.525 + 68.7525 = 756.2775
    # Taxes: 756.2775 * 0.07 = 52.9394
    # Total: 809.22
    cost = calculate_purchase_cost(
        weight_grams=10.0,
        purity="22K",
        gold_price_per_gram_usd=75.0,
        making_charge_percent=10.0,
        tax_percent=7.0,
        target_currency="USD"
      )
    assert cost["gold_value"] == 687.52
    assert cost["making_charges"] == 68.75
    assert cost["taxes"] == 52.94
    assert cost["total_cost"] == 809.22

def test_portfolio_concentration():
    from calculations import calculate_portfolio_concentration
    portfolio = [
        {"gross_weight_grams": 60.0, "category": "necklace", "style": "traditional", "purity": "22K"},
        {"gross_weight_grams": 40.0, "category": "bangle", "style": "contemporary", "purity": "22K"}
    ]
    res = calculate_portfolio_concentration(portfolio)
    assert res["total_gross_weight"] == 100.0
    assert res["category_ratios"]["necklace"] == 60.0
    assert res["category_ratios"]["bangle"] == 40.0
    assert res["risk_level"] == "Moderate"

def test_goldguard_score():
    from calculations import calculate_goldguard_score
    portfolio = [
        {"gross_weight_grams": 60.0, "category": "necklace", "style": "traditional", "purity": "22K"}
    ]
    res = calculate_goldguard_score(
        target_category="bracelet",
        target_style="contemporary",
        target_price_usd=800.0,
        portfolio=portfolio,
        latest_gold_price_usd=75.0,
        user_budget_usd=1500.0,
        timeline_months=12.0
    )
    assert 0 <= res["score"] <= 100
    assert res["breakdown"]["diversification"] == 100  # no bracelet owned

def test_strategy_evaluation():
    from calculations import evaluate_buy_vs_exchange_vs_sell
    res = evaluate_buy_vs_exchange_vs_sell(
        target_cost=1000.0,
        exchange_credits=400.0,
        timeline_months=10.0
    )
    assert res["recommendation"] == "EXCHANGE GOLD"
    assert res["options"]["exchange"]["funding_gap"] == 600.0
    assert res["options"]["exchange"]["monthly_savings"] == 60.0

def test_convert_between_currencies():
    from calculations import convert_between_currencies
    # USD -> INR (83.5)
    assert abs(convert_between_currencies(100.0, "USD", "INR") - 8350.0) < 1.0
    # SGD (1.34) -> INR (83.5)
    # 100 / 1.34 * 83.5 = 6231.34
    assert abs(convert_between_currencies(100.0, "SGD", "INR") - 6231.34) < 1.0

def test_is_purchase_price_suspicious():
    from calculations import is_purchase_price_suspicious
    # Weight: 100g 22K. Gold price at purchase: 70 USD/g.
    # Base raw gold value in USD: 100 * 70 * 0.9167 = 6416.9 USD
    # In SGD, base raw gold value: 6416.9 * 1.34 = 8598.65 SGD
    # A price of 536,000 SGD is 536000 / 8598.65 = 62x, which is highly suspicious (True)
    assert is_purchase_price_suspicious(100.0, "22K", 70.0, 536000.0, "SGD") is True
    # A price of 9000 SGD is 9000 / 8598.65 = 1.04x, which is realistic (False)
    assert is_purchase_price_suspicious(100.0, "22K", 70.0, 9000.0, "SGD") is False


def test_get_historical_gold_price():
    from calculations import get_historical_gold_price
    # Check 2019 fallback
    res_2019 = get_historical_gold_price("2019-06-15")
    assert res_2019["gold_price"] == 44.90
    assert res_2019["confidence"] == "High"
    
    # Check 2022 Average
    res_2022 = get_historical_gold_price("2022")
    assert res_2022["gold_price"] > 0
    assert "2022 Average" in res_2022["date_used"]

def test_estimate_historical_valuation():
    from calculations import estimate_historical_valuation
    res = estimate_historical_valuation(100.0, "22K", "2019", "SGD")
    # 100 * 0.9167 = 91.67g fine gold
    # 91.67 * 45.00 USD/g = 4125.15 USD
    # 4125.15 * 1.34 = 5527.7 SGD
    assert abs(res["fine_gold_weight"] - 91.67) < 0.1
    assert abs(res["historical_gold_value"] - 5527.7) < 100.0
    assert res["estimated_jewellery_price_min"] > res["historical_gold_value"]
    assert res["estimated_liquidation_value_min"] < res["historical_gold_value"]

def test_validation_ong_antique_gold_haram():
    # Item details: Ong Antique Gold Haram, Weight: 100g, Purity: 22K
    # Assert Fine Gold Weight = 91.67g
    # Assert Current Gold Metal Value = 91.67 * current_24k_price
    from calculations import get_purity_ratio, convert_currency
    from database import get_current_gold_price_usd
    
    gross_weight = 100.0
    purity = "22K"
    
    ratio = get_purity_ratio(purity)
    fine_gold_weight = round(gross_weight * ratio, 2)
    assert abs(fine_gold_weight - 91.67) < 0.01
    
    current_24k_price_usd = get_current_gold_price_usd()
    current_gold_metal_value_usd = fine_gold_weight * current_24k_price_usd
    current_gold_metal_value_sgd = convert_currency(current_gold_metal_value_usd, "SGD")
    
    # Check that current_gold_metal_value matches the correct formula (fine_gold_weight * current_24k_price)
    # and doesn't double-multiply the purity ratio
    expected_sgd = round(91.67 * current_24k_price_usd * 1.34, 2)
    assert abs(current_gold_metal_value_sgd - expected_sgd) < 0.1


def test_ask_goldguard_agent():
    from agents import run_ask_goldguard
    res = run_ask_goldguard(user_id="user_bride", question="how much fine gold do I own?", home_currency="SGD")
    assert "answer" in res
    assert "metadata" in res
    assert "fine gold" in res["answer"].lower()
    
    res_val = run_ask_goldguard(user_id="user_bride", question="what is my gold worth today?", home_currency="SGD")
    assert "value" in res_val["answer"].lower() or "valued" in res_val["answer"].lower()


def test_generate_category_recommendations():
    from calculations import generate_category_recommendations
    portfolio = [
        {"gross_weight_grams": 82.0, "category": "necklace"},
        {"gross_weight_grams": 18.0, "category": "bangle"}
    ]
    recs = generate_category_recommendations(portfolio)
    assert recs["is_balanced"] is False
    assert recs["max_concentration_category"] == "Necklace"
    assert recs["max_concentration_percentage"] == 82.0
    assert "Earrings" in recs["missing_categories"]
    assert "Ring" in recs["missing_categories"]
    
    # Earrings/Ring must have a high score because they are missing and lightweight
    selected = recs["selected_recommendation"]
    assert selected["category"] in ["Earrings", "Ring"]
    assert selected["score"] > 80


def test_compile_gold_purchase_plan():
    from agents import compile_gold_purchase_plan
    plan = compile_gold_purchase_plan(
        user_id="user_bride",
        target_design_image_filename=None,
        target_purity="22K",
        target_timeline_months=12,
        exchange_candidate_asset_ids=[],
        home_currency="SGD",
        market="Singapore",
        target_category="earrings"
    )
    assert plan["target_jewellery"]["category"] == "earrings"
    assert plan["target_jewellery"]["target_weight"] == 10.0
    assert plan["target_jewellery"]["target_purity"] == "22K"
    assert plan["similarity_insight"]["classification"] == "DIFFERENT"


def test_invoice_photo_enrichment_scenarios_a_to_h():
    from calculations import validate_and_enrich_extracted_data

    # Test A: 22K necklace invoice
    raw_a = {
        "jewellery_name": "Gold Temple Haram Necklace",
        "category": "necklace",
        "purity": "22K",
        "gross_weight_grams": 48.5,
        "total_purchase_price": 3200.0,
        "currency": "USD"
    }
    res_a = validate_and_enrich_extracted_data(raw_a)
    assert res_a["data"]["category"] == "necklace"
    assert res_a["data"]["purity"] == "22K"
    assert res_a["data"]["gross_weight_grams"] == 48.5
    assert res_a["provenance"]["gross_weight_grams"] == "INVOICE"

    # Test B: 916 gold invoice -> 22K purity
    raw_b = {
        "category": "necklace",
        "purity": "916 Gold",
        "gross_weight_grams": 20.0,
        "total_purchase_price": 1300.0
    }
    res_b = validate_and_enrich_extracted_data(raw_b)
    assert res_b["data"]["purity"] == "22K"

    # Test C: 750 gold invoice -> 18K purity
    raw_c = {
        "category": "earrings",
        "purity": "750",
        "gross_weight_grams": 8.0,
        "total_purchase_price": 450.0
    }
    res_c = validate_and_enrich_extracted_data(raw_c)
    assert res_c["data"]["purity"] == "18K"

    # Test D: Stone weight deduction
    raw_d = {
        "jewellery_name": "Ruby Bangle Pair",
        "category": "bangle",
        "purity": "22K",
        "gross_weight_grams": 20.0,
        "stone_weight_grams": 2.0,
        "total_purchase_price": 1200.0
    }
    res_d = validate_and_enrich_extracted_data(raw_d)
    assert res_d["data"]["gross_weight_grams"] == 20.0
    assert res_d["data"]["net_gold_weight_grams"] == 18.0
    assert res_d["data"]["fine_gold_weight_grams"] == 16.5  # 18 * 22/24

    # Test E: Invoice in INR
    raw_e = {
        "category": "ring",
        "purity": "22K",
        "gross_weight_grams": 6.5,
        "total_purchase_price": 45000.0,
        "currency": "₹"
    }
    res_e = validate_and_enrich_extracted_data(raw_e)
    assert res_e["data"]["currency"] == "INR"

    # Test F: Invoice in SGD
    raw_f = {
        "category": "ring",
        "purity": "22K",
        "gross_weight_grams": 6.5,
        "total_purchase_price": 800.0,
        "currency": "S$"
    }
    res_f = validate_and_enrich_extracted_data(raw_f)
    assert res_f["data"]["currency"] == "SGD"

    # Test G: Old invoice with no purchase price -> Unknown
    raw_g = {
        "category": "necklace",
        "purity": "22K",
        "gross_weight_grams": 50.0,
        "purchase_price": None,
        "purchase_date": "2019-06-15"
    }
    res_g = validate_and_enrich_extracted_data(raw_g)
    assert res_g["data"]["purchase_price"] is None
    assert res_g["provenance"]["purchase_price"] == "UNKNOWN"

    # Test H: Photo of jewellery without invoice -> AI_ESTIMATED
    raw_h = {
        "category": "ring",
        "purity": "22K",
        "gross_weight_grams": 5.0,
        "total_purchase_price": 350.0
    }
    res_h = validate_and_enrich_extracted_data(raw_h, source_type="AI_ESTIMATED")
    assert res_h["data"]["category"] == "ring"
    assert res_h["provenance"]["category"] == "AI_ESTIMATED"
    assert res_h["provenance"]["gross_weight_grams"] == "AI_ESTIMATED"

    # Test I: Purity percentage maps and fine gold estimation provenance
    raw_i = {
        "category": "bracelet",
        "purity": "91.6%",
        "gross_weight_grams": 20.0,
        "net_gold_weight_grams": None
    }
    res_i = validate_and_enrich_extracted_data(raw_i, source_type="INVOICE")
    assert res_i["data"]["purity"] == "22K"
    assert res_i["provenance"]["purity"] == "INVOICE"
    assert res_i["provenance"]["fine_gold_weight_grams"] == "ESTIMATED_FROM_GROSS"
    assert abs(res_i["data"]["fine_gold_weight_grams"] - (20.0 * 22.0 / 24.0)) < 0.01

    raw_j = {
        "category": "earrings",
        "purity": "75%",
        "gross_weight_grams": 10.0,
        "net_gold_weight_grams": 9.0
    }
    res_j = validate_and_enrich_extracted_data(raw_j, source_type="INVOICE")
    # Test K: Joyalukkas Earring test case with Purchase Price Source and Fine Gold
    raw_k = {
        "jewellery_name": "A19000002336 EAR RING_22K,ZENINA",
        "category": "earrings",
        "purity": "22K",
        "gross_weight_grams": 3.37,
        "net_gold_weight_grams": 3.37,
        "total_purchase_price": 591.80,
        "purchase_price_source": "Total Amount Inclusive of GST",
        "currency": "SGD",
        "purchase_date": "2025-07-20"
    }
    res_k = validate_and_enrich_extracted_data(raw_k, source_type="INVOICE")
    assert res_k["data"]["jewellery_name"] == "A19000002336 EAR RING_22K,ZENINA"
    assert res_k["data"]["purity"] == "22K"
    assert res_k["data"]["gross_weight_grams"] == 3.37
    assert res_k["data"]["fine_gold_weight_grams"] == 3.089 # 3.37 * 22 / 24
    assert res_k["data"]["purchase_price"] == 591.80
    assert res_k["data"]["purchase_price_source"] == "Total Amount Inclusive of GST"
    assert res_k["data"]["currency"] == "SGD"
    assert res_k["data"]["is_suspicious"] is False

    # Test L: Suspicious price validation (e.g. 591.80 INR for 3.37g 22K gold)
    raw_l = {
        "jewellery_name": "A19000002336 EAR RING_22K,ZENINA",
        "category": "earrings",
        "purity": "22K",
        "gross_weight_grams": 3.37,
        "net_gold_weight_grams": 3.37,
        "total_purchase_price": 591.80,
        "purchase_price_source": "Total Amount",
        "currency": "INR",
        "purchase_date": "2025-07-20"
    }
    res_l = validate_and_enrich_extracted_data(raw_l, source_type="INVOICE")
    # Test M: Future purchase date validation check
    import pytest
    from calculations import estimate_historical_valuation
    with pytest.raises(ValueError, match="cannot be in the future"):
        estimate_historical_valuation(10.0, "22K", "2099-12-31", "USD")

    with pytest.raises(ValueError, match="cannot be in the future"):
        estimate_historical_valuation(10.0, "22K", "2050", "USD")

    # Invalidate future dates in enrichment
    raw_m = {
        "jewellery_name": "Gold Ring",
        "category": "ring",
        "purity": "22K",
        "gross_weight_grams": 5.0,
        "purchase_date": "2099-01-01"
    }
    res_m = validate_and_enrich_extracted_data(raw_m, source_type="INVOICE")
    assert any("future" in w.lower() for w in res_m["audit_warnings"])


def test_jewellery_intelligence_agent_classification():
    from agents import run_jewellery_intelligence

    # 1. Test Bracelet / Bangle upload (like IMG_8516.jpg)
    dummy_bytes_800kb = b"0" * 827000
    res_bracelet = run_jewellery_intelligence(dummy_bytes_800kb, "IMG_8516.jpg")
    assert res_bracelet["data"]["category"] == "bracelet"
    assert res_bracelet["data"]["style"] == "contemporary"
    assert res_bracelet["data"]["estimated_weight_range_grams"]["min"] == 8.0
    assert res_bracelet["data"]["estimated_weight_range_grams"]["max"] == 12.0

    # 2. Test Necklace upload (like IMG_8482.jpg)
    res_necklace = run_jewellery_intelligence(dummy_bytes_800kb, "IMG_8482.jpg")
    assert res_necklace["data"]["category"] == "necklace"
    assert res_necklace["data"]["style"] == "traditional"
    assert res_necklace["data"]["estimated_weight_range_grams"]["min"] == 38.0

    # 3. Test Earrings upload (like IMG_8520.jpg)
    res_earrings = run_jewellery_intelligence(dummy_bytes_800kb, "IMG_8520.jpg")
    assert res_earrings["data"]["category"] == "earrings"

    # 4. Test Ring upload
    res_ring = run_jewellery_intelligence(dummy_bytes_800kb, "gold_solitaire_ring.png")
    assert res_ring["data"]["category"] == "ring"

    # 5. Test Generic upload defaults to bracelet (not heavy 45g bridal necklace)
    res_generic = run_jewellery_intelligence(dummy_bytes_800kb, "target_design.jpg")
    assert res_generic["data"]["category"] == "bracelet"




