'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getTeacherClasses, createClass, deleteClass, updateClass, Class } from '@/lib/classApi';
import ClassCard from '@/components/teacher/ClassCard';
import CreateClassModal from '@/components/teacher/CreateClassModal';
import EditClassModal from '@/components/teacher/EditClassModal';
import ClassDetailsModal from '@/components/teacher/ClassDetailsModal';
import { Plus, Users, LayoutGrid, List } from 'lucide-react';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (user?.userId) {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTeacherClasses(user!.userId);
      setClasses(data || []);
    } catch (error: any) {
      console.error('Failed to load classes:', error);
      setError(error.response?.data?.message || 'Failed to load classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (data: { name: string; grade: string; subject: string }) => {
    await createClass(data);
    loadClasses();
  };

  const handleEditClass = (classId: string) => {
    const classToEdit = classes.find(c => c.classId === classId);
    if (classToEdit) {
      setSelectedClass(classToEdit);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateClass = async (classId: string, data: { name?: string; grade?: string; subject?: string }) => {
    try {
      await updateClass(classId, data);
      loadClasses();
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteClass(classId);
      loadClasses();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete class');
    }
  };

  const handleViewClass = (classId: string) => {
    setSelectedClassId(classId);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
              <p className="text-gray-600">
                Manage your classes and track student progress
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create Class
              </button>
            </div>
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

        {/* Classes Grid/List */}
        {classes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Classes Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first class to start managing students and quizzes
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Class
            </button>
          </motion.div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {classes.map((classData, index) => (
              <motion.div
                key={classData.classId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ClassCard
                  classData={classData}
                  onClick={handleViewClass}
                  onEdit={handleEditClass}
                  onDelete={handleDeleteClass}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateClassModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateClass}
        />
        
        <EditClassModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedClass(null);
          }}
          onSubmit={handleUpdateClass}
          classData={selectedClass}
        />

        <ClassDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedClassId(null);
          }}
          classId={selectedClassId}
        />
      </div>
    </div>
  );
}
