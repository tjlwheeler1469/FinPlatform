# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key) for copilot, whisper for voice
- **Market Data**: CoinGecko (live crypto, rate-limited gracefully)

## Key Features Implemented

### Page Consolidation (Phase 1 - Sessions 1-3)
- [x] UnifiedDashboard.jsx - Overview, Net Worth, Wealth Trends tabs
- [x] UnifiedInvestments.jsx - 8 tabs: Shares, Bonds, Property, Crypto, Cash & TDs, Super & Pension, Managed Funds, Unlisted
- [x] AdvisorCommandCenter.jsx - Dashboard + Decision Centre tabs (merged)
- [x] 15+ standalone pages replaced with tabbed views + redirects

### Page Consolidation (Phase 2 - Current Session)
- [x] UnifiedTaxCentre.jsx - 8 tabs: Tax Analysis, Capital Gains, Tax Loss Harvesting, Tax Calendar, BAS Calculator, Income Splitting, Trust Distributions, Division 7A
- [x] UnifiedResearchCentre.jsx - 4 tabs: Stock Research, Broker Research, Investment Comparison, Property Comparison
- [x] UnifiedComplianceCentre.jsx - 4 tabs: AdviceOS, Compliance Dashboard, Breach Register, Risk Controls
- [x] 15+ additional redirect routes for old standalone pages

### Meeting Mode Enhancement
- [x] Full-screen presentation overlay (MeetingMode.jsx)
- [x] 6 slides: Client Overview, Financial Goals, Asset Allocation, Family, Action Items, Key Dates
- [x] Previous/Next navigation with dot indicators
- [x] Exit button returns to normal view
- [x] Triggered from "Meeting" button in Client360View header

### Client Management
- [x] Client context switching via PortfolioProvider + localStorage
- [x] Distinct DEMO_CLIENT_DATA for 5 clients (Wheeler, Chen, Mitchell, Williams, Patel)
- [x] Redesigned Client360View with dark header, gold initials, info strip, metrics bar
- [x] Client Hub (AdviserHub) with all client cards

### Investments
- [x] All 8 asset class tabs in unified view
- [x] Cash & TDs with savings accounts and term deposits
- [x] Super & Pension with superannuation guarantee calculator

### AI & Automation
- [x] Voice Command engine (11 intents including Client Pack generation)
- [x] AI Copilot with GPT-5.2
- [x] Client Pack Scheduler API
- [x] Knowledge Graph visualization (react-force-graph-2d)

### Navigation
- [x] Xplan under Integrations section
- [x] Tax Centre (NEW) replaces 5 separate tax tools in sidebar
- [x] Research Centre (NEW) replaces stock/broker/comparison in sidebar
- [x] Compliance Centre (NEW) replaces AdviceOS/Enterprise/Breach/Risk in sidebar
- [x] Decision Center redirects to Command Centre

### Data & Markets
- [x] Live CoinGecko crypto data with rate-limit fallback
- [x] 400+ backend lint errors fixed
- [x] 100% backend test pass rate

## Route Consolidation Summary
| Old Routes | New Route | Via |
|---|---|---|
| /cgt, /tax-loss-harvesting, /tax-calendar, /bas-calculator, /income-splitting, /trust-distributions, /division-7a, /historical-tax, /salary-packaging | /tax-analysis-sync | UnifiedTaxCentre |
| /broker-research, /investment-comparison, /property-comparison | /stock-research | UnifiedResearchCentre |
| /enterprise, /breach-register, /risk-control | /adviceos | UnifiedComplianceCentre |
| /decision-center | /advisor-command-center | AdvisorCommandCenter |
| /bonds-trading, /crypto-portfolio, /managed-funds, /unlisted-investments | /investments | UnifiedInvestments |

## Backlog
- [ ] P2: Client comparison view (side-by-side 2-3 clients)
- [ ] P2: Auto-email delivery for Client Pack Scheduler
- [ ] P3: Keyboard shortcuts for Meeting Mode (arrow keys)
- [ ] P3: Print/export Meeting Mode slides as PDF
