# 🔐 Authentication System - Complete Implementation Guide

## 📋 Overview

This document provides a comprehensive guide to the authentication system implemented for the Future Childs educational quiz platform. The system uses **Firebase Authentication** on the client-side and **JWT tokens stored in HTTP-only cookies** for secure session management.

---

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Authentication**: Firebase Authentication (client), JWT (server)
- **Database**: Firebase Firestore
- **Security**: HTTP-only cookies, CORS, bcrypt-like Firebase security

### Authentication Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │         │   Backend    │         │   Firebase  │
│  (Next.js)  │         │   (Express)  │         │   Services  │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                         │
       │  1. Sign Up/Login     │                         │
       ├──────────────────────>│                         │
       │                       │  2. Create User/Verify  │
       │                       ├────────────────────────>│
       │                       │                         │
       │                       │  3. Firebase User       │
       │                       │<────────────────────────┤
       │                       │                         │
       │                       │  4. Create JWT Token    │
       │                       │     (with role)         │
       │                       │                         │
       │  5. Set HTTP-only     │                         │
       │     Cookie + User Data│                         │
       │<──────────────────────┤                         │
       │                       │                         │
       │  6. Subsequent        │                         │
       │     Requests          │                         │
       │     (Cookie auto-sent)│                         │
       ├──────────────────────>│                         │
       │                       │  7. Verify JWT          │
       │                       │     Extract user info   │
       │                       │                         │
       │  8. Protected Data    │                         │
       │<──────────────────────┤                         │
```

---

## 📁 Backend Implementation

### 1. Authentication Middleware (`backend/src/middleware/auth.ts`)

#### Features:
- ✅ JWT token generation with 7-day expiry
- ✅ Token verification from HTTP-only cookies
- ✅ Role-based access control (RBAC)
- ✅ Optional authentication for public routes
- ✅ Firebase user validation

#### Key Functions:

**`generateToken(userId, email, role)`**
```typescript
// Creates JWT token with user data
const token = jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
```

**`verifyToken(req, res, next)`**
```typescript
// Middleware to verify JWT from cookies
// Attaches user data to req.user
// Returns 401 if token is invalid/expired
```

**`requireRole(...allowedRoles)`**
```typescript
// Middleware factory for role-based access
// Usage: requireRole('teacher', 'admin')
```

---

### 2. User Service (`backend/src/services/userService.ts`)

#### Features:
- ✅ Create user in both Firebase Auth and Firestore
- ✅ Get user profile from Firestore
- ✅ Update user profile with automatic Firebase sync
- ✅ Search users by email (for parent-child linking)
- ✅ Link parent to child accounts
- ✅ Get users by role

#### Key Functions:

**`createUserProfile(userData)`**
- Creates Firebase Auth user
- Stores profile in Firestore with role-specific fields
- Returns userId and user data

**`getUserProfile(userId)`**
- Retrieves user data from Firestore
- Returns complete user profile

**`updateUserProfile(userId, updates)`**
- Updates Firestore document
- Syncs displayName with Firebase Auth
- Returns updated user data

---

### 3. User Routes (`backend/src/routes/users.ts`)

#### Endpoints:

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/users/register` | No | Register new user |
| POST | `/api/users/login` | No | Login with Firebase ID token |
| POST | `/api/users/logout` | No | Clear auth cookie |
| GET | `/api/users/profile` | Yes | Get current user profile |
| PATCH | `/api/users/profile` | Yes | Update profile |
| GET | `/api/users/:userId` | Yes | Get user by ID |
| GET | `/api/users/role/:role` | Yes (Teacher) | Get users by role |
| DELETE | `/api/users/:userId` | Yes | Delete account |
| POST | `/api/users/search` | Yes (Parent) | Search user by email |

#### Example Request/Response:

**Register User:**
```bash
POST /api/users/register
Content-Type: application/json

{
  "email": "teacher@example.com",
  "password": "password123",
  "role": "teacher",
  "firstName": "John",
  "lastName": "Doe",
  "schoolId": "SCH12345",
  "subjects": ["Math", "Science"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "abc123...",
      "email": "teacher@example.com",
      "role": "teacher",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**Note:** A JWT token is automatically set as an HTTP-only cookie.

---

## 🎨 Frontend Implementation

### 1. AuthContext (`frontend/src/contexts/AuthContext.tsx`)

#### Features:
- ✅ Manages authentication state globally
- ✅ Handles Firebase client-side authentication
- ✅ Syncs with backend via JWT cookies
- ✅ Role-based routing after login
- ✅ Persistent authentication state
- ✅ Error handling and loading states

#### Available Functions:

```typescript
const {
  user,           // Current user data (UserData | null)
  firebaseUser,   // Firebase User object
  loading,        // Loading state (boolean)
  error,          // Error message (string | null)
  signUp,         // (data: SignUpData) => Promise<void>
  signIn,         // (email, password) => Promise<void>
  signOut,        // () => Promise<void>
  resetPassword,  // (email) => Promise<void>
  updateUserProfile, // (updates) => Promise<void>
  clearError,     // () => void
} = useAuth();
```

#### Usage Example:
```typescript
'use client';
import { useAuth } from '@/contexts/AuthContext';

