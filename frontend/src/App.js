import { useState, useEffect, createContext, useContext, useCallback, lazy, Suspense } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { XplanSyncProvider, XplanSyncIndicator } from "@/components/XplanSyncNotification";
import { LanguageProvider } from "@/components/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";

// Retry wrapper for lazy imports — handles webpack chunk load failures
const hardReload = () => {
  try {
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } catch (e) { /* ignore */ }
  const url = new URL(window.location.href);
  url.searchParams.set("_cb", Date.now().toString());
  window.location.replace(url.toString());
};

const lazyRetry = (importFn) =>
  lazy(() =>
    importFn().catch(() =>
      new Promise((resolve) => setTimeout(resolve, 1500)).then(() =>
        importFn().catch(() => ({ default: () => (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="font-medium mb-2">This page failed to load.</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-md">
              A cached file may be stale. Try reloading, or clear your cache with Hard Refresh.
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 border rounded-md text-sm"
                onClick={() => window.location.reload()}
                data-testid="chunk-fallback-reload"
              >
                Reload
              </button>
              <button
                className="px-4 py-2 bg-[#1a2744] text-white rounded-md text-sm"
                onClick={hardReload}
                data-testid="chunk-fallback-hard-refresh"
              >
                Hard Refresh
              </button>
            </div>
          </div>
        )}))
      )
    )
  );

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Core pages (loaded immediately)
import Dashboard from "@/pages/Dashboard";
import ModeSelector from "@/pages/ModeSelector";

// Lazy loaded pages (loaded on demand)
const TaxAnalysisSync = lazyRetry(() => import("@/pages/TaxAnalysisSync"));
const PropertyPortfolio = lazyRetry(() => import("@/pages/PropertyPortfolio"));
const MonteCarloSimulation = lazyRetry(() => import("@/pages/MonteCarloSimulation"));
const LoanCalculator = lazyRetry(() => import("@/pages/LoanCalculator"));
const SavedScenarios = lazyRetry(() => import("@/pages/SavedScenarios"));
const ScenarioBuilder = lazyRetry(() => import("@/pages/ScenarioBuilder"));
const CGT = lazyRetry(() => import("@/pages/CGT"));
const HistoricalTaxComparison = lazyRetry(() => import("@/pages/HistoricalTaxComparison"));
const SMSFOptimizer = lazyRetry(() => import("@/pages/SMSFOptimizer"));
const ReportGenerator = lazyRetry(() => import("@/pages/ReportGenerator"));
const SalaryPackaging = lazyRetry(() => import("@/pages/SalaryPackaging"));
const PropertyComparison = lazyRetry(() => import("@/pages/PropertyComparison"));
const TaxLossHarvesting = lazyRetry(() => import("@/pages/TaxLossHarvesting"));
const DividendReinvestment = lazyRetry(() => import("@/pages/DividendReinvestment"));
const HouseholdBudget = lazyRetry(() => import("@/pages/HouseholdBudget"));
const IncomeSplitting = lazyRetry(() => import("@/pages/IncomeSplitting"));
const Division7ACalculator = lazyRetry(() => import("@/pages/Division7ACalculator"));
const TrustDistributionAnalysis = lazyRetry(() => import("@/pages/TrustDistributionAnalysis"));
const FinancialRecommendations = lazyRetry(() => import("@/pages/FinancialRecommendations"));
const TaxCalendar = lazyRetry(() => import("@/pages/TaxCalendar"));
const FamilyOverview = lazyRetry(() => import("@/pages/FamilyOverview"));
const SharePortfolio = lazyRetry(() => import("@/pages/SharePortfolio"));
const CalculationMethodology = lazyRetry(() => import("@/pages/CalculationMethodology"));
const SuperannuationGuarantee = lazyRetry(() => import("@/pages/SuperannuationGuarantee"));
const RentalYieldOptimizer = lazyRetry(() => import("@/pages/RentalYieldOptimizer"));
const HoldingsPerformance = lazyRetry(() => import("@/pages/HoldingsPerformance"));
const ExportData = lazyRetry(() => import("@/pages/ExportData"));
const FamilyMemberProfile = lazyRetry(() => import("@/pages/FamilyMemberProfile"));
const FamilyWealthDashboard = lazyRetry(() => import("@/pages/FamilyWealthDashboard"));
const FinancialAdvisorChat = lazyRetry(() => import("@/pages/FinancialAdvisorChat"));
const StrategicPlanning = lazyRetry(() => import("@/pages/StrategicPlanning"));
const DataImport = lazyRetry(() => import("@/pages/DataImport"));
const BankFeeds = lazyRetry(() => import("@/pages/BankFeeds"));
const AccountingIntegrations = lazyRetry(() => import("@/pages/AccountingIntegrations"));
const BASCalculator = lazyRetry(() => import("@/pages/BASCalculator"));
const Collaboration = lazyRetry(() => import("@/pages/Collaboration"));
const RiskProfiler = lazyRetry(() => import("@/pages/RiskProfiler"));
const StatementOfAdvice = lazyRetry(() => import("@/pages/StatementOfAdvice"));
const ClientOnboarding = lazyRetry(() => import("@/pages/ClientOnboarding"));
const Copilot = lazyRetry(() => import("@/pages/Copilot"));
const DailyBriefing = lazyRetry(() => import("@/pages/DailyBriefing"));
const PersonalDashboard = lazyRetry(() => import("@/pages/PersonalDashboard"));
const UnlistedInvestments = lazyRetry(() => import("@/pages/UnlistedInvestments"));
const UnifiedDashboard = lazyRetry(() => import("@/pages/UnifiedDashboard"));
const UnifiedInvestments = lazyRetry(() => import("@/pages/UnifiedInvestments"));
const AdviserDashboard = lazyRetry(() => import("@/pages/AdviserDashboard"));
const ClientPortalMerged = lazyRetry(() => import("@/pages/ClientPortalMerged"));
const PracticeManagement = lazyRetry(() => import("@/pages/PracticeManagement"));
const DocumentsCommunications = lazyRetry(() => import("@/pages/DocumentsCommunications"));
const PortfolioRebalancing = lazyRetry(() => import("@/pages/PortfolioRebalancing"));
const SecuritySettings = lazyRetry(() => import("@/pages/SecuritySettings"));
const NotificationSettings = lazyRetry(() => import("@/pages/NotificationSettings"));
const DataImportExportPage = lazyRetry(() => import("@/pages/DataImportExportPage"));
const InvestmentComparison = lazyRetry(() => import("@/pages/InvestmentComparison"));
const DecisionDashboard = lazyRetry(() => import("@/pages/DecisionDashboard"));
const DecisionEngine = lazyRetry(() => import("@/pages/DecisionEngine"));
const LifeTimeline = lazyRetry(() => import("@/pages/LifeTimeline"));
const LifeTimelinePlanner = lazyRetry(() => import("@/pages/LifeTimelinePlanner"));
const ClientCRM = lazyRetry(() => import("@/pages/ClientCRM"));
const GoalTracker = lazyRetry(() => import("@/pages/GoalTracker"));
const AIAdvisor = lazyRetry(() => import("@/pages/AIAdvisor"));
const PortfolioAggregator = lazyRetry(() => import("@/pages/PortfolioAggregator"));
const NetWorthTrend = lazyRetry(() => import("@/pages/NetWorthTrend"));
const InsuranceGapAnalysis = lazyRetry(() => import("@/pages/InsuranceGapAnalysis"));
const DebtPaydownPlanner = lazyRetry(() => import("@/pages/DebtPaydownPlanner"));
const RevenueBilling = lazyRetry(() => import("@/pages/RevenueBilling"));
const ScenarioComparison = lazyRetry(() => import("@/pages/ScenarioComparison"));
const ScenarioSimulator = lazyRetry(() => import("@/pages/ScenarioSimulator"));
const MarketData = lazyRetry(() => import("@/pages/MarketData"));
const AdviceWorkflow = lazyRetry(() => import("@/pages/AdviceWorkflow"));
const FinancialPlanGenerator = lazyRetry(() => import("@/pages/FinancialPlanGenerator"));
const MeetingSummaryGenerator = lazyRetry(() => import("@/pages/MeetingSummaryGenerator"));
const DocumentVault = lazyRetry(() => import("@/pages/DocumentVault"));
const EstatePlanning = lazyRetry(() => import("@/pages/EstatePlanning"));
const ProductMarketplace = lazyRetry(() => import("@/pages/ProductMarketplace"));
const PortfolioAnalyzer = lazyRetry(() => import("@/pages/PortfolioAnalyzer"));
const ConnectedAccounts = lazyRetry(() => import("@/pages/ConnectedAccounts"));
const ClientSetupWizard = lazyRetry(() => import("@/pages/ClientSetupWizard"));

