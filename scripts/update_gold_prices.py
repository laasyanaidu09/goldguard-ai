import csv
import os
import random
from datetime import datetime, timedelta

def generate_retail_gold_prices():
    start_date = datetime(2020, 1, 1)
    end_date = datetime(2026, 9, 7)
    current_date = start_date

    # Current retail 24K benchmark: SGD 189.90 / 1.34 = 141.7164 USD
    TARGET_CURRENT_USD = round(189.90 / 1.34, 2)  # 141.72 USD

    anchors = [
        (datetime(2020, 1, 1), 58.20),
        (datetime(2020, 8, 6), 78.50),
        (datetime(2021, 6, 1), 72.00),
        (datetime(2022, 3, 8), 82.50),
        (datetime(2022, 10, 15), 75.00),
        (datetime(2023, 4, 12), 89.00),
        (datetime(2023, 10, 5), 84.50),
        (datetime(2024, 1, 1), 96.00),
        (datetime(2024, 5, 10), 112.00),
        (datetime(2025, 1, 20), 125.00),
        (datetime(2026, 8, 1), 138.50),
        (datetime(2026, 9, 7), TARGET_CURRENT_USD),
    ]

    daily_targets = {}
    for i in range(len(anchors) - 1):
        d1, p1 = anchors[i]
        d2, p2 = anchors[i+1]
        days = (d2 - d1).days
        for d in range(days):
            day_date = d1 + timedelta(days=d)
            interp = p1 + (p2 - p1) * (d / days)
            daily_targets[day_date.strftime("%Y-%m-%d")] = interp
    daily_targets[anchors[-1][0].strftime("%Y-%m-%d")] = anchors[-1][1]

    random.seed(42)
    records = []
    price = 58.20

    while current_date <= end_date:
        if current_date.weekday() < 5:
            date_str = current_date.strftime("%Y-%m-%d")
            target = daily_targets.get(date_str, TARGET_CURRENT_USD)
            pull = (target - price) * 0.05
            noise = random.normalvariate(0, 0.004) * price
            price = round(price + pull + noise, 2)
            
            if current_date == end_date:
                price = TARGET_CURRENT_USD

            records.append({
                "date": date_str,
                "gold_price": price,
                "currency": "USD",
                "market_region": "Global",
                "source_type": "market_close"
            })
        current_date += timedelta(days=1)

    os.makedirs("data", exist_ok=True)
    csv_path = "data/gold_prices.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "gold_price", "currency", "market_region", "source_type"])
        writer.writeheader()
        writer.writerows(records)
    print(f"Generated {len(records)} clean records. Final record: {records[-1]}")

if __name__ == "__main__":
    generate_retail_gold_prices()
