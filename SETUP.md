# GoldGuard Setup Guide

Follow these steps to set up and run GoldGuard locally.

## Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Firebase Account (optional, required only for production mode)
- Google Cloud Project with Gemini API / Vertex AI access (optional, required only for production mode)

---

## Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in a `.env` file:
   ```env
   PORT=8000
   DEMO_MODE=true
   GEMINI_API_KEY=your_gemini_api_key
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

---

## Frontend Setup (Vite + React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```npm install```
3. Run the Vite development server:
   ```npm run dev```
4. Access the frontend app at `http://localhost:5173`.
