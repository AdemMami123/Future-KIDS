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
        createdAt: admin.firestore.Timestamp.now(),
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
      const sessionRef = firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId);
      
      // Use transaction to ensure consistent read
      const session = await firestore.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        
        if (!sessionDoc.exists) {
          return null;
        }

        const data = sessionDoc.data();
        return {
          sessionId: sessionDoc.id,
          ...data,
        } as GameSession;
      });
      
      if (session) {
        console.log(`📖 Fetched session ${sessionId}: status=${session.status}, participants=${session.participants?.length || 0}`);
      }
      
      return session;
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
      console.log(`➕ Adding participant ${userId} (${userName}) to session ${sessionId}`);
      const session = await this.getGameSession(sessionId);

      if (!session) {
        console.error(`❌ Session ${sessionId} not found`);
        throw new Error('Game session not found');
      }

      console.log(`📊 Session status: ${session.status}, Current participants: ${session.participants.length}`);

      if (session.status !== 'waiting') {
        console.error(`❌ Game has already started (status: ${session.status})`);
        throw new Error('Game has already started');
      }

      // Check if user already joined
      const existingParticipant = session.participants.find(
        (p) => p.userId === userId
      );

      if (existingParticipant) {
        console.log(`⚠️ User ${userId} already in session`);
        return; // Already joined
      }

      const participant: Participant = {
        userId,
        userName,
        avatarUrl,
        joinedAt: admin.firestore.Timestamp.now(),
        score: 0,
        answers: [],
      };

      console.log(`✍️ Writing participant to Firestore...`);
      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          participants: admin.firestore.FieldValue.arrayUnion(participant),
        });
      
      console.log(`✅ Participant ${userName} added successfully`);
    } catch (error) {
      console.error('❌ Error adding participant:', error);
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
      console.log(`🚀 Starting game session: ${sessionId}`);
      const session = await this.getGameSession(sessionId);

      if (!session) {
        console.error(`❌ Session ${sessionId} not found`);
        throw new Error('Game session not found');
      }

      console.log(`📊 Session status: ${session.status}, Participants: ${session.participants.length}`);

      if (session.status !== 'waiting') {
        console.error(`❌ Game already started (status: ${session.status})`);
        throw new Error('Game has already started or completed');
      }

      if (session.participants.length === 0) {
        console.error(`❌ No participants in session`);
        throw new Error('Cannot start game with no participants');
      }

      console.log(`✍️ Updating session status to active...`);
      const sessionRef = firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId);
      
      // Use a transaction to ensure participants are not lost
      await firestore.runTransaction(async (transaction) => {
        const doc = await transaction.get(sessionRef);
        if (!doc.exists) {
          throw new Error('Session not found');
        }
        
        transaction.update(sessionRef, {
          status: 'active',
          startedAt: admin.firestore.Timestamp.now(),
        });
      });
      
      console.log(`✅ Game session started successfully`);
    } catch (error) {
      console.error('❌ Error starting game session:', error);
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
    points: number,
    userName?: string // Optional userName for recovery
  ): Promise<void> {
    try {
      const sessionRef = firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId);

      await firestore.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        
        if (!sessionDoc.exists) {
          throw new Error('Game session not found');
        }

        const session = sessionDoc.data() as GameSession;
        let participants = session.participants || [];
        
        console.log(`📋 Session has ${participants.length} participants: [${participants.map(p => p.userName).join(', ')}]`);

        let participantIndex = participants.findIndex(
          (p) => p.userId === userId
        );

        // If participant not found but game is active, create a recovery participant
        if (participantIndex === -1) {
          if (session.status === 'active') {
            console.log(`⚠️ Participant ${userId} not found, creating recovery entry`);
            const recoveryParticipant: Participant = {
              userId,
              userName: userName || 'Unknown Player',
              joinedAt: admin.firestore.Timestamp.now(),
              score: 0,
              answers: [],
            };
            participants.push(recoveryParticipant);
            participantIndex = participants.length - 1;
          } else {
            throw new Error('Participant not found');
          }
        }

        const participant = participants[participantIndex];

        // Check if already answered this question
        const existingAnswer = participant.answers?.find(
          (a) => a.questionId === questionId
        );

        if (existingAnswer) {
          console.log(`⚠️ Question ${questionId} already answered by ${userId}`);
          return; // Already answered
        }

        // Initialize answers array if it doesn't exist
        if (!participant.answers) {
          participant.answers = [];
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
          participant.score = (participant.score || 0) + points;
        }

        participants[participantIndex] = participant;

        transaction.update(sessionRef, { participants });
        console.log(`✅ Answer submitted successfully for ${userId}`);
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
          completedAt: admin.firestore.Timestamp.now(),
        });
    } catch (error) {
      console.error('Error completing game session:', error);
      throw error;
    }
  },

  // Advance to next question
  async advanceToNextQuestion(
    sessionId: string,
    teacherId: string
  ): Promise<{ question: any; questionIndex: number; totalQuestions: number }> {
    try {
      const session = await this.getGameSession(sessionId);
      if (!session || session.teacherId !== teacherId) {
        throw new Error('Unauthorized or session not found');
      }

      // Get quiz to fetch questions
      const quizDoc = await firestore.collection('quizzes').doc(session.quizId).get();
      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }

      const quiz = quizDoc.data();
      const questions = quiz?.questions || [];

      // Check if there are more questions
      if (session.currentQuestionIndex >= questions.length - 1) {
        throw new Error('No more questions');
      }

      const newIndex = session.currentQuestionIndex + 1;
      const question = questions[newIndex];

      // Update session with new question index
      await firestore
        .collection(GAME_SESSIONS_COLLECTION)
        .doc(sessionId)
        .update({
          currentQuestionIndex: newIndex,
        });

      // Return question without correct answer for students
      const { correctAnswer, ...questionWithoutAnswer } = question;

      return {
        question: questionWithoutAnswer,
        questionIndex: newIndex,
        totalQuestions: questions.length,
      };
    } catch (error) {
      console.error('Error advancing to next question:', error);
      throw error;
    }
  },

  // Get current question
  async getCurrentQuestion(sessionId: string): Promise<any> {
    try {
      console.log(`📥 Getting current question for session: ${sessionId}`);
      const session = await this.getGameSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      console.log(`📊 Session before quiz load: participants=${session.participants?.length || 0}`);

      const quizDoc = await firestore.collection('quizzes').doc(session.quizId).get();
      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }
      
      console.log(`📚 Quiz loaded, checking session again...`);
      const sessionCheck = await this.getGameSession(sessionId);
      console.log(`📊 Session after quiz load: participants=${sessionCheck?.participants?.length || 0}`);

      const quiz = quizDoc.data();
      const questions = quiz?.questions || [];
      const question = questions[session.currentQuestionIndex];

      // Return question without correct answer
      if (question) {
        const { correctAnswer, ...questionWithoutAnswer } = question;
        return {
          ...questionWithoutAnswer,
          questionIndex: session.currentQuestionIndex,
          totalQuestions: questions.length,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting current question:', error);
      throw error;
    }
  },

  // Validate answer
  async validateAnswer(
    quizId: string,
    questionId: string,
    answer: string | number
  ): Promise<{ isCorrect: boolean; correctAnswer: any }> {
    try {
      const quizDoc = await firestore.collection('quizzes').doc(quizId).get();
      if (!quizDoc.exists) {
        throw new Error('Quiz not found');
      }

      const quiz = quizDoc.data();
      const question = quiz?.questions?.find((q: any) => q.questionId === questionId);

      if (!question) {
        console.error(`❌ Question ${questionId} not found in quiz ${quizId}`);
        console.log('📋 Available questions:', quiz?.questions?.map((q: any) => q.questionId));
        throw new Error('Question not found');
      }

      console.log(`🔍 Validating answer: user answered "${answer}" (type: ${typeof answer})`);
      console.log(`🔍 Correct answer stored: "${question.correctAnswer}" (type: ${typeof question.correctAnswer})`);
      console.log(`🔍 Question options:`, question.options);
      
      // Handle different answer formats
      let isCorrect = false;
      const userAnswerStr = String(answer).toLowerCase().trim();
      const correctAnswerValue = question.correctAnswer;
      
      // If correctAnswer is an index (number), compare with the option at that index
      if (typeof correctAnswerValue === 'number' && question.options) {
        const correctOptionText = String(question.options[correctAnswerValue]).toLowerCase().trim();
        isCorrect = userAnswerStr === correctOptionText;
        console.log(`🔍 Index-based comparison: "${userAnswerStr}" === "${correctOptionText}" (index ${correctAnswerValue}) = ${isCorrect}`);
      } 
      // If correctAnswer is also an index stored as string
      else if (!isNaN(Number(correctAnswerValue)) && question.options) {
        const correctOptionText = String(question.options[Number(correctAnswerValue)]).toLowerCase().trim();
        isCorrect = userAnswerStr === correctOptionText;
        console.log(`🔍 String-index comparison: "${userAnswerStr}" === "${correctOptionText}" (index ${correctAnswerValue}) = ${isCorrect}`);
      }
      // Direct comparison (answer text matches stored answer)
      else {
        const correctAnswerStr = String(correctAnswerValue).toLowerCase().trim();
        isCorrect = userAnswerStr === correctAnswerStr;
        console.log(`🔍 Direct comparison: "${userAnswerStr}" === "${correctAnswerStr}" = ${isCorrect}`);
      }

      return {
        isCorrect,
        correctAnswer: question.correctAnswer,
      };
    } catch (error) {
      console.error('Error validating answer:', error);
      throw error;
    }
  },

  // Calculate score with time bonus
  calculateScore(
    isCorrect: boolean,
    timeSpent: number,
    questionPoints: number,
    timeLimit: number
  ): number {
    if (!isCorrect) {
      return 0;
    }

    // Base points
    let score = questionPoints;

    // Time bonus: 25% extra for answering in first half of time limit
    if (timeSpent < timeLimit / 2) {
      const timeBonusPercentage = 0.25;
      score += Math.floor(questionPoints * timeBonusPercentage);
    }

    return score;
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
