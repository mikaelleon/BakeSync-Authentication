# BakeSync ERP - Technical Q&A Document

**Comprehensive Technical Questions and Answers**

This document provides detailed answers to technical questions about BakeSync ERP, covering Software Development Life Cycle (SDLC), Workflows, Database Architecture, and Backend Implementation.

**Target Market**: Medium to Semi-Large Bakeries (15-50 employees) with established operations and team structures requiring role-based access control and multi-user collaboration.

---

## Table of Contents

- [A. Software Development Life Cycle (SDLC) Questions](#a-software-development-life-cycle-sdlc-questions)
- [B. Workflow Questions](#b-workflow-questions)
- [C. Database Questions](#c-database-questions)
- [D. Backend Questions](#d-backend-questions)

---

## A. Software Development Life Cycle (SDLC) Questions

### **Q1: What SDLC methodology was used?**

**Answer**: BakeSync ERP was developed using an **Agile/Iterative approach** with phased implementation. The project was structured into multiple phases, each building upon the previous foundation.

**Implementation Structure**:
- **Phase 1**: Critical Foundation (Database schema, authentication, account detection)
- **Phase 2**: Core Business Modules (Inventory, Recipes, POS, Production)
- **Phase 3**: Advanced Features (Team management, notifications, enhanced dashboard)
- **Phase 4-6**: Additional enhancements and optimizations

**Development Phases**:
1. **Planning**: Requirements gathering, architecture design, database schema design
2. **Development**: Feature implementation using Next.js 14 with TypeScript
3. **Testing**: Comprehensive testing with Playwright E2E tests and BDD with Cucumber
4. **Deployment**: Production deployment with Supabase backend
5. **Iteration**: Continuous improvement based on feedback and testing

**Reference**: Implementation documentation in `documents/implementation/` directory shows phased approach with clear milestones and deliverables.

---

### **Q2: How was the project structured?**

**Answer**: BakeSync ERP follows a **modular architecture** with clear separation of concerns across frontend, backend, and database layers.

**Architecture Overview**:

#### **Frontend (Next.js 14)**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **UI Components**: Radix UI + shadcn/ui component library
- **Styling**: Tailwind CSS
- **State Management**: React Context API for global state

**Project Structure**:
```
app/
├── [slug]/              # Dynamic routing for business-specific URLs
│   ├── dashboard/       # Dashboard pages
│   ├── inventory/       # Inventory management
│   ├── recipes/         # Recipe management
│   ├── pos/             # Point of Sale
│   ├── production/     # Production logging
│   ├── financials/     # Financial management
│   ├── supply-chain/   # Supplier management
│   └── team/           # Team management
├── login/              # Authentication pages
├── signup/             # Registration pages
└── onboarding/         # Onboarding wizard

components/
├── dashboard/          # Dashboard components
├── onboarding/        # Onboarding wizard components
├── ui/                 # Reusable UI components
└── protected-route.tsx # Route protection middleware

lib/
├── auth-context.tsx    # Authentication context
├── data-store.tsx      # Centralized data management
├── supabase-client.ts  # Supabase client setup
├── supabase-server.ts  # Server-side Supabase client
├── user-management.ts # User management utilities
└── types.ts            # TypeScript type definitions
```

#### **Backend (Supabase)**
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (email/password)
- **API**: RESTful API via Supabase client
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Supabase Storage for file uploads

#### **Database (PostgreSQL)**
- **Multi-tenant Architecture**: Data isolation by `bakeshop_id`
- **Row Level Security**: RLS policies for data access control
- **Schema**: Normalized database design with proper relationships

**Reference**: 
- Frontend structure: `app/`, `components/`, `lib/` directories
- Backend integration: `lib/supabase-client.ts`, `lib/supabase-server.ts`
- Database schema: `documents/analysis/DATA_CONSISTENCY_GUIDE.md`

---

### **Q3: What testing approach was implemented?**

**Answer**: BakeSync ERP uses **comprehensive testing** with Playwright E2E tests and Behavior-Driven Development (BDD) with Cucumber.

**Testing Stack**:
- **E2E Testing**: Playwright for end-to-end browser testing
- **BDD Framework**: Cucumber.js with Gherkin syntax
- **Test Structure**: Page Object Model (POM) pattern
- **Test Coverage**: 25+ feature files covering all major workflows

**Test Organization**:
```
tests/
├── features/                    # Gherkin feature files
│   ├── authentication.feature
│   ├── onboarding.feature
│   ├── inventory-management.feature
│   ├── recipe-management.feature
│   ├── production-management.feature
│   ├── point-of-sale.feature
│   └── [20+ more feature files]
├── step-definitions/            # Step definition implementations
│   ├── auth-steps.ts
│   ├── onboarding-steps.ts
│   └── [5+ more step definition files]
├── pages/                      # Page Object Model classes
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── [6+ more page objects]
└── support/                     # Test support files
    ├── world.ts                # Custom Cucumber world
    └── hooks.ts                # Before/After hooks
```

**Test Coverage**:
- **Authentication**: Login, signup, email verification, session management
- **Business Setup**: Onboarding wizard, business configuration
- **Core Features**: Inventory, recipes, POS, production, financials
- **Team Management**: Invitations, role management, permissions
- **Error Handling**: Validation, error scenarios, edge cases

**Testing Approach**:
1. **Feature Files**: Written in Gherkin syntax describing user scenarios
2. **Step Definitions**: TypeScript implementations of Gherkin steps
3. **Page Objects**: Reusable page interaction classes
4. **Automated Execution**: Tests run automatically on code changes

**Reference**: 
- Test configuration: `playwright.config.ts`, `cucumber.config.js`
- Feature files: `tests/features/` directory
- Test documentation: `documents/setup/PLAYWRIGHT_TESTING_GUIDE.md`

---

### **Q4: How was version control managed?**

**Answer**: BakeSync ERP uses **Git-based version control** with feature branches and structured commit practices.

**Version Control Strategy**:
- **Repository**: Git-based version control system
- **Branching Strategy**: Feature branches for new development
- **Code Review**: Pull request process for code review
- **Deployment Workflow**: Automated deployment from main branch

**Development Workflow**:
1. **Feature Development**: Create feature branch from main
2. **Development**: Implement features with regular commits
3. **Testing**: Run test suite before merging
4. **Code Review**: Submit pull request for review
5. **Merge**: Merge to main after approval
6. **Deployment**: Automatic deployment to production

**Commit Practices**:
- Descriptive commit messages
- Atomic commits (one logical change per commit)
- Regular commits during development
- Clear separation of features

**Reference**: Git repository structure and commit history demonstrate organized development workflow.

---

## B. Workflow Questions

### **Q1: What are the main business workflows?**

**Answer**: BakeSync ERP supports comprehensive business workflows from user registration through daily operations to reporting.

#### **1. User Registration Flow**

**Process**:
1. User visits signup page
2. Selects account type (new business owner or team member via invitation)
3. Enters email, password, and name
4. Creates account
5. Receives email verification code
6. Verifies email
7. Redirected to onboarding or dashboard

**Reference**: 
- Signup page: `app/signup/page.tsx`
- Email verification: `app/verify-email/page.tsx`
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (User Authentication section)

#### **2. Business Setup & Onboarding Flow**

**Process**:
1. **Step 1 - Business Details**: Enter business name, type, location, contact information
2. **Step 2 - Inventory Setup**: Add initial inventory items (raw materials and finished goods)
3. **Step 3 - Suppliers Setup**: Configure preferred suppliers (optional)
4. **Step 4 - Team Setup**: Invite team members and assign roles (optional)
5. **Step 5 - System Configuration**: Set preferences, notifications, operating hours
6. **Step 6 - Review & Complete**: Review all information and complete setup

**Data Persistence**: Each step saves data to database, allowing users to resume later

**Reference**: 
- Onboarding component: `components/onboarding/enhanced-onboarding.tsx`
- Onboarding state manager: `lib/onboarding-state-manager.ts`
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Business Setup section)

#### **3. Inventory Management Workflow**

**Process**:
1. **View Inventory**: Access inventory page showing all items with current stock levels
2. **Add Items**: Add new inventory items (raw materials or finished goods)
3. **Update Stock**: Update quantities manually or automatically via production/sales
4. **Set Thresholds**: Configure minimum stock levels for alerts
5. **Low Stock Alerts**: System automatically alerts when stock falls below threshold
6. **Expiration Tracking**: Track expiration dates for perishable items
7. **Bulk Operations**: Update multiple items at once

**Automatic Updates**:
- Production logging automatically deducts ingredients
- Sales transactions automatically deduct finished goods
- Purchase orders automatically add inventory

**Reference**: 
- Inventory page: `app/[slug]/inventory/page.tsx`
- Data store: `lib/data-store.tsx` (inventory operations)
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Inventory Management section)

#### **4. Production Workflow**

**Process**:
1. **Select Recipe**: Choose recipe to produce
2. **Create Batch**: Enter batch quantity and production date
3. **Ingredient Check**: System checks ingredient availability
4. **Log Production**: Record production batch
5. **Automatic Updates**:
   - Ingredients deducted from inventory
   - Finished goods added to inventory
   - Production log created
   - Cost tracking updated

**Production History**:
- View all production logs
- Filter by date range
- See production statistics
- Track production costs

**Reference**: 
- Production page: `app/[slug]/production/page.tsx`
- Production logging: `lib/data-store.tsx` (production operations)
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Production Management section)

#### **5. Point of Sale (POS) Workflow**

**Process**:
1. **Product Selection**: Add products to cart from product catalog
2. **Stock Validation**: Real-time stock checking as items are added
3. **Cart Management**: Adjust quantities, remove items (with stock validation)
4. **Checkout**: Validate cart is not empty
5. **Payment Processing**: 
   - Select payment method (cash, card, GCash)
   - **Stock Validation**: Reload products and validate stock before payment
   - **Payment Validation**: Validate payment amount for cash payments
   - Process payment only if all validations pass
6. **Transaction Completion**: 
   - Create sale record
   - Update inventory (finished goods deducted)
   - Update product stock
   - Generate receipt
7. **Automatic Updates**:
   - Inventory updated (finished goods deducted)
   - Product stock synchronized
   - Sales record created
   - Financial records updated
   - Receipt generated with print option

**Payment Methods**:
- **Cash**: Enter amount paid, validate sufficient payment, calculate change
- **Card**: Process card payment (no change calculation)
- **GCash**: Process digital payment (no change calculation)

**Validation Flow**:
1. Cart validation (not empty)
2. Payment amount validation (if cash)
3. Stock reload and validation
4. Stock availability check for all cart items
5. Cart auto-update if stock issues detected
6. Payment processing only if all validations pass

**Error Handling**:
- Stock issues: Cart automatically updated, detailed error message shown
- Payment issues: Clear error message with required amount
- Network errors: Graceful error handling with retry options

**Reference**: 
- POS page: `app/[slug]/pos/page.tsx`
- Sales processing: `lib/data-store.tsx` (sales operations)
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Point of Sale section)
- Recent improvements: `MODULE_REVIEW_AND_FIXES.md` (Section 1)

