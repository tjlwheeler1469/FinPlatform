import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Video,
  FileText,
  Calendar,
  Clock,
  User,
  Users,
  Play,
  Download,
  Copy,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mic,
  Settings,
  Link2,
  Search,
  Plus,
  ChevronRight,
  ListTodo,
  MessageSquare,
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Mock meetings data (would come from Fathom API in production)
const MOCK_MEETINGS = [
  {
    id: "mtg_001",
    title: "Annual Review - Wheeler Family",
    date: "2026-01-15T10:00:00Z",
    duration: 3600, // seconds
    attendees: ["James Wheeler", "Sarah Wheeler", "Mark Thompson (Advisor)"],
    platform: "zoom",
    status: "completed",
    hasTranscript: true,
    hasSummary: true,
    summary: {
      key_points: [
        "Reviewed portfolio performance (+12.4% YTD)",
        "Discussed retirement timeline - targeting age 62",
        "Agreed to increase super contributions to $27,500",
        "Reviewed insurance coverage - life insurance adequate"
      ],
      action_items: [
        { task: "Update super contribution amount", assignee: "Advisor", due: "2026-01-22", status: "pending" },
        { task: "Send updated SOA document", assignee: "Advisor", due: "2026-01-25", status: "pending" },
        { task: "Review property valuation", assignee: "Client", due: "2026-02-01", status: "pending" }
      ],
      sentiment: "positive",
      next_meeting: "2026-04-15"
    },
    transcript: [
      { speaker: "Mark Thompson", time: "00:00:15", text: "Good morning James and Sarah, thank you for joining today's annual review." },
      { speaker: "James Wheeler", time: "00:00:25", text: "Morning Mark, looking forward to going through everything." },
      { speaker: "Mark Thompson", time: "00:00:35", text: "Let's start by looking at your portfolio performance over the past year..." }
    ]
  },
  {
    id: "mtg_002",
    title: "Tax Planning Discussion",
    date: "2025-12-10T14:00:00Z",
    duration: 1800,
    attendees: ["James Wheeler", "Mark Thompson (Advisor)"],
    platform: "google_meet",
    status: "completed",
    hasTranscript: true,
    hasSummary: true,
    summary: {
      key_points: [
        "Reviewed CGT position for the year",
        "Discussed dividend reinvestment strategy",
        "Explored salary sacrifice options"
      ],
      action_items: [
        { task: "Prepare CGT report", assignee: "Advisor", due: "2025-12-20", status: "completed" },
        { task: "Contact employer re: salary sacrifice", assignee: "Client", due: "2025-12-15", status: "completed" }
      ],
      sentiment: "neutral",
      next_meeting: "2026-01-15"
    }
  },
  {
    id: "mtg_003",
    title: "Initial Discovery Meeting",
    date: "2025-06-01T09:00:00Z",
    duration: 5400,
    attendees: ["James Wheeler", "Sarah Wheeler", "Mark Thompson (Advisor)", "Lisa Chen (Paraplanner)"],
    platform: "teams",
    status: "completed",
    hasTranscript: true,
    hasSummary: true,
    summary: {
      key_points: [
        "Gathered comprehensive financial information",
        "Discussed goals: retirement at 62, kids education, holiday fund",
        "Reviewed risk tolerance - Balanced profile",
        "Explained advice process and fees"
      ],
      action_items: [
        { task: "Complete fact find document", assignee: "Advisor", due: "2025-06-08", status: "completed" },
        { task: "Provide bank statements", assignee: "Client", due: "2025-06-10", status: "completed" },
        { task: "Schedule strategy presentation", assignee: "Advisor", due: "2025-06-15", status: "completed" }
      ],
      sentiment: "positive",
      next_meeting: "2025-06-20"
    }
  }
];

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPlatformIcon = (platform) => {
  switch (platform) {
    case "zoom": return "🎥";
    case "google_meet": return "📹";
    case "teams": return "💻";
    default: return "🎬";
  }
};

