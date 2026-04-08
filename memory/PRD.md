# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)

## Adviser Client Overview Tab Structure (6 tabs)
1. **Overview**: PersonalDashboard embedded
2. **Actions**: NextBestActions embedded
3. **Profile**: ClientProfileTab — TFN, ID documents, custom fields, Xplan sync
4. **Retirement**: RetirementConfidence embedded
5. **Tax Centre**: UnifiedTaxCentre embedded (custom button-based tabs)
6. **Investments**: UnifiedInvestments embedded (10 sub-tabs)

## Client Personal Info System
- **Encryption**: AES-256-GCM at rest for TFN and ID document numbers
- **Masking**: TFN shows as ***-***-XXX (last 3 digits), IDs show last 4 chars
- **Xplan Sync**: Bidirectional (MOCKED — ready for real API when credentials configured)
- **Client ID mapping**: thompson_family -> XP-002, james_mitchell -> XP-001, michael_chen -> XP-003
- **ID Types**: Driver's Licence, Passport, Medicare, Birth Certificate, Citizenship, ImmiCard, Proof of Age, Veteran Card, Other
- **Custom Fields**: Adviser can add unlimited label/value pairs

### API Endpoints
- `POST /api/client-personal-info/setup` — Full client onboarding
- `POST /api/client-personal-info/{client_id}` — Save/update personal info
- `GET /api/client-personal-info/{client_id}` — Get masked data
- `GET /api/client-personal-info/{client_id}/unmasked` — Get decrypted data
- `POST /api/client-personal-info/{client_id}/xplan-sync` — Trigger Xplan sync
- `GET /api/client-personal-info/{client_id}/xplan-status` — Sync status & history

## Tax Centre Sub-Tabs (8 tabs)
Tax Analysis, BAS Calculator, Capital Gains, Division 7A, Tax Loss Harvesting, Income Splitting, Tax Calendar, Trust Distributions

## Personal Dashboard Tab Structure (5 tabs)
Overview, Net Worth, Wealth Trends, Insights, Transactions

## /investments Page Tab Structure (10 tabs, alphabetical after Overview)
Overview, Bonds, Cash & TDs, Crypto, Managed Funds, Property, Shares & ETFs, SMSF, Super & Pension, Unlisted

## Sidebar Structure

### Personal Mode
- DASHBOARD: Markets (LIVE), My Dashboard (HOME)
- INVESTMENTS: All Investments (NEW), Rebalancing
- PLANNING: Budget (NEW), Goals & Scenarios, Retirement (PRO), Tax Centre (NEW)
- RESEARCH: Research Centre (NEW)
- SETTINGS: Bank Feeds, Documents, Import/Export, Security
- TOOLS: Loan Calculator

### Adviser Mode (No client selected)
- AI & TASKS: AI Assistant, Meeting Prep
- COMPLIANCE: Compliance Centre, Security
- CRM: Client Hub, Health Dashboard (NEW), New Client (NEW)
- DASHBOARD: Dashboard, Markets (LIVE)
- EXECUTION: Batch Execute
- INTEGRATIONS: Live Sync, Platforms, Xplan Sync
- TOOLS: Notifications

## Key Technical Patterns
- **`embedded={true}` prop**: Components check `if (embedded) return content; else return <Layout>{content}</Layout>;`
- **Custom button tabs**: UnifiedTaxCentre and TaxLossHarvesting use custom buttons (NOT Radix Tabs)
- **ErrorBoundary + Suspense**: Every lazy-loaded component wrapped in both
- **AES-256-GCM encryption**: Used for all PII (TFN, ID numbers) via services/encryption.py

## MongoDB Collections
- `client_personal_info` — TFN (encrypted), ID documents (encrypted), custom fields, Xplan sync metadata
- `client_xplan_sync_log` — Sync event history

## Completed (as of 8 April 2026)
- [x] Client Setup Wizard — 4-step onboarding (Personal, TFN & ID, Additional Fields, Review)
- [x] Profile tab on client overview with TFN, ID docs, custom fields, Xplan sync
- [x] AES-256-GCM encryption at rest for all sensitive data
- [x] Masked display (TFN: ***-***-XXX, IDs: last 4 chars)
- [x] Xplan bidirectional sync (MOCKED, ready for real API)
- [x] "New Client" nav link in adviser CRM section
- [x] Fixed nested tab switching (custom button tabs)
- [x] Fixed Tax Loss Harvesting analysis
- [x] All previous UI reorganization work

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: ComplianceModal "Don't show again" persistence
- [ ] P2: Budget Calculator Investment Callout verification
- [ ] P3: Client Onboarding Wizard (enhanced multi-entity setup)
