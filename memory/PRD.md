# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key) for copilot, whisper for voice
- **Market Data**: CoinGecko (live crypto, rate-limited gracefully)

## Personal Dashboard Tab Structure
- **Overview**: Health Score, Retirement Readiness, Net Worth pie, Quick Actions, Smart Insights, Documents, Asset Allocation pie, Holdings by Entity bar, Rebalancing Suggestions
- **Retirement**: Full retirement readiness gauge, confidence drivers, timeline
- **Insights**: Full Smart Insights (AI + manual)
- **Wealth Trends**: NetWorthTrend embedded (lazy loaded)
- **Assets**: Entity filter + full assets table

## Sidebar Structure

### Personal Mode
- DASHBOARD: My Dashboard (HOME), Markets (LIVE)
- PLANNING: Retirement (PRO), Goals & Scenarios, Budget (NEW, What-If), Rebalancing, Research Centre (NEW)
- INVESTMENTS: All Investments (9 tabs)
- TOOLS: Tax Centre (NEW), Loan Calculator
- SETTINGS: Security, Bank Feeds, Import/Export, Documents

### Adviser Mode
- DASHBOARD: Command Center (3 tabs), Markets (LIVE)
- CRM: Client Hub (HUB), Health Dashboard (NEW), Compare Clients (NEW)
- AI & TASKS: AI Assistant, Meeting Prep
- EXECUTION: Batch Execute
- COMPLIANCE: Compliance Centre (NEW), Security
- INTEGRATIONS: Xplan, Platforms, Live Sync
- TOOLS: Notifications

### Client Context Mode
- OVERVIEW: Client Overview (4 tabs), Retirement, Tax Centre
- PLANNING: Goals & Scenarios, Actions, Budget (NEW)
- INVESTMENTS: All Investments (9 tabs)
- DOCUMENTS: Vault, Meeting Notes, Reports, Compliance

## Key Features Implemented

### Page Consolidation (30+ pages consolidated)
- [x] UnifiedDashboard renders PersonalDashboard directly (no wrapper tabs)
- [x] UnifiedInvestments - 9 asset class tabs with ErrorBoundary
- [x] UnifiedTaxCentre - 8 tax tools
- [x] UnifiedResearchCentre - 4 research tools
- [x] UnifiedComplianceCentre - 4 compliance tools
- [x] UnifiedGoalsPlanning - Goals & Scenarios + Monte Carlo
- [x] AdvisorCommandCenter - Dashboard + Daily Briefing + Decision Centre

### UI Restructuring (Feb 2026 - Latest)
- [x] Merged Net Worth/Portfolio content into Overview tab
- [x] Moved Wealth Trends tab next to Insights (tab order: Overview, Retirement, Insights, Wealth Trends, Assets)
- [x] Added Layout wrapper to XplanSyncPage for LHS sidebar navigation
- [x] Removed Stress Test from Adviser mode sidebar

### ErrorBoundary Implementation
- [x] All Suspense boundaries wrapped in ErrorBoundary
- [x] Global ErrorBoundary in App.js

### Client Health Dashboard
- [x] RAG status for 5 demo clients
- [x] Search and filter (All/Red/Amber/Green)

### Portfolio Health Score Widget
- [x] Inline widget on Personal Dashboard with RAG indicators

### What-If Budget Mode
- [x] Toggle with 5 adjustment controls (Income %, Expense %, Savings, Lump Sum, Mortgage Rate)

### Client Comparison View
- [x] Side-by-side 2-3 clients with radar/bar charts

### Meeting Mode Enhancements
- [x] Keyboard shortcuts (Arrow keys, Escape, F, 1-6, Space)
- [x] PDF export via jsPDF

### Auto-Email for Client Pack Scheduler
- [x] Email field + auto-email toggle (MOCKED - no real email service)

## Bugs Fixed
- [x] SMSFOptimizer crash (optional chaining)
- [x] Webpack chunk load failures (ErrorBoundary)
- [x] Chrome extension interference (Global ErrorBoundary)
- [x] HouseholdBudget crash on portfolio.expenses
- [x] Xplan missing LHS navigation

## Backlog
- [ ] P3: Real email integration for Client Pack auto-delivery
- [ ] P3: What-If Budget scenario saving/comparison
