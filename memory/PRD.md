# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key) for copilot, whisper for voice
- **Market Data**: CoinGecko (live crypto)

## Personal Dashboard Tab Structure (6 tabs)
1. **Overview**: Health Score, Retirement Readiness, Net Worth pie, Quick Actions, Smart Insights, Documents, Asset Allocation, Entity Breakdown, Rebalancing
2. **Net Worth**: FamilyWealthDashboard embedded
3. **Retirement**: Full retirement readiness gauge, confidence drivers, timeline
4. **Insights**: Full Smart Insights (AI + manual)
5. **Wealth Trends**: NetWorthTrend embedded
6. **Investments**: All investments sorted alphabetically with entity filter

## Sidebar Structure (All items alphabetical)

### Personal Mode
- DASHBOARD: Markets (LIVE), My Dashboard (HOME)
- INVESTMENTS: All Investments
- PLANNING: Budget (NEW), Goals & Scenarios, Rebalancing, Research Centre, Retirement (PRO)
- SETTINGS: Bank Feeds, Documents, Import/Export, Security
- TOOLS: Loan Calculator, Tax Centre

### Adviser Mode
- AI & TASKS: AI Assistant, Meeting Prep
- COMPLIANCE: Compliance Centre, Security
- CRM: Client Hub, Compare Clients (NEW), Health Dashboard (NEW)
- DASHBOARD: Command Center, Markets (LIVE)
- EXECUTION: Batch Execute
- INTEGRATIONS: Live Sync, Platforms, Xplan Sync
- TOOLS: Notifications

### Client Context Mode
- DOCUMENTS: Compliance, Meeting Notes, Reports, Vault
- OVERVIEW: Client Overview (2 tabs: Overview + Investments), Retirement, Tax Centre
- PLANNING: Actions, Budget, Goals & Scenarios

## Features Implemented

### Page Consolidation & Deduplication
- [x] UnifiedDashboard renders PersonalDashboard directly
- [x] UnifiedClientOverview: 2 tabs (Overview + Investments) — no duplication
- [x] UnifiedInvestments: 9 asset class tabs with ErrorBoundary, supports embedded prop
- [x] UnifiedTaxCentre: 8 tax tools
- [x] UnifiedResearchCentre: 4 research tools
- [x] UnifiedComplianceCentre: 4 compliance tools
- [x] UnifiedGoalsPlanning: Goals & Scenarios + Monte Carlo
- [x] AdvisorCommandCenter: 2 tabs (Dashboard & Briefing merged + Decision Centre)

### ErrorBoundary
- [x] All Suspense boundaries wrapped, global ErrorBoundary in App.js

### Client Health Dashboard
- [x] RAG status for 5 demo clients with search/filter

### Portfolio Health Score Widget
- [x] Inline widget on Personal Dashboard

### What-If Budget Mode
- [x] Toggle with 5 adjustment controls
- [x] Investable surplus callout with "View Investments" action button

### Client Comparison View
- [x] Side-by-side 2-3 clients with charts

### Meeting Mode Enhancements
- [x] Keyboard shortcuts + PDF export via jsPDF

### Auto-Email for Client Pack Scheduler
- [x] Email field + toggle (MOCKED)

### Tax Loss Harvesting Fix
- [x] Client-side fallback calculation when API unavailable

### Chrome Extension Error Suppression
- [x] index.js suppresses frame_ant and other extension errors

## Bugs Fixed
- [x] SMSFOptimizer crash (optional chaining)
- [x] Webpack chunk load failures (ErrorBoundary)
- [x] Chrome extension interference (suppressed + ErrorBoundary)
- [x] HouseholdBudget crash on portfolio.expenses
- [x] Tax Loss Harvesting "calculations didn't work" (client-side fallback)
- [x] Xplan missing LHS navigation (Layout wrapper added)
- [x] Duplication: Goals & Scenarios removed from Client Overview (already standalone)
- [x] Duplication: Dashboard + Daily Briefing merged into one tab

## Backlog
- [ ] P3: Real email integration for Client Pack auto-delivery
- [ ] P3: What-If Budget scenario saving/comparison
- [ ] P3: ComplianceModal "Don't show again" should persist across sessions
