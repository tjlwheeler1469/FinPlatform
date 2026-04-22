// Financial Decision Graph — visualises action → outcome edges from the readiness engine.
// SVG-based, zero extra deps. Reads from whatMovesTheNeedle() + evaluateRules() output.
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, TrendingUp, TrendingDown } from "lucide-react";

const WIDTH = 900;
const HEIGHT = 420;

const DecisionGraph = ({ client, readiness, rules, topActions }) => {
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
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-4 w-4 text-[#D4A84C]" /> Financial Decision Graph
        </CardTitle>
        <CardDescription>
          How each action flows through the 5 readiness factors into {client.profile?.name?.split(" ")[0] || "your"} retirement outcomes. Thicker edges = higher impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
