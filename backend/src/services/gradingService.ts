import { firestore } from '../config/firebase';

interface Answer {
  questionId: string;
  answer: string | number;
  timeSpent: number;
}

interface Question {
  questionId: string;
  correctAnswer: string | number;
  points: number;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
}

interface GradingResult {
  score: number;
  totalPoints: number;
  percentage: number;
  gradedAnswers: Array<{
    questionId: string;
    isCorrect: boolean;
    points: number;
    correctAnswer: string | number;
    studentAnswer: string | number;
  }>;
  feedback: string;
}

export class GradingService {
  /**
   * Grade a quiz attempt
   */
  async gradeAttempt(attemptId: string): Promise<GradingResult> {
    try {
      // Get the attempt
      const attemptDoc = await firestore.collection('quizAttempts').doc(attemptId).get();
      if (!attemptDoc.exists) {
        throw new Error('Quiz attempt not found');
      }

      const attemptData: any = attemptDoc.data();
      
      // Get the quiz to access correct answers
      const quizDoc = await firestore.collection('quizzes').doc(attemptData.quizId).get();
      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }

      const quizData: any = quizDoc.data();
      const questions: Question[] = quizData.questions || [];
      const answers: Answer[] = attemptData.answers || [];

      // Grade each answer
      const gradedAnswers = answers.map(answer => {
        const question = questions.find(q => q.questionId === answer.questionId);
        if (!question) {
          return {
            questionId: answer.questionId,
            isCorrect: false,
            points: 0,
            correctAnswer: '',
            studentAnswer: answer.answer,
          };
        }

        const isCorrect = this.checkAnswer(
          answer.answer,
          question.correctAnswer,
          question.type
        );

        return {
          questionId: answer.questionId,
          isCorrect,
          points: isCorrect ? question.points : 0,
          correctAnswer: question.correctAnswer,
          studentAnswer: answer.answer,
        };
      });

      // Calculate totals
      const score = gradedAnswers.reduce((sum, ans) => sum + ans.points, 0);
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

      // Generate feedback
      const feedback = this.generateFeedback(percentage);

      return {
        score,
        totalPoints,
        percentage,
        gradedAnswers,
        feedback,
      };
    } catch (error: any) {
      console.error('Error grading attempt:', error);
      throw error;
    }
  }

  /**
   * Check if an answer is correct
   */
  private checkAnswer(
    studentAnswer: string | number,
    correctAnswer: string | number,
    questionType: string
  ): boolean {
    if (questionType === 'short-answer') {
      // Case-insensitive comparison for short answers
      const studentStr = String(studentAnswer).trim().toLowerCase();
      const correctStr = String(correctAnswer).trim().toLowerCase();
      return studentStr === correctStr;
    }

    // For multiple-choice and true-false, exact match
    return studentAnswer === correctAnswer;
  }

  /**
   * Calculate score from answers
   */
  calculateScore(
    answers: Answer[],
    questions: Question[]
  ): { score: number; totalPoints: number; percentage: number } {
    let score = 0;
    let totalPoints = 0;

    questions.forEach(question => {
      totalPoints += question.points;
      const studentAnswer = answers.find(a => a.questionId === question.questionId);
      
      if (studentAnswer && this.checkAnswer(
        studentAnswer.answer,
        question.correctAnswer,
        question.type
      )) {
        score += question.points;
      }
    });

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    return { score, totalPoints, percentage };
  }

  /**
   * Generate personalized feedback based on performance
   */
  generateFeedback(percentage: number): string {
    if (percentage >= 90) {
      return '🌟 Outstanding work! You\'ve mastered this material!';
    } else if (percentage >= 80) {
      return '🎉 Great job! You have a strong understanding of the concepts.';
    } else if (percentage >= 70) {
      return '👍 Good effort! Review the missed questions to improve.';
    } else if (percentage >= 60) {
      return '📚 Keep practicing! Focus on the areas you found challenging.';
    } else if (percentage >= 50) {
      return '💪 Don\'t give up! Review the material and try again.';
    } else {
      return '📖 This topic needs more study. Review the material carefully and retake the quiz.';
    }
  }

  /**
   * Save graded attempt to Firestore
   */
  async saveGradedAttempt(
    attemptId: string,
    gradingResult: GradingResult
  ): Promise<void> {
    try {
      await firestore.collection('quizAttempts').doc(attemptId).update({
        status: 'completed',
        score: gradingResult.score,
        totalPoints: gradingResult.totalPoints,
        percentage: gradingResult.percentage,
        feedback: gradingResult.feedback,
        gradedAnswers: gradingResult.gradedAnswers,
        completedAt: new Date(),
      });
    } catch (error: any) {
      console.error('Error saving graded attempt:', error);
      throw error;
    }
  }
}

export const gradingService = new GradingService();
