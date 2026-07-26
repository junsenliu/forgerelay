let activeClient = null;
let activeTransport = null;

function normalizeToolResult(result) {
  const text = (result?.content || [])
    .filter((item) => item?.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n");
  if (!text) {
    return result?.structuredContent || null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text.slice(0, 12_000);
  }
}

async function createClient() {
  if (
    !process.env.COCKROACH_MCP_TOKEN ||
    !process.env.COCKROACH_CLUSTER_ID
  ) {
    return null;
  }
  if (activeClient) {
    return activeClient;
  }

  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StreamableHTTPClientTransport } = await import(
    "@modelcontextprotocol/sdk/client/streamableHttp.js"
  );
  const client = new Client({
    name: "forgerelay-cockroach-memory-check",
    version: "0.1.0",
  });
  activeTransport = new StreamableHTTPClientTransport(
    new URL(
      process.env.COCKROACH_MCP_URL || "https://cockroachlabs.cloud/mcp",
    ),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${process.env.COCKROACH_MCP_TOKEN}`,
          "mcp-cluster-id": process.env.COCKROACH_CLUSTER_ID,
        },
      },
    },
  );
  await client.connect(activeTransport);
  activeClient = client;
  return activeClient;
}

function buildArguments(inputSchema = {}) {
  const properties = inputSchema.properties || {};
  const required = inputSchema.required || [];
  const args = {};
  for (const key of required) {
    if (/database/i.test(key)) {
      args[key] = process.env.COCKROACH_DATABASE || "defaultdb";
    } else if (/schema/i.test(key)) {
      args[key] = "public";
    } else if (/cluster/i.test(key)) {
      args[key] = process.env.COCKROACH_CLUSTER_ID;
    } else if (properties[key]?.default !== undefined) {
      args[key] = properties[key].default;
    } else {
      throw new Error(
        `CockroachDB MCP tool requires unsupported argument: ${key}`,
      );
    }
  }
  return args;
}

export async function verifyCockroachSchema() {
  const client = await createClient();
  if (!client) {
    return {
      configured: false,
      tool: null,
      result: null,
    };
  }

  const listed = await client.listTools();
  const tool = listed.tools?.find((item) => item.name === "list_tables");
  if (!tool) {
    throw new Error("CockroachDB MCP did not expose list_tables.");
  }
  const result = await client.callTool({
    name: tool.name,
    arguments: buildArguments(tool.inputSchema),
  });
  return {
    configured: true,
    tool: tool.name,
    result: normalizeToolResult(result),
  };
}

export function cockroachMcpStatus() {
  return {
    configured: Boolean(
      process.env.COCKROACH_MCP_TOKEN &&
        process.env.COCKROACH_CLUSTER_ID,
    ),
    endpoint:
      process.env.COCKROACH_MCP_URL || "https://cockroachlabs.cloud/mcp",
    tool: "list_tables",
  };
}
