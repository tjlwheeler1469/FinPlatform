# Wealth Command v10.0 - Product Requirements Document

## Original Problem Statement
Create a "financial services super app" named "Wealth Command," evolving it from a simple dashboard into a comprehensive "Wealth Operating System" for financial advisers. The core architecture is a **Financial Knowledge Graph** using a hybrid MongoDB and Neo4j database.

The latest major feature is **AdviceOS – Enterprise System of Record**, a regulator-ready platform designed for AFSL holders that goes beyond dashboards to provide explicit compliance oversight, cost justification, risk governance, and audit replay capabilities for enterprise procurement (ASIC/APRA CPS 230/ISO standards).

**Version 10.0 completed on March 24, 2026** with Enterprise System of Record Features:
- **Replay Advice (Audit Mode)**: Full audit replay of advice sessions with ASIC-ready export
- **Cost Reduction Dashboard**: ROI calculator with configurable industry benchmarks
- **Risk & Control Mapping**: CPS 230 / ISO 31000 aligned GRC framework with matrix AND table views
- **Breach Register**: CPS 230 compliant breach management with ASIC reporting and deadline tracking

Previous v9.5 features:
- Immutable Audit Service with SHA-256 hash chaining
- Security Controls with 6 RBAC roles (CPS 234 aligned)
- Object Storage for audit exports and document backups
- Enhanced Incident Management (P1-P5 severity, CPS 230)
- Real-time Event Streaming Layer (18 event types)
- Enterprise Documentation Pack (8 docs with PDF export)
- Enterprise Compliance Dashboard (/enterprise page)
- Xplan Integration Phase 1 MVP with mock API and full audit logging

## User Personas
1. **Financial Advisers** - Primary users who manage multiple client portfolios
2. **Individual Investors** - Users managing their own wealth with personal/joint/company/trust/SMSF structures
3. **High Net Worth Clients** - Clients of advisers who use the client portal
4. **Compliance Officers** - Users monitoring audit trails and compliance status
5. **Licensee Administrators** - AFSL holders managing adviser teams and rules

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

#### Phase 8.2: Platform Expansion Features (March 24, 2026) ✅ COMPLETE

**1. PDF Report Generation** (`/app/backend/routes/pdf_reports.py`)
- Compliance Summary PDF with charts and metrics
- Audit Trail PDF with detailed logs
- Breach Report PDF with severity breakdown
- Client File PDF export for regulatory compliance
- Uses ReportLab library for professional formatting

**2. Voice Interface** (`/app/backend/routes/voice_interface.py`)
- OpenAI Whisper integration for speech-to-text
- Supports 7 audio formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
- Voice command parsing with 9 intents:
  - show_portfolio, check_balance, generate_scenario
  - compliance_check, market_update, client_info
  - schedule_meeting, add_note, help
- Natural language response generation

**3. Notification Service** (`/app/backend/routes/notification_service.py`)
- Email notifications via SendGrid (requires API key)
- SMS notifications via Twilio (requires API key)
- Automatic breach alerts based on severity threshold
- Override notifications when adviser overrides compliance
- Notification settings per licensee
- Audit log of all notifications sent

**4. Licensee Multi-tenant Dashboard** (`/app/backend/routes/licensee_dashboard.py`)
- Create and manage multiple AFSL holders
- Each licensee has their own:
  - Adviser roster with status tracking
  - Approved Product List (APL)
  - Custom compliance rules
  - Risk framework configuration
- Dashboard with compliance metrics:
  - Compliance score calculation
  - Adviser activity monitoring
  - Breach tracking per licensee
  - Override rate monitoring

**5. Knowledge Graph MongoDB Integration** (`/app/backend/routes/financial_graph.py`)
- Client financial graphs now persist to MongoDB
- Full CRUD operations for graph data
- Supports: primary client, family members, entities (trusts, companies, SMSF)
- Assets: property, vehicles, collectibles
- Liabilities, insurance, cash flow analysis

**6. Enhanced Hybrid Securities** (`/app/backend/routes/hybrid_prices.py`)
- Live BBSW rate fetching (with fallback)
- 10 Australian bank hybrid securities tracked
- Real-time pricing via yfinance
- Portfolio value calculations with yield analysis

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

### Completed In v8.0 (Previously In Progress / Mocked)
- ✅ Knowledge Graph - NOW connected to MongoDB with persistence
- ✅ Fathom Integration (requires API key - demo mode available)
- ✅ ASX hybrid prices - enhanced with BBSW rates
- ✅ Client Portal data (PORTAL_CLIENTS demo data)
- ✅ Xplan Integration (demo mode - uses mock data, ready for real Xplan connection)

