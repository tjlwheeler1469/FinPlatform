# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)

## Adviser Client Overview Tab Structure (5 tabs)
1. **Overview**: PersonalDashboard embedded
2. **Actions**: NextBestActions embedded
3. **Retirement**: RetirementConfidence embedded
4. **Tax Centre**: UnifiedTaxCentre embedded (custom button-based tabs)
5. **Investments**: UnifiedInvestments embedded (10 sub-tabs, no Rebalancing)

## Tax Centre Sub-Tabs (8 tabs)
Tax Analysis, BAS Calculator, Capital Gains, Division 7A, Tax Loss Harvesting, Income Splitting, Tax Calendar, Trust Distributions

## Personal Dashboard Tab Structure (5 tabs)
1. **Overview**: Health Score, Retirement, Net Worth, Quick Actions, Smart Insights
2. **Net Worth**: FamilyWealthDashboard embedded
3. **Wealth Trends**: NetWorthTrend embedded
4. **Insights**: Full Smart Insights
5. **Transactions**: All investments sorted alphabetically with entity filter

## /investments Page Tab Structure (10 tabs, alphabetical after Overview)
Overview, Bonds, Cash & TDs, Crypto, Managed Funds, Property, Shares & ETFs, SMSF, Super & Pension, Unlisted

## Sidebar Structure

### Personal Mode
- DASHBOARD: Markets (LIVE), My Dashboard (HOME)
- INVESTMENTS: All Investments (NEW), Rebalancing
- PLANNING: Budget (NEW), Goals & Scenarios, Retirement (PRO), Tax Centre (NEW)
- RESEARCH: Research Centre (NEW)
- SETTINGS: Bank Feeds, Documents, Import/Export, Security
- TOOLS: Loan Calculator

### Adviser Mode (No client selected)
- AI & TASKS: AI Assistant, Meeting Prep
- COMPLIANCE: Compliance Centre, Security
- CRM: Client Hub, Health Dashboard (NEW)
- DASHBOARD: Dashboard, Markets (LIVE)
- EXECUTION: Batch Execute
- INTEGRATIONS: Live Sync, Platforms, Xplan Sync
- TOOLS: Notifications

### Client Context Mode (Client selected)
- DOCUMENTS: Compliance, Meeting Notes, Reports, Vault
- OVERVIEW: Client Overview (5 tabs)
- PLANNING: Budget, Goals & Scenarios

## Key Technical Patterns
- **`embedded={true}` prop**: Components check `if (embedded) return content; else return <Layout>{content}</Layout>;`
- **Custom button tabs**: UnifiedTaxCentre and TaxLossHarvesting use custom buttons (NOT Radix Tabs) to avoid nested context conflicts
- **ErrorBoundary + Suspense**: Every lazy-loaded component is wrapped in both

## Completed (as of 2 April 2026)
- [x] Fixed nested tab switching (replaced Radix Tabs with custom buttons)
- [x] Fixed Tax Loss Harvesting analysis (client-side calc)
- [x] Renamed Transactions to Investments on client overview
- [x] Removed Rebalancing from investment tabs
- [x] Personal dashboard: 5 tabs (Overview, Net Worth, Wealth Trends, Insights, Transactions)
- [x] Moved Tax Centre from Tools to Planning sidebar
- [x] Removed Compare Clients from adviser CRM
- [x] Renamed Command Center to Dashboard
- [x] Removed Market Intelligence, AI Knowledge Graph, Knowledge Graph Visualization from Adviser Dashboard
- [x] Removed DailyBriefing/Meeting Prep/Schedule below disclaimer
- [x] All previous work (ErrorBoundary, ClientHealth, Budget What-If, MeetingMode PDF, etc.)

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: ComplianceModal "Don't show again" persistence
- [ ] P2: Budget Calculator Investment Callout verification
- [ ] P3: Client Onboarding Wizard
