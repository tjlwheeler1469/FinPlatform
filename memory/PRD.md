# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)

## Adviser Client Overview Tab Structure (5 tabs)
1. **Overview**: PersonalDashboard embedded (Health Score, Retirement, Net Worth, Quick Actions, Smart Insights, Documents, Allocations, Rebalancing)
2. **Actions**: NextBestActions embedded
3. **Retirement**: RetirementConfidence embedded
4. **Tax Centre**: UnifiedTaxCentre embedded (custom button-based tabs — NOT Radix Tabs)
5. **Transactions**: UnifiedInvestments embedded

## Tax Centre Sub-Tabs (8 tabs, alphabetical after Tax Analysis)
Tax Analysis, BAS Calculator, Capital Gains, Division 7A, Tax Loss Harvesting, Income Splitting, Tax Calendar, Trust Distributions

## Personal Dashboard Tab Structure (7 tabs)
1. **Overview**: Health Score, Retirement Readiness, Net Worth, Quick Actions, Smart Insights, Documents, Asset Allocation, Entity Breakdown, Rebalancing
2. **Net Worth**: FamilyWealthDashboard embedded
3. **Investments**: InvestmentsOverview (shared component)
4. **Retirement**: Full retirement readiness gauge
5. **Insights**: Full Smart Insights
6. **Wealth Trends**: NetWorthTrend embedded
7. **Transactions**: All investments sorted alphabetically with entity filter

## /investments Page Tab Structure (11 tabs, alphabetical after Overview)
Overview, Bonds, Cash & TDs, Crypto, Managed Funds, Property, Rebalancing, Shares & ETFs, SMSF, Super & Pension, Unlisted

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
- OVERVIEW: Client Overview (5 tabs: Overview, Actions, Retirement, Tax Centre, Transactions)
- PLANNING: Budget, Goals & Scenarios

## Key Technical Patterns
- **`embedded={true}` prop**: Components check `if (embedded) return content; else return <Layout>{content}</Layout>;`
- **Custom button tabs**: UnifiedTaxCentre and TaxLossHarvesting use custom buttons (NOT Radix Tabs) to avoid nested context conflicts
- **ErrorBoundary + Suspense**: Every lazy-loaded component is wrapped in both

## Shared Components
- **InvestmentsOverview** (`/components/InvestmentsOverview.jsx`): Portfolio summary with asset allocation pie, entity breakdown bar, top holdings, rebalancing
- **ErrorBoundary** (`/components/ErrorBoundary.jsx`): Wraps all Suspense boundaries
- **MeetingMode** (`/components/MeetingMode.jsx`): 6-slide presentation with keyboard shortcuts + PDF export

## Completed (as of 2 April 2026)
- [x] Fixed nested tab switching in UnifiedTaxCentre (replaced Radix Tabs with custom buttons)
- [x] Fixed Tax Loss Harvesting analysis (client-side calculation, removed usePortfolio dependency)
- [x] Investment tabs alphabetically sorted
- [x] Renamed Investments to Transactions on client overview
- [x] Added Retirement and Tax Centre to client overview
- [x] Moved Actions from Planning to Overview tabs
- [x] Tax Centre sub-tabs alphabetically sorted
- [x] SMSFOptimizer runtime crashes fixed
- [x] ErrorBoundary global and component-level
- [x] ClientHealthDashboard and ClientComparison created
- [x] What-If Budget toggle in HouseholdBudget
- [x] jsPDF export in MeetingMode
- [x] Portfolio Health Score widget
- [x] PersonalDashboard restructured (7 tabs)
- [x] InvestmentsOverview shared component
- [x] Dashboard & Daily Briefing merged in AdvisorCommandCenter
- [x] Xplan integration LHS sidebar layout fixed
- [x] Alphabetical sorting in nav and tabs

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: ComplianceModal "Don't show again" persistence across sessions
- [ ] P2: Wealth Trend / Health Score duplicate removal verification
- [ ] P2: Budget Calculator Investment Callout verification
- [ ] P3: Client Onboarding Wizard
