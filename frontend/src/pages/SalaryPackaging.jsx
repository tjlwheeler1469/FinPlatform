import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  DollarSign,
  Calculator,
  Plus,
  Trash2,
  Car,
  Laptop,
  Heart,
  Coffee,
  ParkingCircle,
  Lightbulb,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const PACKAGING_ITEMS = [
  { type: "novated_lease", label: "Novated Car Lease", icon: Car, fbt_exempt: false },
  { type: "laptop", label: "Laptop/Portable Device", icon: Laptop, fbt_exempt: true },
  { type: "super_contribution", label: "Extra Super Contribution", icon: DollarSign, fbt_exempt: true },
  { type: "health_insurance", label: "Private Health Insurance", icon: Heart, fbt_exempt: false },
  { type: "meal_entertainment", label: "Meal Entertainment", icon: Coffee, fbt_exempt: false },
  { type: "car_parking", label: "Car Parking", icon: ParkingCircle, fbt_exempt: false },
  { type: "work_related_items", label: "Work-Related Items", icon: Briefcase, fbt_exempt: true },
];

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const SalaryPackaging = () => {
  const [grossSalary, setGrossSalary] = useState(150000);
  const [isNFP, setIsNFP] = useState(false);
  const [nfpCap, setNfpCap] = useState(17000);
  const [marginalRate, setMarginalRate] = useState(37);
  const [items, setItems] = useState([
    { type: "novated_lease", amount: 15000 },
    { type: "laptop", amount: 2500 }
  ]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { type: "super_contribution", amount: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculatePackaging = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/salary-packaging`, {
        gross_salary: grossSalary,
        packaging_items: items,
        is_nfp_employee: isNFP,
        nfp_cap: isNFP ? nfpCap : 0,
        marginal_tax_rate: marginalRate / 100
      });
      setResult(response.data);
      toast.success("Packaging calculated");
    } catch (error) {
      console.error("Error calculating packaging:", error);
      toast.error("Failed to calculate packaging");
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.items_analysis?.map(item => ({
    name: PACKAGING_ITEMS.find(p => p.type === item.type)?.label || item.type,
    amount: item.amount,
    fbt: item.fbt_payable
  })) || [];

  const pieData = result ? [
    { name: "FBT Exempt", value: result.total_fbt_exempt, color: "#10B981" },
    { name: "FBT Liable", value: result.total_fbt_liable, color: "#D4A84C" }
  ].filter(d => d.value > 0) : [];

  return (
    <Layout>
      <div className="space-y-8" data-testid="salary-packaging-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold  text-foreground">
            Salary Packaging Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate FBT implications and tax benefits of salary packaging
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-1" data-testid="packaging-inputs">
            <CardHeader>
              <CardTitle className="">Your Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gross Salary */}
              <div className="space-y-2">
                <Label>Gross Salary</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    className="pl-10"
                    data-testid="gross-salary-input"
                  />
                </div>
              </div>

              {/* Marginal Rate */}
              <div className="space-y-2">
                <Label>Marginal Tax Rate (%)</Label>
                <Select value={marginalRate.toString()} onValueChange={(v) => setMarginalRate(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16% ($18,201 - $45,000)</SelectItem>
                    <SelectItem value="30">30% ($45,001 - $135,000)</SelectItem>
                    <SelectItem value="37">37% ($135,001 - $190,000)</SelectItem>
                    <SelectItem value="45">45% ($190,001+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* NFP Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <Label>Not-for-Profit Employee</Label>
                  <p className="text-sm text-muted-foreground">FBT exemption cap applies</p>
                </div>
                <Switch
                  checked={isNFP}
                  onCheckedChange={setIsNFP}
                  data-testid="nfp-switch"
                />
              </div>

              {isNFP && (
                <div className="space-y-2">
                  <Label>NFP FBT Cap</Label>
                  <Select value={nfpCap.toString()} onValueChange={(v) => setNfpCap(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="17000">$17,000 (Hospitals/Ambulance)</SelectItem>
                      <SelectItem value="31177">$31,177 (Charities/PBI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Packaging Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Packaging Items</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {items.map((item, index) => {
                  const itemConfig = PACKAGING_ITEMS.find(p => p.type === item.type);
                  const Icon = itemConfig?.icon || Briefcase;
                  
                  return (
                    <div key={`item-${index}`} className="p-3 rounded-lg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <Select 
                          value={item.type} 
                          onValueChange={(v) => updateItem(index, 'type', v)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PACKAGING_ITEMS.map(p => (
                              <SelectItem key={p.type} value={p.type}>
                                <div className="flex items-center gap-2">
                                  <p.icon className="h-4 w-4" />
                                  {p.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', Number(e.target.value))}
                          placeholder="Amount"
                        />
                        {itemConfig?.fbt_exempt && (
                          <Badge className="bg-[#10B981]/10 text-[#10B981]">FBT Exempt</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button 
                onClick={calculatePackaging}
                className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
                disabled={loading}
                data-testid="calculate-btn"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Benefits
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-[#1a2744] text-white">
                    <CardContent className="p-4">
                      <p className="text-sm text-white/80">Net Benefit</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(result.net_benefit)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Tax Saved</p>
                      <p className="text-xl font-bold text-[#10B981]">
                        {formatCurrency(result.income_tax_saved)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">FBT Payable</p>
                      <p className="text-xl font-bold text-[#D4A84C]">
                        {formatCurrency(result.fbt_payable)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Packaged</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(result.total_packaged_amount)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card data-testid="breakdown-chart">
                    <CardHeader>
                      <CardTitle className="">Item Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <BarChart data={chartData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Bar dataKey="amount" fill="#1a2744" name="Amount" />
                            <Bar dataKey="fbt" fill="#D4A84C" name="FBT" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card data-testid="fbt-split">
                    <CardHeader>
                      <CardTitle className="">FBT Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`item-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        {pieData.map(item => (
                          <div key={item.name} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.name}: {formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Item Details */}
                <Card data-testid="item-details">
                  <CardHeader>
                    <CardTitle className="">Item Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.items_analysis.map((item, index) => {
                        const itemConfig = PACKAGING_ITEMS.find(p => p.type === item.type);
                        const Icon = itemConfig?.icon || Briefcase;
                        
                        return (
                          <div 
                            key={`item-${index}`}
                            className="p-4 rounded-lg border border-border flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                item.is_fbt_exempt ? 'bg-[#10B981]/10' : 'bg-[#D4A84C]/10'
                              }`}>
                                <Icon className={`h-5 w-5 ${
                                  item.is_fbt_exempt ? 'text-[#10B981]' : 'text-[#D4A84C]'
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(item.amount)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {item.is_fbt_exempt ? (
                                <Badge className="bg-[#10B981]/10 text-[#10B981]">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  FBT Exempt
                                </Badge>
                              ) : (
                                <div>
                                  <Badge variant="outline" className="text-[#D4A84C] border-[#D4A84C]">
                                    FBT: {formatCurrency(item.fbt_payable)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card data-testid="recommendations">
                  <CardHeader>
                    <CardTitle className=" flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, index) => (
                        <div key={`item-${index}`} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-[400px]">
                <CardContent className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Add packaging items and calculate to see results
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg ">FBT Exempt Items</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  Portable electronic devices (one per year)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  Additional superannuation contributions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#10B981]" />
                  Work-related items used primarily for work
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg ">NFP FBT Caps</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="space-y-2">
                <li><strong>$17,000</strong> - Public hospitals, ambulance services</li>
                <li><strong>$31,177</strong> - Public benevolent institutions, charities</li>
                <li>Benefits up to cap are FBT exempt</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg ">FBT Rate 2024-25</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#1a2744] mb-2">47%</div>
              <p className="text-sm text-muted-foreground">
                FBT is paid by the employer but often passed to employee via reduced salary.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SalaryPackaging;
