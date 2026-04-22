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
