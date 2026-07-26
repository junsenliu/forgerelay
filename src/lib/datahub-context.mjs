let activeClient = null;
let activeTransport = null;

function normalizeToolResult(result) {
  const content = Array.isArray(result?.content) ? result.content : [];
  const textParts = content
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text);

  for (const text of textParts) {
    try {
      return JSON.parse(text);
    } catch {
      // Preserve useful text when a server returns Markdown instead of JSON.
    }
  }

  return textParts.join("\n").slice(0, 12_000);
}

function collectUrns(value, urns = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/urn:li:[^\s"'<>]+/g)) {
      urns.add(match[0].replace(/[.,;]+$/, ""));
    }
    return urns;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectUrns(item, urns);
    }
    return urns;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      collectUrns(item, urns);
    }
  }
  return urns;
}

async function createClient() {
  if (activeClient) {
    return activeClient;
  }

  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const client = new Client({
    name: "forgerelay",
    version: "0.1.0",
  });

  if (process.env.DATAHUB_MCP_URL) {
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );
    const headers = process.env.DATAHUB_MCP_TOKEN
      ? { Authorization: `Bearer ${process.env.DATAHUB_MCP_TOKEN}` }
      : {};
    activeTransport = new StreamableHTTPClientTransport(
      new URL(process.env.DATAHUB_MCP_URL),
      { requestInit: { headers } },
    );
  } else if (process.env.DATAHUB_MCP_COMMAND) {
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );
    const args = (process.env.DATAHUB_MCP_ARGS || "")
      .split(/\s+/)
      .filter(Boolean);
    activeTransport = new StdioClientTransport({
      command: process.env.DATAHUB_MCP_COMMAND,
      args,
      env: {
        ...process.env,
        DATAHUB_GMS_URL:
          process.env.DATAHUB_GMS_URL || "http://localhost:8080",
        DATAHUB_GMS_TOKEN: process.env.DATAHUB_GMS_TOKEN || "",
      },
    });
  } else {
    return null;
  }

  await client.connect(activeTransport);
  activeClient = client;
  return activeClient;
}

function makeSearchQuery(analysis) {
  const terms = [
    analysis.facts?.material,
    analysis.facts?.process,
    analysis.facts?.finish,
    "rfq",
  ].filter(Boolean);
  return terms.join(" ");
}

export async function getDataHubContext(analysis) {
  const client = await createClient();
  if (!client) {
    return {
      configured: false,
      source: "synthetic-context",
      assets: [
        {
          urn: "urn:li:dataset:(urn:li:dataPlatform:forgerelay,synthetic.rfq_source,PROD)",
          name: "synthetic.rfq_source",
          owner: "RFQ Engineering",
          downstreamCount: 3,
          status: "demo",
        },
      ],
      impact:
        "Synthetic context only. Configure DataHub MCP to retrieve real ownership and lineage.",
      toolTrace: [],
    };
  }

  const search = await client.callTool({
    name: "search",
    arguments: {
      query: makeSearchQuery(analysis),
      count: 5,
    },
  });
  const normalized = normalizeToolResult(search);
  const urns = [...collectUrns(normalized)].slice(0, 5);
  const toolTrace = ["search"];
  const entities =
    urns.length > 0
      ? normalizeToolResult(
          await client.callTool({
            name: "get_entities",
            arguments: { urns },
          }),
        )
      : null;
  if (entities !== null) {
    toolTrace.push("get_entities");
  }
  const lineage =
    urns.length > 0
      ? normalizeToolResult(
          await client.callTool({
            name: "get_lineage",
            arguments: {
              urn: urns[0],
              upstream: false,
              max_hops: 3,
              max_results: 10,
            },
          }),
        )
      : null;
  if (lineage !== null) {
    toolTrace.push("get_lineage");
  }

  return {
    configured: true,
    source: "datahub-mcp",
    search: normalized,
    entities,
    lineage,
    toolTrace,
    impact:
      toolTrace.length === 3
        ? "DataHub MCP search, entity metadata, and downstream lineage were retrieved before the clarification plan was finalized."
        : "DataHub MCP search completed, but no entity URN was available for entity and lineage expansion.",
  };
}

export async function saveImpactDocument({ caseId, analysis, context }) {
  if (process.env.DATAHUB_ENABLE_MUTATIONS !== "true") {
    return { saved: false, reason: "DataHub mutations are disabled." };
  }

  const client = await createClient();
  if (!client) {
    return { saved: false, reason: "DataHub MCP is not configured." };
  }

  const body = [
    `# ForgeRelay impact assessment: ${analysis.caseName}`,
    "",
    `Case ID: ${caseId}`,
    `Quote readiness: ${analysis.readinessScore}%`,
    `Missing fields: ${analysis.missingFields.map((item) => item.label).join(", ") || "none"}`,
    "",
    "## Context",
    typeof context.search === "string"
      ? context.search.slice(0, 2_000)
      : JSON.stringify(context.search).slice(0, 2_000),
  ].join("\n");

  const result = await client.callTool({
    name: "save_document",
    arguments: {
      title: `ForgeRelay RFQ impact — ${analysis.caseName}`,
      content: body,
    },
  });

  return { saved: true, result: normalizeToolResult(result) };
}

export function dataHubStatus() {
  return {
    configured: Boolean(
      process.env.DATAHUB_MCP_URL || process.env.DATAHUB_MCP_COMMAND,
    ),
    mutationsEnabled: process.env.DATAHUB_ENABLE_MUTATIONS === "true",
    mode: process.env.DATAHUB_MCP_URL
      ? "streamable-http"
      : process.env.DATAHUB_MCP_COMMAND
        ? "stdio"
        : "demo",
  };
}
