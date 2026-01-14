'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import ViewQuizModal from '@/components/teacher/ViewQuizModal';
import {
  Quiz,
  getTeacherQuizzes,
  deleteQuiz,
  duplicateQuiz,
  filterQuizzes,
  QuizFilters,
} from '@/lib/quizApi';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  ChartBarIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function QuizzesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<QuizFilters>({
    subject: '',
    difficulty: '',
    isActive: undefined,
    isDraft: undefined,
    searchTerm: '',
  });

  // Load quizzes
  useEffect(() => {
    loadQuizzes();
  }, [user]);

  // Apply filters
  useEffect(() => {
    const filtered = filterQuizzes(quizzes, { ...filters, searchTerm });
    setFilteredQuizzes(filtered);
  }, [quizzes, filters, searchTerm]);

  const loadQuizzes = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const teacherQuizzes = await getTeacherQuizzes(user.userId);
      setQuizzes(teacherQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.quizId !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    }
  };

  const handleDuplicate = async (quizId: string) => {
    try {
      const result = await duplicateQuiz(quizId);
      alert('Quiz duplicated successfully!');
      loadQuizzes(); // Reload to show the new quiz
    } catch (error) {
      console.error('Error duplicating quiz:', error);
      alert('Failed to duplicate quiz');
    }
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      difficulty: '',
      isActive: undefined,
      isDraft: undefined,
      searchTerm: '',
    });
    setSearchTerm('');
  };

  const handleViewQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsViewModalOpen(true);
  };

  const activeFilterCount = [
    filters.subject,
    filters.difficulty,
    filters.isActive !== undefined,
    filters.isDraft !== undefined,
  ].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Quizzes</h1>
            <p className="text-gray-600">
              Manage your quizzes, view statistics, and create new ones
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/teacher/quizzes/create')}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Quiz</span>
          </motion.button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search quizzes by title or description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 pt-4 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Subject Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={filters.subject}
                      onChange={(e) =>
                        setFilters({ ...filters, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Subjects</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                      <option value="History">History</option>
                      <option value="Geography">Geography</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>

                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) =>
                        setFilters({ ...filters, difficulty: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Levels</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={
                        filters.isActive === true
                          ? 'active'
                          : filters.isDraft === true
                          ? 'draft'
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value === 'active') {
                          setFilters({
                            ...filters,
                            isActive: true,
                            isDraft: undefined,
                          });
                        } else if (e.target.value === 'draft') {
                          setFilters({
                            ...filters,
                            isActive: undefined,
                            isDraft: true,
                          });
                        } else {
                          setFilters({
                            ...filters,
                            isActive: undefined,
                            isDraft: undefined,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quiz Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <strong>{filteredQuizzes.length}</strong> of{' '}
            <strong>{quizzes.length}</strong> quizzes
          </p>
        </div>

        {/* Quizzes Grid */}
        {filteredQuizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No quizzes found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first quiz'}
              </p>
              {!searchTerm && activeFilterCount === 0 && (
                <button
                  onClick={() => router.push('/teacher/quizzes/create')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Your First Quiz
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <motion.div
                key={quiz.quizId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-purple-500">
                  {quiz.coverImageUrl ? (
                    <img
                      src={quiz.coverImageUrl}
                      alt={quiz.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white text-6xl font-bold">
                      {quiz.title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quiz.isDraft
                          ? 'bg-yellow-100 text-yellow-800'
                          : quiz.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {quiz.isDraft ? 'Draft' : quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quiz.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : quiz.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {quiz.difficulty?.charAt(0).toUpperCase() +
                        quiz.difficulty?.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Quiz Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {quiz.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {quiz.totalQuestions}
                      </p>
                      <p className="text-xs text-gray-500">Questions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {quiz.questions.reduce(
                          (sum, q) => sum + (q.points || 0),
                          0
                        )}
                      </p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.ceil(
                          quiz.questions.reduce(
                            (sum, q) => sum + (q.timeLimit || 0),
                            0
                          ) / 60
                        )}
                      </p>
                      <p className="text-xs text-gray-500">Minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                      {quiz.subject}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewQuiz(quiz)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    
                    <button
                      onClick={() =>
                        router.push(`/teacher/quizzes/${quiz.quizId}/edit`)
                      }
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      title="Edit"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDuplicate(quiz.quizId!)}
                      className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(quiz.quizId!)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* View Quiz Modal */}
      <ViewQuizModal
        quiz={selectedQuiz}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </div>
  );
}
