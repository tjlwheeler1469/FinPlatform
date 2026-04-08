import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  User, Shield, Fingerprint, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle, Lock, Eye, EyeOff, CloudCog, RefreshCw, FileText,
  Building2, Upload, Download, AlertTriangle, Users
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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

const ENTITY_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "joint", label: "Joint (Couple)" },
  { value: "family_trust", label: "Family Trust" },
  { value: "discretionary_trust", label: "Discretionary Trust" },
  { value: "unit_trust", label: "Unit Trust" },
  { value: "company", label: "Company (Pty Ltd)" },
  { value: "smsf", label: "SMSF" },
  { value: "partnership", label: "Partnership" },
];

const STEPS = [
  { key: "mode", label: "Setup Mode", icon: Users },
  { key: "personal", label: "Personal Details", icon: User },
  { key: "entities", label: "Entities", icon: Building2 },
  { key: "identification", label: "TFN & ID", icon: Shield },
  { key: "additional", label: "Additional", icon: FileText },
  { key: "review", label: "Review", icon: CheckCircle },
];

const EMPTY_ENTITY = { type: "individual", name: "", abn: "", trustee: "", notes: "" };

const ClientSetupWizard = ({ embedded = false }) => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // "single" or "bulk"
  const [saving, setSaving] = useState(false);
  const [showTfn, setShowTfn] = useState(false);

  // Single client form
  const [form, setForm] = useState({
    first_name: "", last_name: "", date_of_birth: "", email: "", phone: "",
    address: "", marital_status: "", dependents: 0, tfn: "",
    id_documents: [], custom_fields: [], entities: [],
  });

  // Bulk import state
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, running: false });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // ID document helpers
  const addIdDoc = () => updateForm("id_documents", [...form.id_documents, { type: "", number: "", expiry_date: "", issuing_authority: "" }]);
  const updateIdDoc = (idx, field, value) => {
    const u = [...form.id_documents]; u[idx] = { ...u[idx], [field]: value }; updateForm("id_documents", u);
  };
  const removeIdDoc = (idx) => updateForm("id_documents", form.id_documents.filter((_, i) => i !== idx));

  // Custom field helpers
  const addCustomField = () => updateForm("custom_fields", [...form.custom_fields, { label: "", value: "" }]);
  const updateCustomField = (idx, field, value) => {
    const u = [...form.custom_fields]; u[idx] = { ...u[idx], [field]: value }; updateForm("custom_fields", u);
  };
  const removeCustomField = (idx) => updateForm("custom_fields", form.custom_fields.filter((_, i) => i !== idx));

  // Entity helpers
  const addEntity = () => updateForm("entities", [...form.entities, { ...EMPTY_ENTITY }]);
  const updateEntity = (idx, field, value) => {
    const u = [...form.entities]; u[idx] = { ...u[idx], [field]: value }; updateForm("entities", u);
  };
  const removeEntity = (idx) => updateForm("entities", form.entities.filter((_, i) => i !== idx));

  // CSV parsing
  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV must have a header row and at least one data row"); return; }
      
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
      const required = ["first_name", "last_name"];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length > 0) { toast.error(`Missing required columns: ${missing.join(", ")}`); return; }

      const rows = [];
      const errors = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        if (values.length < headers.length) { errors.push(`Row ${i + 1}: not enough columns`); continue; }
        const row = {};
        headers.forEach((h, j) => { row[h] = values[j] || ""; });
        if (!row.first_name || !row.last_name) { errors.push(`Row ${i + 1}: missing name`); continue; }
        rows.push(row);
      }
      setCsvData(rows);
      setCsvErrors(errors);
      toast.success(`Parsed ${rows.length} clients from CSV`);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (csvData.length === 0) return;
    setBulkProgress({ done: 0, total: csvData.length, running: true });
    let success = 0;
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        const payload = {
          first_name: row.first_name, last_name: row.last_name,
          email: row.email || null, phone: row.phone || null,
          date_of_birth: row.date_of_birth || row.dob || null,
          address: row.address || null,
          tfn: row.tfn || null,
          id_documents: row.id_type && row.id_number ? [{ type: row.id_type, number: row.id_number, expiry_date: row.id_expiry || "", issuing_authority: row.id_authority || "" }] : [],
          custom_fields: [],
        };
        await axios.post(`${API}/client-personal-info/setup`, payload);
        success++;
      } catch { /* skip failed */ }
      setBulkProgress(prev => ({ ...prev, done: i + 1 }));
    }
    setBulkProgress(prev => ({ ...prev, running: false }));
    toast.success(`Imported ${success} of ${csvData.length} clients`);
  };

  const handleSingleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        id_documents: form.id_documents.filter(d => d.type && d.number),
        custom_fields: form.custom_fields.filter(f => f.label && f.value),
        tfn: form.tfn || null,
      };
      const res = await axios.post(`${API}/client-personal-info/setup`, payload);

      // Save entities if any
      if (form.entities.length > 0) {
        await axios.post(`${API}/client-personal-info/${res.data.client_id}`, {
          custom_fields: [
            ...form.custom_fields.filter(f => f.label && f.value),
            ...form.entities.filter(e => e.type && e.name).map(e => ({ label: `Entity: ${e.name}`, value: `${ENTITY_TYPES.find(t => t.value === e.type)?.label || e.type}${e.abn ? ` (ABN: ${e.abn})` : ""}${e.trustee ? ` — Trustee: ${e.trustee}` : ""}` })),
          ],
        });
      }

      toast.success(`Client ${res.data.name} created successfully`);
      try { await axios.post(`${API}/client-personal-info/${res.data.client_id}/xplan-sync`); toast.success("Synced with Xplan"); } catch { /* ignore */ }
      navigate("/adviser-hub");
    } catch { toast.error("Failed to create client"); }
    setSaving(false);
  };

  const maskTfn = (tfn) => { const c = tfn.replace(/\D/g, ""); return c.length >= 3 ? `***-***-${c.slice(-3)}` : "***-***-***"; };

  const canProceed = () => {
    if (step === 0) return !!mode;
    if (step === 1 && mode === "single") return form.first_name.trim() && form.last_name.trim();
    if (step === 1 && mode === "bulk") return csvData.length > 0;
    return true;
  };

  const actualSteps = mode === "bulk"
    ? [STEPS[0], { key: "upload", label: "CSV Upload", icon: Upload }, { key: "preview", label: "Preview & Import", icon: CheckCircle }]
    : STEPS;

  const totalSteps = actualSteps.length;

  const content = (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="client-setup-wizard">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2744]">New Client Setup</h1>
        <p className="text-sm text-muted-foreground">Step {step + 1} of {totalSteps}: {actualSteps[step]?.label || ""}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {actualSteps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  i === step ? "bg-[#1a2744] text-white" :
                  i < step ? "bg-green-100 text-green-700 cursor-pointer" :
                  "bg-muted text-muted-foreground"
                )}
                data-testid={`step-${s.key}`}
              >
                {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < totalSteps - 1 && <div className={`h-px flex-1 ${i < step ? "bg-green-300" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>

      {/* ========== STEP 0: MODE SELECTION ========== */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={cn("cursor-pointer transition-all hover:shadow-md", mode === "single" && "ring-2 ring-[#1a2744]")}
            onClick={() => setMode("single")}
            data-testid="mode-single"
          >
            <CardContent className="p-6 text-center space-y-3">
              <User className="h-10 w-10 mx-auto text-[#1a2744]" />
              <h3 className="font-semibold">Single Client</h3>
              <p className="text-sm text-muted-foreground">Set up one client with full details, entities, TFN, and ID documents</p>
            </CardContent>
          </Card>
          <Card
            className={cn("cursor-pointer transition-all hover:shadow-md", mode === "bulk" && "ring-2 ring-[#1a2744]")}
            onClick={() => setMode("bulk")}
            data-testid="mode-bulk"
          >
            <CardContent className="p-6 text-center space-y-3">
              <Upload className="h-10 w-10 mx-auto text-[#1a2744]" />
              <h3 className="font-semibold">Bulk Import (CSV)</h3>
              <p className="text-sm text-muted-foreground">Import multiple clients from a CSV file in one go</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== BULK: CSV UPLOAD ========== */}
      {step === 1 && mode === "bulk" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4" /> Upload CSV File</CardTitle>
            <CardDescription className="text-xs">CSV must have headers: first_name, last_name. Optional: email, phone, date_of_birth, address, tfn, id_type, id_number, id_expiry, id_authority</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              <Button variant="outline" onClick={() => fileRef.current?.click()} data-testid="csv-upload-btn">
                <Upload className="h-4 w-4 mr-2" /> Choose CSV File
              </Button>
              <p className="text-xs text-muted-foreground mt-2">{csvData.length > 0 ? `${csvData.length} clients parsed` : "No file selected"}</p>
            </div>

            <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
              const csv = "first_name,last_name,email,phone,date_of_birth,address,tfn,id_type,id_number\nJane,Smith,jane@example.com,+61400000000,1985-03-15,1 Test St Sydney,123456789,drivers_licence,DL12345\nJohn,Doe,john@example.com,,,,,passport,PA67890";
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "client_template.csv"; a.click();
              URL.revokeObjectURL(url);
            }} data-testid="download-template-btn">
              <Download className="h-3 w-3 mr-1" /> Download Template CSV
            </Button>

            {csvErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-medium text-red-700 mb-1"><AlertTriangle className="h-3 w-3 inline mr-1" /> {csvErrors.length} row(s) skipped:</p>
                {csvErrors.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
              </div>
            )}

            {csvData.length > 0 && (
              <div className="max-h-60 overflow-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Name</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-left">TFN</th>
                      <th className="p-2 text-left">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{i + 1}</td>
                        <td className="p-2 font-medium">{row.first_name} {row.last_name}</td>
                        <td className="p-2">{row.email || "—"}</td>
                        <td className="p-2">{row.tfn ? "***" : "—"}</td>
                        <td className="p-2">{row.id_type || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== BULK: PREVIEW & IMPORT ========== */}
      {step === 2 && mode === "bulk" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import {csvData.length} Clients</CardTitle>
            <CardDescription className="text-xs">Each client will be created with encrypted TFN/IDs and synced with Xplan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{csvData.length}</p>
                <p className="text-xs text-muted-foreground">Total Clients</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{csvData.filter(r => r.tfn).length}</p>
                <p className="text-xs text-muted-foreground">With TFN</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">{csvData.filter(r => r.id_type).length}</p>
                <p className="text-xs text-muted-foreground">With ID</p>
              </div>
            </div>

            {bulkProgress.running && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[#1a2744] transition-all" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                </div>
                <p className="text-xs text-center text-muted-foreground">{bulkProgress.done} / {bulkProgress.total} imported</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <CloudCog className="h-4 w-4" />
              <span>All TFN and ID data will be AES-256-GCM encrypted at rest.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== SINGLE: PERSONAL DETAILS ========== */}
      {step === 1 && mode === "single" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>First Name *</Label><Input value={form.first_name} onChange={e => updateForm("first_name", e.target.value)} placeholder="James" data-testid="input-first-name" /></div>
              <div><Label>Last Name *</Label><Input value={form.last_name} onChange={e => updateForm("last_name", e.target.value)} placeholder="Mitchell" data-testid="input-last-name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => updateForm("date_of_birth", e.target.value)} data-testid="input-dob" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="james@email.com" data-testid="input-email" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="+61 4xx xxx xxx" data-testid="input-phone" /></div>
              <div>
                <Label>Marital Status</Label>
                <Select value={form.marital_status} onValueChange={v => updateForm("marital_status", v)}>
                  <SelectTrigger data-testid="select-marital"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="de_facto">De Facto</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => updateForm("address", e.target.value)} placeholder="42 Collins Street, Melbourne VIC 3000" data-testid="input-address" /></div>
            <div className="w-32"><Label>Dependents</Label><Input type="number" min={0} value={form.dependents} onChange={e => updateForm("dependents", parseInt(e.target.value) || 0)} data-testid="input-dependents" /></div>
          </CardContent>
        </Card>
      )}

      {/* ========== SINGLE: ENTITIES ========== */}
      {step === 2 && mode === "single" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600" /> Entities & Structures</CardTitle>
                <CardDescription className="text-xs">Add trusts, companies, SMSFs, or other structures linked to this client</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addEntity} data-testid="add-entity-btn"><Plus className="h-4 w-4 mr-1" /> Add Entity</Button>
            </div>
          </CardHeader>
          <CardContent>
            {form.entities.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No entities added — click "Add Entity" if this client has trusts, companies, or SMSFs
              </div>
            ) : (
              <div className="space-y-3">
                {form.entities.map((entity, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2" data-testid={`entity-${idx}`}>
                    <div className="flex items-center justify-between">
                      <Select value={entity.type} onValueChange={v => updateEntity(idx, "type", v)}>
                        <SelectTrigger className="w-[220px]"><SelectValue placeholder="Entity type" /></SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removeEntity(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Entity Name</Label><Input placeholder="e.g. Thompson Family Trust" value={entity.name} onChange={e => updateEntity(idx, "name", e.target.value)} /></div>
                      <div><Label className="text-xs">ABN</Label><Input placeholder="e.g. 12 345 678 901" value={entity.abn} onChange={e => updateEntity(idx, "abn", e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Trustee / Director</Label><Input placeholder="e.g. David Thompson" value={entity.trustee} onChange={e => updateEntity(idx, "trustee", e.target.value)} /></div>
                      <div><Label className="text-xs">Notes</Label><Input placeholder="Any additional notes" value={entity.notes} onChange={e => updateEntity(idx, "notes", e.target.value)} /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== SINGLE: TFN & IDENTIFICATION ========== */}
      {step === 3 && mode === "single" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-amber-600" /> Tax File Number</CardTitle>
              <CardDescription className="text-xs">Encrypted with AES-256-GCM. Only last 3 digits visible after saving.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input type={showTfn ? "text" : "password"} placeholder="Enter TFN (9 digits)" value={form.tfn} onChange={e => updateForm("tfn", e.target.value.replace(/[^0-9]/g, "").slice(0, 9))} maxLength={9} data-testid="wizard-tfn-input" />
                <Button variant="ghost" size="icon" onClick={() => setShowTfn(!showTfn)}>{showTfn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Fingerprint className="h-4 w-4 text-purple-600" /> Identification Documents</CardTitle>
                  <CardDescription className="text-xs">Add any required ID documents</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addIdDoc} data-testid="wizard-add-id-btn"><Plus className="h-4 w-4 mr-1" /> Add ID</Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.id_documents.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">No ID documents added yet</p>
              ) : (
                <div className="space-y-3">
                  {form.id_documents.map((doc, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2" data-testid={`wizard-id-doc-${idx}`}>
                      <div className="flex items-center justify-between">
                        <Select value={doc.type} onValueChange={v => updateIdDoc(idx, "type", v)}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Select ID type" /></SelectTrigger><SelectContent>{ID_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
                        <Button variant="ghost" size="icon" onClick={() => removeIdDoc(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label className="text-xs">Number</Label><Input placeholder="ID Number" value={doc.number} onChange={e => updateIdDoc(idx, "number", e.target.value)} /></div>
                        <div><Label className="text-xs">Expiry</Label><Input type="date" value={doc.expiry_date} onChange={e => updateIdDoc(idx, "expiry_date", e.target.value)} /></div>
                        <div><Label className="text-xs">Authority</Label><Input placeholder="e.g. VicRoads" value={doc.issuing_authority} onChange={e => updateIdDoc(idx, "issuing_authority", e.target.value)} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========== SINGLE: ADDITIONAL FIELDS ========== */}
      {step === 4 && mode === "single" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4 text-teal-600" /> Additional Fields</CardTitle>
                <CardDescription className="text-xs">Add any extra information you need to capture</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addCustomField} data-testid="wizard-add-custom-btn"><Plus className="h-4 w-4 mr-1" /> Add Field</Button>
            </div>
          </CardHeader>
          <CardContent>
            {form.custom_fields.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No additional fields — click "Add Field" to create one</p>
            ) : (
              <div className="space-y-2">
                {form.custom_fields.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2" data-testid={`wizard-custom-${idx}`}>
                    <Input placeholder="Field name" value={f.label} onChange={e => updateCustomField(idx, "label", e.target.value)} className="w-1/3" />
                    <Input placeholder="Value" value={f.value} onChange={e => updateCustomField(idx, "value", e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeCustomField(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========== SINGLE: REVIEW ========== */}
      {step === 5 && mode === "single" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Client Information</CardTitle>
            <CardDescription className="text-xs">Confirm all details before submitting. Data will be encrypted and synced with Xplan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4" /> Personal Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.first_name} {form.last_name}</span></div>
                {form.date_of_birth && <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{form.date_of_birth}</span></div>}
                {form.email && <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{form.email}</span></div>}
                {form.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{form.phone}</span></div>}
                {form.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{form.address}</span></div>}
              </div>
            </div>

            {form.entities.filter(e => e.type && e.name).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600" /> Entities ({form.entities.filter(e => e.name).length})</h4>
                {form.entities.filter(e => e.type && e.name).map((e, i) => (
                  <div key={i} className="text-sm flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{ENTITY_TYPES.find(t => t.value === e.type)?.label}</Badge>
                    <span className="font-medium">{e.name}</span>
                    {e.abn && <span className="text-muted-foreground text-xs">ABN: {e.abn}</span>}
                  </div>
                ))}
              </div>
            )}

            {form.tfn && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Lock className="h-4 w-4 text-amber-600" /> TFN</h4>
                <p className="text-sm">{maskTfn(form.tfn)} <span className="text-xs text-muted-foreground">(encrypted at rest)</span></p>
              </div>
            )}

            {form.id_documents.filter(d => d.type && d.number).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Fingerprint className="h-4 w-4 text-purple-600" /> ID Documents ({form.id_documents.filter(d => d.type).length})</h4>
                {form.id_documents.filter(d => d.type && d.number).map((d, i) => (
                  <div key={i} className="text-sm flex items-center gap-2 mb-1">
                    <span className="font-medium">{ID_TYPES.find(t => t.value === d.type)?.label}:</span>
                    <span>{"*".repeat(Math.max(0, d.number.length - 4)) + d.number.slice(-4)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
              <CloudCog className="h-4 w-4" /><span>After submission, data will be automatically synced with Xplan.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} data-testid="wizard-prev-btn">
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        {mode === "bulk" && step === 2 ? (
          <Button onClick={handleBulkSubmit} disabled={bulkProgress.running || csvData.length === 0} className="bg-green-600 hover:bg-green-700" data-testid="wizard-bulk-submit-btn">
            {bulkProgress.running ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Import {csvData.length} Clients
          </Button>
        ) : mode === "single" && step === totalSteps - 1 ? (
          <Button onClick={handleSingleSubmit} disabled={saving || !form.first_name || !form.last_name} className="bg-green-600 hover:bg-green-700" data-testid="wizard-submit-btn">
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Create Client & Sync to Xplan
          </Button>
        ) : (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="bg-[#1a2744]" data-testid="wizard-next-btn">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default ClientSetupWizard;
