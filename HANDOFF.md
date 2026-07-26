# ForgeRelay Handoff

## Current phase

Competition integration. The local application, DataHub Core proof, sponsor
adapters, synthetic sample, tests, and event folders must remain independently
reproducible.

## Release gates

- `npm test`
- `npm run check`
- local smoke test
- sponsor integration health shows `configured`
- English-only UI and evidence
- public repository secret scan
- hosted functional URL
- public demo video under three minutes
- event-specific disclosure of pre-existing ideas and AI-assisted development

## External setup still required

- Google Cloud project, Gemini key, and Cloud Run deployment
- CockroachDB Basic cluster and AWS runtime
- CALL-E sandbox/live-call verification; the local key is configured, but live
  calls remain disabled and no real call has been placed

## Verified locally

- DataHub Core v1.6.0 runs from the official quickstart
- official DataHub MCP Server connects over stdio
- five synthetic assets and four lineage edges are seeded
- the application smoke test returns
  `search → get_entities → get_lineage`
- DataHub mutations remain disabled

Never put these credentials in this repository.
