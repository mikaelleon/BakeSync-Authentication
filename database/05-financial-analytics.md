# Financial Analytics

Monitor expenses, revenue, and profitability.

## Tables

```sql
-- Expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    budget_monthly DECIMAL(12,2) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses tracking
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method_id INT DEFAULT NULL,
    vendor VARCHAR(100),
    receipt_number VARCHAR(50),
    receipt_image_url VARCHAR(255),
    is_recurring TINYINT(1) DEFAULT 0,
    recurring_frequency ENUM('daily', 'weekly', 'monthly', 'yearly') DEFAULT NULL,
    status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
    notes TEXT,
    created_by INT NOT NULL,
    approved_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Revenue summary (daily aggregation for reporting)
CREATE TABLE IF NOT EXISTS daily_revenue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    revenue_date DATE NOT NULL UNIQUE,
    total_orders INT DEFAULT 0,
    gross_sales DECIMAL(12,2) DEFAULT 0,
    discounts_given DECIMAL(12,2) DEFAULT 0,
    tax_collected DECIMAL(12,2) DEFAULT 0,
    net_sales DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    ewallet_sales DECIMAL(12,2) DEFAULT 0,
    refunds DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product profitability tracking
CREATE TABLE IF NOT EXISTS product_profitability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    units_sold INT DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    cost_of_goods DECIMAL(12,2) DEFAULT 0,
    gross_profit DECIMAL(12,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_product_period (product_id, period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Financial goals and targets
CREATE TABLE IF NOT EXISTS financial_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    target_type ENUM('revenue', 'expense', 'profit', 'orders') NOT NULL,
    period_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    actual_amount DECIMAL(12,2) DEFAULT 0,
    achievement_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Financial reports archive
CREATE TABLE IF NOT EXISTS financial_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL,
    report_name VARCHAR(100) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_data JSON,
    generated_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Seed Data

```sql
-- Insert expense categories
INSERT INTO expense_categories (name, description, budget_monthly) VALUES
('Ingredients', 'Raw materials and baking ingredients', 50000.00),
('Utilities', 'Electricity, water, gas', 15000.00),
('Rent', 'Store/bakery rental', 25000.00),
('Salaries', 'Employee wages and benefits', 80000.00),
('Equipment', 'Kitchen equipment and maintenance', 10000.00),
('Marketing', 'Advertising and promotions', 5000.00),
('Packaging', 'Boxes, bags, and packaging materials', 8000.00),
('Transportation', 'Delivery and logistics', 7000.00),
('Miscellaneous', 'Other operational expenses', 5000.00);

