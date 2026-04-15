export const KYC_CHECKLIST = [
  { id: "id_verified", label: "Identity Verified (100 point check)", category: "identity", mandatory: true },
  { id: "address_verified", label: "Address Verified", category: "identity", mandatory: true },
  { id: "pep_check", label: "PEP (Politically Exposed Person) Check", category: "aml", mandatory: true },
  { id: "sanctions_check", label: "Sanctions List Check", category: "aml", mandatory: true },
  { id: "source_of_funds", label: "Source of Funds Documented", category: "aml", mandatory: true },
  { id: "risk_assessment", label: "Risk Assessment Completed", category: "risk", mandatory: true },
  { id: "risk_profile", label: "Risk Profile Questionnaire", category: "risk", mandatory: true },
  { id: "soa_issued", label: "Statement of Advice Issued", category: "compliance", mandatory: true },
  { id: "soa_acknowledged", label: "SOA Acknowledged by Client", category: "compliance", mandatory: true },
  { id: "fds_issued", label: "Fee Disclosure Statement Issued", category: "compliance", mandatory: true },
  { id: "consent_obtained", label: "Privacy Consent Obtained", category: "compliance", mandatory: true },
  { id: "beneficial_owner", label: "Beneficial Ownership Identified", category: "aml", mandatory: false },
  { id: "trust_deed_verified", label: "Trust Deed Reviewed (if applicable)", category: "entity", mandatory: false },
  { id: "company_extract", label: "Company Extract Obtained (if applicable)", category: "entity", mandatory: false }
];

export const COMPLIANCE_MOCK_CLIENTS = [
  { id: "client_1", name: "Thompson Family", type: "family", risk_level: "medium" },
  { id: "client_2", name: "Smith & Associates", type: "trust", risk_level: "low" },
  { id: "client_3", name: "Johnson Trust", type: "trust", risk_level: "high" },
  { id: "client_4", name: "Williams Family", type: "family", risk_level: "medium" },
  { id: "client_5", name: "Brown Investments", type: "company", risk_level: "low" },
];

export const INITIAL_ACTIVITY_LOG = [
  { id: "log_1", client_id: "client_1", action: "soa_generated", description: "Statement of Advice generated", user: "David Thompson", timestamp: "2025-03-15T10:30:00Z", category: "document" },
  { id: "log_2", client_id: "client_1", action: "meeting_held", description: "Annual review meeting conducted", user: "David Thompson", timestamp: "2025-03-14T14:00:00Z", category: "meeting" },
  { id: "log_3", client_id: "client_2", action: "kyc_updated", description: "KYC documentation refreshed", user: "David Thompson", timestamp: "2025-03-13T09:15:00Z", category: "compliance" },
  { id: "log_4", client_id: "client_3", action: "risk_review", description: "Risk profile reviewed - upgraded to High", user: "David Thompson", timestamp: "2025-03-12T11:45:00Z", category: "compliance" },
  { id: "log_5", client_id: "client_1", action: "portfolio_change", description: "Portfolio rebalancing executed", user: "David Thompson", timestamp: "2025-03-11T16:20:00Z", category: "transaction" },
  { id: "log_6", client_id: "client_4", action: "phone_call", description: "Phone consultation regarding super contributions", user: "David Thompson", timestamp: "2025-03-10T13:00:00Z", category: "communication" },
  { id: "log_7", client_id: "client_5", action: "email_sent", description: "Quarterly report sent via email", user: "David Thompson", timestamp: "2025-03-09T08:30:00Z", category: "communication" },
];
