import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRfq } from "./lib/analyze.mjs";
import { calleStatus, createSupplierCall, recordCallWebhook } from "./lib/calle.mjs";
import {
  cockroachMcpStatus,
  verifyCockroachSchema,
} from "./lib/cockroach-mcp.mjs";
import {
  dataHubStatus,
  getDataHubContext,
  saveImpactDocument,
} from "./lib/datahub-context.mjs";
import { createCase, getCase, memoryStatus } from "./lib/memory.mjs";
import {
  InputError,
  readJsonBody,
  validateCallInput,
  validateRfqInput,
} from "./lib/validation.mjs";

const currentDir = fileURLToPath(new URL(".", import.meta.url));
const rootDir = normalize(join(currentDir, ".."));
const publicDir = join(rootDir, "public");
const dataDir = join(rootDir, "data");
const port = Number.parseInt(process.env.PORT || "8080", 10);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(body);
}

function safeStaticPath(pathname) {
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const target = normalize(join(publicDir, relative));
  if (!target.startsWith(publicDir)) {
    return null;
  }
  return target;
}

function serveFile(response, path) {
  if (!path || !existsSync(path)) {
    return false;
  }
  const type = MIME[extname(path).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, {
    "content-type": type,
    "cache-control": type.includes("html")
      ? "no-cache"
      : "public, max-age=300",
    "x-content-type-options": "nosniff",
    "content-security-policy":
      "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:;",
    "referrer-policy": "no-referrer",
  });
  createReadStream(path).pipe(response);
  return true;
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
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "GET" && url.pathname === "/api/health") {
    return json(response, 200, {
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
    const samplePath = join(dataDir, "sample-rfq.json");
    return serveFile(response, samplePath)
      ? undefined
      : json(response, 404, { error: "Sample not found." });
  }

  if (request.method === "POST" && url.pathname === "/api/analyze") {
    return json(response, 200, await runAnalysis(await readJsonBody(request)));
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/cases/")) {
    const caseId = url.pathname.split("/").pop();
    const record = await getCase(caseId);
    return record
      ? json(response, 200, record)
      : json(response, 404, { error: "Case not found." });
  }

  if (
    request.method === "POST" &&
    url.pathname.startsWith("/api/cases/") &&
    url.pathname.endsWith("/publish-impact")
  ) {
    const parts = url.pathname.split("/");
    const caseId = parts[3];
    const payload = await readJsonBody(request);
    if (payload.confirmDataHubMutation !== true) {
      throw new InputError("DataHub mutation confirmation is required.", 409);
    }
    const record = await getCase(caseId);
    if (!record) {
      return json(response, 404, { error: "Case not found." });
    }
    const analysis = {
      caseName: record.caseName,
      ...record.state,
    };
    const result = await saveImpactDocument({
      caseId,
      analysis,
      context: { source: record.state.contextSource },
    });
    return json(response, 200, result);
  }

  if (request.method === "POST" && url.pathname === "/api/calls") {
    const input = validateCallInput(await readJsonBody(request));
    return json(response, 202, await createSupplierCall(input));
  }

  if (request.method === "POST" && url.pathname === "/api/calle/webhook") {
    return json(
      response,
      200,
      await recordCallWebhook(await readJsonBody(request, 256 * 1024)),
    );
  }

  if (request.method === "GET") {
    const path = safeStaticPath(url.pathname);
    if (serveFile(response, path)) {
      return;
    }
  }

  json(response, 404, { error: "Not found." });
}

export function createForgeRelayServer() {
  return createServer((request, response) => {
    route(request, response).catch((error) => {
      const status =
        error instanceof InputError
          ? error.status
          : error?.name === "AbortError"
            ? 504
            : 500;
      if (status >= 500) {
        console.error(error);
      }
      json(response, status, {
        error:
          status === 500
            ? "ForgeRelay could not complete the request."
            : error.message,
      });
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createForgeRelayServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`ForgeRelay listening on http://localhost:${port}`);
  });
}
