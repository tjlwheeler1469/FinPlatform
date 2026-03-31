# Wealth Command Centre - PRD

## Original Problem Statement
Build a comprehensive Australian wealth management platform for financial advisers with a universal AFSL-grade voice command engine, downloadable PDF reports, and multilingual support.

## Tech Stack
- **Frontend**: React 18 + TypeScript, TailwindCSS, Shadcn/UI, Recharts
- **Backend**: FastAPI, Motor (MongoDB), route_registry (124 routes)
- **AI/LLM**: OpenAI GPT-5.2, Whisper STT (Emergent LLM Key)
- **PDF**: ReportLab (professional PDF generation)

## Architecture
```
/app/backend/routes/
├── voice_command.py          # Universal AFSL-grade command engine (11 types)
├── pdf_report.py             # PDF report generator (all analysis types)
├── voice_retirement.py       # Dedicated retirement analysis
├── buffett_engine.py         # Live Buffett screening (Yahoo Finance)
└── scenario_templates.py     # AST-based safe arithmetic

/app/frontend/src/components/
├── VoiceAssistant.jsx        # 11 result cards + PDF download on hover
├── RetirementVoicePanel.jsx  # Retirement voice + what-if + PDF
├── Layout.jsx                # Floating mic + page context
└── LanguageContext.jsx       # i18n (EN/ZH/VI/EL)
```

## Voice Command Engine — 11 Response Types
1. retirement_analysis — Projections, super, CGT, franking, Age Pension
2. buffett_analysis — 8-criterion value investing (any ASX stock)
3. investment_comparison — Compare all asset classes
4. compliance_check — ASIC/AFSL/ROA/SOA/FDS/KYC/AML/BID (s961B)
5. soa_draft — Statement of Advice / Record of Advice structure
6. tax_calculation — CGT, franking, income tax, Div 293, Medicare
7. insurance_analysis — Life, TPD, Income Protection, Trauma
8. trust_strategy — Distribution optimization, beneficiary planning
9. scenario_analysis — What-if modelling, comparison
10. stock_insight — Market data, sector analysis
11. general — Catch-all

## PDF Report Generation
- POST /api/pdf-report/generate — accepts any analysis JSON, returns branded PDF
- Professional Halcyon branding (navy/gold)
- Dedicated builders for: retirement, Buffett, SOA, tax, compliance, insurance, trust, investment comparison
- Hover-visible download button on all voice result cards
- Dedicated download button on RetirementVoicePanel

## Completed Work (All Sessions)

### PDF Reports + Code Quality (March 31, 2026) - LATEST
- [x] PDF generation endpoint for all 11 analysis types
- [x] Professional branding (navy/gold, Halcyon headers)
- [x] Hover PDF download on voice result cards
- [x] RetirementVoicePanel dedicated PDF button
- [x] Python type hints: 18.5% → 50.8% (939/1850 functions)
- [x] Fixed _rng undefined name bugs in 4 route files
- [x] Added random import to xplan_mock.py
- [x] 44 lint issues auto-fixed
- [x] Iteration 130: Backend 100% (12/12), Frontend 100%

### Universal Voice Command Engine (March 31, 2026)
- [x] AFSL-grade system prompt with Australian tax/ASIC rules
- [x] 11 structured response types with dedicated cards
- [x] What-if session memory for follow-ups
- [x] Works on ANY page (no restrictions)

### Previous
- [x] i18n wired into 4 pages, TypeScript contexts
- [x] Component splitting (6 components)
- [x] Security (eval removed, sessionStorage, DOMPurify)
- [x] Buffett Ideas live API, per-client data switching

## Testing History
- iteration_130: Backend 100% (12/12), Frontend 100% — PDF + type hints
- iteration_129: Backend 100% (10/10), Frontend 100% — Universal engine
- iteration_128-123: All passing

## Remaining
- [x] All user-requested features complete
- Cosmetic: E741 ambiguous var names, E722 bare excepts, F841 unused locals
