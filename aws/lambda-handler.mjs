import { analyzeRfq } from "../src/lib/analyze.mjs";
import { getDataHubContext } from "../src/lib/datahub-context.mjs";
import { createCase } from "../src/lib/memory.mjs";
import { validateRfqInput } from "../src/lib/validation.mjs";

export async function handler(event) {
  const payload =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body || event;
  const input = validateRfqInput(payload);
  const analysis = await analyzeRfq(input);
  const context = await getDataHubContext(analysis);
  const record = await createCase(analysis, context);

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      analysis,
      context,
      memory: {
        id: record.id,
        provider: record.source,
        version: record.version,
      },
    }),
  };
}

