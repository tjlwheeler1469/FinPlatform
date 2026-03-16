import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Shield,
  Smartphone,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Clock,
  Activity,
  FileText,
  Download,
  Mail,
  Phone,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  History,
  Server,
  Globe
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Security = () => {
  const [mfaStatus, setMfaStatus] = useState(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [complianceReport, setComplianceReport] = useState(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const userId = "user_001"; // In production, get from auth context
  const userEmail = "advisor@wealthcommand.com";

  useEffect(() => {
    fetchMfaStatus();
    fetchAuditLogs();
    fetchComplianceReport();
  }, []);

  const fetchMfaStatus = async () => {
    try {
      const response = await axios.get(`${API}/mfa/status/${userId}`);
      setMfaStatus(response.data);
    } catch (error) {
      console.error("Error fetching MFA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get(`${API}/audit/logs`, {
        params: { limit: 20 }
      });
      setAuditLogs(response.data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    }
  };

  const fetchComplianceReport = async () => {
    try {
      const response = await axios.get(`${API}/audit/compliance-report`);
      setComplianceReport(response.data);
    } catch (error) {
      console.error("Error fetching compliance report:", error);
    }
  };

  const handleSetupMFA = async () => {
    try {
      const response = await axios.post(`${API}/mfa/setup`, {
        user_id: userId,
        user_email: userEmail
      });
      setSetupData(response.data);
      setSetupDialogOpen(true);
    } catch (error) {
      console.error("Error setting up MFA:", error);
      toast.error("Failed to initialize MFA setup");
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    try {
      const response = await axios.post(`${API}/mfa/verify-totp`, {
        user_id: userId,
        code: verificationCode
      });

      if (response.data.success) {
        toast.success("MFA enabled successfully!");
        setSetupDialogOpen(false);
        setVerificationCode("");
        fetchMfaStatus();
      } else {
        toast.error(response.data.error || "Invalid code");
      }
    } catch (error) {
      console.error("Error verifying MFA:", error);
      toast.error("Verification failed");
    }
  };

  const handleDisableMFA = async () => {
    if (!verificationCode) {
      setVerifyDialogOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${API}/mfa/disable`, {
        user_id: userId,
        code: verificationCode
      });

      if (response.data.success) {
        toast.success("MFA disabled");
        setVerifyDialogOpen(false);
        setVerificationCode("");
        fetchMfaStatus();
      } else {
        toast.error(response.data.error || "Failed to disable MFA");
      }
    } catch (error) {
      console.error("Error disabling MFA:", error);
      toast.error("Failed to disable MFA");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getEventIcon = (eventType) => {
    if (eventType.includes("login")) return <Key className="h-4 w-4" />;
    if (eventType.includes("mfa")) return <Shield className="h-4 w-4" />;
    if (eventType.includes("client")) return <FileText className="h-4 w-4" />;
    if (eventType.includes("document")) return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const securityScore = mfaStatus?.mfa_enabled ? 95 : 65;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="security-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Security & Compliance
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage authentication, audit logs, and SOC2 compliance
            </p>
          </div>
          <Badge variant={securityScore >= 80 ? "default" : "destructive"} className="text-lg px-4 py-2">
            Security Score: {securityScore}/100
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="mfa">Two-Factor Auth</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Security Status */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {mfaStatus?.mfa_enabled ? (
                      <ShieldCheck className="h-10 w-10 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-10 w-10 text-amber-500" />
                    )}
                    <div>
                      <p className="font-semibold">Account Security</p>
                      <p className={`text-sm ${mfaStatus?.mfa_enabled ? "text-green-600" : "text-amber-600"}`}>
                        {mfaStatus?.mfa_enabled ? "Protected with 2FA" : "2FA not enabled"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Encryption Status */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="h-10 w-10 text-green-500" />
                    <div>
                      <p className="font-semibold">Data Encryption</p>
                      <p className="text-sm text-green-600">AES-256 at rest, TLS in transit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Status */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-10 w-10 text-blue-500" />
                    <div>
                      <p className="font-semibold">Active Session</p>
                      <p className="text-sm text-muted-foreground">Sydney, Australia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Security Recommendations */}
            {!mfaStatus?.mfa_enabled && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="ml-2">
                  <strong>Recommendation:</strong> Enable two-factor authentication to secure your account.
                  <Button size="sm" className="ml-4" onClick={() => setActiveTab("mfa")}>
                    Enable 2FA
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Recent Security Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {auditLogs.slice(0, 5).map((log, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 border rounded-lg">
                      {getEventIcon(log.event_type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.event_type.replace(/\./g, " → ")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={log.risk_level === "low" ? "secondary" : "destructive"}>
                        {log.risk_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MFA Tab */}
          <TabsContent value="mfa" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Two-Factor Authentication (2FA)
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account using an authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${mfaStatus?.mfa_enabled ? "bg-green-100" : "bg-gray-100"}`}>
                      {mfaStatus?.mfa_enabled ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Shield className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">Authenticator App</p>
                      <p className="text-sm text-muted-foreground">
                        {mfaStatus?.mfa_enabled 
                          ? "Enabled - Use Google Authenticator, Authy, or similar"
                          : "Not configured"
                        }
                      </p>
                    </div>
                  </div>
                  {mfaStatus?.mfa_enabled ? (
                    <Button variant="destructive" onClick={() => setVerifyDialogOpen(true)}>
                      Disable
                    </Button>
                  ) : (
                    <Button onClick={handleSetupMFA} data-testid="enable-mfa-btn">
                      Enable 2FA
                    </Button>
                  )}
                </div>

                {mfaStatus?.mfa_enabled && (
                  <>
                    {/* Backup Codes */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold">Backup Codes</p>
                          <p className="text-sm text-muted-foreground">
                            {mfaStatus.backup_codes_remaining || 0} codes remaining
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowBackupCodes(!showBackupCodes)}>
                          {showBackupCodes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {showBackupCodes ? "Hide" : "View"}
                        </Button>
                      </div>
                      {showBackupCodes && (
                        <Alert>
                          <AlertDescription>
                            <p className="text-sm mb-2">Store these codes in a safe place. Each code can only be used once.</p>
                            <div className="grid grid-cols-2 gap-2">
                              {["XXXX-XXXX", "XXXX-XXXX", "XXXX-XXXX", "XXXX-XXXX"].map((code, i) => (
                                <code key={i} className="bg-muted px-2 py-1 rounded text-sm">{code}</code>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}

                {/* SMS Verification (Coming Soon) */}
                <div className="p-4 border rounded-lg opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-gray-100">
                        <Phone className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold">SMS Verification</p>
                        <p className="text-sm text-muted-foreground">Coming soon</p>
                      </div>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Audit Trail
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <div className={`p-2 rounded-full ${
                        log.risk_level === "high" ? "bg-red-100" :
                        log.risk_level === "medium" ? "bg-amber-100" : "bg-blue-100"
                      }`}>
                        {getEventIcon(log.event_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {log.event_type.replace(/\./g, " → ")}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          {log.ip_address && (
                            <>
                              <span>•</span>
                              <span>{log.ip_address}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        log.risk_level === "high" ? "destructive" :
                        log.risk_level === "medium" ? "secondary" : "outline"
                      }>
                        {log.risk_level}
                      </Badge>
                      <code className="text-xs text-muted-foreground">{log.checksum}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4 mt-4">
            {complianceReport && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-primary">{complianceReport.summary?.total_events || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {complianceReport.authentication_metrics?.login_success_rate || "100%"}
                      </p>
                      <p className="text-sm text-muted-foreground">Login Success Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-amber-600">
                        {complianceReport.summary?.high_risk_events || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">High Risk Events</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {complianceReport.summary?.unique_users || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Unique Users</p>
                    </CardContent>
                  </Card>
                </div>

                {/* SOC2 Compliance Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                      SOC2 Compliance Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(complianceReport.compliance_status || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-3 border rounded-lg">
                          {value ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )}
                          <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Report Button */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Generate Compliance Report</p>
                        <p className="text-sm text-muted-foreground">
                          Download a comprehensive SOC2 compliance report
                        </p>
                      </div>
                      <Button>
                        <Download className="h-4 w-4 mr-2" /> Download Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* MFA Setup Dialog */}
        <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Set Up Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Scan the QR code with your authenticator app, then enter the 6-digit code
              </DialogDescription>
            </DialogHeader>

            {setupData && (
              <div className="space-y-4">
                {/* QR Code placeholder */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 rounded-lg">
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-gray-400" />
                    </div>
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Scan with Google Authenticator
                    </p>
                  </div>
                </div>

                {/* Manual entry option */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Can't scan? Enter this code manually:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-white px-2 py-1 rounded">
                      {setupData.secret}
                    </code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(setupData.secret)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Verification code input */}
                <div>
                  <label className="text-sm font-medium">Enter 6-digit code</label>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    data-testid="mfa-code-input"
                  />
                </div>

                {/* Backup codes reminder */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="ml-2 text-sm">
                    Save your backup codes! You'll need them if you lose access to your authenticator app.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerifyMFA} disabled={verificationCode.length !== 6}>
                Verify & Enable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Disable MFA Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Enter your current authentication code to disable 2FA
              </DialogDescription>
            </DialogHeader>

            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="text-center text-xl"
              maxLength={6}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisableMFA}>
                Disable 2FA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Security;
