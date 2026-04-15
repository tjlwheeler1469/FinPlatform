import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Loader2, AlertTriangle, Scale, ClipboardCheck } from "lucide-react";

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const ScenarioGeneratorDialog = ({
  open,
  onOpenChange,
  scenarioInputs,
  onInputChange,
  generatedScenarios,
  generatingScenarios,
  onGenerate,
  onModifyInputs,
  onRecordDecision,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#D4A84C]" />
            Generate Financial Scenarios
          </DialogTitle>
          <DialogDescription>
            This tool generates multiple scenarios for comparison. No scenario is recommended over others.
            Adviser must review and select the appropriate strategy.
          </DialogDescription>
        </DialogHeader>

        {!generatedScenarios ? (
          <ScenarioForm
            inputs={scenarioInputs}
            onInputChange={onInputChange}
            generating={generatingScenarios}
            onGenerate={onGenerate}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <ScenarioResults
            data={generatedScenarios}
            onModifyInputs={onModifyInputs}
            onRecordDecision={onRecordDecision}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const ScenarioForm = ({ inputs, onInputChange, generating, onGenerate, onClose }) => (
  <div className="space-y-6 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Client ID</Label>
        <Select value={inputs.client_id} onValueChange={(v) => onInputChange({ client_id: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="client_1">David & Sarah Thompson</SelectItem>
            <SelectItem value="client_2">Chen Family Trust</SelectItem>
            <SelectItem value="client_3">Robert Mitchell</SelectItem>
            <SelectItem value="client_5">Patel SMSF</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Risk Profile</Label>
        <Select value={inputs.risk_profile} onValueChange={(v) => onInputChange({ risk_profile: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="conservative">Conservative</SelectItem>
            <SelectItem value="moderately_conservative">Moderately Conservative</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="moderately_aggressive">Moderately Aggressive</SelectItem>
            <SelectItem value="aggressive">Aggressive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Initial Investment ($)</Label>
        <Input
          type="number"
          value={inputs.initial_investment}
          onChange={(e) => onInputChange({ initial_investment: parseFloat(e.target.value) })}
        />
      </div>
      <div>
        <Label>Monthly Contribution ($)</Label>
        <Input
          type="number"
          value={inputs.monthly_contribution}
          onChange={(e) => onInputChange({ monthly_contribution: parseFloat(e.target.value) })}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Investment Timeframe (years)</Label>
        <Input
          type="number"
          value={inputs.investment_timeframe_years}
          onChange={(e) => onInputChange({ investment_timeframe_years: parseInt(e.target.value) })}
        />
      </div>
      <div>
        <Label>Income Requirement ($)</Label>
        <Input
          type="number"
          value={inputs.income_requirement}
          onChange={(e) => onInputChange({ income_requirement: parseFloat(e.target.value) })}
          placeholder="0 for growth focus"
        />
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button
        className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
        ) : (
          <><Calculator className="h-4 w-4 mr-2" />Generate Scenarios</>
        )}
      </Button>
    </DialogFooter>
  </div>
);

const ScenarioResults = ({ data, onModifyInputs, onRecordDecision }) => (
  <div className="space-y-6 py-4">
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="p-3">
        <p className="text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          {data.disclaimer}
        </p>
      </CardContent>
    </Card>

    <div className="space-y-4">
      <h3 className="font-semibold">Generated Scenarios (No Ranking)</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.scenario_set?.scenarios?.map((scenario) => (
          <Card key={scenario.scenario_id} className="border-2 hover:border-[#D4A84C] transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{scenario.scenario_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Return</span>
                  <span className="font-medium">{scenario.metrics.expected_return_mid}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volatility</span>
                  <span className="font-medium">{scenario.metrics.volatility}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">10yr Projection</span>
                  <span className="font-medium">{formatCurrency(scenario.metrics.projected_value_10yr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Income Yield</span>
                  <span className="font-medium">{scenario.metrics.income_yield}%</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">{scenario.rationale}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {data.scenario_set?.trade_offs && (
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Trade-Off Analysis
        </h3>
        <div className="space-y-2">
          {data.scenario_set.trade_offs.map((tradeoff, idx) => (
            <Card key={`tradeoff-${idx}`} className="bg-muted/50">
              <CardContent className="p-3">
                <p className="font-medium text-sm">{tradeoff.description}</p>
                <p className="text-sm text-muted-foreground mt-1">{tradeoff.impact_description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}

    <DialogFooter className="flex-col sm:flex-row gap-2">
      <Button variant="outline" onClick={onModifyInputs}>Modify Inputs</Button>
      <Button
        className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
        onClick={() => onRecordDecision(data.scenario_set)}
      >
        <ClipboardCheck className="h-4 w-4 mr-2" />
        Record Adviser Decision
      </Button>
    </DialogFooter>
  </div>
);

export default ScenarioGeneratorDialog;
