const byId = (id) => document.getElementById(id);

const form = byId("rfq-form");
const sampleButton = byId("load-sample");
const analyzeButton = byId("analyze-button");
const emptyState = byId("empty-state");
const results = byId("results");
const errorState = byId("error-state");
const callDialog = byId("call-dialog");
const callForm = byId("call-form");

let activeCase = null;

function setView(view) {
  emptyState.classList.toggle("hidden", view !== "empty");
  results.classList.toggle("hidden", view !== "results");
  errorState.classList.toggle("hidden", view !== "error");
}

function escapeText(value) {
  return String(value ?? "");
}

function renderFacts(facts) {
  const labels = {
    material: "Material",
    process: "Process",
    finish: "Finish",
    quantity: "Quantity",
    dueDate: "Delivery",
    tolerance: "Tolerance",
  };
  const container = byId("facts-list");
  container.replaceChildren();

  for (const [key, label] of Object.entries(labels)) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const value = document.createElement("dd");
    term.textContent = label;
    value.textContent = facts?.[key] || "Not specified";
    value.classList.toggle("muted", !facts?.[key]);
    wrapper.append(term, value);
    container.append(wrapper);
  }
}

function renderList(container, items, factory) {
  container.replaceChildren();
  for (const item of items) {
    container.append(factory(item));
  }
}

function renderResult(payload) {
  const { analysis, context, memory } = payload;
  activeCase = payload;
  byId("readiness-score").textContent = escapeText(analysis.readinessScore);
  byId("analysis-source").textContent = analysis.sourceLabel;
  byId("summary").textContent = analysis.summary;
  renderFacts(analysis.facts);

  renderList(byId("missing-list"), analysis.missingFields || [], (item) => {
    const li = document.createElement("li");
    const marker = document.createElement("span");
    const text = document.createElement("span");
    marker.className = `severity severity-${item.severity}`;
    marker.textContent = item.severity;
    text.textContent = item.label;
    li.append(marker, text);
    return li;
  });

  renderList(byId("question-list"), analysis.questions || [], (question) => {
    const li = document.createElement("li");
    li.textContent = question;
    return li;
  });
  byId("question-count").textContent =
    `${analysis.questions.length} question${analysis.questions.length === 1 ? "" : "s"}`;

  byId("datahub-mode").textContent = context.configured
    ? `Live DataHub MCP · ${(context.toolTrace || []).join(" → ")}`
    : "Synthetic context";
  byId("datahub-impact").textContent = context.impact;
  byId("memory-mode").textContent =
    memory.provider === "cockroachdb"
      ? memory.mcp?.configured
        ? "CockroachDB memory · Managed MCP verified"
        : "CockroachDB persistent memory"
      : "Ephemeral demo memory";
  byId("memory-id").textContent = `Case ${memory.id.slice(0, 8)} · v${memory.version}`;
  setView("results");
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
}

async function loadHealth() {
  try {
    const health = await requestJson("/api/health");
    const configured = Object.values(health.integrations).filter(
      (integration) => integration.configured,
    ).length;
    byId("system-status").innerHTML =
      `<span class="status-dot"></span>${configured}/4 sponsor integrations configured`;
  } catch {
    byId("system-status").textContent = "Health unavailable";
  }
}

sampleButton.addEventListener("click", async () => {
  const sample = await requestJson("/api/sample");
  byId("case-name").value = sample.caseName;
  byId("rfq-text").value = sample.rfqText;
  byId("rfq-text").focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  analyzeButton.disabled = true;
  analyzeButton.querySelector("span").textContent = "Tracing RFQ context…";
  setView("empty");

  try {
    const payload = await requestJson("/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        caseName: byId("case-name").value,
        rfqText: byId("rfq-text").value,
      }),
    });
    renderResult(payload);
  } catch (error) {
    byId("error-message").textContent = error.message;
    setView("error");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.querySelector("span").textContent = "Analyze quote readiness";
  }
});

byId("call-button").addEventListener("click", () => {
  byId("call-feedback").textContent = "";
  callDialog.showModal();
});

callForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeCase) {
    return;
  }

  const submitter = event.submitter;
  if (submitter?.value === "cancel") {
    callDialog.close();
    return;
  }

  byId("call-feedback").textContent = "Creating authorized call…";
  try {
    const payload = await requestJson("/api/calls", {
      method: "POST",
      body: JSON.stringify({
        caseId: activeCase.memory.id,
        supplierName: byId("supplier-name").value,
        phone: byId("supplier-phone").value,
        questions: activeCase.analysis.questions,
        confirmLiveCall: byId("confirm-call").checked,
      }),
    });
    byId("call-feedback").textContent =
      `Call accepted: ${payload.id || payload.call_id || "CALL-E task created"}`;
  } catch (error) {
    byId("call-feedback").textContent = error.message;
  }
});

loadHealth();
