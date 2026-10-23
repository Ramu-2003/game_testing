import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import { Swords3DIcon, Target3DIcon } from '../components/landing/ModeIcons';
import { PremiumIcon } from '../components/landing/PremiumIcon';


const THEMES = {
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#0b0e14' },
  blue:   { accent: '#3b82f6', ui: '#93c5fd', bg: '#0b1120' },
  green:  { accent: '#10b981', ui: '#6ee7b7', bg: '#061411' },
  red:    { accent: '#ef4444', ui: '#fca5a5', bg: '#1a0b0b' },
};



// THEMES structure similar to the rest of the application
/* Hexagon grid background */
const HexGrid = ({ theme }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w; canvas.height = h;
    const size = 28;
    const cols = Math.ceil(w / (size * 1.732)) + 2;
    const rows = Math.ceil(h / (size * 1.5)) + 2;
    let frame;
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.01;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * size * 1.732 + (r % 2 === 0 ? 0 : size * 0.866);
          const y = r * size * 1.5;
          const pulse = Math.sin(t + r * 0.4 + c * 0.3) * 0.5 + 0.5;
          const alpha = pulse * 0.12 + 0.03;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + size * 0.85 * Math.cos(angle);
            const py = y + size * 0.85 * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          
          // Parse hex to rgba
          const hex = theme.accent.replace('#', '');
          const rColor = parseInt(hex.substring(0, 2), 16);
          const gColor = parseInt(hex.substring(2, 4), 16);
          const bColor = parseInt(hex.substring(4, 6), 16);
          
          ctx.strokeStyle = `rgba(${rColor},${gColor},${bColor},${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    
    const handleResize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      opacity: 1, pointerEvents: 'none',
    }} />
  );
};

/* Scan line effect */
const ScanLines = ({ theme }) => {
  const hex = theme.accent.replace('#', '');
  const rColor = parseInt(hex.substring(0, 2), 16);
  const gColor = parseInt(hex.substring(2, 4), 16);
  const bColor = parseInt(hex.substring(4, 6), 16);
  
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${rColor},${gColor},${bColor},0.012) 2px, rgba(${rColor},${gColor},${bColor},0.012) 4px)`,
    }} />
  );
};

/* Stat chip */
const StatChip = ({ iconName, value, label, theme }) => (
  <div style={{ textAlign: 'center', padding: '12px 20px' }}>
    <div style={{ fontSize: 24, marginBottom: 4, display: 'flex', justifyContent: 'center' }}><PremiumIcon name={iconName} size={28} color={theme.accent} /></div>
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 26, color: theme.accent, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 }}>{label}</div>
  </div>
);

/* Feature list item */
const Feat = ({ text, theme }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ width: 5, height: 5, borderRadius: '50%', background: theme.accent, boxShadow: `0 0 6px ${theme.accent}`, flexShrink: 0 }} />
    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{text}</span>
  </div>
);

