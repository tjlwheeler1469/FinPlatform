import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationsPanel from "@/components/NotificationsPanel";
import CommandPalette from "@/components/CommandPalette";
import { useNotifications } from "@/context/NotificationsContext";
import { 
  TrendingUp, 
  LayoutDashboard, 
  Calculator, 
  Building2, 
  BarChart3, 
  Landmark,
  FolderOpen,
  Menu,
  X,
  FileText,
  History,
  PiggyBank,
  Briefcase,
  Scale,
  Home,
  Scissors,
  Repeat,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  FileCheck,
  Lightbulb,
  PieChart,
  CalendarDays,
  Save,
  AlertCircle,
  Eye,
  LineChart,
  Download,
  BookOpen,
  Target,
  Activity,
  GitBranch,
  RefreshCw,
  Bot,
  HeartPulse,
  Upload,
  Database,
  Link2,
  Shield,
  UserPlus,
  ClipboardList,
  Sparkles,
  Bell,
  Rocket,
  Sun,
  UserCircle,
  ArrowLeftRight,
  Clock,
  Zap,
  CreditCard,
  Receipt,
  Settings,
  MoreHorizontal,
  Search,
  Command,
  MessageSquare,
  Brain,
  ListTodo,
  Video
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/App";

// ==================== CONSOLIDATED NAVIGATION ====================
// Streamlined navigation: 5-6 primary sections per mode
// Personal: Dashboard → Trading → Finances → Planning → Reports → Calculators
// Adviser: Dashboard → CRM → AI Copilot → Execution → Compliance

// Personal Mode Navigation (Consolidated)
const personalNavGroups = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/daily-briefing", label: "Daily Briefing", icon: Sun, title: "Daily Briefing" },
      { path: "/macro-dashboard", label: "Markets", icon: BarChart3, title: "Live Markets", badge: "LIVE" },
      { path: "/dashboard", label: "Retirement", icon: Target, title: "Retirement Tracker" },
      { path: "/decision-engine", label: "Health Score", icon: Zap, title: "Financial Health" },
    ]
  },
  {
    name: "Trading",
    icon: TrendingUp,
    items: [
      { path: "/stock-trading", label: "Stocks & ETFs", icon: TrendingUp, title: "Stock Trading" },
      { path: "/bonds-trading", label: "Bonds", icon: Landmark, title: "Bonds" },
      { path: "/managed-funds", label: "Funds", icon: PieChart, title: "Managed Funds" },
      { path: "/stock-research", label: "Research", icon: LineChart, title: "Stock Screener" },
    ]
  },
  {
    name: "Finances",
    icon: Wallet,
    items: [
      { path: "/family-wealth", label: "Net Worth", icon: Eye, title: "Net Worth (All Assets)" },
      { path: "/property-portfolio", label: "Property", icon: Building2, title: "Property" },
      { path: "/cash-deposits", label: "Cash & TDs", icon: PiggyBank, title: "Cash & Term Deposits" },
      { path: "/portfolio-aggregator", label: "All Accounts", icon: Link2, title: "All Accounts" },
      { path: "/budget", label: "Budget", icon: Wallet, title: "Budget & Cashflow" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/scenario-modelling", label: "Scenario Modelling", icon: Calculator, title: "Goals & Scenario Modelling", badge: "NEW" },
      { path: "/ai-advisor", label: "AI Advisor", icon: Sparkles, title: "AI Advisor" },
      { path: "/portfolio-rebalancing", label: "Rebalancing", icon: ArrowLeftRight, title: "Portfolio Rebalancing" },
    ]
  },
  {
    name: "Tax & Reports",
    icon: FileText,
    items: [
      { path: "/tax-analysis-sync", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
      { path: "/cgt", label: "Capital Gains", icon: TrendingUp, title: "CGT (All Assets)" },
      { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
      { path: "/documents", label: "Documents", icon: FileText, title: "Documents" },
    ]
  },
  {
    name: "Calculators",
    icon: Calculator,
    items: [
      { path: "/loan-calculator", label: "Loan", icon: Landmark, title: "Loan Calculator" },
      { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo" },
      { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF" },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    items: [
      { path: "/security", label: "Security", icon: Shield, title: "Security" },
      { path: "/bank-feeds", label: "Bank Feeds", icon: Landmark, title: "Bank Feeds" },
      { path: "/data-import-export", label: "Import/Export", icon: Database, title: "Data" },
    ]
  }
];

// Adviser Mode Navigation - Simplified
// Dashboard → CRM → AI Copilot → Execution → Compliance

const adviserBaseNav = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/advisor-command-center", label: "Command Center", icon: Sun, title: "Advisor Command Center" },
      { path: "/macro-dashboard", label: "Markets", icon: BarChart3, title: "Live Markets", badge: "LIVE" },
    ]
  },
  {
    name: "CRM",
    icon: Users,
    items: [
      { path: "/adviser-hub", label: "Client Hub", icon: Zap, title: "Clients & Portfolio", badge: "HUB" },
      { path: "/workflows", label: "Tasks", icon: ListTodo, title: "Tasks & Workflows" },
    ]
  },
  {
    name: "AI Copilot",
    icon: Bot,
    items: [
      { path: "/ai-copilot-advanced", label: "AI Assistant", icon: MessageSquare, title: "AI Copilot" },
      { path: "/meeting-prep", label: "Meeting Prep", icon: Sparkles, title: "Meeting Preparation" },
      { path: "/decision-center", label: "Decision Center", icon: Zap, title: "Scenario Modeling" },
    ]
  },
  {
    name: "Execution",
    icon: Zap,
    items: [
      { path: "/batch-execution", label: "Batch Execute", icon: Zap, title: "Batch Execution" },
      { path: "/stock-trading", label: "Trading", icon: TrendingUp, title: "Trading" },
    ]
  },
  {
    name: "Compliance",
    icon: Shield,
    items: [
      { path: "/compliance", label: "Compliance", icon: Shield, title: "Compliance" },
      { path: "/security", label: "Security", icon: Shield, title: "Security" },
    ]
  }
];

// Client-specific navigation (shown when client is selected)
const clientContextNav = [
  {
    name: "Overview",
    icon: LayoutDashboard,
    items: [
      { path: "/client-360", label: "Dashboard", icon: LayoutDashboard, title: "Client 360" },
      { path: "/next-best-actions", label: "Actions", icon: Zap, title: "Next Best Actions" },
      { path: "/decision-engine", label: "Health Score", icon: Zap, title: "Health Score" },
    ]
  },
  {
    name: "Plan",
    icon: Target,
    items: [
      { path: "/goal-tracker", label: "Goals", icon: Target, title: "Goals" },
      { path: "/transaction-modeler", label: "What-If", icon: Calculator, title: "What-If Modeler" },
      { path: "/financial-plan-generator", label: "Generate Plan", icon: FileText, title: "AI Plan Generator" },
    ]
  },
  {
    name: "Investments",
    icon: TrendingUp,
    items: [
      { path: "/family-wealth", label: "Net Worth", icon: Eye, title: "Net Worth" },
      { path: "/share-portfolio", label: "Shares", icon: LineChart, title: "Shares & ETFs" },
      { path: "/property-portfolio", label: "Property", icon: Building2, title: "Property" },
      { path: "/stock-trading", label: "Trading", icon: TrendingUp, title: "Trading" },
    ]
  },
  {
    name: "Documents",
    icon: FileText,
    items: [
      { path: "/document-vault", label: "Vault", icon: FolderOpen, title: "Document Vault" },
      { path: "/meeting-notes", label: "Meeting Notes", icon: Video, title: "Fathom Notes", badge: "NEW" },
      { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
    ]
  },
  {
    name: "AI",
    icon: MessageSquare,
    items: [
      { path: "/ai-copilot-advanced", label: "AI Chat", icon: MessageSquare, title: "AI Copilot" },
    ]
  }
];

// Combined for backwards compatibility
const adviserNavGroups = [...adviserBaseNav];

// Flatten all nav items for title lookup
const allNavItems = [...personalNavGroups, ...adviserBaseNav, ...clientContextNav].flatMap(group => group.items);

// Mobile bottom navigation - simplified to match new 5-tab structure
const mobileBottomNav = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/family-wealth", label: "Finances", icon: Wallet },
  { path: "/goal-tracker", label: "Goals", icon: Target },
  { path: "/reports", label: "Reports", icon: FileText },
  { path: "/loan-calculator", label: "Calc", icon: Calculator },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasUnsavedChanges, saveAllData } = usePortfolio();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appMode, setAppMode] = useState(() => localStorage.getItem("app_mode") || "personal");
  
  // Selected client for adviser mode
  const [selectedClient, setSelectedClient] = useState(() => {
    const saved = localStorage.getItem("selected_client");
    return saved ? JSON.parse(saved) : null;
  });
  
  // Get the right nav groups based on mode and client selection
  const getActiveNavGroups = () => {
    if (appMode === "adviser") {
      if (selectedClient) {
        // Show client-specific nav when client is selected
        return [...adviserBaseNav.slice(0, 2), ...clientContextNav, adviserBaseNav[2]];
      }
      return adviserBaseNav;
    }
    return personalNavGroups;
  };
  
  const activeNavGroups = getActiveNavGroups();
  
  // Save selected client to localStorage
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem("selected_client", JSON.stringify(selectedClient));
    } else {
      localStorage.removeItem("selected_client");
    }
  }, [selectedClient]);
  
  // Clear selected client when switching modes
  const handleClearClient = () => {
    setSelectedClient(null);
    navigate("/client-crm");
  };
  
  const [expandedGroups, setExpandedGroups] = useState(() => {
    return activeNavGroups.reduce((acc, group) => {
      acc[group.name] = true;
      return acc;
    }, {});
  });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // Ref for sidebar scroll position preservation
  const sidebarNavRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Command palette keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update expanded groups when mode changes - COLLAPSED by default, only expand active
  useEffect(() => {
    const activeGroup = activeNavGroups.find(group => 
      group.items.some(item => location.pathname === item.path)
    );
    setExpandedGroups(activeNavGroups.reduce((acc, group) => {
      // Only expand the group that contains the current page
      acc[group.name] = activeGroup ? group.name === activeGroup.name : group.name === "Dashboard";
      return acc;
    }, {}));
  }, [appMode]);

  const switchMode = (newMode) => {
    setAppMode(newMode);
    localStorage.setItem("app_mode", newMode);
    if (newMode === "adviser") {
      navigate("/adviser-dashboard");
    } else if (newMode === "client") {
      navigate("/client-portal");
    } else {
      navigate("/dashboard");
    }
  };

  // Fix page title on navigation
  useEffect(() => {
    const currentNav = allNavItems.find(item => item.path === location.pathname);
    if (currentNav) {
      document.title = `${currentNav.title} | Halcyon Wealth`;
    } else {
      document.title = "Halcyon Wealth";
    }
  }, [location.pathname]);

  // Preserve sidebar scroll position on navigation
  useEffect(() => {
    // Save current scroll position before navigation
    const savedScrollPosition = scrollPositionRef.current;
    
    // Scroll main content to top on route change
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    }
    
    // Restore sidebar scroll position with robust retry mechanism
    const sidebar = sidebarNavRef.current;
    if (sidebar && savedScrollPosition > 0) {
      // Immediate attempt
      sidebar.scrollTop = savedScrollPosition;
      
      // Create a function that keeps trying until successful
      let attempts = 0;
      const maxAttempts = 10;
      const intervalId = setInterval(() => {
        if (sidebar.scrollTop === savedScrollPosition || attempts >= maxAttempts) {
          clearInterval(intervalId);
        } else {
          sidebar.scrollTop = savedScrollPosition;
          attempts++;
        }
      }, 50);
      
      // Cleanup
      return () => clearInterval(intervalId);
    }
  }, [location.pathname]);

  // Save sidebar scroll position on scroll
  const handleSidebarScroll = (e) => {
    scrollPositionRef.current = e.target.scrollTop;
  };

  // Toggle group expansion
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Check if any item in group is active
  const isGroupActive = (group) => {
    return group.items.some(item => location.pathname === item.path);
  };

  // Swipe gesture handling for mobile menu
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isRightSwipe && touchStart < 50) {
      setMobileMenuOpen(true);
    }
    if (isLeftSwipe && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Left Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full bg-[#1a2744] text-white transition-all duration-300 z-50",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#D4A84C]" />
              <span className="font-bold font-serif text-sm tracking-wide">Halcyon Wealth</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/dashboard" className="mx-auto">
              <TrendingUp className="h-6 w-6 text-[#D4A84C]" />
            </Link>
          )}
          {!sidebarCollapsed && (
            <NotificationsPanel />
          )}
        </div>

        {/* Search / Command Palette Button */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 text-sm"
              data-testid="search-btn"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/5 px-1.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="px-2 py-2 border-b border-white/10">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60"
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Save Button - Shows when there are unsaved changes */}
        {hasUnsavedChanges && !sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <Button 
              onClick={saveAllData}
              className="w-full bg-[#D4A84C] hover:bg-[#D4A84C]/90 text-[#1a2744] font-semibold"
              size="sm"
              data-testid="sidebar-save-btn"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
        {hasUnsavedChanges && sidebarCollapsed && (
          <div className="px-2 py-2 border-b border-white/10">
            <Button 
              onClick={saveAllData}
              className="w-full bg-[#D4A84C] hover:bg-[#D4A84C]/90 text-[#1a2744]"
              size="icon"
              title="Save Changes"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="px-3 py-2 border-b border-white/10">
          <Select value={appMode} onValueChange={switchMode}>
            <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Personal Mode
                </div>
              </SelectItem>
              <SelectItem value="adviser">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Adviser Mode
                </div>
              </SelectItem>
              <SelectItem value="client">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Client View
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Client Indicator (Adviser Mode) */}
        {appMode === "adviser" && !sidebarCollapsed && selectedClient && (
          <div className="px-3 py-2 border-b border-white/10">
            <div className="bg-[#D4A84C]/20 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-4 w-4 text-[#D4A84C] flex-shrink-0" />
                  <span className="text-sm font-medium text-[#D4A84C] truncate">
                    {selectedClient.name}
                  </span>
                </div>
                <button 
                  onClick={handleClearClient}
                  className="text-white/60 hover:text-white p-1"
                  title="Back to all clients"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Prompt to select client (Adviser Mode without client) */}
        {appMode === "adviser" && !sidebarCollapsed && !selectedClient && (
          <div className="px-3 py-2 border-b border-white/10">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <p className="text-xs text-white/60">
                Select a client to view their data
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav 
          ref={sidebarNavRef}
          onScroll={handleSidebarScroll}
          className="flex-1 overflow-y-auto py-2 px-2"
        >
          {activeNavGroups.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = isGroupActive(group);
            return (
            <div key={group.name} className="mb-2">
              {/* Group Header - ENHANCED VISIBILITY */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                    groupActive 
                      ? "bg-[#D4A84C]/20 text-[#D4A84C] border-l-2 border-[#D4A84C]" 
                      : "text-white/80 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    {GroupIcon && <GroupIcon className={cn("h-4 w-4 flex-shrink-0", groupActive ? "text-[#D4A84C]" : "")} />}
                    <span className="truncate">{group.name}</span>
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform ml-1",
                    expandedGroups[group.name] ? "rotate-0" : "-rotate-90"
                  )} />
                </button>
              )}
              
              {/* Collapsed mode - show group icon */}
              {sidebarCollapsed && GroupIcon && (
                <div 
                  className={cn(
                    "flex items-center justify-center p-2 mb-1 rounded-lg cursor-pointer transition-all",
                    groupActive 
                      ? "text-[#D4A84C] bg-[#D4A84C]/20" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                  onClick={() => toggleGroup(group.name)}
                  title={group.name}
                >
                  <GroupIcon className="h-5 w-5" />
                </div>
              )}
              
              {/* Group Items */}
              {(sidebarCollapsed || expandedGroups[group.name]) && (
                <div className={cn(!sidebarCollapsed && "ml-1")}>
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`nav-${item.path.slice(1)}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors",
                        location.pathname === item.path
                          ? "bg-[#D4A84C]/20 text-[#D4A84C]"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#D4A84C] text-[#1a2744] rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )})}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-12 flex items-center justify-center border-t border-white/10 hover:bg-white/10 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#1a2744] text-white z-50 flex items-center justify-between px-4 safe-area-inset-top">
        <Link to="/dashboard" className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#D4A84C]" />
          <span className="font-bold font-serif text-sm tracking-wide">Halcyon Wealth</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationsPanel />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-white/10 h-10 w-10"
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay - Swipeable */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 z-40 transition-all duration-300",
          mobileMenuOpen ? "visible" : "invisible"
        )}
      >
        {/* Backdrop */}
        <div 
          className={cn(
            "absolute inset-0 bg-black transition-opacity duration-300",
            mobileMenuOpen ? "opacity-50" : "opacity-0"
          )}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Slide-out Menu */}
        <div 
          className={cn(
            "absolute left-0 top-0 w-72 h-full bg-[#1a2744] text-white pt-14 transition-transform duration-300 ease-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Mode Switcher */}
          <div className="px-3 py-3 border-b border-white/10">
            <Select value={appMode} onValueChange={(val) => { switchMode(val); setMobileMenuOpen(false); }}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Personal Mode
                  </div>
                </SelectItem>
                <SelectItem value="adviser">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Adviser Mode
                  </div>
                </SelectItem>
                <SelectItem value="client">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Client View
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <nav className="p-3 overflow-y-auto h-[calc(100%-110px)] pb-20">
            {activeNavGroups.map((group) => (
              <div key={group.name} className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  {group.name}
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.path.slice(1)}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl mb-0.5 transition-all active:scale-95",
                      location.pathname === item.path
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10 active:bg-white/20"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-full">
          {mobileBottomNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`bottom-nav-${item.path.slice(1)}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95",
                  isActive 
                    ? "text-[#1a2744]" 
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive && "bg-[#D4A84C]/20"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "scale-110 text-[#D4A84C]"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main 
        id="main-content"
        className={cn(
          "flex-1 min-h-screen transition-all duration-300 overflow-y-auto",
          "pt-14 pb-20 lg:pt-0 lg:pb-0",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
    </div>
  );
};

export default Layout;
