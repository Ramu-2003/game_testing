import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import { Trophy, RotateCcw, Home, Clock, Target, Code } from 'lucide-react';


const THEMES = {
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#0b0e14' },
  blue:   { accent: '#3b82f6', ui: '#93c5fd', bg: '#0b1120' },
  green:  { accent: '#10b981', ui: '#6ee7b7', bg: '#061411' },
  red:    { accent: '#ef4444', ui: '#fca5a5', bg: '#1a0b0b' },
};



const PLAYER_COLORS = ['#00e5ff', '#ff6b35', '#a855f7', '#10b981'];

// Confetti particle
const Confetti = ({ active, accent }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 3,
      d: Math.random() * 120 + 80,
      color: [accent, '#ff6b35', '#a855f7', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      vx: Math.random() * 2 - 1,
      vy: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      rotation: 0, rotSpeed: (Math.random() - 0.5) * 0.1,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.5);
        ctx.restore();
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const t = setTimeout(() => cancelAnimationFrame(frame), 6000);
    return () => { cancelAnimationFrame(frame); clearTimeout(t); };
  }, [active, accent]);
  return active ? <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }} /> : null;
};

// Hex background
const HexBg = ({ accent }) => (
  <div style={{
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04,
    backgroundImage: `radial-gradient(${accent}80 1px, transparent 1px)`,
    backgroundSize: '30px 30px',
  }} />
);

const CustomModeResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rd = location.state || {};

  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const safeTheme = THEMES[themeKey] || THEMES.purple;
  const { accent: ac, ui } = safeTheme;

  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  
