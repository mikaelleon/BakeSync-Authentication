Feature: Recipe Management
  As a baker
  I want to create and manage recipes
  So that I can standardize my baking process

  Background:
    Given I am logged in as a baker

  Scenario: Create New Recipe
    Given I am logged in as a baker
    When I navigate to the recipes page
    And I click "Create New Recipe"
    And I enter recipe name "Chocolate Chip Cookies"
    And I add ingredient "All-purpose flour" with quantity "2 cups"
    And I add ingredient "Chocolate chips" with quantity "1 cup"
    And I enter instructions "Mix ingredients and bake at 350°F for 12 minutes"
    And I click "Save Recipe"
    Then the recipe should be created
    And I should see it in the recipes list

  Scenario: Recipe Scaling
    Given I am viewing a recipe
    When I enter scaling factor "2"
    And I click "Scale Recipe"
    Then all ingredient quantities should be doubled
    And the instructions should remain the same

  Scenario: Categorize Recipe
    Given I am creating a new recipe
    When I select category "Cookies"
    And I save the recipe
    Then the recipe should be categorized as "Cookies"
    And it should appear in the Cookies category filter

  Scenario: Edit Existing Recipe
    Given I am viewing a recipe
    When I click "Edit Recipe"
    And I change the recipe name to "Updated Chocolate Chip Cookies"
    And I click "Save Changes"
    Then the recipe should be updated
    And I should see the new name

  Scenario: Delete Recipe
    Given I am viewing a recipe
    When I click "Delete Recipe"
    And I confirm the deletion
    Then the recipe should be removed
    And it should not appear in the recipes list

  Scenario: Required Field Validation for Recipe
    Given I am creating a new recipe
    When I leave the recipe name empty
    And I click "Save Recipe"
    Then I should see "Recipe name is required"
    And the form should not be submitted
