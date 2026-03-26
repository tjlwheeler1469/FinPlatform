import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { toast } from 'sonner';
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, PiggyBank, Building, Building2, Users, Calendar,
  Target, Briefcase, ChevronRight, Download, RefreshCw, AlertTriangle, Plus, Trash2,
  CheckCircle2, Info, BarChart3, Wallet, Shield, Clock, Save, Upload, Home, Car,
  Landmark, ArrowUpDown, CircleDollarSign, Settings, Play, Eye, Edit2, X
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, ReferenceLine
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== CONSTANTS ====================

const ENTITY_TYPES = [
  { value: 'personal', label: 'Personal', icon: '👤', color: '#3b82f6' },
  { value: 'joint', label: 'Joint', icon: '👥', color: '#8b5cf6' },
  { value: 'company', label: 'Company', icon: '🏢', color: '#f59e0b' },
  { value: 'trust', label: 'Family Trust', icon: '🏛️', color: '#22c55e' },
  { value: 'smsf', label: 'SMSF', icon: '💼', color: '#ec4899' },
];

const ASSET_TYPES = [
  { value: 'cash', label: 'Cash', defaultYield: 4.5 },
  { value: 'term_deposit', label: 'Term Deposit', defaultYield: 5.0 },
  { value: 'shares_au', label: 'Australian Shares', defaultYield: 8.5 },
  { value: 'shares_intl', label: 'International Shares', defaultYield: 9.0 },
  { value: 'etf', label: 'ETFs', defaultYield: 8.0 },
  { value: 'managed_fund', label: 'Managed Funds', defaultYield: 7.5 },
  { value: 'property', label: 'Property', defaultYield: 6.0 },
  { value: 'super_accum', label: 'Super (Accumulation)', defaultYield: 7.5 },
  { value: 'super_pension', label: 'Super (Pension)', defaultYield: 7.0 },
  { value: 'bonds', label: 'Bonds', defaultYield: 5.5 },
  { value: 'crypto', label: 'Crypto', defaultYield: 12.0 },
];

const EXPENSE_CATEGORIES = [
  { value: 'housing', label: 'Housing & Utilities', default: 2500 },
  { value: 'food', label: 'Food & Groceries', default: 1200 },
  { value: 'transport', label: 'Transport', default: 800 },
  { value: 'health', label: 'Health & Medical', default: 400 },
  { value: 'insurance', label: 'Insurance', default: 300 },
  { value: 'entertainment', label: 'Entertainment & Dining', default: 600 },
  { value: 'travel', label: 'Travel & Holidays', default: 500 },
  { value: 'personal', label: 'Personal & Clothing', default: 300 },
  { value: 'education', label: 'Education', default: 0 },
  { value: 'other', label: 'Other', default: 400 },
];

const CGT_DISCOUNT = {
  personal: 0.5,  // 50% discount for individuals
  joint: 0.5,
  trust: 0.5,     // Can distribute to individuals
  company: 0,     // No CGT discount
  smsf: 0.333,    // 1/3 discount in accumulation, 0% in pension
};

const TAX_BRACKETS_2024 = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.30 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 }
];

const SUPER_MINIMUM_DRAWDOWN = {
  55: 0.04, 60: 0.04, 65: 0.05, 70: 0.05, 75: 0.06, 80: 0.07, 85: 0.09, 90: 0.11, 95: 0.14
};

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

const calculateTax = (income) => {
  if (income <= 0) return 0;
  let tax = 0;
  for (const bracket of TAX_BRACKETS_2024) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }
  }
  tax += income > 24276 ? income * 0.02 : 0; // Medicare levy
  return Math.round(tax);
};

const getMinimumDrawdownRate = (age) => {
  const ages = Object.keys(SUPER_MINIMUM_DRAWDOWN).map(Number).sort((a, b) => a - b);
  for (let i = ages.length - 1; i >= 0; i--) {
    if (age >= ages[i]) return SUPER_MINIMUM_DRAWDOWN[ages[i]];
  }
  return 0.04;
};

// ==================== MAIN COMPONENT ====================

