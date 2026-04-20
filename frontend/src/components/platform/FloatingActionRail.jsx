// FloatingActionRail — zero-layout-risk variant of ActionRail for pages that
// already have their own container structure. Fixes itself to the right edge
// on xl+ breakpoints, collapsible to a pill on smaller screens.
// Drop onto any page: <FloatingActionRail /> (reads active client automatically)
import { useState } from "react";
import { Sparkles, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActionRail from "@/components/platform/ActionRail";
import WhatChangedPanel from "@/components/platform/WhatChangedPanel";
import { getActiveClientId } from "@/data/clientData";

export const FloatingActionRail = ({
  clientId: explicitClientId,
  recommendations,
  nextActions,
  meetingPrep,
  reviewPackData,
  whatChanged,       // { changes, period }
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const clientId = explicitClientId || (() => {
    try { return getActiveClientId(); } catch { return null; }
  })();

  return (
    <>
      {/* Fixed rail on xl+ screens */}
      <aside
        className={`hidden xl:flex fixed top-20 right-4 w-[320px] max-h-[calc(100vh-6rem)] overflow-y-auto flex-col gap-3 z-30 transition-transform ${open ? "" : "translate-x-[340px]"}`}
        data-testid="floating-action-rail"
      >
        <div className="relative">
          <Button
            size="icon"
            variant="outline"
            className="absolute -left-8 top-2 h-7 w-7 rounded-full bg-white shadow-md"
            onClick={() => setOpen(false)}
            aria-label="Collapse action rail"
            data-testid="floating-rail-collapse"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <ActionRail
            clientId={clientId}
            recommendations={recommendations}
            nextActions={nextActions}
            meetingPrep={meetingPrep}
            reviewPackData={reviewPackData}
          />
          {whatChanged && <WhatChangedPanel {...whatChanged} className="mt-3" />}
        </div>
      </aside>

      {/* Collapsed tab — re-opens rail */}
      {!open && (
        <button
          className="hidden xl:flex fixed top-24 right-0 bg-[#1a2744] text-white px-2 py-3 rounded-l-md shadow-md z-30 items-center gap-1 hover:bg-[#2a3a5c]"
          onClick={() => setOpen(true)}
          data-testid="floating-rail-expand"
        >
          <ChevronLeft className="h-4 w-4" />
          <Sparkles className="h-3.5 w-3.5 text-[#D4A84C]" />
        </button>
      )}

      {/* Mobile/tablet: compact sticky footer CTA */}
      <div className="xl:hidden fixed bottom-4 right-4 z-30">
        <details>
          <summary className="list-none cursor-pointer">
            <div className="bg-[#1a2744] text-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-xs font-semibold" data-testid="floating-rail-mobile-toggle">
              <Sparkles className="h-3.5 w-3.5 text-[#D4A84C]" />
              Actions
            </div>
          </summary>
          <div className="mt-2 w-[320px] max-w-[90vw]">
            <ActionRail
              clientId={clientId}
              recommendations={recommendations}
              nextActions={nextActions}
              meetingPrep={meetingPrep}
              reviewPackData={reviewPackData}
            />
          </div>
        </details>
      </div>
    </>
  );
};

export default FloatingActionRail;
