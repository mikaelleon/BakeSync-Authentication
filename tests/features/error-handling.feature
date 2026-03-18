Feature: Error Handling & Edge Cases
  As a user
  I want to see helpful error messages
  So that I can resolve issues quickly

  Background:
    Given I am using the BakeSync application

  Scenario: Invalid Login
    Given I am on the login page
    When I enter invalid credentials
    And I click "Sign In"
    Then I should see "Invalid email or password"
    And I should remain on the login page

  Scenario: Network Error
    Given I am using the application
    When the network connection is lost
    And I try to save data
    Then I should see "Connection lost. Retrying..."
    And the data should be saved when connection is restored

  Scenario: Required Field Validation
    Given I am creating a new recipe
    When I leave the recipe name empty
    And I click "Save"
    Then I should see "Recipe name is required"
    And the form should not be submitted

  Scenario: Invalid Data Format
    Given I am adding inventory
    When I enter quantity "abc"
    And I click "Save"
    Then I should see "Please enter a valid number"
    And the form should not be submitted

  Scenario: Server Error Handling
    Given I am using the application
    When a server error occurs
    Then I should see "Something went wrong. Please try again."
    And I should be able to retry the action

  Scenario: Page Not Found
    Given I am using the application
    When I navigate to a non-existent page
    Then I should see "Page not found"
    And I should see a link to return to the dashboard
