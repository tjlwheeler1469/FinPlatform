import {
  TrendingUp, LayoutDashboard, Calculator, Building2, BarChart3, Landmark,
  FolderOpen, FileText, PiggyBank, Briefcase, Wallet,
  Users, Lightbulb, PieChart, CalendarDays, Eye, LineChart,
  Target, Activity, Bot, Upload, Database, Link2, Shield,
  UserPlus, Sparkles, Bell, Zap, CreditCard,
  Settings, MessageSquare, Brain, ListTodo, Video,
  Bitcoin, Coins, Cable, Gauge, Calendar, TrendingUp as TrendingUpIcon
} from "lucide-react";

export const personalNavGroups = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/dashboard", label: "My Dashboard", icon: Eye, title: "Dashboard & Net Worth", badge: "HOME" },
      { path: "/macro-dashboard", label: "Markets", icon: BarChart3, title: "Live Markets", badge: "LIVE" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/retirement-confidence", label: "Retirement", icon: Gauge, title: "Retirement Planning & Confidence", badge: "PRO" },
      { path: "/scenario-modelling", label: "Goals & Scenarios", icon: Target, title: "Goals & Scenario Modelling" },
      { path: "/portfolio-rebalancing", label: "Rebalancing", icon: BarChart3, title: "Portfolio Rebalancing" },
    ]
  },
  {
    name: "Investments",
    icon: TrendingUp,
    items: [
      { path: "/investments", label: "All Investments", icon: TrendingUp, title: "Investment Portfolio", badge: "NEW" },
      { path: "/cash-deposits", label: "Cash & TDs", icon: PiggyBank, title: "Cash & Term Deposits" },
      { path: "/super-pension", label: "Super & Pension", icon: Shield, title: "Superannuation & Pension" },
    ]
  },
  {
    name: "Tools",
    icon: Calculator,
    items: [
      { path: "/loan-calculator", label: "Loan Calculator", icon: Landmark, title: "Loan Calculator" },
      { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo Simulator" },
      { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF Optimizer" },
      { path: "/tax-analysis-sync", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
      { path: "/cgt", label: "Capital Gains", icon: TrendingUp, title: "CGT Calculator" },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    items: [
      { path: "/security", label: "Security", icon: Shield, title: "Security" },
      { path: "/bank-feeds", label: "Bank Feeds", icon: Landmark, title: "Bank Feeds" },
      { path: "/data-import-export", label: "Import/Export", icon: Database, title: "Data Import/Export" },
      { path: "/documents", label: "Documents", icon: FileText, title: "Documents" },
    ]
  }
];

export const adviserBaseNav = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/advisor-command-center", label: "Command Center", icon: LayoutDashboard, title: "Advisor Command Center" },
      { path: "/daily-briefing", label: "Daily Briefing", icon: Calendar, title: "Daily Briefing", badge: "NEW" },
      { path: "/macro-dashboard", label: "Markets", icon: BarChart3, title: "Live Markets", badge: "LIVE" },
    ]
  },
  {
    name: "CRM",
    icon: Users,
    items: [
      { path: "/adviser-hub", label: "Client Hub", icon: Zap, title: "Clients & Portfolio", badge: "HUB" },
    ]
  },
  {
    name: "AI & Tasks",
    icon: Bot,
    items: [
      { path: "/ai-copilot-advanced", label: "AI Assistant", icon: MessageSquare, title: "AI Copilot & Tasks", badge: "AI" },
      { path: "/meeting-prep", label: "Meeting Prep", icon: Sparkles, title: "Meeting Preparation" },
    ]
  },
  {
    name: "Execution",
    icon: Zap,
    items: [
      { path: "/batch-execution", label: "Batch Execute", icon: Zap, title: "Batch Execution" },
    ]
  },
  {
    name: "Compliance",
    icon: Shield,
    items: [
      { path: "/adviceos", label: "AdviceOS", icon: Shield, title: "Compliance-First Decisions", badge: "NEW" },
      { path: "/enterprise", label: "Compliance Dashboard", icon: Shield, title: "Compliance Dashboard", badge: "NEW" },
      { path: "/security", label: "Security", icon: Shield, title: "Security" },
    ]
  },
  {
    name: "Integrations",
    icon: Link2,
    items: [
      { path: "/xplan", label: "Xplan Sync", icon: Cable, title: "Xplan Integration" },
      { path: "/platform-integrations", label: "Platforms", icon: Cable, title: "Platform Integrations", badge: "NEW" },
      { path: "/live-sync", label: "Live Sync", icon: Activity, title: "Live Sync Dashboard", badge: "LIVE" },
    ]
  },
  {
    name: "Tools",
    icon: Settings,
    items: [
      { path: "/notification-center", label: "Notifications", icon: Bell, title: "Notification Center", badge: "NEW" },
      { path: "/stress-test", label: "Stress Test", icon: Zap, title: "Stress Test", badge: "NEW" },
    ]
  }
];

export const clientContextNav = [
  {
    name: "Overview",
    icon: Eye,
    items: [
      { path: "/dashboard", label: "Client Overview", icon: Wallet, title: "Client 360 & Net Worth", badge: "360" },
      { path: "/retirement-confidence", label: "Retirement", icon: Gauge, title: "Retirement Planning & Confidence", badge: "PRO" },
      { path: "/decision-engine", label: "Health Score", icon: Zap, title: "Financial Health Score" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/scenario-modelling", label: "Goals & Scenarios", icon: Target, title: "Goals & Scenario Modelling" },
      { path: "/next-best-actions", label: "Actions", icon: Zap, title: "Next Best Actions" },
      { path: "/tax-analysis-sync", label: "Tax Analysis", icon: FileText, title: "Tax Analysis & CGT" },
    ]
  },
  {
    name: "Investments",
    icon: TrendingUp,
    items: [
      { path: "/investments", label: "All Investments", icon: TrendingUp, title: "Investment Portfolio", badge: "NEW" },
      { path: "/cash-deposits", label: "Cash & TDs", icon: PiggyBank, title: "Cash & Term Deposits" },
      { path: "/super-pension", label: "Super & Pension", icon: Shield, title: "Superannuation & Pension" },
    ]
  },
  {
    name: "Documents",
    icon: FileText,
    items: [
      { path: "/document-vault", label: "Vault", icon: FolderOpen, title: "Document Vault" },
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Meeting Notes", badge: "NEW" },
      { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
      { path: "/adviser-compliance", label: "Compliance", icon: Shield, title: "Adviser Compliance Dashboard" },
    ]
  },
];

export const mobileBottomNav = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/investments", label: "Investments", icon: TrendingUp },
  { path: "/goal-tracker", label: "Goals", icon: Target },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/loan-calculator", label: "Calc", icon: Calculator },
];

export const allNavItems = [...personalNavGroups, ...adviserBaseNav, ...clientContextNav].flatMap(g => g.items);
