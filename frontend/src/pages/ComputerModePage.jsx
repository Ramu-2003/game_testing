import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import { Swords, KeyRound } from 'lucide-react';

const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', bg: '#0d0305' },
  blue:   { accent: '#0099ff', ui: '#00ccff', bg: '#020810' },
  green:  { accent: '#00ff88', ui: '#00ff99', bg: '#020d07' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#06020d' },
};

/* Floating binary rain canvas */
const BinaryRain = ({ accent }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cols = Math.floor(canvas.width / 18);
    const drops = Array.from({ length: cols }, () => Math.random() * -50);
    let frame;
    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px monospace';
      drops.forEach((y, i) => {
        const char = Math.random() > 0.5 ? '1' : '0';
        const alpha = Math.random() * 0.4 + 0.1;
        ctx.fillStyle = `${accent}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fillText(char, i * 18, y * 18);
        if (y * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.4;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [accent]);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      opacity: 0.35, pointerEvents: 'none',
    }} />
  );
};

/* Animated stat counter */
const StatBadge = ({ value, label, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 28, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>{label}</div>
  </div>
);

/* Mode card component */
const ModeCard = ({ type, ac, ui, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const isCreate = type === 'create';

  const cardAccent = isCreate ? ac : '#f97316';
  const cardUi = isCreate ? ui : '#fb923c';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        borderRadius: 24,
        border: `1.5px solid ${hovered ? cardAccent : cardAccent + '30'}`,
        background: hovered
          ? `linear-gradient(135deg, ${cardAccent}14, ${cardAccent}06)`
          : 'rgba(255,255,255,0.025)',
        boxShadow: hovered
          ? `0 0 60px ${cardAccent}25, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 ${cardAccent}20`
          : '0 8px 32px rgba(0,0,0,0.4)',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        flex: 1, display: 'flex', flexDirection: 'column',
        minHeight: 420,
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 300,
        background: `radial-gradient(circle, ${cardAccent}20 0%, transparent 70%)`,
        pointerEvents: 'none',
        opacity: hovered ? 1 : 0, transition: 'opacity 0.4s',
      }} />

      {/* Corner tag */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        padding: '4px 12px', borderRadius: 20,
        background: `${cardAccent}20`, border: `1px solid ${cardAccent}40`,
        fontFamily: 'monospace', fontSize: 16,  color: cardAccent,
        letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700,
      }}>
        {isCreate ? 'HOST' : 'GUEST'}
      </div>

      {/* Icon zone */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 0 32px',
        position: 'relative',
      }}>
        {/* Rotating ring */}
        <div style={{
          position: 'absolute',
          width: 120, height: 120, borderRadius: '50%',
          border: `2px dashed ${cardAccent}25`,
          animation: hovered ? 'spin 8s linear infinite' : 'none',
        }} />
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          background: `linear-gradient(135deg, ${cardAccent}20, ${cardAccent}08)`,
          border: `2px solid ${cardAccent}40`,
          boxShadow: hovered ? `0 0 30px ${cardAccent}40, inset 0 0 30px ${cardAccent}10` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.4s',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}>
          {isCreate ? (
            <Swords size={42} strokeWidth={1.5} color={cardAccent} style={{ filter: `drop-shadow(0 0 10px ${cardAccent})` }} />
          ) : (
            <KeyRound size={42} strokeWidth={1.5} color={cardAccent} style={{ filter: `drop-shadow(0 0 10px ${cardAccent})` }} />
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 32,
          color: 'white', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 10,
        }}>
          {isCreate ? 'CREATE ROOM' : 'JOIN ROOM'}
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.7, marginBottom: 24,
        }}>
          {isCreate
            ? 'Configure your battle settings, select AI opponents, and host a private arena for your squad.'
            : 'Enter a Room ID and password to join your friend\'s battle arena as a competitor.'}
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {(isCreate ? [
            'Choose 1–4 player battle mode',
            'Select or randomize AI bots',
            'Set language, difficulty & rounds',
          ] : [
            'Enter Room ID & Password',
            'Join live ongoing battles',
            'Compete against assigned AI bot',
          ]).map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: cardAccent, boxShadow: `0 0 8px ${cardAccent}`,
              }} />
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                {feat}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button style={{
          marginTop: 'auto', width: '100%', padding: '16px 0',
          borderRadius: 12, border: 'none',
          background: hovered
            ? `linear-gradient(135deg, ${cardAccent}, ${cardUi})`
            : `linear-gradient(135deg, ${cardAccent}80, ${cardAccent}40)`,
          color: 'white', cursor: 'pointer',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
          fontSize: 16, letterSpacing: 3, textTransform: 'uppercase',
          boxShadow: hovered ? `0 8px 32px ${cardAccent}50` : 'none',
          transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {isCreate ? '⚡ ENTER CONFIGURATION' : '🚀 ENTER BATTLE CODE'}
        </button>
      </div>
    </div>
  );
};

const ComputerModePage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  useEffect(() => {
    const iv = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', background: pageBg, color: 'white', position: 'relative', overflow: 'hidden' }}>
      <CustomCursor theme={{ accent: ac, ui }} />
      <Navbar currentPage="computer-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={themes} currentTheme={{ accent: ac, ui }} />

      {/* Binary Rain Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <BinaryRain accent={ac} />
      </div>

      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-10%', left: '20%',
        width: 500, height: 500,
        background: `radial-gradient(circle, ${ac}15 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', top: '20%', right: '10%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0, animation: 'float 10s ease-in-out infinite reverse',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 20px', borderRadius: 20,
            background: `${ac}12`, border: `1px solid 70`,
            fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: ac,
            textTransform: 'uppercase', letterSpacing: 4, marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ac, animation: 'pulse 2s infinite' }} />
            SYSTEM ONLINE — ARENA READY
          </div>

          <h1 style={{
            margin: '0 0 16px',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
            fontSize: 'clamp(48px, 8vw, 80px)',
            textTransform: 'uppercase', letterSpacing: 6,
            backgroundImage: `linear-gradient(135deg, white 30%, ${ac} 70%, ${ui})`,
            backgroundClip: 'text', WebkitBackgroundClip: 'text',
            color: 'transparent', WebkitTextFillColor: 'transparent',
            filter: glitch ? `drop-shadow(2px 0 0 ${ac}) drop-shadow(-2px 0 0 #ff0000)` : 'none',
            transition: 'filter 0.1s',
          }}>
            COMPUTER MODE
          </h1>

          <p style={{
            fontFamily: 'monospace', fontSize: 16, fontWeight: 700,
            color: 'rgba(255,255,255,0.7)', margin: '0 auto', maxWidth: 520, lineHeight: 1.8,
          }}>
            Human vs. Machine. Code faster than the AI or be defeated.
            The System judges. No mercy. No excuses.
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 48, marginTop: 36,
            padding: '20px 40px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, width: 'fit-content', margin: '36px auto 0',
          }}>
            <StatBadge value="5" label="AI Bots" color={ac} />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <StatBadge value="4" label="Player Modes" color="#f97316" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <StatBadge value="5" label="Rounds Max" color="#10b981" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <StatBadge value="5" label="Languages" color="#8b5cf6" />
          </div>
        </div>

        {/* Two Mode Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, maxWidth: 860, margin: '0 auto' }}>
          <ModeCard type="create" ac={ac} ui={ui} onClick={() => navigate('/computer-mode/create-room')} />
          <ModeCard type="join" ac={ac} ui={ui} onClick={() => navigate('/computer-mode/join-room')} />
        </div>

        {/* Bottom instruction */}
        <div style={{
          textAlign: 'center', marginTop: 48,
          fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
          letterSpacing: 2,
        }}>
          HOST A ROOM TO CONFIGURE BATTLE SETTINGS · JOIN A ROOM WITH ROOM ID + PASSWORD
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default ComputerModePage;
