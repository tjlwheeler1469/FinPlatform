// RecommendationsBanner — surfaces high-priority actions at the top of a page.
// Pinned at the top so advisers see tax-loss-harvesting, planning nudges, etc. first.
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const severityStyles = {
  high: { badge: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  medium: { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  low: { badge: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  info: { badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
};

const RecommendationsBanner = ({ title = "Recommendations", description, items = [], testId = "recommendations-banner" }) => {
  if (!items || items.length === 0) return null;
  return (
    <Card className="border-[#D4A84C]/50 bg-gradient-to-br from-[#D4A84C]/10 to-white" data-testid={testId}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-[#D4A84C]" /> {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((rec, idx) => {
          const sev = severityStyles[rec.severity || "info"];
          const Icon = rec.severity === "high" ? AlertTriangle : rec.severity === "medium" ? Lightbulb : CheckCircle;
          const inner = (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-white border hover:border-[#1a2744]/40 transition-colors">
              <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${sev.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1a2744]">{rec.title}</p>
                  {rec.severity && <Badge variant="outline" className={`text-[9px] ${sev.badge}`}>{rec.severity}</Badge>}
                  {rec.tag && <Badge variant="outline" className="text-[9px]">{rec.tag}</Badge>}
                </div>
                {rec.message && <p className="text-xs text-muted-foreground mt-1">{rec.message}</p>}
              </div>
              {rec.href && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[#1a2744] flex-shrink-0">
                  Go <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              )}
              {!rec.href && <Icon className="h-4 w-4 text-[#D4A84C] flex-shrink-0" />}
            </div>
          );
          return rec.href ? (
            <Link to={rec.href} key={`rec-${idx}`} data-testid={`rec-link-${idx}`}>{inner}</Link>
          ) : (
            <div key={`rec-${idx}`} data-testid={`rec-item-${idx}`}>{inner}</div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default RecommendationsBanner;
