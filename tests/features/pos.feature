Feature: Point of Sale (POS) System
  As a cashier
  I want to process customer transactions
  So that I can sell products and track sales

  Background:
    Given I am logged in as a cashier
    And I am on the POS page

  Scenario: Process a simple sale
    Given I am on the POS page
    And I have products available for sale
    When I search for "Chocolate Chip Cookie"
    And I click on "Chocolate Chip Cookie" to add it to cart
    Then I should see the item added to the cart
    And I should see the quantity as "1"
    And I should see the total price updated
    When I click "Checkout"
    Then I should see the payment options
    When I select "Cash" payment method
    And I enter the amount received "5.00"
    And I click "Complete Sale"
    Then the sale should be processed
    And I should see a success message "Sale completed successfully"
    And I should see the receipt
    And the inventory should be updated

  Scenario: Process sale with multiple items
    Given I am on the POS page
    When I add "Chocolate Chip Cookie" to cart
    And I add "Blueberry Muffin" to cart
    And I add "Coffee" to cart
    Then I should see all three items in the cart
    And I should see the total price for all items
    When I click "Checkout"
    And I select "Card" payment method
    And I click "Complete Sale"
    Then the sale should be processed for all items
    And I should see a receipt with all items listed

  Scenario: Modify cart quantities
    Given I have "Chocolate Chip Cookie" in my cart
    When I click the "+" button to increase quantity
    Then the quantity should increase to "2"
    And the total price should be doubled
    When I click the "-" button to decrease quantity
    Then the quantity should decrease to "1"
    And the total price should return to original amount

  Scenario: Remove items from cart
    Given I have "Chocolate Chip Cookie" and "Blueberry Muffin" in my cart
    When I click the "Remove" button for "Blueberry Muffin"
    Then "Blueberry Muffin" should be removed from the cart
    And the total price should be updated
    And only "Chocolate Chip Cookie" should remain in the cart

  Scenario: Apply discounts
    Given I have items in my cart totaling "$10.00"
    When I click "Apply Discount"
    And I enter discount amount "2.00"
    And I select discount type "Fixed Amount"
    Then the total should be reduced to "$8.00"
    And I should see the discount applied in the cart summary

  Scenario: Process sale with different payment methods
    Given I have items in my cart
    When I click "Checkout"
    Then I should see payment options: "Cash", "Card", "GCash"
    When I select "Cash"
    Then I should see a field to enter amount received
    And I should see change calculation
    When I select "Card"
    Then I should see card processing options
    When I select "GCash"
    Then I should see GCash payment options

  Scenario: Handle insufficient payment
    Given I have items totaling "$10.00" in my cart
    When I select "Cash" payment
    And I enter amount received "$8.00"
    Then I should see an error "Insufficient payment"
    And I should not be able to complete the sale
    When I enter amount received "$12.00"
    Then I should see change amount "$2.00"
    And I should be able to complete the sale

  Scenario: Search and filter products
    Given I am on the POS page
    When I enter "cookie" in the search box
    Then I should see only products containing "cookie"
    When I select category filter "Cookies"
    Then I should see only cookie products
    When I clear the search
    Then I should see all available products

  Scenario: Handle out of stock products
    Given I have a product "Chocolate Chip Cookie" that is out of stock
    When I search for "Chocolate Chip Cookie"
    Then I should see the product marked as "Out of Stock"
    And I should not be able to add it to the cart
    When I try to add it to the cart
    Then I should see an error message "Product is out of stock"

  Scenario: Generate receipt
    Given I have completed a sale
    When I click "Print Receipt"
    Then a receipt should be generated
    And I should see the receipt with:
      - Business name and address
      - Date and time of sale
      - List of items purchased
      - Subtotal, tax, and total
      - Payment method used
      - Transaction ID

  Scenario: View sales history
    Given I have completed several sales
    When I click "Sales History"
    Then I should see a list of recent transactions
    And I should see transaction details including:
      - Date and time
      - Items sold
      - Total amount
      - Payment method
    When I click on a specific transaction
    Then I should see the full receipt details

  Scenario: POS permissions
    Given I am logged in as a baker
    When I try to access the POS page
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as a cashier
    Then I should have full access to the POS system
    And I should be able to process sales

  Scenario: POS error handling
    Given I am processing a sale
    When there is a network error
    Then I should see an error message
    And I should have the option to retry
    And the cart should be preserved
    When I try to complete a sale with no items
    Then I should see an error "Cart is empty"
    And I should not be able to proceed to checkout

  Scenario: POS with demo data
    Given I am logged in with a demo account
    When I access the POS page
    Then I should see demo products available
    And I should be able to process demo sales
    And all functionality should work with demo data
