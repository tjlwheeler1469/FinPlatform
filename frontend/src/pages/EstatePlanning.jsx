import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Home,
  Landmark,
  DollarSign,
  Calendar,
  Shield,
  Sparkles,
  RefreshCw,
  Download
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import {
  AreaChart,
  Area,
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

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const EstatePlanning = () => {
  const { portfolio } = usePortfolio();
  const [projections, setProjections] = useState(null);
  const [estatePlan, setEstatePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProjections();
  }, [portfolio]);

  const fetchProjections = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/estate/projections`, {
        current_age: 45,
        life_expectancy: 85,
        current_net_worth: portfolio.summary.netWorth,
        annual_growth_rate: 0.05,
        annual_expenses: 120000,
        super_balance: portfolio.investments.smsf_balance,
        property_value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0),
        investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value
      });
      setProjections(response.data);
    } catch (error) {
      console.error("Error fetching projections:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateEstatePlan = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/estate/create-plan`, {
        primary_name: "David Thompson",
        spouse_name: "Sarah Thompson",
        beneficiaries: [
          { name: "Emily Thompson", relationship: "child", percentage: 40 },
          { name: "Michael Thompson", relationship: "child", percentage: 40 },
          { name: "Charity", relationship: "charity", percentage: 20 }
        ],
        assets: {
          family_home: portfolio.investments.properties[0]?.value || 2500000,
          investment_property: portfolio.investments.properties[1]?.value || 1200000,
          superannuation: portfolio.investments.smsf_balance,
          shares: portfolio.investments.shares_value,
          cash: 100000
        },
        executor: "Sarah Thompson (spouse)"
      });
      setEstatePlan(response.data);
      setActiveTab("plan");
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const assetComposition = projections?.estate_composition ? [
    { name: 'Property', value: projections.estate_composition.property },
    { name: 'Super', value: projections.estate_composition.super },
    { name: 'Investments', value: projections.estate_composition.investments },
    { name: 'Other', value: projections.estate_composition.other }
  ].filter(a => a.value > 0) : [];

  return (
    <Layout>
      <div className="space-y-6" data-testid="estate-planning">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Estate Planning</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Inheritance projections, trust planning, and estate distribution
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchProjections}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={generateEstatePlan} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Estate Plan
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="plan">Estate Plan</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Current Net Worth</p>
                  <p className="text-3xl font-bold">{formatCurrency(portfolio.summary.netWorth)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Projected Estate Value</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(projections?.projected_estate_value || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">at age {projections?.life_expectancy || 85}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Net After Tax</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(projections?.tax_implications?.net_estate_after_tax || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tax: {formatCurrency(projections?.tax_implications?.total_tax_liability || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Asset Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Estate Composition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={assetComposition}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {assetComposition.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {assetComposition.map((asset, i) => (
                      <div key={`item-${i}`} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-sm">{asset.name}: {formatCompact(asset.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tax Implications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="font-medium">Super Death Benefit Tax</p>
                      </div>
                      <p className="text-2xl font-bold text-amber-600">
                        {formatCurrency(projections?.tax_implications?.super_death_benefit_tax || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        15% tax on super paid to non-dependent beneficiaries
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <p className="font-medium">No Inheritance Tax</p>
                      </div>
                      <p className="text-sm text-green-700">
                        Australia does not have a general inheritance or estate tax.
                        Most assets receive a cost base reset on death.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Estate Value Over Time</CardTitle>
                <CardDescription>Projected estate value from now until life expectancy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={projections?.projections || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area
                        type="monotone"
                        dataKey="projected_net_worth"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        name="Estate Value"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {projections?.projections?.map((proj, i) => (
                <Card key={`item-${i}`}>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Age {proj.age}</p>
                    <p className="text-xl font-bold">{proj.formatted}</p>
                    <p className="text-xs text-muted-foreground">{proj.year}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Estate Plan Tab */}
          <TabsContent value="plan" className="space-y-4 mt-4">
            {!estatePlan ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Estate Plan Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate an estate plan to see distribution recommendations and beneficiary details.
                  </p>
                  <Button onClick={generateEstatePlan} disabled={loading}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Estate Plan
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Plan Header */}
                <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-white/60">ESTATE PLAN</p>
                        <h2 className="text-2xl font-bold mt-1">{estatePlan.primary_holder}</h2>
                        <p className="text-sm text-white/60 mt-1">Plan ID: {estatePlan.plan_id}</p>
                      </div>
                      <Badge className="bg-white/20">
                        {formatCurrency(estatePlan.total_estate_value)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs text-white/60">Primary Holder</p>
                        <p className="font-medium">{estatePlan.primary_holder}</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs text-white/60">Spouse</p>
                        <p className="font-medium">{estatePlan.spouse || "N/A"}</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-xs text-white/60">Executor</p>
                        <p className="font-medium">{estatePlan.executor}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Beneficiaries & Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Estate Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {estatePlan.distributions?.map((dist, i) => (
                        <div key={`item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{dist.beneficiary}</p>
                            <p className="text-sm text-muted-foreground capitalize">{dist.relationship}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">{dist.percentage}%</p>
                            <p className="text-sm text-muted-foreground">{dist.formatted_amount}</p>
                          </div>
                          <Progress value={dist.percentage} className="w-24 h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Estate Planning Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {estatePlan.recommendations?.map((rec, i) => (
                        <div key={`item-${i}`} className="flex items-start gap-4 p-3 border rounded-lg">
                          <div className={`p-2 rounded-lg ${
                            rec.priority === "High" ? "bg-red-100" : "bg-amber-100"
                          }`}>
                            <AlertCircle className={`h-4 w-4 ${
                              rec.priority === "High" ? "text-red-600" : "text-amber-600"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{rec.action}</p>
                            <p className="text-sm text-muted-foreground">{rec.detail}</p>
                            <p className="text-xs text-primary mt-1">{rec.impact}</p>
                          </div>
                          <Badge variant={rec.priority === "High" ? "destructive" : "secondary"}>
                            {rec.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Document Checklist</CardTitle>
                <CardDescription>Essential estate planning documents and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(estatePlan?.document_checklist || [
                    { document: "Will", status: "Review recommended", last_updated: "2024-06-15" },
                    { document: "Enduring Power of Attorney (Financial)", status: "In place", last_updated: "2024-06-15" },
                    { document: "Enduring Power of Attorney (Medical)", status: "Review recommended", last_updated: "2024-06-15" },
                    { document: "Super Binding Nomination", status: "Update required", last_updated: "2022-03-10" },
                    { document: "Family Trust Deed", status: "In place", last_updated: "2020-01-15" }
                  ]).map((doc, i) => (
                    <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.document}</p>
                        <p className="text-xs text-muted-foreground">Last updated: {doc.last_updated}</p>
                      </div>
                      <Badge variant={
                        doc.status === "In place" ? "secondary" : 
                        doc.status === "Update required" ? "destructive" : "outline"
                      } className={
                        doc.status === "In place" ? "bg-green-100 text-green-700" : ""
                      }>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EstatePlanning;
