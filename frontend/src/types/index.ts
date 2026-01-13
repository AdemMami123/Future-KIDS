// Global type definitions for the application

export interface User {
    userId: string;
    email: string;
    role: 'teacher' | 'student' | 'parent';
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Teacher extends User {
    role: 'teacher';
    schoolId?: string;
    subjects?: string[];
}

export interface Student extends User {
    role: 'student';
    grade?: string;
    classId?: string;
    parentIds?: string[];
}

export interface Parent extends User {
    role: 'parent';
    childrenIds?: string[];
}

export interface Class {
    classId: string;
    name: string;
    grade: string;
    teacherId: string;
    studentIds: string[];
    subject: string;
    createdAt: Date;
}

export interface Question {
    questionId: string;
    questionText: string;
    questionImageUrl?: string;
    type: 'multiple-choice' | 'true-false' | 'short-answer';
    options?: string[];
    correctAnswer: string | number;
    points: number;
    timeLimit: number;
}

export interface Quiz {
    quizId: string;
    title: string;
    description: string;
    teacherId: string;
    classId: string;
    subject: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeLimit: number;
    totalQuestions: number;
    coverImageUrl?: string;
    questions: Question[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface GameParticipant {
    userId: string;
    userName: string;
    joinedAt: Date;
    score: number;
    answers: Answer[];
}

export interface Answer {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
    points: number;
}

export interface GameSession {
    sessionId: string;
    quizId: string;
    teacherId: string;
    classId: string;
    status: 'waiting' | 'active' | 'completed';
    gameCode: string;
    currentQuestionIndex: number;
    participants: GameParticipant[];
    startedAt?: Date;
    completedAt?: Date;
}

export interface QuizAttempt {
    attemptId: string;
    quizId: string;
    studentId: string;
    sessionId?: string;
    status: 'in-progress' | 'completed';
    score: number;
    totalPoints: number;
    percentage: number;
    answers: Answer[];
    startedAt: Date;
    completedAt?: Date;
}

export interface ParentChildLink {
    linkId: string;
    parentId: string;
    childId: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Date;
    approvedAt?: Date;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Form types
export interface LoginFormData {
    email: string;
    password: string;
    role: 'teacher' | 'student' | 'parent';
}

export interface SignUpFormData extends LoginFormData {
    firstName: string;
    lastName: string;
    confirmPassword: string;
}

// Socket event types
export type SocketEvents =
    | 'create-game'
    | 'join-game'
    | 'leave-game'
    | 'start-game'
    | 'next-question'
    | 'submit-answer'
    | 'question-timeout'
    | 'pause-game'
    | 'resume-game'
    | 'end-game'
    | 'participant-joined'
    | 'participant-left'
    | 'game-started'
    | 'question-changed'
    | 'leaderboard-updated'
    | 'game-ended';

export interface SocketEventPayload {
    'create-game': { quizId: string; teacherId: string; classId: string };
    'join-game': { gameCode: string; userId: string; userName: string };
    'leave-game': { sessionId: string; userId: string };
    'start-game': { sessionId: string };
    'next-question': { sessionId: string };
    'submit-answer': { sessionId: string; userId: string; questionId: string; answer: string; timeSpent: number };
    'question-timeout': { sessionId: string };
    'pause-game': { sessionId: string };
    'resume-game': { sessionId: string };
    'end-game': { sessionId: string };
    'participant-joined': { participant: GameParticipant };
    'participant-left': { userId: string };
    'game-started': { session: GameSession };
    'question-changed': { questionIndex: number; question: Question };
    'leaderboard-updated': { leaderboard: GameParticipant[] };
    'game-ended': { results: GameSession };
}
