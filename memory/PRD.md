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
### Client Overview (8 tabs): Overview -> Actions -> Retirement -> Investments -> Budget -> Goals -> Tax Centre -> Profile
### Investments (10 sub-tabs): Overview -> Bonds -> Cash & TDs -> Crypto -> Managed Funds -> Property -> Shares & ETFs -> SMSF -> Super & Pension -> Unlisted
### Personal Dashboard (5 tabs): Overview -> Net Worth -> Wealth Trends -> Insights -> Transactions

## Sidebar Structure
### Personal: DASHBOARD -> INVESTMENTS -> PLANNING -> RESEARCH -> SETTINGS -> TOOLS
### Adviser: DASHBOARD -> CRM -> EXECUTION -> INTEGRATIONS -> TOOLS
### Client Context: OVERVIEW -> DOCUMENTS (Goals/Planning removed)

## Client Portal Design Principle
Core question: "Am I going to be okay?"
- Phase 1: Hero with confidence gauge (0-100%) + status badge (On Track / At Risk)
- Phase 2: Plain English summary — what will happen, strengths, things to watch
- Phase 3: 2-3 improvement actions with "+X% confidence" impact badges
- Phase 4: One simple visual — retirement timeline (Age 50 -> Age 67)
- Phase 5: Advisor guidance — "Sarah Chen is looking after your plan" + contact CTA
- Phase 6: Remove all complexity — no Monte Carlo, no allocation charts, no scenario tables

## Completed (as of 14 April 2026)
- [x] Client Portal redesigned: emotionally engaging, 6-phase layout, answers "Am I going to be okay?"
- [x] Tab styling fixed: subtle 10% opacity bg with gold underline (no more oversized dark blue button)
- [x] Budget tab added between Investments and Goals in client overview
- [x] Goals & Scenarios removed from adviser client context sidebar
- [x] Portfolio Rebalancing moved above Top Holdings + Allocation Radar chart added
- [x] Client Profile simplified to dashboard (header card, 5 KPI cards, quick info, allocation/goals)
- [x] Runtime error overlay suppressed (chrome extensions, chunk loading errors, frame_ant)
- [x] Investments sub-tabs restyled to match new subtle active state
- [x] P1/P2 profile data isolation confirmed (Thompson vs Chen)
- [x] All previous: data unification, Monte Carlo tooltips, PDF reports, CRM P1/P2, etc.

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P3: Centralize demo client data into shared module (move out of App.js)
- [ ] P3: Replace Mock Xplan integration with real API
