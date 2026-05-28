import { Card, CardContent } from "@/components/ui/card";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const WhatChangedCard = ({ changes }) => (
  <Card className="border-slate-200" data-testid="card-what-changed">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> What changed since last review
        </p>
        <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">Last review · 3 months ago</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {changes.map((c, i) => {
          const ArrowIcon = c.delta >= 0 ? ArrowUpRight : ArrowDownRight;
          const sentiment = c.isNegative ? "rose" : "emerald";
          const toneText = sentiment === "emerald" ? "text-emerald-600" : "text-rose-600";
          return (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4" data-testid={`change-item-${i}`}>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold mb-2">{c.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl text-[#1a2744] tabular-nums">{c.current}</span>
                <span className={`text-[11px] font-mono flex items-center ${toneText}`}>
                  <ArrowIcon className="h-3 w-3" />
                  {Math.abs(c.delta)}{c.suffix}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">was {c.previous}</p>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
