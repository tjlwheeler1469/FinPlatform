/**
 * Calendar Integration Utilities
 * Supports: Google Calendar, Outlook, Apple Calendar
 * Features: .ics export, OAuth integration when API keys provided
 */

// Generate ICS file content for a single event
export const generateICSEvent = (event) => {
  const {
    title,
    description = '',
    location = '',
    startTime,
    endTime,
    organizer = 'Halcyon Wealth',
    attendees = []
  } = event;

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@halcyonwealth.com.au`;
  const now = formatDate(new Date());
  const start = formatDate(startTime);
  const end = formatDate(endTime);

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Halcyon Wealth//Calendar Integration//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(title)}
DESCRIPTION:${escapeICS(description)}
LOCATION:${escapeICS(location)}
ORGANIZER;CN=${organizer}:mailto:calendar@halcyonwealth.com.au
STATUS:CONFIRMED
TRANSP:OPAQUE`;

  // Add attendees
  attendees.forEach(attendee => {
    icsContent += `\nATTENDEE;CN=${attendee.name}:mailto:${attendee.email}`;
  });

  icsContent += `
END:VEVENT
END:VCALENDAR`;

  return icsContent;
};

// Generate ICS file for multiple events
export const generateICSCalendar = (events, calendarName = 'Halcyon Wealth') => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Halcyon Wealth//Calendar Integration//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}`;

  events.forEach((event, index) => {
    const uid = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}@halcyonwealth.com.au`;
    const now = formatDate(new Date());
    const start = formatDate(event.startTime);
    const end = formatDate(event.endTime);

    icsContent += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description || '')}
LOCATION:${escapeICS(event.location || '')}
STATUS:CONFIRMED
END:VEVENT`;
  });

  icsContent += `
END:VCALENDAR`;

  return icsContent;
};

// Escape special characters for ICS format
const escapeICS = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

// Download ICS file
export const downloadICS = (content, filename = 'event.ics') => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export single event
export const exportEventToICS = (event) => {
  const icsContent = generateICSEvent(event);
  const filename = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  downloadICS(icsContent, filename);
};

// Export multiple events
export const exportEventsToICS = (events, filename = 'halcyon_calendar.ics') => {
  const icsContent = generateICSCalendar(events);
  downloadICS(icsContent, filename);
};

// Google Calendar URL generator (for adding via URL)
export const generateGoogleCalendarURL = (event) => {
  const formatGoogleDate = (date) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: event.description || '',
    location: event.location || '',
    sf: 'true',
    output: 'xml'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Outlook Web URL generator
export const generateOutlookURL = (event) => {
  const formatOutlookDate = (date) => {
    return new Date(date).toISOString();
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatOutlookDate(event.startTime),
    enddt: formatOutlookDate(event.endTime),
    body: event.description || '',
    location: event.location || ''
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Office 365 URL generator
export const generateOffice365URL = (event) => {
  const formatDate = (date) => {
    return new Date(date).toISOString();
  };

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: formatDate(event.startTime),
    enddt: formatDate(event.endTime),
    body: event.description || '',
    location: event.location || ''
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
};

// Calendar Integration State Manager
export class CalendarIntegration {
  constructor() {
    this.connections = {
      google: { connected: false, accessToken: null },
      outlook: { connected: false, accessToken: null },
      apple: { connected: false, accessToken: null }
    };
    this.loadConnections();
  }

  loadConnections() {
    const stored = localStorage.getItem('halcyon_calendar_connections');
    if (stored) {
      this.connections = JSON.parse(stored);
    }
  }

  saveConnections() {
    localStorage.setItem('halcyon_calendar_connections', JSON.stringify(this.connections));
  }

  // Check if a service is connected
  isConnected(service) {
    return this.connections[service]?.connected || false;
  }

  // Get all connection statuses
  getConnectionStatuses() {
    return {
      google: this.isConnected('google'),
      outlook: this.isConnected('outlook'),
      apple: this.isConnected('apple')
    };
  }

  // Initiate OAuth flow for Google Calendar
  connectGoogle() {
    // OAuth configuration - requires API key setup
    const clientId = localStorage.getItem('google_calendar_client_id');
    
    if (!clientId) {
      return {
        success: false,
        message: 'Google Calendar API key not configured. Please add your Client ID in settings.',
        setupRequired: true
      };
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.events';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}`;

    window.open(authUrl, '_blank', 'width=500,height=600');
    
    return {
      success: true,
      message: 'Opening Google authorization...'
    };
  }

  // Initiate OAuth flow for Outlook
  connectOutlook() {
    const clientId = localStorage.getItem('outlook_calendar_client_id');
    
    if (!clientId) {
      return {
        success: false,
        message: 'Outlook Calendar API key not configured. Please add your Client ID in settings.',
        setupRequired: true
      };
    }

    const redirectUri = `${window.location.origin}/auth/outlook/callback`;
    const scope = 'Calendars.ReadWrite';
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}`;

    window.open(authUrl, '_blank', 'width=500,height=600');
    
    return {
      success: true,
      message: 'Opening Microsoft authorization...'
    };
  }

  // Apple Calendar uses .ics files - no OAuth needed
  connectApple() {
    return {
      success: true,
      message: 'Apple Calendar uses .ics file import. Download events and open with Calendar app.',
      useICS: true
    };
  }

  // Disconnect a service
  disconnect(service) {
    if (this.connections[service]) {
      this.connections[service] = { connected: false, accessToken: null };
      this.saveConnections();
    }
  }

  // Handle OAuth callback (to be called from callback page)
  handleOAuthCallback(service, accessToken) {
    if (this.connections[service]) {
      this.connections[service] = { connected: true, accessToken };
      this.saveConnections();
      return true;
    }
    return false;
  }
}

// Singleton instance
export const calendarIntegration = new CalendarIntegration();

export default {
  generateICSEvent,
  generateICSCalendar,
  downloadICS,
  exportEventToICS,
  exportEventsToICS,
  generateGoogleCalendarURL,
  generateOutlookURL,
  generateOffice365URL,
  calendarIntegration
};
