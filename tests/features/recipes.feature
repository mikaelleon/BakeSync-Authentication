Feature: Recipe Management
  As a bakery manager or baker
  I want to create, edit, and manage recipes
  So that I can standardize production and calculate costs

  Background:
    Given I am logged in as a bakery owner
    And I am on the recipes page

  Scenario: View recipes list
    Given I have recipes in my system
    When I access the recipes page
    Then I should see a list of all recipes
    And each recipe should show name, category, yield, and cost per unit
    And I should see recipes sorted by category
    And I should see a search and filter functionality

  Scenario: Create new recipe
    Given I am on the recipes page
    When I click the "New Recipe" button
    Then I should see a recipe creation form
    When I enter recipe name "Chocolate Chip Cookies"
    And I select category "Cookies"
    And I enter description "Classic chocolate chip cookies"
    And I enter yield "24 pieces"
    And I enter preparation time "30 minutes"
    And I enter cooking time "12 minutes"
    And I click "Add Ingredients"
    Then I should see an ingredient form
    When I add ingredient "Flour" with quantity "2" and unit "cups"
    And I add ingredient "Sugar" with quantity "1" and unit "cup"
    And I add ingredient "Chocolate Chips" with quantity "1" and unit "cup"
    And I click "Save Recipe"
    Then the new recipe should be created
    And I should see a success message "Recipe created successfully"
    And the recipe should appear in the recipes list

  Scenario: Edit existing recipe
    Given I have a recipe "Chocolate Chip Cookies"
    When I click on the recipe name
    Then I should see the recipe detail page
    When I click the "Edit" button
    Then I should see the recipe edit form pre-filled with current data
    When I update the yield to "30 pieces"
    And I add a new ingredient "Vanilla Extract" with quantity "1" and unit "tsp"
    And I click "Save Changes"
    Then the recipe should be updated
    And I should see a success message "Recipe updated successfully"

  Scenario: Delete recipe
    Given I have a recipe "Test Recipe"
    When I click the delete button for "Test Recipe"
    And I confirm the deletion
    Then the recipe should be removed from the recipes list
    And I should see a success message "Recipe deleted successfully"

  Scenario: Recipe search and filtering
    Given I have multiple recipes in different categories
    When I enter "chocolate" in the search box
    Then I should see only recipes containing "chocolate"
    When I select category filter "Cookies"
    Then I should see only cookie recipes
    When I clear the filters
    Then I should see all recipes again

  Scenario: Recipe cost calculation
    Given I have a recipe with ingredients
    And I have inventory items with current prices
    When I view the recipe detail page
    Then I should see the total cost per recipe
    And I should see the cost per unit (per piece)
    And I should see a breakdown of ingredient costs
    When ingredient prices change in inventory
    Then the recipe cost should be recalculated automatically

  Scenario: Recipe categories
    Given I am on the recipes page
    When I view the category filter
    Then I should see categories: "Bread", "Cookies", "Cakes", "Pastries", "Other"
    When I select "Bread"
    Then I should see only bread recipes
    When I select "Cakes"
    Then I should see only cake recipes

  Scenario: Recipe instructions
    Given I have a recipe "Chocolate Cake"
    When I view the recipe detail page
    Then I should see step-by-step instructions
    And I should see preparation and cooking times
    And I should see serving size and yield information
    When I edit the recipe
    Then I should be able to update the instructions
    And I should be able to reorder the steps

  Scenario: Recipe scaling
    Given I have a recipe that yields "24 cookies"
    When I view the recipe detail page
    And I enter desired yield "48 cookies"
    And I click "Scale Recipe"
    Then all ingredient quantities should be doubled
    And the total cost should be recalculated
    And I should see the scaled recipe clearly marked

  Scenario: Recipe with unavailable ingredients
    Given I have a recipe with ingredients
    And some ingredients are out of stock
    When I view the recipe detail page
    Then I should see warnings for out-of-stock ingredients
    And I should see which ingredients need to be restocked
    When I click on an out-of-stock ingredient
    Then I should see options to add it to inventory or find alternatives

  Scenario: Recipe permissions
    Given I am logged in as a cashier
    When I access the recipes page
    Then I should see recipes in read-only mode
    And I should not have access to create/edit/delete functions
    When I am logged in as a baker
    Then I should have full access to all recipe functions
    And I should be able to create and edit recipes

  Scenario: Recipe export and sharing
    Given I have a recipe "Chocolate Chip Cookies"
    When I view the recipe detail page
    And I click "Export Recipe"
    Then I should see options to export as PDF or text
    When I select "Export as PDF"
    Then a PDF should be generated with the complete recipe
    And I should be able to download or print the PDF

  Scenario: Recipe error handling
    Given I am creating a new recipe
    When I leave required fields empty
    And I click "Save Recipe"
    Then I should see validation errors for required fields
    When I enter invalid data (negative quantities, invalid units)
    Then I should see appropriate error messages
    And the recipe should not be saved
    When I try to save a recipe with no ingredients
    Then I should see an error "Recipe must have at least one ingredient"
