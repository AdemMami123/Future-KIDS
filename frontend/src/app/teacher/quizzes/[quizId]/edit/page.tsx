'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import QuestionBuilder from '@/components/teacher/QuestionBuilder';
import {
  Quiz,
  getQuizById,
  updateQuiz,
  uploadQuizImage,
  validateQuiz,
} from '@/lib/quizApi';
import { getTeacherClasses } from '@/lib/classApi';
import {
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Other',
];

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'questions'>(
    'info'
  );

  // Load quiz data
  useEffect(() => {
    loadQuiz();
    loadClasses();
  }, [quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const quizData = await getQuizById(quizId);
      if (!quizData) {
        alert('Quiz not found');
        router.push('/teacher/quizzes');
        return;
      }

      // Check if user owns this quiz
      if (quizData.teacherId !== user?.userId) {
        alert('Unauthorized access');
        router.push('/teacher/quizzes');
        return;
      }

      setQuiz(quizData);
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    if (!user?.userId) return;
    try {
      const teacherClasses = await getTeacherClasses(user.userId);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const imageUrl = await uploadQuizImage(file, 'cover');
      setQuiz({ ...quiz!, coverImageUrl: imageUrl });
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!quiz) return;

    const validation = validateQuiz(quiz);
    if (!validation.isValid) {
      alert(`Please fix the following errors:\n\n${validation.errors.join('\n')}`);
      return;
    }

    setSaving(true);
    try {
      await updateQuiz(quizId, {
        ...quiz,
        isActive: publish ? true : quiz.isActive,
        isDraft: publish ? false : quiz.isDraft,
      });

      alert(
        publish
          ? 'Quiz published successfully!'
          : 'Quiz updated successfully!'
      );
      router.push('/teacher/quizzes');
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      alert(error.message || 'Failed to update quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/teacher/quizzes')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Edit Quiz</h1>
              <p className="text-gray-600 mt-1">Make changes to your quiz</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-3 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            {quiz.isDraft && (
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>Publish</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl shadow-md border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Questions ({quiz.questions?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-md p-8">
          {/* Basic Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title *
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  placeholder="Enter quiz title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={quiz.description}
                  onChange={(e) =>
                    setQuiz({ ...quiz, description: e.target.value })
                  }
                  placeholder="What is this quiz about?"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={quiz.subject}
                    onChange={(e) =>
                      setQuiz({ ...quiz, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class *
                  </label>
                  <select
                    value={quiz.classId}
                    onChange={(e) =>
                      setQuiz({ ...quiz, classId: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.name} ({cls.grade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <div className="flex space-x-4">
                  {['easy', 'medium', 'hard'].map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() =>
                        setQuiz({
                          ...quiz,
                          difficulty: difficulty as Quiz['difficulty'],
                        })
                      }
                      className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                        quiz.difficulty === difficulty
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Optional)
                </label>
                {quiz.coverImageUrl ? (
                  <div className="relative">
                    <img
                      src={quiz.coverImageUrl}
                      alt="Quiz cover"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setQuiz({ ...quiz, coverImageUrl: '' })}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverImageUpload(file);
                      }}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {uploadingCover ? (
                        <div className="text-blue-500">Uploading...</div>
                      ) : (
                        <>
                          <PhotoIcon className="w-16 h-16 text-gray-400 mb-3" />
                          <span className="text-sm text-gray-600">
                            Click to upload cover image
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Time Limit per Question (seconds)
                </label>
                <input
                  type="number"
                  value={quiz.timeLimit}
                  onChange={(e) =>
                    setQuiz({
                      ...quiz,
                      timeLimit: parseInt(e.target.value) || 30,
                    })
                  }
                  min="5"
                  step="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Randomize Question Order
                    </p>
                    <p className="text-sm text-gray-500">
                      Questions will appear in random order for each student
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeQuestions}
                      onChange={(e) =>
                        setQuiz({
                          ...quiz,
                          randomizeQuestions: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Randomize Answer Options
                    </p>
                    <p className="text-sm text-gray-500">
                      Multiple choice options will be shuffled
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.randomizeOptions}
                      onChange={(e) =>
                        setQuiz({
                          ...quiz,
                          randomizeOptions: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Show Correct Answers
                    </p>
                    <p className="text-sm text-gray-500">
                      Students can see correct answers after submission
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.showCorrectAnswers}
                      onChange={(e) =>
                        setQuiz({
                          ...quiz,
                          showCorrectAnswers: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Allow Retakes</p>
                    <p className="text-sm text-gray-500">
                      Students can retake the quiz multiple times
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quiz.allowRetake}
                      onChange={(e) =>
                        setQuiz({
                          ...quiz,
                          allowRetake: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div>
              <QuestionBuilder
                questions={quiz.questions || []}
                onChange={(questions) =>
                  setQuiz({ ...quiz, questions, totalQuestions: questions.length })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
