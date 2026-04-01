# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key) for copilot, whisper for voice
- **Market Data**: CoinGecko (live crypto, rate-limited gracefully)

## Sidebar Structure (Current)

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
- TOOLS: Notifications, Stress Test

### Client Context Mode
- OVERVIEW: Client Overview (4 tabs), Retirement, Tax Centre
- PLANNING: Goals & Scenarios, Actions, Budget (NEW)
- INVESTMENTS: All Investments (9 tabs)
- DOCUMENTS: Vault, Meeting Notes, Reports, Compliance

## Key Features Implemented

### Page Consolidation (30+ pages consolidated)
- [x] UnifiedDashboard / UnifiedClientOverview - Context-aware dashboard
- [x] UnifiedInvestments - 9 asset class tabs
- [x] UnifiedTaxCentre - 8 tax tools
- [x] UnifiedResearchCentre - 4 research tools
- [x] UnifiedComplianceCentre - 4 compliance tools
- [x] UnifiedGoalsPlanning - Goals & Scenarios + Monte Carlo
- [x] AdvisorCommandCenter - Dashboard + Daily Briefing + Decision Centre

### ErrorBoundary Implementation
- [x] ErrorBoundary component with retry functionality
- [x] All Suspense boundaries wrapped in ErrorBoundary across all unified pages
- [x] Global ErrorBoundary in App.js wrapping entire router

### Client Health Dashboard (NEW - Feb 2026)
- [x] RAG status for 5 demo clients (Drift, Compliance, Engagement, Risk Alignment, Performance)
- [x] Summary strip (Total, Healthy, At Risk, Critical, AUM, Overdue Tasks)
- [x] Search and filter (All/Red/Amber/Green)
- [x] Alert badges per client
- [x] Navigate to client context on click

### Portfolio Health Score Widget (NEW - Feb 2026)
- [x] Inline widget on Personal Dashboard
- [x] Drift, Concentration, Tax Efficiency, Risk Alignment, Diversification scores
- [x] Color-coded RAG indicators per metric
- [x] Overall aggregate score

### What-If Budget Mode (NEW - Feb 2026)
- [x] Toggle switch with Flask icon in HouseholdBudget header
- [x] Adjustment panel with 5 controls: Income Change %, Expense Change %, Extra Monthly Savings, Annual Lump Sum, Mortgage Rate (bps)
- [x] All charts and summary cards update in real-time
- [x] Reset button to clear adjustments

### Client Comparison View (NEW - Feb 2026)
- [x] Side-by-side 2-3 client selector
- [x] Key metrics grid (Net Worth, Income, Assets, Debt)
- [x] Radar chart for health metrics
- [x] Net Worth & Leverage bar chart
- [x] Asset Allocation comparison (horizontal bar)
- [x] Income vs Expenses breakdown

### Meeting Mode Enhancements (NEW - Feb 2026)
- [x] Keyboard shortcuts: Arrow keys (navigate), Escape (exit), F (fullscreen), 1-6 (jump to slide), Space (next)
- [x] PDF export via jsPDF (6 slides: Overview, Goals, Allocation, Family, Actions, Key Dates)
- [x] Keyboard hint indicator in top bar

### Auto-Email for Client Pack Scheduler (NEW - Feb 2026)
- [x] Email field in schedule creation form
- [x] Auto-email toggle switch
- [x] Auto-email badge on active schedules
- [x] MOCKED: No actual email delivery (needs email service integration)

### Previous Features (completed in earlier sessions)
- [x] Meeting Mode (6-slide presentation overlay)
- [x] Client context switching (5 distinct demo clients)
- [x] Redesigned Client360View
- [x] Budget Management (income, expenses, one-offs, cashflow)
- [x] AI Copilot with GPT-5.2
- [x] Voice Command engine (11 intents)
- [x] Client Pack Scheduler

## Bugs Fixed
- [x] SMSFOptimizer crash (optional chaining)
- [x] Webpack chunk load failures (ErrorBoundary)
- [x] Chrome extension interference (Global ErrorBoundary)
- [x] HouseholdBudget crash on portfolio.expenses
- [x] Bitcoin icon runtime error

## Backlog
- [ ] P3: Real email integration (SendGrid/Resend) for Client Pack auto-delivery
- [ ] P3: What-If Budget: scenario saving and comparison between scenarios
