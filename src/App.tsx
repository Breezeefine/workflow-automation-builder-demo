import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  ClipboardList,
  Database,
  GitBranch,
  History,
  Loader2,
  MessageSquareText,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  Settings2,
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
  const [selectedNodeId, setSelectedNodeId] = useState<WorkflowNodeId>("slack");
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
    setSelectedNodeId("ai");
  }

  function loadSampleLead() {
    setLead(sampleLead);
    setAiResult(buildAiResult(sampleLead));
    setStatuses(initialStatuses);
    setLogs([]);
    setSelectedNodeId("trigger");
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
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Workflow size={22} aria-hidden="true" />
          </div>
          <div>
            <span>Portfolio demo</span>
            <strong>AutoFlow Ops</strong>
          </div>
        </div>

        <nav className="nav-list" aria-label="Workflow sections">
          <a href="#builder" className="active">
            <Workflow size={17} aria-hidden="true" />
            Builder
          </a>
          <a href="#run">
            <Activity size={17} aria-hidden="true" />
            Run monitor
          </a>
          <a href="#integrations">
            <Settings2 size={17} aria-hidden="true" />
            Integrations
          </a>
          <a href="#output">
            <ClipboardList size={17} aria-hidden="true" />
            Output
          </a>
        </nav>

        <section className="sidebar-card" id="integrations">
          <div className="section-title">
            <p>Mock integrations</p>
            <span>Safe preview mode</span>
          </div>
          <div className="integration-list">
            {integrations.map((integration) => (
              <article key={integration.name}>
                <CheckCircle2 size={16} aria-hidden="true" />
                <div>
                  <strong>{integration.name}</strong>
                  <span>{integration.detail}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Zapier / Make / n8n style automation</p>
            <h1>Workflow Automation Builder</h1>
          </div>
          <div className="top-actions">
            <button type="button" className="secondary-button" onClick={loadSampleLead} disabled={isRunning}>
              <RefreshCw size={16} aria-hidden="true" />
              Sample lead
            </button>
            <button type="button" className="primary-button" onClick={runWorkflow} disabled={isRunning}>
              {isRunning ? <Loader2 size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {isRunning ? "Running" : "Run workflow"}
            </button>
          </div>
        </header>

        <section className="status-row" aria-label="Workflow status">
          <span>
            <Sparkles size={16} aria-hidden="true" />
            AI lead scoring
          </span>
          <span>
            <GitBranch size={16} aria-hidden="true" />
            Conditional routing
          </span>
          <span>
            <Send size={16} aria-hidden="true" />
            CRM + Slack + Sheets actions
          </span>
        </section>

        <section className="lead-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Trigger payload</p>
              <h2>Inbound lead sample</h2>
            </div>
            <button type="button" className="icon-button" onClick={resetWorkflow} disabled={isRunning} aria-label="Reset workflow">
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="lead-grid">
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
            <label className="lead-message">
              Message
              <textarea value={lead.message} onChange={(event) => updateLead("message", event.target.value)} />
            </label>
          </div>
        </section>

        <section className="builder-grid" id="builder">
          <div className="canvas-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Visual workflow</p>
                <h2>Trigger to AI processing to actions</h2>
              </div>
              <div className="progress-pill">{progress}% complete</div>
            </div>
            <div className="workflow-canvas" aria-label="Workflow nodes">
              {workflowNodes.map((node, index) => {
                const Icon = iconByNode[node.id];
                const status = statuses[node.id];
                return (
                  <div className="node-shell" key={node.id}>
                    <button
                      type="button"
                      className={`workflow-node ${selectedNodeId === node.id ? "selected" : ""} ${status}`}
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      <span className={`node-icon ${node.kind}`}>
                        {status === "running" ? <Loader2 size={20} aria-hidden="true" /> : <Icon size={20} aria-hidden="true" />}
                      </span>
                      <span className="node-copy">
                        <strong>{node.title}</strong>
                        <small>{node.subtitle}</small>
                      </span>
                      <span className={`node-status ${status}`}>{status}</span>
                    </button>
                    {index < workflowNodes.length - 1 && (
                      <div className="connector" aria-hidden="true">
                        <ArrowRight size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="settings-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Selected node</p>
                <h2>{selectedNode.title}</h2>
              </div>
              <span className={`kind-badge ${selectedNode.kind}`}>{selectedNode.system}</span>
            </div>
            <p className="node-description">{selectedNode.description}</p>
            <div className="config-list">
              {selectedNode.config.map((item) => (
                <div className="config-row" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>

      <aside className="run-panel" id="run">
        <section className="run-summary">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Run preview</p>
              <h2>Execution #{runCount}</h2>
            </div>
            <Bell size={19} aria-hidden="true" />
          </div>

          <div className="score-card" id="output">
            <span>Lead score</span>
            <strong>{aiResult?.score ?? "--"}</strong>
            <p>{aiResult ? `${aiResult.priority} priority with ${aiResult.confidence}% confidence` : "Waiting for AI node output"}</p>
          </div>

          <div className="output-block">
            <strong>AI summary</strong>
            <p>{aiResult?.summary ?? "Run the workflow to generate a structured lead summary."}</p>
          </div>
          <div className="output-block">
            <strong>Recommended action</strong>
            <p>{aiResult?.recommendedAction ?? "No action generated yet."}</p>
          </div>
        </section>

        <section className="mapping-panel">
          <div className="section-title">
            <p>Data mapping</p>
            <span>Inputs to actions</span>
          </div>
          <div className="mapping-list">
            {fieldMap.map((field) => (
              <article key={field.source}>
                <span>{field.source}</span>
                <ArrowRight size={13} aria-hidden="true" />
                <strong>{field.target}</strong>
                <small>{field.value}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="log-panel">
          <div className="section-title">
            <p>Execution log</p>
            <span>{logs.length || 0} events</span>
          </div>
          <div className="log-list">
            {logs.length === 0 ? (
              <div className="empty-log">
                <History size={18} aria-hidden="true" />
                Run the workflow to see each API-style step.
              </div>
            ) : (
              logs.map((log) => (
                <article className="log-item" key={log.id}>
                  <span className={`log-dot ${statuses[log.nodeId]}`} />
                  <div>
                    <strong>{log.title}</strong>
                    <p>{log.detail}</p>
                    <small>{log.timestamp}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
