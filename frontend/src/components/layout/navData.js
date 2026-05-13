import {
  TrendingUp, LayoutDashboard, Calculator, Building2, BarChart3, Landmark,
  FolderOpen, FileText, PiggyBank, Briefcase, Wallet,
  Users, Lightbulb, PieChart, CalendarDays, Eye, LineChart,
  Target, Activity, Bot, Upload, Database, Link2, Shield,
  UserPlus, Sparkles, Bell, Zap, CreditCard,
  Settings, MessageSquare, Brain, ListTodo, Video,
  Bitcoin, Coins, Cable, Gauge, Calendar, FolderLock, Receipt, Mail
} from "lucide-react";

export const personalNavGroups = [
  {
    name: "You",
    icon: LayoutDashboard,
    items: [
      { path: "/dashboard", label: "My Dashboard", icon: Eye, title: "Retirement, investments, budget, tax & sandbox — all in one", badge: "HOME" },
      { path: "/messages", label: "Messages", icon: Mail, title: "Message your adviser" },
    ]
  },
  {
    name: "Documents & Account",
    icon: FileText,
    items: [
      { path: "/my-vault", label: "Vault", icon: FolderLock, title: "Secure storage for meeting notes, SOA, ROA, FSG & signed documents", badge: "SECURE" },
      { path: "/documents", label: "Documents", icon: FileText, title: "Statements & secure documents" },
      { path: "/bank-feeds", label: "Connected Accounts", icon: Landmark, title: "Bank feeds" },
      { path: "/my-settings", label: "Settings", icon: Settings, title: "Profile, ID verification, TFN, MyGov & ATO linkage" },
      { path: "/security", label: "Security", icon: Shield, title: "Security & privacy" },
    ]
  },
];

export const adviserBaseNav = [
  {
    name: "Today",
    icon: LayoutDashboard,
    items: [
      { path: "/retirement-control-center", label: "Control Center", icon: Gauge, title: "Retirement-first adviser dashboard", badge: "NEW" },
      { path: "/advisor-command-center", label: "Dashboard", icon: LayoutDashboard, title: "Firm overview, priorities & daily briefing — all in one" },
    ]
  },
  {
    name: "Clients",
    icon: Users,
    items: [
      { path: "/adviser-hub", label: "Client Hub", icon: Users, title: "All clients, comms, compliance, e-signatures", badge: "HUB" },
      { path: "/client-setup", label: "New Client", icon: UserPlus, title: "Setup New Client" },
    ]
  },
  {
    name: "Firm",
    icon: Settings,
    items: [
      { path: "/xplan-sync-hub", label: "Xplan Sync Hub", icon: Database, title: "Push & Pull across all 5 Xplan modules · Core · Xtools+ · WealthSolver · IPS · Reporting", badge: "XPLAN" },
      { path: "/execution-rails", label: "Execution Rails", icon: Zap, title: "Route advice tickets through broker / super / insurance / contribution adapters", badge: "RAILS" },
      { path: "/product-marketplace", label: "Marketplace", icon: Briefcase, title: "Insurance, mortgages & investment products with referral tracking" },
      { path: "/adviser-compliance", label: "Compliance", icon: Shield, title: "Compliance Dashboard" },
      { path: "/notification-settings", label: "Settings", icon: Settings, title: "Notifications, integrations & security" },
    ]
  }
];

export const clientContextNav = [
  {
    name: "Overview",
    icon: Eye,
    items: [
      { path: "/dashboard", label: "Client Overview", icon: Wallet, title: "Overview, Goals, Retirement, Investments, Budget & Tax", badge: "360" },
      { path: "/client-capture", label: "Key Dates & Disclosures", icon: ListTodo, title: "Xplan-style client capture: contact, service overview, reviews, FSG, risk profile" },
      { path: "/budget-reforms", label: "Budget 2027 Reforms", icon: Landmark, title: "Negative gearing, CGT (new vs existing) & discretionary trust reforms · 2026–27 Federal Budget", badge: "TAX" },
      { path: "/client-invoicing", label: "Invoicing", icon: Receipt, title: "Invoices, fees & billing for this client" },
    ]
  },
  {
    name: "Communications",
    icon: Mail,
    items: [
      { path: "/messages", label: "Messages", icon: Mail, title: "Message this client" },
      { path: "/client-comms-checklist", label: "Checklist", icon: ListTodo, title: "Required Communications Checklist & Timeline" },
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Meeting Notes" },
      { path: "/advice-document-builder", label: "SOA / ROA Builder", icon: FileText, title: "Generate Statement of Advice or Record of Advice (RG175 compliant, ASIC info-267/266 format)", badge: "NEW" },
      { path: "/document-vault", label: "Vault", icon: FolderOpen, title: "Document Vault · Reports & signed documents" },
      { path: "/ai-copilot-advanced", label: "AI Insights", icon: Brain, title: "AI-driven insights & next best actions" },
    ]
  },
];

export const clientPortalNav = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/client-home", label: "Home", icon: Gauge, title: "Your retirement readiness at a glance", badge: "NEW" },
      { path: "/client-portal", label: "Full Dashboard", icon: Eye, title: "Snapshot, Retirement, Investments, Budget, Goals, Tax" },
    ]
  },
  {
    name: "Documents",
    icon: FileText,
    items: [
      { path: "/documents", label: "Documents", icon: FileText, title: "View your documents (read-only)" },
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Adviser meeting notes" },
      { path: "/reports", label: "Reports", icon: FileText, title: "Statements & adviser reports" },
      { path: "/my-vault", label: "Vault", icon: FolderLock, title: "Secure documents (read-only)" },
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
