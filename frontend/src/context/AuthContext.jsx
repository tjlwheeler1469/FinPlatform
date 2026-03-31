import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem("auth_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = sessionStorage.getItem("auth_token");
      if (savedToken) {
        try {
          const response = await fetch(`${API_URL}/api/auth/verify-token?token=${savedToken}`);
          const data = await response.json();
          
          if (data.valid) {
            setToken(savedToken);
            setIsAuthenticated(true);
            // Get user info
            const userResponse = await fetch(`${API_URL}/api/auth/me?token=${savedToken}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
          } else {
            // Token invalid, clear it
            sessionStorage.removeItem("auth_token");
            setToken(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          sessionStorage.removeItem("auth_token");
            setToken(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (data.requires_mfa) {
        return { requiresMFA: true };
      }

      // Store token in sessionStorage (more secure than localStorage)
      sessionStorage.setItem("auth_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      toast.success(`Welcome back, ${data.user.name}!`);
      
      return { success: true, user: data.user };
    } catch (error) {
      toast.error(error.message || "Login failed");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name, role = "client") => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      toast.success("Registration successful! Please login.");
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Registration failed");
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const sessionId = sessionStorage.getItem("session_id");
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("session_id");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    toast.success("Logged out successfully");
  }, []);

  const refreshToken = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      sessionStorage.setItem("auth_token", data.access_token);
      setToken(data.access_token);
      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      return false;
    }
  }, [token, logout]);

  // API helper with auth header
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry request with new token
        headers["Authorization"] = `Bearer ${sessionStorage.getItem("auth_token")}`;
        return fetch(url, { ...options, headers });
      }
    }

    return response;
  }, [token, refreshToken]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    authFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