#### **6. Financial Management Workflow**

**Process**:
1. **Sales Tracking**: Automatic sales recording from POS
2. **Expense Tracking**: Manual expense entry or automatic from purchase orders
3. **Financial Dashboard**: View revenue, expenses, profitability
4. **Report Generation**: Generate sales reports, expense reports, profit/loss statements
5. **Analytics**: View trends, product performance, financial health

**Reference**: 
- Financials page: `app/[slug]/financials/page.tsx`
- Financial data: `lib/data-store.tsx` (financial operations)
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Financial Management section)

---

### **Q2: How does the user onboarding process work?**

**Answer**: BakeSync ERP uses a **multi-step onboarding wizard** that guides users through business setup with data persistence and validation.

#### **Onboarding Steps**

**Step 1: Business Details**
- Business name (generates unique slug)
- Business type (Bakery, Cafe, Restaurant, Food Truck)
- Location (address, city, state, zip)
- Contact information (phone, email)
- Operating hours

**Step 2: Location & Hours**
- Physical address details
- Operating hours configuration
- Time zone settings

**Step 3: Preferences**
- Business preferences
- Default settings
- Notification preferences

**Step 4: Notifications**
- Email notification settings
- In-app notification preferences
- Alert configurations

**Step 5: Team Setup**
- Invite team members
- Assign roles (Baker, Cashier)
- Set permissions

