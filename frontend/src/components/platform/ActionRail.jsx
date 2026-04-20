// Universal Action Rail — right-side persistent panel for Recommendations,
// Next Best Actions, Meeting Prep, and a global "Generate Review Pack".
// Drop-in on any premium screen to establish unified workflow ergonomics.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles, Zap, FileText, Calendar, ChevronRight,
  TrendingUp, Target, PlayCircle,
} from "lucide-react";
import { navigateToClient } from "@/lib/navigateToClient";
import { generateReviewPackPDF } from "@/lib/pdfGenerator";
import { CLIENT_DATA } from "@/data/clientData";

const fmt = (v) => {
  if (typeof v !== "number") return v;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

const Section = ({ icon: Icon, title, count, children, collapsible = false }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b last:border-b-0 py-3" data-testid={`rail-section-${title.replace(/\s/g, "-").toLowerCase()}`}>
      <button
        className="w-full flex items-center justify-between text-left mb-2 hover:opacity-80"
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-[#1a2744]" />
          <span className="text-[11px] font-semibold text-[#1a2744] uppercase tracking-wide">{title}</span>
          {count !== undefined && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{count}</Badge>
          )}
        </div>
        {collapsible && <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />}
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
};

export const ActionRail = ({
  clientId,
  recommendations = [],
  nextActions = [],
  meetingPrep,
  reviewPackData,
  className = "",
}) => {
  const navigate = useNavigate();
  const client = clientId ? CLIENT_DATA[clientId] : null;

  const defaultRecs = recommendations.length ? recommendations : (client ? [
    { icon: TrendingUp, title: "Rebalance overweight property", impact: 42000, tab: "investments" },
    { icon: Zap, title: "Tax-loss harvesting window", impact: 6300, tab: "tax" },
    { icon: Target, title: "Max concessional contributions", impact: 5800, tab: "retirement" },
  ] : []);

  const defaultActions = nextActions.length ? nextActions : (client ? [
    { priority: "high", title: "Schedule annual review", client_id: clientId },
    { priority: "medium", title: "Update risk profile assessment", client_id: clientId },
  ] : []);

  const handleGeneratePack = () => {
    if (!clientId) {
      toast.error("Select a client to generate a Review Pack");
      return;
    }
    try {
      generateReviewPackPDF({
        clientId,
        confidence: reviewPackData?.confidence || 82,
        changes: reviewPackData?.changes || [],
        opportunities: reviewPackData?.opportunities || defaultRecs.map((r) => ({ title: r.title, detail: r.detail || "", impact: r.impact || 0 })),
        alerts: reviewPackData?.alerts || [],
      });
      toast.success("Review Pack downloaded", { description: `Generated for ${client?.profile?.name || "client"}` });
    } catch (e) {
      toast.error("PDF generation failed");
    }
  };

  const handleAction = (action) => {
    const target = action.client_id || clientId;
    if (target) {
      navigateToClient(navigate, target, { tab: action.tab });
    } else {
      toast.info(action.title || "Opening action");
    }
  };

  return (
    <aside className={`space-y-3 ${className}`} data-testid="action-rail">
      {/* Primary CTA */}
      <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3a5c] text-white border-0">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#D4A84C]" />
            <p className="text-[11px] font-semibold uppercase tracking-wide">Review Pack</p>
          </div>
          <p className="text-xs text-white/70">One-click PDF — meeting prep, risks, and recommendations.</p>
          <Button
            className="w-full bg-[#D4A84C] hover:bg-[#b88f3c] text-[#1a2744] font-semibold"
            size="sm"
            onClick={handleGeneratePack}
            data-testid="rail-generate-review-pack"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Generate Review Pack
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          {/* Recommendations */}
          <Section icon={Sparkles} title="Recommendations" count={defaultRecs.length}>
            {defaultRecs.slice(0, 4).map((r, i) => (
              <button
                key={i}
                onClick={() => handleAction(r)}
                className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-gray-50 transition-colors"
                data-testid={`rail-rec-${i}`}
              >
                <r.icon className="h-3 w-3 mt-0.5 text-[#1a2744] flex-shrink-0" />
                <span className="text-[11px] flex-1">{r.title}</span>
                {r.impact !== undefined && (
                  <span className="text-[10px] font-semibold text-emerald-700">{fmt(r.impact)}</span>
                )}
              </button>
            ))}
          </Section>

          {/* Next Best Actions */}
          <Section icon={Zap} title="Next Best Actions" count={defaultActions.length}>
            {defaultActions.slice(0, 4).map((a, i) => {
              const tone = a.priority === "critical" ? "bg-rose-500" :
                a.priority === "high" ? "bg-orange-500" : "bg-blue-500";
              return (
                <button
                  key={i}
                  onClick={() => handleAction(a)}
                  className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-gray-50 transition-colors"
                  data-testid={`rail-action-${i}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${tone} mt-1.5 flex-shrink-0`} />
                  <span className="text-[11px] flex-1">{a.title}</span>
                  <PlayCircle className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                </button>
              );
            })}
          </Section>

          {/* Meeting Prep */}
          <Section icon={Calendar} title="Meeting Prep">
            <div className="text-[11px] space-y-1 px-1.5">
              <p className="text-gray-700">{meetingPrep?.nextMeeting || "No upcoming meeting"}</p>
              {meetingPrep?.notes?.map((n, i) => (
                <p key={i} className="text-muted-foreground">• {n}</p>
              ))}
              {!meetingPrep?.notes && client && (
                <>
                  <p className="text-muted-foreground">• Confidence delta since last review</p>
                  <p className="text-muted-foreground">• Portfolio drift to discuss</p>
                  <p className="text-muted-foreground">• Recommended scenario options</p>
                </>
              )}
            </div>
          </Section>
        </CardContent>
      </Card>
    </aside>
  );
};

export default ActionRail;
