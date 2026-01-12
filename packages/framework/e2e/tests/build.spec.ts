import { expect, test } from "@playwright/test";

test.describe("Build output verification", () => {
  test("generates index.html with expected HTML structure", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);

    const html = await response.text();

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html");
    expect(html).toContain("lang=");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");

    expect(html).toContain("__AURELIA_APP_ENTRY__");
    expect(html).toContain('rel="preload"');
    expect(html).toContain("aurelia__/aurelia__rsc-payload/");
  });

  test("generates RSC payload files at /aurelia__/*.txt", async ({
    request,
  }) => {
    const indexResponse = await request.get("/");
    const html = await indexResponse.text();

    const rscPayloadMatch = html.match(
      /aurelia__\/aurelia__rsc-payload\/[^"'\s]+\.txt/,
    );
    expect(rscPayloadMatch).not.toBeNull();

    const rscPayloadPath = "/" + rscPayloadMatch![0];
    const rscResponse = await request.get(rscPayloadPath);
    expect(rscResponse.ok()).toBe(true);

    const rscPayload = await rscResponse.text();
    expect(rscPayload.length).toBeGreaterThan(0);
  });

  test("generates JavaScript bundles in /assets/", async ({ request }) => {
    const indexResponse = await request.get("/");
    const html = await indexResponse.text();

    const scriptMatch = html.match(/import\("\/assets\/([^"]+\.js)"\)/);
    expect(scriptMatch).not.toBeNull();

    const scriptPath = "/assets/" + scriptMatch![1];
    const scriptResponse = await request.get(scriptPath);
    expect(scriptResponse.ok()).toBe(true);
  });
});
