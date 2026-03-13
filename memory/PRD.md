# Halcyon Wealth Operating System - PRD

## Vision
Transform from a "Financial Dashboard" to a "Wealth Operating System" - the operating system for your financial life.

**Current Rating Target: 10/10** 

## Original Problem Statement
Build a best-in-class AI-powered financial planning platform for the Australian market, targeting financial advisers and their clients. The platform should combine projections, scenario modeling, tax optimization, client collaboration, and automated data feeds.

---

## What's Been Implemented (March 13, 2026)

### ✅ DASHBOARD - FINANCIAL DECISION ENGINE
The dashboard has been completely transformed into a true **Financial Decision Engine**:

**Key Metrics Row:**
- Net Worth ($1,978,000) with YTD change
- Monthly Cashflow (+$5,417) with savings rate
- Goal Progress (3/4 on track) with visual indicators
- Retirement Success (Monte Carlo probability)

**Financial Health Score:**
- Large prominent gauge (74/100, Grade B)
- 5 component breakdown: Savings Rate, Debt Ratio, Emergency Fund, Retirement Readiness, Diversification
- Grade badges and status indicators

**Recommended Actions (THE CORE DECISION ENGINE):**
- 4 ranked actions with specific $ impact
- Total Potential Impact: +$609K
- HIGH IMPACT badges for priority actions
- "Take Action" buttons on hover
- Categories: Super, Debt, Savings, Tax

**Net Worth Projection:**
- Chart showing trajectory 2025 → 2040
- Wealth milestones (💰 $2M, 💎 $3M, 🏆 $4M)
- Target reference line

**Goal Progress:**
- 4 goals with progress bars
- On Track / Behind status badges
- Current vs Target amounts

**What-If Scenario Builder:**
- 4 adjustable sliders (Savings Rate, Market Return, Retirement Age, Inflation)
- Real-time impact calculations
- Save as Scenario functionality

### ✅ SCENARIO MODELING WITH STRESS TESTS
**Stress Test Presets:**
- 📉 Market Crash (-30%)
- 💹 High Inflation (6%)
- 💼 Job Loss (1 Year)
- 🏠 Property Crash (-20%)

**Comparison Features:**
- Side-by-side scenario comparison cards
- Net Worth Projection by Scenario chart
- Monte Carlo and AI Analysis options

### ✅ MONTE CARLO RETIREMENT ANALYSIS
- 10,000 simulation engine
- Success probability calculation
- Percentile projections (P5-P95)
- Adjustment recommendations if below target

### ✅ LIFE TIMELINE PLANNER
- Interactive visual timeline with life events
- Adjustable retirement age slider (50-70)
- Real-time projection updates
- Wealth milestones tracking
- Financial impact per event

### ✅ CLIENT CRM FOR ADVISERS
- Client list with search and status badges
- Tasks management with priority badges
- 6-stage Advice Workflow Pipeline
- Summary cards (Total Clients, AUM)

### ✅ AI FINANCIAL ADVISOR
- Live LLM integration (GPT-5.2 via Emergent LLM Key)
- Multi-LLM fallback support
- Structured AI responses
- Quick question shortcuts

### ✅ UI/UX IMPROVEMENTS
- Sidebar navigation collapsed by default
- Only active section expands automatically
- Bold uppercase section headers with gold highlighting
- Halcyon Wealth branding throughout

---

## Technical Architecture

