// Centralized route registry extracted from App.js.
// All app routes live here. Keep this file as the single place to add/remove routes.
import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import ModeSelector from "@/pages/ModeSelector";
import {
  PageLoader,
  // Tax
  TaxAnalysisSync, UnifiedTaxCentre, LoanCalculator, CGT, HistoricalTaxComparison,
  SalaryPackaging, TaxLossHarvesting, IncomeSplitting, Division7ACalculator,
  TrustDistributionAnalysis, TaxCalendar, BASCalculator,
  // Investments
  PropertyPortfolio, UnifiedInvestments, SMSFOptimizer, UnlistedInvestments,
  SharePortfolio, DividendReinvestment, HoldingsPerformance, RentalYieldOptimizer,
  PropertyComparison, PortfolioAggregator, PortfolioRebalancing, PortfolioAnalyzer,
  BondsTrading, CashDeposits, ManagedFunds, HybridsTrading, CryptoPortfolio,
  StockTrading,
  // Scenarios
  MonteCarloSimulation, SavedScenarios, ScenarioBuilder, ScenarioComparison,
  ScenarioSimulator, ScenarioModelling, StrategicPlanning, LifeTimeline,
  LifeTimelinePlanner, TransactionModeler, UnifiedGoalsPlanning, GoalTracker,
  // Retirement
  RetirementCalculator, DecumulationCalculator, RetirementPlanner,
  RetirementConfidenceEngine, HybridEngineView, RetirementConfidence,
  RetirementWorkshop, RetirementHub, SuperannuationGuarantee,
  // Budget
  HouseholdBudget, DebtPaydownPlanner,
  // Adviser
  AdviserDashboard, AdviserHub, AdvisorCommandCenter, AdvisorIntelligenceDashboard,
  DailyBriefing, CommandCenter, IntelligenceEngine, DecisionCenter, DecisionEngine,
  DecisionDashboard, NextBestActions, ClientIntelligenceFeed, WorkflowDashboard,
  BookIntelligence, MeetingAutomation, BatchExecution, MeetingPrep, MeetingNotes,
  MeetingSummaryGenerator, Copilot, AIAdvisor, AICopilot, AICopilotAdvanced,
  AIInsights, FinancialAdvisorChat, FinancialPlanGenerator, FinancialRecommendations,
  AdviceWorkflow, FeedbackAnalytics,
  // Client
  PersonalDashboard, UnifiedDashboard, UnifiedClientOverview, SimpleClientPortal,
  SimpleClientView, ClientPortal, ClientPortalMerged, ClientWealth, ClientCompliance,
  ClientReadinessPortal,
  ClientCRM, ClientHealthDashboard, ClientComparison, Client360View, ClientOnboarding,
  ClientSetupWizard, ClientFinancialDashboard, FamilyOverview, FamilyMemberProfile,
  FamilyWealthDashboard, ClientInvoicingPage, ClientCommsChecklistPage,
  RetirementControlCenter, ClientHome,
  // CRM Compliance Estate Docs
  CRMCommandCenter, ComplianceCenter, AdviserComplianceDashboard,
  UnifiedComplianceCentre, EnterpriseComplianceDashboard, DocumentsCommunications,
  DocumentVault, EstatePlanning, StatementOfAdvice, RiskProfiler, RiskControlMapping,
  BreachRegister,
  // Research
  UnifiedResearchCentre, InvestmentComparison, MarketData, MacroDashboard,
  StockResearch, BrokerResearch, DataAggregators, RealtimeDataDashboard,
  ProductMarketplace, WealthDashboard,
  // Integrations
  XplanIntegration, XplanSyncPage, PlatformIntegrations, LiveSyncDashboard,
  DataImport, BankFeeds, AccountingIntegrations, DataImportExportPage,
  ConnectedAccounts,
  // Firm
  AdviceOSDashboard, PracticeManagement, RevenueBilling, NotificationCenter,
  NotificationCenterPage, NotificationSettings, SecuritySettings, StressTestDashboard,
  CostReductionDashboard, ReplayAdvicePage, ReportGenerator, ExportData,
  KnowledgeGraphDashboard, Collaboration, InsuranceGapAnalysis, NetWorthTrend,
  // Auth
  Login,
  // Client-facing secure areas
  MyVault, MySettings,
} from "@/routes/lazyPages";

