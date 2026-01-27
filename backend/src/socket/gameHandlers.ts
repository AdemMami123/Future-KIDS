import { Server, Socket } from 'socket.io';
import { gameSessionService } from '../services/gameSessionService';
import { getUserProfile } from '../services/userService';

export const setupGameHandlers = (io: Server) => {
  console.log('🎮 Setting up Socket.IO game handlers...');
  
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Test event to verify connection
    socket.emit('connected', { socketId: socket.id });

    // Create game session
    socket.on(
      'create-game',
      async (
        data: {
          quizId: string;
          teacherId: string;
          classId: string;
          settings: { showAnswers: boolean; showLeaderboard: boolean };
        },
        callback: (response: {
          success: boolean;
          sessionId?: string;
          gameCode?: string;
          error?: string;
        }) => void
      ) => {
        try {
          const { sessionId, gameCode } =
            await gameSessionService.createGameSession(
              data.quizId,
              data.teacherId,
              data.classId,
              data.settings
            );

          // Join the teacher to the session room
          socket.join(sessionId);

          callback({
            success: true,
            sessionId,
            gameCode,
          });

          console.log(
            `🎮 Game created: ${sessionId} with code: ${gameCode}`
          );
        } catch (error: any) {
          console.error('Error creating game:', error);
          callback({
            success: false,
            error: error.message || 'Failed to create game',
          });
        }
      }
    );

    // Join game session
    socket.on(
      'join-game',
      async (
        data: { gameCode: string; userId: string },
        callback: (response: {
          success: boolean;
          session?: any;
          error?: string;
        }) => void
      ) => {
        try {
          // Find session by game code
          const session = await gameSessionService.getGameSessionByCode(
            data.gameCode
          );

          if (!session) {
            callback({
              success: false,
              error: 'Game not found. Please check the code and try again.',
            });
            return;
          }

          if (session.status !== 'waiting') {
            callback({
              success: false,
              error: 'This game has already started.',
            });
            return;
          }

          // Get user info
          const user = await getUserProfile(data.userId);

          if (!user) {
            callback({
              success: false,
              error: 'User not found',
            });
            return;
          }

          // Add participant to session
          await gameSessionService.addParticipant(
            session.sessionId!,
            data.userId,
            `${user.firstName} ${user.lastName}`,
            user.avatarUrl
          );

          // Join the socket room
          socket.join(session.sessionId!);

          // Store session ID in socket data
          socket.data.sessionId = session.sessionId;
          socket.data.userId = data.userId;

          // Get updated session
          const updatedSession = await gameSessionService.getGameSession(
            session.sessionId!
          );

          callback({
            success: true,
            session: updatedSession,
          });

          // Broadcast to all participants in the session
          io.to(session.sessionId!).emit('participant-joined', {
            participant: updatedSession?.participants.find(
              (p) => p.userId === data.userId
            ),
            participantCount: updatedSession?.participants.length || 0,
          });

          console.log(
            `👤 User ${user.firstName} joined game: ${session.sessionId} (Total: ${updatedSession?.participants.length})`
          );
        } catch (error: any) {
          console.error('Error joining game:', error);
          callback({
            success: false,
            error: error.message || 'Failed to join game',
          });
        }
      }
    );

    // Rejoin session room (for when teacher or student refreshes/navigates back)
    socket.on(
      'rejoin-session',
      async (
        data: { sessionId: string; userId: string },
        callback?: (response: { success: boolean; session?: any; error?: string }) => void
      ) => {
        try {
          const session = await gameSessionService.getGameSession(data.sessionId);

          if (!session) {
            callback?.({
              success: false,
              error: 'Session not found',
            });
            return;
          }

          // Join the socket room
          socket.join(data.sessionId);

          // Store session ID in socket data
          socket.data.sessionId = data.sessionId;
          socket.data.userId = data.userId;

          callback?.({
            success: true,
            session,
          });

          console.log(`🔄 User ${data.userId} rejoined session: ${data.sessionId} (${session.participants.length} participants)`);
        } catch (error: any) {
          console.error('Error rejoining session:', error);
          callback?.({
            success: false,
            error: error.message || 'Failed to rejoin session',
          });
        }
      }
    );

    // Get current question (for when student joins mid-game or after page refresh)
    socket.on(
      'get-current-question',
      async (
        data: { sessionId: string },
        callback?: (response: { success: boolean; question?: any; error?: string }) => void
      ) => {
        try {
          const question = await gameSessionService.getCurrentQuestion(data.sessionId);
          
          if (question) {
            callback?.({
              success: true,
              question,
            });
            console.log(`📝 Sent current question to client for session: ${data.sessionId}`);
          } else {
            callback?.({
              success: false,
              error: 'No question available',
            });
          }
        } catch (error: any) {
          console.error('Error getting current question:', error);
          callback?.({
            success: false,
            error: error.message || 'Failed to get current question',
          });
        }
      }
    );

    // Leave game session
    socket.on('leave-game', async (data: { sessionId: string; userId: string }) => {
      try {
        await gameSessionService.removeParticipant(data.sessionId, data.userId);

        socket.leave(data.sessionId);

        // Get updated session
        const updatedSession = await gameSessionService.getGameSession(
          data.sessionId
        );

        // Broadcast to remaining participants
        io.to(data.sessionId).emit('participant-left', {
          userId: data.userId,
          participantCount: updatedSession?.participants.length || 0,
        });

        console.log(`👋 User ${data.userId} left game: ${data.sessionId}`);
      } catch (error) {
        console.error('Error leaving game:', error);
      }
    });

    // Kick participant
    socket.on(
      'kick-participant',
      async (data: { sessionId: string; userId: string; teacherId: string }) => {
        try {
          // Verify the requester is the teacher
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session || session.teacherId !== data.teacherId) {
            return; // Unauthorized
          }

          await gameSessionService.removeParticipant(data.sessionId, data.userId);

          // Get updated session
          const updatedSession = await gameSessionService.getGameSession(
            data.sessionId
          );

          // Notify the kicked user
          io.to(data.sessionId).emit('participant-kicked', {
            userId: data.userId,
          });

          // Broadcast updated participant list
          io.to(data.sessionId).emit('participant-left', {
            userId: data.userId,
            participantCount: updatedSession?.participants.length || 0,
          });

          console.log(
            `🚫 User ${data.userId} kicked from game: ${data.sessionId}`
          );
        } catch (error) {
          console.error('Error kicking participant:', error);
        }
      }
    );

    // Start game
    socket.on(
      'start-game',
      async (
        data: { sessionId: string; teacherId: string },
        callback: (response: { success: boolean; error?: string }) => void
      ) => {
        try {
          // Verify the requester is the teacher
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session || session.teacherId !== data.teacherId) {
            callback({
              success: false,
              error: 'Unauthorized',
            });
            return;
          }

          await gameSessionService.startGameSession(data.sessionId);

          // Get the first question
          const firstQuestion = await gameSessionService.getCurrentQuestion(data.sessionId);

          // Broadcast game start to all participants
          io.to(data.sessionId).emit('game-started', {
            sessionId: data.sessionId,
          });

          // Immediately send the first question to all participants
          if (firstQuestion) {
            io.to(data.sessionId).emit('question-started', {
              question: firstQuestion,
              questionIndex: 0,
              totalQuestions: firstQuestion.totalQuestions,
              timePerQuestion: 30, // seconds
              startTime: Date.now(), // Unix timestamp for synchronization
            });
            console.log(`📝 First question sent for game: ${data.sessionId}`);
          }

          callback({
            success: true,
          });

          console.log(`🚀 Game started: ${data.sessionId}`);
        } catch (error: any) {
          console.error('Error starting game:', error);
          callback({
            success: false,
            error: error.message || 'Failed to start game',
          });
        }
      }
    );

    // Next question
    socket.on(
      'next-question',
      async (data: { sessionId: string; questionIndex: number }) => {
        try {
          await gameSessionService.updateCurrentQuestion(
            data.sessionId,
            data.questionIndex
          );

          // Broadcast to all participants
          io.to(data.sessionId).emit('question-changed', {
            questionIndex: data.questionIndex,
          });

          console.log(
            `📝 Question ${data.questionIndex} displayed in game: ${data.sessionId}`
          );
        } catch (error) {
          console.error('Error changing question:', error);
        }
      }
    );

    // Submit answer
    socket.on(
      'submit-answer',
      async (
        data: {
          sessionId: string;
          userId: string;
          userName?: string;
          questionId: string;
          answer: string | number;
          timeSpent: number;
        },
        callback: (response: {
          success: boolean;
          isCorrect?: boolean;
          points?: number;
          error?: string;
        }) => void
      ) => {
        try {
          console.log(`📝 Submit answer attempt - User: ${data.userId}, UserName: ${data.userName}, Session: ${data.sessionId}`);
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session) {
            console.error('❌ Session not found:', data.sessionId);
            callback({
              success: false,
              error: 'Session not found',
            });
            return;
          }

          console.log(`📋 Session has ${session.participants.length} participants:`, session.participants.map(p => ({ userId: p.userId, name: p.userName })));

          // Validate answer
          const validation = await gameSessionService.validateAnswer(
            session.quizId,
            data.questionId,
            data.answer
          );

          const isCorrect = validation.isCorrect;
          // Calculate points based on speed (max 1000 points)
          const speedBonus = Math.max(0, 1000 - (data.timeSpent * 10));
          const points = isCorrect ? Math.max(100, speedBonus) : 0;

          console.log(`✅ Answer validation - Correct: ${isCorrect}, Points: ${points}`);

          await gameSessionService.submitAnswer(
            data.sessionId,
            data.userId,
            data.questionId,
            data.answer,
            isCorrect,
            data.timeSpent,
            points,
            data.userName // Pass userName for recovery if participant not found
          );

          callback({
            success: true,
            isCorrect,
            points,
          });

          // Broadcast answer submitted to teacher
          io.to(data.sessionId).emit('answer-submitted', {
            userId: data.userId,
            questionId: data.questionId,
          });

          // Get updated session and broadcast leaderboard
          const updatedSession = await gameSessionService.getGameSession(
            data.sessionId
          );

          const leaderboard = updatedSession?.participants
            .sort((a, b) => b.score - a.score)
            .map((p, index) => ({
              rank: index + 1,
              userId: p.userId,
              userName: p.userName,
              score: p.score,
              avatarUrl: p.avatarUrl,
            }));

          io.to(data.sessionId).emit('leaderboard-updated', {
            leaderboard,
          });
        } catch (error: any) {
          console.error('Error submitting answer:', error);
          callback({
            success: false,
            error: error.message || 'Failed to submit answer',
          });
        }
      }
    );

    // Next question - Teacher advances to next question
    socket.on(
      'next-question',
      async (
        data: { sessionId: string; teacherId: string },
        callback: (response: {
          success: boolean;
          question?: any;
          questionIndex?: number;
          error?: string;
        }) => void
      ) => {
        try {
          const result = await gameSessionService.advanceToNextQuestion(
            data.sessionId,
            data.teacherId
          );

          // Broadcast to all participants
          io.to(data.sessionId).emit('question-started', {
            question: result.question,
            questionIndex: result.questionIndex,
            totalQuestions: result.totalQuestions,
            timePerQuestion: 30, // seconds
            startTime: Date.now(), // Unix timestamp for synchronization
          });

          callback({
            success: true,
            question: result.question,
            questionIndex: result.questionIndex,
          });

          console.log(
            `📝 Question ${result.questionIndex + 1} started in session: ${data.sessionId}`
          );
        } catch (error: any) {
          console.error('Error advancing question:', error);
          callback({
            success: false,
            error: error.message || 'Failed to advance question',
          });
        }
      }
    );

    // Question timeout - Auto-advance
    socket.on(
      'question-timeout',
      async (
        data: { sessionId: string },
        callback: (response: { success: boolean; error?: string }) => void
      ) => {
        try {
          // Mark timeout and prepare for next question
          io.to(data.sessionId).emit('question-timed-out', {
            sessionId: data.sessionId,
          });

          callback({
            success: true,
          });

          console.log(`⏰ Question timed out in session: ${data.sessionId}`);
        } catch (error: any) {
          console.error('Error handling timeout:', error);
          callback({
            success: false,
            error: error.message || 'Failed to handle timeout',
          });
        }
      }
    );

    // Pause game
    socket.on(
      'pause-game',
      async (
        data: { sessionId: string; teacherId: string },
        callback: (response: { success: boolean; error?: string }) => void
      ) => {
        try {
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session || session.teacherId !== data.teacherId) {
            callback({
              success: false,
              error: 'Unauthorized',
            });
            return;
          }

          io.to(data.sessionId).emit('game-paused', {
            sessionId: data.sessionId,
          });

          callback({
            success: true,
          });

          console.log(`⏸️ Game paused: ${data.sessionId}`);
        } catch (error: any) {
          console.error('Error pausing game:', error);
          callback({
            success: false,
            error: error.message || 'Failed to pause game',
          });
        }
      }
    );

    // Resume game
    socket.on(
      'resume-game',
      async (
        data: { sessionId: string; teacherId: string },
        callback: (response: { success: boolean; error?: string }) => void
      ) => {
        try {
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session || session.teacherId !== data.teacherId) {
            callback({
              success: false,
              error: 'Unauthorized',
            });
            return;
          }

          io.to(data.sessionId).emit('game-resumed', {
            sessionId: data.sessionId,
          });

          callback({
            success: true,
          });

          console.log(`▶️ Game resumed: ${data.sessionId}`);
        } catch (error: any) {
          console.error('Error resuming game:', error);
          callback({
            success: false,
            error: error.message || 'Failed to resume game',
          });
        }
      }
    );

    // End game
    socket.on(
      'end-game',
      async (
        data: { sessionId: string; teacherId: string },
        callback: (response: { success: boolean; results?: any; error?: string }) => void
      ) => {
        try {
          // Verify the requester is the teacher
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session || session.teacherId !== data.teacherId) {
            callback({
              success: false,
              error: 'Unauthorized',
            });
            return;
          }

          await gameSessionService.completeGameSession(data.sessionId);

          // Get the completed session with all participant data
          const completedSession = await gameSessionService.getGameSession(data.sessionId);
          
          // Get quiz details for complete results
          const { firestore } = require('../config/firebase');
          const quizDoc = await firestore.collection('quizzes').doc(session.quizId).get();
          const quiz = quizDoc.exists ? { quizId: quizDoc.id, ...quizDoc.data() } : null;
          
          // Calculate complete results inline
          const participants = completedSession?.participants || [];
          const questions = quiz?.questions || [];
          
          // Build leaderboard
          const leaderboard = participants
            .map((p: any) => ({
              userId: p.userId,
              userName: p.userName || 'Unknown',
              avatarUrl: p.avatarUrl,
              score: p.score || 0,
              totalAnswers: (p.answers || []).length,
              correctAnswers: (p.answers || []).filter((a: any) => a.isCorrect).length,
            }))
            .sort((a: any, b: any) => b.score - a.score)
            .map((p: any, index: number) => ({
              ...p,
              rank: index + 1,
            }));

          // Calculate question stats
          const questionStats = questions.map((question: any, index: number) => {
            const answers = participants.flatMap((p: any) =>
              (p.answers || []).filter((a: any) => a.questionId === question.questionId)
            );
            const correctCount = answers.filter((a: any) => a.isCorrect).length;
            const totalAnswers = answers.length;
            const averageTime = totalAnswers > 0
              ? answers.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0) / totalAnswers
              : 0;

            return {
              questionId: question.questionId,
              questionText: question.questionText || 'Question ' + (index + 1),
              questionNumber: index + 1,
              correctCount,
              incorrectCount: totalAnswers - correctCount,
              percentageCorrect: totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0,
              averageTime: Math.round(averageTime),
              totalAnswers,
            };
          });

          // Calculate overall statistics
          const totalCorrectAnswers = participants.reduce(
            (sum: number, p: any) => sum + (p.answers || []).filter((a: any) => a.isCorrect).length, 0
          );
          const totalAnswers = participants.reduce(
            (sum: number, p: any) => sum + (p.answers || []).length, 0
          );
          const averageScore = participants.length > 0
            ? participants.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / participants.length
            : 0;

          // Build complete game results
          const gameResults = {
            session: {
              sessionId: data.sessionId,
              gameCode: completedSession?.gameCode,
              status: 'completed',
              startedAt: completedSession?.startedAt,
              completedAt: completedSession?.completedAt,
            },
            quiz: quiz ? {
              quizId: quiz.quizId,
              title: quiz.title || 'Untitled Quiz',
              description: quiz.description || '',
              totalQuestions: questions.length,
            } : null,
            statistics: {
              totalParticipants: participants.length,
              participationRate: 100,
              averageScore: Math.round(averageScore),
              totalCorrectAnswers,
              totalAnswers,
              overallAccuracy: totalAnswers > 0 ? (totalCorrectAnswers / totalAnswers) * 100 : 0,
            },
            leaderboard,
            questionStats,
          };

          // Broadcast game end to all participants WITH complete results
          io.to(data.sessionId).emit('game-ended', gameResults);

          callback({
            success: true,
            results: gameResults,
          });

          console.log(`🏁 Game ended: ${data.sessionId} with ${participants.length} participants`);
        } catch (error: any) {
          console.error('Error ending game:', error);
          callback({
            success: false,
            error: error.message || 'Failed to end game',
          });
        }
      }
    );

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      // If user was in a game, remove them
      if (socket.data.sessionId && socket.data.userId) {
        try {
          await gameSessionService.removeParticipant(
            socket.data.sessionId,
            socket.data.userId
          );

          const updatedSession = await gameSessionService.getGameSession(
            socket.data.sessionId
          );

          io.to(socket.data.sessionId).emit('participant-left', {
            userId: socket.data.userId,
            participantCount: updatedSession?.participants.length || 0,
          });
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });
  });
};
