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
  Repeat
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" },
  { path: "/tax-analysis", label: "Tax Analysis", icon: Calculator, title: "Tax Analysis" },
  { path: "/cgt-calculator", label: "CGT", icon: TrendingUp, title: "Capital Gains Tax" },
  { path: "/historical-tax", label: "Tax History", icon: History, title: "Tax History" },
  { path: "/tax-loss-harvesting", label: "Harvest", icon: Scissors, title: "Tax Loss Harvesting" },
  { path: "/property-portfolio", label: "Property", icon: Building2, title: "Property Portfolio" },
  { path: "/property-comparison", label: "Compare", icon: Home, title: "Property Comparison" },
  { path: "/smsf-optimizer", label: "SMSF", icon: PiggyBank, title: "SMSF Optimizer" },
  { path: "/salary-packaging", label: "Salary Pkg", icon: Briefcase, title: "Salary Packaging" },
  { path: "/dividend-reinvestment", label: "Dividends", icon: Repeat, title: "Dividend Reinvestment" },
  { path: "/monte-carlo", label: "Monte Carlo", icon: BarChart3, title: "Monte Carlo Simulation" },
  { path: "/loan-calculator", label: "Loans", icon: Landmark, title: "Loan Calculator" },
  { path: "/scenario-comparison", label: "Compare All", icon: Scale, title: "Scenario Comparison" },
  { path: "/reports", label: "Reports", icon: FileText, title: "Reports" },
  { path: "/scenarios", label: "Scenarios", icon: FolderOpen, title: "Saved Scenarios" },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fix page title on navigation
  useEffect(() => {
    const currentNav = navItems.find(item => item.path === location.pathname);
    if (currentNav) {
      document.title = `${currentNav.title} | WealthOptimizer AU`;
    } else {
      document.title = "WealthOptimizer AU";
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2" data-testid="logo-link">
            <TrendingUp className="h-6 w-6 text-[#0F392B]" />
            <span className="font-bold font-['Manrope'] text-foreground hidden sm:inline">
              WealthOptimizer AU
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.slice(1)}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-[#0F392B] text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background p-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.path.slice(1)}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-[#0F392B] text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
