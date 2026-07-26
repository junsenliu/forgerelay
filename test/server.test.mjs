import assert from "node:assert/strict";
import test from "node:test";

process.env.FORGERELAY_SKIP_ENV_FILE = "true";

const { createForgeRelayServer } = await import("../src/server.mjs");

async function withServer(callback) {
  const server = createForgeRelayServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("reports sponsor integration health honestly", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.product, "ForgeRelay");
    assert.equal(payload.integrations.gemini.configured, false);
    assert.equal(payload.integrations.calle.liveCallsEnabled, false);
  });
});

test("runs the synthetic RFQ loop without external credentials", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        caseName: "Synthetic bracket",
        rfqText: "Quote 500 pcs CNC aluminum. Black anodized.",
      }),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.analysis.source, "local-demo");
    assert.equal(payload.context.configured, false);
    assert.equal(payload.memory.provider, "memory-demo");
    assert.ok(payload.memory.id);
  });
});

test("fails closed when a live call is requested but disabled", async () => {
  await withServer(async (baseUrl) => {
    const analysis = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        caseName: "Synthetic bracket",
        rfqText: "Please quote the attached part.",
      }),
    }).then((response) => response.json());

    const response = await fetch(`${baseUrl}/api/calls`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        caseId: analysis.memory.id,
        supplierName: "Synthetic Supplier",
        phone: "+14155550123",
        questions: analysis.analysis.questions,
        confirmLiveCall: true,
      }),
    });
    assert.equal(response.status, 409);
    const payload = await response.json();
    assert.match(payload.error, /disabled/i);
  });
});
