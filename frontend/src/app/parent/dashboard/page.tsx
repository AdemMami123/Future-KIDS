'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Users, LogOut, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ParentDashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={['parent']}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-xl font-bold text-gray-800">EduQuiz</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome, {user?.firstName}! 👨‍👩‍👧‍👦
            </h1>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-purple-900 mb-2">
                Parent Dashboard
              </h2>
              <p className="text-purple-800 mb-4">
                Manage your children&apos;s accounts and monitor their academic progress.
              </p>
              <button
                onClick={() => router.push('/dashboard/parent/children')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Manage Children
              </button>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Your Profile:</h3>
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
