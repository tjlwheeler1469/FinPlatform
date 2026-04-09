# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Market Data**: CoinGecko (live crypto)
- **Encryption**: AES-256-GCM for PII (TFN, ID numbers)

## Unified Mock Data (Thompson Family)
- **Net Worth**: $1,608,800 | **Gross Assets**: $2,278,000 | **Liabilities**: $669,200
- **Super**: David $245K, Sarah $198K | **Income**: $185K household
- Consistent across ALL views: Dashboard, Investments, Client Profile, Net Worth, Wealth Trends, Client Portal, Reports

## Tab Structures
### Adviser Client Overview (7 tabs)
Overview → Actions → Retirement → Investments → Goals → Tax Centre → Profile

### Investments (11 tabs)
Overview → Rebalancing → Bonds → Cash & TDs → Crypto → Managed Funds → Property → Shares & ETFs → SMSF → Super & Pension → Unlisted

### Personal Dashboard (5 tabs)
Overview → Net Worth (full calculation table) → Wealth Trends → Insights → Transactions

## Sidebar Structure
### Personal: DASHBOARD → INVESTMENTS → PLANNING → RESEARCH → SETTINGS → TOOLS
### Adviser (no client): DASHBOARD → CRM (Client Hub, New Client, Import/Export) → EXECUTION (Batch Execute, Meeting Prep, Compliance) → INTEGRATIONS → TOOLS
### Client Context: OVERVIEW → DOCUMENTS (Meeting Notes, Reports, Vault) → PLANNING (Goals & Scenarios)

## Key API Endpoints
- `POST /api/retirement-projection/calculate`, `POST /api/hybrid-engine/calculate`, `POST /api/hybrid-engine/compare-scenarios`
- `POST /api/client-personal-info/setup`, `GET/POST /api/client-personal-info/{client_id}`
- `GET /api/client-portal/dashboard/{client_id}`, `GET /api/client-portal/net-worth/{client_id}`

## Completed (as of 9 April 2026)
- [x] All UI reorganization and tab reordering
- [x] Data unification across ALL data sources (Thompson family)
- [x] NetWorthTrend pinned to exact net worth value
- [x] Rebalancing chart % formatting fixed
- [x] Stock Research tab styling fixed (text-white on active)
- [x] Super Guarantee Calculator rewritten as personal super projection
- [x] Monte Carlo factor tooltips (* hover explanations)
- [x] Budget removed from client sidebar; Goals added to top tabs
- [x] Compliance moved from client level to adviser sidebar (under Execution)
- [x] "View escalation pathways" now switches to Escalation tab
- [x] Report Generator: client-side mock reports with jsPDF PDF download + Halcyon branding
- [x] /client-portal fixed and updated to Thompson family data
- [x] Retirement scenarios auto-compare after each calculation
- [x] Client Profile simplified to high-level overview
- [x] Chrome extension error suppression
- [x] Multi-entity client onboarding, CSV bulk import
- [x] AES-256-GCM encrypted PII
- [x] ComplianceModal persistence

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P3: Centralize demo client data into shared module
- [ ] P3: Replace Mock Xplan integration with real API
