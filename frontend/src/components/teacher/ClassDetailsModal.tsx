'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, BookOpen, Calendar, Clock, UserPlus, Trash2 } from 'lucide-react';
import { Class, ClassWithStudents, getClassWithStudents, addStudentToClass, removeStudentFromClass } from '@/lib/classApi';
import AddStudentModal from './AddStudentModal';

interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string | null;
}

export default function ClassDetailsModal({ isOpen, onClose, classId }: ClassDetailsModalProps) {
  const [classData, setClassData] = useState<ClassWithStudents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && classId) {
      loadClassDetails();
    }
  }, [isOpen, classId]);

  const loadClassDetails = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      setError('');
      const data = await getClassWithStudents(classId);
      setClassData(data);
    } catch (error: any) {
      console.error('Failed to load class details:', error);
      setError(error.response?.data?.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    if (!classId) return;

    try {
      await addStudentToClass(classId, studentId);
      await loadClassDetails(); // Refresh the class data
    } catch (error: any) {
      throw error;
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!classId) return;
    
    if (!confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      setRemovingStudent(studentId);
      await removeStudentFromClass(classId, studentId);
      await loadClassDetails(); // Refresh the class data
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove student');
    } finally {
      setRemovingStudent(null);
    }
  };

  if (!isOpen) return null;

  const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
    Math: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    Science: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    English: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    History: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    Geography: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  };

  const colors = classData
    ? subjectColors[classData.subject] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' }
    : { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Class Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && classData && (
            <div className="space-y-6">
              {/* Class Info */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{classData.name}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`${colors.bg} ${colors.text} px-4 py-2 rounded-full text-sm font-semibold`}>
                    {classData.subject}
                  </span>
                  <span className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                    {classData.grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="text-2xl font-bold text-gray-900">{classData.students.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quizzes</p>
                        <p className="text-2xl font-bold text-gray-900">0</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created: {classData.createdAt?.toDate?.() 
                        ? new Date(classData.createdAt.toDate()).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Last Updated: {classData.updatedAt?.toDate?.() 
                        ? new Date(classData.updatedAt.toDate()).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-900">Students Enrolled</h4>
                  <button
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Students
                  </button>
                </div>
                {classData.students.length === 0 ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No students enrolled yet</p>
                    <button
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Your First Student
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classData.students.map((student) => (
                      <div
                        key={student.userId}
                        className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        {student.grade && (
                          <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 shadow-sm">
                            {student.grade}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveStudent(student.userId)}
                          disabled={removingStudent === student.userId}
                          className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove student"
                        >
                          {removingStudent === student.userId ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add Student Modal */}
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          onAdd={handleAddStudent}
          existingStudentIds={classData?.students.map((s) => s.userId) || []}
        />
      </motion.div>
    </div>
  );
}
