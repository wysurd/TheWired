import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// Exercise the existing production artifact rather than rebuilding during a test.
const cwd = fileURLToPath(new URL("../", import.meta.url));
const html = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
assert.match(
  html,
  /src="\/TheWired\/assets\//,
  "Build with npm run build:pages before this check.",
);
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4174",
    "--strictPort",
    "--base",
    "/TheWired/",
  ],
  { cwd, stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
server.stdout.on("data", (data) => (serverLog += data));
server.stderr.on("data", (data) => (serverLog += data));
let browser;
try {
  const url = "http://127.0.0.1:4174/TheWired/";
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw Error(serverLog);
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* wait for preview startup */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Production preview did not start.");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [],
    workerRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("oracle.worker"))
      workerRequests.push(request.url());
  });
  await page.goto(`${url}#archive/transformer/mathematics`);
  await page
    .getByRole("heading", { name: "Scaled dot products, softmax & masks" })
    .waitFor();
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByText("Dormant / no model loaded").waitFor();
  assert.equal(
    workerRequests.length,
    0,
    "The model worker must not load before activation.",
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Scaled dot products, softmax & masks" })
    .waitFor();
  const assets = await readdir(new URL("../dist/assets/", import.meta.url));
  const worker = assets.find((name) => /^oracle\.worker-.*\.js$/.test(name));
  assert.ok(worker, "Missing emitted local inference worker.");
  const response = await page.request.get(`${url}assets/${worker}`);
  assert.equal(
    response.status(),
    200,
    "Worker must be served under the Pages base path.",
  );
  assert.match(response.headers()["content-type"], /javascript/);
  assert.deepEqual(errors, []);
  console.log(
    "Pages production smoke passed: deep link, lesson chunk, Oracle chunk, no eager worker, reload, and worker asset path.",
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
