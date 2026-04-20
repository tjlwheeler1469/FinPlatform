// Portfolio/family/share/budget seed data — extracted from App.js.
// These are used by PortfolioProvider + recommendations engine.
// See /app/frontend/src/data/clientData.js for the HNW client data source of truth.

// Per-client family member / trust / company datasets (used by Trust, Income Splitting, Tax Analysis, Budget)
export const CLIENT_FAMILY_DATA = {
  client_1: {
    familyMembers: [
      { id: 1, name: "David Thompson", relationship: "primary", age: 50, taxableIncome: 120000, salaryIncome: 120000, dividendIncome: 3500, rentalIncome: 16000, otherIncome: 0, deductions: 5200, superBalance: 245000, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 2, name: "Sarah Thompson", relationship: "spouse", age: 48, taxableIncome: 65000, salaryIncome: 65000, dividendIncome: 2000, rentalIncome: 16000, otherIncome: 0, deductions: 2800, superBalance: 198000, isTrustBeneficiary: false, trustDistribution: 0 },
    ],
    trust: { name: "Thompson Family Trust", type: "discretionary", netIncome: 0, financialYear: "2024-25", companyDividendsReceived: 0 },
    company: { name: "Thompson Investments Pty Ltd", abn: "12 345 678 901", acn: "123 456 789", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 0, retainedEarnings: 0, financialYear: "2024-25" },
  },
  client_2: {
    familyMembers: [
      { id: 1, name: "Michael Chen", relationship: "primary", age: 52, taxableIncome: 185000, salaryIncome: 185000, dividendIncome: 12000, rentalIncome: 35000, otherIncome: 0, deductions: 8500, superBalance: 620000, isTrustBeneficiary: true, trustDistribution: 35 },
      { id: 2, name: "Lisa Chen", relationship: "spouse", age: 48, taxableIncome: 95000, salaryIncome: 95000, dividendIncome: 6000, rentalIncome: 35000, otherIncome: 0, deductions: 4200, superBalance: 480000, isTrustBeneficiary: true, trustDistribution: 35 },
      { id: 3, name: "Daniel Chen", relationship: "adult_child", age: 24, taxableIncome: 52000, salaryIncome: 52000, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 28000, isTrustBeneficiary: true, trustDistribution: 15 },
      { id: 4, name: "Sophie Chen", relationship: "adult_child", age: 20, taxableIncome: 12000, salaryIncome: 12000, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 8000, isTrustBeneficiary: true, trustDistribution: 15 },
    ],
    trust: { name: "Chen Family Trust", type: "discretionary", netIncome: 280000, financialYear: "2024-25", companyDividendsReceived: 15000 },
    company: { name: "Chen Holdings Pty Ltd", abn: "23 456 789 012", acn: "234 567 890", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 62000, retainedEarnings: 320000, financialYear: "2024-25" },
  },
  client_3: {
    familyMembers: [
      { id: 1, name: "Robert Mitchell", relationship: "primary", age: 58, taxableIncome: 145000, salaryIncome: 145000, dividendIncome: 9500, rentalIncome: 0, otherIncome: 0, deductions: 6800, superBalance: 680000, isTrustBeneficiary: false, trustDistribution: 0 },
    ],
    trust: { name: "Mitchell Family Trust", type: "discretionary", netIncome: 0, financialYear: "2024-25", companyDividendsReceived: 0 },
    company: { name: "Mitchell Consulting Pty Ltd", abn: "34 567 890 123", acn: "345 678 901", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 18000, retainedEarnings: 95000, financialYear: "2024-25" },
  },
  client_4: {
    familyMembers: [
      { id: 1, name: "David Williams", relationship: "primary", age: 38, taxableIncome: 110000, salaryIncome: 110000, dividendIncome: 3200, rentalIncome: 0, otherIncome: 0, deductions: 3500, superBalance: 220000, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 2, name: "Emma Williams", relationship: "spouse", age: 36, taxableIncome: 85000, salaryIncome: 85000, dividendIncome: 1800, rentalIncome: 0, otherIncome: 0, deductions: 2200, superBalance: 180000, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 3, name: "Lily Williams", relationship: "child", age: 8, taxableIncome: 0, salaryIncome: 0, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 0, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 4, name: "Jack Williams", relationship: "child", age: 5, taxableIncome: 0, salaryIncome: 0, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 0, isTrustBeneficiary: false, trustDistribution: 0 },
    ],
    trust: { name: "Williams Family Trust", type: "discretionary", netIncome: 0, financialYear: "2024-25", companyDividendsReceived: 0 },
    company: { name: "Williams Property Pty Ltd", abn: "45 678 901 234", acn: "456 789 012", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 0, retainedEarnings: 0, financialYear: "2024-25" },
  },
  client_5: {
    familyMembers: [
      { id: 1, name: "Raj Patel", relationship: "primary", age: 48, taxableIncome: 210000, salaryIncome: 210000, dividendIncome: 18000, rentalIncome: 42000, otherIncome: 5000, deductions: 12000, superBalance: 1200000, isTrustBeneficiary: true, trustDistribution: 40 },
      { id: 2, name: "Priya Patel", relationship: "spouse", age: 45, taxableIncome: 78000, salaryIncome: 78000, dividendIncome: 8000, rentalIncome: 42000, otherIncome: 0, deductions: 5500, superBalance: 680000, isTrustBeneficiary: true, trustDistribution: 35 },
      { id: 3, name: "Aarav Patel", relationship: "adult_child", age: 22, taxableIncome: 45000, salaryIncome: 45000, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 22000, isTrustBeneficiary: true, trustDistribution: 25 },
    ],
    trust: { name: "Patel SMSF Trust", type: "smsf", netIncome: 320000, financialYear: "2024-25", companyDividendsReceived: 25000 },
    company: { name: "Patel Holdings Pty Ltd", abn: "56 789 012 345", acn: "567 890 123", isBaseRateEntity: false, taxRate: 0.30, frankingAccountBalance: 95000, retainedEarnings: 580000, financialYear: "2024-25" },
  },
};