**Step 6: Complete**
- Review all information
- Finalize setup
- Redirect to dashboard

#### **Data Persistence**

- **Progress Saving**: Each step saves data to database
- **Resume Capability**: Users can resume onboarding from last completed step
- **Validation**: Each step validates data before proceeding
- **State Management**: Onboarding state managed via `OnboardingStateManager`

#### **Role-Based Onboarding**

- **Owner Onboarding**: Full business setup wizard
- **Baker Onboarding**: Simplified onboarding focused on recipes and production
- **Cashier Onboarding**: POS-focused onboarding

**Reference**: 
- Enhanced onboarding: `components/onboarding/enhanced-onboarding.tsx`
- Onboarding state manager: `lib/onboarding-state-manager.ts`
- Business setup wizard: `components/onboarding/business-setup-wizard.tsx`
- Role-based onboarding: `components/onboarding/role-based-onboarding.tsx`

---

### **Q3: How does inventory management workflow function?**

**Answer**: Inventory management in BakeSync ERP provides **real-time tracking** with automated alerts and updates.

#### **Inventory Tracking Process**

1. **Add Inventory Items**:
   - Name, type (raw/finished), quantity, unit
   - Minimum stock threshold
   - Expiration date (for perishables)
   - Category classification

2. **Monitor Stock Levels**:
   - Real-time stock level display
   - Low stock alerts when below threshold
   - Expiration alerts for perishable items
   - Stock history tracking

