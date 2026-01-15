import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { firestore } from '../config/firebase';
import { gradingService } from '../services/gradingService';

const router = Router();

// Start a new quiz attempt
router.post(
  '/',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { quizId, studentId, mode = 'practice' } = req.body;

      if (!quizId || !studentId) {
        return res.status(400).json({
          success: false,
          message: 'Quiz ID and student ID are required',
        });
      }

      // Verify quiz exists
      const quizDoc = await firestore.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      // Create new attempt
      const attemptRef = firestore.collection('quizAttempts').doc();
      const attemptData = {
        attemptId: attemptRef.id,
        quizId,
        studentId,
        mode, // 'practice' or 'graded'
        status: 'in-progress',
        answers: [],
        score: 0,
        totalPoints: 0,
        percentage: 0,
        startedAt: new Date(),
        lastSavedAt: new Date(),
      };

      await attemptRef.set(attemptData);

      return res.status(201).json({
        success: true,
        attempt: attemptData,
      });
    } catch (error: any) {
      console.error('Error starting quiz attempt:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start quiz attempt',
        error: error.message,
      });
    }
  }
);

// Save progress (auto-save)
router.patch(
  '/:attemptId',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { attemptId } = req.params;
      const { answers, currentQuestionIndex } = req.body;

      const attemptDoc = await firestore.collection('quizAttempts').doc(attemptId).get();
      if (!attemptDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz attempt not found',
        });
      }

      const updateData: any = {
        lastSavedAt: new Date(),
      };

      if (answers) {
        updateData.answers = answers;
      }

      if (currentQuestionIndex !== undefined) {
        updateData.currentQuestionIndex = currentQuestionIndex;
      }

      await firestore.collection('quizAttempts').doc(attemptId).update(updateData);

      return res.status(200).json({
        success: true,
        message: 'Progress saved',
      });
    } catch (error: any) {
      console.error('Error saving progress:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save progress',
        error: error.message,
      });
    }
  }
);

// Submit quiz for grading
router.post(
  '/:attemptId/submit',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { attemptId } = req.params;
      const { answers } = req.body;

      // Get attempt
      const attemptDoc = await firestore.collection('quizAttempts').doc(attemptId).get();
      if (!attemptDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz attempt not found',
        });
      }

      // Update answers before grading
      await firestore.collection('quizAttempts').doc(attemptId).update({
        answers,
        lastSavedAt: new Date(),
      });

      // Grade the attempt
      const gradingResult = await gradingService.gradeAttempt(attemptId);

      // Save graded result
      await gradingService.saveGradedAttempt(attemptId, gradingResult);

      return res.status(200).json({
        success: true,
        result: gradingResult,
      });
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit quiz',
        error: error.message,
      });
    }
  }
);

// Get attempt details
router.get(
  '/:attemptId',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { attemptId } = req.params;

      const attemptDoc = await firestore.collection('quizAttempts').doc(attemptId).get();
      if (!attemptDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz attempt not found',
        });
      }

      const attemptData = attemptDoc.data();

      // Get quiz details
      const quizDoc = await firestore.collection('quizzes').doc(attemptData!.quizId).get();
      const quizData = quizDoc.exists ? quizDoc.data() : null;

      return res.status(200).json({
        success: true,
        attempt: {
          ...attemptData,
          quiz: quizData,
        },
      });
    } catch (error: any) {
      console.error('Error getting attempt details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get attempt details',
        error: error.message,
      });
    }
  }
);

// Get graded results
router.get(
  '/:attemptId/results',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { attemptId } = req.params;

      const attemptDoc = await firestore.collection('quizAttempts').doc(attemptId).get();
      if (!attemptDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz attempt not found',
        });
      }

      const attemptData: any = attemptDoc.data();

      if (attemptData.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Quiz has not been completed yet',
        });
      }

      // Get quiz details for question text and options
      const quizDoc = await firestore.collection('quizzes').doc(attemptData.quizId).get();
      const quizData: any = quizDoc.exists ? quizDoc.data() : null;

      return res.status(200).json({
        success: true,
        results: {
          score: attemptData.score,
          totalPoints: attemptData.totalPoints,
          percentage: attemptData.percentage,
          feedback: attemptData.feedback,
          gradedAnswers: attemptData.gradedAnswers,
          startedAt: attemptData.startedAt,
          completedAt: attemptData.completedAt,
          timeSpent: attemptData.completedAt && attemptData.startedAt
            ? ((attemptData.completedAt?.toMillis?.() || attemptData.completedAt?.getTime?.() || 0) - 
               (attemptData.startedAt?.toMillis?.() || attemptData.startedAt?.getTime?.() || 0)) / 1000
            : 0,
          quiz: quizData,
        },
      });
    } catch (error: any) {
      console.error('Error getting quiz results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get quiz results',
        error: error.message,
      });
    }
  }
);

// Get incomplete attempts for resume functionality
router.get(
  '/student/:studentId/incomplete',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;

      const attemptsSnapshot = await firestore
        .collection('quizAttempts')
        .where('studentId', '==', studentId)
        .where('status', '==', 'in-progress')
        .get();

      const incompleteAttempts = attemptsSnapshot.docs.map(doc => ({
        attemptId: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        success: true,
        attempts: incompleteAttempts,
      });
    } catch (error: any) {
      console.error('Error getting incomplete attempts:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get incomplete attempts',
        error: error.message,
      });
    }
  }
);

export default router;
