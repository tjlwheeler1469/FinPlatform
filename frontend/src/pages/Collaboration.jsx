import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Bell,
  Settings,
  Activity,
  FileText,
  Share2,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

// User roles with permissions
const USER_ROLES = {
  admin: {
    name: "Administrator",
    color: "#DC2626",
    permissions: ["view", "edit", "delete", "share", "manage_users", "export", "settings"]
  },
  adviser: {
    name: "Financial Adviser",
    color: "#0F392B",
    permissions: ["view", "edit", "share", "export", "add_notes", "generate_soa"]
  },
  accountant: {
    name: "Accountant",
    color: "#6B21A8",
    permissions: ["view", "edit", "export", "bas", "tax_reports"]
  },
  client: {
    name: "Client",
    color: "#3B82F6",
    permissions: ["view", "add_notes"]
  },
  viewer: {
    name: "View Only",
    color: "#6B7280",
    permissions: ["view"]
  }
};

// Mock team members for demo
const MOCK_TEAM = [
  { id: 1, name: "John Wheeler", email: "john@wheeler.com.au", role: "admin", avatar: "JW", lastActive: new Date().toISOString(), status: "online" },
  { id: 2, name: "Sarah Wheeler", email: "sarah@wheeler.com.au", role: "client", avatar: "SW", lastActive: new Date(Date.now() - 3600000).toISOString(), status: "offline" },
  { id: 3, name: "David Chen", email: "david@advisers.com.au", role: "adviser", avatar: "DC", lastActive: new Date(Date.now() - 1800000).toISOString(), status: "online" },
  { id: 4, name: "Emma Thompson", email: "emma@accounting.com.au", role: "accountant", avatar: "ET", lastActive: new Date(Date.now() - 7200000).toISOString(), status: "offline" },
];

// Mock activity log
const MOCK_ACTIVITY = [
  { id: 1, user: "David Chen", action: "Updated retirement projections", timestamp: new Date(Date.now() - 300000).toISOString(), type: "edit" },
  { id: 2, user: "Emma Thompson", action: "Generated BAS worksheet", timestamp: new Date(Date.now() - 3600000).toISOString(), type: "export" },
  { id: 3, user: "John Wheeler", action: "Added investment property", timestamp: new Date(Date.now() - 7200000).toISOString(), type: "create" },
  { id: 4, user: "Sarah Wheeler", action: "Viewed tax analysis", timestamp: new Date(Date.now() - 10800000).toISOString(), type: "view" },
  { id: 5, user: "David Chen", action: "Added note to super strategy", timestamp: new Date(Date.now() - 14400000).toISOString(), type: "comment" },
  { id: 6, user: "System", action: "Auto-sync with Xero completed", timestamp: new Date(Date.now() - 18000000).toISOString(), type: "system" },
];

// Mock comments/notes
const MOCK_COMMENTS = [
  { id: 1, user: "David Chen", avatar: "DC", section: "Retirement Planning", text: "Consider increasing salary sacrifice to maximize tax benefits before EOFY.", timestamp: new Date(Date.now() - 86400000).toISOString(), resolved: false },
  { id: 2, user: "Emma Thompson", avatar: "ET", section: "Property Portfolio", text: "Depreciation schedule needs updating for Investment Unit.", timestamp: new Date(Date.now() - 172800000).toISOString(), resolved: true },
  { id: 3, user: "John Wheeler", avatar: "JW", section: "Share Portfolio", text: "Review CBA holding after dividend announcement.", timestamp: new Date(Date.now() - 259200000).toISOString(), resolved: false },
];

const formatTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const Collaboration = () => {
  const [activeTab, setActiveTab] = useState("team");
  const [team, setTeam] = useState(MOCK_TEAM);
  const [activity, setActivity] = useState(MOCK_ACTIVITY);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [showInvite, setShowInvite] = useState(false);
  const [newInvite, setNewInvite] = useState({ email: "", role: "viewer" });
  const [newComment, setNewComment] = useState({ section: "", text: "" });
  const [currentUser] = useState(MOCK_TEAM[0]); // Simulated logged-in user

  // Load from localStorage
  useEffect(() => {
    const savedTeam = localStorage.getItem("wheeler_collaboration_team");
    const savedComments = localStorage.getItem("wheeler_collaboration_comments");
    if (savedTeam) setTeam(JSON.parse(savedTeam));
    if (savedComments) setComments(JSON.parse(savedComments));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("wheeler_collaboration_team", JSON.stringify(team));
    localStorage.setItem("wheeler_collaboration_comments", JSON.stringify(comments));
  }, [team, comments]);

  // Invite team member
  const handleInvite = () => {
    if (!newInvite.email) {
      toast.error("Please enter an email address");
      return;
    }
    
    const newMember = {
      id: Date.now(),
      name: newInvite.email.split("@")[0],
      email: newInvite.email,
      role: newInvite.role,
      avatar: newInvite.email.substring(0, 2).toUpperCase(),
      lastActive: null,
      status: "pending"
    };
    
    setTeam([...team, newMember]);
    setNewInvite({ email: "", role: "viewer" });
    setShowInvite(false);
    
    // Add to activity
    setActivity([{
      id: Date.now(),
      user: currentUser.name,
      action: `Invited ${newMember.email} as ${USER_ROLES[newMember.role].name}`,
      timestamp: new Date().toISOString(),
      type: "invite"
    }, ...activity]);
    
    toast.success(`Invitation sent to ${newInvite.email}`);
  };

  // Remove team member
  const handleRemove = (memberId) => {
    const member = team.find(m => m.id === memberId);
    setTeam(team.filter(m => m.id !== memberId));
    
    setActivity([{
      id: Date.now(),
      user: currentUser.name,
      action: `Removed ${member.email} from team`,
      timestamp: new Date().toISOString(),
      type: "remove"
    }, ...activity]);
    
    toast.success("Team member removed");
  };

  // Change role
  const handleRoleChange = (memberId, newRole) => {
    const member = team.find(m => m.id === memberId);
    setTeam(team.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    
    setActivity([{
      id: Date.now(),
      user: currentUser.name,
      action: `Changed ${member.name}'s role to ${USER_ROLES[newRole].name}`,
      timestamp: new Date().toISOString(),
      type: "role_change"
    }, ...activity]);
    
    toast.success("Role updated");
  };

  // Add comment
  const handleAddComment = () => {
    if (!newComment.section || !newComment.text) {
      toast.error("Please fill in all fields");
      return;
    }
    
    const comment = {
      id: Date.now(),
      user: currentUser.name,
      avatar: currentUser.avatar,
      section: newComment.section,
      text: newComment.text,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    setComments([comment, ...comments]);
    setNewComment({ section: "", text: "" });
    
    setActivity([{
      id: Date.now(),
      user: currentUser.name,
      action: `Added note to ${newComment.section}`,
      timestamp: new Date().toISOString(),
      type: "comment"
    }, ...activity]);
    
    toast.success("Note added");
  };

  // Toggle comment resolved
  const toggleResolved = (commentId) => {
    setComments(comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const onlineCount = team.filter(m => m.status === "online").length;

  return (
    <Layout>
      <div className="space-y-6" data-testid="collaboration-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Collaboration
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage team access and collaborate on financial planning
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[#10B981] border-[#10B981]">
              <span className="w-2 h-2 bg-[#10B981] rounded-full mr-2 animate-pulse" />
              {onlineCount} Online
            </Badge>
            <Button onClick={() => setShowInvite(true)} className="bg-[#0F392B]">
              <UserPlus className="h-4 w-4 mr-2" /> Invite Member
            </Button>
          </div>
        </div>

        {/* Demo Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">Demo Mode</p>
                <p className="text-sm text-blue-700 mt-1">
                  This is a demonstration of collaboration features. In production, this would connect to 
                  a user authentication system with real-time updates via WebSocket.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-1" /> Team ({team.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-1" /> Activity
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="h-4 w-4 mr-1" /> Notes ({comments.filter(c => !c.resolved).length})
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-1" /> Permissions
            </TabsTrigger>
          </TabsList>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="grid gap-4">
              {team.map(member => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback style={{ backgroundColor: USER_ROLES[member.role]?.color || "#6B7280" }} className="text-white">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {member.status === "online" && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full" />
                          )}
                          {member.status === "pending" && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              style={{ backgroundColor: `${USER_ROLES[member.role]?.color}15`, color: USER_ROLES[member.role]?.color }}
                            >
                              {USER_ROLES[member.role]?.name}
                            </Badge>
                            {member.status === "pending" && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">Pending</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-muted-foreground">
                          {member.lastActive ? (
                            <>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatTimeAgo(member.lastActive)}
                            </>
                          ) : (
                            "Never logged in"
                          )}
                        </div>
                        
                        {member.id !== currentUser.id && (
                          <div className="flex items-center gap-2">
                            <Select 
                              value={member.role} 
                              onValueChange={(v) => handleRoleChange(member.id, v)}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(USER_ROLES).map(([key, role]) => (
                                  <SelectItem key={key} value={key}>{role.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleRemove(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {member.id === currentUser.id && (
                          <Badge className="bg-[#0F392B]">You</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Track all changes made to this portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {activity.map(item => (
                      <div key={item.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === "edit" ? "bg-blue-100" :
                          item.type === "create" ? "bg-green-100" :
                          item.type === "export" ? "bg-purple-100" :
                          item.type === "comment" ? "bg-amber-100" :
                          item.type === "system" ? "bg-gray-100" :
                          "bg-muted"
                        }`}>
                          {item.type === "edit" && <Edit className="h-4 w-4 text-blue-600" />}
                          {item.type === "create" && <FileText className="h-4 w-4 text-green-600" />}
                          {item.type === "export" && <Share2 className="h-4 w-4 text-purple-600" />}
                          {item.type === "comment" && <MessageSquare className="h-4 w-4 text-amber-600" />}
                          {item.type === "view" && <Eye className="h-4 w-4 text-gray-600" />}
                          {item.type === "system" && <Settings className="h-4 w-4 text-gray-600" />}
                          {item.type === "invite" && <UserPlus className="h-4 w-4 text-green-600" />}
                          {item.type === "remove" && <Trash2 className="h-4 w-4 text-red-600" />}
                          {item.type === "role_change" && <Shield className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{item.user}</span>
                            {" "}{item.action}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={newComment.section} onValueChange={(v) => setNewComment({ ...newComment, section: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dashboard">Dashboard</SelectItem>
                      <SelectItem value="Tax Analysis">Tax Analysis</SelectItem>
                      <SelectItem value="Property Portfolio">Property Portfolio</SelectItem>
                      <SelectItem value="Share Portfolio">Share Portfolio</SelectItem>
                      <SelectItem value="Retirement Planning">Retirement Planning</SelectItem>
                      <SelectItem value="Estate Planning">Estate Planning</SelectItem>
                      <SelectItem value="Insurance">Insurance</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="md:col-span-2">
                    <Input 
                      placeholder="Add a note or comment..." 
                      value={newComment.text}
                      onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddComment} className="bg-[#0F392B]">
                    <Send className="h-4 w-4 mr-2" /> Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {comments.map(comment => (
                <Card key={comment.id} className={comment.resolved ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-[#0F392B] text-white">
                            {comment.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.user}</span>
                            <Badge variant="outline" className="text-xs">{comment.section}</Badge>
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.timestamp)}</span>
                          </div>
                          <p className="text-sm mt-1">{comment.text}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleResolved(comment.id)}
                      >
                        {comment.resolved ? (
                          <><CheckCircle className="h-4 w-4 text-[#10B981] mr-1" /> Resolved</>
                        ) : (
                          <><Clock className="h-4 w-4 text-muted-foreground mr-1" /> Mark Resolved</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Role Permissions</CardTitle>
                <CardDescription>Understand what each role can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Permission</th>
                        {Object.entries(USER_ROLES).map(([key, role]) => (
                          <th key={key} className="text-center p-3">
                            <Badge style={{ backgroundColor: `${role.color}15`, color: role.color }}>
                              {role.name}
                            </Badge>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {["view", "edit", "delete", "share", "export", "add_notes", "generate_soa", "bas", "tax_reports", "manage_users", "settings"].map(perm => (
                        <tr key={perm} className="border-b">
                          <td className="p-3 capitalize">{perm.replace(/_/g, " ")}</td>
                          {Object.entries(USER_ROLES).map(([key, role]) => (
                            <td key={key} className="text-center p-3">
                              {role.permissions.includes(perm) ? (
                                <CheckCircle className="h-4 w-4 text-[#10B981] mx-auto" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Invite Team Member</CardTitle>
                <CardDescription>Send an invitation to collaborate on this portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email"
                    placeholder="colleague@company.com"
                    value={newInvite.email}
                    onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newInvite.role} onValueChange={(v) => setNewInvite({ ...newInvite, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(USER_ROLES).map(([key, role]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                            {role.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-[#0F392B]" onClick={handleInvite}>
                    <Send className="h-4 w-4 mr-2" /> Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default Collaboration;
