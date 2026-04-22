// Client360 — Contact Advisor tab: advisor card, send-message form, quick actions.
import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { UserCircle, MessageSquare, Mail, Phone, Video, Calendar, Send, RefreshCw, FileText, Upload, Bell } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "./utils";

const API = process.env.REACT_APP_BACKEND_URL || "";

const ContactAdvisorSection = ({ client }) => {
  const [contactMethod, setContactMethod] = useState("platform");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return toast.error("Please fill in subject and message");
    setSending(true);
    try {
      const response = await axios.post(`${API}/api/client-contact/send-message`, {
        client_id: client.id || "client_demo",
        client_name: client.name,
        advisor_email: "mark.thompson@wealthcommand.io",
        advisor_name: client.advisor || "Mark Thompson",
        subject,
        message,
        contact_method: contactMethod,
        priority: "normal",
      });
      if (response.data.status === "delivered") {
        toast.success(response.data.confirmation || "Message sent successfully!");
        setSubject("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (actionType) => {
    try {
      const response = await axios.post(`${API}/api/client-contact/quick-action`, {
        client_id: client.id || "client_demo",
        client_name: client.name,
        action_type: actionType,
        details: {},
      });
      toast.success(response.data.message || `${actionType} request submitted!`);
    } catch (error) {
      console.error("Error processing quick action:", error);
      toast.error("Failed to process request. Please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-[#D4A84C]" /> Your Advisor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16"><AvatarFallback className="bg-[#1a2744] text-white text-xl">MT</AvatarFallback></Avatar>
            <div>
              <p className="font-semibold text-lg">{client.advisor}</p>
              <p className="text-sm text-muted-foreground">Senior Financial Advisor</p>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700">Available</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>mark.thompson@wealthcommand.io</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>+61 2 9123 4567</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Next Review: {formatDate(client.nextReview)}</span></div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1"><Phone className="h-4 w-4 mr-2" /> Call</Button>
            <Button size="sm" variant="outline" className="flex-1"><Video className="h-4 w-4 mr-2" /> Video</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-[#D4A84C]" /> Send a Message</CardTitle>
          <CardDescription>Choose how you'd like to contact your advisor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={contactMethod === "platform" ? "default" : "outline"} onClick={() => setContactMethod("platform")} className={contactMethod === "platform" ? "bg-[#1a2744]" : ""}>
              <MessageSquare className="h-4 w-4 mr-2" /> Platform Message
            </Button>
            <Button variant={contactMethod === "email" ? "default" : "outline"} onClick={() => setContactMethod("email")} className={contactMethod === "email" ? "bg-[#1a2744]" : ""}>
              <Mail className="h-4 w-4 mr-2" /> Direct Email
            </Button>
          </div>

          {contactMethod === "platform" && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">Secure Platform Messaging</p>
              <p>Messages are encrypted and stored within Wealth Command. Your advisor typically responds within 24 hours.</p>
            </div>
          )}
          {contactMethod === "email" && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <p className="font-medium">Email Communication</p>
              <p>This will send an email directly to your advisor. For sensitive information, consider using platform messaging.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g., Question about portfolio rebalancing" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Type your message here..." rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {contactMethod === "platform" ? "Message will be visible in your timeline" : "A copy will be sent to your email"}
            </p>
            <Button className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black" onClick={handleSend} disabled={!subject || !message || sending}>
              {sending ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-2" /> Send {contactMethod === "email" ? "Email" : "Message"}</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => handleQuickAction("schedule_meeting")} data-testid="quick-action-schedule-meeting">
              <Calendar className="h-6 w-6 mb-2" /><span>Schedule Meeting</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => handleQuickAction("request_statement")} data-testid="quick-action-request-statement">
              <FileText className="h-6 w-6 mb-2" /><span>Request Statement</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => handleQuickAction("upload_document")} data-testid="quick-action-upload-document">
              <Upload className="h-6 w-6 mb-2" /><span>Upload Document</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" onClick={() => handleQuickAction("set_reminder")} data-testid="quick-action-set-reminder">
              <Bell className="h-6 w-6 mb-2" /><span>Set Reminder</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactAdvisorSection;
