## Feb 2026 — Iter 214: Retirement layout + unified Contribution Calculator

### 1. "Retirement Workshop" → "Retirement"
- Inline H1 (`RetirementWorkshop.jsx:331`) and PageShell title (`:514`) both renamed.

### 2. Retirement Planner — chart above the fold
- `ScenarioEditor` Tabs section wrapped in a `<Collapsible>` (collapsed by default) with an inline `Edit details / Hide details` toggle.
- Compact view shows only the metrics row (Confidence / At Retirement / P10) + a one-line summary. With 2 scenarios at md+, both fit on a single row and the Projected Portfolio Balance chart now renders at y=596.5px (above the 1080px fold on a standard viewport).
- Used the existing `@/components/ui/collapsible.jsx`. New imports: `ChevronDown`, `ChevronUp`.

### 3. Contribution Calculator — unified single-form input
- Restructured `SMSFOptimizer.jsx` embedded mode into a single full-width "Your Details" card at the TOP with 9 **manual number inputs** (NO sliders):
  - Current Age, Taxable Income, Current Super Balance, Employer (SG), Salary Sacrifice, Personal Deductible, **Non-Concessional (post-tax)** (NEW), Spouse Contribution, **Expected Return %** (NEW).
- Each input uses a reusable `NumberField` helper (prefix `$` / suffix `years|/yr|%`).
- "Calculate Strategy" / "Calculate SMSF" button **renamed to `Calculate`**.
- Total-contribution summary line + cap progress sit just below the button.
- Result section flows below at full width (4 summary cards · cap progress · projection chart · tax impact · recommendations).
- SuperOptimiser **removed from the Contribution Calculator tab** entirely — the new unified form covers all its inputs.

### 4. Backend `/api/analyze/smsf` — accepts 2 new params
- `non_concessional_contribution` (default `0`).
- `expected_return` (default `7.0`) — drives both backend projection AND frontend chart.
- Response now includes:
  - `current_contributions.non_concessional` + `total_non_concessional`
  - `caps.non_concessional_remaining`
  - `projections.assumed_return`
- Backwards-compatible: omitting both new params yields the iter-pre-214 behaviour.

### Test verdict
- Iter 214: **backend pytest 3/3 PASS**, **frontend 17/17 UI assertions PASS**, **regression 16/16 routes 200**.
- New stable regression suite: `/app/backend/tests/test_iteration214_smsf_params.py`.

### Minor follow-ups noted by code review (no action taken)
- `NumberField` has no client-side min/max validation — backend should clamp.
- Contribution caps in `analysis.py` are FY24-25 hardcoded; consider config for FY rollover.



## Feb 2026 — Iter 213: Contribution Calculator — unified single-page layout

- **Renamed** SuperOptimiser inline header `Super Contribution Optimiser` → `Contribution Calculator` (subtitle preserved).
- **Removed** the gold-dashed divider + "SMSF contribution optimiser — spouse / personal / Div 293 modelling for self-managed funds" subtitle in RetirementHub.
- **Conditionally hidden** the embedded SMSFOptimizer's H1 ("SMSF Contribution Optimizer") + subtitle ("Maximize your superannuation tax benefits and retirement savings") + 3 redundant info cards (Concessional / NCC / Div 293) when `embedded=true`. Standalone deep-link behaviour preserved.
- **Fixed** pre-existing JSX parse error at `SuperOptimiser.jsx:190` where an inline `>` inside JSX text was breaking lint — escaped to `{'>'}`.
- **Pinpointed** the long-standing `<span> inside <option>` hydration warning: it's caused by an **Emergent dev-tool injecting `<span data-ve-dynamic='true'>` wrappers** at runtime — not application code. Confirmed as a tooling artifact, not a bug.

### Test verdict
- Iter 213: **15/15 PASS** (all forbidden strings removed, header renamed, embedded info cards correctly hidden, compare-paths toggle still works, all 15 regression routes return 200).



## Feb 2026 — Iter 212: 4 big-ticket features shipped end-to-end

### 1. Compliance Evidence Pack PDF export
- New `routes/evidence_pack.py` with `GET /api/evidence/preview-html` (in-app preview) and `POST /api/evidence/generate` (renders HTML → PDF via headless Chromium, persists to Vault with family_key `compliance_evidence_pack` so versions accumulate).
- Aggregates: compliance metrics (total/approved/pending/rejected/rate), Xplan sync log (rolling 30 days), e-signature audit (rolling 30 days), RBAC denials (rolling 30 days).
- New action on Xplan Sync Hub > Sync Log tab: `Generate evidence pack` pill button. Toast surfaces v + KB + a download action.
- Refactored `pdf_render.py` to expose `_render_pdf_bytes()` helper for DRY reuse.

### 2. Advice Marketplace
- New `routes/advice_marketplace.py` + 6 curated demo templates (`tpl_eofy_tax_loss_harvest`, `tpl_bring_forward_ncc`, `tpl_smsf_lrba_payoff`, `tpl_trust_succession_2028`, `tpl_negative_gearing_transitional`, `tpl_estate_bdbn_refresh`).
- New `/advice-marketplace` page (3-col grid, ChipFilter category, search, `Clone to Deal` action). Clone increments `clone_count`, creates a draft Deal tagged `marketplace` + `source_template_id`.

### 3. Open API platform
- New `routes/open_api.py` with scoped token issuance (SHA-256 hashed at rest, plaintext returned ONCE), revocation with audit trail (`rbac_audit`), 9 permission scopes across 5 categories, and a dynamic `GET /spec` returning the live FastAPI OpenAPI 3.1 schema for partner SDK generation.
- New `/open-api-platform` page: issue/revoke tokens, download OpenAPI spec as JSON, copy plaintext token (amber banner shown once, scoped via Checkbox grid).