### Backlog (P3 Only - All P2 Completed)
- P3: Mobile app wrapper (requires React Native)
- P3: Real-time breach notifications via WebSocket push
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

### New v8.0 Endpoints
- `GET /api/reports/pdf/compliance-summary` - Download compliance PDF
- `GET /api/reports/pdf/audit-trail` - Download audit trail PDF
- `GET /api/reports/pdf/breach-report` - Download breach PDF
- `POST /api/voice/transcribe` - Upload audio for transcription
- `POST /api/voice/command` - Parse voice command text
- `GET /api/voice/status` - Voice interface status
- `POST /api/notifications/send-breach-alert` - Send breach notification
- `GET /api/notifications/status` - Notification service status
- `POST /api/licensee/create` - Create new licensee
- `GET /api/licensee/{id}/dashboard` - Licensee dashboard
- `GET /api/licensee/{id}/advisers` - List licensee advisers
- `POST /api/licensee/{id}/apl` - Add APL product
- `GET /api/licensee/{id}/rules` - Get compliance rules

### New v8.5 Endpoints - ASIC/APRA/ISO Technical Controls

**Immutable Audit Service** (`/app/backend/routes/audit_service.py`):
- `POST /api/audit/log` - Create immutable audit log with hash chaining
- `GET /api/audit/events` - Query audit events with filtering
- `GET /api/audit/chain/verify` - Verify hash chain integrity (tamper detection)
- `GET /api/audit/chain/status` - Get chain status and last hash
- `POST /api/audit/export` - Export audit pack with certificate
- `POST /api/audit/export?save_to_storage=true` - Export and save to object storage
- `GET /api/audit/regulatory/summary` - ASIC/APRA regulatory compliance summary
- `GET /api/audit/statistics` - Audit metrics (retention: 7 years)
- `GET /api/audit/user/{user_id}/activity` - User activity timeline
- `GET /api/audit/replay/{entity_type}/{entity_id}` - Full entity history replay

**Security Controls** (`/app/backend/routes/security_controls.py`):
- `POST /api/security/roles/init` - Initialize 6 default RBAC roles
- `GET /api/security/roles` - List all roles
- `GET /api/security/roles/{role_name}` - Get role with permissions
- `POST /api/security/roles` - Create custom role
- `POST /api/security/check-permission` - Check user permission
- `GET /api/security/controls/status` - CPS 234/230 aligned controls status
- `GET /api/security/dashboard` - Security dashboard (threat level, events)
- `POST /api/security/api-keys/generate` - Generate API key (wc_* format)
- `DELETE /api/security/api-keys/{key_id}` - Revoke API key
- `GET /api/security/rate-limit/status` - Rate limiting status (100/60s)
- `POST /api/security/events/log` - Log security event
- `GET /api/security/events` - Query security events

**Object Storage** (`/app/backend/routes/object_storage.py`):
- `GET /api/storage/status` - Storage service status
- `POST /api/storage/init` - Initialize Emergent storage connection
- `POST /api/storage/upload` - Upload file (audit, document, compliance, report)
- `POST /api/storage/audit-export/upload` - Upload audit export pack
- `POST /api/storage/audit-export/save-json` - Save audit export as JSON
- `GET /api/storage/files/{file_id}` - Download file
- `GET /api/storage/audit-exports` - List audit exports
- `GET /api/storage/files` - List files by category
- `DELETE /api/storage/files/{file_id}` - Soft delete file
- `GET /api/storage/document-backup/status` - Backup status

## Testing Status
- Backend: All endpoints working (30/30 new tests + 32 existing = 62 total - iteration_95)
- Frontend: All features verified
- AdviceOS: Full suite operational with PDF exports
- Websockets: Dependency conflict resolved
- Voice Interface: Configured and ready (Whisper integration)
- Notification Service: Ready (requires SendGrid/Twilio API keys)
- Licensee Dashboard: Multi-tenant fully operational
- **Audit Service**: Immutable logging with SHA-256 hash chaining - OPERATIONAL
- **Security Controls**: 6 RBAC roles, CPS 234/230 aligned - OPERATIONAL
- **Object Storage**: Emergent storage for audit exports - OPERATIONAL
- **Incident Management**: P1-P5 severity with escalation - OPERATIONAL
- **Event Streaming**: 18 event types with WebSocket - OPERATIONAL
- **Enterprise Docs**: 8 documents with PDF export - OPERATIONAL

