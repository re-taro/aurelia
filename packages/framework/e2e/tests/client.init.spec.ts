import { expect, test } from "@playwright/test";

test.describe("Client initialization", () => {
  test("clientInit module runs before React hydration", async ({ page }) => {
    await page.goto("/");

    const counter = page.getByTestId("counter");
    await counter.click();
    await expect(counter).toHaveText("Count: 1");

    const clientInitRan = await page.evaluate(() => window.__CLIENT_INIT_RAN__);
    expect(clientInitRan).toBe(true);

		const timestamps = await page.evaluate(() => ({
			clientInit: window.__CLIENT_INIT_TIMESTAMP__,
      reactHydrated: window.__REACT_HYDRATED_TIMESTAMP__,
    }));

    expect(timestamps.clientInit).toBeDefined();
    expect(timestamps.reactHydrated).toBeDefined();
    expect(timestamps.clientInit).toBeLessThanOrEqual(
      timestamps.reactHydrated!,
    );
  });

  test("clientInit globals are available during React render", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/");

    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);

    const clientInitRan = await page.evaluate(() => window.__CLIENT_INIT_RAN__);
    expect(clientInitRan).toBe(true);
  });
});