### 4. White-label / firm branding
- New `routes/branding.py` (Mongo doc `firm_branding/_id=default`) with current/update/reset endpoints. Hex validation on colours (returns HTTP 400 on invalid).
- New `/firm-branding` page: editor on the left, live preview on the right (colour picker re-paints the swatch instantly), Save disabled until dirty.

### 5. Compare contribution paths toggle
- New `components/ContributionPathCompare.jsx` — runs APRA fund vs SMSF projection at the same household inputs (salary, age, super balance, annual contribution, return rate) over the years-to-67 horizon. Surfaces a single recommendation banner.
- Added `toggle-compare-paths` button at the top of the Contribution Calculator tab inside RetirementHub. Lazy-loaded.

### Test verdict
- Iter 212: **backend 17/17 pytest PASS**, **frontend 5/5 critical flows PASS**, 0 functional bugs, 2 pre-existing cosmetic console warnings (confirmed false positives or non-functional).
- New test file: `/app/backend/tests/test_iteration212_features.py`.

### Nav additions
- Firm section now includes: Advice Marketplace, API Platform (DEV badge), Firm Branding — using new lucide-react icons (Store, Key, Palette).



## Feb 2026 — Iter 211: Navigation & labelling overhaul

11 user-requested cleanups across the global nav and client-tabs:

1. **Hidden** `/budget-reforms` from the client-context Overview nav (route still works as a deep link).
2. **Moved** `SOA / ROA Builder` (`/advice-document-builder`) to the **top** of the Communications nav.
3. **Renamed** the UnifiedClientOverview tab `Retirement & Super` → `Retirement`.
4. **Renamed** the RetirementHub tab `Super & Pension` → `Contribution Calculator`.
5. **Verified** Retirement Planner numbers flow correctly from Budget + Investments via `scenarioStore` (`HouseholdBudget.setScenario(...)` → `RetirementWorkshop.useScenario()`). Added `lib/scenarioStore.test.mjs` — 4/4 PASS.
6. **Renamed** the RetirementHub tab `Retirement Plan` → `Retirement Planner`.
7. **Combined** SMSF Contribution Optimiser into the Contribution Calculator tab — SuperOptimiser at the top, SMSFOptimizer stacked below with a gold-dashed divider.
8. **Removed** the standalone SMSF tab from RetirementHub (data-testid `rh-tab-smsf` no longer exists).
9. **Renamed** adviser Today nav `Control Center` → `Client Overview` (path `/retirement-control-center` unchanged).
10. **Reordered** adviser Today nav — Dashboard now sits ABOVE Client Overview.
11. **Renamed** clientContextNav Overview entry `Client Overview` → `Overview` (path `/dashboard`).
12. **Cleanup**: updated `<ErrorBoundary label="Retirement">` (was "Retirement & Super") and pointed the legacy `/smsf-optimizer` redirect at `/retirement-confidence` (RetirementHub) instead of `/investments`.

### Test verdict
- Iter 211: **100% PASS** (11/11 spec items + 13/13 regression routes + 4/4 scenarioStore integration tests).
- Pre-existing minor flagged: SuperOptimiser FY-dropdown `<span>` inside `<option>` hydration warning (not caused by this iter — deferred).



## Feb 2026 — Iter 209-210: Xplan Sync Hub, Mongo Meetings, Budget Reform demo seed

### 1. Xplan Sync Hub — new "Sync Log" tab (firm-level audit + push/pull)
- Added a 6th tab to the existing `XplanSyncHub.jsx` (under `/xplan-sync-hub`) that surfaces every Xplan integration touchpoint in one pane:
  - **Compliance push / pull** module card with `hub-push-compliance` and `hub-pull-compliance` buttons. Push aggregates `compliance_documents` and writes to `/api/xplan-sync/compliance/push`. Pull surfaces external GRC flags into the Compliance Dashboard.
  - **Xmerge token catalogue** rendering the live `/api/xplan-sync/xmerge/tokens` map (35 tokens — backend returns an object map; frontend coerces via `Object.entries` to `{name, placeholder}` pairs).
  - **Delivery audit log** consuming `/api/xplan-sync/log` (every push/pull across compliance + future modules, with mode = `mock | live`). 29 events visible at last test.
- Test IDs: `hub-tab-synclog`, `hub-push-compliance`, `hub-pull-compliance`, `hub-sync-log`, `hub-event-{i}`.
- Iter 209 caught a CRITICAL `.slice` TypeError because the backend `xmerge/tokens` returns an OBJECT not an array — fix applied (IIFE + `Array.isArray` check + `Object.entries` fallback). Iter 210 re-test: **100% PASS**.

### 2. MyVault meeting notes — Mongo-persisted backend
- New `routes/meetings.py` (collection `client_meetings`) with endpoints:
  - `GET  /api/meetings/by-client/{client_id}` — list per-client, desc by date.
  - `POST /api/meetings/log` — add a new note.
  - `POST /api/meetings/seed-demo` — idempotent seed (4 thompson + 2 chen).
- `MyVault.jsx` now consumes `/api/meetings/by-client/{id}` (no more client-side mock). First-load auto-seeds the collection if it returns empty, so the page is never blank on a fresh DB.
- Test IDs: `vault-meeting-{meeting_id}`, `vault-meetings-count`. Each card shows `recording_available` badge + tag chips.

