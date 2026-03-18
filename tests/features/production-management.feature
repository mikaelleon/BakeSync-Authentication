Feature: Production Management
  As a baker
  I want to log production activities
  So that I can track what I've made

  Background:
    Given I am logged in as a baker

  Scenario: Log Production
    Given I am logged in as a baker
    When I navigate to the production page
    And I click "Log Production"
    And I select recipe "Chocolate Chip Cookies"
    And I enter quantity produced "24"
    And I enter date "2024-01-15"
    And I click "Save"
    Then the production should be logged
    And inventory should be updated

  Scenario: Production History
    Given I have logged production activities
    When I view the production history
    Then I should see all past production logs
    And I should be able to filter by date range
    And I should see total quantities produced

  Scenario: Production with Multiple Recipes
    Given I am on the production page
    When I log production for "Chocolate Chip Cookies" with quantity "12"
    And I log production for "Sugar Cookies" with quantity "18"
    Then both productions should be recorded
    And the total production count should be "30"

  Scenario: Production Report Generation
    Given I have logged multiple production activities
    When I select date range "Last 7 days"
    And I click "Generate Report"
    Then I should see a production report
    And I should be able to export it as PDF

  Scenario: Production Validation
    Given I am logging production
    When I enter quantity "0"
    And I click "Save"
    Then I should see "Quantity must be greater than 0"
    And the production should not be saved
