'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizQuestion, generateQuestionId } from '@/lib/quizApi';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  TagIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface QuestionBankProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: QuizQuestion[]) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
}) => {
  const [savedQuestions, setSavedQuestions] = useState<QuizQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuizQuestion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Load saved questions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('question_bank');
    if (saved) {
      try {
        const questions = JSON.parse(saved);
        setSavedQuestions(questions);
        setFilteredQuestions(questions);
      } catch (error) {
        console.error('Error loading question bank:', error);
      }
    }
  }, [isOpen]);

  // Filter questions
  useEffect(() => {
    let filtered = savedQuestions;

    if (searchTerm) {
      filtered = filtered.filter((q) =>
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((q) => q.tags?.includes(selectedTag));
    }

    setFilteredQuestions(filtered);
  }, [searchTerm, selectedTag, savedQuestions]);

  // Get all unique tags
  const allTags = Array.from(
    new Set(savedQuestions.flatMap((q) => q.tags || []))
  );

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleImport = () => {
    const questionsToImport = savedQuestions
      .filter((q) => selectedQuestions.has(q.questionId))
      .map((q) => ({
        ...q,
        questionId: generateQuestionId(), // Generate new IDs for imported questions
      }));

    onImportQuestions(questionsToImport);
    setSelectedQuestions(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Question Bank</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TagIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Questions Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || selectedTag
                    ? 'Try adjusting your search or filters'
                    : 'Save questions from quizzes to build your question bank'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <motion.div
                    key={question.questionId}
                    layout
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedQuestions.has(question.questionId)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => toggleQuestionSelection(question.questionId)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            selectedQuestions.has(question.questionId)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedQuestions.has(question.questionId) && (
                            <CheckCircleIcon className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {question.questionText}
                        </p>

                        {question.questionImageUrl && (
                          <img
                            src={question.questionImageUrl}
                            alt="Question"
                            className="w-32 h-24 object-cover rounded mb-2"
                          />
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {question.type === 'multiple-choice'
                              ? 'Multiple Choice'
                              : question.type === 'true-false'
                              ? 'True/False'
                              : 'Short Answer'}
                          </span>
                          <span>{question.points} pts</span>
                          <span>{question.timeLimit}s</span>
                        </div>

                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {question.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedQuestions.size === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Import Selected</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Function to save a question to the bank
export const saveQuestionToBank = (question: QuizQuestion) => {
  try {
    const saved = localStorage.getItem('question_bank');
    const questions: QuizQuestion[] = saved ? JSON.parse(saved) : [];
    
    // Check if question already exists
    const exists = questions.some((q) => q.questionId === question.questionId);
    if (!exists) {
      questions.push(question);
      localStorage.setItem('question_bank', JSON.stringify(questions));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving question to bank:', error);
    return false;
  }
};

// Function to save multiple questions to the bank
export const saveQuestionsToBank = (questions: QuizQuestion[]) => {
  try {
    const saved = localStorage.getItem('question_bank');
    const existingQuestions: QuizQuestion[] = saved ? JSON.parse(saved) : [];
    
    const newQuestions = questions.filter(
      (q) => !existingQuestions.some((eq) => eq.questionId === q.questionId)
    );
    
    if (newQuestions.length > 0) {
      const updated = [...existingQuestions, ...newQuestions];
      localStorage.setItem('question_bank', JSON.stringify(updated));
      return newQuestions.length;
    }
    return 0;
  } catch (error) {
    console.error('Error saving questions to bank:', error);
    return 0;
  }
};

export default QuestionBank;
