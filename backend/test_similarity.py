import os
import pytest
from agents import run_similarity_finder

def test_unclear_or_blurry_image():
    # Test with dummy small/blurry payload
    dummy_blurry_data = b"small blurry image"
    dummy_portfolio = [
        {"asset_id": "ASSET_001", "name": "Traditional Haram", "category": "necklace", "style": "traditional", "gross_weight_grams": 48.5}
    ]
    res = run_similarity_finder(dummy_blurry_data, "blurry_photo.jpg", dummy_portfolio)
    data = res["data"]
    assert data["is_clear"] is False
    assert data["status"] == "unclear_image"
    assert "The image is not clear for comparison" in data["error_message"]
    assert data["detected_item"] is None

def test_different_jewellery_type_comparison():
    # User uploads a ring, collection has a necklace and bangle
    dummy_data = b"x" * 5000 # clear size
    dummy_portfolio = [
        {"asset_id": "ASSET_001", "name": "Traditional Marriage Haram", "category": "necklace", "style": "traditional", "gross_weight_grams": 48.5},
        {"asset_id": "ASSET_002", "name": "Heavy Filigree Bangles", "category": "bangle", "style": "traditional", "gross_weight_grams": 32.0}
    ]
    res = run_similarity_finder(dummy_data, "solitaire_ring.jpg", dummy_portfolio)
    data = res["data"]
    assert data["is_clear"] is True
    assert data["detected_item"]["category"] == "ring"
    # Both necklace and bangle in collection must have 0% similarity
    for comp in data["comparisons"]:
        assert comp["similarity_score"] == 0.0
        assert comp["is_same_category"] is False
        assert "Different jewellery type" in comp["reason"]
    assert data["overall_verdict"]["verdict_type"] == "NEW_CATEGORY"

def test_same_type_new_distinct_design():
    # User uploads a modern geometric choker, collection has traditional long harams
    dummy_data = b"x" * 5000
    dummy_portfolio = [
        {"asset_id": "ASSET_001", "name": "Traditional Marriage Haram", "category": "necklace", "style": "traditional", "gross_weight_grams": 48.5},
        {"asset_id": "ASSET_005", "name": "Ong Antique Gold Haram", "category": "necklace", "style": "traditional", "gross_weight_grams": 100.0}
    ]
    res = run_similarity_finder(dummy_data, "modern_choker_necklace.jpg", dummy_portfolio)
    data = res["data"]
    assert data["is_clear"] is True
    assert data["detected_item"]["category"] == "necklace"
    assert data["matching_category_count"] == 2
    # Design is distinct from long traditional haram, so max score should be < 45%
    assert data["overall_verdict"]["verdict_type"] == "NEW_DESIGN"
    assert "new and not in your collection" in data["overall_verdict"]["headline"]
    assert data["overall_verdict"]["is_recommended_to_add"] is True

def test_same_type_high_redundancy_design():
    # User uploads another traditional marriage haram when one already exists
    dummy_data = b"x" * 5000
    dummy_portfolio = [
        {"asset_id": "ASSET_001", "name": "Traditional Marriage Haram", "category": "necklace", "style": "traditional", "gross_weight_grams": 48.5}
    ]
    res = run_similarity_finder(dummy_data, "traditional_necklace_haram.jpg", dummy_portfolio)
    data = res["data"]
    assert data["is_clear"] is True
    assert data["detected_item"]["category"] == "necklace"
    assert data["overall_verdict"]["verdict_type"] == "HIGH_REDUNDANCY"
    assert data["overall_verdict"]["is_recommended_to_add"] is False
    assert data["overall_verdict"]["score"] >= 65.0
