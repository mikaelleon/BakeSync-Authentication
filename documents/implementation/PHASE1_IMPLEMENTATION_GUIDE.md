# Phase 1 Implementation Guide: Critical Foundation

## 🎯 **Overview**

Phase 1 establishes the critical foundation for User Registration & Onboarding Logic and URL Routing and Data Logic. This phase includes database schema updates, account type detection, and environment-based data loading.

## 📋 **What's Been Implemented**

### ✅ **Files Created:**
1. `phase1-database-updates.sql` - Database schema updates
2. `lib/account-detection.ts` - Account type detection utilities
3. `lib/onboarding-completion.ts` - Onboarding completion management
4. `lib/environment-data-loader.ts` - Environment-based data loading

---

## 🚀 **Step-by-Step Implementation Instructions**

### **STEP 1: Database Schema Updates**

#### **1.1 Run Database Migration**
```bash
# Navigate to your project directory
cd /home/dane/Downloads/bakesync-erp

# Connect to your Supabase project and run the migration
# In Supabase SQL Editor, copy and paste the contents of:
# phase1-database-updates.sql
```

**What this does:**
- Adds `slug` and `is_demo` fields to `bakeshops` table
- Creates `onboarding_completion` table for tracking onboarding progress
- Adds business slug generation function
- Creates onboarding completion management functions
- Updates demo bakeshop with proper slug

#### **1.2 Verify Database Changes**
```sql
-- Check if new fields were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bakeshops' 
AND column_name IN ('slug', 'is_demo');

-- Check if onboarding_completion table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'onboarding_completion';

-- Test slug generation function
SELECT generate_business_slug('My Awesome Bakery');
```

---

### **STEP 2: Install Dependencies (if needed)**

#### **2.1 Check Current Dependencies**
```bash
# Check if all required packages are installed
npm list @supabase/supabase-js
npm list date-fns
```

#### **2.2 Install Missing Dependencies**
```bash
# Install any missing packages
npm install @supabase/supabase-js date-fns
```

---

### **STEP 3: Update TypeScript Types**

#### **3.1 Update User Interface**
Add to `lib/auth-context.tsx`:
```typescript
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  email_confirmed_at?: string
  bakeshopId?: string  // Add this field
  bakeshopSlug?: string  // Add this field
}
```

#### **3.2 Update Auth Context**
Add bakeshop information loading to the auth context:
```typescript
// In lib/auth-context.tsx, add this import
import { getBakeshopInfo } from './environment-data-loader'

// Update the loadUserProfile function to include bakeshop info
const loadUserProfile = useCallback(async (userId: string) => {
  try {
    const userProfile = await userManager.getUserProfile(userId)
    
    if (userProfile) {
      // Get bakeshop information
      const bakeshopInfo = await getBakeshopInfo({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role
      })
      
      setUser({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        bakeshopId: bakeshopInfo?.id,
        bakeshopSlug: bakeshopInfo?.slug
      })
    }
  } catch (error) {
    console.error('Error loading user profile:', error)
  }
}, [])
```

---

### **STEP 4: Update Data Store**

#### **4.1 Integrate Environment Data Loader**
Update `lib/data-store.tsx`:
```typescript
// Add imports at the top
import { createDataLoader, getBakeshopInfo } from './environment-data-loader'
import { isDemoAccount } from './account-detection'

// Update the DataStoreProvider component
export function DataStoreProvider({ children }: { children: ReactNode }) {
  // ... existing state ...
  
  const { user } = useAuth()
  const [bakeshopInfo, setBakeshopInfo] = useState(null)
  
  // Load bakeshop info when user changes
  useEffect(() => {
    if (user) {
      getBakeshopInfo(user).then(setBakeshopInfo)
    } else {
      setBakeshopInfo(null)
    }
  }, [user])
  
  // Create data loader instance
  const dataLoader = createDataLoader(user, bakeshopInfo?.id)
  
  // Update load functions to use environment-aware loading
  const loadRecipes = async () => {
    if (!user) return
    
    const result = await dataLoader.loadRecipes()
    if (result.error) {
      throw new Error(result.error)
    }
    
    setRecipes(result.data)
  }
  
  // ... update other load functions similarly ...
}
```

---

### **STEP 5: Update Navigation System**

#### **5.1 Update Sidebar Navigation**
Update `components/app-sidebar.tsx`:
```typescript
// Add imports
import { generateUrlPath } from '@/lib/account-detection'

// Update navigation items to use dynamic URLs
const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard", // This will be dynamically generated
    icon: LayoutDashboard,
    permission: "viewDashboard" as const,
    category: "general",
  },
  // ... other items
]

// In the AppSidebar component, update the Link generation
{visibleItems.map((item) => {
  const Icon = item.icon
  const dynamicHref = generateUrlPath(item.href, user, bakeshopInfo)
  const isActive = pathname === dynamicHref

  return (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={dynamicHref}>
          <Icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})}
```

---

### **STEP 6: Update Protected Route Component**

