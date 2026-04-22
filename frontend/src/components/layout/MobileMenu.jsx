import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Menu, X, Briefcase, Eye,
  LayoutDashboard, Wallet, Target, FileText, Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationsPanel from "@/components/NotificationsPanel";
import { mobileBottomNav } from "./navData";

const MobileMenu = ({
  mobileMenuOpen, setMobileMenuOpen,
  appMode, switchMode, activeNavGroups,
}) => {
  const location = useLocation();

  return (
    <>
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

      {/* Mobile Menu Overlay */}
      <div className={cn("lg:hidden fixed inset-0 z-40 transition-all duration-300", mobileMenuOpen ? "visible" : "invisible")}>
        <div className={cn("absolute inset-0 bg-black transition-opacity duration-300", mobileMenuOpen ? "opacity-50" : "opacity-0")} onClick={() => setMobileMenuOpen(false)} />
        <div
          className={cn("absolute left-0 top-0 w-72 h-full bg-[#1a2744] text-white pt-14 transition-transform duration-300 ease-out", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-3 border-b border-white/10">
            <Select value={appMode} onValueChange={(val) => { switchMode(val); setMobileMenuOpen(false); }}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adviser"><div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Adviser Mode</div></SelectItem>
                <SelectItem value="client"><div className="flex items-center gap-2"><Eye className="h-4 w-4" />Client View</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <nav className="p-3 overflow-y-auto h-[calc(100%-110px)] pb-20">
            {activeNavGroups.map((group) => (
              <div key={group.name} className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">{group.name}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.path.slice(1)}`}
                    className={cn("flex items-center gap-3 px-4 py-3 rounded-xl mb-0.5 transition-all active:scale-95", location.pathname === item.path ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 active:bg-white/20")}
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

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-full">
          {mobileBottomNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} data-testid={`bottom-nav-${item.path.slice(1)}`}
                className={cn("flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95", isActive ? "text-[#1a2744]" : "text-muted-foreground")}
              >
                <div className={cn("p-1.5 rounded-xl transition-colors", isActive && "bg-[#D4A84C]/20")}>
                  <item.icon className={cn("h-5 w-5 transition-all", isActive && "scale-110 text-[#D4A84C]")} />
                </div>
                <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileMenu;
