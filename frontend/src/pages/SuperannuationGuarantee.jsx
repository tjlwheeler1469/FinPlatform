import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChartContainer from "@/components/ChartContainer";
import { 
  Calculator,
  DollarSign,
  Percent,
  Users,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Info,
  PiggyBank,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// SG Rate schedule
const SG_RATES = {
  "2024-25": 11.5,
  "2025-26": 12.0,
  "2026-27": 12.0,
  "2027-28": 12.0,
  "2028-29": 12.0
};

const MAX_CONTRIBUTION_BASE_QUARTERLY = 62500 * 4; // 2024-25 quarterly max super contribution base

const defaultEmployee = {
  id: Date.now(),
  name: "",
  annualOTE: 0,
  isCasual: false,
  hoursPerWeek: 38,
  isContractor: false
};

const SuperannuationGuarantee = ({ embedded = false }) => {
  const [employees, setEmployees] = useState([
    { ...defaultEmployee, id: 1, name: "Employee 1", annualOTE: 85000 }
  ]);
  const [selectedYear, setSelectedYear] = useState("2024-25");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sgRate = SG_RATES[selectedYear] / 100;

  const addEmployee = () => {
    setEmployees([
      ...employees,
      { ...defaultEmployee, id: Date.now(), name: `Employee ${employees.length + 1}` }
    ]);
    toast.success("Employee added");
  };

  const removeEmployee = (id) => {
    if (employees.length > 1) {
      setEmployees(employees.filter(e => e.id !== id));
      toast.success("Employee removed");
    }
  };

  const updateEmployee = (id, field, value) => {
    setEmployees(employees.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  // Calculate SG for each employee
  const calculateSG = (employee) => {
    // Check eligibility
    if (employee.isContractor) {
      return { eligible: false, reason: "Contractor - not employee", sg: 0, quarterlyBreakdown: [] };
    }

    const quarterlyOTE = employee.annualOTE / 4;
    const maxQuarterlyBase = 62500; // 2024-25 maximum quarterly contribution base
    
    // Apply maximum contribution base cap
    const cappedQuarterlyOTE = Math.min(quarterlyOTE, maxQuarterlyBase);
    const quarterlySG = cappedQuarterlyOTE * sgRate;
    const annualSG = quarterlySG * 4;

    const quarterlyBreakdown = [
      { quarter: "Q1 (Jul-Sep)", ote: cappedQuarterlyOTE, sg: quarterlySG, dueDate: "28 Oct" },
      { quarter: "Q2 (Oct-Dec)", ote: cappedQuarterlyOTE, sg: quarterlySG, dueDate: "28 Jan" },
      { quarter: "Q3 (Jan-Mar)", ote: cappedQuarterlyOTE, sg: quarterlySG, dueDate: "28 Apr" },
      { quarter: "Q4 (Apr-Jun)", ote: cappedQuarterlyOTE, sg: quarterlySG, dueDate: "28 Jul" }
    ];

    const wasCapped = quarterlyOTE > maxQuarterlyBase;

    return {
      eligible: true,
      sg: annualSG,
      quarterlySG,
      quarterlyBreakdown,
      wasCapped,
      cappedAmount: wasCapped ? (quarterlyOTE - maxQuarterlyBase) * 4 : 0
    };
  };

  const employeeResults = employees.map(emp => ({
    ...emp,
    calculation: calculateSG(emp)
  }));

  const totalAnnualSG = employeeResults.reduce((sum, emp) => sum + emp.calculation.sg, 0);
  const totalQuarterlySG = totalAnnualSG / 4;

  // Chart data
  const chartData = employeeResults
    .filter(emp => emp.calculation.eligible)
    .map(emp => ({
      name: emp.name || `Employee ${emp.id}`,
      ote: emp.annualOTE,
      sg: emp.calculation.sg
    }));

  // Projection data (5 years)
  const projectionData = Object.entries(SG_RATES).map(([year, rate]) => ({
    year,
    rate,
    totalSG: employees.reduce((sum, emp) => {
      if (emp.isContractor) return sum;
      const quarterlyOTE = Math.min(emp.annualOTE / 4, 62500);
      return sum + (quarterlyOTE * (rate / 100) * 4);
    }, 0)
  }));

  const content = (
    <>
      <div className="space-y-6" data-testid="sg-calculator-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Superannuation Guarantee Calculator
            </h1>
            <p className="text-muted-foreground mt-1">
              Calculate employer SG obligations for {selectedYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label>Financial Year:</Label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {Object.keys(SG_RATES).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Rate Info */}
        <Card className="bg-[#1a2744] text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-white/70 text-sm">SG Rate {selectedYear}</p>
                <p className="text-3xl font-bold">{SG_RATES[selectedYear]}%</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Max Quarterly Base</p>
                <p className="text-3xl font-bold">{formatCurrency(62500)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Quarterly SG</p>
                <p className="text-3xl font-bold text-[#D4A84C]">{formatCurrency(totalQuarterlySG)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Annual SG</p>
                <p className="text-3xl font-bold text-[#10B981]">{formatCurrency(totalAnnualSG)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Employees</h2>
          <Button onClick={addEmployee} variant="outline" data-testid="add-employee-btn">
            <Plus className="h-4 w-4 mr-2" /> Add Employee
          </Button>
        </div>

        <div className="space-y-4">
          {employees.map((employee, index) => {
            const result = employeeResults.find(e => e.id === employee.id);
            const calc = result?.calculation;

            return (
              <Card key={employee.id} data-testid={`employee-card-${index}`}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[#1a2744] flex items-center justify-center text-white">
                          <Users className="h-5 w-5" />
                        </div>
                        <Input
                          value={employee.name}
                          onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                          placeholder="Employee Name"
                          className="font-semibold"
                        />
                        {employees.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmployee(employee.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Annual OTE (Ordinary Time Earnings)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={employee.annualOTE}
                            onChange={(e) => updateEmployee(employee.id, 'annualOTE', Number(e.target.value))}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Includes salary, allowances, bonuses, commissions, shift loadings
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded bg-muted/50">
                        <div>
                          <Label>Is Contractor?</Label>
                          <p className="text-xs text-muted-foreground">Not eligible for SG</p>
                        </div>
                        <Switch
                          checked={employee.isContractor}
                          onCheckedChange={(v) => updateEmployee(employee.id, 'isContractor', v)}
                        />
                      </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-2">
                      {!calc?.eligible ? (
                        <div className="h-full flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                            <p className="font-medium">Not Eligible for SG</p>
                            <p className="text-sm text-muted-foreground">{calc?.reason}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-[#1a2744]/10">
                              <p className="text-xs text-muted-foreground">Quarterly SG</p>
                              <p className="text-lg font-bold">{formatCurrency(calc.quarterlySG)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-[#10B981]/10">
                              <p className="text-xs text-muted-foreground">Annual SG</p>
                              <p className="text-lg font-bold text-[#10B981]">{formatCurrency(calc.sg)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">SG Rate</p>
                              <p className="text-lg font-bold">{SG_RATES[selectedYear]}%</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">% of Salary</p>
                              <p className="text-lg font-bold">
                                {employee.annualOTE > 0 ? ((calc.sg / employee.annualOTE) * 100).toFixed(1) : 0}%
                              </p>
                            </div>
                          </div>

                          {calc.wasCapped && (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-800">
                                  Maximum contribution base applied
                                </span>
                              </div>
                              <p className="text-xs text-amber-700 mt-1">
                                {formatCurrency(calc.cappedAmount)} of annual OTE exceeds the maximum quarterly contribution base.
                                SG is not required on earnings above {formatCurrency(62500)} per quarter.
                              </p>
                            </div>
                          )}

                          {/* Quarterly Breakdown */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Quarter</th>
                                  <th className="text-right p-2">OTE</th>
                                  <th className="text-right p-2">SG Amount</th>
                                  <th className="text-right p-2">Due Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {calc.quarterlyBreakdown.map((q, i) => (
                                  <tr key={`item-${i}`} className="border-b">
                                    <td className="p-2">{q.quarter}</td>
                                    <td className="text-right p-2">{formatCurrency(q.ote)}</td>
                                    <td className="text-right p-2 font-medium">{formatCurrency(q.sg)}</td>
                                    <td className="text-right p-2 text-muted-foreground">{q.dueDate}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>SG by Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={250}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis tickFormatter={(v) => `$${(v/1000)}k`} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="sg" name="Annual SG" fill="#1a2744" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Rate Projection */}
            <Card>
              <CardHeader>
                <CardTitle>SG Rate & Cost Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={250}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" tickFormatter={(v) => `$${(v/1000)}k`} stroke="hsl(var(--muted-foreground))" />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} stroke="hsl(var(--muted-foreground))" domain={[11, 13]} />
                      <Tooltip formatter={(v, name) => name === 'rate' ? `${v}%` : formatCurrency(v)} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="totalSG" name="Total SG" stroke="#1a2744" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="rate" name="SG Rate" stroke="#D4A84C" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Due Dates & Penalties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#D4A84C]" />
              Payment Due Dates & Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Quarterly Due Dates</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Q1 (Jul - Sep)</span>
                    <span className="font-medium">28 October</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Q2 (Oct - Dec)</span>
                    <span className="font-medium">28 January</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Q3 (Jan - Mar)</span>
                    <span className="font-medium">28 April</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/50">
                    <span>Q4 (Apr - Jun)</span>
                    <span className="font-medium">28 July</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Late Payment Penalties</h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="font-medium text-red-800">Super Guarantee Charge (SGC)</p>
                    <p className="text-sm text-red-700 mt-1">
                      Late payments incur SGC which includes: unpaid SG amounts, interest (10%+), 
                      and an administration fee ($20 per employee per quarter).
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="font-medium text-amber-800">SGC is NOT Tax Deductible</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Unlike regular SG payments, the SGC penalty is not a tax deduction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATO Reference */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">ATO Reference</p>
                <a 
                  href="https://www.ato.gov.au/businesses-and-organisations/super-for-employers/paying-super-contributions/how-much-super-to-pay" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-[#1a2744] hover:underline flex items-center gap-1"
                >
                  How much super to pay <ExternalLink className="h-3 w-3" />
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  OTE includes: salary, wages, commissions, shift loadings, annual leave, sick leave paid. 
                  Excludes: overtime, one-off bonuses not in employment contract, expense reimbursements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default SuperannuationGuarantee;
