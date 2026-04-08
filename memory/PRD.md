# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform with consolidated views, client context switching, live market data, AI-powered insights, voice commands, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key), whisper for voice
- **Market Data**: CoinGecko (live crypto)
- **Encryption**: AES-256-GCM for PII (TFN, ID numbers)

## Adviser Client Overview Tab Structure (6 tabs)
1. Overview, 2. Actions, 3. Profile (TFN/ID/entities/retirement projection), 4. Retirement, 5. Tax Centre, 6. Investments

## Client Setup Wizard (/client-setup)
- **Single Client Mode**: 6 steps — Mode → Personal Details → Entities → TFN & ID → Additional Fields → Review
- **Bulk Import Mode**: 3 steps — Mode → CSV Upload → Preview & Import
- **Entity Types**: Individual, Joint, Family Trust, Discretionary Trust, Unit Trust, Company (Pty Ltd), SMSF, Partnership
- **CSV Format**: first_name, last_name, email, phone, date_of_birth, address, tfn, id_type, id_number

## Retirement Portfolio Projection
- **Consolidated Portfolio**: Auto-sums all asset classes (portfolio, super, property, cash, other)
- **Configurable Inputs**: Assets, income, expenses, savings, retirement age, inflation, yield, super return, volatility, CGT, tax deductions
- **Monte Carlo**: 500-2000 simulations, returns success rate, percentiles (p10-p90), depletion risk
- **Deterministic Timeline**: Year-by-year portfolio/super/property projection chart
- **Tax Summary**: Lifetime CGT, tax savings, net tax impact
- **Recommendations**: Auto-generated based on success rate, savings rate, CGT, yield

## Key API Endpoints
- `POST /api/retirement-projection/calculate` — Monte Carlo + deterministic projection
- `GET /api/retirement-projection/{client_id}` — Last saved projection
- `POST /api/client-personal-info/setup` — Full client onboarding
- `POST /api/client-personal-info/{client_id}` — Save/update personal info
- `GET /api/client-personal-info/{client_id}` — Masked data
- `GET /api/client-personal-info/{client_id}/unmasked` — Decrypted data
- `POST /api/client-personal-info/{client_id}/xplan-sync` — Xplan sync (MOCKED)

## MongoDB Collections
- `client_personal_info`, `client_xplan_sync_log`, `retirement_projections`

## Sidebar Structure
### Personal: DASHBOARD, INVESTMENTS, PLANNING (Budget, Goals, Retirement, Tax Centre), RESEARCH, SETTINGS, TOOLS
### Adviser: AI & TASKS, COMPLIANCE, CRM (Client Hub, Health Dashboard, New Client), DASHBOARD, EXECUTION, INTEGRATIONS, TOOLS

## Completed (as of 8 April 2026)
- [x] ComplianceModal "Don't show again" persistence (any dismissal = permanent)
- [x] Multi-entity client onboarding (Individual, Trust, Company, SMSF, Partnership)
- [x] Bulk CSV client import
- [x] Unified Retirement Portfolio Calculator with Monte Carlo projections
- [x] Client Profile tab with TFN/ID/custom fields/Xplan sync
- [x] AES-256-GCM encryption for all PII
- [x] Xplan bidirectional sync (MOCKED)
- [x] All previous UI reorganization and bug fixes

## Backlog
- [ ] P2: Real email integration for Client Pack auto-delivery
- [ ] P2: What-If Budget scenario saving/comparison
- [ ] P2: Budget Calculator Investment Callout verification
