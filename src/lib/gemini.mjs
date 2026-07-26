import { InputError } from "./validation.mjs";

const OUTPUT_SCHEMA = {
  type: "object",
  required: [
    "facts",
    "missingFields",
    "questions",
    "readinessScore",
    "risks",
    "summary",
  ],
  properties: {
    facts: {
      type: "object",
      properties: {
        material: { type: ["string", "null"] },
        process: { type: ["string", "null"] },
        finish: { type: ["string", "null"] },
        quantity: { type: ["string", "null"] },
        dueDate: { type: ["string", "null"] },
        tolerance: { type: ["string", "null"] },
      },
    },
    missingFields: {
      type: "array",
      items: {
        type: "object",
        required: ["field", "label", "severity"],
        properties: {
          field: { type: "string" },
          label: { type: "string" },
          severity: { type: "string", enum: ["blocking", "important", "minor"] },
        },
      },
    },
    questions: { type: "array", items: { type: "string" } },
    readinessScore: { type: "integer", minimum: 0, maximum: 100 },
    risks: {
      type: "array",
      items: {
        type: "object",
        required: ["level", "title", "reason"],
        properties: {
          level: { type: "string", enum: ["high", "medium", "low"] },
          title: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
  },
};

function parseModelJson(text) {
  const clean = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/, "")
    .trim();
  const result = JSON.parse(clean);
  if (
    !result ||
    typeof result !== "object" ||
    !Number.isInteger(result.readinessScore)
  ) {
    throw new Error("Gemini returned an invalid RFQ analysis.");
  }
  return result;
}

export async function analyzeWithGemini({ caseName, rfqText }, { signal } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  );
  endpoint.searchParams.set("key", apiKey);

  const prompt = [
    "You are a manufacturing RFQ readiness analyst.",
    "Extract only facts explicitly present in the input.",
    "Do not invent dimensions, dates, quantities, certifications, or processes.",
    "Missing information must become a concise supplier question.",
    "Return JSON matching the supplied schema.",
    `Case name: ${caseName}`,
    "RFQ:",
    rfqText,
  ].join("\n\n");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseJsonSchema: OUTPUT_SCHEMA,
      },
    }),
    signal,
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new InputError(`Gemini request failed (${response.status}): ${detail}`, 502);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new InputError("Gemini returned no analysis.", 502);
  }

  return {
    ...parseModelJson(text),
    caseName,
    source: "gemini",
    sourceLabel: `Gemini API · ${model}`,
  };
}

