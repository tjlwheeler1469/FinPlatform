# Wealth Command v7.9 - Product Requirements Document

## Original Problem Statement
Create a "financial services super app" named "Wealth Command," evolving it from a simple dashboard into a comprehensive "Wealth Operating System" for financial advisers. The core architecture is a **Financial Knowledge Graph** using a hybrid MongoDB and Neo4j database.

## User Personas
1. **Financial Advisers** - Primary users who manage multiple client portfolios
2. **Individual Investors** - Users managing their own wealth with personal/joint/company/trust/SMSF structures
3. **High Net Worth Clients** - Clients of advisers who use the client portal

## Core Requirements

### Completed Features (March 2026)

#### Phase 1-6: Foundation & Core Features
- Full-stack React/FastAPI application
- MongoDB integration for data persistence
- Comprehensive dashboard system (Daily Briefing, Retirement Tracker, etc.)
- Stock Trading with CGT calculations
- Bonds Trading, Hybrids Trading, Crypto Portfolio pages
- Cash & Term Deposits, Managed Funds, Property Portfolio
- Tax Analysis & CGT tracking
- AI Advisor integration (Emergent LLM Key)

#### Phase 7: Advisor Mode & CRM
- Advisor Command Center with 10-zone layout
- Client 360 View with Bonds, Hybrids, Crypto asset categories
- Transaction Modeler with 7 asset types (Property, Fund, Stock, ETF, Bonds, Hybrids, Crypto)
- Meeting Notes with Fathom integration (mock mode)
- Adviser Hub (Combined CRM)

#### Phase 7.5-7.8: UI/UX & Live Price Feeds
- Performance optimizations (parallel yfinance)
- Navigation restructure (Net Worth first, Crypto/Hybrids added)
- Multi-Structure Asset Viewing (Personal/Joint/Company/Trust/SMSF)
- MongoDB Persistence for Client Contact & Financial Plans
- Live Crypto Prices (CoinGecko API)
- Live Hybrid Prices (ASX via yfinance)
- ScenarioModelling Page Redesign (clean cards, light theme)
- Knowledge Graph Dashboard (5 tabs, removed confusing graph)
- Transaction Modeler Expanded (7 asset types with Bonds/Hybrids)
- Client Portal with all asset types

