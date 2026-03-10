# Australian Investment Analyzer - PRD

## Original Problem Statement
Build an app that analyses all options for personal and business investment in Australia using cash, bonds, stocks, and property, taking into account personal and company taxes. Allow inputs (cash, property value, expenses inc school fees) to provide the best outcomes and consider interest rates, dividends with franking credits. Provide an overview of debt to equity ratio, loan payback timeframes with variable interest rates.

## User Choices
- Current 2024-25 Australian tax rates + announced future rates
- Advanced analysis with Monte Carlo simulations
- Multiple property portfolio with negative gearing calculations
- Emergent-managed Google Auth for user accounts
- All Australian financial products (personal & business)
- Pure mathematical models without AI integration

## User Personas
1. **Individual Investors** - Managing personal wealth across cash, shares, property
2. **Business Owners** - Comparing personal vs company tax structures
3. **Property Investors** - Analyzing negative gearing benefits across multiple properties
4. **Financial Planners** - Running scenario comparisons for clients

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

## Prioritized Backlog

### P0 - Critical (All Done ✅)
- ✅ Core tax calculations
- ✅ User authentication
- ✅ Scenario saving
- ✅ Capital gains tax calculator
- ✅ Historical tax comparison
- ✅ SMSF contribution optimizer
- ✅ Report generator

### P1 - High Priority (Future)
- Salary packaging calculator
- Investment property comparison tool
- Tax loss harvesting suggestions
- Dividend reinvestment calculator

### P2 - Medium Priority (Future)
- Superannuation guarantee calculator
- Rental yield optimizer
- Multi-scenario comparison view
- Export to accounting software

### P3 - Nice to Have
- Tax planning calendar with due dates
- Integration with bank feeds
- Mobile app version
- Share scenarios with advisors

## Next Tasks
1. Add salary packaging calculator
2. Investment property comparison tool
3. Tax loss harvesting suggestions
4. Multi-scenario comparison view
