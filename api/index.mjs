import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { analyzeRfq } from "../src/lib/analyze.mjs";
import {
  calleStatus,
  createSupplierCall,
  recordCallWebhook,
} from "../src/lib/calle.mjs";
import {
  cockroachMcpStatus,
  verifyCockroachSchema,
} from "../src/lib/cockroach-mcp.mjs";
import {
  dataHubStatus,
  getDataHubContext,
  saveImpactDocument,
} from "../src/lib/datahub-context.mjs";
import { createCase, getCase, memoryStatus } from "../src/lib/memory.mjs";
import {
  InputError,
  readJsonBody,
  validateCallInput,
  validateRfqInput,
} from "../src/lib/validation.mjs";

const samplePath = fileURLToPath(
  new URL("../data/sample-rfq.json", import.meta.url),
);

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.setHeader("x-content-type-options", "nosniff");
  response.end(JSON.stringify(payload));
}

async function requestBody(request, limit) {
  if (
    request.body &&
    typeof request.body === "object" &&
    !Buffer.isBuffer(request.body)
  ) {
    return request.body;
  }
  return readJsonBody(request, limit);
}

async function runAnalysis(payload) {
  const input = validateRfqInput(payload);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const analysis = await analyzeRfq(input, { signal: controller.signal });
    const context = await getDataHubContext(analysis);
    const record = await createCase(analysis, context);
    const cockroachMcp = await verifyCockroachSchema();
    return {
      analysis,
      context,
      memory: {
        id: record.id,
        provider: record.source,
        version: record.version,
        mcp: cockroachMcp,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function route(request, response) {
  const url = new URL(
    request.url,
    `https://${request.headers.host || "forgerelay.invalid"}`,
  );

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, {
      status: "ok",
      product: "ForgeRelay",
      version: "0.1.0",
      integrations: {
        gemini: {
          configured: Boolean(process.env.GEMINI_API_KEY),
          model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        },
        datahub: dataHubStatus(),
        memory: {
          ...memoryStatus(),
          mcp: cockroachMcpStatus(),
        },
        calle: calleStatus(),
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/api/sample") {
    const sample = JSON.parse(await readFile(samplePath, "utf8"));
    return sendJson(response, 200, sample);
  }

  if (request.method === "POST" && url.pathname === "/api/analyze") {
    return sendJson(response, 200, await runAnalysis(await requestBody(request)));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/cases/")) {
    const caseId = url.pathname.split("/").pop();
    const record = await getCase(caseId);
    return record
      ? sendJson(response, 200, record)
      : sendJson(response, 404, { error: "Case not found." });
  }

  if (
    request.method === "POST" &&
    url.pathname.startsWith("/api/cases/") &&
    url.pathname.endsWith("/publish-impact")
  ) {
    const parts = url.pathname.split("/");
    const caseId = parts[3];
    const payload = await requestBody(request);
    if (payload.confirmDataHubMutation !== true) {
      throw new InputError("DataHub mutation confirmation is required.", 409);
    }
    const record = await getCase(caseId);
    if (!record) {
      return sendJson(response, 404, { error: "Case not found." });
    }
    const analysis = {
      caseName: record.caseName,
      ...record.state,
    };
    return sendJson(
      response,
      200,
      await saveImpactDocument({
        caseId,
        analysis,
        context: { source: record.state.contextSource },
      }),
    );
  }

  if (request.method === "POST" && url.pathname === "/api/calls") {
    const input = validateCallInput(await requestBody(request));
    return sendJson(response, 202, await createSupplierCall(input));
  }

  if (request.method === "POST" && url.pathname === "/api/calle/webhook") {
    return sendJson(
      response,
      200,
      await recordCallWebhook(await requestBody(request, 256 * 1024)),
    );
  }

  return sendJson(response, 404, { error: "Not found." });
}

export default async function handler(request, response) {
  try {
    await route(request, response);
  } catch (error) {
    const status =
      error instanceof InputError
        ? error.status
        : error?.name === "AbortError"
          ? 504
          : 500;
    if (status >= 500) {
      console.error(error);
    }
    sendJson(response, status, {
      error:
        status === 500
          ? "ForgeRelay could not complete the request."
          : error.message,
    });
  }
}
