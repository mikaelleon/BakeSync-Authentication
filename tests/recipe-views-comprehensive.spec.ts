// tests/recipe-views-comprehensive.spec.ts
import { test, expect } from './fixtures/auth-fixtures';
import {
  RecipePage,
  RecipeDetailPage,
  NewRecipePage,
  EditRecipePage,
} from './pages/RecipePage';
import { TestUsers } from './fixtures/test-data';

test.describe('Recipe Views Comprehensive Testing', () => {
  test.describe('👑 Owner Recipe Access', () => {
    test.beforeEach(async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await expect(page).toHaveURL(/.*demo\/dashboard/);
    });

    test('owner can view recipes list', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');

      await expect(recipePage.recipesHeading).toBeVisible();
      await expect(recipePage.newRecipeButton).toBeVisible();
      await expect(recipePage.searchInput).toBeVisible();

      const cardCount = await recipePage.getRecipeCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('owner can create new recipe', async ({ page }) => {
      const newRecipePage = new NewRecipePage(page);
      await newRecipePage.goto('demo');

      await expect(newRecipePage.heading).toBeVisible();
      await expect(newRecipePage.nameInput).toBeVisible();
      await expect(newRecipePage.yieldInput).toBeVisible();
      await expect(newRecipePage.unitInput).toBeVisible();
      await expect(newRecipePage.instructionsTextarea).toBeVisible();
      await expect(newRecipePage.addIngredientButton).toBeVisible();

      await newRecipePage.fillName('Test Recipe');
      await newRecipePage.fillYield('12');
      await newRecipePage.fillUnit('pieces');
      await newRecipePage.fillInstructions('1. Mix ingredients\n2. Bake at 180°C');

      await newRecipePage.clickCreate();

      await expect(page).toHaveURL(/.*demo\/recipes/, { timeout: 10000 });
      const recipePage = new RecipePage(page);
      await expect(recipePage.recipesHeading).toBeVisible();
    });

    test('owner can view recipe details', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');
      await recipePage.clickFirstRecipe();

      const detailPage = new RecipeDetailPage(page);
      await detailPage.waitForLoad();
      await detailPage.expectOnDetailPage();
      await detailPage.expectAllSectionsVisible();
      await detailPage.expectEditButtonVisible();
    });

    test('owner can edit recipe', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');
      await recipePage.clickFirstRecipe();

      const detailPage = new RecipeDetailPage(page);
      await detailPage.waitForLoad();
      await detailPage.clickEdit();

      const editPage = new EditRecipePage(page);
      await editPage.waitForLoad();
      await editPage.expectAllTabsVisible();
    });

    test('owner can delete recipe', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');

      const deleteButton = page
        .getByRole('button', { name: /delete/i })
        .or(page.locator('button[title*="delete" i]'))
        .first();

      if ((await deleteButton.count()) > 0) {
        await deleteButton.click();

        await expect(
          page.getByText(/delete recipe/i).or(page.getByText(/are you sure/i))
        ).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('👨‍🍳 Baker Recipe Access', () => {
    test.beforeEach(async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await expect(page).toHaveURL(/.*demo\/dashboard/);
    });

    test('baker can view recipes list (view-only)', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');

      await expect(recipePage.recipesHeading).toBeVisible();
      await recipePage.expectNewRecipeButtonNotVisible();
      await expect(recipePage.searchInput).toBeVisible();

      const cardCount = await recipePage.getRecipeCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('baker can view recipe details (view-only)', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');
      await recipePage.clickFirstRecipe();

      const detailPage = new RecipeDetailPage(page);
      await detailPage.waitForLoad();
      await detailPage.expectOnDetailPage();
      await detailPage.expectAllSectionsVisible();
      await detailPage.expectEditButtonNotVisible();
    });

    test('baker cannot access new recipe page', async ({ page }) => {
      await page.goto('/demo/recipes/new');
      await page.waitForLoadState('networkidle');

      const accessDenied = await page
        .getByText(/access denied|unauthorized/i)
        .isVisible()
        .catch(() => false);
      const isRedirected = !page.url().includes('/recipes/new');

      expect(accessDenied || isRedirected).toBe(true);
    });

    test('baker cannot access edit recipe page', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');
      await recipePage.clickFirstRecipe();

      const currentUrl = page.url();
      const recipeId = currentUrl.split('/').pop();
      await page.goto(`/demo/recipes/${recipeId}/edit`);
      await page.waitForLoadState('networkidle');

      const accessDenied = await page
        .getByText(/access denied|unauthorized/i)
        .isVisible()
        .catch(() => false);
      const isRedirected = !page.url().includes('/edit');

      expect(accessDenied || isRedirected).toBe(true);
    });
  });

  test.describe('💳 Cashier Recipe Access', () => {
    test.beforeEach(async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.cashier.email,
        TestUsers.cashier.password
      );
      await expect(page).toHaveURL(/.*demo\/dashboard/);
    });

    test('cashier cannot access recipes', async ({ page }) => {
      await page.goto('/demo/recipes');
      await page.waitForLoadState('networkidle');

      const accessDenied = await page
        .getByText(/access denied|unauthorized/i)
        .isVisible()
        .catch(() => false);
      const isRedirected = !page.url().includes('/recipes');

      expect(accessDenied || isRedirected).toBe(true);
    });

    test('cashier cannot access new recipe page', async ({ page }) => {
      await page.goto('/demo/recipes/new');
      await page.waitForLoadState('networkidle');

      const accessDenied = await page
        .getByText(/access denied|unauthorized/i)
        .isVisible()
        .catch(() => false);
      const isRedirected = !page.url().includes('/recipes/new');

      expect(accessDenied || isRedirected).toBe(true);
    });
  });

  test.describe('Recipe Functionality Tests', () => {
    test.beforeEach(async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await expect(page).toHaveURL(/.*demo\/dashboard/);
    });

    test('recipe search functionality works', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');

      const initialCount = await recipePage.getRecipeCardCount();
      await recipePage.search('chocolate');

      await page.waitForLoadState('networkidle');
      const filteredCount = await recipePage.getRecipeCardCount();

      expect(filteredCount).toBeGreaterThan(0);
    });

    test('recipe detail page shows all information', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');
      await recipePage.clickFirstRecipe();

      const detailPage = new RecipeDetailPage(page);
      await detailPage.waitForLoad();
      await detailPage.expectAllSectionsVisible();

      await expect(
        page.getByText(/total produced|success rate|last made/i)
      ).toBeVisible();
    });

    test('recipe edit page has all tabs', async ({ page }) => {
      const recipePage = new RecipePage(page);
      await recipePage.goto('demo');
      await recipePage.clickFirstRecipe();

      const detailPage = new RecipeDetailPage(page);
      await detailPage.waitForLoad();
      await detailPage.clickEdit();

      const editPage = new EditRecipePage(page);
      await editPage.waitForLoad();
      await editPage.expectAllTabsVisible();

      await editPage.clickPreviewTab();
      await expect(page.getByText(/ingredients/i)).toBeVisible();

      await editPage.clickCostAnalysisTab();
      await expect(page.getByText(/cost analysis/i)).toBeVisible();
    });
  });
});
