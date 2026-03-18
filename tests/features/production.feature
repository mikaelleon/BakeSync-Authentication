Feature: Production Planning
  As a baker or production manager
  I want to plan and track production batches
  So that I can efficiently produce goods and manage resources

  Background:
    Given I am logged in as a baker
    And I am on the production page

  Scenario: View production schedule
    Given I have production batches scheduled
    When I access the production page
    Then I should see a production schedule
    And I should see batches organized by date
    And I should see batch status (scheduled, in progress, completed)
    And I should see batch details (recipe, quantity, assigned baker)

  Scenario: Create new production batch
    Given I am on the production page
    When I click "New Batch"
    Then I should see a batch creation form
    When I select recipe "Chocolate Chip Cookies"
    And I enter batch quantity "100"
    And I select scheduled date "Tomorrow"
    And I select scheduled time "8:00 AM"
    And I assign baker "John Doe"
    And I click "Create Batch"
    Then the new batch should be created
    And I should see a success message "Batch created successfully"
    And the batch should appear in the production schedule

  Scenario: Start production batch
    Given I have a scheduled batch "Chocolate Chip Cookies - 100 pieces"
    When I click "Start Batch" for this batch
    Then the batch status should change to "In Progress"
    And I should see the start time recorded
    And I should see a production tracking interface
    And the inventory should be reserved for this batch

  Scenario: Track production progress
    Given I have a batch "In Progress"
    When I view the batch details
    Then I should see production steps
    And I should see progress indicators for each step
    When I complete a production step
    And I click "Mark Step Complete"
    Then the step should be marked as completed
    And the progress should be updated

  Scenario: Complete production batch
    Given I have a batch "In Progress"
    When I click "Complete Batch"
    Then I should see a completion form
    When I enter actual quantity produced "95"
    And I enter any notes "5 cookies were damaged during baking"
    And I click "Complete Batch"
    Then the batch status should change to "Completed"
    And the inventory should be updated with finished goods
    And I should see a success message "Batch completed successfully"

  Scenario: Production with recipe scaling
    Given I have a recipe that yields "24 cookies"
    When I create a batch for "100 cookies"
    Then the system should automatically scale the recipe
    And I should see scaled ingredient quantities
    And the cost should be calculated based on scaled quantities

  Scenario: Production inventory consumption
    Given I have a batch "In Progress"
    When I start the batch
    Then the required ingredients should be reserved
    And I should see inventory levels updated
    When I complete the batch
    Then the reserved ingredients should be consumed
    And the finished goods should be added to inventory

  Scenario: Production scheduling conflicts
    Given I have a batch scheduled for "8:00 AM"
    When I try to schedule another batch for "8:00 AM" with the same baker
    Then I should see a warning "Baker is already scheduled at this time"
    And I should be prompted to choose a different time or baker
    When I select a different time "9:00 AM"
    Then the batch should be scheduled successfully

  Scenario: Production with insufficient inventory
    Given I have a recipe requiring "5kg flour"
    And I only have "3kg flour" in inventory
    When I try to create a batch for this recipe
    Then I should see a warning "Insufficient inventory for this batch"
    And I should see which ingredients are short
    And I should have options to reduce batch quantity or order more ingredients

  Scenario: Production quality control
    Given I have a completed batch
    When I view the batch details
    Then I should see quality control options
    When I click "Quality Check"
    And I enter quality notes "All items meet quality standards"
    And I rate the batch quality as "Excellent"
    And I click "Approve Batch"
    Then the batch should be marked as quality approved
    And the finished goods should be available for sale

  Scenario: Production reports
    Given I have completed several batches
    When I click "Production Reports"
    Then I should see options for different report types
    When I select "Daily Production Report"
    And I select today's date
    And I click "Generate Report"
    Then I should see a report with:
      - Total batches completed
      - Total quantity produced
      - Production efficiency metrics
      - Resource utilization

  Scenario: Production permissions
    Given I am logged in as a cashier
    When I try to access the production page
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as a baker
    Then I should have access to production functions
    And I should be able to create and manage batches

  Scenario: Production error handling
    Given I am creating a new batch
    When I leave required fields empty
    And I click "Create Batch"
    Then I should see validation errors for required fields
    When I enter invalid data (negative quantities, past dates)
    Then I should see appropriate error messages
    And the batch should not be created
    When I try to start a batch with insufficient inventory
    Then I should see an error "Cannot start batch - insufficient inventory"
