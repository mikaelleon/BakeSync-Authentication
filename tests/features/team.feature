Feature: Team Management
  As a bakery owner
  I want to manage my team members and their roles
  So that I can control access and collaborate effectively

  Background:
    Given I am logged in as a bakery owner
    And I am on the team page

  Scenario: View team members
    Given I have team members in my system
    When I access the team page
    Then I should see a list of all team members
    And each member should show name, email, role, and status
    And I should see active and inactive members
    And I should see invitation status for pending members

  Scenario: Invite new team member
    Given I am on the team page
    When I click "Invite Team Member"
    Then I should see an invitation form
    When I enter email "newmember@example.com"
    And I select role "Baker"
    And I enter a personal message "Welcome to our team!"
    And I click "Send Invitation"
    Then the invitation should be sent
    And I should see a success message "Invitation sent successfully"
    And the new member should appear in the team list with status "Pending"

  Scenario: Resend invitation
    Given I have a pending invitation for "pending@example.com"
    When I click "Resend Invitation" for this member
    Then a new invitation email should be sent
    And I should see a success message "Invitation resent successfully"

  Scenario: Cancel invitation
    Given I have a pending invitation for "pending@example.com"
    When I click "Cancel Invitation" for this member
    And I confirm the cancellation
    Then the invitation should be cancelled
    And the member should be removed from the team list
    And I should see a success message "Invitation cancelled successfully"

  Scenario: Update team member role
    Given I have an active team member "baker@example.com" with role "Baker"
    When I click "Edit" for this member
    Then I should see an edit form
    When I change the role to "Cashier"
    And I click "Save Changes"
    Then the role should be updated
    And I should see a success message "Role updated successfully"
    And the member should now have "Cashier" role

  Scenario: Deactivate team member
    Given I have an active team member "member@example.com"
    When I click "Deactivate" for this member
    And I confirm the deactivation
    Then the member should be deactivated
    And I should see a success message "Member deactivated successfully"
    And the member should show status "Inactive"
    And the member should lose access to the system

  Scenario: Reactivate team member
    Given I have an inactive team member "member@example.com"
    When I click "Reactivate" for this member
    And I confirm the reactivation
    Then the member should be reactivated
    And I should see a success message "Member reactivated successfully"
    And the member should show status "Active"
    And the member should regain access to the system

  Scenario: View team member details
    Given I have a team member "member@example.com"
    When I click on the member's name
    Then I should see detailed information including:
      - Full name and contact information
      - Role and permissions
      - Join date and last login
      - Activity summary
      - Assigned tasks or responsibilities

  Scenario: Team member permissions
    Given I have team members with different roles
    When I view the team page
    Then I should see each member's role and permissions
    And I should see what features each role can access
    When I edit a member's role
    Then I should see how the permissions will change
    And I should be able to preview the new access level

  Scenario: Team invitation acceptance
    Given I have sent an invitation to "newmember@example.com"
    When the invited user clicks the invitation link
    Then they should see the invitation details
    And they should see the role they're being invited for
    When they click "Accept Invitation"
    Then they should be able to create their account
    And they should be automatically added to the team
    And their status should change to "Active"

  Scenario: Team invitation decline
    Given I have sent an invitation to "newmember@example.com"
    When the invited user clicks the invitation link
    And they click "Decline Invitation"
    Then the invitation should be declined
    And I should see the status change to "Declined"
    And the member should be removed from the team list

  Scenario: Team member search and filtering
    Given I have multiple team members
    When I enter "baker" in the search box
    Then I should see only members with "baker" in their name or email
    When I select role filter "Baker"
    Then I should see only baker role members
    When I select status filter "Active"
    Then I should see only active members
    When I clear the filters
    Then I should see all team members again

  Scenario: Team permissions
    Given I am logged in as a baker
    When I try to access the team page
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as a cashier
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as an owner
    Then I should have full access to team management functions

  Scenario: Team error handling
    Given I am inviting a new team member
    When I enter an invalid email address
    And I click "Send Invitation"
    Then I should see an error "Please enter a valid email address"
    When I try to invite a member who already exists
    Then I should see an error "This email is already associated with a team member"
    When I try to invite a member with an invalid role
    Then I should see an error "Please select a valid role"

  Scenario: Team with demo data
    Given I am logged in with a demo account
    When I access the team page
    Then I should see sample team members
    And I should see a demo indicator
    And I should be able to perform team management actions with demo data
