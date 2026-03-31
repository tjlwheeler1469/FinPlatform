import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, History, Lock } from "lucide-react";

const AuditTrailTab = ({ auditLogs, onDownloadReport }) => {
  return (
    <div className="space-y-4" data-testid="audit-trail-tab">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Audit Trail</h2>
        <Button variant="outline" onClick={() => onDownloadReport("audit-logs")}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <ScrollArea className="h-[500px]">
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="flex items-start gap-3 p-3 rounded border bg-muted/20">
                    <div className="p-2 rounded bg-white border">
                      <Lock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.action_type}</Badge>
                        <Badge variant="secondary">{log.entity_type}</Badge>
                      </div>
                      <p className="text-sm mt-1">Entity: {log.entity_id}</p>
                      <p className="text-xs text-muted-foreground">
                        User: {log.user_id} ({log.user_role}) &bull; {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.hash && (
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          Hash: {log.hash.slice(0, 16)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3" />
                <p>No audit logs recorded</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrailTab;
