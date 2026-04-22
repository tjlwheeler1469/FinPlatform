import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";

const MessagesTab = ({ clientId }) => {
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`client_msgs_${clientId}`) || "[]"); } catch { return []; }
  });

  const send = () => {
    if (!msg.trim()) return;
    const entry = { from: "client", body: msg, ts: new Date().toISOString() };
    const updated = [...thread, entry];
    setThread(updated);
    localStorage.setItem(`client_msgs_${clientId}`, JSON.stringify(updated));
    setMsg("");
    toast.success("Message sent to your adviser");
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Message your adviser</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {thread.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>}
          {thread.map((m, i) => (
            <div key={i} className={`p-2.5 rounded-lg text-sm ${m.from === "client" ? "bg-[#1a2744]/10 ml-8" : "bg-gray-100 mr-8"}`}>
              <p>{m.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.ts).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask your adviser anything…" rows={2} data-testid="client-msg-input" />
          <Button onClick={send} className="bg-[#1a2744]" data-testid="client-msg-send"><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagesTab;
