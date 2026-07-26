# ForgeRelay DataHub evidence

Verified locally on July 26, 2026 (PDT).

## Runtime

- Docker Desktop: 4.83.0
- Docker Engine: 29.6.2
- DataHub Core: v1.6.0 official quickstart
- DataHub GMS: `http://localhost:8080/health` returned HTTP 200
- DataHub frontend: `http://localhost:9002` returned HTTP 200
- GMS, frontend, Kafka, MySQL, and OpenSearch passed their container health
  checks; DataHub Actions was running

Docker Desktop's classic image store was used because the containerd image
store repeatedly returned CloudFront EOF errors for large layers on this
Windows host. No project container or volume existed when the reversible
setting was changed.

## Synthetic catalog

`scripts/seed-datahub.py` created five synthetic datasets:

1. `synthetic.rfq_source`
2. `synthetic.extracted_constraints`
3. `synthetic.clarification_plan`
4. `synthetic.supplier_call_result`
5. `synthetic.quote_ready_package`

It also created four downstream lineage edges. Every asset is labeled
synthetic, includes the synthetic `RFQ Engineering` owner team, and contains no
customer or supplier data.

## MCP proof

ForgeRelay launched the official `mcp-server-datahub` package over stdio and
queried the local GMS. A direct adapter verification confirmed:

```json
{
  "configured": true,
  "source": "datahub-mcp",
  "toolTrace": ["search", "get_entities", "get_lineage"],
  "hasSyntheticOwner": true,
  "hasOwnerTeam": true,
  "hasSchema": true,
  "hasDownstreamQuotePackage": true
}
```

The application-level smoke test returned:

```json
{
  "ok": true,
  "source": "local-demo",
  "readinessScore": 73,
  "datahubConfigured": true,
  "datahubSource": "datahub-mcp",
  "datahubToolTrace": ["search", "get_entities", "get_lineage"]
}
```

`local-demo` refers only to the deterministic RFQ analyzer used while Gemini is
not configured. The DataHub context in the same response came from the live
local DataHub MCP Server.

## Safety and verification

- `DATAHUB_ENABLE_MUTATIONS=false`
- the server also requires a per-request mutation confirmation
- `ENABLE_LIVE_CALLS=false`
- credentials remain in ignored local `.env` only
- `npm test`: 9 passed
- `npm run check`: passed
- `npm run smoke`: passed with the three-tool live DataHub trace

## Public demo video

- YouTube: <https://youtu.be/cg_hcuHM5XQ>
- Duration: 1 minute 41 seconds
- Format: 1920×1080, 30 fps, H.264 video with AAC stereo audio
- Language: English neural narration with burned-in English captions
- Footage: real ForgeRelay result showing the live
  `search → get_entities → get_lineage` DataHub MCP trace
- Copyright check: YouTube reported no issues
- Branding: ForgeRelay is the submission brand; the closing frame identifies it
  as an independent project by LinkSea using the entrant-owned LinkSea mark

Public repository: <https://github.com/junsenliu/forgerelay>

Public fallback demo: <https://forgerelay.vercel.app>