export default function MyComponent() {
  const { user, signOut } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.firstName}!</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

---

### 2. Auth Components

#### **LoginForm** (`frontend/src/components/auth/LoginForm.tsx`)
- Email/password fields with validation
- Show/hide password toggle
- Error display
- Loading state
- Links to signup and forgot password

#### **SignUpForm** (`frontend/src/components/auth/SignUpForm.tsx`)
- **Multi-step wizard** (3 steps)
  - Step 1: Role selection (Teacher/Student/Parent)
  - Step 2: Account info (Email, Password)
  - Step 3: Personal details (Name, role-specific fields)
- Progress bar with visual feedback
- Role-specific fields:
  - Teacher: School ID, Subjects
  - Student: Grade, Class ID
  - Parent: (No additional fields)
- Validation at each step
- Animated transitions

#### **ProtectedRoute** (`frontend/src/components/auth/ProtectedRoute.tsx`)
- Wraps pages requiring authentication
- Role-based access control
- Automatic redirects:
  - Not logged in → `/auth/login`
  - Wrong role → Appropriate dashboard
- Loading state while checking auth

#### Usage:
```typescript
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function TeacherPage() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div>Teacher-only content</div>
    </ProtectedRoute>
  );
}
```

---

### 3. Auth Pages

#### **Login Page** (`/auth/login`)
- Clean, modern design
- Gradient background
- Centered login form
- Links to signup and password reset

#### **Signup Page** (`/auth/signup`)
- Multi-step registration wizard
- Role selection with icons
- Form validation
- Responsive design

#### **Forgot Password Page** (`/auth/forgot-password`)
- Email input
- Firebase password reset
- Success confirmation
- Back to login link

---

### 4. Dashboard Pages

#### **Teacher Dashboard** (`/teacher/dashboard`)
- Protected route (teachers only)
- Displays user profile
- Navigation with logout
- Placeholder for future features

#### **Student Dashboard** (`/student/dashboard`)
- Protected route (students only)
- Personalized welcome
- Quiz access placeholder

#### **Parent Dashboard** (`/parent/dashboard`)
- Protected route (parents only)
- Children monitoring placeholder

---

## 🔒 Security Features

### ✅ Implemented Security Measures

1. **HTTP-Only Cookies**
   - JWT tokens stored in HTTP-only cookies
   - Not accessible via JavaScript (XSS protection)
   - Automatic inclusion in requests

2. **CORS Configuration**
   ```typescript
   cors({
     origin: 'http://localhost:3000',
     credentials: true,
   })
   ```

3. **Password Security**
   - Firebase handles password hashing
   - Minimum 6 characters enforced
   - Secure password reset flow

4. **Token Expiration**
   - JWT tokens expire after 7 days
   - Automatic session timeout

5. **Role-Based Access Control**
   - Server-side role verification
   - Protected routes by role
   - Role stored in JWT payload

6. **Input Validation**
   - express-validator on all endpoints
   - Email format validation
   - Required field checks

7. **Firebase Admin SDK**
   - Server-side user verification
   - Token validation against Firebase
   - User existence checks

---

## 🚀 Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables** (`.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FIREBASE_PROJECT_ID=future-childs
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBaUINuauDFV4OcxaZf15QnBW6yaFjObcE
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=future-childs.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=future-childs
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=future-childs.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1058195717397
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1058195717397:web:e8d20bef22e7e7d7b23e1b
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-CGRK0PCMFG
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

---

## 🧪 Testing the Authentication

### Manual Testing Steps:

1. **Test Signup:**
   - Visit `http://localhost:3000/auth/signup`
   - Complete all 3 steps
   - Verify redirect to appropriate dashboard

2. **Test Login:**
   - Visit `http://localhost:3000/auth/login`
   - Enter credentials
   - Verify redirect based on role

3. **Test Protected Routes:**
   - Try accessing `/teacher/dashboard` without login → redirects to login
   - Login as student → try accessing teacher dashboard → redirects to student dashboard

4. **Test Logout:**
   - Click logout button
   - Verify cookie is cleared
   - Verify redirect to login page

5. **Test Password Reset:**
   - Visit `/auth/forgot-password`
   - Enter email
   - Check email for reset link

---

## 📊 User Data Schema

