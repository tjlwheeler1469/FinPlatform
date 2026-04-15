import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Copy,
  Printer,
  ClipboardCheck,
  ArrowRight
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MeetingSummaryGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [formData, setFormData] = useState({
    client_name: "Thompson Family",
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_type: "Annual Review",
    attendees: "David Thompson, Sarah Thompson, Financial Advisor",
    discussion_points: "Retirement planning, Investment strategy, Tax planning"
  });

  const generateSummary = async () => {
    setLoading(true);
    try {
      const requestData = {
        client_name: formData.client_name,
        meeting_date: formData.meeting_date,
        meeting_type: formData.meeting_type,
        attendees: formData.attendees.split(',').map(a => a.trim()),
        discussion_points: formData.discussion_points.split(',').map(p => p.trim()),
        client_data: {}
      };

      const response = await axios.post(`${API}/ai/generate-meeting-summary`, requestData);
      setSummary(response.data);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const StatusBadge = ({ status }) => {
    const colors = {
      Pending: "bg-amber-100 text-amber-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Completed: "bg-green-100 text-green-700"
    };
    return <Badge variant="secondary" className={colors[status] || colors.Pending}>{status}</Badge>;
  };

  const PriorityBadge = ({ priority }) => {
    const colors = {
      High: "bg-red-100 text-red-700",
      Medium: "bg-amber-100 text-amber-700",
      Low: "bg-green-100 text-green-700"
    };
    return <Badge variant="secondary" className={colors[priority] || colors.Medium}>{priority}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="meeting-summary-generator">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">AI Meeting Summary Generator</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate comprehensive meeting summaries with action items instantly
            </p>
          </div>
          {summary && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          )}
        </div>

        {/* Input Form */}
        {!summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Meeting Details
              </CardTitle>
              <CardDescription>
                Enter meeting details to generate an AI-powered summary with action items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Meeting Date</Label>
                  <Input
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Meeting Type</Label>
                  <Select
                    value={formData.meeting_type}
                    onValueChange={(v) => setFormData({ ...formData, meeting_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual Review">Annual Review</SelectItem>
                      <SelectItem value="Quarterly Review">Quarterly Review</SelectItem>
                      <SelectItem value="Strategy Session">Strategy Session</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Plan Presentation">Plan Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Attendees (comma separated)</Label>
                  <Input
                    value={formData.attendees}
                    onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                    placeholder="John Doe, Jane Doe, Advisor Name"
                  />
                </div>
              </div>

              <div className="mb-6">
                <Label>Discussion Topics (comma separated)</Label>
                <Textarea
                  value={formData.discussion_points}
                  onChange={(e) => setFormData({ ...formData, discussion_points: e.target.value })}
                  placeholder="Retirement planning, Investment review, Tax strategy"
                  rows={3}
                />
              </div>

              <Button onClick={generateSummary} disabled={loading} className="w-full" size="lg">
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Meeting Summary
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Saves hours of admin work with AI-generated summaries and action items
              </p>
            </CardContent>
          </Card>
        )}

        {/* Generated Summary */}
        {summary && (
          <div className="space-y-4">
            {/* Summary Header */}
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-white/60">MEETING SUMMARY</p>
                    <h2 className="text-2xl font-bold mt-1">{summary.meeting_type} - {summary.client_name}</h2>
                    <p className="text-sm text-white/60 mt-1">ID: {summary.summary_id}</p>
                  </div>
                  <Badge className="bg-white/20">{summary.meeting_date}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <User className="h-4 w-4" />
                      Attendees
                    </div>
                    <p className="text-sm">{summary.attendees.join(', ')}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <MessageSquare className="h-4 w-4" />
                      Sentiment
                    </div>
                    <p className="text-sm">{summary.client_sentiment.overall}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <ClipboardCheck className="h-4 w-4" />
                      Action Items
                    </div>
                    <p className="text-sm">{summary.action_items.length} tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{summary.executive_summary}</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => copyToClipboard(summary.executive_summary)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </CardContent>
            </Card>

            {/* Discussion & Decisions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Topics Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.discussion_summary.topics_covered.map((topic, i) => (
                      <li key={`item-${i}`} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Decisions Made</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {summary.discussion_summary.decisions_made.map((decision, i) => (
                      <li key={`item-${i}`} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                        {decision}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.action_items.map((item, i) => (
                    <div key={`item-${i}`} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.task}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.assigned_to}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.due_date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={item.priority} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plan Updates & Next Meeting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Plan Updates Required</CardTitle>
                </CardHeader>
                <CardContent>
                  {summary.plan_updates.changes_required ? (
                    <ul className="space-y-2">
                      {summary.plan_updates.updates.map((update, i) => (
                        <li key={`item-${i}`} className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          {update}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No plan updates required</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Next Meeting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-2">{summary.next_meeting.recommended_date}</p>
                  <p className="text-sm text-muted-foreground mb-2">Focus Areas:</p>
                  <ul className="space-y-1">
                    {summary.next_meeting.focus_areas.map((area, i) => (
                      <li key={`item-${i}`} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Compliance Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    {summary.compliance_notes.advice_given ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">Advice Given</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {summary.compliance_notes.soa_required ? (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span className="text-sm">SOA Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {summary.compliance_notes.roi_obtained ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">ROI Obtained</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {summary.compliance_notes.file_notes_complete ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">File Notes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Generated</p>
                    <p className="font-medium">{new Date(summary.generated_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSummary(null)}>
                      <RefreshCw className="h-4 w-4 mr-2" /> New Summary
                    </Button>
                    <Button>
                      <Download className="h-4 w-4 mr-2" /> Export Summary
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MeetingSummaryGenerator;
