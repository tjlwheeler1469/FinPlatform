import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

const formatCurrency = (value) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 }).format(value || 0);

const AssetsSection = ({ factFindData, updateField }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5 text-[#D4A84C]" /> Assets</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Cash at Bank</Label><Input type="number" value={factFindData.assets.cash_bank} onChange={(e) => updateField('assets', 'cash_bank', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Term Deposits</Label><Input type="number" value={factFindData.assets.term_deposits} onChange={(e) => updateField('assets', 'term_deposits', Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Shares & Managed Funds</Label><Input type="number" value={factFindData.assets.shares_managed_funds} onChange={(e) => updateField('assets', 'shares_managed_funds', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Superannuation *</Label><Input type="number" value={factFindData.assets.superannuation} onChange={(e) => updateField('assets', 'superannuation', Number(e.target.value))} data-testid="super-input" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Home (Residence)</Label><Input type="number" value={factFindData.assets.home_residence} onChange={(e) => updateField('assets', 'home_residence', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Investment Property</Label><Input type="number" value={factFindData.assets.investment_property} onChange={(e) => updateField('assets', 'investment_property', Number(e.target.value))} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Motor Vehicles</Label><Input type="number" value={factFindData.assets.motor_vehicles} onChange={(e) => updateField('assets', 'motor_vehicles', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Household Contents</Label><Input type="number" value={factFindData.assets.household_contents} onChange={(e) => updateField('assets', 'household_contents', Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>Other Assets</Label><Input type="number" value={factFindData.assets.other_assets} onChange={(e) => updateField('assets', 'other_assets', Number(e.target.value))} /></div>
      </div>
      <div className="p-4 bg-green-50 rounded-lg">
        <p className="text-sm font-medium text-green-800">Total Assets</p>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(Object.values(factFindData.assets).filter(v => typeof v === 'number').reduce((a,b) => a+b, 0))}</p>
      </div>
    </CardContent>
  </Card>
);

export default AssetsSection;
