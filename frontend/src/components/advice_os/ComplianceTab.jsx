import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle } from "lucide-react";

const ComplianceTab = ({ summary, breaches }) => {
  return (
    <div className="space-y-4" data-testid="compliance-tab">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-700">{summary.compliance_checks.passed}</p>
            <p className="text-sm text-emerald-600">Passed Checks</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-700">{summary.compliance_checks.warnings}</p>
            <p className="text-sm text-amber-600">Warnings</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">{summary.compliance_checks.blocked}</p>
            <p className="text-sm text-red-600">Blocked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Compliance Breaches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breaches.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {breaches.map((breach, idx) => (
                  <div key={breach.id || idx} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            breach.severity === "critical" ? "destructive" :
                            breach.severity === "high" ? "destructive" :
                            breach.severity === "medium" ? "secondary" : "outline"
                          }>
                            {breach.severity}
                          </Badge>
                          <Badge variant={breach.status === "open" ? "destructive" : "outline"}>
                            {breach.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-2">{breach.breach_type}</p>
                        <p className="text-xs text-muted-foreground">{breach.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
              <p>No compliance breaches recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceTab;
