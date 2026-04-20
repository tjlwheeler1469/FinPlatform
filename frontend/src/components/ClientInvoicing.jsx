import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  FileText, Plus, DollarSign, Send, Check, Trash2, Download
} from "lucide-react";
import { toast } from "sonner";
import { getActiveClientId, CLIENT_DATA } from "@/data/clientData";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

const API = process.env.REACT_APP_BACKEND_URL;
const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(v || 0);

const STATUS_COLORS = { draft: "bg-gray-400", sent: "bg-blue-500", paid: "bg-emerald-500", overdue: "bg-red-500", cancelled: "bg-gray-300" };

const ClientInvoicing = ({ clientId: propClientId }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [invoices, setInvoices] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [lines, setLines] = useState([{ description: "", quantity: 1, unit_price: 0, gst: true }]);

  useEffect(() => {
    fetch(`${API}/api/invoices/client/${clientId}`)
      .then(r => r.json()).then(setInvoices).catch(() => {});
  }, [clientId]);

  const addLine = () => setLines(prev => [...prev, { description: "", quantity: 1, unit_price: 0, gst: true }]);
  const removeLine = (i) => setLines(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const gstTotal = lines.reduce((s, l) => s + (l.gst ? l.quantity * l.unit_price * 0.1 : 0), 0);
  const total = subtotal + gstTotal;

  const createInvoice = async () => {
    if (lines.some(l => !l.description || l.unit_price <= 0)) {
      toast.error("Please fill in all line items"); return;
    }
    try {
      const res = await fetch(`${API}/api/invoices/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_name: client.profile.name, line_items: lines }),
      });
      const inv = await res.json();
      setInvoices(prev => [inv, ...prev]);
      setShowCreate(false);
      setLines([{ description: "", quantity: 1, unit_price: 0, gst: true }]);
      toast.success(`Invoice ${inv.invoice_id} created`);
    } catch { toast.error("Failed to create invoice"); }
  };

  const updateStatus = async (invoiceId, status) => {
    try {
      await fetch(`${API}/api/invoices/${invoiceId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setInvoices(prev => prev.map(inv => inv.invoice_id === invoiceId ? { ...inv, status } : inv));
      toast.success(`Invoice marked as ${status}`);
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-4" data-testid="client-invoicing">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Invoices — {client.profile.name}
        </h3>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} data-testid="create-invoice-btn">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Invoice
        </Button>
      </div>

      {/* Create Invoice Form */}
      {showCreate && (
        <Card className="border-[#D4A84C]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">New Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center" data-testid={`invoice-line-${i}`}>
                <Input className="col-span-5" placeholder="Description" value={line.description}
                  onChange={(e) => updateLine(i, "description", e.target.value)} />
                <Input className="col-span-2 text-right" type="number" placeholder="Qty" value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", parseFloat(e.target.value) || 0)} />
                <Input className="col-span-2 text-right" type="number" placeholder="Unit $" value={line.unit_price || ""}
                  onChange={(e) => updateLine(i, "unit_price", parseFloat(e.target.value) || 0)} />
                <div className="col-span-2 flex items-center gap-1 text-xs">
                  <Switch checked={line.gst} onCheckedChange={(v) => updateLine(i, "gst", v)} /> GST
                </div>
                <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeLine(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-1" /> Add Line</Button>
            <div className="border-t pt-2 space-y-1 text-sm text-right">
              <p>Subtotal: {fmt(subtotal)}</p>
              <p>GST (10%): {fmt(gstTotal)}</p>
              <p className="font-bold text-base">Total: {fmt(total)}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={createInvoice} data-testid="submit-invoice-btn">
                <Check className="h-3.5 w-3.5 mr-1" /> Create Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      <div className="space-y-2">
        {invoices.map(inv => (
          <Card key={inv.invoice_id} data-testid={`invoice-${inv.invoice_id}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-[#D4A84C]" />
                <div>
                  <p className="text-sm font-medium">{inv.invoice_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.line_items?.map(l => l.description).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold">{fmt(inv.total)}</p>
                <Badge className={STATUS_COLORS[inv.status] || "bg-gray-400"}>{inv.status}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    try {
                      generateInvoicePDF({
                        ...inv,
                        invoice_number: inv.invoice_id,
                        client_name: client.profile.name,
                        client_email: client.profile.email,
                        issue_date: inv.created_at ? new Date(inv.created_at).toLocaleDateString("en-AU") : new Date().toLocaleDateString("en-AU"),
                        due_date: inv.due_date || "On receipt",
                        line_items: inv.line_items,
                        subtotal: inv.subtotal,
                        gst: inv.gst,
                        total: inv.total,
                      });
                      toast.success("Invoice PDF downloaded");
                    } catch { toast.error("PDF generation failed"); }
                  }}
                  data-testid={`invoice-${inv.invoice_id}-pdf`}
                >
                  <Download className="h-3 w-3 mr-1" /> PDF
                </Button>
                {inv.status === "draft" && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => updateStatus(inv.invoice_id, "sent")}>
                    <Send className="h-3 w-3 mr-1" /> Send
                  </Button>
                )}
                {inv.status === "sent" && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => updateStatus(inv.invoice_id, "paid")}>
                    <Check className="h-3 w-3 mr-1" /> Mark Paid
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {invoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No invoices yet</p>}
      </div>
    </div>
  );
};

export default ClientInvoicing;
