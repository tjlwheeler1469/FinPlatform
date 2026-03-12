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
- ✅ Real-time stock data integration (Mock - ready for Alpha Vantage)
- ✅ Lifecycle Planning (Retirement, Estate, Goals)
- ✅ AI Financial Advisor Chatbot (Demo - ready for LLM)

### P1 - High Priority (All Done ✅)
- ✅ Salary packaging calculator
- ✅ Investment property comparison tool
- ✅ Multi-scenario comparison view
- ✅ Tax loss harvesting suggestions
- ✅ Dividend reinvestment calculator
- ✅ Superannuation guarantee calculator
- ✅ Rental yield optimizer
- ✅ Export to accounting software
- ✅ Risk Profiler (ASIC/FSC aligned)
- ✅ BAS Calculator
- ✅ Multi-user Collaboration (Demo mode)
- ✅ Statement of Advice Generator (RG 175 compliant)

### P2 - Medium Priority (Future)
- Tax Deadline Notifications (Twilio/SendGrid) - Backend endpoints ready
- Full AI-powered chatbot (requires LLM API key)
- Real-time stock prices (requires Alpha Vantage API key)

### P3 - Nice to Have
- Tax planning calendar with due dates ✅ DONE
- Bank Feeds integration (Plaid) ✅ DONE (Sandbox mode)
- Xero/MYOB Direct API ✅ DONE (Sandbox mode)
- Mobile app version ✅ DONE (responsive)
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
20. ~~Real-time Stock Data Integration~~ ✅ DONE (December 2025) - Mock data (Alpha Vantage ready)
21. ~~Lifecycle Planning~~ ✅ DONE (December 2025) - Retirement, Estate, Goals
22. ~~AI Financial Advisor Chatbot~~ ✅ DONE (December 2025) - Demo mode (LLM ready)
23. ~~Sidebar Scroll Fix~~ ✅ DONE (December 2025) - Using requestAnimationFrame with retries
24. ~~Bank Feeds (Plaid)~~ ✅ DONE (December 2025) - Sandbox mode with 8 AU banks
25. ~~Xero/MYOB Direct API~~ ✅ DONE (December 2025) - OAuth sandbox with mock data
26. ~~Risk Profiler~~ ✅ DONE (December 2025) - 8-question ASIC/FSC aligned questionnaire
27. ~~BAS Calculator~~ ✅ DONE (December 2025) - GST/PAYG worksheet with Xero/MYOB import
28. ~~Collaboration~~ ✅ DONE (December 2025) - Multi-user team management (demo mode)
29. ~~Statement of Advice (SOA)~~ ✅ DONE (December 2025) - RG 175 compliant generator
30. ~~Client Onboarding Wizard~~ ✅ DONE (December 2025) - 6-step guided onboarding with risk assessment and goals
31. ~~AI Financial Copilot~~ ✅ DONE (December 2025) - Natural language command execution (demo mode)
32. ~~Daily Briefing~~ ✅ DONE (December 2025) - Personalized daily summary with AI recommendations
33. ~~Adviser Dashboard~~ ✅ DONE (December 2025) - Multi-client management with KPIs and compliance tracking
34. ~~Client Portal~~ ✅ DONE (December 2025) - Simplified client view with goals and documents
35. ~~Dual-Mode Navigation~~ ✅ DONE (December 2025) - Personal/Adviser/Client mode switching with distinct navigation
36. ~~Client Portal Authentication~~ ✅ DONE (March 2026) - JWT-based login/register with demo mode
37. ~~Practice Management~~ ✅ DONE (March 2026) - Tasks, Meetings, Time Tracking, Billing, Compliance
38. ~~Remember Mode Choice~~ ✅ DONE (March 2026) - Auto-redirect to preferred mode on app load
39. ~~Live Price Updates~~ ✅ DONE (March 2026) - 30-second auto-refresh with simulated fluctuations
40. ~~Notifications Panel~~ ✅ DONE (March 2026) - Mock notifications with preferences
41. ~~Calendar Integration~~ ✅ DONE (March 2026) - Google/Outlook/Apple export with OAuth setup
42. ~~Mobile Responsive~~ ✅ DONE (March 2026) - Client Portal and Practice Management optimized
43. ~~Sidebar Scroll Fix~~ ✅ DONE (March 2026) - Improved scroll position persistence
44. ~~PDF Report Generation~~ ✅ DONE (March 2026) - Portfolio Summary, SOA, Tax Summary with jsPDF
45. ~~Document Manager~~ ✅ DONE (March 2026) - Document center with search, filter, star, archive
46. ~~Client Messaging~~ ✅ DONE (March 2026) - Email-style inbox with compose, reply, folders
47. ~~Lazy Loading~~ ✅ DONE (March 2026) - React.lazy for 40+ pages, reduced bundle size
48. ~~Phase 1: Workflow Automation~~ ✅ DONE (March 2026) - 4 workflow templates with client management
49. ~~Phase 1: Portfolio Rebalancing~~ ✅ DONE (March 2026) - 5 risk profiles, drift analysis, trade suggestions
50. ~~Phase 1: Compliance Audit Tools~~ ✅ DONE (March 2026) - Activity logging, KYC/AML checklists, AFSL compliance

