import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp } from "lucide-react";

const RiskSection = ({ factFindData, updateRiskAnswer, riskQuestions, riskScore, riskProfile }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#D4A84C]" /> Risk Profile Assessment</CardTitle>
      <CardDescription>Answer these questions to determine your investment risk profile</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {riskQuestions.map((question, qIndex) => (
        <div key={question.id} className="p-4 border rounded-lg">
          <p className="font-medium mb-4">{qIndex + 1}. {question.question}</p>
          <RadioGroup value={String(factFindData.risk.answers[question.id] || '')} onValueChange={(v) => updateRiskAnswer(question.id, Number(v))}>
            {question.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-2 rounded hover:bg-muted">
                <RadioGroupItem value={String(option.value)} id={`${question.id}_${option.value}`} />
                <Label htmlFor={`${question.id}_${option.value}`} className="cursor-pointer flex-1">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      {Object.keys(factFindData.risk.answers).length === riskQuestions.length && (
        <Card className="bg-[#1a2744] text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-white/80 mb-2">Your Risk Profile</p>
              <p className="text-3xl font-bold mb-2">{riskProfile.name}</p>
              <p className="text-sm text-white/80">Score: {riskScore} / 40</p>
            </div>
          </CardContent>
        </Card>
      )}
    </CardContent>
  </Card>
);

export default RiskSection;
