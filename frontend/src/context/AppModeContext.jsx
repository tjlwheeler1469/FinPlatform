import { createContext, useContext, useState, useEffect } from "react";

// App Modes
export const APP_MODES = {
  PERSONAL: "personal",
  ADVISER: "adviser", 
  CLIENT: "client"
};

// Mode Context
const AppModeContext = createContext();

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return context;
};

export const AppModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("app_mode");
    return saved || APP_MODES.PERSONAL;
  });

  const [activeClientId, setActiveClientId] = useState(() => {
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

  const selectClient = (clientId) => {
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
