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
├── knowledge_graph/       # Graph DB, query engine (refactored), AI engine
└── routes/
    ├── buffett_engine.py  # Live Buffett-style stock screening
    └── scenario_templates.py  # AST-based safe arithmetic parser (no eval)

/app/frontend/src/
├── App.js                 # PortfolioProvider with per-client data switching
├── components/
│   ├── advice_os/         # 7 extracted AdviceOS sub-components
│   ├── onboarding/        # 7 extracted onboarding section components
│   ├── LanguageContext.jsx # i18n (4 languages, 90+ keys per language)
│   └── DocumentManager.jsx # useMemo for filtered docs
├── utils/
│   ├── apiClient.ts       # Typed API client
│   ├── types.ts           # Shared TS types
│   └── hooks.ts           # Shared typed utilities
└── pages/                 # All page components
```

## What's Been Implemented

### Code Quality Report Fixes (March 31, 2026)
**Critical:**
- [x] Replaced last `eval()` in scenario_templates.py with AST-based safe arithmetic parser
- [x] Fixed 6 array-index-as-key patterns (RiskControlMapping, DataAggregators, AIInsights)
- [x] Fixed missing hook dependencies in XplanSyncPage, XplanIntegration, WorkflowDashboard (useCallback)
- [x] XSS already sanitized with DOMPurify (NotificationCenter, EnterpriseComplianceDashboard)

**Important:**
- [x] Moved client_token from localStorage to sessionStorage (ClientPortalMerged)
- [x] Refactored query_engine.py: extracted _calculate_sector_exposure, _find_overweight_sectors, _assess_retirement_risk, _calculate_risk_factors
- [x] Added useMemo for filter/map operations (DocumentManager, WorkflowAutomation)

**Nice-to-Have:**
- [x] Removed all console.log/warn/debug/info from frontend (238+ statements)
- [x] Replaced random.choice with secrets.choice in load tests
- [x] 317 instances of == True/False → is True/False in test files
- [x] Nested ternaries refactored (RetirementConfidence, StrategicPlanning)

### Previous Session Work
- [x] Per-client data switching (5 CRM clients with unique family/trust/company data)
- [x] AdviceOSDashboard split: 1084 → 356 lines (7 sub-components)
- [x] DigitalOnboarding split: 1369 → 601 lines
- [x] Buffett Ideas: Mock data → Live Yahoo Finance API
- [x] i18n: 90+ translation keys across EN, ZH, VI, EL
- [x] TypeScript: apiClient.ts, types.ts, hooks.ts
- [x] Security patches (eval, XSS, sessionStorage, secrets module)

## Remaining Backlog
- [ ] Fix 93 possibly undefined Python variables (needs per-file audit)
- [ ] Wire i18n keys into page JSX (keys exist, not consumed yet)
- [ ] Convert AuthContext.jsx, LanguageContext.jsx to .tsx
- [ ] Refactor 12 oversized components (>300 lines): Layout, DocuSignIntegration, ComplianceAuditTools, MFASetup, WorkflowAutomation
- [ ] Reduce hook dependencies in RetirementConfidence (14 deps), HybridEngineView (12), RetirementPlanner (10)
- [ ] Increase Python type hint coverage from 46.4%
- [ ] Reduce 2469 nested ternaries across remaining files
- [ ] Reduce import bloat in Client360View (102), RetirementConfidenceEngine (102), RetirementPlanner (101)

## Testing
- iteration_125: Backend 100% (16/16), Frontend 100% — code quality fixes validated
- iteration_124: Frontend 100% — per-client data switching verified
- iteration_123: Backend 93%, Frontend 100% — AdviceOS split + Buffett API
