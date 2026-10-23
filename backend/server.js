const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const http = require('http');
const { Server } = require('socket.io');
const { authenticateSocket, resolveSocketUserId } = require('./middleware/socketAuth');
const { verifyMultiplayerCompletionProof } = require('./utils/completionProof');
const { registerActiveChallenge, removeActiveChallenge } = require('./utils/activeChallenges');
const { ROOM_CREATION_COST, chargeRoomCreation, refundRoomCreation } = require('./utils/roomCreationCharge');
const { createCorsOptions } = require('./utils/corsPolicy');
const { setSocketServer, userRoom } = require('./utils/realtime');
const { securityHeaders } = require('./utils/securityHeaders');
const competitionRoutes = require('./routes/competitionRoutes');
const { ensureActiveSeason, startSeasonScheduler } = require('./services/seasons');
const { recordMatchResult } = require('./services/leaderboards');
const tournamentController = require('./controllers/tournamentController');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const codeValidationRoutes = require('./routes/codeValidationRoutes');
const computerModeRoutes = require('./routes/computerModeRoutes');
const { generateChallenge } = require('./data/challengeGenerator');

const app = express();
const server = http.createServer(app);
const corsOptions = createCorsOptions();

const io = new Server(server, {
  cors: corsOptions,
});
io.use(authenticateSocket);
setSocketServer(io);

// Connect to MongoDB
connectDB().then(async () => {
  try {
    await ensureActiveSeason(new Date());
  } catch (error) {
    console.error('[Tournament] Initial season setup failed:', error.message);
  }
  startSeasonScheduler();
  const tournamentCleanup = setInterval(() => {
    tournamentController.cleanupExpiredMatches().catch((error) => {
      console.error('[Tournament] Cleanup failed:', error.message);
    });
  }, 10 * 1000);
  tournamentCleanup.unref?.();
});

app.use(securityHeaders);
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Routes
app.use('/api', authRoutes);
app.use('/api', codeValidationRoutes);
app.use('/api', competitionRoutes);
app.use('/api/computer-mode', computerModeRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'GAME IN MY STYLE API Server',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status === 413 ? 413 : 500).json({
    message: err.status === 413 ? 'Request body is too large.' : 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET - COMPUTER MODE REAL-TIME MULTIPLAYER
// ═══════════════════════════════════════════════════════════════════════════

// In-memory room storage (in production, use Redis or MongoDB)
const rooms = new Map();
const pendingRoomCreations = new Map();

// Clean up old rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  
  rooms.forEach((room, roomId) => {
    if (now - room.createdAt > ROOM_TIMEOUT && room.status === 'waiting') {
      rooms.delete(roomId);
      console.log(`🗑️ Cleaned up inactive room: ${roomId}`);
    }
  });
}, 5 * 60 * 1000); // Run every 5 minutes

// ─── BOT CONFIGS AND ROSTER GENERATOR FOR SERVER-SIDE SIMULATION ───
// Submission windows: how many seconds BEFORE the end the bot submits
// Each entry is [minWindow, maxWindow] in seconds from end of timer
const BOT_SUBMIT_WINDOWS = {
  'Beginner Bot':        { 3:3,  4:5,  5:8,  6:10, 7:12, 8:15 },
  'Lazy Compiler':       { 3:4,  4:6,  5:9,  6:11, 7:13, 8:16 },
  'Logic Bot':           { 3:5,  4:7,  5:10, 6:12, 7:14, 8:17 },
  'Flash Coder':         { 3:6,  4:8,  5:11, 6:13, 7:15, 8:18 },
  'Test Case Destroyer': { 3:10, 4:12, 5:15, 6:20, 7:25, 8:30 },
};

// Phase durations as fractions of total time (excluding submit window)
const BOT_PHASE_RATIOS = {
  'Beginner Bot':        [0.15, 0.38, 0.22, 0.25],
  'Lazy Compiler':       [0.18, 0.35, 0.20, 0.27],
  'Logic Bot':           [0.12, 0.40, 0.25, 0.23],
  'Flash Coder':         [0.10, 0.42, 0.28, 0.20],
  'Test Case Destroyer': [0.08, 0.45, 0.30, 0.17],
};

// Returns the second at which bot submits (random within its window)
function getBotSubmitSecond(botName, totalSecs) {
  const timeMin = Math.round(totalSecs / 60);
  const windowKey = [3,4,5,6,7,8].includes(timeMin) ? timeMin : 5;
  const windows = BOT_SUBMIT_WINDOWS[botName] || BOT_SUBMIT_WINDOWS['Logic Bot'];
  const windowSecs = windows[windowKey] || 10;
  // Bot submits randomly within [totalSecs - windowSecs, totalSecs - 1]
  const submitAt = totalSecs - Math.floor(Math.random() * windowSecs) - 1;
  return Math.max(0, submitAt);
}

// Compute phase boundaries for a bot based on submitSecond
function getBotPhaseBoundaries(botName, submitSecond) {
  const ratios = BOT_PHASE_RATIOS[botName] || BOT_PHASE_RATIOS['Logic Bot'];
  const phases = [];
  let elapsed = 0;
  for (let i = 0; i < 4; i++) {
    const dur = Math.round(submitSecond * ratios[i]);
    phases.push({ start: elapsed, end: elapsed + dur });
    elapsed += dur;
  }
  // Phase 5 (submit) starts at submitSecond
  phases.push({ start: submitSecond, end: submitSecond + 1 });
  return phases;
}

// Get bot's current phase (1-5) based on elapsed seconds
function getBotPhase(phaseBoundaries, elapsedSecs, finished) {
  if (finished) return 5;
  for (let i = 4; i >= 0; i--) {
    if (elapsedSecs >= phaseBoundaries[i].start) return i + 1;
  }
  return 1;
}

const BOT_CONFIGS = {
  'Beginner Bot':        { tag: 'BOT-1'  },
  'Lazy Compiler':       { tag: 'BOT-2'  },
  'Logic Bot':           { tag: 'BOT-6'  },
  'Flash Coder':         { tag: 'BOT-7'  },
  'Test Case Destroyer': { tag: 'BOT-15' },
};
const ALL_BOT_NAMES = ['Beginner Bot', 'Lazy Compiler', 'Logic Bot', 'Flash Coder', 'Test Case Destroyer'];

function buildBotRoster(playerBots, playerMode) {
  // playerBots is an array of bot objects or bot names, one per player slot
  // Use each player's selected bot directly
  const names = [];
  for (let i = 0; i < playerMode; i++) {
    const raw = playerBots?.[i];
    let name;
    if (typeof raw === 'string') name = raw;
    else if (raw?.name) name = raw.name;
    else name = 'Logic Bot'; // Fallback only if truly not set
    // Validate the bot name exists in our config
    if (!BOT_CONFIGS[name]) name = 'Logic Bot';
    names.push(name);
  }
  return names;
}

