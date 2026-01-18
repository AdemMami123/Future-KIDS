'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  getParents,
  getPendingRequests,
  ParentInfo,
  ParentChildLink,
} from '@/lib/parentChildApi';
import ParentRequestCard from '@/components/student/ParentRequestCard';
import { Users, Clock } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [parents, setParents] = useState<ParentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading parents data...');
      const parentsData = await getParents();
      console.log('Parents data received:', parentsData);
      setParents(parentsData || []);
    } catch (error: any) {
      console.error('Failed to load data:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.message || error.message || 'Failed to load data');
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleParentRemoved = () => {
    loadData();
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Linked Parent Accounts
          </h1>
          <p className="text-gray-600">
            View parent accounts linked to your student profile
          </p>
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

        {/* Content */}
        <div>
          {!parents || parents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-12 text-center"
            >
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No Parents Linked
              </h2>
              <p className="text-gray-600">
                No parent accounts are currently linked to your profile
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {parents.map((parent, index) => (
                <motion.div
                  key={parent.linkId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {parent.avatarUrl ? (
                        <img
                          src={parent.avatarUrl}
                          alt={`${parent.firstName} ${parent.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-2xl font-bold text-blue-600">
                            {parent.firstName[0]}
                            {parent.lastName[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {parent.firstName} {parent.lastName}
                        </h3>
                        <p className="text-gray-600">{parent.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Linked on{' '}
                          {new Date(
                            parent.linkedAt._seconds * 1000
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to unlink ${parent.firstName} ${parent.lastName}?`
                          )
                        ) {
                          try {
                            const { removeLink } = await import(
                              '@/lib/parentChildApi'
                            );
                            await removeLink(parent.linkId);
                            handleParentRemoved();
                          } catch (error: any) {
                            alert(
                              `Failed to remove link: ${error.response?.data?.message || error.message}`
                            );
                          }
                        }
                      }}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
