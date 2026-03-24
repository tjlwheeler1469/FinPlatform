# Wealth Command v8.0 - Product Requirements Document

## Original Problem Statement
Create a "financial services super app" named "Wealth Command," evolving it from a simple dashboard into a comprehensive "Wealth Operating System" for financial advisers. The core architecture is a **Financial Knowledge Graph** using a hybrid MongoDB and Neo4j database.

The latest major feature is **AdviceOS – Compliance-First Build & Regulatory Data Blueprint**, an AI/Logic Engine designed to provide powerful decision support WITHOUT triggering AFSL requirements. It requires generating scenarios without automated advice, strict auditability, human-in-the-loop decision-making, and compliance overlays (Approved Product Lists, risk checks).

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
  - All client navigation stays within app (no pop-outs)

- **ASX Stock Price Verification**:
  - live_data.py correctly adds .AX suffix for ASX stocks (line 92)
  - Verified: CBA.AX, BHP.AX fetch correct live prices from yfinance
  - US stocks (NVDA, MSFT, AAPL) correctly have no suffix

#### Phase 8.1: AdviceOS – Compliance-First Build (March 24, 2026) ✅ COMPLETE

**PART A — AI / LOGIC ENGINE (SAFE DESIGN)**
The system provides powerful decision support **without triggering AFSL requirements**:
- ✅ No automated advice - System generates **scenarios, not advice**
- ✅ No product recommendations - System shows **trade-offs, not conclusions**
- ✅ Adviser remains decision-maker - Must **explicitly approve all outputs**
- ✅ All outputs are **explainable and auditable**

**1. Scenario Generator Engine** (`/app/backend/routes/scenario_generator.py`)
- Generates 3+ scenarios: Conservative, Balanced, Growth, Income
- Each with metrics: Expected return range, Volatility, Income yield, Drawdown risk
- 10-year projections with confidence intervals
- **NO "best option" identified, NO ranking as "recommended"**

**2. Trade-Off Engine**
- Shows impact without making decisions
- Dimensions: Risk vs return, Income vs growth, Liquidity vs performance, Fees vs outcomes

**3. Comparison Engine**
- Side-by-side scenario comparison
- Inputs used, Outputs generated, Differences highlighted
- NO default selection

**4. Compliance Overlay Engine** (`/app/backend/routes/compliance_engine.py`)
- Evaluates scenarios against licensee and regulatory rules
- Checks: Risk profile alignment, Asset allocation ranges, APL, Fee thresholds
- Outputs: PASS / WARNING / BLOCK

**5. Adviser Decision Layer (MANDATORY)**
- Adviser must select final strategy
- Required confirmations: "I have reviewed the scenarios", "This decision is in the client's best interest"
- Override tracking with mandatory justification

**6. Explainability Engine**
- For every output: Inputs used, Rules triggered, Assumptions applied, Calculations performed

**PART B — COMPLIANCE BY DESIGN**
- Human approval required before: Finalising scenario, Exporting data, Recording advice outcome
- Every action logs: User ID, Timestamp, Action taken, Data before/after change
- Override tracking with permanent storage
- 7-year data retention compliance
- UI compliance language globally: "This tool provides decision support only", "This is not financial advice"

**PART C — BACKEND DATA REQUIREMENTS**

**Database Collections** (`/app/backend/models/compliance_models.py`):
- `licensees`: id, name, afsl_number, rules_config (JSON), apl (JSON), created_at
- `advisers`: id, licensee_id, name, status, created_at
- `clients`: id, external_id (Xplan), licensee_id, profile_data (JSON), risk_profile, created_at
- `scenarios`: id, client_id, inputs (JSON), outputs (JSON), created_by, created_at
- `compliance_checks`: id, scenario_id, result (pass/warn/block), rules_triggered (JSON)
- `adviser_decisions`: id, scenario_id, adviser_id, selected_option, justification_text, created_at
- `audit_logs`: id, user_id, user_role, action_type, entity_type, entity_id, before_state, after_state, timestamp, hash
- `breach_flags`: id, adviser_id, scenario_id, breach_type, severity, status, created_at
- `reports`: id, licensee_id, report_type, generated_at, data_snapshot (JSON)

**Reports Dashboard** (`/app/backend/routes/reports_dashboard.py`):
- Dashboard summary with compliance score
- Adviser activity reports
- Compliance summary reports
- Breach reports
- Audit log exports
- Client file exports
- CSV download support for all report types

**Frontend UI** (`/app/frontend/src/pages/AdviceOSDashboard.jsx`):
- Compliance disclaimer banner
- Key metrics: Compliance Score, Scenarios, Decisions, Open Breaches, Audit Entries
- 5 Tabs: Overview, Scenarios, Compliance, Audit Trail, Reports
- Scenario Generator dialog with client inputs
- Adviser Decision dialog with mandatory confirmations
- Report downloads (CSV format)

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
- P2: Fix websockets dependency conflict with alpaca-trade-api
- P3: Mobile app wrapper
- P3: Voice interface (Whisper)
- P3: PDF report generation for AdviceOS (currently CSV only)
- P3: Real-time breach notifications and escalation workflows

## Technical Architecture

### AdviceOS Architecture
```
/app/backend/
├── models/
│   └── compliance_models.py       # All Pydantic schemas for compliance
├── routes/
│   ├── scenario_generator.py      # Scenario generation API
│   ├── compliance_engine.py       # Compliance checks, decisions, audit logging
│   └── reports_dashboard.py       # Reports and data exports
└── server.py                      # Routes registered under /api/

/app/frontend/src/pages/
└── AdviceOSDashboard.jsx          # Full AdviceOS UI
```

### Key AdviceOS Endpoints
- `POST /api/scenarios/generate` - Generate financial scenarios
- `POST /api/compliance/scenario-check` - Check compliance for scenario
- `POST /api/compliance/decision` - Record adviser decision with audit
- `GET /api/reports/dashboard/summary` - Dashboard metrics
- `GET /api/reports/adviser-activity` - Adviser activity report
- `GET /api/reports/compliance-summary` - Compliance check summary
- `GET /api/reports/breach-report` - Breach tracking report
- `GET /api/reports/audit-export` - Full audit trail export
- `GET /api/reports/download/csv/{type}` - CSV report downloads

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
- Backend: All endpoints working (28/28 tests passed - iteration_93)
- Frontend: All features verified
- AdviceOS: Scenario Generator, Compliance Engine, Reports Dashboard all working
- CRM Triple-Check: 8 clients, all APIs functioning correctly
- No critical issues found

### Test Report: iteration_93.json
- Scenario Generator: PASS - Creates 3+ scenarios with no 'best option' ranking
- Trade-Off Engine: PASS - Shows risk vs return comparisons
- Compliance Overlay: PASS - Returns PASS/WARNING/BLOCK results
- Adviser Decision Layer: PASS - Requires mandatory confirmations
- Audit Trail: PASS - Logs all actions with user ID, timestamp, hash
- Reports Dashboard: PASS - Shows compliance score and metrics
- CSV Downloads: PASS - audit-logs, scenarios, breaches working
- CRM Command Center: PASS - 8 clients loaded, no errors

---
*Last Updated: March 24, 2026 - Version 8.0*
