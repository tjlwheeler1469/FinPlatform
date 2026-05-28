// Centralized client mock data — SINGLE SOURCE OF TRUTH
// All components should import from here instead of maintaining their own copies.
// HNW-level data — ranges from $3M to $25M

export const CLIENT_DATA = {
  thompson_family: {
    assets: [
      { id: 1, name: 'David - AustralianSuper (Balanced)', type: 'Super', entity: 'Super', member: 'you', value: 1850000, change: 8.2 },
      { id: 2, name: 'Sarah - REST Super (Growth)', type: 'Super', entity: 'Super', member: 'partner', value: 1420000, change: 7.8 },
      { id: 3, name: 'Family Home - Glen Waverley', type: 'Property', entity: 'Personal', value: 2850000, change: 4.1 },
      { id: 4, name: 'Investment Unit - Brunswick', type: 'Property', entity: 'Joint', value: 1280000, change: 3.8, purchaseDate: '2026-05-20', costBase: 620000 },
      { id: 5, name: 'Holiday House - Portsea', type: 'Property', entity: 'Joint', value: 1950000, change: 5.2 },
      { id: 6, name: 'Vanguard High Growth ETF (VAS)', type: 'Shares', entity: 'Personal', value: 420000, change: 9.5 },
      { id: 7, name: 'BHP Group Ltd', type: 'Shares', entity: 'Personal', value: 185000, change: 6.2 },
      { id: 8, name: 'CBA Shares (DRP)', type: 'Shares', entity: 'Joint', value: 240000, change: 11.3 },
      { id: 9, name: 'Magellan Global Fund', type: 'Managed Fund', entity: 'Personal', value: 380000, change: 7.1 },
      { id: 10, name: 'Platinum International Fund', type: 'Managed Fund', entity: 'Joint', value: 290000, change: 5.4 },
      { id: 11, name: 'Emergency Fund - ING Savings', type: 'Cash', entity: 'Personal', value: 180000, change: 4.35 },
      { id: 12, name: 'Term Deposit - Westpac 12m', type: 'Cash', entity: 'Joint', value: 350000, change: 4.65 },
      { id: 13, name: 'Bitcoin & Ethereum', type: 'Crypto', entity: 'Personal', value: 85000, change: 28.4 },
      { id: 14, name: 'Tesla Model Y 2025', type: 'Other', entity: 'Personal', value: 72000, change: -15.0 },
      { id: 15, name: 'Art Collection (insured)', type: 'Other', entity: 'Personal', value: 120000, change: 3.0 },
    ],
    liabilities: [
      { id: 1, name: 'Home Loan - CBA (P&I)', type: 'Mortgage', value: 680000, rate: 6.19 },
      { id: 2, name: 'Investment Loan - ANZ (IO)', type: 'Mortgage', value: 520000, rate: 6.49 },
      { id: 3, name: 'Portsea Mortgage - Westpac', type: 'Mortgage', value: 850000, rate: 6.29 },
      { id: 4, name: 'Credit Card - Amex Plat', type: 'Credit', value: 12000, rate: 20.99 },
    ],
    profile: {
      user_id: 'thompson_family', name: 'David & Sarah Thompson', first_name: 'David', last_name: 'Thompson',
      partner_first_name: 'Sarah', relationship: 'couple', age: 50, partner_age: 48, retirementAge: 67, yearsToRetirement: 17,
      riskProfile: 'Balanced', incomeHousehold: 485000, expensesAnnual: 210000, children: 2, status: 'Married',
      email: 'david.thompson@email.com', phone: '0412 345 678', address: '18 Elm Street, Glen Waverley VIC 3150',
      advisor: 'Sarah Chen', occupation: 'IT Director', employer: 'NAB',
    },
    retirement: { current_age: 50, retirement_age: 67, life_expectancy: 92, annual_contributions: 120000, retirement_spending: 180000 },
    rebalancing: [
      { asset: 'Australian Shares', current: 7, target: 15, diff: -8, action: 'Buy' },
      { asset: 'International Shares', current: 5, target: 15, diff: -10, action: 'Buy' },
      { asset: 'Property', current: 48, target: 30, diff: 18, action: 'Review' },
      { asset: 'Super', current: 26, target: 20, diff: 6, action: 'Review' },
      { asset: 'Cash', current: 4, target: 10, diff: -6, action: 'Buy' },
      { asset: 'Alternatives', current: 2, target: 5, diff: -3, action: 'Buy' },
      { asset: 'Managed Funds', current: 5, target: 5, diff: 0, action: 'Hold' },
    ],
    budget: { monthlyIncome: 40417, monthlyExpenses: 17500, savingsRate: 56.7 },
  },
  chen_family: {
    assets: [
      { id: 1, name: 'Chen Family Trust - Equities (Domestic)', type: 'Trust Portfolio', entity: 'Trust', value: 4200000, change: 12.1 },
      { id: 2, name: 'Chen Family Trust - Global Equities', type: 'Trust Portfolio', entity: 'Trust', value: 3100000, change: 14.3 },
      { id: 3, name: 'Chen Family Trust - Fixed Income', type: 'Trust Portfolio', entity: 'Trust', value: 2800000, change: 5.4 },
      { id: 4, name: 'Chen Family Trust - Alternatives/PE', type: 'Trust Portfolio', entity: 'Trust', value: 1500000, change: 8.7 },
      { id: 5, name: 'Michael - AMP Super (Aggressive)', type: 'Super', entity: 'Super', member: 'you', value: 2800000, change: 9.1 },
      { id: 6, name: 'Lisa - Hostplus Super (Growth)', type: 'Super', entity: 'Super', member: 'partner', value: 1950000, change: 8.5 },
      { id: 7, name: 'Family Home - Mosman', type: 'Property', entity: 'Personal', value: 5200000, change: 3.2 },
      { id: 8, name: 'Investment Apartment - Surry Hills', type: 'Property', entity: 'Trust', value: 1850000, change: 4.1, purchaseDate: '2026-06-10', costBase: 850000 },
      { id: 9, name: 'Cash Management Account', type: 'Cash', entity: 'Trust', value: 600000, change: 4.5 },
    ],
    liabilities: [
      { id: 1, name: 'Trust Investment Loan - Macquarie', type: 'Loan', value: 1200000, rate: 6.59 },
    ],
    profile: {
      user_id: 'chen_family', name: 'Michael & Lisa Chen', first_name: 'Michael', last_name: 'Chen',
      partner_first_name: 'Lisa', age: 49, retirementAge: 60, yearsToRetirement: 11,
      riskProfile: 'Growth', incomeHousehold: 1250000, expensesAnnual: 420000, children: 1, status: 'Married',
      email: 'michael.chen@email.com', phone: '0423 456 789', address: '15 Pacific Highway, Mosman NSW 2088',
      advisor: 'Sarah Chen', occupation: 'Property Developer', employer: 'Chen Developments Pty Ltd',
    },
    retirement: { current_age: 49, retirement_age: 60, life_expectancy: 92, annual_contributions: 200000, retirement_spending: 350000 },
    rebalancing: [
      { asset: 'Trust Equities', current: 30, target: 25, diff: 5, action: 'Sell' },
      { asset: 'Global Equities', current: 13, target: 15, diff: -2, action: 'Buy' },
      { asset: 'Fixed Income', current: 12, target: 15, diff: -3, action: 'Buy' },
      { asset: 'Property', current: 29, target: 25, diff: 4, action: 'Review' },
      { asset: 'Super', current: 20, target: 15, diff: 5, action: 'Review' },
      { asset: 'Cash', current: 2, target: 5, diff: -3, action: 'Buy' },
    ],
    budget: { monthlyIncome: 104167, monthlyExpenses: 35000, savingsRate: 66.4 },
  },
  client_3: {
    assets: [
      { id: 1, name: 'Robert - Colonial First State Super', type: 'Super', entity: 'Personal', member: 'you', value: 3200000, change: 2.3 },
      { id: 2, name: 'Managed Portfolio - Macquarie Wrap', type: 'Managed Fund', entity: 'Personal', value: 2100000, change: 3.1 },
      { id: 3, name: 'Term Deposits - CBA (ladder)', type: 'Cash', entity: 'Personal', value: 1250000, change: 4.5 },
      { id: 4, name: 'Government Bonds (Aust)', type: 'Bonds', entity: 'Personal', value: 800000, change: 4.0 },
      { id: 5, name: 'Corporate Bonds (Investment Grade)', type: 'Bonds', entity: 'Personal', value: 450000, change: 5.2 },
      { id: 6, name: 'Townhouse - Neutral Bay', type: 'Property', entity: 'Personal', value: 1800000, change: 3.5 },
    ],
    liabilities: [],
    profile: {
      user_id: 'client_3', name: 'Robert Mitchell', first_name: 'Robert', last_name: 'Mitchell',
      partner_first_name: '', relationship: 'single', age: 62, retirementAge: 65, yearsToRetirement: 3,
      riskProfile: 'Conservative', incomeHousehold: 520000, expensesAnnual: 240000, children: 0, status: 'Single',
      email: 'r.mitchell@company.com', phone: '0434 567 890', address: '15 Elizabeth Street, Sydney NSW 2000',
      advisor: 'Sarah Chen', occupation: 'CFO', employer: 'Mitchell & Associates',
    },
    retirement: { current_age: 62, retirement_age: 65, life_expectancy: 90, annual_contributions: 80000, retirement_spending: 200000 },
    rebalancing: [
      { asset: 'Super', current: 33, target: 30, diff: 3, action: 'Review' },
      { asset: 'Managed Funds', current: 22, target: 20, diff: 2, action: 'Hold' },
      { asset: 'Cash', current: 13, target: 15, diff: -2, action: 'Buy' },
      { asset: 'Bonds', current: 13, target: 20, diff: -7, action: 'Buy' },
      { asset: 'Property', current: 19, target: 15, diff: 4, action: 'Review' },
    ],
    budget: { monthlyIncome: 43333, monthlyExpenses: 20000, savingsRate: 53.8 },
  },
  client_4: {
    assets: [
      { id: 1, name: 'Emma - Sunsuper (High Growth)', type: 'Super', entity: 'Super', member: 'you', value: 420000, change: 9.2 },
      { id: 2, name: 'David W - AustralianSuper', type: 'Super', entity: 'Super', member: 'partner', value: 510000, change: 8.8 },
      { id: 3, name: 'Family Home - Fitzroy', type: 'Property', entity: 'Joint', value: 1850000, change: 3.5 },
      { id: 4, name: 'Investment Unit - Richmond', type: 'Property', entity: 'Joint', value: 920000, change: 4.1 },
      { id: 5, name: 'Savings Account - ING', type: 'Cash', entity: 'Joint', value: 85000, change: 4.2 },
      { id: 6, name: 'Vanguard Diversified Growth', type: 'Managed Fund', entity: 'Joint', value: 180000, change: 8.3 },
    ],
    liabilities: [
      { id: 1, name: 'Home Loan - Westpac', type: 'Mortgage', value: 720000, rate: 6.29 },
      { id: 2, name: 'Investment Loan - CBA', type: 'Mortgage', value: 480000, rate: 6.49 },
    ],
    profile: {
      user_id: 'client_4', name: 'Emma & David Williams', first_name: 'Emma', last_name: 'Williams',
      partner_first_name: 'David', relationship: 'couple', age: 39, partner_age: 41, retirementAge: 67, yearsToRetirement: 28,
      riskProfile: 'Growth', incomeHousehold: 310000, expensesAnnual: 165000, children: 1, status: 'Married',
      email: 'emma.williams@email.com', phone: '0445 678 901', address: '8 Rose Street, Fitzroy VIC 3065',
      advisor: 'Sarah Chen', occupation: 'Marketing Director', employer: 'Telstra',
    },
    retirement: { current_age: 39, retirement_age: 67, life_expectancy: 92, annual_contributions: 65000, retirement_spending: 120000 },
    rebalancing: [
      { asset: 'Super', current: 23, target: 20, diff: 3, action: 'Review' },
      { asset: 'Property', current: 70, target: 45, diff: 25, action: 'Review' },
      { asset: 'Cash', current: 2, target: 10, diff: -8, action: 'Buy' },
      { asset: 'Managed Funds', current: 5, target: 25, diff: -20, action: 'Buy' },
    ],
    budget: { monthlyIncome: 25833, monthlyExpenses: 13750, savingsRate: 46.8 },
  },
  client_5: {
    assets: [
      { id: 1, name: 'Patel Family SMSF - Equities', type: 'SMSF', entity: 'Trust', member: 'joint', value: 5800000, change: 6.7 },
      { id: 2, name: 'Patel Family SMSF - Infrastructure', type: 'SMSF', entity: 'Trust', member: 'joint', value: 2200000, change: 8.4 },
      { id: 3, name: 'Commercial Property - Parramatta CBD', type: 'Property', entity: 'Trust', value: 3500000, change: 4.2 },
      { id: 4, name: 'Medical Practice Building - Westmead', type: 'Property', entity: 'Trust', value: 2800000, change: 3.8 },
      { id: 5, name: 'Raj - Personal Super', type: 'Super', entity: 'Personal', value: 1800000, change: 7.5 },
      { id: 6, name: 'Priya - Personal Super', type: 'Super', entity: 'Personal', value: 1200000, change: 7.1 },
      { id: 7, name: 'Private Equity Fund', type: 'Alternatives', entity: 'Trust', value: 1500000, change: 12.3 },
      { id: 8, name: 'Cash Buffer', type: 'Cash', entity: 'Trust', value: 800000, change: 4.3 },
    ],
    liabilities: [
      { id: 1, name: 'SMSF Limited Recourse Loan', type: 'Loan', value: 1200000, rate: 7.19 },
      { id: 2, name: 'Practice Building Loan - NAB', type: 'Loan', value: 950000, rate: 6.49 },
    ],
    profile: {
      user_id: 'client_5', name: 'Raj & Priya Patel', first_name: 'Raj', last_name: 'Patel',
      partner_first_name: 'Priya', relationship: 'couple', age: 54, partner_age: 52, retirementAge: 60, yearsToRetirement: 6,
      riskProfile: 'Aggressive', incomeHousehold: 980000, expensesAnnual: 380000, children: 2, status: 'Married',
      email: 'raj.patel@email.com', phone: '0456 789 012', address: '22 Pacific Hwy, Parramatta NSW 2150',
      advisor: 'Sarah Chen', occupation: 'Surgeon', employer: 'Westmead Hospital',
    },
    retirement: { current_age: 54, retirement_age: 60, life_expectancy: 90, annual_contributions: 180000, retirement_spending: 280000 },
    rebalancing: [
      { asset: 'SMSF', current: 40, target: 35, diff: 5, action: 'Review' },
      { asset: 'Property', current: 32, target: 25, diff: 7, action: 'Sell' },
      { asset: 'Super', current: 15, target: 15, diff: 0, action: 'Hold' },
      { asset: 'Alternatives', current: 8, target: 10, diff: -2, action: 'Buy' },
      { asset: 'Cash', current: 4, target: 15, diff: -11, action: 'Buy' },
    ],
    budget: { monthlyIncome: 81667, monthlyExpenses: 31667, savingsRate: 61.2 },
  },
  client_6: {
    assets: [
      { id: 1, name: 'Anderson Partnership Fund - Equities', type: 'Managed Fund', entity: 'Partnership', value: 6500000, change: 5.2 },
      { id: 2, name: 'Anderson Partnership - Fixed Income', type: 'Managed Fund', entity: 'Partnership', value: 3200000, change: 4.1 },
      { id: 3, name: 'John - AMP Super (Balanced)', type: 'Super', entity: 'Personal', member: 'you', value: 2400000, change: 6.8 },
      { id: 4, name: 'Partner - REST Super', type: 'Super', entity: 'Personal', member: 'partner', value: 1800000, change: 6.1 },
      { id: 5, name: 'Office Property - Collins St', type: 'Property', entity: 'Partnership', value: 4200000, change: 2.8 },
      { id: 6, name: 'Warehouse - Port Melbourne', type: 'Property', entity: 'Partnership', value: 2800000, change: 3.5 },
      { id: 7, name: 'Cash Management', type: 'Cash', entity: 'Partnership', value: 1100000, change: 4.5 },
    ],
    liabilities: [
      { id: 1, name: 'Commercial Loan - NAB', type: 'Loan', value: 2200000, rate: 6.89 },
      { id: 2, name: 'Warehouse Loan - Westpac', type: 'Loan', value: 1500000, rate: 6.59 },
    ],
    profile: {
      user_id: 'client_6', name: 'Anderson Partnership', first_name: 'John', last_name: 'Anderson',
      partner_first_name: '', relationship: 'single', age: 59, retirementAge: 65, yearsToRetirement: 6,
      riskProfile: 'Balanced', incomeHousehold: 850000, expensesAnnual: 420000, children: 0, status: 'Partnered',
      email: 'john.anderson@lawfirm.com.au', phone: '0467 890 123', address: '100 Collins St, Melbourne VIC 3000',
      advisor: 'Sarah Chen', occupation: 'Managing Partner', employer: 'Anderson & Co',
    },
    retirement: { current_age: 59, retirement_age: 65, life_expectancy: 90, annual_contributions: 160000, retirement_spending: 300000 },
    rebalancing: [
      { asset: 'Partnership Equities', current: 29, target: 25, diff: 4, action: 'Sell' },
      { asset: 'Fixed Income', current: 14, target: 20, diff: -6, action: 'Buy' },
      { asset: 'Super', current: 19, target: 15, diff: 4, action: 'Review' },
      { asset: 'Property', current: 32, target: 25, diff: 7, action: 'Sell' },
      { asset: 'Cash', current: 5, target: 15, diff: -10, action: 'Buy' },
    ],
    budget: { monthlyIncome: 70833, monthlyExpenses: 35000, savingsRate: 50.6 },
  },
  client_7: {
    assets: [
      { id: 1, name: 'Sarah K - Hostplus Super (High Growth)', type: 'Super', entity: 'Personal', member: 'you', value: 580000, change: 11.2 },
      { id: 2, name: 'Growth Share Portfolio (ASX)', type: 'Shares', entity: 'Personal', value: 1800000, change: 15.3 },
      { id: 3, name: 'US Tech Portfolio (NASDAQ)', type: 'Shares', entity: 'Personal', value: 2200000, change: 22.1 },
      { id: 4, name: 'Startup Equity (Series B vested)', type: 'Other', entity: 'Personal', value: 3500000, change: 35.0 },
      { id: 5, name: 'Penthouse - Southbank', type: 'Property', entity: 'Personal', value: 2100000, change: 2.1 },
      { id: 6, name: 'Crypto Portfolio (BTC/ETH/SOL)', type: 'Crypto', entity: 'Personal', value: 850000, change: 42.0 },
      { id: 7, name: 'Emergency Fund', type: 'Cash', entity: 'Personal', value: 220000, change: 4.5 },
    ],
    liabilities: [
      { id: 1, name: 'Investment Loan - CBA', type: 'Mortgage', value: 1100000, rate: 6.39 },
    ],
    profile: {
      user_id: 'client_7', name: 'Sarah Kim', first_name: 'Sarah', last_name: 'Kim',
      partner_first_name: '', relationship: 'single', age: 34, retirementAge: 50, yearsToRetirement: 16,
      riskProfile: 'Aggressive', incomeHousehold: 680000, expensesAnnual: 210000, children: 0, status: 'Single',
      email: 'sarah.kim@startup.io', phone: '0478 901 234', address: '45 Flinders Lane, Melbourne VIC 3000',
      advisor: 'Sarah Chen', occupation: 'CTO & Co-founder', employer: 'TechVenture Pty Ltd',
    },
    retirement: { current_age: 34, retirement_age: 50, life_expectancy: 95, annual_contributions: 95000, retirement_spending: 250000 },
    rebalancing: [
      { asset: 'ASX Shares', current: 16, target: 20, diff: -4, action: 'Buy' },
      { asset: 'US Tech', current: 19, target: 15, diff: 4, action: 'Sell' },
      { asset: 'Startup Equity', current: 31, target: 20, diff: 11, action: 'Review' },
      { asset: 'Property', current: 19, target: 15, diff: 4, action: 'Review' },
      { asset: 'Crypto', current: 8, target: 10, diff: -2, action: 'Buy' },
      { asset: 'Super', current: 5, target: 10, diff: -5, action: 'Buy' },
      { asset: 'Cash', current: 2, target: 10, diff: -8, action: 'Buy' },
    ],
    budget: { monthlyIncome: 56667, monthlyExpenses: 17500, savingsRate: 69.1 },
  },
};

