import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import RetirementWorkshop from "@/pages/RetirementWorkshop";
import AdviserClientInputs from "@/components/AdviserClientInputs";
import HouseholdBudget from "@/pages/HouseholdBudget";
import UnifiedInvestments from "@/pages/UnifiedInvestments";
import UnifiedTaxCentre from "@/pages/UnifiedTaxCentre";
import SimpleGoals from "@/components/SimpleGoals";
import AdviserGoals from "@/components/AdviserGoals";
import { CLIENT_DATA } from "@/data/clientData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Wallet,
  Target,
  MessageSquare,
  Briefcase,
  Star,
  Bell,
  Building2,
  Home,
  PiggyBank,
  Shield,
  BarChart3,
  Activity,
  Send,
  Video,
  MapPin,
  ArrowLeft,
  Plus,
  Download,
  Upload,
  RefreshCw,
  UserCircle,
  GraduationCap,
  Plane,
  Calculator,
  LineChart,
  Bitcoin,
  Coins,
  BookOpen,
  ExternalLink,
  X,
  Landmark,
  Maximize2
} from "lucide-react";
import { toast } from "sonner";
import MeetingMode from "@/components/MeetingMode";
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
  Cell,
  Legend
} from "recharts";

import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = API_URL;

// Performance timeframes
const PERFORMANCE_TIMEFRAMES = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "10Y"];

// Detailed asset holdings by category
const ASSET_HOLDINGS = {
  stocks: {
    label: "Stocks & ETFs",
    icon: TrendingUp,
    color: "#3B82F6",
    total: 425000,
    holdings: [
      { name: "BHP Group", symbol: "BHP", units: 1200, price: 45.50, value: 54600, change: 5.2, costBase: 48000 },
      { name: "Commonwealth Bank", symbol: "CBA", units: 400, price: 118.50, value: 47400, change: 8.1, costBase: 42000 },
      { name: "CSL Limited", symbol: "CSL", units: 150, price: 295.00, value: 44250, change: -2.3, costBase: 46000 },
      { name: "Vanguard Aus Shares (VAS)", symbol: "VAS", units: 1500, price: 95.50, value: 143250, change: 4.5, costBase: 135000 },
      { name: "iShares S&P 500 (IVV)", symbol: "IVV", units: 120, price: 580.00, value: 69600, change: 12.4, costBase: 58000 },
      { name: "Vanguard Intl (VGS)", symbol: "VGS", units: 450, price: 115.00, value: 51750, change: 9.8, costBase: 45000 },
      { name: "Magellan Global (MGE)", symbol: "MGE", units: 350, price: 42.00, value: 14700, change: -5.2, costBase: 16500 },
    ],
    research: [
      { title: "BHP Group - Mining Outlook 2026", date: "2025-12-10", source: "Macquarie Research", rating: "Outperform", target: 52.00 },
      { title: "Australian Banks Sector Update", date: "2025-12-05", source: "Morgan Stanley", rating: "Equal Weight", target: null },
      { title: "VAS ETF Analysis Q4 2025", date: "2025-11-28", source: "Morningstar", rating: "Gold", target: null },
    ]
  },
  bonds: {
    label: "Bonds & Fixed Income",
    icon: Landmark,
    color: "#F59E0B",
    total: 95000,
    holdings: [
      { name: "Aus Gov 10Y Bond", symbol: "ACGB-34", units: 50000, price: 1.02, value: 51000, yield: 4.2, maturity: "2034-03-15" },
      { name: "Corporate Bond Fund", symbol: "BOND", units: 30000, price: 1.05, value: 31500, yield: 5.1, maturity: "2028-06-30" },
      { name: "NSW Treasury Bond", symbol: "NSWTC", units: 12000, price: 1.04, value: 12480, yield: 4.5, maturity: "2030-11-20" },
    ],
    research: [
      { title: "Fixed Income Strategy 2026", date: "2025-12-08", source: "UBS", rating: "Overweight", target: null },
      { title: "Corporate Credit Outlook", date: "2025-11-15", source: "JP Morgan", rating: "Neutral", target: null },
    ]
  },
  hybrids: {
    label: "Hybrid Securities",
    icon: Coins,
    color: "#EC4899",
    total: 85000,
    holdings: [
      { name: "CBA PERLS XI", symbol: "CBAPD", units: 300, price: 98.50, value: 29550, yield: 7.35, maturity: "2026-10-15", franking: 100 },
      { name: "Westpac Capital Notes 8", symbol: "WBCPI", units: 200, price: 101.20, value: 20240, yield: 7.25, maturity: "2027-03-22", franking: 100 },
      { name: "ANZ Capital Notes 7", symbol: "ANZPJ", units: 250, price: 97.80, value: 24450, yield: 7.45, maturity: "2028-09-20", franking: 100 },
      { name: "NAB Capital Notes 5", symbol: "NABPH", units: 110, price: 99.00, value: 10890, yield: 7.30, maturity: "2028-06-17", franking: 100 },
    ],
    research: [
      { title: "Bank Hybrids Market Update", date: "2025-12-12", source: "Bell Potter", rating: "Attractive", target: null },
      { title: "AT1 Capital Notes Analysis", date: "2025-11-28", source: "Citi Research", rating: "Hold", target: null },
    ]
  },
  cash: {
    label: "Cash & Term Deposits",
    icon: PiggyBank,
    color: "#10B981",
    total: 185000,
    holdings: [
      { name: "High Interest Savings", symbol: "ING", units: 1, price: 85000, value: 85000, rate: 5.0, maturity: null },
      { name: "Term Deposit 6M", symbol: "CBA-TD", units: 1, price: 50000, value: 50000, rate: 4.8, maturity: "2026-06-15" },
      { name: "Term Deposit 12M", symbol: "WBC-TD", units: 1, price: 25000, value: 25000, rate: 5.1, maturity: "2026-12-01" },
      { name: "Offset Account", symbol: "CBA-OFF", units: 1, price: 25000, value: 25000, rate: 0, maturity: null },
    ],
    research: [
      { title: "Term Deposit Rate Comparison", date: "2025-12-12", source: "RateCity", rating: "Best Value", target: null },
    ]
  },
  funds: {
    label: "Managed Funds",
    icon: Briefcase,
    color: "#8B5CF6",
    total: 175000,
    holdings: [
      { name: "Magellan Global Fund", symbol: "MGF", units: 3500, price: 32.80, value: 114800, change: -3.2, manager: "Magellan" },
      { name: "Platinum International Fund", symbol: "PIF", units: 2500, price: 24.50, value: 61250, change: 2.8, manager: "Platinum" },
    ],
    research: [
      { title: "Magellan Global Fund Review", date: "2025-12-01", source: "Morningstar", rating: "Silver", target: null },
      { title: "Platinum Intl Fund Analysis", date: "2025-11-20", source: "Lonsec", rating: "Recommended", target: null },
    ]
  },
  crypto: {
    label: "Cryptocurrency",
    icon: Bitcoin,
    color: "#F97316",
    total: 45000,
    holdings: [
      { name: "Bitcoin", symbol: "BTC", units: 0.42, price: 73500, value: 30870, change: 15.2, costBase: 22000 },
      { name: "Ethereum", symbol: "ETH", units: 3.8, price: 3720, value: 14136, change: 8.5, costBase: 10000 },
    ],
    research: [
      { title: "Bitcoin Institutional Outlook 2026", date: "2025-12-14", source: "Fidelity Digital", rating: "Positive", target: 100000 },
    ]
  },
  property: {
    label: "Property",
    icon: Home,
    color: "#EF4444",
    total: 3050000,
    holdings: [
      { name: "Family Home - Mosman", symbol: "PROP-1", units: 1, price: 2200000, value: 2200000, change: 5.3, debt: 850000, rental: 0 },
      { name: "Investment Unit - Parramatta", symbol: "PROP-2", units: 1, price: 850000, value: 850000, change: 3.0, debt: 0, rental: 2800 },
    ],
    research: [
      { title: "Sydney Property Market Update", date: "2025-12-10", source: "CoreLogic", rating: "Moderate Growth", target: null },
      { title: "Parramatta Growth Corridor", date: "2025-11-25", source: "Domain Research", rating: "High Potential", target: null },
    ]
  }
};

