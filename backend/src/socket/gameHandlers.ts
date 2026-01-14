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
            `👤 User ${user.firstName} joined game: ${session.sessionId}`
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

          // Broadcast game start to all participants
          io.to(data.sessionId).emit('game-started', {
            sessionId: data.sessionId,
          });

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
          const session = await gameSessionService.getGameSession(
            data.sessionId
          );

          if (!session) {
            callback({
              success: false,
              error: 'Session not found',
            });
            return;
          }

          // TODO: Import quiz service to get question details
          // For now, we'll need to validate the answer
          // This should integrate with your quiz service
          const isCorrect = true; // Placeholder
          const points = 100; // Placeholder

          await gameSessionService.submitAnswer(
            data.sessionId,
            data.userId,
            data.questionId,
            data.answer,
            isCorrect,
            data.timeSpent,
            points
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

    // End game
    socket.on(
      'end-game',
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

          await gameSessionService.completeGameSession(data.sessionId);

          // Broadcast game end to all participants
          io.to(data.sessionId).emit('game-ended', {
            sessionId: data.sessionId,
          });

          callback({
            success: true,
          });

          console.log(`🏁 Game ended: ${data.sessionId}`);
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