3. **Automatic Updates**:
   - **Production Logging**: Ingredients automatically deducted
   - **Sales Transactions**: Finished goods automatically deducted
   - **Purchase Orders**: Inventory automatically added on receipt

4. **Manual Updates**:
   - Adjust stock levels manually
   - Bulk update operations
   - Stock adjustments for discrepancies

5. **Inventory Reports**:
   - Current stock levels
   - Low stock items
   - Expiring items
   - Inventory turnover

#### **Low Stock Notifications**

- **Automatic Alerts**: System checks stock levels against thresholds
- **Notification Types**: In-app notifications, email alerts (optional)
- **Alert Timing**: Real-time alerts when threshold is crossed

#### **Expiration Tracking**

- **Perishable Items**: Track expiration dates
- **Expiration Alerts**: Notify before items expire
- **Waste Reduction**: Help use items before expiration

**Reference**: 
- Inventory management: `app/[slug]/inventory/page.tsx`
- Inventory data operations: `lib/data-store.tsx` (inventory methods)
- Inventory types: `lib/types.ts` (InventoryItem interface)

---

### **Q4: What is the production workflow?**

**Answer**: Production workflow in BakeSync ERP enables **efficient batch tracking** with automatic inventory updates and cost tracking.

#### **Production Logging Process**

1. **Select Recipe**: Choose recipe to produce from recipe database
2. **Create Production Batch**:
   - Enter quantity to produce
   - Select production date
   - Optionally enter notes
3. **Ingredient Verification**: System checks ingredient availability
4. **Log Production**: Record production batch
5. **Automatic Updates**:
   - Ingredients deducted from inventory (based on recipe)
   - Finished goods added to inventory
   - Production log created with timestamp
   - Cost calculated and tracked

#### **Production History**

- **View All Logs**: Complete history of production batches
- **Filter Options**: Filter by date range, recipe, baker
- **Statistics**: Total production, cost analysis, efficiency metrics

#### **Cost Tracking**

- **Ingredient Costs**: Track cost of ingredients used
- **Production Costs**: Calculate total production cost per batch
- **Profitability**: Compare production costs to sales prices

**Reference**: 
- Production page: `app/[slug]/production/page.tsx`
- Production logging: `lib/data-store.tsx` (production operations)
- Production types: `lib/types.ts` (ProductionLog interface)
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Production Management section)

---

### **Q5: How does the POS workflow operate?**

**Answer**: The Point of Sale (POS) system provides **fast transaction processing** with automatic inventory updates and multiple payment methods.

#### **POS Transaction Process**

1. **Product Selection**:
   - Browse product catalog
   - Add products to cart
   - Adjust quantities

2. **Cart Management**:
   - View cart items and totals
   - Modify quantities
   - Remove items
   - Apply discounts (if configured)

3. **Payment Processing**:
   - **Cash Payment**: Enter amount paid, calculate change
   - **Card Payment**: Process card transaction
   - **GCash Payment**: Process digital payment

4. **Transaction Completion**:
   - Process payment
   - Generate receipt
   - Update inventory (finished goods deducted)
   - Create sales record
   - Update financial records

5. **Receipt Generation**:
   - Print or email receipt
   - Receipt includes: items, quantities, prices, total, payment method, transaction ID

#### **Real-Time Inventory Updates**

- **Automatic Deduction**: Finished goods automatically deducted from inventory
- **Stock Availability**: Check stock availability before adding to cart
- **Out of Stock Handling**: Prevent sales of out-of-stock items

#### **Payment Methods**

- **Cash**: Manual entry of amount paid, automatic change calculation
- **Card**: Card payment processing (integrated with payment gateway)
- **GCash**: Digital payment processing

