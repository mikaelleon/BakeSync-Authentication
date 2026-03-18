Feature: Point of Sale (POS)
  As a cashier
  I want to process sales transactions
  So that I can sell products to customers

  Background:
    Given I am logged in as a cashier

  Scenario: Process Sale
    Given I am logged in as a cashier
    When I navigate to the POS page
    And I add product "Chocolate Chip Cookies" with quantity "2"
    And I add product "Coffee" with quantity "1"
    And I select payment method "Credit Card"
    And I click "Process Sale"
    Then the sale should be processed
    And inventory should be updated
    And I should see a receipt

  Scenario: Cash Drawer Management
    Given I am starting my shift
    When I open the cash drawer
    And I enter starting amount "100.00"
    And I click "Open Drawer"
    Then the drawer should be opened
    And I should see the starting amount

  Scenario: Add Customer
    Given I am processing a sale
    When I click "Add Customer"
    And I enter name "John Doe"
    And I enter email "john@example.com"
    And I enter phone "555-123-4567"
    And I click "Save Customer"
    Then the customer should be added
    And I should be able to select them for future sales

  Scenario: Calculate Total with Tax
    Given I am on the POS page
    When I add product "Chocolate Chip Cookies" with price "2.50"
    And I add product "Coffee" with price "3.00"
    And I apply tax rate "8.5%"
    Then the subtotal should be "5.50"
    And the tax should be "0.47"
    And the total should be "5.97"

  Scenario: Process Refund
    Given I have a completed sale
    When I click "Process Refund"
    And I select the item to refund
    And I enter refund amount "2.50"
    And I click "Process Refund"
    Then the refund should be processed
    And inventory should be updated
    And I should see a refund receipt
