# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform for HNW clients with consolidated views, client context switching, scenario modelling, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Storage**: Emergent Object Storage for client document uploads
- **Centralized Data**: `/app/frontend/src/data/clientData.js`

## HNW Client Profiles
| ID | Name | Net Worth | Gross Assets | Age | Risk | Retire |
|----|------|-----------|-------------|-----|------|--------|
| thompson_family | David & Sarah Thompson | $9.6M | $11.7M | 50 | Balanced | 67 |
| chen_family | Michael & Lisa Chen | $22.8M | $24.0M | 49 | Growth | 60 |
| client_3 | Robert Mitchell | $9.6M | $9.6M | 62 | Conservative | 65 |
| client_4 | Emma & David Williams | $2.8M | $4.0M | 39 | Growth | 67 |

## Completed (20 April 2026) — Iteration 2
- [x] Adviser Client Dashboard redesign (separate previous entry preserved below)
| client_5 | Raj & Priya Patel | $17.5M | $19.6M | 54 | Aggressive | 60 |
| client_6 | Anderson Partnership | $18.3M | $22.0M | 59 | Balanced | 65 |
| client_7 | Sarah Kim | $10.2M | $11.3M | 34 | Aggressive | 50 |

## Key Features
### Monte Carlo Scenario Engine (Goals tab)
Connected flow: Budget → Investments → Portfolio → Retirement with 500 MC simulations, confidence bands, trajectory chart

### Adviser Notification Customisation
Toggle-based: review due, market alerts, compliance, client contact, portfolio rebalance, FDS, document signed, onboarding, insurance, birthdays

### Client Invoicing (Profile tab)
Create invoices with line items + GST, status tracking (draft→sent→paid), demo invoices

### Client Portal Onboarding (/client-portal)
Complete Your Profile: ID upload (passport/licence), TFN input (AES-256 encrypted), contact detail updates, Sync to Xplan (MOCKED)

## Completed (as of 16 April 2026)
- [x] Adviser notification customisation (10 toggles, 5 categories, MongoDB persistence)
- [x] Client invoicing from CRM (create/send/mark paid, GST calculation)

## Completed (20 April 2026) — Iteration 1 (prior batch)
- [x] Adviser Dashboard scaled to HNW book (~$480M AUM, 47 clients, $4.52M revenue via practice_health.py)
- [x] Client portal ID upload + TFN + info updates → Xplan (MOCKED)
- [x] HNW numbers across all 7 profiles ($3M-$25M)
- [x] Centralized clientData.js — all components import from single source
- [x] Monte Carlo scenario engine with trajectory chart + confidence bands
- [x] BAS Calculator field labels, Combined adviser client view
- [x] All Wheeler references eliminated

## Completed (20 April 2026) — Iteration 3
- [x] **Scenario Volatility Slider (σ)** added to the embedded Monte Carlo on the Adviser Client Dashboard — σ 4%–24% with labels Conservative / Balanced / Growth / Aggressive (data-testid `slider-volatility`)
- [x] **PDF Invoice generation** wired via jsPDF + jspdf-autotable — each invoice has a Download PDF button (branded Halcyon Wealth header, line items, GST breakdown, Bill To)
- [x] **Generate Review Pack** on dashboard now produces a real multi-page PDF (Household Summary + What Changed + Risks/Alerts + Recommendations) via jsPDF
- [x] **Adviser Command Center deep-links** — Next Best Actions, Portfolio Alerts fallbacks, and Tasks all navigate to the specific client's `/dashboard` when clicked (via `navigateToClient()` helper)
- [x] **Client resolution helper** `/lib/navigateToClient.js` maps slugs/names/IDs → `CLIENT_DATA` slug; used across firm-wide adviser views for consistent deep-linking
- [x] **Invoicing tab** mounted on the Client Overview (previously orphaned component)
- [x] **Platform design-system primitives** created for future roll-out:
  - `/components/platform/PageShell.jsx` — standardized page framework (header + hero metrics + CTAs + optional ActionRail slot)
  - `/components/platform/ActionRail.jsx` — universal right-side panel (Recommendations, Next Best Actions, Meeting Prep, Generate Review Pack CTA)
  - `/components/platform/WhatChangedPanel.jsx` — reusable delta panel
- [x] Verified via testing agent iteration_162: 9/9 items passing (PDF toasts, volatility slider, deep-link nav to all 5 clients, no regressions)
- [x] **Adviser Client Dashboard complete redesign** — premium decision-density layout replacing Overview tab content:
  - Sticky header: client identity + NW + Confidence + Risk + Live timestamp + 3 CTAs (Improve Outcome, Run Scenario, Generate Review Pack)
  - Row 1: 3 hero cards — Retirement Readiness (confidence ring + surplus + top risk), Alerts & Exceptions (traffic-light dots), Opportunities (ranked by $ impact)
  - Row 2: 60/40 split — Household Financial Map (grouped by asset type) + Embedded Live Scenario Engine with 3 Monte Carlo sliders (retire age, spending, contributions) that live-update confidence
  - Row 3: Today's Priorities + Meeting Prep (with Generate Review Pack)
  - Row 4: What Changed Since Last Review delta tiles
- [x] Other tabs (Actions/Retirement/Investments/Budget/Goals/Tax Centre) preserved intact
- [x] `projectRetirement` exported from ScenarioEngine for reuse
- [x] Verified across all 7 HNW clients ($2.77M–$22.80M NW) — tested iteration_161 (100% pass)
- [x] AdvisorCommandCenter + AdviserDashboard now derive numbers from clientData.js (single source)
- [x] ErrorBoundary "Hard Refresh" button — clears caches/service workers, bypasses cache on reload
- [x] lazyRetry fallback shows "Reload" + "Hard Refresh" CTAs for chunk-loading errors
- [x] ClientOnboarding: per-field "Save" spinner + inline "synced <timestamp>" confirmation
- [x] ClientOnboarding: "Continue to myGov" button opens https://my.gov.au in new tab
- [x] ClientOnboarding: "ATO Online Services" button opens https://www.ato.gov.au in new tab
- [x] ClientOnboarding: "Sync to Xplan" now shows "Last synced <timestamp>" after sync (re-syncable)

## Backlog
- [ ] P2: Real email integration (Resend/SendGrid) for invoice delivery + client pack
- [ ] P2: Scenario volatility slider for Monte Carlo engine
- [ ] P2: Replace Mock Xplan sync with real API
- [ ] P3: PDF invoice generation (extend existing jsPDF)
- [ ] P3: Refactor App.js (1300+ lines) — extract inline CLIENT_FAMILY_DATA etc. into /src/data/*.js
- [ ] P3: PortfolioProvider polling (setInterval 500ms) → replace with context event subscription
