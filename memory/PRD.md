## April 2026 — Round 2 review fixes (test-suite cleanup)
- **Items 1, 2, 5 reconfirmed clean** from prior pass: `eval()` already replaced by `ast.literal_eval`, `data_feeds.py` random already uses `_stdrandom.Random(seed)`, 0 F821 undefined names.
- **Item 4 — `is` vs `==` in tests** (576 instances reported): mechanical fix applied via Python script. `is True/False/<int>` → `== True/False/<int>` and `is not …` → `!= …` across **60 test files, 352 lines**. `is None`/`is not None` idioms preserved correctly.
- **Follow-on E712 cleanup**: removed the now-redundant `== True/== False` (canonical Python form is `assert x` / `assert not x`) in **65 files, 364 lines**.
- **Misc test-suite hygiene**: deduped `practice_health` method in `load_test.py`, renamed ambiguous `l` → `lic`/`log` in 2 files, marked 11 unused `data = response.json()` locals with `_` to silence F841.
- **210/210 test files compile cleanly**. Backend ruff reports **All checks passed** across entire backend including tests.


## April 2026 — Code Quality / Security review fixes
- **eval() vulnerabilities**: Reviewed — `routes/scenario_templates.py` already uses `ast.literal_eval()`, no live `eval()` calls in production code (review report was stale). Test-file mentions are in comments/docstrings only.
- **Undefined variables (F821)**: 4 occurrences in `services/data_feeds.py` (`random.seed()` calls without `import random`). Fixed by importing `random as _stdrandom` and replacing each `random.seed(hash(x) % 2**32)` with a function-local deterministic `_rng = _stdrandom.Random(hash(x) % 2**32)` shadowing the module-level `secrets.SystemRandom`. Determinism preserved, lint silent.
- **Mutable default argument**: 1 found at `routes/tax.py:451` (`years: List[str] = ["2024-25", ...]`). Replaced with `years: Optional[List[str]] = None` + in-function default. Verified `/api/tax/comparison` still returns 3-year comparison.
- **Insecure random in production routes**: Replaced `random.randint/uniform/choice` with `secrets.SystemRandom()` instances in `client_pack_scheduler.py`, `live_data.py`, `confidence_history.py`. `market_snapshot.py` retained its deterministic `random.Random(seed)` pattern (correct for seeded mock output). Verified `/api/live/stock/CBA` returns valid data.
- **Dead-code locals (F841)**: 9 occurrences in `knowledge_graph/ai_engine.py`, `services/account_aggregation.py`, `services/ai_wealth_brief.py`, `services/ai_wealth_copilot.py`, `services/decision_engine.py`, `services/estate_planning.py`, `services/scenario_simulator.py`. Prefixed with `_` per Python convention; comments retained to mark "reserved for future use" intent.
- **Other lint**: E401 multi-imports auto-fixed in `routes/client_onboarding.py` + `routes/invoices.py`. F541 (f-string without placeholder) auto-fixed in 3 services files. E741 (ambiguous `l`) renamed to `log` in `services/audit_service.py`.
- **Backend lint**: `ruff` reports **0 errors** across `/app/backend` (excluding tests).
- **High-complexity refactors** (`_initialize_demo_data`, `get_portfolios_needing_rebalance`, `detect_cross_client_risks`, etc.): NOT addressed in this pass — these are large surgical refactors with no functional or security impact. Recommended as a follow-up sprint with a dedicated unit-test scaffold first.


## April 2026 — Budget Reform end-to-end
- **SOA recommendations engine** is now Budget-aware: `adviceDocumentEngine.js` detects investment properties + family trusts and:
  - Auto-inserts a "Tax law changes" amber callout section right after "Your reasons for seeking advice" — uses days-until countdowns and verbatim Budget rules.
  - Adds an investment-property recommendation (auditing cost base, grandfathering position, sell-pre-vs-sell-post-1-Jul-2027 modelling, restructure decision) sized by total inv-property value + inv-loan exposure.
  - Adds a discretionary-trust recommendation (1 Jul 2028 min-tax exposure, 3-year rollover relief).
  - Contribution-cap helper: estimates SG floor (11.5% × HH income) and reports remaining concessional cap room with marginal-tax-arbitrage saving math.
- **HouseholdBudget** now reads from + writes to the global `scenarioStore`. Editing line items propagates the new total monthlyIncome / monthlyExpenses through Retirement Workshop, Budget Reforms calculator, SOA Builder, etc.
- **New page `/budget-exposure`** (BudgetExposureReport.jsx) — Portfolio-wide table of every client's NG status, inv-property value, CGT now vs +1y post-reform, trust min-tax exposure, risk score (LOW/MEDIUM/HIGH). Includes a dedicated "Pre-1 July 2027 Sell-Window Alerts" section that lists clients with material CGT swing on B-transitional properties (the single biggest planning trigger). Countdown banner (414 / 780 days). One-click deep-link to each client's Budget Reforms page. Added to adviser Firm sidebar with REFORM badge.
- **New section type `callout`** in the SOA renderer (`SectionCallout` in AdviceDocumentBuilder.jsx) — amber-bordered alert with intro / bullets / source footer.