const MeetingNotes = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client") || "client_1";
  
  const [meetings, setMeetings] = useState(MOCK_MEETINGS);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFathomSetup, setShowFathomSetup] = useState(false);
  const [fathomApiKey, setFathomApiKey] = useState("");
  const [fathomConnected, setFathomConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const selectedClient = JSON.parse(localStorage.getItem("selected_client") || "{}");
  const clientName = selectedClient.name || "Client";

  // Filter meetings by search term
  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.attendees.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const syncWithFathom = async () => {
    if (!fathomApiKey) {
      toast.error("Please enter your Fathom API key");
      return;
    }

    setSyncing(true);
    try {
      // In production, this would call the Fathom API
      // const response = await fetch('https://api.fathom.ai/external/v1/meetings', {
      //   headers: { 'X-Api-Key': fathomApiKey }
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setFathomConnected(true);
      toast.success("Successfully synced with Fathom! Found 3 meetings.");
      setShowFathomSetup(false);
    } catch (error) {
      toast.error("Failed to connect to Fathom. Please check your API key.");
    } finally {
      setSyncing(false);
    }
  };

  const copyTranscript = (meeting) => {
    if (!meeting.transcript) return;
    const text = meeting.transcript.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success("Transcript copied to clipboard");
  };

  const copySummary = (meeting) => {
    if (!meeting.summary) return;
    const text = `Meeting Summary: ${meeting.title}\n\nKey Points:\n${meeting.summary.key_points.map(p => `• ${p}`).join('\n')}\n\nAction Items:\n${meeting.summary.action_items.map(a => `• ${a.task} (${a.assignee}, Due: ${a.due})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="meeting-notes">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Video className="h-7 w-7 text-[#D4A84C]" />
              Meeting Notes
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered meeting recordings and summaries for {clientName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={fathomConnected ? "default" : "secondary"} className={fathomConnected ? "bg-emerald-600" : ""}>
              {fathomConnected ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Fathom Connected</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Fathom Not Connected</>
              )}
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => setShowFathomSetup(true)}
              data-testid="connect-fathom-btn"
            >
              <Settings className="h-4 w-4 mr-2" />
              {fathomConnected ? "Fathom Settings" : "Connect Fathom"}
            </Button>
          </div>
        </div>

        {/* Fathom Integration Banner */}
        {!fathomConnected && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Mic className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Connect Fathom for AI Meeting Recording</h3>
                    <p className="text-muted-foreground">
                      Automatically capture meetings, generate transcripts, and create AI summaries
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowFathomSetup(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Fathom
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meetings List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Recorded Meetings</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-[#D4A84C] ${
                    selectedMeeting?.id === meeting.id ? "border-[#D4A84C] bg-amber-50" : "border-border"
                  }`}
                  onClick={() => setSelectedMeeting(meeting)}
                  data-testid={`meeting-${meeting.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{meeting.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{getPlatformIcon(meeting.platform)}</span>
                        <span>{formatDate(meeting.date)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(meeting.duration)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {meeting.hasTranscript && (
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Transcript
                      </Badge>
                    )}
                    {meeting.hasSummary && (
                      <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Summary
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

              {filteredMeetings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No meetings found</p>
                  {!fathomConnected && (
                    <p className="text-sm mt-1">Connect Fathom to import meetings</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meeting Details */}
          <Card className="lg:col-span-2">
            {selectedMeeting ? (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedMeeting.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(selectedMeeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(selectedMeeting.duration)}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copySummary(selectedMeeting)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Summary
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="flex items-center gap-2 mt-4">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Attendees:</span>
                    {selectedMeeting.attendees.map((attendee, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {attendee}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="summary">
                    <TabsList>
                      <TabsTrigger value="summary">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Summary
                      </TabsTrigger>
                      <TabsTrigger value="actions">
                        <ListTodo className="h-4 w-4 mr-2" />
                        Action Items
                      </TabsTrigger>
                      <TabsTrigger value="transcript">
                        <FileText className="h-4 w-4 mr-2" />
                        Transcript
                      </TabsTrigger>
                    </TabsList>

                    {/* AI Summary Tab */}
                    <TabsContent value="summary" className="mt-4 space-y-4">
                      {selectedMeeting.summary && (
                        <>
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              Key Discussion Points
                            </h4>
                            <ul className="space-y-2">
                              {selectedMeeting.summary.key_points.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <ChevronRight className="h-4 w-4 text-[#D4A84C] mt-0.5 flex-shrink-0" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Separator />

                          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">Meeting Sentiment</p>
                              <p className="font-semibold capitalize">{selectedMeeting.summary.sentiment}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Next Meeting</p>
                              <p className="font-semibold">{selectedMeeting.summary.next_meeting || "Not scheduled"}</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                selectedMeeting.summary.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" :
                                selectedMeeting.summary.sentiment === "negative" ? "bg-red-100 text-red-700" :
                                "bg-blue-100 text-blue-700"
                              }
                            >
                              {selectedMeeting.summary.sentiment === "positive" ? "😊" : 
                               selectedMeeting.summary.sentiment === "negative" ? "😟" : "😐"} 
                              {" "}{selectedMeeting.summary.sentiment}
                            </Badge>
                          </div>
                        </>
                      )}
                    </TabsContent>

                    {/* Action Items Tab */}
                    <TabsContent value="actions" className="mt-4">
                      {selectedMeeting.summary?.action_items && (
                        <div className="space-y-3">
                          {selectedMeeting.summary.action_items.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`p-4 rounded-lg border ${
                                item.status === "completed" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  {item.status === "completed" ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                                  )}
                                  <div>
                                    <p className={`font-medium ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                      {item.task}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {item.assignee}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Due: {item.due}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant={item.status === "completed" ? "default" : "secondary"}>
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Transcript Tab */}
                    <TabsContent value="transcript" className="mt-4">
                      {selectedMeeting.transcript && (
                        <div className="space-y-4">
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => copyTranscript(selectedMeeting)}>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy Transcript
                            </Button>
                          </div>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {selectedMeeting.transcript.map((entry, idx) => (
                              <div key={idx} className="flex gap-3">
                                <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
                                  {entry.time}
                                </span>
                                <div>
                                  <span className="font-medium text-sm text-[#1a2744]">{entry.speaker}:</span>
                                  <p className="text-sm text-muted-foreground">{entry.text}</p>
                                </div>
                              </div>
                            ))}
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              <p>... transcript continues ...</p>
                              <Button variant="link" size="sm">
                                View Full Transcript
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a meeting to view details</p>
                <p className="text-sm">Choose a recorded meeting from the list to see its transcript and AI summary</p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Fathom Setup Dialog */}
        <Dialog open={showFathomSetup} onOpenChange={setShowFathomSetup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-600" />
                Connect Fathom
              </DialogTitle>
              <DialogDescription>
                Connect your Fathom account to automatically import meeting recordings, transcripts, and AI-generated summaries.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">Fathom API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={fathomApiKey}
                  onChange={(e) => setFathomApiKey(e.target.value)}
                  placeholder="Enter your Fathom API key"
                  data-testid="fathom-api-key-input"
                />
                <p className="text-xs text-muted-foreground">
                  Find your API key in Fathom → Settings → API Access
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium text-sm">How it works:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Fathom records your Zoom/Meet/Teams calls
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    AI generates transcripts and summaries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Meetings sync to client records automatically
                  </li>
                </ul>
              </div>

              <a 
                href="https://fathom.video" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-600 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Don't have Fathom? Sign up free
              </a>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFathomSetup(false)}>
                Cancel
              </Button>
              <Button 
                onClick={syncWithFathom} 
                disabled={syncing}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="sync-fathom-btn"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect & Sync
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MeetingNotes;
