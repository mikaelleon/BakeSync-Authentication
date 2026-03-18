Feature: Dashboard Overview
  As a bakery user
  I want to see an overview of my bakery's key metrics and activities
  So that I can quickly understand the current state of my business

  Background:
    Given I am logged in as a bakery owner
    And I am on the dashboard page

  Scenario: View dashboard overview for owner
    Given I am logged in as an owner
    When I access the dashboard
    Then I should see the business name "Sweet Dreams Bakery"
    And I should see today's date
    And I should see key performance metrics
    And I should see recent activity summary
    And I should see quick action buttons for all modules

  Scenario: View dashboard with role-based content
    Given I am logged in as a baker
    When I access the dashboard
    Then I should see baker-specific metrics
    And I should see production-related quick actions
    And I should not see financial analytics
    And I should not see team management options

  Scenario: View dashboard with cashier role
    Given I am logged in as a cashier
    When I access the dashboard
    Then I should see POS-related metrics
    And I should see sales summary
    And I should see quick access to POS system
    And I should not see production planning options

  Scenario: Dashboard metrics display
    Given I am on the dashboard
    When I view the metrics section
    Then I should see today's sales total
    And I should see inventory status (items in stock, low stock alerts)
    And I should see production status (batches in progress, completed)
    And I should see recent orders count

  Scenario: Dashboard navigation
    Given I am on the dashboard
    When I click on the "Inventory" quick action
    Then I should be redirected to the inventory page
    When I click on the "Recipes" quick action
    Then I should be redirected to the recipes page
    When I click on the "POS" quick action
    Then I should be redirected to the POS page

  Scenario: Dashboard real-time updates
    Given I am on the dashboard
    When a new order is placed
    Then the sales metrics should update automatically
    And the recent activity should show the new order
    When inventory is updated
    Then the inventory status should reflect the changes

  Scenario: Dashboard responsive design
    Given I am on the dashboard
    When I view it on a mobile device
    Then the layout should adapt to mobile screen
    And all metrics should be clearly visible
    And quick actions should be easily accessible

  Scenario: Dashboard with no data
    Given I am a new user with no business data
    When I access the dashboard
    Then I should see welcome messages
    And I should see setup prompts for key modules
    And I should see helpful tips to get started

  Scenario: Dashboard error handling
    Given I am on the dashboard
    When there is a network error loading data
    Then I should see an error message
    And I should have the option to retry loading
    And the page should not crash

  Scenario: Dashboard with demo data
    Given I am logged in with a demo account
    When I access the dashboard
    Then I should see sample data for all metrics
    And I should see a demo indicator
    And all functionality should work with demo data

  Scenario: Dashboard performance
    Given I am on the dashboard
    When the page loads
    Then it should load within 3 seconds
    And all metrics should be displayed
    And the interface should be responsive to user interactions