// Client360 — top header card with client identity, wealth, action buttons, info strip & metrics.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, Video, ArrowUpRight, ArrowDownRight, Calculator, Maximize2,
  Briefcase, MapPin, Calendar, UserCircle, Activity, Star,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "./utils";

const ClientHeader = ({ client, onModel, onMeeting }) => (
  <div className="rounded-xl overflow-hidden border shadow-sm" data-testid="client-header">
    {/* Top — Name & Wealth */}
    <div className="bg-[#0f1d35] px-8 py-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#D4A84C] to-[#b8922f] flex items-center justify-center text-[#0f1d35] text-xl font-bold shrink-0 ring-2 ring-white/10">
            {getInitials(client.name)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-white tracking-tight" data-testid="client-name">{client.name}</h1>
              <Badge className={`text-xs font-medium ${
                client.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : client.status === "prospect" ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`} data-testid="client-status">{client.status}</Badge>
              {client.satisfaction >= 90 && <Star className="h-4 w-4 text-amber-400 fill-amber-400" />}
            </div>
            <div className="flex items-center gap-5 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> {client.type === "household" ? "Household" : client.type === "trust" ? "Trust" : client.type === "smsf" ? "SMSF" : "Individual"}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {client.address.split(",").slice(-1)[0].trim()}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Since {formatDate(client.clientSince)}
              </span>
            </div>
          </div>
        </div>

        {/* Wealth & actions */}
        <div className="flex items-start gap-6">
          <div className="text-right space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">Total Wealth</p>
            <p className="text-4xl font-bold text-white tabular-nums" data-testid="client-wealth">{formatCurrency(client.wealth.total)}</p>
            <p className={`text-sm font-medium flex items-center justify-end gap-1 ${client.wealth.changePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {client.wealth.changePercent >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
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
            <Button size="sm" variant="outline" className="border-[#D4A84C]/40 text-[#D4A84C] hover:bg-[#D4A84C]/10 h-8 text-xs" onClick={onModel} data-testid="transaction-modeler-btn">
              <Calculator className="h-3.5 w-3.5 mr-1.5" /> Model
            </Button>
            <Button size="sm" className="bg-[#D4A84C] text-[#0f1d35] hover:bg-[#c49b3f] h-8 text-xs font-medium" onClick={onMeeting} data-testid="meeting-mode-btn">
              <Maximize2 className="h-3.5 w-3.5 mr-1.5" /> Meeting
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Info Strip */}
    <div className="bg-[#162240] px-8 py-3 flex items-center gap-6 text-sm text-white/60 border-t border-white/5 overflow-x-auto">
      <span className="flex items-center gap-1.5 whitespace-nowrap"><Mail className="h-3.5 w-3.5 text-white/30" /> {client.email}</span>
      <span className="w-px h-4 bg-white/10" />
      <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="h-3.5 w-3.5 text-white/30" /> {client.phone}</span>
      <span className="w-px h-4 bg-white/10" />
      <span className="flex items-center gap-1.5 whitespace-nowrap"><UserCircle className="h-3.5 w-3.5 text-white/30" /> Advisor: {client.advisor}</span>
      <span className="w-px h-4 bg-white/10" />
      <span className="flex items-center gap-1.5 whitespace-nowrap"><Activity className="h-3.5 w-3.5 text-white/30" /> Risk: {client.riskProfile}</span>
    </div>

    {/* Metrics Bar */}
    <div className="grid grid-cols-3 md:grid-cols-6 bg-white">
      {[
        { label: "Accounts", value: client.accounts.length, color: "" },
        { label: "Open Tasks", value: client.tasks.filter((t) => t.status === "pending" || t.status === "overdue").length, color: client.tasks.some((t) => t.status === "overdue") ? "text-red-600" : "" },
        { label: "Documents", value: client.documents.length, color: "" },
        { label: "Satisfaction", value: client.satisfaction ? `${client.satisfaction}%` : "N/A", color: client.satisfaction >= 90 ? "text-emerald-600" : client.satisfaction >= 70 ? "text-amber-600" : "text-red-600" },
        { label: "NPS Score", value: client.nps || "N/A", color: "" },
        { label: "Next Review", value: client.nextReview ? formatDate(client.nextReview) : "TBD", color: "" },
      ].map((metric, idx) => (
        <div key={idx} className="text-center py-4 px-2 border-r last:border-r-0 border-b md:border-b-0">
          <p className={`text-xl font-bold ${metric.color}`} data-testid={`metric-${metric.label.toLowerCase().replace(/\s/g, "-")}`}>{metric.value}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-0.5">{metric.label}</p>
        </div>
      ))}
    </div>
  </div>
);

export default ClientHeader;
