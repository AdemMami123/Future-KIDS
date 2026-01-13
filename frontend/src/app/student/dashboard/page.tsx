'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentDashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-green-600" />
                <span className="text-xl font-bold text-gray-800">EduQuiz</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
                <button
                  onClick={() => router.push('/dashboard/student/settings')}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Parent Links
                </button>
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
              Welcome, {user?.firstName}! 📚
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Student Dashboard
              </h2>
              <p className="text-green-800 mb-4">
                Your learning journey starts here. Manage parent account links and track your progress.
              </p>
              <button
                onClick={() => router.push('/dashboard/student/settings')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Manage Parent Links
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
