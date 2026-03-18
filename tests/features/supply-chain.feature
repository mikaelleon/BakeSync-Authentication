Feature: Supply Chain Management
  As a bakery manager
  I want to manage suppliers and purchase orders
  So that I can maintain inventory levels and track costs

  Background:
    Given I am logged in as a bakery owner
    And I am on the supply chain page

  Scenario: View suppliers list
    Given I have suppliers in my system
    When I access the supply chain page
    Then I should see a list of all suppliers
    And each supplier should show name, contact information, and status
    And I should see supplier performance ratings
    And I should see recent order history

  Scenario: Add new supplier
    Given I am on the supply chain page
    When I click "Add Supplier"
    Then I should see a supplier form
    When I enter supplier name "ABC Flour Company"
    And I enter contact person "John Smith"
    And I enter email "john@abcflour.com"
    And I enter phone "+1-555-0123"
    And I enter address "123 Supplier Street, City, State 12345"
    And I select supplier category "Raw Materials"
    And I click "Save Supplier"
    Then the new supplier should be added
    And I should see a success message "Supplier added successfully"
    And the supplier should appear in the suppliers list

  Scenario: Edit supplier information
    Given I have a supplier "ABC Flour Company"
    When I click "Edit" for this supplier
    Then I should see the supplier form pre-filled with current data
    When I update the contact person to "Jane Doe"
    And I update the phone number to "+1-555-0456"
    And I click "Save Changes"
    Then the supplier information should be updated
    And I should see a success message "Supplier updated successfully"

  Scenario: Create purchase order
    Given I have suppliers and inventory items
    When I click "New Purchase Order"
    Then I should see a purchase order form
    When I select supplier "ABC Flour Company"
    And I add item "Organic Flour" with quantity "100" and unit "kg"
    And I add item "Sugar" with quantity "50" and unit "kg"
    And I enter expected delivery date "Next Monday"
    And I enter notes "Rush order for weekend production"
    And I click "Create Purchase Order"
    Then the purchase order should be created
    And I should see a success message "Purchase order created successfully"
    And the order should appear in the orders list

  Scenario: Track purchase order status
    Given I have a purchase order "PO-001"
    When I view the purchase order details
    Then I should see order status (Pending, Confirmed, Shipped, Delivered)
    And I should see order items and quantities
    And I should see expected delivery date
    When the supplier confirms the order
    And I update the status to "Confirmed"
    Then the status should be updated
    And I should see the confirmation date

  Scenario: Receive purchase order
    Given I have a purchase order "PO-001" with status "Shipped"
    When I click "Receive Order"
    Then I should see a receiving form
    When I enter received quantities for each item
    And I enter actual delivery date
    And I enter any notes about the delivery
    And I click "Complete Receipt"
    Then the purchase order should be marked as "Delivered"
    And the inventory should be updated with received items
    And I should see a success message "Order received successfully"

  Scenario: Supplier performance tracking
    Given I have multiple suppliers with order history
    When I view supplier performance
    Then I should see performance metrics including:
      - On-time delivery rate
      - Quality rating
      - Average delivery time
      - Total orders placed
    When I click on a specific supplier
    Then I should see detailed performance history
    And I should see recommendations for improvement

  Scenario: Purchase order approval workflow
    Given I have a purchase order "PO-001" with status "Pending"
    When I click "Approve Order"
    Then the order should be marked as "Approved"
    And the supplier should be notified
    And I should see a success message "Order approved successfully"
    When I click "Reject Order"
    Then I should see a rejection form
    When I enter rejection reason "Budget constraints"
    And I click "Reject Order"
    Then the order should be marked as "Rejected"
    And the supplier should be notified of the rejection

  Scenario: Purchase order search and filtering
    Given I have multiple purchase orders
    When I enter "PO-001" in the search box
    Then I should see only the matching purchase order
    When I select status filter "Pending"
    Then I should see only pending orders
    When I select supplier filter "ABC Flour Company"
    Then I should see only orders from this supplier
    When I clear the filters
    Then I should see all purchase orders

  Scenario: Supplier categories
    Given I am on the supply chain page
    When I view supplier categories
    Then I should see categories: "Raw Materials", "Packaging", "Equipment", "Services"
    When I select "Raw Materials"
    Then I should see only raw material suppliers
    When I select "Packaging"
    Then I should see only packaging suppliers

  Scenario: Purchase order cost tracking
    Given I have a purchase order with items
    When I view the order details
    Then I should see total cost calculation
    And I should see cost per item
    And I should see any applicable taxes or fees
    When I receive the order
    Then I should see actual cost vs. expected cost
    And I should see cost variance analysis

  Scenario: Supply chain permissions
    Given I am logged in as a baker
    When I try to access the supply chain page
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as a cashier
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as an owner
    Then I should have full access to supply chain functions

  Scenario: Supply chain error handling
    Given I am creating a new supplier
    When I leave required fields empty
    And I click "Save Supplier"
    Then I should see validation errors for required fields
    When I enter invalid data (invalid email, invalid phone)
    Then I should see appropriate error messages
    And the supplier should not be saved
    When I try to create a purchase order with no items
    Then I should see an error "Purchase order must have at least one item"

  Scenario: Supply chain with demo data
    Given I am logged in with a demo account
    When I access the supply chain page
    Then I should see sample suppliers and purchase orders
    And I should see a demo indicator
    And I should be able to perform supply chain actions with demo data
