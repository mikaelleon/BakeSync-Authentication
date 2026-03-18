// tests/support/world.ts
import { Page, BrowserContext, Browser } from '@playwright/test';
import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';

export class CustomWorld extends World {
  page!: Page;
  context!: BrowserContext;
  browser!: Browser;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
