Feature: User Authentication & Registration
  As a new user
  I want to create an account and authenticate
  So that I can access the BakeSync ERP system

  Background:
    Given I am on the BakeSync homepage

  Scenario: Owner Registration
    Given I am on the registration page
    When I select "I'm starting a new business"
    And I enter my email "owner@bakeshop.com"
    And I enter my password "SecurePass123!"
    And I enter my name "John Smith"
    And I click "Create Account"
    Then I should be redirected to the business setup wizard
    And I should see "Welcome! Let's set up your bakeshop"

  Scenario: Team Member Registration via Invitation
    Given I have received an invitation email
    When I click the invitation link
    And I enter my email "baker@bakeshop.com"
    And I enter my password "SecurePass123!"
    And I enter my name "Jane Baker"
    And I click "Accept Invitation"
    Then I should be redirected to role-based onboarding
    And I should see "Welcome to the team!"

  Scenario: Successful Login
    Given I am on the login page
    When I enter valid credentials
    And I click "Sign In"
    Then I should be redirected to the dashboard
    And I should see the dashboard title

  Scenario: Failed Login with Invalid Credentials
    Given I am on the login page
    When I enter invalid credentials
    And I click "Sign In"
    Then I should see "Invalid email or password"
    And I should remain on the login page

  Scenario: Session Timeout
    Given I am logged in
    When I am inactive for 30 minutes
    Then I should be logged out automatically
    And I should see "Session expired. Please log in again."