const gameSessions = new Map();

async function endRound(roomId) {
  const sess = gameSessions.get(roomId);
  if (!sess || sess.finalized || sess.roundEnding) return;
  sess.roundEnding = true;

  if (sess.intervalId) {
    clearInterval(sess.intervalId);
    sess.intervalId = null;
  }

  // Per-player vs per-bot results
  // Each player[i] competes against bot[i]
  const playerResults = sess.players.map((p, idx) => {
    const bot = sess.bots[idx];
    const playerTime = p.finished ? p.timeUsed : Infinity;
    const botTime = bot && bot.finished ? (bot.finishedAt || bot.submitSecond) : Infinity;
    let outcome;
    if (!p.finished && (!bot || !bot.finished)) outcome = 'tie';
    else if (playerTime < botTime) outcome = 'player_wins';
    else if (botTime < playerTime) outcome = 'bot_wins';
    else outcome = 'tie'; // same time => tie
    return { userId: p.userId, username: p.username, outcome, playerTime, botTime };
  });

  let bestTime = Infinity;
  let roundWinnerName = 'AI';
  let roundWinnerType = 'ai';
  let winnerUserId = null;

  sess.players.forEach(p => {
    if (p.finished && p.timeUsed < bestTime) {
      bestTime = p.timeUsed;
      roundWinnerName = p.username;
      roundWinnerType = 'player';
      winnerUserId = p.userId;
    }
  });

  sess.bots.forEach(b => {
    const botTotalTime = b.finishedAt || b.submitSecond;
    if (b.finished && botTotalTime < bestTime) {
      bestTime = botTotalTime;
      roundWinnerName = b.name;
      roundWinnerType = 'ai';
      winnerUserId = null;
    }
  });

  if (roundWinnerType === 'player') {
    const playerObj = sess.players.find(p => p.userId === winnerUserId);
    if (playerObj) playerObj.score += 1;
  } else {
    sess.aiScore = (sess.aiScore || 0) + 1;
  }

  if (sess.currentRound < sess.totalRounds) {
    io.to(roomId).emit('round-ended', {
      roundWinner: { name: roundWinnerName, type: roundWinnerType },
      players: sess.players,
      aiScore: sess.aiScore || 0,
      currentRound: sess.currentRound,
      nextRoundIn: 5,
      playerResults,
    });

    setTimeout(async () => {
      const currentSess = gameSessions.get(roomId);
      if (!currentSess) return;

      try {
        currentSess.currentRound += 1;
        currentSess.roundEnding = false;
        const newChallenge = await generateChallenge(currentSess.language, currentSess.difficulty, currentSess.roomTime);
        currentSess.challenge = newChallenge;
        registerActiveChallenge('computer', roomId, newChallenge);
        currentSess.timer = currentSess.roomTime * 60;

        currentSess.players.forEach(p => {
          p.progress = 0;
          p.testsPassed = 0;
          p.finished = false;
          p.timeUsed = 0;
        });

        currentSess.bots.forEach((bot) => {
          const totalSecs = currentSess.roomTime * 60;
          const submitSecond = getBotSubmitSecond(bot.name, totalSecs);
          const phaseBoundaries = getBotPhaseBoundaries(bot.name, submitSecond);
          bot.submitSecond = submitSecond;
          bot.phaseBoundaries = phaseBoundaries;
          bot.started = false;
          bot.progress = 0;
          bot.finished = false;
          bot.won = false;
          bot.phase = 1;
          bot.finishedAt = null;
        });

        currentSess.intervalId = setInterval(async () => {
          const currentTickSess = gameSessions.get(roomId);
          if (!currentTickSess) return;

          currentTickSess.timer -= 1;
          const elapsedSecs = currentTickSess.roomTime * 60 - currentTickSess.timer;

          currentTickSess.bots.forEach(bot => {
            if (bot.finished) return;
            bot.phase = getBotPhase(bot.phaseBoundaries, elapsedSecs, false);
            const pct = Math.min(100, (elapsedSecs / bot.submitSecond) * 100);
            bot.progress = Math.max(0, pct);
            if (elapsedSecs >= bot.submitSecond) {
              bot.finished = true;
              bot.progress = 100;
              bot.phase = 5;
              bot.finishedAt = elapsedSecs;
            }
          });

          io.to(roomId).emit('game-state-tick', {
            timer: currentTickSess.timer,
            players: currentTickSess.players,
            bots: currentTickSess.bots,
            round: currentTickSess.currentRound,
            totalRounds: currentTickSess.totalRounds
          });

          const allHumansFinished = currentTickSess.players.every(p => p.finished);
          if (currentTickSess.timer <= 0 || allHumansFinished) {
            clearInterval(currentTickSess.intervalId);
            currentTickSess.intervalId = null;
            await endRound(roomId);
          }
        }, 1000);

        io.to(roomId).emit('next-round', {
          round: currentSess.currentRound,
          challenge: newChallenge
        });
      } catch (err) {
        currentSess.roundEnding = false;
        console.error("Error starting next round:", err);
      }
    }, 5000);

   } else {
     sess.finalized = true;
     const totalHumanScore = sess.players.reduce((sum, p) => sum + (p.score || 0), 0);
     const aiScore = sess.aiScore || 0;
     let finalWinner = 'ai';

     if (totalHumanScore > aiScore) {
       let maxHumanScore = 0;
       sess.players.forEach(p => {
         if (p.score > maxHumanScore) maxHumanScore = p.score;
       });
       const winnersList = sess.players.filter(p => p.score === maxHumanScore);
       if (winnersList.length === 1) {
         finalWinner = winnersList[0].userId;
       } else {
         // Tie-break by average time
         let minAvgTime = Infinity;
         let tieWinner = null;
         winnersList.forEach(p => {
           if (p.timeUsed < minAvgTime) { minAvgTime = p.timeUsed; tieWinner = p; }
         });
         finalWinner = tieWinner ? tieWinner.userId : 'draw';
       }
     } else if (totalHumanScore === aiScore) {
       finalWinner = 'draw';
     } else {
       finalWinner = 'ai';
     }

     try {
       await recordMatchResult({
         matchId: `computer:${roomId}`,
         category: 'ai',
         participants: sess.players.map((player) => ({
           userId: player.userId,
           username: player.username,
           outcome: finalWinner === 'draw' ? 'draw' : String(finalWinner) === String(player.userId) ? 'win' : 'loss',
           score: player.score || 0,
         })),
         winnerId: finalWinner === 'ai' || finalWinner === 'draw' ? null : String(finalWinner),
         opponentName: 'AI System',
         language: sess.language,
         difficulty: sess.difficulty,
       });
     } catch (error) {
       console.error('[Leaderboard] Could not persist Computer Mode result:', error.message);
     }

     io.to(roomId).emit('game-over', {
       winner: finalWinner,
       players: sess.players,
       aiScore: aiScore,
       bots: sess.bots
     });

     gameSessions.delete(roomId);
     removeActiveChallenge('computer', roomId);
   }
}


