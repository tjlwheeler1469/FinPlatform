import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";

const DecisionDialog = ({
  open,
  onOpenChange,
  selectedScenarioSet,
  decisionForm,
  onFormChange,
  onSubmit,
}) => {
  const updateConfirmation = (key, checked) => {
    onFormChange({
      confirmation: { ...decisionForm.confirmation, [key]: checked }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#D4A84C]" />
            Adviser Decision & Confirmation
          </DialogTitle>
          <DialogDescription>
            As the adviser, you must select a scenario and confirm your decision.
            This will be permanently recorded in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label>Select Scenario</Label>
            <Select
              value={decisionForm.selected_scenario_id}
              onValueChange={(v) => onFormChange({ selected_scenario_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a scenario..." />
              </SelectTrigger>
              <SelectContent>
                {selectedScenarioSet?.scenarios?.map((s) => (
                  <SelectItem key={s.scenario_id} value={s.scenario_id}>
                    {s.scenario_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Adviser Confirmation (Required)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reviewed"
                  checked={decisionForm.confirmation.reviewed_scenarios}
                  onCheckedChange={(checked) => updateConfirmation("reviewed_scenarios", checked)}
                />
                <label htmlFor="reviewed" className="text-sm">
                  I have reviewed all scenarios and trade-offs
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bestinterest"
                  checked={decisionForm.confirmation.client_best_interest}
                  onCheckedChange={(checked) => updateConfirmation("client_best_interest", checked)}
                />
                <label htmlFor="bestinterest" className="text-sm">
                  This decision is in the client's best interest
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risks"
                  checked={decisionForm.confirmation.understood_risks}
                  onCheckedChange={(checked) => updateConfirmation("understood_risks", checked)}
                />
                <label htmlFor="risks" className="text-sm">
                  I understand and have explained the risks to the client
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="discussed"
                  checked={decisionForm.confirmation.discussed_with_client}
                  onCheckedChange={(checked) => updateConfirmation("discussed_with_client", checked)}
                />
                <label htmlFor="discussed" className="text-sm">
                  I have discussed this strategy with the client
                </label>
              </div>
            </div>
          </div>

          <div>
            <Label>Justification (Required)</Label>
            <Textarea
              placeholder="Explain why this scenario is appropriate for the client..."
              value={decisionForm.justification_text}
              onChange={(e) => onFormChange({ justification_text: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="override"
              checked={decisionForm.override_occurred}
              onCheckedChange={(checked) => onFormChange({ override_occurred: checked })}
            />
            <label htmlFor="override" className="text-sm text-amber-700">
              I am overriding the system's compliance guidance
            </label>
          </div>

          {decisionForm.override_occurred && (
            <div>
              <Label className="text-amber-700">Override Justification (Required)</Label>
              <Textarea
                placeholder="Explain why you are overriding the compliance guidance..."
                value={decisionForm.override_reason}
                onChange={(e) => onFormChange({ override_reason: e.target.value })}
                rows={3}
                className="border-amber-300"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
            onClick={onSubmit}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Confirm Decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DecisionDialog;
