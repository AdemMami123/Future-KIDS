'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { parentApi, ChildInfo } from '@/lib/parentApi';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Eye,
  User,
  Mail,
  BookOpen,
  Award,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import AddChildModal from '@/components/parent/AddChildModal';

function ChildrenManagementContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadChildren();
  }, [user]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await parentApi.getChildren(user!.userId);
      setChildren(childrenData);
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveChild = async (childId: string) => {
    if (window.confirm('Are you sure you want to remove this child?')) {
      try {
        setDeletingId(childId);
        // TODO: Implement removeChild endpoint
        // await parentApi.removeChild(user!.userId, childId);
        setChildren(children.filter((c) => c.childId !== childId));
      } catch (error) {
        console.error('Error removing child:', error);
        alert('Failed to remove child');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleChildAdded = () => {
    setShowAddModal(false);
    loadChildren();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                  My Children
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Manage and monitor your children's learning progress
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <Plus className="w-5 h-5" />
              Add Child
            </button>
          </div>
        </motion.div>

        {/* Children Grid */}
        {children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 text-center border border-white/20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Children Added</h3>
              <p className="text-gray-600 mb-6">
                Add your children's accounts to start monitoring their learning progress and performance.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:-translate-y-1"
              >
                Add Your First Child
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child, index) => (
              <motion.div
                key={child.childId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                {/* Child Avatar */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {child.firstName?.[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {child.grade ? `Grade ${child.grade}` : 'Grade N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-600">Quizzes</p>
                    <p className="text-lg font-bold text-gray-800">
                      {child.quickStats?.quizzesThisWeek || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-600">Avg Score</p>
                    <p className="text-lg font-bold text-gray-800">
                      {child.quickStats?.averageScore || '0'}%
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-600">Streak</p>
                    <p className="text-lg font-bold text-gray-800">
                      {child.quickStats?.currentStreak || 0}d
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/parent/children/${child.childId}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-md transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => handleRemoveChild(child.childId)}
                    disabled={deletingId === child.childId}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        <AddChildModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleChildAdded}
        />
      </div>
    </div>
  );
}

export default function ChildrenPage() {
  return <ChildrenManagementContent />;
}