**Reference**: 
- POS page: `app/[slug]/pos/page.tsx`
- Sales processing: `lib/data-store.tsx` (sales operations)
- Sales types: `lib/types.ts` (Sale, CartItem interfaces)
- Feature specification: `documents/features/BAKESYNC_FEATURES.md` (Point of Sale section)

---

## C. Database Questions

### **Q1: What database system is used?**

**Answer**: BakeSync ERP uses **PostgreSQL** via **Supabase** as the database system.

#### **Why PostgreSQL?**

- **Reliability**: Robust, proven database system
- **Scalability**: Handles growth from small to large operations
- **Features**: Advanced features like Row Level Security (RLS), JSON support, full-text search
- **Performance**: Excellent query performance with proper indexing
- **ACID Compliance**: Ensures data integrity and consistency

#### **Why Supabase?**

- **PostgreSQL Hosting**: Managed PostgreSQL database
- **Authentication**: Built-in authentication system
- **Real-time**: Real-time subscriptions for live updates
- **Storage**: File storage for images and documents
- **API**: Automatic REST API generation
- **Security**: Built-in security features including RLS

#### **Benefits**

- **Scalability**: Scales from medium to semi-large businesses, supporting 15-50 employees per bakery operation
- **Performance**: Optimized queries with strategic indexing
- **Security**: Row Level Security ensures data isolation
- **Reliability**: Managed service with automatic backups
- **Developer Experience**: Easy to use with excellent tooling

**Reference**: 
- Supabase client: `lib/supabase-client.ts`
- Supabase server: `lib/supabase-server.ts`
- Database documentation: `documents/analysis/DATA_CONSISTENCY_GUIDE.md`

---

### **Q2: What is the database schema structure?**

**Answer**: BakeSync ERP uses a **multi-tenant architecture** with core tables designed for data isolation and efficient operations.

#### **Core Database Tables**

**1. `profiles`**
- User profile information
- Links to Supabase Auth users
- Stores user details (name, email, preferences)

**2. `bakeshops`**
- Business/bakeshop information
- Stores business details (name, slug, type, location)
- Includes `is_demo` flag for demo accounts

**3. `bakeshop_memberships`**
- Links users to bakeshops
- Stores role assignments (owner, baker, cashier)
- Tracks membership status and join dates

**4. `inventory`**
- Inventory items (raw materials and finished goods)
- Stores: name, type, quantity, unit, min_stock, expiration_date
- Linked to bakeshop via `bakeshop_id`

**5. `recipes`**
- Recipe information
- Stores: name, yield, yield_unit, ingredients (JSON), instructions
- Linked to bakeshop via `bakeshop_id`

**6. `production_logs`**
- Production batch records
- Stores: recipe_id, quantity_produced, production_date, baker_id
- Linked to bakeshop via `bakeshop_id`

**7. `sales`**
- Sales transaction records
- Stores: order_number, items (JSON), totals, payment_method, cashier_id
- Linked to bakeshop via `bakeshop_id`

**8. `suppliers`**
- Supplier information
- Stores: name, contact_person, email, phone, address, products
- Linked to bakeshop via `bakeshop_id`

**9. `purchase_orders`**
- Purchase order records
- Stores: order_number, supplier_id, items (JSON), total_amount, status
- Linked to bakeshop via `bakeshop_id`

**10. `team_invitations`**
- Team member invitations
- Stores: invited_email, role, status, invitation_token, expires_at
- Linked to bakeshop via `bakeshop_id`

**11. `notifications`**
- System notifications
- Stores: user_id, type, message, read status
- Linked to bakeshop via `bakeshop_id`

**12. `user_activity_logs`**
- User activity tracking
- Stores: user_id, action, details, timestamp
- Linked to bakeshop via `bakeshop_id`

#### **Relationships**

- **Multi-tenant Isolation**: All business data tables include `bakeshop_id` for data isolation
- **User Relationships**: `profiles` → `bakeshop_memberships` → `bakeshops`
- **Data Relationships**: All business data linked to `bakeshops` via `bakeshop_id`
- **Foreign Keys**: Proper foreign key relationships ensure data integrity

#### **Data Isolation**

- **Row Level Security**: RLS policies ensure users only see data for their bakeshop
- **Multi-tenant Design**: Each bakeshop's data is completely isolated
- **Secure Access**: Database-level security prevents cross-tenant data access

**Reference**: 
- Type definitions: `lib/types.ts`
- Data consistency guide: `documents/analysis/DATA_CONSISTENCY_GUIDE.md`
- Database setup: `documents/setup/SIGNUP_ONBOARDING_SETUP.md`

---

