import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

const formatCurrency = (value) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(value || 0);

const LiabilitiesSection = ({ factFindData, updateField }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-5 w-5 text-[#D4A84C]" /> Liabilities</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Home Loan</Label><Input type="number" value={factFindData.liabilities.home_loan} onChange={(e) => updateField('liabilities', 'home_loan', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Investment Loan</Label><Input type="number" value={factFindData.liabilities.investment_loan} onChange={(e) => updateField('liabilities', 'investment_loan', Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Car Loan</Label><Input type="number" value={factFindData.liabilities.car_loan} onChange={(e) => updateField('liabilities', 'car_loan', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Personal Loan</Label><Input type="number" value={factFindData.liabilities.personal_loan} onChange={(e) => updateField('liabilities', 'personal_loan', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Credit Cards</Label><Input type="number" value={factFindData.liabilities.credit_cards} onChange={(e) => updateField('liabilities', 'credit_cards', Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>HECS/HELP</Label><Input type="number" value={factFindData.liabilities.hecs_help} onChange={(e) => updateField('liabilities', 'hecs_help', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Other Debts</Label><Input type="number" value={factFindData.liabilities.other_debts} onChange={(e) => updateField('liabilities', 'other_debts', Number(e.target.value))} /></div>
      </div>
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm font-medium text-red-800">Total Liabilities</p>
        <p className="text-2xl font-bold text-red-600">{formatCurrency(Object.values(factFindData.liabilities).filter(v => typeof v === 'number').reduce((a,b) => a+b, 0))}</p>
      </div>
    </CardContent>
  </Card>
);

export default LiabilitiesSection;