// Performance history data (mock)
const generatePerformanceData = (months) => {
  const data = [];
  let value = 2500000;
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthlyReturn = (Math.random() - 0.3) * 0.05; // -1.5% to +3.5%
    value = value * (1 + monthlyReturn);
    data.push({
      date: date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      value: Math.round(value),
      benchmark: Math.round(value * (0.95 + Math.random() * 0.1))
    });
  }
  return data;
};

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Comprehensive demo client data
const DEMO_CLIENT_DATA = {
  "client_1": {
    id: "client_1",
    name: "David & Sarah Thompson",
    email: "david.thompson@email.com",
    phone: "0412 345 678",
    mobile: "0412 345 678",
    address: "18 Elm Street, Glen Waverley VIC 3150",
    status: "active",
    type: "household",
    clientSince: "2019-03-15",
    dateOfBirth: "1976-03-15",
    age: 50,
    occupation: "IT Manager",
    employer: "NAB",
    riskProfile: "Balanced",
    investmentExperience: "Moderate",
    advisor: "Sarah Chen",
    reviewFrequency: "Annual",
    lastReview: "2025-06-15",
    nextReview: "2026-05-15",
    satisfaction: 92,
    nps: 9,
    
    // Wealth Summary — matches $1,608,800 net worth
    wealth: {
      total: 1608800,
      change: 87000,
      changePercent: 5.7,
      assetAllocation: { equities: 4, property: 70, super: 19, cash: 3, other: 4 }
    },
    
    accounts: [
      { id: 1, name: "David - AustralianSuper", type: "Superannuation", institution: "AustralianSuper", balance: 245000, change: 18500, changePercent: 8.2, icon: PiggyBank },
      { id: 2, name: "Sarah - REST Super", type: "Superannuation", institution: "REST", balance: 198000, change: 14300, changePercent: 7.8, icon: PiggyBank },
      { id: 3, name: "Family Home - Glen Waverley", type: "Property", institution: "Direct", balance: 985000, change: 38500, changePercent: 4.1, icon: Home },
      { id: 4, name: "Investment Unit - Brunswick", type: "Property", institution: "Direct", balance: 620000, change: 22600, changePercent: 3.8, icon: Home },
      { id: 5, name: "Vanguard High Growth ETF", type: "Investment", institution: "Vanguard", balance: 42000, change: 3600, changePercent: 9.5, icon: TrendingUp },
      { id: 6, name: "BHP & CBA Shares", type: "Investment", institution: "CommSec", balance: 42500, change: 3400, changePercent: 8.7, icon: TrendingUp },
      { id: 7, name: "Colonial First State Balanced", type: "Managed Fund", institution: "CFS", balance: 32000, change: 1750, changePercent: 5.8, icon: TrendingUp },
      { id: 8, name: "Emergency Fund - ING", type: "Cash", institution: "ING", balance: 28000, change: 1150, changePercent: 4.3, icon: DollarSign },
      { id: 9, name: "Term Deposit - Westpac", type: "Cash", institution: "Westpac", balance: 35000, change: 1540, changePercent: 4.6, icon: DollarSign },
      { id: 10, name: "Home Loan - CBA", type: "Liability", institution: "CBA", balance: -285000, change: 15000, changePercent: 5.0, icon: Building2 },
      { id: 11, name: "Investment Loan - ANZ", type: "Liability", institution: "ANZ", balance: -380000, change: 12000, changePercent: 3.1, icon: Building2 },
      { id: 12, name: "Credit Card - Visa", type: "Liability", institution: "CBA", balance: -4200, change: 800, changePercent: 16.0, icon: Building2 },
    ],
    
    transactions: [
      { id: 1, date: "2025-12-14", description: "Dividend - BHP Group", amount: 620, type: "income", account: "BHP & CBA Shares" },
      { id: 2, date: "2025-12-12", description: "DRP Reinvestment - CBA", amount: 480, type: "investment", account: "BHP & CBA Shares" },
      { id: 3, date: "2025-12-10", description: "Salary Sacrifice", amount: 1750, type: "contribution", account: "David - AustralianSuper" },
      { id: 4, date: "2025-12-08", description: "Rental Income - Brunswick", amount: 2667, type: "income", account: "Emergency Fund - ING" },
      { id: 5, date: "2025-12-05", description: "Home Loan Payment", amount: -2800, type: "expense", account: "Home Loan - CBA" },
      { id: 6, date: "2025-12-01", description: "Interest Earned", amount: 135, type: "income", account: "Term Deposit - Westpac" },
    ],
    
    tasks: [
      { id: 1, title: "Super Consolidation Review", priority: "high", dueDate: "2026-02-28", status: "pending", type: "review" },
      { id: 2, title: "Insurance Gap Analysis", priority: "medium", dueDate: "2026-03-15", status: "pending", type: "planning" },
      { id: 3, title: "Annual SOA Update", priority: "medium", dueDate: "2026-05-15", status: "pending", type: "document" },
    ],
    
    documents: [
      { id: 1, name: "Statement of Advice 2025", type: "SOA", date: "2025-06-15", status: "signed" },
      { id: 2, name: "Fee Disclosure Statement", type: "FDS", date: "2025-12-01", status: "pending_signature" },
      { id: 3, name: "Q3 2025 Portfolio Report", type: "Report", date: "2025-10-01", status: "available" },
    ],
    
    communications: [
      { id: 1, date: "2025-12-14", type: "email", direction: "outbound", summary: "Sent quarterly portfolio report", by: "Sarah Chen" },
      { id: 2, date: "2025-12-05", type: "call", direction: "inbound", summary: "David asked about super contribution limits", duration: "15 min", by: "David Thompson" },
      { id: 3, date: "2025-11-28", type: "meeting", direction: "in-person", summary: "Annual review meeting", duration: "60 min", by: "Sarah Chen" },
    ],
    
    goals: [
      { id: 1, name: "Retirement at 67", target: 2500000, current: 1608800, progress: 64, targetDate: "2043-06-30", icon: Target },
      { id: 2, name: "Pay off investment loan", target: 380000, current: 180000, progress: 47, targetDate: "2035-01-01", icon: Home },
      { id: 3, name: "Emergency fund $60K", target: 60000, current: 28000, progress: 47, targetDate: "2027-12-31", icon: DollarSign },
    ],
    
    family: [
      { name: "David Thompson", relationship: "Primary", dob: "1976-03-15", age: 50 },
      { name: "Sarah Thompson", relationship: "Spouse", dob: "1976-08-22", age: 50 },
    ],
    
    insurance: [
      { type: "Life", provider: "TAL", sumInsured: 1000000, premium: 1400, premiumFreq: "annual", status: "active" },
      { type: "TPD", provider: "TAL", sumInsured: 750000, premium: 900, premiumFreq: "annual", status: "active" },
      { type: "Income Protection", provider: "OnePath", sumInsured: 10000, premium: 1800, premiumFreq: "annual", status: "active" },
    ],
    
    keyDates: [
      { date: "2026-05-15", event: "Annual Review Due", type: "review" },
      { date: "2026-03-15", event: "David turns 51", type: "birthday" },
      { date: "2026-08-22", event: "Sarah turns 51", type: "birthday" },
      { date: "2026-06-30", event: "Tax Year End", type: "tax" },
    ]
  },
  "client_2": {
    id: "client_2",
    name: "Chen Family Trust",
    email: "michael.chen@email.com",
    phone: "0423 456 789",
    mobile: "0423 456 789",
    address: "15 Pacific Highway, Chatswood NSW 2067",
    status: "active",
    type: "trust",
    clientSince: "2020-08-10",
    dateOfBirth: "1973-04-12",
    age: 52,
    occupation: "Property Developer",
    employer: "Chen Developments",
    riskProfile: "Balanced",
    investmentExperience: "Experienced",
    advisor: "Mark Thompson",
    reviewFrequency: "Semi-Annual",
    lastReview: "2025-09-10",
    nextReview: "2026-02-20",
    satisfaction: 88,
    nps: 8,
    wealth: { total: 5200000, change: -85000, changePercent: -1.6, assetAllocation: { equities: 35, property: 40, fixedIncome: 15, cash: 10 } },
    accounts: [
      { id: 1, name: "Michael Chen Super", type: "Superannuation", institution: "Aware Super", balance: 620000, change: 32000, changePercent: 5.4, icon: PiggyBank },
      { id: 2, name: "Lisa Chen Super", type: "Superannuation", institution: "HESTA", balance: 480000, change: 22000, changePercent: 4.8, icon: PiggyBank },
      { id: 3, name: "Chen Family Trust", type: "Trust", institution: "Macquarie", balance: 2800000, change: -120000, changePercent: -4.1, icon: Building2 },
      { id: 4, name: "Investment Property - Chatswood", type: "Property", institution: "Direct", balance: 1100000, change: 35000, changePercent: 3.3, icon: Home },
      { id: 5, name: "Cash Management", type: "Cash", institution: "CBA", balance: 100000, change: 3000, changePercent: 3.1, icon: DollarSign },
    ],
    transactions: [
      { id: 1, date: "2025-12-12", description: "Trust Distribution - Q4", amount: 45000, type: "income", account: "Chen Family Trust" },
      { id: 2, date: "2025-12-08", description: "Rental Income - Chatswood", amount: 3800, type: "income", account: "Cash Management" },
      { id: 3, date: "2025-12-01", description: "Property Management Fee", amount: -850, type: "expense", account: "Cash Management" },
    ],
    tasks: [
      { id: 1, title: "Trust Tax Return Review", priority: "high", dueDate: "2026-02-20", status: "pending", type: "review" },
      { id: 2, title: "Property Valuation Update", priority: "medium", dueDate: "2026-03-15", status: "pending", type: "planning" },
    ],
    documents: [
      { id: 1, name: "Trust Deed Amendment 2025", type: "Trust", date: "2025-09-10", status: "signed" },
      { id: 2, name: "SOA - Trust Restructure", type: "SOA", date: "2025-09-10", status: "signed" },
    ],
    communications: [
      { id: 1, date: "2025-12-10", type: "email", direction: "outbound", summary: "Sent trust distribution summary", by: "Mark Thompson" },
      { id: 2, date: "2025-11-28", type: "meeting", direction: "in-person", summary: "Tax planning meeting for FY25", duration: "45 min", by: "Mark Thompson" },
    ],
    goals: [
      { id: 1, name: "Retire at 60", target: 6000000, current: 5200000, progress: 87, targetDate: "2033-04-12", icon: Target },
      { id: 2, name: "Children's inheritance", target: 2000000, current: 1400000, progress: 70, targetDate: "2040-01-01", icon: GraduationCap },
    ],
    family: [
      { name: "Michael Chen", relationship: "Primary", dob: "1973-04-12", age: 52 },
      { name: "Lisa Chen", relationship: "Spouse", dob: "1977-09-03", age: 48 },
      { name: "Daniel Chen", relationship: "Son", dob: "2001-06-15", age: 24 },
      { name: "Sophie Chen", relationship: "Daughter", dob: "2005-02-20", age: 20 },
    ],
    insurance: [
      { type: "Life", provider: "AIA", sumInsured: 2000000, premium: 2400, premiumFreq: "annual", status: "active" },
      { type: "Income Protection", provider: "AIA", sumInsured: 20000, premium: 3200, premiumFreq: "annual", status: "active" },
    ],
    keyDates: [
      { date: "2026-02-20", event: "Semi-Annual Review Due", type: "review" },
      { date: "2026-04-12", event: "Michael turns 53", type: "birthday" },
      { date: "2026-06-30", event: "Tax Year End", type: "tax" },
    ]
  },
  "client_3": {
    id: "client_3",
    name: "Robert Mitchell",
    email: "r.mitchell@company.com",
    phone: "0434 567 890",
    mobile: "0434 567 890",
    address: "88 King Street, Sydney CBD NSW 2000",
    status: "review",
    type: "individual",
    clientSince: "2017-11-20",
    dateOfBirth: "1967-09-05",
    age: 58,
    occupation: "Senior Executive",
    employer: "BHP Group",
    riskProfile: "Conservative",
    investmentExperience: "Moderate",
    advisor: "Mark Thompson",
    reviewFrequency: "Annual",
    lastReview: "2024-12-15",
    nextReview: "2025-12-20",
    satisfaction: 72,
    nps: 6,
    wealth: { total: 1450000, change: 32000, changePercent: 2.3, assetAllocation: { equities: 30, property: 20, fixedIncome: 35, cash: 15 } },
    accounts: [
      { id: 1, name: "Robert Mitchell Super", type: "Superannuation", institution: "UniSuper", balance: 680000, change: 18000, changePercent: 2.7, icon: PiggyBank },
      { id: 2, name: "Managed Fund Portfolio", type: "Investment", institution: "Colonial First State", balance: 420000, change: 12000, changePercent: 2.9, icon: TrendingUp },
      { id: 3, name: "Investment Unit - Ultimo", type: "Property", institution: "Direct", balance: 280000, change: 5000, changePercent: 1.8, icon: Home },
      { id: 4, name: "Cash Savings", type: "Cash", institution: "Macquarie", balance: 70000, change: 2500, changePercent: 3.7, icon: DollarSign },
    ],
    transactions: [
      { id: 1, date: "2025-12-10", description: "Managed Fund Distribution", amount: 3200, type: "income", account: "Managed Fund Portfolio" },
      { id: 2, date: "2025-12-01", description: "Rental Income - Ultimo", amount: 2200, type: "income", account: "Cash Savings" },
    ],
    tasks: [
      { id: 1, title: "Annual Review - OVERDUE", priority: "urgent", dueDate: "2025-12-20", status: "overdue", type: "review" },
      { id: 2, title: "Retirement Planning Discussion", priority: "high", dueDate: "2026-01-15", status: "pending", type: "planning" },
    ],
    documents: [
      { id: 1, name: "SOA 2024", type: "SOA", date: "2024-12-15", status: "signed" },
      { id: 2, name: "Risk Profile Questionnaire", type: "Assessment", date: "2024-12-10", status: "signed" },
    ],
    communications: [
      { id: 1, date: "2025-11-28", type: "email", direction: "outbound", summary: "Annual review reminder - 3rd attempt", by: "Mark Thompson" },
      { id: 2, date: "2025-10-15", type: "call", direction: "outbound", summary: "Left voicemail about annual review", duration: "2 min", by: "Mark Thompson" },
    ],
    goals: [
      { id: 1, name: "Retire at 65", target: 2000000, current: 1450000, progress: 73, targetDate: "2032-09-05", icon: Target },
    ],
    family: [
      { name: "Robert Mitchell", relationship: "Primary", dob: "1967-09-05", age: 58 },
    ],
    insurance: [
      { type: "Life", provider: "MLC", sumInsured: 800000, premium: 1400, premiumFreq: "annual", status: "review needed" },
    ],
    keyDates: [
      { date: "2025-12-20", event: "Annual Review - OVERDUE", type: "review" },
      { date: "2026-09-05", event: "Robert turns 59", type: "birthday" },
    ]
  },
  "client_4": {
    id: "client_4",
    name: "Emma & David Williams",
    email: "emma.williams@gmail.com",
    phone: "0445 678 901",
    mobile: "0445 678 901",
    address: "23 Elm Street, Balmain NSW 2041",
    status: "prospect",
    type: "household",
    clientSince: "2025-12-01",
    dateOfBirth: "1988-03-20",
    age: 38,
    occupation: "Marketing Director / Software Engineer",
    employer: "Atlassian / David self-employed",
    riskProfile: "TBD",
    investmentExperience: "Beginner",
    advisor: "Mark Thompson",
    reviewFrequency: "TBD",
    lastReview: null,
    nextReview: null,
    satisfaction: null,
    nps: null,
    wealth: { total: 980000, change: 0, changePercent: 0, assetAllocation: { equities: 5, property: 55, fixedIncome: 0, cash: 40 } },
    accounts: [
      { id: 1, name: "David Williams Super", type: "Superannuation", institution: "Australian Retirement Trust", balance: 220000, change: 0, changePercent: 0, icon: PiggyBank },
      { id: 2, name: "Emma Williams Super", type: "Superannuation", institution: "Aware Super", balance: 180000, change: 0, changePercent: 0, icon: PiggyBank },
      { id: 3, name: "Family Home - Balmain", type: "Property", institution: "Direct", balance: 1350000, change: 0, changePercent: 0, icon: Home },
      { id: 4, name: "Mortgage - Balmain", type: "Liability", institution: "ANZ", balance: -880000, change: 0, changePercent: 0, icon: Building2 },
      { id: 5, name: "Joint Savings", type: "Cash", institution: "ING", balance: 45000, change: 0, changePercent: 0, icon: DollarSign },
      { id: 6, name: "Emergency Fund", type: "Cash", institution: "Macquarie", balance: 65000, change: 0, changePercent: 0, icon: DollarSign },
    ],
    transactions: [],
    tasks: [
      { id: 1, title: "Complete Fact Find", priority: "high", dueDate: "2025-12-30", status: "pending", type: "document" },
      { id: 2, title: "Discovery Meeting Follow-up", priority: "high", dueDate: "2025-12-19", status: "pending", type: "meeting" },
      { id: 3, title: "Prepare Initial SOA", priority: "medium", dueDate: "2026-01-20", status: "pending", type: "document" },
    ],
    documents: [
      { id: 1, name: "Discovery Meeting Notes", type: "Notes", date: "2025-12-12", status: "completed" },
    ],
    communications: [
      { id: 1, date: "2025-12-12", type: "meeting", direction: "in-person", summary: "Discovery meeting - discussed goals, risk appetite, and current financial position", duration: "1.5 hr", by: "Mark Thompson" },
    ],
    goals: [
      { id: 1, name: "Build investment portfolio", target: 500000, current: 0, progress: 0, targetDate: "2030-01-01", icon: Target },
      { id: 2, name: "Kids' education fund", target: 150000, current: 0, progress: 0, targetDate: "2034-01-01", icon: GraduationCap },
      { id: 3, name: "Pay off mortgage faster", target: 880000, current: 0, progress: 0, targetDate: "2040-01-01", icon: Home },
    ],
    family: [
      { name: "David Williams", relationship: "Primary", dob: "1988-03-20", age: 38 },
      { name: "Emma Williams", relationship: "Spouse", dob: "1990-07-14", age: 36 },
      { name: "Lily Williams", relationship: "Daughter", dob: "2018-01-10", age: 8 },
      { name: "Jack Williams", relationship: "Son", dob: "2021-04-22", age: 5 },
    ],
    insurance: [],
    keyDates: [
      { date: "2025-12-19", event: "Discovery Follow-up", type: "meeting" },
      { date: "2026-01-20", event: "SOA Presentation", type: "document" },
    ]
  },
  "client_5": {
    id: "client_5",
    name: "Patel SMSF",
    email: "raj.patel@business.com.au",
    phone: "0456 789 012",
    mobile: "0456 789 012",
    address: "5/120 George Street, Parramatta NSW 2150",
    status: "active",
    type: "smsf",
    clientSince: "2018-05-15",
    dateOfBirth: "1978-01-08",
    age: 48,
    occupation: "Business Owner - IT Services",
    employer: "Patel IT Solutions Pty Ltd",
    riskProfile: "Aggressive",
    investmentExperience: "Very Experienced",
    advisor: "Mark Thompson",
    reviewFrequency: "Quarterly",
    lastReview: "2025-12-08",
    nextReview: "2026-03-15",
    satisfaction: 92,
    nps: 9,
    wealth: { total: 3100000, change: 180000, changePercent: 6.2, assetAllocation: { equities: 55, property: 20, fixedIncome: 10, cash: 15 } },
    accounts: [
      { id: 1, name: "Patel SMSF", type: "SMSF", institution: "Macquarie", balance: 2400000, change: 150000, changePercent: 6.7, icon: Shield },
      { id: 2, name: "Business Account", type: "Business", institution: "NAB", balance: 500000, change: 25000, changePercent: 5.3, icon: Building2 },
      { id: 3, name: "Cash Reserve", type: "Cash", institution: "ING", balance: 200000, change: 5000, changePercent: 2.6, icon: DollarSign },
    ],
    transactions: [
      { id: 1, date: "2025-12-10", description: "SMSF Contribution - Raj", amount: 25000, type: "contribution", account: "Patel SMSF" },
      { id: 2, date: "2025-12-05", description: "Dividend - ASX Portfolio", amount: 8500, type: "income", account: "Patel SMSF" },
    ],
    tasks: [
      { id: 1, title: "SMSF Annual Audit", priority: "medium", dueDate: "2026-03-15", status: "pending", type: "compliance" },
    ],
    documents: [
      { id: 1, name: "SMSF Investment Strategy 2025", type: "IPS", date: "2025-12-08", status: "current" },
      { id: 2, name: "SMSF Audit Report 2024", type: "Audit", date: "2025-03-10", status: "completed" },
    ],
    communications: [
      { id: 1, date: "2025-12-08", type: "meeting", direction: "video", summary: "Quarterly SMSF review - discussed tech sector allocation", duration: "40 min", by: "Mark Thompson" },
    ],
    goals: [
      { id: 1, name: "SMSF to $5M", target: 5000000, current: 2400000, progress: 48, targetDate: "2035-01-01", icon: Target },
      { id: 2, name: "Sell business by 55", target: 3000000, current: 500000, progress: 17, targetDate: "2033-01-08", icon: Building2 },
    ],
    family: [
      { name: "Raj Patel", relationship: "Primary", dob: "1978-01-08", age: 48 },
      { name: "Priya Patel", relationship: "Spouse", dob: "1981-05-22", age: 45 },
      { name: "Aarav Patel", relationship: "Son", dob: "2003-11-10", age: 22 },
    ],
    insurance: [
      { type: "Life", provider: "Zurich", sumInsured: 3000000, premium: 3800, premiumFreq: "annual", status: "active" },
      { type: "Key Person", provider: "Zurich", sumInsured: 2000000, premium: 2800, premiumFreq: "annual", status: "active" },
    ],
    keyDates: [
      { date: "2026-03-15", event: "Quarterly Review & SMSF Audit", type: "review" },
      { date: "2026-01-08", event: "Raj turns 48", type: "birthday" },
    ]
  }
};