// New AI-Powered Features
const AICopilot = lazyRetry(() => import("@/pages/AICopilot"));
const DecisionCenter = lazyRetry(() => import("@/pages/DecisionCenter"));
const ClientIntelligenceFeed = lazyRetry(() => import("@/pages/ClientIntelligenceFeed"));
const ClientPortal = lazyRetry(() => import("@/pages/ClientPortal"));
const SimpleClientPortal = lazyRetry(() => import("@/pages/SimpleClientPortal"));

// Super App Features - Meeting Prep, Research, Compliance, Wealth
const MeetingPrep = lazyRetry(() => import("@/pages/MeetingPrep"));
const StockResearch = lazyRetry(() => import("@/pages/StockResearch"));
const ComplianceCenter = lazyRetry(() => import("@/pages/ComplianceCenter"));
const WealthDashboard = lazyRetry(() => import("@/pages/WealthDashboard"));

// Client-Level Pages (within app, consistent design)
const ClientWealth = lazyRetry(() => import("@/pages/ClientWealth"));
const ClientCompliance = lazyRetry(() => import("@/pages/ClientCompliance"));
const AIInsights = lazyRetry(() => import("@/pages/AIInsights"));

// Command Center - Daily Adviser Hub
const CommandCenter = lazyRetry(() => import("@/pages/CommandCenter"));

// Cross-Client Intelligence Engine
const IntelligenceEngine = lazyRetry(() => import("@/pages/IntelligenceEngine"));

// Advisor Intelligence Dashboard - Daily Operating System
const AdvisorIntelligenceDashboard = lazyRetry(() => import("@/pages/AdvisorIntelligenceDashboard"));

// Ultimate Advisor Command Center - The Daily Operating System
const AdvisorCommandCenter = lazyRetry(() => import("@/pages/AdvisorCommandCenter"));

// Notification Center
const NotificationCenter = lazyRetry(() => import("@/pages/NotificationCenter"));

// Data Aggregators Research
const DataAggregators = lazyRetry(() => import("@/pages/DataAggregators"));

// Stock Trading with CGT
const StockTrading = lazyRetry(() => import("@/pages/StockTrading"));

// Macro Dashboard - Global Markets
const MacroDashboard = lazyRetry(() => import("@/pages/MacroDashboard"));

// Broker Research Reports
const BrokerResearch = lazyRetry(() => import("@/pages/BrokerResearch"));

// Workflow Engine
const WorkflowDashboard = lazyRetry(() => import("@/pages/WorkflowDashboard"));

// Book Intelligence
const BookIntelligence = lazyRetry(() => import("@/pages/BookIntelligence"));

// Meeting Automation
const MeetingAutomation = lazyRetry(() => import("@/pages/MeetingAutomation"));

// Batch Execution
const BatchExecution = lazyRetry(() => import("@/pages/BatchExecution"));

// Advanced AI Copilot
const AICopilotAdvanced = lazyRetry(() => import("@/pages/AICopilotAdvanced"));

// Feedback & Learning Analytics
const FeedbackAnalytics = lazyRetry(() => import("@/pages/FeedbackAnalytics"));

// Real-Time Data Layer
const RealtimeDataDashboard = lazyRetry(() => import("@/pages/RealtimeDataDashboard"));

// New Trading Pages
const BondsTrading = lazyRetry(() => import("@/pages/BondsTrading"));
const CashDeposits = lazyRetry(() => import("@/pages/CashDeposits"));
const ManagedFunds = lazyRetry(() => import("@/pages/ManagedFunds"));

// CRM Command Center
const CRMCommandCenter = lazyRetry(() => import("@/pages/CRMCommandCenter"));

// Client 360 View
const Client360View = lazyRetry(() => import("@/pages/Client360View"));

// Transaction Modeler
const TransactionModeler = lazyRetry(() => import("@/pages/TransactionModeler"));

// Next Best Actions
const NextBestActions = lazyRetry(() => import("@/pages/NextBestActions"));

// Meeting Notes with Fathom
const MeetingNotes = lazyRetry(() => import("@/pages/MeetingNotes"));

// Adviser Hub (Combined CRM)
const AdviserHub = lazyRetry(() => import("@/pages/AdviserHub"));

// Scenario Modelling (Combined Goals, Strategy, What-If)
const ScenarioModelling = lazyRetry(() => import("@/pages/ScenarioModelling"));

// Knowledge Graph Dashboard
const KnowledgeGraphDashboard = lazyRetry(() => import("@/pages/KnowledgeGraphDashboard"));

// Hybrids Trading
const HybridsTrading = lazyRetry(() => import("@/pages/HybridsTrading"));

// Crypto Portfolio
const CryptoPortfolio = lazyRetry(() => import("@/pages/CryptoPortfolio"));

// Xplan Integration
const XplanIntegration = lazyRetry(() => import("@/pages/XplanIntegration"));

// AdviceOS Dashboard - Compliance-First Decision Support
const AdviceOSDashboard = lazyRetry(() => import("@/pages/AdviceOSDashboard"));

// Compliance Dashboard - ASIC/APRA/ISO Compliance Center
const EnterpriseComplianceDashboard = lazyRetry(() => import("@/pages/EnterpriseComplianceDashboard"));