io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  socket.join(userRoom(socket.data.userId));

  // ─── CREATE ROOM ───
  socket.on('create-room', async (payload = {}) => {
    const { roomId, roomData } = payload;
    const userId = socket.data.userId;
    const username = typeof payload.username === 'string' ? payload.username.trim().slice(0, 32) : '';
    const validLanguages = ['HTML', 'CSS', 'JavaScript', 'Python', 'Java'];
    const validDifficulties = ['Beginner', 'Moderate', 'Advanced'];
    if (!userId || typeof roomId !== 'string' || roomId.length > 32 || !username
        || !roomData || !Number.isInteger(roomData.playerMode) || roomData.playerMode < 1 || roomData.playerMode > 4
        || !Number.isInteger(roomData.roomTime) || roomData.roomTime < 3 || roomData.roomTime > 8
        || !Number.isInteger(roomData.rounds) || roomData.rounds < 1 || roomData.rounds > 5
        || !validLanguages.includes(roomData.language) || !validDifficulties.includes(roomData.difficulty)) {
      socket.emit('room-created', { success: false, message: 'Invalid room settings' });
      return;
    }

    console.log(`🏠 ${username} (${userId}) creating room: ${roomId}`);
    console.log(`   Settings: ${roomData.playerMode} players, ${roomData.language}, ${roomData.difficulty}`);
    
    // Check if room already exists
    const existingRoom = rooms.get(roomId);
    if (existingRoom) {
      console.log(`⚠️  Room ${roomId} already exists`);
      // If user is already in the room, just rejoin
      const existingPlayer = existingRoom.players.find(p => p.userId === userId);
      if (existingPlayer) {
        // Update socket ID for reconnection
        existingPlayer.socketId = socket.id;
        if (existingPlayer.isHost) existingRoom.host = socket.id;
        socket.join(roomId);
        socket.emit('room-created', { 
          success: true, 
          roomId,
          room: existingRoom
        });
        console.log(`♻️ User ${username} rejoined existing room ${roomId}`);
        return;
      }
      
      socket.emit('room-created', { success: false, message: 'That room ID is already in use' });
      return;
    }
    
    const pendingKey = `computer:${roomId}`;
    const pendingCreation = pendingRoomCreations.get(pendingKey);
    if (pendingCreation) {
      if (pendingCreation.userId !== userId) {
        socket.emit('room-created', { success: false, message: 'That room is currently being created. Try another room ID.' });
        return;
      }
      const result = await pendingCreation.promise;
      if (result.success) {
        const room = rooms.get(roomId);
        const player = room?.players.find(p => p.userId === userId);
        if (!player) {
          socket.emit('room-created', { success: false, message: 'The room could not be rejoined. Please create another room.' });
          return;
        }
        player.socketId = socket.id;
        if (player.isHost) room.host = socket.id;
        await socket.join(roomId);
        result.room = room;
      }
      socket.emit('room-created', { ...result, charged: false });
      return;
    }

    let resolvePendingCreation;
    const pendingEntry = {
      userId,
      promise: new Promise(resolve => { resolvePendingCreation = resolve; }),
    };
    pendingRoomCreations.set(pendingKey, pendingEntry);

    let chargeApplied = false;
    let roomWasCreated = false;
    try {
      const charge = await chargeRoomCreation(userId);
      if (!charge.success) {
        const failure = {
          success: false,
          code: charge.reason,
          message: `Creating a room costs ${ROOM_CREATION_COST} G-THUNDER. You need at least ${ROOM_CREATION_COST} available.`,
        };
        socket.emit('room-created', failure);
        resolvePendingCreation(failure);
        return;
      }
      chargeApplied = true;

      const room = {
        id: roomId,
        host: socket.id,
        hostUserId: userId,
        hostUsername: username,
        settings: roomData,
        players: [{ socketId: socket.id, userId, username, ready: false, isHost: true }],
        status: 'waiting',
        createdAt: Date.now(),
        roomCreationFee: ROOM_CREATION_COST,
      };
      rooms.set(roomId, room);
      roomWasCreated = true;
      await socket.join(roomId);

      const result = {
        success: true,
        roomId,
        room,
        charged: true,
        chargedAmount: ROOM_CREATION_COST,
        gThunderBalance: charge.balance,
      };
      socket.emit('room-created', result);
      resolvePendingCreation(result);
      console.log(`✅ Room ${roomId} created by ${username}; charged ${ROOM_CREATION_COST} G-THUNDER (${charge.balance} remaining)`);
    } catch (error) {
      if (roomWasCreated && rooms.get(roomId)?.hostUserId === userId) rooms.delete(roomId);
      if (chargeApplied) {
        try { await refundRoomCreation(userId); }
        catch (refundError) { console.error('Room creation fee refund failed:', refundError); }
      }
      const failure = { success: false, message: 'Room creation failed. Please try again.' };
      socket.emit('room-created', failure);
      resolvePendingCreation(failure);
      console.error('Computer room creation failed:', error);
    } finally {
      if (pendingRoomCreations.get(pendingKey) === pendingEntry) pendingRoomCreations.delete(pendingKey);
    }
  });

  // ─── JOIN ROOM ───
  socket.on('join-room', (payload = {}) => {
    const { roomId, password } = payload;
    const userId = socket.data.userId;
    const username = typeof payload.username === 'string' ? payload.username.trim().slice(0, 32) : '';
    if (!userId || typeof roomId !== 'string' || !username || (password !== undefined && typeof password !== 'string')) {
      socket.emit('join-error', { message: 'Invalid room details' });
      return;
    }
    console.log(`🚪 ${username} (${userId}) trying to join room: ${roomId}`);
    
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log(`❌ Room ${roomId} not found. Available rooms:`, Array.from(rooms.keys()));
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }

    console.log(`📊 Room ${roomId} status: ${room.players.length}/${room.settings.playerMode} players`);

    // Check password if set
    if (room.settings.password && room.settings.password !== password) {
      console.log(`❌ Incorrect password for room ${roomId}`);
      socket.emit('join-error', { message: 'Incorrect password' });
      return;
    }

    // Check if already in room (reconnection scenario)
    const existingPlayer = room.players.find(p => p.userId === userId);
    if (existingPlayer) {
      // Update socket ID for reconnection
      existingPlayer.socketId = socket.id;
      socket.join(roomId);
      socket.emit('room-joined', { 
        success: true, 
        roomId,
        room: room
      });
      console.log(`♻️ ${username} reconnected to room ${roomId}`);
      
      // Notify other players about reconnection
      io.to(roomId).emit('player-status-changed', {
        userId,
        ready: existingPlayer.ready,
        room: room
      });
      return;
    }

    // Check if room is full
    if (room.players.length >= room.settings.playerMode) {
      console.log(`❌ Room ${roomId} is full: ${room.players.length}/${room.settings.playerMode}`);
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }

    // Add player to room
    room.players.push({
      socketId: socket.id,
      userId,
      username,
      ready: false,
      isHost: false
    });

    // Join socket room
    socket.join(roomId);

    // Notify all players in room
    io.to(roomId).emit('player-joined', {
      player: { userId, username, ready: false },
      room: room,
      totalPlayers: room.players.length
    });

    // Send confirmation to joiner
    socket.emit('room-joined', { 
      success: true, 
      roomId,
      room: room
    });

    console.log(`✅ ${username} joined room ${roomId}. Total players: ${room.players.length}`);
  });

  // ─── PLAYER READY ───
  socket.on('player-ready', (payload = {}) => {
    const { roomId, ready } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    if (!userId || typeof roomId !== 'string' || typeof ready !== 'boolean') return;
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.userId === userId);
    if (player) {
      player.ready = ready;
      
      // Notify all players
      io.to(roomId).emit('player-status-changed', {
        userId,
        ready,
        room: room
      });

      console.log(`${player.username} is ${ready ? 'ready' : 'not ready'} in room ${roomId}`);
    }
  });

  // ─── LOBBY CHAT ───
  socket.on('send-chat', (payload = {}) => {
    const { roomId, message } = payload;
    const userId = resolveSocketUserId(socket, message?.userId);
    const room = rooms.get(roomId);
    const player = room?.players.find((item) => item.userId === userId);
    const text = typeof message?.text === 'string' ? message.text.trim().slice(0, 500) : '';
    if (!player || !text) return;
    socket.to(roomId).emit('chat-message', {
      id: typeof message.id === 'string' ? message.id.slice(0, 64) : `${Date.now()}`,
      from: player.username,
      text,
      timestamp: new Date().toISOString(),
      isMine: false,
    });
  });

  // ─── START GAME ───
  socket.on('start-game', async ({ roomId } = {}) => {
    const room = rooms.get(roomId);
    if (!room) return;
    if (room.hostUserId !== socket.data.userId) {
      socket.emit('start-error', { message: 'Only the host can start the game' });
      return;
    }

    const allReady = room.players.every(p => p.ready);
    if (!allReady) {
      socket.emit('start-error', { message: 'Not all players are ready' });
      return;
    }

    if (room.players.length < room.settings.playerMode) {
      socket.emit('start-error', { message: 'Waiting for more players' });
      return;
    }

    room.status = 'playing';

    try {
      const challenge = await generateChallenge(room.settings.language, room.settings.difficulty, room.settings.roomTime);
      registerActiveChallenge('computer', roomId, challenge);
      // Use per-player bot selections from room settings (array of bot objects/names)
      const botNames = buildBotRoster(room.settings.playerBots || [room.settings.bot], room.settings.playerMode);
      console.log(`[Bot Roster] Player bots: ${botNames.join(', ')}`);

      const session = {
        roomId,
        status: 'playing',
        currentRound: 1,
        totalRounds: room.settings.rounds,
        language: room.settings.language,
        difficulty: room.settings.difficulty,
        roomTime: room.settings.roomTime,
        timer: room.settings.roomTime * 60,
        challenge,
        players: room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          progress: 0,
          testsPassed: 0,
          finished: false,
          timeUsed: 0,
          score: 0
        })),
        bots: botNames.map((name, idx) => {
          const totalSecs = room.settings.roomTime * 60;
          const submitSecond = getBotSubmitSecond(name, totalSecs);
          const phaseBoundaries = getBotPhaseBoundaries(name, submitSecond);
          return {
            name,
            submitSecond,
            phaseBoundaries,
            started: false,
            progress: 0,
            finished: false,
            won: false,
            phase: 1,
          };
        }),
        aiScore: 0,
        intervalId: null
      };

      gameSessions.set(roomId, session);

      // 📡 Send full game data WITH game-starting so ALL players get challenge immediately
      // No need for a separate join-game roundtrip — eliminates timing issues entirely
      const gameInitPayload = {
        challenge: session.challenge,
        currentRound: session.currentRound,
        totalRounds: session.totalRounds,
        timer: session.timer,
        players: session.players,
        bots: session.bots,
        language: session.language,
        difficulty: session.difficulty,
        aiScore: session.aiScore || 0
      };

      io.to(roomId).emit('game-starting', {
        room: room,
        countdown: 3,
        gameData: gameInitPayload  // ✨ Full challenge data embedded
      });

      console.log(`🎮 Game starting in room ${roomId} — challenge sent to all ${room.players.length} players`);

      // ⏱️ Delay the game timer by 4 seconds to match the 3-second frontend countdown
      setTimeout(() => {
        const startSess = gameSessions.get(roomId);
        if (!startSess) return;

        startSess.intervalId = setInterval(async () => {
          const currentTickSess = gameSessions.get(roomId);
          if (!currentTickSess) return;

          currentTickSess.timer -= 1;
          const elapsedSecs = currentTickSess.roomTime * 60 - currentTickSess.timer;

          currentTickSess.bots.forEach(bot => {
            if (bot.finished) return;
            // Update phase
            bot.phase = getBotPhase(bot.phaseBoundaries, elapsedSecs, false);
            // Bot submits at its exact submitSecond
            const pct = Math.min(100, (elapsedSecs / bot.submitSecond) * 100);
            bot.progress = Math.max(0, pct);
            if (elapsedSecs >= bot.submitSecond) {
              bot.finished = true;
              bot.progress = 100;
              bot.phase = 5;
              bot.finishedAt = elapsedSecs;
              console.log(`🤖 Bot ${bot.name} submitted at ${elapsedSecs}s (window: last ${currentTickSess.roomTime * 60 - bot.submitSecond}s)`);
            }
          });

          io.to(roomId).emit('game-state-tick', {
            timer: currentTickSess.timer,
            players: currentTickSess.players,
            bots: currentTickSess.bots,
            round: currentTickSess.currentRound,
            totalRounds: currentTickSess.totalRounds
          });

          const allHumansFinished = currentTickSess.players.every(p => p.finished);
          if (currentTickSess.timer <= 0 || allHumansFinished) {
            clearInterval(currentTickSess.intervalId);
            currentTickSess.intervalId = null;
            await endRound(roomId);
          }
        }, 1000);

        console.log(`▶️  Game timer started for room ${roomId}`);
      }, 4000);

    } catch (error) {
      console.error("Failed to start game room:", error);
      room.status = 'waiting';
      removeActiveChallenge('computer', roomId);
      socket.emit('start-error', { message: 'Error generating start challenge' });
    }
  });

  // ─── JOIN GAME ───
  socket.on('join-game', (payload = {}) => {
    const { roomId } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const room = rooms.get(roomId);
    if (!userId || !room?.players.some((player) => player.userId === userId)) return;
    console.log(`[Socket] join-game event received from socket ID: ${socket.id}`);
    console.log(`   Room ID: ${roomId}, User ID: ${userId}`);
    socket.join(roomId);
    const sess = gameSessions.get(roomId);
    if (sess) {
      console.log(`   Session found. Emitting game-init to socket ${socket.id}`);
      socket.emit('game-init', {
        challenge: sess.challenge,
        currentRound: sess.currentRound,
        totalRounds: sess.totalRounds,
        timer: sess.timer,
        players: sess.players,
        bots: sess.bots,
        language: sess.language,
        difficulty: sess.difficulty,
        aiScore: sess.aiScore || 0
      });
    } else {
      console.log(`   ⚠️ Session not found for Room ID: ${roomId}`);
      console.log(`   Available sessions:`, Array.from(gameSessions.keys()));
    }
  });

  // ─── PLAYER PROGRESS ───
  socket.on('player-progress', (payload = {}) => {
    const { roomId } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const progress = Number(payload.progress);
    const testsPassed = Number(payload.testsPassed);
    if (!userId || !Number.isFinite(progress) || !Number.isFinite(testsPassed)) return;
    const sess = gameSessions.get(roomId);
    if (sess) {
      const player = sess.players.find(p => p.userId === userId);
      if (player) {
        player.progress = Math.max(0, Math.min(100, progress));
        player.testsPassed = Math.max(0, Math.min(sess.challenge.testCases.length, Math.floor(testsPassed)));
      } else {
        return;
      }
      io.to(roomId).emit('progress-update', {
        userId,
        progress,
        testsPassed,
        players: sess.players
      });
    }
  });

  // ─── PLAYER FINISHED ───
  socket.on('player-finished', (payload = {}) => {
    const { roomId, completionProof } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const sess = gameSessions.get(roomId);
    const player = sess?.players.find((item) => item.userId === userId);
    if (!userId || !sess || !player || player.finished
        || !verifyMultiplayerCompletionProof(completionProof, {
          userId, mode: 'computer', roomId, challengeId: sess.challenge.id,
        })) return;
    player.finished = true;
    player.timeUsed = sess.roomTime * 60 - sess.timer;
    console.log(`🏁 Player ${player.username} finished in ${player.timeUsed}s`);
    io.to(roomId).emit('player-completed', { userId, players: sess.players });
  });

  // ─── LEAVE ROOM ───
  socket.on('leave-room', (payload = {}) => {
    const { roomId } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    if (!userId || typeof roomId !== 'string') return;
    const room = rooms.get(roomId);
    if (!room) return;

    // Remove player from room
    room.players = room.players.filter(p => p.userId !== userId);

    // If host left, assign new host or delete room
    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`🗑️ Room ${roomId} deleted (empty)`);
    } else if (room.hostUserId === userId) {
      room.host = room.players[0].socketId;
      room.hostUserId = room.players[0].userId;
      room.hostUsername = room.players[0].username;
      room.players.forEach((player) => { player.isHost = player.userId === room.hostUserId; });
      console.log(`👑 New host in room ${roomId}: ${room.players[0].username}`);
    }

    // Notify remaining players
    if (room.players.length > 0) {
      io.to(roomId).emit('player-left', {
        userId,
        room: room,
        totalPlayers: room.players.length
      });
    }

    socket.leave(roomId);
  });

  // ─── DISCONNECT ───
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    // Give a 15-second grace period before removing player from rooms.
    // This prevents rooms being deleted during:
    //   - Page navigation (LobbyPage → ComputerModeGamePage)
    //   - Brief network hiccups
    //   - Socket reconnections (new socket ID replaces old)
    setTimeout(() => {
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];

          // Only remove if the player hasn't reconnected with a new socket
          // (reconnection updates socketId via create-room/join-room handlers)
          if (player.socketId !== socket.id) {
            // Player reconnected — skip removal
            return;
          }

          // Only remove if room is NOT in 'playing' state (game in progress)
          if (room.status === 'playing') {
            // During a game, just mark as disconnected but keep in room
            player.disconnected = true;
            console.log(`⚡ ${player.username} disconnected during game in room ${roomId} — keeping in session`);
            return;
          }

          room.players.splice(playerIndex, 1);
          console.log(`👋 ${player.username} removed from room ${roomId} after grace period`);

          // If room is empty, delete it
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty after disconnect)`);
          } else {
            // If host disconnected, assign new host
            if (room.hostUserId === player.userId && room.players.length > 0) {
              room.host = room.players[0].socketId;
              room.hostUserId = room.players[0].userId;
              room.hostUsername = room.players[0].username;
              room.players.forEach((remainingPlayer) => { remainingPlayer.isHost = remainingPlayer.userId === room.hostUserId; });
            }

            // Notify remaining players
            io.to(roomId).emit('player-left', {
              userId: player.userId,
              room: room,
              totalPlayers: room.players.length
            });
          }
        }
      });
    }, 15000); // 15-second grace period
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM MODE — HUMAN VS HUMAN SOCKET EVENTS
// ═══════════════════════════════════════════════════════════════════════════

const customRooms = new Map();
const customSessions = new Map();

// Clean up old custom rooms every 5 mins
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 30 * 60 * 1000;
  customRooms.forEach((room, roomId) => {
    if (now - room.createdAt > TIMEOUT && room.status === 'waiting') {
      customRooms.delete(roomId);
      console.log(`🗑️ [Custom] Cleaned up inactive room: ${roomId}`);
    }
  });
}, 5 * 60 * 1000);

io.on('custom-connection-check', () => {}); // noop

// We add custom handlers inside the existing io.on('connection') via a second handler
// by attaching them directly on the socket when connected.
// Since we're already inside io.on('connection'), we use a flag to separate.
// Actually we attach them in a separate function called from io.on('connection').
// But since that block is already closed, we handle via a new socket event namespace pattern below.

// Re-open connection handler for custom mode events
io.on('connection', (socket) => {

  // ─── CUSTOM CREATE ROOM ───
  socket.on('custom-create-room', async (payload = {}) => {
    const { roomId, roomData } = payload;
    const userId = socket.data.userId;
    const username = typeof payload.username === 'string' ? payload.username.trim().slice(0, 32) : '';
    const validLanguages = ['HTML', 'CSS', 'JavaScript', 'Python', 'Java'];
    const validDifficulties = ['Beginner', 'Moderate', 'Advanced'];
    if (!userId || typeof roomId !== 'string' || roomId.length > 32 || !username
        || !roomData || !Number.isInteger(roomData.playerMode) || roomData.playerMode < 2 || roomData.playerMode > 4
        || !Number.isInteger(roomData.roomTime) || roomData.roomTime < 3 || roomData.roomTime > 8
        || !Number.isInteger(roomData.rounds) || roomData.rounds < 1 || roomData.rounds > 10
        || !validLanguages.includes(roomData.language) || !validDifficulties.includes(roomData.difficulty)
        || (roomData.password !== undefined && (typeof roomData.password !== 'string' || roomData.password.length > 64))) {
      socket.emit('custom-room-created', { success: false, message: 'Invalid custom-room settings' });
      return;
    }

    console.log(`[Custom] 🏠 ${username} creating custom room: ${roomId}`);
    const existing = customRooms.get(roomId);
    if (existing) {
      const ep = existing.players.find(p => p.userId === userId);
      if (ep) {
        ep.socketId = socket.id;
        if (ep.isHost) existing.host = socket.id;
        socket.join(roomId);
        socket.emit('custom-room-created', { success: true, roomId, room: existing });
        return;
      }
      socket.emit('custom-room-created', { success: false, message: 'That room ID is already in use' });
      return;
    }
    const pendingKey = `custom:${roomId}`;
    const pendingCreation = pendingRoomCreations.get(pendingKey);
    if (pendingCreation) {
      if (pendingCreation.userId !== userId) {
        socket.emit('custom-room-created', { success: false, message: 'That room is currently being created. Try another room ID.' });
        return;
      }
      const result = await pendingCreation.promise;
      if (result.success) {
        const room = customRooms.get(roomId);
        const player = room?.players.find(p => p.userId === userId);
        if (!player) {
          socket.emit('custom-room-created', { success: false, message: 'The room could not be rejoined. Please create another room.' });
          return;
        }
        player.socketId = socket.id;
        if (player.isHost) room.host = socket.id;
        await socket.join(roomId);
        result.room = room;
      }
      socket.emit('custom-room-created', { ...result, charged: false });
      return;
    }

    let resolvePendingCreation;
    const pendingEntry = {
      userId,
      promise: new Promise(resolve => { resolvePendingCreation = resolve; }),
    };
    pendingRoomCreations.set(pendingKey, pendingEntry);

    let chargeApplied = false;
    let roomWasCreated = false;
    try {
      const charge = await chargeRoomCreation(userId);
      if (!charge.success) {
        const failure = {
          success: false,
          code: charge.reason,
          message: `Creating a room costs ${ROOM_CREATION_COST} G-THUNDER. You need at least ${ROOM_CREATION_COST} available.`,
        };
        socket.emit('custom-room-created', failure);
        resolvePendingCreation(failure);
        return;
      }
      chargeApplied = true;

      const room = {
        id: roomId,
        host: socket.id,
        hostUserId: userId,
        hostUsername: username,
        settings: roomData,
        players: [{ socketId: socket.id, userId, username, ready: false, isHost: true, isSpectator: false }],
        spectators: [],
        status: 'waiting',
        createdAt: Date.now(),
        mode: 'custom',
        roomCreationFee: ROOM_CREATION_COST,
      };
      customRooms.set(roomId, room);
      roomWasCreated = true;
      await socket.join(roomId);

      const result = {
        success: true,
        roomId,
        room,
        charged: true,
        chargedAmount: ROOM_CREATION_COST,
        gThunderBalance: charge.balance,
      };
      socket.emit('custom-room-created', result);
      resolvePendingCreation(result);
      console.log(`[Custom] ✅ Room ${roomId} created by ${username}; charged ${ROOM_CREATION_COST} G-THUNDER (${charge.balance} remaining)`);
    } catch (error) {
      if (roomWasCreated && customRooms.get(roomId)?.hostUserId === userId) customRooms.delete(roomId);
      if (chargeApplied) {
        try { await refundRoomCreation(userId); }
        catch (refundError) { console.error('[Custom] Room creation fee refund failed:', refundError); }
      }
      const failure = { success: false, message: 'Room creation failed. Please try again.' };
      socket.emit('custom-room-created', failure);
      resolvePendingCreation(failure);
      console.error('[Custom] Room creation failed:', error);
    } finally {
      if (pendingRoomCreations.get(pendingKey) === pendingEntry) pendingRoomCreations.delete(pendingKey);
    }
  });

  // ─── CUSTOM JOIN ROOM ───
  socket.on('custom-join-room', (payload = {}) => {
    const { roomId, password } = payload;
    const userId = socket.data.userId;
    const username = typeof payload.username === 'string' ? payload.username.trim().slice(0, 32) : '';
    if (!userId || typeof roomId !== 'string' || roomId.length > 32 || !username
        || (password !== undefined && typeof password !== 'string')) {
      socket.emit('custom-join-error', { message: 'Invalid room details' });
      return;
    }
    console.log(`[Custom] 🚪 ${username} joining room: ${roomId}`);
    const room = customRooms.get(roomId);
    if (!room) { socket.emit('custom-join-error', { message: 'Room not found' }); return; }
    if (room.settings.password && room.settings.password !== password) {
      socket.emit('custom-join-error', { message: 'Incorrect password' }); return;
    }
    const activePlayers = room.players.filter(p => !p.isSpectator);
    const ep = room.players.find(p => p.userId === userId);
    if (ep) {
      ep.socketId = socket.id;
      socket.join(roomId);
      socket.emit('custom-room-joined', { success: true, roomId, room });
      io.to(roomId).emit('custom-player-status-changed', { userId, ready: ep.ready, room });
      return;
    }
    if (activePlayers.length >= room.settings.playerMode) {
      socket.emit('custom-join-error', { message: 'Room is full' }); return;
    }
    room.players.push({ socketId: socket.id, userId, username, ready: false, isHost: false, isSpectator: false });
    socket.join(roomId);
    io.to(roomId).emit('custom-player-joined', {
      player: { userId, username, ready: false },
      room, totalPlayers: room.players.length,
    });
    socket.emit('custom-room-joined', { success: true, roomId, room });
    console.log(`[Custom] ✅ ${username} joined room ${roomId}`);
  });

  // ─── CUSTOM PLAYER READY ───
  socket.on('custom-player-ready', (payload = {}) => {
    const { roomId, ready } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    if (!userId || typeof roomId !== 'string' || typeof ready !== 'boolean') return;
    const room = customRooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.userId === userId);
    if (player) {
      player.ready = ready;
      io.to(roomId).emit('custom-player-status-changed', { userId, ready, room });
    }
  });

  // ─── CUSTOM SPECTATE TOGGLE ───
  socket.on('custom-spectate-toggle', (payload = {}) => {
    const { roomId, isSpectator } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    if (!userId || typeof roomId !== 'string' || typeof isSpectator !== 'boolean') return;
    const room = customRooms.get(roomId);
    if (!room) return;
    const player = room.players.find(p => p.userId === userId);
    if (player) {
      player.isSpectator = isSpectator;
      io.to(roomId).emit('custom-player-status-changed', { userId, isSpectator, room });
    }
  });

  // ─── CUSTOM LOBBY CHAT ───
  socket.on('custom-send-chat', (payload = {}) => {
    const { roomId, message } = payload;
    const userId = resolveSocketUserId(socket, message?.userId);
    const room = customRooms.get(roomId);
    const player = room?.players.find((item) => item.userId === userId);
    const text = typeof message?.text === 'string' ? message.text.trim().slice(0, 500) : '';
    if (!player || !text) return;
    socket.to(roomId).emit('custom-chat-message', {
      id: typeof message.id === 'string' ? message.id.slice(0, 64) : `${Date.now()}`,
      from: player.username,
      text,
      timestamp: new Date().toISOString(),
      isMine: false,
    });
  });

  // ─── CUSTOM START GAME ───
  socket.on('custom-start-game', async ({ roomId } = {}) => {
    const room = customRooms.get(roomId);
    if (!room) return;
    if (room.hostUserId !== socket.data.userId) {
      socket.emit('custom-start-error', { message: 'Only the host can start the game' });
      return;
    }
    if (room.status !== 'waiting') {
      socket.emit('custom-start-error', { message: 'This game has already started' });
      return;
    }
    const activePlayers = room.players.filter(p => !p.isSpectator);
    const allReady = activePlayers.every(p => p.ready);
    if (!allReady) { socket.emit('custom-start-error', { message: 'Not all players are ready' }); return; }
    if (activePlayers.length < room.settings.playerMode) {
      socket.emit('custom-start-error', { message: 'Waiting for more players' }); return;
    }
    room.status = 'playing';
    try {
      const challenge = await generateChallenge(room.settings.language, room.settings.difficulty, room.settings.roomTime);
      registerActiveChallenge('custom', roomId, challenge);
      const session = {
        roomId, status: 'playing',
        currentRound: 1, totalRounds: room.settings.rounds,
        language: room.settings.language,
        difficulty: room.settings.difficulty,
        roomTime: room.settings.roomTime,
        timer: room.settings.roomTime * 60,
        challenge,
        players: activePlayers.map(p => ({
          userId: p.userId, username: p.username,
          progress: 0, testsPassed: 0, finished: false, timeUsed: 0, score: 0,
        })),
        spectators: room.players.filter(p => p.isSpectator),
        scores: {},
        intervalId: null,
      };
      customSessions.set(roomId, session);

      const gameInitPayload = {
        challenge: session.challenge,
        currentRound: 1,
        totalRounds: session.totalRounds,
        timer: session.timer,
        players: session.players,
        language: session.language,
        difficulty: session.difficulty,
      };

      io.to(roomId).emit('custom-game-starting', { room, countdown: 3, gameData: gameInitPayload });
      console.log(`[Custom] 🎮 Game starting in room ${roomId}`);

      // Start game timer after 4s countdown
      setTimeout(() => {
        const s = customSessions.get(roomId);
        if (!s) return;
        s.intervalId = setInterval(async () => {
          const ts = customSessions.get(roomId);
          if (!ts) return;
          ts.timer -= 1;
          io.to(roomId).emit('custom-game-state-tick', {
            timer: ts.timer, players: ts.players,
            round: ts.currentRound, totalRounds: ts.totalRounds,
          });
          if (ts.timer <= 0) {
            clearInterval(ts.intervalId); ts.intervalId = null;
            await endCustomRound(roomId);
          }
        }, 1000);
      }, 4000);
    } catch (err) {
      console.error('[Custom] Start error:', err);
      room.status = 'waiting';
      removeActiveChallenge('custom', roomId);
      socket.emit('custom-start-error', { message: 'Error generating challenge' });
    }
  });

  // ─── CUSTOM JOIN GAME (sync after nav) ───
  socket.on('custom-join-game', (payload = {}) => {
    const { roomId } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const room = customRooms.get(roomId);
    if (!userId || !room?.players.some((player) => player.userId === userId)) return;
    socket.join(roomId);
    const sess = customSessions.get(roomId);
    if (sess) {
      socket.emit('custom-game-init', {
        challenge: sess.challenge,
        currentRound: sess.currentRound,
        totalRounds: sess.totalRounds,
        timer: sess.timer,
        players: sess.players,
        language: sess.language,
        difficulty: sess.difficulty,
      });
    }
  });

  // ─── CUSTOM PLAYER PROGRESS ───
  socket.on('custom-player-progress', (payload = {}) => {
    const { roomId } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const progress = Number(payload.progress);
    const testsPassed = Number(payload.testsPassed);
    if (!userId || typeof roomId !== 'string' || !Number.isFinite(progress) || !Number.isFinite(testsPassed)) return;
    const sess = customSessions.get(roomId);
    if (!sess) return;
    const player = sess.players.find(p => p.userId === userId);
    if (!player) return;
    player.progress = Math.max(0, Math.min(100, progress));
    player.testsPassed = Math.max(0, Math.min(sess.challenge.testCases.length, Math.floor(testsPassed)));
    io.to(roomId).emit('custom-progress-update', { userId, progress: player.progress, testsPassed: player.testsPassed, players: sess.players });
  });

  // ─── CUSTOM PLAYER TYPING ───
  socket.on('custom-player-typing', (payload = {}) => {
    const { roomId, isTyping } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const room = customRooms.get(roomId);
    if (!userId || typeof isTyping !== 'boolean' || !room?.players.some((player) => player.userId === userId)) return;
    socket.to(roomId).emit('custom-player-typing-update', { userId, isTyping });
  });

  // ─── CUSTOM PLAYER FINISHED (submitted) ───
  socket.on('custom-player-finished', (payload = {}) => {
    const { roomId, completionProof } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    const sess = customSessions.get(roomId);
    if (!userId || !sess || !verifyMultiplayerCompletionProof(completionProof, {
      userId, mode: 'custom', roomId, challengeId: sess.challenge.id,
    })) return;
    const player = sess.players.find(p => p.userId === userId);
    if (!player || player.finished) return;
    player.finished = true;
    player.timeUsed = sess.roomTime * 60 - sess.timer;
    console.log(`[Custom] 🏁 ${player.username} submitted in ${player.timeUsed}s`);
    io.to(roomId).emit('custom-player-completed', { userId, username: player?.username, players: sess.players });

    // Check if this is the first finisher → end round immediately
    const finished = sess.players.filter(p => p.finished);
    if (finished.length === 1) {
      // First submitter wins this round — end it after 2s to let others see
      setTimeout(async () => {
        const currentSess = customSessions.get(roomId);
        if (currentSess && currentSess.intervalId) {
          clearInterval(currentSess.intervalId);
          currentSess.intervalId = null;
        }
        await endCustomRound(roomId);
      }, 2000);
    }
  });

  // ─── CUSTOM LEAVE ROOM ───
  socket.on('custom-leave-room', (payload = {}) => {
    const { roomId } = payload;
    const userId = resolveSocketUserId(socket, payload.userId);
    if (!userId || typeof roomId !== 'string') return;
    const room = customRooms.get(roomId);
    if (!room) return;
    room.players = room.players.filter(p => p.userId !== userId);
    if (room.players.length === 0) { customRooms.delete(roomId); }
    else {
      if (room.hostUserId === userId && room.players.length > 0) {
        room.host = room.players[0].socketId;
        room.hostUserId = room.players[0].userId;
        room.hostUsername = room.players[0].username;
        room.players.forEach((player) => { player.isHost = player.userId === room.hostUserId; });
        room.players[0].isHost = true;
      }
      io.to(roomId).emit('custom-player-left', { userId, room, totalPlayers: room.players.length });
    }
    socket.leave(roomId);
  });

  // ─── CUSTOM DISCONNECT ───
  socket.on('disconnect', () => {
    console.log(`❌ [Custom] Client disconnected: ${socket.id}`);
    setTimeout(() => {
      customRooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const player = room.players[playerIndex];
          if (player.socketId !== socket.id) return;
          if (room.status === 'playing') {
            player.disconnected = true;
            console.log(`⚡ [Custom] ${player.username} disconnected during game in room ${roomId}`);
            return;
          }
          room.players.splice(playerIndex, 1);
          console.log(`👋 [Custom] ${player.username} removed from room ${roomId} after grace period`);
          if (room.players.length === 0) {
            customRooms.delete(roomId);
            console.log(`[Custom] 🗑️ Room ${roomId} deleted (empty after disconnect)`);
          } else {
            if (room.hostUserId === player.userId && room.players.length > 0) {
              room.host = room.players[0].socketId;
              room.hostUserId = room.players[0].userId;
              room.hostUsername = room.players[0].username;
              room.players.forEach((remainingPlayer) => { remainingPlayer.isHost = remainingPlayer.userId === room.hostUserId; });
              room.players[0].isHost = true;
            }
            io.to(roomId).emit('custom-player-left', {
              userId: player.userId,
              room,
              totalPlayers: room.players.length
            });
          }
        }
      });
    }, 15000);
  });
});

async function endCustomRound(roomId) {
  const sess = customSessions.get(roomId);
  if (!sess || sess.finalized || sess.roundEnding) return;
  sess.roundEnding = true;
  if (sess.intervalId) { clearInterval(sess.intervalId); sess.intervalId = null; }

  // Only a server-verified completion proof can win a round. Client-reported test
  // progress is presentation data and cannot decide the official result.
  let roundWinner = null;
  const finished = sess.players.filter(p => p.finished);
  if (finished.length > 0) {
    roundWinner = finished.reduce((min, p) => p.timeUsed < min.timeUsed ? p : min, finished[0]);
  }

  if (roundWinner) {
    sess.scores = sess.scores || {};
    sess.scores[roundWinner.userId] = (sess.scores[roundWinner.userId] || 0) + 1;
    roundWinner.score = (roundWinner.score || 0) + 1;
  }

  if (sess.currentRound < sess.totalRounds) {
    io.to(roomId).emit('custom-round-ended', {
      roundWinner: roundWinner ? { userId: roundWinner.userId, username: roundWinner.username } : null,
      players: sess.players, scores: sess.scores,
      currentRound: sess.currentRound, nextRoundIn: 5,
    });

    setTimeout(async () => {
      const cs = customSessions.get(roomId);
      if (!cs) return;
      try {
        cs.currentRound += 1;
        cs.roundEnding = false;
        const newChallenge = await generateChallenge(cs.language, cs.difficulty, cs.roomTime);
        cs.challenge = newChallenge;
        registerActiveChallenge('custom', roomId, newChallenge);
        cs.timer = cs.roomTime * 60;
        cs.players.forEach(p => { p.progress = 0; p.testsPassed = 0; p.finished = false; p.timeUsed = 0; });

        cs.intervalId = setInterval(async () => {
          const ts = customSessions.get(roomId);
          if (!ts) return;
          ts.timer -= 1;
          io.to(roomId).emit('custom-game-state-tick', {
            timer: ts.timer, players: ts.players,
            round: ts.currentRound, totalRounds: ts.totalRounds,
          });
          if (ts.timer <= 0) { clearInterval(ts.intervalId); ts.intervalId = null; await endCustomRound(roomId); }
        }, 1000);

        io.to(roomId).emit('custom-next-round', { round: cs.currentRound, challenge: newChallenge });
      } catch (err) { cs.roundEnding = false; console.error('[Custom] Next round error:', err); }
    }, 5000);
  } else {
    // Game over
    sess.finalized = true;
    const scores = sess.scores || {};
    let winner = 'draw';
    let maxScore = 0;
    sess.players.forEach(p => { if ((scores[p.userId] || 0) > maxScore) { maxScore = scores[p.userId] || 0; winner = p.userId; } });
    const topPlayers = sess.players.filter(p => (scores[p.userId] || 0) === maxScore);
    if (topPlayers.length > 1) winner = 'draw';

    try {
      await recordMatchResult({
        matchId: `custom:${roomId}`,
        category: 'multiplayer',
        participants: sess.players.map((player) => ({
          userId: player.userId,
          username: player.username,
          outcome: winner === 'draw' ? 'draw' : String(winner) === String(player.userId) ? 'win' : 'loss',
          score: scores[player.userId] || 0,
        })),
        winnerId: winner === 'draw' ? null : String(winner),
        language: sess.language,
        difficulty: sess.difficulty,
      });
    } catch (error) {
      console.error('[Leaderboard] Could not persist Custom Mode result:', error.message);
    }

    io.to(roomId).emit('custom-game-over', {
      winner, players: sess.players, scores,
    });
    customSessions.delete(roomId);
    removeActiveChallenge('custom', roomId);
    console.log(`[Custom] 🏆 Game over in room ${roomId}. Winner: ${winner}`);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket ready for real-time multiplayer`);
});
