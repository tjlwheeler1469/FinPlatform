import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import {
  Mic,
  FileText,
  Users,
  CheckSquare,
  Mail,
  Shield,
  Calendar,
  Clock,
  RefreshCw,
  Sparkles,
  Send,
  ChevronRight,
  Play,
  ListChecks,
  AlertCircle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const MeetingAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [clientId, setClientId] = useState("demo_001");
  const [clientName, setClientName] = useState("Demo Client");
  const [meetingType, setMeetingType] = useState("annual_review");
  const [processedMeeting, setProcessedMeeting] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    fetchDashboard();
    fetchTasks();
    fetchEmails();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meeting-automation/dashboard`);
      if (res.ok) setDashboard(await res.json());
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meeting-automation/tasks?status=pending`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const fetchEmails = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meeting-automation/emails?status=draft`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    }
  };

  const processMeeting = async () => {
    if (!transcript || transcript.length < 50) {
      toast.error("Please enter at least 50 characters of meeting notes");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meeting-automation/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_name: clientName,
          meeting_type: meetingType,
          transcript: transcript
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProcessedMeeting(data);
        toast.success(`Meeting processed! ${data.stats.tasks_created} tasks created, ${data.stats.emails_drafted} emails drafted`);
        fetchDashboard();
        fetchTasks();
        fetchEmails();
      } else {
        toast.error("Failed to process meeting");
      }
    } catch (error) {
      toast.error("Failed to process meeting");
    }
    setLoading(false);
  };

  const completeTask = async (taskId) => {
    try {
      const res = await fetch(`${API_URL}/api/meeting-automation/tasks/${taskId}/complete`, { method: "PUT" });
      if (res.ok) {
        toast.success("Task completed");
        fetchTasks();
        fetchDashboard();
      }
    } catch (error) {
      toast.error("Failed to complete task");
    }
  };

  const sendEmail = async (emailId) => {
    try {
      const res = await fetch(`${API_URL}/api/meeting-automation/emails/${emailId}/send`, { method: "POST" });
      if (res.ok) {
        toast.success("Email sent (demo mode)");
        fetchEmails();
      }
    } catch (error) {
      toast.error("Failed to send email");
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="meeting-automation">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-purple-600" />
              Meeting Automation Engine
            </h1>
            <p className="text-muted-foreground">Meeting → Summary → CRM → Tasks → Emails → Compliance</p>
          </div>
          <Button onClick={fetchDashboard} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboard?.summary?.total_meetings_processed || 0}</p>
              <p className="text-sm text-muted-foreground">Meetings Processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboard?.summary?.pending_tasks || 0}</p>
              <p className="text-sm text-muted-foreground">Pending Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboard?.summary?.draft_emails_pending || 0}</p>
              <p className="text-sm text-muted-foreground">Draft Emails</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{dashboard?.summary?.time_saved_hours?.toFixed(1) || 0}h</p>
              <p className="text-sm text-muted-foreground">Time Saved</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="process" className="space-y-4">
          <TabsList>
            <TabsTrigger value="process">Process Meeting</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="emails">Emails ({emails.length})</TabsTrigger>
            {processedMeeting && <TabsTrigger value="results">Latest Results</TabsTrigger>}
          </TabsList>

          {/* Process Meeting */}
          <TabsContent value="process">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  Process Meeting
                </CardTitle>
                <CardDescription>Enter meeting transcript or notes to generate automated outputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Client ID</label>
                    <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="client_001" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Client Name</label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Meeting Type</label>
                    <Select value={meetingType} onValueChange={setMeetingType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual_review">Annual Review</SelectItem>
                        <SelectItem value="quarterly_check_in">Quarterly Check-in</SelectItem>
                        <SelectItem value="initial_consultation">Initial Consultation</SelectItem>
                        <SelectItem value="strategy_session">Strategy Session</SelectItem>
                        <SelectItem value="tax_planning">Tax Planning</SelectItem>
                        <SelectItem value="retirement_planning">Retirement Planning</SelectItem>
                        <SelectItem value="ad_hoc">Ad Hoc</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Meeting Transcript / Notes</label>
                  <Textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Enter meeting notes or transcript here. Include discussion topics, client concerns, decisions made, and action items discussed..."
                    className="min-h-[200px] mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{transcript.length} characters (minimum 50 required)</p>
                </div>

                <Button onClick={processMeeting} disabled={loading || transcript.length < 50} className="w-full">
                  {loading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Process Meeting & Generate Outputs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-green-600" />
                  Generated Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending tasks</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.task_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{task.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{task.client_name} • Due: {new Date(task.due_date).toLocaleDateString()}</p>
                        </div>
                        <Button size="sm" onClick={() => completeTask(task.task_id)}>Complete</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emails */}
          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-orange-600" />
                  Draft Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No draft emails</p>
                ) : (
                  <div className="space-y-4">
                    {emails.map((email) => (
                      <div key={email.email_id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{email.subject}</h4>
                            <p className="text-sm text-muted-foreground">To: {email.recipient}</p>
                          </div>
                          <Button size="sm" onClick={() => sendEmail(email.email_id)}>
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        </div>
                        <pre className="text-sm bg-muted/50 p-3 rounded whitespace-pre-wrap max-h-40 overflow-auto">{email.body}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results */}
          {processedMeeting && (
            <TabsContent value="results">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Meeting Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{processedMeeting.summary?.executive_summary}</p>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Topics Discussed:</h5>
                      <div className="flex flex-wrap gap-1">
                        {processedMeeting.summary?.topics_discussed?.map((topic, i) => (
                          <Badge key={`item-${i}`} variant="outline">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Outputs Generated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Users className="h-4 w-4" /> CRM Updates</span>
                        <Badge>{processedMeeting.stats?.crm_updates_generated}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tasks Created</span>
                        <Badge>{processedMeeting.stats?.tasks_created}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Emails Drafted</span>
                        <Badge>{processedMeeting.stats?.emails_drafted}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Compliance Notes</span>
                        <Badge>{processedMeeting.stats?.compliance_notes_logged}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default MeetingAutomation;
