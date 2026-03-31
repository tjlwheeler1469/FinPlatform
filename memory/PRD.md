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
├── route_registry.py      # Centralized route registration (120+ routes)
└── routes/
    └── buffett_engine.py  # Live Buffett-style stock screening

/app/frontend/src/
├── App.js                 # PortfolioProvider with per-client data switching (CLIENT_FAMILY_DATA)
├── components/
│   ├── advice_os/         # 7 extracted AdviceOS sub-components
│   ├── onboarding/        # 7 extracted onboarding section components
│   └── LanguageContext.jsx # i18n (4 languages, 90+ keys per language)
├── utils/
│   ├── apiClient.ts       # Typed API client (BuffettScreenResponse, etc.)
│   ├── types.ts           # Shared TS types
│   └── hooks.ts           # Shared typed utilities
└── pages/                 # All page components
```

## What's Been Implemented

### Per-Client Data Switching (March 31, 2026)
- [x] CLIENT_FAMILY_DATA: 5 client datasets (Wheeler, Chen, Mitchell, Williams, Patel)
- [x] PortfolioProvider listens to selectedClient from localStorage and swaps familyMembers/trust/company
- [x] Client360View: DEMO_CLIENT_DATA for all 5 clients
- [x] Fixed TrustDistributionAnalysis crash on empty beneficiaries

### Code Quality (March 2026)
- [x] AdviceOSDashboard: 1084 → 356 lines (7 sub-components)
- [x] DigitalOnboarding: 1369 → 601 lines (7 sections)
- [x] Buffett Ideas: Mock data → Live Yahoo Finance API
- [x] Nested ternaries refactored in RetirementConfidence, StrategicPlanning
- [x] i18n: 90+ translation keys across EN, ZH, VI, EL
- [x] TypeScript: apiClient.ts, types.ts, hooks.ts
- [x] Security patches (eval, XSS, sessionStorage, secrets module)

## Remaining Backlog
- [ ] Wire i18n keys into page JSX (keys exist, not consumed yet)
- [ ] Convert AuthContext.jsx, LanguageContext.jsx to .tsx
- [ ] Sidebar shows "Personal Mode" even when client selected (needs appMode integration fix)

## Testing
- iteration_124: Frontend 100% — bug fix verified (per-client data switching)
- iteration_123: Backend 93%, Frontend 100% — refactoring validated
