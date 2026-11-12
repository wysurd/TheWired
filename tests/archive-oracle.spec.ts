import { expect, test } from "@playwright/test";
import { mockLocalRuntime } from "./oracle-fixture";

test("chapter navigation, URL restoration, worked solutions, and resume", async ({
  page,
}) => {
  await page.goto("/#archive/neural/foundations");
  await expect(
    page.getByRole("heading", { name: "Foundations & the learning problem" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next section" }).click();
  await expect(page).toHaveURL(/#archive\/neural\/architecture$/);
  await page.getByRole("button", { name: "Previous section" }).click();
  await expect(page).toHaveURL(/foundations$/);
  await page
    .getByRole("navigation", { name: "Chapter sections" })
    .getByRole("button", { name: /Worked example/ })
    .click();
  await page.getByText("Reveal worked solution", { exact: true }).click();
  await expect(page.getByText(/The derivative is 0.8/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Worked example / one gradient step" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to archive" }).click();
  await page.getByRole("button", { name: /01 \/ FOUNDATIONS/ }).click();
  await expect(page).toHaveURL(/worked-example$/);
  await page
    .getByRole("navigation", { name: "Chapter sections" })
    .getByRole("button", { name: /Implementation/ })
    .click();
  await expect(
    page.getByText("Python / PyTorch", { exact: false }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Worked example / one gradient step" }),
  ).toBeVisible();
});

test("v0.1 learning progress remains intact after opening the expanded archive", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("wired-progress-v1"))
      localStorage.setItem(
        "wired-progress-v1",
        JSON.stringify({
          completed: ["neural", "cnn"],
          scores: { neural: 1 },
          bookmarks: ["1706.03762"],
        }),
      );
  });
  await page.goto("/#archive/cnn/mathematics");
  await expect(
    page.getByRole("heading", { name: "Shapes, channels & parameter sharing" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Memory Bank", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Attention Is All You Need/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("wired-progress-v1")!),
    ),
  ).toEqual({
    completed: ["neural", "cnn"],
    scores: { neural: 1 },
    bookmarks: ["1706.03762"],
  });
});

test("Oracle is dormant until activated and unsupported browsers get authored fallback", async ({
  page,
}) => {
  const downloads: string[] = [];
  page.on("request", (r) => {
    if (/oracle.worker|huggingface|binary-mlc/.test(r.url()))
      downloads.push(r.url());
  });
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "gpu", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.goto("/#archive/neural/foundations");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await expect(page.getByText("Dormant / no model loaded")).toBeVisible();
  expect(downloads).toEqual([]);
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(page.getByText(/No usable WebGPU adapter/)).toBeVisible();
  await expect(page.getByLabel("ASK ABOUT THIS LESSON")).toBeDisabled();
  await expect(
    page.getByText("No AI answer has been substituted."),
  ).toBeVisible();
  expect(downloads).toEqual([]);
  await page.getByRole("button", { name: "Open worked example" }).click();
  await expect(page).toHaveURL(/worked-example$/);
  await page.getByRole("button", { name: "Collapse Oracle" }).click();
  await expect(
    page.getByRole("complementary", { name: "The Oracle tutor" }),
  ).toBeHidden();
});

test("low-memory devices never start a model worker", async ({ page }) => {
  await mockLocalRuntime(page);
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "deviceMemory", {
      value: 2,
      configurable: true,
    }),
  );
  await page.goto("/#archive/neural/mathematics");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(page.getByText(/less than 4 GB/)).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { oracleWorkers: number }).oracleWorkers,
    ),
  ).toBe(0);
});

test("download errors and GPU-memory errors produce transparent recoverable fallbacks", async ({
  page,
}) => {
  await mockLocalRuntime(page, "download-error");
  await page.goto("/#archive/neural/foundations");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(
    page.getByText(/Check your connection, free storage/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry local model" }),
  ).toBeEnabled();
  await expect(page.getByLabel("ASK ABOUT THIS LESSON")).toBeDisabled();
  await page.getByRole("button", { name: "Retry local model" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { oracleWorkers: number }).oracleWorkers,
      ),
    )
    .toBe(2);
});

