'use client';

import { motion } from 'framer-motion';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import { Class } from '@/lib/classApi';

interface ClassCardProps {
  classData: Class;
  onEdit: (classId: string) => void;
  onDelete: (classId: string) => void;
  onClick: (classId: string) => void;
}

export default function ClassCard({ classData, onEdit, onDelete, onClick }: ClassCardProps) {
  const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
    Math: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    Science: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    English: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    History: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    Geography: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  };

  const colors = subjectColors[classData.subject] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      onClick={() => onClick(classData.classId)}
      className="bg-white rounded-xl shadow-lg p-6 cursor-pointer border-2 border-transparent hover:border-blue-300 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {classData.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className={`${colors.bg} ${colors.text} px-3 py-1 rounded-full text-sm font-semibold`}>
              {classData.subject}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
              {classData.grade}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-gray-600">
          <Users className="w-5 h-5" />
          <span className="text-sm">
            <span className="font-semibold text-gray-900">{classData.studentIds.length}</span> Students
          </span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm">
            <span className="font-semibold text-gray-900">0</span> Quizzes
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(classData.classId);
          }}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          View Details →
        </button>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(classData.classId);
            }}
            className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(classData.classId);
            }}
            className="text-gray-600 hover:text-red-600 text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Decorative gradient */}
      <div className={`absolute inset-0 rounded-xl ${colors.bg} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
    </motion.div>
  );
}
