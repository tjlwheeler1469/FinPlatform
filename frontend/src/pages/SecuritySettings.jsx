import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Lock,
  Key,
  Smartphone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Activity,
  Globe,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import MFASetup from "@/components/MFASetup";

// Mock session data
const MOCK_SESSIONS = [
  {
    id: "sess_1",
    device: "Chrome on Windows",
    location: "Sydney, NSW",
    ip: "203.45.xxx.xxx",
    last_active: "2025-03-12T10:30:00Z",
    current: true
  },
  {
    id: "sess_2",
    device: "Safari on iPhone",
    location: "Sydney, NSW",
    ip: "203.45.xxx.xxx",
    last_active: "2025-03-11T18:45:00Z",
    current: false
  },
  {
    id: "sess_3",
    device: "Firefox on macOS",
    location: "Melbourne, VIC",
    ip: "180.12.xxx.xxx",
    last_active: "2025-03-10T09:15:00Z",
    current: false
  }
];

// Mock activity log
const MOCK_SECURITY_LOG = [
  { id: 1, action: "Login", device: "Chrome on Windows", location: "Sydney", timestamp: "2025-03-12T10:30:00Z", success: true },
  { id: 2, action: "Password changed", device: "Chrome on Windows", location: "Sydney", timestamp: "2025-03-11T15:20:00Z", success: true },
  { id: 3, action: "Login", device: "Safari on iPhone", location: "Sydney", timestamp: "2025-03-11T18:45:00Z", success: true },
  { id: 4, action: "Failed login attempt", device: "Unknown", location: "Unknown", timestamp: "2025-03-10T02:30:00Z", success: false },
  { id: 5, action: "MFA enabled", device: "Chrome on Windows", location: "Sydney", timestamp: "2025-03-09T11:00:00Z", success: true },
];

const SecuritySettings = () => {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [securityLog] = useState(MOCK_SECURITY_LOG);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [securityPrefs, setSecurityPrefs] = useState({
    loginAlerts: true,
    newDeviceAlerts: true,
    sessionTimeout: 30,
    requireMfaForSensitive: true
  });

  // Change password
  const handlePasswordChange = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    toast.success("Password changed successfully");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  // Revoke session
  const revokeSession = (sessionId) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    toast.success("Session revoked");
  };

  // Revoke all sessions
  const revokeAllSessions = () => {
    setSessions(sessions.filter(s => s.current));
    toast.success("All other sessions revoked");
  };

  // Format timestamp
  const formatTimestamp = (ts) => {
    return new Date(ts).toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="security-settings-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold  text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-[#D4A84C]" />
            Security Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account security and authentication
          </p>
        </div>

        <Tabs defaultValue="mfa" className="space-y-6">
          <TabsList>
            <TabsTrigger value="mfa" data-testid="tab-mfa">Two-Factor Auth</TabsTrigger>
            <TabsTrigger value="password" data-testid="tab-password">Password</TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">Activity Log</TabsTrigger>
            <TabsTrigger value="preferences" data-testid="tab-preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* MFA Tab */}
          <TabsContent value="mfa">
            <MFASetup 
              userId="user_wheeler"
              userEmail="james@wheeler.com"
              onMFAEnabled={() => toast.success("Two-factor authentication enabled")}
              onMFADisabled={() => toast.info("Two-factor authentication disabled")}
            />
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-5 w-5 text-[#D4A84C]" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password regularly for better security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                      data-testid="current-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                      data-testid="new-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                      data-testid="confirm-password-input"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className={passwordData.new.length >= 8 ? "text-green-600" : ""}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(passwordData.new) ? "text-green-600" : ""}>
                      • At least one uppercase letter
                    </li>
                    <li className={/[0-9]/.test(passwordData.new) ? "text-green-600" : ""}>
                      • At least one number
                    </li>
                    <li className={/[!@#$%^&*]/.test(passwordData.new) ? "text-green-600" : ""}>
                      • At least one special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>

                <Button onClick={handlePasswordChange} className="bg-[#1a2744]" data-testid="change-password-btn">
                  <Lock className="h-4 w-4 mr-2" /> Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-[#D4A84C]" />
                      Active Sessions
                    </CardTitle>
                    <CardDescription>
                      Manage devices that are currently signed in to your account
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={revokeAllSessions} data-testid="revoke-all-sessions-btn">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out All Other Devices
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.map(session => (
                    <div 
                      key={session.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        session.current ? 'border-green-200 bg-green-50' : ''
                      }`}
                      data-testid={`session-${session.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${session.current ? 'bg-green-100' : 'bg-muted'}`}>
                          <Smartphone className={`h-5 w-5 ${session.current ? 'text-green-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.device}</p>
                            {session.current && (
                              <Badge className="bg-green-100 text-green-800">Current</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" /> {session.location}
                            </span>
                            <span>IP: {session.ip}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last active: {formatTimestamp(session.last_active)}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                        >
                          <LogOut className="h-4 w-4 mr-1" /> Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#D4A84C]" />
                  Security Activity Log
                </CardTitle>
                <CardDescription>
                  Recent security-related activity on your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityLog.map(entry => (
                    <div 
                      key={entry.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        !entry.success ? 'border-red-200 bg-red-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${entry.success ? 'bg-green-100' : 'bg-red-100'}`}>
                          {entry.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{entry.action}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{entry.device}</span>
                            <span>{entry.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={entry.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {entry.success ? "Success" : "Failed"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#D4A84C]" />
                  Security Preferences
                </CardTitle>
                <CardDescription>
                  Configure your security notification and session settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Login Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                    </div>
                  </div>
                  <Switch
                    checked={securityPrefs.loginAlerts}
                    onCheckedChange={(checked) => setSecurityPrefs({...securityPrefs, loginAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">New Device Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified when a new device accesses your account</p>
                    </div>
                  </div>
                  <Switch
                    checked={securityPrefs.newDeviceAlerts}
                    onCheckedChange={(checked) => setSecurityPrefs({...securityPrefs, newDeviceAlerts: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Require MFA for Sensitive Actions</p>
                      <p className="text-sm text-muted-foreground">Re-verify with MFA when performing sensitive operations</p>
                    </div>
                  </div>
                  <Switch
                    checked={securityPrefs.requireMfaForSensitive}
                    onCheckedChange={(checked) => setSecurityPrefs({...securityPrefs, requireMfaForSensitive: checked})}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={securityPrefs.sessionTimeout}
                      onChange={(e) => setSecurityPrefs({...securityPrefs, sessionTimeout: Number(e.target.value)})}
                      className="w-20"
                      min={5}
                      max={120}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>

                <Button 
                  onClick={() => toast.success("Preferences saved")} 
                  className="bg-[#1a2744]"
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SecuritySettings;
