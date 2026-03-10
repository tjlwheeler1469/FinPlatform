# Australian Investment Analyzer - PRD

## Original Problem Statement
Build an app that analyses all options for personal and business investment in Australia using cash, bonds, stocks, and property, taking into account personal and company taxes. Allow inputs (cash, property value, expenses inc school fees) to provide the best outcomes and consider interest rates, dividends with franking credits. Provide an overview of debt to equity ratio, loan payback timeframes with variable interest rates.

## User Choices
- Current 2024-25 Australian tax rates + announced future rates
- Advanced analysis with Monte Carlo simulations
- Multiple property portfolio with negative gearing calculations
- **NO LOGIN REQUIRED** - Direct access to app
- All Australian financial products (personal & business)
- Pure mathematical models without AI integration
- Demo portfolio with investment recommendations

## Demo Portfolio Data
- **User**: John Smith, 45 years old, $185,000 taxable income
- **Net Worth**: $1,978,000
- **Total Assets**: $2,920,000
- **Total Debt**: $942,000 (32% debt ratio)
- **Properties**: 2 investment properties (Sydney Unit & Melbourne Townhouse, both negatively geared)
- **Investments**: Cash ($75k), Term Deposits ($150k), Shares ($320k), ETFs ($145k), Bonds ($80k), SMSF ($580k)

## Investment Recommendations
1. **Maximize Salary Sacrifice** (HIGH) - Save $1,850/year in tax
2. **Negative Gearing Tax Benefit** (HIGH) - $4,588/year from depreciation review
3. **Rebalance to International ETFs** (MEDIUM) - Reduce concentration risk
4. **Spouse Contribution Benefit** (MEDIUM) - $540 tax offset
5. **CGT Timing Strategy** (LOW) - Wait for 50% discount eligibility
6. **Debt Recycling Opportunity** (MEDIUM) - Convert non-deductible debt

## Core Requirements (Static)
- ✅ Australian 2024-25 personal tax brackets (Stage 3 cuts)
- ✅ Company tax rates (25% base, 30% full)
- ✅ Franking credit calculations
- ✅ Negative gearing analysis
- ✅ Monte Carlo simulation engine
- ✅ Loan calculator with variable rates
- ✅ Debt to equity ratio
- ✅ User authentication (Google OAuth)
- ✅ Scenario saving and management
- ✅ Capital Gains Tax calculator (NEW)
- ✅ Historical tax comparison (NEW)
- ✅ SMSF contribution optimizer (NEW)
- ✅ Report generator (NEW)

## Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts
- **Backend**: FastAPI, Motor (async MongoDB)
- **Database**: MongoDB
- **Auth**: Emergent-managed Google OAuth

## What's Been Implemented (March 2026)

### Backend APIs - Original
- `/api/auth/session` - Google OAuth session exchange
- `/api/auth/me` - Get current user
- `/api/auth/logout` - Logout user
- `/api/scenarios` - CRUD for investment scenarios
- `/api/analyze/tax` - Personal & company tax calculation
- `/api/analyze/franking` - Franking credit calculator
- `/api/analyze/negative-gearing` - Property analysis
- `/api/analyze/monte-carlo` - Investment projections
- `/api/analyze/loan` - Loan repayments with variable rates
- `/api/analyze/debt-equity` - Debt to equity analysis
- `/api/analyze/full-scenario` - Comprehensive scenario analysis
- `/api/tax-rates` - Current Australian tax rates

### Backend APIs - NEW (March 2026)
- `/api/analyze/cgt` - Capital Gains Tax calculator (50% individual, 33.33% SMSF, 0% company discounts)
- `/api/analyze/smsf` - SMSF contribution optimizer with Division 293, projections
- `/api/analyze/tax-comparison` - Compare tax across multiple years
- `/api/tax-rates/historical` - Historical tax rates (2020-21 to 2024-25)
- `/api/analyze/full-scenario/report` - Generate PDF report data
- `/api/analyze/salary-packaging` - Salary packaging FBT calculator
- `/api/salary-packaging/items` - Get available packaging items
- `/api/analyze/property-comparison` - Compare investment properties
- `/api/analyze/scenario-comparison` - Compare multiple investment scenarios

### Frontend Pages - Original
- Landing Page with hero section
- Dashboard with portfolio overview
- Tax Analysis (personal & company)
- Property Portfolio with negative gearing
- Monte Carlo Simulation with probability charts
- Loan Calculator with variable rate scenarios
- Saved Scenarios management
- Scenario Builder (create/edit)

### Frontend Pages - NEW (March 2026)
- CGT Calculator - Calculate capital gains with discount eligibility
- Historical Tax Comparison - Compare tax across 5 years, see Stage 3 savings
- SMSF Optimizer - Contribution strategy, caps, Division 293, projections
- Report Generator - Generate and download/print comprehensive reports
- Salary Packaging Calculator - FBT implications, tax benefits, NFP caps
- Property Comparison - Side-by-side property analysis with yield, ROE, projections
- Scenario Comparison - Multi-scenario comparison with charts and differences

## Prioritized Backlog

### P0 - Critical (All Done ✅)
- ✅ Core tax calculations
- ✅ User authentication
- ✅ Scenario saving
- ✅ Capital gains tax calculator
- ✅ Historical tax comparison
- ✅ SMSF contribution optimizer
- ✅ Report generator

### P1 - High Priority
- ✅ Salary packaging calculator (March 2026)
- ✅ Investment property comparison tool (March 2026)
- ✅ Multi-scenario comparison view (March 2026)
- Tax loss harvesting suggestions
- Dividend reinvestment calculator

### P2 - Medium Priority (Future)
- Superannuation guarantee calculator
- Rental yield optimizer
- Export to accounting software

### P3 - Nice to Have
- Tax planning calendar with due dates
- Integration with bank feeds
- Mobile app version
- Share scenarios with advisors

## Next Tasks
1. Advisor Connect - Book time with a financial advisor
2. Tax loss harvesting suggestions
3. Dividend reinvestment calculator
4. Export to accounting software

## Completed This Session (March 2026)
- ✅ Integrated Salary Packaging Calculator (/salary-packaging)
- ✅ Integrated Property Comparison Tool (/property-comparison)
- ✅ Integrated Scenario Comparison View (/scenario-comparison)
- ✅ Added navigation links for all 3 new features
- ✅ Testing: 100% backend, 100% frontend pass rate
