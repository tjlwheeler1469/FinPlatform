// Centralized lazy-loaded page registry with chunk-load retry.
// Extracted from App.js (was ~260 lines of mixed lazy declarations).
// All pages loaded on demand via React.lazy + a retry wrapper that handles
// webpack chunk load failures gracefully.
import { lazy } from "react";

const hardReload = () => {
  try {
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  } catch { /* ignore */ }
  const url = new URL(window.location.href);
  url.searchParams.set("_cb", Date.now().toString());
  window.location.replace(url.toString());
};

export const lazyRetry = (importFn) =>
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

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// === Page registry === (grouped by area for maintainability)

// Tax & Calculators
export const TaxAnalysisSync = lazyRetry(() => import("@/pages/TaxAnalysisSync"));
export const UnifiedTaxCentre = lazyRetry(() => import("@/pages/UnifiedTaxCentre"));
export const LoanCalculator = lazyRetry(() => import("@/pages/LoanCalculator"));
export const CGT = lazyRetry(() => import("@/pages/CGT"));
export const HistoricalTaxComparison = lazyRetry(() => import("@/pages/HistoricalTaxComparison"));
export const SalaryPackaging = lazyRetry(() => import("@/pages/SalaryPackaging"));
export const TaxLossHarvesting = lazyRetry(() => import("@/pages/TaxLossHarvesting"));
export const IncomeSplitting = lazyRetry(() => import("@/pages/IncomeSplitting"));
export const Division7ACalculator = lazyRetry(() => import("@/pages/Division7ACalculator"));
export const TrustDistributionAnalysis = lazyRetry(() => import("@/pages/TrustDistributionAnalysis"));
export const TaxCalendar = lazyRetry(() => import("@/pages/TaxCalendar"));
export const BASCalculator = lazyRetry(() => import("@/pages/BASCalculator"));

// Investments & Portfolio
export const PropertyPortfolio = lazyRetry(() => import("@/pages/PropertyPortfolio"));
export const UnifiedInvestments = lazyRetry(() => import("@/pages/UnifiedInvestments"));
export const SMSFOptimizer = lazyRetry(() => import("@/pages/SMSFOptimizer"));
export const UnlistedInvestments = lazyRetry(() => import("@/pages/UnlistedInvestments"));
export const SharePortfolio = lazyRetry(() => import("@/pages/SharePortfolio"));
export const DividendReinvestment = lazyRetry(() => import("@/pages/DividendReinvestment"));
export const HoldingsPerformance = lazyRetry(() => import("@/pages/HoldingsPerformance"));
export const RentalYieldOptimizer = lazyRetry(() => import("@/pages/RentalYieldOptimizer"));
export const PropertyComparison = lazyRetry(() => import("@/pages/PropertyComparison"));
export const PortfolioAggregator = lazyRetry(() => import("@/pages/PortfolioAggregator"));
export const PortfolioRebalancing = lazyRetry(() => import("@/pages/PortfolioRebalancing"));
export const PortfolioAnalyzer = lazyRetry(() => import("@/pages/PortfolioAnalyzer"));
export const BondsTrading = lazyRetry(() => import("@/pages/BondsTrading"));
export const CashDeposits = lazyRetry(() => import("@/pages/CashDeposits"));
export const ManagedFunds = lazyRetry(() => import("@/pages/ManagedFunds"));
export const HybridsTrading = lazyRetry(() => import("@/pages/HybridsTrading"));
export const CryptoPortfolio = lazyRetry(() => import("@/pages/CryptoPortfolio"));
export const StockTrading = lazyRetry(() => import("@/pages/StockTrading"));

