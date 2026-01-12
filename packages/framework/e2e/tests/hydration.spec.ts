import { expect, test } from "@playwright/test";

test.describe("Client-side hydration", () => {
  test("renders server content", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toHaveText("E2E Test App");
    await expect(page.getByTestId("server-rendered")).toHaveText(
      "Server rendered content",
    );
  });

  test("client counter component hydrates and displays initial state", async ({
    page,
  }) => {
    await page.goto("/");

    const counter = page.getByTestId("counter");
    await expect(counter).toBeVisible();
    await expect(counter).toHaveText("Count: 0");
  });

  test("clicking counter button increments the count", async ({ page }) => {
    await page.goto("/");

    const counter = page.getByTestId("counter");

    await counter.click();
    await expect(counter).toHaveText("Count: 1");

    await counter.click();
    await expect(counter).toHaveText("Count: 2");

    await counter.click();
    await counter.click();
    await expect(counter).toHaveText("Count: 4");
  });

  test("no JavaScript errors in console", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");

    const counter = page.getByTestId("counter");
    await counter.click();
    await expect(counter).toHaveText("Count: 1");

    expect(errors).toEqual([]);
  });

  test("RSC payload files are fetched", async ({ page }) => {
    const rscRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("aurelia__/aurelia__rsc-payload/") &&
        url.endsWith(".txt")
      ) {
        rscRequests.push(url);
      }
    });

    await page.goto("/");

    await page.waitForLoadState("networkidle");

    expect(rscRequests.length).toBeGreaterThan(0);
  });
});
