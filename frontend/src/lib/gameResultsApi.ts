import api from './api';

export interface GameResults {
  session: {
    sessionId: string;
    gameCode: string;
    status: string;
    startedAt: any;
    completedAt: any;
  };
  quiz: {
    quizId: string;
    title: string;
    description: string;
    totalQuestions: number;
  };
  statistics: {
    totalParticipants: number;
    participationRate: number;
    averageScore: number;
    totalCorrectAnswers: number;
    totalAnswers: number;
    overallAccuracy: number;
  };
  leaderboard: Array<{
    userId: string;
    userName: string;
    avatarUrl?: string;
    score: number;
    totalAnswers: number;
    correctAnswers: number;
    rank: number;
  }>;
  questionStats: Array<{
    questionId: string;
    questionText: string;
    questionNumber: number;
    correctCount: number;
    incorrectCount: number;
    percentageCorrect: number;
    averageTime: number;
    totalAnswers: number;
  }>;
}

export interface UserResults {
  participant: {
    userId: string;
    userName: string;
    score: number;
    rank: number;
    totalParticipants: number;
  };
  performance: {
    correctAnswers: number;
    incorrectAnswers: number;
    totalQuestions: number;
    accuracy: number;
    classAverage: number;
    comparisonToAverage: number;
  };
  answerReview: Array<{
    questionNumber: number;
    questionId: string;
    questionText: string;
    questionImageUrl?: string;
    type: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string | null;
    isCorrect: boolean;
    points: number;
    timeSpent: number;
  }>;
  quiz: {
    quizId: string;
    title: string;
    description: string;
  };
}

export const gameResultsApi = {
  // Get full game results
  getGameResults: async (sessionId: string): Promise<GameResults> => {
    const response = await api.get(`/games/${sessionId}/results`);
    return response.data.results;
  },

  // Get user-specific results
  getUserResults: async (
    sessionId: string,
    userId: string
  ): Promise<UserResults> => {
    const response = await api.get(`/games/${sessionId}/results/${userId}`);
    return response.data.results;
  },

  // Export results as CSV
  exportResults: async (
    sessionId: string,
    format: 'csv' = 'csv'
  ): Promise<{ data: string; filename: string }> => {
    const response = await api.post(`/games/${sessionId}/export`, { format });
    return response.data;
  },
};
