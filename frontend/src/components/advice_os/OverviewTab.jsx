import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, CheckCircle2, RefreshCw, Calculator,
  Activity, ClipboardCheck
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from "recharts";

const COMPLIANCE_COLORS = {
  pass: "#10B981",
  warning: "#F59E0B",
  block: "#EF4444"
};

const OverviewTab = ({
  summary,
  auditLogs,
  onOpenScenarioGenerator,
  onInitializeDemo,
}) => {
  const complianceChartData = [
    { name: "Passed", value: summary.compliance_checks.passed, color: COMPLIANCE_COLORS.pass },
    { name: "Warnings", value: summary.compliance_checks.warnings, color: COMPLIANCE_COLORS.warning },
    { name: "Blocked", value: summary.compliance_checks.blocked, color: COMPLIANCE_COLORS.block }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4" data-testid="overview-tab">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#D4A84C]" />
              Generate Scenarios
            </CardTitle>
            <CardDescription>
              Create multiple scenarios for comparison - NO recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              onClick={onOpenScenarioGenerator}
              data-testid="open-scenario-generator"
            >
              <Calculator className="h-4 w-4 mr-2" />
              New Scenario Analysis
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Compliance Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complianceChartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={complianceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {complianceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>No compliance checks yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#D4A84C]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.slice(0, 10).map((log, idx) => (
                  <div key={log.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-white">
                      {log.action_type === "create" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      {log.action_type === "approve" && <ClipboardCheck className="h-4 w-4 text-blue-600" />}
                      {log.action_type === "update" && <RefreshCw className="h-4 w-4 text-amber-600" />}
                      {!["create", "approve", "update"].includes(log.action_type) && <Activity className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {log.action_type?.toUpperCase()} - {log.entity_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.user_id} &bull; {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Activity className="h-8 w-8 mb-2" />
                <p>No activity recorded yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={onInitializeDemo}
                >
                  Initialize Demo Data
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
