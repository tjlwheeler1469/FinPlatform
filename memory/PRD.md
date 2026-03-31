# Wealth Command Centre - PRD

## Original Problem Statement
Build a comprehensive Australian wealth management platform for financial advisers and their clients. Features include consolidated navigation, smart AI insights, realistic client profiles (50yo married Aussie couple), live market data, editable user profiles, Age Pension calculator, Adviser Compliance Dashboard, Buffett-style stock screening, live newsfeeds, voice-activated planning assistant, and multi-language support.

## User Personas
- **Personal Users**: David & Sarah Thompson (50yo Aussie couple) managing their wealth
- **Financial Advisers**: Monitoring compliance, managing clients, preparing meetings
- **Clients**: Viewing simplified financial dashboards

## Core Requirements
1. Consolidated Personal/Client/Adviser navigation with reduced tab fatigue
2. Smart Insights with AI-driven context-aware suggestions (GPT-5.2)
3. Realistic mock data profile: "David & Sarah Thompson" (married, age 50)
4. Live Market Data integration (ASX, S&P, Dow, NASDAQ, FTSE, currencies, commodities)
5. Editable User Profiles via UI + API
6. Services Australia Age Pension API calculator
7. Adviser Compliance Dashboard for SOA/ROA oversight
8. Buffett-style stock screening as tab within Stocks/ETFs (not standalone)
9. Live financial newsfeeds from multiple sources
10. Voice-activated financial planning assistant (Whisper STT + GPT-5.2)
11. Multi-language support (English, Mandarin, Vietnamese, Greek)

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **AI/LLM**: OpenAI GPT-5.2, Whisper (via Emergent LLM Key)
- **Market Data**: Yahoo Finance (yfinance) with 5-min caching

## Architecture
```
/app/
├── backend/
│   ├── server.py                        # Main FastAPI app with all routers
│   └── routes/
│       ├── market_data.py               # 17 Yahoo Finance indicators
│       ├── news_headlines.py            # Live financial news
│       ├── user_profile.py              # User Profile CRUD
│       ├── age_pension.py               # Age Pension estimator
│       ├── soa_roa_compliance.py        # Compliance docs + dashboard + seed
│       ├── voice_assistant.py           # GPT-powered voice/text assistant
│       ├── voice_interface.py           # Whisper STT + voice commands
│       └── trading.py                   # Stock trading/holdings
└── frontend/
    └── src/
        ├── App.js                       # Routing + providers (LanguageProvider)
        ├── components/
        │   ├── Layout.jsx               # Nav + language selector + voice FAB
        │   ├── SmartInsights.jsx        # AI contextual insights
        │   ├── VoiceAssistant.jsx       # Voice/text chat panel
        │   └── LanguageContext.jsx       # i18n with 4 languages
        └── pages/
            ├── PersonalDashboard.jsx    # Main dashboard
            ├── ClientPortal.jsx         # Client view
            ├── AdviserComplianceDashboard.jsx  # MongoDB-backed compliance
            └── StockTrading.jsx         # 5-tab trading (Portfolio/Buffett/Val/Backtest/News)
```

## Key API Endpoints
- `GET /api/market-data/indicators` - 17 live market indicators
- `GET /api/news/headlines` - Live financial news
- `GET /api/compliance-docs/dashboard` - Compliance metrics from MongoDB
- `POST /api/compliance-docs/seed-demo` - Seed demo compliance data
- `POST /api/voice-assistant/chat` - GPT-powered text chat
- `POST /api/voice-assistant/transcribe` - Audio transcription + GPT response
- `GET/PUT /api/user-profile/{user_id}` - User profiles
- `POST /api/age-pension/calculate` - Pension estimator

## What's Been Implemented

### P0 - Critical (DONE)
- [x] Fixed StockTrading.jsx rendering after massive overwrite
- [x] Fixed $NaN display in Portfolio tab (field name mapping)
- [x] Webpack cache management for stable hot-reload

### P1 - High Priority (DONE)
- [x] Buffett Ideas merged as tab inside Stocks/ETFs (not standalone)
- [x] Live newsfeeds connected to News tab via /api/news/headlines
- [x] Market data expanded to 17 indicators (indices, currencies, commodities)
- [x] Removed standalone BuffettTradingEngine.jsx and its route
- [x] Cleaned up Layout.jsx navigation (no orphaned Buffett link)

### P2 - Medium Priority (DONE)
- [x] Compliance Dashboard reads from MongoDB (not mocked)
- [x] Dashboard endpoint returns metrics + advice files from DB
- [x] Seed-demo endpoint populates 5 realistic compliance documents
- [x] "Live from MongoDB" badge on compliance dashboard

### P3 - Future/Backlog (DONE)
- [x] Voice-activated financial planning assistant (GPT-5.2 + Whisper STT)
- [x] Text chat interface for financial questions
- [x] Multi-language support: English, Mandarin (zh), Vietnamese (vi), Greek (el)
- [x] Language selector in sidebar with localStorage persistence
- [x] LanguageProvider wrapping entire app

## Remaining / Backlog
- [ ] Connect Buffett Ideas to live backend API (currently static data)
- [ ] Portfolio holdings from real broker integration
- [ ] Backtest engine with historical data
- [ ] Valuations tab with live DCF calculations
- [ ] Voice recording (microphone) end-to-end test
- [ ] Extend i18n translations to all page content (currently nav + common labels)

## Code Quality Fixes Applied (March 2026)

### Critical Security Fixes
- [x] Removed hardcoded secrets from 5 test files → env vars with fallbacks
- [x] Replaced `eval()` with `ast.literal_eval` + safe arithmetic parser in `scenario_templates.py`
- [x] Sanitized `dangerouslySetInnerHTML` with DOMPurify in `NotificationCenter.jsx`
- [x] Sanitized `document.write` with DOMPurify in `EnterpriseComplianceDashboard.jsx`
- [x] Migrated auth tokens from `localStorage` to `sessionStorage` in `AuthContext.jsx` and `ClientPortalMerged.jsx`
- [x] Replaced MD5 with SHA-256 in `scaling_infrastructure.py`

### Important Fixes
- [x] Fixed high-priority React hook dependencies in 4 pages (XplanSyncPage, XplanIntegration, WorkflowDashboard, WealthDashboard)

### Remaining Code Quality Items (Lower Priority)
- [ ] Reduce component sizes (DigitalOnboarding: 1206 lines, AdviceOSDashboard: 1023 lines)
- [ ] Replace index-as-key in 236 instances
- [ ] Add type hints to Python public APIs
- [ ] Replace `random` with `secrets` module in sensitive operations
- [ ] Remove 253 console.log statements for production
- [ ] Reduce nested ternaries (2,344 instances)
- [ ] Split server.py imports into modules (129 imports)

## Testing Status
- Backend: 100% (12/12 tests in iteration_121 — security regression)
- Frontend: 100% (all verified in iteration_121)
- Test reports: /app/test_reports/iteration_119.json, iteration_120.json, iteration_121.json