## Latest Session Updates (March 2026 - Current)

### Phase 1: Adviser Portal Core Enhancements (March 2026 - LATEST)

- ✅ **Portfolio Rebalancing** (/portfolio-rebalancing)
  - 4 tabs: Analysis, Target Allocation, Rebalancing Trades, Settings
  - 5 Risk Profiles: Conservative, Moderately Conservative, Balanced, Growth, High Growth
  - Custom target allocation sliders with 100% normalization
  - Current vs Target allocation comparison (bar chart)
  - Allocation Radar chart visualization
  - Drift Analysis with asset class breakdown and action recommendations
  - Rebalancing Trades with CGT impact estimates
  - Tax-aware rebalancing toggle
  - Include Superannuation toggle
  - Rebalancing Threshold slider (1-15%)
  - Export Plan button (JSON export)
  - Alert banner shows when rebalancing is recommended

- ✅ **Workflow Automation** (Practice Management - Automation tab)
  - Start Workflow dialog with template and client selection
  - 4 Workflow Templates:
    - New Client Onboarding (7 steps, 14 days)
    - Annual Review Sequence (5 steps, 30 days)
    - Compliance Check (4 steps, 7 days)
    - Meeting Follow-up (4 steps, 14 days)
  - Active Workflows dashboard with progress tracking
  - Pause/Resume/Cancel workflow controls
  - Complete step button advances workflow
  - Auto-creates tasks and reminders based on workflow steps
  - 5 Automation Rules:
    - Auto-assign new client onboarding
    - Meeting reminders (configurable days before)
    - Overdue task alerts (configurable days)
    - Auto follow-up (configurable days of inactivity)
    - Compliance check interval (30/60/90/180/365 days)
  - Workflows and rules persisted to localStorage

- ✅ **Compliance Audit Tools** (Practice Management - Audit tab)
  - 3 sub-tabs: Audit Log, KYC/AML Checklist, Compliance Status
  - **Audit Log**:
    - Activity timeline with timestamps and user attribution
    - 5 activity categories: Document, Meeting, Compliance, Transaction, Communication
    - Search and category filter
    - Log Activity dialog to add new entries
    - Export audit log (JSON)
  - **KYC/AML Checklist**:
    - Client selector dropdown
    - 14 verification items across 5 categories:
      - Identity (ID verified, Address verified)
      - AML (PEP check, Sanctions check, Source of funds, Beneficial ownership)
      - Risk (Risk assessment, Risk profile questionnaire)
      - Compliance (SOA issued, SOA acknowledged, FDS issued, Consent obtained)
      - Entity (Trust deed, Company extract)
    - Mandatory item badges
    - Completion percentage with progress bar
    - Checkbox toggles with timestamp tracking
  - **Compliance Status**:
    - All clients overview with KYC completion and risk levels
    - AFSL Compliance Summary: Fully Compliant, In Progress, Needs Attention, Audit Entries
  - All data persisted to localStorage

- ✅ **Navigation Updates**
  - Portfolio Rebalancing added to Shares section in sidebar
  - ArrowLeftRight icon for Rebalancing nav item
  - Practice Management tabs expanded to 8: Dashboard, Tasks, Meetings, Time, Billing, Automation, Audit, Compliance

- ✅ **PDF Report Generation** (jsPDF with autoTable)
  - Portfolio Summary - Single page with financial overview, asset allocation, top holdings
  - Statement of Advice - Multi-page with cover, situation, goals, recommendations, fees
  - Tax Summary - Income, deductions, CGT events, tax payable summary
  - Professional Wheeler Financial branding with green header and gold accents
  - Auto-download on generation with toast notification

