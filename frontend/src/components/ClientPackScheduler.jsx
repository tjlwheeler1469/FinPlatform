import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, Plus, Play, Trash2, Clock, CheckCircle, RefreshCw, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const ClientPackScheduler = () => {
  const [schedules, setSchedules] = useState([]);
  const [packs, setPacks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [runningAll, setRunningAll] = useState(false);
  const [form, setForm] = useState({ client_name: "", client_id: "", frequency: "quarterly", email: "", autoEmail: false });

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, packsRes] = await Promise.all([
        fetch(`${API_URL}/api/client-pack/schedules`),
        fetch(`${API_URL}/api/client-pack/packs`),
      ]);
      if (schedRes.ok) setSchedules((await schedRes.json()).schedules || []);
      if (packsRes.ok) setPacks((await packsRes.json()).packs || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.client_name.trim()) return toast.error("Client name required");
    try {
      const res = await fetch(`${API_URL}/api/client-pack/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: form.client_id || `client_${Date.now()}`,
          client_name: form.client_name,
          frequency: form.frequency,
        }),
      });
      if (res.ok) {
        toast.success("Schedule created");
        setShowForm(false);
        setForm({ client_name: "", client_id: "", frequency: "quarterly", email: "", autoEmail: false });
        fetchData();
      }
    } catch {
      toast.error("Failed to create schedule");
    }
  };

  const handleGenerateNow = async (clientId, clientName) => {
    setGenerating(clientId);
    try {
      const res = await fetch(
        `${API_URL}/api/client-pack/generate/${clientId}?client_name=${encodeURIComponent(clientName)}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(`Pack generated for ${clientName}`);
        // Download PDF
        if (data.pack?.analysis_data) {
          const pdfRes = await fetch(`${API_URL}/api/pdf-report/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysis_data: data.pack.analysis_data }),
          });
          if (pdfRes.ok) {
            const blob = await pdfRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${clientName.replace(/\s/g, "_")}_Review_Pack.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
        fetchData();
      }
    } catch {
      toast.error("Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    setRunningAll(true);
    try {
      const res = await fetch(`${API_URL}/api/client-pack/generate-all`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Generated ${data.generated_count} packs`);
        fetchData();
      }
    } catch {
      toast.error("Batch generation failed");
    } finally {
      setRunningAll(false);
    }
  };

  const handleCancel = async (scheduleId) => {
    try {
      const res = await fetch(`${API_URL}/api/client-pack/schedule/${scheduleId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Schedule cancelled");
        fetchData();
      }
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const handleDownloadPack = async (packId, clientName) => {
    try {
      const res = await fetch(`${API_URL}/api/client-pack/pack/${packId}`);
      if (!res.ok) return;
      const data = await res.json();
      const pdfRes = await fetch(`${API_URL}/api/pdf-report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_data: data.analysis_data }),
      });
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${clientName.replace(/\s/g, "_")}_Review_Pack.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const activeSchedules = schedules.filter((s) => s.status === "active");

  return (
    <Card className="border-[#1a2744]/20" data-testid="client-pack-scheduler">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#D4A84C]" />
            Client Pack Scheduler
            <Badge className="bg-emerald-600 text-white text-[10px]">Auto</Badge>
          </span>
          <div className="flex gap-2">
            {activeSchedules.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleGenerateAll}
                disabled={runningAll}
                data-testid="generate-all-packs-btn"
              >
                {runningAll ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                Run All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setShowForm((p) => !p)}
              data-testid="add-schedule-btn"
            >
              <Plus className="h-3 w-3 mr-1" /> Schedule
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">Auto-generate quarterly review packs for clients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New Schedule Form */}
        {showForm && (
          <div className="p-3 border rounded-lg bg-muted/30 space-y-2" data-testid="schedule-form">
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Client name"
                value={form.client_name}
                onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                className="text-sm"
                data-testid="schedule-client-name"
              />
              <Input
                placeholder="Client ID (optional)"
                value={form.client_id}
                onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                className="text-sm"
                data-testid="schedule-client-id"
              />
              <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v }))}>
                <SelectTrigger className="text-sm" data-testid="schedule-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Client email (for auto-delivery)"
                value={form.email}
                type="email"
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="text-sm flex-1"
                data-testid="schedule-client-email"
              />
              <label className="flex items-center gap-1.5 cursor-pointer min-w-fit" data-testid="auto-email-toggle">
                <Mail className={`h-3.5 w-3.5 ${form.autoEmail ? "text-[#D4A84C]" : "text-muted-foreground"}`} />
                <span className="text-xs">Auto-email</span>
                <Switch checked={form.autoEmail} onCheckedChange={(v) => setForm(f => ({...f, autoEmail: v}))} />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black" onClick={handleCreate} data-testid="create-schedule-btn">
                Create Schedule
              </Button>
            </div>
          </div>
        )}

        {/* Active Schedules */}
        {activeSchedules.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Active Schedules ({activeSchedules.length})</p>
            {activeSchedules.map((s) => (
              <div key={s.schedule_id} className="flex items-center justify-between p-2 bg-white rounded border text-xs" data-testid={`schedule-${s.schedule_id}`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-[#D4A84C] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.client_name}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {s.frequency} · Next: {new Date(s.next_run).toLocaleDateString()}
                      {s.packs_generated > 0 && (
                        <span className="ml-1">· {s.packs_generated} generated</span>
                      )}
                      {s.auto_email && (
                        <Badge className="ml-1 bg-[#D4A84C]/10 text-[#D4A84C] border-[#D4A84C]/30 text-[9px] px-1">
                          <Send className="h-2.5 w-2.5 mr-0.5" />Auto-email
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleGenerateNow(s.client_id, s.client_name)}
                    disabled={generating === s.client_id}
                    data-testid={`generate-now-${s.schedule_id}`}
                  >
                    {generating === s.client_id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Download className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                    onClick={() => handleCancel(s.schedule_id)}
                    data-testid={`cancel-schedule-${s.schedule_id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            No schedules yet. Click "Schedule" to auto-generate client review packs.
          </div>
        )}

        {/* Recent Packs */}
        {packs.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground">Recent Packs ({packs.length})</p>
            {packs.slice(0, 4).map((p) => (
              <div key={p.pack_id} className="flex items-center justify-between p-2 bg-emerald-50 rounded border border-emerald-200 text-xs" data-testid={`pack-${p.pack_id}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <div>
                    <p className="font-medium">{p.client_name}</p>
                    <p className="text-muted-foreground">{new Date(p.generated_at).toLocaleString()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleDownloadPack(p.pack_id, p.client_name)}
                  data-testid={`download-pack-${p.pack_id}`}
                >
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientPackScheduler;
