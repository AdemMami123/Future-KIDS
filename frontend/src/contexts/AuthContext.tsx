'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import Cookies from 'js-cookie';

// User role type
export type UserRole = 'teacher' | 'student' | 'parent';

// Extended user data type
export interface UserData {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  schoolId?: string;
  subjects?: string[];
  grade?: string;
  classId?: string;
  parentIds?: string[];
  childrenIds?: string[];
}

// Sign up data type
export interface SignUpData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  schoolId?: string;
  subjects?: string[];
  grade?: string;
  classId?: string;
}

// Auth context type
interface AuthContextType {
  user: UserData | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserData>) => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch user profile from backend
  const fetchUserProfile = useCallback(async (idToken: string) => {
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      if (data.success && data.data.user) {
        setUser(data.data.user);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
    }
  }, []);

  // Send ID token to backend and set cookie
  const sendTokenToBackend = useCallback(async (idToken: string) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to authenticate');
      }

      if (data.success && data.data.user) {
        setUser(data.data.user);
        return data.data.user;
      }
    } catch (error: any) {
      console.error('Error sending token to backend:', error);
      throw error;
    }
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Send to backend to set cookie and get user profile
          await sendTokenToBackend(idToken);
        } catch (error: any) {
          console.error('Error in auth state change:', error);
          setError(error.message);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [sendTokenToBackend]);

  // Sign up function
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      setLoading(true);
      setError(null);

      // Register with backend (creates both Firebase Auth and Firestore user)
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      if (result.success && result.data.user) {
        // Sign in with Firebase to get auth state
        await signInWithEmailAndPassword(auth, data.email, data.password);
        
        setUser(result.data.user);

        // Redirect based on role
        redirectBasedOnRole(result.data.user.role);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Send token to backend and get user profile
      const userData = await sendTokenToBackend(idToken);

      if (userData) {
        // Redirect based on role
        redirectBasedOnRole(userData.role);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = 'Failed to sign in';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sendTokenToBackend, router]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Sign out from backend (clears cookie)
      await fetch(`${API_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Sign out from Firebase
      await firebaseSignOut(auth);

      // Clear local state
      setUser(null);
      setFirebaseUser(null);

      // Redirect to login
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile function
  const updateUserProfile = useCallback(async (updates: Partial<UserData>) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      if (result.success && result.data.user) {
        setUser(result.data.user);

        // Update Firebase display name if firstName or lastName changed
        if ((updates.firstName || updates.lastName) && firebaseUser) {
          await updateProfile(firebaseUser, {
            displayName: `${result.data.user.firstName} ${result.data.user.lastName}`,
          });
        }
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'teacher':
        router.push('/teacher/dashboard');
        break;
      case 'student':
        router.push('/student/dashboard');
        break;
      case 'parent':
        router.push('/parent/dashboard');
        break;
      default:
        router.push('/');
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