### Frontend
- **Framework**: React 18 with React Router
- **UI Components**: Shadcn UI + Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Context (usePortfolio)
- **Branding**: Halcyon Wealth theme (Navy #1a2744, Gold #D4A84C)

### Backend
- **Framework**: FastAPI
- **Database**: MongoDB
- **AI Integration**: emergentintegrations library with Emergent LLM Key
- **Services**: Modular architecture with `/services/` directory

### Key Files
| Feature | Frontend | Backend |
|---------|----------|---------|
| Dashboard | `/pages/Dashboard.jsx` | Multiple endpoints |
| Decision Engine | `/pages/DecisionEngine.jsx` | `/services/decision_engine.py` |
| Life Timeline | `/pages/LifeTimelinePlanner.jsx` | `/services/life_timeline.py` |
| Client CRM | `/pages/ClientCRM.jsx` | `/services/client_crm.py` |
| AI Advisor | `/pages/AIAdvisor.jsx` | `server.py` (lines 5695-5900) |

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/decision-engine/health-score-v2` | POST | Calculate health score |
| `/api/decision-engine/recommendations-v2` | POST | Generate recommendations |
| `/api/decision-engine/monte-carlo-advanced` | POST | Advanced Monte Carlo |
| `/api/timeline/default` | GET | Get default timeline |
| `/api/timeline/calculate-impact` | POST | Calculate timeline impact |
| `/api/crm/clients` | GET | Get all clients |
| `/api/crm/tasks` | GET | Get tasks |
| `/api/crm/workflow/{client_id}` | GET | Get client workflow |
| `/api/ai/generate-advice` | POST | AI financial advice |
| `/api/ai/generate-scenarios` | POST | AI scenario generator |

---

## Mocked Data (IMPORTANT)
The following data is currently MOCKED and not connected to live sources:
- Portfolio data (Wheeler family demo)
- CRM clients (4 demo clients)
- Stock prices (ASX mock data)
- Property valuations
- Bank account feeds
- Connected Accounts display data

**NOW REAL:**
- ✅ Monte Carlo simulations (10,000 real iterations using numpy)
- ✅ Financial Health Score calculations
- ✅ Recommendation impact calculations

---

## Prioritized Backlog

### P0 - Critical (Complete)
- ✅ What-If Quick Toggle
- ✅ Decision Engine with recommendations
- ✅ Life Timeline Planner
- ✅ Client CRM
- ✅ AI Advisor integration
- ✅ AI Scenario Generator

### P1 - High Priority (Next)
1. **Live Data Integrations** - Connect to Australian banking APIs, brokerage accounts, superannuation funds
2. **Backend Refactoring** - Complete decomposition of 6000+ line server.py
3. **Real-time Data Feeds** - Replace mock data with live feeds

### P2 - Medium Priority
4. **Client Portal** - Dedicated portal for clients to view their data
5. **Document Management** - Upload, sign, and manage advice documents
6. **Mobile Responsiveness** - Optimize for mobile devices

### P3 - Future/Backlog
7. **PostgreSQL Migration** - Move from MongoDB to PostgreSQL
8. **SOC 2 Compliance** - Security and compliance architecture
9. **Marketplace Integration** - Mortgages, insurance, investments
10. **White-label Solution** - Multi-tenant for advisory firms

---

## Testing Status
- **Test Reports**: `/app/test_reports/iteration_35.json` through `iteration_39.json`
- **Backend**: 100% pass rate
- **Frontend**: 100% pass rate
- **Integration**: All APIs working correctly

---

## Changelog

### March 13, 2026 (Latest Session)
- ✅ **REAL Monte Carlo Simulation** - Implemented actual 10,000-iteration Monte Carlo simulation using numpy
  - Replaces mock static data with real calculated probabilities
  - Returns success_probability, median_outcome, best_case, worst_case, shortfall_risk
  - Dashboard now shows dynamic, varying results based on real calculations
- ✅ **Compliance Modal Bug Fixed** - Modal now only appears once on first visit
  - Fixed localStorage persistence using useEffect instead of module-level variable
  - Keys: `wheeler_compliance_acknowledged`, `halcyon_compliance_v2`
  - No longer reappears on navigation between pages
- ✅ **What-If Scenario Builder** - Now triggers real Monte Carlo recalculations
  - 4 adjustable sliders update Monte Carlo results in real-time
  - Shows updated probabilities and projected balances

### March 13, 2026 (Earlier)
- ✅ Completed Phase 1-4 implementation
- ✅ Added What-If Quick Toggle to Dashboard
- ✅ Created Decision Engine page with health score and recommendations
- ✅ Built Life Timeline Planner with adjustable retirement age
- ✅ Implemented Client CRM with workflow pipeline
- ✅ Integrated AI Advisor with live LLM (Emergent LLM Key)
- ✅ Added AI Scenario Generator endpoint

### Previous Sessions
- Halcyon Wealth rebranding
- Simplified navigation (6-section sidebar)
- Command Center dashboard
- Scenario Comparison page
- Encrypted mock data feeds (AES-256-GCM)
- Backend service modularization started
