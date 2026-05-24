# Workflow Automation Builder Demo

Interactive portfolio demo for a Zapier / Make / n8n style workflow automation builder.

The demo shows a business automation flow:

1. New lead submitted from a website form
2. AI qualifies and summarizes the lead
3. Routing rules decide the next path
4. CRM record is updated
5. Slack notification is sent
6. Google Sheets reporting row is appended

This public demo uses mock integrations for safe preview. A real project can connect the same workflow shape to OpenAI, CRM systems, Slack, Google Sheets, Airtable, Notion, ticketing tools, databases, and custom APIs.

## Tech

- React
- TypeScript
- Vite
- Mock integration layer
- Responsive dashboard UI

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
