import type { Integration, LeadInput, WorkflowNode } from "./types";

export const sampleLead: LeadInput = {
  name: "Sarah Chen",
  company: "Northstar Clinics",
  role: "Operations Manager",
  email: "sarah@northstar.example",
  source: "Website form",
  message:
    "We need to automate patient intake, qualify inbound requests, and route high-value leads to our sales team.",
};

export const workflowNodes: WorkflowNode[] = [
  {
    id: "trigger",
    title: "New lead trigger",
    subtitle: "Website form webhook",
    kind: "trigger",
    system: "Webhook",
    description: "Receives a new lead from a website form, landing page, or CRM capture endpoint.",
    config: [
      { label: "Trigger", value: "POST /api/leads/webhook" },
      { label: "Validation", value: "Require name, email, company, message" },
      { label: "Deduplication", value: "Email + company match" },
    ],
  },
  {
    id: "ai",
    title: "AI lead qualification",
    subtitle: "Score and summarize",
    kind: "ai",
    system: "OpenAI-ready",
    description: "Analyzes lead intent, urgency, business fit, and next recommended action.",
    config: [
      { label: "Model task", value: "Classify, score, summarize, recommend" },
      { label: "Output", value: "Score, confidence, priority, action" },
      { label: "Guardrail", value: "Return structured JSON only" },
    ],
  },
  {
    id: "route",
    title: "Routing condition",
    subtitle: "High intent branch",
    kind: "condition",
    system: "Rules engine",
    description: "Routes leads based on score, confidence, company segment, and message intent.",
    config: [
      { label: "Rule", value: "Score >= 80 and confidence >= 75%" },
      { label: "Success path", value: "Create CRM task and notify Slack" },
      { label: "Fallback path", value: "Send to manual review queue" },
    ],
  },
  {
    id: "crm",
    title: "Update CRM record",
    subtitle: "Create account and task",
    kind: "action",
    system: "CRM API",
    description: "Creates or updates the CRM contact, owner, lead score, task, and next step.",
    config: [
      { label: "Endpoint", value: "PATCH /crm/leads/:email" },
      { label: "Fields", value: "score, priority, owner, next_action" },
      { label: "Retry", value: "3 attempts with error log" },
    ],
  },
  {
    id: "slack",
    title: "Notify sales channel",
    subtitle: "Slack message preview",
    kind: "action",
    system: "Slack API",
    description: "Posts a concise lead summary and recommended next action to the sales channel.",
    config: [
      { label: "Channel", value: "#sales-intake" },
      { label: "Message", value: "Lead summary, score, source, next step" },
      { label: "Mention", value: "Assigned account owner" },
    ],
  },
  {
    id: "sheets",
    title: "Append reporting row",
    subtitle: "Google Sheets log",
    kind: "action",
    system: "Sheets API",
    description: "Adds a row for reporting, weekly review, or lightweight CRM tracking.",
    config: [
      { label: "Sheet", value: "Lead intake report" },
      { label: "Columns", value: "Date, company, score, priority, action" },
      { label: "Export", value: "CSV-ready operations report" },
    ],
  },
];

export const integrations: Integration[] = [
  { name: "OpenAI", status: "Mock", detail: "Structured lead scoring response" },
  { name: "CRM", status: "Mock", detail: "Lead and task update endpoint" },
  { name: "Slack", status: "Mock", detail: "Sales channel notification" },
  { name: "Google Sheets", status: "Mock", detail: "Reporting row append" },
];