// Scenarios / Planning
export const MonteCarloSimulation = lazyRetry(() => import("@/pages/MonteCarloSimulation"));
export const SavedScenarios = lazyRetry(() => import("@/pages/SavedScenarios"));
export const ScenarioBuilder = lazyRetry(() => import("@/pages/ScenarioBuilder"));
export const ScenarioComparison = lazyRetry(() => import("@/pages/ScenarioComparison"));
export const ScenarioSimulator = lazyRetry(() => import("@/pages/ScenarioSimulator"));
export const ScenarioModelling = lazyRetry(() => import("@/pages/ScenarioModelling"));
export const StrategicPlanning = lazyRetry(() => import("@/pages/StrategicPlanning"));
export const LifeTimeline = lazyRetry(() => import("@/pages/LifeTimeline"));
export const LifeTimelinePlanner = lazyRetry(() => import("@/pages/LifeTimelinePlanner"));
export const TransactionModeler = lazyRetry(() => import("@/pages/TransactionModeler"));
export const UnifiedGoalsPlanning = lazyRetry(() => import("@/pages/UnifiedGoalsPlanning"));
export const GoalTracker = lazyRetry(() => import("@/pages/GoalTracker"));

// Retirement
export const RetirementCalculator = lazyRetry(() => import("@/pages/RetirementCalculator"));
export const DecumulationCalculator = lazyRetry(() => import("@/pages/DecumulationCalculator"));
export const RetirementPlanner = lazyRetry(() => import("@/pages/RetirementPlanner"));
export const RetirementConfidenceEngine = lazyRetry(() => import("@/pages/RetirementConfidenceEngine"));
export const HybridEngineView = lazyRetry(() => import("@/pages/HybridEngineView"));
export const RetirementConfidence = lazyRetry(() => import("@/pages/RetirementConfidence"));
export const RetirementWorkshop = lazyRetry(() => import("@/pages/RetirementWorkshop"));
export const RetirementHub = lazyRetry(() => import("@/pages/RetirementHub"));
export const SuperannuationGuarantee = lazyRetry(() => import("@/pages/SuperannuationGuarantee"));

// Budget & Cash
export const HouseholdBudget = lazyRetry(() => import("@/pages/HouseholdBudget"));
export const DebtPaydownPlanner = lazyRetry(() => import("@/pages/DebtPaydownPlanner"));

// Adviser core
export const AdviserDashboard = lazyRetry(() => import("@/pages/AdviserDashboard"));
export const AdviserHub = lazyRetry(() => import("@/pages/AdviserHub"));
export const AdvisorCommandCenter = lazyRetry(() => import("@/pages/AdvisorCommandCenter"));
export const AdvisorIntelligenceDashboard = lazyRetry(() => import("@/pages/AdvisorIntelligenceDashboard"));
export const DailyBriefing = lazyRetry(() => import("@/pages/DailyBriefing"));
export const CommandCenter = lazyRetry(() => import("@/pages/CommandCenter"));
export const IntelligenceEngine = lazyRetry(() => import("@/pages/IntelligenceEngine"));
export const DecisionCenter = lazyRetry(() => import("@/pages/DecisionCenter"));
export const DecisionEngine = lazyRetry(() => import("@/pages/DecisionEngine"));
export const DecisionDashboard = lazyRetry(() => import("@/pages/DecisionDashboard"));
export const NextBestActions = lazyRetry(() => import("@/pages/NextBestActions"));
export const ClientIntelligenceFeed = lazyRetry(() => import("@/pages/ClientIntelligenceFeed"));
export const WorkflowDashboard = lazyRetry(() => import("@/pages/WorkflowDashboard"));
export const BookIntelligence = lazyRetry(() => import("@/pages/BookIntelligence"));
export const MeetingAutomation = lazyRetry(() => import("@/pages/MeetingAutomation"));
export const BatchExecution = lazyRetry(() => import("@/pages/BatchExecution"));
export const MeetingPrep = lazyRetry(() => import("@/pages/MeetingPrep"));
export const MeetingNotes = lazyRetry(() => import("@/pages/MeetingNotes"));
export const MeetingSummaryGenerator = lazyRetry(() => import("@/pages/MeetingSummaryGenerator"));
export const Copilot = lazyRetry(() => import("@/pages/Copilot"));
export const AIAdvisor = lazyRetry(() => import("@/pages/AIAdvisor"));
export const AICopilot = lazyRetry(() => import("@/pages/AICopilot"));
export const AICopilotAdvanced = lazyRetry(() => import("@/pages/AICopilotAdvanced"));
export const AIInsights = lazyRetry(() => import("@/pages/AIInsights"));
export const FinancialAdvisorChat = lazyRetry(() => import("@/pages/FinancialAdvisorChat"));
export const FinancialPlanGenerator = lazyRetry(() => import("@/pages/FinancialPlanGenerator"));
export const FinancialRecommendations = lazyRetry(() => import("@/pages/FinancialRecommendations"));
export const AdviceWorkflow = lazyRetry(() => import("@/pages/AdviceWorkflow"));
export const FeedbackAnalytics = lazyRetry(() => import("@/pages/FeedbackAnalytics"));

