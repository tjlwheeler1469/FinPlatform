import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  LayoutDashboard,
  Wallet,
  Target,
  FileText,
  Calculator,
  Settings,
  Search,
  TrendingUp,
  Building2,
  LineChart,
  Shield,
  CreditCard,
  Clock,
  Sparkles,
  Users,
  Zap,
  PiggyBank,
  Landmark,
  Database,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

// All searchable actions and pages
const commands = [
  // Dashboard
  { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard, path: "/dashboard", category: "Dashboard" },
  { id: "decision-engine", label: "Decision Engine / Health Score", icon: Zap, path: "/decision-engine", category: "Dashboard" },
  { id: "daily-briefing", label: "Daily Briefing", icon: Clock, path: "/daily-briefing", category: "Dashboard" },
  
  // Finances
  { id: "net-worth", label: "Net Worth & Balance Sheet", icon: Wallet, path: "/family-wealth", category: "Finances" },
  { id: "net-worth-trend", label: "Net Worth Trend", icon: TrendingUp, path: "/net-worth-trend", category: "Finances" },
  { id: "property", label: "Property Portfolio", icon: Building2, path: "/property-portfolio", category: "Finances" },
  { id: "shares", label: "Shares & ETFs", icon: LineChart, path: "/share-portfolio", category: "Finances" },
  { id: "portfolio", label: "All Accounts / Portfolio Aggregator", icon: Link2, path: "/portfolio-aggregator", category: "Finances" },
  { id: "cashflow", label: "Budget & Cashflow", icon: Wallet, path: "/budget", category: "Finances" },
  
  // Planning
  { id: "timeline", label: "Life Timeline", icon: Clock, path: "/life-timeline", category: "Planning" },
  { id: "goals", label: "Goal Tracker", icon: Target, path: "/goal-tracker", category: "Planning" },
  { id: "ai-advisor", label: "AI Financial Advisor", icon: Sparkles, path: "/ai-advisor", category: "Planning" },
  { id: "debt", label: "Debt Paydown Planner", icon: CreditCard, path: "/debt-paydown", category: "Planning" },
  { id: "insurance", label: "Insurance Gap Analysis", icon: Shield, path: "/insurance-gap", category: "Planning" },
  { id: "risk", label: "Risk Profiler", icon: Shield, path: "/risk-profiler", category: "Planning" },
  
  // Reports
  { id: "tax", label: "Tax Analysis", icon: Calculator, path: "/tax-analysis-sync", category: "Reports" },
  { id: "cgt", label: "Capital Gains Tax", icon: TrendingUp, path: "/cgt", category: "Reports" },
  { id: "reports", label: "Generate Reports", icon: FileText, path: "/reports", category: "Reports" },
  { id: "import-export", label: "Data Import & Export", icon: Database, path: "/data-import-export", category: "Reports" },
  
  // Calculators
  { id: "loan-calc", label: "Loan Calculator", icon: Landmark, path: "/loan-calculator", category: "Calculators" },
  { id: "smsf", label: "SMSF Optimizer", icon: PiggyBank, path: "/smsf-optimizer", category: "Calculators" },
  { id: "monte-carlo", label: "Monte Carlo Simulation", icon: Calculator, path: "/monte-carlo", category: "Calculators" },
  
  // Settings
  { id: "security", label: "Security Settings", icon: Shield, path: "/security", category: "Settings" },
  
  // Adviser
  { id: "clients", label: "Client CRM", icon: Users, path: "/client-crm", category: "Adviser" },
];

const CommandPalette = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          navigate(filteredCommands[selectedIndex].path);
          onOpenChange(false);
          setSearch("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredCommands, selectedIndex, navigate, onOpenChange]);

  const handleSelect = (path) => {
    navigate(path);
    onOpenChange(false);
    setSearch("");
  };

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search pages, tools, actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className="mb-2">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              {cmds.map((cmd) => {
                flatIndex++;
                const isSelected = flatIndex === selectedIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isSelected 
                        ? "bg-[#1a2744] text-white" 
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isSelected && "text-[#D4A84C]")} />
                    <span className="text-sm font-medium">{cmd.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No results found for "{search}"
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
            <span>Select</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