// Xplan Integration - Sync Page
const XplanSyncPage = lazyRetry(() => import("@/pages/XplanSyncPage"));

// Enterprise System of Record Features
const ReplayAdvicePage = lazyRetry(() => import("@/pages/ReplayAdvicePage"));
const CostReductionDashboard = lazyRetry(() => import("@/pages/CostReductionDashboard"));
const RiskControlMapping = lazyRetry(() => import("@/pages/RiskControlMapping"));
const BreachRegister = lazyRetry(() => import("@/pages/BreachRegister"));

// Retirement Calculator - SMSF Planning
const RetirementCalculator = lazyRetry(() => import("@/pages/RetirementCalculator"));

// Decumulation Calculator - Pension Phase Planning
const DecumulationCalculator = lazyRetry(() => import("@/pages/DecumulationCalculator"));

// Unified Retirement Planner - Comprehensive retirement planning
const RetirementPlanner = lazyRetry(() => import("@/pages/RetirementPlanner"));

// Platform Integrations - AMP North, Netwealth, Hub24, Class, IRESS
const PlatformIntegrations = lazyRetry(() => import("@/pages/PlatformIntegrations"));

// Live Sync Dashboard - Real-time platform updates
const LiveSyncDashboard = lazyRetry(() => import("@/pages/LiveSyncDashboard"));

// Client Financial Dashboard - Budget, expenses, goals, milestones
const ClientFinancialDashboard = lazyRetry(() => import("@/pages/ClientFinancialDashboard"));

// Adviser Compliance Dashboard - SOA/ROA tracking
const AdviserComplianceDashboard = lazyRetry(() => import("@/pages/AdviserComplianceDashboard"));

// Notification Center - Push notifications management
const NotificationCenterPage = lazyRetry(() => import("@/pages/NotificationCenterPage"));

// Stress Test Dashboard - Load testing for 20,000+ users
const StressTestDashboard = lazyRetry(() => import("@/pages/StressTestDashboard"));

// Retirement Confidence Engine - Monte Carlo simulations, 7-phase retirement planning
const RetirementConfidenceEngine = lazyRetry(() => import("@/pages/RetirementConfidenceEngine"));

// Hybrid Engine - World-class 19-section retirement calculation engine
const HybridEngineView = lazyRetry(() => import("@/pages/HybridEngineView"));

// Combined Retirement Confidence (Quick + Advanced toggle)
const RetirementConfidence = lazyRetry(() => import("@/pages/RetirementConfidence"));

// Contexts
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AuthProvider } from "@/context/AuthContext";

// Auth components
const Login = lazyRetry(() => import("@/pages/Login"));

// Consolidated pages
const UnifiedTaxCentre = lazyRetry(() => import("@/pages/UnifiedTaxCentre"));
const UnifiedResearchCentre = lazyRetry(() => import("@/pages/UnifiedResearchCentre"));
const UnifiedComplianceCentre = lazyRetry(() => import("@/pages/UnifiedComplianceCentre"));
const UnifiedGoalsPlanning = lazyRetry(() => import("@/pages/UnifiedGoalsPlanning"));
const UnifiedClientOverview = lazyRetry(() => import("@/pages/UnifiedClientOverview"));
const ClientHealthDashboard = lazyRetry(() => import("@/pages/ClientHealthDashboard"));
const ClientComparison = lazyRetry(() => import("@/pages/ClientComparison"));

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
// Per-client family member datasets
const CLIENT_FAMILY_DATA = {
  client_1: {
    familyMembers: [
      { id: 1, name: "David Thompson", relationship: "primary", age: 50, taxableIncome: 120000, salaryIncome: 120000, dividendIncome: 3500, rentalIncome: 16000, otherIncome: 0, deductions: 5200, superBalance: 245000, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 2, name: "Sarah Thompson", relationship: "spouse", age: 48, taxableIncome: 65000, salaryIncome: 65000, dividendIncome: 2000, rentalIncome: 16000, otherIncome: 0, deductions: 2800, superBalance: 198000, isTrustBeneficiary: false, trustDistribution: 0 }
    ],
    trust: { name: "Thompson Family Trust", type: "discretionary", netIncome: 0, financialYear: "2024-25", companyDividendsReceived: 0 },
    company: { name: "Thompson Investments Pty Ltd", abn: "12 345 678 901", acn: "123 456 789", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 0, retainedEarnings: 0, financialYear: "2024-25" }
  },
  client_2: {
    familyMembers: [
      { id: 1, name: "Michael Chen", relationship: "primary", age: 52, taxableIncome: 185000, salaryIncome: 185000, dividendIncome: 12000, rentalIncome: 35000, otherIncome: 0, deductions: 8500, superBalance: 620000, isTrustBeneficiary: true, trustDistribution: 35 },
      { id: 2, name: "Lisa Chen", relationship: "spouse", age: 48, taxableIncome: 95000, salaryIncome: 95000, dividendIncome: 6000, rentalIncome: 35000, otherIncome: 0, deductions: 4200, superBalance: 480000, isTrustBeneficiary: true, trustDistribution: 35 },
      { id: 3, name: "Daniel Chen", relationship: "adult_child", age: 24, taxableIncome: 52000, salaryIncome: 52000, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 28000, isTrustBeneficiary: true, trustDistribution: 15 },
      { id: 4, name: "Sophie Chen", relationship: "adult_child", age: 20, taxableIncome: 12000, salaryIncome: 12000, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 8000, isTrustBeneficiary: true, trustDistribution: 15 }
    ],
    trust: { name: "Chen Family Trust", type: "discretionary", netIncome: 280000, financialYear: "2024-25", companyDividendsReceived: 15000 },
    company: { name: "Chen Holdings Pty Ltd", abn: "23 456 789 012", acn: "234 567 890", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 62000, retainedEarnings: 320000, financialYear: "2024-25" }
  },
  client_3: {
    familyMembers: [
      { id: 1, name: "Robert Mitchell", relationship: "primary", age: 58, taxableIncome: 145000, salaryIncome: 145000, dividendIncome: 9500, rentalIncome: 0, otherIncome: 0, deductions: 6800, superBalance: 680000, isTrustBeneficiary: false, trustDistribution: 0 }
    ],
    trust: { name: "Mitchell Family Trust", type: "discretionary", netIncome: 0, financialYear: "2024-25", companyDividendsReceived: 0 },
    company: { name: "Mitchell Consulting Pty Ltd", abn: "34 567 890 123", acn: "345 678 901", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 18000, retainedEarnings: 95000, financialYear: "2024-25" }
  },
  client_4: {
    familyMembers: [
      { id: 1, name: "David Williams", relationship: "primary", age: 38, taxableIncome: 110000, salaryIncome: 110000, dividendIncome: 3200, rentalIncome: 0, otherIncome: 0, deductions: 3500, superBalance: 220000, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 2, name: "Emma Williams", relationship: "spouse", age: 36, taxableIncome: 85000, salaryIncome: 85000, dividendIncome: 1800, rentalIncome: 0, otherIncome: 0, deductions: 2200, superBalance: 180000, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 3, name: "Lily Williams", relationship: "child", age: 8, taxableIncome: 0, salaryIncome: 0, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 0, isTrustBeneficiary: false, trustDistribution: 0 },
      { id: 4, name: "Jack Williams", relationship: "child", age: 5, taxableIncome: 0, salaryIncome: 0, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 0, isTrustBeneficiary: false, trustDistribution: 0 }
    ],
    trust: { name: "Williams Family Trust", type: "discretionary", netIncome: 0, financialYear: "2024-25", companyDividendsReceived: 0 },
    company: { name: "Williams Property Pty Ltd", abn: "45 678 901 234", acn: "456 789 012", isBaseRateEntity: true, taxRate: 0.25, frankingAccountBalance: 0, retainedEarnings: 0, financialYear: "2024-25" }
  },
  client_5: {
    familyMembers: [
      { id: 1, name: "Raj Patel", relationship: "primary", age: 48, taxableIncome: 210000, salaryIncome: 210000, dividendIncome: 18000, rentalIncome: 42000, otherIncome: 5000, deductions: 12000, superBalance: 1200000, isTrustBeneficiary: true, trustDistribution: 40 },
      { id: 2, name: "Priya Patel", relationship: "spouse", age: 45, taxableIncome: 78000, salaryIncome: 78000, dividendIncome: 8000, rentalIncome: 42000, otherIncome: 0, deductions: 5500, superBalance: 680000, isTrustBeneficiary: true, trustDistribution: 35 },
      { id: 3, name: "Aarav Patel", relationship: "adult_child", age: 22, taxableIncome: 45000, salaryIncome: 45000, dividendIncome: 0, rentalIncome: 0, otherIncome: 0, deductions: 0, superBalance: 22000, isTrustBeneficiary: true, trustDistribution: 25 }
    ],
    trust: { name: "Patel SMSF Trust", type: "smsf", netIncome: 320000, financialYear: "2024-25", companyDividendsReceived: 25000 },
    company: { name: "Patel Holdings Pty Ltd", abn: "56 789 012 345", acn: "567 890 123", isBaseRateEntity: false, taxRate: 0.30, frankingAccountBalance: 95000, retainedEarnings: 580000, financialYear: "2024-25" }
  }
};

