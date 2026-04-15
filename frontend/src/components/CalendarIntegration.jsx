import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Download,
  Link2,
  ExternalLink,
  Check,
  X,
  Settings,
  ChevronDown,
  Apple,
  Chrome
} from "lucide-react";
import { toast } from "sonner";
import {
  exportEventToICS,
  exportEventsToICS,
  generateGoogleCalendarURL,
  generateOutlookURL,
  generateOffice365URL,
  calendarIntegration
} from "@/utils/calendarIntegration";

// Custom Outlook icon
const OutlookIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.35.19-.85.19-.5 0-.88-.19-.37-.19-.59-.52-.22-.33-.33-.74-.1-.42-.1-.87 0-.45.1-.87.11-.43.33-.76.22-.33.59-.52.37-.19.88-.19.5 0 .85.19.36.19.58.52.23.33.33.76.11.42.11.87zm-1.71 0q0-.28-.07-.52-.07-.25-.2-.44-.14-.19-.34-.29-.2-.11-.48-.11-.28 0-.48.11-.2.1-.34.29-.14.19-.2.44-.07.24-.07.52 0 .28.07.52.06.25.2.44.14.19.34.29.2.11.48.11.28 0 .48-.11.2-.1.34-.29.13-.19.2-.44.07-.24.07-.52zm6.65-1.72q.08 0 .15.01l-.27 1.01q-.06-.02-.14-.03-.08-.01-.15-.01-.4 0-.63.26-.23.25-.23.68v2.25h-1.08V10.4h.85l.14.62h.05q.16-.27.44-.44.28-.18.64-.18h.23zm1.89-.08q.85 0 1.28.53.43.52.43 1.52v.17h-2.66q.01.41.24.68.24.27.65.27.29 0 .51-.09.23-.09.48-.25v.85q-.25.13-.51.19-.27.06-.63.06-.39 0-.72-.13-.33-.13-.57-.38-.24-.26-.37-.63-.13-.38-.13-.87 0-.51.14-.9.14-.4.38-.67.25-.27.58-.41.33-.14.72-.14h.18zm.54 1.6q0-.31-.15-.5-.15-.2-.44-.2-.27 0-.45.19-.17.19-.22.51h1.26zm1.64-.9h1.13l.73 2.17.08.32h.04l.08-.32.71-2.17h1.12l-1.49 3.97-.56 1.17q-.22.42-.6.64-.37.22-.94.22-.32 0-.6-.06v-.86q.22.04.43.04.28 0 .47-.15.19-.14.29-.42l.11-.26-1.5-4.25z"/>
    <path d="M21.98 8.33v11.09l-8.03 3.38V5.55l8.03 2.78zM2.02 12.46l.28-.85.57-1.76 1.21-.47-.03.1-.54 1.63-.22.69.05.03.64-.18 1.37-.37.27.05-.03.06-.21.52-.61 1.57-.25.04.28.87.58 1.74 1.2.47.03-.1.55-1.63.21-.69-.05-.03-.63.19-1.38.37-.26-.05.03-.06.21-.51.61-1.57.25-.04z"/>
  </svg>
);

// Calendar Export Button with dropdown
export const CalendarExportButton = ({ event, variant = "outline", size = "sm" }) => {
  const handleExport = (type) => {
    switch (type) {
      case 'ics':
        exportEventToICS(event);
        toast.success("Event downloaded as .ics file");
        break;
      case 'google':
        window.open(generateGoogleCalendarURL(event), '_blank');
        break;
      case 'outlook':
        window.open(generateOutlookURL(event), '_blank');
        break;
      case 'office365':
        window.open(generateOffice365URL(event), '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Calendar className="h-4 w-4 mr-1" />
          Add to Calendar
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('google')}>
          <Chrome className="h-4 w-4 mr-2 text-blue-500" />
          Google Calendar
          <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('outlook')}>
          <OutlookIcon />
          <span className="ml-2">Outlook.com</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('office365')}>
          <OutlookIcon />
          <span className="ml-2">Office 365</span>
          <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('ics')}>
          <Apple className="h-4 w-4 mr-2" />
          Apple Calendar (.ics)
          <Download className="h-3 w-3 ml-auto opacity-50" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('ics')}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Bulk Export Button
