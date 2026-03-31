import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, User, Heart } from "lucide-react";

const InsuranceSection = ({ factFindData, updateField }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-[#D4A84C]" /> Insurance & Estate Planning</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Life Insurance Cover</Label><Input type="number" value={factFindData.insurance.life_insurance} onChange={(e) => updateField('insurance', 'life_insurance', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>TPD Insurance Cover</Label><Input type="number" value={factFindData.insurance.tpd_insurance} onChange={(e) => updateField('insurance', 'tpd_insurance', Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Income Protection (monthly)</Label><Input type="number" value={factFindData.insurance.income_protection} onChange={(e) => updateField('insurance', 'income_protection', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Trauma Insurance Cover</Label><Input type="number" value={factFindData.insurance.trauma_insurance} onChange={(e) => updateField('insurance', 'trauma_insurance', Number(e.target.value))} /></div>
      </div>
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">Estate Planning *</h4>
        <div className="space-y-4">
          {[
            { field: 'has_will', icon: FileText, title: 'Valid Will', desc: 'Do you have a current, valid will?', testId: 'has-will-checkbox' },
            { field: 'has_power_of_attorney', icon: User, title: 'Power of Attorney', desc: 'Enduring Power of Attorney in place?' },
            { field: 'has_enduring_guardian', icon: Heart, title: 'Enduring Guardian', desc: 'Appointment of Enduring Guardian?' },
          ].map(({ field, icon: Icon, title, desc, testId }) => (
            <div key={field} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div><p className="font-medium">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
              </div>
              <Checkbox checked={factFindData.insurance[field]} onCheckedChange={(checked) => updateField('insurance', field, checked)} data-testid={testId} />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default InsuranceSection;
