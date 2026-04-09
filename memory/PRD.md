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
- **Super**: David $245,000 (AustralianSuper), Sarah $198,000 (REST Super)
- **Data consistent across**: Overview, Net Worth, Wealth Trends, Investments, Client Profile, Portfolio Context (App.js)

## Tab Structures
### Adviser Client Overview (7 tabs)
Overview → Actions → Retirement → Investments → Budget → Tax Centre → Profile

### Investments (11 tabs)
Overview → Rebalancing → Bonds → Cash & TDs → Crypto → Managed Funds → Property → Shares & ETFs → SMSF → Super & Pension → Unlisted

### Personal Dashboard (5 tabs)
Overview → Net Worth (calculation breakdown tables) → Wealth Trends → Insights → Transactions

## Sidebar Structure
### Personal: DASHBOARD → INVESTMENTS → PLANNING → RESEARCH → SETTINGS → TOOLS
### Adviser: DASHBOARD → CRM (Client Hub, New Client, Import/Export) → EXECUTION (Batch Execute, Meeting Prep) → INTEGRATIONS → TOOLS

## Completed (as of 9 April 2026)
- [x] All UI reorganization (tab reordering, sidebar cleanup)
- [x] Data unification across ALL data sources (App.js portfolio context, PersonalDashboard, ClientProfileTab, NetWorthTrend)
- [x] NetWorthTrend: linear interpolation + seeded noise, last point pinned exactly to $1,608,800
- [x] Rebalancing chart: Fixed % formatting (was showing raw floats like 50.8010941...)
- [x] Stock Research tabs: Fixed dark blue button covering text (added text-white on active state)
- [x] Super Guarantee Calculator: Rewritten from employer SG to personal super/SMSF projection (David & Sarah balances)
- [x] Retirement Confidence: Added * hover tooltips for Monte Carlo, Downside Protection, Income Stability, etc.
- [x] Removed Client Health Dashboard, AI & Tasks, Compliance from Adviser sidebar
- [x] Simplified Client Profile to high-level overview (retirement, portfolio, holdings, liabilities)
- [x] Chrome extension error suppression
- [x] Full Calculation Breakdown table in Net Worth tab
- [x] Budget tab in Unified Client Overview (HouseholdBudget embedded)
- [x] Import/Export moved from Personal Settings to Adviser CRM
- [x] Multi-entity client onboarding, CSV bulk import
- [x] Retirement Calculator with Monte Carlo
- [x] AES-256-GCM encrypted PII (TFN, IDs)
- [x] ComplianceModal persistence

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: Budget Calculator Investment Callout verification
- [ ] P3: Update /client-360 page data from Wheeler to Thompson family
- [ ] P3: Replace Mock Xplan integration with real API
