# ForgeRelay — shared English demo script

Target length: 2 minutes 45 seconds. Burned-in English captions use the narration
verbatim.

## 0:00–0:12 — Title

**Visual:** ForgeRelay title and the four-step workflow.

**Narration/caption:**
“ForgeRelay turns incomplete manufacturing requests into safe, auditable
clarification work.”

## 0:12–0:32 — Problem

**Visual:** Synthetic outdoor sensor bracket RFQ.

**Narration/caption:**
“A quote can look complete while one missing tolerance or inspection requirement
still makes it unsafe to price. ForgeRelay separates what the customer actually
said from what the team still needs to ask.”

## 0:32–1:03 — Gemini analysis

**Visual:** Load the synthetic sample and run analysis. Highlight confirmed facts,
missing inputs, readiness score, and generated supplier questions.

**Narration/caption:**
“Gemini returns schema-constrained facts, risks, and questions. The prompt forbids
invented dimensions, dates, quantities, certifications, or processes. Here the
delivery date is explicit, while the missing tolerance becomes a supplier
question.”

## 1:03–1:30 — DataHub context

**Visual:** Highlight the live DataHub badge and tool trace.

**Narration/caption:**
“Before the plan is finalized, DataHub MCP runs search, get entities, and get
lineage. That adds ownership, schema, and downstream impact, so the agent can
explain which quote artifacts need review.”

## 1:30–1:58 — CockroachDB and AWS

**Visual:** Highlight CockroachDB memory, reload the case, and show the AWS Lambda
evidence panel.

**Narration/caption:**
“CockroachDB stores the minimum durable case state and append-only agent events.
The Managed MCP server verifies the live schema, while the ccloud CLI manages the
competition cluster. The stateless analysis step also runs on AWS Lambda.”

## 1:58–2:32 — CALL-E

**Visual:** Open the call dialog, show the bounded questions and authorization,
then show one authorized test call and its structured result.

**Narration/caption:**
“For a real follow-up, the operator verifies the recipient and explicitly
authorizes CALL-E. The agent announces that the call is AI-assisted, asks only
the displayed questions, records unknown instead of guessing, and cannot
negotiate or make a purchase commitment.”

## 2:32–2:45 — Close

**Visual:** Return to the full evidence loop and repository URL.

**Narration/caption:**
“ForgeRelay connects analysis, organizational context, durable memory, and a
human-authorized phone call in one inspectable loop. The code and synthetic demo
are public under Apache 2.0.”