export const CalendarBulkExportButton = ({ events, filename = "halcyon_meetings.ics" }) => {
  const handleBulkExport = () => {
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }
    exportEventsToICS(events, filename);
    toast.success(`Exported ${events.length} events to calendar file`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleBulkExport}>
      <Download className="h-4 w-4 mr-2" />
      Export All ({events.length})
    </Button>
  );
};

// Calendar Integration Settings Component
const CalendarIntegrationSettings = () => {
  const [connections, setConnections] = useState(calendarIntegration.getConnectionStatuses());
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupService, setSetupService] = useState(null);
  const [clientId, setClientId] = useState("");

  const handleConnect = (service) => {
    let result;
    switch (service) {
      case 'google':
        result = calendarIntegration.connectGoogle();
        break;
      case 'outlook':
        result = calendarIntegration.connectOutlook();
        break;
      case 'apple':
        result = calendarIntegration.connectApple();
        break;
      default:
        return;
    }

    if (result.setupRequired) {
      setSetupService(service);
      setShowSetupDialog(true);
    } else if (result.useICS) {
      toast.info(result.message);
    } else {
      toast.success(result.message);
    }
  };

  const handleDisconnect = (service) => {
    calendarIntegration.disconnect(service);
    setConnections(calendarIntegration.getConnectionStatuses());
    toast.success(`Disconnected from ${service}`);
  };

  const handleSaveApiKey = () => {
    if (!clientId) {
      toast.error("Please enter a Client ID");
      return;
    }
    
    localStorage.setItem(`${setupService}_calendar_client_id`, clientId);
    setShowSetupDialog(false);
    setClientId("");
    toast.success(`${setupService} API key saved. Click Connect again to authorize.`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[#D4A84C]" />
          Calendar Integrations
        </CardTitle>
        <CardDescription>
          Connect your calendar to sync meetings automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Calendar */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Chrome className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-xs text-muted-foreground">Sync with your Google account</p>
            </div>
          </div>
          {connections.google ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => handleDisconnect('google')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleConnect('google')}>
              Connect
            </Button>
          )}
        </div>

        {/* Outlook Calendar */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <OutlookIcon />
            </div>
            <div>
              <p className="font-medium">Outlook / Office 365</p>
              <p className="text-xs text-muted-foreground">Sync with Microsoft calendar</p>
            </div>
          </div>
          {connections.outlook ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" /> Connected
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => handleDisconnect('outlook')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleConnect('outlook')}>
              Connect
            </Button>
          )}
        </div>

        {/* Apple Calendar */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Apple className="h-5 w-5 text-gray-800" />
            </div>
            <div>
              <p className="font-medium">Apple Calendar</p>
              <p className="text-xs text-muted-foreground">Download .ics files for import</p>
            </div>
          </div>
          <Badge variant="outline">
            <Download className="h-3 w-3 mr-1" /> Export Only
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          Note: Calendar sync requires OAuth API keys. Export to .ics works without any setup.
        </p>
      </CardContent>

      {/* API Key Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup {setupService} Calendar Integration</DialogTitle>
            <DialogDescription>
              Enter your OAuth Client ID to enable calendar sync
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Enter your OAuth Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>How to get your Client ID:</strong></p>
              {setupService === 'google' && (
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-blue-600 underline">Google Cloud Console</a></li>
                  <li>Create a new project or select existing</li>
                  <li>Enable Google Calendar API</li>
                  <li>Create OAuth 2.0 credentials</li>
                  <li>Copy the Client ID</li>
                </ol>
              )}
              {setupService === 'outlook' && (
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to <a href="https://portal.azure.com" target="_blank" rel="noopener" className="text-blue-600 underline">Azure Portal</a></li>
                  <li>Register a new application</li>
                  <li>Configure API permissions for Calendars.ReadWrite</li>
                  <li>Copy the Application (client) ID</li>
                </ol>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetupDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveApiKey} className="bg-[#1a2744]">Save Client ID</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CalendarIntegrationSettings;
