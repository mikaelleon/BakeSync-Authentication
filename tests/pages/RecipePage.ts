// tests/pages/RecipePage.ts
import { Page, Locator, expect } from '@playwright/test';

export class RecipePage {
  readonly page: Page;
  readonly recipesHeading: Locator;
  readonly newRecipeButton: Locator;
  readonly searchInput: Locator;
  readonly recipeCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recipesHeading = page.getByRole('heading', { name: /recipes/i });
    this.newRecipeButton = page.locator('a:has-text("New Recipe"), button:has-text("New Recipe")');
    this.searchInput = page.getByPlaceholder(/search recipes/i);
    this.recipeCards = page.locator('.card, [class*="card"]').filter({ hasNotText: /low stock|critical|expiring/i });
  }

  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/recipes`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.recipesHeading).toBeVisible({ timeout: 10000 });
  }

  async expectOnRecipesPage(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/recipes`));
    await expect(this.recipesHeading).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  async clickNewRecipe() {
    await this.newRecipeButton.click();
  }

  async clickFirstRecipe() {
    await this.page.waitForLoadState('networkidle');
    const firstCard = this.recipeCards.first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    await firstCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getRecipeCardCount(): Promise<number> {
    return await this.recipeCards.count();
  }

  async expectRecipeCount(count: number) {
    const actualCount = await this.getRecipeCardCount();
    expect(actualCount).toBe(count);
  }

  async expectNewRecipeButtonVisible() {
    await expect(this.newRecipeButton).toBeVisible();
  }

  async expectNewRecipeButtonNotVisible() {
    await expect(this.newRecipeButton).not.toBeVisible();
  }
}

export class RecipeDetailPage {
  readonly page: Page;
  readonly recipeTitle: Locator;
  readonly ingredientsSection: Locator;
  readonly instructionsSection: Locator;
  readonly recipeInfoSection: Locator;
  readonly editButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recipeTitle = page.getByRole('heading', { level: 1 });
    this.ingredientsSection = page.getByText(/ingredients/i);
    this.instructionsSection = page.getByText(/instructions/i);
    this.recipeInfoSection = page.getByText(/recipe information/i);
    this.editButton = page.getByRole('button', { name: /edit recipe/i });
    this.backButton = page.locator('a:has-text("Back"), button:has-text("Back")');
  }

  async waitForLoad() {
    await expect(this.recipeTitle).toBeVisible({ timeout: 10000 });
  }

  async expectOnDetailPage(recipeId?: string) {
    await expect(this.page).toHaveURL(/.*\/recipes\/[^/]+$/);
    await expect(this.recipeTitle).toBeVisible();
  }

  async clickEdit() {
    await this.editButton.click();
  }

  async expectEditButtonVisible() {
    await expect(this.editButton).toBeVisible();
  }

  async expectEditButtonNotVisible() {
    await expect(this.editButton).not.toBeVisible();
  }

  async expectAllSectionsVisible() {
    await expect(this.ingredientsSection).toBeVisible();
    await expect(this.instructionsSection).toBeVisible();
    await expect(this.recipeInfoSection).toBeVisible();
  }
}

export class NewRecipePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly yieldInput: Locator;
  readonly unitInput: Locator;
  readonly instructionsTextarea: Locator;
  readonly addIngredientButton: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /create new recipe/i });
    this.nameInput = page.getByPlaceholder(/e.g., chocolate chip cookies/i);
    this.yieldInput = page.getByPlaceholder(/^24$/);
    this.unitInput = page.getByPlaceholder(/pieces, kg, etc./i);
    this.instructionsTextarea = page.locator('textarea').first();
    this.addIngredientButton = page.getByRole('button', { name: /add/i });
    this.createButton = page.getByRole('button', { name: /create recipe/i });
  }

  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/recipes/new`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async fillYield(yieldValue: string) {
    await this.yieldInput.fill(yieldValue);
  }

  async fillUnit(unit: string) {
    await this.unitInput.fill(unit);
  }

  async fillInstructions(instructions: string) {
    await this.instructionsTextarea.fill(instructions);
  }

  async clickCreate() {
    await this.createButton.click();
  }

  async expectOnNewRecipePage(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/recipes/new`));
    await expect(this.heading).toBeVisible();
  }
}

export class EditRecipePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly editTab: Locator;
  readonly previewTab: Locator;
  readonly costAnalysisTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /manage recipe/i });
    this.editTab = page.getByRole('tab', { name: /edit recipe/i });
    this.previewTab = page.getByRole('tab', { name: /preview/i });
    this.costAnalysisTab = page.getByRole('tab', { name: /cost analysis/i });
  }

  async goto(recipeId: string, slug: string = 'demo') {
    await this.page.goto(`/${slug}/recipes/${recipeId}/edit`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async expectOnEditPage(recipeId: string, slug: string = 'demo') {
    await expect(this.page).toHaveURL(
      new RegExp(`.*/${slug}/recipes/${recipeId}/edit`)
    );
    await expect(this.heading).toBeVisible();
  }

  async clickPreviewTab() {
    await this.previewTab.click();
  }

  async clickCostAnalysisTab() {
    await this.costAnalysisTab.click();
  }

  async expectAllTabsVisible() {
    await expect(this.editTab).toBeVisible();
    await expect(this.previewTab).toBeVisible();
    await expect(this.costAnalysisTab).toBeVisible();
  }
}

