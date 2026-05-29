// AnnualisedTable — collapsible year-by-year accumulation → drawdown table.
// Expanded by default per user request. Footer summarises total contributions
// (accumulation phase) and total drawdown (post-retirement). Uses semantic
// <th scope="row"> labels in the footer so screen readers announce subtotals
// clearly.
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmtCompact, EYEBROW } from "./plannerHelpers";

export const AnnualisedTable = ({ table, optionLabel, open, onToggle }) => {
  const totalContribs = table
    .filter((r) => r.phase === "Accumulation")
    .reduce((s, r) => s + r.contribs, 0);
  const totalDrawdown = table
    .filter((r) => r.phase === "Drawdown")
    .reduce((s, r) => s + r.withdraw, 0);

  return (
    <Card className="border-slate-200" data-testid="annualised-table-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="annualised-table-body"
        className="w-full flex items-center justify-between gap-4 p-5 hover:bg-slate-50/40 transition-colors rounded-2xl text-left"
        data-testid="toggle-annualised"
      >
        <div>
          <p className={EYEBROW}>Annual drawdown · breakdown</p>
          <h3 className="font-serif text-xl text-[#1a2744] leading-tight mt-1">
            Year-by-year portfolio &amp; drawdown table
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {table.length} years · accumulation → drawdown · option {optionLabel}
            {open ? "" : " · click to expand"}
          </p>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />}
      </button>

      {open && (
        <div id="annualised-table-body" className="px-5 pb-5 -mt-1 border-t border-slate-100 pt-4">
          <div className="overflow-x-auto -mx-2">
            <table
              className="w-full text-sm"
              data-testid="annualised-table"
              aria-label="Year-by-year portfolio and drawdown table"
            >
              <caption className="sr-only">
                Deterministic accumulation and drawdown projection by age. Last row contains totals.
              </caption>
              <thead>
                <tr className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold border-b border-slate-200">
                  <th scope="col" className="text-left px-2 py-2.5">Age</th>
                  <th scope="col" className="text-left px-2 py-2.5">Phase</th>
                  <th scope="col" className="text-right px-2 py-2.5">Opening</th>
                  <th scope="col" className="text-right px-2 py-2.5">Contribs</th>
                  <th scope="col" className="text-right px-2 py-2.5">Net return</th>
                  <th scope="col" className="text-right px-2 py-2.5">Fees</th>
                  <th scope="col" className="text-right px-2 py-2.5">Drawdown</th>
                  <th scope="col" className="text-right px-2 py-2.5">Closing</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${row.phase === "Drawdown" ? "bg-[#D4A84C]/[0.04]" : ""}`}
                    data-testid={`annualised-row-${i}`}
                  >
                    <th scope="row" className="px-2 py-2 font-mono text-[#1a2744] text-left font-normal">{row.age}</th>
                    <td className="px-2 py-2 text-slate-600">
                      <span className={`text-[10px] tracking-wide uppercase font-semibold ${row.phase === "Accumulation" ? "text-[#1a2744]" : "text-[#8a6c1a]"}`}>
                        {row.phase}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-[#1a2744] text-right">{fmtCompact(row.opening)}</td>
                    <td className="px-2 py-2 font-mono text-[#1a2744] text-right">
                      {row.contribs ? `+${fmtCompact(row.contribs)}` : "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-[#1a2744] text-right">
                      {row.netReturn >= 0 ? "+" : ""}{fmtCompact(row.netReturn)}
                    </td>
                    <td className="px-2 py-2 font-mono text-slate-500 text-right">−{fmtCompact(row.fees)}</td>
                    <td className="px-2 py-2 font-mono text-slate-500 text-right">
                      {row.withdraw ? `−${fmtCompact(row.withdraw)}` : "—"}
                    </td>
                    <td className="px-2 py-2 font-mono text-[#1a2744] text-right font-semibold">{fmtCompact(row.closing)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Total contributions row — label spans Age+Phase+Opening columns; value
                    sits in the Contribs column so the screen reader pairs them naturally. */}
                <tr className="border-t-2 border-slate-200 text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">
                  <th scope="row" colSpan="3" className="px-2 pt-3 text-left">
                    Total contributions (accumulation)
                  </th>
                  <td className="px-2 pt-3 text-right font-mono">+{fmtCompact(totalContribs)}</td>
                  <td className="px-2 pt-3" aria-hidden="true" colSpan="2" />
                  <td className="px-2 pt-3" aria-hidden="true" />
                  <td className="px-2 pt-3" aria-hidden="true" />
                </tr>
                {/* Total drawdown row — label spans the first 6 columns; value sits in
                    the Drawdown column so the screen reader pairs them naturally. */}
                <tr className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">
                  <th scope="row" colSpan="6" className="px-2 pt-1 text-left">
                    Total drawdown
                  </th>
                  <td className="px-2 pt-1 text-right font-mono">−{fmtCompact(totalDrawdown)}</td>
                  <td className="px-2 pt-1" aria-hidden="true" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AnnualisedTable;
