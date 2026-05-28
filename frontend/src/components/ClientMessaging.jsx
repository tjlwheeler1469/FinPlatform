import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mail,
  Send,
  Inbox,
  Star,
  StarOff,
  Trash2,
  Archive,
  Reply,
  MoreVertical,
  Search,
  Plus,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  FileText,
  Paperclip,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

// Mock messages data
const INITIAL_MESSAGES = [
  {
    id: 'msg_1',
    from: { name: 'David Chen', role: 'adviser', email: 'david.chen@halcyonwealth.com.au' },
    to: { name: 'David Thompson', role: 'client', email: 'david@thompson.com' },
    subject: 'Your Updated Statement of Advice',
    body: `Hi James,

I hope this message finds you well. I've completed the updated Statement of Advice following our recent review meeting.

Key highlights:
• Recommended increasing your super contributions to maximize tax benefits
• Portfolio rebalancing suggestions to better align with your risk profile
• Updated insurance coverage recommendations

Please review the attached document and let me know if you have any questions. I'm happy to schedule a call to discuss further.

Best regards,
David Chen
Senior Financial Adviser`,
    timestamp: '2024-12-20T14:30:00',
    read: false,
    starred: true,
    folder: 'inbox',
    attachments: ['Statement_of_Advice_2024.pdf']
  },
  {
    id: 'msg_2',
    from: { name: 'David Chen', role: 'adviser', email: 'david.chen@halcyonwealth.com.au' },
    to: { name: 'David Thompson', role: 'client', email: 'david@thompson.com' },
    subject: 'Annual Review Reminder',
    body: `Hi James,

This is a friendly reminder that your annual financial review is due in February 2025.

Please let me know your availability for the following dates:
• Tuesday, February 18th at 10am
• Wednesday, February 19th at 2pm
• Friday, February 21st at 11am

Looking forward to catching up!

Best,
David`,
    timestamp: '2024-12-18T09:15:00',
    read: true,
    starred: false,
    folder: 'inbox',
    attachments: []
  },
  {
    id: 'msg_3',
    from: { name: 'David Thompson', role: 'client', email: 'david@thompson.com' },
    to: { name: 'David Chen', role: 'adviser', email: 'david.chen@halcyonwealth.com.au' },
    subject: 'Re: Annual Review Reminder',
    body: `Hi David,

Thanks for the reminder. February 18th at 10am works perfectly for me.

See you then!

James`,
    timestamp: '2024-12-18T11:45:00',
    read: true,
    starred: false,
    folder: 'sent',
    attachments: []
  },
  {
    id: 'msg_4',
    from: { name: 'David Chen', role: 'adviser', email: 'david.chen@halcyonwealth.com.au' },
    to: { name: 'David Thompson', role: 'client', email: 'david@thompson.com' },
    subject: 'Market Update - December 2024',
    body: `Hi James,

Quick market update for December:

The ASX 200 has shown strong performance this month, up 2.3%. Your portfolio has benefited from this rally, particularly your holdings in the financial and resources sectors.

Key points:
• CBA up 4.2% - consider taking some profits
• BHP steady despite iron ore price volatility
• Property market showing signs of stabilization

No immediate action required, but happy to discuss any concerns.

Cheers,
David`,
    timestamp: '2024-12-15T16:00:00',
    read: true,
    starred: true,
    folder: 'inbox',
    attachments: []
  }
];

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString('en-AU', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  }
};

const formatFullDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ClientMessaging = ({ userRole = 'client', userName = 'David Thompson' }) => {
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem('halcyon_messages');
    return stored ? JSON.parse(stored) : INITIAL_MESSAGES;
  });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [newMessage, setNewMessage] = useState({ subject: '', body: '' });
  const messagesEndRef = useRef(null);

  // Persist messages
  useEffect(() => {
    localStorage.setItem('halcyon_messages', JSON.stringify(messages));
  }, [messages]);

  // Filter messages by folder and search
  const filteredMessages = messages.filter(msg => {
    const matchesFolder = activeFolder === 'starred' 
      ? msg.starred 
      : msg.folder === activeFolder;
    const matchesSearch = 
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  // Get counts
  const unreadCount = messages.filter(m => !m.read && m.folder === 'inbox').length;
  const starredCount = messages.filter(m => m.starred).length;

  // Mark as read
  const markAsRead = (msgId) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, read: true } : m
    ));
  };

  // Toggle star
  const toggleStar = (msgId, e) => {
    e?.stopPropagation();
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, starred: !m.starred } : m
    ));
  };

  // Delete message
  const deleteMessage = (msgId) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setSelectedMessage(null);
    toast.success('Message deleted');
  };

  // Archive message
  const archiveMessage = (msgId) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, folder: 'archive' } : m
    ));
    setSelectedMessage(null);
    toast.success('Message archived');
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.subject.trim() || !newMessage.body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const msg = {
      id: `msg_${Date.now()}`,
      from: { name: userName, role: userRole, email: userRole === 'client' ? 'david@thompson.com' : 'david.chen@halcyonwealth.com.au' },
      to: { name: userRole === 'client' ? 'David Chen' : 'David Thompson', role: userRole === 'client' ? 'adviser' : 'client', email: userRole === 'client' ? 'david.chen@halcyonwealth.com.au' : 'david@thompson.com' },
      subject: replyTo ? `Re: ${replyTo.subject.replace(/^Re: /, '')}` : newMessage.subject,
      body: newMessage.body,
      timestamp: new Date().toISOString(),
      read: true,
      starred: false,
      folder: 'sent',
      attachments: []
    };

    setMessages(prev => [msg, ...prev]);
    setNewMessage({ subject: '', body: '' });
    setReplyTo(null);
    setShowComposeDialog(false);
    toast.success('Message sent');
  };

  // Open message
  const openMessage = (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      markAsRead(msg.id);
    }
  };

  // Handle reply
  const handleReply = (msg) => {
    setReplyTo(msg);
    setNewMessage({
      subject: `Re: ${msg.subject.replace(/^Re: /, '')}`,
      body: `\n\n---\nOn ${formatFullDate(msg.timestamp)}, ${msg.from.name} wrote:\n\n${msg.body}`
    });
    setShowComposeDialog(true);
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white" data-testid="client-messaging">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
            <DialogTrigger asChild>
              <Button className="w-full bg-[#1a2744]" data-testid="compose-message-btn">
                <Plus className="h-4 w-4 mr-2" /> Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{replyTo ? 'Reply' : 'New Message'}</DialogTitle>
                <DialogDescription>
                  Send a message to your {userRole === 'client' ? 'financial adviser' : 'client'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input 
                    value={userRole === 'client' ? 'David Chen (Financial Adviser)' : 'David Thompson (Client)'} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter subject"
                    disabled={!!replyTo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={newMessage.body}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Type your message..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowComposeDialog(false); setReplyTo(null); setNewMessage({ subject: '', body: '' }); }}>
                  Cancel
                </Button>
                <Button onClick={sendMessage} className="bg-[#1a2744]">
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <nav className="flex-1 p-2">
          <button
            onClick={() => { setActiveFolder('inbox'); setSelectedMessage(null); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
              activeFolder === 'inbox' ? 'bg-[#1a2744]/10 text-[#1a2744]' : 'hover:bg-muted'
            }`}
          >
            <span className="flex items-center gap-2">
              <Inbox className="h-4 w-4" /> Inbox
            </span>
            {unreadCount > 0 && (
              <Badge className="bg-[#1a2744]">{unreadCount}</Badge>
            )}
          </button>
          <button
            onClick={() => { setActiveFolder('starred'); setSelectedMessage(null); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
              activeFolder === 'starred' ? 'bg-[#1a2744]/10 text-[#1a2744]' : 'hover:bg-muted'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" /> Starred
            </span>
            {starredCount > 0 && (
              <Badge variant="outline">{starredCount}</Badge>
            )}
          </button>
          <button
            onClick={() => { setActiveFolder('sent'); setSelectedMessage(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
              activeFolder === 'sent' ? 'bg-[#1a2744]/10 text-[#1a2744]' : 'hover:bg-muted'
            }`}
          >
            <Send className="h-4 w-4" /> Sent
          </button>
          <button
            onClick={() => { setActiveFolder('archive'); setSelectedMessage(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
              activeFolder === 'archive' ? 'bg-[#1a2744]/10 text-[#1a2744]' : 'hover:bg-muted'
            }`}
          >
            <Archive className="h-4 w-4" /> Archive
          </button>
        </nav>
      </div>

      {/* Message List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No messages</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                  selectedMessage?.id === msg.id ? 'bg-[#1a2744]/5' : ''
                } ${!msg.read ? 'bg-[#D4A84C]/[0.06]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#1a2744] text-white text-xs">
                        {msg.from.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${!msg.read ? 'font-semibold' : ''}`}>
                        {activeFolder === 'sent' ? `To: ${msg.to.name}` : msg.from.name}
                      </p>
                      <p className={`text-sm truncate ${!msg.read ? 'font-medium' : 'text-muted-foreground'}`}>
                        {msg.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(msg.timestamp)}
                    </span>
                    <button onClick={(e) => toggleStar(msg.id, e)}>
                      {msg.starred ? (
                        <Star className="h-4 w-4 text-[#D4A84C] fill-[#D4A84C]" />
                      ) : (
                        <Star className="h-4 w-4 text-gray-300 hover:text-[#D4A84C]" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate pl-10">
                  {msg.body.substring(0, 60)}...
                </p>
                {msg.attachments.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 pl-10">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{msg.attachments.length}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Message Detail */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)} className="lg:hidden">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleReply(selectedMessage)}>
                  <Reply className="h-4 w-4 mr-1" /> Reply
                </Button>
                <Button variant="outline" size="sm" onClick={() => toggleStar(selectedMessage.id)}>
                  {selectedMessage.starred ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => archiveMessage(selectedMessage.id)}>
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteMessage(selectedMessage.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">{selectedMessage.subject}</h2>
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#1a2744] text-white">
                      {selectedMessage.from.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedMessage.from.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMessage.from.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFullDate(selectedMessage.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  {selectedMessage.body.split('\n').map((line, i) => (
                    <p key={`item-${i}`} className={line.startsWith('•') ? 'ml-4' : ''}>
                      {line || <br />}
                    </p>
                  ))}
                </div>
                {selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm font-medium mb-3">Attachments</p>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((file, i) => (
                        <div key={`item-${i}`} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                          <FileText className="h-5 w-5 text-red-500" />
                          <span className="flex-1 text-sm">{file}</span>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Select a message to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientMessaging;
