import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  DollarSign, 
  Percent,
  Building2,
  User,
  Plus,
  Trash2,
  Home,
  Calculator,
  ArrowRight,
  PiggyBank,
  TrendingUp,
  Landmark
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

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

const defaultProperty = {
  property_id: "",
  name: "",
  value: 0,
  rental_income: 0,
  mortgage_amount: 0,
  mortgage_rate: 6.5,
  mortgage_term_years: 30,
  annual_expenses: 0,
  depreciation_building: 0,
  depreciation_fixtures: 0
};

const defaultInvestments = {
  cash_savings: 0,
  term_deposit_amount: 0,
  term_deposit_rate: 4.5,
  shares_value: 0,
  shares_dividend_yield: 4,
  franking_percentage: 100,
  bonds_value: 0,
  bonds_yield: 5,
  etf_value: 0,
  etf_yield: 3,
  smsf_balance: 0,
  properties: []
};

const defaultExpenses = {
  school_fees: 0,
  childcare: 0,
  health_insurance: 0,
  private_expenses: 0,
  work_related: 0,
  other_deductible: 0
};

const ScenarioBuilder = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams();
  const isEditing = !!scenarioId;

  const [name, setName] = useState("My Investment Scenario");
  const [entityType, setEntityType] = useState("personal");
  const [taxableIncome, setTaxableIncome] = useState(120000);
  const [investments, setInvestments] = useState(defaultInvestments);
  const [expenses, setExpenses] = useState(defaultExpenses);
  const [simulationYears, setSimulationYears] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchScenario();
    }
  }, [scenarioId]);

  const fetchScenario = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/scenarios/${scenarioId}`, { 
        withCredentials: true 
      });
      const data = response.data;
      setName(data.name);
      setEntityType(data.entity_type);
      setTaxableIncome(data.taxable_income || 0);
      setInvestments(data.investments || defaultInvestments);
      setExpenses(data.expenses || defaultExpenses);
      setSimulationYears(data.simulation_years || 10);
    } catch (error) {
      console.error("Error fetching scenario:", error);
      toast.error("Failed to load scenario");
      navigate("/scenarios");
    } finally {
      setLoading(false);
    }
  };

  const saveScenario = async () => {
    setSaving(true);
    try {
      const scenarioData = {
        name,
        entity_type: entityType,
        taxable_income: taxableIncome,
        investments,
        expenses,
        simulation_years: simulationYears
      };

      if (isEditing) {
        await axios.put(`${API}/scenarios/${scenarioId}`, scenarioData, { 
          withCredentials: true 
        });
        toast.success("Scenario updated");
      } else {
        await axios.post(`${API}/scenarios`, scenarioData, { 
          withCredentials: true 
        });
        toast.success("Scenario saved");
        navigate("/scenarios");
      }
    } catch (error) {
      console.error("Error saving scenario:", error);
      toast.error("Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  const analyzeScenario = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze/full-scenario`, {
        name,
        entity_type: entityType,
        taxable_income: taxableIncome,
        investments,
        expenses,
        simulation_years: simulationYears
      });
      setAnalysisResult(response.data);
      toast.success("Analysis complete");
    } catch (error) {
      console.error("Error analyzing scenario:", error);
      toast.error("Failed to analyze scenario");
    } finally {
      setLoading(false);
    }
  };

  const addProperty = () => {
    setInvestments({
      ...investments,
      properties: [
        ...investments.properties,
        { 
          ...defaultProperty, 
          property_id: `prop_${Date.now()}`,
          name: `Property ${investments.properties.length + 1}` 
        }
      ]
    });
  };

  const updateProperty = (index, field, value) => {
    const updated = [...investments.properties];
    updated[index] = { ...updated[index], [field]: value };
    setInvestments({ ...investments, properties: updated });
  };

  const removeProperty = (index) => {
    setInvestments({
      ...investments,
      properties: investments.properties.filter((_, i) => i !== index)
    });
  };

  if (loading && isEditing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8" data-testid="scenario-builder-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              {isEditing ? "Edit Scenario" : "New Scenario"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Build and analyze your investment scenario
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={analyzeScenario}
              disabled={loading}
              data-testid="analyze-btn"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Analyze
            </Button>
            <Button 
              onClick={saveScenario}
              className="bg-[#0F392B] hover:bg-[#0F392B]/90"
              disabled={saving}
              data-testid="save-btn"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card data-testid="basic-info-card">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Scenario Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Investment Scenario"
                      data-testid="scenario-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Entity Type</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={entityType === "personal" ? "default" : "outline"}
                        className={entityType === "personal" ? "bg-[#0F392B]" : ""}
                        onClick={() => setEntityType("personal")}
                        data-testid="personal-entity-btn"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Personal
                      </Button>
                      <Button
                        variant={entityType === "company" ? "default" : "outline"}
                        className={entityType === "company" ? "bg-[#D4AF37] text-[#0F392B]" : ""}
                        onClick={() => setEntityType("company")}
                        data-testid="company-entity-btn"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Company
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxable-income">
                    {entityType === "personal" ? "Annual Taxable Income" : "Company Taxable Income"}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="taxable-income"
                      type="number"
                      value={taxableIncome}
                      onChange={(e) => setTaxableIncome(Number(e.target.value))}
                      className="pl-10"
                      data-testid="taxable-income-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investments */}
            <Card data-testid="investments-card">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Investments</CardTitle>
                <CardDescription>Enter your investment holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="cash" className="space-y-6">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                    <TabsTrigger value="shares">Shares</TabsTrigger>
                    <TabsTrigger value="bonds">Bonds/ETF</TabsTrigger>
                    <TabsTrigger value="property">Property</TabsTrigger>
                  </TabsList>

                  <TabsContent value="cash" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cash Savings</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.cash_savings}
                            onChange={(e) => setInvestments({...investments, cash_savings: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="cash-savings-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Term Deposit Amount</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.term_deposit_amount}
                            onChange={(e) => setInvestments({...investments, term_deposit_amount: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="term-deposit-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Term Deposit Rate (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.1"
                            value={investments.term_deposit_rate}
                            onChange={(e) => setInvestments({...investments, term_deposit_rate: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="term-deposit-rate-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>SMSF Balance</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.smsf_balance}
                            onChange={(e) => setInvestments({...investments, smsf_balance: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="smsf-input"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="shares" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shares Value</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.shares_value}
                            onChange={(e) => setInvestments({...investments, shares_value: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="shares-value-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Dividend Yield (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.1"
                            value={investments.shares_dividend_yield}
                            onChange={(e) => setInvestments({...investments, shares_dividend_yield: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="dividend-yield-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Franking Percentage (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.franking_percentage}
                            onChange={(e) => setInvestments({...investments, franking_percentage: Number(e.target.value)})}
                            className="pl-10"
                            max={100}
                            data-testid="franking-percentage-input"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Percentage of dividends that are franked (fully franked = 100%)
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bonds" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bonds Value</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.bonds_value}
                            onChange={(e) => setInvestments({...investments, bonds_value: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="bonds-value-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Bonds Yield (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.1"
                            value={investments.bonds_yield}
                            onChange={(e) => setInvestments({...investments, bonds_yield: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="bonds-yield-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ETF Value</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={investments.etf_value}
                            onChange={(e) => setInvestments({...investments, etf_value: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="etf-value-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ETF Yield (%)</Label>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.1"
                            value={investments.etf_yield}
                            onChange={(e) => setInvestments({...investments, etf_yield: Number(e.target.value)})}
                            className="pl-10"
                            data-testid="etf-yield-input"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="property" className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={addProperty}
                      className="w-full"
                      data-testid="add-property-btn"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>

                    {investments.properties.map((property, index) => (
                      <Card key={property.property_id || index} className="p-4" data-testid={`property-${index}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-[#0F392B]" />
                            <Input
                              value={property.name}
                              onChange={(e) => updateProperty(index, 'name', e.target.value)}
                              className="font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                              placeholder="Property Name"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProperty(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Value</Label>
                            <Input
                              type="number"
                              value={property.value}
                              onChange={(e) => updateProperty(index, 'value', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rental Income (pa)</Label>
                            <Input
                              type="number"
                              value={property.rental_income}
                              onChange={(e) => updateProperty(index, 'rental_income', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Mortgage</Label>
                            <Input
                              type="number"
                              value={property.mortgage_amount}
                              onChange={(e) => updateProperty(index, 'mortgage_amount', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={property.mortgage_rate}
                              onChange={(e) => updateProperty(index, 'mortgage_rate', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Expenses (pa)</Label>
                            <Input
                              type="number"
                              value={property.annual_expenses}
                              onChange={(e) => updateProperty(index, 'annual_expenses', Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Depreciation</Label>
                            <Input
                              type="number"
                              value={property.depreciation_building + property.depreciation_fixtures}
                              onChange={(e) => updateProperty(index, 'depreciation_building', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}

                    {investments.properties.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No properties added yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card data-testid="expenses-card">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Expenses</CardTitle>
                <CardDescription>Enter your annual expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>School Fees</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.school_fees}
                        onChange={(e) => setExpenses({...expenses, school_fees: Number(e.target.value)})}
                        className="pl-10"
                        data-testid="school-fees-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Childcare</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.childcare}
                        onChange={(e) => setExpenses({...expenses, childcare: Number(e.target.value)})}
                        className="pl-10"
                        data-testid="childcare-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Health Insurance</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.health_insurance}
                        onChange={(e) => setExpenses({...expenses, health_insurance: Number(e.target.value)})}
                        className="pl-10"
                        data-testid="health-insurance-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Work-Related (Deductible)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.work_related}
                        onChange={(e) => setExpenses({...expenses, work_related: Number(e.target.value)})}
                        className="pl-10"
                        data-testid="work-related-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Other Deductible</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.other_deductible}
                        onChange={(e) => setExpenses({...expenses, other_deductible: Number(e.target.value)})}
                        className="pl-10"
                        data-testid="other-deductible-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Private (Non-Deductible)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.private_expenses}
                        onChange={(e) => setExpenses({...expenses, private_expenses: Number(e.target.value)})}
                        className="pl-10"
                        data-testid="private-expenses-input"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results Sidebar */}
          <div className="space-y-6">
            <Card data-testid="analysis-summary">
              <CardHeader>
                <CardTitle className="font-['Manrope']">Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[#0F392B] text-white">
                      <p className="text-sm text-white/80">Net Worth</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(analysisResult.summary?.net_worth || 0)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Assets</span>
                        <span className="font-semibold">
                          {formatCurrency(analysisResult.summary?.total_assets || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Debt</span>
                        <span className="font-semibold text-destructive">
                          {formatCurrency(analysisResult.summary?.total_debt || 0)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Investment Income</span>
                        <span className="font-semibold text-[#10B981]">
                          {formatCurrency(analysisResult.summary?.total_investment_income || 0)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="font-semibold">Tax Summary</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Tax</span>
                        <span className="font-semibold">
                          {formatCurrency(analysisResult.tax_analysis?.total_tax || analysisResult.tax_analysis?.company_tax || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Effective Rate</span>
                        <span className="font-semibold">
                          {(analysisResult.tax_analysis?.effective_rate || analysisResult.tax_analysis?.tax_rate || 0).toFixed(1)}%
                        </span>
                      </div>
                      {analysisResult.tax_analysis?.franking_credit_offset > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Franking Credit</span>
                          <span className="font-semibold text-[#D4AF37]">
                            -{formatCurrency(analysisResult.tax_analysis.franking_credit_offset)}
                          </span>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-[#10B981]/10">
                        <div className="flex justify-between">
                          <span className="font-medium">Net Income</span>
                          <span className="font-bold text-[#10B981]">
                            {formatCurrency(analysisResult.tax_analysis?.net_income || analysisResult.tax_analysis?.net_profit || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {analysisResult.debt_equity_analysis && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="font-semibold">Leverage</h4>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Debt to Equity</span>
                            <span className="font-semibold">
                              {analysisResult.debt_equity_analysis.debt_to_equity_ratio.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Equity Ratio</span>
                            <span className="font-semibold">
                              {(analysisResult.debt_equity_analysis.equity_ratio * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Click "Analyze" to see results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <PiggyBank className="h-6 w-6 mx-auto mb-2 text-[#0F392B]" />
                    <p className="text-xs text-muted-foreground">Cash & Deposits</p>
                    <p className="font-semibold">
                      {formatCurrency(investments.cash_savings + investments.term_deposit_amount)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-[#10B981]" />
                    <p className="text-xs text-muted-foreground">Shares & ETFs</p>
                    <p className="font-semibold">
                      {formatCurrency(investments.shares_value + investments.etf_value)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-[#D4AF37]" />
                    <p className="text-xs text-muted-foreground">Properties</p>
                    <p className="font-semibold">{investments.properties.length}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <Landmark className="h-6 w-6 mx-auto mb-2 text-[#3B82F6]" />
                    <p className="text-xs text-muted-foreground">Bonds</p>
                    <p className="font-semibold">{formatCurrency(investments.bonds_value)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScenarioBuilder;