- ✅ **Document Manager** (/documents)
  - Document list with search and filter by type
  - Generate Report dialog with 3 report types
  - Star, Archive, Delete document actions
  - Download regenerates PDF with current portfolio data
  - Documents persisted to localStorage

- ✅ **Client Messaging** (Email-style inbox)
  - Compose new message dialog
  - Folder navigation: Inbox, Starred, Sent, Archive
  - Unread count badges
  - Full message view with Reply/Star/Archive/Delete
  - Attachment indicators
  - Messages persisted to localStorage

- ✅ **Performance Optimizations**
  - React.lazy for 40+ pages (lazy loading)
  - Suspense with loading spinner fallback
  - Core pages (Dashboard, ModeSelector) loaded immediately
  - Reduced initial bundle size

- ✅ **Live Price Updates** (Share Portfolio)
  - "Start Live" button activates 30-second auto-updates
  - Realistic price fluctuations (2% max change with slight upward bias)
  - Live status indicator shows timestamp
  - Green button with "Live • Xs ago" when active
  - Toast notification on activation

- ✅ **Notifications Panel**
  - Bell icon with unread count badge in sidebar
  - Slide-out panel with notification list
  - 4 tabs: All, Unread, Tasks, Meetings
  - 5 notification types: Task, Meeting, Market, Compliance, Invoice
  - Settings section with 6 toggles for notification preferences
  - Mark all read and Clear all functionality
  - Mock notifications stored in localStorage

- ✅ **Calendar Integration** (Practice Management - Meetings)
  - "Add to Calendar" dropdown on each meeting card
  - Export options: Google Calendar, Outlook.com, Office 365, Apple Calendar (.ics)
  - "Export All" button to download all meetings as .ics
  - Calendar Integrations settings card with OAuth setup
  - Connect buttons for Google and Outlook (requires API keys)
  - Apple Calendar uses .ics export (no OAuth needed)
  - Generates valid .ics files compatible with all calendar apps

- ✅ **Mobile Responsive Design**
  - Client Portal: Compact header, responsive grid, mobile-friendly navigation
  - Practice Management: Compact header, 6 tabs accessible, stacked KPI cards
  - All interactive elements accessible on mobile viewports

- ✅ **Sidebar Scroll Fix**
  - Improved scroll position persistence using interval-based retry mechanism
  - Fixed race condition with multiple attempts (10 retries, 50ms interval)

- ✅ **Client Portal with JWT Authentication** (/client-portal)
  - Email/password login form with registration option
  - "Try Demo Account" button for testing
  - JWT token-based authentication via backend API
  - Read-only dashboard with 4 tabs: Summary, Reports, Goals, Adviser
  - Logout functionality that clears session
  - Adviser code field for linking to adviser on registration
  - Backend endpoints: /api/client/register, /api/client/login, /api/client/me, /api/client/logout

- ✅ **Practice Management Module** (/practice-management)
  - **Dashboard**: KPIs (Urgent Tasks, Hours This Month, Billable Value, Outstanding), Weekly Hours chart, Time Breakdown pie chart
  - **Tasks**: Task list with priority badges, status tracking, New Task dialog
  - **Meetings**: Meeting scheduler with client selection, duration, location
  - **Time Tracking**: Timer functionality, time entry logging, billable/non-billable hours
  - **Billing**: Invoice management with status tracking (Draft, Sent, Paid, Overdue)
  - **Compliance**: AFSL compliance audit trail, compliance records by client
  - Backend endpoints: /api/practice/tasks, /api/practice/meetings, /api/practice/time-entries, /api/practice/invoices, /api/practice/compliance

- ✅ **Mode Selector "Remember my choice" Enhancement**
  - Checkbox to remember mode preference in localStorage
  - Auto-redirect to remembered mode on app load
  - Clear preference when checkbox is unchecked

- ✅ **File Cleanup**
  - Merged ClientPortal.jsx and ClientPortalSimple.jsx into ClientPortalMerged.jsx
  - Deleted redundant client portal files

### Dual-Mode Architecture (December 2025)

