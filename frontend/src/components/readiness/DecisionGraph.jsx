// Financial Decision Graph — visualises action → outcome edges from the readiness engine.
// SVG-based, zero extra deps. Reads from whatMovesTheNeedle() + evaluateRules() output.
// Exports: PNG snapshot + multi-page PDF report (graph + factors + opportunities + scenario trail).
import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Network, TrendingUp, TrendingDown, FileText, Image as ImageIcon } from "lucide-react";

const WIDTH = 900;
const HEIGHT = 420;

// ── formatting helpers for PDF ──
const fmtMoneyShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};
const barText = (s) => {
  if (s >= 90) return "Strong";
  if (s >= 75) return "On Track";
  if (s >= 60) return "Watchlist";
  return "At Risk";
};

const DecisionGraph = ({ client, readiness, rules, topActions }) => {
  const graphRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPng = async () => {
    if (!graphRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(graphRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      const name = (client.profile?.name || "client").replace(/\s+/g, "_");
      link.download = `decision_graph_${name}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!graphRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(graphRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 32;
      const name = (client.profile?.name || "client").replace(/\s+/g, "_");
      const dateStr = new Date().toLocaleString("en-AU");

      // ── Page 1 — Graph ───────────────────────────────────────────────
      pdf.setFontSize(16);
      pdf.setTextColor(26, 39, 68);
      pdf.text("Financial Decision Graph", margin, margin + 4);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`${client.profile?.name || "Client"} · Readiness ${readiness.score}/100 · ${readiness.classification?.label || ""}`, margin, margin + 22);
      pdf.text(`Generated ${dateStr} — for adviser/client SOA attachment`, margin, margin + 36);
      const imgW = pageWidth - margin * 2;
      const imgH = Math.min((canvas.height / canvas.width) * imgW, pageHeight - margin * 2 - 70);
      pdf.addImage(imgData, "PNG", margin, margin + 52, imgW, imgH);
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${rules.alerts.length} alerts · ${rules.opportunities.length} opportunities surfaced from the Rules Engine.`, margin, pageHeight - margin + 6);

      // ── Page 2 — Readiness factor breakdown ──────────────────────────
      pdf.addPage("a4", "landscape");
      pdf.setFontSize(14); pdf.setTextColor(26, 39, 68);
      pdf.text("Appendix A — Readiness Factor Breakdown", margin, margin + 4);
      pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
      pdf.text(`5 weighted factors · composite score ${readiness.score}/100`, margin, margin + 22);
      const factorRows = (readiness.factors || []).map((f) => [
        f.label, `${Math.round(f.weight)}%`, f.score.toString(), barText(f.score),
      ]);
      autoTable(pdf, {
        startY: margin + 32,
        head: [["Factor", "Weight", "Score", "Band"]],
        body: factorRows,
        theme: "grid",
        headStyles: { fillColor: [26, 39, 68], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 3: { cellWidth: "wrap" } },
      });

      // Outcome table on same page
      const outcomeBodyRows = [
        ["Sustainable income / yr", fmtMoneyShort(readiness.outcome.sustainableIncome)],
        ["Lifetime income (approx)", fmtMoneyShort(readiness.outcome.sustainableIncome * (readiness.outcome.yearsSustainability || 0))],
        ["Probability of success", `${readiness.outcome.probabilityOfSuccess}%`],
        ["Years sustainable", `${readiness.outcome.yearsSustainability} yrs`],
        ["Funding gap", fmtMoneyShort(readiness.outcome.fundingGap || 0)],
      ];
      autoTable(pdf, {
        startY: (pdf.lastAutoTable?.finalY || margin + 80) + 14,
        head: [["Outcome", "Value"]],
        body: outcomeBodyRows,
        theme: "grid",
        headStyles: { fillColor: [212, 168, 76], textColor: 26, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });

      // ── Page 3 — Opportunities & alerts ──────────────────────────────
      pdf.addPage("a4", "landscape");
      pdf.setFontSize(14); pdf.setTextColor(26, 39, 68);
      pdf.text("Appendix B — Rules Engine Output", margin, margin + 4);
      pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
      pdf.text(`${rules.alerts.length} alerts · ${rules.opportunities.length} opportunities`, margin, margin + 22);

      if (rules.opportunities.length) {
        autoTable(pdf, {
          startY: margin + 32,
          head: [["Opportunity", "Severity", "Value ($)", "Message"]],
          body: rules.opportunities.map((o) => [o.title, o.severity, o.value ? fmtMoneyShort(o.value) : "—", o.message]),
          theme: "striped",
          headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8, cellWidth: "wrap" },
          columnStyles: { 0: { cellWidth: 160 }, 1: { cellWidth: 60 }, 2: { cellWidth: 70 }, 3: { cellWidth: "auto" } },
        });
      }
      if (rules.alerts.length) {
        autoTable(pdf, {
          startY: (pdf.lastAutoTable?.finalY || margin + 80) + 14,
          head: [["Alert", "Severity", "Message"]],
          body: rules.alerts.map((a) => [a.title, a.severity, a.message]),
          theme: "striped",
          headStyles: { fillColor: [225, 29, 72], textColor: 255, fontSize: 9 },
          bodyStyles: { fontSize: 8, cellWidth: "wrap" },
          columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 60 }, 2: { cellWidth: "auto" } },
        });
      }

      // ── Page 4 — Scenario trail (top actions) ────────────────────────
      pdf.addPage("a4", "landscape");
      pdf.setFontSize(14); pdf.setTextColor(26, 39, 68);
      pdf.text("Appendix C — Scenario Trail · What Moves The Needle", margin, margin + 4);
      pdf.setFontSize(9); pdf.setTextColor(100, 116, 139);
      pdf.text("Top ranked actions by projected readiness-score uplift (vs baseline).", margin, margin + 22);
      autoTable(pdf, {
        startY: margin + 32,
        head: [["Rank", "Action", "Projected score", "Uplift (pts)"]],
        body: (topActions || []).map((a, i) => [`#${i + 1}`, a.label, a.score, (a.uplift >= 0 ? "+" : "") + a.uplift]),
        theme: "grid",
        headStyles: { fillColor: [212, 168, 76], textColor: 26, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 380 }, 2: { cellWidth: 90 }, 3: { cellWidth: 80 } },
      });

      // Footer on every page
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7); pdf.setTextColor(148, 163, 184);
        pdf.text(`Wealth Command · ${client.profile?.name || "Client"} · ${dateStr}`, margin, pageHeight - 12);
        pdf.text(`Page ${i} / ${pageCount}`, pageWidth - margin - 40, pageHeight - 12);
      }

      pdf.save(`decision_graph_${name}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  const nodes = useMemo(() => {
    // Outcome pillar (right)
    const outcomes = [
      { id: "out-score", label: `Readiness ${readiness.score}`, type: "outcome-primary", x: WIDTH - 150, y: HEIGHT / 2 },
      { id: "out-income", label: `Income ${short(readiness.outcome.sustainableIncome)}/yr`, type: "outcome", x: WIDTH - 150, y: 80 },
      { id: "out-gap", label: `Gap ${short(readiness.outcome.fundingGap)}`, type: "outcome", x: WIDTH - 150, y: HEIGHT - 80 },
      { id: "out-prob", label: `Success ${readiness.outcome.probabilityOfSuccess}%`, type: "outcome", x: WIDTH - 150, y: HEIGHT / 2 - 110 },
      { id: "out-sust", label: `Sustainable ${readiness.outcome.yearsSustainability}yr`, type: "outcome", x: WIDTH - 150, y: HEIGHT / 2 + 110 },
    ];

    // Action nodes (left) — top moves
    const actions = topActions.slice(0, 5).map((a, i) => ({
      id: `act-${a.id}`,
      label: a.label,
      uplift: a.uplift,
      type: "action",
      x: 150,
      y: 60 + i * ((HEIGHT - 120) / Math.max(1, topActions.slice(0, 5).length - 1 || 1)),
    }));

    // Factor nodes (middle)
    const factors = readiness.factors.map((f, i) => ({
      id: `fac-${f.id}`,
      label: f.label,
      score: f.score,
      weight: f.weight,
      type: "factor",
      x: WIDTH / 2,
      y: 60 + i * ((HEIGHT - 120) / (readiness.factors.length - 1)),
    }));

    return { actions, factors, outcomes };
  }, [readiness, topActions]);

  // Edges: action → relevant factor → outcome
  const edges = useMemo(() => {
    const e = [];
    // map of action.id → list of factor ids it influences
    const ACTION_TO_FACTORS = {
      "act-contrib_up": ["fac-income", "fac-funding", "fac-probability"],
      "act-delay_retirement": ["fac-probability", "fac-income", "fac-flexibility"],
      "act-reduce_spending": ["fac-income", "fac-probability", "fac-flexibility"],
      "act-part_time": ["fac-flexibility", "fac-income"],
      "act-lift_allocation": ["fac-risk", "fac-probability"],
    };
    const FACTOR_TO_OUTCOMES = {
      "fac-income": ["out-income", "out-score"],
      "fac-probability": ["out-prob", "out-score"],
      "fac-funding": ["out-gap", "out-score"],
      "fac-risk": ["out-sust", "out-score"],
      "fac-flexibility": ["out-sust", "out-score"],
    };

    nodes.actions.forEach((a) => {
      const targets = ACTION_TO_FACTORS[a.id] || [];
      targets.forEach((fid) => {
        const factor = nodes.factors.find((f) => f.id === fid);
        if (factor) e.push({ from: a, to: factor, strength: Math.max(0, a.uplift || 0) });
      });
    });
    nodes.factors.forEach((f) => {
      const targets = FACTOR_TO_OUTCOMES[f.id] || [];
      targets.forEach((oid) => {
        const outcome = nodes.outcomes.find((o) => o.id === oid);
        if (outcome) e.push({ from: f, to: outcome, strength: f.score / 100 });
      });
    });
    return e;
  }, [nodes]);

  return (
    <Card data-testid="decision-graph">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4 text-[#D4A84C]" /> Financial Decision Graph
            </CardTitle>
            <CardDescription>
              How each action flows through the 5 readiness factors into {client.profile?.name?.split(" ")[0] || "your"} retirement outcomes. Thicker edges = higher impact.
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1"
              onClick={handleExportPng}
              disabled={exporting}
              data-testid="graph-export-png"
            >
              <ImageIcon className="h-3 w-3" /> PNG
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1"
              onClick={handleExportPdf}
              disabled={exporting}
              data-testid="graph-export-pdf"
            >
              <FileText className="h-3 w-3" /> PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={graphRef} className="bg-white p-2 rounded">
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[420px]" data-testid="decision-graph-svg">
            {/* Column labels */}
            <text x={150} y={28} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Actions</text>
            <text x={WIDTH / 2} y={28} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Readiness Factors</text>
            <text x={WIDTH - 150} y={28} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2 }}>Outcomes</text>

            {/* Edges */}
            <g>
              {edges.map((e, i) => {
                const dx = e.to.x - e.from.x;
                const cx1 = e.from.x + dx * 0.5;
                const cx2 = e.to.x - dx * 0.5;
                const strokeWidth = Math.max(0.75, Math.min(3.5, (e.strength || 0.3) * 2.8));
                const color = e.from.type === "action" ? "#D4A84C" : "#1a2744";
                return (
                  <path
                    key={i}
                    d={`M ${e.from.x + 80} ${e.from.y} C ${cx1} ${e.from.y}, ${cx2} ${e.to.y}, ${e.to.x - 80} ${e.to.y}`}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity={0.45}
                  />
                );
              })}
            </g>

            {/* Action nodes */}
            {nodes.actions.map((a) => (
              <g key={a.id} data-testid={`graph-${a.id}`}>
                <rect x={a.x - 80} y={a.y - 20} width={160} height={40} rx={20} fill="#D4A84C" opacity={0.92} />
                <foreignObject x={a.x - 78} y={a.y - 18} width={156} height={36}>
                  <div style={{ fontSize: 10.5, color: "#1a2744", fontWeight: 600, lineHeight: 1.2, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 6px", textAlign: "center" }}>
                    {a.label}
                  </div>
                </foreignObject>
                {a.uplift !== undefined && (
                  <g transform={`translate(${a.x + 82}, ${a.y - 9})`}>
                    <rect x={0} y={0} width={40} height={18} rx={9} fill={a.uplift >= 0 ? "#10b981" : "#ef4444"} />
                    <text x={20} y={13} textAnchor="middle" fill="white" style={{ fontSize: 10, fontWeight: 700 }}>
                      {a.uplift >= 0 ? "+" : ""}{a.uplift}
                    </text>
                  </g>
                )}
              </g>
            ))}

            {/* Factor nodes */}
            {nodes.factors.map((f) => (
              <g key={f.id} data-testid={`graph-${f.id}`}>
                <rect x={f.x - 80} y={f.y - 20} width={160} height={40} rx={8} fill="#f1f5f9" stroke="#1a2744" strokeOpacity={0.2} />
                <foreignObject x={f.x - 78} y={f.y - 18} width={156} height={36}>
                  <div style={{ fontSize: 10, color: "#1a2744", fontWeight: 600, lineHeight: 1.1, display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "0 8px" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                    <span style={{ fontWeight: 800, color: f.score >= 75 ? "#10b981" : f.score >= 60 ? "#f59e0b" : "#ef4444" }}>{f.score}</span>
                  </div>
                </foreignObject>
              </g>
            ))}

            {/* Outcome nodes */}
            {nodes.outcomes.map((o) => (
              <g key={o.id} data-testid={`graph-${o.id}`}>
                <rect
                  x={o.x - 80}
                  y={o.y - 20}
                  width={160}
                  height={40}
                  rx={o.type === "outcome-primary" ? 20 : 8}
                  fill={o.type === "outcome-primary" ? "#1a2744" : "white"}
                  stroke="#1a2744"
                  strokeOpacity={o.type === "outcome-primary" ? 1 : 0.3}
                  strokeWidth={o.type === "outcome-primary" ? 2 : 1}
                />
                <foreignObject x={o.x - 78} y={o.y - 18} width={156} height={36}>
                  <div style={{ fontSize: 11, color: o.type === "outcome-primary" ? "white" : "#1a2744", fontWeight: 700, lineHeight: 1.2, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "0 6px", textAlign: "center" }}>
                    {o.label}
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#D4A84C]" /> Actions (levers)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 border border-slate-400" /> Factors (weighted 0–100)</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#1a2744]" /> Outcomes</div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="text-[10px]">{rules.alerts.length} alerts</Badge>
            <Badge variant="outline" className="text-[10px]">{rules.opportunities.length} opportunities</Badge>
            <Badge variant="outline" className={`text-[10px] ${readiness.score >= 75 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : readiness.score >= 60 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
              {readiness.classification.label}
            </Badge>
          </div>
        </div>

        {/* Top action uplifts */}
        {topActions.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            {topActions.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-2 p-2 rounded border text-xs" data-testid={`graph-summary-${a.id}`}>
                {a.uplift >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-600" />}
                <span className="flex-1 truncate">{a.label}</span>
                <span className={`font-bold tabular-nums ${a.uplift >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{a.uplift >= 0 ? "+" : ""}{a.uplift}</span>
              </div>
            ))}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
};

const short = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

export default DecisionGraph;
