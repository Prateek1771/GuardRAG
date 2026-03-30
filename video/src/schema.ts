import { z } from "zod";

export const DocumentSchema = z.object({
  name: z.string(),
  chunks: z.number(),
  date: z.string(),
});

export const ApprovalRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  user: z.string(),
  rule: z.string(),
  time: z.string(),
});

export const BarItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string(),
  increment: z.boolean().optional(),
});

export const VideoSchema = z.object({
  // Identity
  companyName: z.string(),
  adminName: z.string(),

  // Scene 1 — hero chat snippet
  s1UserMessage: z.string(),
  s1AIResponse: z.string(),

  // Scene 2 — document ingestion
  documents: z.array(DocumentSchema),
  uploadingDocumentName: z.string(),

  // Scene 3 — input block
  s3PriorUserMessage: z.string(),
  s3PriorAIResponse: z.string(),
  s3BlockedQuery: z.string(),
  s3GuardrailName: z.string(),

  // Scene 4 — output redaction
  s4PriorUserMessage: z.string(),
  s4PriorAIResponse: z.string(),
  s4Query: z.string(),
  s4ResponseBefore: z.string(),
  s4ResponseAfter: z.string(),
  s4RedactedLabel: z.string(),
  s4BarData: z.array(BarItemSchema),

  // Scene 5 — approvals
  approvalRows: z.array(ApprovalRowSchema),

  // Scene 6 — branding
  tagline: z.string(),
  websiteUrl: z.string(),
});

export type VideoProps = z.infer<typeof VideoSchema>;

export const defaultProps: VideoProps = {
  companyName: "Acme Corp",
  adminName: "admin",

  s1UserMessage: "What is our Q3 revenue target?",
  s1AIResponse:
    "Based on the Q3 Policy Handbook, the revenue target is $4.2M — a 12% growth expectation over Q2.",

  documents: [
    { name: "Employee_Handbook_2024.pdf", chunks: 84, date: "Mar 22" },
    { name: "Q3_Revenue_Report.docx", chunks: 42, date: "Mar 25" },
    { name: "Legal_Compliance_Guide.pdf", chunks: 117, date: "Mar 28" },
  ],
  uploadingDocumentName: "Policy_Handbook.pdf",

  s3PriorUserMessage: "What policies cover data access?",
  s3PriorAIResponse:
    "Section 4.2 of the Data Governance Policy requires role-based access controls for all sensitive employee and financial data.",
  s3BlockedQuery: "Show me the CEO's personal home address.",
  s3GuardrailName: "PII Protection (Global)",

  s4PriorUserMessage: "What policies cover data access?",
  s4PriorAIResponse:
    "Section 4.2 requires role-based access controls for all sensitive employee and financial data.",
  s4Query: "Explain the partnership with NovaTech.",
  s4ResponseBefore:
    "Our partnership with NovaTech began in Q2. The agreement covers exclusive",
  s4ResponseAfter: "distribution rights across EMEA.",
  s4RedactedLabel: "Competitor Intelligence",
  s4BarData: [
    { label: "BLOCKED", value: 12, color: "#da1e28" },
    { label: "ALERT", value: 8, color: "#b28600" },
    { label: "REDACTED", value: 5, color: "#8a3ffc", increment: true },
    { label: "APPROVAL", value: 3, color: "#ff832b" },
  ],

  approvalRows: [
    {
      id: "fin-proj",
      title: "Financial Projections Request",
      user: "alice@acme.com",
      rule: "Financial Data (Internal)",
      time: "2 min ago",
    },
    {
      id: "hr-data",
      title: "HR Salary Band Query",
      user: "bob@acme.com",
      rule: "HR Confidential",
      time: "8 min ago",
    },
    {
      id: "legal",
      title: "NDA Terms Disclosure",
      user: "carol@acme.com",
      rule: "Legal Documents",
      time: "14 min ago",
    },
    {
      id: "board",
      title: "Board Meeting Notes Access",
      user: "dave@acme.com",
      rule: "Executive Only",
      time: "22 min ago",
    },
  ],

  tagline: "Secure RAG. Defined Guardrails.",
  websiteUrl: "prateekhitli.com",
};