### Test Report: iteration_96.json (Latest)
- Health Check: PASS - All services confirmed including new enterprise features
- Incident Management - Severity: PASS - P1-P5 levels with response times
- Incident Management - Dashboard: PASS - MTTR, resolution rate, escalation status
- Incident Management - Regulatory: PASS - ASIC/APRA report generation
- Event Streaming - Types: PASS - 18 event types across 6 categories
- Event Streaming - Publish: PASS - Events persisted with evt_{uuid} IDs
- Event Streaming - Metrics: PASS - Real-time metrics and WebSocket support
- Enterprise Docs - List: PASS - 8 documents available
- Enterprise Docs - PDF: PASS - PDF generation for all document types
- Enterprise Docs - Pack: PASS - Complete due diligence pack with hash
- Frontend - Enterprise Page: PASS - 6 tabs functional

## Enterprise Architecture (v9.0)

### Incident Management (CPS 230 Compliant)
- **Severity Levels**: P1 (Critical), P2 (High), P3 (Medium), P4 (Low), P5 (Info)
- **Response Times**: P1: 15min, P2: 30min, P3: 2hr, P4: 8hr, P5: Next day
- **Features**: Escalation workflows, regulatory reporting, timeline tracking
- **Endpoints**: `/api/incidents/*`

### Event Streaming Layer
- **Event Types**: 18 (audit, compliance, security, incident, workflow, system)
- **Features**: In-memory buffer, WebSocket push, event rules
- **Production Path**: Kafka / AWS Kinesis compatible
- **Endpoints**: `/api/events/*`

### Enterprise Documentation Pack
- **Documents**: 8 types available
  1. Architecture Overview
  2. Security Policy
  3. Incident Response Plan
  4. BCP/DR Plan
  5. Compliance Framework
  6. Due Diligence Checklist
  7. Technology Stack (with regulatory mapping)
  8. Complete Pack (all documents)
- **Formats**: JSON and PDF
- **Endpoints**: `/api/enterprise/docs/*`

### Frontend: Enterprise Compliance Dashboard
- **Route**: `/enterprise`
- **Tabs**: Overview, Audit Trail, Security, Incidents, Events, Documents
- **Features**:
  - Real-time metric cards (Audit Chain, Security, Incidents, Events, MTTR)
  - Audit chain verification with tamper detection
  - Incident creation and tracking
  - Document download (JSON/PDF)
  - Regulatory compliance status

## ASIC/APRA/ISO Compliance Features

### Immutable Audit Trail
- **Hash Algorithm**: SHA-256
- **Chain Type**: Append-only (no delete, no update)
- **Tamper Detection**: Hash chaining with previous_hash linking
- **Retention Policy**: 7 years
- **Export Format**: JSON with cryptographic certificate
- **Cloud Backup**: Automatic save to Emergent Object Storage

### RBAC Security Model
- **Roles**: super_admin, licensee_admin, compliance_officer, adviser, support_staff, auditor
- **Permissions**: Granular action-level (client:read, scenario:create, compliance:override_review)
- **Rate Limiting**: 100 requests per 60 seconds per IP
- **API Keys**: Secure generation with wc_* prefix, revocation support

### Regulatory Alignment
- **ASIC RG 271**: Compliant
- **APRA CPS 234**: Aligned (information security)
- **APRA CPS 230**: Aligned (operational risk)
- **Corporations Act**: Compliant (7-year record keeping)
- **Privacy Act (APP 11)**: Compliant
- **ISO 27001**: Partial alignment (roadmap for full certification)

## Xplan Integration (Phase 1 MVP)

### Overview
Read-first, audit-driven integration with Xplan. AdviceOS acts as a workflow and compliance layer without overwriting financial data.

### Data Flow Rules
- **Xplan = System of Record**: Clients, portfolios, transactions
- **AdviceOS = Workflow Layer**: Compliance, scenarios, decisions
- **Critical Rule**: AdviceOS will NEVER overwrite financial data in Xplan

### Phase 1 Capabilities

**READ Operations:**
- Client data (name, DOB, email, phone, address, marital status, dependents)
- Client profile (risk profile, investment objective, time horizon, income needs, assets, liabilities)
- Portfolio data (holdings, values, asset allocation)
- Transactions (buy, sell, dividend, contribution, withdrawal)
- Risk profile (score, band, last review date)

**WRITE Operations:**
- File notes (plain text format with adviser ID and timestamp)
- Scenario summaries (to be implemented in Phase 2)

