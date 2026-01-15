import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { firestore } from '../config/firebase';

const router = Router();

// Get assigned quizzes for a student
router.get(
  '/:studentId/quizzes',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      console.log('📚 Getting quizzes for student:', studentId);

      // Get student to find their class
      const studentDoc = await firestore.collection('users').doc(studentId).get();
      console.log('👤 Student found:', studentDoc.exists, 'ClassId:', studentDoc.data()?.classId);

      if (!studentDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
        });
      }

      const student: any = studentDoc.data();
      const classId = student.classId;

      if (!classId) {
        return res.status(200).json({
          success: true,
          quizzes: [],
        });
      }

      // Get quizzes assigned to student's class
      console.log('🔍 Querying quizzes for classId:', classId);
      const quizzesSnapshot = await firestore
        .collection('quizzes')
        .where('classId', '==', classId)
        .get();

      console.log('📋 Found', quizzesSnapshot.docs.length, 'quizzes');
      // Filter and sort in memory to avoid composite index requirement
      const quizzes = quizzesSnapshot.docs
        .map((doc) => ({
          quizId: doc.id,
          ...doc.data(),
        }))
        .filter((quiz: any) => quiz.isActive === true)
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime; // desc order
        });

      // Get student's attempts to mark completed quizzes
      console.log('📝 Fetching student attempts...');
      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', studentId)
        .get();

      console.log('✅ Found', attemptsSnapshot.docs.length, 'attempts');
      const completedQuizIds = new Set(
        attemptsSnapshot.docs.map((doc) => doc.data().quizId)
      );

      const quizzesWithStatus = quizzes.map((quiz: any) => ({
        ...quiz,
        isCompleted: completedQuizIds.has(quiz.quizId),
      }));

      return res.status(200).json({
        success: true,
        quizzes: quizzesWithStatus,
      });
    } catch (error: any) {
      console.error('Error getting student quizzes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get quizzes',
        error: error.message,
      });
    }
  }
);

// Get quiz history/attempts for a student
router.get(
  '/:studentId/attempts',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { subject, startDate, endDate, limit = 50 } = req.query;
      console.log('📝 Getting attempts for student:', studentId);

      // Build query - simplified to avoid requiring composite indexes
      let query = firestore
        .collection('quizAttempts')
        .where('studentId', '==', studentId)
        .where('status', '==', 'completed');

      // Note: Sorting and limiting will be done in memory to avoid composite index requirement

      const attemptsSnapshot = await query.get();

      // Apply date filters, sort, and limit in memory
      let filteredDocs = attemptsSnapshot.docs;
      if (startDate || endDate) {
        filteredDocs = attemptsSnapshot.docs.filter(doc => {
          const attemptData: any = doc.data();
          const completedAt = attemptData.completedAt?.toDate();
          if (!completedAt) return false;
          
          if (startDate && completedAt < new Date(startDate as string)) return false;
          if (endDate && completedAt > new Date(endDate as string)) return false;
          return true;
        });
      }
      
      // Sort by completedAt desc and apply limit
      filteredDocs = filteredDocs
        .sort((a, b) => {
          const aTime = a.data().completedAt?.toMillis() || 0;
          const bTime = b.data().completedAt?.toMillis() || 0;
          return bTime - aTime;
        })
        .slice(0, Number(limit) || 50);

      // Get unique quiz IDs and fetch all quizzes at once (avoid N+1 query problem)
      const uniqueQuizIds = [...new Set(filteredDocs.map((doc: any) => doc.data().quizId))];
      const quizPromises = uniqueQuizIds.map(id => 
        firestore.collection('quizzes').doc(id as string).get()
      );
      const quizDocs = await Promise.all(quizPromises);
      
      // Create a map of quizId to quiz data
      const quizMap: any = {};
      quizDocs.forEach((doc, index) => {
        if (doc.exists) {
          quizMap[uniqueQuizIds[index] as string] = doc.data();
        }
      });

      // Build attempts array with quiz data
      const attempts = filteredDocs.map((doc: any) => {
        const attemptData = doc.data();
        const quiz: any = quizMap[attemptData.quizId] || null;

        // Apply subject filter if specified
        if (subject && quiz?.subject !== subject) {
          return null;
        }

        return {
          attemptId: doc.id,
          ...attemptData,
          quiz: quiz
            ? {
                  quizId: attemptData.quizId,
                  title: quiz.title,
                  subject: quiz.subject,
                  difficulty: quiz.difficulty,
                  totalQuestions: quiz.questions?.length || 0,
                }
              : null,
        };
      });

      // Filter out null values (subject filter)
      const filteredAttempts = attempts.filter((a) => a !== null);

      return res.status(200).json({
        success: true,
        attempts: filteredAttempts,
      });
    } catch (error: any) {
      console.error('Error getting student attempts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get quiz history',
        error: error.message,
      });
    }
  }
);

