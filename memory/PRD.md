# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform for HNW clients with consolidated views, client context switching, scenario modelling, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Centralized Data**: `/app/frontend/src/data/clientData.js` (single source of truth: $9.61M Thompson, $22.8M Chen, etc.)


## Phase 2 — Retirement Decision OS — STATUS: STABLE (22 April 2026, Iter 197)

### ✅ Completed (latest)
- **Retirement Readiness Engine** (`/app/frontend/src/engine/retirementReadinessEngine.js`): 0–100 composite from 5 weighted factors (Income Sustainability 30%, Probability 25%, Funding 20%, Risk 15%, Flexibility 10%).
- **Readiness Cache** (`readinessCache.js`): 5-min TTL keyed by (clientId, inputs, opts). Prunes at 200 entries. Emits compliance beacons. Market-feed event bus (45s ticker).
- **Rules Engine** (`rulesEngine.js`): 17 rules (R1–R17) covering alerts (readiness, probability, withdrawal, concentration) + opportunities (concessional, non-concessional, SMSF, spouse equalisation, reversionary pension, TTR, downsizer, carry-forward).
- **Retirement Control Center** (`/retirement-control-center`): book KPIs, intelligence feed, priority clients, all-clients table.
- **Client Decision Hub** (inside `/client-360`): 6 sections — Outcome, What Moves The Needle, Scenario Simulator, Risk Panel, Opportunity Engine, Financial Decision Graph.
- **Financial Decision Graph** (`DecisionGraph.jsx`): SVG action → factor → outcome visualisation.
- **Client Home** (`/client-home`): simplified score + future income + gap + next best action + what-if sliders.
- **Compliance audit** (`/api/compliance-audit/readiness-events`): POST/GET/summary. In-memory store.
- **Email Resend** (`/api/email-resend/send`): MOCKED — pending user-provided `RESEND_API_KEY`.

### ⏳ P2 / Backlog
- Deeper event-driven recalc (hook to real market feed, inflation publish).
- `RESEND_API_KEY` drop-in to flip email from mocked → live.
- Persist compliance audit log to MongoDB (currently in-memory).
- P3: Execution Rails, Advice Marketplace, Open API platform, White-label infra.


## Completed (21 April 2026) — Iteration 180 (Phase 1 of 6-feature batch)

### P0 — Adviser SMSF + Super & Pension tabs (VERIFIED)
- `SuperOptimiser` embedded in Adviser client view (`/dashboard` when `app_mode=adviser` + client selected) under a new **Super & Pension** tab
- `SMSFOptimizer` wired into a dedicated **SMSF** tab
- 9 tabs total on UnifiedClientOverview: Overview · Retirement · Investments · Budget · Goals · Tax Centre · Super & Pension · SMSF · Invoicing
- Features (all on `SuperOptimiser.jsx`):
  - Concessional cap with annual indexing (FY24 $27,500 → FY29 $35,000)
  - Non-concessional cap with 4× multiplier + 3-year bring-forward
  - 5-yr carry-forward of unused concessional (balance <$500k)
  - Div 293 additional 15% tax >$250k combined income
  - Pre-tax vs post-tax comparison with marginal rate ladder (2025 AU brackets)
  - **All inputs are sliders** (salary sacrifice, NCC, return rate) — user spec
  - **% portfolio return slider** (3% to 10% in 0.5% steps)
  - **Legal Rules editor** — toggle/edit caps, contributions tax %, Div 293 threshold, multipliers, carry-fwd limit. Any policy change instantly re-computes all scenarios
  - Up to 10 side-by-side scenarios with comparison table + projection chart with preservation-age reference line

### P0 — Simple Client View wired to client mode (DONE)
- `DashboardRouter` in `App.js` now routes:
  - `app_mode === 'adviser'` + selected client → UnifiedClientOverview
  - `app_mode === 'client'` → **SimpleClientView** (restricted)
  - else → UnifiedDashboard
- `SimpleClientView.jsx` — 5 tabs only (Snapshot · Investments · Retirement · Documents · Messages), strictly read-only, derived entirely from `CLIENT_DATA.thompson_family`
- No editable inputs that can affect adviser calculations — verified by testing agent

### P1 — Rockstar CRM (`/rockstar-crm`) (DONE)
New top-level page with 4 power-tool tabs and a sidebar entry ("CRM [PRO]"):

