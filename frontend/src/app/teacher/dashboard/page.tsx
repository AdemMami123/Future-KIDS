'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { GraduationCap, LogOut } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-blue-600" />
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
              Welcome, Teacher {user?.firstName}! 🎓
            </h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Authentication Successful!
              </h2>
              <p className="text-blue-800 mb-4">
                Your teacher dashboard is ready. This is a placeholder page that will be replaced with
                the full teacher dashboard features including:
              </p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Create and manage quizzes</li>
                <li>Start live game sessions</li>
                <li>View student performance</li>
                <li>Manage classes</li>
              </ul>
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
