import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PillButton } from "@/components/PageShell";
import { Calendar, FileText } from "lucide-react";

export const MeetingPrepCard = ({ client, onGeneratePack }) => {
  const nextMeeting = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });
  }, []);

  return (
    <Card className="border-slate-200" data-testid="card-meeting-prep">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Meeting prep
          </p>
          <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{nextMeeting}</span>
        </div>
        <p className="font-serif text-lg text-[#1a2744] mb-4 leading-tight">Annual review · {client.profile.name}</p>
        <div className="space-y-2.5 mb-5">
          <div className="flex items-start gap-2.5 text-sm" data-testid="meeting-change-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
            <span className="text-slate-700">Confidence <span className="font-semibold text-[#1a2744]">dropped 4 pts</span> since last review</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm" data-testid="meeting-change-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
            <span className="text-slate-700">New <span className="font-semibold text-[#1a2744]">equity over-allocation</span> needs rebalance</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm" data-testid="meeting-change-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84C] mt-2 flex-shrink-0" />
            <span className="text-slate-700">Recommend scenario · <span className="font-semibold text-[#1a2744]">Retire at 67 (+9% confidence)</span></span>
          </div>
        </div>
        <PillButton variant="primary" className="w-full !justify-center" onClick={onGeneratePack} data-testid="btn-generate-review-pack">
          <FileText className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Generate review pack
        </PillButton>
      </CardContent>
    </Card>
  );
};
