'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import QuestionBuilder from '@/components/teacher/QuestionBuilder';
import {
  Quiz,
  QuizQuestion,
  createQuiz,
  updateQuiz,
  uploadQuizImage,
  validateQuiz,
  calculateTotalPoints,
  calculateQuizDuration,
} from '@/lib/quizApi';
import { getTeacherClasses } from '@/lib/classApi';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Quiz details' },
  { id: 2, name: 'Settings', description: 'Quiz configuration' },
  { id: 3, name: 'Questions', description: 'Add questions' },
  { id: 4, name: 'Review', description: 'Review & publish' },
];

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

export default function CreateQuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [quizData, setQuizData] = useState<Partial<Quiz>>({
    title: '',
    description: '',
    subject: '',
    classId: '',
    difficulty: 'medium',
    timeLimit: 30,
    coverImageUrl: '',
    questions: [],
    isActive: false,
    isDraft: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    showCorrectAnswers: true,
    allowRetake: true,
  });

  // Load classes
  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.userId) return;
      try {
        const teacherClasses = await getTeacherClasses(user.userId);
        setClasses(teacherClasses);
      } catch (error) {
        console.error('Error loading classes:', error);
      }
    };
    loadClasses();
  }, [user]);

  // Auto-save draft
  useEffect(() => {
    if (!quizData.title || !quizData.questions || quizData.questions.length === 0) return;

    const autoSaveTimer = setTimeout(() => {
      saveDraft();
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [quizData]);

  const saveDraft = async () => {
    setAutoSaving(true);
    try {
      // Save to localStorage for now (can be improved with backend)
      localStorage.setItem('quiz_draft', JSON.stringify(quizData));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('quiz_draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        if (
          confirm(
            'A draft quiz was found. Would you like to continue editing it?'
          )
        ) {
          setQuizData(parsedDraft);
        } else {
          localStorage.removeItem('quiz_draft');
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const handleCoverImageUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const imageUrl = await uploadQuizImage(file, 'cover');
      setQuizData({ ...quizData, coverImageUrl: imageUrl });
    } catch (error: any) {
      console.error('Error uploading cover image:', error);
      alert(`Failed to upload cover image: ${error.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return (
          quizData.title &&
          quizData.description &&
          quizData.subject &&
          quizData.classId
        );
      case 2:
        return true;
      case 3:
        return quizData.questions && quizData.questions.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handlePublish = async (publish: boolean = true) => {
    if (!user?.userId) return;

    const validation = validateQuiz(quizData);
    if (!validation.isValid) {
      alert(`Please fix the following errors:\n\n${validation.errors.join('\n')}`);
      return;
    }

    setLoading(true);
    try {
      const finalQuizData: Omit<Quiz, 'quizId' | 'createdAt' | 'updatedAt'> = {
        ...quizData as Quiz,
        teacherId: user.userId,
        totalQuestions: quizData.questions?.length || 0,
        isActive: publish,
        isDraft: !publish,
      };

      const result = await createQuiz(finalQuizData);
      
      // Clear draft
      localStorage.removeItem('quiz_draft');
      
      alert(
        publish
          ? 'Quiz published successfully!'
          : 'Quiz saved as draft successfully!'
      );
      router.push('/teacher/quizzes');
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      alert(error.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Create New Quiz
          </h1>
          <p className="text-gray-600">
            Follow the steps to create an engaging quiz for your students
          </p>
          {lastSaved && (
            <p className="text-sm text-gray-500 mt-2">
              {autoSaving ? 'Saving...' : `Last saved: ${lastSaved.toLocaleTimeString()}`}
            </p>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: currentStep === step.id ? 1.1 : 1,
                      backgroundColor:
                        currentStep > step.id
                          ? '#10B981'
                          : currentStep === step.id
                          ? '#3B82F6'
                          : '#E5E7EB',
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-2"
                  >
                    {currentStep > step.id ? (
                      <CheckCircleIcon className="w-7 h-7" />
                    ) : (
                      step.id
                    )}
                  </motion.div>
                  <p className="text-sm font-medium text-gray-900">
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 bg-gray-200 mx-4 relative top-[-20px]">
                    <motion.div
                      initial={false}
                      animate={{
                        width: currentStep > step.id ? '100%' : '0%',
                      }}
                      className="h-full bg-green-500"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-md p-8 mb-8"
          >
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Basic Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    value={quizData.title}
                    onChange={(e) =>
                      setQuizData({ ...quizData, title: e.target.value })
                    }
                    placeholder="Enter quiz title..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={quizData.description}
                    onChange={(e) =>
                      setQuizData({ ...quizData, description: e.target.value })
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
                      value={quizData.subject}
                      onChange={(e) =>
                        setQuizData({ ...quizData, subject: e.target.value })
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
                      value={quizData.classId}
                      onChange={(e) =>
                        setQuizData({ ...quizData, classId: e.target.value })
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
                          setQuizData({
                            ...quizData,
                            difficulty: difficulty as Quiz['difficulty'],
                          })
                        }
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          quizData.difficulty === difficulty
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
                  {quizData.coverImageUrl ? (
                    <div className="relative">
                      <img
                        src={quizData.coverImageUrl}
                        alt="Quiz cover"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setQuizData({ ...quizData, coverImageUrl: '' })
                        }
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

            {/* Step 2: Settings */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Quiz Settings
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Time Limit per Question (seconds)
                  </label>
                  <input
                    type="number"
                    value={quizData.timeLimit}
                    onChange={(e) =>
                      setQuizData({
                        ...quizData,
                        timeLimit: parseInt(e.target.value) || 30,
                      })
                    }
                    min="5"
                    step="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can set individual time limits for each question later
                  </p>
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
                        checked={quizData.randomizeQuestions}
                        onChange={(e) =>
                          setQuizData({
                            ...quizData,
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
                        checked={quizData.randomizeOptions}
                        onChange={(e) =>
                          setQuizData({
                            ...quizData,
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
                        checked={quizData.showCorrectAnswers}
                        onChange={(e) =>
                          setQuizData({
                            ...quizData,
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
                        checked={quizData.allowRetake}
                        onChange={(e) =>
                          setQuizData({
                            ...quizData,
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

            {/* Step 3: Questions */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Add Questions
                </h2>
                <QuestionBuilder
                  questions={quizData.questions || []}
                  onChange={(questions) =>
                    setQuizData({ ...quizData, questions })
                  }
                  onSaveToDraft={saveDraft}
                />
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Review & Publish
                </h2>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {quizData.title}
                  </h3>
                  <p className="text-gray-700 mb-4">{quizData.description}</p>

                  {quizData.coverImageUrl && (
                    <img
                      src={quizData.coverImageUrl}
                      alt="Quiz cover"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Subject</p>
                      <p className="font-medium text-gray-900">
                        {quizData.subject}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Difficulty</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {quizData.difficulty}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Questions</p>
                      <p className="font-medium text-gray-900">
                        {quizData.questions?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Points</p>
                      <p className="font-medium text-gray-900">
                        {calculateTotalPoints(quizData.questions || [])}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimated Duration</p>
                      <p className="font-medium text-gray-900">
                        {Math.ceil(
                          calculateQuizDuration(quizData.questions || []) / 60
                        )}{' '}
                        minutes
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Class</p>
                      <p className="font-medium text-gray-900">
                        {classes.find((c) => c.classId === quizData.classId)
                          ?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> Once published, the quiz will be
                    available to students in the selected class. You can always
                    save it as a draft and publish it later.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-4">
            {currentStep === 4 && (
              <button
                type="button"
                onClick={() => handlePublish(false)}
                disabled={loading}
                className="px-6 py-3 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium disabled:opacity-50"
              >
                Save as Draft
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceedToNextStep()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePublish(true)}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                <span>{loading ? 'Publishing...' : 'Publish Quiz'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
