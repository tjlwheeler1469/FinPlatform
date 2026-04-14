import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, X, Lock, Unlock, Mic } from "lucide-react";
import VoiceAssistant from "@/components/VoiceAssistant";
import CommandPalette from "@/components/CommandPalette";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePortfolio } from "@/App";
import DesktopSidebar from "@/components/layout/DesktopSidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import { personalNavGroups, adviserBaseNav, clientContextNav, clientPortalNav, allNavItems } from "@/components/layout/navData";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasUnsavedChanges, saveAllData } = usePortfolio();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appMode, setAppMode] = useState(() => localStorage.getItem("app_mode") || "personal");
  const [meetingMode, setMeetingMode] = useState(() => localStorage.getItem("meeting_mode") === "true");
  const [selectedClient, setSelectedClient] = useState(() => {
    const saved = localStorage.getItem("selected_client");
    return saved ? JSON.parse(saved) : null;
  });
  const [expandedGroups, setExpandedGroups] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const sidebarNavRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const getActiveNavGroups = useCallback(() => {
    if (appMode === "adviser") {
      return selectedClient ? clientContextNav : adviserBaseNav;
    }
    // Client portal gets minimal nav
    if (location.pathname === "/client-portal") {
      return clientPortalNav;
    }
    return personalNavGroups;
  }, [appMode, selectedClient, location.pathname]);

  const activeNavGroups = getActiveNavGroups();

  // Persist meeting mode
  useEffect(() => {
    localStorage.setItem("meeting_mode", meetingMode.toString());
    window.dispatchEvent(new CustomEvent('meetingModeChange', { detail: { meetingMode } }));
  }, [meetingMode]);

  // Persist selected client
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem("selected_client", JSON.stringify(selectedClient));
    } else {
      localStorage.removeItem("selected_client");
    }
  }, [selectedClient]);

  // Keyboard shortcut (Cmd+K)
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

  // Expand active nav group on mode change
  useEffect(() => {
    const groups = getActiveNavGroups();
    const activeGroup = groups.find(g => g.items.some(item => location.pathname === item.path));
    setExpandedGroups(groups.reduce((acc, group) => {
      acc[group.name] = activeGroup ? group.name === activeGroup.name : group.name === "Dashboard";
      return acc;
    }, {}));
  }, [appMode, getActiveNavGroups, location.pathname]);

  // Page title
  useEffect(() => {
    const currentNav = allNavItems.find(item => item.path === location.pathname);
    document.title = currentNav ? `${currentNav.title} | Halcyon Wealth` : "Halcyon Wealth";
  }, [location.pathname]);

  // Preserve sidebar scroll on navigation
  useEffect(() => {
    const savedScroll = scrollPositionRef.current;
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTo(0, 0);
    const sidebar = sidebarNavRef.current;
    if (sidebar && savedScroll > 0) {
      sidebar.scrollTop = savedScroll;
      let attempts = 0;
      const id = setInterval(() => {
        if (sidebar.scrollTop === savedScroll || attempts >= 10) clearInterval(id);
        else { sidebar.scrollTop = savedScroll; attempts++; }
      }, 50);
      return () => clearInterval(id);
    }
  }, [location.pathname]);

  const switchMode = (newMode) => {
    setAppMode(newMode);
    localStorage.setItem("app_mode", newMode);
    if (newMode === "adviser") navigate("/advisor-command-center");
    else if (newMode === "client") navigate("/client-portal");
    else navigate("/personal-dashboard");
  };

  const handleClearClient = () => { setSelectedClient(null); navigate("/client-crm"); };
  const toggleGroup = (name) => setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  const isGroupActive = (group) => group.items.some(item => location.pathname === item.path);
  const handleSidebarScroll = (e) => { scrollPositionRef.current = e.target.scrollTop; };

  // Touch swipe for mobile
  const minSwipeDistance = 50;
  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance < -minSwipeDistance && touchStart < 50) setMobileMenuOpen(true);
    if (distance > minSwipeDistance && mobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <DesktopSidebar
        sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}
        appMode={appMode} switchMode={switchMode}
        meetingMode={meetingMode} setMeetingMode={setMeetingMode}
        selectedClient={selectedClient} handleClearClient={handleClearClient}
        hasUnsavedChanges={hasUnsavedChanges} saveAllData={saveAllData}
        activeNavGroups={activeNavGroups}
        expandedGroups={expandedGroups} toggleGroup={toggleGroup} isGroupActive={isGroupActive}
        sidebarNavRef={sidebarNavRef} handleSidebarScroll={handleSidebarScroll}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <MobileMenu
        mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen}
        appMode={appMode} switchMode={switchMode} activeNavGroups={activeNavGroups}
      />

      {/* Main Content */}
      <main id="main-content" className={cn("flex-1 min-h-screen transition-all duration-300 overflow-y-auto", "pt-14 pb-20 lg:pt-0 lg:pb-0", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        {appMode === "adviser" && selectedClient && (
          <div className="bg-[#D4A84C] text-black px-4 py-2 flex items-center justify-between" data-testid="client-context-banner">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Viewing: {selectedClient.name}</span>
              {selectedClient.aum && <Badge className="bg-black/10 text-black border-0">AUM: ${(selectedClient.aum / 1000000).toFixed(1)}M</Badge>}
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearClient} className="hover:bg-black/10 text-black" data-testid="exit-client-view-btn">
              <X className="h-4 w-4 mr-1" />Exit Client View
            </Button>
          </div>
        )}
        {meetingMode && (
          <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between" data-testid="meeting-mode-banner">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5" />
              <span className="font-semibold">MEETING MODE</span>
              <span className="text-sm">Live data updates paused</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setMeetingMode(false)} className="hover:bg-black/10 text-black" data-testid="exit-meeting-mode-btn">
              <Unlock className="h-4 w-4 mr-1" />Exit Meeting Mode
            </Button>
          </div>
        )}
        <div className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      <button onClick={() => setVoiceOpen(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group" data-testid="voice-assistant-fab">
        <Mic className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>
      <VoiceAssistant isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} currentPath={location.pathname} />
    </div>
  );
};

export default Layout;
