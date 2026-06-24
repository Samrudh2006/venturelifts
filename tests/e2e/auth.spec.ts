import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8000";

test.describe("Authentication Flow", () => {
  test("should show login page", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("text=Login")).toBeVisible();
    await expect(page.locator("text=VENTURELIFT")).toBeVisible();
  });

  test("should login with founder credentials", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('input[name="email"]', "founder@venturelift.local");
    await page.fill('input[name="password"]', "Founder@123");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Founder command center")).toBeVisible({ timeout: 5000 });
  });

  test("should show validation error for empty fields", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Email is required")).toBeVisible();
  });

  test("should toggle between login and register", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button[data-auth="register"]');
    await expect(page.locator("text=Create account")).toBeVisible();
    await page.click('button[data-auth="login"]');
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });
});

test.describe("Venture Management", () => {
  test("should create a new venture", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('input[name="email"]', "founder@venturelift.local");
    await page.fill('input[name="password"]', "Founder@123");
    await page.click('button[type="submit"]');
    await page.click('button[data-view="venture"]');
    await page.fill('input[name="name"]', "Test Venture E2E");
    await page.fill('input[name="founder"]', "Test Founder");
    await page.fill('input[name="sector"]', "Tech");
    await page.selectOption('select[name="stage"]', "MVP");
    await page.fill('textarea[name="problem"]', "Test problem description");
    await page.fill('textarea[name="solution"]', "Test solution");
    await page.fill('textarea[name="customer"]', "Test customers");
    await page.fill('input[name="traction"]', "Testing");
    await page.fill('input[name="goals"]', "Complete E2E test");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Venture saved")).toBeVisible({ timeout: 5000 });
  });
});
