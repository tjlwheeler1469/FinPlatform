# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Centralized Data**: `/app/frontend/src/data/clientData.js` — single source of truth for all 7 client profiles

## Client Profiles (all in clientData.js)
| ID | Name | Net Worth | Age | Risk | Retire |
|----|------|-----------|-----|------|--------|
| thompson_family | David & Sarah Thompson | $1,608,800 | 50 | Balanced | 67 |
| chen_family | Michael & Lisa Chen | $5,200,000 | 49 | Balanced | 60 |
| client_3 | Robert Mitchell | $1,450,000 | 62 | Conservative | 65 |
| client_4 | Emma & David Williams | $615,000 | 39 | TBD | 67 |
| client_5 | Raj & Priya Patel | $3,100,000 | 54 | Aggressive | 60 |
| client_6 | Anderson Partnership | $4,200,000 | 59 | Balanced | 65 |
| client_7 | Sarah Kim | $1,625,000 | 34 | Aggressive | 55 |

## Key Features
### Scenario Engine (Goals tab)
Connected flow: Budget → Investments → Portfolio → Retirement
- Save/compare multiple scenarios with delta indicators
- Adjustable sliders: expenses, extra savings, contributions, return, retirement age, spending
- Comparison table with confidence scores
- Per-client data isolation

### Views
- **Personal** (`/dashboard`): 5 tabs, full LHS nav
- **Client Portal** (`/client-portal`): 6 tabs (with Investments), minimal LHS nav
- **Adviser Client** (`/dashboard` adviser mode): 8 outer tabs, 6 inner tabs
- **Client Portal Simplified**: Hero gauge, plain English, improvement actions

## Completed (as of 15 April 2026)
- [x] P3: Centralized client data module + eliminated ALL Wheeler references (38+ files)
- [x] P2: What-If Scenario Engine with Budget→Investments→Portfolio→Retirement flow
- [x] All 7 client profiles with isolated data across all views
- [x] lazyRetry wrapper on all lazy imports
- [x] Tab styling, Budget tab, Goals removal from sidebar, Rebalancing+Radar
- [x] Client Profile dashboard, Runtime error suppression

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: Enhanced scenario engine — trajectory charts, Monte Carlo integration
- [ ] P3: Replace Mock Xplan integration with real API
