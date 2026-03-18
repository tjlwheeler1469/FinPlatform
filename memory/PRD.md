# Wealth Command v9.2.0 - Adviser Mode Enhancements

---

## Executive Summary
Wealth Command is an AI-driven financial operating system designed as a "System of Execution" for financial advisers. This version focuses on significant enhancements to Adviser Mode, including historical market charts and improved transaction modeling workflow.

---

## Changes in v9.2.0 (March 2026)

### 1. Market Dashboard - Historical Charts
Added comprehensive historical price charts with multiple timeframe options:
- **Timeframes**: 1 Day, 1 Week, 2 Weeks, 1 Month, 3 Months, 6 Months, 1 Year, 3 Years, 5 Years, 10 Years
- **Assets**: S&P 500, ASX 200, FTSE 100, Bitcoin, Gold, AUD/USD
- **Live data** via yfinance with graceful fallback
- **Chart stats**: Open, Close, High, Low, % Change
- New backend endpoint: `/api/macro/history`

### 2. Transaction Modeler - Save & Generate Plan
Enhanced the What-If Modeler to support full workflow:
- **Multiple transactions** can be added to a scenario
- **Save Scenario** button - saves to localStorage
- **Generate Plan** button - generates financial plan from scenario
- Removed separate "Generate Plan" nav item (now integrated)

### 3. Client Context Navigation Restructured
**New Order** (when client selected):
1. **Overview** - Dashboard, Actions, Health Score
2. **Investments** (moved up) - Net Worth, Shares & Trading, Cash & TDs, Funds, Property
3. **Plan** - Goals, What-If Modeler
4. **Documents** - Vault, Meeting Notes, Reports
5. **AI Copilot** - AI Assistant (combined, no duplicate)

### 4. AI Sections Combined
- Removed duplicate AI navigation
- Single "AI Copilot" section with "AI Assistant" item
- Fixed Layout.jsx to not append extra AI nav group

---

## Navigation Structure (v9.2.0)

### Adviser Mode - Base Nav (No Client)
```
Dashboard
├── Command Center
└── Markets (LIVE)

CRM
├── Client Hub (HUB)
└── Tasks

AI Copilot
├── AI Assistant
├── Meeting Prep
└── Decision Center

Execution
├── Batch Execute
└── Trading

Compliance
├── Compliance
└── Security
```

### Adviser Mode - Client Context (Client Selected)
```
[Dashboard & CRM from base nav]

Overview
├── Dashboard (Client 360)
├── Actions
└── Health Score

Investments               ← MOVED UP
├── Net Worth
├── Shares & Trading
├── Cash & TDs           ← NEW
├── Funds                ← NEW
└── Property

Plan
├── Goals
└── What-If Modeler      ← Includes Save & Generate Plan

Documents
├── Vault
├── Meeting Notes (NEW)
└── Reports

AI Copilot               ← COMBINED (single section)
└── AI Assistant
```

---

## Key Technical Implementations

### Historical Data Endpoint
```python
# /api/macro/history
GET /api/macro/history?symbol=^GSPC&period=1mo&interval=1d

Response:
{
  "symbol": "^GSPC",
  "period": "1mo",
  "interval": "1d",
  "history": [
    {"date": "...", "open": 5500.12, "close": 5520.45, "high": 5545.00, "low": 5490.00, "volume": 12345678}
  ],
  "data_source": "live"
}
```

### Transaction Modeler Buttons
- `data-testid="save-scenario-btn"` - Saves scenario to localStorage
- `data-testid="generate-plan-btn"` - Generates plan with toast notification

---

## Verified Features (v9.2.0)

| Feature | Status |
|---------|--------|
| Historical chart with 10 timeframes | ✅ PASS |
| Asset selector with 6 options | ✅ PASS |
| Save Scenario button | ✅ PASS |
| Generate Plan button | ✅ PASS |
| Client nav order (Investments before Plan) | ✅ PASS |
| Investments has Cash & TDs, Funds | ✅ PASS |
| No duplicate AI sections | ✅ PASS |

---

## Pending Items / Backlog

### P1 (High Priority)
- [ ] Connect saved scenarios to backend persistence
- [ ] Implement full AI plan generation with LLM
- [ ] Wire up Goal editing to backend

### P2 (Medium Priority)
- [ ] Connect to persistent MongoDB database
- [ ] Integrate Alpaca paper trading API
- [ ] Implement Fathom API for meeting notes

### P3 (Low Priority)
- [ ] Mobile app wrapper
- [ ] Voice interface (Whisper)
- [ ] Additional custodian APIs

---

## Data Sources

| Data | Source | Status |
|------|--------|--------|
| Market indices | yfinance | LIVE |
| Historical prices | yfinance | LIVE |
| Crypto prices | yfinance | LIVE |
| Scenarios | localStorage | LOCAL |
| Client data | Mock arrays | MOCK |

---

## Credentials

- **Test Adviser**: `advisor@wealthcommand.io` / `secure_password_123`
- **Preview URL**: https://transaction-lab-3.preview.emergentagent.com
- **Adviser mode**: `localStorage.setItem('app_mode', 'adviser')`
- **Select client**: `localStorage.setItem('selected_client', JSON.stringify({id:'client_1',name:'Smith Family'}))`

---

*Last Updated: March 18, 2026*