// Default uses client_1 (Thompson) as fallback
const DEFAULT_FAMILY_MEMBERS = CLIENT_FAMILY_DATA.client_1.familyMembers;

// Default Trust Configuration (uses client_1 as fallback)
const DEFAULT_TRUST = CLIENT_FAMILY_DATA.client_1.trust;

// Default Company Structure (uses client_1 as fallback)
const DEFAULT_COMPANY = CLIENT_FAMILY_DATA.client_1.company;

// Per-client portfolio data for data flow consistency
const CLIENT_PORTFOLIO_DATA = {
  client_1: {
    personal: { name: "Thompson Family", age: 50, taxableIncome: 185000, entityType: "personal" },
    investments: { cash_savings: 28000, term_deposit_amount: 35000, term_deposit_rate: 4.8, shares_value: 84500, shares_dividend_yield: 4.2, franking_percentage: 85, bonds_value: 0, bonds_yield: 0, etf_value: 42000, etf_yield: 3.5, smsf_balance: 443000, properties: [
      { property_id: "prop_001", name: "Family Home - Glen Waverley", value: 985000, rental_income: 0, mortgage_amount: 285000, mortgage_rate: 6.19, mortgage_term_years: 25, annual_expenses: 8500, depreciation_building: 0, depreciation_fixtures: 0 },
      { property_id: "prop_002", name: "Investment Unit - Brunswick", value: 620000, rental_income: 32000, mortgage_amount: 380000, mortgage_rate: 6.49, mortgage_term_years: 28, annual_expenses: 7200, depreciation_building: 5800, depreciation_fixtures: 2800 }
    ]},
    summary: { totalAssets: 2278000, totalDebt: 669200, netWorth: 1608800, annualIncome: 185000, totalTax: 42000, netIncome: 143000 }
  },
  client_2: {
    personal: { name: "Chen Family Trust", age: 52, taxableIncome: 280000, entityType: "trust" },
    investments: { cash_savings: 180000, term_deposit_amount: 350000, term_deposit_rate: 4.9, shares_value: 680000, shares_dividend_yield: 3.8, franking_percentage: 90, bonds_value: 220000, bonds_yield: 5.4, etf_value: 420000, etf_yield: 3.2, smsf_balance: 1100000, properties: [
      { property_id: "prop_c2_1", name: "North Sydney Office", value: 1850000, rental_income: 85000, mortgage_amount: 920000, mortgage_rate: 6.1, mortgage_term_years: 20, annual_expenses: 18000, depreciation_building: 12000, depreciation_fixtures: 5500 },
      { property_id: "prop_c2_2", name: "Chatswood Apartment", value: 980000, rental_income: 42000, mortgage_amount: 490000, mortgage_rate: 5.95, mortgage_term_years: 25, annual_expenses: 9800, depreciation_building: 7200, depreciation_fixtures: 3100 }
    ]},
    summary: { totalAssets: 5780000, totalDebt: 1410000, netWorth: 4370000, annualIncome: 407000, totalTax: 98500, netIncome: 308500 }
  },
  client_3: {
    personal: { name: "Robert Mitchell", age: 58, taxableIncome: 145000, entityType: "personal" },
    investments: { cash_savings: 95000, term_deposit_amount: 200000, term_deposit_rate: 4.7, shares_value: 450000, shares_dividend_yield: 4.5, franking_percentage: 88, bonds_value: 150000, bonds_yield: 5.0, etf_value: 180000, etf_yield: 3.6, smsf_balance: 680000, properties: []},
    summary: { totalAssets: 1755000, totalDebt: 0, netWorth: 1755000, annualIncome: 154500, totalTax: 38200, netIncome: 116300 }
  },
  client_4: {
    personal: { name: "Williams Family", age: 38, taxableIncome: 195000, entityType: "personal" },
    investments: { cash_savings: 45000, term_deposit_amount: 80000, term_deposit_rate: 4.5, shares_value: 180000, shares_dividend_yield: 3.5, franking_percentage: 80, bonds_value: 50000, bonds_yield: 4.8, etf_value: 95000, etf_yield: 3.3, smsf_balance: 400000, properties: [
      { property_id: "prop_c4_1", name: "Brunswick Home", value: 1200000, rental_income: 0, mortgage_amount: 720000, mortgage_rate: 6.2, mortgage_term_years: 28, annual_expenses: 5000, depreciation_building: 0, depreciation_fixtures: 0 }
    ]},
    summary: { totalAssets: 2050000, totalDebt: 720000, netWorth: 1330000, annualIncome: 200000, totalTax: 52000, netIncome: 148000 }
  },
  client_5: {
    personal: { name: "Patel SMSF", age: 48, taxableIncome: 288000, entityType: "smsf" },
    investments: { cash_savings: 250000, term_deposit_amount: 500000, term_deposit_rate: 5.1, shares_value: 920000, shares_dividend_yield: 4.0, franking_percentage: 92, bonds_value: 350000, bonds_yield: 5.5, etf_value: 580000, etf_yield: 3.4, smsf_balance: 1880000, properties: [
      { property_id: "prop_c5_1", name: "Commercial Warehouse Dandenong", value: 2200000, rental_income: 120000, mortgage_amount: 880000, mortgage_rate: 5.8, mortgage_term_years: 15, annual_expenses: 22000, depreciation_building: 18000, depreciation_fixtures: 8000 },
      { property_id: "prop_c5_2", name: "Toorak Investment Unit", value: 1450000, rental_income: 58000, mortgage_amount: 580000, mortgage_rate: 6.0, mortgage_term_years: 22, annual_expenses: 12000, depreciation_building: 9500, depreciation_fixtures: 4200 }
    ]},
    summary: { totalAssets: 8130000, totalDebt: 1460000, netWorth: 6670000, annualIncome: 466000, totalTax: 125000, netIncome: 341000 }
  }
};

