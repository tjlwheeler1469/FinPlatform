# Wealth Command Centre - PRD

## Original Problem Statement
Build an AFSL-grade wealth management platform for HNW clients with consolidated views, client context switching, scenario modelling, and comprehensive adviser tools.

## Core Architecture
- **Frontend**: React (CRA) with Shadcn/UI, Recharts, Lucide icons, jsPDF
- **Backend**: FastAPI + MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)
- **Storage**: Emergent Object Storage for client document uploads
- **Centralized Data**: `/app/frontend/src/data/clientData.js`

## HNW Client Profiles
| ID | Name | Net Worth | Gross Assets | Age | Risk | Retire |
|----|------|-----------|-------------|-----|------|--------|
| thompson_family | David & Sarah Thompson | $9.6M | $11.7M | 50 | Balanced | 67 |
| chen_family | Michael & Lisa Chen | $22.8M | $24.0M | 49 | Growth | 60 |
| client_3 | Robert Mitchell | $9.6M | $9.6M | 62 | Conservative | 65 |
| client_4 | Emma & David Williams | $2.8M | $4.0M | 39 | Growth | 67 |
| client_5 | Raj & Priya Patel | $17.5M | $19.6M | 54 | Aggressive | 60 |
| client_6 | Anderson Partnership | $18.3M | $22.0M | 59 | Balanced | 65 |
| client_7 | Sarah Kim | $10.2M | $11.3M | 34 | Aggressive | 50 |

## Key Features
### Monte Carlo Scenario Engine (Goals tab)
Connected flow: Budget → Investments → Portfolio → Retirement with 500 MC simulations, confidence bands, trajectory chart

### Adviser Notification Customisation
Toggle-based: review due, market alerts, compliance, client contact, portfolio rebalance, FDS, document signed, onboarding, insurance, birthdays

### Client Invoicing (Profile tab)
Create invoices with line items + GST, status tracking (draft→sent→paid), demo invoices

### Client Portal Onboarding (/client-portal)
Complete Your Profile: ID upload (passport/licence), TFN input (AES-256 encrypted), contact detail updates, Sync to Xplan (MOCKED)

## Completed (as of 16 April 2026)
- [x] Adviser notification customisation (10 toggles, 5 categories, MongoDB persistence)
- [x] Client invoicing from CRM (create/send/mark paid, GST calculation)
- [x] Client portal ID upload + TFN + info updates → Xplan (MOCKED)
- [x] HNW numbers across all 7 profiles ($3M-$25M)
- [x] Centralized clientData.js — all components import from single source
- [x] Monte Carlo scenario engine with trajectory chart + confidence bands
- [x] BAS Calculator field labels, Combined adviser client view
- [x] All Wheeler references eliminated

## Backlog
- [ ] P2: Real email integration (Resend/SendGrid) for invoice delivery + client pack
- [ ] P2: Replace Mock Xplan sync with real API
- [ ] P3: PDF invoice generation (extend existing jsPDF)
