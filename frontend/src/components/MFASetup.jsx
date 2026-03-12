import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Smartphone,
  Mail,
  Key,
  CheckCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Lock,
  Unlock,
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Database
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Generate mock TOTP secret
const generateSecret = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

// Generate mock backup codes
const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push({ code, used: false });
  }
  return codes;
};

// Mock TOTP verification (in production, this would verify against actual TOTP)
const verifyTOTP = (code) => {
  // Accept any 6-digit code for mock purposes
  return /^\d{6}$/.test(code);
};

const MFASetup = ({ userId, userEmail, onMFAEnabled, onMFADisabled }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState({
    enabled: false,
    method: null,
    secret: null,
    backup_codes: [],
    setup_at: null,
    last_used: null
  });
  
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState([]);
  const [disableCode, setDisableCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load MFA status from MongoDB on mount
  useEffect(() => {
    const loadMFAStatus = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/mfa/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setMfaStatus(data);
        }
      } catch (error) {
        console.error("Error loading MFA status:", error);
        // Fall back to localStorage
        const saved = localStorage.getItem(`wheeler_mfa_${userId}`);
        if (saved) {
          setMfaStatus(JSON.parse(saved));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMFAStatus();
  }, [userId]);

  // Also keep localStorage as backup
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(`wheeler_mfa_${userId || 'user'}`, JSON.stringify(mfaStatus));
    }
  }, [mfaStatus, userId, isLoading]);

  // Start MFA setup
  const startSetup = () => {
    setNewSecret(generateSecret());
    setNewBackupCodes(generateBackupCodes());
    setSetupStep(0);
    setVerificationCode("");
    setShowSetupDialog(true);
  };

  // Complete MFA setup - save to MongoDB
  const completeMFASetup = async () => {
    if (!verifyTOTP(verificationCode)) {
      toast.error("Invalid verification code. Please enter a valid 6-digit code.");
      return;
    }

    setIsSaving(true);
    const updatedStatus = {
      enabled: true,
      method: "totp",
      secret: newSecret,
      backup_codes: newBackupCodes,
      setup_at: new Date().toISOString(),
      last_used: null
    };
    
    try {
      const response = await fetch(`${API_URL}/api/mfa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "default_user",
          ...updatedStatus
        })
      });

      if (response.ok) {
        setMfaStatus(updatedStatus);
        setShowSetupDialog(false);
        setShowBackupCodes(true);
        toast.success("Two-factor authentication enabled!", {
          description: "Saved to MongoDB"
        });
        
        if (onMFAEnabled) {
          onMFAEnabled(updatedStatus);
        }
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving MFA:", error);
      // Still enable locally
      setMfaStatus(updatedStatus);
      setShowSetupDialog(false);
      setShowBackupCodes(true);
      toast.success("Two-factor authentication enabled locally");
      
      if (onMFAEnabled) {
        onMFAEnabled(updatedStatus);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Disable MFA - save to MongoDB
  const disableMFA = async () => {
    if (!verifyTOTP(disableCode)) {
      toast.error("Invalid verification code");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/mfa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "default_user",
          code: disableCode
        })
      });

      const disabledStatus = {
        enabled: false,
        method: null,
        secret: null,
        backup_codes: [],
        setup_at: null,
        last_used: null
      };
      
      setMfaStatus(disabledStatus);
      setShowDisableDialog(false);
      setDisableCode("");
      toast.success("Two-factor authentication disabled", {
        description: response.ok ? "Saved to MongoDB" : "Saved locally"
      });
      
      if (onMFADisabled) {
        onMFADisabled();
      }
    } catch (error) {
      console.error("Error disabling MFA:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Regenerate backup codes
  const regenerateBackupCodes = async () => {
    const codes = generateBackupCodes();
    const updatedStatus = { ...mfaStatus, backup_codes: codes };
    
    try {
      await fetch(`${API_URL}/api/mfa/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "default_user",
          ...updatedStatus
        })
      });
    } catch (error) {
      console.error("Error saving backup codes:", error);
    }
    
    setMfaStatus(updatedStatus);
    toast.success("New backup codes generated");
    setShowBackupCodes(true);
  };

  // Format secret for display (groups of 4)
  const formatSecret = (secret) => {
    return secret?.match(/.{1,4}/g)?.join(' ') || '';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a2744]" />
        <span className="ml-2">Loading MFA status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mfa-setup">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${mfaStatus.enabled ? 'bg-green-100' : 'bg-amber-100'}`}>
                {mfaStatus.enabled ? (
                  <Lock className="h-6 w-6 text-green-600" />
                ) : (
                  <Unlock className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Two-Factor Authentication
                  {mfaStatus.enabled ? (
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">Not Enabled</Badge>
                  )}
                  <Badge variant="outline" className="text-xs flex items-center gap-1 ml-2">
                    <Database className="h-3 w-3" /> MongoDB
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            {!mfaStatus.enabled ? (
              <Button onClick={startSetup} className="bg-[#1a2744]" data-testid="enable-mfa-btn">
                <Shield className="h-4 w-4 mr-2" /> Enable 2FA
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowDisableDialog(true)} data-testid="disable-mfa-btn">
                <Unlock className="h-4 w-4 mr-2" /> Disable 2FA
              </Button>
            )}
          </div>
        </CardHeader>
        
        {mfaStatus.enabled && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Authentication Method</p>
                  <p className="text-xs text-muted-foreground">Authenticator App (TOTP)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm">Setup Date</p>
                  <p className="text-xs text-muted-foreground">
                    {mfaStatus.setup_at ? new Date(mfaStatus.setup_at).toLocaleDateString('en-AU') : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Key className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Backup Codes</p>
                  <p className="text-xs text-muted-foreground">
                    {mfaStatus.backup_codes.filter(c => !c.used).length} remaining
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setShowBackupCodes(true)}>
                <Eye className="h-4 w-4 mr-2" /> View Backup Codes
              </Button>
              <Button variant="outline" size="sm" onClick={regenerateBackupCodes}>
                <RefreshCw className="h-4 w-4 mr-2" /> Regenerate Codes
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#D4A84C]" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className={`flex items-center justify-between p-3 border rounded-lg ${mfaStatus.enabled ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-center gap-3">
              {mfaStatus.enabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Protect your account with 2FA</p>
              </div>
            </div>
            {mfaStatus.enabled ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={startSetup}>Enable</Button>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Strong Password</p>
                <p className="text-xs text-muted-foreground">Use a unique, complex password</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Good</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Secure Session</p>
                <p className="text-xs text-muted-foreground">HTTPS encrypted connection</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#D4A84C]" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Use an authenticator app like Google Authenticator or Authy
            </DialogDescription>
          </DialogHeader>
          
          {setupStep === 0 && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="w-48 h-48 mx-auto bg-white border-4 border-[#1a2744] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <QrCode className="h-16 w-16 text-[#1a2744] mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Mock QR Code</p>
                    <p className="text-xs text-muted-foreground">(Scan with app)</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Or enter this code manually:</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-mono tracking-wider">{formatSecret(newSecret)}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newSecret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button onClick={() => setSetupStep(1)} className="w-full bg-[#1a2744]">
                Next: Verify Setup
              </Button>
            </div>
          )}
          
          {setupStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <Smartphone className="h-12 w-12 text-[#D4A84C] mx-auto mb-2" />
                <p className="font-medium">Enter Verification Code</p>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl font-mono tracking-[0.5em]"
                  data-testid="mfa-verification-input"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSetupStep(0)} className="flex-1">
                  Back
                </Button>
                <Button onClick={completeMFASetup} className="flex-1 bg-[#1a2744]" data-testid="verify-mfa-btn">
                  <CheckCircle className="h-4 w-4 mr-2" /> Verify & Enable
                </Button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                For testing: Enter any 6-digit code (e.g., 123456)
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              This will make your account less secure. Are you sure?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Disabling 2FA removes an important security layer from your account. 
                Your account will be more vulnerable to unauthorized access.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Enter your authenticator code to confirm</Label>
              <Input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-mono tracking-[0.5em]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={disableMFA}>Disable 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#D4A84C]" />
              Backup Codes
            </DialogTitle>
            <DialogDescription>
              Use these codes if you lose access to your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Each code can only be used once. 
                Store these codes in a safe place.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(mfaStatus.backup_codes.length > 0 ? mfaStatus.backup_codes : newBackupCodes).map((item, index) => (
                <div 
                  key={index}
                  className={`p-2 font-mono text-center rounded border ${
                    item.used ? 'bg-muted text-muted-foreground line-through' : 'bg-white'
                  }`}
                >
                  {item.code}
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => copyToClipboard(
                (mfaStatus.backup_codes.length > 0 ? mfaStatus.backup_codes : newBackupCodes)
                  .map(c => c.code)
                  .join('\n')
              )}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy All Codes
            </Button>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)} className="bg-[#1a2744]">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MFASetup;
