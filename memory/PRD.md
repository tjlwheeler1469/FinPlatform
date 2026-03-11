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
- `/api/analyze/tax-loss-harvesting` - Tax loss harvesting opportunities
- `/api/analyze/dividend-reinvestment` - Dividend reinvestment vs cash comparison
- `/api/dividend/historical-growth` - Historical dividend growth rates

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
- Tax Loss Harvesting - Identify loss harvesting opportunities with wash sale warnings
- Dividend Reinvestment - Compare reinvest vs cash with historical benchmark options

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
- ✅ Tax loss harvesting suggestions (March 2026)
- ✅ Dividend reinvestment calculator (March 2026)

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
1. ~~Add detailed trust distribution calculations~~ ✅ DONE
2. ~~Enhance next financial steps recommendations~~ ✅ DONE
3. ~~Fix Recharts console warnings~~ ✅ DONE
4. ~~Tax Planning Calendar~~ ✅ DONE
5. ~~Mobile Version~~ ✅ DONE
6. ~~Sidebar tab grouping~~ ✅ DONE
7. ~~CGT multi-year records~~ ✅ DONE
8. ~~Report risk colors with clickable links~~ ✅ DONE
9. ~~Shared family data model with Save button~~ ✅ DONE
10. ~~Family Overview with 12-month cashflow~~ ✅ DONE
11. ~~Share Portfolio page~~ ✅ DONE (December 2025)
12. Advisor Connect - Book time with a financial advisor
13. Export to accounting software (CSV/PDF for Xero/MYOB)
14. Superannuation guarantee calculator
15. Data Sync for Tax Analysis - Ensure consistent individual data across modules

## Completed This Session (March 2026)
- ✅ Integrated Salary Packaging Calculator (/salary-packaging)
- ✅ Integrated Property Comparison Tool (/property-comparison)
- ✅ Integrated Scenario Comparison View (/scenario-comparison)
- ✅ Added Tax Loss Harvesting (/tax-loss-harvesting) - with demo portfolio & manual entry
- ✅ Added Dividend Reinvestment Calculator (/dividend-reinvestment) - with historical 5yr/10yr benchmarks
- ✅ Fixed page title state bug in navigation
- ✅ Rebranded to "Wheeler Family Portfolio"
- ✅ Moved navigation to left sidebar (collapsible)
- ✅ Added Household Budget page (/budget) with:
  - Income sources integrated from portfolio
  - Regular monthly expenses with categories
  - One-off costs by month (holidays, car repairs, etc.)
  - 12-month cashflow projection charts
  - Cumulative savings projection
- ✅ Fixed Report data output issues:
  - Tax Analysis now shows bracket breakdown table
  - Investment Projections now shows percentile projections by year table
- ✅ Multi-person support (up to 2 people for couples/families)
  - Each person has: name, age, income, super %, salary sacrifice, deductions
- ✅ Multi-company support (unlimited companies)
  - Each company has: name, ABN, base rate entity toggle, revenue, expenses, taxable income, franking account
- ✅ Fixed Saved Scenarios loading demo data correctly
- ✅ Property ownership can be assigned to person1, person2, joint, or any company
- ✅ **Trust Structures** added as entity type:
  - Discretionary, Unit, and Hybrid trust types
  - Individual or Corporate trustee options
  - Beneficiary management with distribution percentages
  - Trust income distribution tracking
- ✅ **Income Splitting Strategies** page (/income-splitting):
  - Family member tax comparison (current vs optimized)
  - Distribution sliders for allocating trust/dividend income
  - Tax savings calculator
  - Strategy guides: Trust distributions, Dividend streaming, Bucket companies
- ✅ **Division 7A Loan Calculator** (/division-7a):
  - Compliant loan repayment calculator
  - Benchmark interest rate (8.77% for 2024-25)
  - Secured (25yr) vs Unsecured (7yr) terms
  - Deemed dividend and tax impact calculation
  - Full amortization schedule
- ✅ **Budget: Weekly/Fortnightly Frequencies**:
  - Support for weekly, fortnightly, monthly, quarterly, annual
  - Auto-conversion to monthly totals
  - Employment income now weekly-based for accuracy
- ✅ **Report Financial Recommendations**:
  - Recommended Next Steps based on analysis
  - Debt/Equity ratio assessment
  - Risk-adjusted return analysis
  - Tax optimization suggestions
  - Super contribution recommendations
  - Priority levels: High/Medium/Low with color coding

