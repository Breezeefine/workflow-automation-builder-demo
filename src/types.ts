export type WorkflowNodeId = "trigger" | "ai" | "route" | "crm" | "slack" | "sheets";

export type NodeKind = "trigger" | "ai" | "condition" | "action";

export type NodeStatus = "idle" | "running" | "success";

export type WorkflowNode = {
  id: WorkflowNodeId;
  title: string;
  subtitle: string;
  kind: NodeKind;
  system: string;
  description: string;
  config: Array<{
    label: string;
    value: string;
  }>;
};

export type Integration = {
  name: string;
  status: "Connected" | "Mock";
  detail: string;
};

export type LeadInput = {
  name: string;
  company: string;
  role: string;
  email: string;
  source: string;
  message: string;
};

export type AiResult = {
  score: number;
  confidence: number;
  priority: "High" | "Medium" | "Low";
  summary: string;
  recommendedAction: string;
};

export type ExecutionLog = {
  id: number;
  nodeId: WorkflowNodeId;
  title: string;
  detail: string;
  timestamp: string;
};
