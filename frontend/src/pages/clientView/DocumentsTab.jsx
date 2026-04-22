import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2 } from "lucide-react";

const DocumentsTab = () => {
  const docs = [
    { name: "Statement of Advice (SOA)", date: "Mar 2025", status: "signed" },
    { name: "Financial Services Guide (FSG) v5", date: "Jan 2025", status: "current" },
    { name: "Fee Disclosure Statement", date: "Apr 2025", status: "awaiting" },
    { name: "Annual Review Pack 2024", date: "Nov 2024", status: "signed" },
  ];
  return (
    <div className="space-y-2">
      {docs.map((d, i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#1a2744]" />
              <div>
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">{d.date}</p>
              </div>
            </div>
            <Badge variant={d.status === "signed" ? "default" : d.status === "awaiting" ? "outline" : "secondary"} className={d.status === "signed" ? "bg-emerald-500" : ""}>
              {d.status === "signed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {d.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DocumentsTab;
