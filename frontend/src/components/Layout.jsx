import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/App";

// Grouped navigation structure
const navGroups = [
  {
    name: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
      { path: "/overview", label: "Family Overview", icon: Eye, title: "Family Overview" },
      { path: "/recommendations", label: "Recommendations", icon: Lightbulb, title: "Financial Recommendations" },
    ]
  },
  {
    name: "Planning",
    items: [
      { path: "/budget", label: "Budget", icon: Wallet, title: "Household Budget" },
      { path: "/trust-distributions", label: "Trust Analysis", icon: PieChart, title: "Trust Distribution Analysis" },
      { path: "/income-splitting", label: "Income Splitting", icon: Users, title: "Income Splitting" },
      { path: "/scenario-comparison", label: "Scenario Comparison", icon: Scale, title: "Scenario Comparison" },
    ]
  },
  {
    name: "Property",
    items: [
      { path: "/property-portfolio", label: "Properties", icon: Building2, title: "Property Portfolio" },
      { path: "/property-comparison", label: "Property Comparison", icon: Home, title: "Property Comparison" },
      { path: "/rental-yield-optimizer", label: "Yield Optimizer", icon: Target, title: "Rental Yield Optimizer" },
    ]
  },
  {
    name: "Shares",
    items: [
      { path: "/share-portfolio", label: "Share Portfolio", icon: LineChart, title: "Share Portfolio" },
      { path: "/holdings-performance", label: "Performance", icon: Activity, title: "Holdings Performance" },
    ]
  },
  {
    name: "Tax & CGT",
    items: [
      { path: "/tax-analysis", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
      { path: "/cgt", label: "CGT", icon: TrendingUp, title: "Capital Gains Tax" },
      { path: "/tax-calendar", label: "Tax Calendar", icon: CalendarDays, title: "Tax Planning Calendar" },
      { path: "/historical-tax", label: "Tax History", icon: History, title: "Tax History" },
      { path: "/tax-loss-harvesting", label: "Tax Harvesting", icon: Scissors, title: "Tax Loss Harvesting" },
    ]
  },
  {
    name: "Calculators",
    items: [
      { path: "/loan-calculator", label: "Loan", icon: Landmark, title: "Loan Calculator" },
      { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo Simulation" },
      { path: "/division-7a", label: "Division 7A", icon: FileCheck, title: "Division 7A Calculator" },
      { path: "/salary-packaging", label: "Salary Packaging", icon: Briefcase, title: "Salary Packaging" },
      { path: "/dividend-reinvestment", label: "Dividends", icon: Repeat, title: "Dividend Reinvestment" },
      { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF Optimizer" },
      { path: "/sg-calculator", label: "SG Calculator", icon: Users, title: "Superannuation Guarantee" },
    ]
  },
  {
    name: "Reports",
    items: [
      { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
      { path: "/scenarios", label: "Saved Scenarios", icon: FolderOpen, title: "Saved Scenarios" },
      { path: "/export", label: "Export Data", icon: Download, title: "Export Data" },
      { path: "/calculation-methodology", label: "Methodology", icon: BookOpen, title: "Calculation Methodology" },
    ]
  }
];

// Flatten for title lookup and mobile nav
const allNavItems = navGroups.flatMap(group => group.items);

// Mobile bottom navigation - key features for quick access
const mobileBottomNav = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/recommendations", label: "Advice", icon: Lightbulb },
  { path: "/tax-calendar", label: "Calendar", icon: CalendarDays },
  { path: "/budget", label: "Budget", icon: Wallet },
  { path: "/reports", label: "Reports", icon: FileText },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { hasUnsavedChanges, saveAllData } = usePortfolio();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Expand all groups by default
    return navGroups.reduce((acc, group) => {
      acc[group.name] = true;
      return acc;
    }, {});
  });
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Fix page title on navigation
  useEffect(() => {
    const currentNav = allNavItems.find(item => item.path === location.pathname);
    if (currentNav) {
      document.title = `${currentNav.title} | Wheeler Family Portfolio`;
    } else {
      document.title = "Wheeler Family Portfolio";
    }
  }, [location.pathname]);

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
          "hidden lg:flex flex-col fixed left-0 top-0 h-full bg-[#0F392B] text-white transition-all duration-300 z-50",
          sidebarCollapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
              <span className="font-bold font-['Manrope'] text-sm">Wheeler Family</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/dashboard" className="mx-auto">
              <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
            </Link>
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {navGroups.map((group) => (
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
                  {group.name}
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    expandedGroups[group.name] ? "rotate-0" : "-rotate-90"
                  )} />
                </button>
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
                        <span className="text-sm font-medium truncate">{item.label}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:bg-white/10 h-10 w-10"
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
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
          <nav className="p-3 overflow-y-auto h-[calc(100%-56px)] pb-20">
            {navGroups.map((group) => (
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
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
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