// Aliases for client IDs used by other components
DEMO_CLIENT_DATA["thompson_family"] = DEMO_CLIENT_DATA["client_1"];
DEMO_CLIENT_DATA["chen_family"] = DEMO_CLIENT_DATA["client_2"];

// Merge CLIENT_DATA (HNW source-of-truth) into the DEMO structure so the
// header, totals and accounts match the embedded Budget/Investments/Tax pages.
const CLIENT_ID_MAP = {
  client_1: "thompson_family",
  client_2: "chen_family",
  thompson_family: "thompson_family",
  chen_family: "chen_family",
};

const ASSET_ICONS = { Super: PiggyBank, Property: Home, Shares: TrendingUp, "Managed Fund": TrendingUp, Cash: DollarSign, Crypto: TrendingUp, Other: Building2 };

const mergeWithCanonicalClient = (demo, clientId) => {
  const canonicalKey = CLIENT_ID_MAP[clientId];
  const canonical = canonicalKey ? CLIENT_DATA[canonicalKey] : null;
  if (!canonical) return demo;

  const totalAssets = canonical.assets.reduce((s, a) => s + (a.value || 0), 0);
  const totalLiab = canonical.liabilities.reduce((s, l) => s + (l.value || 0), 0);
  const netWorth = totalAssets - totalLiab;
  // Weighted % change on assets
  const weightedChange = totalAssets
    ? canonical.assets.reduce((s, a) => s + (a.value || 0) * (a.change || 0), 0) / totalAssets
    : 0;
  const dollarChange = Math.round((netWorth * weightedChange) / 100);

  // Build allocation by type
  const byType = canonical.assets.reduce((acc, a) => {
    const bucket = a.type === "Super" ? "super"
      : a.type === "Property" ? "property"
      : a.type === "Shares" || a.type === "Managed Fund" ? "equities"
      : a.type === "Cash" ? "cash"
      : "other";
    acc[bucket] = (acc[bucket] || 0) + (a.value || 0);
    return acc;
  }, {});
  const allocPct = (v) => totalAssets ? Math.round((v / totalAssets) * 100) : 0;
  const assetAllocation = {
    equities: allocPct(byType.equities || 0),
    property: allocPct(byType.property || 0),
    super: allocPct(byType.super || 0),
    cash: allocPct(byType.cash || 0),
    other: allocPct(byType.other || 0),
  };

  // Build account rows (assets as positive, liabilities as negative)
  const accounts = [
    ...canonical.assets.map((a, i) => ({
      id: i + 1,
      name: a.name,
      type: a.type,
      institution: a.entity,
      balance: a.value,
      change: Math.round((a.value || 0) * (a.change || 0) / 100),
      changePercent: a.change,
      icon: ASSET_ICONS[a.type] || TrendingUp,
    })),
    ...canonical.liabilities.map((l, i) => ({
      id: 1000 + i,
      name: l.name,
      type: "Liability",
      institution: l.name.includes("-") ? l.name.split("-")[1].trim() : "Bank",
      balance: -l.value,
      change: 0,
      changePercent: l.rate || 0,
      icon: Building2,
    })),
  ];

  return {
    ...demo,
    name: canonical.profile?.name || demo.name,
    email: canonical.profile?.email || demo.email,
    phone: canonical.profile?.phone || demo.phone,
    address: canonical.profile?.address || demo.address,
    age: canonical.profile?.age || demo.age,
    occupation: canonical.profile?.occupation || demo.occupation,
    employer: canonical.profile?.employer || demo.employer,
    advisor: canonical.profile?.advisor || demo.advisor,
    riskProfile: canonical.profile?.riskProfile || demo.riskProfile,
    wealth: {
      total: netWorth,
      change: dollarChange,
      changePercent: +weightedChange.toFixed(1),
      assetAllocation,
    },
    accounts,
    family: [
      { name: canonical.profile?.name?.split(" & ")[0] || "Primary", relationship: "Primary", dob: demo.dateOfBirth, age: canonical.profile?.age },
      ...(canonical.profile?.partner_first_name ? [{ name: `${canonical.profile.partner_first_name} ${canonical.profile.last_name}`, relationship: "Spouse", dob: "", age: canonical.profile?.age }] : []),
    ],
    // Realign headline goals to the canonical wealth — keeps UX consistent
    goals: (() => {
      const retirementTarget = (canonical.retirement?.retirement_spending || 180000) * 25; // rule of 25
      // Use super + liquid investments as the retirement-assigned current (not total net worth)
      const retirementCurrent = canonical.assets
        .filter((a) => ["Super", "Shares", "Managed Fund", "Bonds", "Alternatives", "SMSF", "Trust Portfolio"].includes(a.type))
        .reduce((s, a) => s + (a.value || 0), 0);
      const loanTarget = canonical.liabilities?.find((l) => /investment/i.test(l.name))?.value || 0;
      const loanCurrent = loanTarget ? Math.round(loanTarget * 0.35) : 0;
      const progressPct = (cur, tgt) => tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : 0;
      return [
        { id: 1, name: `Retirement at ${canonical.retirement?.retirement_age || 67}`, target: retirementTarget, current: retirementCurrent, progress: progressPct(retirementCurrent, retirementTarget), targetDate: `${new Date().getFullYear() + (canonical.retirement?.retirement_age - canonical.retirement?.current_age || 17)}-06-30`, icon: Target },
        ...(loanTarget ? [{ id: 2, name: "Pay off investment loan", target: loanTarget, current: loanCurrent, progress: progressPct(loanCurrent, loanTarget), targetDate: "2035-01-01", icon: Home }] : []),
        { id: 3, name: "Emergency fund 6 months", target: Math.round((canonical.profile?.expensesAnnual || 120000) / 2), current: Math.round((canonical.profile?.expensesAnnual || 120000) / 3), progress: 67, targetDate: "2027-12-31", icon: DollarSign },
      ];
    })(),
    _canonical: canonical, // expose for downstream tabs
  };
};

