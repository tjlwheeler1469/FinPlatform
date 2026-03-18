# Wealth Command v7.5 - Product Requirements Document

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
- ✅ Transaction Modeler with plan generation
- ✅ Meeting Notes with Fathom integration (MOCKED - awaits API key)
- ✅ Adviser Hub (Combined CRM)

#### Phase 7.5: UI/UX Improvements & New Features (Latest - March 18, 2026)
- ✅ **Performance**: Market data loading optimized with parallel yfinance batch downloads
  - Cache TTL increased to 300 seconds
  - Uses asyncio.gather for concurrent API calls
  - ThreadPoolExecutor with 10 workers
- ✅ **Bug Fix**: Percentage display corrected (SPX shows -1.36% not -136%)
  - Removed incorrect x100 multiplication in MacroDashboard.jsx
- ✅ **UI Fix**: Savings rate size reduced (text-xl instead of text-3xl)
- ✅ **UI Fix**: Text contrast improved in ScenarioModelling GoalCard
  - Uses text-foreground/text-muted-foreground instead of text-white/text-gray-400
- ✅ **Navigation Restructure**:
  - Net Worth moved to first position under Dashboard
  - Funds moved from Trading to Finances
  - Hybrids added to Trading with NEW badge
- ✅ **New Page**: Hybrids Trading (/hybrids-trading)
  - Australian bank hybrids (CBAPD, WBCPI, ANZPJ, etc.)
  - Portfolio summary with yield analysis
  - Market overview and call schedule
- ✅ **Multi-Structure Asset Viewing**:
  - New "By Structure" tab in Family Wealth Dashboard
  - Filter by: Personal, Joint, Company, Trust, SMSF
  - Aggregated Net Worth calculation per structure
- ✅ **Advisor UX**: Client context banner
  - Persistent header showing "Viewing: [Client Name]" when client selected
  - Exit button to return to CRM view
- ✅ **Knowledge Graph**: Default tab changed to "insights" (from "graph")

### In Progress / Mocked Features
- 🔶 Knowledge Graph data (uses mock EmbeddedGraph, not synced from MongoDB)
- 🔶 Fathom Integration (mock mode - requires user API key)
- 🔶 Client Contact messages (in-memory storage)
- 🔶 Financial Plans (in-memory storage)

### Backlog (P2/P3)
- P2: Integrate real MongoDB data into Knowledge Graph (replace mock)
- P2: Enable live Fathom integration with API key
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
- MongoDB for data persistence
- Route-based modular architecture (/app/backend/routes/)
- Knowledge Graph engine (/app/backend/knowledge_graph/)

### Key Endpoints
- `GET /api/macro/overview` - Market data with parallel yfinance fetching
- `POST /api/contact/message` - Client 360 contact form
- `POST /api/plans/generate` - Financial plan generation
- `GET /api/fathom/meeting-notes` - Meeting notes (mock)
- `GET /api/graph/*` - Knowledge Graph queries

### Environment Variables
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `REACT_APP_BACKEND_URL` - Backend API URL for frontend
- `FATHOM_API_KEY` - Fathom API key (optional, enables live integration)
- `ALPACA_API_KEY`, `ALPACA_SECRET_KEY` - Alpaca trading (optional)

## Testing Status
- ✅ Backend: 100% tests passing (iteration_82)
- ✅ Frontend: All features verified
- ✅ Load testing: CGT endpoint ~90 req/s (locust)

## File Structure
```
/app/
├── backend/
│   ├── server.py (main FastAPI app)
│   ├── routes/ (modular API routes)
│   │   ├── macro_data.py (optimized market data)
│   │   ├── client_contact.py
│   │   ├── financial_plan.py
│   │   └── fathom_integration.py
│   ├── knowledge_graph/ (graph engine)
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── App.js (routes)
│   │   ├── components/ (Layout, UI)
│   │   └── pages/ (all page components)
│   └── .env
└── memory/
    └── PRD.md (this file)
```

---
*Last Updated: March 18, 2026 - Version 7.5*
