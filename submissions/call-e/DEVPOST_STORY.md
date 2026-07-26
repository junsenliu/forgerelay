# ForgeRelay — Supplier Call Agent

**Elevator pitch:** A safe CALL-E phone agent that asks bounded RFQ clarification
questions and returns structured supplier-ready answers without negotiating
terms.

## Inspiration

Many manufacturing quotes stall because one or two technical questions are
waiting in an email thread. The missing step is often a short call, but a general
voice agent can create risk if it negotiates price, places an order, or invents an
answer.

## What it does

ForgeRelay converts only the blocking RFQ fields into a bounded CALL-E task. The
operator must verify the recipient and explicitly authorize the call. The call
announces that it is AI-assisted, asks only the displayed questions, records
unknown when the recipient cannot answer, and never negotiates or makes a
commercial commitment.

CALL-E returns schema-valid answers. The webhook records only the structured
outcome and task status in the ForgeRelay case history.

## How we built it

ForgeRelay calls `POST https://api.heycall-e.com/v1/calls` with an idempotency
key, a restricted task, a recipient result schema, case metadata, and a webhook
URL. Live calling is disabled by default and requires both a server environment
gate and an action-time confirmation in the interface.

## Challenges we ran into

The main challenge was designing a workflow that is useful because it creates a
real-world side effect while still being safe to demonstrate. We added layered
authorization, strict E.164 validation, idempotency, fictional sample data, a
no-negotiation policy, and minimum-data webhook storage.

## Accomplishments that we're proud of

- The app is fully usable in dry-run mode without credentials.
- A real call cannot be triggered accidentally.
- The call plan is inspectable before authorization.
- Structured results map directly back to the questions that blocked the quote.
- Credentials and phone numbers never enter the public repository.
- The reusable `forgerelay-supplier-clarification` Agent Skill passed the
  official generated-skill and repository validators and is submitted as
  [CALL-E Draft PR #35](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/35).

## What we learned

The safest phone agent is not the one with the most freedom. A narrow task,
explicit recipient authorization, and a machine-checkable result are what make a
real call operationally useful.

## What's next

We plan to add consent-aware callback windows, call cancellation, and a reviewer
queue for conflicting answers.

**Repository:** https://github.com/junsenliu/forgerelay

**Try it:** https://forgerelay.vercel.app