1. **Segmentations** (`ClientSegmentations.jsx`)
   - 7 preset segments (HNW/UHNW/Pre-Retirees/Accumulators/Aggressive/Conservative/Business Owners) + All Clients
   - Custom segment builder: name, min/max net worth, min/max age, risk profile, service tier (Platinum/Gold/Silver/Bronze)
   - Live filtered client list with AUM sum
   - "Target in Campaign" button pushes selected cohort to Newsletter tab

2. **Newsletters & Comms** (`NewsletterBuilder.jsx`)
   - 5 templates: Market Update · EOFY Tax · Annual Review Reminder · Super Legislation · New Client Welcome
   - Campaign editor with merge tags `{{first_name}}`, `{{adviser_name}}`, `{{asx_change}}`, etc.
   - Preview toggle · Save Draft · Send (MOCK — shows toast, stores to localStorage)
   - Campaign history with sent/draft status, provider selector (Resend/SendGrid/Mailgun mock stubs)

3. **SOA / ROA Compliance** (`ComplianceTracker.jsx`)
   - Tracks 6 legal doc types: FSG · SOA · ROA · FDS · Annual Review · Opt-In Renewal
   - Legal cadences (12mo most, SOA/ROA on-advice)
   - 5 stat cards: Firm Compliance % · Signed · Overdue · Due<30d · Awaiting
   - Filter by doc type + status + search; Mark Signed / Remind actions
   - Bulk-remind-overdue action

4. **E-Signatures** (`DocuSignMock.jsx`)
   - Send envelope: 7 doc templates (SOA/ROA/FDS/Opt-In/Engagement Letter/POA/SMSF Trust Deed) + recipient from client list + provider (DocuSign/Adobe Sign/signNow mock)
   - Status chain: draft → sent → viewed → signed / declined
   - Audit log per envelope · Reminder · Download · Delete
   - 4 stat cards: Total · Pending · Signed · Declined

### Stress & Runtime Testing
- Testing agent iteration 180: **10/10 acceptance criteria PASS, 0 page errors**
- Rapid navigation across /rockstar-crm → /dashboard (adviser) → /adviser-hub → /dashboard (client): no crashes, no chunk loads errors
- Fixed Review Pack floating panel overlay issue (added `xl:pr-[350px]` on UnifiedClientOverview)
- Added data-testids to all Compliance + DocuSign stat cards for future regression coverage

## HNW Client Profiles (unchanged)
| ID | Name | Net Worth | Age | Risk | Retire |
|----|------|-----------|-----|------|--------|
| thompson_family | David & Sarah Thompson | $9.6M | 50 | Balanced | 67 |
| chen_family | Michael & Lisa Chen | $22.8M | 49 | Growth | 60 |
| client_3 | Robert Mitchell | $9.6M | 62 | Conservative | 65 |
| client_4 | Emma & David Williams | $2.8M | 39 | Growth | 67 |
| client_5 | Raj & Priya Patel | $17.5M | 54 | Aggressive | 60 |
| client_6 | Anderson Partnership | $18.3M | 59 | Balanced | 65 |
| client_7 | Sarah Kim | $10.2M | 34 | Aggressive | 50 |

## Key Routes
- `/dashboard` → smart router (adviser client overview OR simple client view OR unified dashboard)
- `/rockstar-crm` → new 4-tab CRM (Segmentations, Newsletters, Compliance, E-Signatures)
- `/adviser-hub`, `/adviser-compliance`, `/macro-dashboard`, `/daily-briefing`, `/retirement-confidence`, etc.
- `/crm` → redirects to `/rockstar-crm`

## Mocked Integrations (bring-your-key-later stubs, per user spec)
- Email: Resend, SendGrid, Mailgun — toasts + localStorage only
- E-Signature: DocuSign, Adobe Sign, signNow — simulated webhook progression
- Xplan sync — existing mock
- MyGov / ATO — deep-link only

## Backlog
- [ ] P2: Real email provider integration (Resend/SendGrid) — user to provide API key
- [ ] P2: Real DocuSign API (when user brings key)
- [ ] P2: Replace Mock Xplan sync with real API
- [ ] P3: Further refactor App.js (currently ~1025 lines)
- [ ] P3: Webpack chunk error suppression — current ErrorBoundary handles it, but could be cleaner

