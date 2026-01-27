import api from './api';

// Types
export interface ParticipantResult {
  userId: string;
  userName: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  totalAnswers: number;
  correctAnswers: number;
}

export interface QuestionStat {
  questionId: string;
  questionText: string;
  questionNumber: number;
  correctCount: number;
  incorrectCount: number;
  percentageCorrect: number;
  averageTime: number;
  totalAnswers: number;
}

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
  leaderboard: ParticipantResult[];
  questionStats: QuestionStat[];
}

export interface AnswerReview {
  questionNumber: number;
  questionId: string;
  questionText: string;
  questionImageUrl?: string;
  type: string;
  options: string[];
  correctAnswer: string | number;
  userAnswer: string | number | null;
  isCorrect: boolean;
  points: number;
  timeSpent: number;
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
  answerReview: AnswerReview[];
  quiz: {
    quizId: string;
    title: string;
    description: string;
  };
}

export const gameResultsApi = {
  // Get full game results (for teachers)
  getGameResults: async (sessionId: string): Promise<GameResults> => {
    const response = await api.get(`/games/${sessionId}/results`);
    return response.data.results;
  },

  // Get user-specific results (for students)
  getUserResults: async (sessionId: string, userId: string): Promise<UserResults> => {
    const response = await api.get(`/games/${sessionId}/results/${userId}`);
    return response.data.results;
  },

  // Export results as CSV
  exportResults: async (
    sessionId: string,
    format: 'csv' | 'pdf' = 'csv'
  ): Promise<{ data: string; filename: string }> => {
    const response = await api.post(`/games/${sessionId}/export`, { format });
    return {
      data: response.data.data,
      filename: response.data.filename,
    };
  },
};

export default gameResultsApi;