### 3. Budget Reform outreach demo seed
- Added `purchaseDate` + `costBase` fields to 2 investment properties in `clientData.js`:
  - **Thompson — Brunswick** : 2026-05-20 · $620K (CGT swing ≈ $86K)
  - **Chen — Surry Hills** : 2026-06-10 · $850K (CGT swing ≈ $133K)
- Updated `computeExposure` in `BudgetExposureReport.jsx` to use these fields when present (falls back to "5 years ago" assumption otherwise).
- Result: Pre-1 July 2027 sell-window alerts tile is now visible on first load, "Draft 2 outreach emails" pill action appears, per-row Email + Invite buttons render.

### Test verdict
- Iter 209: 7/7 backend pytest, frontend 2/3 (Sync Log .slice bug caught).
- Iter 210: frontend 15/15 PASS including all regressions across the 6 hub tabs.



## Feb 2026 — Iter 208: Vault parity, Xplan compliance sync, navigation polish

### 1. Vault parity (adviser ↔ client)
- `MyVault.jsx` rewritten to consume `/api/files/search?client_id={id}&only_latest=true` — same backend object storage as the adviser's Vault. NO more localStorage mocking.
- Read-only stance preserved (no upload / delete / restore buttons for clients).
- New layout: airy 4-card stat ribbon (Documents / Signed & Frozen / Meeting Notes / AES-256), Documents + Meeting Notes tabs.
- Frozen documents (signed via e-sig webhook) display amber `SIGNED` badge — same visual cue as the adviser side.
- Test IDs: `my-vault`, `vault-doc-count`, `vault-signed-count`, `vault-meetings-count`, `vault-search`, `vault-refresh`, `vault-file-{object_id}`, `vault-dl-{object_id}`, `vault-frozen-{object_id}`.

### 2. Today's Priorities — clickable to next screens
- `AdviserClientDashboard.TodaysPrioritiesCard` rows are now `<button>` elements (not divs) wired through `useNavigate()`:
  - `priority-confidence` → `/retirement-control-center`
  - `priority-risks` → `/budget-exposure`
  - `priority-rebalance` → `/portfolio-rebalancing`
  - `priority-reviews` → `/adviser-compliance`
- Hover-state background + ChevronRight + focus ring for keyboard nav.

### 3. Rename `Key Dates & Disclosures` → `Client Information`
- `navData.js` label updated, `ClientCapture.jsx` H1 updated.

### 4. Rename `Deals pipeline` → `Activity`
- `navData.js` label updated (path `/deals` preserved), `DealsPipeline.jsx` PageShell title set to `Activity`.

### 5. Adviser Compliance Dashboard — Push / Pull from Xplan
- Backend: new endpoints in `routes/xplan_sync.py`:
  - `POST /api/xplan-sync/compliance/push` → aggregates `compliance_documents` and posts a snapshot. Returns metrics + mode (`live`/`mock`).
  - `POST /api/xplan-sync/compliance/pull` → returns 2 mock XGRC flags (XGRC-7841 SOA, XGRC-7842 ROA) and upserts them into `compliance_documents` (correct collection) so they surface in the dashboard automatically.
- Frontend toolbar buttons: `Pull Xplan` / `Push Xplan` (data-testids `compliance-pull-xplan`, `compliance-push-xplan`). Pull auto-refreshes the dashboard so new rows appear in the Advice Files tab.
- Fixed pre-existing `TypeError` in `soa_roa_compliance.py:226` where `advice_fee=None` crashed the dashboard endpoint.

### Test verdict
- Iter 208 testing-agent verdict: backend 100%, frontend 85% with one integration gap (XGRC rows not surfacing). **Both issues fixed in this iteration**: (a) collection name corrected (`compliance_docs` → `compliance_documents`), (b) MyVault Badge-in-`<p>` HTML hydration warning fixed via `<span>` wrapper. End-to-end re-verified: `totalFiles=9` (7→9), `XGRC rows in adviceFiles=2`.



## Feb 2026 — Backlog completion: Outreach + E-sign freeze + Chip filters (Iter 207)

### P2 — Budget Reform outreach (BudgetExposureReport)
- One-click "Email" button per sell-window row → POSTs `/api/notify/client` with full pre-filled body (CGT swing, days-to-reform, restructure options, meeting CTA). Falls back to MOCKED log when no `RESEND_API_KEY`.
- "Invite" button per row → generates a downloadable `.ics` calendar file (universal — works in Google/Outlook/Apple Calendar) for a 30-min review meeting 7 days out.
- "Draft N outreach emails" pill at the top of the page → bulk-fires emails to every sell-window client at once.
- New test IDs: `bulk-outreach-btn`, `sell-window-row-{id}`, `email-{id}`, `ics-{id}`, `row-email-{id}`, `row-ics-{id}`.

### P3 — E-signature webhook completion (`routes/esignature.py`)
- New endpoint `POST /api/e-signature/event` accepts `{family_key, signer_email, provider, envelope_id, client_id?, deal_id?}`. HMAC-verified (`X-Esignature-Signature` against `ESIGNATURE_INBOUND_SECRET`) when secret configured, otherwise open inbound for dev.
- On a valid event: marks **every version** in the family as `is_frozen=true` with signer/envelope metadata, writes a structured row to `rbac_audit` (`event="document_signed"`), advances the linked Deal to `signed` stage, and emits an outbound `deal.signed` webhook so subscribers fan out automatically.
- `local_files._persist()` now **rejects new versions** for a frozen family with HTTP 423 — closes the loop so a signed SOA can never be silently re-versioned.
- New endpoints: `GET /api/e-signature/signed` (audit replay), `GET /api/e-signature/status/{family_key}`.
- VaultDocuments UI shows a `SIGNED · FROZEN` amber badge + "signed by {email} via {provider}" meta on the family card.
- Backend pytest: `tests/test_esignature_freeze.py` — **3/3 PASS** (freeze + 423 reject + 404 on unknown family + signed audit replay).