### Field Mapping (Xplan → AdviceOS)
| Xplan Field | AdviceOS Field |
|-------------|----------------|
| client_id | external_id |
| risk_band | risk_profile |
| investment_objective | goals |
| security_code | product_id |
| value | market_value |

### API Endpoints

**Mock Xplan API** (`/api/xplan-mock/*`):
- `GET /clients` - List 5 mock clients
- `GET /clients/{id}` - Get client by ID
- `GET /clients/{id}/profile` - Get client profile
- `GET /clients/{id}/portfolio` - Get portfolio with holdings
- `GET /clients/{id}/transactions` - Get transaction history
- `GET /clients/{id}/risk` - Get risk profile
- `POST /clients/{id}/file_notes` - Create file note
- `POST /oauth/token` - Mock OAuth token

**Xplan Integration Service** (`/api/xplan/*`):
- `GET /status` - Integration status (mode, phase, OAuth validity)
- `POST /connect` - Establish OAuth connection
- `GET /clients` - List synced clients (from cache or Xplan)
- `GET /clients/{id}` - Get client with full profile
- `GET /clients/{id}/portfolio` - Get mapped portfolio
- `GET /clients/{id}/transactions` - Get mapped transactions
- `POST /file-notes/write` - Write file note to Xplan
- `GET /file-notes/{client_id}` - List file notes
- `GET /logs` - API interaction logs (full audit trail)
- `GET /sync/status` - Sync status overview
- `POST /sync/client/{id}` - Sync single client (real-time)
- `POST /sync/all` - Sync all clients (scheduled/fallback)

### Frontend: Xplan Sync Page
- **Route**: `/xplan`
- **Tabs**: Status, Clients, Sync, File Notes, API Logs
- **Features**:
  - View connection status and OAuth validity
  - Browse synced clients with portfolios
  - Manually trigger sync operations
  - Write file notes to Xplan
  - View full API interaction audit trail

### Audit Logging
All Xplan API interactions are logged to:
1. `xplan_api_logs` collection (detailed API call logs)
2. Main audit service (immutable hash-chained audit trail)

Logged fields: user_id, action, endpoint, request/response payload, status_code, duration_ms, timestamp

### Mock Clients (Development)
| ID | Name | Risk Profile | Assets |
|----|------|--------------|--------|
| XP-001 | James Mitchell | Balanced | $1.25M |
| XP-002 | Sarah Thompson | Growth | $650K |
| XP-003 | Michael Chen | Conservative | $2.1M |
| XP-004 | Emma Williams | High Growth | $380K |
| XP-005 | David Brown | Defensive | $3.5M |

### Phase 2 Roadmap
- Scenario document upload to Xplan
- Deeper portfolio sync with event-based updates
- Two-way controlled write-back (non-destructive fields only)

---

## Version 10.0 - Enterprise System of Record (March 24, 2026) ✅ COMPLETE

### Replay Advice (Audit Mode)
**Route**: `/replay-advice`
**Backend**: `/app/backend/routes/replay_advice.py`
**Frontend**: `/app/frontend/src/pages/ReplayAdvicePage.jsx`

Full audit replay capability for ASIC-ready advice documentation:
- Capture all advice session inputs (client context, current holdings, stated objectives)
- Record scenario generation with timestamps
- Log adviser decisions with mandatory justifications
- Track client acknowledgments
- Generate ASIC-ready exports (JSON with cryptographic hash)
- Session ID format: `ADV-{date}-{uuid}`

**Key Endpoints**:
- `GET /api/replay/sessions` - List all advice sessions
- `GET /api/replay/session/{id}` - Get full session with timeline
- `GET /api/replay/session/{id}/export` - ASIC-ready export
- `GET /api/replay/dashboard/stats` - Session statistics
- `POST /api/replay/session/start` - Start new advice session
- `POST /api/replay/demo/create-sample-session` - Create demo session

### Cost Reduction Dashboard
**Route**: `/cost-reduction`
**Backend**: `/app/backend/routes/cost_reduction.py`
**Frontend**: `/app/frontend/src/pages/CostReductionDashboard.jsx`

Explicit ROI and efficiency tracking with configurable industry benchmarks:
- Industry Benchmarks (configurable):
  - Compliance officer rate: $85 AUD/hour
  - Adviser rate: $120 AUD/hour
  - Manual file review: 2.5 hours → Automated: 0.5 hours (80% reduction)
  - Compliance check time reduction: 90%
  - Audit prep time reduction: 80%
