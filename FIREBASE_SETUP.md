# Firebase Setup Guide

Complete guide for setting up Firebase for the Educational Quiz Platform.

## 🔥 Overview

This project uses Firebase for:
- **Frontend**: Firebase Web SDK for authentication and client-side database access
- **Backend**: Firebase Admin SDK for server-side operations and user management

---

## 📱 Frontend Firebase Setup

### 1. Get Firebase Web Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **future-childs**
3. Click the gear icon (⚙️) > **Project Settings**
4. Scroll to "Your apps" section
5. Select the web app or create one
6. Copy the configuration object

### 2. Configure Frontend Environment Variables

Create `.env.local` in the `frontend` directory:

```env
# Firebase Web SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBaUINuauDFV4OcxaZf15QnBW6yaFjObcE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=future-childs.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=future-childs
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=future-childs.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=394664103940
NEXT_PUBLIC_FIREBASE_APP_ID=1:394664103940:web:63ab5d351652b1d6be6551
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7WLQQX2M3Z

# Backend API URLs
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 3. Frontend Firebase Features

The frontend configuration ([frontend/src/config/firebase.ts](frontend/src/config/firebase.ts)) provides:

#### Authentication Functions
- `signUp(email, password, displayName)` - Create new user account
- `signIn(email, password)` - Sign in existing user
- `logOut()` - Sign out current user
- `resetPassword(email)` - Send password reset email
- `updateUserProfile(updates)` - Update user display name or photo
- `getCurrentUserToken()` - Get ID token for API authentication

#### Firebase Instances
- `auth` - Firebase Authentication instance
- `db` - Firestore database instance
- `analytics` - Firebase Analytics (browser only)
- `app` - Firebase app instance

#### Example Usage

```typescript
import { signIn, getCurrentUserToken } from '@/config/firebase';

// Sign in user
const userCredential = await signIn('user@example.com', 'password123');

// Get ID token for API calls
const token = await getCurrentUserToken();

