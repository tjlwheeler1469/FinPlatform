import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationsPanel from "@/components/NotificationsPanel";
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
  MoreHorizontal
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/App";

// ==================== SIMPLIFIED NAVIGATION ====================
// Following UX best practices: 6 primary sections max
// Dashboard → Finances → Planning → Clients → Reports → Calculators

// Personal Mode Navigation (5 sections + Settings)
const personalNavGroups = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/dashboard", label: "Overview", icon: LayoutDashboard, title: "Dashboard Overview" },
      { path: "/daily-briefing", label: "Daily Briefing", icon: Sun, title: "Daily Briefing" },
      { path: "/recommendations", label: "Recommendations", icon: Lightbulb, title: "Financial Recommendations" },
      { path: "/decision-engine", label: "Health Score", icon: Zap, title: "Financial Health Score" },
    ]
  },
  {
    name: "Finances",
    icon: Wallet,
    items: [
      { path: "/family-wealth", label: "Net Worth", icon: Eye, title: "Net Worth & Balance Sheet" },
      { path: "/net-worth-trend", label: "Net Worth Trend", icon: TrendingUp, title: "Net Worth Over Time" },
      { path: "/property-portfolio", label: "Property", icon: Building2, title: "Property Portfolio" },
      { path: "/share-portfolio", label: "Shares & ETFs", icon: LineChart, title: "Share Portfolio" },
      { path: "/holdings-performance", label: "Performance", icon: Activity, title: "Holdings Performance" },
      { path: "/portfolio-aggregator", label: "All Accounts", icon: Link2, title: "Portfolio Aggregation" },
      { path: "/budget", label: "Cashflow", icon: Wallet, title: "Budget & Cashflow" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/life-timeline", label: "Life Timeline", icon: Clock, title: "Life Timeline Planning" },
      { path: "/goal-tracker", label: "Goals", icon: Target, title: "Goal Progress Tracker" },
      { path: "/strategic-planning", label: "Strategy", icon: HeartPulse, title: "Strategic Planning" },
      { path: "/ai-advisor", label: "AI Advisor", icon: Sparkles, title: "AI Financial Advisor" },
      { path: "/debt-paydown", label: "Debt Paydown", icon: CreditCard, title: "Debt Paydown Strategy" },
      { path: "/insurance-gap", label: "Insurance", icon: Shield, title: "Insurance Gap Analysis" },
      { path: "/risk-profiler", label: "Risk Profile", icon: Shield, title: "Risk Profiler" },
      { path: "/scenarios", label: "Scenarios", icon: FolderOpen, title: "Saved Scenarios" },
    ]
  },
  {
    name: "Reports",
    icon: FileText,
    items: [
      { path: "/tax-analysis-sync", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
      { path: "/cgt", label: "Capital Gains", icon: TrendingUp, title: "Capital Gains Tax" },
      { path: "/tax-calendar", label: "Tax Calendar", icon: CalendarDays, title: "Tax Planning Calendar" },
      { path: "/historical-tax", label: "Tax History", icon: History, title: "Historical Tax Comparison" },
      { path: "/reports", label: "Generate Reports", icon: FileText, title: "Report Generator" },
      { path: "/documents", label: "Documents", icon: FileText, title: "Documents" },
      { path: "/data-import-export", label: "Import/Export", icon: Database, title: "Data Import & Export" },
    ]
  },
  {
    name: "Calculators",
    icon: Calculator,
    items: [
      { path: "/loan-calculator", label: "Loan", icon: Landmark, title: "Loan Calculator" },
      { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo Simulation" },
      { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF Optimizer" },
      { path: "/sg-calculator", label: "Super Guarantee", icon: Users, title: "Superannuation Guarantee" },
      { path: "/salary-packaging", label: "Salary Packaging", icon: Briefcase, title: "Salary Packaging" },
      { path: "/dividend-reinvestment", label: "Dividends", icon: Repeat, title: "Dividend Reinvestment" },
      { path: "/tax-loss-harvesting", label: "Tax Harvesting", icon: Scissors, title: "Tax Loss Harvesting" },
      { path: "/bas-calculator", label: "BAS", icon: FileCheck, title: "BAS Calculator" },
      { path: "/division-7a", label: "Division 7A", icon: FileCheck, title: "Division 7A Calculator" },
      { path: "/investment-comparison", label: "Compare Structures", icon: Scale, title: "Investment Structure Comparison" },
      { path: "/property-comparison", label: "Compare Properties", icon: Home, title: "Property Comparison" },
      { path: "/rental-yield-optimizer", label: "Rental Yield", icon: Target, title: "Rental Yield Optimizer" },
      { path: "/portfolio-rebalancing", label: "Rebalancing", icon: ArrowLeftRight, title: "Portfolio Rebalancing" },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    items: [
      { path: "/security", label: "Security", icon: Shield, title: "Security Settings" },
      { path: "/bank-feeds", label: "Bank Feeds", icon: Landmark, title: "Bank Feeds" },
      { path: "/accounting-integrations", label: "Integrations", icon: Link2, title: "Accounting Integrations" },
      { path: "/calculation-methodology", label: "Methodology", icon: BookOpen, title: "Calculation Methodology" },
      { path: "/onboarding", label: "Setup Wizard", icon: Rocket, title: "Setup Wizard" },
    ]
  }
];

// Adviser Mode Navigation (6 sections)
const adviserNavGroups = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { path: "/adviser-dashboard", label: "Overview", icon: Briefcase, title: "Adviser Dashboard" },
      { path: "/daily-briefing", label: "Daily Briefing", icon: Sun, title: "Daily Briefing" },
      { path: "/decision-engine", label: "Health Score", icon: Zap, title: "Financial Health Score" },
    ]
  },
  {
    name: "Clients",
    icon: Users,
    items: [
      { path: "/client-crm", label: "Client CRM", icon: Users, title: "Client Relationship Management" },
      { path: "/practice-management", label: "Practice", icon: ClipboardList, title: "Practice Management" },
      { path: "/collaboration", label: "Team", icon: UserPlus, title: "Collaboration" },
      { path: "/statement-of-advice", label: "SOA Generator", icon: FileText, title: "Statement of Advice" },
    ]
  },
  {
    name: "Finances",
    icon: Wallet,
    items: [
      { path: "/family-wealth", label: "Net Worth", icon: Eye, title: "Net Worth & Balance Sheet" },
      { path: "/property-portfolio", label: "Property", icon: Building2, title: "Property Portfolio" },
      { path: "/share-portfolio", label: "Shares", icon: LineChart, title: "Share Portfolio" },
      { path: "/portfolio-aggregator", label: "All Accounts", icon: Link2, title: "Portfolio Aggregation" },
      { path: "/budget", label: "Cashflow", icon: Wallet, title: "Budget & Cashflow" },
    ]
  },
  {
    name: "Planning",
    icon: Target,
    items: [
      { path: "/life-timeline", label: "Life Timeline", icon: Clock, title: "Life Timeline Planning" },
      { path: "/goal-tracker", label: "Goals", icon: Target, title: "Goal Progress Tracker" },
      { path: "/strategic-planning", label: "Strategy", icon: HeartPulse, title: "Strategic Planning" },
      { path: "/ai-advisor", label: "AI Advisor", icon: Sparkles, title: "AI Financial Advisor" },
      { path: "/risk-profiler", label: "Risk Profile", icon: Shield, title: "Risk Profiler" },
    ]
  },
  {
    name: "Reports",
    icon: FileText,
    items: [
      { path: "/revenue-billing", label: "Revenue & Billing", icon: Receipt, title: "Revenue & Billing" },
      { path: "/tax-analysis-sync", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
      { path: "/cgt", label: "Capital Gains", icon: TrendingUp, title: "Capital Gains Tax" },
      { path: "/reports", label: "Generate Reports", icon: FileText, title: "Report Generator" },
      { path: "/documents", label: "Documents", icon: FileText, title: "Documents" },
      { path: "/data-import-export", label: "Import/Export", icon: Database, title: "Data Import & Export" },
    ]
  },
  {
    name: "Calculators",
    icon: Calculator,
    items: [
      { path: "/loan-calculator", label: "Loan", icon: Landmark, title: "Loan Calculator" },
      { path: "/debt-paydown", label: "Debt Paydown", icon: CreditCard, title: "Debt Paydown Planner" },
      { path: "/insurance-gap", label: "Insurance Gap", icon: Shield, title: "Insurance Gap Analysis" },
      { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF Optimizer" },
      { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo Simulation" },
    ]
  },
  {
    name: "Settings",
    icon: Settings,
    items: [
      { path: "/security", label: "Security", icon: Shield, title: "Security Settings" },
    ]
  }
];

// Flatten all nav items for title lookup
const allNavItems = [...personalNavGroups, ...adviserNavGroups].flatMap(group => group.items);

// Mobile bottom navigation - simplified to match new 5-tab structure
const mobileBottomNav = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/family-wealth", label: "Finances", icon: Wallet },
  { path: "/life-timeline", label: "Planning", icon: Target },
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
  
  // Get the right nav groups based on mode
  const activeNavGroups = appMode === "adviser" ? adviserNavGroups : personalNavGroups;
  
  const [expandedGroups, setExpandedGroups] = useState(() => {
    return activeNavGroups.reduce((acc, group) => {
      acc[group.name] = true;
      return acc;
    }, {});
  });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Ref for sidebar scroll position preservation
  const sidebarNavRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Update expanded groups when mode changes
  useEffect(() => {
    setExpandedGroups(activeNavGroups.reduce((acc, group) => {
      acc[group.name] = true;
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
      document.title = `${currentNav.title} | Wheeler Family Portfolio`;
    } else {
      document.title = "Wheeler Family Portfolio";
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
          sidebarCollapsed ? "w-16" : "w-56"
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

        {/* Save Button - Shows when there are unsaved changes */}
        {hasUnsavedChanges && !sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-white/10">
            <Button 
              onClick={saveAllData}
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F392B] font-semibold"
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
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F392B]"
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

        {/* Navigation */}
        <nav 
          ref={sidebarNavRef}
          onScroll={handleSidebarScroll}
          className="flex-1 overflow-y-auto py-2 px-2"
        >
          {activeNavGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
            <div key={group.name} className="mb-1">
              {/* Group Header */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
                    isGroupActive(group) ? "text-[#D4AF37]" : "text-white/50 hover:text-white/70"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {GroupIcon && <GroupIcon className="h-3.5 w-3.5" />}
                    {group.name}
                  </span>
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    expandedGroups[group.name] ? "rotate-0" : "-rotate-90"
                  )} />
                </button>
              )}
              
              {/* Collapsed mode - show group icon */}
              {sidebarCollapsed && GroupIcon && (
                <div 
                  className={cn(
                    "flex items-center justify-center p-2 mb-1 rounded-lg cursor-pointer",
                    isGroupActive(group) ? "text-[#D4AF37]" : "text-white/50 hover:text-white/70"
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
                          ? "bg-white/20 text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#D4AF37] text-[#0F392B] rounded">
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F392B] text-white z-50 flex items-center justify-between px-4 safe-area-inset-top">
        <Link to="/dashboard" className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
          <span className="font-bold font-['Manrope'] text-sm">Wheeler Family</span>
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
            "absolute left-0 top-0 w-72 h-full bg-[#0F392B] text-white pt-14 transition-transform duration-300 ease-out",
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
                    ? "text-[#0F392B]" 
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive && "bg-[#0F392B]/10"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all",
                    isActive && "scale-110"
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
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-56"
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