// Per-client share portfolios
const CLIENT_SHARE_DATA = {
  client_1: null, // will use DEFAULT_SHARE_PORTFOLIO_DATA
  client_2: [
    { id: 1, symbol: "ANZ", name: "ANZ Group", ownership: "personal", ownerId: 1, quantity: 400, purchasePrice: 24.50, currentPrice: 28.90, purchaseDate: "2022-01-10", dividendYield: 5.1, frankingPercentage: 100, sector: "Financials" },
    { id: 2, symbol: "WES", name: "Wesfarmers", ownership: "personal", ownerId: 1, quantity: 120, purchasePrice: 52.00, currentPrice: 65.40, purchaseDate: "2023-03-15", dividendYield: 3.2, frankingPercentage: 100, sector: "Consumer Discretionary" },
    { id: 3, symbol: "VGS", name: "Vanguard MSCI International", ownership: "joint", ownerId: null, quantity: 800, purchasePrice: 92.00, currentPrice: 108.50, purchaseDate: "2022-06-20", dividendYield: 2.1, frankingPercentage: 0, sector: "ETF" },
    { id: 4, symbol: "RIO", name: "Rio Tinto", ownership: "company", ownerId: null, quantity: 250, purchasePrice: 115.00, currentPrice: 122.30, purchaseDate: "2023-08-01", dividendYield: 6.5, frankingPercentage: 100, sector: "Materials" },
    { id: 5, symbol: "MQG", name: "Macquarie Group", ownership: "personal", ownerId: 2, quantity: 60, purchasePrice: 185.00, currentPrice: 210.50, purchaseDate: "2024-02-10", dividendYield: 3.8, frankingPercentage: 100, sector: "Financials" }
  ],
  client_3: [
    { id: 1, symbol: "CBA", name: "Commonwealth Bank", ownership: "personal", ownerId: 1, quantity: 350, purchasePrice: 95.00, currentPrice: 118.50, purchaseDate: "2021-05-20", dividendYield: 4.2, frankingPercentage: 100, sector: "Financials" },
    { id: 2, symbol: "CSL", name: "CSL Limited", ownership: "personal", ownerId: 1, quantity: 80, purchasePrice: 270.00, currentPrice: 298.00, purchaseDate: "2022-09-15", dividendYield: 1.2, frankingPercentage: 100, sector: "Healthcare" },
    { id: 3, symbol: "IVV", name: "iShares S&P 500 ETF", ownership: "personal", ownerId: 1, quantity: 200, purchasePrice: 480.00, currentPrice: 545.00, purchaseDate: "2023-01-10", dividendYield: 1.5, frankingPercentage: 0, sector: "ETF" }
  ],
  client_4: [
    { id: 1, symbol: "VAS", name: "Vanguard Australian Shares", ownership: "joint", ownerId: null, quantity: 400, purchasePrice: 85.00, currentPrice: 96.50, purchaseDate: "2023-04-10", dividendYield: 3.8, frankingPercentage: 85, sector: "ETF" },
    { id: 2, symbol: "BHP", name: "BHP Group", ownership: "personal", ownerId: 1, quantity: 200, purchasePrice: 42.00, currentPrice: 42.80, purchaseDate: "2023-11-01", dividendYield: 5.8, frankingPercentage: 100, sector: "Materials" }
  ],
  client_5: [
    { id: 1, symbol: "CBA", name: "Commonwealth Bank", ownership: "personal", ownerId: 1, quantity: 500, purchasePrice: 90.00, currentPrice: 118.50, purchaseDate: "2020-03-15", dividendYield: 4.2, frankingPercentage: 100, sector: "Financials" },
    { id: 2, symbol: "CSL", name: "CSL Limited", ownership: "personal", ownerId: 1, quantity: 150, purchasePrice: 250.00, currentPrice: 298.00, purchaseDate: "2021-06-20", dividendYield: 1.2, frankingPercentage: 100, sector: "Healthcare" },
    { id: 3, symbol: "VGS", name: "Vanguard MSCI International", ownership: "company", ownerId: null, quantity: 1000, purchasePrice: 88.00, currentPrice: 108.50, purchaseDate: "2022-01-15", dividendYield: 2.1, frankingPercentage: 0, sector: "ETF" },
    { id: 4, symbol: "AFI", name: "AFIC", ownership: "personal", ownerId: 2, quantity: 2000, purchasePrice: 7.50, currentPrice: 8.20, purchaseDate: "2022-08-01", dividendYield: 3.5, frankingPercentage: 100, sector: "LIC" },
    { id: 5, symbol: "WBC", name: "Westpac Banking", ownership: "company", ownerId: null, quantity: 800, purchasePrice: 22.00, currentPrice: 26.80, purchaseDate: "2023-02-15", dividendYield: 5.2, frankingPercentage: 100, sector: "Financials" },
    { id: 6, symbol: "TCL", name: "Transurban Group", ownership: "personal", ownerId: 1, quantity: 600, purchasePrice: 13.50, currentPrice: 14.80, purchaseDate: "2023-07-01", dividendYield: 4.1, frankingPercentage: 0, sector: "Infrastructure" }
  ]
};