## Completed This Session (December 2025)
- ✅ **Trust Distribution Analysis** page (/trust-distributions):
  - Detailed tax impact per beneficiary
  - Interactive sliders to adjust distribution percentages
  - Real-time tax calculations with bracket breakdowns
  - Tax comparison chart (with vs without income splitting)
  - Effective rates comparison by beneficiary
  - Dynamic recommendations based on distribution strategy
  - Add/remove beneficiaries functionality
  - Distribution pie chart visualization
- ✅ **Financial Recommendations** page (/recommendations):
  - Dynamic recommendations based on portfolio metrics
  - Portfolio Health Score radar chart (6 dimensions)
  - Debt/Asset ratio, Sharpe ratio, diversification, tax efficiency analysis
  - Priority distribution (High/Medium/Low) visualization
  - Tabbed interface: Overview, Recommendations, Metrics
  - Detailed metrics cards for debt, risk, assets, and tax efficiency
  - Monte Carlo integration for projected outcomes
- ✅ **Fixed Recharts Console Warnings**:
  - Created ChartContainer component with ResizeObserver
  - Prevents charts from rendering with negative dimensions
  - Uses requestAnimationFrame for proper timing
  - Applied to Dashboard, IncomeSplitting, and new pages
- ✅ **Navigation Updates**:
  - Added Recommendations and Trust Analysis to sidebar
  - Updated nav icons (Lightbulb for Recommendations, PieChart for Trust Analysis)
- ✅ **Tax Planning Calendar** page (/tax-calendar):
  - Pre-populated Australian tax dates: BAS, Super Guarantee, PAYG, FBT, Tax Returns
  - Monthly calendar view with navigation
  - Upcoming events view (Next 7 days, Next 30 days)
  - All events view with category filters
  - Add custom events modal (stored in localStorage)
  - Overdue items highlighting
  - 25+ Australian tax deadline entries
- ✅ **Mobile Version Enhancements**:
  - Bottom navigation bar with 5 quick access icons (Home, Advice, Calendar, Budget, Reports)
  - Slide-out hamburger menu with swipe gesture support
  - Touch-optimized CSS (44px min touch targets, safe area insets)
  - Responsive grid layouts for mobile viewports
  - iOS zoom prevention on inputs
  - Reduced motion support for accessibility
- ✅ **Sidebar Tab Grouping** (December 2025):
  - Reorganized navigation into 6 collapsible groups
  - Overview: Dashboard, Recommendations
  - Planning: Budget, Income Splitting, Trust Analysis, Scenario Comparison
  - Property: Properties, Property Comparison
  - Tax & CGT: Tax Analysis, CGT, Tax Calendar, Tax History, Tax Harvesting
  - Calculators: Loan, Monte Carlo, Division 7A, Salary Packaging, Dividends, SMSF
  - Reports: Reports, Saved Scenarios
- ✅ **Combined CGT Page** (/cgt):
  - Merged CGT Calculator and CGT Events into single page
  - 4 tabs: Events, Holdings, Summary, Calculator
  - Multi-year support with FY dropdown (2022-23 to 2025-26)
  - Multi-year summary chart showing gains/losses per year
  - Loss carry forward tracking
  - Event deletion with trash icons
- ✅ **Report Generator Risk Colors**:
  - Recommendations now color-coded: Red (High Risk), Amber (Medium Risk), Green (Low Risk)
  - Clickable recommendations navigate to relevant pages
  - View Details links for each recommendation
- ✅ **Shared Family Data Model** (December 2025):
  - Unified PortfolioContext with familyMembers, trust, budget data
  - Changes sync automatically across Trust Distribution, Income Splitting, Budget
  - Global Save button in sidebar (appears when hasUnsavedChanges=true)
  - Data persists to localStorage on Save
  - Reset to Defaults button available
- ✅ **Family Overview Page** (/overview):
  - Holistic view of Wheeler Family finances
  - 12-Month Cashflow Projection chart (income bars, expense bars, cumulative savings line)
  - Family members summary with tax calculations
  - Trust distribution summary
  - Monthly budget summary with top expenses
  - Quick links to related pages
- ✅ **Two-Person Tax Support**:
  - Primary earner and spouse linked from Income Splitting
  - Income data syncs with Household Budget
  - Tax calculations update across all pages

