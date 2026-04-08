# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)
- **Encryption**: AES-256-GCM for PII (TFN, ID numbers)

## Unified Mock Data (Thompson Family — single source of truth)
- **Net Worth**: $1,608,800
- **Gross Assets**: $2,278,000 (12 holdings)
- **Total Liabilities**: $669,200 (3 items)
- **Used consistently across**: Overview, Net Worth tab, Wealth Trends, Investments, Client Profile, Portfolio Context (App.js)

## Tab Structures
### Adviser Client Overview (7 tabs)
Overview → Actions → Retirement → Investments → Budget → Tax Centre → Profile

### Investments (11 tabs)
Overview → Rebalancing → Bonds → Cash & TDs → Crypto → Managed Funds → Property → Shares & ETFs → SMSF → Super & Pension → Unlisted

### Personal Dashboard (5 tabs)
Overview → Net Worth (calculation breakdown) → Wealth Trends → Insights → Transactions

## Sidebar Structure
### Personal: DASHBOARD → INVESTMENTS → PLANNING → RESEARCH → SETTINGS → TOOLS
### Adviser: DASHBOARD → CRM (Client Hub, New Client, Import/Export) → EXECUTION (Batch Execute, Meeting Prep) → INTEGRATIONS → TOOLS

## Key API Endpoints
- `POST /api/retirement-projection/calculate` — Monte Carlo + deterministic projection
- `POST /api/client-personal-info/setup` — Full client onboarding
- `POST /api/client-personal-info/{client_id}` — Save/update personal info
- `POST /api/client-personal-info/{client_id}/xplan-sync` — Xplan sync (MOCKED)

## Completed (as of 9 April 2026)
- [x] All UI reorganization (tab reordering, sidebar cleanup)
- [x] Data unification: All data sources (App.js portfolio context, PersonalDashboard mockAssets, ClientProfileTab, NetWorthTrend) now use consistent Thompson family values
- [x] NetWorthTrend seeded algorithm pins final data point to exact net worth
- [x] Removed Client Health Dashboard, AI & Tasks, Compliance from Adviser sidebar
- [x] Simplified Client Profile to high-level overview
- [x] Chrome extension error suppression
- [x] Full Calculation Breakdown table in Net Worth tab
- [x] Budget tab in Unified Client Overview (HouseholdBudget embedded)
- [x] Import/Export moved from Personal Settings to Adviser CRM
- [x] Multi-entity client onboarding, CSV bulk import
- [x] Retirement Calculator with Monte Carlo
- [x] AES-256-GCM encrypted PII (TFN, IDs)
- [x] ComplianceModal "Don't show again" persistence

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: Budget Calculator Investment Callout verification
- [ ] P3: Centralize demo client data into shared module (partially done via App.js unification)
- [ ] P3: Replace Mock Xplan integration with real API
