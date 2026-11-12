import { test, expect } from "@playwright/test";
test("learning, quiz results and bookmarks survive reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome back, operator." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter module" }).click();
  await page
    .getByRole("navigation", { name: "Chapter sections" })
    .getByRole("button", { name: /Assessment/ })
    .click();
  await page.getByRole("button", { name: "Mark as complete" }).click();
  await page.getByRole("button", { name: /Gradients of the loss/ }).click();
  await expect(page.getByText("Signal retained. Correct.")).toBeVisible();
  await page.getByRole("button", { name: "Memory Bank", exact: true }).click();
  await expect(page.getByText("MASTERED", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("MASTERED", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Research Signal", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Save Attention Is All You Need",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Memory Bank", exact: true }).click();
  await expect(
    page.getByRole("link", { name: /Attention Is All You Need/ }),
  ).toBeVisible();
});
test("architecture controls update topology and can pause", async ({
  page,
}) => {
  await page.goto("/#lab");
  await page.getByRole("slider", { name: "Hidden layers" }).fill("3");
  await page.getByRole("slider", { name: "Neurons per layer" }).fill("8");
  await expect(
    page.getByRole("img", {
      name: "Neural network with 5 layers and 4, 8, 8, 8, 3 neurons per layer",
    }),
  ).toBeVisible();
  await expect(page.getByText("184", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pause signal" }).click();
  await expect(page.getByText("SIGNAL PAUSED")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Hidden layers" })).toHaveValue(
    "2",
  );
});
test("feed refresh, auto-refresh and failure fallback", async ({ page }) => {
  let requests = 0;
  await page.route("https://www.ebi.ac.uk/**", (route) => {
    requests++;
    return route.fulfill({
      json: {
        resultList: {
          result: [
            {
              id: "123",
              source: "MED",
              title: "Test deep learning research",
              authorString: "Researcher",
              firstPublicationDate: "2026-01-01",
              abstractText: "A representative research abstract.",
            },
          ],
        },
      },
    });
  });
  await page.goto("/#research");
  await page.getByRole("button", { name: "Refresh live feed" }).click();
  await expect(
    page.getByRole("link", { name: "Test deep learning research" }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Auto / 5 min" }).check();
  await expect.poll(() => requests).toBeGreaterThan(1);
  await page.getByRole("checkbox", { name: "Auto / 5 min" }).uncheck();
  await page.unroute("https://www.ebi.ac.uk/**");
  await page.route("https://www.ebi.ac.uk/**", (route) => route.abort());
  await page.getByRole("button", { name: "Refresh live feed" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Live source unavailable",
  );
  await expect(
    page.getByRole("link", { name: "Test deep learning research" }),
  ).toBeVisible();
});
test("archive search and mobile navigation fit the screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("button", { name: "Knowledge Archive", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search modules" })
    .fill("transformer");
  await expect(
    page.getByRole("heading", { name: "Transformers", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Neural networks", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/wired-mobile.png", fullPage: true });
});
test("dashboard screenshot and error-free render", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto("/");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({ path: "/tmp/wired-dashboard.png", fullPage: true });
  expect(errors).toEqual([]);
});