-- Insert sample expenses
INSERT INTO expenses (category_id, description, amount, expense_date, vendor, status, created_by) VALUES
(1, 'Flour delivery - Manila Flour Mills', 15000.00, CURDATE(), 'Manila Flour Mills', 'paid', 1),
(1, 'Dairy products - Nestle', 8500.00, CURDATE(), 'Nestle Philippines', 'paid', 1),
(2, 'Electricity bill - January', 12000.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Meralco', 'paid', 1),
(2, 'Water bill - January', 2500.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Maynilad', 'paid', 1),
(3, 'Monthly rent - February', 25000.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Landlord', 'approved', 1),
(6, 'Facebook ads', 3000.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Meta', 'paid', 1),
(7, 'Cake boxes (100 pcs)', 2000.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Packaging Supplier', 'paid', 1);

-- Insert financial targets
INSERT INTO financial_targets (target_type, period_type, target_amount, period_start, period_end, created_by) VALUES
('revenue', 'monthly', 300000.00, DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 1),
('orders', 'daily', 50, CURDATE(), CURDATE(), 1),
('profit', 'monthly', 100000.00, DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 1);
```

## Common Queries

```sql
-- Aggregate daily revenue (run at end of day or via scheduled job)
INSERT INTO daily_revenue (revenue_date, total_orders, gross_sales, discounts_given, tax_collected, net_sales, cash_sales, card_sales, ewallet_sales, refunds)
SELECT
    DATE(o.created_at) AS revenue_date,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.subtotal) AS gross_sales,
    SUM(o.discount_amount) AS discounts_given,
    SUM(o.tax_amount) AS tax_collected,
    SUM(o.total_amount) AS net_sales,
    SUM(CASE WHEN pm.type = 'cash' THEN o.total_amount ELSE 0 END) AS cash_sales,
    SUM(CASE WHEN pm.type = 'card' THEN o.total_amount ELSE 0 END) AS card_sales,
    SUM(CASE WHEN pm.type = 'ewallet' THEN o.total_amount ELSE 0 END) AS ewallet_sales,
    SUM(CASE WHEN o.status = 'refunded' THEN o.total_amount ELSE 0 END) AS refunds
FROM orders o
LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
WHERE DATE(o.created_at) = CURDATE()
    AND o.payment_status = 'paid'
GROUP BY DATE(o.created_at)
ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    gross_sales = VALUES(gross_sales),
    discounts_given = VALUES(discounts_given),
    tax_collected = VALUES(tax_collected),
    net_sales = VALUES(net_sales),
    cash_sales = VALUES(cash_sales),
    card_sales = VALUES(card_sales),
    ewallet_sales = VALUES(ewallet_sales),
    refunds = VALUES(refunds),
    updated_at = NOW();

-- Daily profit/loss summary
SELECT
    dr.revenue_date,
    dr.net_sales AS revenue,
    COALESCE(exp.total_expenses, 0) AS expenses,
    dr.net_sales - COALESCE(exp.total_expenses, 0) AS profit_loss,
    ROUND((dr.net_sales - COALESCE(exp.total_expenses, 0)) / dr.net_sales * 100, 2) AS profit_margin
FROM daily_revenue dr
LEFT JOIN (
    SELECT expense_date, SUM(amount) AS total_expenses
    FROM expenses
    WHERE status IN ('approved', 'paid')
    GROUP BY expense_date
) exp ON dr.revenue_date = exp.expense_date
WHERE dr.revenue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY dr.revenue_date DESC;

-- Monthly financial summary
SELECT
    DATE_FORMAT(revenue_date, '%Y-%m') AS month,
    SUM(total_orders) AS total_orders,
    SUM(gross_sales) AS gross_sales,
    SUM(discounts_given) AS total_discounts,
    SUM(net_sales) AS net_revenue,
    SUM(cash_sales) AS cash_revenue,
    SUM(card_sales) AS card_revenue,
    SUM(ewallet_sales) AS ewallet_revenue
FROM daily_revenue
WHERE revenue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(revenue_date, '%Y-%m')
ORDER BY month DESC;

-- Expense breakdown by category
SELECT
    ec.name AS category,
    COUNT(e.id) AS transaction_count,
    SUM(e.amount) AS total_spent,
    ec.budget_monthly,
    ROUND(SUM(e.amount) / ec.budget_monthly * 100, 2) AS budget_utilization
FROM expense_categories ec
LEFT JOIN expenses e ON ec.id = e.category_id
    AND MONTH(e.expense_date) = MONTH(CURDATE())
    AND YEAR(e.expense_date) = YEAR(CURDATE())
    AND e.status IN ('approved', 'paid')
WHERE ec.is_active = 1
GROUP BY ec.id, ec.name, ec.budget_monthly
ORDER BY total_spent DESC;

-- Product profitability analysis
SELECT
    p.id,
    p.name,
    p.price AS selling_price,
    p.cost AS unit_cost,
    p.price - p.cost AS unit_profit,
    ROUND((p.price - p.cost) / p.price * 100, 2) AS profit_margin,
    COALESCE(sales.units_sold, 0) AS units_sold_30d,
    COALESCE(sales.revenue, 0) AS revenue_30d,
    COALESCE(sales.units_sold * p.cost, 0) AS cogs_30d,
    COALESCE(sales.revenue - (sales.units_sold * p.cost), 0) AS gross_profit_30d
FROM products p
LEFT JOIN (
    SELECT
        oi.product_id,
        SUM(oi.quantity) AS units_sold,
        SUM(oi.subtotal) AS revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed'
        AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY oi.product_id
) sales ON p.id = sales.product_id
WHERE p.is_available = 1
ORDER BY gross_profit_30d DESC;

-- Sales trend analysis (daily for last 30 days)
SELECT
    dr.revenue_date,
    DAYNAME(dr.revenue_date) AS day_name,
    dr.total_orders,
    dr.net_sales,
    ROUND(dr.net_sales / dr.total_orders, 2) AS avg_order_value,
    LAG(dr.net_sales) OVER (ORDER BY dr.revenue_date) AS prev_day_sales,
    ROUND((dr.net_sales - LAG(dr.net_sales) OVER (ORDER BY dr.revenue_date)) /
        LAG(dr.net_sales) OVER (ORDER BY dr.revenue_date) * 100, 2) AS growth_rate
FROM daily_revenue dr
WHERE dr.revenue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY dr.revenue_date;

-- Top performing days of the week
SELECT
    DAYNAME(revenue_date) AS day_of_week,
    DAYOFWEEK(revenue_date) AS day_number,
    COUNT(*) AS num_days,
    ROUND(AVG(total_orders), 0) AS avg_orders,
    ROUND(AVG(net_sales), 2) AS avg_revenue,
    SUM(net_sales) AS total_revenue
FROM daily_revenue
WHERE revenue_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY DAYNAME(revenue_date), DAYOFWEEK(revenue_date)
ORDER BY day_number;

-- Cost of goods sold (COGS) analysis
SELECT
    DATE_FORMAT(o.created_at, '%Y-%m') AS month,
    SUM(oi.subtotal) AS revenue,
    SUM(oi.quantity * p.cost) AS cogs,
    SUM(oi.subtotal) - SUM(oi.quantity * p.cost) AS gross_profit,
    ROUND((SUM(oi.subtotal) - SUM(oi.quantity * p.cost)) / SUM(oi.subtotal) * 100, 2) AS gross_margin
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.status = 'completed'
    AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
ORDER BY month DESC;

-- Financial target tracking
SELECT
    ft.target_type,
    ft.period_type,
    ft.period_start,
    ft.period_end,
    ft.target_amount,
    CASE ft.target_type
        WHEN 'revenue' THEN (SELECT COALESCE(SUM(net_sales), 0) FROM daily_revenue WHERE revenue_date BETWEEN ft.period_start AND ft.period_end)
        WHEN 'orders' THEN (SELECT COALESCE(SUM(total_orders), 0) FROM daily_revenue WHERE revenue_date BETWEEN ft.period_start AND ft.period_end)
        WHEN 'expense' THEN (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date BETWEEN ft.period_start AND ft.period_end AND status IN ('approved', 'paid'))
    END AS actual_amount,
    ROUND(
        CASE ft.target_type
            WHEN 'revenue' THEN (SELECT COALESCE(SUM(net_sales), 0) FROM daily_revenue WHERE revenue_date BETWEEN ft.period_start AND ft.period_end)
            WHEN 'orders' THEN (SELECT COALESCE(SUM(total_orders), 0) FROM daily_revenue WHERE revenue_date BETWEEN ft.period_start AND ft.period_end)
            WHEN 'expense' THEN (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date BETWEEN ft.period_start AND ft.period_end AND status IN ('approved', 'paid'))
        END / ft.target_amount * 100, 2
    ) AS achievement_rate
FROM financial_targets ft
WHERE ft.period_end >= CURDATE()
ORDER BY ft.period_start;

-- Revenue by product category
SELECT
    rc.name AS category,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.subtotal) AS revenue,
    ROUND(SUM(oi.subtotal) / (SELECT SUM(net_sales) FROM daily_revenue WHERE revenue_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) * 100, 2) AS revenue_share
FROM recipe_categories rc
JOIN products p ON rc.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
    AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY rc.id, rc.name
ORDER BY revenue DESC;

-- Cash flow summary
SELECT
    'Income' AS type,
    'Sales Revenue' AS description,
    SUM(net_sales) AS amount
FROM daily_revenue
WHERE revenue_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE()

UNION ALL

SELECT
    'Expense' AS type,
    ec.name AS description,
    SUM(e.amount) AS amount
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
WHERE e.expense_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND CURDATE()
    AND e.status IN ('approved', 'paid')
GROUP BY ec.id, ec.name

ORDER BY type, amount DESC;

-- Year-over-year comparison
SELECT
    MONTH(dr1.revenue_date) AS month,
    MONTHNAME(dr1.revenue_date) AS month_name,
    SUM(CASE WHEN YEAR(dr1.revenue_date) = YEAR(CURDATE()) THEN dr1.net_sales ELSE 0 END) AS current_year,
    SUM(CASE WHEN YEAR(dr1.revenue_date) = YEAR(CURDATE()) - 1 THEN dr1.net_sales ELSE 0 END) AS previous_year,
    ROUND(
        (SUM(CASE WHEN YEAR(dr1.revenue_date) = YEAR(CURDATE()) THEN dr1.net_sales ELSE 0 END) -
         SUM(CASE WHEN YEAR(dr1.revenue_date) = YEAR(CURDATE()) - 1 THEN dr1.net_sales ELSE 0 END)) /
        NULLIF(SUM(CASE WHEN YEAR(dr1.revenue_date) = YEAR(CURDATE()) - 1 THEN dr1.net_sales ELSE 0 END), 0) * 100, 2
    ) AS yoy_growth
FROM daily_revenue dr1
WHERE dr1.revenue_date >= DATE_SUB(CURDATE(), INTERVAL 24 MONTH)
GROUP BY MONTH(dr1.revenue_date), MONTHNAME(dr1.revenue_date)
ORDER BY month;
```
