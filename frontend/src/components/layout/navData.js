import {
  TrendingUp, LayoutDashboard, Calculator, Building2, BarChart3, Landmark,
  FolderOpen, FileText, PiggyBank, Briefcase, Wallet,
  Users, Lightbulb, PieChart, CalendarDays, Eye, LineChart,
  Target, Activity, Bot, Upload, Database, Link2, Shield,
  UserPlus, Sparkles, Bell, Zap, CreditCard,
  Settings, MessageSquare, Brain, ListTodo, Video,
  Bitcoin, Coins, Cable, Gauge, Calendar
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
    name: "Investments",
    icon: TrendingUp,
    items: [
      { path: "/investments", label: "All Investments", icon: TrendingUp, title: "Investment Portfolio" },
      { path: "/portfolio-rebalancing", label: "Rebalancing", icon: BarChart3, title: "Portfolio Rebalancing" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/budget", label: "Budget", icon: PiggyBank, title: "Budget Management" },
      { path: "/scenario-modelling", label: "Goals & Scenarios", icon: Target, title: "Goals, Scenarios & Monte Carlo" },
      { path: "/retirement-confidence", label: "Retirement", icon: Gauge, title: "Retirement Planning & Confidence" },
      { path: "/tax-analysis-sync", label: "Tax Centre", icon: Calculator, title: "Unified Tax Centre" },
    ]
  },
  {
    name: "Research",
    icon: LineChart,
    items: [
      { path: "/stock-research", label: "Research Centre", icon: LineChart, title: "Research & Comparison" },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    items: [
      { path: "/bank-feeds", label: "Bank Feeds", icon: Landmark, title: "Bank Feeds" },
      { path: "/documents", label: "Documents", icon: FileText, title: "Documents" },
      { path: "/security", label: "Security", icon: Shield, title: "Security" },
    ]
  },
  {
    name: "Tools",
    icon: Calculator,
    items: [
      { path: "/loan-calculator", label: "Loan Calculator", icon: Landmark, title: "Loan Calculator" },
    ]
  },
];

export const adviserBaseNav = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/advisor-command-center", label: "Dashboard", icon: LayoutDashboard, title: "Adviser Dashboard" },
      { path: "/macro-dashboard", label: "Markets", icon: BarChart3, title: "Live Markets", badge: "LIVE" },
    ]
  },
  {
    name: "CRM",
    icon: Users,
    items: [
      { path: "/adviser-hub", label: "Client Hub", icon: Zap, title: "Clients & Portfolio", badge: "HUB" },
      { path: "/client-setup", label: "New Client", icon: UserPlus, title: "Setup New Client" },
      { path: "/data-import-export", label: "Import / Export", icon: Database, title: "Data Import & Export" },
    ]
  },
  {
    name: "Execution",
    icon: Zap,
    items: [
      { path: "/batch-execution", label: "Batch Execute", icon: Zap, title: "Batch Execution" },
      { path: "/meeting-prep", label: "Meeting Prep", icon: Sparkles, title: "Meeting Preparation" },
      { path: "/adviser-compliance", label: "Compliance", icon: Shield, title: "Adviser Compliance Dashboard" },
    ]
  },
  {
    name: "Integrations",
    icon: Link2,
    items: [
      { path: "/live-sync", label: "Live Sync", icon: Activity, title: "Live Sync Dashboard", badge: "LIVE" },
      { path: "/platform-integrations", label: "Platforms", icon: Cable, title: "Platform Integrations" },
      { path: "/xplan", label: "Xplan Sync", icon: Cable, title: "Xplan Integration" },
    ]
  },
  {
    name: "Tools",
    icon: Settings,
    items: [
      { path: "/notification-center", label: "Notifications", icon: Bell, title: "Notification Center" },
      { path: "/security", label: "Security", icon: Shield, title: "Security" },
    ]
  }
];

export const clientContextNav = [
  {
    name: "Overview",
    icon: Eye,
    items: [
      { path: "/dashboard", label: "Client Overview", icon: Wallet, title: "Overview, Actions, Retirement, Tax & Investments", badge: "360" },
    ]
  },
  {
    name: "Documents",
    icon: FileText,
    items: [
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Meeting Notes" },
      { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
      { path: "/document-vault", label: "Vault", icon: FolderOpen, title: "Document Vault" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/scenario-modelling", label: "Goals & Scenarios", icon: Target, title: "Goals, Scenarios & Monte Carlo" },
    ]
  },
];

export const mobileBottomNav = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/investments", label: "Investments", icon: TrendingUp },
  { path: "/scenario-modelling", label: "Goals", icon: Target },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/loan-calculator", label: "Calc", icon: Calculator },
];

export const allNavItems = [...personalNavGroups, ...adviserBaseNav, ...clientContextNav].flatMap(g => g.items);
