import {
  TrendingUp, LayoutDashboard, Calculator, Building2, BarChart3, Landmark,
  FolderOpen, FileText, PiggyBank, Briefcase, Wallet,
  Users, Lightbulb, PieChart, CalendarDays, Eye, LineChart,
  Target, Activity, Bot, Upload, Database, Link2, Shield,
  UserPlus, Sparkles, Bell, Zap, CreditCard,
  Settings, MessageSquare, Brain, ListTodo, Video,
  Bitcoin, Coins, Cable, Gauge, Calendar, FolderLock, Receipt
} from "lucide-react";

export const personalNavGroups = [
  {
    name: "You",
    icon: LayoutDashboard,
    items: [
      { path: "/dashboard", label: "My Dashboard", icon: Eye, title: "Retirement, investments, budget, tax & sandbox — all in one", badge: "HOME" },
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
      { path: "/client-invoicing", label: "Invoicing", icon: Receipt, title: "Invoices, fees & billing for this client" },
    ]
  },
  {
    name: "Documents",
    icon: FileText,
    items: [
      { path: "/client-comms-checklist", label: "Checklist", icon: ListTodo, title: "Required Communications Checklist & Timeline" },
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Meeting Notes" },
      { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
      { path: "/document-vault", label: "Vault", icon: FolderOpen, title: "Document Vault" },
    ]
  },
];

export const clientPortalNav = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/client-portal", label: "My Dashboard", icon: Eye, title: "Client Dashboard", badge: "HOME" },
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
