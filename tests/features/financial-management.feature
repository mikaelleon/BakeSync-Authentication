Feature: Financial Management
  As a business owner
  I want to track sales and revenue
  So that I can monitor business performance

  Background:
    Given I am logged in as an owner

  Scenario: View Sales Dashboard
    Given I am logged in as an owner
    When I navigate to the financials page
    Then I should see total sales for today
    And I should see sales by product
    And I should see revenue trends

  Scenario: Sales Report Generation
    Given I am viewing the financials page
    When I select date range "Last 30 days"
    And I click "Generate Report"
    Then I should see a detailed sales report
    And I should be able to export it as PDF

  Scenario: Add Expense
    Given I am logged in as an owner
    When I navigate to the expenses page
    And I click "Add Expense"
    And I enter description "Flour purchase"
    And I enter amount "50.00"
    And I select category "Ingredients"
    And I enter date "2024-01-15"
    And I click "Save"
    Then the expense should be recorded
    And it should appear in the expenses list

  Scenario: View Profit and Loss
    Given I am on the financials page
    When I click "Profit & Loss"
    Then I should see revenue breakdown
    And I should see expense breakdown
    And I should see net profit calculation

  Scenario: Export Financial Data
    Given I am viewing financial reports
    When I click "Export Data"
    And I select format "Excel"
    And I click "Download"
    Then I should receive an Excel file
    And it should contain all financial data
