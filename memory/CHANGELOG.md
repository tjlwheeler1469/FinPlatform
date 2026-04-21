## Completed (21 April 2026) — Iteration 182 (Comms Timeline, Vault & App.js Refactor)

### Task 1 — App.js refactor into route registries (P3)
- Created `/app/frontend/src/routes/lazyPages.js` — registry of ~150 lazy-loaded pages grouped by area (Tax, Investments, Scenarios, Retirement, Budget, Adviser, Client, CRM, Research, Integrations, Firm, Auth) + `lazyRetry` helper + `PageLoader`.
- Created `/app/frontend/src/routes/AppRouter.jsx` — the full `<Routes>` definition (~180 lines) + `DashboardRouter` smart router.
- App.js trimmed from **1033 → 443 lines (~60% reduction)** — now contains only PortfolioProvider + App shell.

### Task 2 — Per-client Comms Timeline
- New `/app/frontend/src/lib/commsLedger.js` — shared client-scoped ledger (localStorage: `client_comms_ledger_v1` + `client_vault_v1`) with `logEvent`, `listEvents`, `getDocStatusMap`, `addToVault`, `listVault`. Dispatches `comms-ledger-changed` custom event for live UI updates.
- New `/app/frontend/src/components/crm/ClientCommsTimeline.jsx` — per-client audit trail with 3 sub-tabs:
  - **Checklist** — 6 required docs (FSG, SOA, ROA, FDS, Annual Review, Opt-In) each with auto-ticking Sent + Returned-Signed checkboxes
  - **Timeline** — chronological event list with icons + timestamps
  - **Vault** — signed documents list with mock signature hash + download + delete
- Added **Comms & Vault** tab to UnifiedClientOverview (adviser client view now has 8 tabs).

### Task 3 — Auto-ticking checkboxes + Vault storage
- Wired `DocuSignMock.jsx`: on envelope send/view/sign/decline → `logEvent` to the recipient's ledger; on signed → `addToVault` with signature hash.
- Wired `ComplianceTracker.jsx`: on Mark Signed → `logEvent` + `addToVault`; on Reminder → `logEvent`.
- Wired `NewsletterBuilder.jsx`: on campaign send → `logEvent` per recipient ("campaign_sent").
- Auto-tick verified end-to-end by testing agent (iter 182): send SOA in E-Signatures → Sent box auto-ticks in client profile; advance to signed → Returned-Signed box auto-ticks + doc appears in vault.

### Testing
- Iteration 182: **100% PASS**, 0 UI bugs, 0 action items. Full e2e auto-tick flow verified.
- Non-blocking carry-over: Recharts width(-1) on first paint + 1-2 static 404s on /budget (unrelated).
