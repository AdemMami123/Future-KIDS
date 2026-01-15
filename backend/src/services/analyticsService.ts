import { firestore } from '../config/firebase';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ChildStatistics {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  averagePercentage: number;
  timeSpentMinutes: number;
  quizzesThisWeek: number;
  currentStreak: number;
  subjectBreakdown: SubjectStats[];
  recentAttempts: any[];
  performanceTrend: TrendPoint[];
}

interface SubjectStats {
  subject: string;
  quizCount: number;
  averageScore: number;
  averagePercentage: number;
  totalPoints: number;
  earnedPoints: number;
}

interface TrendPoint {
  date: string;
  score: number;
  percentage: number;
  quizTitle: string;
}

interface ClassAverage {
  quizId: string;
  classAverageScore: number;
  classAveragePercentage: number;
  studentScore: number;
  studentPercentage: number;
  comparison: 'above' | 'at' | 'below';
  difference: number;
}

interface PerformanceAlert {
  type: 'low_score' | 'missed_quiz' | 'declining_trend' | 'streak_broken';
  severity: 'low' | 'medium' | 'high';
  message: string;
  date: Date;
  quizId?: string;
  quizTitle?: string;
}

class AnalyticsService {
  /**
   * Calculate comprehensive statistics for a child
   */
  async calculateChildStatistics(
    childId: string,
    dateRange?: DateRange
  ): Promise<ChildStatistics> {
    try {
      // Set default date range (last 30 days)
      const endDate = dateRange?.endDate || new Date();
      const startDate =
        dateRange?.startDate ||
        new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all quiz attempts for the child
      const attemptsQuery = firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('status', '==', 'completed');

      const attemptsSnapshot = await attemptsQuery.get();
      const allAttempts = attemptsSnapshot.docs.map((doc: any) => ({
        attemptId: doc.id,
        ...doc.data(),
      }));

      // Filter by date range
      const attempts = allAttempts.filter((attempt: any) => {
        const attemptDate = attempt.completedAt?.toDate() || new Date();
        return attemptDate >= startDate && attemptDate <= endDate;
      });

      // Calculate basic stats
      const totalQuizzes = attempts.length;
      const completedQuizzes = attempts.filter(
        (a: any) => a.status === 'completed'
      ).length;

      const totalScore = attempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0);
      const totalPercentage = attempts.reduce(
        (sum, a) => sum + (a.percentage || 0),
        0
      );

      const averageScore =
        completedQuizzes > 0 ? totalScore / completedQuizzes : 0;
      const averagePercentage =
        completedQuizzes > 0 ? totalPercentage / completedQuizzes : 0;

      // Calculate time spent (estimate 2 minutes per question on average)
      const timeSpentMinutes = attempts.reduce((sum: number, attempt: any) => {
        const questionCount = attempt.answers?.length || 0;
        return sum + questionCount * 2; // 2 minutes per question
      }, 0);

      // Quizzes this week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const quizzesThisWeek = attempts.filter((a: any) => {
        const attemptDate = a.completedAt?.toDate() || new Date();
        return attemptDate >= oneWeekAgo;
      }).length;

      // Calculate current streak
      const currentStreak = await this.calculateStreak(childId);

      // Get subject breakdown
      const subjectBreakdown = await this.getSubjectBreakdown(childId, {
        startDate,
        endDate,
      });

      // Get recent attempts with quiz details
      const recentAttempts = await this.getRecentAttemptsWithQuizzes(
        childId,
        5
      );

      // Get performance trend
      const performanceTrend = this.calculatePerformanceTrend(attempts);

      return {
        totalQuizzes,
        completedQuizzes,
        averageScore,
        averagePercentage,
        timeSpentMinutes,
        quizzesThisWeek,
        currentStreak,
        subjectBreakdown,
        recentAttempts,
        performanceTrend,
      };
    } catch (error) {
      console.error('Error calculating child statistics:', error);
      throw error;
    }
  }

  /**
   * Get breakdown of performance by subject
   */
  async getSubjectBreakdown(
    childId: string,
    dateRange?: DateRange
  ): Promise<SubjectStats[]> {
    try {
      const endDate = dateRange?.endDate || new Date();
      const startDate =
        dateRange?.startDate ||
        new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all completed attempts
      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('status', '==', 'completed')
        .get();

      const attempts = attemptsSnapshot.docs
        .map((doc: any) => ({
          attemptId: doc.id,
          ...doc.data(),
        }) as any)
        .filter((attempt: any) => {
          const attemptDate = attempt.completedAt?.toDate() || new Date();
          return attemptDate >= startDate && attemptDate <= endDate;
        });

      // Get unique quiz IDs
      const quizIds = [...new Set(attempts.map((a) => a.quizId))];

      // Fetch quiz details
      const quizzes: any = {};
      for (const quizId of quizIds) {
        const quizDoc = await firestore.collection('quizzes').doc(quizId).get();
        if (quizDoc.exists) {
          quizzes[quizId] = quizDoc.data();
        }
      }

      // Group by subject
      const subjectMap = new Map<string, any[]>();
      attempts.forEach((attempt) => {
        const quiz = quizzes[attempt.quizId];
        if (quiz && quiz.subject) {
          const subject = quiz.subject;
          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, []);
          }
          subjectMap.get(subject)?.push(attempt);
        }
      });

      // Calculate stats for each subject
      const subjectBreakdown: SubjectStats[] = [];
      subjectMap.forEach((attempts, subject) => {
        const quizCount = attempts.length;
        const totalScore = attempts.reduce(
          (sum, a) => sum + (a.score || 0),
          0
        );
        const totalPercentage = attempts.reduce(
          (sum, a) => sum + (a.percentage || 0),
          0
        );
        const totalPoints = attempts.reduce(
          (sum, a) => sum + (a.totalPoints || 0),
          0
        );

        subjectBreakdown.push({
          subject,
          quizCount,
          averageScore: quizCount > 0 ? totalScore / quizCount : 0,
          averagePercentage: quizCount > 0 ? totalPercentage / quizCount : 0,
          totalPoints,
          earnedPoints: totalScore,
        });
      });

      return subjectBreakdown.sort((a, b) => b.quizCount - a.quizCount);
    } catch (error) {
      console.error('Error getting subject breakdown:', error);
      throw error;
    }
  }

  /**
   * Compare student performance to class average
   */
  async compareToClassAverage(
    childId: string,
    quizId: string
  ): Promise<ClassAverage | null> {
    try {
      // Get student's attempt
      const studentAttemptSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('quizId', '==', quizId)
        .where('status', '==', 'completed')
        .orderBy('completedAt', 'desc')
        .limit(1)
        .get();

      if (studentAttemptSnapshot.empty) {
        return null;
      }

      const studentAttempt = studentAttemptSnapshot.docs[0].data();

      // Get quiz to find classId
      const quizDoc = await firestore.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) {
        return null;
      }

      const quiz = quizDoc.data();
      const classId = quiz?.classId;

      if (!classId) {
        return null;
      }

      // Get all students in the class
      const classDoc = await firestore.collection('classes').doc(classId).get();
      if (!classDoc.exists) {
        return null;
      }

      const classData = classDoc.data();
      const studentIds = classData?.studentIds || [];

      // Get all completed attempts for this quiz from class students
      const allAttemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('quizId', '==', quizId)
        .where('status', '==', 'completed')
        .get();

      const classAttempts = allAttemptsSnapshot.docs
        .map((doc: any) => doc.data() as any)
        .filter((attempt: any) => studentIds.includes(attempt.studentId));

      if (classAttempts.length === 0) {
        return null;
      }

      // Calculate class average
      const totalClassScore = classAttempts.reduce(
        (sum, a) => sum + (a.score || 0),
        0
      );
      const totalClassPercentage = classAttempts.reduce(
        (sum, a) => sum + (a.percentage || 0),
        0
      );

      const classAverageScore = totalClassScore / classAttempts.length;
      const classAveragePercentage =
        totalClassPercentage / classAttempts.length;

      const studentScore = studentAttempt.score || 0;
      const studentPercentage = studentAttempt.percentage || 0;

      const difference = studentPercentage - classAveragePercentage;
      let comparison: 'above' | 'at' | 'below' = 'at';

      if (difference > 5) {
        comparison = 'above';
      } else if (difference < -5) {
        comparison = 'below';
      }

      return {
        quizId,
        classAverageScore,
        classAveragePercentage,
        studentScore,
        studentPercentage,
        comparison,
        difference,
      };
    } catch (error) {
      console.error('Error comparing to class average:', error);
      throw error;
    }
  }

  /**
   * Detect performance alerts
   */
  async detectLowPerformance(childId: string): Promise<PerformanceAlert[]> {
    try {
      const alerts: PerformanceAlert[] = [];

      // Get recent attempts (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('status', '==', 'completed')
        .get();

      const recentAttempts = attemptsSnapshot.docs
        .map((doc: any) => ({
          attemptId: doc.id,
          ...doc.data(),
        }) as any)
        .filter((attempt: any) => {
          const attemptDate = attempt.completedAt?.toDate() || new Date();
          return attemptDate >= sevenDaysAgo;
        })
        .sort((a: any, b: any) => {
          const dateA = a.completedAt?.toDate() || new Date(0);
          const dateB = b.completedAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      // Check for low scores (below 60%)
      const lowScoreAttempts = recentAttempts.filter(
        (a) => (a.percentage || 0) < 60
      );

      for (const attempt of lowScoreAttempts) {
        const quizDoc = await firestore
          .collection('quizzes')
          .doc(attempt.quizId)
          .get();
        const quizTitle = quizDoc.exists
          ? quizDoc.data()?.title
          : 'Unknown Quiz';

        alerts.push({
          type: 'low_score',
          severity: attempt.percentage < 40 ? 'high' : 'medium',
          message: `Scored ${attempt.percentage.toFixed(
            0
          )}% on "${quizTitle}"`,
          date: attempt.completedAt?.toDate() || new Date(),
          quizId: attempt.quizId,
          quizTitle,
        });
      }

      // Check for declining trend (last 3 quizzes)
      if (recentAttempts.length >= 3) {
        const last3 = recentAttempts.slice(0, 3);
        const isDecline =
          last3[0].percentage < last3[1].percentage &&
          last3[1].percentage < last3[2].percentage;

        if (isDecline) {
          alerts.push({
            type: 'declining_trend',
            severity: 'medium',
            message: `Performance declining over last 3 quizzes`,
            date: new Date(),
          });
        }
      }

      // Check streak status
      const currentStreak = await this.calculateStreak(childId);
      if (currentStreak === 0) {
        const lastAttempt = recentAttempts[0];
        if (lastAttempt) {
          const daysSinceLastQuiz = Math.floor(
            (Date.now() - lastAttempt.completedAt?.toDate()?.getTime()) /
              (24 * 60 * 60 * 1000)
          );

          if (daysSinceLastQuiz > 3) {
            alerts.push({
              type: 'streak_broken',
              severity: 'low',
              message: `No quiz activity in ${daysSinceLastQuiz} days`,
              date: new Date(),
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error detecting performance issues:', error);
      throw error;
    }
  }

  /**
   * Calculate current streak
   */
  private async calculateStreak(childId: string): Promise<number> {
    try {
      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('status', '==', 'completed')
        .get();

      const attempts = attemptsSnapshot.docs
        .map((doc: any) => doc.data() as any)
        .sort((a: any, b: any) => {
          const dateA = a.completedAt?.toDate() || new Date(0);
          const dateB = b.completedAt?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

      if (attempts.length === 0) return 0;

      let streak = 0;
      let lastDate = new Date();

      for (const attempt of attempts) {
        const attemptDate = attempt.completedAt?.toDate() || new Date();
        const daysDiff = Math.floor(
          (lastDate.getTime() - attemptDate.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysDiff <= 1) {
          streak++;
          lastDate = attemptDate;
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  }

  /**
   * Get recent attempts with quiz details
   */
  private async getRecentAttemptsWithQuizzes(
    childId: string,
    limit: number
  ): Promise<any[]> {
    try {
      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('status', '==', 'completed')
        .orderBy('completedAt', 'desc')
        .limit(limit)
        .get();

      const attempts = [];
      for (const doc of attemptsSnapshot.docs) {
        const attemptData = doc.data();
        const quizDoc = await firestore
          .collection('quizzes')
          .doc(attemptData.quizId)
          .get();

        attempts.push({
          attemptId: doc.id,
          ...attemptData,
          quiz: quizDoc.exists ? quizDoc.data() : null,
        });
      }

      return attempts;
    } catch (error) {
      console.error('Error getting recent attempts:', error);
      return [];
    }
  }

  /**
   * Calculate performance trend
   */
  private calculatePerformanceTrend(attempts: any[]): TrendPoint[] {
    const sorted = attempts
      .filter((a) => a.completedAt)
      .sort((a, b) => {
        const dateA = a.completedAt?.toDate() || new Date(0);
        const dateB = b.completedAt?.toDate() || new Date(0);
        return dateA.getTime() - dateB.getTime();
      });

    return sorted.map((attempt) => ({
      date:
        attempt.completedAt?.toDate()?.toISOString().split('T')[0] ||
        new Date().toISOString().split('T')[0],
      score: attempt.score || 0,
      percentage: attempt.percentage || 0,
      quizTitle: attempt.quiz?.title || 'Quiz',
    }));
  }

  /**
   * Generate progress report
   */
  async generateProgressReport(
    childId: string,
    options: {
      dateRange?: DateRange;
      subjects?: string[];
      includeComparison?: boolean;
    }
  ): Promise<any> {
    try {
      const stats = await this.calculateChildStatistics(
        childId,
        options.dateRange
      );
      const alerts = await this.detectLowPerformance(childId);

      // Get student info
      const studentDoc = await firestore.collection('users').doc(childId).get();
      const studentData = studentDoc.exists ? studentDoc.data() : null;

      return {
        generatedAt: new Date(),
        student: {
          id: childId,
          name: studentData
            ? `${studentData.firstName} ${studentData.lastName}`
            : 'Unknown',
          grade: studentData?.grade,
          class: studentData?.classId,
        },
        dateRange: options.dateRange,
        statistics: stats,
        alerts,
        summary: this.generateSummary(stats, alerts),
      };
    } catch (error) {
      console.error('Error generating progress report:', error);
      throw error;
    }
  }

  /**
   * Generate summary text
   */
  private generateSummary(
    stats: ChildStatistics,
    alerts: PerformanceAlert[]
  ): string {
    const { averagePercentage, quizzesThisWeek, currentStreak } = stats;

    let summary = '';

    if (averagePercentage >= 80) {
      summary =
        '✨ Excellent performance! Your child is demonstrating strong understanding across subjects.';
    } else if (averagePercentage >= 70) {
      summary =
        '👍 Good progress! Continue encouraging regular practice for even better results.';
    } else if (averagePercentage >= 60) {
      summary =
        '📚 Making progress with room for improvement. Consider reviewing challenging topics together.';
    } else {
      summary =
        '⚠️ Additional support may be needed. Consider reaching out to the teacher for guidance.';
    }

    if (quizzesThisWeek > 0) {
      summary += ` Completed ${quizzesThisWeek} quiz${
        quizzesThisWeek > 1 ? 'zes' : ''
      } this week.`;
    }

    if (currentStreak > 0) {
      summary += ` Currently on a ${currentStreak}-day streak! 🔥`;
    }

    if (alerts.filter((a) => a.severity === 'high').length > 0) {
      summary += ' Please review the alerts section for important notices.';
    }

    return summary;
  }
}

export const analyticsService = new AnalyticsService();
