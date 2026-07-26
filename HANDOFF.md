# ForgeRelay Handoff

## Current phase

Competition foundation. The local application, sponsor adapters, synthetic
sample, tests, and event folders must remain independently reproducible.

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
- DataHub Core quickstart plus MCP endpoint
- CockroachDB Basic cluster and AWS runtime
- CALL-E account and API key

Never put these credentials in this repository.

