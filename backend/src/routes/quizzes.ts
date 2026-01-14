import express, { Request, Response } from 'express';
import { quizService } from '../services/quizService';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Create a new quiz
router.post('/', authenticate(['teacher']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only teachers can create quizzes
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create quizzes' });
    }

    const quizData = {
      ...req.body,
      teacherId: userId,
    };

    const quizId = await quizService.createQuiz(quizData);

    return res.status(201).json({
      success: true,
      quizId,
      message: 'Quiz created successfully',
    });
  } catch (error: any) {
    console.error('Error creating quiz:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create quiz',
    });
  }
});

// Get all quizzes for a teacher
router.get('/teacher/:teacherId', authenticate(['teacher']), async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;
    const userId = (req as any).user.userId;

    // Users can only get their own quizzes
    if (userId !== teacherId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const quizzes = await quizService.getTeacherQuizzes(teacherId);

    return res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    console.error('Error getting teacher quizzes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quizzes',
    });
  }
});

// Get quiz by ID
router.get('/:quizId', authenticate(), async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const quiz = await quizService.getQuizById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
      });
    }

    return res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error: any) {
    console.error('Error getting quiz:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quiz',
    });
  }
});

// Update quiz
router.patch('/:quizId', authenticate(['teacher']), async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only teachers can update quizzes
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can update quizzes' });
    }

    // Verify the teacher owns this quiz
    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacherId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this quiz' });
    }

    await quizService.updateQuiz(quizId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating quiz:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update quiz',
    });
  }
});

// Delete quiz
router.delete('/:quizId', authenticate(['teacher']), async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only teachers can delete quizzes
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can delete quizzes' });
    }

    // Verify the teacher owns this quiz
    const quiz = await quizService.getQuizById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.teacherId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this quiz' });
    }

    await quizService.deleteQuiz(quizId);

    return res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting quiz:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete quiz',
    });
  }
});

// Duplicate quiz
router.post('/:quizId/duplicate', authenticate(['teacher']), async (req: Request, res: Response) => {
  try {
    const { quizId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Only teachers can duplicate quizzes
    if (userRole !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can duplicate quizzes' });
    }

    const newQuizId = await quizService.duplicateQuiz(quizId, userId);

    return res.status(201).json({
      success: true,
      quizId: newQuizId,
      message: 'Quiz duplicated successfully',
    });
  } catch (error: any) {
    console.error('Error duplicating quiz:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to duplicate quiz',
    });
  }
});

// Get quizzes by class
router.get('/class/:classId', authenticate(), async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const quizzes = await quizService.getQuizzesByClass(classId);

    return res.status(200).json({
      success: true,
      quizzes,
    });
  } catch (error: any) {
    console.error('Error getting class quizzes:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get class quizzes',
    });
  }
});

export default router;
