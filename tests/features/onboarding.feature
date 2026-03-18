Feature: Business Onboarding Flow
  As a new bakery owner
  I want to complete the onboarding process
  So that I can set up my bakery management system

  Background:
    Given I have successfully registered and verified my email
    And I am on the onboarding page

  Scenario: Complete onboarding flow for new bakery
    Given I am a new bakery owner
    When I start the onboarding process
    Then I should see the business details step
    And I should see a progress indicator showing "Step 1 of 7"

    When I enter my business name "Sweet Dreams Bakery"
    And I select business type "Bakery"
    And I enter business description "Artisanal bakery specializing in custom cakes"
    And I click "Next"
    Then I should see the location and contact step
    And the progress should show "Step 2 of 7"

    When I enter my business address "123 Main Street, City, State 12345"
    And I enter my phone number "+1-555-0123"
    And I enter my email "contact@sweetdreams.com"
    And I click "Next"
    Then I should see the operating hours step
    And the progress should show "Step 3 of 7"

    When I set Monday to Friday hours as "6:00 AM - 8:00 PM"
    And I set Saturday hours as "7:00 AM - 9:00 PM"
    And I set Sunday hours as "8:00 AM - 6:00 PM"
    And I click "Next"
    Then I should see the preferences step
    And the progress should show "Step 4 of 7"

    When I select my preferred currency as "USD"
    And I select my timezone as "America/New_York"
    And I enable low stock notifications
    And I click "Next"
    Then I should see the notifications step
    And the progress should show "Step 5 of 7"

    When I enable email notifications for low stock
    And I enable email notifications for new orders
    And I enable SMS notifications for urgent alerts
    And I click "Next"
    Then I should see the team setup step
    And the progress should show "Step 6 of 7"

    When I enter team member email "baker@sweetdreams.com"
    And I assign role "Baker"
    And I click "Next"
    Then I should see the completion step
    And the progress should show "Step 7 of 7"

    When I click "Complete Setup"
    Then I should see a success message "Setup Complete!"
    And I should be redirected to my dashboard
    And my bakeshop should be created with slug "sweet-dreams-bakery"

  Scenario: Onboarding with validation errors
    Given I am on the business details step
    When I leave the business name field empty
    And I click "Next"
    Then I should see an error message "Business name is required"
    And I should remain on the business details step

  Scenario: Onboarding step navigation
    Given I am on step 2 of the onboarding process
    When I click the "Previous" button
    Then I should return to step 1
    And my previously entered data should be preserved

  Scenario: Onboarding progress persistence
    Given I have started the onboarding process
    And I have completed steps 1 and 2
    When I refresh the page
    Then I should return to step 3
    And my previously entered data should be preserved

  Scenario: Onboarding completion for different business types
    Given I am setting up a cafe business
    When I complete the onboarding process
    Then my business type should be saved as "Cafe"
    And I should have cafe-specific features available

  Scenario: Onboarding with team invitations
    Given I am on the team setup step
    When I enter multiple team member emails
    And I assign different roles to each member
    And I complete the onboarding
    Then invitation emails should be sent to all team members
    And the invitations should include the correct role assignments

  Scenario: Onboarding interruption and resume
    Given I have started the onboarding process
    And I have completed 3 steps
    When I close the browser
    And I return later and log in
    Then I should be redirected to step 4 of the onboarding
    And my progress should be preserved

  Scenario: Onboarding with invalid data
    Given I am on the contact information step
    When I enter an invalid phone number "invalid-phone"
    And I enter an invalid email "invalid-email"
    And I click "Next"
    Then I should see validation errors for both fields
    And I should remain on the contact information step

  Scenario: Onboarding completion error handling
    Given I am on the final completion step
    When there is a server error during completion
    And I click "Complete Setup"
    Then I should see an error message "Failed to complete setup. Please try again."
    And I should have the option to retry