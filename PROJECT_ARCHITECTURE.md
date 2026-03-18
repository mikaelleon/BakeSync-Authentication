# BakeSync Project Architecture Documentation

This document provides a comprehensive overview of all important files in the BakeSync ERP project, organized by their purpose and importance for future improvements.

## Table of Contents

1. [Core Application Files](#core-application-files)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Management](#data-management)
4. [UI Components](#ui-components)
5. [Pages & Routes](#pages--routes)
6. [Configuration Files](#configuration-files)
7. [Database & Schema](#database--schema)
8. [Testing](#testing)
9. [Documentation](#documentation)

---

## Core Application Files

### `/lib/types.ts`
**Purpose**: Central TypeScript type definitions for the entire application.

**Key Types**:
- `Recipe`, `Ingredient`, `InventoryItem`, `ProductionLog`
- `Supplier`, `PurchaseOrder`, `Product`, `Sale`
- `User`, `Bakeshop`, `TeamMember`
- Role types: `"owner" | "baker" | "cashier"`

**Why Important**: 
- Single source of truth for all data structures
- Ensures type safety across the application
- Critical for maintaining consistency when adding new features
- **Future Improvements**: Add JSDoc comments for each type, consider using Zod schemas for runtime validation

---

### `/lib/data-store.tsx`
**Purpose**: Centralized state management using React Context API. Manages all application data (recipes, inventory, suppliers, sales, etc.).

**Key Features**:
- Provides `useDataStore()` hook for accessing data
- Handles CRUD operations for all entities
- Environment-aware data loading (demo vs production)
- Automatic inventory updates from production logs and sales
- Product stock synchronization with inventory

**Key Functions**:
- `loadDataOnDemand(dataType)` - Lazy loading for performance
- `addRecipe()`, `updateRecipe()`, `deleteRecipe()`
- `addInventoryItem()`, `updateInventoryItem()`, `bulkUpdateInventory()`
- `addProductionLog()` - Automatically deducts raw materials and adds finished goods
- `addSale()` - Automatically deducts finished goods from inventory
- `syncProductStockWithInventory()` - Keeps POS products in sync with inventory

**Why Important**:
- Centralized data management prevents duplication
- Single point of truth for all data operations
- Critical for maintaining data consistency
- **Future Improvements**: 
  - Add optimistic updates for better UX
  - Implement caching layer
  - Add data validation before mutations
  - Consider migrating to Zustand or Redux for better performance

---

### `/lib/environment-data-loader.ts`
**Purpose**: Environment-aware data loading system that handles demo vs production data fetching.

**Key Features**:
- Detects if user is demo account
- Loads from Supabase for production, mock data for demo
- Handles bakeshop-specific data filtering
- Provides `DataLoadingResult<T>` for consistent return types

**Key Methods**:
- `loadRecipes()`, `loadInventory()`, `loadSuppliers()`, `loadPurchaseOrders()`
- `loadProducts()`, `loadSales()`, `loadProductionLogs()`
- `getBakeshopInfo()` - Gets bakeshop details including currency

**Why Important**:
- Enables seamless switching between demo and production
- Handles data isolation per bakeshop
- **Future Improvements**:
  - Add data caching to reduce database queries
  - Implement pagination for large datasets
  - Add data prefetching strategies

---

### `/lib/auth-context.tsx`
**Purpose**: Authentication context provider managing user sessions, login, signup, and user state.

**Key Features**:
- `useAuth()` hook for accessing auth state
- `login()`, `signup()`, `logout()` functions
- `loadUserProfile()` - Loads user with bakeshop info
- `updateUser()` - Updates user state without conflicts
- Handles redirects based on onboarding status

**Why Important**:
- Central authentication management
- Critical for security and user session handling
- **Future Improvements**:
  - Add token refresh logic
  - Implement session timeout handling
  - Add multi-factor authentication support
  - Improve error handling and retry logic

---

## Authentication & Authorization

### `/components/protected-route.tsx`
**Purpose**: Route protection component that checks authentication and permissions before rendering pages.

**Key Features**:
- Checks if user is authenticated
- Verifies user has required permissions
- Redirects to login if not authenticated
- Redirects to onboarding if not completed
- Handles session loading states

**Why Important**:
- Security layer for protected routes
- Ensures proper access control
- **Future Improvements**:
  - Add role-based route protection
  - Implement permission caching
  - Add audit logging for access attempts

---

### `/components/slug-route-handler.tsx`
**Purpose**: Handles routing logic for slug-based URLs, ensuring users access the correct bakeshop's dashboard.

**Key Features**:
- Validates bakeshop slugs
- Redirects to correct bakeshop if needed
- Handles session loading

**Why Important**:
- Multi-tenant routing support
- **Future Improvements**:
  - Add slug validation caching
  - Improve error handling for invalid slugs

---

### `/lib/permissions.ts`
**Purpose**: Defines permission system for role-based access control.

**Key Features**:
- Permission definitions for each role
- Permission checking functions

**Why Important**:
- Centralized permission management
- **Future Improvements**:
  - Add granular permissions
  - Implement permission inheritance
  - Add permission groups

---

## Data Management

### `/lib/currency-utils.ts`
**Purpose**: Currency formatting and information utilities.

**Key Features**:
- `formatCurrency()` - Formats numbers with currency symbols
- `getCurrencyInfo()` - Gets currency details
- `getCurrencySymbol()` - Gets currency symbol
- Supports multiple currencies (PHP, USD, EUR, GBP, CAD, AUD, JPY, SGD)

**Why Important**:
- Consistent currency display across the app
- Dynamic currency based on bakeshop settings
- **Future Improvements**:
  - Add currency conversion rates
  - Support for more currencies
  - Add currency formatting options (locale-specific)

---

### `/lib/translations.ts`
**Purpose**: Centralized translation system for UI text (English and Tagalog).

**Key Features**:
- `t` object with all translations
- Organized by feature (onboarding, dashboard, etc.)
- Easy to extend with new languages

**Why Important**:
- Internationalization support
- **Future Improvements**:
  - Migrate to i18n library (react-i18next)
  - Add more languages
  - Implement dynamic language switching

---

### `/lib/user-management.ts` & `/lib/user-management-enhanced.ts`
**Purpose**: User profile management and bakeshop membership handling.

**Key Features**:
- `getUserProfile()` - Gets user profile with role
- `createOrUpdateUserProfile()` - Creates/updates user profile
- Handles bakeshop memberships

**Why Important**:
- User data management
- **Future Improvements**:
  - Add user profile caching
  - Implement profile picture upload
  - Add user preferences management

---

### `/lib/team-management.ts`
**Purpose**: Team member management, invitations, and activity tracking.

**Key Features**:
- `getTeamMembers()` - Gets all team members
- `getTeamStats()` - Gets team statistics
- `getTeamActivity()` - Gets team activity logs
- Handles team invitations

**Why Important**:
- Multi-user collaboration features
- **Future Improvements**:
  - Add real-time team updates
  - Implement team roles and permissions
  - Add team activity notifications

---

## UI Components

### `/components/onboarding/enhanced-onboarding.tsx`
**Purpose**: Main onboarding component with multi-step wizard.

**Key Features**:
- Multi-step form wizard
- Role-based onboarding flows
- Creates bakeshop and membership
- Handles form validation
- Uses translations

**Why Important**:
- First user experience
- Critical for user setup
- **Future Improvements**:
  - Add progress saving
  - Implement step validation
  - Add onboarding analytics

---

### `/components/dashboard/enhanced-dashboard.tsx`
**Purpose**: Main dashboard component displaying metrics and KPIs.

**Key Features**:
- Displays sales, inventory, production metrics
- Shows team activity
- Currency-aware displays
- Real-time data loading

**Why Important**:
- Main entry point for users
- **Future Improvements**:
  - Add customizable widgets
  - Implement dashboard layouts
  - Add data export functionality

---

### `/components/inventory-table.tsx`
**Purpose**: Reusable inventory table component with selection and bulk actions.

**Key Features**:
- Select all functionality
- Bulk operations
- Filtering and sorting
- Type-safe with React.forwardRef

**Why Important**:
- Reusable component
- **Future Improvements**:
  - Add column customization
  - Implement virtual scrolling for large datasets
  - Add export functionality

---

### `/components/ui/`
**Purpose**: shadcn/ui component library - reusable UI primitives.

**Key Components**:
- `button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`
- `table.tsx`, `tabs.tsx`, `select.tsx`, `checkbox.tsx`
- All components use Radix UI primitives

**Why Important**:
- Consistent UI across the app
- Accessible components
- **Future Improvements**:
  - Add dark mode support
  - Implement component variants
  - Add animation library

---

## Pages & Routes

### `/app/[slug]/dashboard/page.tsx`
**Purpose**: Dashboard page route.

**Why Important**:
- Main application entry point
- **Future Improvements**: Add route-level data fetching

---

### `/app/[slug]/recipes/page.tsx`
**Purpose**: Recipe listing page with search and filtering.

**Key Features**:
- Recipe grid display
- Search functionality
- Role-based filtering
- Create/edit/delete recipes

**Why Important**:
- Core feature page
- **Future Improvements**:
  - Add recipe categories
  - Implement recipe sharing
  - Add recipe versioning

---

### `/app/[slug]/inventory/page.tsx`
**Purpose**: Inventory management page.

**Key Features**:
- Raw materials and finished goods tabs
- Bulk operations with comprehensive validation
- Low stock alerts
- Expiration date tracking
- Real-time updates
- Duplicate prevention
- Price management for finished goods
- Role-based access control (bakers see only raw materials)

**Data Flow**:
1. Inventory items automatically sync with POS products (finished goods)
2. Production logs update inventory quantities
3. Sales automatically deduct from inventory
4. Purchase orders add items to inventory on receipt

**Validation**:
- Required field validation
- Numeric input validation
- Duplicate item prevention (updates quantity instead)
- Bulk edit validation (prevents negative quantities)
- Price validation for finished goods

**Why Important**:
- Core feature page
- Foundation for POS and production modules
- **Recent Improvements** (January 2025):
  - ✅ Enhanced bulk edit validation
  - ✅ Improved error handling
  - ✅ Better duplicate prevention
- **Future Improvements**:
  - Add inventory forecasting
  - Implement barcode scanning
  - Add inventory reports
  - Automated reorder points

---

### `/app/[slug]/pos/page.tsx`
**Purpose**: Point of Sale system.

**Key Features**:
- Product grid with categories
- Shopping cart with real-time stock validation
- Multiple payment methods (cash, card, GCash)
- Stock validation before payment processing
- Payment amount validation for cash transactions
- Transaction history
- Real-time inventory updates
- Automatic product synchronization with inventory
- Receipt generation with print functionality
- Cart management with stock-aware updates

**Data Flow**:
1. Products sync automatically with finished goods inventory
2. Cart items validated against current stock before payment
3. Sales automatically update inventory and product stock
4. Production logs trigger product creation/updates

**Validation**:
- Stock availability checked before payment
- Payment amount validated for cash payments
- Cart validated before checkout
- Product stock synchronized with inventory changes

**Why Important**:
- Revenue-generating feature
- Critical for preventing overselling
- Ensures accurate inventory tracking
- **Recent Improvements** (January 2025):
  - ✅ Enhanced stock validation before payment
  - ✅ Payment amount validation
  - ✅ Improved error handling
  - ✅ Receipt printing functionality
- **Future Improvements**:
  - Implement barcode scanning
  - Add customer management
  - Add discount system
  - Receipt email functionality

---

### `/app/[slug]/production/page.tsx`
**Purpose**: Production logging and tracking.

**Key Features**:
- Log production batches
- View production history
- Automatic inventory updates

**Why Important**:
- Core operational feature
- **Future Improvements**:
  - Add production scheduling
  - Implement batch tracking
  - Add quality control features

---

### `/app/[slug]/financials/page.tsx`
**Purpose**: Financial analytics and expense/revenue tracking.

**Key Features**:
- Expense recording
- Revenue recording
- Financial metrics
- Currency-aware displays
- LocalStorage persistence

**Why Important**:
- Business intelligence feature
- **Future Improvements**:
  - Add financial reports
  - Implement budgeting
  - Add profit/loss statements
  - Add tax calculations

---

### `/app/[slug]/supply-chain/page.tsx`
**Purpose**: Supplier and purchase order management.

**Key Features**:
- Supplier management (CRUD operations)
- Purchase order creation with multiple items
- Order tracking with status management
- Delivery receiving with automatic inventory updates
- Status validation (prevents invalid transitions)
- Comprehensive error handling
- Detailed success/error feedback

**Data Flow**:
1. Purchase orders created with supplier and items
2. Orders tracked through status lifecycle (draft → pending → received)
3. Receiving delivery updates PO status and adds items to inventory
4. Inventory updates trigger product sync in POS

**Validation**:
- Order status validation (cannot receive already received/cancelled orders)
- Item validation before adding to inventory
- Supplier information validation
- Purchase order item validation

**Why Important**:
- Supply chain management
- Critical for inventory replenishment
- **Recent Improvements** (January 2025):
  - ✅ Enhanced delivery receiving validation
  - ✅ Improved error handling with toast notifications
  - ✅ Status transition validation
  - ✅ Detailed feedback for inventory updates
- **Future Improvements**:
  - Add supplier ratings
  - Implement order automation
  - Add delivery tracking
  - Purchase order templates

---

### `/app/login/page.tsx` & `/app/signup/page.tsx`
**Purpose**: Authentication pages.

**Why Important**:
- User entry points
- **Future Improvements**:
  - Add social login
  - Implement password reset
  - Add email verification flow

---

### `/app/onboarding/page.tsx`
**Purpose**: Onboarding page wrapper.

**Why Important**:
- User setup flow
- **Future Improvements**: Add onboarding analytics

---

## Configuration Files

### `/middleware.ts`
**Purpose**: Next.js middleware for route protection and slug validation.

**Key Features**:
- Validates bakeshop slugs
- Redirects invalid routes
- Handles static route redirects

**Why Important**:
- Security and routing logic
- **Future Improvements**:
  - Add rate limiting
  - Implement request logging
  - Add IP-based restrictions

---

### `/next.config.mjs`
**Purpose**: Next.js configuration.

**Key Settings**:
- ESLint and TypeScript errors ignored during builds
- Images unoptimized

**Why Important**:
- Build configuration
- **Future Improvements**:
  - Enable strict type checking
  - Add image optimization
  - Configure environment variables

---

### `/package.json`
**Purpose**: Project dependencies and scripts.

**Key Dependencies**:
- Next.js 14, React 18, TypeScript
- Supabase client
- Radix UI components
- Tailwind CSS
- Playwright for testing

**Why Important**:
- Dependency management
- **Future Improvements**:
  - Keep dependencies updated
  - Add dependency vulnerability scanning
  - Consider upgrading to Next.js 15

---

### `/tsconfig.json`
**Purpose**: TypeScript configuration.

**Why Important**:
- Type checking configuration
- **Future Improvements**:
  - Enable strict mode
  - Add path aliases
  - Configure module resolution

---

## Database & Schema

### `/docs/database/supabase-schema.sql`
**Purpose**: Complete Supabase database schema definition.

**Key Tables**:
- `profiles` - User profiles
- `bakeshops` - Bakeshop information
- `bakeshop_memberships` - User-bakeshop relationships
- `inventory` - Inventory items
- `recipes` - Recipe definitions
- `recipe_ingredients` - Recipe ingredients
- `production_logs` - Production batch logs
- `sales` - Sales transactions
- `products` - POS products
- `suppliers` - Supplier information
- `purchase_orders` - Purchase orders
- `purchase_order_items` - Purchase order line items
- `team_invitations` - Team invitation management
- `notifications` - User notifications
- `user_preferences` - User preferences
- `user_activity_logs` - Activity tracking

**Key Features**:
- Row Level Security (RLS) policies
- Triggers for automatic updates
- Foreign key constraints
- Indexes for performance

**Why Important**:
- Database structure documentation
- **Future Improvements**:
  - Add database migrations
  - Implement database versioning
  - Add database backup scripts
  - Optimize indexes

---

### `/docs/database/fix-bakeshop-memberships-rls.sql`
**Purpose**: SQL script to fix RLS policy recursion issues.

**Why Important**:
- Fixes critical security issues
- **Future Improvements**: Document all RLS policies

---

## Testing

### `/tests/`
**Purpose**: Playwright test suite with Page Object Model.

**Key Test Files**:
- `authentication.spec.ts` - Auth flow tests
- `dashboard-comprehensive.spec.ts` - Dashboard tests
- `recipe-views-comprehensive.spec.ts` - Recipe tests
- `inventory-management.spec.ts` - Inventory tests
- `pos-system.spec.ts` - POS tests
- `production-management.spec.ts` - Production tests
- `financials-management.spec.ts` - Financials tests

**Why Important**:
- Quality assurance
- Regression prevention
- **Future Improvements**:
  - Add E2E test coverage
  - Implement visual regression testing
  - Add performance testing
  - Add accessibility testing

---

## Documentation

### `/docs/`
**Purpose**: Project documentation.

**Key Files**:
- `database/README.md` - Database setup guide
- `database/supabase-schema.sql` - Database schema

**Why Important**:
- Developer onboarding
- **Future Improvements**:
  - Add API documentation
  - Create architecture diagrams
  - Add deployment guides

---

## Key Patterns & Best Practices

### 1. **Data Loading Pattern**
- Use `loadDataOnDemand()` for lazy loading
- Always check `Array.isArray()` before array operations
- Use `useRef` to prevent duplicate loads

### 2. **State Management Pattern**
- Use `useDataStore()` for global state
- Use local state for component-specific data
- Use `localStorage` for persistence when needed

### 3. **Error Handling Pattern**
- Always wrap async operations in try-catch
- Provide user-friendly error messages
- Log errors to console for debugging

### 4. **Type Safety Pattern**
- Define all types in `/lib/types.ts`
- Use TypeScript strict mode
- Avoid `any` types

### 5. **Component Pattern**
- Use functional components with hooks
- Extract reusable logic to custom hooks
- Use `React.forwardRef()` for ref forwarding

---

## Future Improvement Priorities

### High Priority
1. **Performance Optimization**
   - Implement data caching
   - Add pagination for large datasets
   - Optimize bundle size

2. **Error Handling**
   - Add global error boundary
   - Implement retry logic
   - Add error reporting (Sentry)

3. **Testing**
   - Increase test coverage
   - Add integration tests
   - Implement CI/CD pipeline

### Medium Priority
1. **Features**
   - Add reporting system
   - Implement analytics dashboard
   - Add mobile app support

2. **Security**
   - Add rate limiting
   - Implement audit logging
   - Add security headers

3. **Developer Experience**
   - Add Storybook for components
   - Implement code generation
   - Add development tools

### Low Priority
1. **Polish**
   - Add animations
   - Improve accessibility
   - Add dark mode

2. **Documentation**
   - Add API documentation
   - Create video tutorials
   - Add architecture diagrams

---

## Quick Reference

### Adding a New Feature
1. Define types in `/lib/types.ts`
2. Add data operations in `/lib/data-store.tsx`
3. Add data loading in `/lib/environment-data-loader.ts`
4. Create page in `/app/[slug]/feature-name/page.tsx`
5. Add translations in `/lib/translations.ts`
6. Add tests in `/tests/feature-name.spec.ts`

### Adding a New Page
1. Create page file in `/app/[slug]/page-name/page.tsx`
2. Add route protection with `<ProtectedRoute>`
3. Use `useDataStore()` for data
4. Add translations
5. Update sidebar navigation

### Adding a New Data Type
1. Add type definition in `/lib/types.ts`
2. Add CRUD operations in `/lib/data-store.tsx`
3. Add data loading in `/lib/environment-data-loader.ts`
4. Update database schema if needed
5. Add mock data in `/lib/mock-data.ts`

---

## Notes for Future Developers

1. **Always use TypeScript** - Avoid `any` types
2. **Follow the existing patterns** - Consistency is key
3. **Test your changes** - Run `pnpm test` before committing
4. **Update types** - Keep `/lib/types.ts` in sync
5. **Use translations** - Don't hardcode strings
6. **Handle errors gracefully** - Always provide user feedback
7. **Keep components small** - Extract reusable logic
8. **Document complex logic** - Add comments for future maintainers

---

**Last Updated**: 2025-01-10
**Maintained By**: BakeSync Development Team


