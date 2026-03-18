// tests/fixtures/test-data.ts
export const TestUsers = {
  owner: {
    email: 'owner@bakesync.com',
    password: 'owner123',
    role: 'owner',
    expectedSidebarItems: 8,
  },
  baker: {
    email: 'baker@bakesync.com',
    password: 'baker123',
    role: 'baker',
    expectedSidebarItems: 4,
  },
  cashier: {
    email: 'cashier@bakesync.com',
    password: 'cashier123',
    role: 'cashier',
    expectedSidebarItems: 3,
  },
  // User credentials for POS testing
  posUser: {
    email: 'shio@gmail.com',
    password: 'Shio@123',
    role: 'owner', // Assuming owner role based on access requirements
    expectedSidebarItems: 8,
  },
} as const;

export const InvalidCredentials = {
  email: 'invalid@example.com',
  password: 'wrongpassword',
} as const;

export const TestRoutes = {
  login: '/login',
  signup: '/signup',
  dashboard: (slug: string = 'demo') => `/${slug}/dashboard`,
  financials: (slug: string = 'demo') => `/${slug}/financials`,
  pos: (slug: string = 'demo') => `/${slug}/pos`,
  production: (slug: string = 'demo') => `/${slug}/production`,
} as const;