- ✅ **Mode-Based Navigation System**
  - Mode selector dropdown in sidebar (desktop) and mobile slide-out menu
  - Three modes: Personal Mode, Adviser Mode, Client View
  - Personal Mode: 7 navigation groups (Overview, Planning, Property, Shares, Tax & CGT, Calculators, Data & Reports)
  - Adviser Mode: 7 navigation groups (Adviser Hub with Practice Management, Client Tools, Analysis, Portfolios, Calculators, Reports)
  - Client View: Redirects to standalone /client-portal page
  - localStorage persistence with 'app_mode' key
  - Mode Selector landing page at /mode-selector

- ✅ **Mode Selector Page** (/mode-selector)
  - Landing page for initial mode selection
  - Personal Use card with feature highlights
  - Adviser Portal card with "Pro" badge
  - Client Portal access link at bottom
  - "Remember my choice" checkbox
  - Branded with Wheeler Financial theme

### New Features Implemented (December 2025)

- ✅ **Risk Profiler** (/risk-profiler)
  - 8-question ASIC/FSC aligned questionnaire
  - Risk categories: Investment Timeframe, Knowledge, Risk Tolerance, Return vs Security, Income Needs, Financial Stability, Portfolio Scenario, Loss Acceptance
  - 5 Risk Profiles: Conservative, Moderately Conservative, Balanced, Growth, High Growth
  - Score calculation (8-40 range), Risk Level (1-5)
  - Asset allocation pie chart
  - Risk profile radar chart analysis
  - Export and Save Profile functionality
  - localStorage persistence

- ✅ **BAS Calculator** (/bas-calculator)
  - GST Worksheet (G1-G20 fields matching ATO BAS form)
  - PAYG Withholding (W1-W5 fields)
  - PAYG Instalments (T7-T11 fields)
  - Summary tab with lodgement-ready output
  - Data import from Xero/MYOB (mock)
  - Period selection (quarterly)
  - Due date alerts with OVERDUE badge
  - Export, Calculate, Print buttons
  - Direct link to ATO Business Portal

- ✅ **Collaboration** (/collaboration) - DEMO MODE
  - Multi-user team management
  - 5 Role types: Administrator, Financial Adviser, Accountant, Client, View Only
  - Role permissions matrix (11 permissions)
  - Activity log tracking
  - Notes/comments system with resolved status
  - Invite member functionality
  - Online status indicators
  - localStorage persistence

- ✅ **Statement of Advice Generator** (/statement-of-advice)
  - RG 175 (ASIC Regulatory Guide 175) compliant
  - 8 SOA sections: Client Details, Goals & Objectives, Risk Profile, Current Situation, Recommendations, Projections, Fees & Disclosure, Authority to Proceed
  - Document completion progress tracking
  - Pre-filled with portfolio data
  - Multiple goals and recommendations support
  - Generates downloadable SOA text file
  - Saved SOAs tab with export functionality
  - localStorage persistence
  - **Acknowledgment checkbox visible on first page** (no scrolling required)
  - Generate button requires checkbox to be checked

- ✅ **Client Onboarding Wizard** (/onboarding)
  - 6-step guided wizard: Welcome → Profile → Risk Assessment → Goals → Review → Complete
  - 4-question condensed risk assessment with profile calculation
  - Risk profiles: Conservative, Balanced, Growth, Aggressive
  - Goal management (short-term and long-term)
  - Financial snapshot with net worth calculation
  - Quick SOA download on completion
  - localStorage persistence
  - Navigation to Copilot or Dashboard on completion

- ✅ **AI Financial Copilot** (/copilot) - DEMO MODE
  - Natural language command processing
  - 15 intent categories: tax, scenario, cashflow, risk, stocks, property, super, bas, cgt, loan, soa, navigate, report, calculate, help
  - Quick Actions panel with 6 preset commands
  - Results panel showing charts and calculations
  - Action buttons for navigation to detailed pages
  - Commands: "Calculate my tax", "What if I sell all stocks?", "Show cashflow", etc.
  - Tax calculations with effective rate and medicare
  - Stock sell scenario with CGT (50% discount) calculation
  - 12-month cashflow projection chart
  - Chat interface with message history
  - **15 Global Languages**: English, Chinese, Spanish, Hindi, Arabic, Portuguese, Bengali, Russian, Japanese, German, French, Korean, Vietnamese, Italian, Turkish
  - **Smart Alerts**: Context-aware notifications for BAS due dates, tax deadlines, risk profile completion, high debt ratio, super contribution deadlines
  - **Knowledge Base**: 20+ Australian financial concepts explained (franking credits, negative gearing, CGT, ETFs, super contributions, etc.)
  - **How-To Guides**: Step-by-step guidance for tax reduction, investing, retirement planning