export const DEFAULT_FAMILY_MEMBERS = CLIENT_FAMILY_DATA.client_1.familyMembers;
export const DEFAULT_TRUST = CLIENT_FAMILY_DATA.client_1.trust;
export const DEFAULT_COMPANY = CLIENT_FAMILY_DATA.client_1.company;

// Per-client portfolio data for data flow consistency
export const CLIENT_PORTFOLIO_DATA = {
  client_1: {
    personal: { name: "Thompson Family", age: 50, taxableIncome: 185000, entityType: "personal" },
    investments: { cash_savings: 28000, term_deposit_amount: 35000, term_deposit_rate: 4.8, shares_value: 84500, shares_dividend_yield: 4.2, franking_percentage: 85, bonds_value: 0, bonds_yield: 0, etf_value: 42000, etf_yield: 3.5, smsf_balance: 443000, properties: [
      { property_id: "prop_001", name: "Family Home - Glen Waverley", value: 985000, rental_income: 0, mortgage_amount: 285000, mortgage_rate: 6.19, mortgage_term_years: 25, annual_expenses: 8500, depreciation_building: 0, depreciation_fixtures: 0 },
      { property_id: "prop_002", name: "Investment Unit - Brunswick", value: 620000, rental_income: 32000, mortgage_amount: 380000, mortgage_rate: 6.49, mortgage_term_years: 28, annual_expenses: 7200, depreciation_building: 5800, depreciation_fixtures: 2800 },
    ] },
    summary: { totalAssets: 2278000, totalDebt: 669200, netWorth: 1608800, annualIncome: 185000, totalTax: 42000, netIncome: 143000 },
  },
  client_2: {
    personal: { name: "Chen Family Trust", age: 52, taxableIncome: 280000, entityType: "trust" },
    investments: { cash_savings: 180000, term_deposit_amount: 350000, term_deposit_rate: 4.9, shares_value: 680000, shares_dividend_yield: 3.8, franking_percentage: 90, bonds_value: 220000, bonds_yield: 5.4, etf_value: 420000, etf_yield: 3.2, smsf_balance: 1100000, properties: [
      { property_id: "prop_c2_1", name: "North Sydney Office", value: 1850000, rental_income: 85000, mortgage_amount: 920000, mortgage_rate: 6.1, mortgage_term_years: 20, annual_expenses: 18000, depreciation_building: 12000, depreciation_fixtures: 5500 },
      { property_id: "prop_c2_2", name: "Chatswood Apartment", value: 980000, rental_income: 42000, mortgage_amount: 490000, mortgage_rate: 5.95, mortgage_term_years: 25, annual_expenses: 9800, depreciation_building: 7200, depreciation_fixtures: 3100 },
    ] },
    summary: { totalAssets: 5780000, totalDebt: 1410000, netWorth: 4370000, annualIncome: 407000, totalTax: 98500, netIncome: 308500 },
  },
  client_3: {
    personal: { name: "Robert Mitchell", age: 58, taxableIncome: 145000, entityType: "personal" },
    investments: { cash_savings: 95000, term_deposit_amount: 200000, term_deposit_rate: 4.7, shares_value: 450000, shares_dividend_yield: 4.5, franking_percentage: 88, bonds_value: 150000, bonds_yield: 5.0, etf_value: 180000, etf_yield: 3.6, smsf_balance: 680000, properties: [] },
    summary: { totalAssets: 1755000, totalDebt: 0, netWorth: 1755000, annualIncome: 154500, totalTax: 38200, netIncome: 116300 },
  },
  client_4: {
    personal: { name: "Williams Family", age: 38, taxableIncome: 195000, entityType: "personal" },
    investments: { cash_savings: 45000, term_deposit_amount: 80000, term_deposit_rate: 4.5, shares_value: 180000, shares_dividend_yield: 3.5, franking_percentage: 80, bonds_value: 50000, bonds_yield: 4.8, etf_value: 95000, etf_yield: 3.3, smsf_balance: 400000, properties: [
      { property_id: "prop_c4_1", name: "Brunswick Home", value: 1200000, rental_income: 0, mortgage_amount: 720000, mortgage_rate: 6.2, mortgage_term_years: 28, annual_expenses: 5000, depreciation_building: 0, depreciation_fixtures: 0 },
    ] },
    summary: { totalAssets: 2050000, totalDebt: 720000, netWorth: 1330000, annualIncome: 200000, totalTax: 52000, netIncome: 148000 },
  },
  client_5: {
    personal: { name: "Patel SMSF", age: 48, taxableIncome: 288000, entityType: "smsf" },
    investments: { cash_savings: 250000, term_deposit_amount: 500000, term_deposit_rate: 5.1, shares_value: 920000, shares_dividend_yield: 4.0, franking_percentage: 92, bonds_value: 350000, bonds_yield: 5.5, etf_value: 580000, etf_yield: 3.4, smsf_balance: 1880000, properties: [
      { property_id: "prop_c5_1", name: "Commercial Warehouse Dandenong", value: 2200000, rental_income: 120000, mortgage_amount: 880000, mortgage_rate: 5.8, mortgage_term_years: 15, annual_expenses: 22000, depreciation_building: 18000, depreciation_fixtures: 8000 },
      { property_id: "prop_c5_2", name: "Toorak Investment Unit", value: 1450000, rental_income: 58000, mortgage_amount: 580000, mortgage_rate: 6.0, mortgage_term_years: 22, annual_expenses: 12000, depreciation_building: 9500, depreciation_fixtures: 4200 },
    ] },
    summary: { totalAssets: 8130000, totalDebt: 1460000, netWorth: 6670000, annualIncome: 466000, totalTax: 125000, netIncome: 341000 },
  },
};

