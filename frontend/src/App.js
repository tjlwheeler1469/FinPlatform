import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import TaxAnalysis from "@/pages/TaxAnalysis";
import PropertyPortfolio from "@/pages/PropertyPortfolio";
import MonteCarloSimulation from "@/pages/MonteCarloSimulation";
import LoanCalculator from "@/pages/LoanCalculator";
import SavedScenarios from "@/pages/SavedScenarios";
import ScenarioBuilder from "@/pages/ScenarioBuilder";
import CGTCalculator from "@/pages/CGTCalculator";
import HistoricalTaxComparison from "@/pages/HistoricalTaxComparison";
import SMSFOptimizer from "@/pages/SMSFOptimizer";
import ReportGenerator from "@/pages/ReportGenerator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];

      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        setUser(response.data);
        navigate('/dashboard', { state: { user: response.data }, replace: true });
      } catch (error) {
        console.error("Auth error:", error);
        toast.error("Authentication failed");
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

// App Router Component
const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id SYNCHRONOUSLY during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tax-analysis"
        element={
          <ProtectedRoute>
            <TaxAnalysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/property-portfolio"
        element={
          <ProtectedRoute>
            <PropertyPortfolio />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monte-carlo"
        element={
          <ProtectedRoute>
            <MonteCarloSimulation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/loan-calculator"
        element={
          <ProtectedRoute>
            <LoanCalculator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scenarios"
        element={
          <ProtectedRoute>
            <SavedScenarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scenario-builder"
        element={
          <ProtectedRoute>
            <ScenarioBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scenario-builder/:scenarioId"
        element={
          <ProtectedRoute>
            <ScenarioBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cgt-calculator"
        element={
          <ProtectedRoute>
            <CGTCalculator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historical-tax"
        element={
          <ProtectedRoute>
            <HistoricalTaxComparison />
          </ProtectedRoute>
        }
      />
      <Route
        path="/smsf-optimizer"
        element={
          <ProtectedRoute>
            <SMSFOptimizer />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportGenerator />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
