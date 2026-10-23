import { io } from 'socket.io-client';

// WebSocket connection
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: (callback) => callback({ token: localStorage.getItem('token') }),
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initializeSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Room Management
export const createRoom = (roomId, roomData, userId, username) => {
  const sock = getSocket();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      sock.off('room-created', onCreated);
    };
    const onCreated = (data) => {
      cleanup();
      if (data?.success) {
        if (data.charged) window.dispatchEvent(new Event('pointsUpdated'));
        resolve(data);
      }
      else reject(new Error(data?.message || 'Room creation failed'));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Room creation timeout'));
    }, 5000);
    sock.once('room-created', onCreated);
    sock.emit('create-room', { roomId, roomData, userId, username });
  });
};

export const joinRoom = (roomId, password, userId, username) => {
  const sock = getSocket();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      sock.off('room-joined', onJoined);
      sock.off('join-error', onJoinError);
    };
    const onJoined = (data) => { cleanup(); resolve(data); };
    const onJoinError = (error) => { cleanup(); reject(new Error(error.message)); };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Join room timeout'));
    }, 5000);
    sock.once('room-joined', onJoined);
    sock.once('join-error', onJoinError);
    sock.emit('join-room', { roomId, password, userId, username });
  });
};

export const setPlayerReady = (roomId, userId, ready) => {
  const sock = getSocket();
  sock.emit('player-ready', { roomId, userId, ready });
};

export const startGame = (roomId) => {
  const sock = getSocket();
  return new Promise((resolve, reject) => {
    // Listen for start-error (only once)
    const onStartError = (error) => {
      reject(new Error(error.message));
    };
    sock.once('start-error', onStartError);

    // Emit start-game — navigation is handled by the persistent onGameStarting listener in LobbyPage
    sock.emit('start-game', { roomId });

    // Resolve immediately — the actual game-starting event is handled by onGameStarting
    setTimeout(() => {
      sock.off('start-error', onStartError);
      resolve({ roomId });
    }, 500);

    // Fail if we get an explicit error
    setTimeout(() => {
      sock.off('start-error', onStartError);
      // Don't reject on timeout — the game may still start
    }, 8000);
  });
};

export const sendPlayerProgress = (roomId, userId, progress, testsPassed) => {
  const sock = getSocket();
  sock.emit('player-progress', { roomId, userId, progress, testsPassed });
};

export const sendPlayerFinished = (roomId, userId, time, score) => {
  const sock = getSocket();
  sock.emit('player-finished', { roomId, userId, time, score });
};

export const leaveRoom = (roomId, userId) => {
  const sock = getSocket();
  sock.emit('leave-room', { roomId, userId });
};

// Event Listeners
export const onPlayerJoined = (callback) => {
  const sock = getSocket();
  sock.on('player-joined', callback);
  return () => sock.off('player-joined', callback);
};

export const onPlayerLeft = (callback) => {
  const sock = getSocket();
  sock.on('player-left', callback);
  return () => sock.off('player-left', callback);
};

export const onPlayerStatusChanged = (callback) => {
  const sock = getSocket();
  sock.on('player-status-changed', callback);
  return () => sock.off('player-status-changed', callback);
};

export const onGameStarting = (callback) => {
  const sock = getSocket();
  sock.on('game-starting', callback);
  return () => sock.off('game-starting', callback);
};

export const onProgressUpdate = (callback) => {
  const sock = getSocket();
  sock.on('progress-update', callback);
  return () => sock.off('progress-update', callback);
};

export const onPlayerCompleted = (callback) => {
  const sock = getSocket();
  sock.on('player-completed', callback);
  return () => sock.off('player-completed', callback);
};

export const sendChatMessage = (roomId, message) => {
  const sock = getSocket();
  sock.emit('send-chat', { roomId, message });
};

export const onChatMessage = (callback) => {
  const sock = getSocket();
  sock.on('chat-message', callback);
  return () => sock.off('chat-message', callback);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  createRoom,
  joinRoom,
  setPlayerReady,
  startGame,
  sendPlayerProgress,
  sendPlayerFinished,
  leaveRoom,
  onPlayerJoined,
  onPlayerLeft,
  onPlayerStatusChanged,
  onGameStarting,
  onProgressUpdate,
  onPlayerCompleted,
  sendChatMessage,
  onChatMessage
};