const players   = rd.players || [];
  const scores    = rd.scores || {};
  const myUserId  = rd.myUserId;
  const language  = rd.language || 'JavaScript';
  const difficulty = rd.difficulty || 'Moderate';
  const totalRounds = rd.totalRounds || 1;

  // Sort players by score descending
  const sortedPlayers = [...players].filter(p => !p.isSpectator).sort((a, b) =>
    (scores[b.userId] || 0) - (scores[a.userId] || 0)
  );

  const winnerPlayer = sortedPlayers[0];
  const didIWin = winnerPlayer?.userId === myUserId;
  const isDraw = rd.winner === 'draw' || (sortedPlayers.length > 1 && (scores[sortedPlayers[0]?.userId] || 0) === (scores[sortedPlayers[1]?.userId] || 0));

  const [showConfetti, setShowConfetti] = useState(false);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setAnimated(true), 200);
    if (didIWin && !isDraw) {
      const t2 = setTimeout(() => setShowConfetti(true), 400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    return () => clearTimeout(t1);
  }, [didIWin, isDraw]);

  const cardStyle = {
    background: 'rgba(0,229,255,0.025)',
    border: '1px solid rgba(0,229,255,0.1)',
    borderRadius: 16, padding: 24,
  };

  const winnerData = isDraw
    ? { icon: '🤝', title: "IT'S A DRAW!", subtitle: 'Both players are equally legendary.', color: '#f59e0b' }
    : didIWin
    ? { icon: '🏆', title: 'YOU WIN!', subtitle: 'Magnificent! You coded faster than all opponents.', color: '#10b981' }
    : { icon: '💀', title: 'YOU LOSE', subtitle: `${winnerPlayer?.username || 'Your opponent'} was faster. Train harder.`, color: '#ef4444' };

  return (
    <div style={{ minHeight: '100vh', background: ('#010d12'), color: 'white', position: 'relative', overflow: 'hidden' }}>
      <CustomCursor theme={{ accent: ac, ui: ui }} />
      <Navbar currentPage="custom-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} currentTheme={{ accent: ac, ui: ui }} />
      <HexBg accent={ac} />
      <Confetti active={showConfetti} accent={ac} />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: `radial-gradient(circle, ${winnerData.color}12 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Winner announcement */}
        <div style={{
          textAlign: 'center', marginBottom: 48,
          opacity: animated ? 1 : 0,
          transform: animated ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 20px', borderRadius: 20,
            background: `${ac}10`, border: `1px solid ${ac}30`,
            fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: ac,
            textTransform: 'uppercase', letterSpacing: 4, marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ac, animation: 'pulse 2s infinite' }} />
            CUSTOM MODE — HUMAN VS HUMAN · BATTLE COMPLETE
          </div>

          <div style={{ fontSize: 80, marginBottom: 16, filter: `drop-shadow(0 0 40px ${winnerData.color}60)` }}>
            {winnerData.icon}
          </div>

          <h1 style={{
            margin: '0 0 12px',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
            fontSize: 'clamp(48px, 8vw, 80px)',
            textTransform: 'uppercase', letterSpacing: 5,
            color: winnerData.color,
            textShadow: `0 0 60px ${winnerData.color}50`,
          }}>
            {winnerData.title}
          </h1>

          <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)', maxWidth: 450, margin: '0 auto' }}>
            {winnerData.subtitle}
          </p>

          {/* Battle stats */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 32, marginTop: 32,
            padding: '16px 32px',
            background: 'rgba(0,229,255,0.03)', border: `1px solid ${ac}15`,
            borderRadius: 14, width: 'fit-content', margin: '32px auto 0',
          }}>
            {[
              { icon: Code, label: language, sublabel: 'Language' },
              { icon: Target, label: difficulty, sublabel: 'Difficulty' },
              { icon: Clock, label: `${rd.roomTime || 5} min`, sublabel: 'Time Limit' },
              { icon: Trophy, label: `${totalRounds} rounds`, sublabel: 'Rounds' },
            ].map(({ icon: Icon, label, sublabel }) => (
              <div key={sublabel} style={{ textAlign: 'center' }}>
                <Icon size={18} style={{ color: ac, marginBottom: 6 }} />
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 16, color: 'white' }}>{label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>{sublabel}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Podium / Scoreboard */}
        <div style={{
          ...cardStyle,
          marginBottom: 28,
          opacity: animated ? 1 : 0,
          transform: animated ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 16, color: ac, marginBottom: 20, letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} /> FINAL STANDINGS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedPlayers.map((player, rank) => {
              const playerScore = scores[player.userId] || 0;
              const isMe = player.userId === myUserId;
              const isWinner = rank === 0 && !isDraw;
              const playerColor = PLAYER_COLORS[rank % PLAYER_COLORS.length];

              return (
                <div key={player.userId} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 20px', borderRadius: 14,
                  background: isMe ? `${ac}08` : 'rgba(255,255,255,0.02)',
                  border: `1.5px solid ${isWinner ? playerColor + '50' : isMe ? ac + '25' : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isWinner ? `0 0 24px ${playerColor}15` : 'none',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: rank === 0 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : rank === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' : rank === 2 ? 'linear-gradient(135deg, #cd7c32, #d4975a)' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18,
                    color: rank < 3 ? '#000' : 'rgba(255,255,255,0.7)',
                    boxShadow: rank === 0 ? '0 0 16px rgba(245,158,11,0.5)' : 'none',
                  }}>
                    {rank + 1}
                  </div>

                  {/* Player info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 18, color: isMe ? ac : 'white' }}>
                        {player.username} {isMe && '(YOU)'}
                      </span>
                      {isWinner && <span style={{ fontSize: 18 }}>👑</span>}
                      {isDraw && rank === 0 && <span style={{ fontSize: 16, fontWeight: 700 }}>🤝</span>}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      {player.finished ? '✅ Submitted successfully' : '⏳ Did not submit'}
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 36, color: playerColor, lineHeight: 1 }}>
                      {playerScore}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>ROUNDS WON</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center',
          opacity: animated ? 1 : 0,
          transform: animated ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s 0.4s ease',
        }}>
          <button onClick={() => navigate('/custom-mode')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${ac}, ${ui})`,
            color: '#001a20', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
            fontSize: 15, letterSpacing: 3, textTransform: 'uppercase',
            cursor: 'pointer', boxShadow: `0 8px 32px ${ac}40`,
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <RotateCcw size={16} /> PLAY AGAIN
          </button>

          <button onClick={() => navigate('/dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 12, border: `1.5px solid ${ac}30`,
            background: `${ac}08`, color: ac,
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
            fontSize: 15, letterSpacing: 3, textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${ac}18`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${ac}08`; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Home size={16} /> DASHBOARD
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default CustomModeResultsPage;
