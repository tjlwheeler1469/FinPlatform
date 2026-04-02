# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)

## Personal Dashboard Tab Structure (7 tabs)
1. **Overview**: Health Score, Retirement Readiness, Net Worth, Quick Actions, Smart Insights, Documents, Asset Allocation, Entity Breakdown, Rebalancing
2. **Net Worth**: FamilyWealthDashboard embedded
3. **Investments**: InvestmentsOverview (shared component — same data as /investments Overview)
4. **Retirement**: Full retirement readiness gauge
5. **Insights**: Full Smart Insights
6. **Wealth Trends**: NetWorthTrend embedded
7. **Transactions**: All investments sorted alphabetically with entity filter

## /investments Page Tab Structure (11 tabs)
1. Overview (InvestmentsOverview — matches Dashboard)
2. Shares & ETFs
3. Bonds
4. Property
5. Crypto
6. Cash & TDs
7. Super & Pension
8. SMSF
9. Managed Funds
10. Unlisted
11. Rebalancing (PortfolioRebalancing embedded)

## Sidebar Structure (All items alphabetical)

### Personal Mode
- DASHBOARD: Markets (LIVE), My Dashboard (HOME)
- INVESTMENTS: All Investments (NEW), Rebalancing
- PLANNING: Budget (NEW), Goals & Scenarios, Retirement (PRO)
- RESEARCH: Research Centre (NEW)
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
- OVERVIEW: Client Overview (Overview + Investments tabs), Retirement, Tax Centre
- PLANNING: Actions, Budget, Goals & Scenarios

## Shared Components
- **InvestmentsOverview** (`/components/InvestmentsOverview.jsx`): Portfolio summary with asset allocation pie, entity breakdown bar, top holdings, rebalancing. Uses `PORTFOLIO_ASSETS` and `REBALANCING_DATA` constants. Rendered in both Dashboard Investments tab and /investments Overview tab.
- **ErrorBoundary** (`/components/ErrorBoundary.jsx`): Wraps all Suspense boundaries
- **MeetingMode** (`/components/MeetingMode.jsx`): 6-slide presentation with keyboard shortcuts + PDF export

## Backlog
- [ ] P3: Real email integration for Client Pack auto-delivery
- [ ] P3: What-If Budget scenario saving/comparison
- [ ] P3: ComplianceModal "Don't show again" persistence across sessions
