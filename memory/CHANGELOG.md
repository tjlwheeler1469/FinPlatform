## Completed (21 April 2026) — Iteration 185 (Client View consolidation)

### All 3 user asks delivered
1. **Retirement → dashboard tab** — Client dashboard "Retirement & Super" tab now embeds Monte Carlo confidence + P10/P50/P90 projection chart + a new Super & Pension breakdown card (3-tile: Total Super Balance · Annual Contributions · Retirement Age) + concessional cap usage bar (FY25 $30k) + list of individual super accounts. Sidebar entry removed.
2. **Investments → dashboard tab** — Investments tab already embedded in SimpleClientView; sidebar entry removed from `personalNavGroups`. (Mobile bottom nav retained for phone viewports.)
3. **Budget + Tax Centre → dashboard tabs** — new `BudgetTab` (3-tile monthly flow + annual summary + savings-rate bar, 100% read-only) and new `TaxTab` (4-tile estimated annual tax position + marginal bands applied table using 2025 AU tax bands, 100% read-only). Both sidebar entries removed.

### Client dashboard now has 8 tabs (single entry point)
Snapshot · Retirement & Super · Investments · Budget · Tax Centre · Sandbox · Documents · Messages

### Read-only enforcement
- Zero `<input>`, `<textarea>`, `[role="slider"]` across Snapshot, Retirement & Super, Investments, Budget, Tax Centre, Documents (verified by testing agent).
- **Sandbox remains the ONLY input surface** — 8 sliders, fully isolated from adviser data.
- Messages tab keeps the composer (client → adviser is intended).

### Sidebar for client mode (trimmed)
- You: My Dashboard (HOME)
- Documents & Account: Documents, Connected Accounts, Security

### Testing
- Iteration 185: **100% PASS** (3/3). 0 action items. One cosmetic tab-wrap fix applied (overflow-x-auto + flex-shrink-0) to keep 8 tabs on a single horizontal row.
