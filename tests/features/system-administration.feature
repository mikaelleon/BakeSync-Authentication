Feature: System Administration
  As a user
  I want to customize my preferences and manage notifications
  So that I can have a personalized experience

  Background:
    Given I am logged in

  Scenario: Update User Preferences
    Given I am logged in
    When I navigate to my profile
    And I click "Preferences"
    And I change theme to "Dark"
    And I set timezone to "America/New_York"
    And I enable email notifications
    And I click "Save"
    Then my preferences should be updated
    And the changes should take effect immediately

  Scenario: Receive Low Stock Notification
    Given I have enabled low stock notifications
    When an inventory item falls below minimum threshold
    Then I should receive a notification
    And I should see it in my notification center

  Scenario: Notification Settings
    Given I am viewing my preferences
    When I navigate to notification settings
    And I disable "Production Reminders"
    And I enable "Team Updates"
    And I click "Save"
    Then my notification preferences should be updated

  Scenario: Change Password
    Given I am in my profile settings
    When I click "Change Password"
    And I enter current password "oldpassword123"
    And I enter new password "newpassword456"
    And I confirm new password "newpassword456"
    And I click "Update Password"
    Then my password should be changed
    And I should see "Password updated successfully"

  Scenario: Update Profile Information
    Given I am in my profile settings
    When I update my name to "John Smith Updated"
    And I update my email to "john.updated@bakeshop.com"
    And I click "Save Changes"
    Then my profile should be updated
    And I should see the new information
