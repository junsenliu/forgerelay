import {spawn} from "node:child_process";
import {mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDirectory = path.resolve("public", "screenshots");
const profileDirectory = path.resolve(".chrome-capture-profile");
const port = 9339;

await mkdir(outputDirectory, {recursive: true});

const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDirectory}`,
    "--window-size=1600,1000",
    "about:blank",
  ],
  {stdio: "ignore"},
);

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForJson = async (url, attempts = 80) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response.json();
      }
    } catch {
      // Chrome may need a moment to open its debugging socket.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const connect = async (webSocketDebuggerUrl) => {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, {once: true});
    socket.addEventListener("error", reject, {once: true});
  });

  let nextId = 1;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) {
      return;
    }
    const {resolve, reject} = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message));
    } else {
      resolve(message.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId;
      nextId += 1;
      pending.set(id, {resolve, reject});
      socket.send(JSON.stringify({id, method, params}));
    });

  return {socket, send};
};

const waitForExpression = async (send, expression, timeoutMs = 30000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    if (result.result.value) {
      return;
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
};

const capture = async (send, filename, {fullPage = false} = {}) => {
  let clip;
  if (fullPage) {
    const metrics = await send("Page.getLayoutMetrics");
    const {width, height} = metrics.cssContentSize;
    clip = {x: 0, y: 0, width, height, scale: 1};
  }
  const result = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: fullPage,
    ...(clip ? {clip} : {}),
  });
  await writeFile(
    path.join(outputDirectory, filename),
    Buffer.from(result.data, "base64"),
  );
};

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find((target) => target.type === "page");
  if (!pageTarget) {
    throw new Error("Chrome did not expose a page target");
  }
  const {socket, send} = await connect(pageTarget.webSocketDebuggerUrl);

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send("Page.navigate", {url: "http://127.0.0.1:3000"});
  await waitForExpression(send, "document.readyState === 'complete'");
  await delay(750);
  await capture(send, "forgerelay-empty.png");

  await send("Runtime.evaluate", {
    expression: "document.getElementById('load-sample').click()",
  });
  await waitForExpression(
    send,
    "document.getElementById('rfq-text').value.length > 100",
  );
  await capture(send, "forgerelay-sample.png");

  await send("Runtime.evaluate", {
    expression: "document.getElementById('analyze-button').click()",
  });
  await waitForExpression(
    send,
    "!document.getElementById('results').classList.contains('hidden') && document.getElementById('datahub-mode').textContent.includes('Live DataHub MCP')",
    60000,
  );
  await send("Runtime.evaluate", {
    expression:
      "document.getElementById('results').scrollIntoView({block: 'start'}); window.scrollBy(0, -24)",
  });
  await delay(750);
  await capture(send, "forgerelay-result.png");

  socket.close();
  process.stdout.write(
    `Captured ForgeRelay evidence in ${outputDirectory}\n`,
  );
} finally {
  chrome.kill();
}