#### Phase 7.9: UI Fixes & Visualizations (March 19, 2026)
- **ScenarioModelling Light Theme Fix**:
  - Replaced all dark navy backgrounds (bg-[#1a1a2e]) with light themed alternatives (bg-card, bg-muted)
  - Fixed text colors to use foreground/muted-foreground for proper contrast
  - Updated chart tooltip styles to use light backgrounds
  - Improved input and select field styling

- **Financial Goals CRUD**:
  - Added "Add Goal" dialog with form fields (name, target, current, deadline, priority, category)
  - Added edit functionality with pre-filled dialog
  - Added delete functionality with confirmation
  - Goal cards now show edit and delete action buttons
  - All goals managed in React state

- **Client Portal Visualizations**:
  - Added Recharts pie chart for net worth breakdown with color legend
  - Added Recharts bar chart for portfolio YTD performance comparison
  - Visual indicators for positive/negative returns

- **Removed "Made with Emergent" Branding**:
  - Removed HTML badge element from index.html
  - Added CSS rule to hide dynamically injected badge
  - Branding no longer visible on any page

- **Advisor Navigation Updates**:
  - Reordered clientContextNav: Plan now appears BEFORE Investments
  - Added Bonds (/bonds-trading), Hybrids (/hybrids-trading), Crypto (/crypto-portfolio) to Investments navigation
  - Navigation order now: Overview → Plan → Investments → Documents → AI Copilot
  - Removed Trading and Hybrids from Execution tab (now only has Batch Execute)
  - Added Integrations group with Xplan navigation item

- **Xplan Integration** (MAJOR FEATURE):
  - Built complete integration layer for IRESS Xplan financial planning software
  - Each advisor practice can connect their own Xplan instance
  - Core Principle: Xplan = System of Record, Wealth Command = System of Intelligence
  - Phase 1 (Data Extraction): Pull clients, portfolios, assets, liabilities, goals
  - Phase 2 (Scenario Modelling): Use extracted data for projections and analysis
  - Phase 3 (Insights): Generate retirement probability, risk alerts, tax opportunities
  - Phase 4 (Push Back): Send strategies, scenarios, documents back to Xplan
  - Phase 5 (Continuous Sync): Two-way sync with conflict resolution
  - Phase 6 (Advisor Experience): Advisors operate through Wealth Command, Xplan as backend
  - Demo mode available for testing without real Xplan credentials
  - Full backend API at /api/xplan/* with MongoDB persistence
  - Frontend page at /xplan-integration with 4 tabs (Overview, Synced Clients, Sync & Push, History)
  - **Sync Notification**: Auto-prompt to sync when changes made (goals, scenarios)
  - **Status Indicator**: Fixed bottom-right indicator showing Xplan connection status

#### Phase 8.0: Speed, News, & UX Improvements (March 2026)
- **Performance & Speed Improvements**:
  - Increased macro data cache TTL to 5 minutes (reduces API calls)
  - News headlines cached for 10 minutes
  - Parallel data fetching with Promise.all
  - Market data refresh changed from 30s to 5min

- **Financial News Headlines**:
  - New /api/news/headlines endpoint with RSS feed aggregation
  - 9 Sources: CNBC, WSJ, Financial Times, AFR, The Economist, Reuters, Bloomberg, Yahoo Finance, MarketWatch
  - MacroDashboard displays Financial News section with headlines
  - Fallback to static news if RSS feeds fail

- **Decision Engine Improvements**:
  - Added impact_primary numeric field to all recommendations
  - Total Impact calculates correctly from recommendation values
  - Health Score components display real calculated values

- **Adviser Mode Navigation**:
  - Dashboard and CRM now HIDDEN when a client is selected
  - Shows only client-context navigation for clarity
  - Prevents confusion about who is being viewed

### Asset Categories Available
| Category | Personal | Adviser Client | Client Portal |
|----------|----------|----------------|---------------|
| Stocks | Yes | Yes | Yes |
| ETFs | Yes | Yes | Yes |
| Managed Funds | Yes | Yes | Yes |
| Bonds | Yes | Yes | Yes |
| Hybrids | Yes | Yes | Yes |
| Crypto | Yes | Yes | Yes |
| Cash/TDs | Yes | Yes | Yes |
| Property | Yes | Yes | Yes |
| Super | Yes | Yes | Yes |

### In Progress / Mocked Features
- Knowledge Graph data (mock EmbeddedGraph)
- Fathom Integration (requires API key)
- Some ASX hybrid prices (simulated when unavailable)
- Client Portal data (PORTAL_CLIENTS demo data)
- Xplan Integration (demo mode - uses mock data, ready for real Xplan connection)

### Backlog (P2/P3)
- P2: Connect Knowledge Graph to real MongoDB data
- P2: More ASX data sources for hybrids
- P3: Mobile app wrapper
- P3: Voice interface (Whisper)
- P3: Fix websockets dependency conflict with alpaca-trade-api

## Technical Architecture

### Frontend Pages
```
/app/frontend/src/pages/
├── ScenarioModelling.jsx    # Light theme, Goals CRUD
├── KnowledgeGraphDashboard.jsx # 5 tabs, no graph
├── TransactionModeler.jsx   # 7 asset type tabs
├── ClientPortal.jsx         # All assets, pie/bar charts
├── Client360View.jsx        # Bonds, Hybrids, Crypto
├── CryptoPortfolio.jsx      # Live prices
├── HybridsTrading.jsx       # Live prices
└── FamilyWealthDashboard.jsx # Multi-structure view
```

### Key Endpoints
- `GET /api/client-portal/portfolios/{client_id}` - All asset types
- `GET /api/crypto/portfolio/value` - Live crypto values
- `GET /api/hybrids/portfolio/value` - Live hybrid values
- `GET /api/graph/overview` - Knowledge Graph summary
- `GET /api/graph/visualization/data` - Graph visualization data
- `POST /api/client-contact/send-message` - MongoDB persistence
- `POST /api/financial-plan/generate` - MongoDB persistence

## Testing Status
- Backend: All endpoints working
- Frontend: All features verified (iteration_86)
- ScenarioModelling: Light theme, Goals CRUD working
- KnowledgeGraph: 5 tabs, no errors
- ClientPortal: Pie chart and bar chart visualizations
- Emergent Badge: Successfully hidden

---
*Last Updated: March 19, 2026 - Version 7.9*
