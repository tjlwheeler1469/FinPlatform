// Centralized client mock data — SINGLE SOURCE OF TRUTH
// All components should import from here instead of maintaining their own copies.

export const CLIENT_DATA = {
  thompson_family: {
    assets: [
      { id: 1, name: 'David - AustralianSuper', type: 'Super', entity: 'Super', value: 245000, change: 8.2 },
      { id: 2, name: 'Sarah - REST Super', type: 'Super', entity: 'Super', value: 198000, change: 7.8 },
      { id: 3, name: 'Family Home - Glen Waverley', type: 'Property', entity: 'Personal', value: 985000, change: 4.1 },
      { id: 4, name: 'Investment Unit - Brunswick', type: 'Property', entity: 'Joint', value: 620000, change: 3.8 },
      { id: 5, name: 'Vanguard High Growth ETF', type: 'Shares', entity: 'Personal', value: 42000, change: 9.5 },
      { id: 6, name: 'BHP Group Shares', type: 'Shares', entity: 'Personal', value: 18500, change: 6.2 },
      { id: 7, name: 'CBA Shares (DRP)', type: 'Shares', entity: 'Joint', value: 24000, change: 11.3 },
      { id: 8, name: 'Emergency Fund - ING Savings', type: 'Cash', entity: 'Personal', value: 28000, change: 4.35 },
      { id: 9, name: 'Term Deposit - Westpac 12m', type: 'Cash', entity: 'Joint', value: 35000, change: 4.65 },
      { id: 10, name: 'Colonial First State Balanced', type: 'Managed Fund', entity: 'Personal', value: 32000, change: 5.8 },
      { id: 11, name: 'Bitcoin (Coinbase)', type: 'Crypto', entity: 'Personal', value: 8500, change: 28.4 },
      { id: 12, name: 'Toyota RAV4 Hybrid 2023', type: 'Other', entity: 'Personal', value: 42000, change: -12.0 },
    ],
    liabilities: [
      { id: 1, name: 'Home Loan - CBA', type: 'Mortgage', value: 285000, rate: 6.19 },
      { id: 2, name: 'Investment Loan - ANZ', type: 'Mortgage', value: 380000, rate: 6.49 },
      { id: 3, name: 'Credit Card - Visa', type: 'Credit', value: 4200, rate: 19.99 },
    ],
    profile: {
      user_id: 'thompson_family', name: 'David & Sarah Thompson', first_name: 'David', last_name: 'Thompson',
      partner_first_name: 'Sarah', age: 50, retirementAge: 67, yearsToRetirement: 17,
      riskProfile: 'Balanced', incomeHousehold: 185000, expensesAnnual: 95000, children: 2, status: 'Married',
      email: 'david.thompson@email.com', phone: '0412 345 678', address: '18 Elm Street, Glen Waverley VIC 3150',
      advisor: 'Sarah Chen', occupation: 'IT Manager', employer: 'NAB',
    },
    retirement: { current_age: 50, retirement_age: 67, life_expectancy: 92, annual_contributions: 42000, retirement_spending: 72000 },
    rebalancing: [
      { asset: 'Australian Shares', current: 28, target: 25, diff: 3, action: 'Sell' },
      { asset: 'International Shares', current: 12, target: 20, diff: -8, action: 'Buy' },
      { asset: 'Property', current: 42, target: 25, diff: 17, action: 'Review' },
      { asset: 'Bonds/Fixed Income', current: 8, target: 20, diff: -12, action: 'Buy' },
      { asset: 'Cash', current: 10, target: 10, diff: 0, action: 'Hold' },
    ],
    budget: { monthlyIncome: 15417, monthlyExpenses: 7917, savingsRate: 48.6 },
  },
  chen_family: {
    assets: [
      { id: 1, name: 'Chen Family Trust - Equities', type: 'Trust Portfolio', entity: 'Trust', value: 1400000, change: 12.1 },
      { id: 2, name: 'Chen Family Trust - Fixed Income', type: 'Trust Portfolio', entity: 'Trust', value: 900000, change: 5.4 },
      { id: 3, name: 'Chen Family Trust - Alternatives', type: 'Trust Portfolio', entity: 'Trust', value: 500000, change: 8.7 },
      { id: 4, name: 'Michael - AMP Super', type: 'Super', entity: 'Super', value: 720000, change: 9.1 },
      { id: 5, name: 'Lisa - Hostplus Super', type: 'Super', entity: 'Super', value: 480000, change: 8.5 },
      { id: 6, name: 'Family Home - Mosman', type: 'Property', entity: 'Personal', value: 1100000, change: 3.2 },
      { id: 7, name: 'Cash Management Account', type: 'Cash', entity: 'Trust', value: 100000, change: 4.5 },
    ],
    liabilities: [],
    profile: {
      user_id: 'chen_family', name: 'Michael & Lisa Chen', first_name: 'Michael', last_name: 'Chen',
      partner_first_name: 'Lisa', age: 49, retirementAge: 60, yearsToRetirement: 11,
      riskProfile: 'Balanced', incomeHousehold: 450000, expensesAnnual: 180000, children: 1, status: 'Married',
      email: 'michael.chen@email.com', phone: '0423 456 789', address: '15 Pacific Highway, Chatswood NSW 2067',
      advisor: 'Sarah Chen', occupation: 'Property Developer', employer: 'Chen Developments',
    },
    retirement: { current_age: 49, retirement_age: 60, life_expectancy: 92, annual_contributions: 55000, retirement_spending: 120000 },
    rebalancing: [
      { asset: 'Trust Equities', current: 27, target: 30, diff: -3, action: 'Buy' },
      { asset: 'Fixed Income', current: 17, target: 20, diff: -3, action: 'Buy' },
      { asset: 'Property', current: 21, target: 20, diff: 1, action: 'Hold' },
      { asset: 'Super', current: 23, target: 20, diff: 3, action: 'Review' },
      { asset: 'Cash', current: 2, target: 5, diff: -3, action: 'Buy' },
      { asset: 'Alternatives', current: 10, target: 5, diff: 5, action: 'Sell' },
    ],
    budget: { monthlyIncome: 37500, monthlyExpenses: 15000, savingsRate: 60.0 },
  },
  client_3: {
    assets: [
      { id: 1, name: 'Robert - Colonial First State Super', type: 'Super', entity: 'Personal', value: 680000, change: 2.3 },
      { id: 2, name: 'Managed Portfolio - Macquarie', type: 'Managed Fund', entity: 'Personal', value: 420000, change: 3.1 },
      { id: 3, name: 'Term Deposits - CBA', type: 'Cash', entity: 'Personal', value: 250000, change: 4.5 },
      { id: 4, name: 'Government Bonds', type: 'Bonds', entity: 'Personal', value: 100000, change: 4.0 },
    ],
    liabilities: [],
    profile: {
      user_id: 'client_3', name: 'Robert Mitchell', first_name: 'Robert', last_name: 'Mitchell',
      partner_first_name: '', age: 62, retirementAge: 65, yearsToRetirement: 3,
      riskProfile: 'Conservative', incomeHousehold: 280000, expensesAnnual: 120000, children: 0, status: 'Single',
      email: 'r.mitchell@company.com', phone: '0434 567 890', address: '15 Elizabeth Street, Sydney NSW 2000',
      advisor: 'Sarah Chen', occupation: 'CFO', employer: 'Mitchell & Associates',
    },
    retirement: { current_age: 62, retirement_age: 65, life_expectancy: 90, annual_contributions: 27500, retirement_spending: 85000 },
    rebalancing: [
      { asset: 'Super', current: 47, target: 40, diff: 7, action: 'Review' },
      { asset: 'Managed Funds', current: 29, target: 30, diff: -1, action: 'Hold' },
      { asset: 'Cash', current: 17, target: 20, diff: -3, action: 'Buy' },
      { asset: 'Bonds', current: 7, target: 10, diff: -3, action: 'Buy' },
    ],
    budget: { monthlyIncome: 23333, monthlyExpenses: 10000, savingsRate: 57.1 },
  },
  client_4: {
    assets: [
      { id: 1, name: 'Emma - Sunsuper', type: 'Super', entity: 'Super', value: 145000, change: 9.2 },
      { id: 2, name: 'David - AustralianSuper', type: 'Super', entity: 'Super', value: 165000, change: 8.8 },
      { id: 3, name: 'Family Home - Fitzroy', type: 'Property', entity: 'Joint', value: 720000, change: 3.5 },
      { id: 4, name: 'Savings Account - ING', type: 'Cash', entity: 'Joint', value: 35000, change: 4.2 },
    ],
    liabilities: [{ id: 1, name: 'Home Loan - Westpac', type: 'Mortgage', value: 450000, rate: 6.29 }],
    profile: {
      user_id: 'client_4', name: 'Emma & David Williams', first_name: 'Emma', last_name: 'Williams',
      partner_first_name: 'David', age: 39, retirementAge: 67, yearsToRetirement: 28,
      riskProfile: 'TBD', incomeHousehold: 155000, expensesAnnual: 95000, children: 1, status: 'Married',
      email: 'emma.williams@email.com', phone: '0445 678 901', address: '8 Rose Street, Fitzroy VIC 3065',
      advisor: 'Sarah Chen', occupation: 'Marketing Manager', employer: 'Telstra',
    },
    retirement: { current_age: 39, retirement_age: 67, life_expectancy: 92, annual_contributions: 30000, retirement_spending: 65000 },
    rebalancing: [
      { asset: 'Super', current: 29, target: 30, diff: -1, action: 'Hold' },
      { asset: 'Property', current: 68, target: 50, diff: 18, action: 'Review' },
      { asset: 'Cash', current: 3, target: 20, diff: -17, action: 'Buy' },
    ],
    budget: { monthlyIncome: 12917, monthlyExpenses: 7917, savingsRate: 38.7 },
  },
  client_5: {
    assets: [
      { id: 1, name: 'Patel Family SMSF', type: 'SMSF', entity: 'Trust', value: 2400000, change: 6.7 },
      { id: 2, name: 'Commercial Property - Parramatta', type: 'Property', entity: 'Trust', value: 850000, change: 4.2 },
      { id: 3, name: 'Raj - Personal Super', type: 'Super', entity: 'Personal', value: 180000, change: 7.5 },
      { id: 4, name: 'Cash Buffer', type: 'Cash', entity: 'Trust', value: 120000, change: 4.3 },
    ],
    liabilities: [{ id: 1, name: 'SMSF Limited Recourse Loan', type: 'Loan', value: 450000, rate: 7.19 }],
    profile: {
      user_id: 'client_5', name: 'Raj & Priya Patel', first_name: 'Raj', last_name: 'Patel',
      partner_first_name: 'Priya', age: 54, retirementAge: 60, yearsToRetirement: 6,
      riskProfile: 'Aggressive', incomeHousehold: 320000, expensesAnnual: 150000, children: 2, status: 'Married',
      email: 'raj.patel@email.com', phone: '0456 789 012', address: '22 Pacific Hwy, Parramatta NSW 2150',
      advisor: 'Sarah Chen', occupation: 'Surgeon', employer: 'Westmead Hospital',
    },
    retirement: { current_age: 54, retirement_age: 60, life_expectancy: 90, annual_contributions: 55000, retirement_spending: 100000 },
    rebalancing: [
      { asset: 'SMSF', current: 68, target: 60, diff: 8, action: 'Sell' },
      { asset: 'Property', current: 24, target: 20, diff: 4, action: 'Review' },
      { asset: 'Super', current: 5, target: 10, diff: -5, action: 'Buy' },
      { asset: 'Cash', current: 3, target: 10, diff: -7, action: 'Buy' },
    ],
    budget: { monthlyIncome: 26667, monthlyExpenses: 12500, savingsRate: 53.1 },
  },
  client_6: {
    assets: [
      { id: 1, name: 'Anderson Partnership Fund', type: 'Managed Fund', entity: 'Partnership', value: 2800000, change: 5.2 },
      { id: 2, name: 'John - AMP Super', type: 'Super', entity: 'Personal', value: 520000, change: 6.8 },
      { id: 3, name: 'Partner - REST Super', type: 'Super', entity: 'Personal', value: 380000, change: 6.1 },
      { id: 4, name: 'Office Property - CBD', type: 'Property', entity: 'Partnership', value: 950000, change: 2.8 },
      { id: 5, name: 'Cash Management', type: 'Cash', entity: 'Partnership', value: 200000, change: 4.5 },
    ],
    liabilities: [{ id: 1, name: 'Commercial Loan - NAB', type: 'Loan', value: 650000, rate: 6.89 }],
    profile: {
      user_id: 'client_6', name: 'Anderson Partnership', first_name: 'John', last_name: 'Anderson',
      partner_first_name: '', age: 59, retirementAge: 65, yearsToRetirement: 6,
      riskProfile: 'Balanced', incomeHousehold: 380000, expensesAnnual: 200000, children: 0, status: 'Partnered',
      email: 'john.anderson@lawfirm.com.au', phone: '0467 890 123', address: '100 Collins St, Melbourne VIC 3000',
      advisor: 'Sarah Chen', occupation: 'Managing Partner', employer: 'Anderson & Co',
    },
    retirement: { current_age: 59, retirement_age: 65, life_expectancy: 90, annual_contributions: 55000, retirement_spending: 110000 },
    rebalancing: [
      { asset: 'Partnership', current: 58, target: 50, diff: 8, action: 'Sell' },
      { asset: 'Super', current: 19, target: 20, diff: -1, action: 'Hold' },
      { asset: 'Property', current: 20, target: 20, diff: 0, action: 'Hold' },
      { asset: 'Cash', current: 4, target: 10, diff: -6, action: 'Buy' },
    ],
    budget: { monthlyIncome: 31667, monthlyExpenses: 16667, savingsRate: 47.4 },
  },
  client_7: {
    assets: [
      { id: 1, name: 'Sarah - Hostplus Super', type: 'Super', entity: 'Personal', value: 120000, change: 11.2 },
      { id: 2, name: 'Growth Share Portfolio', type: 'Shares', entity: 'Personal', value: 380000, change: 15.3 },
      { id: 3, name: 'Startup Equity (vested)', type: 'Other', entity: 'Personal', value: 850000, change: 22.0 },
      { id: 4, name: 'Apartment - Melbourne CBD', type: 'Property', entity: 'Personal', value: 650000, change: 2.1 },
      { id: 5, name: 'Emergency Fund', type: 'Cash', entity: 'Personal', value: 45000, change: 4.5 },
    ],
    liabilities: [{ id: 1, name: 'Investment Loan - CBA', type: 'Mortgage', value: 420000, rate: 6.39 }],
    profile: {
      user_id: 'client_7', name: 'Sarah Kim', first_name: 'Sarah', last_name: 'Kim',
      partner_first_name: '', age: 34, retirementAge: 55, yearsToRetirement: 21,
      riskProfile: 'Aggressive', incomeHousehold: 210000, expensesAnnual: 95000, children: 0, status: 'Single',
      email: 'sarah.kim@startup.io', phone: '0478 901 234', address: '45 Flinders Lane, Melbourne VIC 3000',
      advisor: 'Sarah Chen', occupation: 'CTO', employer: 'TechStartup Pty Ltd',
    },
    retirement: { current_age: 34, retirement_age: 55, life_expectancy: 95, annual_contributions: 35000, retirement_spending: 80000 },
    rebalancing: [
      { asset: 'Shares', current: 19, target: 25, diff: -6, action: 'Buy' },
      { asset: 'Startup', current: 42, target: 30, diff: 12, action: 'Review' },
      { asset: 'Property', current: 32, target: 25, diff: 7, action: 'Review' },
      { asset: 'Super', current: 6, target: 10, diff: -4, action: 'Buy' },
      { asset: 'Cash', current: 2, target: 10, diff: -8, action: 'Buy' },
    ],
    budget: { monthlyIncome: 17500, monthlyExpenses: 7917, savingsRate: 54.8 },
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