## April 2026 — 2026–27 Budget Tax Engine (Negative Gearing, CGT, Trust Reform)
- **Source documents reviewed verbatim**: budget.gov.au/content/downloads.htm → "Tax explainer — Negative Gearing and Capital Gains Tax Reform" + "Tax explainer — Minimum tax on discretionary trusts" + "Tax explainer — New tax cuts for Australian workers".
- **`lib/auTax.js` rewritten** to a date-aware engine encoding all policy rules: announcement date (12 May 2026 19:30 AEST), CGT/NG reform date (1 July 2027), trust reform date (1 July 2028). 26/26 unit tests in `auTax.test.mjs` pass.
  - `calculateTax(income, {refDate})`: applies WATO $250 offset post 1 Jul 2027.
  - `calculateCGT({propertyType, purchaseDate, saleDate, isMainResidence, isMeansTested, cumulativeCpi, electNewBuildDiscount, ...})`: 6 regimes — pre-reform-50pc-discount, post-reform indexation+30pc-min-tax, new-build-election (whichever cheaper), affordable-housing-60pc-discount, transitional-pre-and-post, main-residence-exempt.
  - `negativeGearingStatus({propertyType, purchaseDate, refDate})`: 5 statuses — A_grandfathered, B_transitional, C_post_reform, D_new_build, E_non_residential.
  - `applyRentalLossDeduction(...)`: quarantining rules for existing dwellings purchased post-announcement.
  - `calculateTrustMinimumTax(...)`: 30% min tax with franking-credit offset, corporate-no-credit, testamentary exclusion.
- **`lib/scenarioStore.js`**: new global in-memory + localStorage store. `useScenario()` / `useScenarioUpdater()` / `setScenario()`. Stable reference (no re-render loops). Cross-tab sync via storage event.
- **New page `/budget-reforms`** (BudgetReforms2027.jsx): tabbed UI — Property impact (NG status + CGT today vs +5y post-reform), Trust impact, "What changed" ASIC-style summary with policy citations. Linked from client-context sidebar with TAX badge.
- **Cross-page input flow**: RetirementWorkshop "Current Plan" base scenario writes through to the global store on every edit, so the same income/expenses/portfolio populate the Budget Reforms calculator and any future Tax tab.


## April 2026 — Calculation hardening + 10M-iteration stress test
- **Bug fix**: Numeric inputs on Retirement Workshop, Household Budget and Scenario Comparison accepted any string and propagated absurd values (e.g. `1e20`) into the surplus + Monte Carlo math. Display showed nonsensical "$10,416,799,999,999,975,000" surplus.
- **Fix**: Added `lib/inputBounds.js` with per-field clamps (`monthlyIncome` ≤ $5M, `currentPortfolio` ≤ $1B, ages 0-130, etc.), strips non-numeric paste, returns the field default for NaN/empty/Infinity. Wired into every adviser-input field on `RetirementWorkshop.jsx` (10 fields) and `HouseholdBudget.jsx` (5 fields).
- **Display**: Net monthly surplus + scenario-comparison rows now use `fmtCurrencyCompact` (always emits `$1.23M` / `$1.5K`, never line-wraps a 20-digit number).
- **Stress test**: New `lib/stress.test.mjs` runs 10,000,000 hostile-input iterations (Infinity, NaN, garbage strings, max-safe-int) through clampers + formatters + 100 Monte Carlo projections → **PASSED in 8.8s** (1.13M ops/sec, all values finite, all formats clean).
- Run: `node /app/frontend/src/lib/stress.test.mjs` (or `ITER=20000000 node ...` for 20M).


## April 2026 — ASIC SOA/ROA redesign + adviser-level Xplan Sync
- **SOA template rewritten** to ASIC INFO 267 letter format: letterhead (licensee + adviser + ref), "About this document", "Your reasons for seeking advice", "What my advice does not cover", "Overview of my recommendations", "Your current situation" (prose + at-a-glance data sidebar), "My advice and why it's appropriate" (numbered recs with rationale / expected benefit / key risks / cost), "Things you need to know", "Advice fees and conflicts of interest", "Next steps", "Authority to Proceed" signature block. Serif Georgia body + navy/gold accents.
- **ROA template rewritten** to ASIC INFO 266 letter format (8-section follow-up letter referencing the prior SOA).
- **Active-client lock-in**: Client dropdown removed from `AdviceDocumentBuilder` and `ClientCapture` — both pages now show a read-only "active client" badge tied to the adviser's selected client.
- **Xplan Sync Hub relocated** from adviser-client left-nav → adviser-level Firm sidebar (firm-wide integration, not per-client).
- **Files rewritten**: `/app/frontend/src/lib/adviceDocumentEngine.js` (340 lines, section builders + stable doc refs), `/app/frontend/src/pages/AdviceDocumentBuilder.jsx` (6 new section renderers: Letterhead / Paragraph / Situation / AdviceDetail / Fees / Authority).


