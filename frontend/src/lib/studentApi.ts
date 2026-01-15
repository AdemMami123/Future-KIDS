import api from './api';

export interface Quiz {
  quizId: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalQuestions: number;
  timeLimit: number;
  coverImageUrl?: string;
  isCompleted: boolean;
  createdAt: any;
}

export interface QuizAttempt {
  attemptId: string;
  quizId: string;
  studentId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  completedAt: any;
  quiz: {
    quizId: string;
    title: string;
    subject: string;
    difficulty: string;
    totalQuestions: number;
  } | null;
}

export interface StudentStats {
  overview: {
    totalQuizzes: number;
    averageScore: number;
    averagePercentage: number;
    improvement: number;
    currentStreak: number;
  };
  subjectBreakdown: Array<{
    subject: string;
    quizzesCompleted: number;
    averageScore: number;
    averagePercentage: number;
  }>;
  recentActivity: {
    last7Days: number;
    last30Days: number;
  };
  performanceTimeline: Array<{
    date: Date;
    score: number;
    percentage: number;
    quizId: string;
  }>;
}

export const studentApi = {
  // Get assigned quizzes
  getQuizzes: async (studentId: string): Promise<Quiz[]> => {
    const response = await api.get(`/students/${studentId}/quizzes`);
    return response?.quizzes || [];
  },

  // Get quiz history/attempts
  getAttempts: async (
    studentId: string,
    filters?: {
      subject?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<QuizAttempt[]> => {
    const params = new URLSearchParams();
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(
      `/students/${studentId}/attempts?${params.toString()}`
    );
    return response?.attempts || [];
  },

  // Get performance statistics
  getStats: async (
    studentId: string,
    timeRange: number = 30
  ): Promise<StudentStats> => {
    const response = await api.get(
      `/students/${studentId}/stats?timeRange=${timeRange}`
    );
    return response?.stats || {
      totalQuizzes: 0,
      averageScore: 0,
      averagePercentage: 0,
      improvement: 0,
      streak: 0,
      subjectBreakdown: [],
      recentPerformance: []
    };
  },

  // Join game with code
  joinGame: async (gameCode: string, userId: string, userName: string) => {
    const response = await api.post('/students/join-game', {
      gameCode,
      userId,
      userName,
    });
    return response;
  },
};
