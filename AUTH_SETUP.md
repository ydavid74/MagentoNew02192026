# Authentication Setup

This document explains the authentication system implemented in the Magento Admin application.

## Overview

The authentication system uses:

- **Supabase Auth** for user authentication
- **React Context** for state management
- **Route Guards** for protecting routes
- **Role-based access control** (admin vs employee)

## Components

### 1. AuthContext (`src/contexts/AuthContext.tsx`)

- Manages user session and profile data
- Provides authentication methods (signIn, signOut)
- Automatically fetches user profile on authentication
- Listens for auth state changes

### 2. AuthGuard (`src/components/guards/AuthGuard.tsx`)

- **AuthGuard**: Protects routes that require authentication
- **AdminGuard**: Protects routes that require admin role
- Redirects unauthenticated users to login page
- Shows loading states during authentication checks

### 3. SignInPage (`src/pages/auth/SignInPage.tsx`)

- Clean, responsive sign-in form
- Form validation and error handling
- Password visibility toggle
- Redirects to intended page after successful login

## Route Protection

### Public Routes

- `/auth/login` - Sign in page

### Protected Routes (Require Authentication)

- `/orders` - Order management
- `/orders/:id` - Order details
- `/shipping-list` - Shipping management

### Admin-Only Routes (Require Admin Role)

- `/diamonds` - Diamond inventory management
- `/import` - Data import functionality
- `/settings` - System settings

## User Roles

### Admin

- Full access to all features
- Can manage diamond inventory
- Can access system settings
- Can import data

### Employee

- Access to order management
- Access to shipping lists
- Cannot access admin-only features

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://lmmneblpwoqdxvlodatx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Database Setup

The authentication system requires:

- `auth.users` table (managed by Supabase)
- `public.profiles` table with role-based access
- Trigger function to create profiles automatically

### 3. Test Users

You can create test users using the SQL script in `scripts/create-test-user.sql`:

**Admin User:**

- Email: `admin@example.com`
- Password: `password123`
- Role: `admin`

**Employee User:**

- Email: `employee@example.com`
- Password: `password123`
- Role: `employee`

## Usage Examples

### Using Auth Context

```typescript
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, profile, signIn, signOut } = useAuth();

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <p>Role: {profile?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protecting Routes

```typescript
import { AuthGuard, AdminGuard } from '@/components/guards/AuthGuard';

// Protect any authenticated route
<AuthGuard>
  <MyProtectedComponent />
</AuthGuard>

// Protect admin-only routes
<AdminGuard>
  <AdminOnlyComponent />
</AdminGuard>
```

### Conditional Rendering

```typescript
import { useAuth } from "@/contexts/AuthContext";

function ConditionalComponent() {
  const { profile } = useAuth();

  return <div>{profile?.role === "admin" && <AdminOnlyFeature />}</div>;
}
```

## Security Features

1. **Session Management**: Automatic session persistence and refresh
2. **Route Protection**: Guards prevent unauthorized access
3. **Role-based Access**: Different permissions for different user types
4. **Secure Authentication**: Uses Supabase's secure auth system
5. **Automatic Redirects**: Users are redirected to login when needed

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists and has correct values
   - Restart your development server
2. **"Access Denied" errors**
   - Verify user has correct role in `profiles` table
   - Check if user profile was created automatically
3. **Login not working**
   - Verify user exists in `auth.users` table
   - Check if user has confirmed email
   - Ensure password is correct

### Debug Mode

You can add debug logging to the AuthContext:

```typescript
console.log("Auth state:", { user, profile, loading });
```

## Testing

1. **Test Authentication Flow**:
   - Try accessing protected routes without login
   - Sign in with valid credentials
   - Verify redirect to intended page
2. **Test Role-based Access**:
   - Sign in as employee, try accessing admin routes
   - Sign in as admin, verify full access
   - Test sign out functionality
3. **Test Session Persistence**:
   - Sign in, refresh page, verify still logged in
   - Close browser, reopen, verify session persists