## April 2026 — Implementation Pack + Alpaca Broker + PDF Attachments
- **One-click Implementation Pack** (`POST /api/implementation-pack/{client_id}`): orchestrates PDF storage → notify_client (with attachment) → create N execution tickets (one per SOA recommendation, auto-categorised trade/super/insurance/rebalance) → Xmerge push → single audit record. UI button on `AdviceDocumentBuilder` renders a 4-step audit-trail card with refs for compliance replay. 8/8 pytest tests green (iter 205).
- **Alpaca broker adapter live-ready**: `execution_rails.broker_adapter` now calls `alpaca_trading.get_trading_client()` when `ALPACA_API_KEY`+`ALPACA_SECRET_KEY` are set. Falls back to mock lifecycle otherwise. AU tickers have `.AX` stripped for paper-trade sanity.
- **PDF attachments in Notify Client**: `POST /api/notify/client` accepts `attachment_base64` + `attachment_name`; resend `attachments` param used in live mode. Mocked log records `has_attachment`/`attachment_name`.


## April 2026 — P2/P3 Completions
- **P2 RESEND email**: "Notify Client" button in `AdviceDocumentBuilder` with LIVE/MOCKED badge driven by `/api/email-resend/status`; calls `/api/notify/client` which falls back to audit-logged mock when no `RESEND_API_KEY`.
- **P3 Execution Rails**: New `/app/backend/routes/execution_rails.py` with adapter registry (broker / super_platform / insurance / contribution / rebalance). `POST /api/exec-rails/tickets/{id}/dispatch` transitions ticket through the pipeline, writes audit events to `execution_rail_events`. Each adapter reads its `*_API_KEY` env var to flip from mock → live.
- **New page**: `/execution-rails` (ExecutionRails.jsx) — visual dispatch board + adapter matrix + history drill-down. Exposed in adviser Firm sidebar with RAILS badge.
- **Advice Document Builder buttons**: added Notify Client, Execute Strategy (dispatch to rails), View Marketplace, alongside existing Save to Vault / Push via Xmerge.


# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform for HNW clients with consolidated views, client context switching, scenario modelling, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Centralized Data**: `/app/frontend/src/data/clientData.js` (single source of truth: $9.61M Thompson, $22.8M Chen, etc.)


## Phase 2 — Retirement Decision OS — STATUS: PRODUCTION-READY (22 April 2026, Iter 202)

### ✅ Flagship features (live)
- **Intelligence Feed · Mission Control** with ranked items, 5 categories, 4 one-click actions wired to backend.
- **Future Impact Engine™** with NumberRoll-animated deltas, shock simulator, confidence bands, "What Matters Most".
- **Advice Copilot (GPT-5.2)** — LLM drafts strategy memos; adviser has full amend/regenerate/approve/reject control. Persisted in Mongo with versioned history.
- **Execution Tickets** — Mongo-backed ticket store for "Apply Strategy". Status lifecycle + dashboard summary.
- **Client Notifications** — Resend integration (graceful mocked fallback without `RESEND_API_KEY`).
- **Compliance Trail** — regulator-ready audit log of every readiness compute + adviser action, per-client timeline.
- **Financial Decision Graph** with PNG/PDF export.
- **Client Readiness Portal** — mobile-friendly read-only view with trajectory line chart inside "Show me in N years" slider.
- **Adviser Compliance Reports** — 6 PDF generators hydrated from live Mongo via `GET /api/compliance-reports/data` (fallback-to-synthetic on error).

### ✅ Core infrastructure
- **Readiness Engine** + 5-min TTL cache + market-feed polling (Yahoo Finance via `/api/market-feed/snapshot`) + event bus.
- **Rules Engine**: 17 rules (R1–R17).
- **Compliance events + adviser actions**: Mongo-persisted (`readiness_events`, `adviser_actions`, `advice_drafts`, `execution_tickets`, `client_notifications`).
- **APScheduler**: daily/weekly signal digest cron jobs inside FastAPI.

### ⏳ Backlog (deferred, user-dependent)
- **P2**: Provide `RESEND_API_KEY` → flip Notify Client from mocked to live email digests.
- **P3**: Wire real execution broker/super platform/insurance integrations behind the ticket model.
- **P3**: Advice Marketplace, Open API platform, White-label infra.
- **P3**: Multi-page PDF export (full opportunity list, risk panel, scenario trail appendix).
- **P3**: Expand `NumberRoll` animated deltas to more tiles.
- **Refactor**: abstract `AdviserComplianceDashboard.jsx` reporting into factory pattern as more reports are added.
- **Refactor (opt)**: collapse N+1 queries in `compliance_reports.py` adviser loop into a single `$facet` pipeline.


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