// Default Share Portfolio with ownership types
export const DEFAULT_SHARE_PORTFOLIO = [
  { id: 1, symbol: "VGH", name: "Vanguard High Growth ETF", ownership: "joint", ownerId: null, quantity: 400, purchasePrice: 92.00, currentPrice: 105.00, purchaseDate: "2022-03-15", dividendYield: 3.5, frankingPercentage: 0, sector: "ETF" },
  { id: 2, symbol: "BHP", name: "BHP Group Shares", ownership: "personal", ownerId: 1, quantity: 400, purchasePrice: 42.00, currentPrice: 46.25, purchaseDate: "2023-06-20", dividendYield: 5.8, frankingPercentage: 100, sector: "Materials" },
  { id: 3, symbol: "CBA", name: "CBA Shares (DRP)", ownership: "personal", ownerId: 2, quantity: 200, purchasePrice: 105.00, currentPrice: 120.00, purchaseDate: "2022-08-01", dividendYield: 4.2, frankingPercentage: 100, sector: "Financials" },
];

// Per-client share portfolios (client_1 uses DEFAULT_SHARE_PORTFOLIO)
export const CLIENT_SHARE_DATA = {
  client_1: DEFAULT_SHARE_PORTFOLIO,
  client_2: [
    { id: 1, symbol: "ANZ", name: "ANZ Group", ownership: "personal", ownerId: 1, quantity: 400, purchasePrice: 24.50, currentPrice: 28.90, purchaseDate: "2022-01-10", dividendYield: 5.1, frankingPercentage: 100, sector: "Financials" },
    { id: 2, symbol: "WES", name: "Wesfarmers", ownership: "personal", ownerId: 1, quantity: 120, purchasePrice: 52.00, currentPrice: 65.40, purchaseDate: "2023-03-15", dividendYield: 3.2, frankingPercentage: 100, sector: "Consumer Discretionary" },
    { id: 3, symbol: "VGS", name: "Vanguard MSCI International", ownership: "joint", ownerId: null, quantity: 800, purchasePrice: 92.00, currentPrice: 108.50, purchaseDate: "2022-06-20", dividendYield: 2.1, frankingPercentage: 0, sector: "ETF" },
    { id: 4, symbol: "RIO", name: "Rio Tinto", ownership: "company", ownerId: null, quantity: 250, purchasePrice: 115.00, currentPrice: 122.30, purchaseDate: "2023-08-01", dividendYield: 6.5, frankingPercentage: 100, sector: "Materials" },
    { id: 5, symbol: "MQG", name: "Macquarie Group", ownership: "personal", ownerId: 2, quantity: 60, purchasePrice: 185.00, currentPrice: 210.50, purchaseDate: "2024-02-10", dividendYield: 3.8, frankingPercentage: 100, sector: "Financials" },
  ],
  client_3: [
    { id: 1, symbol: "CBA", name: "Commonwealth Bank", ownership: "personal", ownerId: 1, quantity: 350, purchasePrice: 95.00, currentPrice: 118.50, purchaseDate: "2021-05-20", dividendYield: 4.2, frankingPercentage: 100, sector: "Financials" },
    { id: 2, symbol: "CSL", name: "CSL Limited", ownership: "personal", ownerId: 1, quantity: 80, purchasePrice: 270.00, currentPrice: 298.00, purchaseDate: "2022-09-15", dividendYield: 1.2, frankingPercentage: 100, sector: "Healthcare" },
    { id: 3, symbol: "IVV", name: "iShares S&P 500 ETF", ownership: "personal", ownerId: 1, quantity: 200, purchasePrice: 480.00, currentPrice: 545.00, purchaseDate: "2023-01-10", dividendYield: 1.5, frankingPercentage: 0, sector: "ETF" },
  ],
  client_4: [
    { id: 1, symbol: "VAS", name: "Vanguard Australian Shares", ownership: "joint", ownerId: null, quantity: 400, purchasePrice: 85.00, currentPrice: 96.50, purchaseDate: "2023-04-10", dividendYield: 3.8, frankingPercentage: 85, sector: "ETF" },
    { id: 2, symbol: "BHP", name: "BHP Group", ownership: "personal", ownerId: 1, quantity: 200, purchasePrice: 42.00, currentPrice: 42.80, purchaseDate: "2023-11-01", dividendYield: 5.8, frankingPercentage: 100, sector: "Materials" },
  ],
  client_5: [
    { id: 1, symbol: "CBA", name: "Commonwealth Bank", ownership: "personal", ownerId: 1, quantity: 500, purchasePrice: 90.00, currentPrice: 118.50, purchaseDate: "2020-03-15", dividendYield: 4.2, frankingPercentage: 100, sector: "Financials" },
    { id: 2, symbol: "CSL", name: "CSL Limited", ownership: "personal", ownerId: 1, quantity: 150, purchasePrice: 250.00, currentPrice: 298.00, purchaseDate: "2021-06-20", dividendYield: 1.2, frankingPercentage: 100, sector: "Healthcare" },
    { id: 3, symbol: "VGS", name: "Vanguard MSCI International", ownership: "company", ownerId: null, quantity: 1000, purchasePrice: 88.00, currentPrice: 108.50, purchaseDate: "2022-01-15", dividendYield: 2.1, frankingPercentage: 0, sector: "ETF" },
    { id: 4, symbol: "AFI", name: "AFIC", ownership: "personal", ownerId: 2, quantity: 2000, purchasePrice: 7.50, currentPrice: 8.20, purchaseDate: "2022-08-01", dividendYield: 3.5, frankingPercentage: 100, sector: "LIC" },
    { id: 5, symbol: "WBC", name: "Westpac Banking", ownership: "company", ownerId: null, quantity: 800, purchasePrice: 22.00, currentPrice: 26.80, purchaseDate: "2023-02-15", dividendYield: 5.2, frankingPercentage: 100, sector: "Financials" },
    { id: 6, symbol: "TCL", name: "Transurban Group", ownership: "personal", ownerId: 1, quantity: 600, purchasePrice: 13.50, currentPrice: 14.80, purchaseDate: "2023-07-01", dividendYield: 4.1, frankingPercentage: 0, sector: "Infrastructure" },
  ],
};

