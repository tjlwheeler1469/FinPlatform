# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Market Data**: CoinGecko (live crypto)
- **Encryption**: AES-256-GCM for PII

## Client Profiles (separate data, nothing shared)
### P1: Thompson Family
- Net Worth: $1,608,800 | Gross Assets: $2,278,000 | Liabilities: $669,200
- Income: $185K | Risk: Balanced | Retire at 67
- Allocation: Property 70%, Super 19%, Shares 4%, Cash 3%, Other 4%

### P2: Chen Family Trust
- Net Worth: $5,200,000 | Gross Assets: $5,200,000 | Liabilities: $0
- Income: $450K | Risk: Balanced | Retire at 60
- Allocation: Trust Portfolio 54%, Super 23%, Property 21%, Cash 2%

## Tab Structures
### Client Overview (7 tabs): Overview → Actions → Retirement → Investments → Goals → Tax Centre → Profile
### Investments (10 tabs): Overview → Bonds → Cash & TDs → Crypto → Managed Funds → Property → Shares & ETFs → SMSF → Super & Pension → Unlisted
### Personal Dashboard (5 tabs): Overview → Net Worth → Wealth Trends → Insights → Transactions

## Sidebar Structure
### Personal: DASHBOARD → INVESTMENTS (All Investments, Rebalancing) → PLANNING → RESEARCH → SETTINGS → TOOLS
### Adviser: DASHBOARD → CRM → EXECUTION (Batch Execute, Meeting Prep, Compliance) → INTEGRATIONS → TOOLS
### Client Context: OVERVIEW → DOCUMENTS → PLANNING

## Completed (as of 14 April 2026)
- [x] Rebalancing removed from Investment tabs, kept in LH nav only
- [x] P1 (Thompson) and P2 (Chen) adviser client profiles with separate data
- [x] Simplified Client Profile (allocation bars + goals only)
- [x] Enhanced ErrorBoundary (chunk error auto-retry + Reload button)
- [x] Chrome extension + chunk error suppression in index.js
- [x] All previous UI reorganization, data unification, Monte Carlo tooltips, PDF reports, etc.

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P3: Centralize demo client data into shared module
- [ ] P3: Replace Mock Xplan integration with real API
