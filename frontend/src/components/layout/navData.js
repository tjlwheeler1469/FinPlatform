import {
  TrendingUp, LayoutDashboard, Calculator,
  FolderOpen, FileText, Briefcase,
  Users, Eye,
  Target, Database, Shield,
  UserPlus,
  Settings, Brain, ListTodo, Video,
  Gauge, FolderLock, Receipt, Mail,
  Landmark, Wallet, User
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
    name: "Profile",
    icon: User,
    items: [
      { path: "/quick-overview", label: "Quick overview", icon: Gauge, title: "Multi-entity, CGT-aware retirement workbench · model prospects · export PDF · add as new client" },
    ]
  },
  {
    name: "Today",
    icon: LayoutDashboard,
    items: [
      { path: "/advisor-command-center", label: "Dashboard", icon: LayoutDashboard, title: "Firm overview, priorities & daily briefing — all in one" },
      { path: "/retirement-control-center", label: "Client Overview", icon: Gauge, title: "Retirement-first adviser dashboard", badge: "NEW" },
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
      { path: "/deals", label: "Activity", icon: Briefcase, title: "Activity pipeline · every SOA / ROA / Implementation Pack tracked from draft → executed", badge: "CRM" },
      { path: "/rbac-admin", label: "Roles", icon: Shield, title: "Role-Based Access Control matrix · principal / adviser / paraplanner / client", badge: "RBAC" },
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
      { path: "/dashboard", label: "Overview", icon: Wallet, title: "Overview, Goals, Retirement, Investments, Budget & Tax", badge: "360" },
      { path: "/client-capture", label: "Client Information", icon: ListTodo, title: "Client information: contact, service overview, reviews, FSG, risk profile" },
      { path: "/client-invoicing", label: "Invoicing", icon: Receipt, title: "Invoices, fees & billing for this client" },
    ]
  },
  {
    name: "Communications",
    icon: Mail,
    items: [
      { path: "/advice-document-builder", label: "SOA / ROA Builder", icon: FileText, title: "Generate Statement of Advice or Record of Advice (RG175 compliant, ASIC info-267/266 format)", badge: "NEW" },
      { path: "/messages", label: "Messages", icon: Mail, title: "Message this client" },
      { path: "/client-comms-checklist", label: "Checklist", icon: ListTodo, title: "Required Communications Checklist & Timeline" },
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Meeting Notes" },
      { path: "/vault-documents", label: "Vault", icon: FolderOpen, title: "Document Vault · versioned PDFs (v1/v2/v3) + metadata tag search · local persistent disk" },
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