// Default Share Portfolio with ownership types
const DEFAULT_SHARE_PORTFOLIO = [
  { 
    id: 1, 
    symbol: "VGH", 
    name: "Vanguard High Growth ETF", 
    ownership: "joint",
    ownerId: null,
    quantity: 400, 
    purchasePrice: 92.00, 
    currentPrice: 105.00, 
    purchaseDate: "2022-03-15",
    dividendYield: 3.5,
    frankingPercentage: 0,
    sector: "ETF"
  },
  { 
    id: 2, 
    symbol: "BHP", 
    name: "BHP Group Shares", 
    ownership: "personal",
    ownerId: 1,
    quantity: 400, 
    purchasePrice: 42.00, 
    currentPrice: 46.25, 
    purchaseDate: "2023-06-20",
    dividendYield: 5.8,
    frankingPercentage: 100,
    sector: "Materials"
  },
  { 
    id: 3, 
    symbol: "CBA", 
    name: "CBA Shares (DRP)", 
    ownership: "personal",
    ownerId: 2,
    quantity: 200, 
    purchasePrice: 105.00, 
    currentPrice: 120.00, 
    purchaseDate: "2022-08-01",
    dividendYield: 4.2,
    frankingPercentage: 100,
    sector: "Financials"
  }
];

// Now fill in client_1 share data
CLIENT_SHARE_DATA.client_1 = DEFAULT_SHARE_PORTFOLIO;


