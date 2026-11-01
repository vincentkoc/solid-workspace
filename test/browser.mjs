import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "warning" || m.type() === "error") errors.push(m.text());
  });
  await page.goto("http://127.0.0.1:5197");
  await page.getByRole("textbox", { name: "Notes", exact: true }).fill("Retained scratchpad");
  const frame = page.frameLocator("iframe");
  await frame.getByRole("textbox").fill("Retained iframe");
  const boot = await page.locator("iframe").evaluate((e) => e.contentWindow.bootId);
  await page.getByRole("tab", { name: "Counter", exact: true }).click();
  await page.getByRole("button", { name: "Count: 0", exact: true }).click();
  await page.getByRole("button", { name: "Move Counter", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "bottom", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Count: 1", exact: true }).waitFor();
  assert.equal(await page.locator("iframe").evaluate((e) => e.contentWindow.bootId), boot);
  assert.equal(await frame.getByRole("textbox").inputValue(), "Retained iframe");
  await page.getByRole("tab", { name: "Notes", exact: true }).click();
  assert.equal(
    await page.getByRole("textbox", { name: "Notes", exact: true }).inputValue(),
    "Retained scratchpad",
  );
  // Native drag transfers Notes to the live frame group without remounting.
  await page
    .getByRole("tab", { name: "Notes", exact: true })
    .dragTo(page.getByRole("tab", { name: "Live frame", exact: true }));
  await page.getByRole("textbox", { name: "Notes", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("textbox", { name: "Notes", exact: true }).inputValue(),
    "Retained scratchpad",
  );
  const separator = page.getByRole("separator").first();
  await separator.focus();
  const beforeRatio = Number(await separator.getAttribute("aria-valuenow"));
  await page.keyboard.press(
    (await separator.getAttribute("aria-orientation")) === "vertical" ? "ArrowRight" : "ArrowDown",
  );
  await page.waitForFunction(
    (expected) =>
      document.querySelector("[role=separator]").getAttribute("aria-valuenow") === String(expected),
    beforeRatio + 5,
  );
  await page.getByRole("button", { name: "Save layout", exact: true }).click();
  await page.getByRole("button", { name: "Restore layout", exact: true }).click();
  assert.equal(
    await page.getByRole("textbox", { name: "Notes", exact: true }).inputValue(),
    "Retained scratchpad",
  );
  assert.deepEqual(
    await page.evaluate(() => ({
      mounts: window.workspaceTest.mounts,
      disposals: window.workspaceTest.disposals,
    })),
    { mounts: 3, disposals: 0 },
  );
  await page.getByRole("tab", { name: "Live frame", exact: true }).click();
  assert.equal(await page.locator("iframe").evaluate((e) => e.contentWindow.bootId), boot);
  await page.screenshot({ path: "/tmp/solid-workspace-proof.png" });
  await page.getByRole("button", { name: "Close Counter", exact: true }).click();
  assert.equal(await page.evaluate(() => window.workspaceTest.disposals), 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: native drag, keyboard split/resize, textarea/counter/iframe retention, restore, close cleanup; no browser warnings",
  );
} finally {
  await browser.close();
}
