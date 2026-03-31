# Wealth Command Centre - PRD

## Original Problem Statement
Build a comprehensive Australian wealth management platform for financial advisers and their clients. Includes voice-powered retirement analysis, multilingual support, and compliance-first decision support.

## Tech Stack
- **Frontend**: React 18 + TypeScript (gradual migration), TailwindCSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), Motor (async MongoDB), route_registry pattern (122 routes)
- **Database**: MongoDB
- **AI/LLM**: OpenAI GPT-5.2 (retirement analysis, chat), Whisper STT (via Emergent LLM Key)
- **Market Data**: Yahoo Finance (yfinance) with 5-min caching

## Architecture
```
/app/backend/
├── server.py                        # Main app
├── route_registry.py                # 122 routes
├── routes/
│   ├── voice_retirement.py          # NEW: Voice-activated retirement analysis
│   ├── voice_assistant.py           # General voice assistant
│   ├── buffett_engine.py            # Live Buffett-style screening
│   └── scenario_templates.py        # AST-based safe arithmetic
└── knowledge_graph/

/app/frontend/src/
├── App.js                           # PortfolioProvider, routing
├── components/
│   ├── RetirementVoicePanel.jsx     # NEW: Voice retirement analyser panel
│   ├── VoiceAssistant.jsx           # Enhanced with retirement detection
│   ├── advice_os/                   # 7 extracted AdviceOS sub-components
│   ├── layout/                      # Split Layout sub-components
│   ├── docusignData.js              # Extracted static data
│   ├── complianceData.js            # Extracted static data
│   ├── mfaUtils.js                  # Extracted utility functions
│   ├── workflowData.js              # Extracted static data
│   └── LanguageContext.jsx          # i18n (4 languages, 90+ keys)
├── context/
│   ├── AppModeContext.tsx            # TypeScript conversion
│   ├── AuthContext.tsx               # TypeScript conversion
│   └── NotificationsContext.tsx      # TypeScript conversion
└── pages/
    ├── RetirementPlanner.jsx        # + RetirementVoicePanel integration
    ├── AdviceOSDashboard.jsx        # + i18n wired
    ├── RetirementConfidence.jsx     # + i18n wired
    ├── StrategicPlanning.jsx        # + i18n wired
    └── SharePortfolio.jsx           # + i18n wired
```

## What's Been Implemented

### Voice-to-Text Retirement Analysis (March 31, 2026) - NEW
- [x] Backend: POST /api/voice-retirement/analyze - GPT-5.2 structured retirement analysis
- [x] Backend: POST /api/voice-retirement/transcribe-and-analyze - Whisper STT + analysis pipeline
- [x] Frontend: RetirementVoicePanel component with mic button, text input, structured results display
- [x] Calculates: retirement fund needed, CGT liability, franking credits, Age Pension eligibility, entity breakdown
- [x] Floating voice assistant enhanced with retirement query detection
- [x] Integrated into Retirement Planner page

### i18n Wiring (March 31, 2026)
- [x] AdviceOSDashboard: title, subtitle, disclaimer, tab labels, metric labels
- [x] RetirementConfidence: title, subtitle
- [x] StrategicPlanning: title, subtitle
- [x] SharePortfolio: title, subtitle
- [x] 4 languages supported: English, Chinese, Vietnamese, Greek

### TypeScript Context Providers (March 31, 2026)
- [x] AppModeContext.tsx - Full typed context with AppMode union type
- [x] AuthContext.tsx - Full typed auth flow (login, register, logout, authFetch)
- [x] NotificationsContext.tsx - Full typed notifications (add, mark read, preferences)

### P2 Tasks (March 31, 2026)
- [x] Added minWidth/minHeight to 102 Recharts ResponsiveContainer instances
- [x] Removed 17 unused lucide-react icons from Client360View.jsx (57→40 icons)

### Component Splitting - Phase 2 (March 31, 2026)
- [x] DocuSignIntegration: 728→632 lines → docusignData.js
- [x] ComplianceAuditTools: 638→600 lines → complianceData.js
- [x] MFASetup: 594→562 lines → mfaUtils.js
- [x] WorkflowAutomation: 596→535 lines → workflowData.js

### Previous Session Work
- [x] Split AdviceOSDashboard (1084→356) into advice_os/ (7 sub-components)
- [x] Split Layout (1024→175) into navData.js, DesktopSidebar, MobileMenu
- [x] Buffett Ideas: Mock → Live Yahoo Finance API
- [x] Per-client data switching (5 CRM clients)
- [x] Security: eval() removed, tokens in sessionStorage, DOMPurify
- [x] Code quality: memoization, hook deps, index-as-key fixes

## Remaining Backlog
- [ ] P2: Reduce nested ternaries (~2469 instances, target high-impact files)
- [ ] P2: Increase Python type hint coverage from 46.4%
- [ ] P2: Add unit tests for advice_os sub-components
- [ ] P2: Fix 93 possibly undefined Python variables

## Testing History
- iteration_127: Backend 100% (7/7), Frontend 100% — Voice retirement + i18n + TS contexts
- iteration_126: Backend 100% (11/11), Frontend 100% — Component splitting Phase 2 + health check
- iteration_125: Backend 100% (16/16), Frontend 100% — Code quality fixes
- iteration_124: Frontend 100% — Per-client data switching
- iteration_123: Backend 93%, Frontend 100% — AdviceOS split + Buffett API
