import assert from "node:assert/strict";
import test from "node:test";

import { makeDataHubSearchArguments } from "../src/lib/datahub-context.mjs";

test("DataHub search uses the current MCP num_results argument", () => {
  const args = makeDataHubSearchArguments({
    facts: {
      material: "Aluminum 6061",
      process: "CNC milling",
      finish: "anodize",
    },
  });

  assert.deepEqual(args, {
    query: "Aluminum 6061 CNC milling anodize rfq",
    num_results: 5,
  });
  assert.equal("count" in args, false);
});
