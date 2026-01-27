import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface UseSocketOptions {
  autoConnect?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = false } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      console.log('🔌 Initializing Socket.IO connection to:', SOCKET_URL);
      
      const socket = io(SOCKET_URL, {
        path: '/socket.io/',
        transports: ['polling', 'websocket'],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        setIsConnected(true);
        setError(null);
      });

      socket.on('connected', (data) => {
        console.log('✅ Received connected event:', data);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
        setError(err.toString());
      });

      socketRef.current = socket;
    } catch (err: any) {
      setError(err.message);
      console.error('Socket initialization error:', err);
    }
  }, []);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Emit event
  const emit = useCallback((event: string, data?: any, callback?: (response: any) => void) => {
    if (socketRef.current?.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }, []);

  // Listen to event
  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  // Remove event listener
  const off = useCallback((event: string, handler?: (data: any) => void) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event, handler);
      } else {
        socketRef.current.off(event);
      }
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
};

// Game-specific hooks

export const useGameSocket = () => {
  const socket = useSocket({ autoConnect: true });

  const createGame = useCallback(
    (
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
      socket.emit('create-game', data, callback);
    },
    [socket]
  );

  const joinGame = useCallback(
    (
      data: { gameCode: string; userId: string },
      callback: (response: {
        success: boolean;
        session?: any;
        error?: string;
      }) => void
    ) => {
      socket.emit('join-game', data, callback);
    },
    [socket]
  );

  const rejoinSession = useCallback(
    (
      data: { sessionId: string; userId: string },
      callback: (response: {
        success: boolean;
        session?: any;
        error?: string;
      }) => void
    ) => {
      socket.emit('rejoin-session', data, callback);
    },
    [socket]
  );

  const leaveGame = useCallback(
    (data: { sessionId: string; userId: string }) => {
      socket.emit('leave-game', data);
    },
    [socket]
  );

  const kickParticipant = useCallback(
    (data: { sessionId: string; userId: string; teacherId: string }) => {
      socket.emit('kick-participant', data);
    },
    [socket]
  );

  const startGame = useCallback(
    (
      data: { sessionId: string; teacherId: string },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      socket.emit('start-game', data, callback);
    },
    [socket]
  );

  const nextQuestion = useCallback(
    (
      data: { sessionId: string; teacherId: string },
      callback: (response: {
        success: boolean;
        question?: any;
        questionIndex?: number;
        error?: string;
      }) => void
    ) => {
      socket.emit('next-question', data, callback);
    },
    [socket]
  );

  const pauseGame = useCallback(
    (
      data: { sessionId: string; teacherId: string },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      socket.emit('pause-game', data, callback);
    },
    [socket]
  );

  const resumeGame = useCallback(
    (
      data: { sessionId: string; teacherId: string },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      socket.emit('resume-game', data, callback);
    },
    [socket]
  );

  const questionTimeout = useCallback(
    (
      data: { sessionId: string },
      callback: (response: { success: boolean; error?: string }) => void
    ) => {
      socket.emit('question-timeout', data, callback);
    },
    [socket]
  );

  const submitAnswer = useCallback(
    (
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
      socket.emit('submit-answer', data, callback);
    },
    [socket]
  );

  const endGame = useCallback(
    (
      data: { sessionId: string; teacherId: string },
      callback: (response: { success: boolean; results?: any; error?: string }) => void
    ) => {
      socket.emit('end-game', data, callback);
    },
    [socket]
  );

  const getCurrentQuestion = useCallback(
    (
      data: { sessionId: string },
      callback: (response: { 
        success: boolean; 
        question?: any; 
        error?: string 
      }) => void
    ) => {
      socket.emit('get-current-question', data, callback);
    },
    [socket]
  );

  return {
    ...socket,
    createGame,
    joinGame,
    rejoinSession,
    leaveGame,
    kickParticipant,
    startGame,
    nextQuestion,
    pauseGame,
    resumeGame,
    questionTimeout,
    submitAnswer,
    endGame,
    getCurrentQuestion,
  };
};
