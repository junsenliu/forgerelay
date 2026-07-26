const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

const health = await fetch(`${baseUrl}/api/health`);
if (!health.ok) {
  throw new Error(`Health check failed: ${health.status}`);
}

const analysis = await fetch(`${baseUrl}/api/analyze`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    caseName: "ForgeRelay smoke test",
    rfqText: "Quote 100 pcs CNC aluminum bracket. Black anodized.",
  }),
});
if (!analysis.ok) {
  throw new Error(`Analysis smoke test failed: ${analysis.status}`);
}

const payload = await analysis.json();
if (!payload.memory?.id || !payload.analysis?.readinessScore) {
  throw new Error("Analysis smoke test returned an invalid payload.");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      caseId: payload.memory.id,
      source: payload.analysis.source,
      readinessScore: payload.analysis.readinessScore,
      datahubConfigured: Boolean(payload.context?.configured),
      datahubSource: payload.context?.source || "unknown",
      datahubToolTrace: payload.context?.toolTrace || [],
    },
    null,
    2,
  ),
);
