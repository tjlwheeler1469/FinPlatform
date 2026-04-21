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
