import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

interface LoginResult {
  success?: boolean;
  requiresMFA?: boolean;
  user?: User;
  error?: string;
}

interface RegisterResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, name: string, role?: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem("auth_token"));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
            const userResponse = await fetch(`${API_URL}/api/auth/me?token=${savedToken}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
          } else {
            sessionStorage.removeItem("auth_token");
            setToken(null);
            setIsAuthenticated(false);
          }
        } catch {
          sessionStorage.removeItem("auth_token");
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (data.requires_mfa) {
        return { requiresMFA: true };
      }

      sessionStorage.setItem("auth_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${data.user.name}!`);
      return { success: true, user: data.user };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role = "client"): Promise<RegisterResult> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      toast.success("Registration successful! Please login.");
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const sessionId = sessionStorage.getItem("session_id");
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // silently ignore logout errors
    }

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("session_id");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    toast.success("Logged out successfully");
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      sessionStorage.setItem("auth_token", data.access_token);
      setToken(data.access_token);
      return true;
    } catch {
      logout();
      return false;
    }
  }, [token, logout]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        headers["Authorization"] = `Bearer ${sessionStorage.getItem("auth_token")}`;
        return fetch(url, { ...options, headers });
      }
    }

    return response;
  }, [token, refreshToken]);

  const value: AuthContextType = {
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
