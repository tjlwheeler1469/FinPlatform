import { Button } from "@/components/ui/button";
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
  Users,
  Shield,
  FileCheck,
  Receipt,
  Lightbulb,
  PieChart
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
  { path: "/recommendations", label: "Recommendations", icon: Lightbulb, title: "Financial Recommendations" },
  { path: "/budget", label: "Budget", icon: Wallet, title: "Household Budget" },
  { path: "/income-splitting", label: "Income Splitting", icon: Users, title: "Income Splitting" },
  { path: "/trust-distributions", label: "Trust Analysis", icon: PieChart, title: "Trust Distribution Analysis" },
  { path: "/tax-analysis", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
  { path: "/cgt-calculator", label: "CGT Calculator", icon: TrendingUp, title: "Capital Gains Tax" },
  { path: "/cgt-events", label: "CGT Events", icon: Receipt, title: "CGT Event Tracker" },
  { path: "/tax-loss-harvesting", label: "Tax Harvesting", icon: Scissors, title: "Tax Loss Harvesting" },
  { path: "/historical-tax", label: "Tax History", icon: History, title: "Tax History" },
  { path: "/division-7a", label: "Division 7A", icon: FileCheck, title: "Division 7A Calculator" },
  { path: "/property-portfolio", label: "Properties", icon: Building2, title: "Property Portfolio" },
  { path: "/property-comparison", label: "Compare Properties", icon: Home, title: "Property Comparison" },
  { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF Optimizer" },
  { path: "/salary-packaging", label: "Salary Packaging", icon: Briefcase, title: "Salary Packaging" },
  { path: "/dividend-reinvestment", label: "Dividends", icon: Repeat, title: "Dividend Reinvestment" },
  { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo Simulation" },
  { path: "/loan-calculator", label: "Loan Calculator", icon: Landmark, title: "Loan Calculator" },
  { path: "/scenario-comparison", label: "Compare Scenarios", icon: Scale, title: "Scenario Comparison" },
  { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
  { path: "/scenarios", label: "Saved Scenarios", icon: FolderOpen, title: "Saved Scenarios" },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fix page title on navigation
  useEffect(() => {
    const currentNav = navItems.find(item => item.path === location.pathname);
    if (currentNav) {
      document.title = `${currentNav.title} | Wheeler Family Portfolio`;
    } else {
      document.title = "Wheeler Family Portfolio";
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex">
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.path.slice(1)}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors",
                location.pathname === item.path
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
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
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F392B] text-white z-50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-[#D4AF37]" />
          <span className="font-bold font-['Manrope']">Wheeler Family</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:bg-white/10"
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-64 h-full bg-[#0F392B] text-white pt-16"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 overflow-y-auto h-full">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.path.slice(1)}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors",
                    location.pathname === item.path
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          "pt-16 lg:pt-0",
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
