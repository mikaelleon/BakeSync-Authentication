// tests/support/hooks.ts
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser, BrowserContext } from '@playwright/test';
import { CustomWorld } from './world';

let browser: Browser;

BeforeAll(async function () {
  browser = await chromium.launch({
    headless: process.env.CI === 'true',
    slowMo: 50,
  });
});

Before(async function (this: CustomWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: CustomWorld) {
  await this.page?.close();
  await this.context?.close();
});

AfterAll(async function () {
  await browser?.close();
});