test("GPU memory loss is explained without fabricating an answer", async ({
  page,
}) => {
  await mockLocalRuntime(page, "memory-error");
  await page.goto("/#archive/cnn/architecture");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(
    page.getByText(/GPU could not allocate enough memory/),
  ).toBeVisible();
  await expect(
    page.getByText("No AI answer has been substituted."),
  ).toBeVisible();
});

test("initialization progress can be canceled and the worker is released", async ({
  page,
}) => {
  await mockLocalRuntime(page, "loading");
  await page.goto("/#archive/neural/foundations");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Model initialization progress" }),
  ).toHaveAttribute("value", "0.45");
  await page.getByRole("button", { name: "Cancel loading" }).click();
  await expect(
    page.getByRole("button", { name: "Activate local model" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as unknown as { oracleDisposed: number }).oracleDisposed,
    ),
  ).toBe(1);
});

test("local worker receives active context, highlighted text and follow-ups; chapter exit disposes it", async ({
  page,
}) => {
  await mockLocalRuntime(page);
  const remoteRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().startsWith("https://")) remoteRequests.push(r.url());
  });
  await page.goto("/#archive/neural/foundations");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(
    page.getByText("Local model ready / questions stay on this device"),
  ).toBeVisible();
  await page
    .locator(".chapter-content > p")
    .first()
    .evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    });
  await expect(page.locator(".oracle-context blockquote")).toContainText(
    "Supervised learning",
  );
  await page
    .getByLabel("ASK ABOUT THIS LESSON")
    .fill("Explain empirical loss.");
  await page.getByRole("button", { name: "Ask Oracle" }).click();
  await expect(
    page.getByText("Test-only generated explanation."),
  ).toBeVisible();
  await page
    .getByLabel("ASK ABOUT THIS LESSON")
    .fill("Give me a numerical example.");
  await page.getByRole("button", { name: "Ask Oracle" }).click();
  await expect(
    page.getByText(
      "Generation finished / verify the explanation against the chapter",
    ),
  ).toBeVisible();
  const requests = await page.evaluate(() =>
    (
      window as unknown as {
        oracleRequests: {
          type: string;
          messages: { role: string; content: string }[];
        }[];
      }
    ).oracleRequests.filter((r) => r.type === "generate"),
  );
  expect(requests[0].messages.at(-1)?.content).toContain("Supervised learning");
  expect(requests[0].messages.at(-1)?.content).toContain("<highlight>");
  expect(
    requests[1].messages.some(
      (m) =>
        m.role === "assistant" &&
        m.content === "Test-only generated explanation.",
    ),
  ).toBe(true);
  expect(remoteRequests).toEqual([]);
  await page
    .getByRole("navigation", { name: "Chapter sections" })
    .getByRole("button", { name: /Mathematics/ })
    .click();
  await expect(page.locator(".oracle-context")).toContainText(
    "Loss, backpropagation & optimization",
  );
  await expect(
    page.getByRole("button", { name: "Clear selection" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Back to archive" }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { oracleDisposed: number }).oracleDisposed,
    ),
  ).toBe(1);
});

test("generation can be stopped and model unloaded", async ({ page }) => {
  await mockLocalRuntime(page, "slow-generation");
  await page.goto("/#archive/neural/foundations");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await page.getByRole("button", { name: "Activate local model" }).click();
  await expect(page.getByLabel("ASK ABOUT THIS LESSON")).toBeEnabled();
  await page.getByLabel("ASK ABOUT THIS LESSON").fill("Explain this.");
  await page.getByRole("button", { name: "Ask Oracle" }).click();
  await expect(
    page.getByRole("button", { name: "Stop", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ask Oracle" })).toBeVisible();
  await page.getByRole("button", { name: "Unload model" }).click();
  await expect(
    page.getByRole("button", { name: "Activate local model" }),
  ).toBeVisible();
});

test("reader and Oracle fit a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#archive/transformer/implementation");
  await page.getByRole("button", { name: "Open The Oracle" }).click();
  await expect(page.getByText("Dormant / no model loaded")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: "/tmp/wired-v02-mobile.png", fullPage: true });
});
