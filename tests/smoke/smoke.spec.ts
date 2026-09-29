import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const runId = randomUUID().slice(0, 8);
const password = "SmokeTest!passw0rd";
const userEmail = `pw-${runId}@test.invalid`;

test.beforeAll(async () => {
  await prisma.user.create({
    data: {
      email: userEmail,
      password: await bcrypt.hash(password, 10),
      accountType: "INDIVIDUAL",
      firstName: "Smoke",
      lastName: "Tester",
      gdprConsent: true,
    },
  });
  await prisma.location.upsert({
    where: { slug: "burton-latimer" },
    update: {},
    create: { slug: "burton-latimer", name: "Burton Latimer", type: "TOWN" },
  });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: `pw-${runId}` } } });
  await prisma.$disconnect();
});

test("public pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/burton-latimer/);
  await expect(page.getByRole("heading", { name: "Burton Latimer" })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /log ?in|sign in/i }).first()).toBeVisible();
  await page.goto("/register");
  await expect(page.locator("form")).toBeVisible();
});

test("protected pages redirect to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/messages");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/groups");
  await expect(page).toHaveURL(/\/login/);
});

test("community landing page renders", async ({ page }) => {
  await page.goto("/burton-latimer");
  await expect(page.getByRole("heading", { name: "Burton Latimer" })).toBeVisible();
  await expect(page.locator('a[href="/burton-latimer/businesses"]').first()).toBeVisible();
});

test("unknown community returns 404", async ({ page }) => {
  const response = await page.goto("/nowhere-ville");
  expect(response?.status()).toBe(404);
});

test("login takes the member to the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(userEmail);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /log ?in|sign in/i }).first().click();
  await page.waitForURL(/dashboard/, { timeout: 15_000 });
});
