import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";

const formatCurrency = (value) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(value || 0);

const EmploymentSection = ({ factFindData, updateField }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-[#D4A84C]" /> Employment & Income
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employment Status *</Label>
          <Select value={factFindData.employment.employment_status} onValueChange={(v) => updateField('employment', 'employment_status', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {[["full_time","Full Time"],["part_time","Part Time"],["casual","Casual"],["self_employed","Self Employed"],["unemployed","Unemployed"],["retired","Retired"],["home_duties","Home Duties"]].map(([val,label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Occupation</Label>
          <Input value={factFindData.employment.occupation} onChange={(e) => updateField('employment', 'occupation', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employer Name</Label>
          <Input value={factFindData.employment.employer_name} onChange={(e) => updateField('employment', 'employer_name', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Years with Employer</Label>
          <Input type="number" value={factFindData.employment.years_employed} onChange={(e) => updateField('employment', 'years_employed', Number(e.target.value))} />
        </div>
      </div>
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">Income Details (Annual)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Gross Salary *</Label><Input type="number" value={factFindData.employment.salary_gross} onChange={(e) => updateField('employment', 'salary_gross', Number(e.target.value))} data-testid="salary-input" /></div>
          <div className="space-y-2"><Label>Bonus/Commission</Label><Input type="number" value={factFindData.employment.bonus_commission} onChange={(e) => updateField('employment', 'bonus_commission', Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Other Income</Label><Input type="number" value={factFindData.employment.other_income} onChange={(e) => updateField('employment', 'other_income', Number(e.target.value))} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2"><Label>Rental Income</Label><Input type="number" value={factFindData.employment.rental_income} onChange={(e) => updateField('employment', 'rental_income', Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Dividend Income</Label><Input type="number" value={factFindData.employment.dividend_income} onChange={(e) => updateField('employment', 'dividend_income', Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Centrelink Benefits</Label><Input type="number" value={factFindData.employment.centrelink} onChange={(e) => updateField('employment', 'centrelink', Number(e.target.value))} /></div>
        </div>
      </div>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium">Total Annual Income</p>
        <p className="text-2xl font-bold text-[#1a2744]">
          {formatCurrency((factFindData.employment.salary_gross||0)+(factFindData.employment.bonus_commission||0)+(factFindData.employment.other_income||0)+(factFindData.employment.rental_income||0)+(factFindData.employment.dividend_income||0)+(factFindData.employment.centrelink||0))}
        </p>
      </div>
    </CardContent>
  </Card>
);

export default EmploymentSection;
