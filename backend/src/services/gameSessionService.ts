import { firestore } from '../config/firebase';
import admin from 'firebase-admin';

export interface Participant {
  userId: string;
  userName: string;
  avatarUrl?: string;
  joinedAt: any;
  score: number;
  answers: Array<{
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    timeSpent: number;
    points: number;
  }>;
}

export interface GameSession {
  sessionId?: string;
  quizId: string;
  teacherId: string;
  classId: string;
  gameCode: string;
  status: 'waiting' | 'active' | 'completed';
  currentQuestionIndex: number;
  participants: Participant[];
  settings: {
    showAnswers: boolean;
    showLeaderboard: boolean;
    timePerQuestion?: number;
  };
  createdAt: any;
  startedAt?: any;
  completedAt?: any;
}

const GAME_SESSIONS_COLLECTION = 'gameSessions';

export const gameSessionService = {
  // Generate unique 6-digit game code
  generateUniqueGameCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create a new game session
  async createGameSession(
    quizId: string,
    teacherId: string,
    classId: string,
    settings: { showAnswers: boolean; showLeaderboard: boolean }
  ): Promise<{ sessionId: string; gameCode: string }> {
    try {
      // Generate unique game code
      let gameCode = this.generateUniqueGameCode();
      let isUnique = false;

      // Ensure game code is unique
      while (!isUnique) {
        const existingSession = await firestore
          .collection(GAME_SESSIONS_COLLECTION)
          .where('gameCode', '==', gameCode)
          .where('status', 'in', ['waiting', 'active'])
          .limit(1)
          .get();

        if (existingSession.empty) {
          isUnique = true;
        } else {
          gameCode = this.generateUniqueGameCode();
        }
      }

      const sessionData: Omit<GameSession, 'sessionId'> = {
        quizId,
        teacherId,
        classId,
        gameCode,
        status: 'waiting',
        currentQuestionIndex: 0,
        participants: [],
        settings,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const sessionRef = await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .add(sessionData);

      return {
        sessionId: sessionRef.id,
        gameCode,
      };
    } catch (error) {
      console.error('Error creating game session:', error);
      throw new Error('Failed to create game session');
    }
  },

  // Get game session by ID
  async getGameSession(sessionId: string): Promise<GameSession | null> {
    try {
      const sessionDoc = await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .get();

      if (!sessionDoc.exists) {
        return null;
      }

      return {
        sessionId: sessionDoc.id,
        ...sessionDoc.data(),
      } as GameSession;
    } catch (error) {
      console.error('Error getting game session:', error);
      throw new Error('Failed to get game session');
    }
  },

  // Get game session by code
  async getGameSessionByCode(gameCode: string): Promise<GameSession | null> {
    try {
      const querySnapshot = await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .where('gameCode', '==', gameCode)
        .where('status', 'in', ['waiting', 'active'])
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const sessionDoc = querySnapshot.docs[0];
      return {
        sessionId: sessionDoc.id,
        ...sessionDoc.data(),
      } as GameSession;
    } catch (error) {
      console.error('Error getting game session by code:', error);
      throw new Error('Failed to get game session');
    }
  },

  // Add participant to game session
  async addParticipant(
    sessionId: string,
    userId: string,
    userName: string,
    avatarUrl?: string
  ): Promise<void> {
    try {
      const session = await this.getGameSession(sessionId);

      if (!session) {
        throw new Error('Game session not found');
      }

      if (session.status !== 'waiting') {
        throw new Error('Game has already started');
      }

      // Check if user already joined
      const existingParticipant = session.participants.find(
        (p) => p.userId === userId
      );

      if (existingParticipant) {
        return; // Already joined
      }

      const participant: Participant = {
        userId,
        userName,
        avatarUrl,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        score: 0,
        answers: [],
      };

      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          participants: admin.firestore.FieldValue.arrayUnion(participant),
        });
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  },

  // Remove participant from game session
  async removeParticipant(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.getGameSession(sessionId);

      if (!session) {
        throw new Error('Game session not found');
      }

      const updatedParticipants = session.participants.filter(
        (p) => p.userId !== userId
      );

      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          participants: updatedParticipants,
        });
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  // Start game session
  async startGameSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getGameSession(sessionId);

      if (!session) {
        throw new Error('Game session not found');
      }

      if (session.status !== 'waiting') {
        throw new Error('Game has already started or completed');
      }

      if (session.participants.length === 0) {
        throw new Error('Cannot start game with no participants');
      }

      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          status: 'active',
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error starting game session:', error);
      throw error;
    }
  },

  // Update current question
  async updateCurrentQuestion(
    sessionId: string,
    questionIndex: number
  ): Promise<void> {
    try {
      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          currentQuestionIndex: questionIndex,
        });
    } catch (error) {
      console.error('Error updating current question:', error);
      throw error;
    }
  },

  // Submit answer
  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    answer: string | number,
    isCorrect: boolean,
    timeSpent: number,
    points: number
  ): Promise<void> {
    try {
      const session = await this.getGameSession(sessionId);

      if (!session) {
        throw new Error('Game session not found');
      }

      const participantIndex = session.participants.findIndex(
        (p) => p.userId === userId
      );

      if (participantIndex === -1) {
        throw new Error('Participant not found');
      }

      const participant = session.participants[participantIndex];

      // Check if already answered this question
      const existingAnswer = participant.answers.find(
        (a) => a.questionId === questionId
      );

      if (existingAnswer) {
        return; // Already answered
      }

      // Add answer and update score
      participant.answers.push({
        questionId,
        answer,
        isCorrect,
        timeSpent,
        points,
      });

      if (isCorrect) {
        participant.score += points;
      }

      session.participants[participantIndex] = participant;

      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          participants: session.participants,
        });
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },

  // Complete game session
  async completeGameSession(sessionId: string): Promise<void> {
    try {
      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error('Error completing game session:', error);
      throw error;
    }
  },

  // Get teacher's active sessions
  async getTeacherActiveSessions(teacherId: string): Promise<GameSession[]> {
    try {
      const querySnapshot = await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .where('teacherId', '==', teacherId)
        .where('status', 'in', ['waiting', 'active'])
        .get();

      return querySnapshot.docs.map((doc) => ({
        sessionId: doc.id,
        ...doc.data(),
      })) as GameSession[];
    } catch (error) {
      console.error('Error getting teacher active sessions:', error);
      throw error;
    }
  },
};
