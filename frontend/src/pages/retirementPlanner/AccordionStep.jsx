// AccordionStep — collapsible question section used throughout the Retirement
// Planner. Header is always visible; body renders only when `open === true`.
// Lives outside the main file so each step's body can stay readable.
import { ChevronDown, ChevronUp } from "lucide-react";
import { SECTION_CLASS, SECTION_HEAD, SECTION_SUB, EYEBROW } from "./plannerHelpers";

export const AccordionStep = ({ eyebrow, title, sub, open, onToggle, testid, children }) => (
  <section className={SECTION_CLASS} data-testid={testid}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={`${testid}-body`}
      className="w-full flex items-center justify-between gap-4 p-5 hover:bg-slate-50/40 transition-colors rounded-2xl"
      data-testid={`${testid}-toggle`}
    >
      <div className="text-left">
        <p className={EYEBROW}>{eyebrow}</p>
        <h2 className={`${SECTION_HEAD} mt-1`}>{title}</h2>
        {sub && <p className={SECTION_SUB}>{sub}</p>}
      </div>
      {open
        ? <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />}
    </button>
    {open && (
      <div id={`${testid}-body`} className="px-5 pb-5 -mt-1 border-t border-slate-100 pt-4">
        {children}
      </div>
    )}
  </section>
);

export default AccordionStep;
