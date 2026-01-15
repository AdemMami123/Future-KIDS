import api from './api';

export interface ChildInfo {
  childId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  grade?: string;
  classId?: string;
  avatarUrl?: string;
  linkedAt: Date;
  quickStats: {
    quizzesThisWeek: number;
    averageScore: string;
    currentStreak: number;
  };
}

export interface ChildStatistics {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  averagePercentage: number;
  timeSpent: number;
  timeSpentMinutes: number;
  quizzesThisWeek: number;
  streak: number;
  currentStreak: number;
  subjectBreakdown: SubjectStats[];
  recentAttempts: any[];
  performanceTrend: TrendPoint[];
}

export interface SubjectStats {
  subject: string;
  quizCount: number;
  quizzesTaken: number;
  averageScore: number;
  averagePercentage: number;
  totalPoints: number;
  totalScore: number;
  totalPossible: number;
  earnedPoints: number;
}

export interface TrendPoint {
  date: string;
  score: number;
  percentage: number;
  quizTitle: string;
}

export interface PerformanceAlert {
  type: 'low_score' | 'missed_quiz' | 'declining_trend' | 'streak_broken';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: Date;
  quizId?: string;
  quizTitle?: string;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ProgressReport {
  generatedAt: Date;
  student: {
    id: string;
    name: string;
    grade?: string;
    class?: string;
  };
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  statistics: ChildStatistics;
  alerts: PerformanceAlert[];
  summary: string;
}

export interface ClassComparison {
  quizId: string;
  classAverageScore: number;
  classAveragePercentage: number;
  studentScore: number;
  studentPercentage: number;
  comparison: 'above' | 'at' | 'below';
  difference: number;
}

export interface QuizAttemptWithQuiz {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  totalScore: number;
  percentage?: number;
  status: string;
  timeSpent: number;
  startedAt?: Date;
  completedAt?: Date;
  quiz: {
    id: string;
    title: string;
    subject: string;
    description?: string;
  };
}

export const parentApi = {
  /**
   * Get all linked children for a parent
   */
  async getChildren(parentId: string): Promise<ChildInfo[]> {
    try {
      const response = await api.get(`/parents/${parentId}/children`);
      return response?.children || [];
    } catch (error) {
      console.error('Error fetching children:', error);
      throw error;
    }
  },

  /**
   * Get detailed statistics for a specific child
   */
  async getChildStats(
    parentId: string,
    childId: string,
    timeRange: number = 30
  ): Promise<{
    child: any;
    statistics: ChildStatistics;
    alerts: PerformanceAlert[];
  }> {
    try {
      const response = await api.get(
        `/parents/${parentId}/children/${childId}/stats`,
        {
          params: { timeRange },
        }
      );
      return {
        child: response?.child,
        statistics: response?.statistics,
        alerts: response?.alerts || [],
      };
    } catch (error) {
      console.error('Error fetching child stats:', error);
      throw error;
    }
  },

  /**
   * Get quiz attempt history for a child
   */
  async getChildAttempts(
    parentId: string,
    childId: string,
    options?: {
      limit?: number;
      subject?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ attempts: QuizAttemptWithQuiz[]; total: number }> {
    try {
      const response = await api.get(
        `/parents/${parentId}/children/${childId}/attempts`,
        {
          params: options,
        }
      );
      return {
        attempts: response?.attempts || [],
        total: response?.total || 0,
      };
    } catch (error) {
      console.error('Error fetching child attempts:', error);
      throw error;
    }
  },

  /**
   * Generate comprehensive progress report
   */
  async generateReport(
    parentId: string,
    childId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      subjects?: string;
      includeComparison?: boolean;
    }
  ): Promise<ProgressReport> {
    try {
      const response = await api.get(
        `/parents/${parentId}/children/${childId}/report`,
        {
          params: options,
        }
      );
      return response?.report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  /**
   * Get performance alerts for all children
   */
  async getAlerts(parentId: string): Promise<PerformanceAlert[]> {
    try {
      const response = await api.get(`/parents/${parentId}/alerts`);
      return response?.alerts || [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  /**
   * Compare child's performance to class average for a specific quiz
   */
  async getClassComparison(
    parentId: string,
    childId: string,
    quizId: string
  ): Promise<ClassComparison | null> {
    try {
      const response = await api.get(
        `/parents/${parentId}/children/${childId}/comparison/${quizId}`
      );
      return response?.comparison || null;
    } catch (error) {
      console.error('Error fetching class comparison:', error);
      throw error;
    }
  },
};
