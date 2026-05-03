# VotePath X (formerly MataData) 🗳️

An enterprise-grade, gamified, and accessible AI election intelligence platform designed to empower Indian voters with real-time, multi-lingual, and highly accurate election information.

## 🎯 Chosen Vertical
**Civic Tech / GovTech (AI for Social Good)**

## 🚨 Problem Statement
Navigating complex election data, verifying candidate profiles, and understanding local voting procedures is often a daunting task for the average voter. Information is fragmented across various portals, lacks accessibility (WCAG compliance), and is rarely available in localized languages or an interactive format. This friction leads to lower voter turnout and uninformed voting decisions.

## 🏗️ Approach and Architecture
VotePath X leverages a modern, scalable, and secure architecture:
- **Monorepo Architecture:** Built using Turborepo to manage full-stack codebases efficiently.
- **Frontend:** React + Vite, styled for WCAG 2.1 AAA accessibility and responsive design.
- **Backend:** Node.js (v24.15.0) + Express, functioning as a secure API Gateway and Backend-for-Frontend (BFF).
- **Database & Caching:** MongoDB for persistent user and election data, and Upstash Redis for high-speed query caching.
- **AI & GCP Services:** Integration with Google's Gen AI SDK (Gemini) for natural language processing, Google Sheets for dynamic data ingestion, Google Maps for polling booth location, and Firebase for secure authentication.

## ⚙️ How It Works
1. **Interactive AI Assistant:** Voters can ask questions in natural language (e.g., "Who are the candidates in my constituency?").
2. **Secure Proxy Layer:** The Node.js backend receives the request, checks the Upstash Redis cache, and if missing, orchestrates calls to Google Cloud APIs (Gemini, Maps, etc.) using securely managed Service Accounts.
3. **Data Aggregation:** The backend fetches real-time data from MongoDB or Google Sheets, formats it, and returns the response to the user.
4. **Gamification:** Users earn badges and track their "Voter IQ" through interactions, making civic engagement fun.

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js**: v24.15.0+
- **Package Manager**: npm or yarn

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the root directory and fill in the required keys. (See the `.env.example` file if available):
   ```env
   # Frontend & Google APIs
   VITE_GOOGLE_MAPS_API_KEY=your_key
   GOOGLE_CLOUD_PROJECT=your_project_id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_SHEETS_ID=your_sheet_id
   GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
   
   # Backend Server Config
   VITE_API_URL=http://localhost:8080 # For local development
   PORT=8080
   
   # Database & Caching
   MONGODB_URI=your_mongo_uri
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   
   # AI
   GEMINI_API_KEY=your_gemini_key
   
   # Security
   JWT_SECRET=your_jwt_secret
   API_HMAC_SECRET=votepath-x-hmac-dev-secret-change-in-prod
   ```
   *Note: Ensure `service-account.json` is placed in the root directory if using Google Cloud Service Account authentication.*

4. **Start the Development Servers:**
   This project uses a dual-server setup for local development. You need to run both commands in separate terminal windows.

   **Terminal 1 (Backend API):**
   ```bash
   npm run server:dev
   ```
   
   **Terminal 2 (Frontend UI):**
   ```bash
   npm run dev
   ```

## 🚀 Deployment Guide

Deploying VotePath X involves hosting the backend (Node.js/Express) and the frontend (Vite/React) separately.

### 🔑 Where to Keep API Keys in Production
**NEVER commit your `.env` file to version control.**
In production, your API keys and secrets should be securely injected via your hosting provider's environment variable/secrets manager:
- **For the Backend (Google Cloud Run / Render / Heroku):** Add variables like `GEMINI_API_KEY`, `MONGODB_URI`, `UPSTASH_REDIS_REST_TOKEN`, `JWT_SECRET`, and `API_HMAC_SECRET` into the Cloud Run Environment Variables section.
- **For the Frontend (Vercel / Netlify):** Add `VITE_GOOGLE_MAPS_API_KEY` and `VITE_API_URL` into the Vercel Project Settings > Environment Variables.

### 🛑 What Needs to Change Before Production
1. **API_HMAC_SECRET**: Change this value to a strong, randomly generated string in production environment variables. Both frontend and backend must share this exact same secret.
2. **JWT_SECRET**: Use a secure, long random string.
3. **VITE_API_URL**: Once your backend is deployed, update this in your frontend hosting (e.g., Vercel) to point to your live backend URL (e.g., `https://api.votepathx.com`) instead of `http://localhost:8080`.
4. **Google Maps Restriction**: Restrict your Google Maps API key in the Google Cloud Console to only accept requests from your production frontend domain to prevent quota theft.

### Step 1: Deploy Backend (e.g., Google Cloud Run)
1. Authenticate with Google Cloud CLI (`gcloud auth login`).
2. Build the Docker image (ensure you have a `Dockerfile` set up for Node.js):
   ```bash
   docker build -t gcr.io/virtual-promp-war/votepath-api .
   ```
3. Push to Container Registry:
   ```bash
   docker push gcr.io/virtual-promp-war/votepath-api
   ```
4. Deploy to Cloud Run, securely passing the required production environment variables:
   ```bash
   gcloud run deploy votepath-api \
     --image gcr.io/virtual-promp-war/votepath-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,PORT=8080,GEMINI_API_KEY=...,MONGODB_URI=...
   ```
   *(Alternatively, you can manage environment variables securely in the GCP Console).*

### Step 2: Deploy Frontend (e.g., Vercel)
1. Connect your GitHub repository to Vercel.
2. Set the **Framework Preset** to `Vite`.
3. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-cloud-run-backend-url.run.app`
   - `VITE_GOOGLE_MAPS_API_KEY` = `your_key`
5. Click **Deploy**.

## 🧠 Assumptions
- Users have a stable internet connection for real-time AI responses.
- Election data structures in Google Sheets remain consistent with the backend parsers.
- Localized language queries are supported by Gemini's base models without extensive fine-tuning.