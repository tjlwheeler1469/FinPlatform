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
├── route_registry.py      # Centralized route registration (121+ routes)
├── knowledge_graph/       # Graph DB, query engine (refactored), AI engine
└── routes/
    ├── buffett_engine.py  # Live Buffett-style stock screening
    └── scenario_templates.py  # AST-based safe arithmetic parser (no eval)

/app/frontend/src/
├── App.js                 # PortfolioProvider with per-client data switching
├── components/
│   ├── advice_os/         # 7 extracted AdviceOS sub-components
│   ├── layout/            # Split Layout sub-components (DesktopSidebar, MobileMenu, navData)
│   ├── docusignData.js    # Extracted static data from DocuSignIntegration
│   ├── complianceData.js  # Extracted static data from ComplianceAuditTools
│   ├── mfaUtils.js        # Extracted utility functions from MFASetup
│   ├── workflowData.js    # Extracted static data from WorkflowAutomation
│   └── LanguageContext.jsx # i18n (4 languages, 90+ keys per language)
├── utils/
│   ├── apiClient.ts       # Typed API client
│   ├── types.ts           # Shared TS types
│   └── hooks.ts           # Shared typed utilities
└── pages/                 # All page components
```

## What's Been Implemented

### Component Splitting — Phase 2 (March 31, 2026)
- [x] DocuSignIntegration.jsx: 728 → 632 lines (extracted DOCUMENT_TEMPLATES, INITIAL_SIGNATURE_REQUESTS, MOCK_CLIENTS → docusignData.js)
- [x] ComplianceAuditTools.jsx: 638 → 600 lines (extracted KYC_CHECKLIST, MOCK_CLIENTS, INITIAL_ACTIVITY_LOG → complianceData.js)
- [x] MFASetup.jsx: 594 → 562 lines (extracted generateSecret, generateBackupCodes, verifyTOTP, formatSecret → mfaUtils.js)
- [x] WorkflowAutomation.jsx: 596 → 535 lines (extracted WORKFLOW_TEMPLATES, MOCK_CLIENTS → workflowData.js)
- [x] Full health check: Backend 100% (11/11), Frontend 100% — Iteration 126

### Component Splitting — Phase 1 (March 31, 2026)
- [x] Split AdviceOSDashboard.jsx (1084 → 356 lines) into components/advice_os/ (7 sub-components)
- [x] Split Layout.jsx (1024 → 175 lines) into navData.js, DesktopSidebar.jsx, MobileMenu.jsx

### Code Quality Report Fixes (March 31, 2026)
**Critical:**
- [x] Replaced last eval() in scenario_templates.py with AST-based safe arithmetic parser
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
- [x] DigitalOnboarding split: 1369 → 601 lines
- [x] Buffett Ideas: Mock data → Live Yahoo Finance API
- [x] i18n: 90+ translation keys across EN, ZH, VI, EL
- [x] TypeScript: apiClient.ts, types.ts, hooks.ts
- [x] Security patches (eval, XSS, sessionStorage, secrets module)

## Remaining Backlog
- [ ] P1: Wire i18n keys into page JSX (translations exist in LanguageContext.jsx, not consumed yet)
- [ ] P1: Convert context providers to TypeScript (AppModeContext.jsx, AuthContext.jsx, NotificationsContext.jsx → .tsx)
- [ ] P2: Reduce remaining nested ternaries (~2469 instances)
- [ ] P2: Reduce import bloat in Client360View.jsx (102 imports)
- [ ] P2: Increase Python type hint coverage from 46.4%
- [ ] P2: Add unit tests for advice_os sub-components
- [ ] P2: Add Recharts minWidth/minHeight to suppress console warnings
- [ ] P2: Fix 93 possibly undefined Python variables (needs per-file audit)

## Testing
- iteration_126: Backend 100% (11/11), Frontend 100% — Component splitting Phase 2 + health check
- iteration_125: Backend 100% (16/16), Frontend 100% — code quality fixes validated
- iteration_124: Frontend 100% — per-client data switching verified
- iteration_123: Backend 93%, Frontend 100% — AdviceOS split + Buffett API
