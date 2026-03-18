Feature: Team Invitation System
  As a business owner
  I want to invite team members
  So that they can help manage the business

  Background:
    Given I am logged in as a business owner

  Scenario: Send Team Invitations
    Given I am on the team setup step
    When I enter email "baker@bakeshop.com"
    And I select role "Baker"
    And I enter message "Welcome to our team!"
    And I click "Send Invitation"
    Then the invitation should be sent
    And I should see "Invitation sent successfully"

  Scenario: Invitation Acceptance
    Given I have received a team invitation
    When I click the invitation link
    And I complete the registration process
    Then I should be added to the team
    And I should be assigned the correct role
    And I should receive a welcome notification

  Scenario: Invalid Email for Invitation
    Given I am on the team setup step
    When I enter email "invalid-email"
    And I select role "Baker"
    And I click "Send Invitation"
    Then I should see "Please enter a valid email address"
    And the invitation should not be sent

  Scenario: Duplicate Invitation
    Given I have already sent an invitation to "baker@bakeshop.com"
    When I try to send another invitation to "baker@bakeshop.com"
    Then I should see "Invitation already sent to this email"
    And the duplicate invitation should not be sent
