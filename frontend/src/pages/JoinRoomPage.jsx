import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import { Lock, Hash, ChevronLeft, ArrowRight } from 'lucide-react';

const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', bg: '#0d0305' },
  blue:   { accent: '#0099ff', ui: '#00ccff', bg: '#020810' },
  green:  { accent: '#00ff88', ui: '#00ff99', bg: '#020d07' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#06020d' },
};

const JoinRoomPage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [joining, setJoining] = useState(false);

  const safeTheme = THEMES[themeKey] || THEMES.purple || THEMES['purple'] || { accent: "#a855f7", ui: "#d8b4fe", bg: "#06020d" };
  const ac = safeTheme.accent;
  const ui = safeTheme.ui;
  const pageBg = safeTheme.bg;
  const themes = {
    red: { accent: '#ff5252', ui: '#ff6b6b' },
    blue: { accent: '#0099ff', ui: '#00ccff' },
    green: { accent: '#00ff88', ui: '#00ff99' },
    purple: { accent: '#a855f7', ui: '#d8b4fe' },
  };

  const handleJoin = () => {
    if (!roomId.trim()) return;
    setJoining(true);
    setTimeout(() => {
      navigate('/computer-mode/lobby', {
        state: {
          roomId: roomId.trim().toUpperCase(),
          password: password.trim().toUpperCase(),
          isJoining: true,
        },
      });
    }, 600);
  };

  const canJoin = roomId.trim().length > 0;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, color: 'white', position: 'relative', overflow: 'hidden' }}>
      <CustomCursor theme={{ accent: ac, ui }} />
      <Navbar currentPage="join room" themeKey={themeKey} setThemeKey={setThemeKey} themes={themes} currentTheme={{ accent: ac, ui }} />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400,
        background: `radial-gradient(ellipse, ${ac}12 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Decorative grid lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(${ac} 1px, transparent 1px),
          linear-gradient(90deg, ${ac} 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Back */}
          <button onClick={() => navigate('/computer-mode')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', marginBottom: 28,
            borderRadius: 8, border: `1px solid 70`, background: `${ac}10`,
            color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
             fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${ac}25`}
          onMouseLeave={e => e.currentTarget.style.background = `${ac}10`}
          >
            <ChevronLeft size={14} /> BACK TO COMPUTER MODE
          </button>

          {/* Card */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: `1.5px solid rgba(255,255,255,0.08)`,
            borderRadius: 24, padding: '40px 36px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}>
            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 68, height: 68, borderRadius: 16, margin: '0 auto 18px',
                background: `linear-gradient(135deg, #f97316, #fb923c)`,
                boxShadow: '0 8px 30px rgba(249,115,22,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
              }}>
                🔐
              </div>
              <h1 style={{ margin: '0 0 8px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 32, textTransform: 'uppercase', letterSpacing: 3, color: 'white' }}>
                JOIN ROOM
              </h1>
              <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                Enter your battle credentials to join the arena
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Room ID */}
              <div>
                <label style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: ac, display: 'block', marginBottom: 8 }}>
                  ROOM ID <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
                  <input
                    type="text"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && canJoin && handleJoin()}
                    placeholder="e.g. ROOM-AB12CD34"
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, outline: 'none',
                      background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${roomId ? ac + '50' : 'rgba(255,255,255,0.08)'}`,
                      color: 'white', fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                      transition: 'all 0.2s', caretColor: ac, letterSpacing: 1,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = roomId ? ac + '50' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 8 }}>
                  PASSWORD <span style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'lowercase', fontSize: 15, fontWeight: 700 }}>(if required)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
                  <input
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && canJoin && handleJoin()}
                    placeholder="Enter password"
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, outline: 'none',
                      background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
                      color: 'white', fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                      transition: 'all 0.2s', caretColor: ac, letterSpacing: 1,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  />
                </div>
              </div>

              {/* Info box */}
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)',
                fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
              }}>
                💡 Get your Room ID and Password from the host&apos;s battle lobby screen.
              </div>

              {/* Join Button */}
              <button onClick={handleJoin} disabled={!canJoin || joining} style={{
                width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', marginTop: 8,
                background: canJoin && !joining ? `linear-gradient(135deg, #f97316, #fb923c)` : 'rgba(255,255,255,0.06)',
                color: canJoin ? 'white' : 'rgba(255,255,255,0.6)', cursor: canJoin ? 'pointer' : 'not-allowed',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, textTransform: 'uppercase',
                fontSize: 16, letterSpacing: 3,
                boxShadow: canJoin && !joining ? '0 8px 30px rgba(249,115,22,0.45)' : 'none',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {joining ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.6)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    JOINING...
                  </>
                ) : (
                  <>🚀 JOIN BATTLE <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default JoinRoomPage;
