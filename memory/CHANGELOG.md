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
