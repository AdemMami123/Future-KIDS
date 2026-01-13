'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getChildren, ChildInfo } from '@/lib/parentChildApi';
import ChildCard from '@/components/parent/ChildCard';
import AddChildModal from '@/components/parent/AddChildModal';
import { UserPlus, Users } from 'lucide-react';

export default function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getChildren();
      console.log('Children data received:', data);
      setChildren(data || []);
    } catch (error: any) {
      console.error('Failed to load children:', error);
      setError(error.response?.data?.message || 'Failed to load children');
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChildAdded = () => {
    loadChildren();
    setIsAddModalOpen(false);
  };

  const handleChildRemoved = () => {
    loadChildren();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Children
              </h1>
              <p className="text-gray-600">
                Manage your children&apos;s accounts and monitor their progress
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add Child
            </button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8"
          >
            <p className="text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Children Grid */}
        {children && children.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Children Linked
            </h2>
            <p className="text-gray-600 mb-6">
              Add your first child to start monitoring their progress
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add Child
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child, index) => (
              <motion.div
                key={child.linkId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChildCard child={child} onRemove={handleChildRemoved} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleChildAdded}
      />
    </div>
  );
}
