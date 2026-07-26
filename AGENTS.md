# ForgeRelay Agent Guide

ForgeRelay is a competition-period project created on 2026-07-26. Keep it
independent from LinkSea Workshop, LinkSea Suite, Brand Hunter, Taiming, and
Dollar.

## Non-negotiable boundaries

- Do not import or copy source code from sibling products.
- Use synthetic manufacturing data only.
- Never commit API keys, phone numbers, customer documents, credentials, or
  call transcripts.
- Keep all public UI and submission materials in English.
- Label fallback/demo behavior honestly.
- Live outbound calls require both `ENABLE_LIVE_CALLS=true` and explicit
  per-request confirmation.
- External metadata mutations require `DATAHUB_ENABLE_MUTATIONS=true`.
- A clean `npm test` is required before every event release.

## Product scope

ForgeRelay turns an incomplete manufacturing RFQ into a quote-ready,
evidence-backed clarification package. Its event adapters are:

- Gemini + Google Cloud for RFQ extraction and the new-business submission.
- DataHub MCP for metadata context, lineage, ownership, and impact.
- CockroachDB on AWS for persistent agent memory and handoff.
- CALL-E for supplier clarification calls with structured outcomes.

