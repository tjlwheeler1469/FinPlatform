// Universal Page Shell — standardized premium page framework:
// [Sticky Header → Hero Metrics] → [Main Content + optional ActionRail (right)] → [Footer CTA]
// Drop-in on any page to ensure consistent structure and decision-density styling.
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const PageShell = ({
  title,
  subtitle,
  badges = [],
  ctas = [],
  metrics = [],
  actionRail = null,
  children,
  maxWidth = "1800px",
  stickyHeader = true,
  testId = "page-shell",
}) => {
  return (
    <div className="min-h-screen bg-gray-50" data-testid={testId}>
      <div className="mx-auto px-4 sm:px-6 pt-4 pb-10" style={{ maxWidth }}>
        {/* Header */}
        <Card
          className={`border-2 border-[#1a2744]/10 shadow-sm mb-5 ${stickyHeader ? "sticky top-2 z-20" : ""}`}
          data-testid="page-shell-header"
        >
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
              {/* Title & Subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-[#1a2744] leading-tight">{title}</h1>
                  {badges.map((b, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]" data-testid={`page-shell-badge-${i}`}>{b}</Badge>
                  ))}
                </div>
                {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>

              {/* Metrics inline */}
              {metrics.length > 0 && (
                <div className={`grid gap-4 flex-1`} style={{ gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))` }}>
                  {metrics.map((m, i) => (
                    <div key={i} data-testid={`page-shell-metric-${i}`}>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className={`text-base font-bold ${m.tone || "text-[#1a2744]"}`}>{m.value}</p>
                      {m.delta && (
                        <p className={`text-[10px] ${m.delta.startsWith("+") || m.delta.startsWith("↑") ? "text-emerald-700" : "text-rose-700"}`}>{m.delta}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* CTAs */}
              {ctas.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {ctas.map((c, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={c.variant || (i === ctas.length - 1 ? "default" : "outline")}
                      className={i === ctas.length - 1 && !c.variant ? "bg-[#1a2744] hover:bg-[#1a2744]/90" : ""}
                      onClick={c.onClick}
                      disabled={c.disabled}
                      data-testid={c.testId || `page-shell-cta-${i}`}
                    >
                      {c.icon && <c.icon className="h-3.5 w-3.5 mr-1.5" />}
                      {c.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main + Action Rail */}
        {actionRail ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
            <div className="min-w-0 space-y-5">{children}</div>
            <div className="hidden xl:block">{actionRail}</div>
          </div>
        ) : (
          <div className="space-y-5">{children}</div>
        )}
      </div>
    </div>
  );
};

export default PageShell;
