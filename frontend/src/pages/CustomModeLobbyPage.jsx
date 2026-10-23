import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import {
  Copy, Check, User, Clock, Target, Code, ChevronLeft,
  AlertCircle, Hash, Lock, Send, MessageSquare, Play, Shield,
  Wifi, Eye, EyeOff, Users
} from 'lucide-react';
import { profileAPI } from '../utils/api';
import { initializeSocket, getSocket } from '../utils/socket';


const THEMES = {
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#0b0e14' },
  blue:   { accent: '#3b82f6', ui: '#93c5fd', bg: '#0b1120' },
  green:  { accent: '#10b981', ui: '#6ee7b7', bg: '#061411' },
  red:    { accent: '#ef4444', ui: '#fca5a5', bg: '#1a0b0b' },
};



const ROOM_EXPIRY_SECONDS = 900;

// Custom socket helpers for custom-mode prefix
function customCreateRoom(roomId, roomData, userId, username) {
  const sock = getSocket();
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timeout); sock.off('custom-room-created', onCreated); };
    const onCreated = (result) => {
      cleanup();
      if (result?.success) {
        if (result.charged) window.dispatchEvent(new Event('pointsUpdated'));
        resolve(result);
      }
      else reject(new Error(result?.message || 'Room creation failed'));
    };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Room creation timeout')); }, 6000);
    sock.once('custom-room-created', onCreated);
    sock.emit('custom-create-room', { roomId, roomData, userId, username });
  });
}

function customJoinRoom(roomId, password, userId, username) {
  const sock = getSocket();
  return new Promise((resolve, reject) => {
    const onJoined = (result) => { cleanup(); resolve(result); };
    const onJoinError = (error) => { cleanup(); reject(new Error(error.message)); };
    const cleanup = () => {
      clearTimeout(timeout);
      sock.off('custom-room-joined', onJoined);
      sock.off('custom-join-error', onJoinError);
    };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Join room timeout')); }, 6000);
    sock.once('custom-room-joined', onJoined);
    sock.once('custom-join-error', onJoinError);
    sock.emit('custom-join-room', { roomId, password, userId, username });
  });
}

function customStartGame(roomId) {
  const sock = getSocket();
  return new Promise((resolve, reject) => {
    const onErr = e => reject(new Error(e.message));
    sock.once('custom-start-error', onErr);
    sock.emit('custom-start-game', { roomId });
    setTimeout(() => { sock.off('custom-start-error', onErr); resolve({ roomId }); }, 500);
  });
}

const CustomModeLobbyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roomData = location.state || {};

  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const safeTheme = THEMES[themeKey] || THEMES.purple;
  const { accent: ac, ui } = safeTheme;

  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  
