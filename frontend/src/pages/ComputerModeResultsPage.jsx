import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Repeat, Home, Clock, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';

const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', bg: '#0d0305' },
  blue:   { accent: '#0099ff', ui: '#00ccff', bg: '#020810' },
  green:  { accent: '#00ff88', ui: '#00ff99', bg: '#020d07' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#06020d' },
};

const BOT_CONFIGS = {
  'Beginner Bot':        { image: '/assets/BEGINNER-BOT-BG.png', color: '#10b981', tag: 'BOT-1'  },
  'Lazy Compiler':       { image: '/assets/LAZY-COMPILER-BG.png', color: '#f59e0b', tag: 'BOT-2'  },
  'Logic Bot':           { image: '/assets/LOGIC-BOT-BG.png', color: '#3b82f6', tag: 'BOT-6'  },
  'Flash Coder':         { image: '/assets/FLASH-CODER-BG.png', color: '#8b5cf6', tag: 'BOT-7'  },
  'Test Case Destroyer': { image: '/assets/TEST-CASE-DESTROYER-BG.png', color: '#ef4444', tag: 'BOT-15' },
};

const fmtMs = ms => {
  const total = Math.max(0, ms);
  const mins  = Math.floor(total / 60000);
  const secs  = Math.floor((total % 60000) / 1000);
  const ms2   = Math.floor((total % 1000) / 10);
  return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(ms2).padStart(2,'0')}`;
};
const fmtSec = s => {
  const t = Math.max(0, Math.round(s));
  return `${Math.floor(t/60)}m ${t%60}s`;
};

/* Confetti particle */
const Particle = ({ color, x, delay, size, id }) => (
  <div style={{
    position: 'fixed', left: `${x}%`, bottom: '-20px',
    width: size, height: size,
    background: color, borderRadius: id % 2 === 0 ? '50%' : '2px',
    animation: `particleFloat 4s ${delay}s ease-in infinite`,
    opacity: 0.7, pointerEvents: 'none', zIndex: 1,
  }} />
);

const ComputerModeResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state || {};

  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

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

  const profileImage = localStorage.getItem('profileImage') || null;
  const username     = localStorage.getItem('username') || 'YOU';

  const winner       = data.winner || 'player';
  const scores       = data.scores || { player: 1, ai: 0 };
  const players      = data.players || [];
  const botsUsed     = data.botsUsed || [];
  const timeUsed     = data.timeUsed || 0;
  const totalRounds  = data.totalRounds || 1;
  const language     = data.language || 'JavaScript';
  const difficulty   = data.difficulty || 'Moderate';
  const playerMode   = data.playerMode || 1;
  const playerResults = data.playerResults || [];

  const playerWon     = winner === 'player';
  const competitorWon = winner === 'competitor';
  const isDraw        = winner === 'draw';
  const aiWon         = winner === 'ai';

  const heading      = playerWon ? 'VICTORY!' : competitorWon ? 'TEAM WIN!' : isDraw ? "IT'S A TIE" : 'DEFEATED';
  const headingColor = playerWon ? '#10b981' : competitorWon ? '#a855f7' : isDraw ? '#f59e0b' : '#ef4444';
  const bigEmoji     = playerWon ? '🏆' : competitorWon ? '👾' : isDraw ? '🤝' : '💀';
  const subText      = playerWon
    ? 'You passed the challenge requirements before the simulated bot opponents. The System declares you WINNER!'
    : competitorWon
    ? 'Your teammate passed the challenge requirements before the simulated bot opponents. Outstanding team performance!'
    : isDraw
    ? 'You and the simulated bot opponents finished together. An honorable result!'
    : 'The simulated bot opponents completed the challenge first. Train harder and return!';

  const particleColors = ['#a855f7','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];
  const particles = Array.from({ length: (playerWon||isDraw) ? 40 : 0 }, (_,i) => ({
    id: i, x: Math.random()*100, delay: Math.random()*3,
    color: particleColors[Math.floor(Math.random()*particleColors.length)],
    size: Math.random()*8+4,
  }));

  const [displayPlayer, setDisplayPlayer] = useState(0);
  const [displayAi, setDisplayAi]         = useState(0);
  const [phase, setPhase]                 = useState(0);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    let scoreInterval;
    const t2 = setTimeout(() => {
      let p = 0, a = 0;
      scoreInterval = setInterval(() => {
        if (p < scores.player) { p++; setDisplayPlayer(p); }
        if (a < scores.ai)     { a++; setDisplayAi(a); }
        if (p >= scores.player && a >= scores.ai) clearInterval(scoreInterval);
      }, 160);
    }, 700);
    const t3 = setTimeout(() => setPhase(2), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearInterval(scoreInterval); };
  }, [scores.ai, scores.player]);

  const showFade = (delay = 0) => ({
    opacity: phase >= 2 ? 1 : 0,
    transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.6s ease ${delay}s`,
  });

  const card = {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '20px 24px',
  };

  // Derive per-player outcome text
  const getOutcomeLabel = (outcome) => {
    if (outcome === 'player_wins') return { text: 'BEAT THE BOT', color: '#10b981', icon: '✅' };
    if (outcome === 'bot_wins')    return { text: 'LOST TO BOT',  color: '#ef4444', icon: '❌' };
    return { text: 'TIE',    color: '#f59e0b', icon: '🤝' };
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, color: 'white', position: 'relative', overflow: 'hidden' }}>
      <CustomCursor theme={{ accent: ac, ui }} />
      <Navbar currentPage="computer-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={themes} currentTheme={{ accent: ac, ui }} />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 1000, height: 600,
        background: `radial-gradient(ellipse, ${headingColor}15 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, transition: 'all 1s',
      }} />

      {/* Particles */}
      {particles.map(p => <Particle key={p.id} {...p} />)}

      {/* System judge strip */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0,
        background: `linear-gradient(90deg, transparent, ${headingColor}15, transparent)`,
        borderBottom: `1px solid ${headingColor}25`,
        padding: '6px 20px', textAlign: 'center', zIndex: 10,
        fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 3,
        color: headingColor, textTransform: 'uppercase',
        animation: 'pulse 2s infinite',
      }}>
        ⚡ SYSTEM VERDICT DELIVERED — MATCH RECORDED ⚡
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto', padding: '100px 20px 60px' }}>

        {/* ══ MAIN RESULT CARD ══ */}
        <div style={{
          background: playerWon||competitorWon ? 'linear-gradient(160deg, rgba(16,185,129,0.1), rgba(0,0,0,0))'
            : isDraw ? 'linear-gradient(160deg, rgba(245,158,11,0.08), rgba(0,0,0,0))'
            : 'linear-gradient(160deg, rgba(239,68,68,0.1), rgba(0,0,0,0))',
          border: `2px solid ${headingColor}30`,
          borderRadius: 28, padding: '44px 36px', textAlign: 'center', marginBottom: 28,
          opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 80px ${headingColor}12, 0 40px 80px rgba(0,0,0,0.5)`,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '6px 20px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase', letterSpacing: 3,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
            SYSTEM JUDGE · VERDICT CONFIRMED
          </div>

          <div style={{ fontSize: 90, marginBottom: 12, animation: phase >= 1 ? 'bounceIn 0.7s ease 0.2s both' : 'none' }}>
            {bigEmoji}
          </div>

          <h1 style={{
            margin: '0 0 14px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
            fontSize: 'clamp(48px, 8vw, 72px)', textTransform: 'uppercase', letterSpacing: 5,
            color: headingColor, textShadow: `0 0 50px ${headingColor}70`,
            animation: phase >= 1 ? 'slideUp 0.5s ease 0.4s both' : 'none',
          }}>
            {heading}
          </h1>

          <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.45)', margin: '0 auto 20px', maxWidth: 500, lineHeight: 1.7 }}>
            {subText}
          </p>

          <div style={{ minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            MATCH RESULT: LOCAL ONLY · PROFILE REWARDS REQUIRE SERVER VERIFICATION
          </div>

          {/* Match metadata chips */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { icon: '💻', label: language },
              { icon: '🎯', label: difficulty },
              { icon: '🔄', label: `${totalRounds} round${totalRounds > 1 ? 's' : ''}` },
              { icon: '⚔️', label: `${playerMode}P vs ${playerMode} AI` },
              { icon: '⏱️', label: typeof timeUsed === 'number' && timeUsed > 1000 ? fmtMs(timeUsed) : fmtSec(timeUsed/1000||0) },
            ].map(({ icon, label }) => (
              <span key={label} style={{
                padding: '5px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)',
              }}>
                {icon} {label}
              </span>
            ))}
          </div>
        </div>

        {/* ══ SCORE BREAKDOWN ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 16, marginBottom: 24, ...showFade(0) }}>
          {/* Player */}
          <div style={{
            ...card, textAlign: 'center',
            boxShadow: playerWon ? `0 0 40px ${ac}20` : 'none',
            border: `1px solid ${playerWon ? ac+'40' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <div style={{ marginBottom: 12 }}>
              {profileImage
                ? <img src={profileImage} alt="You" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${playerWon?'#10b981':ac+'50'}`, margin: '0 auto' }} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${ac}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 20, color: ac, border: `3px solid 90` }}>{username[0]}</div>
              }
            </div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{username}</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 80, color: ac, lineHeight: 1, textShadow: `0 0 40px 90` }}>{displayPlayer}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>rounds won</div>
            {playerWon && (
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                🏆 CHAMPION
              </div>
            )}
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 24, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>VS</div>
            <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.15)', textAlign: 'center', letterSpacing: 1 }}>SYSTEM<br/>JUDGED</div>
          </div>

          {/* AI */}
          <div style={{
            ...card, textAlign: 'center',
            boxShadow: aiWon ? '0 0 40px rgba(239,68,68,0.2)' : 'none',
            border: `1px solid ${aiWon ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <div style={{ marginBottom: 12 }}>
              {botsUsed[0] && BOT_CONFIGS[botsUsed[0].name]?.image
                ? <img src={BOT_CONFIGS[botsUsed[0].name].image} alt="AI" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${aiWon?'#ef4444':'rgba(255,255,255,0.15)'}`, margin: '0 auto', background: '#111' }} />
                : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 24, border: '3px solid rgba(239,68,68,0.3)' }}>🤖</div>
              }
            </div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>AI BOTS</div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 80, color: '#f97316', lineHeight: 1, textShadow: '0 0 40px rgba(249,115,22,0.5)' }}>{displayAi}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>rounds won</div>
            {aiWon && (
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: '#ef4444' }}>
                💀 DOMINANT
              </div>
            )}
          </div>
        </div>

        {/* ══ PER-PLAYER vs PER-BOT RESULTS (multiplayer) ══ */}
        {playerMode > 1 && playerResults.length > 0 && (
          <div style={{ ...card, marginBottom: 24, ...showFade(0.05) }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              ⚔️ PLAYER vs BOT RESULTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {playerResults.map((pr, i) => {
                const bot = botsUsed[i];
                const botCfg = bot ? (BOT_CONFIGS[bot.name] || { color: '#6b7280', tag: '?' }) : null;
                const ol = getOutcomeLabel(pr.outcome);
                const isMe = pr.username === username;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 12,
                    background: isMe ? `${ac}08` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isMe ? ac+'30' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    {/* Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 160, flexShrink: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${ac}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: ac, border: `2px solid 90` }}>
                        {pr.username[0]}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: isMe ? ac : 'white' }}>
                          {pr.username} {isMe && <span style={{ fontSize: 16, fontWeight: 700, opacity: 0.6 }}>(YOU)</span>}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                          Player {i + 1}
                        </div>
                      </div>
                    </div>

                    {/* vs */}
                    <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>vs</div>

                    {/* Bot */}
                    {bot && botCfg && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        {BOT_CONFIGS[bot.name]?.image && (
                          <img src={BOT_CONFIGS[bot.name].image} alt={bot.name} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${botCfg.color}`, objectFit: 'cover', background: '#111' }} />
                        )}
                        <div>
                          <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: botCfg.color }}>{bot.name}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, padding: '0 5px', borderRadius: 3, background: `${botCfg.color}20`, color: botCfg.color, display: 'inline-block' }}>{botCfg.tag}</div>
                        </div>
                      </div>
                    )}

                    {/* Outcome badge */}
                    <div style={{
                      padding: '6px 14px', borderRadius: 20, flexShrink: 0,
                      background: `${ol.color}15`, border: `1px solid ${ol.color}40`,
                      fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700,
                      color: ol.color, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {ol.icon} {ol.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ MULTIPLAYER LEADERBOARD ══ */}
        {players.length > 1 && (
          <div style={{ ...card, marginBottom: 24, ...showFade(0.1) }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              🏆 PLAYER LEADERBOARD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...players].sort((a,b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (a.timeUsed||Infinity) - (b.timeUsed||Infinity); // tie-break by time
              }).map((p, i) => {
                const isMe = p.username === username;
                const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
                return (
                  <div key={p.userId||i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', borderRadius: 10,
                    background: isMe ? `${ac}10` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isMe ? ac+'35' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18 }}>{medal}</span>
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: isMe ? ac : 'white' }}>
                        {p.username} {isMe ? '(YOU)' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.timeUsed ? (
                        <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                          ⏱ {fmtSec(p.timeUsed)}
                        </span>
                      ) : null}
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18, color: isMe ? ac : 'rgba(255,255,255,0.7)' }}>
                        {p.score} {p.score===1?'round':'rounds'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              * Ties broken by time — fastest submission wins
            </div>
          </div>
        )}

        {/* ══ BOT PERFORMANCE ══ */}
        {botsUsed.length > 0 && (
          <div style={{ ...card, marginBottom: 24, ...showFade(0.2) }}>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              ⚡ AI BOT PERFORMANCE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {botsUsed.map((bot, i) => {
                const cfg = BOT_CONFIGS[bot.name] || { color: '#6b7280', image: null, tag: '?' };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: `${cfg.color}06`, border: `1px solid ${cfg.color}20` }}>
                    {cfg.image && <img src={cfg.image} alt={bot.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${cfg.color}40`, background: '#111', flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: cfg.color }}>{bot.name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 15,  padding: '1px 6px', borderRadius: 3, background: `${cfg.color}20`, color: cfg.color, fontWeight: 700 }}>{cfg.tag}</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${bot.progress||0}%`, background: cfg.color, borderRadius: 2, boxShadow: `0 0 6px ${cfg.color}60`, transition: 'width 1.5s ease' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 16, color: cfg.color }}>{Math.round(bot.progress||0)}%</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: bot.finished ? '#ef4444' : '#10b981' }}>
                        {bot.finished ? '🏁 FINISHED' : '✓ Competed'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ROUND BREAKDOWN (collapsible) ══ */}
        {totalRounds > 1 && (
          <div style={{ ...card, marginBottom: 24, ...showFade(0.25) }}>
            <button
              onClick={() => setBreakdownOpen(v => !v)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2 }}>
                📊 ROUND-BY-ROUND BREAKDOWN
              </div>
              {breakdownOpen
                ? <ChevronUp size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                : <ChevronDown size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
              }
            </button>

            {breakdownOpen && (
              <div style={{ marginTop: 16 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'left', padding: '6px 10px' }}>Round</th>
                        <th style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'left', padding: '6px 10px' }}>Participant</th>
                        <th style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'left', padding: '6px 10px' }}>Opponent</th>
                        <th style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', padding: '6px 10px' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: totalRounds }, (_, rIdx) => (
                        playerMode === 1 ? (
                          <tr key={rIdx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ fontFamily: 'monospace', fontSize: 15,  color: ac, padding: '8px 10px', fontWeight: 700 }}>Round {rIdx + 1}</td>
                            <td style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: 'white', padding: '8px 10px' }}>{username}</td>
                            <td style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: BOT_CONFIGS[botsUsed[0]?.name]?.color || '#f97316', padding: '8px 10px' }}>
                              {botsUsed[0]?.name || 'Bot'}
                            </td>
                            <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 20, fontSize: 15,
                                fontFamily: 'monospace', fontWeight: 700,
                                background: rIdx === 0 && playerWon ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                color: rIdx === 0 && playerWon ? '#10b981' : '#ef4444',
                              }}>
                                {rIdx < 1 ? (playerWon ? '✅ WIN' : '❌ LOSS') : '—'}
                              </span>
                            </td>
                          </tr>
                        ) : (
                          players.map((p, pIdx) => (
                            <tr key={`${rIdx}-${pIdx}`} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ fontFamily: 'monospace', fontSize: 15,  color: ac, padding: '8px 10px', fontWeight: 700 }}>{pIdx === 0 ? `Round ${rIdx + 1}` : ''}</td>
                              <td style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: p.username === username ? ac : 'white', padding: '8px 10px' }}>
                                {p.username} {p.username === username ? '(YOU)' : ''}
                              </td>
                              <td style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700, color: BOT_CONFIGS[botsUsed[pIdx]?.name]?.color || '#f97316', padding: '8px 10px' }}>
                                {botsUsed[pIdx]?.name || `Bot ${pIdx + 1}`}
                              </td>
                              <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                                <span style={{
                                  padding: '3px 10px', borderRadius: 20, fontSize: 16,
                                  fontFamily: 'monospace', fontWeight: 700,
                                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
                                }}>
                                  —
                                </span>
                              </td>
                            </tr>
                          ))
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 10, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                  Detailed per-round data requires multi-round support from the server session.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ STATS GRID ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36, ...showFade(0.3) }}>
          {[
            { icon: Clock,  label: 'Time Used', value: typeof timeUsed==='number'&&timeUsed>1000?fmtMs(timeUsed):fmtSec(timeUsed/1000||0), color: ac },
            { icon: Target, label: 'Language',  value: language,   color: '#10b981' },
            { icon: Zap,    label: 'Difficulty', value: difficulty, color: '#f59e0b' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ ...card, textAlign: 'center' }}>
              <Icon size={20} style={{ color, marginBottom: 8 }} />
              <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* ══ ACTION BUTTONS ══ */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', ...showFade(0.4) }}>
          <button onClick={() => navigate('/computer-mode/create-room')} style={{
            padding: '16px 40px', borderRadius: 14, border: 'none',
            background: `linear-gradient(135deg, ${ac}, ${ui})`,
            color: 'white', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 900, fontSize: 17, letterSpacing: 3, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: `0 8px 40px 90`, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            <Repeat size={18} /> PLAY AGAIN
          </button>

          <button onClick={() => navigate('/computer-mode')} style={{
            padding: '16px 36px', borderRadius: 14,
            border: '1.5px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 17,
            letterSpacing: 3, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
            <Home size={18} /> MAIN MENU
          </button>

          <button onClick={() => navigate('/profile')} style={{
            padding: '16px 32px', borderRadius: 14,
            border: '1.5px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15,
            letterSpacing: 2, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = ac; e.currentTarget.style.borderColor = ac+'40'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
            VIEW PROFILE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes particleFloat {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(-110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounceIn {
          0%  { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.15); }
          100%{ transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default ComputerModeResultsPage;