### **Q3: How is data security implemented?**

**Answer**: Data security in BakeSync ERP is implemented through **Row Level Security (RLS) policies**, role-based access control, and secure authentication.

#### **Row Level Security (RLS) Policies**

- **Table-Level Security**: RLS enabled on all business data tables
- **Policy-Based Access**: Policies enforce access based on user role and bakeshop membership
- **Automatic Filtering**: Database automatically filters data based on user context

#### **Role-Based Access Control**

**Permission Matrix**:
| Feature | Owner | Baker | Cashier |
|---------|-------|-------|---------|
| View Dashboard | ✅ | ✅ | ❌ |
| Manage Recipes | ✅ | ✅ | ❌ |
| Manage Inventory | ✅ | ✅ | ❌ |
| Manage Suppliers | ✅ | ❌ | ❌ |
| Access POS | ✅ | ❌ | ✅ |
| View Financials | ✅ | ❌ | ❌ |
| Log Production | ✅ | ✅ | ❌ |

#### **Data Isolation**

- **Bakeshop Isolation**: Each bakeshop's data is completely isolated via `bakeshop_id`
- **RLS Enforcement**: Policies ensure users only access their bakeshop's data
- **Cross-Tenant Prevention**: Database-level security prevents access to other bakeshops' data

#### **Secure Authentication**

- **Supabase Auth**: Secure email/password authentication
- **Session Management**: JWT tokens for session management
- **Password Security**: Secure password hashing and storage
- **Email Verification**: Required email verification for new accounts

**Reference**: 
- Data consistency guide: `documents/analysis/DATA_CONSISTENCY_GUIDE.md`
- Permission system: `lib/permissions.ts`
- User management: `lib/user-management.ts`

---

### **Q4: How is data consistency maintained?**

**Answer**: Data consistency in BakeSync ERP is maintained through **RLS policies**, validation checks, transaction management, and audit trails.

#### **Row Level Security (RLS) Policies**

- **Access Control**: RLS policies ensure users only access authorized data
- **Data Integrity**: Policies prevent unauthorized data modifications
- **Consistent Filtering**: All queries automatically filtered by user context

#### **Validation Checks**

- **Input Validation**: All user inputs validated before database operations
- **Data Type Validation**: TypeScript types ensure data structure consistency
- **Business Rule Validation**: Business logic validates data before saving

#### **Transaction Management**

- **Atomic Operations**: Related operations grouped in transactions
- **Rollback Capability**: Failed operations rolled back to maintain consistency
- **Error Handling**: Comprehensive error handling prevents partial updates

#### **Data Integrity**

- **Foreign Keys**: Foreign key constraints ensure referential integrity
- **Unique Constraints**: Unique constraints prevent duplicate data
- **Check Constraints**: Check constraints validate data values

#### **Audit Trails**

- **Activity Logging**: All data changes logged in `user_activity_logs`
- **User Tracking**: Track which user performed which action
- **Timestamp Tracking**: Track when actions occurred
- **Change History**: Maintain history of data changes

**Reference**: 
- Data consistency: `lib/data-consistency.ts`
- Data consistency guide: `documents/analysis/DATA_CONSISTENCY_GUIDE.md`
- Activity logging: `lib/user-management-enhanced.ts`

---

### **Q5: What indexing strategy is used?**

**Answer**: BakeSync ERP uses **strategic indexes** on frequently queried columns to optimize query performance.

#### **Indexing Strategy**

**Primary Indexes**:
- **Primary Keys**: All tables have primary key indexes
- **Foreign Keys**: Indexed foreign keys for join performance

**Frequently Queried Columns**:
- **`bakeshop_id`**: Indexed on all business data tables (multi-tenant filtering)
- **`user_id`**: Indexed on user-related tables
- **`created_at`**: Indexed for date-based queries and sorting
- **`status`**: Indexed on tables with status fields (invitations, orders)

**Composite Indexes**:
- **`(bakeshop_id, created_at)`**: For bakeshop-specific date queries
- **`(bakeshop_id, status)`**: For filtered queries by bakeshop and status

#### **Performance Optimization**

- **Query Efficiency**: Indexes reduce query execution time
- **Scalability**: Indexes maintain performance as data grows
- **Strategic Placement**: Indexes placed on columns used in WHERE clauses and JOINs

**Reference**: Database schema includes strategic indexes for optimal performance.

---

## D. Backend Questions

### **Q1: What backend technology is used?**

