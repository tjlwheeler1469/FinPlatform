# Wealth Command Centre - PRD

## Original Problem Statement
Build a comprehensive Australian wealth management platform for financial advisers and their clients with voice-powered financial analysis, multilingual support, and compliance-first decision support.

## Tech Stack
- **Frontend**: React 18 + TypeScript (gradual migration), TailwindCSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), Motor (async MongoDB), route_registry (123 routes)
- **Database**: MongoDB
- **AI/LLM**: OpenAI GPT-5.2 (voice command router, retirement analysis, chat), Whisper STT (via Emergent LLM Key)
- **Market Data**: Yahoo Finance (yfinance) with caching

## Architecture
```
/app/backend/
├── server.py                        # Main app (typed)
├── route_registry.py                # 123 routes
├── routes/
│   ├── voice_command.py             # Universal voice command router (page-context + what-if)
│   ├── voice_retirement.py          # Dedicated retirement analysis
│   ├── voice_assistant.py           # General voice assistant
│   ├── buffett_engine.py            # Live Buffett-style screening
│   └── scenario_templates.py        # AST-based safe arithmetic
└── tests/
    └── test_voice_command_adviceos.py  # Voice command + health tests

/app/frontend/src/
├── App.js
├── components/
│   ├── VoiceAssistant.jsx           # Site-wide context-aware voice assistant
│   ├── RetirementVoicePanel.jsx     # Retirement page voice + what-if
│   ├── Layout.jsx                   # Passes currentPath for voice context
│   ├── advice_os/                   # 7 extracted sub-components
│   ├── layout/                      # Split sidebar/menu
│   ├── docusignData.js, complianceData.js, mfaUtils.js, workflowData.js
│   └── LanguageContext.jsx          # i18n (4 languages, 90+ keys)
├── context/
│   ├── AppModeContext.tsx, AuthContext.tsx, NotificationsContext.tsx
└── pages/
    ├── RetirementPlanner.jsx        # + RetirementVoicePanel + what-if
    ├── AdviceOSDashboard.jsx, RetirementConfidence.jsx, StrategicPlanning.jsx, SharePortfolio.jsx  # i18n wired
```

## Completed Work

### Site-Wide Voice Command System (March 31, 2026) - P0
- [x] Unified /api/voice-command/process endpoint with page-context awareness
- [x] Context-aware routing: retirement (CGT/franking/pension), shares (stock insights), compliance, scenarios, general
- [x] What-if scenario modelling with session memory (stores previous analysis for follow-ups)
- [x] VoiceAssistant shows page context badge + context-specific hints per page
- [x] Structured result cards: Retirement, Stock, Compliance, Scenario
- [x] Floating voice button accessible on every page (Layout passes currentPath)
- [x] RetirementVoicePanel uses unified endpoint with what-if + scenario history
- [x] Audio transcription via Whisper + context-aware processing pipeline

### i18n Wiring + TypeScript + P2 Fixes (March 31, 2026)
- [x] i18n wired into AdviceOS, RetirementConfidence, StrategicPlanning, SharePortfolio
- [x] AppModeContext.tsx, AuthContext.tsx, NotificationsContext.tsx converted to TypeScript
- [x] 102 Recharts minWidth/minHeight fixes, 17 unused icons removed
- [x] Nested ternaries refactored in HoldingsPerformance, MacroDashboard
- [x] Python type hints added to server.py
- [x] Unit tests for voice command router

### Component Splitting (March 31, 2026)
- [x] AdviceOSDashboard 1084→356, Layout 1024→175
- [x] DocuSignIntegration 728→632, ComplianceAuditTools 638→600, MFASetup 594→562, WorkflowAutomation 596→535

### Previous Work
- [x] Buffett Ideas: Mock → Live Yahoo Finance
- [x] Per-client data switching (5 CRM clients)
- [x] Security: eval() removed, sessionStorage, DOMPurify
- [x] Code quality: memoization, hook deps, index-as-key, console.log cleanup

## Remaining Backlog
- [ ] P2: Increase Python type hint coverage beyond core files (46.4% overall)
- [ ] P2: Fix 93 possibly undefined Python variables (per-file audit)
- [ ] P2: Additional advice_os sub-component unit tests

## Testing History
- iteration_128: Backend 73% (LLM budget limit), Frontend 100% — Voice command router + what-if
- iteration_127: Backend 100% (7/7), Frontend 100% — Voice retirement + i18n + TS contexts
- iteration_126: Backend 100% (11/11), Frontend 100% — Component splitting + health check
- iteration_125: Backend 100% (16/16), Frontend 100% — Code quality fixes
