import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Database,
  GitBranch,
  History,
  Loader2,
  MessageSquareText,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Sheet,
  Sparkles,
  Webhook,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { integrations, sampleLead, workflowNodes } from "./mockData";
import type { AiResult, ExecutionLog, LeadInput, NodeStatus, WorkflowNode, WorkflowNodeId } from "./types";

const nodeOrder: WorkflowNodeId[] = ["trigger", "ai", "route", "crm", "slack", "sheets"];

const iconByNode: Record<WorkflowNodeId, typeof Webhook> = {
  trigger: Webhook,
  ai: Bot,
  route: GitBranch,
  crm: Database,
  slack: MessageSquareText,
  sheets: Sheet,
};

const initialStatuses = nodeOrder.reduce(
  (statusMap, nodeId) => ({
    ...statusMap,
    [nodeId]: "idle",
  }),
  {} as Record<WorkflowNodeId, NodeStatus>,
);

const completedStatuses = nodeOrder.reduce(
  (statusMap, nodeId) => ({
    ...statusMap,
    [nodeId]: "success",
  }),
  {} as Record<WorkflowNodeId, NodeStatus>,
);

const sampleResult = buildAiResult(sampleLead);

const initialLogs: ExecutionLog[] = [
  {
    id: 6,
    nodeId: "sheets",
    title: "Append reporting row completed",
    detail: nodeOutput("sheets", sampleLead, sampleResult),
    timestamp: "09:42:18 AM",
  },
  {
    id: 5,
    nodeId: "slack",
    title: "Notify sales channel completed",
    detail: nodeOutput("slack", sampleLead, sampleResult),
    timestamp: "09:42:17 AM",
  },
  {
    id: 4,
    nodeId: "crm",
    title: "Update CRM record completed",
    detail: nodeOutput("crm", sampleLead, sampleResult),
    timestamp: "09:42:16 AM",
  },
  {
    id: 3,
    nodeId: "route",
    title: "Routing condition completed",
    detail: nodeOutput("route", sampleLead, sampleResult),
    timestamp: "09:42:15 AM",
  },
  {
    id: 2,
    nodeId: "ai",
    title: "AI lead qualification completed",
    detail: nodeOutput("ai", sampleLead, sampleResult),
    timestamp: "09:42:14 AM",
  },
  {
    id: 1,
    nodeId: "trigger",
    title: "New lead trigger completed",
    detail: nodeOutput("trigger", sampleLead, sampleResult),
    timestamp: "09:42:13 AM",
  },
];

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function now() {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function buildAiResult(lead: LeadInput): AiResult {
  const hasAutomationIntent = /automate|route|qualify|sales|workflow|intake/i.test(lead.message);
  const score = hasAutomationIntent ? 86 : 68;

  return {
    score,
    confidence: hasAutomationIntent ? 91 : 76,
    priority: score >= 80 ? "High" : "Medium",
    summary: `${lead.company} is asking for a workflow that captures inbound requests, qualifies intent, and routes follow-up to the right team.`,
    recommendedAction:
      score >= 80
        ? "Create CRM task and schedule a discovery call within 24 hours."
        : "Send to manual review before creating a sales task.",
  };
}

function nodeOutput(nodeId: WorkflowNodeId, lead: LeadInput, result: AiResult | null) {
  const ai = result ?? buildAiResult(lead);

  const outputs: Record<WorkflowNodeId, string> = {
    trigger: `Received lead from ${lead.source}: ${lead.name}, ${lead.role} at ${lead.company}.`,
    ai: `Generated score ${ai.score}/100, ${ai.priority} priority, ${ai.confidence}% confidence.`,
    route: ai.score >= 80 ? "Matched high-intent routing rule." : "Matched manual review fallback.",
    crm: `Updated CRM record for ${lead.company} and assigned next action.`,
    slack: `Sent sales notification with summary and recommended action.`,
    sheets: `Appended reporting row for ${lead.company} with score ${ai.score}.`,
  };

  return outputs[nodeId];
}

function describeRunStart(node: WorkflowNode) {
  const verbs: Record<WorkflowNodeId, string> = {
    trigger: "Reading inbound payload",
    ai: "Scoring lead with AI rules",
    route: "Checking routing condition",
    crm: "Mapping fields to CRM",
    slack: "Preparing Slack notification",
    sheets: "Writing reporting row",
  };

  return verbs[node.id];
}

export default function App() {
  const [lead, setLead] = useState<LeadInput>(sampleLead);
  const [selectedNodeId, setSelectedNodeId] = useState<WorkflowNodeId>("ai");
  const [statuses, setStatuses] = useState(completedStatuses);
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs);
  const [aiResult, setAiResult] = useState<AiResult | null>(sampleResult);
  const [isRunning, setIsRunning] = useState(false);
  const [runCount, setRunCount] = useState(14);

  const selectedNode = workflowNodes.find((node) => node.id === selectedNodeId) ?? workflowNodes[0];
  const completedCount = nodeOrder.filter((nodeId) => statuses[nodeId] === "success").length;
  const progress = Math.round((completedCount / nodeOrder.length) * 100);

  const fieldMap = useMemo(
    () => [
      { source: "lead.company", target: "crm.account_name", value: lead.company },
      { source: "ai.score", target: "crm.lead_score", value: String(aiResult?.score ?? "-") },
      { source: "ai.priority", target: "slack.priority", value: aiResult?.priority ?? "-" },
      { source: "ai.action", target: "crm.next_step", value: aiResult?.recommendedAction ?? "-" },
    ],
    [aiResult, lead.company],
  );

  function updateLead(field: keyof LeadInput, value: string) {
    setLead((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function addLog(nodeId: WorkflowNodeId, title: string, detail: string) {
    setLogs((current) => [
      {
        id: Date.now() + current.length,
        nodeId,
        title,
        detail,
        timestamp: now(),
      },
      ...current,
    ]);
  }

  function resetWorkflow() {
    setStatuses(initialStatuses);
    setLogs([]);
    setAiResult(buildAiResult(lead));
    setSelectedNodeId("trigger");
  }

  function loadSampleLead() {
    setLead(sampleLead);
    setAiResult(buildAiResult(sampleLead));
    setStatuses(completedStatuses);
    setLogs(initialLogs);
    setSelectedNodeId("ai");
  }

  async function runWorkflow() {
    if (isRunning) {
      return;
    }

    const result = buildAiResult(lead);
    setIsRunning(true);
    setStatuses(initialStatuses);
    setLogs([]);
    setAiResult(null);
    setRunCount((current) => current + 1);

    for (const nodeId of nodeOrder) {
      const node = workflowNodes.find((item) => item.id === nodeId);
      if (!node) {
        continue;
      }

      setSelectedNodeId(nodeId);
      setStatuses((current) => ({
        ...current,
        [nodeId]: "running",
      }));
      addLog(nodeId, `${node.title} started`, describeRunStart(node));
      await wait(520);

      if (nodeId === "ai") {
        setAiResult(result);
      }

      setStatuses((current) => ({
        ...current,
        [nodeId]: "success",
      }));
      addLog(nodeId, `${node.title} completed`, nodeOutput(nodeId, lead, result));
      await wait(180);
    }

    setSelectedNodeId("slack");
    setIsRunning(false);
  }

  return (
    <div className="studio-shell">
      <header className="studio-top">
        <div className="brand-line">
          <div className="brand-mark">
            <Workflow size={22} aria-hidden="true" />
          </div>
          <div>
            <span>Automation studio</span>
            <strong>AutoFlow Ops</strong>
          </div>
        </div>

        <div className="title-block">
          <p className="eyebrow">Zapier / Make / n8n style workflow</p>
          <h1>Workflow Automation Builder</h1>
        </div>

        <div className="system-state" aria-label="Workflow system state">
          <span className={`state-dot ${isRunning ? "live" : ""}`} />
          <div>
            <strong>{isRunning ? "Live run" : "Ready"}</strong>
            <small>
              {completedCount}/{nodeOrder.length} modules complete
            </small>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="secondary-button" onClick={loadSampleLead} disabled={isRunning}>
            <RefreshCw size={16} aria-hidden="true" />
            Sample
          </button>
          <button type="button" className="primary-button" onClick={runWorkflow} disabled={isRunning}>
            {isRunning ? <Loader2 size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            {isRunning ? "Running" : "Run"}
          </button>
        </div>
      </header>

      <main className="studio-layout">
        <section className="trigger-console">
          <div className="panel-kicker">
            <Webhook size={17} aria-hidden="true" />
            Trigger payload
          </div>
          <h2>Inbound lead</h2>
          <div className="lead-form">
            <label>
              Contact
              <input value={lead.name} onChange={(event) => updateLead("name", event.target.value)} />
            </label>
            <label>
              Company
              <input value={lead.company} onChange={(event) => updateLead("company", event.target.value)} />
            </label>
            <label>
              Role
              <input value={lead.role} onChange={(event) => updateLead("role", event.target.value)} />
            </label>
            <label>
              Source
              <input value={lead.source} onChange={(event) => updateLead("source", event.target.value)} />
            </label>
            <label className="message-field">
              Message
              <textarea value={lead.message} onChange={(event) => updateLead("message", event.target.value)} />
            </label>
          </div>
          <button type="button" className="ghost-button" onClick={resetWorkflow} disabled={isRunning}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset run state
          </button>
        </section>

        <section className="automation-stage" id="builder">
          <div className="stage-toolbar">
            <div>
              <p className="eyebrow">Visual workflow</p>
              <h2>Lead intake to AI routing to operations actions</h2>
            </div>
            <div className="progress-chip">
              <span>{progress}%</span>
              complete
            </div>
          </div>
          <div className="stage-ruler" aria-hidden="true">
            <span>INBOUND</span>
            <span>CLASSIFY</span>
            <span>ROUTE</span>
            <span>ACTIONS</span>
          </div>

          <div className="workflow-lane" aria-label="Workflow nodes">
            {workflowNodes.map((node, index) => {
              const Icon = iconByNode[node.id];
              const status = statuses[node.id];

              return (
                <div className="lane-step" key={node.id}>
                  <button
                    type="button"
                    className={`flow-node ${selectedNodeId === node.id ? "selected" : ""} ${status}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <span className={`node-orb ${node.kind}`}>
                      {status === "running" ? <Loader2 size={19} aria-hidden="true" /> : <Icon size={19} aria-hidden="true" />}
                    </span>
                    <span className={`node-light ${status}`} />
                    <span className="node-index">0{index + 1}</span>
                    <strong>{node.title}</strong>
                    <small>{node.subtitle}</small>
                    <em>
                      <span />
                      {status}
                    </em>
                  </button>
                  {index < workflowNodes.length - 1 && (
                    <span className={`flow-link ${statuses[node.id] === "success" ? "active" : ""}`} aria-hidden="true">
                      <ArrowRight size={18} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="run-console" id="run">
          <div className="console-header">
            <div>
              <p>Run monitor</p>
              <strong>Execution #{runCount}</strong>
            </div>
            <Bell size={18} aria-hidden="true" />
          </div>

          <div className="score-display" id="output">
            <span>Lead score</span>
            <strong>{aiResult?.score ?? "--"}</strong>
            <p>{aiResult ? `${aiResult.priority} priority with ${aiResult.confidence}% confidence` : "Waiting for AI node output"}</p>
            <div className="signal-meter" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="console-block">
            <span>AI summary</span>
            <p>{aiResult?.summary ?? "Run the workflow to generate a structured lead summary."}</p>
          </div>
          <div className="console-block">
            <span>Recommended action</span>
            <p>{aiResult?.recommendedAction ?? "No action generated yet."}</p>
          </div>
        </aside>
      </main>

      <section className="details-dock">
        <article className="selected-card">
          <div className="dock-title">
            <span>Selected node</span>
            <strong>{selectedNode.title}</strong>
          </div>
          <p>{selectedNode.description}</p>
          <div className="config-grid">
            {selectedNode.config.map((item) => (
              <div className="config-pill" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="mapping-card">
          <div className="dock-title">
            <span>Data mapping</span>
            <strong>Inputs to actions</strong>
          </div>
          <div className="mapping-list">
            {fieldMap.map((field) => (
              <div className="mapping-row" key={field.source}>
                <span>{field.source}</span>
                <ArrowRight size={13} aria-hidden="true" />
                <strong>{field.target}</strong>
                <small>{field.value}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="log-card">
          <div className="dock-title">
            <span>Execution log</span>
            <strong>{logs.length} events</strong>
          </div>
          <div className="event-list">
            {logs.length === 0 ? (
              <div className="empty-log">
                <History size={18} aria-hidden="true" />
                Run the workflow to see each API-style step.
              </div>
            ) : (
              logs.map((log) => (
                <div className="event-row" key={log.id}>
                  <span className={`event-dot ${statuses[log.nodeId]}`} />
                  <div>
                    <strong>{log.title}</strong>
                    <p>{log.detail}</p>
                    <small>{log.timestamp}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="integration-dock" id="integrations">
          <div className="dock-title">
            <span>Mock integrations</span>
            <strong>Safe preview mode</strong>
          </div>
          <div className="integration-grid">
            {integrations.map((integration) => (
              <div className="integration-chip" key={integration.name}>
                <CheckCircle2 size={15} aria-hidden="true" />
                <div>
                  <strong>{integration.name}</strong>
                  <span>{integration.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer className="capability-strip">
        <span>
          <Sparkles size={15} aria-hidden="true" />
          AI lead scoring
        </span>
        <span>
          <GitBranch size={15} aria-hidden="true" />
          Conditional routing
        </span>
        <span>
          <Send size={15} aria-hidden="true" />
          CRM + Slack + Sheets actions
        </span>
        <span>
          <Activity size={15} aria-hidden="true" />
          Execution logs
        </span>
      </footer>
    </div>
  );
}
