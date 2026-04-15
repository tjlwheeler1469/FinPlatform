import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Upload, Shield, FileCheck, UserCheck, Check, AlertCircle, RefreshCw, Lock, Phone, Mail, MapPin, Briefcase
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;

const ClientOnboarding = ({ clientId = "portal_001" }) => {
  const [tfnStatus, setTfnStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tfnInput, setTfnInput] = useState("");
  const [infoFields, setInfoFields] = useState({ phone: "", email: "", address: "" });
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/client-onboarding/tfn/${clientId}`).then(r => r.json()).then(setTfnStatus).catch(() => {});
    fetch(`${API}/api/client-onboarding/documents/${clientId}`).then(r => r.json()).then(setDocuments).catch(() => {});
  }, [clientId]);

  const completionSteps = [
    { label: "ID Verification", done: documents.some(d => d.doc_type === "passport" || d.doc_type === "drivers_licence") },
    { label: "Tax File Number", done: tfnStatus?.submitted },
    { label: "Contact Details", done: false },
  ];
  const completionPct = Math.round((completionSteps.filter(s => s.done).length / completionSteps.length) * 100);

  const uploadFile = async (docType) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.pdf,.heic";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("client_id", clientId);
      formData.append("doc_type", docType);
      try {
        const res = await fetch(`${API}/api/client-onboarding/upload-id`, { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const result = await res.json();
        setDocuments(prev => [{ ...result, uploaded_at: new Date().toISOString() }, ...prev]);
        toast.success(`${docType.replace("_", " ")} uploaded successfully`);
      } catch (err) {
        toast.error("Upload failed — please try again");
      }
      setUploading(false);
    };
    input.click();
  };

  const submitTfn = async () => {
    const clean = tfnInput.replace(/[\s-]/g, "");
    if (clean.length !== 9 || !/^\d+$/.test(clean)) {
      toast.error("TFN must be exactly 9 digits"); return;
    }
    try {
      const res = await fetch(`${API}/api/client-onboarding/tfn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, tfn: clean }),
      });
      const result = await res.json();
      setTfnStatus({ submitted: true, masked_tfn: result.masked_tfn });
      setTfnInput("");
      toast.success("TFN submitted securely");
    } catch { toast.error("Failed to submit TFN"); }
  };

  const updateInfo = async (field) => {
    if (!infoFields[field]) return;
    try {
      await fetch(`${API}/api/client-onboarding/info-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, field, value: infoFields[field] }),
      });
      toast.success(`${field} updated`);
      setInfoFields(prev => ({ ...prev, [field]: "" }));
    } catch { toast.error("Failed to update"); }
  };

  const syncToXplan = async () => {
    setSyncing(true);
    try {
      await fetch(`${API}/api/client-onboarding/sync-xplan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      setSynced(true);
      toast.success("All data synced to Xplan");
    } catch { toast.error("Sync failed"); }
    setSyncing(false);
  };

  return (
    <div className="space-y-5" data-testid="client-onboarding">
      {/* Progress */}
      <Card className="bg-[#1a2744] text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Complete Your Profile</h3>
            <Badge className="bg-white/20">{completionPct}%</Badge>
          </div>
          <Progress value={completionPct} className="h-2 bg-white/20" />
          <div className="flex gap-4 mt-3">
            {completionSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                {s.done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                <span className={s.done ? "text-white/60 line-through" : ""}>{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* ID Upload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-blue-500" /> Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Upload a government-issued ID to verify your identity</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => uploadFile("passport")} disabled={uploading}
                data-testid="upload-passport">
                <Upload className="h-3 w-3 mr-1" /> Passport
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => uploadFile("drivers_licence")} disabled={uploading}
                data-testid="upload-licence">
                <Upload className="h-3 w-3 mr-1" /> Driver's Licence
              </Button>
            </div>
            {documents.length > 0 && (
              <div className="space-y-1 mt-2">
                {documents.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-1.5 bg-muted/30 rounded">
                    <FileCheck className="h-3 w-3 text-emerald-500" />
                    <span className="flex-1">{d.doc_type?.replace("_", " ")} — {d.original_filename || d.filename}</span>
                    <Badge variant="outline" className="text-[9px]">{d.status || "uploaded"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* TFN Input */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" /> Tax File Number
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Your TFN is encrypted and stored securely (AES-256)</p>
            {tfnStatus?.submitted ? (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded text-sm text-emerald-700">
                <Shield className="h-4 w-4" /> TFN submitted — {tfnStatus.masked_tfn || "***-***-***"}
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="123 456 789" value={tfnInput} onChange={(e) => setTfnInput(e.target.value)}
                  maxLength={11} className="font-mono" data-testid="tfn-input" />
                <Button size="sm" onClick={submitTfn} data-testid="submit-tfn">Submit</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Updates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-purple-500" /> Update Your Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Keep your information current — changes sync directly to your adviser</p>
          {[
            { field: "phone", icon: Phone, placeholder: "New phone number" },
            { field: "email", icon: Mail, placeholder: "New email address" },
            { field: "address", icon: MapPin, placeholder: "New address" },
          ].map(({ field, icon: Icon, placeholder }) => (
            <div key={field} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input placeholder={placeholder} value={infoFields[field]} className="flex-1 text-sm"
                onChange={(e) => setInfoFields(prev => ({ ...prev, [field]: e.target.value }))}
                data-testid={`info-${field}`} />
              <Button size="sm" variant="outline" onClick={() => updateInfo(field)} disabled={!infoFields[field]}>Update</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sync to Xplan */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Transfer to Xplan</p>
            <p className="text-xs text-muted-foreground">Push all uploaded data to your adviser's practice management system</p>
          </div>
          <Button onClick={syncToXplan} disabled={syncing || synced} data-testid="sync-xplan-btn">
            {synced ? <><Check className="h-4 w-4 mr-1" /> Synced</> :
             syncing ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Syncing...</> :
             <><RefreshCw className="h-4 w-4 mr-1" /> Sync to Xplan</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientOnboarding;
