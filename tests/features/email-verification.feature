Feature: Email Verification
  As a new user
  I want to verify my email address
  So that I can secure my account

  Scenario: Email Verification Process
    Given I have registered with email "user@example.com"
    When I check my email
    Then I should receive a verification email
    And the email should contain a 6-digit verification code

    When I enter the verification code "123456"
    And I click "Verify Email"
    Then my account should be verified
    And I should be redirected to the dashboard

  Scenario: Resend Verification Code
    Given I have not received my verification email
    When I click "Resend Verification Code"
    Then I should see "Verification code sent to your email"
    And I should receive a new verification email

  Scenario: Invalid Verification Code
    Given I am on the email verification page
    When I enter an invalid verification code "000000"
    And I click "Verify Email"
    Then I should see "Invalid verification code"
    And I should remain on the verification page
