Feature: Financial Analytics
  As a bakery owner
  I want to view financial reports and analytics
  So that I can track business performance and make informed decisions

  Background:
    Given I am logged in as a bakery owner
    And I am on the financials page

  Scenario: View financial dashboard
    Given I have financial data in my system
    When I access the financials page
    Then I should see key financial metrics
    And I should see revenue, expenses, and profit summaries
    And I should see charts and graphs for visual analysis
    And I should see date range filters

  Scenario: View daily sales report
    Given I am on the financials page
    When I select "Daily Sales" report
    And I select today's date
    Then I should see today's sales summary
    And I should see sales by product category
    And I should see sales by payment method
    And I should see total revenue for the day

  Scenario: View monthly financial summary
    Given I am on the financials page
    When I select "Monthly Summary" report
    And I select current month
    Then I should see monthly revenue total
    And I should see monthly expenses breakdown
    And I should see net profit calculation
    And I should see comparison with previous month

  Scenario: View expense tracking
    Given I have recorded expenses
    When I select "Expenses" report
    Then I should see expense categories
    And I should see expense amounts by category
    And I should see expense trends over time
    And I should see total expenses for selected period

  Scenario: View profit and loss statement
    Given I am on the financials page
    When I select "Profit & Loss" report
    And I select a date range
    Then I should see revenue section with:
      - Sales revenue
      - Other income
    And I should see expenses section with:
      - Cost of goods sold
      - Operating expenses
      - Administrative expenses
    And I should see net profit calculation

  Scenario: View inventory cost analysis
    Given I have inventory and sales data
    When I select "Inventory Cost Analysis"
    Then I should see cost of goods sold by product
    And I should see inventory turnover rates
    And I should see profit margins by product
    And I should see recommendations for pricing adjustments

  Scenario: View sales trends
    Given I have historical sales data
    When I select "Sales Trends" report
    Then I should see sales trends over time
    And I should see seasonal patterns
    And I should see peak sales periods
    And I should see growth or decline indicators

  Scenario: Export financial reports
    Given I am viewing a financial report
    When I click "Export Report"
    Then I should see export options (PDF, Excel, CSV)
    When I select "Export as PDF"
    Then a PDF should be generated
    And I should be able to download the PDF
    When I select "Export as Excel"
    Then an Excel file should be generated
    And I should be able to download the Excel file

  Scenario: Financial data filtering
    Given I am on the financials page
    When I select date range "Last 7 days"
    Then all reports should show data for the last 7 days
    When I select date range "This month"
    Then all reports should show data for the current month
    When I select date range "Custom range"
    And I select specific start and end dates
    Then all reports should show data for the selected range

  Scenario: Financial permissions
    Given I am logged in as a baker
    When I try to access the financials page
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as a cashier
    Then I should see an access denied message
    And I should be redirected to an allowed page
    When I am logged in as an owner
    Then I should have full access to all financial reports

  Scenario: Financial data accuracy
    Given I have sales transactions
    When I view the financial reports
    Then the revenue should match the sum of all sales
    And the expenses should match recorded expenses
    And the profit calculation should be accurate
    When I add a new sale
    Then the financial reports should update automatically

  Scenario: Financial forecasting
    Given I have historical financial data
    When I select "Forecasting" report
    Then I should see projected revenue for next month
    And I should see projected expenses
    And I should see projected profit
    And I should see confidence intervals for projections

  Scenario: Financial error handling
    Given I am on the financials page
    When there is a data loading error
    Then I should see an error message
    And I should have the option to retry
    When I select an invalid date range
    Then I should see an error "Invalid date range selected"
    And I should be prompted to select a valid range

  Scenario: Financial with demo data
    Given I am logged in with a demo account
    When I access the financials page
    Then I should see sample financial data
    And I should see a demo indicator
    And all reports should work with demo data
    And I should be able to export demo reports
