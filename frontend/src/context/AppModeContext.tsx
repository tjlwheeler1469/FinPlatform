import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export const APP_MODES = {
  PERSONAL: "personal",
  ADVISER: "adviser",
  CLIENT: "client"
} as const;

type AppMode = typeof APP_MODES[keyof typeof APP_MODES];

interface AppModeContextType {
  mode: AppMode;
  activeClientId: number | null;
  switchToPersonal: () => void;
  switchToAdviser: () => void;
  switchToClient: () => void;
  selectClient: (clientId: number) => void;
  clearClient: () => void;
  isPersonalMode: boolean;
  isAdviserMode: boolean;
  isClientMode: boolean;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

export const useAppMode = (): AppModeContextType => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return context;
};

interface AppModeProviderProps {
  children: ReactNode;
}

export const AppModeProvider = ({ children }: AppModeProviderProps) => {
  const [mode, setMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem("app_mode");
    return (saved as AppMode) || APP_MODES.PERSONAL;
  });

  const [activeClientId, setActiveClientId] = useState<number | null>(() => {
    const saved = localStorage.getItem("active_client_id");
    return saved ? parseInt(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("app_mode", mode);
  }, [mode]);

  useEffect(() => {
    if (activeClientId) {
      localStorage.setItem("active_client_id", activeClientId.toString());
    } else {
      localStorage.removeItem("active_client_id");
    }
  }, [activeClientId]);

  const switchToPersonal = () => {
    setMode(APP_MODES.PERSONAL);
    setActiveClientId(null);
  };

  const switchToAdviser = () => {
    setMode(APP_MODES.ADVISER);
    setActiveClientId(null);
  };

  const switchToClient = () => {
    setMode(APP_MODES.CLIENT);
  };

  const selectClient = (clientId: number) => {
    setActiveClientId(clientId);
  };

  const clearClient = () => {
    setActiveClientId(null);
  };

  return (
    <AppModeContext.Provider value={{
      mode,
      activeClientId,
      switchToPersonal,
      switchToAdviser,
      switchToClient,
      selectClient,
      clearClient,
      isPersonalMode: mode === APP_MODES.PERSONAL,
      isAdviserMode: mode === APP_MODES.ADVISER,
      isClientMode: mode === APP_MODES.CLIENT,
    }}>
      {children}
    </AppModeContext.Provider>
  );
};

export default AppModeProvider;
