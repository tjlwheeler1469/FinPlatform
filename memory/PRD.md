# Halcyon Wealth Operating System - PRD

## Vision
Transform from a "Financial Dashboard" to a "Wealth Operating System" - the operating system for your financial life.

## Original Problem Statement
Build a best-in-class AI-powered financial planning platform for the Australian market, targeting financial advisers and their clients. The platform should combine projections, scenario modeling, tax optimization, client collaboration, and automated data feeds.

---

## What's Been Implemented (March 13, 2026)

### ✅ Phase 1: Decision Engine Core - COMPLETE
**Financial Health Score**
- Comprehensive 0-100 scoring system
- 5 components: Savings Rate, Debt Level, Liquidity, Retirement Readiness, Diversification
- Grade assignment (A+ to D)

**Smart Recommendations Engine**
- 6 actionable recommendations with specific $ impact
- Categories: Super, Debt, Tax, Savings, Property, Investment
- Difficulty ratings and timeframes
- Total potential impact calculation

**Advanced Monte Carlo Simulation**
- 10,000 scenario simulation
- Success probability calculation
- Percentile projections (P5 to P95)
- Adjustment needed calculation if below target

### ✅ Phase 2: Visual Planning - COMPLETE
**Life Timeline Planner** (`/life-timeline`)
- Interactive visual timeline with life events
- Adjustable retirement age slider (50-70)
- Real-time projection updates
- Wealth milestones (Six Figures → High Net Worth)
- Financial impact display (+/- amounts)

**What-If Scenario Builder** (Dashboard)
- 4 adjustable sliders:
  - Savings Rate (5-50%)
  - Market Return (2-12%)
  - Retirement Age (50-70)
  - Inflation (1-6%)
- Real-time impact calculations
- "Modified" badge and Reset functionality
- Save as Scenario option

### ✅ Phase 3: Adviser Platform - COMPLETE
**Client CRM** (`/clients`)
- Summary cards (Total Clients, Active, Prospects, Review Due, Total AUM)
- Client list with search functionality
- Contact details, net worth, income, status badges
- Notes and tasks count per client

**Tasks Management**
- Priority badges (urgent/high/medium/low)
- Due dates with overdue highlighting
- Category filtering

**Advice Workflow Pipeline**
- 6-stage workflow: Discovery → Analysis → Strategy → Presentation → Implementation → Review
- Progress visualization per client
- Stage-specific tasks and documents

### ✅ Phase 4: Intelligence Layer - COMPLETE
**AI Financial Advisor** (`/ai-advisor`)
- Live LLM integration (GPT-5.2 via Emergent LLM Key)
- Multi-LLM fallback support
- Quick question shortcuts
- Structured AI responses with:
  - Financial health analysis
  - Key strengths and areas to improve
  - Ranked recommendations with confidence scores
  - Retirement outlook
  - Australian tax compliance disclaimers

**AI Scenario Generator** (`/api/ai/generate-scenarios`)
- Risk tolerance-based scenario generation
- 3 scenarios: Conservative, Balanced, Aggressive/Early Retirement
- Projection calculations for each scenario
- Key actions per scenario
- Pros/cons analysis

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
- **Test Reports**: `/app/test_reports/iteration_35.json` through `iteration_37.json`
- **Backend**: 100% pass rate
- **Frontend**: 100% pass rate
- **Integration**: All APIs working correctly

---

## Changelog

### March 13, 2026
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
