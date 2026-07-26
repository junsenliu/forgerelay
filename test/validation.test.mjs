import assert from "node:assert/strict";
import test from "node:test";
import {
  InputError,
  validateCallInput,
  validateRfqInput,
} from "../src/lib/validation.mjs";

test("validates RFQ input", () => {
  assert.deepEqual(
    validateRfqInput({ caseName: "  Case  ", rfqText: "  Quote 100 pcs  " }),
    { caseName: "Case", rfqText: "Quote 100 pcs" },
  );
});

test("rejects a call without action-time confirmation", () => {
  assert.throws(
    () =>
      validateCallInput({
        caseId: "case",
        supplierName: "Supplier",
        phone: "+14155550123",
        questions: ["What grade?"],
        confirmLiveCall: false,
      }),
    (error) => error instanceof InputError && error.status === 409,
  );
});

test("rejects non-E.164 phone numbers", () => {
  assert.throws(
    () =>
      validateCallInput({
        caseId: "case",
        supplierName: "Supplier",
        phone: "415-555-0123",
        questions: ["What grade?"],
        confirmLiveCall: true,
      }),
    /E\.164/,
  );
});

