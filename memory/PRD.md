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
- PLANNING: Retirement (PRO), Goals & Scenarios, Rebalancing, Research Centre (NEW)
- INVESTMENTS: All Investments (NEW) — 9 tabs: Shares, Bonds, Property, Crypto, Cash & TDs, Super & Pension, SMSF, Managed Funds, Unlisted
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
- PLANNING: Actions
- INVESTMENTS: All Investments (9 tabs)
- DOCUMENTS: Vault, Meeting Notes, Reports, Compliance

## Key Features Implemented

### Page Consolidation (Phase 1)
- [x] UnifiedDashboard.jsx — Overview, Net Worth, Wealth Trends tabs
- [x] AdvisorCommandCenter.jsx — Dashboard + Daily Briefing + Decision Centre tabs
- [x] 15+ standalone pages replaced with tabbed views + redirects

### Page Consolidation (Phase 2)
- [x] UnifiedTaxCentre.jsx — 8 tax pages combined
- [x] UnifiedResearchCentre.jsx — 4 research pages combined
- [x] UnifiedComplianceCentre.jsx — 4 compliance pages combined

### Page Consolidation (Phase 3 — Current Session)
- [x] UnifiedInvestments.jsx — 9 tabs (added SMSF from SMSF Optimizer)
- [x] UnifiedGoalsPlanning.jsx — Goals & Scenarios + Monte Carlo combined
- [x] UnifiedClientOverview.jsx — Overview + Net Worth + Wealth Trends + Health Score + Goals & Scenarios
- [x] AdvisorCommandCenter.jsx — Added Daily Briefing as a tab
- [x] Sidebar simplified: removed duplicate entries (Cash & TDs, Super, Monte Carlo, SMSF, Daily Briefing)
- [x] Research Centre moved from Tools to Planning
- [x] Tax Centre moved to Overview in client context

### Meeting Mode
- [x] Full-screen presentation overlay (MeetingMode.jsx)
- [x] 6 slides: Client Overview, Goals, Assets, Family, Actions, Key Dates
- [x] Triggered from "Meeting" button in Client360View header

### Client Management
- [x] Client context switching via PortfolioProvider + localStorage
- [x] Distinct DEMO_CLIENT_DATA for 5 clients
- [x] Redesigned Client360View with dark header, gold initials
- [x] DashboardRouter — context-aware routing (personal vs client)

### AI & Automation
- [x] Voice Command engine (11 intents)
- [x] AI Copilot with GPT-5.2
- [x] Client Pack Scheduler API
- [x] Knowledge Graph visualization

## Route Consolidation Summary
| Old Routes | New Route | Via |
|---|---|---|
| /monte-carlo | /scenario-modelling | UnifiedGoalsPlanning |
| /smsf-optimizer | /investments | UnifiedInvestments (SMSF tab) |
| /daily-briefing | /advisor-command-center | AdvisorCommandCenter (tab) |
| /decision-engine | /dashboard | UnifiedClientOverview (Health tab) |
| /cash-deposits, /super-pension | /investments | UnifiedInvestments (tabs) |
| /cgt, /tax-loss-harvesting, /tax-calendar, /bas-calculator, etc. | /tax-analysis-sync | UnifiedTaxCentre |
| /broker-research, /investment-comparison, /property-comparison | /stock-research | UnifiedResearchCentre |
| /enterprise, /breach-register, /risk-control | /adviceos | UnifiedComplianceCentre |
| /decision-center | /advisor-command-center | AdvisorCommandCenter |

## Backlog
- [ ] P2: Client comparison view (side-by-side 2-3 clients)
- [ ] P2: Auto-email delivery for Client Pack Scheduler
- [ ] P3: Keyboard shortcuts for Meeting Mode
- [ ] P3: Export Meeting Mode slides as PDF
