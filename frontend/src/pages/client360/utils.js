// Client360 view — formatters, merger, helpers.
// Pure functions only (no JSX). UI icons are looked up from ASSET_ICONS.
import { Phone, Mail, Users, Video, MessageSquare, Target, Home, DollarSign, TrendingUp, Building2 } from "lucide-react";
import { CLIENT_DATA } from "@/data/clientData";
import { DEMO_CLIENT_DATA, CLIENT_ID_MAP, ASSET_ICONS } from "./data";

export const formatCurrency = (value) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });

export const getInitials = (name) =>
  (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const getPriorityColor = (priority) => {
  switch (priority) {
    case "urgent": return "bg-red-500 text-white";
    case "high": return "bg-orange-500 text-white";
    case "medium": return "bg-amber-500 text-white";
    case "low": return "bg-blue-500 text-white";
    default: return "bg-gray-500 text-white";
  }
};

export const getTransactionColor = (type) => {
  switch (type) {
    case "income": return "text-emerald-600";
    case "contribution": return "text-blue-600";
    case "investment": return "text-purple-600";
    case "expense": return "text-red-600";
    default: return "text-foreground";
  }
};

export const getCommIcon = (type) => {
  switch (type) {
    case "call": return Phone;
    case "email": return Mail;
    case "meeting": return Users;
    case "video": return Video;
    default: return MessageSquare;
  }
};

// Generate mock performance history for the Performance tab
export const generatePerformanceData = (months) => {
  const data = [];
  let value = 2_500_000;
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthlyReturn = (Math.random() - 0.3) * 0.05;
    value = value * (1 + monthlyReturn);
    data.push({
      date: date.toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
      value: Math.round(value),
      benchmark: Math.round(value * (0.95 + Math.random() * 0.1)),
    });
  }
  return data;
};

// Merge CLIENT_DATA (HNW source-of-truth) into the DEMO structure so the
// header, totals and accounts match the embedded Budget/Investments/Tax pages.
const mergeWithCanonicalClient = (demo, clientId) => {
  const canonicalKey = CLIENT_ID_MAP[clientId];
  const canonical = canonicalKey ? CLIENT_DATA[canonicalKey] : null;
  if (!canonical) return demo;

  const totalAssets = canonical.assets.reduce((s, a) => s + (a.value || 0), 0);
  const totalLiab = canonical.liabilities.reduce((s, l) => s + (l.value || 0), 0);
  const netWorth = totalAssets - totalLiab;
  const weightedChange = totalAssets
    ? canonical.assets.reduce((s, a) => s + (a.value || 0) * (a.change || 0), 0) / totalAssets
    : 0;
  const dollarChange = Math.round((netWorth * weightedChange) / 100);

  const byType = canonical.assets.reduce((acc, a) => {
    const bucket = a.type === "Super" ? "super"
      : a.type === "Property" ? "property"
      : a.type === "Shares" || a.type === "Managed Fund" ? "equities"
      : a.type === "Cash" ? "cash"
      : "other";
    acc[bucket] = (acc[bucket] || 0) + (a.value || 0);
    return acc;
  }, {});
  const allocPct = (v) => (totalAssets ? Math.round((v / totalAssets) * 100) : 0);
  const assetAllocation = {
    equities: allocPct(byType.equities || 0),
    property: allocPct(byType.property || 0),
    super: allocPct(byType.super || 0),
    cash: allocPct(byType.cash || 0),
    other: allocPct(byType.other || 0),
  };

  const accounts = [
    ...canonical.assets.map((a, i) => ({
      id: i + 1,
      name: a.name,
      type: a.type,
      institution: a.entity,
      balance: a.value,
      change: Math.round(((a.value || 0) * (a.change || 0)) / 100),
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
      ...(canonical.profile?.partner_first_name
        ? [{ name: `${canonical.profile.partner_first_name} ${canonical.profile.last_name}`, relationship: "Spouse", dob: "", age: canonical.profile?.age }]
        : []),
    ],
    goals: (() => {
      const retirementTarget = (canonical.retirement?.retirement_spending || 180000) * 25;
      const retirementCurrent = canonical.assets
        .filter((a) => ["Super", "Shares", "Managed Fund", "Bonds", "Alternatives", "SMSF", "Trust Portfolio"].includes(a.type))
        .reduce((s, a) => s + (a.value || 0), 0);
      const loanTarget = canonical.liabilities?.find((l) => /investment/i.test(l.name))?.value || 0;
      const loanCurrent = loanTarget ? Math.round(loanTarget * 0.35) : 0;
      const progressPct = (cur, tgt) => (tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) : 0);
      return [
        { id: 1, name: `Retirement at ${canonical.retirement?.retirement_age || 67}`, target: retirementTarget, current: retirementCurrent, progress: progressPct(retirementCurrent, retirementTarget), targetDate: `${new Date().getFullYear() + (canonical.retirement?.retirement_age - canonical.retirement?.current_age || 17)}-06-30`, icon: Target },
        ...(loanTarget ? [{ id: 2, name: "Pay off investment loan", target: loanTarget, current: loanCurrent, progress: progressPct(loanCurrent, loanTarget), targetDate: "2035-01-01", icon: Home }] : []),
        { id: 3, name: "Emergency fund 6 months", target: Math.round((canonical.profile?.expensesAnnual || 120000) / 2), current: Math.round((canonical.profile?.expensesAnnual || 120000) / 3), progress: 67, targetDate: "2027-12-31", icon: DollarSign },
      ];
    })(),
    _canonical: canonical,
  };
};

export const getClientData = (clientId) => {
  const base = DEMO_CLIENT_DATA[clientId] || DEMO_CLIENT_DATA.client_1;
  return mergeWithCanonicalClient(base, clientId);
};