export default function RetirementPlanner() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [projectionData, setProjectionData] = useState(null);

  // ==================== PEOPLE STATE ====================
  const [people, setPeople] = useState([
    { id: 1, name: 'Primary', currentAge: 45, retirementAge: 65, lifeExpectancy: 90, gender: 'male' },
  ]);
  const [isCouple, setIsCouple] = useState(false);

  // ==================== ASSETS STATE ====================
  const [assets, setAssets] = useState([
    { id: 1, name: 'Family Home', type: 'property', entity: 'joint', value: 1200000, costBase: 600000, yield: 5.0, isAssessable: false },
    { id: 2, name: 'Share Portfolio', type: 'shares_au', entity: 'personal', value: 250000, costBase: 150000, yield: 8.5, isAssessable: true },
    { id: 3, name: 'Super - Primary', type: 'super_accum', entity: 'smsf', value: 450000, costBase: 450000, yield: 7.5, isAssessable: true },
    { id: 4, name: 'Term Deposit', type: 'term_deposit', entity: 'personal', value: 100000, costBase: 100000, yield: 5.0, isAssessable: true },
    { id: 5, name: 'Investment Property', type: 'property', entity: 'trust', value: 650000, costBase: 400000, yield: 6.0, isAssessable: true },
  ]);

  // ==================== LIABILITIES STATE ====================
  const [liabilities, setLiabilities] = useState([
    { id: 1, name: 'Home Mortgage', entity: 'joint', balance: 350000, interestRate: 6.5, monthlyPayment: 2800, yearsRemaining: 15 },
    { id: 2, name: 'Investment Loan', entity: 'trust', balance: 200000, interestRate: 7.0, monthlyPayment: 1500, yearsRemaining: 20 },
  ]);

  // ==================== INCOME STATE ====================
  const [incomes, setIncomes] = useState([
    { id: 1, name: 'Salary - Primary', entity: 'personal', amount: 150000, type: 'employment', endsAtRetirement: true },
    { id: 2, name: 'Rental Income', entity: 'trust', amount: 36000, type: 'rental', endsAtRetirement: false },
  ]);

  // ==================== EXPENSES STATE ====================
  const [expenses, setExpenses] = useState(
    EXPENSE_CATEGORIES.map((cat, idx) => ({
      id: idx + 1,
      category: cat.value,
      label: cat.label,
      monthly: cat.default,
      escalationRate: 3.0, // Above inflation for some categories
    }))
  );

  // ==================== ONE-OFF EXPENDITURES ====================
  const [oneOffExpenses, setOneOffExpenses] = useState([
    { id: 1, name: 'New Car', year: 2028, amount: 60000 },
    { id: 2, name: 'Home Renovation', year: 2030, amount: 80000 },
    { id: 3, name: 'Overseas Trip', year: 2032, amount: 25000 },
  ]);

  // ==================== PLANNED ASSET SALES (CGT Events) ====================
  const [plannedSales, setPlannedSales] = useState([
    { id: 1, assetId: 5, year: 2035, percentToSell: 100, reason: 'Downsize to fund retirement' },
  ]);

  // ==================== GLOBAL ASSUMPTIONS ====================
  const [assumptions, setAssumptions] = useState({
    inflationRate: 2.5,
    wageGrowth: 3.0,
    superContributionRate: 12.0, // Employer SG
    salarySacrifice: 10000,
    nonConcessionalContrib: 0,
    drawdownStrategy: 'percentage', // 'minimum', 'percentage', 'fixed'
    drawdownRate: 5.0,
    fixedDrawdown: 60000,
    includeAgePension: true,
    agePensionAge: 67,
  });

  // ==================== ASSET YIELD OVERRIDES ====================
  const [yieldOverrides, setYieldOverrides] = useState({
    shares_au: 8.5,
    shares_intl: 9.0,
    etf: 8.0,
    managed_fund: 7.5,
    property: 6.0,
    super_accum: 7.5,
    super_pension: 7.0,
    bonds: 5.5,
    cash: 4.5,
    term_deposit: 5.0,
    crypto: 12.0,
  });

  // ==================== CALCULATIONS ====================

  // Import from Family Wealth Dashboard (Net Worth)
  const importFromNetWorth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wealth-data/snapshot/demo_client`);
      const data = await response.json();
      
      if (data.assets) {
        // Map API assets to our format
        const mappedAssets = data.assets.map((a, idx) => ({
          id: idx + 1,
          name: a.name,
          type: a.type,
          entity: a.entity,
          value: a.value,
          costBase: a.cost_base || a.value * 0.7,
          yield: a.annual_yield || 7,
          isAssessable: a.is_assessable !== false
        }));
        setAssets(mappedAssets);
      }
      
      if (data.liabilities) {
        const mappedLiabilities = data.liabilities.map((l, idx) => ({
          id: idx + 1,
          name: l.name,
          entity: l.entity,
          balance: l.balance,
          interestRate: l.interest_rate || 6.5,
          monthlyPayment: l.monthly_payment || 0,
          yearsRemaining: l.years_remaining || 10
        }));
        setLiabilities(mappedLiabilities);
      }
      
      if (data.incomes) {
        const mappedIncomes = data.incomes.map((i, idx) => ({
          id: idx + 1,
          name: i.name,
          entity: i.entity,
          amount: i.amount,
          type: i.type || 'other',
          endsAtRetirement: i.ends_at_retirement !== false
        }));
        setIncomes(mappedIncomes);
      }
      
      if (data.people && data.people.length > 0) {
        const mappedPeople = data.people.map(p => ({
          id: p.id,
          name: p.name,
          currentAge: p.current_age,
          retirementAge: p.retirement_age || 65,
          lifeExpectancy: p.life_expectancy || 90,
          gender: p.gender || 'male'
        }));
        setPeople(mappedPeople);
        setIsCouple(data.is_couple || mappedPeople.length > 1);
      }
      
      toast.success('Data imported from Net Worth dashboard');
      calculateProjection();
    } catch (error) {
      console.error('Failed to import wealth data:', error);
      toast.error('Failed to import data. Using sample data.');
    }
    setLoading(false);
  };

  // Calculate Age Pension eligibility
  const calculateAgePension = async () => {
    try {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - primaryPerson.currentAge);
      
      const response = await fetch(`${API_URL}/api/age-pension/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person: {
            name: primaryPerson.name,
            date_of_birth: dob.toISOString().split('T')[0],
            is_homeowner: true,
            residency_years: 30
          },
          partner: isCouple ? {
            name: people[1]?.name || 'Partner',
            date_of_birth: (() => {
              const d = new Date();
              d.setFullYear(d.getFullYear() - (people[1]?.currentAge || 43));
              return d.toISOString().split('T')[0];
            })(),
            is_homeowner: true,
            residency_years: 30
          } : null,
          assets: {
            financial_assets: assets.filter(a => a.isAssessable && a.type !== 'property').reduce((s, a) => s + a.value, 0),
            real_assets: assets.filter(a => a.isAssessable && a.type === 'property').reduce((s, a) => s + a.value, 0),
            personal_assets: 20000,
            home_value: assets.filter(a => !a.isAssessable && a.type === 'property').reduce((s, a) => s + a.value, 0)
          },
          income: {
            employment_income: incomes.filter(i => i.type === 'employment').reduce((s, i) => s + i.amount, 0),
            investment_income: incomes.filter(i => i.type !== 'employment').reduce((s, i) => s + i.amount, 0),
            super_income_stream: 0,
            other_income: 0
          }
        })
      });
      
      const result = await response.json();
      
      if (result.eligible) {
        toast.success(`Age Pension: ${formatCurrency(result.annual_pension)}/year eligible`);
      } else {
        toast.info(`Age Pension: ${result.reason}`);
      }
      
      return result;
    } catch (error) {
      console.error('Age pension calculation failed:', error);
      return null;
    }
  };

  const totalAssets = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.value, 0);
  }, [assets]);

  const totalLiabilities = useMemo(() => {
    return liabilities.reduce((sum, l) => sum + l.balance, 0);
  }, [liabilities]);

  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  const assetsByEntity = useMemo(() => {
    const grouped = {};
    ENTITY_TYPES.forEach(e => { grouped[e.value] = 0; });
    assets.forEach(a => {
      grouped[a.entity] = (grouped[a.entity] || 0) + a.value;
    });
    return grouped;
  }, [assets]);

  const totalAnnualIncome = useMemo(() => {
    return incomes.reduce((sum, i) => sum + i.amount, 0);
  }, [incomes]);

  const totalMonthlyExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.monthly, 0);
  }, [expenses]);

  const annualExpenses = totalMonthlyExpenses * 12;

  const primaryPerson = people[0];
  const yearsToRetirement = primaryPerson.retirementAge - primaryPerson.currentAge;
  const retirementYears = primaryPerson.lifeExpectancy - primaryPerson.retirementAge;

  // ==================== PROJECTION CALCULATION ====================

  const calculateProjection = useCallback(() => {
    setLoading(true);
    
    const projectionYears = primaryPerson.lifeExpectancy - primaryPerson.currentAge + 5;
    const startYear = new Date().getFullYear();
    const projection = [];
    
    // Initialize tracking variables
    let currentAssets = JSON.parse(JSON.stringify(assets));
    let currentLiabilities = JSON.parse(JSON.stringify(liabilities));
    let accumulatedSuper = assets.filter(a => a.type === 'super_accum' || a.type === 'super_pension').reduce((s, a) => s + a.value, 0);
    
    for (let year = 0; year <= projectionYears; year++) {
      const currentYear = startYear + year;
      const age = primaryPerson.currentAge + year;
      const isRetired = age >= primaryPerson.retirementAge;
      const inflationFactor = Math.pow(1 + assumptions.inflationRate / 100, year);
      
      // Calculate income for this year
      let yearlyIncome = 0;
      let employmentIncome = 0;
      let investmentIncome = 0;
      let pensionIncome = 0;
      
      incomes.forEach(inc => {
        if (inc.endsAtRetirement && isRetired) return;
        const inflatedAmount = inc.amount * Math.pow(1 + assumptions.wageGrowth / 100, year);
        if (inc.type === 'employment') {
          employmentIncome += inflatedAmount;
        } else {
          investmentIncome += inflatedAmount;
        }
        yearlyIncome += inflatedAmount;
      });
      
      // Super contributions (pre-retirement)
      let superContributions = 0;
      if (!isRetired && employmentIncome > 0) {
        superContributions = (employmentIncome * assumptions.superContributionRate / 100) + assumptions.salarySacrifice + assumptions.nonConcessionalContrib;
      }
      
      // Calculate expenses
      let yearlyExpenses = expenses.reduce((sum, e) => {
        const escalationFactor = Math.pow(1 + e.escalationRate / 100, year);
        return sum + (e.monthly * 12 * escalationFactor);
      }, 0);
      
      // Add one-off expenses
      const oneOffsThisYear = oneOffExpenses.filter(o => o.year === currentYear);
      const oneOffTotal = oneOffsThisYear.reduce((sum, o) => sum + o.amount, 0);
      yearlyExpenses += oneOffTotal;
      
      // Process planned asset sales (CGT events)
      let cgtPayable = 0;
      const salesThisYear = plannedSales.filter(s => s.year === currentYear);
      salesThisYear.forEach(sale => {
        const asset = currentAssets.find(a => a.id === sale.assetId);
        if (asset) {
          const saleValue = asset.value * (sale.percentToSell / 100);
          const costBasePortion = asset.costBase * (sale.percentToSell / 100);
          const capitalGain = saleValue - costBasePortion;
          
          if (capitalGain > 0) {
            const discount = CGT_DISCOUNT[asset.entity] || 0;
            const taxableGain = capitalGain * (1 - discount);
            cgtPayable += taxableGain * 0.37; // Approximate marginal rate
          }
          
          // Update asset
          asset.value -= saleValue;
          asset.costBase -= costBasePortion;
        }
      });
      
      // Calculate investment returns
      let totalReturns = 0;
      currentAssets.forEach(asset => {
        const assetYield = yieldOverrides[asset.type] || asset.yield || 7;
        const returns = asset.value * (assetYield / 100);
        totalReturns += returns;
        asset.value += returns; // Compound
      });
      
      // Pay down liabilities
      currentLiabilities.forEach(liability => {
        const yearlyPayment = liability.monthlyPayment * 12;
        const interestPaid = liability.balance * (liability.interestRate / 100);
        const principalPaid = Math.min(yearlyPayment - interestPaid, liability.balance);
        liability.balance = Math.max(0, liability.balance - principalPaid);
      });
      
      // Super growth and drawdown
      if (!isRetired) {
        accumulatedSuper = accumulatedSuper * (1 + (yieldOverrides.super_accum || 7.5) / 100) + superContributions;
      } else {
        // Drawdown phase
        let drawdownAmount = 0;
        const minRate = getMinimumDrawdownRate(age);
        
        if (assumptions.drawdownStrategy === 'minimum') {
          drawdownAmount = accumulatedSuper * minRate;
        } else if (assumptions.drawdownStrategy === 'percentage') {
          drawdownAmount = Math.max(accumulatedSuper * (assumptions.drawdownRate / 100), accumulatedSuper * minRate);
        } else {
          drawdownAmount = Math.max(assumptions.fixedDrawdown * inflationFactor, accumulatedSuper * minRate);
        }
        
        pensionIncome = drawdownAmount;
        accumulatedSuper = Math.max(0, accumulatedSuper * (1 + (yieldOverrides.super_pension || 7) / 100) - drawdownAmount);
      }
      
      // Age Pension (simplified)
      let agePension = 0;
      if (assumptions.includeAgePension && age >= assumptions.agePensionAge) {
        const assessableAssets = currentAssets.filter(a => a.isAssessable).reduce((s, a) => s + a.value, 0) + accumulatedSuper;
        const assetThreshold = isCouple ? 419000 : 280000;
        const maxPension = isCouple ? 44000 : 29000;
        
        if (assessableAssets < assetThreshold) {
          agePension = maxPension;
        } else {
          const reduction = (assessableAssets - assetThreshold) * 0.03;
          agePension = Math.max(0, maxPension - reduction);
        }
      }
      
      // Calculate tax
      const taxableIncome = employmentIncome + investmentIncome + pensionIncome * 0.6; // 60% of pension taxable over 60
      const tax = calculateTax(taxableIncome);
      
      // Net position
      const totalIncome = yearlyIncome + pensionIncome + agePension + totalReturns;
      const totalOutgoing = yearlyExpenses + tax + cgtPayable;
      const netCashflow = totalIncome - totalOutgoing;
      
      const totalAssetsValue = currentAssets.reduce((s, a) => s + a.value, 0) + accumulatedSuper;
      const totalLiabilitiesValue = currentLiabilities.reduce((s, l) => s + l.balance, 0);
      
      projection.push({
        year: currentYear,
        age,
        isRetired,
        income: Math.round(yearlyIncome),
        employmentIncome: Math.round(employmentIncome),
        investmentIncome: Math.round(investmentIncome),
        pensionIncome: Math.round(pensionIncome),
        agePension: Math.round(agePension),
        superBalance: Math.round(accumulatedSuper),
        superContributions: Math.round(superContributions),
        expenses: Math.round(yearlyExpenses),
        oneOffExpenses: oneOffTotal,
        tax: Math.round(tax),
        cgt: Math.round(cgtPayable),
        investmentReturns: Math.round(totalReturns),
        totalAssets: Math.round(totalAssetsValue),
        totalLiabilities: Math.round(totalLiabilitiesValue),
        netWorth: Math.round(totalAssetsValue - totalLiabilitiesValue),
        netCashflow: Math.round(netCashflow),
        inflationFactor: inflationFactor.toFixed(2),
      });
    }
    
    setProjectionData(projection);
    setLoading(false);
    toast.success('Projection calculated successfully');
  }, [assets, liabilities, incomes, expenses, oneOffExpenses, plannedSales, assumptions, yieldOverrides, primaryPerson, isCouple]);

  // Auto-calculate on first load
  useEffect(() => {
    calculateProjection();
  }, []);

  // ==================== ASSET MANAGEMENT ====================

  const addAsset = () => {
    const newId = Math.max(...assets.map(a => a.id), 0) + 1;
    setAssets([...assets, {
      id: newId,
      name: 'New Asset',
      type: 'cash',
      entity: 'personal',
      value: 0,
      costBase: 0,
      yield: 4.5,
      isAssessable: true
    }]);
  };

  const updateAsset = (id, field, value) => {
    setAssets(assets.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAsset = (id) => {
    setAssets(assets.filter(a => a.id !== id));
  };

  // ==================== LIABILITY MANAGEMENT ====================

  const addLiability = () => {
    const newId = Math.max(...liabilities.map(l => l.id), 0) + 1;
    setLiabilities([...liabilities, {
      id: newId,
      name: 'New Liability',
      entity: 'personal',
      balance: 0,
      interestRate: 6.5,
      monthlyPayment: 0,
      yearsRemaining: 10
    }]);
  };

  const updateLiability = (id, field, value) => {
    setLiabilities(liabilities.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLiability = (id) => {
    setLiabilities(liabilities.filter(l => l.id !== id));
  };

  // ==================== INCOME MANAGEMENT ====================

  const addIncome = () => {
    const newId = Math.max(...incomes.map(i => i.id), 0) + 1;
    setIncomes([...incomes, {
      id: newId,
      name: 'New Income',
      entity: 'personal',
      amount: 0,
      type: 'other',
      endsAtRetirement: false
    }]);
  };

  const updateIncome = (id, field, value) => {
    setIncomes(incomes.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeIncome = (id) => {
    setIncomes(incomes.filter(i => i.id !== id));
  };

  // ==================== ONE-OFF EXPENSE MANAGEMENT ====================

  const addOneOff = () => {
    const newId = Math.max(...oneOffExpenses.map(o => o.id), 0) + 1;
    setOneOffExpenses([...oneOffExpenses, {
      id: newId,
      name: 'New Expense',
      year: new Date().getFullYear() + 5,
      amount: 10000
    }]);
  };

  const updateOneOff = (id, field, value) => {
    setOneOffExpenses(oneOffExpenses.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const removeOneOff = (id) => {
    setOneOffExpenses(oneOffExpenses.filter(o => o.id !== id));
  };

  // ==================== PLANNED SALES MANAGEMENT ====================

  const addPlannedSale = () => {
    const newId = Math.max(...plannedSales.map(s => s.id), 0) + 1;
    setPlannedSales([...plannedSales, {
      id: newId,
      assetId: assets[0]?.id || 1,
      year: primaryPerson.retirementAge + new Date().getFullYear() - primaryPerson.currentAge,
      percentToSell: 100,
      reason: ''
    }]);
  };

  const updatePlannedSale = (id, field, value) => {
    setPlannedSales(plannedSales.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removePlannedSale = (id) => {
    setPlannedSales(plannedSales.filter(s => s.id !== id));
  };

  // ==================== RENDER FUNCTIONS ====================

  const EntityBadge = ({ entity }) => {
    const entityInfo = ENTITY_TYPES.find(e => e.value === entity);
    return (
      <Badge variant="outline" style={{ borderColor: entityInfo?.color, color: entityInfo?.color }}>
        {entityInfo?.icon} {entityInfo?.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="retirement-planner-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <PiggyBank className="h-8 w-8 text-primary" />
              Retirement Planner
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive retirement planning with multi-entity support, CGT modeling, and variable assumptions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={importFromNetWorth} disabled={loading}>
              <Upload className={`h-4 w-4 mr-2`} />
              Import from Net Worth
            </Button>
            <Button variant="outline" onClick={calculateAgePension} disabled={loading}>
              <Shield className="h-4 w-4 mr-2" />
              Check Age Pension
            </Button>
            <Button variant="outline" onClick={calculateProjection} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
            <Button onClick={calculateProjection} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              Run Projection
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{formatCurrency(netWorth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Annual Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalAnnualIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Years to Retirement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{yearsToRetirement} years</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalMonthlyExpenses)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" data-testid="overview-tab">
              <Eye className="h-4 w-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="people" data-testid="people-tab">
              <Users className="h-4 w-4 mr-2" /> People
            </TabsTrigger>
            <TabsTrigger value="assets" data-testid="assets-tab">
              <Wallet className="h-4 w-4 mr-2" /> Assets
            </TabsTrigger>
            <TabsTrigger value="income" data-testid="income-tab">
              <DollarSign className="h-4 w-4 mr-2" /> Income
            </TabsTrigger>
            <TabsTrigger value="expenses" data-testid="expenses-tab">
              <TrendingDown className="h-4 w-4 mr-2" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="assumptions" data-testid="assumptions-tab">
              <Settings className="h-4 w-4 mr-2" /> Assumptions
            </TabsTrigger>
            <TabsTrigger value="projection" data-testid="projection-tab">
              <BarChart3 className="h-4 w-4 mr-2" /> Projection
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Net Worth by Entity */}
              <Card>
                <CardHeader>
                  <CardTitle>Assets by Entity</CardTitle>
                  <CardDescription>Distribution across ownership structures</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ENTITY_TYPES.map(e => ({
                            name: e.label,
                            value: assetsByEntity[e.value] || 0,
                            color: e.color
                          })).filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {ENTITY_TYPES.map((e, idx) => (
                            <Cell key={e.value} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {ENTITY_TYPES.map(e => (
                      <div key={e.value} className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="flex items-center gap-2">
                          <span>{e.icon}</span>
                          <span className="text-sm">{e.label}</span>
                        </span>
                        <span className="font-medium">{formatCurrency(assetsByEntity[e.value] || 0)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Retirement Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Retirement Timeline</CardTitle>
                  <CardDescription>Key milestones and phases</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-500 text-white">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Current Age</p>
                          <p className="text-sm text-muted-foreground">{primaryPerson.currentAge} years old</p>
                        </div>
                      </div>
                      <Badge>Now</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500 text-white">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Retirement</p>
                          <p className="text-sm text-muted-foreground">Age {primaryPerson.retirementAge} ({yearsToRetirement} years)</p>
                        </div>
                      </div>
                      <Badge variant="outline">Accumulation Phase</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-500 text-white">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Age Pension Eligible</p>
                          <p className="text-sm text-muted-foreground">Age {assumptions.agePensionAge}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Decumulation Phase</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-purple-500 text-white">
                          <Target className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Planning Horizon</p>
                          <p className="text-sm text-muted-foreground">Age {primaryPerson.lifeExpectancy}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{retirementYears} retirement years</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projection Chart */}
            {projectionData && (
              <Card>
                <CardHeader>
                  <CardTitle>Net Worth Projection</CardTitle>
                  <CardDescription>Projected wealth over time with all assumptions applied</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(v) => formatCurrency(v)}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <ReferenceLine x={new Date().getFullYear() + yearsToRetirement} stroke="#f59e0b" label="Retirement" strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="totalAssets" name="Total Assets" fill="#22c55e" fillOpacity={0.3} stroke="#22c55e" />
                        <Area type="monotone" dataKey="superBalance" name="Super Balance" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" />
                        <Area type="monotone" dataKey="totalLiabilities" name="Liabilities" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" />
                        <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* People Tab */}
          <TabsContent value="people" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>People & Ages</CardTitle>
                    <CardDescription>Configure individuals and their retirement timeline</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Couple</Label>
                    <Switch
                      checked={isCouple}
                      onCheckedChange={(checked) => {
                        setIsCouple(checked);
                        if (checked && people.length === 1) {
                          setPeople([...people, { id: 2, name: 'Partner', currentAge: 43, retirementAge: 65, lifeExpectancy: 92, gender: 'female' }]);
                        } else if (!checked) {
                          setPeople([people[0]]);
                        }
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {people.map((person, idx) => (
                    <div key={person.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-4">
                        <Input
                          value={person.name}
                          onChange={(e) => {
                            const updated = [...people];
                            updated[idx].name = e.target.value;
                            setPeople(updated);
                          }}
                          className="w-48 font-medium"
                        />
                        <Select
                          value={person.gender}
                          onValueChange={(v) => {
                            const updated = [...people];
                            updated[idx].gender = v;
                            setPeople(updated);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>Current Age: {person.currentAge}</Label>
                          <Slider
                            value={[person.currentAge]}
                            onValueChange={([v]) => {
                              const updated = [...people];
                              updated[idx].currentAge = v;
                              setPeople(updated);
                            }}
                            min={18}
                            max={80}
                            step={1}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Retirement Age: {person.retirementAge}</Label>
                          <Slider
                            value={[person.retirementAge]}
                            onValueChange={([v]) => {
                              const updated = [...people];
                              updated[idx].retirementAge = v;
                              setPeople(updated);
                            }}
                            min={55}
                            max={75}
                            step={1}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Life Expectancy: {person.lifeExpectancy}</Label>
                          <Slider
                            value={[person.lifeExpectancy]}
                            onValueChange={([v]) => {
                              const updated = [...people];
                              updated[idx].lifeExpectancy = v;
                              setPeople(updated);
                            }}
                            min={70}
                            max={105}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assets & Investments</CardTitle>
                    <CardDescription>All assets across entities with CGT cost bases</CardDescription>
                  </div>
                  <Button onClick={addAsset}>
                    <Plus className="h-4 w-4 mr-2" /> Add Asset
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Cost Base</TableHead>
                      <TableHead className="text-right">Yield %</TableHead>
                      <TableHead>Assessable</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map(asset => (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <Input
                            value={asset.name}
                            onChange={(e) => updateAsset(asset.id, 'name', e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={asset.type} onValueChange={(v) => updateAsset(asset.id, 'type', v)}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSET_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={asset.entity} onValueChange={(v) => updateAsset(asset.id, 'entity', v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTITY_TYPES.map(e => (
                                <SelectItem key={e.value} value={e.value}>{e.icon} {e.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={asset.value}
                            onChange={(e) => updateAsset(asset.id, 'value', parseFloat(e.target.value) || 0)}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={asset.costBase}
                            onChange={(e) => updateAsset(asset.id, 'costBase', parseFloat(e.target.value) || 0)}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.1"
                            value={asset.yield}
                            onChange={(e) => updateAsset(asset.id, 'yield', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={asset.isAssessable}
                            onCheckedChange={(v) => updateAsset(asset.id, 'isAssessable', v)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeAsset(asset.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="font-medium">Total Assets</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(totalAssets)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Liabilities */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Liabilities</CardTitle>
                    <CardDescription>Mortgages, loans, and other debts</CardDescription>
                  </div>
                  <Button onClick={addLiability} variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Liability
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Interest %</TableHead>
                      <TableHead className="text-right">Monthly Payment</TableHead>
                      <TableHead className="text-right">Years Left</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liabilities.map(liability => (
                      <TableRow key={liability.id}>
                        <TableCell>
                          <Input
                            value={liability.name}
                            onChange={(e) => updateLiability(liability.id, 'name', e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={liability.entity} onValueChange={(v) => updateLiability(liability.id, 'entity', v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTITY_TYPES.map(e => (
                                <SelectItem key={e.value} value={e.value}>{e.icon} {e.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={liability.balance}
                            onChange={(e) => updateLiability(liability.id, 'balance', parseFloat(e.target.value) || 0)}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.1"
                            value={liability.interestRate}
                            onChange={(e) => updateLiability(liability.id, 'interestRate', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={liability.monthlyPayment}
                            onChange={(e) => updateLiability(liability.id, 'monthlyPayment', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={liability.yearsRemaining}
                            onChange={(e) => updateLiability(liability.id, 'yearsRemaining', parseInt(e.target.value) || 0)}
                            className="w-16 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeLiability(liability.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="font-medium">Total Liabilities</span>
                  <span className="text-xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Planned Asset Sales (CGT Events) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Planned Asset Sales (CGT Events)</CardTitle>
                    <CardDescription>Schedule future asset sales and model CGT impact</CardDescription>
                  </div>
                  <Button onClick={addPlannedSale} variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Sale
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>% to Sell</TableHead>
                      <TableHead>Est. CGT</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plannedSales.map(sale => {
                      const asset = assets.find(a => a.id === sale.assetId);
                      const saleValue = asset ? asset.value * (sale.percentToSell / 100) : 0;
                      const costBase = asset ? asset.costBase * (sale.percentToSell / 100) : 0;
                      const gain = saleValue - costBase;
                      const discount = asset ? (CGT_DISCOUNT[asset.entity] || 0) : 0;
                      const estCGT = gain > 0 ? gain * (1 - discount) * 0.37 : 0;
                      
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <Select value={sale.assetId.toString()} onValueChange={(v) => updatePlannedSale(sale.id, 'assetId', parseInt(v))}>
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {assets.map(a => (
                                  <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={sale.year}
                              onChange={(e) => updatePlannedSale(sale.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={sale.percentToSell}
                              onChange={(e) => updatePlannedSale(sale.id, 'percentToSell', parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min={0}
                              max={100}
                            />
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatCurrency(estCGT)}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={sale.reason}
                              onChange={(e) => updatePlannedSale(sale.id, 'reason', e.target.value)}
                              placeholder="Reason for sale"
                              className="w-48"
                            />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removePlannedSale(sale.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Income Sources</CardTitle>
                    <CardDescription>Employment, investment, and other income streams</CardDescription>
                  </div>
                  <Button onClick={addIncome}>
                    <Plus className="h-4 w-4 mr-2" /> Add Income
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Annual Amount</TableHead>
                      <TableHead>Ends at Retirement</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.map(income => (
                      <TableRow key={income.id}>
                        <TableCell>
                          <Input
                            value={income.name}
                            onChange={(e) => updateIncome(income.id, 'name', e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={income.entity} onValueChange={(v) => updateIncome(income.id, 'entity', v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ENTITY_TYPES.map(e => (
                                <SelectItem key={e.value} value={e.value}>{e.icon} {e.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={income.type} onValueChange={(v) => updateIncome(income.id, 'type', v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employment">Employment</SelectItem>
                              <SelectItem value="rental">Rental</SelectItem>
                              <SelectItem value="dividend">Dividends</SelectItem>
                              <SelectItem value="interest">Interest</SelectItem>
                              <SelectItem value="business">Business</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={income.amount}
                            onChange={(e) => updateIncome(income.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-28 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={income.endsAtRetirement}
                            onCheckedChange={(v) => updateIncome(income.id, 'endsAtRetirement', v)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeIncome(income.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="font-medium">Total Annual Income</span>
                  <span className="text-xl font-bold">{formatCurrency(totalAnnualIncome)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regular Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Expenses</CardTitle>
                  <CardDescription>Regular living expenses with escalation rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenses.map(expense => (
                      <div key={expense.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div className="flex-1">
                          <Label className="text-sm">{expense.label}</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={expense.monthly}
                              onChange={(e) => {
                                setExpenses(expenses.map(exp => 
                                  exp.id === expense.id ? { ...exp, monthly: parseFloat(e.target.value) || 0 } : exp
                                ));
                              }}
                              className="w-24"
                            />
                            <span className="text-muted-foreground">/month</span>
                          </div>
                        </div>
                        <div className="w-32">
                          <Label className="text-xs text-muted-foreground">Escalation %</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={expense.escalationRate}
                            onChange={(e) => {
                              setExpenses(expenses.map(exp => 
                                exp.id === expense.id ? { ...exp, escalationRate: parseFloat(e.target.value) || 0 } : exp
                              ));
                            }}
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-medium">Total Monthly</span>
                    <span className="text-xl font-bold">{formatCurrency(totalMonthlyExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Total Annual</span>
                    <span className="text-lg font-medium">{formatCurrency(annualExpenses)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* One-Off Expenditures */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>One-Off Expenditures</CardTitle>
                      <CardDescription>Major future expenses (car, renovation, travel)</CardDescription>
                    </div>
                    <Button onClick={addOneOff} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {oneOffExpenses.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Input
                          value={item.name}
                          onChange={(e) => updateOneOff(item.id, 'name', e.target.value)}
                          className="flex-1"
                          placeholder="Description"
                        />
                        <Input
                          type="number"
                          value={item.year}
                          onChange={(e) => updateOneOff(item.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                          className="w-24"
                          placeholder="Year"
                        />
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateOneOff(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-28"
                          placeholder="Amount"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeOneOff(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {oneOffExpenses.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No one-off expenses planned</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <span className="font-medium">Total Planned One-Offs</span>
                    <span className="text-lg font-bold">{formatCurrency(oneOffExpenses.reduce((s, o) => s + o.amount, 0))}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assumptions Tab */}
          <TabsContent value="assumptions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Economic Assumptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Economic Assumptions</CardTitle>
                  <CardDescription>Inflation and growth rates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Inflation Rate: {assumptions.inflationRate}%</Label>
                    <Slider
                      value={[assumptions.inflationRate]}
                      onValueChange={([v]) => setAssumptions({ ...assumptions, inflationRate: v })}
                      min={0}
                      max={10}
                      step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>5%</span>
                      <span>10%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Wage Growth Rate: {assumptions.wageGrowth}%</Label>
                    <Slider
                      value={[assumptions.wageGrowth]}
                      onValueChange={([v]) => setAssumptions({ ...assumptions, wageGrowth: v })}
                      min={0}
                      max={8}
                      step={0.1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Asset Yield Assumptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Yield Assumptions</CardTitle>
                  <CardDescription>Expected returns by asset class</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ASSET_TYPES.map(assetType => (
                      <div key={assetType.value} className="flex items-center justify-between">
                        <Label className="text-sm">{assetType.label}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={yieldOverrides[assetType.value] ?? assetType.defaultYield}
                            onChange={(e) => setYieldOverrides({ 
                              ...yieldOverrides, 
                              [assetType.value]: parseFloat(e.target.value) || 0 
                            })}
                            className="w-20 text-right"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Super Contributions */}
              <Card>
                <CardHeader>
                  <CardTitle>Superannuation Contributions</CardTitle>
                  <CardDescription>Pre-retirement contribution settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Employer SG Rate: {assumptions.superContributionRate}%</Label>
                    <Slider
                      value={[assumptions.superContributionRate]}
                      onValueChange={([v]) => setAssumptions({ ...assumptions, superContributionRate: v })}
                      min={10}
                      max={15}
                      step={0.5}
                    />
                  </div>
                  
                  <div>
                    <Label>Annual Salary Sacrifice</Label>
                    <Input
                      type="number"
                      value={assumptions.salarySacrifice}
                      onChange={(e) => setAssumptions({ ...assumptions, salarySacrifice: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Annual Non-Concessional Contribution</Label>
                    <Input
                      type="number"
                      value={assumptions.nonConcessionalContrib}
                      onChange={(e) => setAssumptions({ ...assumptions, nonConcessionalContrib: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Drawdown Strategy */}
              <Card>
                <CardHeader>
                  <CardTitle>Drawdown Strategy</CardTitle>
                  <CardDescription>How to draw from super in retirement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={assumptions.drawdownStrategy}
                    onValueChange={(v) => setAssumptions({ ...assumptions, drawdownStrategy: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimum">Minimum Required</SelectItem>
                      <SelectItem value="percentage">Fixed Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {assumptions.drawdownStrategy === 'percentage' && (
                    <div className="space-y-2">
                      <Label>Drawdown Rate: {assumptions.drawdownRate}%</Label>
                      <Slider
                        value={[assumptions.drawdownRate]}
                        onValueChange={([v]) => setAssumptions({ ...assumptions, drawdownRate: v })}
                        min={4}
                        max={12}
                        step={0.5}
                      />
                    </div>
                  )}
                  
                  {assumptions.drawdownStrategy === 'fixed' && (
                    <div>
                      <Label>Annual Drawdown Amount</Label>
                      <Input
                        type="number"
                        value={assumptions.fixedDrawdown}
                        onChange={(e) => setAssumptions({ ...assumptions, fixedDrawdown: parseFloat(e.target.value) || 0 })}
                        className="mt-1"
                      />
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Include Age Pension</Label>
                      <p className="text-xs text-muted-foreground">Model government pension eligibility</p>
                    </div>
                    <Switch
                      checked={assumptions.includeAgePension}
                      onCheckedChange={(v) => setAssumptions({ ...assumptions, includeAgePension: v })}
                    />
                  </div>
                  
                  {assumptions.includeAgePension && (
                    <div className="space-y-2">
                      <Label>Age Pension Eligibility Age: {assumptions.agePensionAge}</Label>
                      <Slider
                        value={[assumptions.agePensionAge]}
                        onValueChange={([v]) => setAssumptions({ ...assumptions, agePensionAge: v })}
                        min={65}
                        max={70}
                        step={1}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projection Tab */}
          <TabsContent value="projection" className="space-y-4">
            {projectionData && (
              <>
                {/* Income vs Expenses Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Income vs Expenses Over Time</CardTitle>
                    <CardDescription>Projected annual cash flows with retirement transition</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={projectionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                          <ReferenceLine x={new Date().getFullYear() + yearsToRetirement} stroke="#f59e0b" label="Retire" strokeDasharray="5 5" />
                          <Bar dataKey="employmentIncome" name="Employment" fill="#3b82f6" stackId="income" />
                          <Bar dataKey="pensionIncome" name="Super Pension" fill="#22c55e" stackId="income" />
                          <Bar dataKey="agePension" name="Age Pension" fill="#8b5cf6" stackId="income" />
                          <Bar dataKey="investmentIncome" name="Investments" fill="#06b6d4" stackId="income" />
                          <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Projection Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Year-by-Year Projection</CardTitle>
                    <CardDescription>Detailed breakdown of all financial components</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead>Age</TableHead>
                            <TableHead>Phase</TableHead>
                            <TableHead className="text-right">Income</TableHead>
                            <TableHead className="text-right">Super Pension</TableHead>
                            <TableHead className="text-right">Age Pension</TableHead>
                            <TableHead className="text-right">Expenses</TableHead>
                            <TableHead className="text-right">Tax</TableHead>
                            <TableHead className="text-right">CGT</TableHead>
                            <TableHead className="text-right">Super Balance</TableHead>
                            <TableHead className="text-right">Net Worth</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {projectionData.map((row, idx) => (
                            <TableRow key={idx} className={row.isRetired ? 'bg-green-50/50' : ''}>
                              <TableCell>{row.year}</TableCell>
                              <TableCell>{row.age}</TableCell>
                              <TableCell>
                                <Badge variant={row.isRetired ? 'default' : 'outline'}>
                                  {row.isRetired ? 'Retired' : 'Working'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(row.income)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.pensionIncome)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.agePension)}</TableCell>
                              <TableCell className="text-right text-red-600">{formatCurrency(row.expenses)}</TableCell>
                              <TableCell className="text-right text-orange-600">{formatCurrency(row.tax)}</TableCell>
                              <TableCell className="text-right text-red-600">{row.cgt > 0 ? formatCurrency(row.cgt) : '-'}</TableCell>
                              <TableCell className="text-right text-blue-600">{formatCurrency(row.superBalance)}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(row.netWorth)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
