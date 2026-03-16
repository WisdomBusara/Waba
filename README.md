# WABA - Smart Water Billing Dashboard

This is a production-ready smart water billing system. It features a modern React frontend with Tailwind CSS and a high-performance Node.js backend using `better-sqlite3`.

## 🛠️ System Architecture

- **Frontend**: React 18, Tailwind CSS, Recharts (Data Viz), Framer Motion (Animations), @react-pdf/renderer (Invoicing).
- **Backend**: Node.js Express API.
- **Database**: SQLite (via `better-sqlite3`) - fast, serverless, and embedded.
- **AI Integration**: Google Gemini API for automated customer insights and a Voice Assistant.

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** installed on your machine.

### 2. Installation
You need to install dependencies for both the root (frontend) and the server.

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Running the Project
The application requires both the API and the UI to be running simultaneously.

#### Start the Backend (API)
In one terminal:
```bash
cd server
npm start
```
*Note: On first run, the server will automatically create `server/db/database.sqlite` and seed it with 50+ test customers, meters, and invoices.*

#### Start the Frontend (UI)
In a second terminal:
```bash
npm run dev
# OR
npm start
```

The dashboard will be available at `http://localhost:3000`.

## 📂 Key Features
- **Live Assistant**: Voice-activated AI helper using Gemini 2.5 Flash Native Audio.
- **Bulk Billing Engine**: Automated consumption calculation and batch invoice generation.
- **Dynamic Invoicing**: Custom PDF generation with configurable themes and logos.
- **Database Diagnostics**: Real-time integrity checks and storage metrics.
- **NRW Tracking**: Specialized reporting for Non-Revenue Water analysis.

## ⚙️ Configuration
- **API Port**: 3001
- **Database Path**: `server/db/database.sqlite`
- **Environment**: Ensure `process.env.API_KEY` is set for AI features.
