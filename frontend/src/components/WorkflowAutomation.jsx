import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Clock,
  Bell,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings,
  ArrowRight,
  RefreshCw,
  Users
} from "lucide-react";
import { toast } from "sonner";

// Workflow Templates
const WORKFLOW_TEMPLATES = [
  {
    id: "onboarding",
    name: "New Client Onboarding",
    description: "Automated sequence for onboarding new clients",
    steps: [
      { action: "create_task", title: "Send welcome pack", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Schedule initial meeting", delay_days: 1, assignee: "self" },
      { action: "send_reminder", title: "Follow up on documents", delay_days: 3, assignee: "self" },
      { action: "create_task", title: "Complete KYC verification", delay_days: 5, assignee: "self" },
      { action: "create_task", title: "Risk profile questionnaire", delay_days: 7, assignee: "self" },
      { action: "create_task", title: "Prepare SOA draft", delay_days: 10, assignee: "self" },
      { action: "send_reminder", title: "Review SOA with client", delay_days: 14, assignee: "self" }
    ]
  },
  {
    id: "annual_review",
    name: "Annual Review Sequence",
    description: "Automated workflow for annual client reviews",
    steps: [
      { action: "send_reminder", title: "Review reminder (30 days)", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Update client data", delay_days: 7, assignee: "self" },
      { action: "create_task", title: "Prepare review report", delay_days: 14, assignee: "self" },
      { action: "send_reminder", title: "Schedule review meeting", delay_days: 21, assignee: "self" },
      { action: "create_task", title: "Send follow-up actions", delay_days: 30, assignee: "self" }
    ]
  },
  {
    id: "compliance",
    name: "Compliance Check",
    description: "Quarterly compliance verification workflow",
    steps: [
      { action: "create_task", title: "Verify KYC documentation", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Check fee disclosure status", delay_days: 2, assignee: "self" },
      { action: "create_task", title: "Review risk profile currency", delay_days: 4, assignee: "self" },
      { action: "send_reminder", title: "Compliance audit complete", delay_days: 7, assignee: "self" }
    ]
  },
  {
    id: "meeting_followup",
    name: "Meeting Follow-up",
    description: "Automated follow-up after client meetings",
    steps: [
      { action: "create_task", title: "Send meeting summary", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Action items review", delay_days: 1, assignee: "self" },
      { action: "send_reminder", title: "Follow up on decisions", delay_days: 7, assignee: "self" },
      { action: "create_task", title: "Schedule next check-in", delay_days: 14, assignee: "self" }
    ]
  }
];

// Mock clients for assignment
const MOCK_CLIENTS = [
  { id: "client_1", name: "Wheeler Family" },
  { id: "client_2", name: "Smith & Associates" },
  { id: "client_3", name: "Johnson Trust" },
  { id: "client_4", name: "Williams Family" },
  { id: "client_5", name: "Brown Investments" },
];

const WorkflowAutomation = ({ onTaskCreated, onReminderSet }) => {
  const [activeWorkflows, setActiveWorkflows] = useState(() => {
    const saved = localStorage.getItem("wheeler_workflows");
    return saved ? JSON.parse(saved) : [];
  });
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [automationRules, setAutomationRules] = useState(() => {
    const saved = localStorage.getItem("wheeler_automation_rules");
    return saved ? JSON.parse(saved) : {
      autoAssignNewClients: true,
      sendMeetingReminders: true,
      meetingReminderDays: 1,
      taskOverdueAlerts: true,
      overdueAlertDays: 2,
      complianceCheckInterval: 90,
      autoFollowUp: true,
      followUpDays: 7
    };
  });

  // Save workflows to localStorage
  useEffect(() => {
    localStorage.setItem("wheeler_workflows", JSON.stringify(activeWorkflows));
  }, [activeWorkflows]);

  // Save rules to localStorage
  useEffect(() => {
    localStorage.setItem("wheeler_automation_rules", JSON.stringify(automationRules));
  }, [automationRules]);

  // Start a workflow
  const startWorkflow = () => {
    if (!selectedTemplate || !selectedClient) {
      toast.error("Please select a template and client");
      return;
    }

    const template = WORKFLOW_TEMPLATES.find(t => t.id === selectedTemplate);
    const client = MOCK_CLIENTS.find(c => c.id === selectedClient);
    
    const workflow = {
      id: `wf_${Date.now()}`,
      template_id: selectedTemplate,
      template_name: template.name,
      client_id: selectedClient,
      client_name: client.name,
      started_at: new Date().toISOString(),
      status: "active",
      current_step: 0,
      total_steps: template.steps.length,
      steps: template.steps.map((step, index) => ({
        ...step,
        step_id: `step_${index}`,
        status: index === 0 ? "pending" : "waiting",
        due_date: new Date(Date.now() + step.delay_days * 24 * 60 * 60 * 1000).toISOString()
      }))
    };

    setActiveWorkflows([...activeWorkflows, workflow]);
    
    // Create the first task
    if (onTaskCreated && template.steps[0].action === "create_task") {
      onTaskCreated({
        title: `${template.steps[0].title} - ${client.name}`,
        client_id: selectedClient,
        due_date: new Date().toISOString().split('T')[0],
        priority: "high",
        category: "workflow",
        workflow_id: workflow.id
      });
    }

    setShowNewWorkflow(false);
    setSelectedTemplate(null);
    setSelectedClient("");
    toast.success(`Workflow started: ${template.name} for ${client.name}`);
  };

  // Pause/Resume workflow
  const toggleWorkflow = (workflowId) => {
    setActiveWorkflows(activeWorkflows.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: wf.status === "active" ? "paused" : "active" }
        : wf
    ));
    toast.info("Workflow status updated");
  };

  // Cancel workflow
  const cancelWorkflow = (workflowId) => {
    setActiveWorkflows(activeWorkflows.filter(wf => wf.id !== workflowId));
    toast.success("Workflow cancelled");
  };

  // Complete current step and advance
  const advanceWorkflow = (workflowId) => {
    setActiveWorkflows(activeWorkflows.map(wf => {
      if (wf.id !== workflowId) return wf;
      
      const nextStep = wf.current_step + 1;
      if (nextStep >= wf.total_steps) {
        toast.success(`Workflow completed: ${wf.template_name}`);
        return { ...wf, status: "completed", current_step: nextStep };
      }
      
      const updatedSteps = wf.steps.map((step, index) => ({
        ...step,
        status: index < nextStep ? "completed" : index === nextStep ? "pending" : "waiting"
      }));
      
      // Trigger next task/reminder
      const nextStepData = updatedSteps[nextStep];
      if (onTaskCreated && nextStepData.action === "create_task") {
        onTaskCreated({
          title: `${nextStepData.title} - ${wf.client_name}`,
          client_id: wf.client_id,
          due_date: nextStepData.due_date.split('T')[0],
          priority: "medium",
          category: "workflow",
          workflow_id: wf.id
        });
      } else if (onReminderSet && nextStepData.action === "send_reminder") {
        onReminderSet({
          title: nextStepData.title,
          client_id: wf.client_id,
          scheduled_for: nextStepData.due_date
        });
      }
      
      toast.info(`Advanced to step ${nextStep + 1}: ${nextStepData.title}`);
      return { ...wf, current_step: nextStep, steps: updatedSteps };
    }));
  };

  const activeCount = activeWorkflows.filter(w => w.status === "active").length;
  const pausedCount = activeWorkflows.filter(w => w.status === "paused").length;
  const completedCount = activeWorkflows.filter(w => w.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#D4AF37]" />
            Workflow Automation
          </h2>
          <p className="text-sm text-muted-foreground">Automate client tasks, reminders, and follow-ups</p>
        </div>
        <Dialog open={showNewWorkflow} onOpenChange={setShowNewWorkflow}>
          <DialogTrigger asChild>
            <Button className="bg-[#0F392B]" data-testid="new-workflow-btn">
              <Plus className="h-4 w-4 mr-2" /> Start Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Start New Workflow</DialogTitle>
              <DialogDescription>Select a workflow template and client to begin automated sequence</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Workflow Template</Label>
                <Select value={selectedTemplate || ""} onValueChange={setSelectedTemplate}>
                  <SelectTrigger data-testid="workflow-template-select">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.steps.length} steps</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTemplate && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">
                      {WORKFLOW_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
                    </p>
                    <div className="space-y-1">
                      {WORKFLOW_TEMPLATES.find(t => t.id === selectedTemplate)?.steps.map((step, i) => (
                        <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                          <div className="w-5 h-5 rounded-full bg-[#0F392B]/10 flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </div>
                          <span>{step.title}</span>
                          <span className="text-muted-foreground/50">• Day {step.delay_days}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger data-testid="workflow-client-select">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_CLIENTS.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewWorkflow(false)}>Cancel</Button>
              <Button onClick={startWorkflow} className="bg-[#0F392B]" data-testid="start-workflow-btn">
                <Play className="h-4 w-4 mr-2" /> Start Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <Play className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold text-amber-600">{pausedCount}</p>
              </div>
              <Pause className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows */}
      {activeWorkflows.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeWorkflows.filter(w => w.status !== "completed").map(workflow => (
                <div key={workflow.id} className="p-4 border rounded-lg" data-testid={`workflow-${workflow.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{workflow.template_name}</p>
                        <Badge className={
                          workflow.status === "active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.client_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleWorkflow(workflow.id)}
                        data-testid={`toggle-workflow-${workflow.id}`}
                      >
                        {workflow.status === "active" ? (
                          <><Pause className="h-4 w-4 mr-1" /> Pause</>
                        ) : (
                          <><Play className="h-4 w-4 mr-1" /> Resume</>
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => cancelWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{workflow.current_step}/{workflow.total_steps} steps</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#0F392B] rounded-full transition-all"
                        style={{ width: `${(workflow.current_step / workflow.total_steps) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Current Step */}
                  {workflow.current_step < workflow.total_steps && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-white font-bold text-sm">
                          {workflow.current_step + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{workflow.steps[workflow.current_step].title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(workflow.steps[workflow.current_step].due_date).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => advanceWorkflow(workflow.id)}
                        data-testid={`advance-workflow-${workflow.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Complete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No Active Workflows</p>
            <p className="text-sm">Start a workflow to automate client tasks</p>
          </CardContent>
        </Card>
      )}

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#D4AF37]" />
            Automation Rules
          </CardTitle>
          <CardDescription>Configure automatic triggers and actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Auto-assign new client onboarding</p>
                <p className="text-xs text-muted-foreground">Automatically start onboarding workflow for new clients</p>
              </div>
            </div>
            <Switch 
              checked={automationRules.autoAssignNewClients}
              onCheckedChange={(checked) => setAutomationRules({...automationRules, autoAssignNewClients: checked})}
              data-testid="auto-assign-switch"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Meeting reminders</p>
                <p className="text-xs text-muted-foreground">
                  Send reminder {automationRules.meetingReminderDays} day(s) before meetings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number"
                min={1}
                max={7}
                value={automationRules.meetingReminderDays}
                onChange={(e) => setAutomationRules({...automationRules, meetingReminderDays: Number(e.target.value)})}
                className="w-16"
              />
              <Switch 
                checked={automationRules.sendMeetingReminders}
                onCheckedChange={(checked) => setAutomationRules({...automationRules, sendMeetingReminders: checked})}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Overdue task alerts</p>
                <p className="text-xs text-muted-foreground">
                  Alert after {automationRules.overdueAlertDays} day(s) overdue
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number"
                min={1}
                max={14}
                value={automationRules.overdueAlertDays}
                onChange={(e) => setAutomationRules({...automationRules, overdueAlertDays: Number(e.target.value)})}
                className="w-16"
              />
              <Switch 
                checked={automationRules.taskOverdueAlerts}
                onCheckedChange={(checked) => setAutomationRules({...automationRules, taskOverdueAlerts: checked})}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Auto follow-up</p>
                <p className="text-xs text-muted-foreground">
                  Create follow-up task after {automationRules.followUpDays} days of inactivity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number"
                min={1}
                max={30}
                value={automationRules.followUpDays}
                onChange={(e) => setAutomationRules({...automationRules, followUpDays: Number(e.target.value)})}
                className="w-16"
              />
              <Switch 
                checked={automationRules.autoFollowUp}
                onCheckedChange={(checked) => setAutomationRules({...automationRules, autoFollowUp: checked})}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Compliance check interval</p>
                <p className="text-xs text-muted-foreground">
                  Trigger compliance review every {automationRules.complianceCheckInterval} days
                </p>
              </div>
            </div>
            <Select 
              value={String(automationRules.complianceCheckInterval)} 
              onValueChange={(v) => setAutomationRules({...automationRules, complianceCheckInterval: Number(v)})}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">365 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowAutomation;
