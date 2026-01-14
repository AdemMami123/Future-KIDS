'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { getClassWithStudents, removeStudentFromClass, ClassWithStudents } from '@/lib/classApi';
import { ArrowLeft, Users, BookOpen, UserPlus, UserMinus, Mail, GraduationCap } from 'lucide-react';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassWithStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getClassWithStudents(classId);
      setClassData(data);
    } catch (error: any) {
      console.error('Failed to load class:', error);
      setError(error.response?.data?.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from this class?`)) {
      return;
    }

    try {
      await removeStudentFromClass(classId, studentId);
      loadClassData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove student');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 mb-4">{error || 'Class not found'}</p>
            <button
              onClick={() => router.push('/dashboard/teacher/classes')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push('/dashboard/teacher/classes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Classes
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{classData.name}</h1>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {classData.subject}
                  </span>
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {classData.grade}
                  </span>
                </div>
              </div>
              <button
                onClick={() => alert('Add student functionality coming soon!')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Add Students
              </button>
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{classData.students.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Quizzes Assigned</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Performance</p>
                <p className="text-3xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Student Roster */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Student Roster</h2>

          {classData.students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Yet</h3>
              <p className="text-gray-600 mb-6">Add students to this class to get started</p>
              <button
                onClick={() => alert('Add student functionality coming soon!')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Add Your First Student
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {classData.students.map((student, index) => (
                <motion.div
                  key={student.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{student.email}</span>
                        </div>
                        {student.grade && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            <span>{student.grade}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert('View student details coming soon!')}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors px-4 py-2 hover:bg-blue-50 rounded-lg"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() =>
                        handleRemoveStudent(
                          student.userId,
                          `${student.firstName} ${student.lastName}`
                        )
                      }
                      className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors px-4 py-2 hover:bg-red-50 rounded-lg flex items-center gap-1"
                    >
                      <UserMinus className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
