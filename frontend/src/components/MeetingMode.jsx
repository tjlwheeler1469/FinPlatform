import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  X, Phone, Mail, Target, Shield, TrendingUp, ArrowUpRight, ArrowDownRight,
  Users, Calendar, Clock, FileText, CheckCircle2, AlertCircle, Maximize2,
  ChevronLeft, ChevronRight, Download, Keyboard
} from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "TBD";
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
};

const MeetingMode = ({ client, onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef(null);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") { onExit(); return; }
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrentSlide(s => Math.min(5, s + 1)); }
    if (e.key === "ArrowLeft") { setCurrentSlide(s => Math.max(0, s - 1)); }
    if (e.key === "f" || e.key === "F") {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
    // Number keys 1-6 to jump to slide
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6) setCurrentSlide(num - 1);
  }, [onExit]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!client) return null;

  const pendingTasks = client.tasks?.filter(t => t.status === "pending" || t.status === "overdue") || [];
  const overdueTasks = client.tasks?.filter(t => t.status === "overdue") || [];

  // PDF Export
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Build a simple text-based PDF content
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const darkBg = [15, 29, 53];
      const gold = [212, 168, 76];
      const white = [255, 255, 255];

      // Slide 1: Client Overview
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 297, 210, "F");
      doc.setTextColor(...gold);
      doc.setFontSize(32);
      doc.text(client.name || "Client", 148, 60, { align: "center" });
      doc.setTextColor(...white);
      doc.setFontSize(14);
      doc.text(`Net Worth: ${formatCurrency(client.wealth?.total)}`, 148, 80, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Risk Profile: ${client.riskProfile || "N/A"} | ${client.type || ""} | Since ${formatDate(client.clientSince)}`, 148, 95, { align: "center" });
      doc.text(`Phone: ${client.phone || "N/A"} | Email: ${client.email || "N/A"}`, 148, 108, { align: "center" });

      // Slide 2: Goals
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 297, 210, "F");
      doc.setTextColor(...gold);
      doc.setFontSize(24);
      doc.text("Financial Goals", 20, 30);
      doc.setTextColor(...white);
      doc.setFontSize(11);
      (client.goals || []).forEach((goal, i) => {
        const y = 50 + i * 25;
        doc.text(`${goal.name} — ${goal.progress}%`, 25, y);
        doc.text(`${formatCurrency(goal.current)} of ${formatCurrency(goal.target)}`, 25, y + 8);
        doc.setDrawColor(...gold);
        doc.rect(25, y + 12, 120, 3);
        doc.setFillColor(...gold);
        doc.rect(25, y + 12, 120 * (goal.progress / 100), 3, "F");
      });

      // Slide 3: Asset Allocation
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 297, 210, "F");
      doc.setTextColor(...gold);
      doc.setFontSize(24);
      doc.text("Asset Allocation", 20, 30);
      doc.setTextColor(...white);
      doc.setFontSize(12);
      (client.assetAllocation || []).forEach((a, i) => {
        const y = 55 + i * 18;
        doc.text(`${a.name}: ${a.percentage}% (${formatCurrency(a.value)})`, 25, y);
      });

      // Slide 4: Family
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 297, 210, "F");
      doc.setTextColor(...gold);
      doc.setFontSize(24);
      doc.text("Family Members", 20, 30);
      doc.setTextColor(...white);
      doc.setFontSize(12);
      (client.family || []).forEach((m, i) => {
        doc.text(`${m.name} — ${m.relationship}, Age ${m.age}`, 25, 55 + i * 14);
      });

      // Slide 5: Action Items
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 297, 210, "F");
      doc.setTextColor(...gold);
      doc.setFontSize(24);
      doc.text("Action Items", 20, 30);
      doc.setTextColor(...white);
      doc.setFontSize(11);
      pendingTasks.forEach((t, i) => {
        const y = 55 + i * 14;
        doc.setTextColor(t.status === "overdue" ? 239 : 251, t.status === "overdue" ? 68 : 191, t.status === "overdue" ? 68 : 36);
        doc.text(`[${t.status?.toUpperCase()}] ${t.title || t.name} — Due: ${formatDate(t.dueDate || t.due)}`, 25, y);
      });

      // Slide 6: Key Dates
      doc.addPage();
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 297, 210, "F");
      doc.setTextColor(...gold);
      doc.setFontSize(24);
      doc.text("Key Dates & Summary", 20, 30);
      doc.setTextColor(...white);
      doc.setFontSize(12);
      (client.keyDates || []).forEach((d, i) => {
        doc.text(`${d.label}: ${formatDate(d.date)}`, 25, 55 + i * 14);
      });
      doc.text(`Next Review: ${formatDate(client.nextReview)}`, 25, 55 + (client.keyDates?.length || 0) * 14 + 10);

      doc.save(`${client.name?.replace(/\s/g, "_")}_Meeting_Slides.pdf`);
      toast.success("Meeting slides exported as PDF");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF — ensure jsPDF is available");
    } finally {
      setExporting(false);
    }
  };

  const slides = [
    // Slide 0: Client Overview
    () => (
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#D4A84C] to-[#b8922f] flex items-center justify-center text-[#0f1d35] text-3xl font-bold ring-4 ring-white/10">
          {client.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-white tracking-tight">{client.name}</h1>
          <p className="text-white/50 text-lg">{client.type === "household" ? "Household" : client.type === "trust" ? "Trust" : client.type === "smsf" ? "SMSF" : "Individual"} &middot; Client since {formatDate(client.clientSince)}</p>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-6xl font-bold text-white tabular-nums">{formatCurrency(client.wealth?.total)}</span>
          <span className={`text-xl font-medium ${client.wealth?.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {client.wealth?.changePercent >= 0 ? "+" : ""}{client.wealth?.changePercent}%
          </span>
        </div>
        <div className="flex gap-8 text-white/40 text-sm mt-4">
          <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {client.phone}</span>
          <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {client.email}</span>
          <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" /> {client.riskProfile} Risk</span>
        </div>
      </div>
    ),

    // Slide 1: Goals
    () => (
      <div className="flex flex-col h-full">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Target className="h-8 w-8 text-[#D4A84C]" /> Financial Goals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {client.goals?.map((goal) => {
            const progressColor = goal.progress >= 75 ? "text-emerald-400" : goal.progress >= 40 ? "text-[#D4A84C]" : "text-blue-400";
            return (
              <Card key={goal.id} className="bg-white/5 border-white/10 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">{goal.name}</h3>
                    <span className={`text-2xl font-bold tabular-nums ${progressColor}`}>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2.5 bg-white/10" />
                  <div className="flex justify-between text-sm text-white/50">
                    <span className="tabular-nums">{formatCurrency(goal.current)} of {formatCurrency(goal.target)}</span>
                    <span>Target: {formatDate(goal.targetDate)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    ),

    // Slide 2: Asset Allocation
    () => (
      <div className="flex flex-col h-full">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-[#D4A84C]" /> Asset Allocation
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 flex-1 content-start">
          {client.assetAllocation?.map((asset, idx) => (
            <Card key={idx} className="bg-white/5 border-white/10 backdrop-blur">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-4xl font-bold text-white tabular-nums">{asset.percentage}%</p>
                <p className="text-white/60 text-sm font-medium">{asset.name}</p>
                <p className="text-white/40 text-xs tabular-nums">{formatCurrency(asset.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ),

    // Slide 3: Family
    () => (
      <div className="flex flex-col h-full">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Users className="h-8 w-8 text-[#D4A84C]" /> Family
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 content-start">
          {client.family?.map((member, idx) => (
            <Card key={idx} className="bg-white/5 border-white/10 backdrop-blur">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-[#D4A84C]/20 flex items-center justify-center text-[#D4A84C] text-lg font-bold mx-auto">
                  {member.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-white/40 text-sm capitalize">{member.relationship} &middot; Age {member.age}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ),

    // Slide 4: Action Items
    () => (
      <div className="flex flex-col h-full">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-[#D4A84C]" /> Action Items
          {overdueTasks.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-sm">{overdueTasks.length} Overdue</Badge>
          )}
        </h2>
        <div className="space-y-4 flex-1 overflow-y-auto">
          {pendingTasks.length === 0 ? (
            <Card className="bg-white/5 border-white/10"><CardContent className="p-8 text-center text-white/50">No pending tasks</CardContent></Card>
          ) : pendingTasks.map((task, idx) => (
            <Card key={idx} className={`border-white/10 backdrop-blur ${task.status === "overdue" ? "bg-red-500/10 border-red-500/20" : "bg-white/5"}`}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {task.status === "overdue" ? (
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-white font-medium">{task.title || task.name}</p>
                    <p className="text-white/40 text-sm">{task.category || "General"} &middot; Due: {formatDate(task.dueDate || task.due)}</p>
                  </div>
                </div>
                <Badge className={task.status === "overdue" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}>
                  {task.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ),

    // Slide 5: Key Dates
    () => (
      <div className="flex flex-col h-full">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-[#D4A84C]" /> Key Dates & Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 content-start">
          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-white font-semibold text-lg">Upcoming Dates</h3>
              {client.keyDates?.map((date, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/70">{date.label}</span>
                  <span className="text-white font-medium tabular-nums">{formatDate(date.date)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between py-2">
                <span className="text-white/70">Next Review</span>
                <span className="text-[#D4A84C] font-semibold tabular-nums">{formatDate(client.nextReview)}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="p-6 space-y-5">
              <h3 className="text-white font-semibold text-lg">Client Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-white">{client.accounts?.length || 0}</p>
                  <p className="text-white/40 text-xs mt-1">Accounts</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-white">{client.documents?.length || 0}</p>
                  <p className="text-white/40 text-xs mt-1">Documents</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-emerald-400">{client.satisfaction || "N/A"}%</p>
                  <p className="text-white/40 text-xs mt-1">Satisfaction</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-2xl font-bold text-white">{client.nps || "N/A"}</p>
                  <p className="text-white/40 text-xs mt-1">NPS Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  ];

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-[#0a1628] flex flex-col" data-testid="meeting-mode">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Maximize2 className="h-5 w-5 text-[#D4A84C]" />
          <span className="text-white/70 text-sm font-medium tracking-wider uppercase">Meeting Mode</span>
          <Badge className="bg-[#D4A84C]/20 text-[#D4A84C] border-[#D4A84C]/30 text-xs">{client.name}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting}
            className="text-white/50 hover:text-white hover:bg-white/10"
            data-testid="export-meeting-pdf"
          >
            <Download className="h-4 w-4 mr-1.5" /> {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          <span className="text-white/20">|</span>
          <span className="text-white/30 text-xs flex items-center gap-1.5">
            <Keyboard className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Arrow keys / Esc / F</span>
          </span>
          <span className="text-white/30 text-sm tabular-nums">{currentSlide + 1} / {slides.length}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-white/50 hover:text-white hover:bg-white/10"
            data-testid="exit-meeting-mode"
          >
            <X className="h-4 w-4 mr-1.5" /> Exit
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 px-12 py-8 overflow-y-auto">
        {slides[currentSlide]()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3 py-5 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20"
          data-testid="meeting-prev"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? "w-8 bg-[#D4A84C]" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
              data-testid={`meeting-dot-${idx}`}
            />
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20"
          data-testid="meeting-next"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default MeetingMode;