- ✅ **Daily Briefing** (/daily-briefing)
  - Personalized greeting based on time of day
  - 4 KPI cards: Net Worth, Shares, Property, Monthly Cashflow with change indicators
  - Portfolio Performance (6 Months) area chart
  - AI-Powered Recommendations with priority badges and action buttons
  - Upcoming Deadlines (BAS, Tax Return, Super Contribution)
  - Market Summary: ASX 200, AUD/USD, RBA Cash Rate
  - Quick Actions: Ask AI Copilot, View Tax Analysis, Generate Report
  - Refresh and dismiss functionality

- ✅ **Adviser Dashboard** (/adviser-dashboard) - DEMO MODE
  - Multi-client management with 5 mock clients
  - 5 KPI cards: Total AUM, Total Clients, Urgent Tasks, Reviews Due, Avg Compliance
  - 4 Tabs: Overview, Clients, Tasks, Compliance
  - Overview: AUM by client bar chart, Client Distribution pie chart
  - Clients: Searchable/filterable table with bulk selection
  - Client types: Family, Trust, SMSF, Company
  - Tasks: All client tasks sorted by priority (urgent, high, medium)
  - Compliance: Status cards and compliance by client list
  - AFSL Compliant badge

- ✅ **Client Portal** (/client-portal) - DEMO MODE
  - Simplified interface (no sidebar navigation)
  - Custom header with "Secure" badge and "Exit Portal" button
  - Greeting banner with Net Worth summary
  - Action items alert
  - 4 Tabs: Overview, Goals, Documents, My Adviser
  - Goals: Progress tracking for Retirement Fund, Children's Education, Pay Off Mortgage
  - Documents: Statement of Advice, Annual Review Report, Tax Planning Summary
  - Adviser: Contact info, Recent Messages, Send Message functionality

- ✅ **Navigation Updates**
  - New "Adviser Tools" section with Collaboration and SOA Generator
  - New "Get Started" section with Client Onboarding and AI Advisor
  - AI Copilot added to Overview section with "New" badge
  - Risk Profiler added to Planning section
  - BAS Calculator added to Tax & CGT section

- ✅ **Code Cleanup**
  - Deleted redundant files: LifecyclePlanning.jsx, AdvancedScenarioModeling.jsx, ScenarioComparison.jsx (consolidated into StrategicPlanning.jsx)
  - Enhanced sidebar scroll preservation with multiple retry mechanism

### Previous Features (This Session)

- ✅ **Bank Feeds via Plaid** (/bank-feeds)
  - Sandbox mode with 8 Australian banks:
    - CommBank, Westpac, NAB, ANZ
    - Macquarie Bank, ING Australia
    - Bendigo Bank, Bankwest
  - Mock account connections with balance display
  - Accounts and Transactions tabs
  - Import Balances to Budget functionality
  - Ready for production Plaid API keys

- ✅ **Xero/MYOB Direct API Integration** (/accounting-integrations)
  - OAuth 2.0 sandbox simulation
  - Xero: Mock Wheeler Family Trust data with accounts
  - MYOB: Mock Wheeler Property Holdings data
  - Synced Data Preview with accounts table
  - Production Setup instructions included
  - Sync and Import functionality

- ✅ **Tax Calendar API Integration**
  - Fetches from /api/notifications/tax-deadlines
  - Auto-populated ATO deadlines:
    - BAS Q1-Q4 (Quarterly)
    - Super Guarantee Q1-Q4
    - PAYG Installment Q1-Q4
    - Individual/Company Tax Return
    - FBT Return and Installments
  - Category filters for all deadline types
  - ComplianceFooter added

- ✅ **Sidebar Scroll Position Fix**
  - Uses useRef and requestAnimationFrame
  - Preserves scroll position on navigation
  - Main content scrolls to top on route change

- ✅ **Navigation Updates**
  - New "Data & Integrations" section:
    - Bank Feeds (Plaid)
    - Xero / MYOB
    - Import Data
    - Export Data
    - Reports
    - Saved Scenarios
    - Methodology

### Previous Features (This Session)

