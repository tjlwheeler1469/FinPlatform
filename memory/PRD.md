# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key) for copilot, whisper for voice
- **Market Data**: CoinGecko (live crypto, rate-limited gracefully)

## Key Features Implemented

### Page Consolidation
- [x] UnifiedDashboard.jsx - Overview, Net Worth, Wealth Trends tabs
- [x] UnifiedInvestments.jsx - 8 tabs: Shares, Bonds, Property, Crypto, Cash & TDs, Super & Pension, Managed Funds, Unlisted
- [x] AdvisorCommandCenter.jsx - Dashboard + Decision Centre tabs (merged)
- [x] 15+ standalone pages replaced with tabbed views + redirects

### Client Management
- [x] Client context switching via PortfolioProvider + localStorage
- [x] Distinct DEMO_CLIENT_DATA for 5 clients (Wheeler, Chen, Mitchell, Williams, Patel)
- [x] Redesigned Client360View with dark header, gold initials, info strip, metrics bar
- [x] Client Hub (AdviserHub) with all client cards

### Investments
- [x] All 8 asset class tabs in unified view
- [x] Cash & TDs with savings accounts and term deposits
- [x] Super & Pension with superannuation guarantee calculator
- [x] Sidebar links for Cash & TDs and Super & Pension

### AI & Automation
- [x] Voice Command engine (11 intents including Client Pack generation)
- [x] AI Copilot with GPT-5.2
- [x] Client Pack Scheduler API
- [x] Knowledge Graph visualization (react-force-graph-2d)

### Navigation
- [x] Xplan under Integrations section
- [x] Decision Center redirects to Command Centre
- [x] Personal/Adviser/Client mode switching

### Data & Markets
- [x] Live CoinGecko crypto data with rate-limit fallback
- [x] 400+ backend lint errors fixed
- [x] 100% backend test pass rate

## Completed This Session (Apr 2026)
- [x] Fixed Bitcoin icon runtime error (webpack cache)
- [x] Fixed client data mismatch (Wheeler showing for all clients)
- [x] Added Cash & TDs tab to UnifiedInvestments
- [x] Added Super & Pension tab to UnifiedInvestments
- [x] Added Cash & TDs and Super & Pension to sidebar navigation
- [x] Merged Decision Centre into Command Centre as tab
- [x] Redesigned Client360View header (dark bg, gold avatar, info strip, metrics)
- [x] All 12 features tested - 100% pass rate

## Backlog
- [ ] P2: Client comparison view (side-by-side 2-3 clients)
- [ ] P2: Auto-email delivery for Client Pack Scheduler
- [ ] P3: Review remaining standalone pages for further consolidation
