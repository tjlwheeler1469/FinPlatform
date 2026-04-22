import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  TrendingUp, Search, Save, ChevronLeft, ChevronRight, ChevronDown,
  Users, X, Briefcase, Eye, Lock, Presentation, Unlock, Globe, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useLanguage, LANGUAGE_LABELS } from "@/components/LanguageContext";

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();
  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-white/60 flex-shrink-0" />
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="flex-1 bg-white/10 border-0 text-white/80 text-xs rounded px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/30"
        data-testid="language-selector"
      >
        {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
          <option key={code} value={code} className="bg-[#1a2744] text-white">{label}</option>
        ))}
      </select>
    </div>
  );
};

const DesktopSidebar = ({
  sidebarCollapsed, setSidebarCollapsed, appMode, switchMode,
  meetingMode, setMeetingMode, selectedClient, handleClearClient,
  hasUnsavedChanges, saveAllData, activeNavGroups,
  expandedGroups, toggleGroup, isGroupActive,
  sidebarNavRef, handleSidebarScroll,
  onOpenCommandPalette,
}) => {
  const location = useLocation();

  return (
    <aside className={cn(
      "hidden lg:flex flex-col fixed left-0 top-0 h-full bg-[#1a2744] text-white transition-all duration-300 z-50",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!sidebarCollapsed ? (
          <Link to="/dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#D4A84C]" />
            <span className="font-bold font-serif text-sm tracking-wide">Halcyon Wealth</span>
          </Link>
        ) : (
          <Link to="/dashboard" className="mx-auto">
            <TrendingUp className="h-6 w-6 text-[#D4A84C]" />
          </Link>
        )}
        {!sidebarCollapsed && <NotificationsPanel />}
      </div>

      {/* Search */}
      <div className={cn("border-b border-white/10", sidebarCollapsed ? "px-2 py-2" : "px-3 py-2")}>
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "w-full flex items-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60",
            sidebarCollapsed ? "justify-center p-2" : "gap-2 px-3 py-2 text-sm"
          )}
          data-testid="search-btn"
          title={sidebarCollapsed ? "Search (⌘K)" : undefined}
        >
          <Search className="h-4 w-4" />
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left">Search...</span>
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/5 px-1.5 font-mono text-[10px] font-medium">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Save Button */}
      {hasUnsavedChanges && (
        <div className={cn("border-b border-white/10", sidebarCollapsed ? "px-2 py-2" : "px-3 py-2")}>
          <Button onClick={saveAllData} className="w-full bg-[#D4A84C] hover:bg-[#D4A84C]/90 text-[#1a2744] font-semibold" size={sidebarCollapsed ? "icon" : "sm"} data-testid="sidebar-save-btn">
            <Save className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">Save Changes</span>}
          </Button>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="px-3 py-2 border-b border-white/10">
        <Select value={appMode} onValueChange={switchMode}>
          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="adviser"><div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />Adviser Mode</div></SelectItem>
            <SelectItem value="client"><div className="flex items-center gap-2"><Eye className="h-4 w-4" />Client View</div></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meeting Mode Toggle */}
      {appMode === "adviser" && (
        <div className={cn("border-b border-white/10", sidebarCollapsed ? "px-2 py-2" : "px-3 py-2")}>
          <button
            onClick={() => setMeetingMode(!meetingMode)}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg transition-all",
              sidebarCollapsed ? "justify-center p-2" : "px-3 py-2",
              meetingMode ? "bg-amber-500/20 border border-amber-500/50 text-amber-400" : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            )}
            data-testid="meeting-mode-toggle"
            title={sidebarCollapsed ? (meetingMode ? "Exit Meeting Mode" : "Enter Meeting Mode") : undefined}
          >
            {meetingMode ? <Lock className="h-4 w-4" /> : <Presentation className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="text-sm">{meetingMode ? "Meeting Mode ON" : "Enter Meeting Mode"}</span>}
          </button>
        </div>
      )}

      {/* Selected Client */}
      {appMode === "adviser" && !sidebarCollapsed && selectedClient && (
        <div className="px-3 py-2 border-b border-white/10">
          <div className="bg-[#D4A84C]/20 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 text-[#D4A84C] flex-shrink-0" />
                <span className="text-sm font-medium text-[#D4A84C] truncate">{selectedClient.name}</span>
              </div>
              <button onClick={handleClearClient} className="text-white/60 hover:text-white p-1" title="Back to all clients">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      {appMode === "adviser" && !sidebarCollapsed && !selectedClient && (
        <div className="px-3 py-2 border-b border-white/10">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-xs text-white/60">Select a client to view their data</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav ref={sidebarNavRef} onScroll={handleSidebarScroll} className="flex-1 overflow-y-auto py-3 px-2">
        {activeNavGroups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = isGroupActive(group);
          return (
            <div key={group.name} className="mb-1">
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all",
                    groupActive ? "text-[#D4A84C]" : "text-white/50 hover:text-white/80"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    {GroupIcon && <GroupIcon className={cn("h-3.5 w-3.5 flex-shrink-0", groupActive && "text-[#D4A84C]")} />}
                    <span className="truncate">{group.name}</span>
                  </span>
                  <ChevronDown className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform ml-1", expandedGroups[group.name] ? "rotate-0" : "-rotate-90")} />
                </button>
              )}
              {sidebarCollapsed && GroupIcon && (
                <div
                  className={cn("flex items-center justify-center p-2 mb-1 rounded-lg cursor-pointer transition-all", groupActive ? "text-[#D4A84C] bg-[#D4A84C]/10" : "text-white/50 hover:text-white hover:bg-white/10")}
                  onClick={() => toggleGroup(group.name)}
                  title={group.name}
                >
                  <GroupIcon className="h-5 w-5" />
                </div>
              )}
              {(sidebarCollapsed || expandedGroups[group.name]) && (
                <div className={cn(!sidebarCollapsed && "ml-1 mt-0.5")}>
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`nav-${item.path.slice(1)}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-md mb-px transition-colors",
                        location.pathname === item.path
                          ? "bg-[#D4A84C]/15 text-[#D4A84C] font-medium"
                          : "text-white/70 hover:bg-white/8 hover:text-white"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span className="text-sm truncate flex-1">{item.label}</span>}
                      {!sidebarCollapsed && item.badge && (
                        <span className={cn(
                          "px-1.5 py-0.5 text-[9px] font-bold rounded",
                          item.badge === "LIVE" ? "bg-emerald-500/20 text-emerald-400" :
                          item.badge === "AI" ? "bg-purple-500/20 text-purple-400" :
                          item.badge === "360" ? "bg-blue-500/20 text-blue-400" :
                          item.badge === "HUB" ? "bg-[#D4A84C]/20 text-[#D4A84C]" :
                          "bg-white/10 text-white/60"
                        )}>{item.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="px-3 py-2 border-t border-white/10">
          <LanguageSelector />
        </div>
      )}

      <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="h-12 flex items-center justify-center border-t border-white/10 hover:bg-white/10 transition-colors">
        {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
};

export default DesktopSidebar;
