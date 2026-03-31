# Wealth Command Centre - PRD

## Original Problem Statement
Build a comprehensive Australian wealth management platform for financial advisers and their clients.

## Tech Stack
- **Frontend**: React 18 + TypeScript (gradual migration), TailwindCSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), Motor (async MongoDB), route_registry pattern
- **Database**: MongoDB
- **AI/LLM**: OpenAI GPT-5.2, Whisper (via Emergent LLM Key)
- **Market Data**: Yahoo Finance (yfinance) with 5-min caching

## Architecture
```
/app/backend/
├── server.py              # Main app (refactored, uses route_registry)
├── route_registry.py      # Centralized route registration (120 routes)
├── db.py                  # Database connection
└── routes/                # 120+ route modules

/app/frontend/src/
├── App.js                 # Routing + LanguageProvider
├── utils/
│   ├── apiClient.ts       # Typed API client (TypeScript)
│   └── formatters.ts      # Typed formatters (TypeScript)
├── components/
│   ├── Layout.jsx          # Nav + language selector + voice FAB
│   ├── VoiceAssistant.jsx  # Voice/text chat panel
│   ├── LanguageContext.jsx  # i18n (4 languages)
│   └── onboarding/         # 7 extracted section components
└── pages/                  # All page components
```

## What's Been Implemented (All Complete)

### P0-P3 Features (March 2026)
- [x] StockTrading with merged Buffett tab (5 tabs)
- [x] Live newsfeeds from backend API
- [x] 17 market indicators (indices, currencies, commodities)
- [x] Compliance Dashboard with MongoDB persistence
- [x] Voice-activated financial planning assistant (GPT-5.2)
- [x] Multi-language support (EN, ZH, VI, EL)

### Code Quality Fixes (March 2026)
- [x] eval() → ast.literal_eval + safe arithmetic parser
- [x] XSS: DOMPurify for dangerouslySetInnerHTML & document.write
- [x] Auth tokens: localStorage → sessionStorage
- [x] MD5 → SHA-256
- [x] Hardcoded secrets → env vars
- [x] React hook dependencies fixed

### Refactoring (March 2026)
- [x] server.py: 129 imports → route_registry.py (120 routes loaded)
- [x] DigitalOnboarding: 1369 → 601 lines (7 sections extracted)
- [x] random → secrets.SystemRandom() in 25+ files
- [x] console.log/warn/debug/info removed from production
- [x] 180 index-as-key patterns fixed
- [x] Python type hints on public API endpoints
- [x] TypeScript: tsconfig.json + apiClient.ts + formatters.ts

## Remaining Backlog
- [ ] Split AdviceOSDashboard.jsx (1023 lines)
- [ ] Connect Buffett Ideas to live backend API
- [ ] Extend i18n translations to all page content
- [ ] Replace `is` with `==` for literal comparisons in test files (501 instances)
- [ ] Reduce nested ternaries in worst offender components

## Testing
- iteration_122: Backend 100% (7/7), Frontend 100% (14/14 total)
