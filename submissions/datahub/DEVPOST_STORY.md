# ForgeRelay — Metadata-Aware RFQs

**Elevator pitch:** An RFQ clarification agent that queries DataHub for schemas,
lineage, ownership, and policy context before recommending safe manufacturing
actions.

## Inspiration

Small manufacturers regularly receive quote requests that look complete but omit
one decision-critical detail: a tolerance, finish standard, inspection
requirement, or delivery constraint. A generic AI assistant can summarize the
request, but it cannot know which downstream quote artifacts depend on a changed
fact or who owns the decision. ForgeRelay was created to make that context part of
the agent's reasoning loop.

## What it does

ForgeRelay separates explicit RFQ facts from missing information, generates a
short list of supplier questions, and calculates quote readiness. Before the plan
is finalized, it calls DataHub MCP in a visible sequence:

1. `search` finds relevant synthetic RFQ and quote assets.
2. `get_entities` retrieves ownership, schema, and documentation.
3. `get_lineage` traces downstream impact for the selected asset.

The interface labels whether the result came from live DataHub MCP or the clearly
marked synthetic fallback. Optional metadata writeback remains disabled unless a
human explicitly confirms the mutation.

## How we built it

ForgeRelay is an English-only Node.js application with a dependency-light web
interface, Gemini structured output, DataHub's official stdio MCP transport,
CockroachDB-compatible durable memory, and a guarded CALL-E adapter. Synthetic
DataHub assets model an RFQ source, extracted constraints, clarification outcomes,
and a quote package.

The project and repository were created on July 26, 2026. No source code was
copied from the founder's pre-existing manufacturing products.

## Challenges we ran into

The hardest problem was keeping metadata context useful without turning it into
an unsupported claim. Search results may be broad, so ForgeRelay fetches entity
details and lineage before it presents impact. We also had to preserve a safe
boundary between read-only context retrieval and catalog mutations.

## Accomplishments that we're proud of

- A real MCP tool chain is visible in the product instead of being hidden in a
  backend log.
- Facts, assumptions, and missing inputs remain separate.
- Synthetic data makes the complete workflow safe for public judging.
- DataHub mutations and real phone calls both fail closed.

## What we learned

Agent quality depends less on a longer prompt than on trustworthy organizational
context. Ownership and lineage make an RFQ question actionable because the agent
can explain what will be affected and who should review it.

## What's next

We plan to expand the synthetic catalog into reusable manufacturing metadata
templates and add governed proposals for approved clarification decisions.

**Repository:** https://github.com/junsenliu/forgerelay

**Try it:** https://forgerelay.vercel.app

**Demo video:** https://youtu.be/cg_hcuHM5XQ

## Disclosures

ForgeRelay and this repository were created on July 26, 2026 during the
submission period. The entrant's pre-existing manufacturing experience and
LinkSea brand informed the problem selection, but no source code or customer
data was copied from an earlier product. OpenAI Codex assisted with
implementation, testing, documentation, and video production under the
entrant's direction. The project uses open-source dependencies under their
respective licenses.
