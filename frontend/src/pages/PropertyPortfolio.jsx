import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Plus, 
  Trash2, 
  DollarSign, 
  Percent,
  TrendingUp,
  TrendingDown,
  Home,
  Calculator
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
  Legend
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

const defaultProperty = {
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

const PropertyPortfolio = () => {
  const [properties, setProperties] = useState([{ ...defaultProperty, name: "Property 1" }]);
  const [marginalTaxRate, setMarginalTaxRate] = useState(30);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);

  const addProperty = () => {
    setProperties([
      ...properties,
      { ...defaultProperty, name: `Property ${properties.length + 1}` }
    ]);
  };

  const removeProperty = (index) => {
    if (properties.length > 1) {
      setProperties(properties.filter((_, i) => i !== index));
    }
  };

  const updateProperty = (index, field, value) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const analyzePortfolio = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        properties.map(async (prop) => {
          const response = await axios.post(`${API}/analyze/negative-gearing`, prop, {
            params: { marginal_tax_rate: marginalTaxRate / 100 }
          });
          return response.data;
        })
      );
      setAnalyses(results);
      toast.success("Portfolio analyzed successfully");
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      toast.error("Failed to analyze portfolio");
    } finally {
      setLoading(false);
    }
  };

  const totalSummary = analyses.reduce((acc, analysis) => ({
    totalValue: acc.totalValue + (analysis.property_value || 0),
    totalRentalIncome: acc.totalRentalIncome + (analysis.rental_income || 0),
    totalDeductions: acc.totalDeductions + (analysis.total_deductions || 0),
    totalTaxBenefit: acc.totalTaxBenefit + (analysis.annual_tax_benefit || 0),
    totalCashFlow: acc.totalCashFlow + (analysis.cash_flow_after_tax || 0)
  }), {
    totalValue: 0,
    totalRentalIncome: 0,
    totalDeductions: 0,
    totalTaxBenefit: 0,
    totalCashFlow: 0
  });

  const chartData = analyses.map(a => ({
    name: a.property_name,
    rental: a.rental_income,
    deductions: a.total_deductions,
    cashFlow: a.cash_flow_after_tax
  }));

  return (
    <Layout>
      <div className="space-y-8" data-testid="property-portfolio-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Property Portfolio
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyze multiple properties with negative gearing calculations
            </p>
          </div>
          <Button 
            onClick={addProperty}
            variant="outline"
            data-testid="add-property-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Tax Rate Setting */}
        <Card data-testid="tax-rate-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="marginal-rate">Your Marginal Tax Rate</Label>
                <p className="text-sm text-muted-foreground">
                  Used to calculate negative gearing tax benefits
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="marginal-rate"
                  type="number"
                  value={marginalTaxRate}
                  onChange={(e) => setMarginalTaxRate(Number(e.target.value))}
                  className="w-24"
                  data-testid="marginal-rate-input"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <div className="space-y-6">
          {properties.map((property, index) => (
            <Card key={index} data-testid={`property-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1a2744] flex items-center justify-center">
                    <Home className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Input
                      value={property.name}
                      onChange={(e) => updateProperty(index, 'name', e.target.value)}
                      className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
                      placeholder="Property Name"
                      data-testid={`property-name-${index}`}
                    />
                  </div>
                </div>
                {properties.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProperty(index)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`remove-property-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Property Value */}
                  <div className="space-y-2">
                    <Label>Property Value</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={property.value}
                        onChange={(e) => updateProperty(index, 'value', Number(e.target.value))}
                        className="pl-10"
                        data-testid={`property-value-${index}`}
                      />
                    </div>
                  </div>

                  {/* Annual Rental Income */}
                  <div className="space-y-2">
                    <Label>Annual Rental Income</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={property.rental_income}
                        onChange={(e) => updateProperty(index, 'rental_income', Number(e.target.value))}
                        className="pl-10"
                        data-testid={`rental-income-${index}`}
                      />
                    </div>
                  </div>

                  {/* Mortgage Amount */}
                  <div className="space-y-2">
                    <Label>Mortgage Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={property.mortgage_amount}
                        onChange={(e) => updateProperty(index, 'mortgage_amount', Number(e.target.value))}
                        className="pl-10"
                        data-testid={`mortgage-amount-${index}`}
                      />
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="space-y-2">
                    <Label>Interest Rate (%)</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.1"
                        value={property.mortgage_rate}
                        onChange={(e) => updateProperty(index, 'mortgage_rate', Number(e.target.value))}
                        className="pl-10"
                        data-testid={`mortgage-rate-${index}`}
                      />
                    </div>
                  </div>

                  {/* Annual Expenses */}
                  <div className="space-y-2">
                    <Label>Annual Expenses</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={property.annual_expenses}
                        onChange={(e) => updateProperty(index, 'annual_expenses', Number(e.target.value))}
                        className="pl-10"
                        placeholder="Rates, insurance, maintenance"
                        data-testid={`annual-expenses-${index}`}
                      />
                    </div>
                  </div>

                  {/* Building Depreciation */}
                  <div className="space-y-2">
                    <Label>Building Depreciation</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={property.depreciation_building}
                        onChange={(e) => updateProperty(index, 'depreciation_building', Number(e.target.value))}
                        className="pl-10"
                        data-testid={`depreciation-building-${index}`}
                      />
                    </div>
                  </div>

                  {/* Fixtures Depreciation */}
                  <div className="space-y-2">
                    <Label>Fixtures Depreciation</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={property.depreciation_fixtures}
                        onChange={(e) => updateProperty(index, 'depreciation_fixtures', Number(e.target.value))}
                        className="pl-10"
                        data-testid={`depreciation-fixtures-${index}`}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analyze Button */}
        <Button 
          onClick={analyzePortfolio}
          className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90"
          disabled={loading}
          data-testid="analyze-portfolio-btn"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {loading ? "Analyzing..." : "Analyze Portfolio"}
        </Button>

        {/* Results */}
        {analyses.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="portfolio-summary">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-xl font-bold">{formatCurrency(totalSummary.totalValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Annual Rental</p>
                  <p className="text-xl font-bold text-[#10B981]">
                    {formatCurrency(totalSummary.totalRentalIncome)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Deductions</p>
                  <p className="text-xl font-bold text-[#D4A84C]">
                    {formatCurrency(totalSummary.totalDeductions)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Tax Benefit</p>
                  <p className="text-xl font-bold text-[#10B981]">
                    {formatCurrency(totalSummary.totalTaxBenefit)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#1a2744] text-white">
                <CardContent className="p-4">
                  <p className="text-sm text-white/80">Net Cash Flow</p>
                  <p className={`text-xl font-bold ${totalSummary.totalCashFlow >= 0 ? 'text-[#10B981]' : 'text-red-400'}`}>
                    {formatCurrency(totalSummary.totalCashFlow)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card data-testid="portfolio-chart">
              <CardHeader>
                <CardTitle className="">Portfolio Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="rental" fill="#10B981" name="Rental Income" />
                      <Bar dataKey="deductions" fill="#D4A84C" name="Deductions" />
                      <Bar dataKey="cashFlow" fill="#1a2744" name="Cash Flow" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Individual Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analyses.map((analysis, index) => (
                <Card key={index} data-testid={`analysis-result-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        analysis.is_negatively_geared ? 'bg-[#D4A84C]/10' : 'bg-[#10B981]/10'
                      }`}>
                        {analysis.is_negatively_geared 
                          ? <TrendingDown className="h-5 w-5 text-[#D4A84C]" />
                          : <TrendingUp className="h-5 w-5 text-[#10B981]" />
                        }
                      </div>
                      <div>
                        <CardTitle className="text-lg">{analysis.property_name}</CardTitle>
                        <p className={`text-sm ${analysis.is_negatively_geared ? 'text-[#D4A84C]' : 'text-[#10B981]'}`}>
                          {analysis.is_negatively_geared ? 'Negatively Geared' : 'Positively Geared'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rental Income</span>
                        <span className="font-semibold">{formatCurrency(analysis.rental_income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mortgage Interest</span>
                        <span className="font-semibold text-destructive">
                          -{formatCurrency(analysis.mortgage_interest)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other Expenses</span>
                        <span className="font-semibold text-destructive">
                          -{formatCurrency(analysis.other_expenses)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Depreciation</span>
                        <span className="font-semibold text-destructive">
                          -{formatCurrency(analysis.depreciation)}
                        </span>
                      </div>
                      <div className="border-t pt-3 flex justify-between">
                        <span className="text-muted-foreground">Net Rental Income</span>
                        <span className={`font-semibold ${analysis.net_rental_income >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                          {formatCurrency(analysis.net_rental_income)}
                        </span>
                      </div>
                      {analysis.is_negatively_geared && (
                        <div className="flex justify-between p-3 rounded-lg bg-[#D4A84C]/10">
                          <span className="font-medium">Tax Benefit</span>
                          <span className="font-bold text-[#D4A84C]">
                            +{formatCurrency(analysis.annual_tax_benefit)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between p-3 rounded-lg bg-[#1a2744] text-white">
                        <span className="font-medium">After-Tax Cash Flow</span>
                        <span className="font-bold">
                          {formatCurrency(analysis.cash_flow_after_tax)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default PropertyPortfolio;
