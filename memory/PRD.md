# Wealth Command - Financial Services Super App
## IRESS XPlan Alternative | Stockbroking + Financial Planning

## Vision
Building the **#1 AI-native financial planning platform** for Australian financial advisers. A "Wealth Operating System" combining:
- 📊 **Financial Planning** - Goals, scenarios, Monte Carlo simulations
- 📈 **Stockbroking Research** - ASX screener, moat analysis, intrinsic values
- 📋 **Compliance** - Audit trails, SOA generation, regulatory checks
- 💰 **Wealth Dashboards** - Cash, Shares, ETFs, Property, Super, Crypto
- 🤖 **AI-Powered Tools** - Copilot, Meeting Prep, Intelligence Feed

---

## Latest Update (December 16, 2025) - UX Improvements

### ✅ Iteration 50 - All Tests Passing (100%)
- **Backend**: 32/32 tests passing
- **Frontend**: 4/4 new pages verified

### UX Improvements Implemented

#### 1. Holdings Editing (Buy/Sell) ✅
- Buy/Sell buttons on every share in portfolio
- Transaction dialog with units and price input
- Works for Shares and Crypto

#### 2. AI Insights Inline ✅
- AI Insights displayed inline within the app
- Not a popup/external window
- Action buttons: "View Client", "Run Scenario", "Schedule Review"
- Navigates to appropriate client pages

#### 3. Wealth + Aggregator Combined ✅
- `/client-wealth` combines wealth dashboard with connected accounts
- Single unified view for all client assets
- Includes bank feeds section

#### 4. Compliance at Client Level ✅
- `/compliance` shows client-level compliance checks
- Dashboard with actionable items
- Risk alerts are clickable and navigate to relevant pages

#### 5. Consistent Branding ✅
- All pages use `Layout` component
- Left sidebar navigation on all screens
- Dark blue (#1a2744) sidebar with gold (#D4A84C) accents
- Same fonts, colors, button styles across app

#### 6. Left Navigation Always Visible ✅
- Sidebar present on: Dashboard, Client Wealth, AI Insights, Compliance
- Consistent navigation structure throughout

---

## Architecture (21 Backend Routes)

```
/app/backend/routes/
├── aggregation.py      # Bank feeds, Plaid simulation
├── ai.py               # AI features
├── analysis.py         # Data analysis
├── auth.py             # JWT authentication
├── compliance.py       # Audit trails, SOA
├── copilot.py          # AI Wealth Copilot
├── crm.py              # Client CRM
├── dashboard.py        # Main dashboard
├── documents.py        # Document management
├── goals.py            # Goal tracking
├── market.py           # Market data (Yahoo Finance)
├── marketplace.py      # Product marketplace
├── meeting_prep.py     # AI Meeting Prep
├── portfolio.py        # Portfolio management
├── practice.py         # Practice management
├── research.py         # Stock research & screener
├── scenarios.py        # Scenario modeling
├── security.py         # 2FA, MFA
├── tax.py              # Tax analysis
├── timeline.py         # Life events
└── wealth_dashboard.py # Comprehensive wealth
```

## Frontend Pages

### Client-Level Pages (with Layout)
- `/client-wealth` - Wealth Overview + Bank Feeds + Buy/Sell
- `/client-insights` - AI Insights inline with action buttons
- `/compliance` - Compliance Center with client checks

### Adviser Pages
- `/adviser-dashboard` - Practice overview
- `/meeting-prep` - AI 30-second briefings
- `/stock-research` - ASX screener
- `/ai-copilot` - Natural language financial advisor
- `/decision-center` - Real-time scenario modeling

---

## Key API Endpoints (All Working)

| Category | Endpoint | Status |
|----------|----------|--------|
| **Wealth** | GET `/api/wealth/overview/{client_id}` | ✅ |
| **Wealth** | GET `/api/wealth/performance/{client_id}` | ✅ |
| **Wealth** | GET `/api/wealth/income/{client_id}` | ✅ |
| **Wealth** | GET `/api/wealth/rebalance/{client_id}` | ✅ |
| **Compliance** | POST `/api/compliance/check` | ✅ |
| **Compliance** | GET `/api/compliance/dashboard` | ✅ |
| **Compliance** | POST `/api/compliance/soa/generate` | ✅ |
| **Compliance** | POST `/api/compliance/audit-log` | ✅ |
| **AI Insights** | GET `/api/copilot/todays-insights` | ✅ |
| **Aggregation** | GET `/api/aggregation/accounts` | ✅ |
| **Aggregation** | GET `/api/aggregation/institutions` | ✅ |

---

## Test Credentials
- **Advisor**: `advisor@wealthcommand.com` / `demo123`
- **Client**: `client@example.com` / `client123`

---

## MOCKED Services
- **Account Aggregation**: Plaid simulation (needs API keys)
- **SMS 2FA**: Twilio demo mode (needs credentials)
- **ASX Stock Data**: Simulated (not real-time)

---

## Remaining Work (Prioritized)

### P0 - Critical
- [ ] Backend Refactoring: Move logic from `server.py` to route files

### P1 - High Priority
- [ ] Real Plaid Integration for live bank feeds
- [ ] Real ASX market data integration
- [ ] Disclaimer modal - show only once per session

### P2 - Medium Priority
- [ ] PostgreSQL database migration
- [ ] Real Twilio SMS for 2FA

### P3 - Future
- [ ] SOC 2 Compliance
- [ ] White-Label Version
- [ ] Mobile app
