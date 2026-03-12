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
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  DollarSign, 
  Percent,
  Building2,
  User,
  Users,
  Plus,
  Trash2,
  Home,
  Calculator,
  ArrowRight,
  PiggyBank,
  TrendingUp,
  Landmark,
  Briefcase,
  UserPlus,
  Shield
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

const defaultPerson = {
  id: "",
  name: "",
  age: 45,
  taxable_income: 0,
  employer_super: 0,
  salary_sacrifice: 0,
  deductions: {
    work_related: 0,
    self_education: 0,
    other: 0
  }
};

const defaultCompany = {
  id: "",
  name: "",
  abn: "",
  taxable_income: 0,
  revenue: 0,
  expenses: 0,
  is_base_rate_entity: true, // < $50M turnover = 25% tax rate
  franking_account_balance: 0
};

const defaultTrust = {
  id: "",
  name: "",
  abn: "",
  trust_type: "discretionary", // discretionary, unit, hybrid
  trustee_type: "individual", // individual, corporate
  trustee_name: "",
  net_income: 0,
  beneficiaries: [],
  distributions: {}
};

const defaultBeneficiary = {
  id: "",
  name: "",
  relationship: "family", // family, company, other_trust
  tax_file_number: "",
  distribution_percentage: 0,
  is_presently_entitled: true
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
  depreciation_fixtures: 0,
  owner: "joint" // "person1", "person2", "joint", "company_0", etc.
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

// Demo scenarios data
const DEMO_SCENARIOS = {
  demo_001: {
    name: "Wheeler Family - Current",
    entity_type: "personal",
    people: [
      { id: "p1", name: "James Wheeler", age: 47, taxable_income: 185000, employer_super: 11, salary_sacrifice: 5000, deductions: { work_related: 2500, self_education: 0, other: 500 } },
      { id: "p2", name: "Sarah Wheeler", age: 44, taxable_income: 95000, employer_super: 11, salary_sacrifice: 3000, deductions: { work_related: 1800, self_education: 1200, other: 300 } }
    ],
    companies: [],
    investments: {
      cash_savings: 75000,
      term_deposit_amount: 50000,
      term_deposit_rate: 4.75,
      shares_value: 320000,
      shares_dividend_yield: 4.2,
      franking_percentage: 85,
      bonds_value: 80000,
      bonds_yield: 5.2,
      etf_value: 145000,
      etf_yield: 3.5,
      smsf_balance: 420000,
      properties: [
        { property_id: "prop1", name: "Sydney Investment", value: 1250000, rental_income: 52000, mortgage_amount: 650000, mortgage_rate: 6.49, mortgage_term_years: 25, annual_expenses: 8500, depreciation_building: 12500, depreciation_fixtures: 3200, owner: "joint" },
        { property_id: "prop2", name: "Melbourne Unit", value: 680000, rental_income: 28600, mortgage_amount: 340000, mortgage_rate: 6.24, mortgage_term_years: 28, annual_expenses: 5200, depreciation_building: 6800, depreciation_fixtures: 2100, owner: "person1" }
      ]
    },
    expenses: { school_fees: 35000, childcare: 0, health_insurance: 4800, private_expenses: 12000, work_related: 4300, other_deductible: 800 },
    simulation_years: 10
  },
  demo_002: {
    name: "Retirement Planning 2030",
    entity_type: "personal",
    people: [
      { id: "p1", name: "James Wheeler", age: 52, taxable_income: 150000, employer_super: 11, salary_sacrifice: 15000, deductions: { work_related: 2000, self_education: 0, other: 500 } },
      { id: "p2", name: "Sarah Wheeler", age: 49, taxable_income: 80000, employer_super: 11, salary_sacrifice: 10000, deductions: { work_related: 1500, self_education: 0, other: 300 } }
    ],
    companies: [],
    investments: {
      cash_savings: 100000,
      term_deposit_amount: 80000,
      term_deposit_rate: 4.5,
      shares_value: 400000,
      shares_dividend_yield: 4.5,
      franking_percentage: 90,
      bonds_value: 150000,
      bonds_yield: 5.0,
      etf_value: 200000,
      etf_yield: 3.2,
      smsf_balance: 850000,
      properties: [
        { property_id: "prop1", name: "Sydney Investment", value: 1450000, rental_income: 58000, mortgage_amount: 450000, mortgage_rate: 6.29, mortgage_term_years: 20, annual_expenses: 9000, depreciation_building: 14500, depreciation_fixtures: 3500, owner: "joint" }
      ]
    },
    expenses: { school_fees: 0, childcare: 0, health_insurance: 5200, private_expenses: 15000, work_related: 3500, other_deductible: 1000 },
    simulation_years: 15
  },
  demo_003: {
    name: "Company Structure Analysis",
    entity_type: "company",
    people: [
      { id: "p1", name: "James Wheeler", age: 47, taxable_income: 120000, employer_super: 11, salary_sacrifice: 0, deductions: { work_related: 0, self_education: 0, other: 0 } }
    ],
    companies: [
      { id: "c1", name: "Wheeler Consulting Pty Ltd", abn: "12 345 678 901", taxable_income: 180000, revenue: 450000, expenses: 270000, is_base_rate_entity: true, franking_account_balance: 45000 },
      { id: "c2", name: "Wheeler Property Holdings", abn: "98 765 432 109", taxable_income: 95000, revenue: 120000, expenses: 25000, is_base_rate_entity: true, franking_account_balance: 22000 }
    ],
    investments: {
      cash_savings: 200000,
      term_deposit_amount: 100000,
      term_deposit_rate: 4.8,
      shares_value: 500000,
      shares_dividend_yield: 4.0,
      franking_percentage: 100,
      bonds_value: 100000,
      bonds_yield: 5.5,
      etf_value: 0,
      etf_yield: 0,
      smsf_balance: 380000,
      properties: [
        { property_id: "prop1", name: "Commercial Office", value: 1800000, rental_income: 95000, mortgage_amount: 900000, mortgage_rate: 6.75, mortgage_term_years: 20, annual_expenses: 18000, depreciation_building: 45000, depreciation_fixtures: 8000, owner: "company_0" },
        { property_id: "prop2", name: "Warehouse", value: 950000, rental_income: 48000, mortgage_amount: 500000, mortgage_rate: 6.50, mortgage_term_years: 25, annual_expenses: 12000, depreciation_building: 23750, depreciation_fixtures: 4500, owner: "company_1" },
        { property_id: "prop3", name: "Residential Investment", value: 720000, rental_income: 32000, mortgage_amount: 380000, mortgage_rate: 6.24, mortgage_term_years: 28, annual_expenses: 6500, depreciation_building: 7200, depreciation_fixtures: 2400, owner: "person1" }
      ]
    },
    expenses: { school_fees: 0, childcare: 0, health_insurance: 4800, private_expenses: 8000, work_related: 0, other_deductible: 0 },
    simulation_years: 10
  },
  demo_004: {
    name: "Family Trust Structure",
    entity_type: "trust",
    people: [
      { id: "p1", name: "James Wheeler", age: 47, taxable_income: 120000, employer_super: 11, salary_sacrifice: 0, deductions: { work_related: 0, self_education: 0, other: 0 } },
      { id: "p2", name: "Sarah Wheeler", age: 44, taxable_income: 65000, employer_super: 11, salary_sacrifice: 0, deductions: { work_related: 0, self_education: 0, other: 0 } }
    ],
    companies: [],
    trusts: [
      { 
        id: "t1", 
        name: "Wheeler Family Trust", 
        abn: "55 123 456 789", 
        trust_type: "discretionary", 
        trustee_type: "corporate",
        trustee_name: "Wheeler Trustee Pty Ltd",
        net_income: 150000,
        beneficiaries: [
          { id: "b1", name: "James Wheeler", relationship: "family", distribution_percentage: 30, is_presently_entitled: true },
          { id: "b2", name: "Sarah Wheeler", relationship: "family", distribution_percentage: 30, is_presently_entitled: true },
          { id: "b3", name: "Emily Wheeler (Adult Child)", relationship: "family", distribution_percentage: 20, is_presently_entitled: true },
          { id: "b4", name: "Michael Wheeler (Adult Child)", relationship: "family", distribution_percentage: 20, is_presently_entitled: true }
        ]
      }
    ],
    investments: {
      cash_savings: 50000,
      term_deposit_amount: 0,
      term_deposit_rate: 4.5,
      shares_value: 400000,
      shares_dividend_yield: 4.5,
      franking_percentage: 85,
      bonds_value: 50000,
      bonds_yield: 5.0,
      etf_value: 100000,
      etf_yield: 3.5,
      smsf_balance: 320000,
      properties: [
        { property_id: "prop1", name: "Trust Investment Property", value: 850000, rental_income: 42000, mortgage_amount: 400000, mortgage_rate: 6.35, mortgage_term_years: 25, annual_expenses: 7500, depreciation_building: 8500, depreciation_fixtures: 2800, owner: "trust_0" }
      ]
    },
    expenses: { school_fees: 0, childcare: 0, health_insurance: 4800, private_expenses: 10000, work_related: 0, other_deductible: 0 },
    simulation_years: 10
  }
};

const ScenarioBuilder = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams();
  const isEditing = !!scenarioId;

  const [name, setName] = useState("My Investment Scenario");
  const [entityType, setEntityType] = useState("personal");
  
  // Multi-person support
  const [people, setPeople] = useState([
    { ...defaultPerson, id: "p1", name: "Person 1", taxable_income: 120000 }
  ]);
  
  // Multi-company support
  const [companies, setCompanies] = useState([]);
  
  // Multi-trust support
  const [trusts, setTrusts] = useState([]);
  
  const [investments, setInvestments] = useState(defaultInvestments);
  const [expenses, setExpenses] = useState(defaultExpenses);
  const [simulationYears, setSimulationYears] = useState(10);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState("people");

  useEffect(() => {
    if (isEditing) {
      loadScenario();
    }
  }, [scenarioId]);

  const loadScenario = () => {
    setLoading(true);
    // Check if it's a demo scenario
    if (scenarioId && DEMO_SCENARIOS[scenarioId]) {
      const demo = DEMO_SCENARIOS[scenarioId];
      setName(demo.name);
      setEntityType(demo.entity_type);
      setPeople(demo.people || [{ ...defaultPerson, id: "p1", name: "Person 1" }]);
      setCompanies(demo.companies || []);
      setTrusts(demo.trusts || []);
      setInvestments(demo.investments || defaultInvestments);
      setExpenses(demo.expenses || defaultExpenses);
      setSimulationYears(demo.simulation_years || 10);
      toast.success("Scenario loaded");
    } else {
      // Try to fetch from API
      axios.get(`${API}/scenarios/${scenarioId}`, { withCredentials: true })
        .then(response => {
          const data = response.data;
          setName(data.name);
          setEntityType(data.entity_type);
          setPeople(data.people || [{ ...defaultPerson, id: "p1", name: "Person 1" }]);
          setCompanies(data.companies || []);
          setTrusts(data.trusts || []);
          setInvestments(data.investments || defaultInvestments);
          setExpenses(data.expenses || defaultExpenses);
          setSimulationYears(data.simulation_years || 10);
        })
        .catch(error => {
          console.error("Error fetching scenario:", error);
          toast.error("Failed to load scenario - using defaults");
        });
    }
    setLoading(false);
  };

  const saveScenario = async () => {
    setSaving(true);
    try {
      const scenarioData = {
        name,
        entity_type: entityType,
        people,
        companies,
        trusts,
        taxable_income: people.reduce((sum, p) => sum + (p.taxable_income || 0), 0),
        investments,
        expenses,
        simulation_years: simulationYears
      };

      if (isEditing && !scenarioId.startsWith("demo_")) {
        await axios.put(`${API}/scenarios/${scenarioId}`, scenarioData, { withCredentials: true });
        toast.success("Scenario updated");
      } else {
        await axios.post(`${API}/scenarios`, scenarioData, { withCredentials: true });
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
      const totalPersonalIncome = people.reduce((sum, p) => sum + (p.taxable_income || 0), 0);
      const totalCompanyIncome = companies.reduce((sum, c) => sum + (c.taxable_income || 0), 0);
      
      const response = await axios.post(`${API}/analyze/full-scenario`, {
        name,
        entity_type: entityType,
        taxable_income: entityType === "personal" ? totalPersonalIncome : totalCompanyIncome,
        people,
        companies,
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

  // Person management
  const addPerson = () => {
    if (people.length < 2) {
      setPeople([
        ...people,
        { ...defaultPerson, id: `p${people.length + 1}`, name: `Person ${people.length + 1}` }
      ]);
    }
  };

  const removePerson = (index) => {
    if (people.length > 1) {
      setPeople(people.filter((_, i) => i !== index));
    }
  };

  const updatePerson = (index, field, value) => {
    const updated = [...people];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index] = { 
        ...updated[index], 
        [parent]: { ...updated[index][parent], [child]: value }
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setPeople(updated);
  };

  // Company management
  const addCompany = () => {
    setCompanies([
      ...companies,
      { ...defaultCompany, id: `c${companies.length + 1}`, name: `Company ${companies.length + 1}` }
    ]);
  };

  const removeCompany = (index) => {
    setCompanies(companies.filter((_, i) => i !== index));
  };

  const updateCompany = (index, field, value) => {
    const updated = [...companies];
    updated[index] = { ...updated[index], [field]: value };
    setCompanies(updated);
  };

  // Trust management
  const addTrust = () => {
    setTrusts([
      ...trusts,
      { 
        ...defaultTrust, 
        id: `t${trusts.length + 1}`, 
        name: `Family Trust ${trusts.length + 1}`,
        beneficiaries: people.map((p, i) => ({
          ...defaultBeneficiary,
          id: `b${i + 1}`,
          name: p.name,
          distribution_percentage: Math.round(100 / people.length)
        }))
      }
    ]);
  };

  const removeTrust = (index) => {
    setTrusts(trusts.filter((_, i) => i !== index));
  };

  const updateTrust = (index, field, value) => {
    const updated = [...trusts];
    updated[index] = { ...updated[index], [field]: value };
    setTrusts(updated);
  };

  const addBeneficiary = (trustIndex) => {
    const updated = [...trusts];
    updated[trustIndex].beneficiaries.push({
      ...defaultBeneficiary,
      id: `b${Date.now()}`,
      name: "New Beneficiary"
    });
    setTrusts(updated);
  };

  const removeBeneficiary = (trustIndex, beneficiaryIndex) => {
    const updated = [...trusts];
    updated[trustIndex].beneficiaries = updated[trustIndex].beneficiaries.filter((_, i) => i !== beneficiaryIndex);
    setTrusts(updated);
  };

  const updateBeneficiary = (trustIndex, beneficiaryIndex, field, value) => {
    const updated = [...trusts];
    updated[trustIndex].beneficiaries[beneficiaryIndex] = {
      ...updated[trustIndex].beneficiaries[beneficiaryIndex],
      [field]: value
    };
    setTrusts(updated);
  };

  // Property management
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

  // Calculate totals
  const totalPersonalIncome = people.reduce((sum, p) => sum + (p.taxable_income || 0), 0);
  const totalCompanyIncome = companies.reduce((sum, c) => sum + (c.taxable_income || 0), 0);
  const totalTrustIncome = trusts.reduce((sum, t) => sum + (t.net_income || 0), 0);
  const totalInvestmentValue = (investments.cash_savings || 0) + 
    (investments.term_deposit_amount || 0) + 
    (investments.shares_value || 0) + 
    (investments.bonds_value || 0) + 
    (investments.etf_value || 0);

  // Get owner options for properties
  const getOwnerOptions = () => {
    const options = [{ value: "joint", label: "Joint Ownership" }];
    people.forEach((p, i) => {
      options.push({ value: `person${i + 1}`, label: p.name || `Person ${i + 1}` });
    });
    companies.forEach((c, i) => {
      options.push({ value: `company_${i}`, label: c.name || `Company ${i + 1}` });
    });
    trusts.forEach((t, i) => {
      options.push({ value: `trust_${i}`, label: t.name || `Trust ${i + 1}` });
    });
    return options;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="scenario-builder-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              {isEditing ? "Edit Scenario" : "New Scenario"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {entityType === "personal" ? "Personal & Family" : "Company Structure"} Analysis
            </p>
          </div>
          <div className="flex gap-2">
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
              disabled={saving}
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
              data-testid="save-btn"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Scenario Name & Type */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <Label>Scenario Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Investment Scenario"
                  data-testid="scenario-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={entityType === "personal" ? "default" : "outline"}
                    onClick={() => setEntityType("personal")}
                    className={entityType === "personal" ? "bg-[#1a2744]" : ""}
                    data-testid="type-personal"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Personal
                  </Button>
                  <Button
                    variant={entityType === "company" ? "default" : "outline"}
                    onClick={() => setEntityType("company")}
                    className={entityType === "company" ? "bg-[#1a2744]" : ""}
                    data-testid="type-company"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Company
                  </Button>
                  <Button
                    variant={entityType === "trust" ? "default" : "outline"}
                    onClick={() => setEntityType("trust")}
                    className={entityType === "trust" ? "bg-[#1a2744]" : ""}
                    data-testid="type-trust"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Trust
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="people">
              <Users className="h-4 w-4 mr-2" />
              People
            </TabsTrigger>
            {entityType === "company" && (
              <TabsTrigger value="companies">
                <Briefcase className="h-4 w-4 mr-2" />
                Companies
              </TabsTrigger>
            )}
            {entityType === "trust" && (
              <TabsTrigger value="trusts">
                <Shield className="h-4 w-4 mr-2" />
                Trusts
              </TabsTrigger>
            )}
            <TabsTrigger value="properties">
              <Home className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="investments">
              <TrendingUp className="h-4 w-4 mr-2" />
              Investments
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <DollarSign className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
          </TabsList>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="">Personal Information</CardTitle>
                    <CardDescription>
                      Add up to 2 people (e.g., yourself and spouse/partner)
                    </CardDescription>
                  </div>
                  {people.length < 2 && (
                    <Button variant="outline" size="sm" onClick={addPerson} data-testid="add-person">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Person
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {people.map((person, index) => (
                  <div key={person.id} className="p-4 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <Badge variant="outline">Person {index + 1}</Badge>
                        </div>
                      </div>
                      {people.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removePerson(index)}
                          data-testid={`remove-person-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={person.name}
                          onChange={(e) => updatePerson(index, 'name', e.target.value)}
                          placeholder="Full Name"
                          data-testid={`person-${index}-name`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Age</Label>
                        <Input
                          type="number"
                          value={person.age}
                          onChange={(e) => updatePerson(index, 'age', Number(e.target.value))}
                          data-testid={`person-${index}-age`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taxable Income</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={person.taxable_income}
                            onChange={(e) => updatePerson(index, 'taxable_income', Number(e.target.value))}
                            className="pl-10"
                            data-testid={`person-${index}-income`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Employer Super (%)</Label>
                        <Input
                          type="number"
                          value={person.employer_super}
                          onChange={(e) => updatePerson(index, 'employer_super', Number(e.target.value))}
                          data-testid={`person-${index}-super`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Salary Sacrifice</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={person.salary_sacrifice}
                            onChange={(e) => updatePerson(index, 'salary_sacrifice', Number(e.target.value))}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Work-Related Deductions</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={person.deductions?.work_related || 0}
                            onChange={(e) => updatePerson(index, 'deductions.work_related', Number(e.target.value))}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Summary */}
                <div className="p-4 rounded-lg bg-[#1a2744]/5 flex justify-between items-center">
                  <span className="font-semibold">Combined Personal Income</span>
                  <span className="text-xl font-bold text-[#1a2744]">{formatCurrency(totalPersonalIncome)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          {entityType === "company" && (
            <TabsContent value="companies" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="">Company Structures</CardTitle>
                      <CardDescription>
                        Add multiple companies for analysis (e.g., operating company, holding company)
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCompany} data-testid="add-company">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Company
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {companies.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No companies added yet</p>
                      <Button variant="outline" className="mt-3" onClick={addCompany}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Company
                      </Button>
                    </div>
                  ) : (
                    companies.map((company, index) => (
                      <div key={company.id} className="p-4 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#D4A84C]/20 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-[#D4A84C]" />
                            </div>
                            <Badge className="bg-[#D4A84C]/10 text-[#D4A84C]">Company {index + 1}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeCompany(index)}
                            data-testid={`remove-company-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Company Name</Label>
                            <Input
                              value={company.name}
                              onChange={(e) => updateCompany(index, 'name', e.target.value)}
                              placeholder="Company Pty Ltd"
                              data-testid={`company-${index}-name`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ABN</Label>
                            <Input
                              value={company.abn}
                              onChange={(e) => updateCompany(index, 'abn', e.target.value)}
                              placeholder="XX XXX XXX XXX"
                              data-testid={`company-${index}-abn`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Base Rate Entity?</Label>
                            <div className="flex items-center gap-2 h-10">
                              <Switch
                                checked={company.is_base_rate_entity}
                                onCheckedChange={(v) => updateCompany(index, 'is_base_rate_entity', v)}
                              />
                              <span className="text-sm text-muted-foreground">
                                {company.is_base_rate_entity ? "25% tax rate" : "30% tax rate"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Annual Revenue</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={company.revenue}
                                onChange={(e) => updateCompany(index, 'revenue', Number(e.target.value))}
                                className="pl-10"
                                data-testid={`company-${index}-revenue`}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Business Expenses</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={company.expenses}
                                onChange={(e) => updateCompany(index, 'expenses', Number(e.target.value))}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Taxable Income</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={company.taxable_income}
                                onChange={(e) => updateCompany(index, 'taxable_income', Number(e.target.value))}
                                className="pl-10"
                                data-testid={`company-${index}-income`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Franking Account Balance</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={company.franking_account_balance}
                                onChange={(e) => updateCompany(index, 'franking_account_balance', Number(e.target.value))}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">Estimated Company Tax</p>
                            <p className="text-lg font-bold text-[#D4A84C]">
                              {formatCurrency(company.taxable_income * (company.is_base_rate_entity ? 0.25 : 0.30))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {companies.length > 0 && (
                    <div className="p-4 rounded-lg bg-[#D4A84C]/10 flex justify-between items-center">
                      <span className="font-semibold">Total Company Income</span>
                      <span className="text-xl font-bold text-[#D4A84C]">{formatCurrency(totalCompanyIncome)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Trusts Tab */}
          {entityType === "trust" && (
            <TabsContent value="trusts" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="">Trust Structures</CardTitle>
                      <CardDescription>
                        Configure family trusts and discretionary trusts with beneficiary distributions
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addTrust} data-testid="add-trust">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Trust
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {trusts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No trusts added yet</p>
                      <Button variant="outline" className="mt-3" onClick={addTrust}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Trust
                      </Button>
                    </div>
                  ) : (
                    trusts.map((trust, index) => (
                      <div key={trust.id} className="p-4 rounded-lg border space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#1a2744]/20 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-[#1a2744]" />
                            </div>
                            <Badge className="bg-[#1a2744]/10 text-[#1a2744]">Trust {index + 1}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeTrust(index)}
                            data-testid={`remove-trust-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Trust Name</Label>
                            <Input
                              value={trust.name}
                              onChange={(e) => updateTrust(index, 'name', e.target.value)}
                              placeholder="Family Trust"
                              data-testid={`trust-${index}-name`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ABN</Label>
                            <Input
                              value={trust.abn}
                              onChange={(e) => updateTrust(index, 'abn', e.target.value)}
                              placeholder="XX XXX XXX XXX"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Trust Type</Label>
                            <select
                              value={trust.trust_type}
                              onChange={(e) => updateTrust(index, 'trust_type', e.target.value)}
                              className="w-full h-10 px-3 rounded-md border border-input bg-background"
                            >
                              <option value="discretionary">Discretionary</option>
                              <option value="unit">Unit Trust</option>
                              <option value="hybrid">Hybrid Trust</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Trustee Type</Label>
                            <select
                              value={trust.trustee_type}
                              onChange={(e) => updateTrust(index, 'trustee_type', e.target.value)}
                              className="w-full h-10 px-3 rounded-md border border-input bg-background"
                            >
                              <option value="individual">Individual Trustee</option>
                              <option value="corporate">Corporate Trustee</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Trustee Name</Label>
                            <Input
                              value={trust.trustee_name}
                              onChange={(e) => updateTrust(index, 'trustee_name', e.target.value)}
                              placeholder={trust.trustee_type === "corporate" ? "Trustee Pty Ltd" : "Full Name"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Net Trust Income</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={trust.net_income}
                                onChange={(e) => updateTrust(index, 'net_income', Number(e.target.value))}
                                className="pl-10"
                                data-testid={`trust-${index}-income`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Beneficiaries */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Beneficiaries & Distributions</h4>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addBeneficiary(index)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Beneficiary
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {trust.beneficiaries?.map((ben, bIndex) => (
                              <div key={ben.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                <div className="w-8 h-8 rounded-full bg-[#D4A84C]/20 flex items-center justify-center">
                                  <User className="h-4 w-4 text-[#D4A84C]" />
                                </div>
                                <Input
                                  value={ben.name}
                                  onChange={(e) => updateBeneficiary(index, bIndex, 'name', e.target.value)}
                                  className="flex-1"
                                  placeholder="Beneficiary Name"
                                />
                                <select
                                  value={ben.relationship}
                                  onChange={(e) => updateBeneficiary(index, bIndex, 'relationship', e.target.value)}
                                  className="w-32 h-10 px-2 rounded-md border border-input bg-background text-sm"
                                >
                                  <option value="family">Family</option>
                                  <option value="company">Company</option>
                                  <option value="other_trust">Other Trust</option>
                                </select>
                                <div className="flex items-center gap-1 w-24">
                                  <Input
                                    type="number"
                                    value={ben.distribution_percentage}
                                    onChange={(e) => updateBeneficiary(index, bIndex, 'distribution_percentage', Number(e.target.value))}
                                    className="w-16 text-center"
                                    min={0}
                                    max={100}
                                  />
                                  <span className="text-sm text-muted-foreground">%</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => removeBeneficiary(index, bIndex)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          {/* Distribution Summary */}
                          <div className="mt-3 p-3 rounded-lg bg-[#1a2744]/5 flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Distribution: {trust.beneficiaries?.reduce((sum, b) => sum + (b.distribution_percentage || 0), 0)}%
                            </span>
                            <span className="font-semibold text-[#1a2744]">
                              {formatCurrency(trust.net_income)} to distribute
                            </span>
                          </div>
                        </div>

                        {/* Trust Tax Note */}
                        <div className="p-3 rounded-lg bg-[#D4A84C]/10">
                          <p className="text-sm text-muted-foreground">
                            <strong>Note:</strong> Trusts don't pay tax directly. Income is distributed to beneficiaries 
                            who are taxed at their individual marginal rates. Undistributed income is taxed at 47%.
                          </p>
                        </div>
                      </div>
                    ))
                  )}

                  {trusts.length > 0 && (
                    <div className="p-4 rounded-lg bg-[#1a2744]/10 flex justify-between items-center">
                      <span className="font-semibold">Total Trust Income</span>
                      <span className="text-xl font-bold text-[#1a2744]">{formatCurrency(totalTrustIncome)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="">Investment Properties</CardTitle>
                    <CardDescription>
                      Add properties and assign ownership to individuals or companies
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addProperty} data-testid="add-property">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {investments.properties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No properties added yet</p>
                    <Button variant="outline" className="mt-3" onClick={addProperty}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Property
                    </Button>
                  </div>
                ) : (
                  investments.properties.map((property, index) => (
                    <div key={property.property_id} className="p-4 rounded-lg border space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                            <Home className="h-5 w-5 text-[#3B82F6]" />
                          </div>
                          <Input
                            value={property.name}
                            onChange={(e) => updateProperty(index, 'name', e.target.value)}
                            placeholder="Property Name"
                            className="w-48"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeProperty(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Property Value</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={property.value}
                              onChange={(e) => updateProperty(index, 'value', Number(e.target.value))}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Annual Rental Income</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={property.rental_income}
                              onChange={(e) => updateProperty(index, 'rental_income', Number(e.target.value))}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Mortgage Amount</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={property.mortgage_amount}
                              onChange={(e) => updateProperty(index, 'mortgage_amount', Number(e.target.value))}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Owner</Label>
                          <select
                            value={property.owner}
                            onChange={(e) => updateProperty(index, 'owner', e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          >
                            {getOwnerOptions().map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Interest Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={property.mortgage_rate}
                            onChange={(e) => updateProperty(index, 'mortgage_rate', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loan Term (years)</Label>
                          <Input
                            type="number"
                            value={property.mortgage_term_years}
                            onChange={(e) => updateProperty(index, 'mortgage_term_years', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Annual Expenses</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={property.annual_expenses}
                              onChange={(e) => updateProperty(index, 'annual_expenses', Number(e.target.value))}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Building Depreciation</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={property.depreciation_building}
                              onChange={(e) => updateProperty(index, 'depreciation_building', Number(e.target.value))}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="">Investment Portfolio</CardTitle>
                <CardDescription>Cash, shares, bonds, ETFs and superannuation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cash */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#10B981]" />
                      Cash & Deposits
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Cash Savings</Label>
                        <Input
                          type="number"
                          value={investments.cash_savings}
                          onChange={(e) => setInvestments({ ...investments, cash_savings: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Term Deposit</Label>
                        <Input
                          type="number"
                          value={investments.term_deposit_amount}
                          onChange={(e) => setInvestments({ ...investments, term_deposit_amount: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>TD Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={investments.term_deposit_rate}
                          onChange={(e) => setInvestments({ ...investments, term_deposit_rate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shares & ETFs */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#3B82F6]" />
                      Shares & ETFs
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Shares Value</Label>
                        <Input
                          type="number"
                          value={investments.shares_value}
                          onChange={(e) => setInvestments({ ...investments, shares_value: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dividend Yield (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={investments.shares_dividend_yield}
                          onChange={(e) => setInvestments({ ...investments, shares_dividend_yield: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ETF Value</Label>
                        <Input
                          type="number"
                          value={investments.etf_value}
                          onChange={(e) => setInvestments({ ...investments, etf_value: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bonds & Super */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <PiggyBank className="h-4 w-4 text-[#D4A84C]" />
                      Bonds & Super
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Bonds Value</Label>
                        <Input
                          type="number"
                          value={investments.bonds_value}
                          onChange={(e) => setInvestments({ ...investments, bonds_value: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bonds Yield (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={investments.bonds_yield}
                          onChange={(e) => setInvestments({ ...investments, bonds_yield: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SMSF Balance</Label>
                        <Input
                          type="number"
                          value={investments.smsf_balance}
                          onChange={(e) => setInvestments({ ...investments, smsf_balance: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#10B981]/10 flex justify-between items-center">
                  <span className="font-semibold">Total Investment Value (excl. property)</span>
                  <span className="text-xl font-bold text-[#10B981]">{formatCurrency(totalInvestmentValue)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="">Deductible Expenses</CardTitle>
                <CardDescription>Expenses that may be tax deductible</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>School Fees</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.school_fees}
                        onChange={(e) => setExpenses({ ...expenses, school_fees: Number(e.target.value) })}
                        className="pl-10"
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
                        onChange={(e) => setExpenses({ ...expenses, childcare: Number(e.target.value) })}
                        className="pl-10"
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
                        onChange={(e) => setExpenses({ ...expenses, health_insurance: Number(e.target.value) })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Work-Related</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.work_related}
                        onChange={(e) => setExpenses({ ...expenses, work_related: Number(e.target.value) })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Private Expenses</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={expenses.private_expenses}
                        onChange={(e) => setExpenses({ ...expenses, private_expenses: Number(e.target.value) })}
                        className="pl-10"
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
                        onChange={(e) => setExpenses({ ...expenses, other_deductible: Number(e.target.value) })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Label>Simulation Years</Label>
                  <Input
                    type="number"
                    value={simulationYears}
                    onChange={(e) => setSimulationYears(Number(e.target.value))}
                    className="w-32"
                    min={1}
                    max={30}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="border-[#10B981]">
            <CardHeader>
              <CardTitle className=" flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#10B981]" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Tax</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(analysisResult.tax_analysis?.tax_payable || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Effective Rate</p>
                  <p className="text-xl font-bold">
                    {(analysisResult.tax_analysis?.effective_rate || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Net Worth</p>
                  <p className="text-xl font-bold text-[#10B981]">
                    {formatCurrency(analysisResult.summary?.net_worth || 0)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Projected (Median)</p>
                  <p className="text-xl font-bold text-[#1a2744]">
                    {formatCurrency(analysisResult.monte_carlo?.median_outcome || 0)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={() => navigate("/reports")}
                  className="bg-[#1a2744] hover:bg-[#1a2744]/90"
                >
                  View Full Report
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ScenarioBuilder;