// State
  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [username, setUsername] = useState('You');
  const [userId, setUserId] = useState(null);
  const userIdRef = useRef(null);
  const [roomState, setRoomState] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [connectingAttempt, setConnectingAttempt] = useState(0);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [expirySeconds, setExpirySeconds] = useState(ROOM_EXPIRY_SECONDS);
  const [roomExpired, setRoomExpired] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { id: 0, from: 'SYSTEM', text: '⚔️ Welcome to the Custom Mode lobby — Human vs Human! Share your Room ID to invite opponents.', isSystem: true, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const [roomId] = useState(() => roomData.isJoining ? roomData.roomId : (roomData.roomId || 'CUST-' + Math.random().toString(36).substr(2, 8).toUpperCase()));
  const [roomPassword] = useState(() => roomData.isJoining ? (roomData.password || '') : (roomData.roomPassword || Math.random().toString(36).substr(2, 6).toUpperCase()));

  const totalPlayers = roomState?.settings?.playerMode || roomData.playerMode || 2;
  const [initialRoomContext] = useState(() => ({
    roomData, roomId, roomPassword, totalPlayers: roomData.playerMode || 2, navigate,
  }));
  const playersReady = roomState?.players?.filter(p => p.ready && !p.isSpectator).length || 0;
  const activePlayers = roomState?.players?.filter(p => !p.isSpectator) || [];

  // Auto scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Expiry countdown
  useEffect(() => {
    if (roomExpired) return;
    const iv = setInterval(() => {
      setExpirySeconds(prev => {
        if (prev <= 1) {
          clearInterval(iv);
          setRoomExpired(true);
          setChatMessages(m => [...m, {
            id: Date.now(), from: 'SYSTEM',
            text: '⚠️ Room expired after 15 minutes. Please create a new room.',
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

  // Initialize
  useEffect(() => {
    const { roomData, roomId, roomPassword, totalPlayers, navigate } = initialRoomContext;
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
          let lastError;
          for (let attempt = 1; attempt <= 5; attempt++) {
            try {
              const result = await customJoinRoom(roomId, roomPassword, userData._id, userData.username || 'Player');
              if (active) { setRoomState(result.room); setConnecting(false); }
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
        } else {
          const fullRoomData = { ...roomData, roomId, password: roomPassword, playerMode: totalPlayers, mode: 'custom' };
          const result = await customCreateRoom(roomId, fullRoomData, userData._id, userData.username || 'Host');
          if (active) { setRoomState(result.room); setConnecting(false); }
        }
      } catch (err) {
        if (active) { setError(err.message); setConnecting(false); }
      }
    };
    init();

    const sock = getSocket();

    const onJoined = (data) => {
      if (!active) return;
      setRoomState(data.room);
      setChatMessages(m => [...m, {
        id: Date.now(), from: 'SYSTEM',
        text: `🎮 ${data.player.username} joined the arena!`,
        isSystem: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    };
    const onLeft = (data) => { if (active) setRoomState(data.room); };
    const onStatus = (data) => { if (active) setRoomState(data.room); };
    const onStarting = (data) => {
      if (!active) return;
      let count = 3;
      setCountdown(count);
      const cdInterval = setInterval(() => {
        count -= 1;
        if (count <= 0) { clearInterval(cdInterval); setCountdown(null); }
        else if (active) setCountdown(count);
      }, 1000);
      setTimeout(() => {
        if (active) {
          navigate('/custom-mode/game', {
            state: {
              ...(data.room?.settings || roomData),
              roomId,
              password: roomPassword,
              players: data.room?.players,
              roomState: data.room,
              userId: userIdRef.current,
              isSpectator: data.room?.players?.find(p => p.userId === userIdRef.current)?.isSpectator || false,
              gameData: data.gameData || null,
              mode: 'custom',
            },
          });
        }
      }, 3500);
    };
    const onChat = (msg) => { if (active) setChatMessages(m => [...m, msg]); };

    sock.on('custom-player-joined', onJoined);
    sock.on('custom-player-left', onLeft);
    sock.on('custom-player-status-changed', onStatus);
    sock.on('custom-game-starting', onStarting);
    sock.on('custom-chat-message', onChat);

    return () => {
      active = false;
      sock.off('custom-player-joined', onJoined);
      sock.off('custom-player-left', onLeft);
      sock.off('custom-player-status-changed', onStatus);
      sock.off('custom-game-starting', onStarting);
      sock.off('custom-chat-message', onChat);
    };
  }, [initialRoomContext]);

  const handleReadyChange = (checked) => {
    setAccepted(checked);
    if (userId) {
      const sock = getSocket();
      sock.emit('custom-player-ready', { roomId, userId, ready: checked });
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (roomExpired) { alert('Room has expired.'); return; }
    if (!accepted) { alert('Please mark yourself as Ready first!'); return; }
    const currentCount = roomState?.players?.filter(p => !p.isSpectator).length || 0;
    if (currentCount < totalPlayers) {
      alert(`Waiting for ${totalPlayers - currentCount} more player(s). Share Room ID: ${roomId}`);
      return;
    }
    const allReady = roomState?.players?.filter(p => !p.isSpectator).every(p => p.ready);
    if (!allReady) { alert('Not all players are ready!'); return; }
    try { await customStartGame(roomId); } catch (err) { alert(err.message); }
  };

  const handleSpectateToggle = () => {
    const sock = getSocket();
    const newSpectate = !isSpectator;
    setIsSpectator(newSpectate);
    sock.emit('custom-spectate-toggle', { roomId, userId, isSpectator: newSpectate });
    setChatMessages(m => [...m, {
      id: Date.now(), from: 'SYSTEM',
      text: newSpectate ? '🎭 Host is now spectating. Opening a player slot.' : '⚔️ Host rejoined as a player.',
      isSystem: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now(), from: username, text: chatInput.trim(),
      isSystem: false, isMine: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(m => [...m, msg]);
    const sock = getSocket();
    sock.emit('custom-send-chat', { roomId, message: { ...msg, userId, isMine: false } });
    setChatInput('');
  };

  const handleBackToCustomMode = () => {
    if (roomState && roomId) {
      getSocket().emit('custom-leave-room', { roomId, userId: userId || userIdRef.current });
    }
    navigate('/custom-mode');
  };

  const formatExpiry = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const cardStyle = {
    background: 'rgba(0,229,255,0.025)',
    border: '1px solid rgba(0,229,255,0.1)',
    borderRadius: 16, padding: 20,
  };

  const isHost = roomState?.players?.find(p => p.userId === userId)?.isHost ?? !roomData.isJoining;

  if (connecting) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ('#010d12') }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, border: `4px solid ${ac}30`, borderTopColor: ac, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 800, color: ac, letterSpacing: 2 }}>
          {roomData.isJoining ? 'JOINING BATTLE ARENA...' : 'CREATING BATTLE ARENA...'}
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ('#010d12') }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, ...cardStyle }}>
        <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: 16 }} />
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 22, color: '#ef4444', marginBottom: 12 }}>{roomData.isJoining ? 'CONNECTION FAILED' : 'ROOM CREATION FAILED'}</h2>
        <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>{error}</p>
        <button onClick={handleBackToCustomMode} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
          background: ac, color: '#001a20', fontFamily: 'Rajdhani, sans-serif',
           textTransform: 'uppercase', cursor: 'pointer', fontSize: 16, fontWeight: 700,
        }}>Back to Custom Mode</button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: ('#010d12'), color: 'white', overflow: 'hidden' }}>
      <CustomCursor theme={{ accent: ac, ui: ui }} />
      <Navbar currentPage="custom-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} currentTheme={{ accent: ac, ui: ui }} />

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400, background: `radial-gradient(ellipse, ${ac}08 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0 }} />

      {/* Top strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 24px', background: 'rgba(0,0,0,0.5)',
        borderBottom: `1px solid ${ac}18`, flexShrink: 0, gap: 16, position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={handleBackToCustomMode} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 7, border: `1px solid ${ac}30`, background: `${ac}08`,
            color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
             fontSize: 16, fontWeight: 700,
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
              background: 'rgba(0,229,255,0.04)', border: `1px solid ${ac}15`,
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

        {/* Right: mode tag + expiry + profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Custom Mode badge */}
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: `${ac}12`, border: `1px solid ${ac}30`,
            fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: ac, letterSpacing: 2,
          }}>
            ⚔️ HUMAN VS HUMAN
          </div>

          {/* Room expiry */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: expirySeconds < 60 ? 'rgba(239,68,68,0.1)' : 'rgba(0,229,255,0.04)',
            border: `1px solid ${expirySeconds < 60 ? 'rgba(239,68,68,0.3)' : `${ac}12`}`,
            borderRadius: 8, padding: '6px 12px',
          }}>
            <Clock size={12} style={{ color: expirySeconds < 60 ? '#ef4444' : `${ac}80` }} />
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>ROOM EXPIRES</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: expirySeconds < 60 ? '#ef4444' : 'rgba(255,255,255,0.7)' }}>
                {formatExpiry(expirySeconds)}
              </div>
            </div>
          </div>

          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {profileImage
              ? <img src={profileImage} alt="You" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${ac}`, objectFit: 'cover' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ac}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: ac }}>{username[0]}</div>
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

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', gap: 16, padding: '14px 20px', minHeight: 0, position: 'relative', zIndex: 1, overflow: 'hidden' }}>

        {/* LEFT — Chat */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0, overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${ac}10`,
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <MessageSquare size={14} style={{ color: ac }} />
              <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>LOBBY CHAT</span>
              <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isSystem ? 'center' : msg.isMine ? 'flex-end' : 'flex-start' }}>
                  {msg.isSystem ? (
                    <div style={{
                      padding: '6px 12px', borderRadius: 8,
                      background: msg.isWarning ? 'rgba(239,68,68,0.1)' : `${ac}08`,
                      border: `1px solid ${msg.isWarning ? 'rgba(239,68,68,0.2)' : `${ac}15`}`,
                      fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                      color: msg.isWarning ? '#ef4444' : `${ac}80`,
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
                        background: msg.isMine ? `${ac}18` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${msg.isMine ? ac + '30' : 'rgba(255,255,255,0.06)'}`,
                        fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'white', maxWidth: '85%', lineHeight: 1.5,
                      }}>{msg.text}</div>
                    </>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${ac}10`, flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${ac}15`,
                    background: `${ac}04`, color: 'white',
                    fontFamily: 'monospace', fontSize: 16, fontWeight: 700, outline: 'none', caretColor: ac,
                  }}
                />
                <button onClick={sendChat} style={{
                  width: 36, height: 36, borderRadius: 8, border: 'none',
                  background: ac, color: '#001a20', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER — Lobby content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflowY: 'auto' }}>

          {/* Title */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 4, color: ac, textTransform: 'uppercase', marginBottom: 4 }}>
              HUMAN VS HUMAN BATTLE LOBBY
            </div>
            <h1 style={{
              margin: 0, fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 32,
              textTransform: 'uppercase', letterSpacing: 3,
              backgroundImage: `linear-gradient(135deg, white 40%, ${ac})`,
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              color: 'transparent', WebkitTextFillColor: 'transparent',
            }}>
              BATTLE LOBBY
            </h1>
          </div>

          {/* Settings chips */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              { icon: Clock, label: `${roomState?.settings?.roomTime || roomData.roomTime || 5} min` },
              { icon: Target, label: `${roomState?.settings?.rounds || roomData.rounds || 3} rounds` },
              { icon: Code, label: roomState?.settings?.language || roomData.language || 'JavaScript' },
              { icon: Shield, label: roomState?.settings?.difficulty || roomData.difficulty || 'Moderate' },
              { icon: Users, label: `${totalPlayers}P` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                borderRadius: 20, background: `${ac}06`,
                border: `1px solid ${ac}15`,
                fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
              }}>
                <Icon size={12} style={{ color: ac }} /> {label}
              </div>
            ))}
          </div>

          {/* Players grid */}
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

            <div style={{ display: 'grid', gridTemplateColumns: totalPlayers === 4 ? 'repeat(2,1fr)' : `repeat(${totalPlayers},1fr)`, gap: 12 }}>
              {/* Filled slots */}
              {activePlayers.map((player, idx) => {
                const isMe = player.userId === userId;
                return (
                  <div key={player.userId || idx} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', borderRadius: 14,
                    background: isMe ? `${ac}10` : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${isMe ? ac + '40' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.3s', textAlign: 'center',
                  }}>
                    <div style={{ position: 'relative' }}>
                      {isMe && profileImage
                        ? <img src={profileImage} alt="You" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${ac}` }} />
                        : <div style={{ width: 48, height: 48, borderRadius: '50%', background: player.ready ? `${ac}25` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18, color: player.ready ? ac : 'rgba(255,255,255,0.6)' }}>
                            {player.username?.[0]?.toUpperCase() || (idx + 1)}
                          </div>
                      }
                      {player.isHost && (
                        <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 16, fontWeight: 700 }}>👑</div>
                      )}
                      {player.ready && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#10b981', border: '2px solid #010d12', boxShadow: '0 0 6px #10b981' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: isMe ? ac : 'white' }}>
                        {player.username} {isMe && '(YOU)'}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: player.ready ? '#10b981' : 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                        {player.ready ? '✅ READY' : '⏳ Waiting...'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: Math.max(0, totalPlayers - activePlayers.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 12px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.01)', border: `1.5px dashed ${ac}15`, textAlign: 'center',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${ac}06`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18, color: `${ac}30` }}>
                    {activePlayers.length + i + 1}
                  </div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                    Waiting for player...
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.1)' }}>SLOT OPEN</div>
                </div>
              ))}
            </div>
          </div>

          {/* Spectators section (host only) */}
          {isHost && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Eye size={16} style={{ color: `${ac}80` }} />
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>SPECTATOR ZONE (HOST ONLY)</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Up to 5 spectator slots — optional</div>
                </div>
                <button onClick={handleSpectateToggle} style={{
                  marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: `1px solid ${ac}30`,
                  background: isSpectator ? `${ac}18` : 'rgba(255,255,255,0.04)',
                  color: isSpectator ? ac : 'rgba(255,255,255,0.8)',
                  fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {isSpectator ? <EyeOff size={12} /> : <Eye size={12} />}
                  {isSpectator ? 'REJOIN AS PLAYER' : '🎭 GO SPECTATE'}
                </button>
              </div>

              {isSpectator && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: `${ac}08`, border: `1px solid ${ac}20`,
                  fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${ac}80`,
                }}>
                  🎭 You are spectating. You will watch all players’ code during the battle — read only.
                </div>
              )}
            </div>
          )}

          {/* Waiting notice */}
          {activePlayers.length < totalPlayers && (
            <div style={{
              padding: '10px 16px', borderRadius: 8, flexShrink: 0,
              background: `${('#ff6b35')}08`, border: `1px solid ${('#ff6b35')}25`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ('#ff6b35'), animation: 'pulse 1s infinite' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: ('#ff6b35') }}>
                WAITING FOR {totalPlayers - activePlayers.length} MORE PLAYER(S) — Share: {roomId} / {roomPassword}
              </span>
            </div>
          )}

          {/* Ready + Start */}
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    boxShadow: accepted ? `0 0 12px ${ac}50` : 'none',
                  }}
                >
                  {accepted && <span style={{ color: '#001a20', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15,
                  color: accepted ? ac : 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {accepted ? "✅ I'M READY TO BATTLE!" : "CLICK TO MARK READY"}
                </span>
              </label>

              {isHost ? (
                <button onClick={handleStart}
                  id="custom-start-battle-btn"
                  disabled={!accepted || activePlayers.length < totalPlayers}
                  style={{
                    padding: '13px 32px', borderRadius: 10, border: 'none',
                    background: accepted && activePlayers.length >= totalPlayers
                      ? `linear-gradient(135deg, ${ac}, ${ui})`
                      : 'rgba(255,255,255,0.05)',
                    color: accepted && activePlayers.length >= totalPlayers ? '#001a20' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, textTransform: 'uppercase',
                    fontSize: 15, cursor: accepted ? 'pointer' : 'not-allowed', letterSpacing: 2,
                    boxShadow: accepted ? `0 4px 20px ${ac}40` : 'none', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                  <Play size={16} fill={accepted && activePlayers.length >= totalPlayers ? '#001a20' : 'rgba(255,255,255,0.6)'} /> START BATTLE
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)',
          backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 5,
            color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 20 }}>
            BATTLE COMMENCING IN
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 180,
            color: ac, lineHeight: 1,
            textShadow: `0 0 80px ${ac}90, 0 0 160px ${ac}40`,
            animation: 'countdownPop 1s ease-out',
          }}>
            {countdown}
          </div>
          <p style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 20,
            color: 'rgba(255,255,255,0.6)', letterSpacing: 4, marginTop: 16,
          }}>
            ⚔️ HUMAN VS HUMAN — MAY THE BEST CODER WIN
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes countdownPop { from { transform:scale(1.6); opacity:0; } to { transform:scale(1); opacity:1; } }

* { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default CustomModeLobbyPage;
