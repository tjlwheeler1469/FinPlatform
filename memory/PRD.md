# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform for HNW clients with consolidated views, client context switching, scenario modelling, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Storage**: Emergent Object Storage for client document uploads
- **Centralized Data**: `/app/frontend/src/data/clientData.js`


## Completed (20 April 2026) — Iteration 12 (Current)
- [x] **Adviser client view now matches client view exactly** — Swapped `UnifiedClientOverview.jsx` (the page shown at `/dashboard` for adviser with selected client) from lightweight Simple* components to the FULL pages:
  - Investments tab: SimpleInvestments → **UnifiedInvestments** (10 sub-tabs, stat cards, donut + bar + radar charts, rebalancing, top holdings)
  - Budget tab: SimpleBudget → **HouseholdBudget** (full cashflow + 12-mo chart + savings)
  - Tax Centre tab: SimpleTax → **UnifiedTaxCentre** (Tax Analysis, BAS, CGT, Div 7A, Loss Harvesting, Income Splitting, Calendar, Trust Distributions)
  - Retirement tab: SimpleRetirement → **RetirementWorkshop** (multi-scenario Monte Carlo)
  - Overview / Goals / Invoicing unchanged.
- Testing: Frontend testing agent iteration 173 — **8/8 pass (100%)**. Confirmed identical content between adviser client view and standalone client routes.

## Completed (20 April 2026) — Iteration 11
- [x] **Unified data source across Adviser Client Profile** — Client360View now merges CLIENT_DATA (source of truth) into its DEMO_CLIENT_DATA header via `mergeWithCanonicalClient`. Thompson shows **$9.61M net worth** (was $1.61M), **19 accounts** (was 12), allocation matches canonical (Property 52%, Super 28%, Equities 13%, Cash 5%, Other 2%). Family, email, address, advisor all pulled from canonical profile.
- [x] Financial Goals recomputed from canonical: Retirement target = `retirement_spending × 25` with super+investments as the current value (capped at 100%); investment loan target from canonical liabilities; emergency fund = 6 months of expenses.
- [x] Chen (`client_2`) also mapped — net worth $22.80M matches canonical.
- Testing: Frontend testing agent iteration 172 — **11/11 pass (100%)**. Applied fix: capped goal progress at 100% and used super+investments (not total net worth) as retirement "current" metric.

## Completed (20 April 2026) — Iteration 10
- [x] **Full unified pages now embedded in adviser Client360View** (replacing the lighter Simple* components):
  - **Retirement tab** ← `/retirement-confidence` → RetirementWorkshop (already in place)
  - **Budget tab** ← `/budget` → HouseholdBudget (full budget tool with expense categories, cashflow, charts)
  - **Investments tab** ← `/investments` → UnifiedInvestments (9 sub-tabs: Shares/Bonds/Property/Crypto/Cash/Super/SMSF/Managed/Unlisted)
  - **Tax tab** ← `/tax-analysis-sync` → UnifiedTaxCentre (full tax centre)
  - **Goals tab** ← SimpleGoals (user did not request a full-page replacement)
- All use `embedded` prop so they fit inside Radix TabsContent without duplicate Layout wrappers.
- Testing: Frontend testing agent iteration 171 — 7/7 pass (100%).
- Non-blocking carry-overs: (i) $1.61M header vs $11.67M embedded content (DEMO_CLIENT_DATA vs CLIENT_DATA split); (ii) pre-existing Recharts width(-1) warnings.

## Completed (20 April 2026) — Iteration 9
- [x] **Personal/Client tabs replicated onto Adviser's Client Profile** — Client360View (`/client-360`) gained 4 new tabs embedding the same Simple* components used on Personal/Client views: Budget (`SimpleBudget`), Goals (`SimpleGoals`), Investments (`SimpleInvestments`), Tax (`SimpleTax`). Full list is now 14 tabs: Overview · Retirement · Budget · Goals · Investments · Tax · Profile & Inputs · Holdings · Performance · Accounts · Activity · Documents · Timeline · Contact.
- [x] Embedded components receive `clientId` prop and render the same data as when viewed in Personal/Client mode (via `CLIENT_DATA.client_1 = CLIENT_DATA.thompson_family` alias).
- Testing: Frontend testing agent iteration 170 — 8/8 pass (100%).
- Known non-blocking: Header "Total Wealth" comes from `DEMO_CLIENT_DATA` ($1.61M) while embedded Simple components use `CLIENT_DATA` ($11.7M) — two parallel mock sources. See Next Action Items.

