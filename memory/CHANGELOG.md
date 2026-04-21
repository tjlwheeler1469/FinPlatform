## Completed (21 April 2026) — Iteration 183 (Design Polish + Sandbox + Decision Centre Removal)

### Task 1 — Client Hub design polished
- Editorial header: "PRACTICE" eyebrow label (uppercase tracked) + big "Client Hub" title + inline households count in subline.
- Tighter 5-card stat ribbon (p-4 not pt-6): Total AUM (gradient navy), Active, Prospects, Reviews Due (amber), Total Accounts — each with a sub-label and hover lift.
- Tabs: inline vertical divider between practice tabs (All Clients · Portfolio · Activity) and CRM tabs (Segments · Comms · SOA/ROA · E-Sign). Active state navy + white + shadow.

### Task 2 — Decision Centre removed from Advisor Dashboard
- `/advisor-command-center` now has only the Dashboard & Briefing tab. Decision Centre trigger + TabsContent removed from `AdvisorCommandCenter.jsx`.

### Task 3 — Client Investments is read-only (confirmed)
- `SimpleClientView.InvestmentsTab` verified: 0 Add buttons. Footer reads "View only — contact your adviser to adjust holdings".

### Task 4 — Client Sandbox (playground, fully isolated)
- New `/app/frontend/src/components/ClientSandbox.jsx` wired into SimpleClientView as a **Sandbox** tab.
- 8 sliders: starting balance · savings/year · retirement spending · current age · retire age · plan-until age · expected return · inflation.
- Headline confidence % (4 bands: Very Strong ≥85, On Track ≥70, Needs Work ≥50, At Risk); projected balance at retirement; years-in-retirement; annual contrib summary.
- Projection chart with Median / P10 worst-case / P90 best-case trajectories + red retirement-age reference line.
- Seeded once from CLIENT_DATA (for realism) but **state is component-local React useState** — no writes to CLIENT_DATA, comms ledger, localStorage, or backend. Adviser's plan untouched.
- Big amber "Playground mode" banner + Reset button + footer lock reminding client to contact adviser to make changes real.

### Testing
- Iteration 183: **100% PASS** (7/7 target flows). 0 action items. 1 cosmetic Recharts width(-1) warning fixed by wrapping chart in fixed-height div.