/* Mode Card */
const ModeCard = ({ type, onClick, theme }) => {
  const [hovered, setHovered] = useState(false);
  const isCreate = type === 'create';
  // Use accent for CREATE, asteroid (secondary) for JOIN
  const cardAccent = isCreate ? theme.accent : theme.asteroid;
  const uiColor = isCreate ? theme.ui : theme.asteroid;

  return (
    <div
      id={isCreate ? 'custom-create-room-card' : 'custom-join-room-card'}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        borderRadius: 24,
        border: `1.5px solid ${hovered ? cardAccent : cardAccent + '25'}`,
        background: hovered
          ? `linear-gradient(135deg, ${cardAccent}12, ${cardAccent}04)`
          : `rgba(255,255,255,0.01)`,
        boxShadow: hovered
          ? `0 0 60px ${cardAccent}20, 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 ${cardAccent}15`
          : '0 8px 32px rgba(0,0,0,0.5)',
        transform: hovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        flex: 1, display: 'flex', flexDirection: 'column',
        minHeight: 420,
      }}
    >
      {/* Top scanner line */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${cardAccent}, transparent)`,
          animation: 'scanH 2s linear infinite',
        }} />
      )}

      {/* Corner badge */}
      <div style={{
        position: 'absolute', top: 18, right: 18,
        padding: '3px 10px', borderRadius: 20,
        background: `${cardAccent}18`, border: `1px solid ${cardAccent}35`,
        fontFamily: 'monospace', fontSize: 15,  color: cardAccent,
        letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {isCreate ? <Swords3DIcon size={14} /> : <Target3DIcon size={14} />}
        {isCreate ? 'HOST' : 'GUEST'}
      </div>

      {/* Data corner top-left */}
      <div style={{
        position: 'absolute', top: 18, left: 18,
        fontFamily: 'monospace', fontSize: 7, color: `${cardAccent}40`,
        letterSpacing: 1,
      }}>
        {isCreate ? 'SYS::CREATE_ROOM' : 'SYS::JOIN_ROOM'}
      </div>

      {/* Icon zone */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '52px 0 28px', position: 'relative',
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          width: 130, height: 130, borderRadius: '50%',
          border: `1px dashed ${cardAccent}20`,
          animation: hovered ? 'spinSlow 12s linear infinite' : 'none',
        }} />
        {/* Inner ring */}
        <div style={{
          position: 'absolute',
          width: 100, height: 100, borderRadius: '50%',
          border: `1px solid ${cardAccent}15`,
          animation: hovered ? 'spinSlow 8s linear infinite reverse' : 'none',
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle, ${cardAccent}20, ${cardAccent}05)`,
          border: `1.5px solid ${cardAccent}45`,
          boxShadow: hovered ? `0 0 40px ${cardAccent}35, inset 0 0 20px ${cardAccent}10` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.4s',
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
        }}>
          {isCreate ? (
            <Swords3DIcon size={44} />
          ) : (
            <Target3DIcon size={44} />
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 28px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 30,
          color: 'white', textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8,
          textShadow: hovered ? `0 0 30px ${cardAccent}50` : 'none',
          transition: 'text-shadow 0.4s',
        }}>
          {isCreate ? 'CREATE ROOM' : 'JOIN ROOM'}
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.8, marginBottom: 20,
        }}>
          {isCreate
            ? 'Set up your arena: choose player count, rounds, time limit & language. Challenge real humans.'
            : 'Enter a Room ID & Password to join a live human-vs-human coding battle.'}
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 24 }}>
          {(isCreate ? [
            'Choose 2, 3, or 4 human players',
            'Select language, time & rounds',
            'Spectate mode for host',
          ] : [
            'Enter Room ID & Password',
            'Join live human battles',
            'Compete against real players',
          ]).map((f, i) => <Feat key={i} text={f} theme={{ accent: cardAccent }} />)}
        </div>

        {/* CTA */}
        <button style={{
          marginTop: 'auto', width: '100%', padding: '15px 0',
          borderRadius: 12, border: 'none',
          background: hovered
            ? `linear-gradient(135deg, ${cardAccent}, ${uiColor})`
            : `linear-gradient(135deg, ${cardAccent}70, ${cardAccent}30)`,
          color: 'white', cursor: 'pointer',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
          fontSize: 15, letterSpacing: 3, textTransform: 'uppercase',
          boxShadow: hovered ? `0 8px 32px ${cardAccent}45` : 'none',
          transition: 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          {isCreate ? '⚡ CONFIGURE BATTLE' : '🚀 ENTER BATTLE CODE'}
        </button>
      </div>
    </div>
  );
};

