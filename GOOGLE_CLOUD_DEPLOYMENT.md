# Google Cloud Deployment Guide

This guide details how to build, containerize, and deploy the GoldGuard application to Google Cloud Run and configure related cloud resources.

## 1. Firebase Authentication & Cloud Firestore Setup
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and activate the Email/Password provider.
3. Enable **Cloud Firestore** in Native Mode. Select a region near your users.
4. Set up Firestore security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/gold_assets/{assetId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

## 2. BigQuery Analytical Setup
1. In the Google Cloud Console, navigate to **BigQuery**.
2. Create a dataset named `goldguard_analytics`.
3. Create a table named `historical_gold_prices` with the schema:
   - `date`: DATE (Required)
   - `gold_price`: FLOAT64 (Required)
   - `currency`: STRING (Required)
   - `market_region`: STRING (Required)
   - `source_type`: STRING (Required)
4. Upload `data/gold_prices.csv` to populate historical data.

---

## 3. Deploying to Google Cloud Run
GoldGuard runs as a unified Docker container, where FastAPI handles both the API routes and serves the static React build files.

### Step 3.1: Build Frontend for Production
1. In the `frontend` folder, build the project:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. Move the static build directory to the backend `static` assets folder:
   ```bash
   mv dist ../backend/static
   ```

### Step 3.2: Build and Deploy using Google Cloud Build
1. In the `backend` folder, deploy the API to Cloud Run:
   ```bash
   cd ../backend
   gcloud run deploy goldguard-app \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="DEMO_MODE=false,PROJECT_ID=your_gcp_project"
   ```
2. Provide the Cloud Run service account with Firestore User and BigQuery Data Viewer roles.
