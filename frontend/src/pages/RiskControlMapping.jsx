import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Link2, Grid3X3, List,
  Plus, RefreshCw, FileText, Users, Calendar, Target, Layers
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RiskControlMapping() {
  const [activeTab, setActiveTab] = useState('matrix');
  const [viewMode, setViewMode] = useState('matrix'); // matrix or table
  const [loading, setLoading] = useState(true);
  
  // Data
  const [risks, setRisks] = useState([]);
  const [controls, setControls] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  
  // Dialogs
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [showControlDialog, setShowControlDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [selectedControl, setSelectedControl] = useState(null);
  
  // New Risk Form
  const [newRisk, setNewRisk] = useState({
    name: '',
    description: '',
    category: 'operational',
    likelihood: 'possible',
    impact: 'moderate',
    risk_owner: '',
    risk_owner_name: '',
    regulatory_reference: ''
  });
  
  // New Control Form
  const [newControl, setNewControl] = useState({
    name: '',
    description: '',
    control_type: 'preventive',
    control_owner: '',
    control_owner_name: '',
    review_frequency: 'quarterly',
    regulatory_reference: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [risksRes, controlsRes, matrixRes, dashRes] = await Promise.all([
        fetch(`${API_URL}/api/risk-control/risks`).then(r => r.json()),
        fetch(`${API_URL}/api/risk-control/controls`).then(r => r.json()),
        fetch(`${API_URL}/api/risk-control/mapping/matrix`).then(r => r.json()),
        fetch(`${API_URL}/api/risk-control/dashboard`).then(r => r.json())
      ]);
      setRisks(risksRes.risks || []);
      setControls(controlsRes.controls || []);
      setMatrix(matrixRes.matrix || []);
      setDashboard(dashRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const seedDemoData = async () => {
    try {
      await fetch(`${API_URL}/api/risk-control/demo/seed-data`, { method: 'POST' });
      loadData();
    } catch (error) {
      console.error('Failed to seed data:', error);
    }
  };

  const createRisk = async () => {
    try {
      await fetch(`${API_URL}/api/risk-control/risks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRisk)
      });
      setShowRiskDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to create risk:', error);
    }
  };

  const createControl = async () => {
    try {
      await fetch(`${API_URL}/api/risk-control/controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControl)
      });
      setShowControlDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to create control:', error);
    }
  };

  const linkRiskControl = async () => {
    if (!selectedRisk || !selectedControl) return;
    try {
      await fetch(`${API_URL}/api/risk-control/mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_id: selectedRisk,
          control_id: selectedControl,
          mapping_rationale: 'Linked via UI'
        })
      });
      setShowLinkDialog(false);
      loadData();
    } catch (error) {
      console.error('Failed to link:', error);
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'extreme': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-300';
    }
  };

  const getEffectivenessColor = (eff) => {
    switch (eff) {
      case 'effective': return 'bg-green-100 text-green-800 border-green-200';
      case 'partially_effective': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ineffective': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" data-testid="risk-control-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-7 w-7 text-indigo-600" />
              Risk & Control Mapping
            </h1>
            <p className="text-gray-600 mt-1">
              CPS 230 / ISO 31000 aligned enterprise GRC framework
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedDemoData} data-testid="seed-grc-btn">
              <RefreshCw className="h-4 w-4 mr-2" />
              Seed Demo Data
            </Button>
            <Button variant="outline" onClick={() => setShowControlDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Control
            </Button>
            <Button onClick={() => setShowRiskDialog(true)} data-testid="add-risk-btn">
              <Plus className="h-4 w-4 mr-2" />
              Add Risk
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.risk_summary.total}</div>
                  <div className="text-xs text-gray-500">Total Risks</div>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                <Badge className="bg-red-500 text-white text-xs">{dashboard.risk_summary.by_rating.extreme} Extreme</Badge>
                <Badge className="bg-orange-500 text-white text-xs">{dashboard.risk_summary.by_rating.high} High</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.control_summary.total}</div>
                  <div className="text-xs text-gray-500">Total Controls</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {dashboard.control_summary.effective_rate}% Effective
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.review_status.overdue_risks}</div>
                  <div className="text-xs text-gray-500">Overdue Reviews</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {dashboard.review_status.upcoming_reviews_7d} due in 7 days
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{dashboard.regulatory_alignment.cps_230_risks_mapped}</div>
                  <div className="text-xs text-gray-500">CPS 230 Mapped</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-lg font-bold flex items-center gap-1">
                    {dashboard.regulatory_alignment.iso_31000_compliant ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" /> ISO 31000</>
                    ) : (
                      <><XCircle className="h-4 w-4 text-red-500" /> Non-compliant</>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Compliance Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="matrix" data-testid="matrix-tab">
              <Grid3X3 className="h-4 w-4 mr-1" />
              Matrix View
            </TabsTrigger>
            <TabsTrigger value="risks" data-testid="risks-tab">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Risks ({risks.length})
            </TabsTrigger>
            <TabsTrigger value="controls" data-testid="controls-tab">
              <Shield className="h-4 w-4 mr-1" />
              Controls ({controls.length})
            </TabsTrigger>
            <TabsTrigger value="table" data-testid="table-tab">
              <List className="h-4 w-4 mr-1" />
              Table View
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={() => setShowLinkDialog(true)}>
            <Link2 className="h-4 w-4 mr-2" />
            Link Risk to Control
          </Button>
        </div>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Risk-Control Matrix</CardTitle>
              <CardDescription>Visual mapping of risks to their mitigating controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {matrix.map((item) => (
                  <div key={`risk-${item.risk.id || item.risk.name}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={getRatingColor(item.risk.rating)}>
                            {item.risk.rating?.toUpperCase()}
                          </Badge>
                          <span className="font-semibold">{item.risk.name}</span>
                          <Badge variant="outline">{item.risk.category}</Badge>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Owner: {item.risk.owner} | ID: {item.risk.id}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded text-sm ${item.control_coverage ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.control_coverage ? 'Covered' : 'Uncovered'}
                      </div>
                    </div>
                    
                    {item.controls.length > 0 ? (
                      <div className="mt-4 pl-4 border-l-2 border-blue-200">
                        <div className="text-xs text-gray-500 mb-2">LINKED CONTROLS:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.controls.map((ctrl, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-2 bg-blue-50 rounded p-2">
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="text-sm font-medium">{ctrl.name}</div>
                                <div className="text-xs text-gray-500">
                                  {ctrl.type} | <Badge className={getEffectivenessColor(ctrl.effectiveness)} variant="outline">
                                    {ctrl.effectiveness?.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 pl-4 border-l-2 border-red-200">
                        <Alert variant="destructive" className="bg-red-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>No Controls Linked</AlertTitle>
                          <AlertDescription>
                            This risk has no mitigating controls assigned. Consider adding appropriate controls.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </div>
                ))}
                {matrix.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No risks found. Add risks and controls to build your GRC matrix.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>All identified risks with ratings and owners</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Likelihood</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Regulatory Ref</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell className="font-mono text-xs">{risk.id}</TableCell>
                      <TableCell className="font-medium">{risk.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{risk.category}</Badge>
                      </TableCell>
                      <TableCell>{risk.likelihood}</TableCell>
                      <TableCell>{risk.impact}</TableCell>
                      <TableCell>
                        <Badge className={getRatingColor(risk.risk_rating?.rating)}>
                          {risk.risk_rating?.rating?.toUpperCase()} ({risk.risk_rating?.score})
                        </Badge>
                      </TableCell>
                      <TableCell>{risk.risk_owner_name}</TableCell>
                      <TableCell className="text-xs">{risk.regulatory_reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls">
          <Card>
            <CardHeader>
              <CardTitle>Control Register</CardTitle>
              <CardDescription>All controls with effectiveness ratings and review schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Control ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Effectiveness</TableHead>
                    <TableHead>Review Frequency</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Last Tested</TableHead>
                    <TableHead>Next Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controls.map((ctrl) => (
                    <TableRow key={ctrl.id}>
                      <TableCell className="font-mono text-xs">{ctrl.id}</TableCell>
                      <TableCell className="font-medium">{ctrl.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ctrl.control_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEffectivenessColor(ctrl.effectiveness)}>
                          {ctrl.effectiveness?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{ctrl.review_frequency}</TableCell>
                      <TableCell>{ctrl.control_owner_name}</TableCell>
                      <TableCell className="text-xs">
                        {ctrl.last_tested ? new Date(ctrl.last_tested).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {ctrl.next_review_due ? new Date(ctrl.next_review_due).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Full Mapping Table</CardTitle>
              <CardDescription>Tabular view of all risk-control relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Risk</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Control</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Effectiveness</TableHead>
                    <TableHead>Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrix.map((item) => (
                    item.controls.length > 0 ? (
                      item.controls.map((ctrl, cIdx) => (
                        <TableRow key={`${item.risk.id || item.risk.name}-${ctrl.id || ctrl.name}`}>
                          {cIdx === 0 && (
                            <>
                              <TableCell rowSpan={item.controls.length} className="font-medium">
                                {item.risk.name}
                              </TableCell>
                              <TableCell rowSpan={item.controls.length}>
                                <Badge className={getRatingColor(item.risk.rating)}>
                                  {item.risk.rating?.toUpperCase()}
                                </Badge>
                              </TableCell>
                            </>
                          )}
                          <TableCell>{ctrl.name}</TableCell>
                          <TableCell>{ctrl.type}</TableCell>
                          <TableCell>
                            <Badge className={getEffectivenessColor(ctrl.effectiveness)}>
                              {ctrl.effectiveness?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          {cIdx === 0 && (
                            <TableCell rowSpan={item.controls.length}>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow key={`norisk-${item.risk.id || item.risk.name}`}>
                        <TableCell className="font-medium">{item.risk.name}</TableCell>
                        <TableCell>
                          <Badge className={getRatingColor(item.risk.rating)}>
                            {item.risk.rating?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell colSpan={3} className="text-red-500 italic">
                          No controls linked
                        </TableCell>
                        <TableCell>
                          <XCircle className="h-5 w-5 text-red-500" />
                        </TableCell>
                      </TableRow>
                    )
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Risk Dialog */}
      <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Risk</DialogTitle>
            <DialogDescription>Register a new risk in the enterprise risk register</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Risk Name</label>
              <Input value={newRisk.name} onChange={(e) => setNewRisk({ ...newRisk, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={newRisk.description} onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={newRisk.category} onValueChange={(v) => setNewRisk({ ...newRisk, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="reputational">Reputational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Regulatory Reference</label>
                <Input value={newRisk.regulatory_reference} onChange={(e) => setNewRisk({ ...newRisk, regulatory_reference: e.target.value })} placeholder="e.g., CPS 230 Section 4" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Likelihood</label>
                <Select value={newRisk.likelihood} onValueChange={(v) => setNewRisk({ ...newRisk, likelihood: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="unlikely">Unlikely</SelectItem>
                    <SelectItem value="possible">Possible</SelectItem>
                    <SelectItem value="likely">Likely</SelectItem>
                    <SelectItem value="almost_certain">Almost Certain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Impact</label>
                <Select value={newRisk.impact} onValueChange={(v) => setNewRisk({ ...newRisk, impact: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insignificant">Insignificant</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="catastrophic">Catastrophic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Risk Owner ID</label>
                <Input value={newRisk.risk_owner} onChange={(e) => setNewRisk({ ...newRisk, risk_owner: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Risk Owner Name</label>
                <Input value={newRisk.risk_owner_name} onChange={(e) => setNewRisk({ ...newRisk, risk_owner_name: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRiskDialog(false)}>Cancel</Button>
            <Button onClick={createRisk}>Create Risk</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Control Dialog */}
      <Dialog open={showControlDialog} onOpenChange={setShowControlDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Control</DialogTitle>
            <DialogDescription>Register a new control in the control register</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Control Name</label>
              <Input value={newControl.name} onChange={(e) => setNewControl({ ...newControl, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={newControl.description} onChange={(e) => setNewControl({ ...newControl, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Control Type</label>
                <Select value={newControl.control_type} onValueChange={(v) => setNewControl({ ...newControl, control_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="detective">Detective</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Review Frequency</label>
                <Select value={newControl.review_frequency} onValueChange={(v) => setNewControl({ ...newControl, review_frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Control Owner ID</label>
                <Input value={newControl.control_owner} onChange={(e) => setNewControl({ ...newControl, control_owner: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Control Owner Name</label>
                <Input value={newControl.control_owner_name} onChange={(e) => setNewControl({ ...newControl, control_owner_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Regulatory Reference</label>
              <Input value={newControl.regulatory_reference} onChange={(e) => setNewControl({ ...newControl, regulatory_reference: e.target.value })} placeholder="e.g., CPS 234 Section 5.3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowControlDialog(false)}>Cancel</Button>
            <Button onClick={createControl}>Create Control</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Risk to Control Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Risk to Control</DialogTitle>
            <DialogDescription>Create a mapping between a risk and its mitigating control</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Risk</label>
              <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                <SelectTrigger><SelectValue placeholder="Choose a risk" /></SelectTrigger>
                <SelectContent>
                  {risks.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Select Control</label>
              <Select value={selectedControl} onValueChange={setSelectedControl}>
                <SelectTrigger><SelectValue placeholder="Choose a control" /></SelectTrigger>
                <SelectContent>
                  {controls.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
            <Button onClick={linkRiskControl} disabled={!selectedRisk || !selectedControl}>
              <Link2 className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