**Answer**: BakeSync ERP uses **Supabase** as the backend platform, which provides PostgreSQL database, authentication, real-time capabilities, and storage.

#### **Why Supabase?**

- **PostgreSQL Database**: Managed PostgreSQL database with full SQL capabilities
- **Authentication**: Built-in authentication system (email/password, OAuth)
- **Real-time**: Real-time subscriptions for live data updates
- **Storage**: File storage for images and documents
- **API**: Automatic REST API generation from database schema
- **Serverless**: Serverless architecture, no server management required

#### **Architecture**

- **Client-Side**: Next.js application with Supabase client
- **Server-Side**: Next.js API routes with Supabase server client
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

#### **Benefits**

- **Rapid Development**: Fast development with managed services
- **Scalability**: Automatic scaling with Supabase infrastructure
- **Security**: Built-in security features (RLS, authentication)
- **Real-time**: Real-time capabilities out of the box
- **Cost-Effective**: Pay-as-you-go pricing model

**Reference**: 
- Supabase client: `lib/supabase-client.ts`
- Supabase server: `lib/supabase-server.ts`
- Supabase setup: `documents/setup/SUPABASE_SETUP.md`

---

### **Q2: How are API endpoints structured?**

**Answer**: BakeSync ERP uses **RESTful API** via Supabase client, with CRUD operations and authentication.

#### **API Structure**

**Supabase Client API**:
- **Client Creation**: `createClient()` function creates Supabase client
- **Authentication**: `supabase.auth` for authentication operations
- **Database Operations**: `supabase.from(table)` for database queries
- **Storage Operations**: `supabase.storage` for file operations

#### **CRUD Operations**

**Create**:
```typescript
const { data, error } = await supabase
  .from('inventory')
  .insert({ name, quantity, bakeshop_id })
```

**Read**:
```typescript
const { data, error } = await supabase
  .from('inventory')
  .select('*')
  .eq('bakeshop_id', bakeshopId)
```

**Update**:
```typescript
const { data, error } = await supabase
  .from('inventory')
  .update({ quantity })
  .eq('id', itemId)
```

**Delete**:
```typescript
const { data, error } = await supabase
  .from('inventory')
  .delete()
  .eq('id', itemId)
```

#### **Authentication**

- **Sign Up**: `supabase.auth.signUp({ email, password })`
- **Sign In**: `supabase.auth.signInWithPassword({ email, password })`
- **Sign Out**: `supabase.auth.signOut()`
- **Session Management**: `supabase.auth.getSession()`

#### **Error Handling**

- **Try-Catch Blocks**: All API calls wrapped in try-catch
- **Error Messages**: User-friendly error messages
- **Validation**: Input validation before API calls
- **Error Logging**: Errors logged for debugging

**Reference**: 
- Supabase client: `lib/supabase-client.ts`
- Data store: `lib/data-store.tsx` (API operations)
- Authentication: `lib/auth-context.tsx`

---

### **Q3: How is authentication handled?**

**Answer**: Authentication in BakeSync ERP is handled through **Supabase Auth** with email/password authentication, session management, and role-based access.

#### **Authentication Flow**

1. **User Registration**:
   - User signs up with email and password
   - Supabase creates user account
   - Email verification sent
   - User profile created in `profiles` table

2. **Email Verification**:
   - User receives verification code
   - Enters code to verify email
   - Account activated

3. **Login**:
   - User enters email and password
   - Supabase authenticates credentials
   - Session created with JWT token
   - User redirected to dashboard

4. **Session Management**:
   - JWT token stored in browser
   - Session validated on each request
   - Automatic session refresh
   - Session timeout after inactivity

#### **Role-Based Access**

- **Role Assignment**: Roles assigned via `bakeshop_memberships` table
- **Permission Checking**: `lib/permissions.ts` checks user permissions
- **Route Protection**: `components/protected-route.tsx` protects routes
- **RLS Policies**: Database-level role enforcement

#### **Security Features**

- **Password Hashing**: Secure password hashing (handled by Supabase)
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Secure session handling
- **Email Verification**: Required email verification

**Reference**: 
- Authentication context: `lib/auth-context.tsx`
- User management: `lib/user-management.ts`
- Protected routes: `components/protected-route.tsx`
- Permissions: `lib/permissions.ts`

---

### **Q4: How are server-side functions implemented?**

**Answer**: Server-side functions in BakeSync ERP are implemented through **PostgreSQL database functions**, Next.js API routes, and server actions.

#### **Database Functions (PostgreSQL)**

