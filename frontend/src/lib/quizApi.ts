import api from './api';

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

export interface QuizFilters {
  subject?: string;
  difficulty?: string;
  classId?: string;
  isActive?: boolean;
  isDraft?: boolean;
  searchTerm?: string;
}

// Create a new quiz
export const createQuiz = async (quizData: Omit<Quiz, 'quizId' | 'createdAt' | 'updatedAt'>): Promise<{ quizId: string }> => {
  const response = await api.post('/quizzes', quizData);
  return response;
};

// Get all quizzes for a teacher
export const getTeacherQuizzes = async (teacherId: string): Promise<Quiz[]> => {
  const response = await api.get(`/quizzes/teacher/${teacherId}`);
  return response.quizzes;
};

// Get quiz by ID
export const getQuizById = async (quizId: string): Promise<Quiz> => {
  const response = await api.get(`/quizzes/${quizId}`);
  return response.quiz;
};

// Update quiz
export const updateQuiz = async (quizId: string, updates: Partial<Quiz>): Promise<void> => {
  await api.patch(`/quizzes/${quizId}`, updates);
};

// Delete quiz
export const deleteQuiz = async (quizId: string): Promise<void> => {
  await api.delete(`/quizzes/${quizId}`);
};

// Duplicate quiz
export const duplicateQuiz = async (quizId: string): Promise<{ quizId: string }> => {
  const response = await api.post(`/quizzes/${quizId}/duplicate`);
  return response;
};

// Get quizzes by class
export const getQuizzesByClass = async (classId: string): Promise<Quiz[]> => {
  const response = await api.get(`/quizzes/class/${classId}`);
  return response.quizzes;
};

// Upload image to Cloudinary via backend
export const uploadQuizImage = async (file: File, type: 'cover' | 'question' = 'cover'): Promise<string> => {
  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

    // Upload through backend
    const response = await api.post('/upload/image', {
      file: base64,
      type,
    });

    console.log('Upload response:', response);

    if (!response || !response.url) {
      console.error('Invalid response from upload endpoint:', response);
      throw new Error('Invalid response from server');
    }

    return response.url;
  } catch (error: any) {
    console.error('Image upload error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to upload image';
    throw new Error(errorMessage);
  }
};

// Filter quizzes
export const filterQuizzes = (quizzes: Quiz[], filters: QuizFilters): Quiz[] => {
  return quizzes.filter((quiz) => {
    if (filters.subject && quiz.subject !== filters.subject) return false;
    if (filters.difficulty && quiz.difficulty !== filters.difficulty) return false;
    if (filters.classId && quiz.classId !== filters.classId) return false;
    if (filters.isActive !== undefined && quiz.isActive !== filters.isActive) return false;
    if (filters.isDraft !== undefined && quiz.isDraft !== filters.isDraft) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const titleMatch = quiz.title.toLowerCase().includes(searchLower);
      const descriptionMatch = quiz.description?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descriptionMatch) return false;
    }
    return true;
  });
};

// Generate question ID
export const generateQuestionId = (): string => {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Validate quiz before submission
export const validateQuiz = (quiz: Partial<Quiz>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!quiz.title?.trim()) {
    errors.push('Quiz title is required');
  }

  if (!quiz.description?.trim()) {
    errors.push('Quiz description is required');
  }

  if (!quiz.subject?.trim()) {
    errors.push('Subject is required');
  }

  if (!quiz.classId) {
    errors.push('Class selection is required');
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    errors.push('At least one question is required');
  }

  if (quiz.questions) {
    quiz.questions.forEach((question, index) => {
      if (!question.questionText?.trim()) {
        errors.push(`Question ${index + 1}: Question text is required`);
      }

      if (question.type === 'multiple-choice') {
        if (!question.options || question.options.length < 2) {
          errors.push(`Question ${index + 1}: At least 2 options are required`);
        }
        if (question.options && question.options.length > 6) {
          errors.push(`Question ${index + 1}: Maximum 6 options allowed`);
        }
      }

      if (question.correctAnswer === undefined || question.correctAnswer === null || question.correctAnswer === '') {
        errors.push(`Question ${index + 1}: Correct answer is required`);
      }

      if (!question.points || question.points <= 0) {
        errors.push(`Question ${index + 1}: Points must be greater than 0`);
      }

      if (!question.timeLimit || question.timeLimit <= 0) {
        errors.push(`Question ${index + 1}: Time limit must be greater than 0`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Calculate total quiz points
export const calculateTotalPoints = (questions: QuizQuestion[]): number => {
  return questions.reduce((total, question) => total + (question.points || 0), 0);
};

// Calculate estimated quiz duration
export const calculateQuizDuration = (questions: QuizQuestion[]): number => {
  return questions.reduce((total, question) => total + (question.timeLimit || 0), 0);
};