### UserData Type:
```typescript
interface UserData {
  userId: string;
  email: string;
  role: 'teacher' | 'student' | 'parent';
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Teacher-specific
  schoolId?: string;
  subjects?: string[];
  
  // Student-specific
  grade?: string;
  classId?: string;
  parentIds?: string[];
  
  // Parent-specific
  childrenIds?: string[];
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Problem:** `Access to fetch at 'http://localhost:5000/api/users/login' from origin 'http://localhost:3000' has been blocked by CORS`

**Solution:**
- Verify `FRONTEND_URL` in backend `.env`
- Ensure `credentials: true` in CORS config
- Check cookie settings: `sameSite: 'strict'` or `'lax'`

### Issue 2: Cookie Not Being Set
**Problem:** Cookie not appearing in browser

**Solution:**
- Verify `credentials: 'include'` in fetch requests
- Check cookie security settings (use `secure: false` in development)
- Ensure same domain (localhost:3000 → localhost:5000)

### Issue 3: Token Expired
**Problem:** `Session expired. Please log in again.`

**Solution:**
- JWT expires after 7 days
- User must re-login
- Consider implementing refresh tokens for better UX

### Issue 4: Firebase Initialization Error
**Problem:** Firebase configuration errors

**Solution:**
- Verify all Firebase environment variables
- Check private key formatting (must include `\n` for newlines)
- Ensure Firebase project is set up in console

---

## 🔄 Role-Based Routing

### Automatic Redirects After Login:

| Role | Redirect URL |
|------|--------------|
| Teacher | `/teacher/dashboard` |
| Student | `/student/dashboard` |
| Parent | `/parent/dashboard` |

### Implemented in:
- `AuthContext.tsx` → `redirectBasedOnRole()` function
- `ProtectedRoute.tsx` → Role verification
- Login/Signup success handlers

---

## 📈 Next Steps

### Recommended Enhancements:

1. **Refresh Tokens**
   - Implement token refresh mechanism
   - Extend session without re-login

2. **Email Verification**
   - Send verification email after signup
   - Require verification before access

3. **Two-Factor Authentication (2FA)**
   - Add optional 2FA for enhanced security
   - Use Firebase phone authentication

4. **Session Management**
   - Track active sessions
   - Allow users to view/revoke sessions
   - Force logout on all devices

5. **Password Strength Indicator**
   - Visual feedback on password strength
   - Requirements checklist

6. **Social Login**
   - Google Sign-In
   - Microsoft/GitHub OAuth

7. **Rate Limiting**
   - Limit login attempts
   - CAPTCHA after failed attempts

---

## 📚 API Documentation

### Complete Endpoint Reference:

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "teacher",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "idToken": "firebase-id-token-here"
}
```

#### Get Profile
```http
GET /api/users/profile
Cookie: authToken=jwt-token-here
```

#### Update Profile
```http
PATCH /api/users/profile
Content-Type: application/json
Cookie: authToken=jwt-token-here

{
  "firstName": "Jane",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### Logout
```http
POST /api/users/logout
Cookie: authToken=jwt-token-here
```

---

## ✅ Implementation Checklist

### Backend ✅
- [x] Authentication middleware with JWT
- [x] User service with Firestore operations
- [x] User routes (register, login, profile, etc.)
- [x] Cookie-parser integration
- [x] Role-based access control
- [x] Error handling

### Frontend ✅
- [x] AuthContext with state management
- [x] LoginForm component
- [x] SignUpForm component (multi-step)
- [x] ProtectedRoute component
- [x] Login page
- [x] Signup page
- [x] Forgot password page
- [x] Dashboard pages (teacher, student, parent)
- [x] AuthProvider in root layout

### Security ✅
- [x] HTTP-only cookies
- [x] JWT token validation
- [x] CORS configuration
- [x] Input validation
- [x] Firebase Admin SDK integration
- [x] Role verification

---

## 📝 Code Examples

### Protecting a Route:
```typescript
// In any page.tsx file
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      {/* Page content */}
    </ProtectedRoute>
  );
}
```

### Using Auth Context:
```typescript
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileButton() {
  const { user, signOut, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <span>{user?.firstName}</span>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls:
```typescript
const response = await fetch(`${API_URL}/users/profile`, {
  method: 'GET',
  credentials: 'include', // Important!
});
```

---

## 🎉 Conclusion

The authentication system is now **fully implemented** with:
- ✅ JWT tokens in HTTP-only cookies
- ✅ Multi-role support (Teacher, Student, Parent)
- ✅ Role-based routing
- ✅ Protected routes
- ✅ Modern, animated UI
- ✅ Comprehensive error handling
- ✅ Firebase integration (client + server)

You can now proceed with building the remaining features of the application on top of this solid authentication foundation!

---

**Created:** January 13, 2026  
**Last Updated:** January 13, 2026  
**Version:** 1.0.0
