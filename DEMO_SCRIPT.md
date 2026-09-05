# GoldGuard 3-Minute Demo Script

This script guide walks you through the primary user journey of GoldGuard. If running in **Demo Mode**, all uploads and analyses will bypass credentials and run with high-fidelity pre-compiled datasets.

---

## The Coherent Narrative: "Smart Portfolio & Planning"

**Objective**: Show how a user adds existing gold items (verified vs self-reported), gets personalized recommendations on what to buy next to diversify their collection, uploads a photo of a desired item, compares it to their current collection, and creates an optimized purchase savings plan. All values are dynamically converted and displayed in the user's selected home currency.

---

### STEP 1: Add Existing Gold with Invoice
1. Select the preferred **Home Currency** from the top header (e.g. **USD**, **SGD**, **INR**, **AED**, **EUR**). For this demo, let's use the user's preference, say **USD** or **SGD**.
2. Navigate to the **Add Gold** tab from the main navigation.
3. Select **Option 1: With Invoice**.
4. Upload the sample invoice image/PDF (provided in `data/synthetic_invoices/`).
5. Click **Extract Details**.
6. Observe the extracted fields displayed in the UI:
   - **Name**: Gold Traditional Necklace
   - **Purity**: 22K
   - **Weight**: 38.4g
   - **Jeweller**: Example Jewellers
   - **Date**: 12 June 2023
   - **Taxes/Charges**: Detailed breakdown.
   - **Total Price**: Automatically converted and shown in the user's selected currency.
7. Note the green **"Extracted from Invoice (Verified)"** badge next to the fields, indicating high provenance.
8. Click **Confirm & Add** to save it to the portfolio.

---

### STEP 2: Add Existing Gold Without Invoice
1. On the **Add Gold** screen, select **Option 2: Without Invoice / Manual**.
2. Fill out the fields manually:
   - **Name**: Daily Gold Chain
   - **Category**: Necklace
   - **Purity**: 22K
   - **Weight**: 18.0g
   - **Purchase Year**: 2021
3. Click **Add to Portfolio**.
4. Note the yellow **"Self-Reported / No Invoice"** label displayed on the asset.

---

### STEP 3: Dashboard Update
1. Go to the **Dashboard**.
2. Notice the metrics updating instantly, converted to the preferred **Home Currency**:
   - **Total Weight**: 56.4g (38.4g verified, 18.0g self-reported)
   - **Estimated Portfolio Value**: Dynamically calculated using live gold prices in the user's home currency (e.g., USD, SGD, or INR).
   - **Historical Purchase Value vs Current Gain/Loss**.
3. View the charts displaying the category mix (100% necklaces) and purity breakdown (100% 22K).

---

### STEP 4: Collection Advisor & "What Should I Buy Next?"
1. Under the **Collection Advisor** section, see the personalized recommendation card.
2. Read the explanation:
   - *"You already own two necklaces and zero bracelets. You have high concentration in necklaces. Consider a Lightweight Contemporary Bracelet to diversify your collection."*
3. Click **Explore Recommendations** to open the full screen.
4. Review the 3 suggested next purchases:
   - **Lightweight Contemporary Bracelet** (Diversify)
   - **Matching Earrings** (Complement/Match)
   - **Contemporary Pendant** (Fill Gap)

---

### STEP 5: Initiating the Purchase Plan
1. On the **Lightweight Contemporary Bracelet** recommendation card, click **Plan This Purchase**.
2. This navigates you to the **Plan Purchase** wizard with the target parameters pre-filled.

---

### STEP 6: Target Jewellery Image Analysis
1. Select **Upload Jewellery Image** (Option B) to upload a photo of the bracelet you wish to buy.
2. Upload the sample design image from the catalog.
3. Click **Analyze Image**.
4. Gemini outputs:
   - **Style**: Contemporary Minimalist
   - **Estimated weight range**: 8g - 12g (Typical assumption: 10g)
   - **Purity recommendation**: 22K or 18K (Recommended: 22K for investment value and everyday durability).

---

### STEP 7: Similarity & Redundancy Check
1. The **Collection Similarity** panel displays:
   - **Similarity Score**: 12% (indicating a great addition to the collection).
   - **Collection Fit**: *"No similar bracelets owned. This design adds fresh variety to your 100% necklace collection."*
2. (Optional: Try uploading a necklace design. The similarity score will jump to 78%+ and warn you: *"You already own a similar traditional necklace. Adding this may create redundancy."*)

---

### STEP 8: Price, Savings, and Timeline Settings
1. Select **22K** purity and **12 months** timeline.
2. The calculator dynamically computes:
   - **Estimated Cost**: Calculated in the user's home currency (Gold price + 10% making charges + GST).
   - **Funding Gap**: Cost in home currency (since no assets are traded in yet).

---

### STEP 9: Exchange Optimization
1. Expand the **Exchange / Sell Optimization** panel.
2. Toggle on the **Daily Gold Chain** (the 18g self-reported chain added in Step 2) as an exchange candidate.
3. The system calculates:
   - **Estimated Trade-in Value**: Calculated in home currency (based on net weight and buyback rate).
   - **Updated Funding Gap**: Converted in home currency (the exchange fully covers the new purchase, saving the total cost!).
4. Toggle it off to view the savings scenario instead.

---

### STEP 10: Market Price Scenarios & Final Purchase Plan
1. View the 4 historical market scenarios (Lower price, Current price, Moderate increase, High increase) in the user's preferred currency.
2. Look at the weekly and monthly savings plan for the 12-month timeline:
   - **Monthly Savings**: Calculated in home currency (e.g. USD 96/month or SGD 128/month).
3. Click **Generate Final Gold Purchase Plan**.
4. Review the premium, printable report summarizing all metrics, assumptions, similarity scores, and explainable AI insights.

