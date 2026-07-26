const MATERIALS = [
  "aluminum",
  "steel",
  "stainless steel",
  "brass",
  "zinc",
  "abs",
  "polycarbonate",
];

const PROCESSES = [
  "cnc",
  "die casting",
  "injection molding",
  "stamping",
  "laser cutting",
  "extrusion",
  "machining",
];

const FINISHES = [
  "anodized",
  "anodizing",
  "powder coat",
  "plating",
  "polished",
  "painted",
  "passivation",
];

function findFirst(text, values) {
  return values.find((value) => text.includes(value)) ?? null;
}

function matchValue(text, pattern) {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? null;
}

export function analyzeLocally({ caseName, rfqText }) {
  const normalized = rfqText.toLowerCase();
  const material = findFirst(normalized, MATERIALS);
  const process = findFirst(normalized, PROCESSES);
  const finish = findFirst(normalized, FINISHES);
  const quantity =
    matchValue(normalized, /(?:qty|quantity)\s*[:=-]?\s*(\d[\d,]*)/i) ??
    matchValue(normalized, /(\d[\d,]*)\s*(?:pcs|pieces|units)\b/i);
  const dueDate =
    matchValue(
      rfqText,
      /(?:target\s+delivery|due|delivery|need by|deadline)\s*(?:is|by|[:=-])?\s*([A-Za-z]+\s+\d{1,2}(?:,\s*\d{4})?|\d{4}-\d{2}-\d{2})/i,
    ) ?? null;
  const tolerance =
    matchValue(
      normalized,
      /(?:tolerance|tol)\s*[:=-]?\s*([±+\-\d.\s]+(?:mm|in|inch)?)/i,
    ) ?? null;

  const facts = { material, process, finish, quantity, dueDate, tolerance };
  const fieldLabels = {
    material: "material grade",
    process: "manufacturing process",
    finish: "finish specification",
    quantity: "order quantity",
    dueDate: "required delivery date",
    tolerance: "critical tolerances",
  };
  const missingFields = Object.entries(facts)
    .filter(([, value]) => !value)
    .map(([field]) => ({
      field,
      label: fieldLabels[field],
      severity:
        field === "material" || field === "quantity" || field === "tolerance"
          ? "blocking"
          : "important",
    }));

  const questions = missingFields.map(({ field, label }) => {
    if (field === "material") {
      return "What exact material grade and certification are required?";
    }
    if (field === "quantity") {
      return "What are the prototype and production quantities?";
    }
    if (field === "tolerance") {
      return "Which dimensions are critical, and what tolerances apply?";
    }
    if (field === "finish") {
      return "What finish, color, texture, and cosmetic acceptance criteria apply?";
    }
    if (field === "dueDate") {
      return "What is the required delivery date and ship-to location?";
    }
    return `Please confirm the ${label}.`;
  });

  const readinessScore = Math.max(
    15,
    Math.round(100 - missingFields.length * 13.5),
  );
  const risks = [
    ...(facts.material
      ? []
      : [
          {
            level: "high",
            title: "Material is not quotable",
            reason: "Pricing and process capability depend on the exact grade.",
          },
        ]),
    ...(facts.tolerance
      ? []
      : [
          {
            level: "high",
            title: "Critical dimensions are undefined",
            reason: "The supplier cannot select inspection or process controls.",
          },
        ]),
    ...(facts.finish
      ? []
      : [
          {
            level: "medium",
            title: "Cosmetic scope is incomplete",
            reason: "Finish assumptions can create quote and approval churn.",
          },
        ]),
  ];

  return {
    caseName,
    facts,
    missingFields,
    questions,
    readinessScore,
    risks,
    summary: `${caseName} is ${readinessScore}% quote-ready. ${missingFields.length} clarification item${missingFields.length === 1 ? "" : "s"} ${missingFields.length === 1 ? "remains" : "remain"}.`,
    source: "local-demo",
    sourceLabel: "Deterministic fallback — no model call",
  };
}
