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
    name: "You",
    icon: LayoutDashboard,
    items: [
      { path: "/dashboard", label: "My Dashboard", icon: Eye, title: "Your confidence, plan & next steps", badge: "HOME" },
      { path: "/retirement-confidence", label: "Retirement", icon: Gauge, title: "Retirement outlook" },
      { path: "/budget", label: "Budget", icon: PiggyBank, title: "Income, expenses & savings" },
    ]
  },
  {
    name: "Portfolio",
    icon: TrendingUp,
    items: [
      { path: "/investments", label: "Investments", icon: TrendingUp, title: "Holdings & allocation" },
      { path: "/tax-analysis-sync", label: "Tax Centre", icon: Calculator, title: "Your tax picture" },
    ]
  },
  {
    name: "Documents & Account",
    icon: FileText,
    items: [
      { path: "/documents", label: "Documents", icon: FileText, title: "Statements & secure documents" },
      { path: "/bank-feeds", label: "Connected Accounts", icon: Landmark, title: "Bank feeds" },
      { path: "/security", label: "Security", icon: Shield, title: "Security & privacy" },
    ]
  },
];

export const adviserBaseNav = [
  {
    name: "Today",
    icon: LayoutDashboard,
    items: [
      { path: "/advisor-command-center", label: "Dashboard", icon: LayoutDashboard, title: "Your operating system — firm overview, alerts, opportunities" },
      { path: "/daily-briefing", label: "Daily Briefing", icon: Bell, title: "Today's priorities" },
    ]
  },
  {
    name: "Clients",
    icon: Users,
    items: [
      { path: "/adviser-hub", label: "All Clients", icon: Users, title: "Select a client to enter their profile", badge: "HUB" },
      { path: "/client-setup", label: "New Client", icon: UserPlus, title: "Setup New Client" },
    ]
  },
  {
    name: "Firm",
    icon: Settings,
    items: [
      { path: "/macro-dashboard", label: "Markets", icon: BarChart3, title: "Live Markets", badge: "LIVE" },
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
      { path: "/dashboard", label: "Client Overview", icon: Wallet, title: "Overview, Retirement, Investments, Budget, Goals, Tax & Invoicing", badge: "360" },
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
];

export const clientPortalNav = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/client-portal", label: "My Dashboard", icon: Eye, title: "Client Dashboard", badge: "HOME" },
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