- Live efficiency metrics (today/week/month)
- ROI calculator with configurable inputs
- FTE equivalent savings calculation

**Key Endpoints**:
- `GET /api/cost-reduction/dashboard` - Full cost savings dashboard
- `GET /api/cost-reduction/metrics/live` - Today/week metrics
- `POST /api/cost-reduction/roi-calculator` - Calculate ROI with inputs
- `POST /api/cost-reduction/log` - Log efficiency event
- `POST /api/cost-reduction/demo/seed-data` - Seed demo data

### Risk & Control Mapping
**Route**: `/risk-control`
**Backend**: `/app/backend/routes/risk_control_mapping.py`
**Frontend**: `/app/frontend/src/pages/RiskControlMapping.jsx`

CPS 230 / ISO 31000 aligned enterprise GRC framework:
- Risk Register with likelihood × impact rating
- Control Register with effectiveness tracking
- Risk-Control Matrix (visual mapping)
- **Both Matrix AND Table views side by side** (per user request)
- Control testing and review scheduling
- Regulatory alignment tracking (CPS 230, CPS 234, ISO 31000, ASX Principle 7)

**Risk Ratings**:
| Likelihood / Impact | Insignificant | Minor | Moderate | Major | Catastrophic |
|---------------------|---------------|-------|----------|-------|--------------|
| Almost Certain | Medium | High | High | Extreme | Extreme |
| Likely | Low | Medium | High | High | Extreme |
| Possible | Low | Medium | Medium | High | High |
| Unlikely | Low | Low | Medium | Medium | High |
| Rare | Low | Low | Low | Medium | Medium |

**Key Endpoints**:
- `GET /api/risk-control/risks` - Risk register
- `GET /api/risk-control/controls` - Control register
- `GET /api/risk-control/mapping/matrix` - Risk-control matrix
- `GET /api/risk-control/dashboard` - GRC dashboard
- `POST /api/risk-control/risks` - Create risk
- `POST /api/risk-control/controls` - Create control
- `POST /api/risk-control/mapping` - Link risk to control

### Breach Register
**Route**: `/breach-register`
**Backend**: `/app/backend/routes/breach_register.py`
**Frontend**: `/app/frontend/src/pages/BreachRegister.jsx`

CPS 230 compliant breach management with ASIC reporting:
- Breach logging with severity classification (Low/Medium/High/Critical)
- Category classification (Advice Quality, Documentation, Disclosure, etc.)
- ASIC reportable flag with automatic deadline calculation
- Reporting criteria (significant_breach, systemic_issue, client_detriment, reportable_situation)
- Remediation tracking with client notification status
- Compensation tracking
- Breach ID format: `BRH-{date}-{uuid}`

**ASIC Reporting Timelines**:
- Significant Breach: 30 days
- Systemic Issue: 10 days
- Client Detriment: 10 days
- Reportable Situation: Immediate

**Key Endpoints**:
- `GET /api/breaches/register` - List all breaches
- `GET /api/breaches/dashboard` - Breach metrics and ASIC status
- `POST /api/breaches/register` - Register new breach
- `POST /api/breaches/register/{id}/update` - Update breach status
- `POST /api/breaches/register/{id}/report-asic` - Record ASIC report
- `GET /api/breaches/report/regulatory` - Generate regulatory report

---

## Roadmap

### P1 - Upcoming Tasks
- Xplan Integration Phase 2 (scenario upload, deeper portfolio sync)
- Real-time WebSocket push notifications for Enterprise Dashboard
- Wire up real Email/SMS notifications (Twilio/SendGrid currently mocked)
- ComplianceDisclaimer "Don't show again" persistent option

### P2 - Future Tasks
- Xplan Integration Phase 3 (real-time event streaming)
- Multi-tenant licensee data isolation
- PDF report generation for all enterprise features

---
*Last Updated: March 24, 2026 - Version 10.0 - Enterprise System of Record Complete*

## Version 10.0.1 Fixes (March 24, 2026)
- Renamed "Enterprise Compliance Dashboard" to "Compliance Dashboard"
- Fixed document downloads to stay within platform (no pop-outs)
- Fixed View button to download inline instead of opening new tab
- Verified all 20 System Health reports showing as "Active"
- Verified Client View navigation stays within the platform
- Combined duplicate compliance tabs (removed `/compliance`, kept AdviceOS + Compliance Dashboard + Security)
- Added "Download" dropdown to System Health (PDF, Excel/CSV, JSON formats)
- Wrapped Compliance Dashboard with Layout component to match AdvisorCommandCenter styling
- Fixed "Aud" → "AUD" capitalization in currency labels
- Fixed Financial Health Score to always show a number (added fallback)
- Updated all cost displays to show "AUD $X,XXX" format

