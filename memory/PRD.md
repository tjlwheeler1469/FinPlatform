# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)
- **Encryption**: AES-256-GCM for PII (TFN, ID numbers)

## Adviser Client Overview Tab Structure (7 tabs)
1. Overview, 2. Actions, 3. Retirement, 4. Investments, 5. Budget, 6. Tax Centre, 7. Profile

## Investments Tab Structure (11 tabs)
1. Overview, 2. Rebalancing, 3. Bonds, 4. Cash & TDs, 5. Crypto, 6. Managed Funds, 7. Property, 8. Shares & ETFs, 9. SMSF, 10. Super & Pension, 11. Unlisted

## Personal Dashboard Tabs (5 tabs)
1. Overview, 2. Net Worth (calculation breakdown tables), 3. Wealth Trends, 4. Insights, 5. Transactions

## Client Setup Wizard (/client-setup)
- **Single Client Mode**: 6 steps — Mode > Personal Details > Entities > TFN & ID > Additional Fields > Review
- **Bulk Import Mode**: 3 steps — Mode > CSV Upload > Preview & Import
- **Entity Types**: Individual, Joint, Family Trust, Discretionary Trust, Unit Trust, Company (Pty Ltd), SMSF, Partnership

## Key API Endpoints
- `POST /api/retirement-projection/calculate` — Monte Carlo + deterministic projection
- `GET /api/retirement-projection/{client_id}` — Last saved projection
- `POST /api/client-personal-info/setup` — Full client onboarding
- `POST /api/client-personal-info/{client_id}` — Save/update personal info
- `GET /api/client-personal-info/{client_id}` — Masked data
- `POST /api/client-personal-info/{client_id}/xplan-sync` — Xplan sync (MOCKED)

## MongoDB Collections
- `client_personal_info`, `client_xplan_sync_log`, `retirement_projections`

## Sidebar Structure
### Personal: DASHBOARD (My Dashboard, Markets), INVESTMENTS (All Investments, Rebalancing), PLANNING (Budget, Goals, Retirement, Tax Centre), RESEARCH, SETTINGS (Bank Feeds, Documents, Security), TOOLS
### Adviser: DASHBOARD (Dashboard, Markets), CRM (Client Hub, New Client, Import/Export), EXECUTION (Batch Execute, Meeting Prep), INTEGRATIONS (Live Sync, Platforms, Xplan), TOOLS (Notifications, Security)
### Client Context: OVERVIEW (Client Overview 360), DOCUMENTS (Compliance, Meeting Notes, Reports, Vault), PLANNING (Budget, Goals & Scenarios)

## Mock Data (Thompson Family)
- **Gross Assets**: $2,278,000 (12 holdings)
- **Liabilities**: $669,200 (3 items)
- **Net Worth**: $1,608,800
- **Data used consistently across**: Overview, Net Worth tab, Investments Overview, Client Profile

## Completed (as of 8 April 2026)
- [x] ComplianceModal "Don't show again" persistence
- [x] Multi-entity client onboarding
- [x] Bulk CSV client import
- [x] Unified Retirement Portfolio Calculator with Monte Carlo
- [x] Client Profile tab with TFN/ID/custom fields/Xplan sync
- [x] AES-256-GCM encryption for all PII
- [x] Xplan bidirectional sync (MOCKED)
- [x] Unified Client Overview: Overview > Actions > Retirement > Investments > Budget > Tax Centre > Profile
- [x] Budget tab in Unified Client Overview (HouseholdBudget embedded)
- [x] Rebalancing at 2nd position in Investments
- [x] Data Import/Export moved from Personal to Adviser CRM
- [x] Professional sidebar styling
- [x] Fixed calculation mismatch: Net Worth tab now uses same data as Overview (replaced FamilyWealthDashboard)
- [x] Full Calculation Breakdown table (every asset/liability with category, entity, value)
- [x] Removed Client Health Dashboard, AI & Tasks, Compliance from Adviser sidebar
- [x] Simplified Client Profile to high-level overview (retirement, portfolio, holdings, liabilities)
- [x] Chrome extension error suppression in React dev overlay

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: Budget Calculator Investment Callout verification
- [ ] P3: Consolidate and centralize demo client data across components
- [ ] P3: Replace Mock Xplan integration with real API when credentials available
