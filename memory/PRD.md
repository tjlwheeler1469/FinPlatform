# Wealth Command v7.6 - Product Requirements Document

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
- ✅ Bonds Trading page
- ✅ Cash & Term Deposits management
- ✅ Managed Funds tracking
- ✅ Property Portfolio management
- ✅ Tax Analysis & CGT tracking
- ✅ AI Advisor integration (OpenAI/Anthropic/Google via Emergent LLM Key)
- ✅ Knowledge Graph Dashboard with react-force-graph-2d visualization

#### Phase 7: Advisor Mode & CRM
- ✅ Advisor Command Center with 10-zone layout
- ✅ Client 360 View with contact form integration
- ✅ Transaction Modeler with multi-transaction support and plan generation
- ✅ Meeting Notes with Fathom integration (mock mode when no API key)
- ✅ Adviser Hub (Combined CRM)

#### Phase 7.5: UI/UX Improvements (March 18, 2026)
- ✅ **Performance**: Market data loading optimized with parallel yfinance batch downloads
- ✅ **Bug Fix**: Percentage display corrected (SPX shows -1.36% not -136%)
- ✅ **UI Fix**: Savings rate size reduced (text-xl instead of text-3xl)
- ✅ **Navigation Restructure**: Net Worth first, Funds under Finances, Hybrids added to Trading
- ✅ **New Page**: Hybrids Trading (/hybrids-trading) - Australian bank hybrids
- ✅ **Multi-Structure Asset Viewing**: By Structure tab with Personal/Joint/Company/Trust/SMSF filters
- ✅ **Advisor UX**: Client context banner showing "Viewing: [Client Name]"
- ✅ **Knowledge Graph**: Default tab changed to "insights"

#### Phase 7.6: Asset Classes & Data Persistence (March 18, 2026)
- ✅ **Contrast Fix**: ScenarioModelling page improved with proper text-foreground/text-muted-foreground classes
- ✅ **Client Investments - Hybrids**: Added hybrids category to Client360View ($85K, 4 holdings: CBAPD, WBCPI, ANZPJ, NABPH)
- ✅ **Client Investments - Crypto**: Added crypto category to Client360View ($45K, 2 holdings: BTC, ETH)
- ✅ **New Page**: CryptoPortfolio (/crypto-portfolio) - Personal crypto tracking with BTC, ETH, SOL, LINK, MATIC
- ✅ **Navigation - Crypto**: Added Crypto under Personal Finances with NEW badge
- ✅ **Multi-Transaction Modeller**: Verified - supports adding multiple transactions to scenarios
- ✅ **MongoDB Persistence - Client Contact**: Messages and notifications now persist to MongoDB
- ✅ **MongoDB Persistence - Financial Plans**: Generated plans now persist to MongoDB

### In Progress / Mocked Features
- 🔶 Knowledge Graph data (uses mock EmbeddedGraph, not synced from MongoDB)
- 🔶 Fathom Integration (mock mode - requires user API key in FATHOM_API_KEY env var)
- 🔶 Crypto prices (static demo data)
- 🔶 Hybrids data (static demo data)

### Backlog (P2/P3)
- P2: Integrate real MongoDB data into Knowledge Graph (replace mock)
- P2: Connect live crypto price feeds
- P2: Connect live hybrid security prices
- P2: Resolve `websockets` dependency conflict with `alpaca-trade-api`
- P3: Mobile app wrapper
- P3: Voice interface (Whisper integration)

## Technical Architecture

### Frontend
- React 18 with React Router
- Shadcn UI components (/app/frontend/src/components/ui/)
- Recharts for data visualization
- react-force-graph-2d for Knowledge Graph
- Tailwind CSS for styling

### Backend
- FastAPI with async support
- MongoDB for data persistence (collections: client_messages, client_notifications, financial_plans)
- Route-based modular architecture (/app/backend/routes/)
- Knowledge Graph engine (/app/backend/knowledge_graph/)

### Key Endpoints
- `GET /api/macro/overview` - Market data with parallel yfinance fetching
- `POST /api/client-contact/send-message` - Persist messages to MongoDB
- `GET /api/client-contact/messages/{client_id}` - Retrieve messages from MongoDB
- `POST /api/financial-plan/generate` - Generate and persist plan to MongoDB
- `GET /api/financial-plan/{plan_id}` - Retrieve plan from MongoDB
- `GET /api/fathom/meeting-notes` - Meeting notes (mock mode when no API key)
- `GET /api/graph/*` - Knowledge Graph queries

### MongoDB Collections
- `client_messages` - Client-to-advisor messages
- `client_notifications` - Advisor notifications
- `financial_plans` - Generated financial plans

### Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `REACT_APP_BACKEND_URL` - Backend API URL for frontend
- `FATHOM_API_KEY` - Fathom API key (optional, enables live meeting transcription)
- `ALPACA_API_KEY`, `ALPACA_SECRET_KEY` - Alpaca trading (optional)

## Testing Status
- ✅ Backend: 100% tests passing (iteration_83)
- ✅ Frontend: All features verified
- ✅ MongoDB persistence: Verified for client_contact and financial_plan

## File Structure
```
/app/
├── backend/
│   ├── server.py (main FastAPI app)
│   ├── routes/ (modular API routes)
│   │   ├── macro_data.py (optimized market data)
│   │   ├── client_contact.py (MongoDB persistence)
│   │   ├── financial_plan.py (MongoDB persistence)
│   │   └── fathom_integration.py (mock/live mode)
│   ├── knowledge_graph/ (graph engine)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── App.js (routes)
│   │   ├── components/ (Layout, UI)
│   │   └── pages/
│   │       ├── ScenarioModelling.jsx (contrast fixed)
│   │       ├── Client360View.jsx (hybrids, crypto added)
│   │       ├── CryptoPortfolio.jsx (NEW)
│   │       ├── HybridsTrading.jsx
│   │       └── TransactionModeler.jsx (multi-transaction)
│   └── .env
└── memory/
    └── PRD.md (this file)
```

## Recent Changes Summary (v7.6)
| Feature | Status | Details |
|---------|--------|---------|
| ScenarioModelling Contrast | ✅ | Tabs use bg-muted, cards use gradient backgrounds |
| Client Hybrids | ✅ | 4 holdings: CBAPD, WBCPI, ANZPJ, NABPH ($85K) |
| Client Crypto | ✅ | 2 holdings: BTC, ETH ($45K) |
| CryptoPortfolio Page | ✅ | 5 holdings with P&L tracking |
| Navigation Crypto | ✅ | Under Finances with NEW badge |
| Multi-Transaction Modeler | ✅ | Add to List, Save, Generate Plan |
| MongoDB Client Contact | ✅ | Messages persist to client_messages collection |
| MongoDB Financial Plans | ✅ | Plans persist to financial_plans collection |

---
*Last Updated: March 18, 2026 - Version 7.6*
