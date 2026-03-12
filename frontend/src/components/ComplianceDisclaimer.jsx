import { useState, useEffect } from "react";
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

const STORAGE_KEY = "wheeler_compliance_acknowledged";
const STORAGE_KEY_V2 = "halcyon_compliance_v2";  // New versioned key for better tracking

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
      content: `Halcyon Wealth Platform is not licensed to provide personal financial product advice under the Corporations Act 2001 (Cth). This tool should not be used as a substitute for professional financial advice from a licensed financial adviser (AFSL holder).`,
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

// Check if user has already acknowledged compliance
const hasUserAcknowledged = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 
           localStorage.getItem(STORAGE_KEY_V2) || 
           sessionStorage.getItem('compliance_session');
  } catch {
    return false;
  }
};

// Set acknowledgement in both localStorage and sessionStorage for reliability
const setAcknowledgement = () => {
  try {
    const timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, timestamp);
    localStorage.setItem(STORAGE_KEY_V2, timestamp);
    sessionStorage.setItem('compliance_session', timestamp);
  } catch (e) {
    console.warn('Could not persist compliance acknowledgement:', e);
  }
};

// Modal component shown on first visit
export const ComplianceModal = ({ onAccept }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [open, setOpen] = useState(() => !hasUserAcknowledged());

  // Don't render anything if already acknowledged
  if (!open) return null;

  const handleAccept = () => {
    if (acknowledged) {
      setAcknowledgement();
      setOpen(false);
      onAccept?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
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

        <DialogFooter className="flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-2">
            <Checkbox 
              id="acknowledge" 
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
            />
            <label htmlFor="acknowledge" className="text-sm leading-tight">
              I understand this application provides general information only and is not a substitute for professional financial, tax, or legal advice.
            </label>
          </div>
          <Button 
            onClick={handleAccept} 
            disabled={!acknowledged}
            className="bg-[#1a2744] hover:bg-[#1a2744]/90"
          >
            I Understand & Accept
          </Button>
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
        <a 
          href="https://moneysmart.gov.au" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#1a2744] hover:underline inline-flex items-center gap-1"
        >
          ASIC MoneySmart
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-2 text-[10px]">
        © {new Date().getFullYear()} Wheeler Family Portfolio. Tax rates based on ATO 2024-25 FY. 
        Calculations for illustrative purposes only. ABN: XX XXX XXX XXX
      </p>
    </div>
  );
};

// Inline disclaimer for calculators
export const CalculatorDisclaimer = ({ calculatorName = "calculator" }) => {
  return (
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
      <div className="flex items-start gap-2">
        <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800">
            <strong>Disclaimer:</strong> This {calculatorName} provides estimates based on general assumptions 
            and publicly available ATO rates. Results are for illustrative purposes only and should not be 
            relied upon for making financial decisions. Consult a qualified professional for personal advice.
          </p>
        </div>
      </div>
    </div>
  );
};

// ATO reference tooltip/badge
export const ATOReference = ({ section, description }) => {
  return (
    <a
      href={`https://www.ato.gov.au/search?q=${encodeURIComponent(section)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-[#1a2744] hover:underline"
      title={description}
    >
      <FileText className="h-3 w-3" />
      ATO: {section}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
};

export default ComplianceModal;
