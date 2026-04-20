// Universal "What Changed" panel — drop-in on any screen to show key deltas
// (confidence, spending, portfolio drift, risk). Consistent visuals across the platform.
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

const fmt = (v) => {
  if (typeof v === "string") return v;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `${v}`;
};

export const WhatChangedPanel = ({ changes = [], period = "Last review", className = "" }) => (
  <Card className={className} data-testid="what-changed-panel">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#1a2744]" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What Changed</p>
        </div>
        <span className="text-[11px] text-muted-foreground">vs {period}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {changes.map((c, i) => {
          const ArrowIcon = (c.delta ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;
          const toneText = c.isNegative ? "text-rose-700" : "text-emerald-700";
          return (
            <div key={i} className="border rounded-md p-3" data-testid={`what-changed-item-${i}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{c.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[#1a2744]">{fmt(c.current)}</span>
                {c.delta !== undefined && (
                  <span className={`text-xs font-semibold flex items-center ${toneText}`}>
                    <ArrowIcon className="h-3 w-3" />
                    {Math.abs(c.delta)}{c.suffix || "%"}
                  </span>
                )}
              </div>
              {c.previous !== undefined && (
                <p className="text-[10px] text-muted-foreground mt-1">was {fmt(c.previous)}</p>
              )}
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

export default WhatChangedPanel;
