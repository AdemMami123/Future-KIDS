import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { firestore } from '../config/firebase';

const router = Router();

// Get full game results
router.get(
  '/:sessionId/results',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      // Get game session
      const sessionDoc = await firestore
        .collection('gameSessions')
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found',
        });
      }

      const session: any = { sessionId: sessionDoc.id, ...sessionDoc.data() };

      // Get quiz details
      const quizDoc = await firestore
        .collection('quizzes')
        .doc(session.quizId)
        .get();

      if (!quizDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      const quiz: any = { quizId: quizDoc.id, ...quizDoc.data() };

      // Calculate statistics
      const totalParticipants = session.participants.length;
      const totalQuestions = quiz.questions.length;

      // Question statistics
      const questionStats = quiz.questions.map((question: any, index: number) => {
        const answers = session.participants.flatMap((p: any) =>
          p.answers.filter((a: any) => a.questionId === question.questionId)
        );

        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        const totalAnswers = answers.length;
        const averageTime =
          answers.reduce((sum: number, a: any) => sum + a.timeSpent, 0) /
          (totalAnswers || 1);

        return {
          questionId: question.questionId,
          questionText: question.questionText,
          questionNumber: index + 1,
          correctCount,
          incorrectCount: totalAnswers - correctCount,
          percentageCorrect: (correctCount / (totalAnswers || 1)) * 100,
          averageTime: Math.round(averageTime),
          totalAnswers,
        };
      });

      // Sort participants by score for leaderboard
      const leaderboard = session.participants
        .map((p: any) => ({
          userId: p.userId,
          userName: p.userName,
          avatarUrl: p.avatarUrl,
          score: p.score,
          totalAnswers: p.answers.length,
          correctAnswers: p.answers.filter((a: any) => a.isCorrect).length,
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .map((p: any, index: number) => ({
          ...p,
          rank: index + 1,
        }));

      // Overall statistics
      const totalCorrectAnswers = session.participants.reduce(
        (sum: number, p: any) =>
          sum + p.answers.filter((a: any) => a.isCorrect).length,
        0
      );
      const totalAnswers = session.participants.reduce(
        (sum: number, p: any) => sum + p.answers.length,
        0
      );
      const averageScore =
        session.participants.reduce((sum: number, p: any) => sum + p.score, 0) /
        (totalParticipants || 1);

      const results = {
        session: {
          sessionId: session.sessionId,
          gameCode: session.gameCode,
          status: session.status,
          startedAt: session.startedAt,
          completedAt: session.completedAt,
        },
        quiz: {
          quizId: quiz.quizId,
          title: quiz.title,
          description: quiz.description,
          totalQuestions,
        },
        statistics: {
          totalParticipants,
          participationRate: 100, // All who joined participated
          averageScore: Math.round(averageScore),
          totalCorrectAnswers,
          totalAnswers,
          overallAccuracy: (totalCorrectAnswers / (totalAnswers || 1)) * 100,
        },
        leaderboard,
        questionStats,
      };

      return res.status(200).json({
        success: true,
        results,
      });
    } catch (error: any) {
      console.error('Error getting game results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get game results',
        error: error.message,
      });
    }
  }
);

// Get user-specific results
router.get(
  '/:sessionId/results/:userId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, userId } = req.params;

      // Get game session
      const sessionDoc = await firestore
        .collection('gameSessions')
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found',
        });
      }

      const session: any = { sessionId: sessionDoc.id, ...sessionDoc.data() };

      // Find participant
      const participant = session.participants.find(
        (p: any) => p.userId === userId
      );

      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'Participant not found in this session',
        });
      }

      // Get quiz details
      const quizDoc = await firestore
        .collection('quizzes')
        .doc(session.quizId)
        .get();

      if (!quizDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found',
        });
      }

      const quiz: any = { quizId: quizDoc.id, ...quizDoc.data() };

      // Calculate participant rank
      const sortedParticipants = session.participants
        .slice()
        .sort((a: any, b: any) => b.score - a.score);
      const rank =
        sortedParticipants.findIndex((p: any) => p.userId === userId) + 1;

      // Calculate class average
      const classAverage =
        session.participants.reduce((sum: number, p: any) => sum + p.score, 0) /
        session.participants.length;

      // Build answer review with correct answers
      const answerReview = quiz.questions.map((question: any, index: number) => {
        const userAnswer = participant.answers.find(
          (a: any) => a.questionId === question.questionId
        );

        return {
          questionNumber: index + 1,
          questionId: question.questionId,
          questionText: question.questionText,
          questionImageUrl: question.questionImageUrl,
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer?.answer || null,
          isCorrect: userAnswer?.isCorrect || false,
          points: userAnswer?.points || 0,
          timeSpent: userAnswer?.timeSpent || 0,
        };
      });

      const userResults = {
        participant: {
          userId: participant.userId,
          userName: participant.userName,
          score: participant.score,
          rank,
          totalParticipants: session.participants.length,
        },
        performance: {
          correctAnswers: participant.answers.filter((a: any) => a.isCorrect)
            .length,
          incorrectAnswers: participant.answers.filter((a: any) => !a.isCorrect)
            .length,
          totalQuestions: quiz.questions.length,
          accuracy:
            (participant.answers.filter((a: any) => a.isCorrect).length /
              quiz.questions.length) *
            100,
          classAverage: Math.round(classAverage),
          comparisonToAverage:
            ((participant.score - classAverage) / classAverage) * 100,
        },
        answerReview,
        quiz: {
          quizId: quiz.quizId,
          title: quiz.title,
          description: quiz.description,
        },
      };

      return res.status(200).json({
        success: true,
        results: userResults,
      });
    } catch (error: any) {
      console.error('Error getting user results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user results',
        error: error.message,
      });
    }
  }
);

// Export results as CSV
router.post(
  '/:sessionId/export',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { format = 'csv' } = req.body;

      // Get game session
      const sessionDoc = await firestore
        .collection('gameSessions')
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Game session not found',
        });
      }

      const session: any = { sessionId: sessionDoc.id, ...sessionDoc.data() };

      // Get quiz details
      const quizDoc = await firestore
        .collection('quizzes')
        .doc(session.quizId)
        .get();

      const quiz: any = quizDoc.exists ? quizDoc.data() : null;

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Rank',
          'Student Name',
          'Score',
          'Correct Answers',
          'Total Questions',
          'Accuracy %',
        ];

        const rows = session.participants
          .sort((a: any, b: any) => b.score - a.score)
          .map((p: any, index: number) => {
            const correctAnswers = p.answers.filter(
              (a: any) => a.isCorrect
            ).length;
            const totalQuestions = quiz?.questions?.length || p.answers.length;
            const accuracy = (correctAnswers / totalQuestions) * 100;

            return [
              index + 1,
              p.userName,
              p.score,
              correctAnswers,
              totalQuestions,
              accuracy.toFixed(1),
            ];
          });

        const csvContent = [
          headers.join(','),
          ...rows.map((row: any) => row.join(',')),
        ].join('\n');

        return res.status(200).json({
          success: true,
          data: csvContent,
          filename: `game-results-${sessionId}.csv`,
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Unsupported export format',
      });
    } catch (error: any) {
      console.error('Error exporting results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export results',
        error: error.message,
      });
    }
  }
);

export default router;
