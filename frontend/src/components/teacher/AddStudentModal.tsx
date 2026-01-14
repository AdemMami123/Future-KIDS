'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserPlus } from 'lucide-react';
import api from '@/lib/api';

interface Student {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  grade?: string;
  avatarUrl?: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (studentId: string) => Promise<void>;
  existingStudentIds: string[];
}

export default function AddStudentModal({ isOpen, onClose, onAdd, existingStudentIds }: AddStudentModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStudents();
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(
        (student) =>
          !existingStudentIds.includes(student.userId) &&
          (student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students.filter((s) => !existingStudentIds.includes(s.userId)));
    }
  }, [searchTerm, students, existingStudentIds]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users/role/student');
      const allStudents = response.data.data?.users || response.data.users || [];
      setStudents(allStudents);
      setFilteredStudents(allStudents.filter((s: Student) => !existingStudentIds.includes(s.userId)));
    } catch (error: any) {
      console.error('Failed to load students:', error);
      setError(error.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    try {
      setAdding(studentId);
      await onAdd(studentId);
      // Remove from available list
      setStudents((prev) => prev.filter((s) => s.userId !== studentId));
      setFilteredStudents((prev) => prev.filter((s) => s.userId !== studentId));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add student');
    } finally {
      setAdding(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Add Students to Class</h2>
            <p className="text-blue-100 text-sm mt-1">Select students to enroll in this class</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Students List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No students found matching your search' : 'No students available to add'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      {student.grade && (
                        <span className="inline-block mt-1 bg-white px-2 py-1 rounded text-xs text-gray-700 shadow-sm">
                          {student.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddStudent(student.userId)}
                    disabled={adding === student.userId}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding === student.userId ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
