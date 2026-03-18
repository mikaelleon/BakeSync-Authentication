Feature: Inventory Management
  As a bakery manager
  I want to manage my inventory of raw materials and finished goods
  So that I can track stock levels and prevent shortages

  Background:
    Given I am logged in as a bakery owner
    And I am on the inventory page

  Scenario: View inventory list
    Given I have inventory items in my system
    When I access the inventory page
    Then I should see a list of all inventory items
    And each item should show name, category, current stock, and unit price
    And I should see items sorted by category
    And I should see low stock alerts for items below minimum levels

  Scenario: Add new inventory item
    Given I am on the inventory page
    When I click the "Add Item" button
    Then I should see a form to add a new item
    When I enter item name "Organic Flour"
    And I select category "Raw Materials"
    And I enter current stock "50"
    And I enter unit "kg"
    And I enter unit price "2.50"
    And I enter minimum stock level "10"
    And I click "Save"
    Then the new item should be added to the inventory list
    And I should see a success message "Item added successfully"

  Scenario: Edit existing inventory item
    Given I have an inventory item "Organic Flour"
    When I click the edit button for "Organic Flour"
    Then I should see a form pre-filled with current data
    When I update the current stock to "75"
    And I update the unit price to "2.75"
    And I click "Save"
    Then the item should be updated in the list
    And I should see a success message "Item updated successfully"

  Scenario: Delete inventory item
    Given I have an inventory item "Test Item"
    When I click the delete button for "Test Item"
    And I confirm the deletion
    Then the item should be removed from the inventory list
    And I should see a success message "Item deleted successfully"

  Scenario: Search and filter inventory
    Given I have multiple inventory items
    When I enter "flour" in the search box
    Then I should see only items containing "flour"
    When I select category filter "Raw Materials"
    Then I should see only raw material items
    When I clear the filters
    Then I should see all inventory items again

  Scenario: Low stock alerts
    Given I have items with stock below minimum levels
    When I view the inventory page
    Then I should see low stock alerts highlighted in red
    And I should see a count of low stock items
    When I click on a low stock alert
    Then I should see options to reorder or update stock

  Scenario: Bulk inventory operations
    Given I have multiple inventory items selected
    When I click "Bulk Edit"
    Then I should see options to update multiple items
    When I select "Update Category" and choose "Finished Goods"
    And I click "Apply to Selected"
    Then all selected items should be updated to "Finished Goods" category

  Scenario: Inventory categories
    Given I am on the inventory page
    When I view the category filter
    Then I should see categories: "Raw Materials", "Finished Goods", "Supplies"
    When I select "Raw Materials"
    Then I should see only raw material items
    When I select "Finished Goods"
    Then I should see only finished product items

  Scenario: Stock level updates
    Given I have an inventory item with current stock "50"
    When I click "Update Stock" for this item
    And I enter new stock level "45"
    And I select reason "Production Usage"
    And I click "Update"
    Then the stock level should be updated to "45"
    And I should see a stock movement record

  Scenario: Inventory reports
    Given I am on the inventory page
    When I click "Generate Report"
    Then I should see options for different report types
    When I select "Stock Level Report"
    And I click "Generate"
    Then I should see a report with all current stock levels
    And I should have the option to export the report

  Scenario: Inventory with expiration dates
    Given I have perishable inventory items
    When I view the inventory list
    Then I should see expiration dates for perishable items
    And items near expiration should be highlighted
    When I click on an expiring item
    Then I should see options to use it in production or mark as expired

  Scenario: Inventory permissions
    Given I am logged in as a cashier
    When I access the inventory page
    Then I should see only finished goods inventory
    And I should not see raw materials
    And I should not have access to add/edit/delete functions
    When I am logged in as a baker
    Then I should see raw materials and finished goods
    And I should have read-only access to inventory data

  Scenario: Inventory error handling
    Given I am adding a new inventory item
    When I leave required fields empty
    And I click "Save"
    Then I should see validation errors for required fields
    When I enter invalid data (negative stock, invalid price)
    Then I should see appropriate error messages
    And the item should not be saved
