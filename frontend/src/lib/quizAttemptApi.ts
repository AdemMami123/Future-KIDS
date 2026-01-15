import api from './api';

export interface QuizAttempt {
  attemptId: string;
  quizId: string;
  studentId: string;
  mode: 'practice' | 'graded';
  status: 'in-progress' | 'completed';
  answers: Array<{
    questionId: string;
    answer: string | number;
    timeSpent: number;
  }>;
  currentQuestionIndex?: number;
  score: number;
  totalPoints: number;
  percentage: number;
  feedback?: string;
  startedAt: any;
  completedAt?: any;
  lastSavedAt: any;
}

export interface QuizResults {
  score: number;
  totalPoints: number;
  percentage: number;
  feedback: string;
  gradedAnswers: Array<{
    questionId: string;
    isCorrect: boolean;
    points: number;
    correctAnswer: string | number;
    studentAnswer: string | number;
  }>;
  startedAt: any;
  completedAt: any;
  timeSpent: number;
  quiz: any;
}

export const quizAttemptApi = {
  // Start a new quiz attempt
  startAttempt: async (
    quizId: string,
    studentId: string,
    mode: 'practice' | 'graded' = 'practice'
  ): Promise<QuizAttempt> => {
    const response = await api.post('/quiz-attempts', {
      quizId,
      studentId,
      mode,
    });
    return response?.attempt || null;
  },

  // Save progress (auto-save)
  saveProgress: async (
    attemptId: string,
    answers: Array<{ questionId: string; answer: string | number; timeSpent: number }>,
    currentQuestionIndex?: number
  ): Promise<void> => {
    await api.patch(`/quiz-attempts/${attemptId}`, {
      answers,
      currentQuestionIndex,
    });
  },

  // Submit quiz for grading
  submitQuiz: async (
    attemptId: string,
    answers: Array<{ questionId: string; answer: string | number; timeSpent: number }>
  ): Promise<QuizResults> => {
    const response = await api.post(`/quiz-attempts/${attemptId}/submit`, {
      answers,
    });
    return response?.result || null;
  },

  // Get attempt details
  getAttempt: async (attemptId: string): Promise<QuizAttempt & { quiz: any }> => {
    const response = await api.get(`/quiz-attempts/${attemptId}`);
    return response?.attempt || null;
  },

  // Get quiz results
  getResults: async (attemptId: string): Promise<QuizResults> => {
    const response = await api.get(`/quiz-attempts/${attemptId}/results`);
    return response?.results || null;
  },

  // Get incomplete attempts for resume
  getIncompleteAttempts: async (studentId: string): Promise<QuizAttempt[]> => {
    const response = await api.get(`/quiz-attempts/student/${studentId}/incomplete`);
    return response?.attempts || [];
  },
};
