import { useState, useEffect, createContext, useContext, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Dashboard from "@/pages/Dashboard";
import TaxAnalysisSync from "@/pages/TaxAnalysisSync";
import PropertyPortfolio from "@/pages/PropertyPortfolio";
import MonteCarloSimulation from "@/pages/MonteCarloSimulation";
import LoanCalculator from "@/pages/LoanCalculator";
import SavedScenarios from "@/pages/SavedScenarios";
import ScenarioBuilder from "@/pages/ScenarioBuilder";
import CGT from "@/pages/CGT";
import HistoricalTaxComparison from "@/pages/HistoricalTaxComparison";
import SMSFOptimizer from "@/pages/SMSFOptimizer";
import ReportGenerator from "@/pages/ReportGenerator";
import SalaryPackaging from "@/pages/SalaryPackaging";
import PropertyComparison from "@/pages/PropertyComparison";
import ScenarioComparison from "@/pages/ScenarioComparison";
import TaxLossHarvesting from "@/pages/TaxLossHarvesting";
import DividendReinvestment from "@/pages/DividendReinvestment";
import HouseholdBudget from "@/pages/HouseholdBudget";
import IncomeSplitting from "@/pages/IncomeSplitting";
import Division7ACalculator from "@/pages/Division7ACalculator";
import TrustDistributionAnalysis from "@/pages/TrustDistributionAnalysis";
import FinancialRecommendations from "@/pages/FinancialRecommendations";
import TaxCalendar from "@/pages/TaxCalendar";
import FamilyOverview from "@/pages/FamilyOverview";
import SharePortfolio from "@/pages/SharePortfolio";
import CalculationMethodology from "@/pages/CalculationMethodology";
import SuperannuationGuarantee from "@/pages/SuperannuationGuarantee";
import RentalYieldOptimizer from "@/pages/RentalYieldOptimizer";
import HoldingsPerformance from "@/pages/HoldingsPerformance";
import ExportData from "@/pages/ExportData";
import AdvancedScenarioModeling from "@/pages/AdvancedScenarioModeling";
import FamilyMemberProfile from "@/pages/FamilyMemberProfile";
import FamilyWealthDashboard from "@/pages/FamilyWealthDashboard";
import LifecyclePlanning from "@/pages/LifecyclePlanning";
import FinancialAdvisorChat from "@/pages/FinancialAdvisorChat";
import StrategicPlanning from "@/pages/StrategicPlanning";
import DataImport from "@/pages/DataImport";
import BankFeeds from "@/pages/BankFeeds";
import AccountingIntegrations from "@/pages/AccountingIntegrations";

// Compliance Modal
import { ComplianceModal } from "@/components/ComplianceDisclaimer";

// Portfolio Context for sharing data across components
const PortfolioContext = createContext(null);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

// Default Family Members (shared across Trust, Income Splitting, Tax Analysis, Budget)
const DEFAULT_FAMILY_MEMBERS = [
  { 
    id: 1, 
    name: "James Wheeler", 
    relationship: "primary",
    age: 45,
    taxableIncome: 120000,
    salaryIncome: 120000,
    dividendIncome: 8500,
    rentalIncome: 18000,
    otherIncome: 0,
    deductions: 5200,
    superBalance: 320000,
    isTrustBeneficiary: true,
    trustDistribution: 30
  },
  { 
    id: 2, 
    name: "Sarah Wheeler", 
    relationship: "spouse",
    age: 43,
    taxableIncome: 65000,
    salaryIncome: 65000,
    dividendIncome: 4200,
    rentalIncome: 18000,
    otherIncome: 0,
    deductions: 2800,
    superBalance: 260000,
    isTrustBeneficiary: true,
    trustDistribution: 30
  },
  { 
    id: 3, 
    name: "Emily Wheeler", 
    relationship: "adult_child",
    age: 22,
    taxableIncome: 25000,
    salaryIncome: 25000,
    dividendIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    deductions: 0,
    superBalance: 15000,
    isTrustBeneficiary: true,
    trustDistribution: 20
  },
  { 
    id: 4, 
    name: "Michael Wheeler", 
    relationship: "adult_child",
    age: 19,
    taxableIncome: 0,
    salaryIncome: 0,
    dividendIncome: 0,
    rentalIncome: 0,
    otherIncome: 0,
    deductions: 0,
    superBalance: 5000,
    isTrustBeneficiary: true,
    trustDistribution: 20
  }
];

// Default Trust Configuration
const DEFAULT_TRUST = {
  name: "Wheeler Family Trust",
  type: "discretionary",
  netIncome: 150000,
  financialYear: "2024-25",
  companyDividendsReceived: 0 // Dividends from company distributed to trust
};

// Default Company Structure
const DEFAULT_COMPANY = {
  name: "Wheeler Investments Pty Ltd",
  abn: "12 345 678 901",
  acn: "123 456 789",
  isBaseRateEntity: true, // Under $50M aggregated turnover, 25% tax rate
  taxRate: 0.25,
  frankingAccountBalance: 45000,
  retainedEarnings: 180000,
  financialYear: "2024-25"
};

// Default Share Portfolio with ownership types
const DEFAULT_SHARE_PORTFOLIO = [
  // Personal Holdings
  { 
    id: 1, 
    symbol: "CBA", 
    name: "Commonwealth Bank", 
    ownership: "personal", 
    ownerId: 1, // James Wheeler
    quantity: 200, 
    purchasePrice: 98.50, 
    currentPrice: 118.50, 
    purchaseDate: "2022-03-15",
    dividendYield: 4.2,
    frankingPercentage: 100,
    sector: "Financials"
  },
  { 
    id: 2, 
    symbol: "BHP", 
    name: "BHP Group", 
    ownership: "personal",
    ownerId: 1, // James Wheeler
    quantity: 300, 
    purchasePrice: 45.20, 
    currentPrice: 42.80, 
    purchaseDate: "2023-06-20",
    dividendYield: 5.8,
    frankingPercentage: 100,
    sector: "Materials"
  },
  // Joint Holdings (50/50 James & Sarah)
  { 
    id: 3, 
    symbol: "VAS", 
    name: "Vanguard Australian Shares ETF", 
    ownership: "joint",
    ownerId: null, // Split between primary & spouse
    quantity: 500, 
    purchasePrice: 88.00, 
    currentPrice: 96.50, 
    purchaseDate: "2022-08-01",
    dividendYield: 3.8,
    frankingPercentage: 85,
    sector: "ETF"
  },
  { 
    id: 4, 
    symbol: "CSL", 
    name: "CSL Limited", 
    ownership: "joint",
    ownerId: null,
    quantity: 50, 
    purchasePrice: 285.00, 
    currentPrice: 298.00, 
    purchaseDate: "2024-01-10",
    dividendYield: 1.2,
    frankingPercentage: 100,
    sector: "Healthcare"
  },
  // Company Holdings
  { 
    id: 5, 
    symbol: "WBC", 
    name: "Westpac Banking", 
    ownership: "company",
    ownerId: null,
    quantity: 1000, 
    purchasePrice: 22.50, 
    currentPrice: 26.80, 
    purchaseDate: "2023-02-15",
    dividendYield: 5.2,
    frankingPercentage: 100,
    sector: "Financials"
  },
  { 
    id: 6, 
    symbol: "TLS", 
    name: "Telstra Group", 
    ownership: "company",
    ownerId: null,
    quantity: 2000, 
    purchasePrice: 3.85, 
    currentPrice: 4.05, 
    purchaseDate: "2023-05-20",
    dividendYield: 4.4,
    frankingPercentage: 100,
    sector: "Telecommunications"
  },
  // Spouse Personal Holdings
  { 
    id: 7, 
    symbol: "WOW", 
    name: "Woolworths Group", 
    ownership: "personal",
    ownerId: 2, // Sarah Wheeler
    quantity: 150, 
    purchasePrice: 36.50, 
    currentPrice: 31.20, 
    purchaseDate: "2023-09-10",
    dividendYield: 3.5,
    frankingPercentage: 100,
    sector: "Consumer Staples"
  }
];

// Default Household Budget
const DEFAULT_BUDGET = {
  frequency: "monthly",
  income: {
    salary1: 10000,
    salary2: 5417,
    rental: 3000,
    dividends: 1058,
    other: 0
  },
  expenses: {
    mortgage: 4200,
    utilities: 450,
    groceries: 1200,
    transport: 800,
    insurance: 650,
    schoolFees: 2333,
    childcare: 0,
    entertainment: 600,
    dining: 400,
    subscriptions: 150,
    clothing: 300,
    medical: 200,
    other: 500
  }
};

// Default Portfolio Data
const DEFAULT_PORTFOLIO = {
  personal: {
    name: "Wheeler Family",
    age: 45,
    taxableIncome: 185000,
    entityType: "personal"
  },
  investments: {
    cash_savings: 75000,
    term_deposit_amount: 150000,
    term_deposit_rate: 4.8,
    shares_value: 320000,
    shares_dividend_yield: 4.2,
    franking_percentage: 85,
    bonds_value: 80000,
    bonds_yield: 5.2,
    etf_value: 145000,
    etf_yield: 3.5,
    smsf_balance: 580000,
    properties: [
      {
        property_id: "prop_001",
        name: "Sydney Investment Unit",
        value: 850000,
        rental_income: 36000,
        mortgage_amount: 510000,
        mortgage_rate: 6.29,
        mortgage_term_years: 25,
        annual_expenses: 8500,
        depreciation_building: 6500,
        depreciation_fixtures: 3200
      },
      {
        property_id: "prop_002",
        name: "Melbourne Townhouse",
        value: 720000,
        rental_income: 32000,
        mortgage_amount: 432000,
        mortgage_rate: 6.15,
        mortgage_term_years: 28,
        annual_expenses: 7200,
        depreciation_building: 5800,
        depreciation_fixtures: 2800
      }
    ]
  },
  expenses: {
    school_fees: 28000,
    childcare: 0,
    health_insurance: 4200,
    private_expenses: 65000,
    work_related: 3500,
    other_deductible: 2200
  },
  summary: {
    totalAssets: 2920000,
    totalDebt: 942000,
    netWorth: 1978000,
    annualIncome: 253400,
    totalTax: 58200,
    netIncome: 195200
  }
};

// Investment Recommendations
const RECOMMENDATIONS = [
  {
    id: 1,
    type: "tax_optimization",
    priority: "high",
    title: "Maximize Salary Sacrifice",
    description: "You have $5,000 unused concessional cap. Salary sacrificing this amount saves $1,850 in tax (37% → 15%).",
    impact: "+$1,850/year",
    action: "Increase salary sacrifice to $25,000"
  },
  {
    id: 2,
    type: "property",
    priority: "high",
    title: "Negative Gearing Tax Benefit",
    description: "Your Sydney property generates $12,400 annual tax deduction. Consider a depreciation schedule review.",
    impact: "+$4,588/year",
    action: "Get updated depreciation report"
  },
  {
    id: 3,
    type: "diversification",
    priority: "medium",
    title: "Rebalance to International ETFs",
    description: "Portfolio is 85% Australian assets. Consider 20% allocation to international markets for diversification.",
    impact: "Reduced risk",
    action: "Allocate $58,000 to VGS/IVV"
  },
  {
    id: 4,
    type: "super",
    priority: "medium",
    title: "Spouse Contribution Benefit",
    description: "If spouse earns under $37,000, contribute $3,000 to their super for $540 tax offset.",
    impact: "+$540/year",
    action: "Make spouse super contribution"
  },
  {
    id: 5,
    type: "cgt",
    priority: "low",
    title: "CGT Timing Strategy",
    description: "Shares held for 11 months. Wait 1 more month for 50% CGT discount if selling.",
    impact: "50% CGT reduction",
    action: "Defer any sales by 30 days"
  },
  {
    id: 6,
    type: "debt",
    priority: "medium",
    title: "Debt Recycling Opportunity",
    description: "Convert $75k non-deductible savings to investment loan. Interest becomes tax deductible.",
    impact: "+$2,775/year",
    action: "Consult mortgage broker"
  }
];

const PortfolioProvider = ({ children }) => {
  // Core portfolio state
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [recommendations, setRecommendations] = useState(RECOMMENDATIONS);
  
  // Shared family data state
  const [familyMembers, setFamilyMembers] = useState(DEFAULT_FAMILY_MEMBERS);
  const [trust, setTrust] = useState(DEFAULT_TRUST);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [sharePortfolio, setSharePortfolio] = useState(DEFAULT_SHARE_PORTFOLIO);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("wheelerFamilyData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.familyMembers) setFamilyMembers(parsed.familyMembers);
        if (parsed.trust) setTrust(parsed.trust);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.portfolio) setPortfolio(parsed.portfolio);
        if (parsed.sharePortfolio) setSharePortfolio(parsed.sharePortfolio);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.lastSaved) setLastSaved(parsed.lastSaved);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, []);

  // Update family member
  const updateFamilyMember = useCallback((id, updates) => {
    setFamilyMembers(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
    setHasUnsavedChanges(true);
  }, []);

  // Add family member
  const addFamilyMember = useCallback((member) => {
    const newMember = {
      id: Date.now(),
      name: member.name || "New Member",
      relationship: member.relationship || "other",
      age: member.age || 0,
      taxableIncome: 0,
      salaryIncome: 0,
      dividendIncome: 0,
      rentalIncome: 0,
      otherIncome: 0,
      deductions: 0,
      superBalance: 0,
      isTrustBeneficiary: false,
      trustDistribution: 0,
      ...member
    };
    setFamilyMembers(prev => [...prev, newMember]);
    setHasUnsavedChanges(true);
    return newMember;
  }, []);

  // Remove family member
  const removeFamilyMember = useCallback((id) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
    setHasUnsavedChanges(true);
  }, []);

  // Update trust
  const updateTrust = useCallback((updates) => {
    setTrust(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Update budget
  const updateBudget = useCallback((category, field, value) => {
    setBudget(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Set budget frequency
  const setBudgetFrequency = useCallback((frequency) => {
    setBudget(prev => ({ ...prev, frequency }));
    setHasUnsavedChanges(true);
  }, []);

  // Save all data
  const saveAllData = useCallback(() => {
    const dataToSave = {
      familyMembers,
      trust,
      budget,
      portfolio,
      sharePortfolio,
      company,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem("wheelerFamilyData", JSON.stringify(dataToSave));
    setHasUnsavedChanges(false);
    setLastSaved(dataToSave.lastSaved);
    toast.success("All changes saved successfully");
  }, [familyMembers, trust, budget, portfolio, sharePortfolio, company]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setFamilyMembers(DEFAULT_FAMILY_MEMBERS);
    setTrust(DEFAULT_TRUST);
    setBudget(DEFAULT_BUDGET);
    setPortfolio(DEFAULT_PORTFOLIO);
    setSharePortfolio(DEFAULT_SHARE_PORTFOLIO);
    setCompany(DEFAULT_COMPANY);
    setHasUnsavedChanges(true);
    toast.info("Reset to default values");
  }, []);

  // Share Portfolio functions
  const addShare = useCallback((share) => {
    const newShare = {
      id: Date.now(),
      ...share
    };
    setSharePortfolio(prev => [...prev, newShare]);
    setHasUnsavedChanges(true);
    return newShare;
  }, []);

  const updateShare = useCallback((id, updates) => {
    setSharePortfolio(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
    setHasUnsavedChanges(true);
  }, []);

  const removeShare = useCallback((id) => {
    setSharePortfolio(prev => prev.filter(s => s.id !== id));
    setHasUnsavedChanges(true);
  }, []);

  // Update company
  const updateCompany = useCallback((updates) => {
    setCompany(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Calculate dividend income by ownership type
  const getDividendsByOwnership = useCallback(() => {
    const dividends = {
      personal: {}, // { memberId: { gross, franking, net } }
      joint: { gross: 0, franking: 0, net: 0 },
      company: { gross: 0, franking: 0, net: 0 }
    };

    sharePortfolio.forEach(share => {
      const grossDividend = share.quantity * share.currentPrice * (share.dividendYield / 100);
      const frankingCredit = grossDividend * (share.frankingPercentage / 100) * (company.taxRate / (1 - company.taxRate));
      
      if (share.ownership === 'personal') {
        const ownerId = share.ownerId;
        if (!dividends.personal[ownerId]) {
          dividends.personal[ownerId] = { gross: 0, franking: 0, net: 0 };
        }
        dividends.personal[ownerId].gross += grossDividend;
        dividends.personal[ownerId].franking += frankingCredit;
        dividends.personal[ownerId].net += grossDividend + frankingCredit;
      } else if (share.ownership === 'joint') {
        dividends.joint.gross += grossDividend;
        dividends.joint.franking += frankingCredit;
        dividends.joint.net += grossDividend + frankingCredit;
      } else if (share.ownership === 'company') {
        dividends.company.gross += grossDividend;
        dividends.company.franking += frankingCredit;
        dividends.company.net += grossDividend + frankingCredit;
      }
    });

    return dividends;
  }, [sharePortfolio, company.taxRate]);

  // Get shares by ownership type
  const getSharesByOwnership = useCallback((ownership) => {
    return sharePortfolio.filter(s => s.ownership === ownership);
  }, [sharePortfolio]);

  // Calculate total portfolio value by ownership
  const getPortfolioValueByOwnership = useCallback(() => {
    const values = { personal: 0, joint: 0, company: 0, total: 0 };
    sharePortfolio.forEach(share => {
      const value = share.quantity * share.currentPrice;
      values[share.ownership] += value;
      values.total += value;
    });
    return values;
  }, [sharePortfolio]);

  // Get trust beneficiaries
  const getTrustBeneficiaries = useCallback(() => {
    return familyMembers.filter(m => m.isTrustBeneficiary);
  }, [familyMembers]);

  // Get primary earners (for tax analysis)
  const getPrimaryEarners = useCallback(() => {
    return familyMembers.filter(m => 
      m.relationship === "primary" || m.relationship === "spouse"
    );
  }, [familyMembers]);

  // Calculate total family income
  const getTotalFamilyIncome = useCallback(() => {
    return familyMembers.reduce((sum, m) => sum + (m.taxableIncome || 0), 0);
  }, [familyMembers]);

  // Calculate monthly cashflow
  const getMonthlyCashflow = useCallback(() => {
    const totalIncome = Object.values(budget.income).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
    return {
      income: totalIncome,
      expenses: totalExpenses,
      surplus: totalIncome - totalExpenses
    };
  }, [budget]);

  // Generate 12-month cashflow projection
  const getCashflowProjection = useCallback(() => {
    const monthly = getMonthlyCashflow();
    const projection = [];
    let cumulativeSavings = portfolio.investments.cash_savings;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth + i) % 12;
      cumulativeSavings += monthly.surplus;
      
      projection.push({
        month: months[monthIndex],
        income: monthly.income,
        expenses: monthly.expenses,
        surplus: monthly.surplus,
        cumulativeSavings: Math.max(0, cumulativeSavings)
      });
    }
    
    return projection;
  }, [getMonthlyCashflow, portfolio.investments.cash_savings]);

  return (
    <PortfolioContext.Provider value={{ 
      // Original portfolio data
      portfolio, 
      setPortfolio, 
      recommendations, 
      setRecommendations,
      
      // Shared family data
      familyMembers,
      setFamilyMembers,
      updateFamilyMember,
      addFamilyMember,
      removeFamilyMember,
      
      // Trust data
      trust,
      setTrust,
      updateTrust,
      getTrustBeneficiaries,
      
      // Budget data
      budget,
      setBudget,
      updateBudget,
      setBudgetFrequency,
      
      // Share Portfolio data
      sharePortfolio,
      setSharePortfolio,
      addShare,
      updateShare,
      removeShare,
      getSharesByOwnership,
      getDividendsByOwnership,
      getPortfolioValueByOwnership,
      
      // Company data
      company,
      setCompany,
      updateCompany,
      
      // Derived data helpers
      getPrimaryEarners,
      getTotalFamilyIncome,
      getMonthlyCashflow,
      getCashflowProjection,
      
      // Save/Reset
      hasUnsavedChanges,
      lastSaved,
      saveAllData,
      resetToDefaults
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

// App Router Component
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/overview" element={<FamilyOverview />} />
      <Route path="/budget" element={<HouseholdBudget />} />
      <Route path="/tax-analysis" element={<TaxAnalysisSync />} />
      <Route path="/property-portfolio" element={<PropertyPortfolio />} />
      <Route path="/monte-carlo" element={<MonteCarloSimulation />} />
      <Route path="/loan-calculator" element={<LoanCalculator />} />
      <Route path="/scenarios" element={<SavedScenarios />} />
      <Route path="/scenario-builder" element={<ScenarioBuilder />} />
      <Route path="/scenario-builder/:scenarioId" element={<ScenarioBuilder />} />
      <Route path="/cgt" element={<CGT />} />
      <Route path="/cgt-calculator" element={<Navigate to="/cgt" replace />} />
      <Route path="/cgt-events" element={<Navigate to="/cgt" replace />} />
      <Route path="/historical-tax" element={<HistoricalTaxComparison />} />
      <Route path="/smsf-optimizer" element={<SMSFOptimizer />} />
      <Route path="/reports" element={<ReportGenerator />} />
      <Route path="/salary-packaging" element={<SalaryPackaging />} />
      <Route path="/property-comparison" element={<PropertyComparison />} />
      <Route path="/scenario-comparison" element={<Navigate to="/strategic-planning" replace />} />
      <Route path="/tax-loss-harvesting" element={<TaxLossHarvesting />} />
      <Route path="/dividend-reinvestment" element={<DividendReinvestment />} />
      <Route path="/income-splitting" element={<IncomeSplitting />} />
      <Route path="/division-7a" element={<Division7ACalculator />} />
      <Route path="/trust-distributions" element={<TrustDistributionAnalysis />} />
      <Route path="/recommendations" element={<FinancialRecommendations />} />
      <Route path="/tax-calendar" element={<TaxCalendar />} />
      <Route path="/share-portfolio" element={<SharePortfolio />} />
      <Route path="/holdings-performance" element={<HoldingsPerformance />} />
      <Route path="/calculation-methodology" element={<CalculationMethodology />} />
      <Route path="/sg-calculator" element={<SuperannuationGuarantee />} />
      <Route path="/rental-yield-optimizer" element={<RentalYieldOptimizer />} />
      <Route path="/export" element={<ExportData />} />
      <Route path="/tax-analysis-sync" element={<TaxAnalysisSync />} />
      <Route path="/scenario-modeling" element={<Navigate to="/strategic-planning" replace />} />
      <Route path="/family-member/:memberId" element={<FamilyMemberProfile />} />
      <Route path="/family-wealth" element={<FamilyWealthDashboard />} />
      <Route path="/lifecycle-planning" element={<Navigate to="/strategic-planning" replace />} />
      <Route path="/financial-advisor" element={<FinancialAdvisorChat />} />
      <Route path="/strategic-planning" element={<StrategicPlanning />} />
      <Route path="/data-import" element={<DataImport />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <PortfolioProvider>
          <ComplianceModal />
          <AppRouter />
          <Toaster position="top-right" richColors />
        </PortfolioProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
