# ForgeRelay

ForgeRelay is an AI-assisted RFQ clarification service for small
manufacturers. It converts an incomplete request for quotation into a
quote-ready, evidence-backed work package and coordinates the missing
information with suppliers.

**Demo video:** <https://youtu.be/cg_hcuHM5XQ>

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

Open <http://localhost:3000>. DataHub GMS remains on its official local port,
<http://localhost:8080>. Without credentials the app runs in a visibly
labeled deterministic demo mode. A competition release is not considered
complete until the relevant sponsor integration is configured and captured in
the evidence pack.

## Local DataHub proof

Start DataHub Core with the official quickstart, seed the synthetic catalog,
and connect the official MCP Server over stdio:

```bash
# Run these in an isolated Python 3.11 environment.
python -m pip install -r scripts/requirements-datahub.txt
datahub docker quickstart --version stable
python scripts/seed-datahub.py
```

Set these local-only values in `.env`:

```dotenv
DATAHUB_MCP_COMMAND=uvx
DATAHUB_MCP_ARGS=mcp-server-datahub@latest
DATAHUB_GMS_URL=http://localhost:8080
DATAHUB_ENABLE_MUTATIONS=false
```

Then run `npm start` and `npm run smoke`. A successful live proof reports
`datahubSource: "datahub-mcp"` and the tool trace
`search → get_entities → get_lineage`. See
[`submissions/datahub/EVIDENCE.md`](submissions/datahub/EVIDENCE.md).

## Live demo

The public, credential-free judging build is available at
<https://forgerelay.vercel.app>. It uses the same synthetic fallback as the
local app and labels sponsor integrations honestly when they are not configured.

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
