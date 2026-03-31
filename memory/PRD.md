# Wealth Command Centre - PRD

## Original Problem Statement
Build a comprehensive Australian wealth management platform for financial advisers and their clients with a universal voice-powered AFSL-grade financial command engine.

## Tech Stack
- **Frontend**: React 18 + TypeScript (gradual migration), TailwindCSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), Motor (async MongoDB), route_registry (123 routes)
- **Database**: MongoDB
- **AI/LLM**: OpenAI GPT-5.2 (universal command engine), Whisper STT (via Emergent LLM Key)

## Architecture
```
/app/backend/routes/
├── voice_command.py          # Universal AFSL-grade voice command engine (11 response types)
├── voice_retirement.py       # Dedicated retirement analysis
├── voice_assistant.py        # Legacy voice assistant
├── buffett_engine.py         # Live Buffett-style screening (Yahoo Finance)
└── scenario_templates.py     # AST-based safe arithmetic

/app/frontend/src/components/
├── VoiceAssistant.jsx        # Site-wide command engine with 11 result card types
├── RetirementVoicePanel.jsx  # Retirement page voice + what-if
├── Layout.jsx                # Passes currentPath for page context
└── LanguageContext.jsx       # i18n (4 languages)
```

## Voice Command Engine — 11 Response Types
1. **retirement_analysis** — Projections, super, CGT, franking, Age Pension
2. **buffett_analysis** — 8-criterion value investing analysis for ANY ASX stock
3. **investment_comparison** — Compare asset classes (equities, bonds, property, cash, alternatives)
4. **compliance_check** — ASIC, AFSL, ROA, SOA, FDS, KYC/AML, Best Interest Duty (s961B)
5. **soa_draft** — Statement of Advice / Record of Advice structure
6. **tax_calculation** — CGT, franking credits, income tax, Div 293, Medicare
7. **insurance_analysis** — Life, TPD, Income Protection, Trauma needs analysis
8. **trust_strategy** — Distribution optimization, beneficiary planning
9. **scenario_analysis** — What-if modelling, comparison scenarios
10. **stock_insight** — Market data, sector analysis
11. **general** — Catch-all for any other financial question

## Completed Work

### Universal Voice Command Engine (March 31, 2026) - LATEST
- [x] AFSL-grade system prompt with Australian tax rules, ASIC requirements, Buffett criteria
- [x] 11 structured response types with dedicated frontend result cards
- [x] Buffett analysis for all ASX stocks (8 criteria: moat, ROE, debt, cash flow, etc.)
- [x] Investment class comparison (equities, bonds, property, cash, alternatives)
- [x] SOA/ROA draft generation with Best Interest Duty (s961B) compliance
- [x] CGT, franking credits, Div 293, Medicare calculations
- [x] Insurance gap analysis (life, TPD, income protection, trauma)
- [x] Trust distribution strategy optimization
- [x] Compliance checks with regulatory references
- [x] What-if session memory for follow-up scenarios
- [x] Works on ANY page — no restrictions
- [x] Iteration 129: Backend 100% (10/10), Frontend 100%

### Previous Work (All Complete)
- Site-wide floating voice button with page context
- i18n wired into 4 pages (EN, ZH, VI, EL)
- TypeScript context providers
- Component splitting (6 components)
- Security patches (eval, XSS, sessionStorage)
- Code quality (memoization, hook deps, ternaries)

## Testing History
- iteration_129: Backend 100% (10/10), Frontend 100% — Universal command engine
- iteration_128: Backend 73% (LLM budget), Frontend 100%
- iteration_127-123: All 100%

## Remaining Backlog
- [ ] P2: Python type hint coverage (46.4%)
- [ ] P2: 93 possibly undefined Python variables
