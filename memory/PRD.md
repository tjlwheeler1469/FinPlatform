# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)

## Client Profiles (completely isolated mock data)
### P1: Thompson Family
- Net Worth: $1,608,800 | Gross Assets: $2,278,000 | Liabilities: $669,200
- Income: $185K | Risk: Balanced | Age 50 | Retire at 67

### P2: Chen Family Trust
- Net Worth: $5,200,000 | Gross Assets: $5,200,000 | Liabilities: $0
- Income: $450K | Risk: Balanced | Age 49 | Retire at 60

## Tab Structures
### Personal Dashboard (6 tabs): Overview -> Net Worth -> Wealth Trends -> Investments -> Insights -> Transactions
### Adviser Client Overview (8 tabs): Overview -> Actions -> Retirement -> Investments -> Budget -> Goals -> Tax Centre -> Profile
### Investments (10 sub-tabs): Overview -> Bonds -> Cash & TDs -> Crypto -> Managed Funds -> Property -> Shares & ETFs -> SMSF -> Super & Pension -> Unlisted

## Sidebar Structure
### Personal: DASHBOARD only (My Dashboard, Markets)
### Adviser: DASHBOARD -> CRM -> EXECUTION -> INTEGRATIONS -> TOOLS
### Client Context: OVERVIEW -> DOCUMENTS

## Client Portal (at /client-portal)
Core question: "Am I going to be okay?" — 6 phases: Hero gauge, Plain English, Actions, Timeline, Advisor Guidance, No complexity

## Completed (as of 14 April 2026)
- [x] Personal dashboard: Investments in tab, LHS nav cleaned (Dashboard only), Assets by Entity at top of Net Worth
- [x] Client data isolation: PersonalDashboard + InvestmentsOverview switch per selected client (P1/P2)
- [x] lazyRetry wrapper on all 145 lazy imports (prevents chunk load crashes)
- [x] Client Portal redesigned: 6-phase emotionally engaging layout
- [x] Adviser tab styling: subtle 10% opacity bg with gold underline
- [x] Budget tab between Investments and Goals in adviser client overview
- [x] Goals removed from adviser client context sidebar
- [x] Portfolio Rebalancing above Top Holdings + Allocation Radar
- [x] Client Profile simplified to dashboard
- [x] Runtime error overlay suppression

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P3: Centralize all client mock data into shared module
- [ ] P3: Replace Mock Xplan integration with real API
