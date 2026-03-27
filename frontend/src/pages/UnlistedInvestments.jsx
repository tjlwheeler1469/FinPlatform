import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  FileText, Plus, TrendingUp, TrendingDown, Building2, DollarSign,
  Calendar, Eye, Edit, Trash2, AlertTriangle
} from 'lucide-react';

// Mock data for unlisted investments
const mockUnlistedInvestments = [
  {
    id: 1,
    name: 'Private Equity Fund A',
    type: 'Private Equity',
    entity: 'Trust',
    purchaseDate: '2023-06-15',
    purchasePrice: 100000,
    currentValue: 125000,
    lastValuation: '2025-12-01',
    notes: 'Quarterly distributions, 5-year lock-up period',
  },
  {
    id: 2,
    name: 'Venture Capital Fund',
    type: 'Venture Capital',
    entity: 'Personal',
    purchaseDate: '2024-01-10',
    purchasePrice: 50000,
    currentValue: 62000,
    lastValuation: '2025-11-15',
    notes: 'Early-stage tech focus',
  },
  {
    id: 3,
    name: 'Commercial Property Syndicate',
    type: 'Property Syndicate',
    entity: 'Super',
    purchaseDate: '2022-03-20',
    purchasePrice: 200000,
    currentValue: 235000,
    lastValuation: '2025-10-01',
    notes: 'Office building in Melbourne CBD',
  },
  {
    id: 4,
    name: 'Infrastructure Fund',
    type: 'Infrastructure',
    entity: 'Company',
    purchaseDate: '2023-09-01',
    purchasePrice: 75000,
    currentValue: 82000,
    lastValuation: '2025-12-10',
    notes: 'Renewable energy assets',
  },
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const UnlistedInvestments = () => {
  const [investments, setInvestments] = useState(mockUnlistedInvestments);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'Private Equity',
    entity: 'Personal',
    purchasePrice: '',
    currentValue: '',
    notes: ''
  });

  const totalPurchasePrice = investments.reduce((sum, inv) => sum + inv.purchasePrice, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturn = ((totalCurrentValue - totalPurchasePrice) / totalPurchasePrice) * 100;

  const handleAddInvestment = () => {
    if (!newInvestment.name || !newInvestment.purchasePrice) {
      toast.error('Please fill in required fields');
      return;
    }

    const investment = {
      id: investments.length + 1,
      ...newInvestment,
      purchasePrice: parseFloat(newInvestment.purchasePrice),
      currentValue: parseFloat(newInvestment.currentValue) || parseFloat(newInvestment.purchasePrice),
      purchaseDate: new Date().toISOString().split('T')[0],
      lastValuation: new Date().toISOString().split('T')[0],
    };

    setInvestments([...investments, investment]);
    setShowAddDialog(false);
    setNewInvestment({ name: '', type: 'Private Equity', entity: 'Personal', purchasePrice: '', currentValue: '', notes: '' });
    toast.success('Investment added successfully');
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="unlisted-investments">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Unlisted Investments
            </h1>
            <p className="text-muted-foreground">
              Track your private equity, venture capital, and other unlisted assets
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Unlisted Investment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Investment Name *</Label>
                  <Input
                    placeholder="e.g., Private Equity Fund A"
                    value={newInvestment.name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newInvestment.type} onValueChange={(v) => setNewInvestment({ ...newInvestment, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Private Equity">Private Equity</SelectItem>
                        <SelectItem value="Venture Capital">Venture Capital</SelectItem>
                        <SelectItem value="Property Syndicate">Property Syndicate</SelectItem>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Hedge Fund">Hedge Fund</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Entity</Label>
                    <Select value={newInvestment.entity} onValueChange={(v) => setNewInvestment({ ...newInvestment, entity: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Super">Super</SelectItem>
                        <SelectItem value="Trust">Trust</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase Price *</Label>
                    <Input
                      type="number"
                      placeholder="100000"
                      value={newInvestment.purchasePrice}
                      onChange={(e) => setNewInvestment({ ...newInvestment, purchasePrice: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Value</Label>
                    <Input
                      type="number"
                      placeholder="Same as purchase price"
                      value={newInvestment.currentValue}
                      onChange={(e) => setNewInvestment({ ...newInvestment, currentValue: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    placeholder="Any additional notes..."
                    value={newInvestment.notes}
                    onChange={(e) => setNewInvestment({ ...newInvestment, notes: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleAddInvestment}>
                  Add Investment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Investments</p>
              <p className="text-3xl font-bold">{investments.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Cost Basis</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPurchasePrice)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCurrentValue)}</p>
            </CardContent>
          </Card>
          <Card className={totalReturn >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Unlisted investments require manual valuation updates. Ensure values are updated at least quarterly for accurate reporting.
            </p>
          </CardContent>
        </Card>

        {/* Investments List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Unlisted Investments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment) => {
                const returnPct = ((investment.currentValue - investment.purchasePrice) / investment.purchasePrice) * 100;
                return (
                  <div key={investment.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{investment.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{investment.type}</Badge>
                            <Badge variant="secondary">{investment.entity}</Badge>
                          </div>
                          {investment.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{investment.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(investment.currentValue)}</p>
                        <p className={`text-sm flex items-center justify-end gap-1 ${returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {returnPct >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cost: {formatCurrency(investment.purchasePrice)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Purchased: {investment.purchaseDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Last valued: {investment.lastValuation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UnlistedInvestments;