**Team Invitations**:
- `create_team_invitation()`: Creates secure team invitations with tokens
- `accept_team_invitation(token)`: Accepts invitations and creates memberships

**Activity Logging**:
- `log_user_activity()`: Logs user activities with metadata

**Notifications**:
- `create_notification()`: Creates notifications for users

**Dashboard Data**:
- `get_user_dashboard_data()`: Aggregates dashboard data

**Maintenance**:
- `cleanup_expired_notifications()`: Cleans up expired data

#### **Next.js API Routes**

- **Server-Side Rendering**: Next.js handles server-side rendering
- **API Routes**: Custom API routes for specific operations
- **Server Actions**: Server actions for form submissions

#### **Server-Side Supabase Client**

- **Server Client**: `lib/supabase-server.ts` creates server-side client
- **Cookie-Based Sessions**: Server client uses cookies for session management
- **Server-Side Operations**: Database operations from server-side code

**Reference**: 
- Supabase server: `lib/supabase-server.ts`
- Database functions: Referenced in `documents/setup/SIGNUP_ONBOARDING_SETUP.md`
- Server actions: Used in form submissions throughout the application

---

### **Q5: How is error handling managed?**

**Answer**: Error handling in BakeSync ERP is managed through **try-catch blocks**, validation, user-friendly error messages, and error logging.

#### **Error Handling Strategy**

**Try-Catch Blocks**:
- All async operations wrapped in try-catch
- Errors caught and handled gracefully
- User-friendly error messages displayed

**Validation**:
- Input validation before operations
- Type checking with TypeScript
- Business rule validation
- Database constraint validation

**Error Messages**:
- User-friendly error messages
- Context-specific error messages
- Clear error guidance
- No technical jargon in user-facing errors

**Error Logging**:
- Errors logged for debugging
- Error tracking for monitoring
- Error context preserved
- Error reporting for improvements

#### **Error Types**

**Authentication Errors**:
- Invalid credentials
- Session expired
- Email verification required

**Validation Errors**:
- Required fields missing
- Invalid data format
- Business rule violations

**Database Errors**:
- Connection errors
- Constraint violations
- Query errors

**Network Errors**:
- Connection timeouts
- Server errors
- Retry logic for transient errors

**Reference**: 
- Error handling: Throughout `lib/data-store.tsx`
- Validation: Input validation in forms and components
- Error messages: User-friendly messages in UI components

---

### **Q6: What is the data flow architecture?**

**Answer**: The data flow architecture in BakeSync ERP follows a **client → Next.js API → Supabase → PostgreSQL** pattern with caching and real-time updates.

#### **Request Flow**

1. **Client Request**:
   - User interacts with UI
   - React component triggers action
   - Data store method called

2. **Next.js Processing**:
   - Client-side or server-side processing
   - Authentication validation
   - Permission checking

3. **Supabase API**:
   - Supabase client makes API call
   - Authentication token included
   - Request sent to Supabase backend

4. **PostgreSQL Database**:
   - Supabase processes request
   - RLS policies applied
   - Query executed on PostgreSQL
   - Results returned

5. **Response Handling**:
   - Data returned to client
   - State updated in React
   - UI updated with new data

#### **Response Handling**

- **Success Responses**: Data returned and state updated
- **Error Responses**: Errors caught and displayed to user
- **Loading States**: Loading indicators during requests
- **Optimistic Updates**: UI updated optimistically, then confirmed

#### **Caching Strategy**

- **Client-Side Caching**: React state caching
- **Data Store Caching**: Centralized data store caches data
- **Query Optimization**: Efficient queries to minimize database load

#### **Real-Time Updates**

- **Supabase Subscriptions**: Real-time subscriptions for live updates
- **Automatic Sync**: Data automatically synced across clients
- **Live Updates**: UI updates automatically when data changes

**Reference**: 
- Data flow: `lib/data-store.tsx` (data operations)
- Supabase client: `lib/supabase-client.ts`
- Real-time: Supabase real-time subscriptions (where implemented)

---

## Conclusion

This Technical Q&A document provides comprehensive answers to questions about BakeSync ERP's technical implementation, covering SDLC methodology, workflows, database architecture, and backend systems. All answers are based on actual codebase implementation and can be verified through the referenced files and documentation.

For additional technical details, refer to:
- Implementation documentation: `documents/implementation/`
- Feature specifications: `documents/features/BAKESYNC_FEATURES.md`
- Setup guides: `documents/setup/`
- Codebase: `lib/`, `components/`, `app/` directories