// Client-facing
export const PersonalDashboard = lazyRetry(() => import("@/pages/PersonalDashboard"));
export const UnifiedDashboard = lazyRetry(() => import("@/pages/UnifiedDashboard"));
export const UnifiedClientOverview = lazyRetry(() => import("@/pages/UnifiedClientOverview"));
export const SimpleClientPortal = lazyRetry(() => import("@/pages/SimpleClientPortal"));
export const SimpleClientView = lazyRetry(() => import("@/pages/SimpleClientView"));
export const ClientPortal = lazyRetry(() => import("@/pages/ClientPortal"));
export const ClientPortalMerged = lazyRetry(() => import("@/pages/ClientPortalMerged"));
export const ClientWealth = lazyRetry(() => import("@/pages/ClientWealth"));
export const ClientCompliance = lazyRetry(() => import("@/pages/ClientCompliance"));
export const ClientCRM = lazyRetry(() => import("@/pages/ClientCRM"));
export const ClientHealthDashboard = lazyRetry(() => import("@/pages/ClientHealthDashboard"));
export const ClientComparison = lazyRetry(() => import("@/pages/ClientComparison"));
export const Client360View = lazyRetry(() => import("@/pages/Client360View"));
export const ClientInvoicingPage = lazyRetry(() => import("@/pages/ClientInvoicingPage"));
export const ClientCommsChecklistPage = lazyRetry(() => import("@/pages/ClientCommsChecklistPage"));
export const RetirementControlCenter = lazyRetry(() => import("@/pages/RetirementControlCenter"));
export const ClientHome = lazyRetry(() => import("@/pages/ClientHome"));
export const ClientMessages = lazyRetry(() => import("@/pages/ClientMessages"));
export const AdviceDocumentBuilder = lazyRetry(() => import("@/pages/AdviceDocumentBuilder"));
export const ClientReadinessPortal = lazyRetry(() => import("@/pages/ClientReadinessPortal"));
export const ClientOnboarding = lazyRetry(() => import("@/pages/ClientOnboarding"));
export const ClientSetupWizard = lazyRetry(() => import("@/pages/ClientSetupWizard"));
export const ClientFinancialDashboard = lazyRetry(() => import("@/pages/ClientFinancialDashboard"));
export const FamilyOverview = lazyRetry(() => import("@/pages/FamilyOverview"));
export const FamilyMemberProfile = lazyRetry(() => import("@/pages/FamilyMemberProfile"));
export const FamilyWealthDashboard = lazyRetry(() => import("@/pages/FamilyWealthDashboard"));

// CRM Compliance Estate Docs
export const CRMCommandCenter = lazyRetry(() => import("@/pages/CRMCommandCenter"));
export const ComplianceCenter = lazyRetry(() => import("@/pages/ComplianceCenter"));
export const AdviserComplianceDashboard = lazyRetry(() => import("@/pages/AdviserComplianceDashboard"));
export const UnifiedComplianceCentre = lazyRetry(() => import("@/pages/UnifiedComplianceCentre"));
export const EnterpriseComplianceDashboard = lazyRetry(() => import("@/pages/EnterpriseComplianceDashboard"));
export const DocumentsCommunications = lazyRetry(() => import("@/pages/DocumentsCommunications"));
export const DocumentVault = lazyRetry(() => import("@/pages/DocumentVault"));
export const EstatePlanning = lazyRetry(() => import("@/pages/EstatePlanning"));
export const StatementOfAdvice = lazyRetry(() => import("@/pages/StatementOfAdvice"));
export const RiskProfiler = lazyRetry(() => import("@/pages/RiskProfiler"));
export const RiskControlMapping = lazyRetry(() => import("@/pages/RiskControlMapping"));
export const BreachRegister = lazyRetry(() => import("@/pages/BreachRegister"));

