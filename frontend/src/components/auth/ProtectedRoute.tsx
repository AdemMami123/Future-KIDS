'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If authentication is required but user is not logged in
      if (requireAuth && !user) {
        router.push('/auth/login');
        return;
      }

      // If user is logged in but doesn't have required role
      if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard
        switch (user.role) {
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
      }
    }
  }, [user, loading, requireAuth, allowedRoles, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return null; // Router will redirect
  }

  // If user doesn't have required role
  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Router will redirect
  }

  // User is authenticated and authorized
  return <>{children}</>;
}