## Completed (20 April 2026) — Iteration 8
- [x] **Retirement Workshop embedded in Adviser Client Profile** — Client360View `/client-360` now has a dedicated "Retirement" tab that hosts the full RetirementWorkshop (multi-scenario MC, 4 input tabs per scenario, comparison table, projection chart) scoped to the selected client.
- [x] **Adviser Manual Client Inputs** — New "Profile & Inputs" tab on Client360View with `AdviserClientInputs` component: 7 sub-tabs (Personal / Income / Expenses / Assets / Liabilities / Goals / Protection). 4 rollup cards (Annual Income, Annual Expenses, Net Worth, Annual Surplus) recompute live. Add/remove rows for income/assets/liabilities/goals. Save persists to `localStorage:adviser_inputs_{clientId}` per-client.
- [x] **P3: App.js refactored** — Extracted 327 lines of inline seed data (CLIENT_FAMILY_DATA, CLIENT_PORTFOLIO_DATA, CLIENT_SHARE_DATA, DEFAULT_BUDGET, RECOMMENDATIONS etc.) to `/app/frontend/src/data/portfolioSeedData.js`. App.js is now 1,022 lines (down from 1,343).
- [x] **P3: Replaced PortfolioProvider 500ms polling** — Now uses same-tab `'client-changed'` CustomEvent + cross-tab `'storage'` listener. All 6 call sites that set `selected_client` in localStorage now dispatch the event (Layout, AdviserHub, CRMCommandCenter, Client360View, ClientHealthDashboard, DailyBriefing, lib/navigateToClient).
- [x] **Polish: Added data-testids** to RetirementWorkshop — 3 headline metrics (metric-confidence, metric-at-retirement, metric-p10) + 4 scenario tabs (tab-budget, tab-investments, tab-goals, tab-assumptions) per scenario.
- [x] **Bug fix by testing agent**: AdviserClientInputs `<p>` changed to `<div>` to fix Badge-in-paragraph hydration warning.
- Testing: Frontend testing agent iteration 169 — 13/13 feature groups pass (100%).


- [x] **P0: Fixed Retirement Confidence calculations** — Created new `/app/frontend/src/lib/retirementEngine.js` Monte Carlo engine with 29 unit tests (all passing): monotonicity, weak/strong plan confidence, zero-vol determinism, NaN guardrails, percentile ordering, legacy goal support, glide-path in drawdown.
- [x] **P0: New RetirementWorkshop page** at `/retirement-confidence` — full adviser inputs (Budget/Invest/Goals/Assumptions tabs per scenario), multi-scenario side-by-side (up to 5), live Monte Carlo recompute on any input change, P10/P50/P90 confidence bands chart, comparison table. Loads from active client in CLIENT_DATA.
- [x] **Fixed Client Portal** — `/client-portal` now renders UnifiedDashboard (rich client view with Net Worth, 6 tabs, Retirement Readiness, Quick Actions, Asset Allocation, Complete Your Profile). Previously blank/too sparse.
- [x] **P1: Orphaned routes wired** — `/decision-engine`, `/book-intelligence`, `/client-insights`, `/intelligence-feed` now reachable (were Navigate-redirected). All Take Action buttons verified navigating to `/next-best-actions`.
- [x] **Bug fix**: DecisionEngine recommendations expansion (map used undefined `insight` variable inside `rec` loop — 5 refs renamed, `e.stopPropagation()` added to CTAs).
- [x] Legacy RetirementConfidence preserved at `/retirement-confidence-legacy` + alias `/retirement-workshop`.
- Testing: Frontend testing agent iteration 168 — 12/12 feature groups pass (100%).


## Completed (20 April 2026) — Iteration 6
- [x] Smart Insights clickable, SimpleClientPortal, SimpleGoals, SimpleBudget — see previous entries
## HNW Client Profiles
| ID | Name | Net Worth | Gross Assets | Age | Risk | Retire |
|----|------|-----------|-------------|-----|------|--------|
| thompson_family | David & Sarah Thompson | $9.6M | $11.7M | 50 | Balanced | 67 |

## Completed (20 April 2026) — Iteration 5
- [x] Dashboard header overflow fixed, SimpleRetirement 5-section page — see previous entries
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

## Completed (20 April 2026) — Iteration 3
- [x] Scenario volatility slider (σ), jsPDF invoices, jsPDF Review Pack, Adviser Command Center client deep-links, platform primitives (PageShell/ActionRail/WhatChangedPanel) — see previous entries

## Completed (20 April 2026) — Iteration 4
- [x] FloatingActionRail on 5 pages, embedded ScenarioEngine on Portfolio Analyzer, sidebar consolidated to 10-page architecture — see previous entries

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

