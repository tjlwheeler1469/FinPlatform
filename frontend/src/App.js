import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Dashboard from "@/pages/Dashboard";
import TaxAnalysis from "@/pages/TaxAnalysis";
import PropertyPortfolio from "@/pages/PropertyPortfolio";
import MonteCarloSimulation from "@/pages/MonteCarloSimulation";
import LoanCalculator from "@/pages/LoanCalculator";
import SavedScenarios from "@/pages/SavedScenarios";
import ScenarioBuilder from "@/pages/ScenarioBuilder";
import CGTCalculator from "@/pages/CGTCalculator";
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
import CGTEventTracker from "@/pages/CGTEventTracker";
import TrustDistributionAnalysis from "@/pages/TrustDistributionAnalysis";
import FinancialRecommendations from "@/pages/FinancialRecommendations";

// Portfolio Context for sharing dummy data across components
const PortfolioContext = createContext(null);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

// Dummy Portfolio Data - Wheeler Family
const DUMMY_PORTFOLIO = {
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
  const [portfolio, setPortfolio] = useState(DUMMY_PORTFOLIO);
  const [recommendations, setRecommendations] = useState(RECOMMENDATIONS);

  return (
    <PortfolioContext.Provider value={{ portfolio, setPortfolio, recommendations, setRecommendations }}>
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
      <Route path="/budget" element={<HouseholdBudget />} />
      <Route path="/tax-analysis" element={<TaxAnalysis />} />
      <Route path="/property-portfolio" element={<PropertyPortfolio />} />
      <Route path="/monte-carlo" element={<MonteCarloSimulation />} />
      <Route path="/loan-calculator" element={<LoanCalculator />} />
      <Route path="/scenarios" element={<SavedScenarios />} />
      <Route path="/scenario-builder" element={<ScenarioBuilder />} />
      <Route path="/scenario-builder/:scenarioId" element={<ScenarioBuilder />} />
      <Route path="/cgt-calculator" element={<CGTCalculator />} />
      <Route path="/historical-tax" element={<HistoricalTaxComparison />} />
      <Route path="/smsf-optimizer" element={<SMSFOptimizer />} />
      <Route path="/reports" element={<ReportGenerator />} />
      <Route path="/salary-packaging" element={<SalaryPackaging />} />
      <Route path="/property-comparison" element={<PropertyComparison />} />
      <Route path="/scenario-comparison" element={<ScenarioComparison />} />
      <Route path="/tax-loss-harvesting" element={<TaxLossHarvesting />} />
      <Route path="/dividend-reinvestment" element={<DividendReinvestment />} />
      <Route path="/income-splitting" element={<IncomeSplitting />} />
      <Route path="/division-7a" element={<Division7ACalculator />} />
      <Route path="/cgt-events" element={<CGTEventTracker />} />
    </Routes>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <PortfolioProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </PortfolioProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
