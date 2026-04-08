import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, Eye, EyeOff, Plus, Trash2, RefreshCw, CheckCircle, 
  AlertTriangle, FileText, Save, Lock, Fingerprint, CloudCog
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ID_TYPES = [
  { value: "drivers_licence", label: "Driver's Licence" },
  { value: "passport", label: "Passport" },
  { value: "medicare", label: "Medicare Card" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "citizenship_cert", label: "Citizenship Certificate" },
  { value: "immicard", label: "ImmiCard" },
  { value: "proof_of_age", label: "Proof of Age Card" },
  { value: "veteran_card", label: "Veteran Affairs Card" },
  { value: "other", label: "Other" },
];

const ClientProfileTab = ({ clientId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showTfn, setShowTfn] = useState(false);
  const [data, setData] = useState(null);
  const [maskedData, setMaskedData] = useState(null);

  // Editable state
  const [tfn, setTfn] = useState("");
  const [idDocs, setIdDocs] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    if (clientId) {
      loadData();
      loadSyncStatus();
    }
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [masked, unmasked] = await Promise.all([
        axios.get(`${API}/client-personal-info/${clientId}`),
        axios.get(`${API}/client-personal-info/${clientId}/unmasked`).catch(() => null),
      ]);
      setMaskedData(masked.data);
      if (unmasked?.data) {
        setData(unmasked.data);
        setTfn(unmasked.data.tfn || "");
        setIdDocs(unmasked.data.id_documents || []);
        setCustomFields(unmasked.data.custom_fields || []);
      } else {
        setTfn("");
        setIdDocs([]);
        setCustomFields(masked.data.custom_fields || []);
      }
    } catch {
      setMaskedData(null);
    }
    setLoading(false);
  };

  const loadSyncStatus = async () => {
    try {
      const res = await axios.get(`${API}/client-personal-info/${clientId}/xplan-status`);
      setSyncStatus(res.data);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/client-personal-info/${clientId}`, {
        tfn: tfn || null,
        id_documents: idDocs.filter(d => d.number && d.type),
        custom_fields: customFields.filter(f => f.label && f.value),
      });
      toast.success("Personal information saved securely");
      await loadData();
    } catch {
      toast.error("Failed to save personal information");
    }
    setSaving(false);
  };

  const handleXplanSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post(`${API}/client-personal-info/${clientId}/xplan-sync`);
      toast.success(`Xplan sync complete — ${res.data.direction}`);
      await loadData();
      await loadSyncStatus();
    } catch {
      toast.error("Xplan sync failed");
    }
    setSyncing(false);
  };

  const addIdDocument = () => {
    setIdDocs([...idDocs, { type: "", number: "", expiry_date: "", issuing_authority: "" }]);
  };

  const updateIdDoc = (idx, field, value) => {
    const updated = [...idDocs];
    updated[idx] = { ...updated[idx], [field]: value };
    setIdDocs(updated);
  };

  const removeIdDoc = (idx) => {
    setIdDocs(idDocs.filter((_, i) => i !== idx));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { label: "", value: "" }]);
  };

  const updateCustomField = (idx, field, value) => {
    const updated = [...customFields];
    updated[idx] = { ...updated[idx], [field]: value };
    setCustomFields(updated);
  };

  const removeCustomField = (idx) => {
    setCustomFields(customFields.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="client-profile-tab">
      {/* Xplan Sync Banner */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CloudCog className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Xplan Integration</p>
                <p className="text-xs text-muted-foreground">
                  {syncStatus?.xplan_synced 
                    ? `Last synced: ${new Date(syncStatus.last_sync).toLocaleString()} (${syncStatus.xplan_client_id})`
                    : "Not yet synced with Xplan"
                  }
                </p>
              </div>
              {syncStatus?.xplan_synced ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">Synced</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleXplanSync}
              disabled={syncing}
              data-testid="xplan-sync-btn"
            >
              {syncing ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Sync with Xplan
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TFN Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              Tax File Number
            </CardTitle>
            <CardDescription className="text-xs">
              Encrypted with AES-256-GCM at rest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showTfn ? "text" : "password"}
                    placeholder="Enter TFN (9 digits)"
                    value={tfn}
                    onChange={(e) => setTfn(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
                    maxLength={9}
                    data-testid="tfn-input"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTfn(!showTfn)}
                  data-testid="toggle-tfn-visibility"
                >
                  {showTfn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {maskedData?.tfn_masked && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Stored as: {maskedData.tfn_masked}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Xplan Sync History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CloudCog className="h-4 w-4 text-blue-600" />
              Sync History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {syncStatus?.sync_history?.length > 0 ? (
              <div className="space-y-2">
                {syncStatus.sync_history.map((log, i) => (
                  <div key={log.sync_id || i} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{log.direction}</span>
                    </div>
                    <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No sync history yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ID Documents */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-purple-600" />
                Identification Documents
              </CardTitle>
              <CardDescription className="text-xs">Add as many ID documents as required</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addIdDocument} data-testid="add-id-btn">
              <Plus className="h-4 w-4 mr-1" /> Add ID
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {idDocs.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              No ID documents added yet
            </div>
          ) : (
            <div className="space-y-3">
              {idDocs.map((doc, idx) => (
                <div key={idx} className="p-3 border rounded-lg space-y-2" data-testid={`id-doc-${idx}`}>
                  <div className="flex items-center justify-between">
                    <Select value={doc.type} onValueChange={(v) => updateIdDoc(idx, "type", v)}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => removeIdDoc(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Number</Label>
                      <Input
                        placeholder="ID Number"
                        value={doc.number}
                        onChange={(e) => updateIdDoc(idx, "number", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expiry Date</Label>
                      <Input
                        type="date"
                        value={doc.expiry_date || ""}
                        onChange={(e) => updateIdDoc(idx, "expiry_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Issuing Authority</Label>
                      <Input
                        placeholder="e.g. VicRoads, DFAT"
                        value={doc.issuing_authority || ""}
                        onChange={(e) => updateIdDoc(idx, "issuing_authority", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" />
                Additional Fields
              </CardTitle>
              <CardDescription className="text-xs">Add any additional information as needed</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addCustomField} data-testid="add-custom-field-btn">
              <Plus className="h-4 w-4 mr-1" /> Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <p className="text-center py-4 text-sm text-muted-foreground">No additional fields</p>
          ) : (
            <div className="space-y-2">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2" data-testid={`custom-field-${idx}`}>
                  <Input
                    placeholder="Field name"
                    value={field.label}
                    onChange={(e) => updateCustomField(idx, "label", e.target.value)}
                    className="w-1/3"
                  />
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => updateCustomField(idx, "value", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeCustomField(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span>All sensitive data encrypted with AES-256-GCM. Synced bidirectionally with Xplan.</span>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-[#1a2744]"
          data-testid="save-personal-info-btn"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Personal Information
        </Button>
      </div>
    </div>
  );
};

export default ClientProfileTab;