// Aliases for backward compatibility
CLIENT_DATA.client_1 = CLIENT_DATA.thompson_family;
CLIENT_DATA.client_2 = CLIENT_DATA.chen_family;

// Helper: resolve the active client from localStorage
export const getActiveClientId = () => {
  try {
    const mode = localStorage.getItem('app_mode');
    if (mode === 'adviser') {
      const saved = localStorage.getItem('selected_client');
      if (saved) {
        const c = JSON.parse(saved);
        const id = c?.id || c?.client_id || 'thompson_family';
        if (CLIENT_DATA[id]) return id;
      }
    }
  } catch { /* ignore */ }
  return 'thompson_family';
};

// Helper: get active client data
export const getActiveClient = () => CLIENT_DATA[getActiveClientId()];

// Helper: compute totals for a client
export const computeClientTotals = (clientId) => {
  const data = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const grossAssets = data.assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = data.liabilities.reduce((s, l) => s + l.value, 0);
  return { grossAssets, totalLiabilities, netWorth: grossAssets - totalLiabilities };
};

// Firm branding
export const FIRM = {
  name: 'Halcyon Wealth',
  tagline: 'Wealth Command Centre',
  primaryAdvisor: 'Sarah Chen',
  email: 'info@halcyonwealth.com.au',
  phone: '1300 425 296',
};
