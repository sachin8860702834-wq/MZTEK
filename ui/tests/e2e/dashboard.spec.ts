import { expect, test } from "@playwright/test";

test("dashboard home renders live control room sections", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("MZTEK Control Room", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Current Step" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Command Box + Chat" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Integrations Actions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Work Board (Live)" })).toBeVisible();
});

test("tasks page uses live task board wording", async ({ page }) => {
  await page.goto("/tasks");

  await expect(page.getByRole("heading", { name: "Task Board" })).toBeVisible();
  await expect(page.getByText("Live MZTEK work board from backend state, not static placeholders.", { exact: true })).toBeVisible();
});
