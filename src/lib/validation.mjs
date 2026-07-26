const MAX_RFQ_LENGTH = 20_000;
const MAX_NAME_LENGTH = 120;

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "InputError";
    this.status = status;
  }
}

export function requireString(value, name, { max = MAX_NAME_LENGTH } = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw new InputError(`${name} is required.`);
  }
  const clean = value.trim();
  if (clean.length > max) {
    throw new InputError(`${name} exceeds ${max} characters.`);
  }
  return clean;
}

export function validateRfqInput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new InputError("A JSON object is required.");
  }

  const rfqText = requireString(payload.rfqText, "rfqText", {
    max: MAX_RFQ_LENGTH,
  });
  const caseName =
    typeof payload.caseName === "string" && payload.caseName.trim()
      ? requireString(payload.caseName, "caseName")
      : "Untitled RFQ";

  return { caseName, rfqText };
}

export function validateCallInput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new InputError("A JSON object is required.");
  }

  const phone = requireString(payload.phone, "phone", { max: 24 });
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new InputError("phone must use E.164 format, for example +14155550123.");
  }

  const supplierName = requireString(payload.supplierName, "supplierName");
  const caseId = requireString(payload.caseId, "caseId", { max: 80 });
  const questions = Array.isArray(payload.questions)
    ? payload.questions
        .filter((value) => typeof value === "string" && value.trim())
        .slice(0, 8)
        .map((value) => value.trim().slice(0, 300))
    : [];

  if (!questions.length) {
    throw new InputError("At least one clarification question is required.");
  }

  if (payload.confirmLiveCall !== true) {
    throw new InputError("Live call confirmation is required.", 409);
  }

  return { caseId, phone, questions, supplierName };
}

export async function readJsonBody(request, maxBytes = 64 * 1024) {
  const chunks = [];
  let bytes = 0;

  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      throw new InputError("Request body is too large.", 413);
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new InputError("Request body must be valid JSON.");
  }
}