// Default to client_1 if no client selected
const getClientData = (clientId) => {
  const base = DEMO_CLIENT_DATA[clientId] || DEMO_CLIENT_DATA["client_1"];
  return mergeWithCanonicalClient(base, clientId);
};

const Client360View = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [meetingMode, setMeetingMode] = useState(false);
  
  // Get client from localStorage or URL params
  const storedClient = localStorage.getItem("selected_client");
  const clientId = searchParams.get("id") || (storedClient ? JSON.parse(storedClient).id : "client_1");
  const client = getClientData(clientId);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'income': return 'text-emerald-600';
      case 'contribution': return 'text-blue-600';
      case 'investment': return 'text-purple-600';
      case 'expense': return 'text-red-600';
      default: return 'text-foreground';
    }
  };

  const getCommIcon = (type) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Users;
      case 'video': return Video;
      default: return MessageSquare;
    }
  };

  if (meetingMode) {
    return <MeetingMode client={client} onExit={() => setMeetingMode(false)} />;
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-360-view">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/crm-command-center")}
            data-testid="back-to-crm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
        </div>

        {/* Redesigned Client Header */}
        <div className="rounded-xl overflow-hidden border shadow-sm" data-testid="client-header">
          {/* Top Section - Name & Wealth */}
          <div className="bg-[#0f1d35] px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Client Identity */}
              <div className="flex items-start gap-5">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#D4A84C] to-[#b8922f] flex items-center justify-center text-[#0f1d35] text-xl font-bold shrink-0 ring-2 ring-white/10">
                  {getInitials(client.name)}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-semibold text-white tracking-tight" data-testid="client-name">{client.name}</h1>
                    <Badge className={`text-xs font-medium ${
                      client.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      client.status === 'prospect' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`} data-testid="client-status">
                      {client.status}
                    </Badge>
                    {client.satisfaction >= 90 && (
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-5 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> {client.type === 'household' ? 'Household' : client.type === 'trust' ? 'Trust' : client.type === 'smsf' ? 'SMSF' : 'Individual'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {client.address.split(',').slice(-1)[0].trim()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Since {formatDate(client.clientSince)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wealth Display */}
              <div className="flex items-start gap-6">
                <div className="text-right space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total Wealth</p>
                  <p className="text-4xl font-bold text-white tabular-nums" data-testid="client-wealth">{formatCurrency(client.wealth.total)}</p>
                  <p className={`text-sm font-medium flex items-center justify-end gap-1 ${
                    client.wealth.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {client.wealth.changePercent >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {client.wealth.changePercent >= 0 ? "+" : ""}{formatCurrency(Math.abs(client.wealth.change))} ({Math.abs(client.wealth.changePercent)}%)
                  </p>
                </div>
                <Separator orientation="vertical" className="h-16 bg-white/10 hidden lg:block" />
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" className="bg-white text-[#0f1d35] hover:bg-white/90 h-8 text-xs font-medium" data-testid="call-btn">
                    <Phone className="h-3.5 w-3.5 mr-1.5" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-8 text-xs" data-testid="email-btn">
                    <Mail className="h-3.5 w-3.5 mr-1.5" /> Email
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-[#D4A84C]/40 text-[#D4A84C] hover:bg-[#D4A84C]/10 h-8 text-xs"
                    onClick={() => {
                      localStorage.setItem("selected_client", JSON.stringify(client));
                      window.dispatchEvent(new CustomEvent('client-changed'));
                      navigate(`/transaction-modeler?client=${client.id}`);
                    }}
                    data-testid="transaction-modeler-btn"
                  >
                    <Calculator className="h-3.5 w-3.5 mr-1.5" /> Model
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#D4A84C] text-[#0f1d35] hover:bg-[#c49b3f] h-8 text-xs font-medium"
                    onClick={() => setMeetingMode(true)}
                    data-testid="meeting-mode-btn"
                  >
                    <Maximize2 className="h-3.5 w-3.5 mr-1.5" /> Meeting
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Strip */}
          <div className="bg-[#162240] px-8 py-3 flex items-center gap-6 text-sm text-white/60 border-t border-white/5 overflow-x-auto">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Mail className="h-3.5 w-3.5 text-white/30" /> {client.email}
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Phone className="h-3.5 w-3.5 text-white/30" /> {client.phone}
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <UserCircle className="h-3.5 w-3.5 text-white/30" /> Advisor: {client.advisor}
            </span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Activity className="h-3.5 w-3.5 text-white/30" /> Risk: {client.riskProfile}
            </span>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-3 md:grid-cols-6 bg-white">
            {[
              { label: "Accounts", value: client.accounts.length, color: "" },
              { label: "Open Tasks", value: client.tasks.filter(t => t.status === 'pending' || t.status === 'overdue').length, color: client.tasks.some(t => t.status === 'overdue') ? "text-red-600" : "" },
              { label: "Documents", value: client.documents.length, color: "" },
              { label: "Satisfaction", value: client.satisfaction ? `${client.satisfaction}%` : "N/A", color: client.satisfaction >= 90 ? "text-emerald-600" : client.satisfaction >= 70 ? "text-amber-600" : "text-red-600" },
              { label: "NPS Score", value: client.nps || "N/A", color: "" },
              { label: "Next Review", value: client.nextReview ? formatDate(client.nextReview) : "TBD", color: "" },
            ].map((metric, idx) => (
              <div key={idx} className="text-center py-4 px-2 border-r last:border-r-0 border-b md:border-b-0">
                <p className={`text-xl font-bold ${metric.color}`} data-testid={`metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>{metric.value}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border h-10 w-full justify-start gap-0 rounded-lg px-1 overflow-x-auto">
            {[
              { value: "overview", label: "Overview" },
              { value: "retirement", label: "Retirement" },
              { value: "budget", label: "Budget" },
              { value: "goals", label: "Goals" },
              { value: "investments-view", label: "Investments" },
              { value: "tax", label: "Tax" },
              { value: "profile-inputs", label: "Profile & Inputs" },
              { value: "holdings", label: "Holdings" },
              { value: "performance", label: "Performance" },
              { value: "accounts", label: "Accounts" },
              { value: "transactions", label: "Activity" },
              { value: "documents", label: "Documents" },
              { value: "communications", label: "Timeline" },
              { value: "contact", label: "Contact" },
            ].map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="text-sm data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white data-[state=active]:shadow-sm"
                data-testid={`tab-${tab.value}`}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Goals */}
              <Card className="lg:col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-[#D4A84C]" />
                    Financial Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {client.goals.map((goal) => {
                    const GoalIcon = goal.icon;
                    const progressColor = goal.progress >= 75 ? "bg-emerald-500" : goal.progress >= 40 ? "bg-[#D4A84C]" : "bg-blue-500";
                    return (
                      <div key={goal.id} className="p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${progressColor}/10`}>
                              <GoalIcon className={`h-4 w-4 ${goal.progress >= 75 ? 'text-emerald-600' : goal.progress >= 40 ? 'text-[#D4A84C]' : 'text-blue-600'}`} />
                            </div>
                            <span className="font-medium text-sm">{goal.name}</span>
                          </div>
                          <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full bg-muted">
                            {goal.progress}%
                          </span>
                        </div>
                        <Progress value={goal.progress} className="h-1.5 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="tabular-nums">{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                          <span>Target: {formatDate(goal.targetDate)}</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Family Members */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5 text-[#D4A84C]" />
                    Family
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {client.family.map((member, idx) => (
                    <div key={`item-${idx}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#0f1d35]/5 flex items-center justify-center text-[#0f1d35] text-xs font-semibold">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.relationship}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded">Age {member.age}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                    Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(client.wealth.assetAllocation).map(([asset, percent]) => (
                    <div key={asset} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{asset.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Insurance Summary */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5 text-[#D4A84C]" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.insurance.map((ins, idx) => (
                    <div key={`item-${idx}`} className="flex items-center justify-between p-2 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{ins.type}</p>
                        <p className="text-xs text-muted-foreground">{ins.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(ins.sumInsured)}</p>
                        <Badge className={ins.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                          {ins.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Key Dates */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-[#D4A84C]" />
                    Key Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.keyDates.slice(0, 5).map((kd, idx) => (
                    <div key={`item-${idx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-2 h-2 rounded-full ${
                        kd.type === 'review' ? 'bg-amber-500' :
                        kd.type === 'birthday' ? 'bg-pink-500' :
                        kd.type === 'tax' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{kd.event}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(kd.date)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Retirement Tab — Full Workshop */}
          <TabsContent value="retirement" className="space-y-6" data-testid="tab-content-retirement">
            <RetirementWorkshop embedded clientId={clientId} />
          </TabsContent>

          {/* Budget Tab — full HouseholdBudget page (same as /budget) */}
          <TabsContent value="budget" className="space-y-6" data-testid="tab-content-budget">
            <HouseholdBudget embedded />
          </TabsContent>

          {/* Goals Tab — Client's financial goals */}
          <TabsContent value="goals" className="space-y-6" data-testid="tab-content-goals">
            <AdviserGoals embedded clientId={clientId} />
          </TabsContent>

          {/* Investments Tab — full UnifiedInvestments page (same as /investments) */}
          <TabsContent value="investments-view" className="space-y-6" data-testid="tab-content-investments-view">
            <UnifiedInvestments embedded />
          </TabsContent>

          {/* Tax Tab — full UnifiedTaxCentre page (same as /tax-analysis-sync) */}
          <TabsContent value="tax" className="space-y-6" data-testid="tab-content-tax">
            <UnifiedTaxCentre embedded />
          </TabsContent>

          {/* Profile & Inputs Tab — Adviser manual data entry */}
          <TabsContent value="profile-inputs" className="space-y-6" data-testid="tab-content-profile-inputs">
            <AdviserClientInputs clientId={clientId} client={client} />
          </TabsContent>

          {/* Holdings Tab - Detailed Asset Breakdown */}
          <TabsContent value="holdings" className="space-y-6">
            {/* Net Worth Breakdown by Asset Class */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                  Net Worth Breakdown by Asset Class
                </CardTitle>
                <CardDescription>Click on any asset category to view detailed holdings and research</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(ASSET_HOLDINGS).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                      <Dialog key={key}>
                        <DialogTrigger asChild>
                          <Card 
                            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-[#D4A84C]"
                            data-testid={`asset-category-${key}`}
                          >
                            <CardContent className="p-4 text-center">
                              <div 
                                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Icon className="h-6 w-6" style={{ color: category.color }} />
                              </div>
                              <p className="font-semibold text-lg">{formatCurrency(category.total)}</p>
                              <p className="text-xs text-muted-foreground">{category.label}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {category.holdings.length} holdings
                              </Badge>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Icon className="h-5 w-5" style={{ color: category.color }} />
                              {category.label} - {formatCurrency(category.total)}
                            </DialogTitle>
                            <DialogDescription>
                              Detailed holdings and research reports
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] pr-4">
                            {/* Holdings Table */}
                            <div className="space-y-4">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Wallet className="h-4 w-4" /> Holdings ({category.holdings.length})
                              </h4>
                              <div className="space-y-2">
                                {category.holdings.map((holding, idx) => (
                                  <Card key={`item-${idx}`} className="bg-muted/30">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">{holding.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {holding.symbol} • {holding.units.toLocaleString()} units @ ${holding.price?.toLocaleString() || 'N/A'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold">{formatCurrency(holding.value)}</p>
                                          {holding.change !== undefined && (
                                            <p className={`text-sm ${holding.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                              {holding.change >= 0 ? '+' : ''}{holding.change}%
                                            </p>
                                          )}
                                          {holding.yield !== undefined && (
                                            <p className="text-sm text-muted-foreground">Yield: {holding.yield}%</p>
                                          )}
                                          {holding.rate !== undefined && (
                                            <p className="text-sm text-muted-foreground">Rate: {holding.rate}%</p>
                                          )}
                                        </div>
                                      </div>
                                      {holding.costBase && (
                                        <div className="mt-2 pt-2 border-t text-sm text-muted-foreground flex justify-between">
                                          <span>Cost Base: {formatCurrency(holding.costBase)}</span>
                                          <span className={holding.value > holding.costBase ? 'text-emerald-600' : 'text-red-600'}>
                                            P&L: {formatCurrency(holding.value - holding.costBase)} ({((holding.value - holding.costBase) / holding.costBase * 100).toFixed(1)}%)
                                          </span>
                                        </div>
                                      )}
                                      {holding.maturity && (
                                        <p className="text-sm text-muted-foreground mt-1">Maturity: {formatDate(holding.maturity)}</p>
                                      )}
                                      {holding.debt !== undefined && holding.debt > 0 && (
                                        <p className="text-sm text-red-600 mt-1">Outstanding Debt: {formatCurrency(holding.debt)}</p>
                                      )}
                                      {holding.rental !== undefined && holding.rental > 0 && (
                                        <p className="text-sm text-emerald-600 mt-1">Monthly Rental: {formatCurrency(holding.rental)}</p>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>

                              {/* Research Reports */}
                              {category.research && category.research.length > 0 && (
                                <>
                                  <Separator className="my-4" />
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" /> Research Reports
                                  </h4>
                                  <div className="space-y-2">
                                    {category.research.map((report, idx) => (
                                      <Card key={`item-${idx}`} className="bg-blue-50/50 border-blue-200">
                                        <CardContent className="p-3">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <p className="font-medium">{report.title}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {report.source} • {formatDate(report.date)}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <Badge variant="outline" className="bg-white">
                                                {report.rating}
                                              </Badge>
                                              {report.target && (
                                                <p className="text-sm text-emerald-600 mt-1">Target: ${report.target}</p>
                                              )}
                                            </div>
                                          </div>
                                          <Button variant="link" size="sm" className="px-0 mt-2">
                                            <ExternalLink className="h-3 w-3 mr-1" /> View Full Report
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <Card className="bg-gradient-to-r from-[#1a2744] to-[#2a3f5f] text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70">Total Portfolio Value</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(Object.values(ASSET_HOLDINGS).reduce((sum, cat) => sum + cat.total, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70">Total Holdings</p>
                    <p className="text-2xl font-bold">
                      {Object.values(ASSET_HOLDINGS).reduce((sum, cat) => sum + cat.holdings.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceSection />
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`account-${account.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          account.type === 'Liability' ? 'bg-red-100' : 'bg-[#1a2744]/10'
                        }`}>
                          <account.icon className={`h-5 w-5 ${account.type === 'Liability' ? 'text-red-600' : 'text-[#1a2744]'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.institution} • {account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${account.balance < 0 ? 'text-red-600' : ''}`}>
                          {formatCurrency(Math.abs(account.balance))}
                        </p>
                        <p className={`text-sm flex items-center justify-end gap-1 ${
                          account.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {account.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {account.changePercent >= 0 ? '+' : ''}{account.changePercent}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50" data-testid={`txn-${txn.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-20">
                          {formatDate(txn.date)}
                        </div>
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{txn.account}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${getTransactionColor(txn.type)}`}>
                        {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks & Actions</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]">
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`task-${task.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50" data-testid={`doc-${doc.id}`}>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} • {formatDate(doc.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          doc.status === 'signed' ? 'text-emerald-600 border-emerald-300' :
                          doc.status === 'current' ? 'text-blue-600 border-blue-300' : ''
                        }>{doc.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Timeline Tab */}
          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Communication Timeline</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]">
                    <Plus className="h-4 w-4 mr-2" /> Log Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-6">
                    {client.communications.map((comm) => {
                      const CommIcon = getCommIcon(comm.type);
                      return (
                        <div key={comm.id} className="relative pl-10" data-testid={`comm-${comm.id}`}>
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-[#1a2744] flex items-center justify-center">
                            <CommIcon className="h-4 w-4 text-[#1a2744]" />
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize">{comm.type}</Badge>
                                  <Badge variant="secondary" className="capitalize">{comm.direction}</Badge>
                                  {comm.duration && (
                                    <span className="text-xs text-muted-foreground">{comm.duration}</span>
                                  )}
                                </div>
                                <p className="mt-2">{comm.summary}</p>
                                <p className="text-xs text-muted-foreground mt-2">By: {comm.by}</p>
                              </div>
                              <span className="text-sm text-muted-foreground">{formatDate(comm.date)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Advisor Tab */}
          <TabsContent value="contact" className="space-y-6">
            <ContactAdvisorSection client={client} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Performance Section Component
const PerformanceSection = () => {
  const [timeframe, setTimeframe] = useState("1Y");
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const monthsMap = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "5Y": 60, "10Y": 120 };
    setPerformanceData(generatePerformanceData(monthsMap[timeframe] || 12));
  }, [timeframe]);

  const startValue = performanceData[0]?.value || 0;
  const endValue = performanceData[performanceData.length - 1]?.value || 0;
  const totalReturn = startValue ? ((endValue - startValue) / startValue * 100) : 0;

  return (
    <>
      {/* Timeframe Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-[#D4A84C]" />
                Portfolio Performance
              </CardTitle>
              <CardDescription>Historical returns vs benchmark</CardDescription>
            </div>
            <div className="flex gap-1">
              {PERFORMANCE_TIMEFRAMES.map(tf => (
                <Button
                  key={tf}
                  size="sm"
                  variant={timeframe === tf ? "default" : "outline"}
                  onClick={() => setTimeframe(tf)}
                  className={timeframe === tf ? "bg-[#D4A84C] text-black hover:bg-[#C49A3C]" : ""}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis 
                  stroke="#666" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => [formatCurrency(value), ""]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Portfolio"
                  stroke="#3B82F6"
                  fill="url(#colorPortfolio)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  name="Benchmark"
                  stroke="#9CA3AF"
                  fill="url(#colorBenchmark)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Return ({timeframe})</p>
            <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Starting Value</p>
            <p className="text-2xl font-bold">{formatCurrency(startValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-2xl font-bold">{formatCurrency(endValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Absolute Gain/Loss</p>
            <p className={`text-2xl font-bold ${endValue >= startValue ? 'text-emerald-600' : 'text-red-600'}`}>
              {endValue >= startValue ? '+' : ''}{formatCurrency(endValue - startValue)}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Contact Advisor Section Component
const ContactAdvisorSection = ({ client }) => {
  const [contactMethod, setContactMethod] = useState("platform");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }
    
    setSending(true);
    try {
      const response = await axios.post(`${API}/api/client-contact/send-message`, {
        client_id: client.id || "client_demo",
        client_name: client.name,
        advisor_email: "mark.thompson@wealthcommand.io",
        advisor_name: client.advisor || "Mark Thompson",
        subject: subject,
        message: message,
        contact_method: contactMethod,
        priority: "normal"
      });
      
      if (response.data.status === "delivered") {
        toast.success(response.data.confirmation || "Message sent successfully!");
        setSubject("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (actionType) => {
    try {
      const response = await axios.post(`${API}/api/client-contact/quick-action`, {
        client_id: client.id || "client_demo",
        client_name: client.name,
        action_type: actionType,
        details: {}
      });
      
      toast.success(response.data.message || `${actionType} request submitted!`);
    } catch (error) {
      console.error("Error processing quick action:", error);
      toast.error("Failed to process request. Please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Advisor Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-[#D4A84C]" />
            Your Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#1a2744] text-white text-xl">MT</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{client.advisor}</p>
              <p className="text-sm text-muted-foreground">Senior Financial Advisor</p>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700">Available</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>mark.thompson@wealthcommand.io</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>+61 2 9123 4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Next Review: {formatDate(client.nextReview)}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" /> Call
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Video className="h-4 w-4 mr-2" /> Video
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#D4A84C]" />
            Send a Message
          </CardTitle>
          <CardDescription>Choose how you'd like to contact your advisor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Method Toggle */}
          <div className="flex gap-2">
            <Button
              variant={contactMethod === "platform" ? "default" : "outline"}
              onClick={() => setContactMethod("platform")}
              className={contactMethod === "platform" ? "bg-[#1a2744]" : ""}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Platform Message
            </Button>
            <Button
              variant={contactMethod === "email" ? "default" : "outline"}
              onClick={() => setContactMethod("email")}
              className={contactMethod === "email" ? "bg-[#1a2744]" : ""}
            >
              <Mail className="h-4 w-4 mr-2" />
              Direct Email
            </Button>
          </div>

          {contactMethod === "platform" && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">Secure Platform Messaging</p>
              <p>Messages are encrypted and stored within Wealth Command. Your advisor typically responds within 24 hours.</p>
            </div>
          )}

          {contactMethod === "email" && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <p className="font-medium">Email Communication</p>
              <p>This will send an email directly to your advisor. For sensitive information, consider using platform messaging.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Question about portfolio rebalancing"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {contactMethod === "platform" ? "Message will be visible in your timeline" : "A copy will be sent to your email"}
            </p>
            <Button 
              className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              onClick={handleSend}
              disabled={!subject || !message || sending}
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {contactMethod === "email" ? "Email" : "Message"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("schedule_meeting")}
              data-testid="quick-action-schedule-meeting"
            >
              <Calendar className="h-6 w-6 mb-2" />
              <span>Schedule Meeting</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("request_statement")}
              data-testid="quick-action-request-statement"
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Request Statement</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("upload_document")}
              data-testid="quick-action-upload-document"
            >
              <Upload className="h-6 w-6 mb-2" />
              <span>Upload Document</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("set_reminder")}
              data-testid="quick-action-set-reminder"
            >
              <Bell className="h-6 w-6 mb-2" />
              <span>Set Reminder</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Client360View;
