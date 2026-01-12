import { expect, test } from "@playwright/test";

const htmlHeaders = { Accept: "text/html" };

test.describe("Dev server response verification", () => {
  test("serves index page with expected HTML structure", async ({
    request,
  }) => {
    const response = await request.get("/", { headers: htmlHeaders });
    expect(response.ok()).toBe(true);

    const html = await response.text();

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("lang=");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");

    expect(html).toContain("__AURELIA_APP_ENTRY__");
  });

  test("loads client entry via Vite module system", async ({ request }) => {
    const response = await request.get("/", { headers: htmlHeaders });
    const html = await response.text();

    expect(html).toContain("virtual:vite-rsc/entry-browser");
  });

  test("includes inline RSC flight data", async ({ request }) => {
    const response = await request.get("/", { headers: htmlHeaders });
    const html = await response.text();

    expect(html).toContain("__FLIGHT_DATA");
  });

  test("SPA fallback: serves index.html for unmatched routes", async ({
    request,
  }) => {
    const response = await request.get("/some/non-existent/path", {
      headers: htmlHeaders,
    });
    expect(response.ok()).toBe(true);

    const html = await response.text();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("__AURELIA_APP_ENTRY__");
  });
});
