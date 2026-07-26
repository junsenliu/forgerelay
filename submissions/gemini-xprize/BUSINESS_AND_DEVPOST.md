# ForgeRelay — AI RFQ Operations

**Elevator pitch:** An AI RFQ clarification and supplier follow-up service that
helps small manufacturers move incomplete requests into safe, auditable action.

## New business disclosure

ForgeRelay is a new business and codebase created on July 26, 2026, after the
competition start date. It is not a feature submission from LinkSea Workshop,
Dollar, or another existing product. The founder's manufacturing experience
informed the problem selection, but the ForgeRelay brand, repository, workflow,
deployment, users, costs, and business records are independent.

## Customer problem

Small manufacturers lose quoting time when requests omit technical or commercial
constraints. Today, an experienced operator manually identifies missing inputs,
checks who owns the affected decision, follows up with the supplier, and rebuilds
the case context for the next person.

## AI-operated workflow

1. Gemini extracts only explicit facts into a response schema.
2. DataHub retrieves metadata and lineage context.
3. ForgeRelay prioritizes the questions that block a responsible quote.
4. CockroachDB preserves minimum durable case memory.
5. CALL-E can place a separately authorized clarification call.
6. A human remains responsible for recipient authorization, commercial
   commitments, and final quote approval.

## Google technology

Gemini performs the deployed schema-constrained RFQ analysis. The competition
deployment will also identify the Google Cloud service used in the running
business environment.

## Business model

Planned offer: a monthly RFQ operations workspace for small manufacturers, with
usage-based supplier-call credits. This is a proposed model, not current revenue.

## Current metrics

- Business creation date: July 26, 2026
- External customers: 0
- Revenue: USD 0
- Paid operating expenses to date: USD 0
- Current stage: pre-revenue, working product foundation
- Non-arm's-length revenue: USD 0

These figures must be refreshed immediately before final submission.

## Why now

Structured model output, metadata-aware agents, durable distributed memory, and
task-specific phone agents now make it possible to automate the coordination
work without pretending the AI can approve a manufacturing quote.

## Risks and controls

- No customer data is included in the public demo.
- Facts and assumptions are visually separated.
- Real calls require explicit authorization.
- The phone task cannot negotiate price or place an order.
- Catalog mutations remain disabled until separately confirmed.

**Repository:** https://github.com/junsenliu/forgerelay

**Try it:** https://forgerelay.vercel.app
