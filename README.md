# ForgeRelay

ForgeRelay is an AI-assisted RFQ clarification service for small
manufacturers. It converts an incomplete request for quotation into a
quote-ready, evidence-backed work package and coordinates the missing
information with suppliers.

The project was created on **July 26, 2026**. It is a new, independent product
and codebase built during the active submission windows for the competitions
listed below. It uses synthetic sample data and does not contain customer
documents or code from pre-existing LinkSea or Dollar products.

## The three-minute loop

1. Paste an incomplete manufacturing RFQ.
2. Gemini extracts requirements, uncertainties, and missing commercial facts.
3. DataHub MCP adds ownership and lineage context before the agent recommends
   action.
4. ForgeRelay produces a prioritized clarification plan.
5. With an explicit human confirmation, CALL-E contacts the supplier and
   returns schema-validated results.
6. CockroachDB stores the minimum structured memory required for another agent
   to resume the case on AWS.

## Event targets

| Event | ForgeRelay proof |
| --- | --- |
| Build with DataHub | Metadata-aware RFQ change impact using DataHub MCP |
| Build with Gemini XPRIZE | New AI-operated small-business service on Google Cloud |
| CockroachDB × AWS Agentic Memory | Durable, resumable RFQ case memory |
| CALL-E | Real supplier clarification calls with structured outcomes |

The CALL-E entry also has a validated public Agent Skill contribution in
[`CALLE-AI/awesome-phone-call-agents#35`](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/35).

## Local start

```bash
npm install
copy .env.example .env
npm start
```

Open <http://localhost:8080>. Without credentials the app runs in a visibly
labeled deterministic demo mode. A competition release is not considered
complete until the relevant sponsor integration is configured and captured in
the evidence pack.

## Safety

- Live calls are disabled by default.
- The server rejects arbitrary CALL-E tasks; it builds a bounded supplier
  clarification task from validated fields.
- No source document is sent to a provider; only the minimum RFQ facts entered
  by the user are used.
- CockroachDB stores structured facts and evidence references, not uploaded
  documents or secrets.
- DataHub mutations are off by default.

## License

Apache-2.0. See [LICENSE](LICENSE).