## Version 10.1 - Retirement Calculator (March 25, 2026) ✅ COMPLETE

### Feature: Comprehensive Retirement Calculator with SMSF Planning

**Route**: `/retirement-calculator`
**Backend**: `/app/backend/routes/retirement_calculator.py`
**Frontend**: `/app/frontend/src/pages/RetirementCalculator.jsx`

Full accumulation phase retirement planning with:

#### Personal & Client Modes
- Personal Mode for individual users
- Adviser Mode for client planning (enter client name)
- Toggle switch in header

#### Investment Profiles
- Conservative (5% target, 4% volatility)
- Moderately Conservative (6% target, 6% volatility)
- Balanced (7% target, 9% volatility) - Default
- Growth (8% target, 12% volatility)
- Aggressive/High Growth (9.5% target, 16% volatility)
- Custom allocation option with override return rates

#### Fund Types Supported
- Industry Fund (lowest fees)
- Retail Fund (more options)
- SMSF (fixed costs, best for $400k+)
- SMA (Separately Managed Account)
- Managed Account/MDA

#### Contribution Types (FY 2024-25 Caps)
- Employer SG (11.5% auto-calculated)
- Salary Sacrifice (pre-tax)
- Personal Deductible contributions
- Non-Concessional (after-tax) - $120k cap
- Spouse contributions
- Government co-contribution
- Annual contribution growth rate

#### Cost Modeling
- Admin fees (% + flat)
- Investment management fees
- Platform fees (SMA/managed)
- Advice fees
- Insurance premiums
- SMSF costs (accounting, audit, ASIC, ATO levy)

#### Asset Classes
- Cash, Fixed Income, Australian Shares
- International Shares, Property
- Infrastructure, Alternatives, Commodities
- Customizable returns, yields, volatility per asset

#### Output Features
- Projected balance at retirement (nominal & real)
- Monthly retirement income calculation
- Sustainable withdrawal rate
- Scenario comparison (pessimistic/expected/optimistic)
- Year-by-year projections table
- Balance growth chart
- Asset allocation pie chart
- Contribution & cost summaries
- Export to CSV/JSON

**Key Endpoints**:
- `POST /api/retirement/calculate` - Main calculation
- `GET /api/retirement/profiles` - Investment profiles
- `GET /api/retirement/super-caps` - Current FY caps
- `GET /api/retirement/fund-costs` - Fund type costs
- `POST /api/retirement/compare-scenarios` - Compare up to 5 scenarios
- `POST /api/retirement/smsf-viability` - Check SMSF cost-effectiveness
- `GET /api/retirement/demo/sample-calculation` - Demo calculation

## Version 10.2 - Decumulation Calculator (March 25, 2026) ✅ COMPLETE

### Feature: Comprehensive Decumulation Calculator for Pension Phase Planning

**Route**: `/decumulation-calculator`
**Backend**: `/app/backend/routes/decumulation_calculator.py`
**Frontend**: `/app/frontend/src/pages/DecumulationCalculator.jsx`

Full pension phase planning with drawdown modeling:

#### Assets by Type & Entity
- 14 asset types: Cash, Term Deposit, Australian Shares, International Shares, Managed Funds, ETF, Investment Property, Residential Property, Super Accumulation, Super Pension, Annuity, Bonds, Business Assets, Cryptocurrency, Collectibles
- 6 entity types: Individual, Joint, SMSF, Trust, Company, Super Fund
- Assessable vs exempt assets for Age Pension calculation
- Pie charts for Assets by Type and Assets by Entity

#### Liabilities Tracking
- 8 liability types: Home Mortgage, Investment Loan, Personal Loan, Car Loan, Credit Card, Margin Loan, SMSF Limited Recourse, Other
- Interest rate and minimum payment tracking
- Secured asset linking

#### SMSF Minimum Drawdown Rules (FY 2024-25)
- Under 65: 4%
- 65-74: 5%
- 75-79: 6%
- 80-84: 7%
- 85-89: 9%
- 90-94: 11%
- 95+: 14%

#### Drawdown Strategies
- Minimum Required (SMSF minimum only)
- Fixed Percentage (user-defined %)
- Fixed Amount (target dollar amount)
- Strategy comparison with recommendations

