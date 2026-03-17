import { useState, useEffect, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Shield, 
  Scale, 
  FileText, 
  ExternalLink,
  Info
} from "lucide-react";

/**
 * Australian Financial Services Compliance Component
 * 
 * This component provides regulatory compliance disclaimers required under:
 * - Australian Securities and Investments Commission (ASIC)
 * - Corporations Act 2001
 * - Australian Taxation Office (ATO) guidelines
 * - Financial Services Reform Act
 */

const STORAGE_KEY = "wealth_command_compliance_v5";  // Versioned key for v5.0
const SESSION_KEY = "wealth_command_compliance_session";

// Check if user has permanently dismissed (with strict check)
const hasPermanentlyDismissed = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "permanent" || stored === "true";
  } catch {
    return false;
  }
};

// Check if user has acknowledged this session
const hasAcknowledged = () => {
  try {
    // Check permanent dismissal first - this is the most important
    if (hasPermanentlyDismissed()) {
      return true;
    }
    
    // Check session dismissal
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

// Set acknowledgement
const setAcknowledgement = (permanent = false) => {
  try {
    if (permanent) {
      localStorage.setItem(STORAGE_KEY, "permanent");
      console.log("[Compliance] Modal permanently dismissed");
    }
    sessionStorage.setItem(SESSION_KEY, new Date().toISOString());
    console.log("[Compliance] Session acknowledgement set");
  } catch (e) {
    console.warn('Could not persist compliance acknowledgement:', e);
  }
};

// Compliance disclaimer content
const COMPLIANCE_CONTENT = {
  title: "Important Information",
  subtitle: "Please read before using this application",
  sections: [
    {
      icon: Shield,
      title: "General Information Only",
      content: `This application provides general financial information only and does not constitute personal financial advice. The calculations, projections, and recommendations provided are for informational and educational purposes only.`,
      reference: "ASIC Regulatory Guide 234"
    },
    {
      icon: Scale,
      title: "No Financial Services License",
      content: `Wealth Command Platform is not licensed to provide personal financial product advice under the Corporations Act 2001 (Cth). This tool should not be used as a substitute for professional financial advice from a licensed financial adviser (AFSL holder).`,
      reference: "Corporations Act 2001 s911A"
    },
    {
      icon: FileText,
      title: "Tax Information Disclaimer",
      content: `Tax calculations are based on publicly available ATO tax rates and rules for the 2024-25 financial year. Tax laws are complex and subject to change. Individual circumstances vary significantly. Always consult a registered tax agent or accountant for personal tax advice.`,
      reference: "ATO Tax Practitioner Guidelines"
    },
    {
      icon: AlertTriangle,
      title: "No Liability",
      content: `To the maximum extent permitted by law, we disclaim all liability for any loss or damage arising from the use of this application, including but not limited to any errors in calculations, outdated information, or decisions made based on the information provided.`,
      reference: "Australian Consumer Law"
    }
  ],
  recommendations: [
    "Consult a licensed financial adviser (AFSL holder) before making investment decisions",
    "Consult a registered tax agent for personal tax advice",
    "Consult a qualified accountant for business structuring advice",
    "Review the Product Disclosure Statement (PDS) before investing in any financial product",
    "Consider your personal circumstances, objectives, and risk tolerance"
  ],
  regulatoryLinks: [
    { name: "ASIC MoneySmart", url: "https://moneysmart.gov.au" },
    { name: "ATO Tax Rates", url: "https://www.ato.gov.au/Rates" },
    { name: "Find a Financial Adviser", url: "https://moneysmart.gov.au/financial-advice/find-a-financial-adviser" }
  ]
};

// Modal component shown on first visit
export const ComplianceModal = ({ onAccept }) => {
  const [acknowledged, setAcknowledgedState] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [open, setOpen] = useState(false);
  const hasChecked = useRef(false);

  // Check localStorage on mount - only once, and respect permanent dismissal
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    
    // Double-check: if already acknowledged, never show
    if (hasAcknowledged()) {
      console.log("[Compliance] Already acknowledged, not showing modal");
      setOpen(false);
      return;
    }
    
    console.log("[Compliance] No previous acknowledgement, showing modal");
    setOpen(true);
  }, []);

  // Don't render anything if not open
  if (!open) return null;

  const handleAccept = () => {
    if (acknowledged) {
      setAcknowledgement(dontShowAgain);
      setOpen(false);
      onAccept?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        data-testid="compliance-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-[#1a2744]" />
            {COMPLIANCE_CONTENT.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {COMPLIANCE_CONTENT.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {COMPLIANCE_CONTENT.sections.map((section, index) => (
            <div key={index} className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-3">
                <section.icon className="h-5 w-5 text-[#1a2744] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">{section.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{section.content}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    Ref: {section.reference}
                  </Badge>
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <h4 className="font-semibold text-sm text-amber-800 mb-2">Before making financial decisions:</h4>
            <ul className="space-y-1">
              {COMPLIANCE_CONTENT.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {COMPLIANCE_CONTENT.regulatoryLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#1a2744] hover:underline"
              >
                {link.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-4">
          <div className="flex items-start gap-2 w-full">
            <Checkbox 
              id="acknowledge" 
              checked={acknowledged}
              onCheckedChange={setAcknowledgedState}
              data-testid="disclaimer-checkbox"
            />
            <label htmlFor="acknowledge" className="text-sm leading-tight cursor-pointer">
              I understand this application provides general information only and is not a substitute for professional financial, tax, or legal advice.
            </label>
          </div>
          
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="dontShowAgain" 
                checked={dontShowAgain}
                onCheckedChange={setDontShowAgain}
                data-testid="dont-show-again-checkbox"
              />
              <label htmlFor="dontShowAgain" className="text-sm text-muted-foreground cursor-pointer">
                Don't show this again
              </label>
            </div>
            
            <Button 
              onClick={handleAccept} 
              disabled={!acknowledged}
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
              data-testid="accept-disclaimer-btn"
            >
              I Understand & Accept
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Footer disclaimer component
export const ComplianceFooter = ({ className = "" }) => {
  return (
    <div className={`mt-8 pt-4 border-t text-xs text-muted-foreground ${className}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          <span>General Information Only</span>
        </div>
        <span className="hidden sm:inline">|</span>
        <span>Not financial advice</span>
        <span className="hidden sm:inline">|</span>
        <span>Consult a licensed adviser (AFSL)</span>
        <span className="hidden sm:inline">|</span>
        <span>Tax rates: 2024-25 FY</span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed">
        The information provided is general in nature and does not take into account your personal objectives, 
        financial situation or needs. Before acting on any information, you should consider its appropriateness 
        having regard to your own objectives, financial situation and needs, and seek professional advice from 
        a licensed financial adviser. Past performance is not a reliable indicator of future performance.
      </p>
    </div>
  );
};

// Inline disclaimer for specific content
export const InlineDisclaimer = ({ type = "general", className = "" }) => {
  const disclaimers = {
    general: "This is general information only and not personal financial advice.",
    tax: "Tax calculations are estimates only. Consult a registered tax agent.",
    investment: "Past performance is not indicative of future results.",
    projection: "Projections are estimates based on assumptions that may not eventuate."
  };

  return (
    <div className={`flex items-start gap-2 p-2 bg-amber-50 rounded-md border border-amber-200 ${className}`}>
      <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-amber-700">{disclaimers[type]}</p>
    </div>
  );
};

// Calculator-specific disclaimer component
export const CalculatorDisclaimer = ({ calculatorName = "calculator", className = "" }) => {
  return (
    <div className={`flex items-start gap-2 p-3 bg-amber-50 rounded-md border border-amber-200 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-amber-700 font-medium">
          This {calculatorName} provides estimates only
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Results are for illustrative purposes and should not be relied upon for financial decisions. 
          Consult a licensed financial adviser for personalized advice.
        </p>
      </div>
    </div>
  );
};

export default ComplianceModal;