// Make authenticated API request
const response = await fetch('http://localhost:5000/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🔐 Backend Firebase Admin Setup

### 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **future-childs**
3. Click the gear icon (⚙️) > **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file securely

### 2. Configure Backend (Two Options)

#### Option A: Using Service Account JSON File (Development)

1. Save the JSON file as `serviceAccountKey.json` in `backend/` directory
2. Add to `backend/.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ```

**Pros**: Easy setup, all credentials in one file
**Cons**: File must be kept secure, not suitable for production

#### Option B: Using Environment Variables (Production)

1. Extract values from the service account JSON:
   - `project_id`
   - `private_key`
   - `client_email`

2. Add to `backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=future-childs
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...your-key...avw==\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@future-childs.iam.gserviceaccount.com
   ```

**Important Notes**:
- Keep quotes around `FIREBASE_PRIVATE_KEY`
- Preserve all `\n` characters (newlines)
- The key must start with `-----BEGIN PRIVATE KEY-----\n`
- The key must end with `\n-----END PRIVATE KEY-----\n`

**Pros**: No files to manage, secure for production
**Cons**: Requires careful formatting

### 3. Backend Firebase Features

The backend configuration ([backend/src/config/firebase.ts](backend/src/config/firebase.ts)) provides:

#### Admin SDK Instances
- `firestore` - Firestore Admin for database operations
- `auth` - Authentication Admin for user management
- `realtimeDb` - Realtime Database for live game sessions
- `firebaseAdmin` - Full admin SDK instance

#### Example Usage

```typescript
import { firestore, auth } from './config/firebase';

// Create user profile in Firestore
await firestore.collection('users').doc(userId).set({
  email: 'user@example.com',
  role: 'teacher',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date()
});

// Verify ID token from frontend
const decodedToken = await auth.verifyIdToken(idToken);
const userId = decodedToken.uid;

// Set custom claims (for role-based access)
await auth.setCustomUserClaims(userId, { role: 'teacher' });
```

---

## 🔥 Enable Firebase Services

### 1. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** provider
5. Save changes

### 2. Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll add security rules later)
4. Select a location (choose closest to your users)
5. Click **Enable**

### 3. Create Realtime Database (for live games)

1. In Firebase Console, go to **Realtime Database**
2. Click **Create Database**
3. Choose **Start in locked mode**
4. Select same location as Firestore
5. Click **Enable**

### 4. Enable Storage (Optional)

For profile pictures and quiz images:

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Choose **Start in production mode**
4. Click **Done**

---

## 🔒 Firebase Security Rules

### Firestore Security Rules

Add these rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to get user role
    function getUserRole() {
      return request.auth.token.role;
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isAuthenticated() && request.auth.uid == userId;
      // Only the user can update their own profile
      allow update: if isAuthenticated() && request.auth.uid == userId;
      // Admins/backend can create users
      allow create: if isAuthenticated();
    }
    
    // Classes collection
    match /classes/{classId} {
      // Teachers can read/write their own classes
      allow read, write: if isAuthenticated() && 
        (getUserRole() == 'teacher' || getUserRole() == 'student');
    }
    
    // Quizzes collection
    match /quizzes/{quizId} {
      // Teachers can create and manage their quizzes
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && getUserRole() == 'teacher';
    }
    
    // Game sessions
    match /gameSessions/{sessionId} {
      allow read, write: if isAuthenticated();
    }
    
    // Quiz attempts
    match /quizAttempts/{attemptId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && 
        (getUserRole() == 'student' || getUserRole() == 'teacher');
    }
    
    // Parent-child links
    match /parentChildLinks/{linkId} {
      allow read, write: if isAuthenticated() &&
        (getUserRole() == 'parent' || getUserRole() == 'student');
    }
  }
}
```

### Realtime Database Rules

Add these rules in Firebase Console > Realtime Database > Rules:

```json
{
  "rules": {
    "gameSessions": {
      "$sessionId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---

## 🚀 Testing Firebase Connection

### Test Frontend Connection

Create a test file `frontend/src/app/test-firebase/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function TestFirebase() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test auth
        console.log('Auth instance:', auth);
        
        // Test Firestore (try to read from a collection)
        const snapshot = await getDocs(collection(db, 'users'));
        console.log('Firestore connected, docs:', snapshot.size);
        
        setStatus('✅ Firebase connected successfully!');
      } catch (error) {
        console.error('Firebase error:', error);
        setStatus('❌ Firebase connection failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
      <p className="text-lg">{status}</p>
    </div>
  );
}
```

Visit `http://localhost:3000/test-firebase` to test.

### Test Backend Connection

Run the backend server and check the logs:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Firebase Admin SDK initialized with environment variables
```

Or if using service account file:
```
✅ Firebase Admin SDK initialized with service account file
```

---

## 🔐 Security Best Practices

### 1. Protect Sensitive Files

**Backend:**
- Never commit `serviceAccountKey.json` to git
- Never commit `.env` file
- Use `.env.example` as a template

**Frontend:**
- Never commit `.env.local` to git
- Public Firebase config keys are safe to expose (they're meant to be public)
- Security is enforced by Firebase Security Rules

### 2. Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Production:**
```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### 3. Rotate Keys Regularly

- Regenerate service account keys periodically
- Update environment variables in production
- Remove old keys from Firebase Console

---

## 🆘 Troubleshooting

### "Failed to initialize Firebase Admin SDK"

**Solution:**
1. Check that `.env` file exists in backend directory
2. Verify environment variables are set correctly
3. Ensure private key formatting is correct (with `\n`)
4. Try using service account JSON file instead

### "Permission denied" in Firestore

**Solution:**
1. Check Firebase Security Rules
2. Verify user is authenticated
3. Ensure custom claims are set correctly
4. Check that user role matches rule requirements

### "Invalid API key" on frontend

**Solution:**
1. Verify all `NEXT_PUBLIC_` environment variables are set
2. Restart Next.js dev server after changing `.env.local`
3. Check that API key matches Firebase Console

### Authentication works but database access fails

**Solution:**
1. Check Firestore Security Rules
2. Verify user has required custom claims
3. Make sure database is created in Firebase Console
4. Check network requests in browser DevTools

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK Reference](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

## ✅ Setup Checklist

### Frontend
- [ ] Firebase Web SDK configuration created
- [ ] `.env.local` file created with Firebase config
- [ ] `.env.example` file updated
- [ ] Firebase config file created at `src/config/firebase.ts`
- [ ] Test page created and verified connection

### Backend
- [ ] Firebase Admin SDK configured
- [ ] `.env` file created with credentials
- [ ] Service account key obtained (if using file method)
- [ ] Firebase config file exists at `src/config/firebase.ts`
- [ ] Server starts without errors

### Firebase Console
- [ ] Email/Password authentication enabled
- [ ] Firestore Database created
- [ ] Realtime Database created
- [ ] Security rules configured
- [ ] Service account key generated

### Security
- [ ] `.gitignore` includes `.env` and `.env.local`
- [ ] Service account JSON file added to `.gitignore`
- [ ] Security rules tested and working
- [ ] No credentials committed to git

---

**Current Configuration Status:**
- ✅ Firebase project: `future-childs`
- ✅ Frontend configuration: Ready
- ✅ Backend configuration: Ready
- ✅ Service account credentials: Configured

You're all set to start building! 🚀