// Get performance statistics for a student
router.get(
  '/:studentId/stats',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { timeRange = '30' } = req.query; // days
      console.log('📊 Getting stats for student:', studentId, 'timeRange:', timeRange);

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(timeRange));

      // Get all completed attempts - fetch all and filter/sort in memory to avoid index requirement
      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', studentId)
        .where('status', '==', 'completed')
        .get();

      // Filter by date range and sort in memory
      const filteredDocs = attemptsSnapshot.docs
        .filter(doc => {
          const data: any = doc.data();
          const completedAt = data.completedAt?.toDate();
          return completedAt && completedAt >= daysAgo;
        })
        .sort((a, b) => {
          const aTime = a.data().completedAt?.toMillis() || 0;
          const bTime = b.data().completedAt?.toMillis() || 0;
          return aTime - bTime; // asc order for stats calculation
        });

      const attempts: any[] = filteredDocs.map((doc) => ({
        attemptId: doc.id,
        ...doc.data(),
      }));

      // Calculate statistics
      const totalQuizzes = attempts.length;
      const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
      const averageScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;

      const totalPercentage = attempts.reduce(
        (sum, a) => sum + (a.percentage || 0),
        0
      );
      const averagePercentage =
        totalQuizzes > 0 ? totalPercentage / totalQuizzes : 0;

      // Calculate improvement (compare first half to second half)
      const midPoint = Math.floor(totalQuizzes / 2);
      const firstHalf = attempts.slice(0, midPoint);
      const secondHalf = attempts.slice(midPoint);

      const firstHalfAvg =
        firstHalf.length > 0
          ? firstHalf.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            firstHalf.length
          : 0;
      const secondHalfAvg =
        secondHalf.length > 0
          ? secondHalf.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            secondHalf.length
          : 0;

      const improvement =
        firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

      // Subject breakdown - Fetch all quizzes at once to avoid N+1 query problem
      const subjectStats: any = {};
      const uniqueQuizIds = [...new Set(attempts.map(a => a.quizId))];
      
      // Fetch all quiz documents in parallel
      const quizPromises = uniqueQuizIds.map(id => 
        firestore.collection('quizzes').doc(id).get()
      );
      const quizDocs = await Promise.all(quizPromises);
      
      // Create a map of quizId to quiz data
      const quizMap: any = {};
      quizDocs.forEach((doc, index) => {
        if (doc.exists) {
          quizMap[uniqueQuizIds[index]] = doc.data();
        }
      });
      
      // Now calculate subject stats using the map
      for (const attempt of attempts) {
        const quiz = quizMap[attempt.quizId];
        if (quiz) {
          const subject = quiz.subject || 'Unknown';

          if (!subjectStats[subject]) {
            subjectStats[subject] = {
              count: 0,
              totalScore: 0,
              totalPercentage: 0,
            };
          }

          subjectStats[subject].count++;
          subjectStats[subject].totalScore += attempt.score || 0;
          subjectStats[subject].totalPercentage += attempt.percentage || 0;
        }
      }

      // Calculate averages for each subject
      const subjectBreakdown = Object.keys(subjectStats).map((subject) => ({
        subject,
        quizzesCompleted: subjectStats[subject].count,
        averageScore:
          subjectStats[subject].totalScore / subjectStats[subject].count,
        averagePercentage:
          subjectStats[subject].totalPercentage / subjectStats[subject].count,
      }));

      // Recent performance (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentAttempts = attempts.filter(
        (a) => new Date(a.completedAt.toDate()) >= sevenDaysAgo
      );

      // Calculate streak (consecutive days with quizzes) - limit to last 30 days for performance
      const attemptsByDate: any = {};
      attempts.forEach((attempt) => {
        const date = new Date(attempt.completedAt.toDate())
          .toISOString()
          .split('T')[0];
        attemptsByDate[date] = true;
      });

      let currentStreak = 0;
      const today = new Date();
      const maxStreakDays = 30; // Check last 30 days max for performance
      for (let i = 0; i < maxStreakDays; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (attemptsByDate[dateStr]) {
          currentStreak++;
        } else if (i > 0) {
          // Allow grace for today
          break;
        }
      }

      const stats = {
        overview: {
          totalQuizzes,
          averageScore: Math.round(averageScore),
          averagePercentage: Math.round(averagePercentage * 10) / 10,
          improvement: Math.round(improvement * 10) / 10,
          currentStreak,
        },
        subjectBreakdown,
        recentActivity: {
          last7Days: recentAttempts.length,
          last30Days: attempts.length,
        },
        performanceTimeline: attempts.map((a) => ({
          date: a.completedAt.toDate(),
          score: a.score,
          percentage: a.percentage,
          quizId: a.quizId,
        })),
      };

      return res.status(200).json({
        success: true,
        stats,
      });
    } catch (error: any) {
      console.error('Error getting student stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: error.message,
      });
    }
  }
);

// Join a game with code
router.post('/join-game', authenticate(), async (req: Request, res: Response) => {
  try {
    const { gameCode, userId, userName } = req.body;

    if (!gameCode || !userId || !userName) {
      return res.status(400).json({
        success: false,
        message: 'Game code, user ID, and user name are required',
      });
    }

    // Find game session by code
    const sessionsSnapshot = await firestore
      .collection('gameSessions')
      .where('gameCode', '==', gameCode.toUpperCase())
      .where('status', '==', 'waiting')
      .limit(1)
      .get();

    if (sessionsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Game not found or already started',
      });
    }

    const sessionDoc = sessionsSnapshot.docs[0];
    const sessionId = sessionDoc.id;

    return res.status(200).json({
      success: true,
      sessionId,
      message: 'Game found',
    });
  } catch (error: any) {
    console.error('Error joining game:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join game',
      error: error.message,
    });
  }
});

export default router;
