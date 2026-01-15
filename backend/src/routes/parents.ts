import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { analyticsService } from '../services/analyticsService';
import { firestore } from '../config/firebase';

const router = Router();

/**
 * @route   GET /api/parents/:parentId/children
 * @desc    Get all linked children for a parent
 * @access  Private (Parent only)
 */
router.get(
  '/:parentId/children',
  authenticate(['parent']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId } = req.params;

      // Verify the requesting user is the parent
      if (req.user?.userId !== parentId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized access',
        });
        return;
      }

      // Get all approved links
      const linksSnapshot = await firestore
        .collection('parentChildLinks')
        .where('parentId', '==', parentId)
        .where('status', '==', 'approved')
        .get();

      const children = [];
      for (const linkDoc of linksSnapshot.docs) {
        const link = linkDoc.data();
        const childId = link.childId;

        // Get child details
        const childDoc = await firestore.collection('users').doc(childId).get();
        if (childDoc.exists) {
          const childData = childDoc.data();

          // Get basic stats
          const stats = await analyticsService.calculateChildStatistics(
            childId,
            {
              startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              endDate: new Date(),
            }
          );

          children.push({
            childId,
            firstName: childData?.firstName,
            lastName: childData?.lastName,
            email: childData?.email,
            grade: childData?.grade,
            classId: childData?.classId,
            avatarUrl: childData?.avatarUrl,
            linkedAt: link.approvedAt,
            quickStats: {
              quizzesThisWeek: stats.quizzesThisWeek,
              averageScore: stats.averagePercentage.toFixed(1),
              currentStreak: stats.currentStreak,
            },
          });
        }
      }

      res.status(200).json({
        success: true,
        children,
      });
    } catch (error: any) {
      console.error('Get parent children error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching children',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/parents/:parentId/children/:childId/stats
 * @desc    Get detailed statistics for a specific child
 * @access  Private (Parent only)
 */
router.get(
  '/:parentId/children/:childId/stats',
  authenticate(['parent']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId, childId } = req.params;
      const { timeRange } = req.query;

      // Verify the requesting user is the parent
      if (req.user?.userId !== parentId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized access',
        });
        return;
      }

      // Verify parent-child link exists
      const linkSnapshot = await firestore
        .collection('parentChildLinks')
        .where('parentId', '==', parentId)
        .where('childId', '==', childId)
        .where('status', '==', 'approved')
        .get();

      if (linkSnapshot.empty) {
        res.status(403).json({
          success: false,
          message: 'No approved link exists with this child',
        });
        return;
      }

      // Calculate date range
      const days = parseInt(timeRange as string) || 30;
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Get comprehensive statistics
      const stats = await analyticsService.calculateChildStatistics(childId, {
        startDate,
        endDate,
      });

      // Get alerts
      const alerts = await analyticsService.detectLowPerformance(childId);

      // Get child info
      const childDoc = await firestore.collection('users').doc(childId).get();
      const childData = childDoc.exists ? childDoc.data() : null;

      res.status(200).json({
        success: true,
        child: {
          id: childId,
          firstName: childData?.firstName,
          lastName: childData?.lastName,
          grade: childData?.grade,
          classId: childData?.classId,
        },
        statistics: stats,
        alerts,
      });
    } catch (error: any) {
      console.error('Get child stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching child statistics',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/parents/:parentId/children/:childId/attempts
 * @desc    Get quiz attempt history for a child
 * @access  Private (Parent only)
 */
router.get(
  '/:parentId/children/:childId/attempts',
  authenticate(['parent']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId, childId } = req.params;
      const { limit, subject, startDate, endDate } = req.query;

      // Verify the requesting user is the parent
      if (req.user?.userId !== parentId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized access',
        });
        return;
      }

      // Verify parent-child link
      const linkSnapshot = await firestore
        .collection('parentChildLinks')
        .where('parentId', '==', parentId)
        .where('childId', '==', childId)
        .where('status', '==', 'approved')
        .get();

      if (linkSnapshot.empty) {
        res.status(403).json({
          success: false,
          message: 'No approved link exists with this child',
        });
        return;
      }

      // Get quiz attempts
      let query = firestore
        .collection('quizAttempts')
        .where('studentId', '==', childId)
        .where('status', '==', 'completed');

      const attemptsSnapshot = await query.get();

      let attempts = attemptsSnapshot.docs.map((doc: any) => ({
        attemptId: doc.id,
        ...doc.data(),
      })) as any[];

      // Filter by date range if provided
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate as string) : new Date(0);
        const end = endDate ? new Date(endDate as string) : new Date();

        attempts = attempts.filter((attempt) => {
          const attemptDate = attempt.completedAt?.toDate() || new Date();
          return attemptDate >= start && attemptDate <= end;
        });
      }

      // Get quiz details and filter by subject if provided
      const attemptsWithQuizzes = [];
      for (const attempt of attempts) {
        const quizDoc = await firestore.collection('quizzes').doc(attempt.quizId).get();
        if (quizDoc.exists) {
          const quizData = quizDoc.data();

          // Filter by subject if provided
          if (!subject || quizData?.subject === subject) {
            attemptsWithQuizzes.push({
              ...attempt,
              quiz: {
                quizId: attempt.quizId,
                title: quizData?.title,
                subject: quizData?.subject,
                difficulty: quizData?.difficulty,
              },
            });
          }
        }
      }

      // Sort by date (newest first)
      attemptsWithQuizzes.sort((a, b) => {
        const dateA = a.completedAt?.toDate() || new Date(0);
        const dateB = b.completedAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      // Apply limit if provided
      const limitNum = parseInt(limit as string) || attemptsWithQuizzes.length;
      const limitedAttempts = attemptsWithQuizzes.slice(0, limitNum);

      res.status(200).json({
        success: true,
        attempts: limitedAttempts,
        total: attemptsWithQuizzes.length,
      });
    } catch (error: any) {
      console.error('Get child attempts error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching quiz attempts',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/parents/:parentId/children/:childId/report
 * @desc    Generate comprehensive progress report
 * @access  Private (Parent only)
 */
router.get(
  '/:parentId/children/:childId/report',
  authenticate(['parent']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId, childId } = req.params;
      const { startDate, endDate, subjects, includeComparison } = req.query;

      // Verify the requesting user is the parent
      if (req.user?.userId !== parentId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized access',
        });
        return;
      }

      // Verify parent-child link
      const linkSnapshot = await firestore
        .collection('parentChildLinks')
        .where('parentId', '==', parentId)
        .where('childId', '==', childId)
        .where('status', '==', 'approved')
        .get();

      if (linkSnapshot.empty) {
        res.status(403).json({
          success: false,
          message: 'No approved link exists with this child',
        });
        return;
      }

      // Parse options
      const options: any = {};

      if (startDate || endDate) {
        options.dateRange = {
          startDate: startDate
            ? new Date(startDate as string)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: endDate ? new Date(endDate as string) : new Date(),
        };
      }

      if (subjects) {
        options.subjects =
          typeof subjects === 'string' ? subjects.split(',') : subjects;
      }

      options.includeComparison = includeComparison === 'true';

      // Generate report
      const report = await analyticsService.generateProgressReport(
        childId,
        options
      );

      res.status(200).json({
        success: true,
        report,
      });
    } catch (error: any) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating report',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/parents/:parentId/alerts
 * @desc    Get performance alerts for all children
 * @access  Private (Parent only)
 */
router.get(
  '/:parentId/alerts',
  authenticate(['parent']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId } = req.params;

      // Verify the requesting user is the parent
      if (req.user?.userId !== parentId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized access',
        });
        return;
      }

      // Get all linked children
      const linksSnapshot = await firestore
        .collection('parentChildLinks')
        .where('parentId', '==', parentId)
        .where('status', '==', 'approved')
        .get();

      const allAlerts: any[] = [];

      for (const linkDoc of linksSnapshot.docs) {
        const link = linkDoc.data();
        const childId = link.childId;

        // Get child details
        const childDoc = await firestore.collection('users').doc(childId).get();
        if (childDoc.exists) {
          const childData = childDoc.data();

          // Get alerts for this child
          const alerts = await analyticsService.detectLowPerformance(childId);

          // Add child info to alerts
          alerts.forEach((alert) => {
            allAlerts.push({
              ...alert,
              child: {
                id: childId,
                firstName: childData?.firstName,
                lastName: childData?.lastName,
              },
            });
          });
        }
      }

      // Sort by severity and date
      allAlerts.sort((a: any, b: any) => {
        const severityOrder: {[key: string]: number} = { high: 0, medium: 1, low: 2 };
        const severityDiff =
          severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;

        return b.date.getTime() - a.date.getTime();
      });

      res.status(200).json({
        success: true,
        alerts: allAlerts,
        count: allAlerts.length,
      });
    } catch (error: any) {
      console.error('Get alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching alerts',
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/parents/:parentId/children/:childId/comparison/:quizId
 * @desc    Compare child's performance to class average for a specific quiz
 * @access  Private (Parent only)
 */
router.get(
  '/:parentId/children/:childId/comparison/:quizId',
  authenticate(['parent']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId, childId, quizId } = req.params;

      // Verify the requesting user is the parent
      if (req.user?.userId !== parentId) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized access',
        });
        return;
      }

      // Verify parent-child link
      const linkSnapshot = await firestore
        .collection('parentChildLinks')
        .where('parentId', '==', parentId)
        .where('childId', '==', childId)
        .where('status', '==', 'approved')
        .get();

      if (linkSnapshot.empty) {
        res.status(403).json({
          success: false,
          message: 'No approved link exists with this child',
        });
        return;
      }

      // Get comparison data
      const comparison = await analyticsService.compareToClassAverage(
        childId,
        quizId
      );

      if (!comparison) {
        res.status(404).json({
          success: false,
          message: 'No data available for comparison',
        });
        return;
      }

      res.status(200).json({
        success: true,
        comparison,
      });
    } catch (error: any) {
      console.error('Get comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching comparison data',
        error: error.message,
      });
    }
  }
);

export default router;
