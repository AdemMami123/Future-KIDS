'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChildInfo, removeLink } from '@/lib/parentChildApi';
import { User, Mail, GraduationCap, Link2, Trash2 } from 'lucide-react';

interface ChildCardProps {
  child: ChildInfo;
  onRemove: () => void;
}

export default function ChildCard({ child, onRemove }: ChildCardProps) {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to unlink ${child.firstName} ${child.lastName}? They will no longer have access to their parent dashboard features.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await removeLink(child.linkId);
      onRemove();
    } catch (error: any) {
      alert(
        `Failed to remove link: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden transition-shadow hover:shadow-xl"
    >
      {/* Card Header with Avatar */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
        <div className="flex justify-center">
          {child.avatarUrl ? (
            <img
              src={child.avatarUrl}
              alt={`${child.firstName} ${child.lastName}`}
              className="w-24 h-24 rounded-full border-4 border-white object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-600">
                {child.firstName[0]}
                {child.lastName[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {child.firstName} {child.lastName}
        </h3>

        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm">{child.email}</span>
          </div>

          {/* Grade */}
          {child.grade && (
            <div className="flex items-center gap-3 text-gray-600">
              <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="text-sm">Grade {child.grade}</span>
            </div>
          )}

          {/* Linked Date */}
          <div className="flex items-center gap-3 text-gray-600">
            <Link2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm">
              Linked on{' '}
              {new Date(child.linkedAt._seconds * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              // TODO: Navigate to child's progress page
              alert('View Progress feature coming soon!');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
          >
            View Progress
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Removing...' : 'Remove Link'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
