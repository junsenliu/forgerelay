import { createHash } from "node:crypto";
import { appendEvent } from "./memory.mjs";
import { InputError } from "./validation.mjs";

function buildTask({ supplierName, questions }) {
  return [
    `Call ${supplierName} on behalf of ForgeRelay.`,
    "State that this is an AI-assisted supplier clarification call.",
    "Do not negotiate price, place an order, or make a commitment.",
    "Ask only these RFQ questions:",
    ...questions.map((question, index) => `${index + 1}. ${question}`),
    "If the recipient cannot answer, record unknown. Do not guess.",
  ].join("\n");
}

function buildRecipientSchema(questions) {
  const properties = Object.fromEntries(
    questions.map((_, index) => [
      `answer_${index + 1}`,
      { type: "string", description: `Answer to clarification ${index + 1}` },
    ]),
  );
  return {
    type: "object",
    required: Object.keys(properties),
    properties,
  };
}

export async function createSupplierCall(input) {
  if (process.env.ENABLE_LIVE_CALLS !== "true") {
    throw new InputError(
      "Live calls are disabled. Set ENABLE_LIVE_CALLS=true after validating the recipient and plan.",
      409,
    );
  }
  if (!process.env.CALLE_API_KEY) {
    throw new InputError("CALL-E is not configured.", 503);
  }

  const baseUrl = process.env.CALLE_BASE_URL || "https://api.heycall-e.com";
  const idempotencyKey = createHash("sha256")
    .update(
      `${input.caseId}|${input.phone}|${input.questions.join("|")}|${new Date().toISOString().slice(0, 13)}`,
    )
    .digest("hex")
    .slice(0, 32);

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CALLE_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `forgerelay_${idempotencyKey}`,
    },
    body: JSON.stringify({
      task: buildTask(input),
      recipients: [
        {
          phones: [input.phone],
          region: "US",
          locale: "en-US",
        },
      ],
      result_schema: {
        type: "object",
        required: ["completed_count"],
        properties: {
          completed_count: { type: "integer" },
        },
      },
      recipient_result_schema: buildRecipientSchema(input.questions),
      metadata: {
        product: "forgerelay",
        case_id: input.caseId,
      },
      webhook_url: process.env.APP_BASE_URL
        ? `${process.env.APP_BASE_URL.replace(/\/$/, "")}/api/calle/webhook`
        : undefined,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new InputError(`CALL-E request failed (${response.status}): ${detail}`, 502);
  }

  const result = await response.json();
  await appendEvent(input.caseId, "supplier_call.created", {
    callId: result.id ?? result.call_id,
    questionCount: input.questions.length,
  });
  return result;
}

export async function recordCallWebhook(payload) {
  const caseId = payload?.metadata?.case_id;
  if (typeof caseId !== "string" || !caseId) {
    return { recorded: false, reason: "No ForgeRelay case ID." };
  }
  await appendEvent(caseId, "supplier_call.completed", {
    callId: payload.id ?? payload.call_id,
    status: payload.status,
    taskCompleted: payload.task_completed,
    structuredResult: payload.structured_result,
    recipients: payload.recipients,
  });
  return { recorded: true };
}

export function calleStatus() {
  return {
    configured: Boolean(process.env.CALLE_API_KEY),
    liveCallsEnabled: process.env.ENABLE_LIVE_CALLS === "true",
  };
}

