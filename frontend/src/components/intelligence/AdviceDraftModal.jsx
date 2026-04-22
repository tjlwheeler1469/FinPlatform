// Advice Draft Modal — shows LLM-generated strategy memo with adviser amend/regenerate/approve controls.
// Adviser ALWAYS retains final say. No auto-send.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Send, CheckCircle2, XCircle, Sparkles } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const AdviceDraftModal = ({ open, onOpenChange, feedItem, onApproved }) => {
  const [draft, setDraft] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [adviserNotes, setAdviserNotes] = useState("");
  const [amendPrompt, setAmendPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Generate when modal opens
  useEffect(() => {
    if (!open || !feedItem) return;
    let cancelled = false;
    (async () => {
      setGenerating(true);
      setDraft(null);
      setBody("");
      try {
        const res = await fetch(`${API}/api/advice/drafts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: feedItem.clientId || "unknown",
            client_name: feedItem.clientName || "",
            headline: feedItem.headline,
            message: feedItem.message,
            context: {
              readiness_score: feedItem.readinessScore,
              classification: feedItem.classification,
              score_delta: feedItem.scoreDelta,
              financial_impact: feedItem.financialImpact,
              urgency: feedItem.urgency,
              confidence: feedItem.confidence,
            },
            actor: "adviser",
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setDraft(data.draft);
        setTitle(data.draft.title || "");
        setBody(data.draft.body || "");
        setAdviserNotes(data.draft.adviser_notes || "");
        setDirty(false);
      } catch (e) {
        toast.error("Draft generation failed", { description: String(e).slice(0, 200) });
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, feedItem]);

  const saveAmendment = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/advice/drafts/${draft.draft_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, adviser_notes: adviserNotes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDraft(data.draft);
      setDirty(false);
      toast.success("Amendment saved", { description: `Version ${data.draft?.version}` });
    } catch (e) {
      toast.error("Save failed", { description: String(e).slice(0, 200) });
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    if (!draft || !amendPrompt.trim()) return;
    setRegenerating(true);
    try {
      const res = await fetch(`${API}/api/advice/drafts/${draft.draft_id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amendment_prompt: amendPrompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDraft(data.draft);
      setBody(data.draft.body || "");
      setAmendPrompt("");
      setDirty(false);
      toast.success("Draft regenerated with your amendment");
    } catch (e) {
      toast.error("Regeneration failed", { description: String(e).slice(0, 200) });
    } finally {
      setRegenerating(false);
    }
  };

  const approve = async () => {
    if (!draft) return;
    // Save any pending changes first
    if (dirty) {
      await saveAmendment();
    }
    try {
      const res = await fetch(`${API}/api/advice/drafts/${draft.draft_id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "adviser_001", notes: adviserNotes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDraft(data.draft);
      toast.success("Advice approved & locked", { description: "Ready to notify client or attach to SOA." });
      onApproved?.(data.draft);
      onOpenChange(false);
    } catch (e) {
      toast.error("Approve failed", { description: String(e).slice(0, 200) });
    }
  };

  const reject = async () => {
    if (!draft) return;
    try {
      const res = await fetch(`${API}/api/advice/drafts/${draft.draft_id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejected_by: "adviser_001", reason: adviserNotes || "Not suitable" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.info("Draft rejected");
      onOpenChange(false);
    } catch (e) {
      toast.error("Reject failed", { description: String(e).slice(0, 200) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" data-testid="advice-draft-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-4 w-4 text-[#D4A84C]" /> Advice Draft · Adviser Copilot
            {draft?.status === "approved" && <Badge className="ml-2 bg-emerald-600">Approved</Badge>}
            {draft?.version > 1 && <Badge variant="outline" className="text-[10px]">v{draft.version}</Badge>}
          </DialogTitle>
          <DialogDescription>
            Drafted by GPT-5.2 · You have full control. Edit, regenerate, or reject before approval.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-4">
            {generating ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Drafting advice memo…
              </div>
            ) : (
              <>
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                    className="mt-1"
                    disabled={draft?.status === "approved"}
                    data-testid="advice-title-input"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Memo body (editable)</Label>
                    <span className="text-[10px] text-muted-foreground">{body.length} chars</span>
                  </div>
                  <Textarea
                    value={body}
                    onChange={(e) => { setBody(e.target.value); setDirty(true); }}
                    className="font-mono text-xs min-h-[280px]"
                    disabled={draft?.status === "approved"}
                    data-testid="advice-body-textarea"
                  />
                </div>

                <div>
                  <Label className="text-xs">Adviser notes (internal)</Label>
                  <Textarea
                    value={adviserNotes}
                    onChange={(e) => { setAdviserNotes(e.target.value); setDirty(true); }}
                    className="text-xs min-h-[60px]"
                    placeholder="Internal notes — e.g., client preference, compliance caveats"
                    disabled={draft?.status === "approved"}
                    data-testid="advice-notes-textarea"
                  />
                </div>

                {draft?.status !== "approved" && (
                  <div className="rounded-lg border border-[#D4A84C]/40 bg-[#D4A84C]/5 p-3 space-y-2">
                    <Label className="text-xs font-semibold text-[#7a5d1f]">Regenerate with instructions</Label>
                    <Textarea
                      value={amendPrompt}
                      onChange={(e) => setAmendPrompt(e.target.value)}
                      className="text-xs min-h-[60px]"
                      placeholder="e.g., 'Make it more conservative — focus on capital preservation, reduce jargon, keep to 200 words.'"
                      data-testid="advice-amend-prompt"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={regenerate}
                      disabled={regenerating || !amendPrompt.trim()}
                      className="gap-1.5 text-[11px]"
                      data-testid="advice-regenerate-btn"
                    >
                      {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Regenerate draft
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 flex-wrap">
          {draft?.status !== "approved" && (
            <>
              <Button variant="outline" onClick={reject} className="gap-1 text-xs" data-testid="advice-reject-btn">
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
              <Button variant="outline" onClick={saveAmendment} disabled={!dirty || saving} className="gap-1 text-xs" data-testid="advice-save-btn">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Save amendment
              </Button>
              <Button onClick={approve} disabled={generating} className="gap-1 text-xs bg-[#1a2744] hover:bg-[#0f1d35]" data-testid="advice-approve-btn">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve draft
              </Button>
            </>
          )}
          {draft?.status === "approved" && (
            <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700" data-testid="advice-close-btn">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdviceDraftModal;
