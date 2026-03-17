import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import {
  Zap,
  Play,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  PieChart,
  Users,
  RefreshCw,
  ChevronRight,
  Clock,
  Shield
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const BatchExecution = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [oneClickActions, setOneClickActions] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, actionsRes, batchesRes] = await Promise.all([
        fetch(`${API_URL}/api/batch-execution/status`),
        fetch(`${API_URL}/api/batch-execution/one-click-actions`),
        fetch(`${API_URL}/api/batch-execution/batches`)
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (actionsRes.ok) setOneClickActions((await actionsRes.json()).actions || []);
      if (batchesRes.ok) setBatches((await batchesRes.json()).batches || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
    setLoading(false);
  };

  const previewRebalance = async (clientIds) => {
    try {
      const res = await fetch(`${API_URL}/api/batch-execution/preview/rebalance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientIds)
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPreview(data);
        toast.success(`Preview generated: ${data.summary.total_trades} trades across ${data.summary.total_clients} clients`);
      }
    } catch (error) {
      toast.error("Failed to generate preview");
    }
  };

  const previewTaxHarvest = async (clientIds) => {
    try {
      const res = await fetch(`${API_URL}/api/batch-execution/preview/tax-harvest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientIds)
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPreview(data);
        toast.success(`Tax harvest preview: $${data.summary.total_potential_tax_savings?.toLocaleString()} potential savings`);
      }
    } catch (error) {
      toast.error("Failed to generate preview");
    }
  };

  const executeBatch = async (executionType, clientIds, reason) => {
    setExecuting(true);
    try {
      const res = await fetch(`${API_URL}/api/batch-execution/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          execution_type: executionType,
          client_ids: clientIds,
          reason: reason,
          auto_execute: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Batch created: ${data.trades_generated} trades generated. Awaiting approval.`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to create batch");
    }
    setExecuting(false);
  };

  const approveBatch = async (batchId) => {
    try {
      const res = await fetch(`${API_URL}/api/batch-execution/batches/${batchId}/approve`, { method: "POST" });
      if (res.ok) {
        toast.success("Batch approved");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to approve batch");
    }
  };

  const executeApprovedBatch = async (batchId) => {
    setExecuting(true);
    try {
      const res = await fetch(`${API_URL}/api/batch-execution/batches/${batchId}/execute-approved`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Executed ${data.trades_executed} trades`);
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to execute batch");
    }
    setExecuting(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading execution data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="batch-execution">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Zap className="h-7 w-7 text-yellow-500" />
              Batch Execution Layer
            </h1>
            <p className="text-muted-foreground">One-click execution for rebalancing, tax harvesting, and more</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={status?.alpaca_connected ? "default" : "secondary"} className="gap-1">
              {status?.alpaca_connected ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              Alpaca: {status?.alpaca_connected ? "Connected" : "Demo Mode"}
            </Badge>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* One-Click Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              One-Click Actions
            </CardTitle>
            <CardDescription>AI-identified opportunities ready for execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {oneClickActions.map((action) => (
                <Card key={action.action_id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant={action.priority === "high" ? "destructive" : "secondary"}>{action.priority}</Badge>
                      {action.deadline && <span className="text-xs text-muted-foreground">{action.deadline}</span>}
                    </div>
                    <h4 className="font-semibold mb-2">{action.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {action.affected_clients} clients
                      </span>
                      {action.potential_tax_savings && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(action.potential_tax_savings)} savings
                        </span>
                      )}
                      {action.estimated_value && (
                        <span className="text-muted-foreground">
                          {formatCurrency(action.estimated_value)}
                        </span>
                      )}
                    </div>
                    <Button 
                      className="w-full" 
                      disabled={executing}
                      onClick={() => {
                        if (action.execution_type === "rebalance") {
                          previewRebalance(action.client_ids);
                        } else if (action.execution_type === "tax_harvest") {
                          previewTaxHarvest(action.client_ids);
                        } else {
                          executeBatch(action.execution_type, action.client_ids, action.title);
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Preview & Execute
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="preview">Trade Preview</TabsTrigger>
            <TabsTrigger value="batches">Batch Queue ({batches.length})</TabsTrigger>
          </TabsList>

          {/* Preview */}
          <TabsContent value="preview">
            {selectedPreview ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Trade Preview: {selectedPreview.execution_type}
                  </CardTitle>
                  <CardDescription>
                    {selectedPreview.summary?.total_trades} trades across {selectedPreview.summary?.total_clients} clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedPreview.summary?.total_clients}</p>
                      <p className="text-sm text-muted-foreground">Clients Affected</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{selectedPreview.summary?.total_trades}</p>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedPreview.summary?.total_potential_tax_savings 
                          ? formatCurrency(selectedPreview.summary.total_potential_tax_savings)
                          : formatCurrency(selectedPreview.summary?.total_value || 0)
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPreview.execution_type === "tax_harvest" ? "Tax Savings" : "Trade Value"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {selectedPreview.clients?.map((client, idx) => (
                      <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{client.client_name}</h4>
                          <span className="text-sm text-muted-foreground">{client.trade_count} trades</span>
                        </div>
                        <div className="space-y-2">
                          {client.trades?.map((trade, tidx) => (
                            <div key={tidx} className="flex items-center justify-between text-sm">
                              <span className={trade.action === "sell" ? "text-red-600" : "text-green-600"}>
                                {trade.action.toUpperCase()} {trade.quantity} {trade.symbol}
                              </span>
                              <span className="text-muted-foreground">{formatCurrency(trade.estimated_value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      className="flex-1" 
                      disabled={executing}
                      onClick={() => {
                        const clientIds = selectedPreview.clients?.map(c => c.client_id) || [];
                        executeBatch(selectedPreview.execution_type, clientIds, `Batch ${selectedPreview.execution_type}`);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Create Batch for Approval
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedPreview(null)}>
                      Clear Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Preview Selected</h3>
                  <p className="text-muted-foreground">Select a one-click action above to preview trades</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Batches */}
          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <CardTitle>Batch Queue</CardTitle>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No batches in queue</p>
                ) : (
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div key={batch.batch_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{batch.execution_type}</h4>
                            <Badge variant={
                              batch.status === "completed" ? "default" :
                              batch.status === "approved" ? "secondary" :
                              batch.status === "pending" ? "outline" : "destructive"
                            }>{batch.status}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(batch.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {batch.trade_count} trades • {batch.client_ids?.length} clients
                        </p>
                        <div className="flex gap-2">
                          {batch.status === "pending" && (
                            <Button size="sm" onClick={() => approveBatch(batch.batch_id)}>Approve</Button>
                          )}
                          {batch.status === "approved" && (
                            <Button size="sm" onClick={() => executeApprovedBatch(batch.batch_id)} disabled={executing}>
                              <Play className="h-4 w-4 mr-1" />
                              Execute
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BatchExecution;
