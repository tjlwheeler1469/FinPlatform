# Wealth Command v7.7 - Product Requirements Document

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

#### Phase 7.5-7.6: UI/UX Improvements & Asset Classes
- ✅ Performance: Market data loading optimized (parallel yfinance)
- ✅ Bug Fix: Percentage display corrected
- ✅ Navigation Restructure: Net Worth first, Crypto/Hybrids added
- ✅ Hybrids Trading page (/hybrids-trading)
- ✅ Crypto Portfolio page (/crypto-portfolio)
- ✅ Multi-Structure Asset Viewing (Personal/Joint/Company/Trust/SMSF)
- ✅ Client Investments expanded: Hybrids + Crypto categories
- ✅ MongoDB Persistence: Client Contact + Financial Plans

#### Phase 7.7: Live Price Feeds (March 18, 2026)
- ✅ **CoinGecko Crypto Integration**:
  - Live prices for BTC, ETH, SOL, LINK, MATIC, etc.
  - Global market data (total market cap, BTC dominance)
  - Portfolio value calculation with live prices
  - 60-second cache for rate limiting
- ✅ **ASX Hybrid Prices Integration**:
  - Live prices via yfinance for supported hybrids
  - Simulated realistic prices for unsupported symbols
  - Running yield calculation (BBSW + margin)
  - Portfolio value with P/L tracking
- ✅ **Frontend Integration**:
  - CryptoPortfolio.jsx fetches live prices on mount
  - HybridsTrading.jsx fetches live prices on mount
  - Refresh buttons trigger live API calls
  - Toast notifications for price updates

### API Endpoints for Live Prices

**Crypto (CoinGecko)**:
- `GET /api/crypto/prices?symbols=BTC,ETH` - Live crypto prices
- `GET /api/crypto/global` - Global market data (dominance, market cap)
- `GET /api/crypto/portfolio/value?holdings=BTC:0.5,ETH:2` - Portfolio calculation

**Hybrids (ASX)**:
- `GET /api/hybrids/prices?symbols=CBAPD,WBCPI` - Hybrid security prices
- `GET /api/hybrids/all` - All tracked hybrids
- `GET /api/hybrids/portfolio/value?holdings=CBAPD:300` - Portfolio calculation
- `GET /api/hybrids/market/summary` - Market overview

### Live Data Sources
| Source | Data | Status |
|--------|------|--------|
| CoinGecko | BTC, ETH, SOL, LINK, MATIC, etc. | ✅ LIVE |
| Yahoo Finance | ASX hybrid prices (NABPH, MQGPD) | ✅ LIVE |
| Yahoo Finance | ASX hybrids (CBAPD, WBCPI, ANZPJ) | ⚠️ SIMULATED |
| Yahoo Finance | Market indices (SPX, ASX200) | ✅ LIVE |

### In Progress / Mocked Features
- 🔶 Knowledge Graph data (uses mock EmbeddedGraph)
- 🔶 Fathom Integration (mock mode - requires API key)
- 🔶 Some ASX hybrid prices (simulated when yfinance unavailable)

### Backlog (P2/P3)
- P2: Integrate real MongoDB data into Knowledge Graph
- P2: Add more ASX data sources for hybrids (direct ASX feed)
- P2: Resolve `websockets` dependency conflict
- P3: Mobile app wrapper
- P3: Voice interface (Whisper)

## Technical Architecture

### Frontend
- React 18 with React Router
- Shadcn UI components
- axios for API calls
- Recharts for data visualization

### Backend
- FastAPI with async support
- MongoDB for persistence
- httpx for async HTTP calls
- yfinance for market data

### Key New Files
```
/app/backend/routes/
├── crypto_prices.py      # CoinGecko integration
└── hybrid_prices.py      # ASX hybrid prices

/app/frontend/src/pages/
├── CryptoPortfolio.jsx   # Live crypto prices
└── HybridsTrading.jsx    # Live hybrid prices
```

## Testing Status
- ✅ Backend: 100% tests passing (iteration_84)
- ✅ Frontend: Live price feeds verified working
- ✅ CoinGecko: BTC $101,344 AUD, ETH $3,124 AUD
- ✅ Hybrids: NABPH $102.93, MQGPD $100.79 (live)

---
*Last Updated: March 18, 2026 - Version 7.7*
