import assert from "node:assert/strict";
import test from "node:test";
import { analyzeLocally } from "../src/lib/local-analyzer.mjs";

test("extracts explicit manufacturing facts without inventing tolerances", () => {
  const result = analyzeLocally({
    caseName: "Bracket",
    rfqText:
      "Quote 2,500 pcs. CNC aluminum with black anodized finish. Delivery: September 30.",
  });

  assert.equal(result.facts.material, "aluminum");
  assert.equal(result.facts.process, "cnc");
  assert.equal(result.facts.finish, "anodized");
  assert.equal(result.facts.quantity, "2,500");
  assert.equal(result.facts.tolerance, null);
  assert.ok(
    result.missingFields.some((item) => item.field === "tolerance"),
    "missing tolerance must remain visible",
  );
  assert.equal(result.source, "local-demo");
});

test("marks an empty commercial request as low readiness", () => {
  const result = analyzeLocally({
    caseName: "Unknown part",
    rfqText: "Please quote the attached part.",
  });

  assert.ok(result.readinessScore <= 25);
  assert.equal(result.missingFields.length, 6);
  assert.ok(result.questions.length >= 5);
});

