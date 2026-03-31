export const DOCUMENT_TEMPLATES = [
  { id: "soa", name: "Statement of Advice (SOA)", description: "Comprehensive financial advice document", required_signatures: ["client", "adviser"], pages: 12 },
  { id: "fds", name: "Fee Disclosure Statement", description: "Annual fee disclosure as required by ASIC", required_signatures: ["client"], pages: 4 },
  { id: "kyc", name: "KYC Verification Form", description: "Know Your Customer identity verification", required_signatures: ["client"], pages: 2 },
  { id: "consent", name: "Privacy Consent Form", description: "Data collection and privacy consent", required_signatures: ["client"], pages: 3 },
  { id: "authority", name: "Authority to Proceed", description: "Client authorization to implement advice", required_signatures: ["client", "adviser"], pages: 1 },
  { id: "ipa", name: "Investment Policy Agreement", description: "Agreement on investment strategy and risk tolerance", required_signatures: ["client", "adviser"], pages: 6 }
];

export const INITIAL_SIGNATURE_REQUESTS = [
  {
    id: "sig_001", document_id: "soa", document_name: "Statement of Advice (SOA)",
    client_name: "Wheeler Family", client_email: "james@wheeler.com", status: "completed",
    sent_at: "2025-03-10T09:00:00Z", completed_at: "2025-03-11T14:30:00Z",
    signatures: [
      { role: "client", name: "James Wheeler", signed_at: "2025-03-11T10:15:00Z" },
      { role: "adviser", name: "Financial Adviser", signed_at: "2025-03-11T14:30:00Z" }
    ]
  },
  {
    id: "sig_002", document_id: "fds", document_name: "Fee Disclosure Statement",
    client_name: "Smith & Associates", client_email: "sarah@smith.com", status: "pending",
    sent_at: "2025-03-12T10:00:00Z", completed_at: null, signatures: []
  },
  {
    id: "sig_003", document_id: "authority", document_name: "Authority to Proceed",
    client_name: "Johnson Trust", client_email: "michael@johnson.com", status: "expired",
    sent_at: "2025-02-15T08:00:00Z", completed_at: null, expires_at: "2025-03-01T08:00:00Z", signatures: []
  }
];

export const MOCK_CLIENTS = [
  { id: "client_1", name: "Wheeler Family", email: "james@wheeler.com" },
  { id: "client_2", name: "Smith & Associates", email: "sarah@smith.com" },
  { id: "client_3", name: "Johnson Trust", email: "michael@johnson.com" },
  { id: "client_4", name: "Williams Family", email: "emma@williams.com" },
  { id: "client_5", name: "Brown Investments", email: "david@brown.com" },
];