// Default Household Budget
export const DEFAULT_BUDGET = {
  frequency: "monthly",
  income: { salary1: 10000, salary2: 5417, rental: 2667, dividends: 375, other: 0 },
  expenses: { mortgage: 4200, utilities: 450, groceries: 1200, transport: 800, insurance: 650, schoolFees: 0, childcare: 0, entertainment: 600, dining: 400, subscriptions: 150, clothing: 300, medical: 200, other: 500 },
};

// Default Portfolio Data (client_1 fallback)
export const DEFAULT_PORTFOLIO = CLIENT_PORTFOLIO_DATA.client_1;

// Investment Recommendations (shown on dashboard until user edits)
export const RECOMMENDATIONS = [
  { id: 1, type: "tax_optimization", priority: "high", title: "Maximize Salary Sacrifice", description: "You have $5,000 unused concessional cap. Salary sacrificing this amount saves $1,850 in tax (37% → 15%).", impact: "+$1,850/year", action: "Increase salary sacrifice to $25,000" },
  { id: 2, type: "property", priority: "high", title: "Negative Gearing Tax Benefit", description: "Your Sydney property generates $12,400 annual tax deduction. Consider a depreciation schedule review.", impact: "+$4,588/year", action: "Get updated depreciation report" },
  { id: 3, type: "diversification", priority: "medium", title: "Rebalance to International ETFs", description: "Portfolio is 85% Australian assets. Consider 20% allocation to international markets for diversification.", impact: "Reduced risk", action: "Allocate $58,000 to VGS/IVV" },
  { id: 4, type: "super", priority: "medium", title: "Spouse Contribution Benefit", description: "If spouse earns under $37,000, contribute $3,000 to their super for $540 tax offset.", impact: "+$540/year", action: "Make spouse super contribution" },
  { id: 5, type: "cgt", priority: "low", title: "CGT Timing Strategy", description: "Shares held for 11 months. Wait 1 more month for 50% CGT discount if selling.", impact: "50% CGT reduction", action: "Defer any sales by 30 days" },
  { id: 6, type: "debt", priority: "medium", title: "Debt Recycling Opportunity", description: "Convert $75k non-deductible savings to investment loan. Interest becomes tax deductible.", impact: "+$2,775/year", action: "Consult mortgage broker" },
];