### P3 — Execution Rails real adapters (verified existing)
- Adapters in `execution_rails.py` already env-key driven (`ALPACA_API_KEY`, etc.) with graceful fallback to mock — structurally complete. Adding live super-platform / insurance SDK calls requires the user's API credentials.

### Optional UX consistency — chip filters
- `WebhooksAdmin`: delivery log now filterable by status (`All / Delivered / Failed / Pending`) via `ChipFilter`.
- `ExecutionRails`: tickets filterable by status (`All / Pending / Executing / Completed / Failed`).
- `AdviserHub`: status filter converted from button-group to ChipFilter (preserves `data-testid="filter-{status}"` for backwards compat).

### Tests
- Iter 207 testing-agent verdict: **backend 100% (3/3 pytest), frontend 100% on all observable criteria, zero console errors across all 8 PageShell routes.**



## Feb 2026 — UI/UX unification (Truth Journey aesthetic rollout — Iter 206)
- **PageShell rolled out across 8 main pages** to deliver a unified airy, navy/gold design system:
  - `/deals` (DealsPipeline.jsx)
  - `/budget-exposure` (BudgetExposureReport.jsx)
  - `/vault-documents` (VaultDocuments.jsx)
  - `/webhooks-admin` (WebhooksAdmin.jsx)
  - `/rbac-admin` (RbacAdmin.jsx)
  - `/execution-rails` (ExecutionRails.jsx)
  - `/adviser-hub` (AdviserHub.jsx)
  - `/retirement-workshop` (RetirementWorkshop.jsx — standalone only; embedded path preserved as plain content for use inside Client360 / RetirementHub tabs).
