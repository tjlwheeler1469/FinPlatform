export const WORKFLOW_TEMPLATES = [
  {
    id: "onboarding",
    name: "New Client Onboarding",
    description: "Automated sequence for onboarding new clients",
    steps: [
      { action: "create_task", title: "Send welcome pack", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Schedule initial meeting", delay_days: 1, assignee: "self" },
      { action: "send_reminder", title: "Follow up on documents", delay_days: 3, assignee: "self" },
      { action: "create_task", title: "Complete KYC verification", delay_days: 5, assignee: "self" },
      { action: "create_task", title: "Risk profile questionnaire", delay_days: 7, assignee: "self" },
      { action: "create_task", title: "Prepare SOA draft", delay_days: 10, assignee: "self" },
      { action: "send_reminder", title: "Review SOA with client", delay_days: 14, assignee: "self" }
    ]
  },
  {
    id: "annual_review",
    name: "Annual Review Sequence",
    description: "Automated workflow for annual client reviews",
    steps: [
      { action: "send_reminder", title: "Review reminder (30 days)", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Update client data", delay_days: 7, assignee: "self" },
      { action: "create_task", title: "Prepare review report", delay_days: 14, assignee: "self" },
      { action: "send_reminder", title: "Schedule review meeting", delay_days: 21, assignee: "self" },
      { action: "create_task", title: "Send follow-up actions", delay_days: 30, assignee: "self" }
    ]
  },
  {
    id: "compliance",
    name: "Compliance Check",
    description: "Quarterly compliance verification workflow",
    steps: [
      { action: "create_task", title: "Verify KYC documentation", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Check fee disclosure status", delay_days: 2, assignee: "self" },
      { action: "create_task", title: "Review risk profile currency", delay_days: 4, assignee: "self" },
      { action: "send_reminder", title: "Compliance audit complete", delay_days: 7, assignee: "self" }
    ]
  },
  {
    id: "meeting_followup",
    name: "Meeting Follow-up",
    description: "Automated follow-up after client meetings",
    steps: [
      { action: "create_task", title: "Send meeting summary", delay_days: 0, assignee: "self" },
      { action: "create_task", title: "Action items review", delay_days: 1, assignee: "self" },
      { action: "send_reminder", title: "Follow up on decisions", delay_days: 7, assignee: "self" },
      { action: "create_task", title: "Schedule next check-in", delay_days: 14, assignee: "self" }
    ]
  }
];

export const WORKFLOW_MOCK_CLIENTS = [
  { id: "client_1", name: "Thompson Family" },
  { id: "client_2", name: "Smith & Associates" },
  { id: "client_3", name: "Johnson Trust" },
  { id: "client_4", name: "Williams Family" },
  { id: "client_5", name: "Brown Investments" },
];
