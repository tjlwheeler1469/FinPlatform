# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key) for copilot, whisper for voice
- **Market Data**: CoinGecko (live crypto, rate-limited gracefully)

## Sidebar Structure (Current)

### Personal Mode
- DASHBOARD: My Dashboard (HOME), Markets (LIVE)
- PLANNING: Retirement (PRO), Goals & Scenarios, Budget (NEW), Rebalancing, Research Centre (NEW)
- INVESTMENTS: All Investments (9 tabs: Shares, Bonds, Property, Crypto, Cash & TDs, Super & Pension, SMSF, Managed Funds, Unlisted)
- TOOLS: Tax Centre (NEW), Loan Calculator
- SETTINGS: Security, Bank Feeds, Import/Export, Documents

### Adviser Mode
- DASHBOARD: Command Center (3 tabs: Dashboard + Daily Briefing + Decision Centre), Markets (LIVE)
- CRM: Client Hub
- AI & TASKS: AI Assistant, Meeting Prep
- EXECUTION: Batch Execute
- COMPLIANCE: Compliance Centre (NEW), Security
- INTEGRATIONS: Xplan, Platforms, Live Sync
- TOOLS: Notifications, Stress Test

### Client Context Mode
- OVERVIEW: Client Overview (5 tabs: Overview + Net Worth + Wealth Trends + Health Score + Goals & Scenarios), Retirement, Tax Centre
- PLANNING: Actions, Budget (NEW)
- INVESTMENTS: All Investments (9 tabs)
- DOCUMENTS: Vault, Meeting Notes, Reports, Compliance

## Key Features Implemented

### Page Consolidation (30+ pages consolidated)
- [x] UnifiedDashboard / UnifiedClientOverview — Context-aware dashboard
- [x] UnifiedInvestments — 9 asset class tabs
- [x] UnifiedTaxCentre — 8 tax tools
- [x] UnifiedResearchCentre — 4 research tools
- [x] UnifiedComplianceCentre — 4 compliance tools
- [x] UnifiedGoalsPlanning — Goals & Scenarios + Monte Carlo
- [x] AdvisorCommandCenter — Dashboard + Daily Briefing + Decision Centre

### Meeting Mode
- [x] Full-screen presentation overlay (6 slides)
- [x] Triggered from Client360View header

### Client Management
- [x] Client context switching (5 distinct demo clients)
- [x] Redesigned Client360View
- [x] DashboardRouter — context-aware routing

### Budget Management
- [x] HouseholdBudget with income, expenses, one-offs, cashflow projection
- [x] Available in both Personal and Client context modes
- [x] Safe access to portfolio data (optional chaining)

### AI & Automation
- [x] Voice Command engine (11 intents)
- [x] AI Copilot with GPT-5.2
- [x] Client Pack Scheduler

## Bugs Fixed This Session
- [x] Design error: DecisionEngine header hidden when embedded in Health Score tab
- [x] Design error: DailyBriefing header hidden when embedded
- [x] Runtime error: HouseholdBudget crash on `portfolio.expenses.health_insurance` - added optional chaining
- [x] Note: "Response body already used" error is from Chrome extension (frame_ant), not app code

## Backlog
- [ ] P2: Client comparison view (side-by-side 2-3 clients)
- [ ] P2: Auto-email delivery for Client Pack Scheduler
- [ ] P3: Keyboard shortcuts for Meeting Mode
- [ ] P3: Export Meeting Mode slides as PDF