#### Age Pension Calculation
- Assets test (homeowner/non-homeowner thresholds)
- Income test with deeming rates (0.25% below threshold, 2.25% above)
- Pension taper rates
- Full/part pension eligibility
- FY 2024-25 rates:
  - Single max: $28,514/year
  - Couple max: $42,988/year combined

#### Key Thresholds (FY 2024-25)
- Transfer Balance Cap: $1,900,000
- Pension Age: 67
- Deeming Threshold (Single): $60,400
- Assets Cut-off (Homeowner Single): $656,500

#### Output Features
- Summary cards: Total Assets, Super Pension, Liabilities, Net Position
- Longevity Analysis: Life expectancy, fund exhaustion age, final net position
- Year-by-year projections: Age, Super balance, Other assets, Liabilities, Net position, Drawdown, Age Pension, Total income, Expenses, Surplus/deficit
- Net Position Over Time area chart
- Assets breakdown pie charts
- Rules reference tab with SMSF and Age Pension thresholds

**Key Endpoints**:
- `POST /api/decumulation/calculate` - Main calculation with projections
- `GET /api/decumulation/rules` - Pension rules and thresholds
- `GET /api/decumulation/asset-assumptions` - Return assumptions by asset type
- `POST /api/decumulation/compare-strategies` - Compare drawdown strategies
- `GET /api/decumulation/demo/sample-calculation` - Demo calculation

**Testing**: Iteration 99 - All 11 backend tests passed, all frontend features verified

## Version 10.3 - Platform Integrations & Multi-Structure Support (March 25, 2026) ✅ COMPLETE

### Feature: Platform API Integrations with Bi-Directional Sync

**Route**: `/platform-integrations`
**Backend**: `/app/backend/routes/platform_integrations.py`
**Frontend**: `/app/frontend/src/pages/PlatformIntegrations.jsx`

Bi-directional data sync with 5 enterprise wealth platforms:

#### Supported Platforms
| Platform | READ Capabilities | WRITE Capabilities |
|----------|-------------------|-------------------|
| AMP North | clients, portfolios, transactions, balances, pension_accounts, insurance | file_notes, scenarios, documents |
| Netwealth | clients, portfolios, transactions, balances, pension_accounts, documents | file_notes, scenarios, documents, model_portfolios |
| HUB24 | clients, portfolios, transactions, balances, pension_accounts, insurance | file_notes, scenarios, rebalance_orders |
| Class Super | smsf_funds, members, investments, transactions, compliance_status, documents | file_notes, documents, pension_commencements |
| IRESS (Xplan) | clients, portfolios, transactions, balances, risk_profiles, insurance_needs, scenarios | file_notes, scenarios, documents, soa_data, risk_profiles |

#### Key Features
- Demo mode connection (no credentials required)
- Production mode with OAuth credentials
- Bi-directional sync (READ from platforms, WRITE back to platforms)
- Write-back support for file_notes, scenarios, documents
- Audit logging for all sync operations
- Mock client and portfolio data for testing

**Key Endpoints**:
- `GET /api/platforms/available` - List available platforms with capabilities
- `POST /api/platforms/connect/{platform}` - Connect (demo or production)
- `GET /api/platforms/status` - All connection statuses
- `GET /api/platforms/{platform}/clients` - Fetch clients from platform
- `POST /api/platforms/sync` - Bi-directional sync
- `POST /api/platforms/write-back` - Push data back to platform
- `GET /api/platforms/sync-logs` - Audit logs

### Feature: Multi-Structure Retirement Calculations

**Backend**: `/app/backend/routes/client_profile_retirement.py`

Calculate retirement projections across multiple structures combined:

#### Supported Structures
| Structure | Tax Treatment | Asset Protection |
|-----------|--------------|-----------------|
| Personal | Personal tax rates | Limited |
| Joint | Income split 50/50 | Limited |
| Company | 30%/25% company tax | Good (separate entity) |
| Trust | Distributed to beneficiaries | Good (trustee holds) |
| SMSF | 15% accum, 0% pension | Excellent (protected) |
| Super Fund | 15% accum, 0% pension | Excellent (protected) |

#### Key Features
- Calculate for one structure OR multiple combined
- Asset breakdown: super, investments, property, cash
- Liability tracking across structures
- Projected net position at retirement
- Save to client profiles
- Push to connected platforms

**Key Endpoints**:
- `GET /api/client-profile/structures` - Available structures with descriptions
- `POST /api/client-profile/multi-structure/calculate` - Combined calculation
- `POST /api/client-profile/retirement/save` - Save to client profile
- `GET /api/client-profile/retirement/{client_id}` - Get client profile

