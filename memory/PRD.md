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

### P2: Chen Family Trust
- Net Worth: $5,200,000 | Gross Assets: $5,200,000 | Liabilities: $0
- Income: $450K | Risk: Balanced | Retire at 60

## Tab Structures
### Personal Dashboard (6 tabs): Overview -> Net Worth -> Wealth Trends -> Investments -> Insights -> Transactions
### Adviser Client Overview (8 tabs): Overview -> Actions -> Retirement -> Investments -> Budget -> Goals -> Tax Centre -> Profile
### Investments (10 sub-tabs): Overview -> Bonds -> Cash & TDs -> Crypto -> Managed Funds -> Property -> Shares & ETFs -> SMSF -> Super & Pension -> Unlisted

## Sidebar Structure
### Personal: DASHBOARD only (My Dashboard, Markets) — no Planning, Research, Settings, Tools, Investments
### Adviser: DASHBOARD -> CRM -> EXECUTION -> INTEGRATIONS -> TOOLS
### Client Context: OVERVIEW -> DOCUMENTS

## Client Portal (at /client-portal)
Core question: "Am I going to be okay?"
- Phase 1: Hero with confidence gauge + On Track / At Risk badge
- Phase 2: Plain English summary — strengths, things to watch
- Phase 3: 2-3 improvement actions with "+X% confidence" impact
- Phase 4: Simple retirement timeline
- Phase 5: Advisor guidance with contact CTAs
- Phase 6: No complexity — no Monte Carlo, allocation charts, scenario tables

## Completed (as of 14 April 2026)
- [x] Personal dashboard: Investments moved from LHS nav into dashboard tab
- [x] Personal dashboard: tab order — Overview, Net Worth, Wealth Trends, Investments, Insights, Transactions
- [x] Personal dashboard: Assets by Entity moved to top of Net Worth page
- [x] Personal LHS nav stripped: only Dashboard (My Dashboard + Markets) remains
- [x] Client Portal redesigned: 6-phase emotionally engaging layout
- [x] Adviser tab styling: subtle 10% opacity bg with gold underline
- [x] Budget tab added between Investments and Goals in adviser client overview
- [x] Goals removed from adviser client context sidebar
- [x] Portfolio Rebalancing above Top Holdings + Allocation Radar chart
- [x] Client Profile simplified to dashboard
- [x] Runtime error overlay suppression (chrome extensions, chunk errors)
- [x] P1/P2 data isolation confirmed

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P3: Centralize demo client data into shared module
- [ ] P3: Replace Mock Xplan integration with real API
