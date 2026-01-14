import { firestore } from '../config/firebase';
import admin from 'firebase-admin';

export interface QuizQuestion {
  questionId: string;
  questionText: string;
  questionImageUrl?: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  points: number;
  timeLimit: number;
  explanation?: string;
  tags?: string[];
}

export interface Quiz {
  quizId?: string;
  title: string;
  description: string;
  teacherId: string;
  classId: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  totalQuestions: number;
  coverImageUrl?: string;
  questions: QuizQuestion[];
  isActive: boolean;
  isDraft: boolean;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  showCorrectAnswers?: boolean;
  allowRetake?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

const QUIZZES_COLLECTION = 'quizzes';

export const quizService = {
  // Create a new quiz
  async createQuiz(quizData: Omit<Quiz, 'quizId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Validate quiz data
      this.validateQuiz(quizData);

      const quizRef = await firestore.collection(QUIZZES_COLLECTION).add({
        ...quizData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return quizRef.id;
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw new Error('Failed to create quiz');
    }
  },

  // Get quiz by ID
  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const quizDoc = await firestore.collection(QUIZZES_COLLECTION).doc(quizId).get();

      if (!quizDoc.exists) {
        return null;
      }

      return {
        quizId: quizDoc.id,
        ...quizDoc.data(),
      } as Quiz;
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw new Error('Failed to get quiz');
    }
  },

  // Get all quizzes for a teacher
  async getTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
    try {
      const querySnapshot = await firestore
        .collection(QUIZZES_COLLECTION)
        .where('teacherId', '==', teacherId)
        .get();

      return querySnapshot.docs.map((doc) => ({
        quizId: doc.id,
        ...doc.data(),
      })) as Quiz[];
    } catch (error) {
      console.error('Error getting teacher quizzes:', error);
      throw new Error('Failed to get teacher quizzes');
    }
  },

  // Update quiz
  async updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<void> {
    try {
      // Validate if updating questions
      if (updates.questions) {
        this.validateQuestions(updates.questions);
      }

      await firestore.collection(QUIZZES_COLLECTION).doc(quizId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw new Error('Failed to update quiz');
    }
  },

  // Delete quiz
  async deleteQuiz(quizId: string): Promise<void> {
    try {
      await firestore.collection(QUIZZES_COLLECTION).doc(quizId).delete();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw new Error('Failed to delete quiz');
    }
  },

  // Duplicate quiz
  async duplicateQuiz(quizId: string, teacherId: string): Promise<string> {
    try {
      const originalQuiz = await this.getQuizById(quizId);
      
      if (!originalQuiz) {
        throw new Error('Quiz not found');
      }

      // Verify the teacher owns this quiz
      if (originalQuiz.teacherId !== teacherId) {
        throw new Error('Unauthorized to duplicate this quiz');
      }

      // Create a copy with modified title
      const duplicatedQuiz: Omit<Quiz, 'quizId' | 'createdAt' | 'updatedAt'> = {
        ...originalQuiz,
        title: `${originalQuiz.title} (Copy)`,
        isDraft: true,
        isActive: false,
      };

      // Remove the quizId from the copy
      delete (duplicatedQuiz as any).quizId;
      delete (duplicatedQuiz as any).createdAt;
      delete (duplicatedQuiz as any).updatedAt;

      return await this.createQuiz(duplicatedQuiz);
    } catch (error) {
      console.error('Error duplicating quiz:', error);
      throw new Error('Failed to duplicate quiz');
    }
  },

  // Get quizzes by class
  async getQuizzesByClass(classId: string): Promise<Quiz[]> {
    try {
      const querySnapshot = await firestore
        .collection(QUIZZES_COLLECTION)
        .where('classId', '==', classId)
        .get();

      return querySnapshot.docs.map((doc) => ({
        quizId: doc.id,
        ...doc.data(),
      })) as Quiz[];
    } catch (error) {
      console.error('Error getting class quizzes:', error);
      throw new Error('Failed to get class quizzes');
    }
  },

  // Validation methods
  validateQuiz(quiz: Omit<Quiz, 'quizId' | 'createdAt' | 'updatedAt'>): void {
    if (!quiz.title || quiz.title.trim().length === 0) {
      throw new Error('Quiz title is required');
    }

    if (!quiz.teacherId) {
      throw new Error('Teacher ID is required');
    }

    if (!quiz.classId) {
      throw new Error('Class ID is required');
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      throw new Error('At least one question is required');
    }

    this.validateQuestions(quiz.questions);
  },

  validateQuestions(questions: QuizQuestion[]): void {
    questions.forEach((question, index) => {
      if (!question.questionText || question.questionText.trim().length === 0) {
        throw new Error(`Question ${index + 1}: Question text is required`);
      }

      if (!question.type) {
        throw new Error(`Question ${index + 1}: Question type is required`);
      }

      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length < 2) {
          throw new Error(`Question ${index + 1}: Multiple choice questions must have at least 2 options`);
        }
        
        if (question.options.length > 6) {
          throw new Error(`Question ${index + 1}: Multiple choice questions cannot have more than 6 options`);
        }
      }

      if (question.correctAnswer === undefined || question.correctAnswer === null || question.correctAnswer === '') {
        throw new Error(`Question ${index + 1}: Correct answer is required`);
      }

      if (!question.points || question.points <= 0) {
        throw new Error(`Question ${index + 1}: Points must be greater than 0`);
      }

      if (!question.timeLimit || question.timeLimit <= 0) {
        throw new Error(`Question ${index + 1}: Time limit must be greater than 0`);
      }
    });
  },

  // Generate question ID
  generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};