## Completed (20 April 2026) — Iteration 7
- [x] **SimpleTax** (Tax Centre tab) — 5-section calm: hero ($X estimated tax, Y% effective rate) · gross/tax/home flow bar · gold top opportunity · 3 upcoming deadlines · Plan my tax + Open details CTAs
- [x] **SimpleInvestments** (Investments tab) — 5-section calm: hero (portfolio value + YTD badge + risk) · asset allocation bars · gold top-action (rebalance/diversify/stay-course) · top 3 holdings · Rebalance + Run scenario CTAs
- [x] **FloatingActionRail** applied to 4 more pages: /daily-briefing, /meeting-prep, /adviser-hub, /tax-centre
- [x] **Adviser sidebar simplified to 3 groups × ≤3 items (7 items total, was 14)**: Today (Dashboard, Daily Briefing), Clients (All Clients, New Client), Firm (Markets, Compliance, Settings). Planning group removed — scenarios live inside the client profile (SimpleRetirement sliders + embedded ScenarioEngine).
- [x] **Personal/Client sidebar simplified to 3 groups**: You, Portfolio, Documents & Account
- [x] **"Actions" tab removed** from client profile (duplicated ActionRail + Overview alerts) — client tabs now: Overview, Retirement, Investments, Budget, Goals, Tax Centre, Invoicing
- [x] `/tax-centre` route registered as alias of UnifiedTaxCentre
- [x] Verified via testing agent iteration_166 — 100% pass after 3 trivial fixes (all applied in-place)
- [x] **Smart Insights clickable** — each AI/manual insight's action row is now a button that navigates to the relevant page (portfolio→/portfolio-analyzer, retirement→/retirement-confidence, tax→/tax-centre, opportunity/action→/next-best-actions, general→/daily-briefing). Insights can also supply their own `route` override. Verified routes: tax ✅, retirement ✅, action ✅.
- [x] **SimpleClientPortal** (`/client-portal`) — 5-section calm template: greeting + net worth, huge confidence gauge (SVG semicircle), plain-English navy summary card, exactly 3 action cards (Book Call / Open Budget → `/budget` / Download statement), contact anchor at bottom. All SPA navigation via `useNavigate`.
- [x] **SimpleGoals** (Goals tab on /dashboard) — 5-section pattern: "3 goals in play" hero, top blocker card, 3 GoalCards (Retirement real, Home reno, Legacy estate) with progress bars, navy "next step" card, primary CTA.
- [x] **SimpleBudget** (Budget tab on /dashboard) — 5-section pattern: surplus hero + savings-rate badge, income-vs-expenses flow card, top-2 spending categories, gold-accent suggestion card, primary CTA.
- [x] Testing agent iteration_165: 30/31 pass → 1 route bug fixed (portal Budget CTA now correctly routes to `/budget`), testid regex cleaned up in SimpleGoals.
- [x] **Dashboard header overflow FIXED** — the sticky Adviser Client Dashboard header no longer overlaps labels/values. Uses `lg:flex-row` (1024px+) with flex-wrap metrics and shortened CTAs (Improve/Scenario/Review Pack).
- [x] **Retirement page simplified to 5 sections** per spec (`SimpleRetirement.jsx`):
  1. **Hero Status** — huge confidence % + On Track / Close / At Risk label + one-line summary
  2. **Main Risk** — single dominant risk only, derived from client data (sequencing / drawdown / volatility)
  3. **Biggest Improvement** — exactly 2 improvement cards with +% confidence boost
  4. **One Visual** — single ConfidenceGauge SVG semicircle (no Monte Carlo histograms, no dense tables)
  5. **Primary CTA** — Improve My Plan (reveals inline age slider) + Generate Review Pack
- [x] Replaced legacy `RetirementConfidence` (1479 lines) with `SimpleRetirement` (~210 lines) on the Client Overview retirement tab; legacy `/retirement-confidence` route preserved for backwards compat
- [x] Verified via testing agent iteration_164 — 100% pass across Thompson (99%), Williams/client_4 (94%), all 14 testids render, SVG gauge + inline slider working
- [x] **FloatingActionRail** created and applied to 5 highest-traffic pages: `/intelligence`, `/portfolio-analyzer`, `/strategic-planning`, `/next-best-actions`, `/decision-center`
  - Every rail has Generate Review Pack CTA (jsPDF), Recommendations (top-3 by impact), Next Best Actions, Meeting Prep
  - Collapsible via X → re-expands via gold pill tab
  - Automatically reads active client via `getActiveClientId()`
- [x] **Embedded ScenarioEngine** in Portfolio Analyzer (`portfolio-embedded-scenario`)
- [x] **Sidebar consolidated** to 5 groups × ≤3 items each matching the 10-page architecture: Operating System, Clients, Planning, Markets & Data, Settings
- [x] **Route fixes**: `/decision-center` now renders DecisionCenter (was a redirect); `/daily-briefing` now renders DailyBriefing (was a redirect); `/advisor-intelligence` + `/book-intelligence` redirect to canonical pages
- [x] Verified via testing agent iteration_163 (then fixes applied) — rail visible on all 5 pages, collapse/expand working, PDF generation verified
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