// Research & Markets
export const UnifiedResearchCentre = lazyRetry(() => import("@/pages/UnifiedResearchCentre"));
export const InvestmentComparison = lazyRetry(() => import("@/pages/InvestmentComparison"));
export const MarketData = lazyRetry(() => import("@/pages/MarketData"));
export const MacroDashboard = lazyRetry(() => import("@/pages/MacroDashboard"));
export const StockResearch = lazyRetry(() => import("@/pages/StockResearch"));
export const BrokerResearch = lazyRetry(() => import("@/pages/BrokerResearch"));
export const DataAggregators = lazyRetry(() => import("@/pages/DataAggregators"));
export const RealtimeDataDashboard = lazyRetry(() => import("@/pages/RealtimeDataDashboard"));
export const ProductMarketplace = lazyRetry(() => import("@/pages/ProductMarketplace"));
export const WealthDashboard = lazyRetry(() => import("@/pages/WealthDashboard"));

// Integrations
export const XplanIntegration = lazyRetry(() => import("@/pages/XplanIntegration"));
export const XplanSyncPage = lazyRetry(() => import("@/pages/XplanSyncPage"));
export const PlatformIntegrations = lazyRetry(() => import("@/pages/PlatformIntegrations"));
export const LiveSyncDashboard = lazyRetry(() => import("@/pages/LiveSyncDashboard"));
export const DataImport = lazyRetry(() => import("@/pages/DataImport"));
export const BankFeeds = lazyRetry(() => import("@/pages/BankFeeds"));
export const AccountingIntegrations = lazyRetry(() => import("@/pages/AccountingIntegrations"));
export const DataImportExportPage = lazyRetry(() => import("@/pages/DataImportExportPage"));
export const ConnectedAccounts = lazyRetry(() => import("@/pages/ConnectedAccounts"));

// Firm & Admin
export const AdviceOSDashboard = lazyRetry(() => import("@/pages/AdviceOSDashboard"));
export const PracticeManagement = lazyRetry(() => import("@/pages/PracticeManagement"));
export const RevenueBilling = lazyRetry(() => import("@/pages/RevenueBilling"));
export const NotificationCenter = lazyRetry(() => import("@/pages/NotificationCenter"));
export const NotificationCenterPage = lazyRetry(() => import("@/pages/NotificationCenterPage"));
export const NotificationSettings = lazyRetry(() => import("@/pages/NotificationSettings"));
export const SecuritySettings = lazyRetry(() => import("@/pages/SecuritySettings"));
export const StressTestDashboard = lazyRetry(() => import("@/pages/StressTestDashboard"));
export const CostReductionDashboard = lazyRetry(() => import("@/pages/CostReductionDashboard"));
export const ReplayAdvicePage = lazyRetry(() => import("@/pages/ReplayAdvicePage"));
export const ReportGenerator = lazyRetry(() => import("@/pages/ReportGenerator"));
export const ExportData = lazyRetry(() => import("@/pages/ExportData"));
export const KnowledgeGraphDashboard = lazyRetry(() => import("@/pages/KnowledgeGraphDashboard"));
export const Collaboration = lazyRetry(() => import("@/pages/Collaboration"));
export const InsuranceGapAnalysis = lazyRetry(() => import("@/pages/InsuranceGapAnalysis"));
export const NetWorthTrend = lazyRetry(() => import("@/pages/NetWorthTrend"));

// Auth / Shell
export const Login = lazyRetry(() => import("@/pages/Login"));

// Client-facing secure areas
export const MyVault = lazyRetry(() => import("@/pages/MyVault"));
export const MySettings = lazyRetry(() => import("@/pages/MySettings"));
