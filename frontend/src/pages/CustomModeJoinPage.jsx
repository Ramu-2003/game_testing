import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import { Lock, Hash, ChevronLeft, ArrowRight } from 'lucide-react';


const THEMES = {
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#0b0e14' },
  blue:   { accent: '#3b82f6', ui: '#93c5fd', bg: '#0b1120' },
  green:  { accent: '#10b981', ui: '#6ee7b7', bg: '#061411' },
  red:    { accent: '#ef4444', ui: '#fca5a5', bg: '#1a0b0b' },
};



const CustomModeJoinPage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const safeTheme = THEMES[themeKey] || THEMES.purple;
  const { accent: ac, ui } = safeTheme;

  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [joining, setJoining] = useState(false);

  
const handleJoin = () => {
    if (!roomId.trim()) return;
    setJoining(true);

    let formattedRoomId = roomId.trim().toUpperCase();
    if (!formattedRoomId.startsWith('CUST-')) {
      formattedRoomId = 'CUST-' + formattedRoomId;
    }

    setTimeout(() => {
      navigate('/custom-mode/lobby', {
        state: {
          roomId: formattedRoomId,
          password: password.trim().toUpperCase(),
          isJoining: true,
          mode: 'custom',
        },
      });
    }, 600);
  };

  const canJoin = roomId.trim().length > 0;

  return (
    <div style={{ minHeight: '100vh', background: ('#010d12'), color: 'white', position: 'relative', overflow: 'hidden' }}>
      <CustomCursor theme={{ accent: ac, ui: ui }} />
      <Navbar currentPage="custom-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} currentTheme={{ accent: ac, ui: ui }} />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400,
        background: `radial-gradient(ellipse, ${ac}12 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${ac} 1px, transparent 1px), linear-gradient(90deg, ${ac} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Corner glow */}
      <div style={{
        position: 'fixed', bottom: '10%', right: '5%',
        width: 400, height: 400,
        background: `radial-gradient(circle, ${('#ff6b35')}10 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Back button */}
          <button onClick={() => navigate('/custom-mode')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', marginBottom: 28,
            borderRadius: 8, border: `1px solid ${ac}30`, background: `${ac}08`,
            color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
             fontSize: 16, fontWeight: 700, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${ac}18`}
          onMouseLeave={e => e.currentTarget.style.background = `${ac}08`}
          >
            <ChevronLeft size={14} /> BACK TO CUSTOM MODE
          </button>

          {/* Card */}
          <div style={{
            background: 'rgba(0,229,255,0.03)',
            border: `1.5px solid ${ac}20`,
            borderRadius: 24, padding: '40px 36px',
            boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 40px ${ac}08`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Top border accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${ac}, transparent)`,
            }} />

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18, margin: '0 auto 18px',
                background: `linear-gradient(135deg, ${('#ff6b35')}, #ff9b6b)`,
                boxShadow: `0 8px 30px ${('#ff6b35')}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
              }}>
                🎯
              </div>
              <h1 style={{ margin: '0 0 8px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 32, textTransform: 'uppercase', letterSpacing: 3, color: 'white' }}>
                JOIN BATTLE
              </h1>
              <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                Enter your credentials to join a human vs human arena
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
                    id="custom-join-room-id"
                    type="text"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && canJoin && handleJoin()}
                    placeholder="e.g. CUST-AB12CD34"
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, outline: 'none',
                      background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${roomId ? ac + '60' : 'rgba(255,255,255,0.08)'}`,
                      color: 'white', fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                      transition: 'all 0.2s', caretColor: ac, letterSpacing: 1,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.boxShadow = `0 0 12px ${ac}15`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = roomId ? ac + '60' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 8 }}>
                  PASSWORD <span style={{ color: 'rgba(255,255,255,0.55)', textTransform: 'lowercase', fontSize: 15, fontWeight: 700 }}>(required)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
                  <input
                    id="custom-join-password"
                    type="text"
                    value={password}
                    onChange={e => setPassword(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && canJoin && handleJoin()}
                    placeholder="Enter room password"
                    style={{
                      width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, outline: 'none',
                      background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
                      color: 'white', fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
                      transition: 'all 0.2s', caretColor: ac, letterSpacing: 1,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.boxShadow = `0 0 12px ${ac}15`; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Info box */}
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: `${ac}06`, border: `1px solid ${ac}18`,
                fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
              }}>
                🎯 Get your Room ID and Password from the host&apos;s battle lobby screen. Room IDs start with <strong style={{ color: ac }}>CUST-</strong>

</div>

              {/* Join Button */}
              <button id="custom-join-btn" onClick={handleJoin} disabled={!canJoin || joining} style={{
                width: '100%', padding: '16px 0', borderRadius: 12, border: 'none', marginTop: 8,
                background: canJoin && !joining
                  ? `linear-gradient(135deg, ${('#ff6b35')}, #ff9b6b)`
                  : 'rgba(255,255,255,0.06)',
                color: canJoin ? 'white' : 'rgba(255,255,255,0.6)',
                cursor: canJoin ? 'pointer' : 'not-allowed',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, textTransform: 'uppercase',
                fontSize: 16, letterSpacing: 3,
                boxShadow: canJoin && !joining ? `0 8px 30px ${('#ff6b35')}40` : 'none',
                transition: 'all 0.3s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {joining ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.6)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    JOINING...
                  </>
                ) : (
                  <>🎯 JOIN BATTLE <ArrowRight size={16} /></>
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

export default CustomModeJoinPage;
