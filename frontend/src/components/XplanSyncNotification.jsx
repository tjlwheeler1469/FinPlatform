import { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Upload, CheckCircle2, XCircle, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Create context for sync state
const XplanSyncContext = createContext(null);

export const useXplanSync = () => {
  const context = useContext(XplanSyncContext);
  if (!context) {
    return {
      triggerSync: () => {},
      pendingChanges: [],
      isConnected: false
    };
  }
  return context;
};

export const XplanSyncProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState(null);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  // Check Xplan connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/xplan/status`);
      setIsConnected(response.data.connected);
      setConnectionMode(response.data.mode);
    } catch (error) {
      setIsConnected(false);
    }
  };
  
  // Function to trigger sync prompt after changes
  const triggerSync = (changeType, changeDetails) => {
    if (!isConnected) return;
    
    const change = {
      id: Date.now(),
      type: changeType,
      details: changeDetails,
      timestamp: new Date().toISOString()
    };
    
    setPendingChanges(prev => [...prev, change]);
    setSyncDialogOpen(true);
  };
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      // Push changes to Xplan
      for (const change of pendingChanges) {
        await axios.post(`${API_URL}/api/xplan/push`, {
          advisor_id: "default",
          client_id: change.details.clientId || "default",
          data_type: change.type,
          data: change.details
        });
      }
      
      toast.success("Changes synced to Xplan successfully!");
      setPendingChanges([]);
      setSyncDialogOpen(false);
    } catch (error) {
      toast.error("Failed to sync with Xplan");
    } finally {
      setSyncing(false);
    }
  };
  
  const handleSkip = () => {
    setPendingChanges([]);
    setSyncDialogOpen(false);
    toast.info("Changes saved locally. Sync to Xplan later from Integrations.");
  };
  
  return (
    <XplanSyncContext.Provider value={{ triggerSync, pendingChanges, isConnected, connectionMode }}>
      {children}
      
      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[#D4A84C]" />
              Sync to Xplan?
            </DialogTitle>
            <DialogDescription>
              You've made changes that should be synced to your system of record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-3">
              {pendingChanges.map((change) => (
                <div key={change.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{change.type.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {change.details.description || "Data updated"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
            
            {connectionMode === "demo" && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Demo Mode:</strong> Changes will be simulated, not pushed to a real Xplan instance.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip for Now
            </Button>
            <Button
              className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync to Xplan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </XplanSyncContext.Provider>
  );
};

// Floating sync status indicator
export const XplanSyncIndicator = () => {
  const { isConnected, connectionMode, pendingChanges } = useXplanSync();
  
  if (!isConnected) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg border">
        <div className={`w-2 h-2 rounded-full ${connectionMode === "demo" ? "bg-amber-500" : "bg-emerald-500"}`} />
        <span className="text-xs font-medium">
          Xplan {connectionMode === "demo" ? "Demo" : "Connected"}
        </span>
        {pendingChanges.length > 0 && (
          <Badge variant="secondary" className="text-xs h-5">
            {pendingChanges.length} pending
          </Badge>
        )}
      </div>
    </div>
  );
};

export default XplanSyncProvider;
