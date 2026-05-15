// PageShell — shared airy page chrome inspired by the Truth Journey design.
// Use on any page that needs the modern, breathable look:
//
//   <PageShell
//     eyebrow="FIRM"
//     title="Your firm at a glance"
//     subtitle="Every advice engagement, deal stage, and exposure in one place."
//     metrics={[
//       { label: "Households", value: "8" },
//       { label: "Total AUM", value: "$42.3M" },
//     ]}
//     actions={<Button>+ New deal</Button>}
//     filters={<ChipFilter ... />}
//   >
//     {/* main content — cards, table, etc. */}
//   </PageShell>
//
// Style principles (verbatim from the Truth Journey reference):
//   • Large hero typography (text-3xl/4xl/5xl) with brand-accent on key noun
//   • KPI cluster top-right, 4 max, plain inline metrics (no gradient cards)
//   • Pill-shaped primary CTA, ghost-pill secondary CTA
//   • Chip-style filter pills with active state
//   • Generous vertical rhythm (space-y-8 / py-10)
//   • Subtle borders (border-slate-200), rare drop-shadow
//   • White surfaces; brand-navy text; gold-accent reserved for highlights
import { cn } from "@/lib/utils";

export const PageShell = ({
  eyebrow,
  title,
  accent,            // optional fragment inside the title rendered in gold (e.g. "in one journey")
  subtitle,
  metrics,           // array<{label, value, hint?}>
  actions,           // node — pill CTA(s)
  filters,           // node — chip filters / search bar
  meta,              // optional small text bottom of header (e.g. "FY 2024-25 · 414 days until reform")
  className,
  bg = "bg-white",
  children,
}) => (
  <div className={cn("min-h-[calc(100vh-64px)]", bg)} data-testid="page-shell">
    <div className={cn("max-w-[1440px] mx-auto px-6 lg:px-10 py-10", className)}>
      {/* Hero */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 mb-3" data-testid="page-eyebrow">{eyebrow}</p>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight text-[#1a2744]" data-testid="page-title">
            {title}
            {accent && <span className="block text-[#D4A84C] mt-1">{accent}</span>}
          </h1>
          {subtitle && (
            <p className="mt-4 text-base text-slate-600 max-w-2xl leading-relaxed" data-testid="page-subtitle">{subtitle}</p>
          )}
          {meta && (
            <p className="mt-3 text-[11px] tracking-wide text-slate-400 uppercase font-mono" data-testid="page-meta">{meta}</p>
          )}
        </div>
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5 lg:gap-7 flex-shrink-0">
            {metrics.slice(0, 4).map((m, i) => (
              <div key={i} className="text-right" data-testid={`metric-${m.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-medium">{m.label}</p>
                <p className="font-serif text-2xl lg:text-3xl text-[#1a2744] mt-1">{m.value}</p>
                {m.hint && <p className="text-[11px] text-slate-500 mt-0.5">{m.hint}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar — filters left, primary actions right */}
      {(filters || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 pb-6 border-b border-slate-200">
          <div className="flex-1 min-w-0">{filters}</div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}

      {children}
    </div>
  </div>
);

// Chip-style filter pill row
export const ChipFilter = ({ options, value, onChange, dataTestidPrefix = "chip" }) => (
  <div className="flex items-center gap-2 flex-wrap" data-testid="chip-filter">
    {options.map((o) => {
      const id = typeof o === "string" ? o : o.value;
      const label = typeof o === "string" ? o : o.label;
      const count = typeof o === "object" ? o.count : undefined;
      const active = value === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          data-testid={`${dataTestidPrefix}-${id}`}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all border",
            active
              ? "bg-[#1a2744] text-white border-[#1a2744]"
              : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
          )}
        >
          {label}
          {Number.isFinite(count) && (
            <span className={cn("ml-1.5 text-[10px]", active ? "text-white/60" : "text-slate-400")}>{count}</span>
          )}
        </button>
      );
    })}
  </div>
);

// Pill-shaped CTA buttons matching the Truth Journey reference
export const PillButton = ({ variant = "primary", className, children, ...props }) => (
  <button
    {...props}
    className={cn(
      "px-5 py-2.5 rounded-full text-[13px] font-semibold tracking-tight transition-all",
      variant === "primary" && "bg-[#1a2744] text-white hover:bg-[#0f1a30] shadow-sm",
      variant === "accent" && "bg-[#D4A84C] text-[#1a2744] hover:bg-[#c39a3a] shadow-sm",
      variant === "ghost" && "border border-slate-300 text-slate-700 hover:border-slate-500 bg-white",
      className,
    )}
  >
    {children}
  </button>
);

// Subtle card matching the reference aesthetic — no gradients, no heavy shadows
export const Tile = ({ className, children, ...props }) => (
  <div
    {...props}
    className={cn(
      "rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm",
      className,
    )}
  >
    {children}
  </div>
);

export default PageShell;