- Every shell page now exposes `[data-testid="page-shell"]`, large serif hero typography (text-3xl/4xl/5xl), gold (#D4A84C) accent on the key noun in the title, KPI cluster top-right with 4 inline metrics, pill-shaped CTAs (PillButton) and (where applicable) chip-filter pills (ChipFilter). Navy (#1a2744) branding and ALL existing content preserved.
- Fixed React Fragment key warning in `RbacAdmin.jsx` (use `<Fragment key={group}>` instead of bare `<>`).
- Renamed RetirementWorkshop scenario-card metric testids from `metric-*-{id}` to `scenario-metric-*-{id}` to avoid collision with PageShell's `metric-*` cluster.
- Testing agent iter 206 verdict: **100% pass on visual integrity criteria across all 8 routes, no regressions on `/` or `/dashboard`.**



## Calculation Stress Test (22 April 2026) — Iteration 203

**Scope:** All calculators across Adviser Mode → Client Overview tabs (Overview, Goals, Retirement & Super, Investments, Budget, Tax) plus standalone calculator pages.

**Results:** **115/115 green** (29/29 retirementEngine regression + 86/86 new calculation assertions) + 7/7 UI calculator pages render clean (no NaN/Infinity leakage).

### New test infra
- `/app/frontend/src/lib/calculations.test.mjs` — 86 assertions covering: tax bracket duplicate consistency, ATO 2024-25 Stage-3 thresholds, CGT (individual 50%, SMSF 1/3, company 0%), loan amortisation, SG 12% FY25-26, SMSF caps ($30k/$120k/$250k), scenario ordering, Monte Carlo invariants (P10≤P50≤P90), budget frequency conversion, goal progress clamp, readiness classify buckets, rulesEngine R3.
- `/app/frontend/test-loader.mjs` — resolves Vite `@/` alias for Node-based test runs.

### Verified correct
- Tax: StrategicPlanning.jsx & TrustDistributionAnalysis.jsx both match ATO 2024-25 ($45k→$5,188; $100k→$22,788; $135k→$33,988; $190k→$55,438; $250k→$83,638).
- Loan: $500k @ 6.5% over 30y → $3,160.34/mo, $637,722 total interest (exact).
- CGT: individual 24mo ($100k gain × 50% × 37% = $18,500); SMSF ($10,000); company ($30,000).
- SG FY25-26 at 12%: $100k → $12k; $500k → capped at $30k max contribution base.
- Scenarios: retire now → +5y → +10y produce strictly ordered terminal balances ($800k → $1.09M → $1.48M) and success probabilities (0% → 9% → 36%).

### Optional refactor items (no bugs)
- Extract duplicate `TAX_BRACKETS`/`calculateTax` (StrategicPlanning + TrustDistributionAnalysis) into `/app/frontend/src/lib/auTax.js` before next FY bracket change.
- Standardise CGT entity-type vocabulary between CGT.jsx (`{individual,trust,super,smsf,company}`) and RetirementPlanner.jsx (`{personal,joint,trust,company,smsf}`).
- Plumb seedable RNG into `projectRetirement` so `computeReadiness` is fully deterministic (currently ±2-5 score points Monte Carlo noise).
- Add `minHeight` to ResponsiveContainer wrappers to silence recharts `width(-1)/height(-1)` cosmetic warnings.
- Split RetirementPlanner.jsx (1818 lines) into sub-components.


## Completed (22 April 2026) — Iteration 202 (Trajectory chart + MongoDB hydration + webpack overlay fix)

### Client Readiness Portal — Trajectory line chart
- `ClientReadinessPortal.jsx`: new AreaChart inside the "Show me in N years" slider panel, `data-testid="portal-future-trajectory"`. Pre-computes score + income at evenly-spaced year offsets (useMemo) and tracks current slider position with an animated reference dot.

### Adviser Compliance Dashboard — live MongoDB hydration
- **NEW `/app/backend/routes/compliance_reports.py`** — aggregator at `GET /api/compliance-reports/data` reading from `readiness_events`, `adviser_actions`, `advice_drafts`, `execution_tickets`, `client_notifications`. Returns monthly_summary, adviser_rows, issues, client_risk_rows, risk_buckets, audit_rows, asic_rows + counts; includes `fallback_recommended` flag.
- `mockComplianceReports.js` now fetches live data first and only falls back to synthetic on error. Reports show "Live from MongoDB" badge when backend hydrated.

### Webpack compile overlay fix (pre-existing blockers cleared)
- `.eslintrc.json`: added `overrides` block disabling `no-undef` for `*.ts`/`*.tsx` (type annotations were firing false positives; TypeScript itself validates identifiers).
- `ComplianceDisclaimer.jsx`: removed dead `handleAccept` (unreachable — button uses `handleQuickDismiss`), which referenced undefined `acknowledged`. Moved `onAccept?.()` callback into `handleQuickDismiss`.

### Verified
- Backend: 11/11 pytest in `test_iteration202_compliance_reports.py` passed — GET /api/compliance-reports/data returns 200, data_source=`mongodb-live`, counts match live collections (76 readiness_events, 3 approved drafts, 1 rejected, 3 tickets, 3 notifications). Adjacent endpoints (/api/advice/drafts, /api/market/snapshot, /api/compliance-audit) still 200.
- Frontend: trajectory chart renders under `portal-future-trajectory`, reference dot tracks slider. 6 compliance PDF buttons render in Reports tab. Webpack compile overlay no longer present. `testing_agent_v3_fork` run via iteration_202.


## Completed (22 April 2026) — Iteration 203 (UX polish + Compliance mock reports)

### Login routing
- `DashboardRouter`: adviser mode with no selected client now redirects `/dashboard` → `/retirement-control-center`. Advisers land on their control centre on login.

### Adviser Command Centre — "Markets · Live" removed
- `AdvisorCommandCenter.jsx` — `MarketsStrip title="Markets · Live"` block deleted from the dashboard-briefing area.

### Review-pack PDF Recommendations table fix
- `lib/pdfGenerator.js`: Recommendations & Opportunities autoTable now strips non-ASCII characters (arrows, smart quotes, em-dashes) which were corrupting Helvetica rendering. Explicit column widths (55/95/32mm), `overflow: linebreak`, `valign: top`, 3mm cell padding — no more wide letter-spacing artefacts.

### Retirement Workshop & SMSF Optimizer layout
- `RetirementWorkshop.jsx`: scenarios grid changed from `space-y-4` stacked → `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` side-by-side so the comparison chart + table below are immediately visible without scrolling past long scenario cards.
- `SMSFOptimizer.jsx`: 3 info cards (Concessional / Non-Concessional / Division 293) MOVED above the calculator + output grid per user feedback.

### Client (SimpleClientView) — Retirement & Super tab reorder
- `RetirementTab.jsx`: layout changed from 2-column (current plan + scenarios side-by-side) to stacked layout: Current Plan chart → Super & Pension card → **Try Your Own Scenarios in full-width landscape** below. Sandbox is now 1568px wide on desktop.

### Compliance Dashboard — mock reports wired
- **NEW `/app/frontend/src/lib/mockComplianceReports.js`**: 6 generators producing real branded PDFs — Monthly Compliance Summary, Adviser Performance Report, Issue Resolution Tracker, ASIC Alignment Report, Risk Assessment Report, Audit Trail Report.
- Each PDF has navy+gold header, footer with page numbers, autoTable tables, synthetic-but-plausible data. Named with date-stamped filenames.
- `AdviserComplianceDashboard.jsx`: Generate Report buttons wired to registry, toast confirmation on save.

### Verified via smoke tests
- `/dashboard` → `/retirement-control-center` for advisers ✓
- Markets · Live count=0 on adviser command centre ✓
- Scenario grid testid present, scenarios side-by-side ✓
- SMSF info cards render above inputs ✓
- 6 compliance report buttons render; `MonthlyComplianceSummary_2026-04-22.pdf` downloaded ✓
- SimpleClientView retirement tab: current(y=370) above sandbox(y=1006, width=1568) ✓


## Completed (22 April 2026) — Iteration 202 (Live market + Scheduled digests + Multi-page PDF + 5-year slider)

### Market feed → Yahoo Finance (live)
- `market_snapshot.py` rewritten: Yahoo v7 quote endpoint (primary), v8 chart endpoint (fallback), simulated fallback (last resort), 30s in-memory cache.
- Confirmed live: ASX 200 8843.6 (−1.225%), All Ords 9074.4, AUD/USD 0.716, source='yahoo'.
- Frontend `readinessCache.startMarketFeed` already polls this — now displays real deltas.

### Scheduled digests (APScheduler)
- `APScheduler==3.11.0` added, `AsyncIOScheduler` started on FastAPI `startup`.
- **Daily "Signal" at 08:00 AEST**: top pending drafts + lowest-scoring clients in last 24h.
- **Weekly "Actions Shipped" Mon 08:00 AEST**: reuses `/api/reports/actions-shipped`.
- **NEW `/app/backend/routes/scheduled_digests.py`** — endpoints: `/api/digests/status`, `/preview/signal`, `/preview/actions`, `POST /send/signal`, `POST /send/actions`, `GET /log`.
- Emails go via Resend if `RESEND_API_KEY` set, otherwise persisted to `digest_log` collection with mode='mocked'.
- HTML templates inline (responsive, branded, no Resend template dependency).

### Multi-page PDF export (DecisionGraph)
- 4-page landscape A4: Page 1 graph · Page 2 Appendix A (factor breakdown + outcomes table) · Page 3 Appendix B (opportunities + alerts tables) · Page 4 Appendix C (scenario trail).
- Uses `jspdf-autotable` for tables. Footer with page numbers on every page.

### "Show me in N years" slider (mobile client portal)
- Read-only interactive projection in `ClientReadinessPortal`: ages forward by 0–15 years, compounds assets at 5% real return, recomputes via cached engine.
- NumberRoll-animated score + income tiles with delta badges. "Today" reset button. Context note footer.
- Pure motivation feature — no adviser tools, no commitment, no editable inputs.

### Testing
- Iteration 201: **11/11 backend PASS + full FE verified**. `/app/test_reports/iteration_201.json`.

### Still MOCKED
- Email digests persist to `digest_log` with mode='mocked' until `RESEND_API_KEY` is provided. **Drop-in ready — flipping the env var auto-activates live sends on next job run.**


## Completed (22 April 2026) — Iteration 201 (Mobile portal + Weekly KPIs)

### Mobile-first Client Readiness Portal (read-only)
- **NEW `/app/frontend/src/pages/ClientReadinessPortal.jsx`** at route `/client-readiness`.
- Sticky mobile top bar · navy hero with big Dial + years-to-retirement · 2×2 outcome tiles (Income/Success/Surplus or Gap/Years Sustainable) · 5-factor progress bars with weight badges (now render correctly as 30/25/20/15/10%) · top-3 what-lifts-your-score with "Discuss with your adviser" CTA · read-only Key Risks · Recent adviser activity via `/api/compliance-audit/adviser-actions` · footer last-computed timestamp.
- **Strictly READ-ONLY**: zero sliders, zero shock toggles, zero Apply/Generate buttons.
- `ClientHome` now links to it (`data-testid="home-open-mobile-portal"`).

### Weekly "Actions Shipped" Report
- **NEW `/app/backend/routes/adviser_reports.py`** → `GET /api/reports/actions-shipped?days=7&actor=...` aggregates Mongo collections (`adviser_actions`, `advice_drafts`, `execution_tickets`, `client_notifications`, `readiness_events`).
- Returns totals, WoW deltas, daily sparkline for flexible window.
- **NEW `/app/frontend/src/components/intelligence/ActionsShippedReport.jsx`** on `RetirementControlCenter`:
  4 primary KPIs with WoW % (Simulations / Strategies applied / Drafts approved / Clients notified) + 3 secondary (Clients touched / $ impact approved / Readiness computes) + daily activity sparkline + 7/30-day toggle + refresh.

### Testing
- Iteration 200: **5/5 backend PASS + full FE verified**. Weight bug fixed (was 3000% → 30%). `/app/test_reports/iteration_200.json`.


## Completed (22 April 2026) — Iteration 200 (Real integrations + Adviser Copilot)

### P1 — Generate Advice → LIVE GPT-5.2 copilot (adviser retains full control)
- **NEW `/app/backend/routes/advice_copilot.py`**: Uses `emergentintegrations` with `EMERGENT_LLM_KEY` and GPT-5.2. Endpoints: POST `/api/advice/drafts`, GET, PATCH (amend), POST `/regenerate` (adviser natural-language instructions), POST `/approve`, POST `/reject`. Approved drafts are 409-locked. Every draft has `version`, `history[]`, `session_id` (keeps LLM context across amendments). Persisted in Mongo collection `advice_drafts`.
- **NEW `/app/frontend/src/components/intelligence/AdviceDraftModal.jsx`**: Opens on "Generate Advice" click. Shows spinner → editable title/body/adviser-notes textareas. "Regenerate with instructions" textarea lets adviser steer the LLM in plain English. Save amendment, Approve, Reject buttons. **Adviser ALWAYS has final say — no auto-send.**
- System prompt hard-codes AU context + ATO/ASIC terminology + "the adviser WILL edit this; write it as a confident first draft, not final".
- Tested: 2502-char structured markdown memo → adviser regenerate "100 words max and blunt" → 1487 chars.

### P2 — Persisted adviser action log + readiness events (Mongo)
- `compliance_audit.py`: `readiness_events` and `adviser_actions` collections replace in-memory lists. New POST `/api/compliance-audit/adviser-actions` endpoint, GET with filters. Frontend `IntelligenceFeed` `logLocalAction` now fires keepalive fetch to Mongo-backed endpoint.

### P2 — Execution Tickets adapter (Apply Strategy)
- **NEW `/app/backend/routes/execution_tickets.py`**: Mongo-backed ticket store (collection `execution_tickets`). CRUD + dashboard summary. Ticket types: trade, super_change, insurance_quote, contribution, rebalance. Status lifecycle: pending → executing → completed/failed/cancelled.
- Frontend "Apply Strategy" button now creates a real ticket and surfaces `ticket_id` in a toast.

### P2 — Notify Client (Resend integration, graceful fallback)
- **NEW `/app/backend/routes/notify_client.py`**: If `RESEND_API_KEY` env var is set, sends via `resend` SDK; otherwise logs notification with `mode='mocked'` in `client_notifications` collection. No breakage if key is absent.
- Frontend "Notify Client" button calls it and surfaces "Email sent via Resend" or "Resend MOCKED — awaiting RESEND_API_KEY" in the toast.

### P2 — Market feed hook
- **NEW `/app/backend/routes/market_snapshot.py`** returns `{source:'simulated', items:[XJO/XAO/AUDUSD], avg_delta_pct}`. Deterministic 30s-window seeding to avoid UI flicker; ready to swap for a live feed.
- `readinessCache.js` `_tick` now polls this endpoint first, falls back to bounded random walk. Pulse HUD shows `source` field.

### Backlog delivered
- **Compliance Trail** (Section 7 of `ClientDecisionHub`): `ComplianceTrail.jsx` fetches readiness events + adviser actions for the current client, merges, renders as timeline with badges. Refresh button.
- **Number-roll animation**: `NumberRoll.jsx` (RAF-based easeOutCubic). Wired into all 5 `FutureImpactEngine` DeltaTiles and `ClientHome` scenario delta/income.

### Testing
- Iteration 199: **18/18 backend tests PASS** + full frontend flow verified. No regressions. 12 compliance-audit beacons emitted during test session. `/app/test_reports/iteration_199.json`.

### Still MOCKED (by design, pending user credentials)
- Resend is mocked until `RESEND_API_KEY` is provided → drop-in ready.
- Execution tickets are real DB records but downstream broker/super/insurance integrations are conceptual (no actual trade execution).
- Market feed is server-side simulated (deterministic) until a live feed is wired.


## Completed (22 April 2026) — Iteration 199 (Flagship: Mission Control + Future Impact Engine™)

### Intelligence Feed → "Mission Control" (RetirementControlCenter)
- **Rewrote `buildIntelligenceFeed`** in `bookAggregator.js`: every item now has `impactScore` (0–100), `scoreDelta`, `financialImpact ($)`, `urgency` (NOW/SOON/MONITOR), `confidence %`, 4 one-click actions, category, actionHint.
- **Impact Score formula**: 35% readiness uplift (capped 25pts) + 30% log-scaled $ impact + 15% urgency bump + 10% confidence + 10% rescue-bump for at-risk clients.
- **5 categories with auto-grouping**: High-Impact Opportunities · Risks & Threats · Time-Sensitive Actions · Portfolio Adjustments · Client Engagement.
- **Ranked, capped at 15** — no low-signal noise. Generic reminders + passive notifications killed.
- **New component `IntelligenceFeed.jsx`**: mission-control card with header stats (NOW count, total $ impact, avg impact), filterable category chips, ranked items with Impact Score badge, urgency pill (pulsing red for NOW), metrics row (Δ/$/confidence bar), action hint, 4 action buttons.
- **One-click actions**: `Simulate` → routes to client hub with tab=decision (MOCKED). `Apply Strategy`/`Generate Advice`/`Notify Client` → sonner toasts + append to `localStorage.adviser_action_log` (MOCKED pending execution/LLM/Resend wiring).

### Future Impact Engine™ (replaces Section 3 of ClientDecisionHub)
- **New component `FutureImpactEngine.jsx`**: 3-column layout with live delta strip, Levers column (5 sliders), Shock Simulator column, Confidence Bands + "What Matters Most" column.
- **Instant Before→After delta strip** (5 tiles): Readiness Score, Lifetime Income ($), Success Probability %, Years Sustainable, Risk Exposure — each tile shows baseline → scenario with signed delta and trend icon.
- **Shock Simulator toggles** with animated switches:
  - Market crash −30% (growth assets × 0.70, defensive × 0.90)
  - Inflation spike +3% (CPI +3, real returns −2)
  - Early retirement −5yr (retire 5 years sooner)
  - Any active shock shows rose-tinted warning banner.
- **Confidence Bands strip**: P10/P50/P90 as proportional horizontal bars with $ labels.
- **"What Matters Most" reveal button**: hides top-3 actions behind a click for the "wow" moment. Lists ranked uplift.
- **Presets**: Baseline · Aggressive · Cautious · Part-time (also available on the engine).

### Testing
- Iteration 198: **12/12 frontend acceptance items PASS**, 0 regressions, 0 console errors. `/app/test_reports/iteration_198.json`.


## Completed (22 April 2026) — Iteration 198 (Backlog: Market Feed + Export + Presets)

### Real-time recalc on live market data feed
- `readinessCache.js`: enhanced `startMarketFeed` with bounded random walk (±0.6%/tick, clamped ±4%), exposes `getMarketPulse()`, `onMarketPulse(cb)`, `pulseNow()`.
- `ClientDecisionHub` header now shows a clickable "MARKET ±x.xx%" HUD (data-testid="market-pulse-hud"). Click forces an immediate pulse tick.
- Meaningful moves (>0.25%) trigger cache invalidation + book-wide recalc subscriber broadcast.

### Export Decision Graph as PNG/PDF (SOA attachments)
- `DecisionGraph.jsx`: added `graphRef` + two export handlers using existing `html2canvas` + `jsPDF` (no new deps).
- PNG button (data-testid="graph-export-png"): 2x-scale white-backed snapshot, downloads `decision_graph_<Name>_<YYYY-MM-DD>.png`.
- PDF button (data-testid="graph-export-pdf"): landscape A4 with header (client name, score, classification), graph image, and footer line (alerts/opportunities counts). Downloads matching `.pdf`.

### Scenario presets (one-click what-ifs)
- `ClientDecisionHub` Scenario Simulator section now has 4 preset buttons:
  - **Baseline** → reset to client's current inputs.
  - **Aggressive** → retire 2yr earlier, $30k contrib (cap), +10% spend, 8.0% return.
  - **Cautious** → retire 2yr later, ≥$15k contrib, -10% spend, 4.5% return, 3.0% inflation.
  - **Part-time Work** → retire 3yr later, 50% contrib, -5% spend, 6.0% return.
- All presets recompute live via the cached readiness engine; verified Aggressive drops Thompson score 90→86.

### Testing
- Self-tested: PNG + PDF both downloaded successfully with correct filenames. All data-testids verified present. Scenario simulator score updates live. Market HUD renders and is clickable.


## Completed (22 April 2026) — Iteration 197 (Stabilisation + P1 Backlog)

### P0 — Stress test "Too many errors" RESOLVED
- `readinessCache.js`: added `computeReadinessCached(clientId, client, opts)` wrapper with 5-min TTL, LRU prune (max 200 entries), hash-based cache key (inputs + numSims + return/inflation).
- Wired cached compute into `bookAggregator.js` (150 sims, was 200), `ClientDecisionHub.jsx` (250 sims base, 150 scenario), `ClientHome.jsx` (150 base, 100 scenario).
- `retirementReadinessEngine.whatMovesTheNeedle`: reduced probe sim count from 200→120 (base) / 100 (probes), keeps uplift accuracy for 3-action ranking.
- Removed broken `react-app` ESLint extends + installed `eslint-config-react-app@7.0.1` → no more webpack dev overlay.
- **Result**: RCC loads in 1.20s (was ~400–900ms+freeze), 0 console errors on rapid 6-route navigation.

### P1 — Compliance-by-design audit log (backend)
- `/app/backend/routes/compliance_audit.py`: new `/api/compliance-audit/readiness-events` POST + GET + `/summary` endpoints with in-memory `READINESS_EVENTS` store (cap 5000 entries).
- Frontend beacon in `readinessCache.js`: debounced per-client (30s min interval), `keepalive: true`, fire-and-forget. Stamps each fresh compute into the main `AUDIT_LOG` too.

### P1 — Opportunity Engine expansion (`rulesEngine.js`)
- New rules R11–R17: Non-concessional contribution capacity, SMSF suitability (>$500k), Spouse equalisation (balance disparity <50%), Reversionary pension nomination, TTR strategy (60–64), Downsizer contribution (55+ property >$800k), Carry-forward concessional.
- Verified: thompson_family now surfaces 7 opportunity cards including R12 (SMSF) + R9 (Life+TPD gap).

### P1 — Financial Decision Graph
- New `/app/frontend/src/components/readiness/DecisionGraph.jsx`: SVG-based 3-column graph (Actions → Factors → Outcomes) with curved Bezier edges, edge thickness = uplift magnitude, badge chips for +/-pts.
- Mounted as Section 6 inside `ClientDecisionHub`. Legend + alert/opportunity chips + classification badge. Zero extra deps.

### P2 — Event-driven recalc
- `ClientDecisionHub` now subscribes to `onRecalc(clientId)` + `onRecalc('*')` and calls `startMarketFeed()` (45s ticker). Market tick triggers cache invalidation → recompute on mount.

### Testing
- Iteration 197: **100% PASS** (8/8 backend pytest, 9/9 frontend acceptance). "Too many errors" complaint confirmed RESOLVED.


## Completed (21 April 2026) — Iteration 186 (Adviser layout + Client Vault + Settings)

### Task 1 — Adviser Hub search moved below tabs
- Search input + 4 status filter buttons (All/Active/Prospect/Review) + "Showing X of Y" counter are now in a bordered white card INSIDE the All Clients TabsContent (below the tab row).
- Tab row wrapped in `overflow-x-auto` with `flex-shrink-0` on each trigger so 7 tabs fit cleanly on one horizontal row without shrinking.

### Task 2 — Adviser Hub content width
- Removed `xl:pr-[350px]` so page content fills full viewport width. Floating Action Rail remains dismissible.

### Task 3 — Client dashboard tabs confirmed (8 tabs intact from iter 185)
Snapshot · Retirement & Super · Investments · Budget · Tax Centre · Sandbox · Documents · Messages.

### Task 4 — NEW `/my-vault` — Client Vault
- Sidebar: "Documents & Account > Vault [SECURE]" (FolderLock icon)
- 4-tile stat ribbon: Signed Documents count · Meeting Notes (4 mock) · Document Types · AES-256 security
- 3 sub-tabs: **Signed Documents** (filterable table with signature hash + download), **Meeting Notes** (4 mock meetings with summary + attendees + optional Recording badge), **Activity Timeline** (reads from commsLedger)
- Read-only — "contact your adviser to request a new document or signature" footer

### Task 5 — NEW `/my-settings` — Client Settings
- Sidebar: "Documents & Account > Settings" (Settings icon)
- 4 sub-tabs:
  - **Profile** — 6 read-only rows (Name, Partner, Email, Phone, Address, Occupation) each with "Update" → sends request to adviser
  - **ID & TFN** — Verification of Identity (VOI via Frankie Financial, mock verified 2024-10-15), TFN masked 123•••••876 with lock icon + "Request TFN update"
  - **MyGov / ATO** — 3 cards (MyGov linked with scope, ATO tax agent authorised, Bank feeds via CDR with 4 accounts) each with "Open portal" CTA
  - **Notifications** — 5 toggle switches (Documents to sign, Newsletters, Portfolio alerts, Market updates, SMS reminders)

### Sidebar for client mode (expanded)
- You: My Dashboard (HOME)
- Documents & Account: **Vault [SECURE]** · Documents · Connected Accounts · **Settings** · Security

### Testing
- Iteration 186: **100% PASS** (7/7 items). 0 action items. 1 cosmetic Recharts width warning (non-blocking).
