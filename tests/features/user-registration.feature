Feature: User Registration and Email Verification
  As a new user
  I want to register for a BakeSync account
  So that I can access the bakery management system

  Background:
    Given the BakeSync application is running
    And I am on the signup page

  Scenario: Successful user registration
    Given I am a new user wanting to register
    When I enter my full name "John Doe"
    And I enter my email "john.doe@example.com"
    And I enter my password "SecurePass123!"
    And I select my role as "Owner"
    And I enter my business name "John's Bakery"
    And I click the "Sign Up" button
    Then I should see a success message "Account created successfully"
    And I should be redirected to the email verification page
    And an email verification should be sent to "john.doe@example.com"

  Scenario: Registration with invalid email format
    When I enter my full name "Jane Smith"
    And I enter my email "invalid-email"
    And I enter my password "SecurePass123!"
    And I select my role as "Baker"
    And I enter my business name "Jane's Bakery"
    And I click the "Sign Up" button
    Then I should see an error message "Please enter a valid email address"
    And I should remain on the signup page

  Scenario: Registration with weak password
    When I enter my full name "Bob Wilson"
    And I enter my email "bob@example.com"
    And I enter my password "123"
    And I select my role as "Cashier"
    And I enter my business name "Bob's Bakery"
    And I click the "Sign Up" button
    Then I should see an error message "Password must be at least 8 characters"
    And I should remain on the signup page

  Scenario: Registration with existing email
    Given a user with email "existing@example.com" already exists
    When I enter my full name "New User"
    And I enter my email "existing@example.com"
    And I enter my password "SecurePass123!"
    And I select my role as "Owner"
    And I enter my business name "New Bakery"
    And I click the "Sign Up" button
    Then I should see an error message "An account with this email already exists"
    And I should remain on the signup page

  Scenario: Registration with missing required fields
    When I click the "Sign Up" button without filling required fields
    Then I should see validation errors for all required fields
    And I should remain on the signup page

  Scenario: Email verification process
    Given I have registered with email "verify@example.com"
    And I am on the email verification page
    When I enter the verification code from my email
    And I click the "Verify Email" button
    Then I should see a success message "Email verified successfully"
    And I should be redirected to the onboarding flow

  Scenario: Email verification with invalid code
    Given I have registered with email "verify@example.com"
    And I am on the email verification page
    When I enter an invalid verification code "123456"
    And I click the "Verify Email" button
    Then I should see an error message "Invalid verification code"
    And I should remain on the email verification page

  Scenario: Resend verification email
    Given I have registered with email "resend@example.com"
    And I am on the email verification page
    When I click the "Resend Code" button
    Then I should see a message "Verification code sent to your email"
    And a new verification email should be sent

  Scenario: Registration with different business types
    When I enter my full name "Test User"
    And I enter my email "test@example.com"
    And I enter my password "SecurePass123!"
    And I select my role as "Owner"
    And I enter my business name "Test Bakery"
    And I select business type "Cafe"
    And I click the "Sign Up" button
    Then I should see a success message "Account created successfully"
    And my business type should be saved as "Cafe"