const CustomModePage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [glitch, setGlitch] = useState(false);

  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  useEffect(() => {
    const iv = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  const currentTheme = THEMES[themeKey] || THEMES.purple;

  return (
    <div style={{ minHeight: '100vh', background: currentTheme.bg, color: 'white', position: 'relative', overflow: 'hidden', transition: 'background-color 0.5s ease' }}>
      <CustomCursor theme={currentTheme} />
      
      <Navbar currentPage="custom-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} currentTheme={currentTheme} />

      {/* Backgrounds */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <HexGrid theme={currentTheme} />
      </div>
      <ScanLines theme={currentTheme} />

      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-5%', left: '15%',
        width: 600, height: 600,
        background: `radial-gradient(circle, ${currentTheme.accent}12 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, animation: 'floatSlow 10s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', top: '30%', right: '5%',
        width: 400, height: 400,
        background: `radial-gradient(circle, ${currentTheme.asteroid}10 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, animation: 'floatSlow 13s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', left: '5%',
        width: 300, height: 300,
        background: `radial-gradient(circle, ${currentTheme.accent}08 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, animation: 'floatSlow 16s ease-in-out infinite',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>

          {/* Top badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 20px', borderRadius: 20,
            background: `${currentTheme.accent}10`, border: `1px solid ${currentTheme.accent}30`,
            fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: currentTheme.accent,
            textTransform: 'uppercase', letterSpacing: 4, marginBottom: 22,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: currentTheme.accent, animation: 'pulseGlow 2s infinite', boxShadow: `0 0 8px ${currentTheme.accent}` }} />
            HUMAN VS HUMAN — NO BOTS ALLOWED
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: currentTheme.accent, animation: 'pulseGlow 2s infinite 1s', boxShadow: `0 0 8px ${currentTheme.accent}` }} />
          </div>

          {/* Main title */}
          <h1 style={{
            margin: '0 0 16px',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
            fontSize: 'clamp(52px, 9vw, 90px)',
            textTransform: 'uppercase', letterSpacing: 6,
            backgroundImage: `linear-gradient(135deg, white 20%, ${currentTheme.accent} 50%, ${currentTheme.ui} 80%)`,
            backgroundClip: 'text', WebkitBackgroundClip: 'text',
            color: 'transparent', WebkitTextFillColor: 'transparent',
            filter: glitch
              ? `drop-shadow(3px 0 0 ${currentTheme.accent}) drop-shadow(-3px 0 0 ${currentTheme.asteroid})`
              : `drop-shadow(0 0 40px ${currentTheme.accent}30)`,
            transition: 'filter 0.1s',
          }}>
            CUSTOM MODE
          </h1>

          {/* Sub title */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 14,
          }}>
            <div style={{ height: 1, width: 60, background: `linear-gradient(90deg, transparent, ${currentTheme.accent}50)` }} />
            <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${currentTheme.accent}80`, letterSpacing: 4, textTransform: 'uppercase' }}>
              HUMAN · VS · HUMAN
            </span>
            <div style={{ height: 1, width: 60, background: `linear-gradient(90deg, ${currentTheme.accent}50, transparent)` }} />
          </div>

          <p style={{
            fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
            color: 'rgba(255,255,255,0.7)', margin: '0 auto 36px', maxWidth: 520, lineHeight: 1.8,
          }}>
            Real coders. Real battles. No AI, no bots — just pure human intellect racing against the clock.
            First to submit the correct code wins. The System judges all.
          </p>

          {/* Stats bar */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 0,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${currentTheme.accent}20`,
            borderRadius: 16, overflow: 'hidden',
            boxShadow: `0 0 40px ${currentTheme.accent}08`,
          }}>
            <StatChip iconName="2P" value="4" label="Max Players" theme={currentTheme} />
            <div style={{ width: 1, background: `${currentTheme.accent}15`, alignSelf: 'stretch' }} />
            <StatChip iconName="Rounds" value="10" label="Max Rounds" theme={currentTheme} />
            <div style={{ width: 1, background: `${currentTheme.accent}15`, alignSelf: 'stretch' }} />
            <StatChip iconName="Time" value="3–8" label="Minutes" theme={currentTheme} />
            <div style={{ width: 1, background: `${currentTheme.accent}15`, alignSelf: 'stretch' }} />
            <StatChip iconName="Language" value="5" label="Languages" theme={currentTheme} />
            <div style={{ width: 1, background: `${currentTheme.accent}15`, alignSelf: 'stretch' }} />
            <StatChip iconName="Spectators" value="5" label="Spectators" theme={currentTheme} />
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, maxWidth: 880, margin: '0 auto 48px' }}>
          <ModeCard type="create" theme={currentTheme} onClick={() => navigate('/custom-mode/create-room')} />
          <ModeCard type="join" theme={currentTheme} onClick={() => navigate('/custom-mode/join-room')} />
        </div>

        {/* VS Divider info strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32,
          padding: '18px 32px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${currentTheme.accent}12`,
          borderRadius: 14, maxWidth: 680, margin: '0 auto',
        }}>
          {[
            { iconName: 'Laptop', text: 'Pure Human Skill' },
            { iconName: 'Zap', text: 'First Correct Submit Wins' },
            { iconName: 'Spectators', text: 'Spectate Mode' },
            { iconName: 'Crown', text: '10 Round Support' },
          ].map(({ iconName, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ display: 'flex', alignItems: 'center' }}><PremiumIcon name={iconName} size={16} color="white" /></span>
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom hint */}
        <div style={{
          textAlign: 'center', marginTop: 32,
          fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${currentTheme.accent}30`,
          letterSpacing: 3, textTransform: 'uppercase',
        }}>
          CREATE A ROOM TO HOST · JOIN A ROOM WITH ID + PASSWORD
        </div>
      </div>

      <style>{`
        @keyframes floatSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-24px); } }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.7); } }
        @keyframes scanH { 0% { opacity:0; transform:scaleX(0) translateX(-50%); } 50% { opacity:1; } 100% { opacity:0; transform:scaleX(1) translateX(50%); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default CustomModePage;