// Smart router: shows different dashboard based on client context
const DashboardRouter = () => {
  const stored = localStorage.getItem("selected_client");
  const mode = localStorage.getItem("app_mode");
  if (stored && mode === "adviser") return <UnifiedClientOverview />;
  // Default: anything non-adviser is the simple client view (Personal Mode retired)
  return <SimpleClientView />;
};

const AppRouter = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />

    {/* Root + selector */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/mode-selector" element={<ModeSelector />} />
    <Route path="/old-dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />

    {/* Personal / Family */}
    <Route path="/overview" element={<FamilyOverview />} />
    <Route path="/budget" element={<HouseholdBudget />} />
    <Route path="/family-member/:memberId" element={<FamilyMemberProfile />} />
    <Route path="/dashboard" element={<DashboardRouter />} />
    <Route path="/personal-dashboard" element={<Navigate to="/dashboard" replace />} />
    <Route path="/family-wealth" element={<Navigate to="/dashboard" replace />} />

    {/* Tax */}
    <Route path="/tax-analysis" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/tax-analysis-sync" element={<UnifiedTaxCentre />} />
    <Route path="/tax-centre" element={<UnifiedTaxCentre />} />
    <Route path="/cgt" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/cgt-calculator" element={<Navigate to="/cgt" replace />} />
    <Route path="/cgt-events" element={<Navigate to="/cgt" replace />} />
    <Route path="/historical-tax" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/salary-packaging" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/tax-loss-harvesting" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/income-splitting" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/division-7a" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/trust-distributions" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/tax-calendar" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/bas-calculator" element={<Navigate to="/tax-analysis-sync" replace />} />
    <Route path="/loan-calculator" element={<LoanCalculator />} />

    {/* Investments */}
    <Route path="/investments" element={<UnifiedInvestments />} />
    <Route path="/unlisted-investments" element={<Navigate to="/investments" replace />} />
    <Route path="/property-portfolio" element={<Navigate to="/investments" replace />} />
    <Route path="/smsf-optimizer" element={<Navigate to="/investments" replace />} />
    <Route path="/super-pension" element={<Navigate to="/investments" replace />} />
    <Route path="/share-portfolio" element={<SharePortfolio />} />
    <Route path="/dividend-reinvestment" element={<DividendReinvestment />} />
    <Route path="/holdings-performance" element={<HoldingsPerformance />} />
    <Route path="/rental-yield-optimizer" element={<RentalYieldOptimizer />} />
    <Route path="/property-comparison" element={<Navigate to="/stock-research" replace />} />
    <Route path="/portfolio-aggregator" element={<PortfolioAggregator />} />
    <Route path="/portfolio-rebalancing" element={<PortfolioRebalancing />} />
    <Route path="/portfolio-analyzer" element={<PortfolioAnalyzer />} />
    <Route path="/stock-trading" element={<StockTrading />} />
    <Route path="/bonds-trading" element={<Navigate to="/investments" replace />} />
    <Route path="/cash-deposits" element={<Navigate to="/investments" replace />} />
    <Route path="/managed-funds" element={<Navigate to="/investments" replace />} />
    <Route path="/hybrids-trading" element={<Navigate to="/investments" replace />} />
    <Route path="/crypto-portfolio" element={<Navigate to="/investments" replace />} />
    <Route path="/sg-calculator" element={<SuperannuationGuarantee />} />

    {/* Scenarios / Planning */}
    <Route path="/monte-carlo" element={<Navigate to="/scenario-modelling" replace />} />
    <Route path="/scenarios" element={<Navigate to="/scenario-modelling" replace />} />
    <Route path="/scenario-builder" element={<ScenarioBuilder />} />
    <Route path="/scenario-builder/:scenarioId" element={<ScenarioBuilder />} />
    <Route path="/scenario-comparison" element={<Navigate to="/scenario-modelling" replace />} />
    <Route path="/scenario-simulator" element={<Navigate to="/scenario-modelling" replace />} />
    <Route path="/scenario-modelling" element={<UnifiedGoalsPlanning />} />
    <Route path="/scenario-modeling" element={<Navigate to="/strategic-planning" replace />} />
    <Route path="/strategic-planning" element={<StrategicPlanning />} />
    <Route path="/lifecycle-planning" element={<Navigate to="/strategic-planning" replace />} />
    <Route path="/life-timeline" element={<LifeTimelinePlanner />} />
    <Route path="/timeline" element={<LifeTimeline />} />
    <Route path="/transaction-modeler" element={<TransactionModeler />} />
    <Route path="/goal-tracker" element={<GoalTracker />} />
    <Route path="/goals" element={<GoalTracker />} />

    {/* Retirement */}
    <Route path="/retirement" element={<Navigate to="/retirement-confidence" replace />} />
    <Route path="/retirement-calculator" element={<Navigate to="/retirement-confidence" replace />} />
    <Route path="/decumulation-calculator" element={<DecumulationCalculator />} />
    <Route path="/confidence-engine" element={<RetirementConfidenceEngine />} />
    <Route path="/hybrid-engine" element={<HybridEngineView />} />
    <Route path="/retirement-confidence" element={<RetirementHub />} />
    <Route path="/retirement-confidence-legacy" element={<RetirementConfidence />} />
    <Route path="/retirement-workshop" element={<RetirementWorkshop />} />

    {/* Budget */}
    <Route path="/debt-paydown" element={<DebtPaydownPlanner />} />

    {/* Advisor / Adviser */}
    <Route path="/adviser-dashboard" element={<Navigate to="/advisor-command-center" replace />} />
    <Route path="/advisor-intelligence" element={<Navigate to="/advisor-command-center" replace />} />
    <Route path="/advisor-command-center" element={<AdvisorCommandCenter />} />
    <Route path="/command-center" element={<Navigate to="/advisor-command-center" replace />} />
    <Route path="/daily-briefing" element={<DailyBriefing />} />
    <Route path="/intelligence" element={<IntelligenceEngine />} />
    <Route path="/decision-center" element={<DecisionCenter />} />
    <Route path="/decision-engine" element={<DecisionEngine />} />
    <Route path="/decision-dashboard" element={<DecisionDashboard />} />
    <Route path="/next-best-actions" element={<NextBestActions />} />
    <Route path="/next-actions" element={<Navigate to="/next-best-actions" replace />} />
    <Route path="/client-insights" element={<ClientIntelligenceFeed />} />
    <Route path="/intelligence-feed" element={<ClientIntelligenceFeed />} />
    <Route path="/book-intelligence" element={<BookIntelligence />} />
    <Route path="/workflows" element={<WorkflowDashboard />} />
    <Route path="/meeting-prep" element={<MeetingPrep />} />
    <Route path="/meeting-notes" element={<MeetingNotes />} />
    <Route path="/meeting-automation" element={<MeetingAutomation />} />
    <Route path="/meeting-summary" element={<MeetingSummaryGenerator />} />
    <Route path="/batch-execution" element={<BatchExecution />} />
    <Route path="/knowledge-graph" element={<Navigate to="/advisor-command-center" replace />} />
    <Route path="/ai-copilot" element={<Navigate to="/ai-copilot-advanced" replace />} />
    <Route path="/ai-copilot-advanced" element={<AICopilotAdvanced />} />
    <Route path="/ai-insights" element={<Navigate to="/ai-copilot-advanced" replace />} />
    <Route path="/ai-advisor" element={<Navigate to="/ai-copilot-advanced" replace />} />
    <Route path="/financial-advisor" element={<FinancialAdvisorChat />} />
    <Route path="/financial-plan-generator" element={<FinancialPlanGenerator />} />
    <Route path="/recommendations" element={<FinancialRecommendations />} />
    <Route path="/advice-workflow" element={<AdviceWorkflow />} />
    <Route path="/feedback-analytics" element={<FeedbackAnalytics />} />
    <Route path="/copilot" element={<Navigate to="/ai-copilot-advanced" replace />} />

    {/* CRM (all roads → Client Hub) */}
    <Route path="/crm" element={<Navigate to="/adviser-hub" replace />} />
    <Route path="/crm-command-center" element={<Navigate to="/adviser-hub" replace />} />
    <Route path="/rockstar-crm" element={<Navigate to="/adviser-hub" replace />} />
    <Route path="/client-crm" element={<Navigate to="/adviser-hub" replace />} />
    <Route path="/clients" element={<Navigate to="/adviser-hub" replace />} />
    <Route path="/adviser-hub" element={<AdviserHub />} />
    <Route path="/client-setup" element={<Suspense fallback={<PageLoader />}><ClientSetupWizard /></Suspense>} />
    <Route path="/client-360" element={<Client360View />} />
    <Route path="/client-health" element={<ClientHealthDashboard />} />
    <Route path="/client-comparison" element={<ClientComparison />} />
    <Route path="/client-wealth" element={<ClientWealth />} />
    <Route path="/client-compliance" element={<ClientCompliance />} />
    <Route path="/client-portal" element={<DashboardRouter />} />
    <Route path="/client-invoicing" element={<ClientInvoicingPage />} />
    <Route path="/client-comms-checklist" element={<ClientCommsChecklistPage />} />
    <Route path="/retirement-control-center" element={<RetirementControlCenter />} />
    <Route path="/client-home" element={<ClientHome />} />
    <Route path="/client-readiness" element={<ClientReadinessPortal />} />
    <Route path="/client-portal-old" element={<ClientPortalMerged />} />
    <Route path="/onboarding" element={<ClientOnboarding />} />
    <Route path="/financial-dashboard" element={<Navigate to="/dashboard" replace />} />
    <Route path="/profile" element={<Navigate to="/dashboard" replace />} />

    {/* Compliance / Estate / Docs */}
    <Route path="/compliance" element={<ClientCompliance />} />
    <Route path="/adviceos" element={<UnifiedComplianceCentre />} />
    <Route path="/enterprise" element={<Navigate to="/adviceos" replace />} />
    <Route path="/adviser-compliance" element={<AdviserComplianceDashboard />} />
    <Route path="/risk-profiler" element={<RiskProfiler />} />
    <Route path="/risk-control" element={<Navigate to="/adviceos" replace />} />
    <Route path="/breach-register" element={<Navigate to="/adviceos" replace />} />
    <Route path="/replay-advice" element={<ReplayAdvicePage />} />
    <Route path="/cost-reduction" element={<CostReductionDashboard />} />
    <Route path="/documents" element={<DocumentsCommunications />} />
    <Route path="/document-vault" element={<DocumentVault />} />
    <Route path="/estate-planning" element={<EstatePlanning />} />
    <Route path="/statement-of-advice" element={<StatementOfAdvice />} />

    {/* Research / Markets */}
    <Route path="/stock-research" element={<UnifiedResearchCentre />} />
    <Route path="/broker-research" element={<Navigate to="/stock-research" replace />} />
    <Route path="/investment-comparison" element={<Navigate to="/stock-research" replace />} />
    <Route path="/market-data" element={<Suspense fallback={<PageLoader />}><MarketData /></Suspense>} />
    <Route path="/macro-dashboard" element={<MacroDashboard />} />
    <Route path="/data-aggregators" element={<DataAggregators />} />
    <Route path="/realtime-data" element={<RealtimeDataDashboard />} />
    <Route path="/product-marketplace" element={<ProductMarketplace />} />
    <Route path="/wealth-dashboard" element={<Navigate to="/dashboard" replace />} />

    {/* Integrations & Data */}
    <Route path="/xplan-integration" element={<XplanIntegration />} />
    <Route path="/xplan" element={<XplanSyncPage />} />
    <Route path="/platform-integrations" element={<PlatformIntegrations />} />
    <Route path="/live-sync" element={<LiveSyncDashboard />} />
    <Route path="/data-import" element={<DataImport />} />
    <Route path="/bank-feeds" element={<BankFeeds />} />
    <Route path="/accounting-integrations" element={<AccountingIntegrations />} />
    <Route path="/data-import-export" element={<DataImportExportPage />} />
    <Route path="/connected-accounts" element={<ConnectedAccounts />} />

    {/* Firm & Admin */}
    <Route path="/my-vault" element={<MyVault />} />
    <Route path="/my-settings" element={<MySettings />} />
    <Route path="/practice-management" element={<PracticeManagement />} />
    <Route path="/revenue-billing" element={<RevenueBilling />} />
    <Route path="/reports" element={<ReportGenerator />} />
    <Route path="/export" element={<ExportData />} />
    <Route path="/collaboration" element={<Collaboration />} />
    <Route path="/security" element={<SecuritySettings />} />
    <Route path="/notifications" element={<NotificationCenter />} />
    <Route path="/notification-center" element={<NotificationCenterPage />} />
    <Route path="/notification-settings" element={<NotificationSettings />} />
    <Route path="/stress-test" element={<StressTestDashboard />} />
    <Route path="/net-worth-trend" element={<NetWorthTrend />} />
    <Route path="/insurance-gap" element={<InsuranceGapAnalysis />} />
  </Routes>
);

export default AppRouter;
