# Wealth Command v7.8 - Product Requirements Document

## Original Problem Statement
Create a "financial services super app" named "Wealth Command," evolving it from a simple dashboard into a comprehensive "Wealth Operating System" for financial advisers. The core architecture is a **Financial Knowledge Graph** using a hybrid MongoDB and Neo4j database.

## User Personas
1. **Financial Advisers** - Primary users who manage multiple client portfolios
2. **Individual Investors** - Users managing their own wealth with personal/joint/company/trust/SMSF structures
3. **High Net Worth Clients** - Clients of advisers who use the client portal

## Core Requirements

### Completed Features (March 2026)

#### Phase 1-6: Foundation & Core Features
- ✅ Full-stack React/FastAPI application
- ✅ MongoDB integration for data persistence
- ✅ Comprehensive dashboard system (Daily Briefing, Retirement Tracker, etc.)
- ✅ Stock Trading with CGT calculations
- ✅ Bonds Trading, Hybrids Trading, Crypto Portfolio pages
- ✅ Cash & Term Deposits, Managed Funds, Property Portfolio
- ✅ Tax Analysis & CGT tracking
- ✅ AI Advisor integration (Emergent LLM Key)

#### Phase 7: Advisor Mode & CRM
- ✅ Advisor Command Center with 10-zone layout
- ✅ Client 360 View with Bonds, Hybrids, Crypto asset categories
- ✅ Transaction Modeler with 7 asset types (Property, Fund, Stock, ETF, Bonds, Hybrids, Crypto)
- ✅ Meeting Notes with Fathom integration (mock mode)
- ✅ Adviser Hub (Combined CRM)

#### Phase 7.5-7.7: UI/UX & Live Price Feeds
- ✅ Performance optimizations (parallel yfinance)
- ✅ Navigation restructure (Net Worth first, Crypto/Hybrids added)
- ✅ Multi-Structure Asset Viewing (Personal/Joint/Company/Trust/SMSF)
- ✅ MongoDB Persistence for Client Contact & Financial Plans
- ✅ Live Crypto Prices (CoinGecko API)
- ✅ Live Hybrid Prices (ASX via yfinance)

#### Phase 7.8: UI Improvements & Client Portal (March 18, 2026)
- ✅ **ScenarioModelling Page Redesign**:
  - Clean card design matching FamilyWealthDashboard
  - Light backgrounds instead of dark gradients
  - Simple 4 tabs (Goals, Assets, Scenario, Projection) without icons
  - Improved readability and accessibility

- ✅ **Knowledge Graph Dashboard**:
  - Removed confusing "Graph" tab
  - Now has 5 tabs: Insights, Overview, Actions, Risks, Opportunities
  - Default tab is "Insights"

- ✅ **Transaction Modeler Expanded**:
  - Now has 7 tabs: Property, Fund, Stock, ETF, Bonds, Hybrids, Crypto
  - Bonds tab: bond_type, yield_to_maturity, maturity_years, credit_rating
  - Hybrids tab: margin_over_bbsw, running_yield calculation, franking

- ✅ **Client Portal - All Asset Types**:
  - 5 portfolios: Growth Portfolio, Fixed Income & Hybrids, Cryptocurrency, Cash & Term Deposits, Superannuation
  - Net worth breakdown: stocks, etfs, managed_funds, bonds, hybrids, crypto, cash, super, property
  - Holdings include type field (stock, etf, fund, bond, hybrid, crypto, cash, term_deposit)

### Asset Categories Available
| Category | Personal | Adviser Client | Client Portal |
|----------|----------|----------------|---------------|
| Stocks | ✅ | ✅ | ✅ |
| ETFs | ✅ | ✅ | ✅ |
| Managed Funds | ✅ | ✅ | ✅ |
| Bonds | ✅ | ✅ | ✅ |
| Hybrids | ✅ | ✅ | ✅ |
| Crypto | ✅ | ✅ | ✅ |
| Cash/TDs | ✅ | ✅ | ✅ |
| Property | ✅ | ✅ | ✅ |
| Super | ✅ | ✅ | ✅ |

### In Progress / Mocked Features
- 🔶 Knowledge Graph data (mock EmbeddedGraph)
- 🔶 Fathom Integration (requires API key)
- 🔶 Some ASX hybrid prices (simulated when unavailable)

### Backlog (P2/P3)
- P2: Integrate real MongoDB data into Knowledge Graph
- P2: More ASX data sources for hybrids
- P3: Mobile app wrapper
- P3: Voice interface (Whisper)

## Technical Architecture

### Frontend Pages
```
/app/frontend/src/pages/
├── ScenarioModelling.jsx    # REDESIGNED - clean cards
├── KnowledgeGraphDashboard.jsx # 5 tabs, no graph
├── TransactionModeler.jsx   # 7 asset type tabs
├── ClientPortal.jsx         # All asset types
├── Client360View.jsx        # Bonds, Hybrids, Crypto
├── CryptoPortfolio.jsx      # Live prices
├── HybridsTrading.jsx       # Live prices
└── FamilyWealthDashboard.jsx # Multi-structure view
```

### Key Endpoints
- `GET /api/client-portal/portfolios/{client_id}` - All asset types
- `GET /api/crypto/portfolio/value` - Live crypto values
- `GET /api/hybrids/portfolio/value` - Live hybrid values
- `POST /api/client-contact/send-message` - MongoDB persistence
- `POST /api/financial-plan/generate` - MongoDB persistence

## Testing Status
- ✅ Backend: 100% (iteration_85)
- ✅ Frontend: All features verified
- ✅ ScenarioModelling: Clean design verified
- ✅ KnowledgeGraph: 5 tabs, no Graph
- ✅ TransactionModeler: 7 tabs with Bonds/Hybrids
- ✅ Client Portal: All asset types in portfolios

---
*Last Updated: March 18, 2026 - Version 7.8*
