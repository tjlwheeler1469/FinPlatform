# Wealth Command v9.1.0 - Navigation Restructuring & Multi-Asset Support

---

## Executive Summary
Wealth Command is an AI-driven financial operating system designed as a "System of Execution" for financial advisers. This version focuses on navigation restructuring and comprehensive multi-asset support across CGT and Net Worth calculations.

---

## Changes in v9.1.0 (March 2026)

### Navigation Restructuring (User Requested)

#### Personal Mode - Finances
**Before:** Net Worth, Property, Shares, All Accounts, Budget
**After:** Net Worth, Property, **Cash & TDs**, All Accounts, Budget
- Removed "Shares" from Finances (available under Trading)
- Added "Cash & TDs" to Finances

#### Personal Mode - Planning
**Before:** Goals, Strategy, AI Advisor, What-If
**After:** **Scenario Modelling (NEW)**, AI Advisor, **Rebalancing**
- Combined Goals, Strategy, and What-If into single "Scenario Modelling" page
- Moved Portfolio Rebalancing from Calculators to Planning

#### Personal Mode - Calculators
**Before:** Loan, Monte Carlo, SMSF, Rebalancing
**After:** Loan, Monte Carlo, SMSF
- Rebalancing moved to Planning

### New Scenario Modelling Page
Location: `/scenario-modelling`
Features:
- **Goals Tab**: View and manage financial goals with progress tracking
- **Existing Assets Tab**: Select which existing assets to include in projections (stocks, ETFs, bonds, property, crypto, cash, managed funds)
- **Build Scenario Tab**: Add multiple investments across asset types with expected returns and contribution schedules
- **Projection Tab**: View conservative/moderate/aggressive projections with interactive charts

### CGT Now Includes All Assets
The Capital Gains Tax page now tracks ALL asset types:
- ✅ Stocks (CBA, BHP, CSL, WBC, etc.)
- ✅ ETFs (VAS, VGS)
- ✅ Bonds (Government & Corporate)
- ✅ Property (Investment properties)
- ✅ Crypto (BTC, ETH)
- ✅ Managed Funds

### Net Worth Includes All Trading Assets
Family Wealth Dashboard now calculates:
```javascript
totalInvestments = shareValue + etfValue + bondsValue + fundsValue + cryptoValue
```
- Shares: Individual stock holdings
- ETFs: VAS, IVV, VGS ($166K)
- Bonds: Government & Corporate ($80K)
- Managed Funds: Magellan, Platinum ($126K)
- Crypto: BTC, ETH ($52.6K)

---

## Navigation Structure (v9.1.0)

### Personal Mode
```
Dashboard
├── Daily Briefing
├── Markets (LIVE)
├── Retirement
└── Health Score

Trading
├── Stocks & ETFs
├── Bonds
├── Funds
└── Research

Finances
├── Net Worth (All Assets)
├── Property
├── Cash & TDs        ← NEW
├── All Accounts
└── Budget

Planning
├── Scenario Modelling (NEW)  ← Combined Goals/Strategy/What-If
├── AI Advisor
└── Rebalancing       ← Moved from Calculators

Tax & Reports
├── Tax Analysis
├── Capital Gains (All Assets)  ← Enhanced
├── Reports
└── Documents

Calculators
├── Loan
├── Monte Carlo
└── SMSF

Settings
├── Security
├── Bank Feeds
└── Import/Export
```

---

## Key Files Modified

| File | Change |
|------|--------|
| `/app/frontend/src/components/Layout.jsx` | Navigation restructuring |
| `/app/frontend/src/pages/ScenarioModelling.jsx` | NEW - Combined page |
| `/app/frontend/src/pages/CGT.jsx` | Added all asset types |
| `/app/frontend/src/pages/FamilyWealthDashboard.jsx` | Added tradingAssets |
| `/app/frontend/src/App.js` | Added /scenario-modelling route |

---

## Verified Working Features (v9.1.0)

| Feature | Status |
|---------|--------|
| Navigation - Finances structure | ✅ PASS |
| Navigation - Planning structure | ✅ PASS |
| Scenario Modelling page (4 tabs) | ✅ PASS |
| CGT multi-asset types | ✅ PASS |
| Net Worth all trading assets | ✅ PASS |
| Cash & TDs route | ✅ PASS |
| Live Market Data (yfinance) | ✅ PASS |

---

## Pending Items / Backlog

### P1 (High Priority)
- [ ] Wire up Next Best Actions "Execute Action" to actual workflows
- [ ] Connect Goal Tracker editing to backend persistence
- [ ] Implement Fathom API integration for meeting notes

### P2 (Medium Priority)
- [ ] Connect to persistent MongoDB database
- [ ] Integrate Alpaca paper trading API
- [ ] Replace remaining mock data with real API calls

### P3 (Low Priority)
- [ ] Mobile app wrapper
- [ ] Voice interface (Whisper)
- [ ] Additional custodian API integrations

---

## Credentials

- **Test Adviser**: `advisor@wealthcommand.io` / `secure_password_123`
- **Preview URL**: https://transaction-lab-3.preview.emergentagent.com
- **Compliance bypass**: `localStorage.setItem('wealth_command_compliance_v5', 'permanent')`

---

## Data Sources

| Data | Source | Status |
|------|--------|--------|
| Market indices | yfinance | LIVE |
| Crypto prices | yfinance | LIVE |
| Client data | Mock arrays | MOCK |
| CGT events | Demo data | MOCK |
| Trading assets | Hardcoded | MOCK |

---

*Last Updated: March 18, 2026*
