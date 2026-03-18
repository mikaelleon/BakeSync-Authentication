Feature: Initial Inventory Setup
  As a business owner
  I want to add my initial inventory
  So that I can start managing my stock

  Background:
    Given I am on the inventory setup step

  Scenario: Add Raw Materials
    Given I am on the inventory setup step
    When I click "Add Material"
    And I enter name "All-purpose flour"
    And I select category "Flour & Grains"
    And I select unit "lbs"
    And I enter current stock "50"
    And I enter min stock "10"
    And I click "Continue"
    Then the material should be saved
    And I should see it in the materials list

  Scenario: Add Products
    Given I am on the inventory setup step
    When I click "Add Product"
    And I enter name "Chocolate Chip Cookies"
    And I select category "Cookies"
    And I enter price "2.50"
    And I enter description "Fresh baked chocolate chip cookies"
    And I click "Continue"
    Then the product should be saved
    And I should see it in the products list

  Scenario: Inventory Category Filter
    Given I have added multiple inventory items
    When I select category "Flour & Grains"
    Then I should see only items in that category
    And the filter should be applied

  Scenario: Required Field Validation for Materials
    Given I am adding a new material
    When I leave the material name empty
    And I click "Continue"
    Then I should see "Material name is required"
    And the form should not be submitted
