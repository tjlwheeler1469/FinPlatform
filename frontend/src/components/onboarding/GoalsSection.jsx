import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";

const GoalsSection = ({ factFindData, updateField, addGoal }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2"><Target className="h-5 w-5 text-[#D4A84C]" /> Goals & Objectives</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Target Retirement Age *</Label><Input type="number" value={factFindData.goals.retirement_age} onChange={(e) => updateField('goals', 'retirement_age', Number(e.target.value))} data-testid="retirement-age-input" /></div>
        <div className="space-y-2"><Label>Desired Retirement Income (annual)</Label><Input type="number" value={factFindData.goals.retirement_income} onChange={(e) => updateField('goals', 'retirement_income', Number(e.target.value))} /></div>
      </div>
      {['short', 'long'].map(term => {
        const key = `${term}_term_goals`;
        const goals = factFindData.goals[key] || [];
        return (
          <div key={term} className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{term === 'short' ? 'Short-Term Goals (1-3 years)' : 'Long-Term Goals (3+ years)'}</h4>
              <Button variant="outline" size="sm" onClick={() => addGoal(term)}><Target className="h-4 w-4 mr-2" /> Add Goal</Button>
            </div>
            {goals.map((goal, index) => (
              <div key={`goal-${term}-${index}`} className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg">
                <Textarea placeholder="Goal description" value={goal.description} onChange={(e) => { const g = [...goals]; g[index].description = e.target.value; updateField('goals', key, g); }} />
                <Input type="number" placeholder="Target amount" value={goal.target_amount} onChange={(e) => { const g = [...goals]; g[index].target_amount = Number(e.target.value); updateField('goals', key, g); }} />
                <Input type="date" value={goal.target_date} onChange={(e) => { const g = [...goals]; g[index].target_date = e.target.value; updateField('goals', key, g); }} />
              </div>
            ))}
          </div>
        );
      })}
    </CardContent>
  </Card>
);

export default GoalsSection;
