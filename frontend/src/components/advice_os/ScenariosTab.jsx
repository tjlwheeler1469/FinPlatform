import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, Eye } from "lucide-react";

const ScenariosTab = ({ scenarios, onOpenScenarioGenerator }) => {
  return (
    <div className="space-y-4" data-testid="scenarios-tab">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Scenario History</h2>
        <Button
          className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
          onClick={onOpenScenarioGenerator}
        >
          <Calculator className="h-4 w-4 mr-2" />
          New Scenario
        </Button>
      </div>

      <div className="space-y-3">
        {scenarios.length > 0 ? scenarios.map((scenario, idx) => (
          <Card key={scenario.id || idx} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Scenario Set: {scenario.id?.slice(-8)}</h3>
                    <Badge variant={
                      scenario.compliance_result === "pass" ? "default" :
                      scenario.compliance_result === "warning" ? "secondary" : "destructive"
                    } className={
                      scenario.compliance_result === "pass" ? "bg-emerald-100 text-emerald-800" :
                      scenario.compliance_result === "warning" ? "bg-amber-100 text-amber-800" : ""
                    }>
                      {scenario.compliance_result || "pending"}
                    </Badge>
                    <Badge variant="outline">
                      {scenario.decision || "pending review"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Client: {scenario.client_id} &bull; {scenario.scenarios?.length || 0} scenarios generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(scenario.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No scenarios generated yet</p>
              <Button
                className="mt-4 bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                onClick={onOpenScenarioGenerator}
              >
                Generate First Scenario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScenariosTab;