- ✅ **AU Regulatory Compliance (ASIC/ATO/Corporations Act)**
  - ComplianceModal shows on first visit with:
    - ASIC Regulatory Guide 234 reference
    - Corporations Act 2001 s911A reference
    - ATO Tax Practitioner Guidelines reference
    - Australian Consumer Law disclaimer
  - ComplianceFooter on all calculator pages
  - "General Information Only" disclaimers throughout
  - Links to ASIC MoneySmart, ATO resources
  - Acknowledgement persists in localStorage

- ✅ **Strategic Planning** (/strategic-planning) - Combined Page
  - Merged Lifecycle Planning, Scenario Modeling, and Scenario Comparison
  - 4 main tabs: Lifecycle | Scenarios | Compare | What-If
  - Lifecycle sub-tabs: Retirement, Estate, Goals
  - Scenario builder with market assumptions
  - Multi-scenario comparison charts
  - Key insights and rankings

- ✅ **Data Import** (/data-import)
  - File-based import wizard (4 steps)
  - Supports: CSV, Excel (.xlsx, .xls), Xero Export, MYOB Export
  - Data types: Family Members, Properties, Share Holdings, Transactions
  - Step-by-step Xero/MYOB export instructions included
  - Download template functionality
  - Field mapping and preview before import

- ✅ **Financial Recommendations Clickable Actions**
  - All recommendation actions now navigate to relevant pages
  - "Rebalance portfolio" → Strategic Planning
  - "Tax optimization" → Tax Analysis
  - "Debt reduction" → Loan Calculator
  - Uses React Router navigate() for proper SPA navigation

- ✅ **Navigation Updates**
  - Planning section: Strategic Planning replaces separate Lifecycle/Scenario pages
  - Data & Reports section: Added Import Data link
  - Old routes redirect: /lifecycle-planning, /scenario-modeling → /strategic-planning

- ✅ **Real-time Stock Price Refresh** (`/share-portfolio`)
  - "Refresh Prices" button fetches mock ASX stock prices
  - Demo Mode badge and "Simulated prices" indicator
  - Ready for Alpha Vantage API integration (add ALPHA_VANTAGE_KEY to .env)
  - Supports CBA, BHP, CSL, WBC, NAB, ANZ, WOW, TLS, VAS, and more
  - Prices vary ±3% to simulate market movement

- ✅ **Mock Property Valuations** (/api/property/get-valuations)
  - Backend endpoint for suburb median-based valuations
  - Sydney, Melbourne, Brisbane suburb data
  - Property type and bedroom adjustments
  - Annual growth estimates

- ✅ **Lifecycle Planning** (/lifecycle-planning)
  - **Retirement Tab**: 
    - Year-by-year projection chart from current age to life expectancy
    - Super at retirement calculation with salary sacrifice
    - Sustainable income (4% rule) and income gap analysis
    - Age pension eligibility and estimate
    - Recommendations for maximizing super contributions
  - **Estate Tab**:
    - Estate value summary (assets + super)
    - Beneficiary analysis with tax implications
    - Super death benefits tax calculation for non-dependants
    - Estate planning checklist (Will, Power of Attorney, Testamentary Trust)
    - Critical recommendations for missing documents
  - **Goals Tab**:
    - Multiple financial goals with target amounts and dates
    - Progress tracking with visual bars
    - Required vs available monthly savings analysis
    - Risk tolerance settings (conservative/moderate/aggressive)
    - Goal prioritization and recommendations

- ✅ **AI Financial Advisor Chatbot** (/financial-advisor)
  - Demo Mode with pre-defined responses
  - Topics: Tax, Super, Property, Dividends, Investing, Retirement, Debt
  - Suggestion buttons for common questions
  - Quick Topics sidebar for easy navigation
  - Ready for LLM integration (add OPENAI_API_KEY, ANTHROPIC_API_KEY, or EMERGENT_LLM_KEY)
  - Conversation ID for session tracking
  - Disclaimer about general vs personal advice

- ✅ **Navigation Updates**
  - AI Advisor link added to Overview section
  - Lifecycle Planning link added to Planning section
  - Bot icon for AI Advisor, HeartPulse icon for Lifecycle Planning

- ✅ **Cleanup**
  - Deleted redundant /app/frontend/src/pages/TaxAnalysis.jsx (replaced by TaxAnalysisSync.jsx)
  - Fixed /tax-analysis route to use TaxAnalysisSync component

## Previous Session Updates (December 2025)
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