## Testing Status
- **Iteration 196 (Feb 2026): 10/11 PASS — Phase 2 Retirement Decision OS shipped. Intelligence Feed now has 3 always-on cards (fix applied post-test).**
- Iteration 195: 100% PASS — DocumentVault shape fix
- Iteration 194: 100% PASS — Xplan TDZ + /api/documents 307
- Iteration 193: 100% PASS — Resend, SimpleClientView split, ESLint, debounce
- Iteration 192: 100% PASS — Nav restructure + Client view layout
- No broken flows, no runtime errors across main routes

## Phase 2 Retirement Decision OS (Feb 2026)
Core IP shipped as pure client-side JS modules so scenario recalc is instant.

### Engine
- `/app/frontend/src/engine/retirementReadinessEngine.js` — 0-100 composite from 5 weighted factors: Income Sustainability 30% · Probability of Success 25% · Funding Adequacy 20% · Risk Exposure 15% · Flexibility 10%. Monte Carlo (300 runs) uses the existing `projectRetirement`. Emits `{ score, classification, factors, outcome: { sustainableIncome, probabilityOfSuccess, fundingGap, yearsSustainability, confidenceBands }, inputs }`. Also exports `whatMovesTheNeedle(client)` (top-3 score uplifts) and `riskPanel(client)`.
- `/app/frontend/src/engine/rulesEngine.js` — 10 deterministic rules firing alerts + opportunities (score <60 critical; probability <70 high; concessional gap; funding gap; sequence risk; concentration; cash drag; high-rate debt; insurance gap; withdrawal >5.5%).
- `/app/frontend/src/engine/bookAggregator.js` — book-wide KPIs, intelligence feed, priority ranking.

### Views
- `/retirement-control-center` — new adviser dashboard (Book KPIs · Intelligence Feed · Priority Clients · sortable Client List).
- `ClientDecisionHub` — default first tab inside `Client360View` (5 sections: Outcome · What Moves The Needle · Scenario Simulator · Risk Panel · Opportunity Engine). Live slider recalc verified (90 → 54 when spending raised + retire age lowered).
- `/client-home` — simplified client view (Score · Future Income · Gap · Next Best Action + live what-if tool). Added to clientPortalNav.

### Classifications
Score 90+ Strong · 75-89 On Track · 60-74 Watchlist · <60 At Risk.

## Recent Changes (Feb 2026)
- **Phase 2 Retirement Decision OS** — see section above.
- Resend email backend, ESLint no-undef, Xplan MOCKED badge, DocumentVault client CTA, SimpleClientView split, Recharts debounce, /api/documents shape — all in iter 193-195.

## Recent Changes (Feb 2026)
- **Client view additions (iter 190-191)** — Added "Goals & Scenarios" tab (uses `SimpleGoals`), merged the standalone Sandbox tab INTO the Retirement tab as "Try Your Own Scenarios" card, and mapped `/client-portal` to `DashboardRouter` so both `/dashboard` and `/client-portal` route to `SimpleClientView` in client mode.
- **Adviser Portfolio Rebalancing** — Added as a Rebalance tab inside `Client360View` and `UnifiedClientOverview`, plus a "Portfolio" nav group in `clientContextNav` with a direct link to `/portfolio-rebalancing`.
- **Refactor** — `Client360View.jsx` split from 1843 lines → 255 lines. Heavy sections moved to `pages/client360/` (`data.js`, `utils.js`, `ClientHeader`, `OverviewTab`, `HoldingsTab`, `PerformanceSection`, `ContactAdvisorSection`). Zero behavior change, 100% test pass (iter 188).
- `/app/frontend/src/components/AdviserGoals.jsx` — goal CRUD with budget feasibility banner; adjusts-budget CTA when goals exceed monthly surplus
- `/app/frontend/src/components/RecommendationsBanner.jsx` — NEW reusable "top-of-page" recommendations card used across CGT, Tax Analysis, Strategic Planning; Tax Loss Harvesting keeps its native Recommendations card but moved to TOP of results
- Replaced SimpleGoals with AdviserGoals in `UnifiedClientOverview`, `Client360View`, `UnifiedGoalsPlanning`
- SimpleGoals retained for client read-only view (SimpleClientView Goals & Scenarios tab)

