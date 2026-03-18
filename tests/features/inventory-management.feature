Feature: Inventory Management
  As a baker or owner
  I want to track my inventory levels
  So that I can manage stock effectively

  Background:
    Given I am logged in as a baker

  Scenario: View Inventory
    Given I am logged in as a baker
    When I navigate to the inventory page
    Then I should see all inventory items
    And I should see current stock levels
    And I should see minimum stock thresholds

  Scenario: Update Inventory Levels
    Given I am viewing the inventory
    When I click "Update Stock" for an item
    And I enter new quantity "25"
    And I click "Save"
    Then the stock level should be updated
    And I should see the new quantity

  Scenario: Low Stock Alert
    Given I have an item with stock below minimum threshold
    When I view the inventory
    Then I should see a low stock warning
    And I should receive a notification

  Scenario: Filter by Category
    Given I am viewing the inventory
    When I select category "Flour & Grains"
    Then I should see only items in that category
    And the filter should be applied

  Scenario: Search Inventory Items
    Given I am viewing the inventory
    When I search for "flour"
    Then I should see only items containing "flour"
    And the search results should be relevant

  Scenario: Add New Inventory Item
    Given I am viewing the inventory
    When I click "Add New Item"
    And I enter item name "Vanilla Extract"
    And I select category "Flavorings"
    And I enter quantity "5"
    And I enter unit "bottles"
    And I click "Save"
    Then the item should be added to inventory
    And I should see it in the inventory list
