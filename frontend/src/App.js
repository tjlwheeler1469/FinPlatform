import { useState, useEffect, createContext, useContext, useCallback, Suspense } from "react";
import "@/App.css";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { XplanSyncProvider, XplanSyncIndicator } from "@/components/XplanSyncNotification";
import BrandingProvider from "@/components/BrandingProvider";
import { LanguageProvider } from "@/components/LanguageContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppRouter from "@/routes/AppRouter";
import { PageLoader } from "@/routes/lazyPages";

// Contexts
import { NotificationsProvider } from "@/context/NotificationsContext";
import { AuthProvider } from "@/context/AuthContext";

// Compliance Modal
import { ComplianceModal } from "@/components/ComplianceDisclaimer";

// Portfolio Context for sharing data across components
const PortfolioContext = createContext(null);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

// Seed data extracted to /app/frontend/src/data/portfolioSeedData.js
import {
  CLIENT_FAMILY_DATA, DEFAULT_FAMILY_MEMBERS, DEFAULT_TRUST, DEFAULT_COMPANY,
  CLIENT_PORTFOLIO_DATA, CLIENT_SHARE_DATA, DEFAULT_SHARE_PORTFOLIO,
  DEFAULT_BUDGET, DEFAULT_PORTFOLIO, RECOMMENDATIONS,
} from '@/data/portfolioSeedData';