#### **6.1 Add Onboarding Check**
Update `components/protected-route.tsx`:
```typescript
// Add imports
import { needsOnboarding } from '@/lib/onboarding-completion'
import { isDemoAccount } from '@/lib/account-detection'

// Update ProtectedRoute component
export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user needs onboarding (skip for demo accounts)
      if (!isDemoAccount(user)) {
        needsOnboarding(user).then(needsOnboarding => {
          if (needsOnboarding) {
            router.push('/onboarding')
            return
          }
          setOnboardingChecked(true)
        })
      } else {
        setOnboardingChecked(true)
      }
    }
  }, [user, isLoading, router])

  // ... rest of the component logic
}
```

---

### **STEP 7: Update Onboarding Page**

#### **7.1 Integrate Onboarding Completion**
Update `app/onboarding/page.tsx`:
```typescript
// Add imports
import { markOnboardingComplete, updateOnboardingProgress } from '@/lib/onboarding-completion'
import { generateBusinessSlug } from '@/lib/account-detection'

// Update the completeOnboarding function
const completeOnboarding = async () => {
  if (!user) return
  
  try {
    // Mark onboarding as complete
    await markOnboardingComplete(
      user.id,
      user.bakeshopId || 'default',
      onboardingData
    )
    
    // Clear onboarding data
    localStorage.removeItem('onboardingData')
    
    // Redirect to appropriate dashboard
    const redirectPath = isDemoAccount(user) 
      ? '/demo/dashboard' 
      : `/${user.bakeshopSlug}/dashboard`
    
    router.push(redirectPath)
  } catch (error) {
    console.error('Error completing onboarding:', error)
  }
}

// Update step completion
const nextStep = async () => {
  if (currentStep < 5) {
    // Save progress
    await updateOnboardingProgress(
      user.id,
      user.bakeshopId || 'default',
      currentStep,
      onboardingData
    )
    
    setCurrentStep(currentStep + 1)
  }
}
```

---

### **STEP 8: Test the Implementation**

#### **8.1 Test Demo Account**
```bash
# Start the development server
npm run dev

# Test with demo account
# Login: owner@bakesync.com / owner123
# Should access: /demo/dashboard
```

#### **8.2 Test Database Functions**
```sql
-- Test slug generation
SELECT generate_business_slug('My Awesome Bakery');
-- Should return: my-awesome-bakery

-- Test onboarding status
SELECT get_onboarding_status('your-user-id-here');

-- Test marking onboarding complete
SELECT mark_onboarding_complete('your-user-id-here', 'your-bakeshop-id-here', '{}');
```

#### **8.3 Verify Data Loading**
- Check that demo accounts load demo data
- Check that production accounts load their bakeshop data
- Verify data isolation between different bakeshops

---

### **STEP 9: Error Handling & Validation**

#### **9.1 Add Error Boundaries**
Create `components/error-boundary.tsx`:
```typescript
'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-muted-foreground">
              Please refresh the page or contact support if the problem persists.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### **9.2 Add Loading States**
Update components to show loading states while data is being fetched:
```typescript
// In data loading components
if (isLoading) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
```

---

### **STEP 10: Documentation & Cleanup**

#### **10.1 Update Documentation**
- Update README.md with new features
- Document the new database schema
- Create API documentation for new functions

#### **10.2 Code Cleanup**
```bash
# Run linting
npm run lint

# Fix any TypeScript errors
npm run build

# Run tests (if available)
npm test
```

---

## 🧪 **Testing Checklist**

### **Database Tests**
- [ ] Slug generation works correctly
- [ ] Onboarding completion tracking works
- [ ] Demo bakeshop has correct slug and flags
- [ ] RLS policies work correctly

### **Frontend Tests**
- [ ] Demo accounts access `/demo/*` routes
- [ ] Production accounts access `/{slug}/*` routes
- [ ] Onboarding completion redirects work
- [ ] Data loading is environment-aware
- [ ] Navigation generates correct URLs

### **Integration Tests**
- [ ] Complete user registration flow
- [ ] Onboarding completion flow
- [ ] Data isolation between bakeshops
- [ ] Demo vs production data separation

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Database Migration Fails**
**Solution:** Check if tables already exist and use `IF NOT EXISTS` clauses

### **Issue 2: TypeScript Errors**
**Solution:** Update type definitions and ensure all imports are correct

### **Issue 3: Data Not Loading**
**Solution:** Check RLS policies and ensure user has proper permissions

### **Issue 4: URL Generation Issues**
**Solution:** Verify bakeshop info is loaded correctly and slug generation works

---

## 📈 **Success Metrics**

After completing Phase 1, you should have:
- ✅ Database schema updated with new fields and tables
- ✅ Account type detection working
- ✅ Environment-based data loading implemented
- ✅ Onboarding completion tracking functional
- ✅ Business slug generation working
- ✅ Demo vs production data separation

---

## 🔄 **Next Steps**

Once Phase 1 is complete and tested, you can proceed to:
- **Phase 2:** User Registration & Onboarding Logic
- **Phase 3:** URL Routing Architecture
- **Phase 4:** Data Logic Implementation

---

## 📞 **Support**

If you encounter any issues during implementation:
1. Check the console for error messages
2. Verify database permissions and RLS policies
3. Ensure all TypeScript types are updated
4. Test with both demo and production accounts

**Phase 1 is now ready for implementation!** 🎉
