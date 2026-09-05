# GoldGuard Data Strategy

To power recommendations, portfolio valuations, and market scenarios, GoldGuard integrates public market data, a structured design catalog, and user portfolios.

## Data Sources

1. **Market Data (BigQuery / Local CSV)**:
   - Contains daily gold price close records from 2010 to 2026.
   - Used by the `MARKET_INTELLIGENCE_AGENT` to compute moving averages (e.g. 50-day, 200-day), historical percentiles, and volatility (standard deviation of daily returns).
   - Local fallback is maintained in `data/gold_prices.csv`.

2. **Jewellery Catalog (`data/jewellery_catalog.csv`)**:
   - Represents a mock retail inventory of 50 items.
   - Contains details on styles (traditional, contemporary, minimalist), categories (necklace, earrings, bracelet), weights, typical purities, colors, and prices.
   - Used by the `COLLECTION_ADVISOR_AGENT` to suggest real, complementary items rather than generating fictional products.

3. **User Portfolio (`data/synthetic_user_portfolios.csv`)**:
   - Outlines pre-built portfolios for testing different user archetypes (e.g., "The Heavy Traditionalist", "The Minimalist Starter", "The Balanced Saver").

4. **Invoice Repository (`data/synthetic_invoices.csv`)**:
   - Textual representations of typical jewelry invoices used to validate parsing.