const PortfolioProvider = ({ children }) => {
  // Core portfolio state
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [recommendations, setRecommendations] = useState(RECOMMENDATIONS);
  
  // Shared family data state
  const [familyMembers, setFamilyMembers] = useState(DEFAULT_FAMILY_MEMBERS);
  const [trust, setTrust] = useState(DEFAULT_TRUST);
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [sharePortfolio, setSharePortfolio] = useState(DEFAULT_SHARE_PORTFOLIO);
  const [company, setCompany] = useState(DEFAULT_COMPANY);
  
  // Track current client and unsaved changes
  const [activeClientId, setActiveClientId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Listen for selectedClient changes from Layout (stored in localStorage)
  useEffect(() => {
    const checkClient = () => {
      const saved = localStorage.getItem("selected_client");
      if (saved) {
        try {
          const client = JSON.parse(saved);
          const clientId = client?.id || client?.client_id;
          if (clientId && clientId !== activeClientId) {
            setActiveClientId(clientId);
            const clientData = CLIENT_FAMILY_DATA[clientId];
            if (clientData) {
              setFamilyMembers(clientData.familyMembers);
              setTrust(clientData.trust);
              setCompany(clientData.company);
              setHasUnsavedChanges(false);
            }
            // Switch portfolio data
            const portfolioData = CLIENT_PORTFOLIO_DATA[clientId];
            if (portfolioData) {
              setPortfolio(portfolioData);
            }
            // Switch share portfolio
            const shareData = CLIENT_SHARE_DATA[clientId];
            if (shareData) {
              setSharePortfolio(shareData);
            }
          }
        } catch {
          // ignore parse errors
        }
      } else if (activeClientId !== null) {
        // Client deselected, reset to default
        setActiveClientId(null);
        setFamilyMembers(DEFAULT_FAMILY_MEMBERS);
        setTrust(DEFAULT_TRUST);
        setCompany(DEFAULT_COMPANY);
        setPortfolio(CLIENT_PORTFOLIO_DATA.client_1);
        setSharePortfolio(DEFAULT_SHARE_PORTFOLIO);
      }
    };
    
    checkClient();
    
    // Listen for cross-tab storage events AND same-tab custom 'client-changed' event
    // (setSelectedClient from Layout dispatches a CustomEvent to avoid setInterval polling).
    window.addEventListener('storage', checkClient);
    window.addEventListener('client-changed', checkClient);
    return () => {
      window.removeEventListener('storage', checkClient);
      window.removeEventListener('client-changed', checkClient);
    };
  }, [activeClientId]);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const storageKey = activeClientId ? `clientData_${activeClientId}` : "halcyonClientData";
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.familyMembers) setFamilyMembers(parsed.familyMembers);
        if (parsed.trust) setTrust(parsed.trust);
        if (parsed.budget) setBudget(parsed.budget);
        if (parsed.portfolio) setPortfolio(parsed.portfolio);
        if (parsed.sharePortfolio) setSharePortfolio(parsed.sharePortfolio);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.lastSaved) setLastSaved(parsed.lastSaved);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, [activeClientId]);

  // Update family member
  const updateFamilyMember = useCallback((id, updates) => {
    setFamilyMembers(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates } : m
    ));
    setHasUnsavedChanges(true);
  }, []);

  // Add family member
  const addFamilyMember = useCallback((member) => {
    const newMember = {
      id: Date.now(),
      name: member.name || "New Member",
      relationship: member.relationship || "other",
      age: member.age || 0,
      taxableIncome: 0,
      salaryIncome: 0,
      dividendIncome: 0,
      rentalIncome: 0,
      otherIncome: 0,
      deductions: 0,
      superBalance: 0,
      isTrustBeneficiary: false,
      trustDistribution: 0,
      ...member
    };
    setFamilyMembers(prev => [...prev, newMember]);
    setHasUnsavedChanges(true);
    return newMember;
  }, []);

  // Remove family member
  const removeFamilyMember = useCallback((id) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
    setHasUnsavedChanges(true);
  }, []);

  // Update trust
  const updateTrust = useCallback((updates) => {
    setTrust(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Update budget
  const updateBudget = useCallback((category, field, value) => {
    setBudget(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Set budget frequency
  const setBudgetFrequency = useCallback((frequency) => {
    setBudget(prev => ({ ...prev, frequency }));
    setHasUnsavedChanges(true);
  }, []);

  // Save all data
  const saveAllData = useCallback(() => {
    const dataToSave = {
      familyMembers,
      trust,
      budget,
      portfolio,
      sharePortfolio,
      company,
      lastSaved: new Date().toISOString()
    };
    const storageKey = activeClientId ? `clientData_${activeClientId}` : "halcyonClientData";
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    setHasUnsavedChanges(false);
    setLastSaved(dataToSave.lastSaved);
    toast.success("All changes saved successfully");
  }, [familyMembers, trust, budget, portfolio, sharePortfolio, company, activeClientId]);

  // Reset to defaults (for current client)
  const resetToDefaults = useCallback(() => {
    const clientData = activeClientId ? CLIENT_FAMILY_DATA[activeClientId] : CLIENT_FAMILY_DATA.client_1;
    if (clientData) {
      setFamilyMembers(clientData.familyMembers);
      setTrust(clientData.trust);
      setCompany(clientData.company);
    }
    setBudget(DEFAULT_BUDGET);
    setPortfolio(DEFAULT_PORTFOLIO);
    setSharePortfolio(DEFAULT_SHARE_PORTFOLIO);
    setHasUnsavedChanges(true);
    toast.info("Reset to default values");
  }, [activeClientId]);

  // Share Portfolio functions
  const addShare = useCallback((share) => {
    const newShare = {
      id: Date.now(),
      ...share
    };
    setSharePortfolio(prev => [...prev, newShare]);
    setHasUnsavedChanges(true);
    return newShare;
  }, []);

  const updateShare = useCallback((id, updates) => {
    setSharePortfolio(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
    setHasUnsavedChanges(true);
  }, []);

  const removeShare = useCallback((id) => {
    setSharePortfolio(prev => prev.filter(s => s.id !== id));
    setHasUnsavedChanges(true);
  }, []);

  // Update company
  const updateCompany = useCallback((updates) => {
    setCompany(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Calculate dividend income by ownership type
  const getDividendsByOwnership = useCallback(() => {
    const dividends = {
      personal: {}, // { memberId: { gross, franking, net } }
      joint: { gross: 0, franking: 0, net: 0 },
      company: { gross: 0, franking: 0, net: 0 }
    };

    sharePortfolio.forEach(share => {
      const grossDividend = share.quantity * share.currentPrice * (share.dividendYield / 100);
      const frankingCredit = grossDividend * (share.frankingPercentage / 100) * (company.taxRate / (1 - company.taxRate));
      
      if (share.ownership === 'personal') {
        const ownerId = share.ownerId;
        if (!dividends.personal[ownerId]) {
          dividends.personal[ownerId] = { gross: 0, franking: 0, net: 0 };
        }
        dividends.personal[ownerId].gross += grossDividend;
        dividends.personal[ownerId].franking += frankingCredit;
        dividends.personal[ownerId].net += grossDividend + frankingCredit;
      } else if (share.ownership === 'joint') {
        dividends.joint.gross += grossDividend;
        dividends.joint.franking += frankingCredit;
        dividends.joint.net += grossDividend + frankingCredit;
      } else if (share.ownership === 'company') {
        dividends.company.gross += grossDividend;
        dividends.company.franking += frankingCredit;
        dividends.company.net += grossDividend + frankingCredit;
      }
    });

    return dividends;
  }, [sharePortfolio, company.taxRate]);

  // Get shares by ownership type
  const getSharesByOwnership = useCallback((ownership) => {
    return sharePortfolio.filter(s => s.ownership === ownership);
  }, [sharePortfolio]);

  // Calculate total portfolio value by ownership
  const getPortfolioValueByOwnership = useCallback(() => {
    const values = { personal: 0, joint: 0, company: 0, total: 0 };
    sharePortfolio.forEach(share => {
      const value = share.quantity * share.currentPrice;
      values[share.ownership] += value;
      values.total += value;
    });
    return values;
  }, [sharePortfolio]);

  // Get trust beneficiaries
  const getTrustBeneficiaries = useCallback(() => {
    return familyMembers.filter(m => m.isTrustBeneficiary);
  }, [familyMembers]);

  // Get primary earners (for tax analysis)
  const getPrimaryEarners = useCallback(() => {
    return familyMembers.filter(m => 
      m.relationship === "primary" || m.relationship === "spouse"
    );
  }, [familyMembers]);

  // Calculate total family income
  const getTotalFamilyIncome = useCallback(() => {
    return familyMembers.reduce((sum, m) => sum + (m.taxableIncome || 0), 0);
  }, [familyMembers]);

  // Calculate monthly cashflow
  const getMonthlyCashflow = useCallback(() => {
    const totalIncome = Object.values(budget.income).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
    return {
      income: totalIncome,
      expenses: totalExpenses,
      surplus: totalIncome - totalExpenses
    };
  }, [budget]);

  // Generate 12-month cashflow projection
  const getCashflowProjection = useCallback(() => {
    const monthly = getMonthlyCashflow();
    const projection = [];
    let cumulativeSavings = portfolio.investments.cash_savings;
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth + i) % 12;
      cumulativeSavings += monthly.surplus;
      
      projection.push({
        month: months[monthIndex],
        income: monthly.income,
        expenses: monthly.expenses,
        surplus: monthly.surplus,
        cumulativeSavings: Math.max(0, cumulativeSavings)
      });
    }
    
    return projection;
  }, [getMonthlyCashflow, portfolio.investments.cash_savings]);

  return (
    <PortfolioContext.Provider value={{ 
      // Original portfolio data
      portfolio, 
      setPortfolio, 
      recommendations, 
      setRecommendations,
      
      // Shared family data
      familyMembers,
      setFamilyMembers,
      updateFamilyMember,
      addFamilyMember,
      removeFamilyMember,
      
      // Trust data
      trust,
      setTrust,
      updateTrust,
      getTrustBeneficiaries,
      
      // Budget data
      budget,
      setBudget,
      updateBudget,
      setBudgetFrequency,
      
      // Share Portfolio data
      sharePortfolio,
      setSharePortfolio,
      addShare,
      updateShare,
      removeShare,
      getSharesByOwnership,
      getDividendsByOwnership,
      getPortfolioValueByOwnership,
      
      // Company data
      company,
      setCompany,
      updateCompany,
      
      // Derived data helpers
      getPrimaryEarners,
      getTotalFamilyIncome,
      getMonthlyCashflow,
      getCashflowProjection,
      
      // Active client
      activeClientId,
      
      // Save/Reset
      hasUnsavedChanges,
      lastSaved,
      saveAllData,
      resetToDefaults
    }}>
      {children}
    </PortfolioContext.Provider>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrandingProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <PortfolioProvider>
              <NotificationsProvider>
                <XplanSyncProvider>
                  <ComplianceModal />
                  <ErrorBoundary label="Application">
                    <Suspense fallback={<PageLoader />}>
                      <AppRouter />
                    </Suspense>
                  </ErrorBoundary>
                  <Toaster position="top-right" richColors />
                  <XplanSyncIndicator />
                </XplanSyncProvider>
              </NotificationsProvider>
            </PortfolioProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
      </BrandingProvider>
    </div>
  );
}

export default App;