// Default Household Budget
const DEFAULT_BUDGET = {
  frequency: "monthly",
  income: {
    salary1: 10000,
    salary2: 5417,
    rental: 2667,
    dividends: 375,
    other: 0
  },
  expenses: {
    mortgage: 4200,
    utilities: 450,
    groceries: 1200,
    transport: 800,
    insurance: 650,
    schoolFees: 0,
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
    name: "Thompson Family",
    age: 50,
    taxableIncome: 185000,
    entityType: "personal"
  },
  investments: {
    cash_savings: 28000,
    term_deposit_amount: 35000,
    term_deposit_rate: 4.8,
    shares_value: 84500,
    shares_dividend_yield: 4.2,
    franking_percentage: 85,
    bonds_value: 0,
    bonds_yield: 0,
    etf_value: 42000,
    etf_yield: 3.5,
    smsf_balance: 443000,
    properties: [
      {
        property_id: "prop_001",
        name: "Family Home - Glen Waverley",
        value: 985000,
        rental_income: 0,
        mortgage_amount: 285000,
        mortgage_rate: 6.19,
        mortgage_term_years: 25,
        annual_expenses: 8500,
        depreciation_building: 0,
        depreciation_fixtures: 0
      },
      {
        property_id: "prop_002",
        name: "Investment Unit - Brunswick",
        value: 620000,
        rental_income: 32000,
        mortgage_amount: 380000,
        mortgage_rate: 6.49,
        mortgage_term_years: 28,
        annual_expenses: 7200,
        depreciation_building: 5800,
        depreciation_fixtures: 2800
      }
    ]
  },
  expenses: {
    school_fees: 0,
    childcare: 0,
    health_insurance: 4200,
    private_expenses: 65000,
    work_related: 3500,
    other_deductible: 2200
  },
  summary: {
    totalAssets: 2278000,
    totalDebt: 669200,
    netWorth: 1608800,
    annualIncome: 185000,
    totalTax: 42000,
    netIncome: 143000
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
  
  // Track current client and unsaved changes
  const [activeClientId, setActiveClientId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Listen for selectedClient changes from Layout (stored in localStorage)
  useEffect(() => {
    const checkClient = () => {
      const saved = localStorage.getItem("selected_client");
      if (saved) {
        try {
          const client = JSON.parse(saved);
          const clientId = client?.id || client?.client_id;
          if (clientId && clientId !== activeClientId) {
            setActiveClientId(clientId);
            const clientData = CLIENT_FAMILY_DATA[clientId];
            if (clientData) {
              setFamilyMembers(clientData.familyMembers);
              setTrust(clientData.trust);
              setCompany(clientData.company);
              setHasUnsavedChanges(false);
            }
            // Switch portfolio data
            const portfolioData = CLIENT_PORTFOLIO_DATA[clientId];
            if (portfolioData) {
              setPortfolio(portfolioData);
            }
            // Switch share portfolio
            const shareData = CLIENT_SHARE_DATA[clientId];
            if (shareData) {
              setSharePortfolio(shareData);
            }
          }
        } catch {
          // ignore parse errors
        }
      } else if (activeClientId !== null) {
        // Client deselected, reset to default
        setActiveClientId(null);
        setFamilyMembers(DEFAULT_FAMILY_MEMBERS);
        setTrust(DEFAULT_TRUST);
        setCompany(DEFAULT_COMPANY);
        setPortfolio(CLIENT_PORTFOLIO_DATA.client_1);
        setSharePortfolio(DEFAULT_SHARE_PORTFOLIO);
      }
    };
    
    checkClient();
    
    // Poll for changes (Layout updates localStorage on client selection)
    const interval = setInterval(checkClient, 500);
    window.addEventListener('storage', checkClient);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkClient);
    };
  }, [activeClientId]);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const storageKey = activeClientId ? `clientData_${activeClientId}` : "halcyonClientData";
    const savedData = localStorage.getItem(storageKey);
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
  }, [activeClientId]);

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
    const storageKey = activeClientId ? `clientData_${activeClientId}` : "halcyonClientData";
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    setHasUnsavedChanges(false);
    setLastSaved(dataToSave.lastSaved);
    toast.success("All changes saved successfully");
  }, [familyMembers, trust, budget, portfolio, sharePortfolio, company, activeClientId]);

  // Reset to defaults (for current client)
  const resetToDefaults = useCallback(() => {
    const clientData = activeClientId ? CLIENT_FAMILY_DATA[activeClientId] : CLIENT_FAMILY_DATA.client_1;
    if (clientData) {
      setFamilyMembers(clientData.familyMembers);
      setTrust(clientData.trust);
      setCompany(clientData.company);
    }
    setBudget(DEFAULT_BUDGET);
    setPortfolio(DEFAULT_PORTFOLIO);
    setSharePortfolio(DEFAULT_SHARE_PORTFOLIO);
    setHasUnsavedChanges(true);
    toast.info("Reset to default values");
  }, [activeClientId]);

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
      
      // Active client
      activeClientId,
      
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
      {/* Public routes */}
      <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
      
      {/* Protected routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/mode-selector" element={<ModeSelector />} />
      <Route path="/old-dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
      <Route path="/overview" element={<FamilyOverview />} />
      <Route path="/budget" element={<HouseholdBudget />} />
      {/* Tax - consolidate */}
      <Route path="/tax-analysis" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/property-portfolio" element={<Navigate to="/investments" replace />} />
      <Route path="/monte-carlo" element={<Navigate to="/scenario-modelling" replace />} />
      <Route path="/loan-calculator" element={<LoanCalculator />} />
      {/* Scenario routes - consolidate to /scenario-modelling */}
      <Route path="/scenarios" element={<Navigate to="/scenario-modelling" replace />} />
      <Route path="/scenario-builder" element={<ScenarioBuilder />} />
      <Route path="/scenario-builder/:scenarioId" element={<ScenarioBuilder />} />
      <Route path="/cgt" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/cgt-calculator" element={<Navigate to="/cgt" replace />} />
      <Route path="/cgt-events" element={<Navigate to="/cgt" replace />} />
      <Route path="/historical-tax" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/smsf-optimizer" element={<Navigate to="/investments" replace />} />
      <Route path="/reports" element={<ReportGenerator />} />
      <Route path="/salary-packaging" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/property-comparison" element={<Navigate to="/stock-research" replace />} />
      <Route path="/scenario-comparison" element={<Navigate to="/scenario-modelling" replace />} />
      <Route path="/scenario-simulator" element={<Navigate to="/scenario-modelling" replace />} />
      <Route path="/market-data" element={<Suspense fallback={<PageLoader />}><MarketData /></Suspense>} />
      <Route path="/tax-loss-harvesting" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/dividend-reinvestment" element={<DividendReinvestment />} />
      <Route path="/income-splitting" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/division-7a" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/trust-distributions" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/recommendations" element={<FinancialRecommendations />} />
      <Route path="/tax-calendar" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/share-portfolio" element={<SharePortfolio />} />
      <Route path="/holdings-performance" element={<HoldingsPerformance />} />
      <Route path="/calculation-methodology" element={<CalculationMethodology />} />
      <Route path="/sg-calculator" element={<SuperannuationGuarantee />} />
      <Route path="/super-pension" element={<Navigate to="/investments" replace />} />
      <Route path="/rental-yield-optimizer" element={<RentalYieldOptimizer />} />
      <Route path="/export" element={<ExportData />} />
      <Route path="/tax-analysis-sync" element={<UnifiedTaxCentre />} />
      <Route path="/tax-centre" element={<UnifiedTaxCentre />} />
      <Route path="/scenario-modeling" element={<Navigate to="/strategic-planning" replace />} />
      <Route path="/family-member/:memberId" element={<FamilyMemberProfile />} />
      <Route path="/lifecycle-planning" element={<Navigate to="/strategic-planning" replace />} />
      <Route path="/financial-advisor" element={<FinancialAdvisorChat />} />
      <Route path="/strategic-planning" element={<StrategicPlanning />} />
      <Route path="/data-import" element={<DataImport />} />
      <Route path="/bank-feeds" element={<BankFeeds />} />
      <Route path="/accounting-integrations" element={<AccountingIntegrations />} />
      <Route path="/bas-calculator" element={<Navigate to="/tax-analysis-sync" replace />} />
      <Route path="/collaboration" element={<Collaboration />} />
      <Route path="/risk-profiler" element={<RiskProfiler />} />
      <Route path="/statement-of-advice" element={<StatementOfAdvice />} />
      <Route path="/onboarding" element={<ClientOnboarding />} />
      <Route path="/copilot" element={<Navigate to="/ai-copilot-advanced" replace />} />
      <Route path="/daily-briefing" element={<DailyBriefing />} />
      {/* Unified Dashboard (Net Worth + Dashboard) */}
      <Route path="/dashboard" element={<DashboardRouter />} />
      <Route path="/personal-dashboard" element={<Navigate to="/dashboard" replace />} />
      <Route path="/family-wealth" element={<Navigate to="/dashboard" replace />} />

      {/* Unified Investments */}
      <Route path="/investments" element={<UnifiedInvestments />} />
      <Route path="/unlisted-investments" element={<Navigate to="/investments" replace />} />
      {/* Dashboard redirects */}
      <Route path="/adviser-dashboard" element={<Navigate to="/advisor-command-center" replace />} />
      <Route path="/client-portal-old" element={<ClientPortalMerged />} />
      <Route path="/practice-management" element={<PracticeManagement />} />
      <Route path="/documents" element={<DocumentsCommunications />} />
      <Route path="/portfolio-rebalancing" element={<PortfolioRebalancing />} />
      <Route path="/security" element={<SecuritySettings />} />
      <Route path="/notification-settings" element={<NotificationSettings />} />
      <Route path="/data-import-export" element={<DataImportExportPage />} />
      <Route path="/investment-comparison" element={<Navigate to="/stock-research" replace />} />
      <Route path="/decision-engine" element={<Navigate to="/dashboard" replace />} />
      <Route path="/decision-dashboard" element={<DecisionDashboard />} />
      <Route path="/life-timeline" element={<LifeTimelinePlanner />} />
      <Route path="/timeline" element={<LifeTimeline />} />
      {/* Client views - consolidate duplicates */}
      <Route path="/clients" element={<Navigate to="/adviser-hub" replace />} />
      <Route path="/client-crm" element={<Navigate to="/adviser-hub" replace />} />
      <Route path="/goal-tracker" element={<GoalTracker />} />
      <Route path="/goals" element={<GoalTracker />} />
      <Route path="/scenario-modelling" element={<UnifiedGoalsPlanning />} />
      <Route path="/knowledge-graph" element={<Navigate to="/advisor-command-center" replace />} />
      <Route path="/ai-advisor" element={<Navigate to="/ai-copilot-advanced" replace />} />
      <Route path="/portfolio-aggregator" element={<PortfolioAggregator />} />
      <Route path="/net-worth-trend" element={<NetWorthTrend />} />
      <Route path="/insurance-gap" element={<InsuranceGapAnalysis />} />
      <Route path="/debt-paydown" element={<DebtPaydownPlanner />} />
      <Route path="/revenue-billing" element={<RevenueBilling />} />
      <Route path="/advice-workflow" element={<AdviceWorkflow />} />
      <Route path="/financial-plan-generator" element={<FinancialPlanGenerator />} />
      <Route path="/meeting-summary" element={<MeetingSummaryGenerator />} />
      <Route path="/document-vault" element={<DocumentVault />} />
      <Route path="/estate-planning" element={<EstatePlanning />} />
      <Route path="/product-marketplace" element={<ProductMarketplace />} />
      <Route path="/portfolio-analyzer" element={<PortfolioAnalyzer />} />
      <Route path="/connected-accounts" element={<ConnectedAccounts />} />
      
      {/* AI routes - consolidate to primary */}
      <Route path="/ai-copilot" element={<Navigate to="/ai-copilot-advanced" replace />} />
      <Route path="/decision-center" element={<DecisionCenter />} />
      <Route path="/client-insights" element={<Navigate to="/ai-copilot-advanced" replace />} />
      <Route path="/intelligence-feed" element={<Navigate to="/ai-copilot-advanced" replace />} />
      <Route path="/ai-insights" element={<Navigate to="/ai-copilot-advanced" replace />} />
      <Route path="/client-portal" element={<SimpleClientPortal />} />
      
      {/* Super App Features */}
      <Route path="/meeting-prep" element={<MeetingPrep />} />
      <Route path="/stock-research" element={<UnifiedResearchCentre />} />
      <Route path="/compliance" element={<ClientCompliance />} />
      <Route path="/wealth-dashboard" element={<Navigate to="/dashboard" replace />} />
      
      {/* Client-Level Pages (Adviser viewing client data) */}
      <Route path="/client-wealth" element={<ClientWealth />} />
      <Route path="/client-compliance" element={<ClientCompliance />} />
      
      <Route path="/command-center" element={<Navigate to="/advisor-command-center" replace />} />
      
      {/* Cross-Client Intelligence Engine */}
      <Route path="/intelligence" element={<IntelligenceEngine />} />
      
      {/* Advisor Intelligence Dashboard — redirected to main Adviser Dashboard for consolidation */}
      <Route path="/advisor-intelligence" element={<Navigate to="/advisor-command-center" replace />} />
      
      {/* Ultimate Advisor Command Center - The $10B Platform */}
      <Route path="/advisor-command-center" element={<AdvisorCommandCenter />} />
      
      {/* Notification Center */}
      <Route path="/notifications" element={<NotificationCenter />} />
      
      {/* Data Aggregators Research */}
      <Route path="/data-aggregators" element={<DataAggregators />} />
      
      {/* Stock Trading with CGT */}
      <Route path="/stock-trading" element={<StockTrading />} />
      
      {/* Macro Dashboard - Global Markets */}
      <Route path="/macro-dashboard" element={<MacroDashboard />} />
      
      {/* Broker Research Reports */}
      <Route path="/broker-research" element={<Navigate to="/stock-research" replace />} />
      
      {/* Workflow Engine */}
      <Route path="/workflows" element={<WorkflowDashboard />} />
      
      {/* Book Intelligence — consolidated into Daily Briefing */}
      <Route path="/book-intelligence" element={<Navigate to="/daily-briefing" replace />} />
      
      {/* Meeting Automation */}
      <Route path="/meeting-automation" element={<MeetingAutomation />} />
      
      {/* Batch Execution */}
      <Route path="/batch-execution" element={<BatchExecution />} />
      
      {/* Advanced AI Copilot */}
      <Route path="/ai-copilot-advanced" element={<AICopilotAdvanced />} />
      
      {/* Feedback & Learning Analytics */}
      <Route path="/feedback-analytics" element={<FeedbackAnalytics />} />
      
      {/* Real-Time Data Layer */}
      <Route path="/realtime-data" element={<RealtimeDataDashboard />} />
      
      {/* New Trading Pages */}
      <Route path="/bonds-trading" element={<Navigate to="/investments" replace />} />
      <Route path="/cash-deposits" element={<Navigate to="/investments" replace />} />
      <Route path="/managed-funds" element={<Navigate to="/investments" replace />} />
      <Route path="/hybrids-trading" element={<Navigate to="/investments" replace />} />
      <Route path="/crypto-portfolio" element={<Navigate to="/investments" replace />} />
      
      {/* Xplan Integration */}
      <Route path="/xplan-integration" element={<XplanIntegration />} />
      
      {/* AdviceOS Dashboard - Compliance-First Decision Support */}
      <Route path="/adviceos" element={<UnifiedComplianceCentre />} />
      
      {/* Enterprise Compliance Dashboard - ASIC/APRA/ISO Compliance Center */}
      <Route path="/enterprise" element={<Navigate to="/adviceos" replace />} />
      
      {/* Xplan Integration - Sync Page */}
      <Route path="/xplan" element={<XplanSyncPage />} />
      
      {/* Enterprise System of Record Features */}
      <Route path="/replay-advice" element={<ReplayAdvicePage />} />
      <Route path="/cost-reduction" element={<CostReductionDashboard />} />
      <Route path="/risk-control" element={<Navigate to="/adviceos" replace />} />
      <Route path="/breach-register" element={<Navigate to="/adviceos" replace />} />
      
      {/* Retirement - consolidate duplicates */}
      <Route path="/retirement-calculator" element={<Navigate to="/retirement-confidence" replace />} />
      
      {/* Decumulation Calculator - Pension Phase Planning */}
      <Route path="/decumulation-calculator" element={<DecumulationCalculator />} />
      
      {/* Unified Retirement Planner */}
      <Route path="/retirement" element={<Navigate to="/retirement-confidence" replace />} />
      
      {/* Platform Integrations - AMP North, Netwealth, Hub24, Class, IRESS */}
      <Route path="/platform-integrations" element={<PlatformIntegrations />} />
      
      {/* Live Sync Dashboard */}
      <Route path="/live-sync" element={<LiveSyncDashboard />} />
      
      <Route path="/financial-dashboard" element={<Navigate to="/dashboard" replace />} />
      
      {/* Adviser Compliance Dashboard */}
      <Route path="/adviser-compliance" element={<AdviserComplianceDashboard />} />
      
      {/* Notification Center */}
      <Route path="/notification-center" element={<NotificationCenterPage />} />
      
      {/* Stress Test Dashboard */}
      <Route path="/stress-test" element={<StressTestDashboard />} />
      
      {/* Retirement Confidence Engine - Monte Carlo simulations */}
      <Route path="/confidence-engine" element={<RetirementConfidenceEngine />} />
      
      {/* Hybrid Engine - World-class 19-section retirement calculation */}
      <Route path="/hybrid-engine" element={<HybridEngineView />} />
      
      {/* Combined Retirement Confidence (Quick + Advanced) */}
      <Route path="/retirement-confidence" element={<RetirementConfidence />} />
      
      <Route path="/crm-command-center" element={<Navigate to="/adviser-hub" replace />} />
      
      {/* Client 360 View */}
      <Route path="/client-360" element={<Client360View />} />
      
      {/* Transaction Modeler */}
      <Route path="/transaction-modeler" element={<TransactionModeler />} />
      
      {/* Next Best Actions */}
      <Route path="/next-best-actions" element={<NextBestActions />} />
      <Route path="/next-actions" element={<Navigate to="/next-best-actions" replace />} />
      
      {/* Meeting Notes with Fathom */}
      <Route path="/meeting-notes" element={<MeetingNotes />} />
      
      {/* Adviser Hub (Combined CRM) */}
      <Route path="/adviser-hub" element={<AdviserHub />} />
      <Route path="/client-setup" element={<Suspense fallback={<PageLoader />}><ClientSetupWizard /></Suspense>} />
      
      {/* Client Health Dashboard */}
      <Route path="/client-health" element={<ClientHealthDashboard />} />
      
      {/* Client Comparison */}
      <Route path="/client-comparison" element={<ClientComparison />} />
    </Routes>
  );
};

// Smart router: shows different dashboard based on client context
const DashboardRouter = () => {
  const stored = localStorage.getItem("selected_client");
  const mode = localStorage.getItem("app_mode");
  if (stored && mode === "adviser") {
    return <UnifiedClientOverview />;
  }
  return <UnifiedDashboard />;
};

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <PortfolioProvider>
              <NotificationsProvider>
                <XplanSyncProvider>
                  <ComplianceModal />
                  <ErrorBoundary label="Application">
                    <Suspense fallback={<PageLoader />}>
                      <AppRouter />
                    </Suspense>
                  </ErrorBoundary>
                  <Toaster position="top-right" richColors />
                  <XplanSyncIndicator />
                </XplanSyncProvider>
              </NotificationsProvider>
            </PortfolioProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
