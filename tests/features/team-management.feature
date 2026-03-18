Feature: Team Member Management
  As a business owner
  I want to manage my team members
  So that I can control access and permissions

  Background:
    Given I am logged in as an owner

  Scenario: View Team Members
    Given I am logged in as an owner
    When I navigate to the team management page
    Then I should see all team members
    And I should see their roles and status
    And I should see their last login time

  Scenario: Update Team Member Role
    Given I am viewing the team members list
    When I click "Edit" for a team member
    And I change their role from "Baker" to "Cashier"
    And I click "Save Changes"
    Then the role should be updated
    And the team member should receive a notification

  Scenario: Remove Team Member
    Given I am viewing the team members list
    When I click "Remove" for a team member
    And I confirm the removal
    Then the team member should be deactivated
    And they should lose access to the system

  Scenario: Search Team Members
    Given I am viewing the team members list
    When I search for "John"
    Then I should see only team members with "John" in their name
    And the search results should be filtered

  Scenario: Filter by Role
    Given I am viewing the team members list
    When I filter by role "Baker"
    Then I should see only team members with the "Baker" role
    And the filter should be applied correctly
