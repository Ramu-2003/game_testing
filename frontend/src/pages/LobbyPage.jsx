import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import {
  Copy, Check, User, Bot, Clock, Target, Code, ChevronLeft,
  AlertCircle, Hash, Lock, Send, MessageSquare, Play, Shield,
  Wifi
} from 'lucide-react';
import { profileAPI } from '../utils/api';
import {
  initializeSocket, createRoom, joinRoom, setPlayerReady,
  startGame, leaveRoom, onPlayerJoined, onPlayerLeft,
  onPlayerStatusChanged, onGameStarting, sendChatMessage, onChatMessage
} from '../utils/socket';

const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', bg: '#0d0305' },
  blue:   { accent: '#0099ff', ui: '#00ccff', bg: '#020810' },
  green:  { accent: '#00ff88', ui: '#00ff99', bg: '#020d07' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#06020d' },
};

const ALL_BOTS = [
  { name: 'Beginner Bot',        image: '/assets/BEGINNER-BOT-BG.png', color: '#10b981', tag: 'EASY'   },
  { name: 'Lazy Compiler',       image: '/assets/LAZY-COMPILER-BG.png', color: '#f59e0b', tag: 'EASY'   },
  { name: 'Logic Bot',           image: '/assets/LOGIC-BOT-BG.png', color: '#3b82f6', tag: 'MED'    },
  { name: 'Flash Coder',         image: '/assets/FLASH-CODER-BG.png', color: '#8b5cf6', tag: 'HARD'   },
  { name: 'Test Case Destroyer', image: '/assets/TEST-CASE-DESTROYER-BG.png', color: '#ef4444', tag: 'EXPERT' },
];

function getBotForPlayer(playerBots, playerIndex) {
  if (Array.isArray(playerBots) && playerBots[playerIndex]) {
    const botData = playerBots[playerIndex];
    return ALL_BOTS.find(b => b.name === (botData.name || botData)) || ALL_BOTS[playerIndex % ALL_BOTS.length];
  }
  return ALL_BOTS[playerIndex % ALL_BOTS.length];
}

// Room expiry: 15 minutes = 900 seconds
const ROOM_EXPIRY_SECONDS = 900;

const LobbyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roomData = location.state || {};

  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  const themes = {
    red: { accent: '#ff5252', ui: '#ff6b6b' },
    blue: { accent: '#0099ff', ui: '#00ccff' },
    green: { accent: '#00ff88', ui: '#00ff99' },
    purple: { accent: '#a855f7', ui: '#d8b4fe' },
  };

  const currentTheme = themes[themeKey] || themes.purple;
  const safeTheme = THEMES[themeKey] || THEMES.purple;
  const pageBg = safeTheme.bg;
  const ac = currentTheme.accent;

  // State
  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('You');
  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null); // Stable ref so callbacks always get latest userId
  const [roomState, setRoomState] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [connectingAttempt, setConnectingAttempt] = useState(0);
  const [retryCount, setRetryCount] = useState(0); // Increment to re-trigger join attempt
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [expirySeconds, setExpirySeconds] = useState(ROOM_EXPIRY_SECONDS);
  const [roomExpired, setRoomExpired] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    { id: 0, from: 'SYSTEM', text: 'Welcome to the battle lobby. Share your Room ID to invite players.', isSystem: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const [roomId] = useState(() => {
    if (roomData.isJoining && roomData.roomId) return roomData.roomId;
    return roomData.roomId || 'ROOM-' + Math.random().toString(36).substr(2, 8).toUpperCase();
  });
  const [roomPassword] = useState(() => {
    if (roomData.isJoining && roomData.password) return roomData.password;
    return roomData.roomPassword || Math.random().toString(36).substr(2, 6).toUpperCase();
  });

  const totalPlayers = roomState?.settings?.playerMode || roomData.playerMode || 1;
  const playersReady = roomState?.players?.filter(p => p.ready).length || 0;
  const playerBots = roomData.playerBots || [];
  const [initialRoomContext] = useState(() => ({
    roomData, roomId, roomPassword, totalPlayers: roomData.playerMode || 1, playerBots, navigate,
  }));

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Room expiry countdown (15 min)
  useEffect(() => {
    if (roomExpired) return;
    const iv = setInterval(() => {
      setExpirySeconds(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          setRoomExpired(true);
          setChatMessages(m => [...m, {
            id: Date.now(), from: 'SYSTEM',
            text: '⚠️ Room expired after 15 minutes of inactivity. Please create a new room.',
            isSystem: true, isWarning: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [roomExpired]);

  // Initialize — run once on mount only, use ref for userId access in callbacks
  useEffect(() => {
    const { roomData, roomId, roomPassword, totalPlayers, playerBots, navigate } = initialRoomContext;
    let active = true;
    const init = async () => {
      try {
        const response = await profileAPI.getProfile();
        if (!active) return;
        const userData = response.data.user;
        userIdRef.current = userData._id;
        setUserId(userData._id);
        if (userData.username) setUsername(userData.username);
        if (userData.profileSetupComplete && userData.profileImage) setProfileImage(userData.profileImage);

        initializeSocket();

        if (roomData.isJoining) {
          // Retry joining with up to 5 attempts (handles server wake-up delay, host not created yet)
          let lastError;
          for (let attempt = 1; attempt <= 5; attempt++) {
            try {
              const result = await joinRoom(roomId, roomPassword, userData._id, userData.username || 'Player');
              if (active) { setRoomState(result.room); setConnecting(false); }
              return; // Success — exit the init function
            } catch (err) {
              lastError = err;
              // Don't retry on definitive errors like wrong password or full room
              if (err.message?.includes('password') || err.message?.includes('full')) break;
              if (attempt < 5 && active) {
                // Show retrying status
                setConnectingAttempt(attempt);
                console.log(`[JoinRoom] Attempt ${attempt} failed: ${err.message}. Retrying in 2s...`);
                await new Promise(r => setTimeout(r, 2000));
                if (!active) return;
              }
            }
          }
          if (active) { setError(lastError?.message || 'Failed to join room'); setConnecting(false); }
        } else {
          const fullRoomData = { ...roomData, roomId, password: roomPassword, playerMode: totalPlayers };
          const result = await createRoom(roomId, fullRoomData, userData._id, userData.username || 'Host');
          if (active) { setRoomState(result.room); setConnecting(false); }
        }
      } catch (err) {
        if (active) { setError(err.message); setConnecting(false); }
      }
    };
    init();

    const unsubJoined = onPlayerJoined((data) => {
      if (active) {
        setRoomState(data.room);
        setChatMessages(m => [...m, {
          id: Date.now(), from: 'SYSTEM',
          text: `🎮 ${data.player.username} joined the battle!`,
          isSystem: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      }
    });
    const unsubLeft = onPlayerLeft((data) => {
      if (active) setRoomState(data.room);
    });
    const unsubStatus = onPlayerStatusChanged((data) => {
      if (active) setRoomState(data.room);
    });
    const unsubStarting = onGameStarting((data) => {
      if (!active) return;
      let count = 3;
      setCountdown(count);
      const cdInterval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(cdInterval);
          setCountdown(null);
        } else if (active) {
          setCountdown(count);
        }
      }, 1000);
      // Navigate after 3.5s — matches 3s countdown + 0.5s buffer
      // Use ref to always get latest userId even if state hasn't flushed
      setTimeout(() => {
        if (active) {
          const currentUserId = userIdRef.current;
          navigate('/computer-mode/game', {
            state: {
              ...(data.room?.settings || roomData),
              roomId, password: roomPassword,
              players: data.room.players.length,
              roomState: data.room,
              playerBots,
              userId: currentUserId,
              // ✨ Pass the full challenge/game data so no join-game roundtrip is needed
              gameData: data.gameData || null,
            },
          });
        }
      }, 3500);
    });
    const unsubChat = onChatMessage((msg) => {
      if (active) {
        setChatMessages(m => [...m, msg]);
      }
    });

    return () => {
      active = false;
      unsubJoined(); unsubLeft(); unsubStatus(); unsubStarting(); unsubChat();
    };
  }, [initialRoomContext]);

  // Manual retry effect — triggered when user clicks "Try Again"
  useEffect(() => {
    if (!retryCount || !roomData.isJoining) return;
    let active = true;
    const retry = async () => {
      const uid = userIdRef.current;
      if (!uid) return;
      let lastError;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const result = await joinRoom(roomId, roomPassword, uid, username || 'Player');
          if (active) { setRoomState(result.room); setConnecting(false); setError(null); }
          return;
        } catch (err) {
          lastError = err;
          if (err.message?.includes('password') || err.message?.includes('full')) break;
          if (attempt < 5 && active) {
            setConnectingAttempt(attempt);
            await new Promise(r => setTimeout(r, 2000));
            if (!active) return;
          }
        }
      }
      if (active) { setError(lastError?.message || 'Failed to join room'); setConnecting(false); }
    };
    retry();
    return () => { active = false; };
  }, [retryCount, roomData.isJoining, roomId, roomPassword, username]);

  const handleReadyChange = (checked) => {
    setAccepted(checked);
    if (userId) setPlayerReady(roomId, userId, checked);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (roomExpired) { alert('Room has expired. Please create a new room.'); return; }
    if (!accepted) { alert('Please mark yourself as Ready first!'); return; }
    if (totalPlayers > 1) {
      const currentCount = roomState?.players?.length || 0;
      if (currentCount < totalPlayers) {
        alert(`Waiting for ${totalPlayers - currentCount} more player(s). Share Room ID: ${roomId}`);
        return;
      }
      const allReady = roomState?.players?.every(p => p.ready);
      if (!allReady) { alert('Not all players are ready!'); return; }
    }
    try { await startGame(roomId); } catch (err) { alert(err.message); }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now(),
      from: username,
      text: chatInput.trim(),
      isSystem: false,
      isMine: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(m => [...m, msg]);
    sendChatMessage(roomId, { ...msg, userId, isMine: false });
    setChatInput('');
  };

  const handleBackToMode = () => {
    if (roomState && roomId) leaveRoom(roomId, userId || userIdRef.current);
    navigate('/computer-mode');
  };

  const formatExpiry = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const cardStyle = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 20,
  };

  if (connecting) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pageBg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, border: `4px solid 70`, borderTopColor: ac, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 800, color: ac, letterSpacing: 2 }}>
          {roomData.isJoining ? 'JOINING BATTLE ROOM...' : 'CREATING BATTLE ROOM...'}
        </p>
        {connectingAttempt > 0 && (
          <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
            Retrying... attempt {connectingAttempt + 1} of 5
          </p>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pageBg }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, ...cardStyle }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 22, color: '#ef4444', marginBottom: 12 }}>{roomData.isJoining ? 'CONNECTION FAILED' : 'ROOM CREATION FAILED'}</h2>
        <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>{error}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roomData.isJoining && (
            <button onClick={() => { setError(null); setConnecting(true); setConnectingAttempt(0); setRetryCount(c => c + 1); }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: `1px solid ${ac}`,
                background: 'transparent', color: ac, fontFamily: 'Rajdhani, sans-serif',
                 textTransform: 'uppercase', cursor: 'pointer', fontSize: 16, fontWeight: 700,
              }}>
              🔄 Try Again
            </button>
          )}
          <button onClick={handleBackToMode} style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: ac, color: 'white', fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer',
          }}>Back to Computer Mode</button>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const isHost = roomState?.players?.find(p => p.userId === userId)?.isHost ?? !roomData.isJoining;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: pageBg, color: 'white', overflow: 'hidden' }}>
      <CustomCursor theme={currentTheme} />
      <Navbar currentPage="lobby" themeKey={themeKey} setThemeKey={setThemeKey} themes={themes} currentTheme={currentTheme} />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400, background: `radial-gradient(ellipse, ${ac}10 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0 }} />

      {/* Top strip — Room ID, Password, Profile (multiplayer only) */}
      {totalPlayers > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 24px', background: 'rgba(0,0,0,0.4)',
          borderBottom: `1px solid ${ac}20`, flexShrink: 0, gap: 16, position: 'relative', zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={handleBackToMode} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 7, border: `1px solid 70`, background: `${ac}10`,
              color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
               fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
            }}>
              <ChevronLeft size={14} /> BACK
            </button>
            {/* Room credentials */}
            {[
              { icon: Hash, label: 'ROOM ID', value: roomId },
              { icon: Lock, label: 'PASSWORD', value: roomPassword },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: '6px 12px',
              }}>
                <Icon size={12} style={{ color: ac }} />
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'white' }}>{value}</div>
                </div>
                <button onClick={() => handleCopy(value)} style={{
                  width: 24, height: 24, borderRadius: 5, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {copied === value ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>

          {/* Right: expiry + profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Room expiry */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: expirySeconds < 60 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${expirySeconds < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8, padding: '6px 12px',
            }}>
              <Clock size={12} style={{ color: expirySeconds < 60 ? '#ef4444' : 'rgba(255,255,255,0.7)' }} />
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>ROOM EXPIRES</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700,
                  color: expirySeconds < 60 ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>
                  {formatExpiry(expirySeconds)}
                </div>
              </div>
            </div>
            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {profileImage
                ? <img src={profileImage} alt="You" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${ac}`, objectFit: 'cover' }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: `70`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: ac }}>{username[0]}</div>
              }
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'white' }}>{username}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: isHost ? ac : 'rgba(255,255,255,0.6)' }}>
                  {isHost ? '👑 HOST' : 'PLAYER'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '14px 20px', minHeight: 0, position: 'relative', zIndex: 1, overflow: 'hidden' }}>

        {/* LEFT — Chat (only for multiplayer) */}
        {totalPlayers > 1 && (
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Back button for single-player layout */}
            {totalPlayers === 1 && (
              <button onClick={handleBackToMode} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
                borderRadius: 8, border: `1px solid 70`, background: `${ac}10`,
                color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
                 fontSize: 16, fontWeight: 700,
              }}>
                <ChevronLeft size={14} /> BACK
              </button>
            )}

            {/* Chat box */}
            <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: 0, padding: 0, overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <MessageSquare size={14} style={{ color: ac }} />
                <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1 }}>LOBBY CHAT</span>
                <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isSystem ? 'center' : msg.isMine ? 'flex-end' : 'flex-start' }}>
                    {msg.isSystem ? (
                      <div style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: msg.isWarning ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.isWarning ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
                        fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                        color: msg.isWarning ? '#ef4444' : 'rgba(255,255,255,0.65)',
                        textAlign: 'center', maxWidth: '90%',
                      }}>{msg.text}</div>
                    ) : (
                      <>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                          marginBottom: 3, paddingLeft: msg.isMine ? 0 : 4, paddingRight: msg.isMine ? 4 : 0 }}>
                          {msg.isMine ? 'You' : msg.from} · {msg.time}
                        </div>
                        <div style={{
                          padding: '8px 12px', borderRadius: 10,
                          background: msg.isMine ? `${ac}20` : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${msg.isMine ? ac + '30' : 'rgba(255,255,255,0.06)'}`,
                          fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'white', maxWidth: '85%',
                          lineHeight: 1.5,
                        }}>{msg.text}</div>
                      </>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)', color: 'white',
                      fontFamily: 'monospace', fontSize: 16, fontWeight: 700, outline: 'none',
                      caretColor: ac,
                    }}
                  />
                  <button onClick={sendChat} style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: ac, color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CENTER & RIGHT — Lobby content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflowY: 'auto' }}>

          {/* Single player back + header */}
          {totalPlayers === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={handleBackToMode} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
                borderRadius: 8, border: `1px solid 70`, background: `${ac}10`,
                color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
                 fontSize: 16, fontWeight: 700,
              }}>
                <ChevronLeft size={14} /> BACK
              </button>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
                SOLO MODE — NO ROOM ID REQUIRED
              </div>
            </div>
          )}

          {/* Title */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 4, color: ac, textTransform: 'uppercase', marginBottom: 4 }}>
              {totalPlayers > 1 ? 'MULTIPLAYER BATTLE LOBBY' : 'SOLO BATTLE LOBBY'}
            </div>
            <h1 style={{
              margin: 0, fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 34,
              textTransform: 'uppercase', letterSpacing: 3,
              backgroundImage: `linear-gradient(135deg, white 30%, ${ac} 70%, ${currentTheme.ui})`,
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              color: 'transparent', WebkitTextFillColor: 'transparent',
            }}>
              BATTLE LOBBY
            </h1>
          </div>

          {/* Game settings chips */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              { icon: Clock, label: `${roomState?.settings?.roomTime || roomData.roomTime || roomData.timeLimit} min` },
              { icon: Target, label: `${roomState?.settings?.rounds || roomData.rounds} rounds` },
              { icon: Code, label: roomState?.settings?.language || roomData.language },
              { icon: Shield, label: roomState?.settings?.difficulty || roomData.difficulty },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                borderRadius: 20, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
              }}>
                <Icon size={12} style={{ color: ac }} /> {label}
              </div>
            ))}
          </div>

          {/* Players + Bots grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>

            {/* Players */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <User size={16} style={{ color: ac }} />
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, textTransform: 'uppercase' }}>PLAYERS</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                    {playersReady} / {totalPlayers} Ready
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Wifi size={12} style={{ color: '#10b981' }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#10b981' }}>LIVE</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Existing players */}
                {roomState?.players?.map((player, idx) => {
                  const isMe = player.userId === userId;
                  return (
                    <div key={player.userId || idx} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                      background: isMe ? `${ac}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isMe ? ac + '35' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.3s',
                    }}>
                      <div style={{ position: 'relative' }}>
                        {isMe && profileImage
                          ? <img src={profileImage} alt="You" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ac}` }} />
                          : <div style={{ width: 36, height: 36, borderRadius: '50%', background: player.ready ? `70` : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: player.ready ? ac : 'rgba(255,255,255,0.7)' }}>
                              {player.username?.[0]?.toUpperCase() || (idx + 1)}
                            </div>
                        }
                        {player.isHost && (
                          <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 16, fontWeight: 700 }}>👑</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: isMe ? ac : 'white' }}>
                          {player.username} {isMe && '(YOU)'}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: player.ready ? '#10b981' : 'rgba(255,255,255,0.6)' }}>
                          {player.ready ? '✅ Ready to battle' : '⏳ Waiting...'}
                        </div>
                      </div>
                      {player.ready && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      )}
                    </div>
                  );
                })}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, totalPlayers - (roomState?.players?.length || 0)) }).map((_, i) => (
                  <div key={`empty-${i}`} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>
                      {(roomState?.players?.length || 0) + i + 1}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                        Waiting for player...
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.12)' }}>Slot Open</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bots - one per player slot */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Bot size={16} style={{ color: '#f97316' }} />
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, textTransform: 'uppercase', color: '#f97316' }}>AI OPPONENTS</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                    Each player vs their own bot
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: totalPlayers }, (_, i) => {
                  const bot = getBotForPlayer(playerBots, i);
                  const assignedPlayer = roomState?.players?.[i];
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                      background: `${bot.color}08`, border: `1px solid ${bot.color}20`,
                    }}>
                      <img src={bot.image} alt={bot.name} style={{
                        width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                        border: `2px solid ${bot.color}60`, background: '#111', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: bot.color }}>{bot.name}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                            background: `${bot.color}20`, color: bot.color }}>{bot.tag}</span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                          vs {assignedPlayer ? assignedPlayer.username : `Player ${i + 1}`}
                        </div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: bot.color, flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Waiting notice */}
          {totalPlayers > 1 && (roomState?.players?.length || 0) < totalPlayers && (
            <div style={{
              padding: '10px 16px', borderRadius: 8, flexShrink: 0,
              background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>
                WAITING FOR {totalPlayers - (roomState?.players?.length || 0)} MORE PLAYER(S) — Share: {roomId} / {roomPassword}
              </span>
            </div>
          )}

          {/* Ready + Start Controls */}
          <div style={{ ...cardStyle, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}>
                <div
                  onClick={() => handleReadyChange(!accepted)}
                  style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: `2px solid ${accepted ? ac : 'rgba(255,255,255,0.6)'}`,
                    background: accepted ? ac : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {accepted && <span style={{ color: 'white', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15,
                  color: accepted ? ac : 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {accepted ? "✅ I'M READY TO BATTLE!" : "CLICK TO MARK READY"}
                </span>
              </label>

              {isHost ? (
                <button onClick={handleStart}
                  disabled={!accepted || (totalPlayers > 1 && (roomState?.players?.length || 0) < totalPlayers)}
                  style={{
                    padding: '13px 32px', borderRadius: 10, border: 'none',
                    background: accepted && !(totalPlayers > 1 && (roomState?.players?.length || 0) < totalPlayers)
                      ? `linear-gradient(135deg, ${ac}, ${currentTheme.ui})`
                      : 'rgba(255,255,255,0.05)',
                    color: accepted && !(totalPlayers > 1 && (roomState?.players?.length || 0) < totalPlayers) ? 'white' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, textTransform: 'uppercase',
                    fontSize: 15, cursor: accepted ? 'pointer' : 'not-allowed', letterSpacing: 2,
                    boxShadow: accepted ? `0 4px 20px 80` : 'none', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  <Play size={16} fill="white" /> START BATTLE
                </button>
              ) : (
                <div style={{ padding: '10px 18px', borderRadius: 8, fontFamily: 'Rajdhani, sans-serif',
                   fontSize: 15, fontWeight: 700, textTransform: 'uppercase',
                  color: ac, background: `${ac}10`, border: `1px solid ${ac}25` }}>
                  Waiting for host...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Countdown overlay */}
      {countdown !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 5,
            color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 20 }}>
            BATTLE COMMENCING IN
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 160,
            color: ac, lineHeight: 1,
            textShadow: `0 0 60px ${ac}80, 0 0 120px 80`,
            animation: 'countdownPop 1s ease infinite',
          }}>
            {countdown}
          </div>
          <p style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 22,
            color: 'white', letterSpacing: 4, textTransform: 'uppercase', marginTop: 24,
            animation: 'pulse 0.8s infinite',
          }}>
            ⚡ ENTERING THE CODING ARENA ⚡
          </p>
        </div>
      )}

      {/* Room expired overlay */}
      {roomExpired && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, gap: 20,
        }}>
          <div style={{ fontSize: 72 }}>⏰</div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 36, color: '#ef4444', letterSpacing: 3, margin: 0 }}>ROOM EXPIRED</h2>
          <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 360 }}>
            The lobby was inactive for 5 minutes. Create a new room to battle again.
          </p>
          <button onClick={() => navigate('/computer-mode/create-room')} style={{
            padding: '14px 36px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${ac}, ${currentTheme.ui})`,
            color: 'white', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 900, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase',
            boxShadow: `0 8px 32px 80`,
          }}>
            CREATE NEW ROOM
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes countdownPop { 0%,100%{transform:scale(1);} 50%{transform:scale(1.08);} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default LobbyPage;
