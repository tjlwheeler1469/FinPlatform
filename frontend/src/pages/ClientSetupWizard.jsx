import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, Shield, Fingerprint, Plus, Trash2, ChevronRight, ChevronLeft,
  CheckCircle, Lock, Eye, EyeOff, CloudCog, RefreshCw, FileText
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

const STEPS = [
  { key: "personal", label: "Personal Details", icon: User },
  { key: "identification", label: "TFN & Identification", icon: Shield },
  { key: "additional", label: "Additional Fields", icon: FileText },
  { key: "review", label: "Review & Submit", icon: CheckCircle },
];

const ClientSetupWizard = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showTfn, setShowTfn] = useState(false);

  // Form state
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    address: "",
    marital_status: "",
    dependents: 0,
    tfn: "",
    id_documents: [],
    custom_fields: [],
  });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addIdDoc = () => {
    updateForm("id_documents", [...form.id_documents, { type: "", number: "", expiry_date: "", issuing_authority: "" }]);
  };
  const updateIdDoc = (idx, field, value) => {
    const updated = [...form.id_documents];
    updated[idx] = { ...updated[idx], [field]: value };
    updateForm("id_documents", updated);
  };
  const removeIdDoc = (idx) => {
    updateForm("id_documents", form.id_documents.filter((_, i) => i !== idx));
  };

  const addCustomField = () => {
    updateForm("custom_fields", [...form.custom_fields, { label: "", value: "" }]);
  };
  const updateCustomField = (idx, field, value) => {
    const updated = [...form.custom_fields];
    updated[idx] = { ...updated[idx], [field]: value };
    updateForm("custom_fields", updated);
  };
  const removeCustomField = (idx) => {
    updateForm("custom_fields", form.custom_fields.filter((_, i) => i !== idx));
  };

  const canProceed = () => {
    if (step === 0) return form.first_name.trim() && form.last_name.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        id_documents: form.id_documents.filter(d => d.type && d.number),
        custom_fields: form.custom_fields.filter(f => f.label && f.value),
        tfn: form.tfn || null,
      };
      const res = await axios.post(`${API}/client-personal-info/setup`, payload);
      toast.success(`Client ${res.data.name} created successfully`);

      // Trigger Xplan sync for new client
      try {
        await axios.post(`${API}/client-personal-info/${res.data.client_id}/xplan-sync`);
        toast.success("Synced with Xplan");
      } catch {
        toast.info("Xplan sync will retry automatically");
      }

      navigate("/adviser-hub");
    } catch {
      toast.error("Failed to create client");
    }
    setSaving(false);
  };

  const maskTfn = (tfn) => {
    const clean = tfn.replace(/\D/g, "");
    return clean.length >= 3 ? `***-***-${clean.slice(-3)}` : "***-***-***";
  };

  const content = (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="client-setup-wizard">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a2744]">New Client Setup</h1>
        <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step].label}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step ? "bg-[#1a2744] text-white" :
                  i < step ? "bg-green-100 text-green-700 cursor-pointer" :
                  "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-${s.key}`}
              >
                {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-green-300" : "bg-muted"}`} />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Personal Details */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={form.first_name} onChange={e => updateForm("first_name", e.target.value)} placeholder="James" data-testid="input-first-name" />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.last_name} onChange={e => updateForm("last_name", e.target.value)} placeholder="Mitchell" data-testid="input-last-name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => updateForm("date_of_birth", e.target.value)} data-testid="input-dob" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="james@email.com" data-testid="input-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="+61 4xx xxx xxx" data-testid="input-phone" />
              </div>
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
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => updateForm("address", e.target.value)} placeholder="42 Collins Street, Melbourne VIC 3000" data-testid="input-address" />
            </div>
            <div className="w-32">
              <Label>Dependents</Label>
              <Input type="number" min={0} value={form.dependents} onChange={e => updateForm("dependents", parseInt(e.target.value) || 0)} data-testid="input-dependents" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: TFN & Identification */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600" /> Tax File Number
              </CardTitle>
              <CardDescription className="text-xs">Encrypted with AES-256-GCM. Only last 3 digits visible after saving.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input
                  type={showTfn ? "text" : "password"}
                  placeholder="Enter TFN (9 digits)"
                  value={form.tfn}
                  onChange={e => updateForm("tfn", e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
                  maxLength={9}
                  data-testid="wizard-tfn-input"
                />
                <Button variant="ghost" size="icon" onClick={() => setShowTfn(!showTfn)}>
                  {showTfn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-purple-600" /> Identification Documents
                  </CardTitle>
                  <CardDescription className="text-xs">Add any required ID documents</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addIdDoc} data-testid="wizard-add-id-btn">
                  <Plus className="h-4 w-4 mr-1" /> Add ID
                </Button>
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
                        <Select value={doc.type} onValueChange={v => updateIdDoc(idx, "type", v)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                          <SelectContent>
                            {ID_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => removeIdDoc(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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

      {/* Step 3: Additional Fields */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-teal-600" /> Additional Fields
                </CardTitle>
                <CardDescription className="text-xs">Add any extra information you need to capture</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addCustomField} data-testid="wizard-add-custom-btn">
                <Plus className="h-4 w-4 mr-1" /> Add Field
              </Button>
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

      {/* Step 4: Review */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Client Information</CardTitle>
              <CardDescription className="text-xs">Confirm all details before submitting. Data will be encrypted and synced with Xplan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Personal */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4" /> Personal Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.first_name} {form.last_name}</span></div>
                  {form.date_of_birth && <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{form.date_of_birth}</span></div>}
                  {form.email && <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{form.email}</span></div>}
                  {form.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{form.phone}</span></div>}
                  {form.marital_status && <div><span className="text-muted-foreground">Status:</span> <span className="font-medium capitalize">{form.marital_status.replace("_", " ")}</span></div>}
                  {form.address && <div className="col-span-2"><span className="text-muted-foreground">Address:</span> <span className="font-medium">{form.address}</span></div>}
                </div>
              </div>

              {/* TFN */}
              {form.tfn && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Lock className="h-4 w-4 text-amber-600" /> TFN</h4>
                  <p className="text-sm">{maskTfn(form.tfn)} <span className="text-xs text-muted-foreground">(encrypted at rest)</span></p>
                </div>
              )}

              {/* IDs */}
              {form.id_documents.filter(d => d.type && d.number).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Fingerprint className="h-4 w-4 text-purple-600" /> ID Documents ({form.id_documents.filter(d => d.type).length})</h4>
                  <div className="space-y-1">
                    {form.id_documents.filter(d => d.type && d.number).map((d, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <span className="font-medium">{ID_TYPES.find(t => t.value === d.type)?.label || d.type}:</span>
                        <span>{"*".repeat(Math.max(0, d.number.length - 4)) + d.number.slice(-4)}</span>
                        {d.expiry_date && <span className="text-xs text-muted-foreground">exp: {d.expiry_date}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom */}
              {form.custom_fields.filter(f => f.label && f.value).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-teal-600" /> Additional Fields</h4>
                  {form.custom_fields.filter(f => f.label && f.value).map((f, i) => (
                    <div key={i} className="text-sm"><span className="text-muted-foreground">{f.label}:</span> <span className="font-medium">{f.value}</span></div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <CloudCog className="h-4 w-4" />
                <span>After submission, data will be automatically synced with Xplan.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          data-testid="wizard-prev-btn"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-[#1a2744]"
            data-testid="wizard-next-btn"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.first_name || !form.last_name}
            className="bg-green-600 hover:bg-green-700"
            data-testid="wizard-submit-btn"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Create Client & Sync to Xplan
          </Button>
        )}
      </div>
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default ClientSetupWizard;
