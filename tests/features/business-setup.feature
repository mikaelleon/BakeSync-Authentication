Feature: Business Setup & Onboarding
  As a business owner
  I want to set up my bakeshop details
  So that I can configure my business properly

  Background:
    Given I am logged in as a new business owner

  Scenario: Complete Business Setup
    Given I am a new business owner
    When I start the business setup wizard
    And I enter business name "Sweet Dreams Bakery"
    And I select business type "Bakery"
    And I enter address "123 Main St, City, State 12345"
    And I enter phone "555-123-4567"
    And I enter email "info@sweetdreams.com"
    And I click "Continue"
    Then I should proceed to the inventory setup step

  Scenario: Business Slug Generation
    Given I enter business name "Sweet Dreams Bakery"
    When I click "Continue"
    Then the system should generate slug "sweet-dreams-bakery"
    And the slug should be unique

  Scenario: Required Field Validation
    Given I am on the business setup page
    When I leave the business name empty
    And I click "Continue"
    Then I should see "Business name is required"
    And the form should not be submitted

  Scenario: Invalid Email Format
    Given I am on the business setup page
    When I enter business name "Test Bakery"
    And I enter email "invalid-email"
    And I click "Continue"
    Then I should see "Please enter a valid email address"
    And the form should not be submitted
