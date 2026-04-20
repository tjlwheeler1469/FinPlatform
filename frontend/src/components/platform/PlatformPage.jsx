// PlatformPage — drop-in replacement for <Layout> that automatically:
//  (a) wraps children in the standard max-width container,
//  (b) renders a premium sticky header (title, subtitle, metrics, CTAs),
//  (c) injects the universal ActionRail on the right (xl+ breakpoint),
//  (d) optionally renders a universal "What Changed" panel above the main content.
// Each page passes only the parts it cares about; defaults keep the experience consistent.
import Layout from "@/components/Layout";
import PageShell from "@/components/platform/PageShell";
import ActionRail from "@/components/platform/ActionRail";
import WhatChangedPanel from "@/components/platform/WhatChangedPanel";
import { getActiveClientId } from "@/data/clientData";

export const PlatformPage = ({
  title,
  subtitle,
  badges,
  metrics = [],
  ctas = [],
  children,
  whatChanged = null,     // { changes: [...], period: "Last review" } | null
  actionRail = null,      // { clientId, recommendations, nextActions, meetingPrep, reviewPackData, hide? }
  hideActionRail = false,
  hideLayout = false,     // if parent already provides Layout (e.g., embedded mode)
  maxWidth,
  testId = "platform-page",
}) => {
  const activeClient = actionRail?.clientId || (() => {
    try { return getActiveClientId(); } catch { return null; }
  })();

  const rail = hideActionRail ? null : (
    <ActionRail
      clientId={actionRail?.clientId ?? activeClient}
      recommendations={actionRail?.recommendations}
      nextActions={actionRail?.nextActions}
      meetingPrep={actionRail?.meetingPrep}
      reviewPackData={actionRail?.reviewPackData}
    />
  );

  const content = (
    <PageShell
      title={title}
      subtitle={subtitle}
      badges={badges}
      metrics={metrics}
      ctas={ctas}
      actionRail={rail}
      maxWidth={maxWidth}
      testId={testId}
    >
      {whatChanged && <WhatChangedPanel {...whatChanged} />}
      {children}
    </PageShell>
  );

  if (hideLayout) return content;
  return <Layout>{content}</Layout>;
};

export default PlatformPage;
