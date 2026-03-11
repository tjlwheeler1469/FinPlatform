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
12. ~~Export to accounting software (CSV/PDF for Xero/MYOB)~~ ✅ DONE (December 2025)
13. ~~Superannuation guarantee calculator~~ ✅ DONE (December 2025)
14. ~~Calculation Methodology with ATO references~~ ✅ DONE (December 2025)
15. ~~Rental Yield Optimizer~~ ✅ DONE (December 2025)
16. ~~Holdings Performance with benchmarks~~ ✅ DONE (December 2025)
17. ~~ATO tooltips on Tax Analysis~~ ✅ DONE (December 2025)
18. ~~Data Sync for Tax Analysis~~ ✅ DONE (December 2025) - Global data sync with add/delete
19. ~~Advanced Scenario Modeling~~ ✅ DONE (December 2025) - What-if analysis with projections

## Latest Session Updates (December 2025)
- ✅ **Tax Analysis Sync** (/tax-analysis-sync) - Global data sync for consistent individuals
  - Family members synced across all modules (Income Splitting, Trust Distribution, Family Overview, Budget)
  - Add/Delete family members with sync toast notifications
  - 2024-25 Stage 3 tax rates (16%, 30%, 37%, 45%)
  - Tax bracket breakdown for each member
  - Company tax calculator with Base Rate Entity toggle (25%/30%)
  - Family vs Company comparison table
  - ATO info tooltips with external links
  
- ✅ **Advanced Scenario Modeling** (/scenario-modeling) - What-if analysis
  - Current position summary (Net Worth, Assets, Debt, Income)
  - Projection Years selector (5/10/15/20/30 years)
  - Create/Duplicate/Delete scenarios
  - Market Assumptions (Income Growth, Property Growth, Share Growth, Interest Rate, Super Return, Inflation)
  - Strategic Adjustments sliders (Salary Change, Super Contribution, Share Investment, Debt Paydown)
  - Property purchase/sell toggles
  - Wealth Projection chart with asset breakdown
  - Compare Mode for multi-scenario comparison
  - Scenario Ranking and Key Insights
  - Year-by-Year Projection table

- ✅ **Income Splitting ↔ Trust Analysis Sync** - Family members now match between pages
  - Income Splitting shows "Trust Beneficiary" checkbox column
  - Toggling checkbox adds/removes member from Trust Distribution Analysis
  - Add Member creates beneficiary in both pages
  - Delete Member removes from both pages
  - Sync notice explains the Trust Distribution connection
  - Distribution percentages consistent between pages

- ✅ **Family Member Profile** (/family-member/:memberId) - Consolidated view for each person
  - Header with avatar, name, relationship badge, Trust Beneficiary badge, age
  - Summary cards: Taxable Income, Tax Payable, Net Income, Super Balance, Total Wealth
  - Income tab: All income sources (Salary, Dividend, Rental, Trust Distribution), deductions, pie chart
  - Tax tab: Tax calculation (Income Tax, Medicare Levy), effective/marginal rates, optimization tips
  - Investments tab: Personal share holdings, wealth composition pie chart
  - Super tab: Current balance, annual SG (11.5%), 10-year projection chart, optimization strategies
  - Edit Profile button for updating income and super data
  - Related Pages links (Tax Analysis, Income Splitting, Trust Distribution, Share Portfolio)
  - Accessible via eye button from Tax Analysis Sync page

- ✅ **Family Wealth Dashboard** (/family-wealth) - Combined wealth, tax savings & inter-generational planning
  - Summary cards: Total Net Worth ($3.27M), Total Assets, Total Debt, Annual Tax Savings ($53K), Total Super
  - **Combined Wealth tab**:
    - Wealth Composition pie chart (Property Equity, Shares, Super, Cash, Trust Assets, Company)
    - Wealth by Family Member bar chart (Super + Shares breakdown)
    - Wealth Projection chart (configurable 10/20/30 years, 6% growth)
    - Clickable member list linking to individual profiles
  - **Tax Savings tab**:
    - Total Annual Tax Savings ($53,505 for Wheeler Family)
    - Breakdown bar chart by strategy
    - Active strategies: Income Splitting, Trust Distributions, Super Contributions, Franking Credits, Negative Gearing
  - **Wealth Transfer tab**:
    - Estate summary: Current Value, Projected Value at Transfer Age, Years to Transfer, Per Beneficiary
    - Estate Transfer Age slider (70-100)
    - Annual Gifting slider ($0-$100K)
    - Wealth transfer strategies with priority badges (High/Medium)
    - Next Generation Beneficiaries cards with estimated inheritance
    - Tax considerations (Super death tax, Property CGT)
  - Related Pages links

## Previous Session (December 2025)
- ✅ **Share Portfolio** (/share-portfolio) - Personal, joint, company ownership with dividends
- ✅ **Calculation Methodology** (/calculation-methodology) - ATO/ASIC references for all calculations
  - Income Tax 2024-25 (Stage 3 tax cuts)
  - CGT discounts and calculation formulas
  - Franking credits (imputation)
  - Superannuation caps and Division 293
  - Property depreciation and negative gearing
  - Company tax rates and Division 7A
- ✅ **Superannuation Guarantee Calculator** (/sg-calculator)
  - 11.5% SG rate for 2024-25
  - Add/remove multiple employees
  - Quarterly breakdown with due dates
  - Maximum contribution base ($62,500/quarter)
  - SG Rate projection charts
- ✅ **Rental Yield Optimizer** (/rental-yield-optimizer)
  - Gross/net yield calculations
  - Negative gearing tax benefit
  - Optimization sliders (rent increase, expense reduction, principal paydown)
  - Recommendations engine with priority levels
- ✅ **Holdings Performance** (/holdings-performance)
  - ASX 200 and S&P 500 benchmark comparisons
  - Time range selection (3m, 6m, 1y, 2y)
  - Sector allocation pie chart
  - Best/worst performers
  - Concentration risk metrics
- ✅ **Export Data** (/export)
  - Generic CSV export
  - Xero format (Chart of Accounts import)
  - MYOB format (Account list import)
  - Text report export
  - Section selection (Family, Shares, Budget, Properties, Trust, Company)
- ✅ **ATO Tooltips on Tax Analysis** - Info icons with ATO references and external links
- ✅ **Navigation Updates** - Added Yield Optimizer, Performance, SG Calculator, Export Data, Methodology

## Previous Session (March 2026)
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
- ✅ **Share Portfolio Page** (/share-portfolio) - December 2025:
  - Personal, joint, and company share ownership structures
  - Summary cards: Total Value, Unrealised Gain/Loss, Annual Dividends, Company Franking
  - Ownership tabs (All, Personal, Joint, Company) for filtering
  - CRUD operations: Add Holding modal, Delete share
  - Ownership Distribution pie chart
  - Annual Dividends breakdown by ownership type
  - "Sync to Budget" button updates household budget with dividend income
  - Company Dividend Distribution sliders (To Personal, To Trust, Retained)
  - Distribute Dividends button updates trust income and franking account
  - ATO Compliance notice for franking credits
  - Integrated into navigation under new "Shares" group
- ✅ **Codebase Cleanup** - December 2025:
  - Deleted redundant CGTCalculator.jsx and CGTEventTracker.jsx (merged into CGT.jsx)
  - Added redirects from /cgt-calculator and /cgt-events to /cgt