**Testing**: Iteration 100 - All 21 backend tests passed, all frontend features verified

**Note**: Platform APIs are currently MOCK implementations for demo purposes. Real API connections require production credentials from each platform provider.

## Version 10.4 - Enterprise Enhancements (March 25, 2026) ✅ COMPLETE

### Feature 1: Xplan Integration Phase 2

**Backend**: `/app/backend/routes/xplan_integration.py` (extended)

Enhanced Xplan integration with scenario upload and deep portfolio sync:

#### Scenario Document Upload
- Upload retirement projections, insurance needs, estate plans to Xplan
- Scenario types: retirement, insurance, estate, investment
- Document types: SOA, ROP, Fact Find, Advice Document
- Auto-generated scenario IDs with sync status tracking
- WebSocket broadcast on successful upload

#### Deep Portfolio Sync
- Detailed holdings data (security, units, price, value)
- Transaction history (configurable date range)
- Performance metrics
- Tax lot tracking
- Stored locally with automatic Xplan sync

**Key Endpoints**:
- `POST /api/xplan/scenarios/upload` - Upload scenario document
- `GET /api/xplan/scenarios/{client_id}` - Get client scenarios
- `POST /api/xplan/portfolio/deep-sync` - Deep portfolio sync
- `GET /api/xplan/portfolio/deep/{client_id}` - Get deep sync data

### Feature 2: WebSocket Real-Time Notifications

**Backend**: `/app/backend/routes/websocket_service.py`
**Frontend**: Uses WebSocket connections for live updates

Real-time push notifications for Enterprise Dashboard:

#### Channels
- `enterprise` - Enterprise dashboard updates
- `platform_sync` - Platform sync status
- `compliance` - Compliance alerts
- `notifications` - General notifications
- `incidents` - Incident updates
- `breaches` - Breach alerts

#### Features
- Auto-reconnect on disconnect (5 second delay)
- Connection status indicator (Live/Offline badge)
- Broadcast functions for other modules to trigger notifications
- Connection statistics endpoint

**Key Endpoints**:
- `WS /api/ws/enterprise` - Enterprise dashboard
- `WS /api/ws/platform-sync` - Platform sync updates
- `WS /api/ws/compliance` - Compliance alerts
- `GET /api/ws/stats` - Connection statistics
- `POST /api/ws/test-notification` - Test broadcast

### Feature 3: Enhanced Mock Mode for Email/SMS

**Backend**: `/app/backend/routes/notification_service.py` (enhanced)

Mock mode for Twilio SMS and SendGrid Email:

#### Mock Mode Features
- Logs all notifications to database (`mock_notifications` collection)
- Includes full message content, recipients, timestamps
- Broadcasts via WebSocket for real-time display
- Ready to swap in real API keys when available

#### Status Endpoint Shows
- `status: "mock_mode"` when API keys not configured
- `status: "ready"` when real API keys present

**Key Endpoints**:
- `GET /api/notifications/status` - Shows mock/ready status
- `GET /api/notifications/mock-notifications` - View logged notifications
- `POST /api/notifications/send-test-mock` - Test mock mode

### Feature 4: Live Sync Dashboard

**Route**: `/live-sync`
**Frontend**: `/app/frontend/src/pages/LiveSyncDashboard.jsx`

Real-time dashboard with automatic updates:

#### Features
- **Live/Offline badge** - Shows WebSocket connection status
- **Auto-refresh toggle** - Polls every 30 seconds when ON
- **Platform status bar** - Shows all 5 platforms with quick connect/sync
- **Live Event Stream** - Real-time events with severity colors
- **4 Tabs**:
  - Live Events - Real-time event stream
  - Sync Logs - All bi-directional sync operations
  - Notifications - Mock email/SMS log with Send Test button
  - Portfolio - Summary by platform and clients by platform

### Feature 5: Save to Client Profile

**Frontend**: Added to both calculators

Both Accumulation and Decumulation calculators now have "Save to Client Profile" button:

#### Dialog Features
- Client ID field (auto-generated if blank)
- Client Name field
- Platform selection (AMP North, Netwealth, Hub24, Class, IRESS)
- Save & Push button - saves locally and pushes to selected platforms
- Cancel button

#### Backend Integration
- Uses `/api/client-profile/retirement/save` endpoint
- Supports multi-structure data
- Optional platform push via platform integrations API

**Testing**: Iteration 101 - All 18 backend tests passed, all frontend features verified
