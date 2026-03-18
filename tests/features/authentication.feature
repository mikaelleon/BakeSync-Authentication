Feature: User Authentication
  As a bakery owner, baker, or cashier
  I want to securely authenticate into the system
  So that I can access my role-specific features

  Background:
    Given the BakeSync application is running
    And I am on the login page

  Scenario: Successful login with valid credentials
    Given I have a valid user account with email "owner@bakesync.com" and password "owner123"
    When I enter my email "owner@bakesync.com"
    And I enter my password "owner123"
    And I click the "Sign In" button
    Then I should be redirected to the dashboard
    And I should see my user role displayed as "Owner"
    And I should have access to all system features

  Scenario: Login with invalid credentials
    Given I have an invalid user account
    When I enter my email "invalid@example.com"
    And I enter my password "wrongpassword"
    And I click the "Sign In" button
    Then I should see an error message "Invalid login credentials"
    And I should remain on the login page

  Scenario: Login with empty credentials
    When I click the "Sign In" button without entering credentials
    Then I should see validation errors for required fields
    And I should remain on the login page

  Scenario: Successful logout
    Given I am logged in as an owner
    When I click the logout button
    Then I should be redirected to the login page
    And my session should be cleared

  Scenario: Access protected route without authentication
    Given I am not logged in
    When I try to access "/demo/dashboard"
    Then I should be redirected to the login page
    And I should see a message to log in first

  Scenario: Role-based access control
    Given I am logged in as a baker
    When I try to access the financials page
    Then I should see an access denied message
    And I should be redirected to an allowed page

  Scenario: Session persistence
    Given I am logged in as an owner
    When I refresh the page
    Then I should remain logged in
    And I should see the dashboard without re-authentication

  Scenario: Multiple role login
    Given I have accounts for different roles
    When I log in as a cashier
    Then I should see cashier-specific features
    When I log out and log in as a baker
    Then I should see baker-specific features
    And the interface should update based on my role