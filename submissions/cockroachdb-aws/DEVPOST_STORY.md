# ForgeRelay — Durable RFQ Memory

**Elevator pitch:** An AWS-hosted RFQ agent that stores durable task history and
retrieval context in CockroachDB so supplier decisions survive sessions and
failures.

## Inspiration

An RFQ agent is not useful if its memory disappears between shifts or if a second
operator cannot reconstruct why a question was asked. Manufacturing decisions
need a durable, inspectable handoff rather than an opaque chat transcript.

## What it does

ForgeRelay extracts structured RFQ facts, records the minimum safe case state,
and appends agent events as the case moves from analysis to supplier
clarification. A later process can reload the case and see the same facts,
questions, data-context source, and call outcome.

CockroachDB is the system of record. The application stores structured case state
and append-only events, while excluding source documents, secrets, phone numbers,
and full call transcripts.

## How we built it

- CockroachDB stores `rfq_cases` and `agent_events`.
- CockroachDB Cloud Managed MCP runs `list_tables` as a live schema verification
  step.
- The agent-ready `ccloud` CLI provisions or inspects the competition cluster.
- AWS Lambda runs the stateless RFQ analysis step.
- Gemini produces schema-constrained extraction.
- DataHub MCP supplies metadata context before memory is written.

This satisfies the requirement to use at least two CockroachDB tools: Managed MCP
and `ccloud`, alongside an AWS service.

## Challenges we ran into

Durable memory can easily become a data-hoarding feature. ForgeRelay instead
stores a deliberately small state object and an event trail. The second challenge
was making sponsor technology observable: the UI shows whether memory is truly
CockroachDB-backed and whether Managed MCP verified the live schema.

## Accomplishments that we're proud of

- Case handoff is structured and versioned.
- Agent events are append-only.
- Memory status is honest when credentials are absent.
- Live schema verification uses the official CockroachDB Cloud MCP endpoint.
- The same analysis unit is deployable as an AWS Lambda handler.

## What we learned

Agent memory is most valuable when it explains what the next process may safely
assume. Transactional state and event history belong together so an operator can
replay the decision path without retaining unnecessary private content.

## What's next

We plan to add regional failover testing, bounded vector retrieval for similar
clarifications, and a reviewer view for event history.

**Repository:** https://github.com/junsenliu/forgerelay

**Try it:** https://forgerelay.vercel.app
