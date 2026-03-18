Feature: Reporting & Analytics
  As a business owner
  I want to view business analytics
  So that I can make informed decisions

  Background:
    Given I am logged in as an owner

  Scenario: View Analytics Dashboard
    Given I am logged in as an owner
    When I navigate to the analytics page
    Then I should see sales trends
    And I should see inventory turnover
    And I should see top-selling products
    And I should see team performance metrics

  Scenario: Custom Report Generation
    Given I am viewing the analytics page
    When I select report type "Sales Summary"
    And I select date range "Last quarter"
    And I click "Generate Report"
    Then I should see a comprehensive sales report
    And I should be able to export it

  Scenario: Inventory Analytics
    Given I am on the analytics page
    When I click "Inventory Analytics"
    Then I should see inventory turnover rates
    And I should see low-stock alerts
    And I should see consumption patterns

  Scenario: Team Performance Report
    Given I am on the analytics page
    When I click "Team Performance"
    Then I should see individual team member metrics
    And I should see productivity trends
    And I should see attendance records

  Scenario: Export Analytics Data
    Given I am viewing analytics reports
    When I click "Export Data"
    And I select format "CSV"
    And I click "Download"
    Then I should receive a CSV file
    And it should contain all analytics data
