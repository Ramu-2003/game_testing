import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cpu, RefreshCw, AlertTriangle, CheckCircle2, Zap, Rocket, ChevronRight } from 'lucide-react';
import { PremiumIcon } from '../components/landing/PremiumIcon';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';

const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', bg: '#0d0305' },
  blue:   { accent: '#0099ff', ui: '#00ccff', bg: '#020810' },
  green:  { accent: '#00ff88', ui: '#00ff99', bg: '#020d07' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#06020d' },
};

const BOTS = [
  {
    name: 'Beginner Bot', iconName: 'Bot', image: '/assets/BEGINNER-BOT-BG.png',
    tag: 'BOT-1', tagColor: '#10b981', color: '#10b981',
    personality: 'Steady & predictable — great for learning',
    speed: 25, accuracy: 85, winRate: '30%',
    completesAt: 'Last 3–15s before end',
  },
  {
    name: 'Lazy Compiler', iconName: 'Moon', image: '/assets/LAZY-COMPILER-BG.png',
    tag: 'BOT-2', tagColor: '#f59e0b', color: '#f59e0b',
    personality: 'Inconsistent & procrastinates — unpredictable',
    speed: 15, accuracy: 70, winRate: '25%',
    completesAt: 'Last 4–16s before end',
  },
  {
    name: 'Logic Bot', iconName: 'Brain', image: '/assets/LOGIC-BOT-BG.png',
    tag: 'BOT-6', tagColor: '#3b82f6', color: '#3b82f6',
    personality: 'Methodical & efficient — follows patterns',
    speed: 60, accuracy: 92, winRate: '60%',
    completesAt: 'Last 5–17s before end',
  },
  {
    name: 'Flash Coder', iconName: 'Zap', image: '/assets/FLASH-CODER-BG.png',
    tag: 'BOT-7', tagColor: '#8b5cf6', color: '#8b5cf6',
    personality: 'Lightning fast — uses shortcuts & macros',
    speed: 85, accuracy: 88, winRate: '72%',
    completesAt: 'Last 6–18s before end',
  },
  {
    name: 'Test Case Destroyer', iconName: 'Skull', image: '/assets/TEST-CASE-DESTROYER-BG.png',
    tag: 'BOT-15', tagColor: '#ef4444', color: '#ef4444',
    personality: 'Near-perfect — handles every edge case',
    speed: 97, accuracy: 99, winRate: '88%',
    completesAt: 'Last 10–30s before end',
  },
];

const LANGUAGES = [
  { value: 'HTML',       iconName: 'HTML', color: '#e34c26' },
  { value: 'CSS',        iconName: 'CSS', color: '#1572b6' },
  { value: 'JavaScript', iconName: 'JavaScript', color: '#f7df1e' },
  { value: 'Python',     iconName: 'Python', color: '#3776ab' },
  { value: 'Java',       iconName: 'Java', color: '#007396' },
];

const PLAYER_MODES = [
  { value: 1, iconName: '1P', label: 'SOLO',  sub: '1 Human vs 1 Bot' },
  { value: 2, iconName: '2P', label: '2P',    sub: '2 Humans vs 2 Bots' },
  { value: 3, iconName: '3P', label: '3P',    sub: '3 Humans vs 3 Bots' },
  { value: 4, iconName: '4P', label: '4P',    sub: '4 Humans vs 4 Bots' },
];

const TIME_OPTIONS = [3, 4, 5, 6, 7, 8];
const ROUND_OPTIONS = [1, 2, 3, 4, 5];

// Auto-detect difficulty from time limit
function getDifficultyFromTime(timeLimit) {
  if (timeLimit <= 4) return { value: 'Beginner', tests: 3, color: '#10b981', iconName: 'Beginner', label: 'BEGINNER MODE' };
  if (timeLimit <= 6) return { value: 'Moderate', tests: 4, color: '#f59e0b', iconName: 'Moderate', label: 'MODERATE MODE' };
  return { value: 'Advanced', tests: 5, color: '#ef4444', iconName: 'Advanced', label: 'ADVANCED MODE' };
}

/* Section wrapper */
const Section = ({ title, subtitle, children, ac }) => (
  <div style={{
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '18px 20px',
  }}>
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ac || '#a855f7' }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: 'white' }}>{title}</div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', paddingLeft: 11 }}>{subtitle}</div>
    </div>
    {children}
  </div>
);

/* Pill selector */
const PillSel = ({ options, value, onChange, color }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {options.map(opt => {
      const isSelected = opt === value;
      return (
        <div key={opt} onClick={() => onChange(opt)} style={{
          padding: '8px 20px', borderRadius: 100,
          border: `1.5px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
          background: isSelected ? `${color}18` : 'rgba(255,255,255,0.02)',
          color: isSelected ? color : 'rgba(255,255,255,0.8)',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 16,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isSelected ? `0 0 16px ${color}25` : 'none',
        }}>
          {opt}
        </div>
      );
    })}
  </div>
);

/* Mini progress bar */
const MiniBar = ({ label, value, color }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color }}>{value}%</span>
    </div>
    <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 2, transition: 'width 0.5s' }} />
    </div>
  </div>
);

const ComputerModeRoomCreationPage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  const safeTheme = THEMES[themeKey] || THEMES.purple;
  const ac = safeTheme.accent;
  const ui = safeTheme.ui;
  const pageBg = safeTheme.bg;
  const themes = {
    red: { accent: '#ff5252', ui: '#ff6b6b' },
    blue: { accent: '#0099ff', ui: '#00ccff' },
    green: { accent: '#00ff88', ui: '#00ff99' },
    purple: { accent: '#a855f7', ui: '#d8b4fe' },
  };

  const [config, setConfig] = useState({
    playerMode: 1,
    rounds: 3,
    timeLimit: 5,
    language: 'JavaScript',
    botMode: 'select',
    playerBots: [BOTS[2].name, BOTS[0].name, BOTS[3].name, BOTS[4].name],
  });

  const [isCreating, setIsCreating] = useState(false);
  const [activeBotSlot, setActiveBotSlot] = useState(0);

  const update = (key, val) => setConfig(p => ({ ...p, [key]: val }));

  const diffInfo = getDifficultyFromTime(config.timeLimit);

  const assignBot = (slotIndex, botName) => {
    const updated = [...config.playerBots];
    updated[slotIndex] = botName;
    setConfig(p => ({ ...p, playerBots: updated }));
  };

  const randomizeAllBots = () => {
    const shuffled = [...BOTS].sort(() => Math.random() - 0.5);
    const assigned = Array.from({ length: config.playerMode }, (_, i) => shuffled[i % shuffled.length].name);
    setConfig(p => ({ ...p, playerBots: assigned }));
  };

  const selStyle = (isSelected, color) => ({
    border: `1.5px solid ${isSelected ? color : 'rgba(255,255,255,0.07)'}`,
    background: isSelected ? `${color}12` : 'rgba(255,255,255,0.02)',
    boxShadow: isSelected ? `0 0 20px ${color}20` : 'none',
    cursor: 'pointer', borderRadius: 12, transition: 'all 0.2s',
  });

  const handleEnterArena = () => {
    setIsCreating(true);
    const roomId = 'ROOM-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const roomPassword = Math.random().toString(36).substr(2, 6).toUpperCase();

    const selectedBots = config.botMode === 'random'
      ? (() => {
          const shuffled = [...BOTS].sort(() => Math.random() - 0.5);
          return Array.from({ length: config.playerMode }, (_, i) => BOTS.find(b => b.name === shuffled[i % shuffled.length].name));
        })()
      : Array.from({ length: config.playerMode }, (_, i) => BOTS.find(b => b.name === config.playerBots[i]) || BOTS[i % BOTS.length]);

    setTimeout(() => {
      navigate('/computer-mode/lobby', {
        state: {
          roomId, roomPassword,
          playerMode: config.playerMode,
          rounds: config.rounds,
          roomTime: config.timeLimit,
          language: config.language,
          difficulty: diffInfo.value,
          botMode: config.botMode,
          playerBots: selectedBots,
          bot: selectedBots[0],
          isHost: true,
        },
      });
      setIsCreating(false);
    }, 900);
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, color: 'white' }}>
      <CustomCursor theme={{ accent: ac, ui }} />
      <Navbar currentPage="computer-mode" themeKey={themeKey} setThemeKey={setThemeKey} themes={themes} currentTheme={{ accent: ac, ui }} />

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400,
        background: `radial-gradient(ellipse, ${ac}15 0%, transparent 70%)`,
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <button onClick={() => navigate('/computer-mode')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: `1.5px solid ${ac}80`, background: `${ac}10`,
            color: ac, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
             fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${ac}25`}
          onMouseLeave={e => e.currentTarget.style.background = `${ac}10`}
          >
            <ChevronLeft size={16} /> BACK
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 4, color: ac, textTransform: 'uppercase', marginBottom: 4 }}>
              CONFIGURE YOUR BATTLE
            </div>
            <h1 style={{
              margin: 0, fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 40,
              textTransform: 'uppercase', letterSpacing: 4,
              backgroundImage: `linear-gradient(135deg, white 30%, ${ac} 70%, ${ui})`,
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              color: 'transparent', WebkitTextFillColor: 'transparent',
            }}>
              ROOM SETTINGS
            </h1>
          </div>
          <div style={{ width: 90 }} />
        </div>

        {/* Main 3-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 20 }}>

          {/* ══ LEFT COLUMN ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Player Mode */}
            <Section title={<><PremiumIcon name="Swords" size={16} color={ac} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Battle Mode</span></>} subtitle="How many humans and bots will clash" ac={ac}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {PLAYER_MODES.map(m => (
                  <div key={m.value} onClick={() => { update('playerMode', m.value); setActiveBotSlot(0); }}
                    style={{ ...selStyle(config.playerMode === m.value, ac), padding: '14px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}><PremiumIcon name={m.iconName} size={32} color={config.playerMode === m.value ? ac : 'rgba(255,255,255,0.7)'} /></div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15,
                      color: config.playerMode === m.value ? ac : 'rgba(255,255,255,0.7)' }}>{m.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{m.sub}</div>
                    {config.playerMode === m.value && <CheckCircle2 size={13} style={{ color: ac, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
            </Section>

            {/* Rounds */}
            <Section title={<><PremiumIcon name="Rounds" size={16} color={ac} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Rounds</span></>} subtitle="Number of rounds — best of the chosen rounds wins" ac={ac}>
              <PillSel options={ROUND_OPTIONS} value={config.rounds} onChange={v => update('rounds', v)} color={ac} />
            </Section>

            {/* Time Limit — auto-sets difficulty */}
            <Section title={<><PremiumIcon name="Time" size={16} color={ac} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Time Limit</span></>} subtitle="Minutes per round — automatically sets difficulty & test cases" ac={ac}>
              <PillSel options={TIME_OPTIONS} value={config.timeLimit} onChange={v => update('timeLimit', v)} color={ac} />

              {/* Auto-detected mode badge */}
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 10,
                background: `${diffInfo.color}12`, border: `1.5px solid ${diffInfo.color}35`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}><PremiumIcon name={diffInfo.iconName} size={28} color={diffInfo.color} /></div>
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 16, color: diffInfo.color, letterSpacing: 2 }}>
                    {diffInfo.label} ACTIVATED
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {config.timeLimit} min → {diffInfo.tests} test cases per challenge
                  </div>
                </div>
                <div style={{
                  marginLeft: 'auto', padding: '4px 12px', borderRadius: 20,
                  background: `${diffInfo.color}20`, border: `1px solid ${diffInfo.color}40`,
                  fontFamily: 'monospace', fontSize: 15,  color: diffInfo.color, fontWeight: 700,
                }}>
                  {diffInfo.tests} TESTS
                </div>
              </div>

              <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                3–4 min → Beginner Mode · 5–6 min → Moderate Mode · 7–8 min → Advanced Mode
              </div>
            </Section>

            {/* Language */}
            <Section title={<><PremiumIcon name="Language" size={16} color={ac} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Language</span></>} subtitle="Programming language for the coding challenge" ac={ac}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                {LANGUAGES.map(l => {
                  const isSel = config.language === l.value;
                  return (
                    <div key={l.value} onClick={() => update('language', l.value)}
                      style={{ ...selStyle(isSel, l.color), padding: '12px 4px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, marginBottom: 4, filter: isSel ? `drop-shadow(0 0 10px ${l.color}80)` : 'none', opacity: isSel ? 1 : 0.4, transition: 'all 0.3s' }}>
                        <PremiumIcon name={l.iconName} size={32} />
                      </div>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700,
                        color: isSel ? l.color : 'rgba(255,255,255,0.8)' }}>{l.value}</div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* ══ CENTER COLUMN — Bot Assignment ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Bot Mode Toggle */}
            <Section title={<><PremiumIcon name="Bot" size={16} color={ac} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>AI Bot Selection</span></>} subtitle="Choose bots manually or let System assign randomly" ac={ac}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                {[
                  { val: 'select', label: '🎮 SELECT', desc: 'Choose per player' },
                  { val: 'random', label: '🎲 RANDOM', desc: 'System decides' },
                ].map(opt => (
                  <div key={opt.val} onClick={() => { update('botMode', opt.val); if (opt.val === 'random') randomizeAllBots(); }}
                    style={{
                      ...selStyle(config.botMode === opt.val, ac),
                      flex: 1, padding: '12px', textAlign: 'center',
                    }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700,
                      color: config.botMode === opt.val ? ac : 'rgba(255,255,255,0.6)' }}>{opt.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                ))}
              </div>

              {/* Player slot tabs for multi-player */}
              {config.botMode === 'select' && config.playerMode > 1 && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
                  {Array.from({ length: config.playerMode }, (_, i) => (
                    <button key={i} onClick={() => setActiveBotSlot(i)} style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none',
                      background: activeBotSlot === i ? ac : 'rgba(255,255,255,0.05)',
                      color: activeBotSlot === i ? 'white' : 'rgba(255,255,255,0.7)',
                      fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                    }}>
                      Player {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Bot picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BOTS.map(bot => {
                  const isSelectedForSlot = config.playerBots[activeBotSlot] === bot.name;
                  const assignedToSlots = Array.from({ length: config.playerMode }, (_, i) => i)
                    .filter(i => config.playerBots[i] === bot.name && i !== activeBotSlot);

                  return (
                    <div key={bot.name}
                      onClick={() => config.botMode === 'select' && assignBot(activeBotSlot, bot.name)}
                      style={{
                        ...selStyle(isSelectedForSlot, bot.color),
                        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                        opacity: config.botMode === 'random' ? 0.6 : 1,
                        cursor: config.botMode === 'random' ? 'default' : 'pointer',
                      }}>
                      <img src={bot.image} alt={bot.name} style={{
                        width: 40, height: 40, borderRadius: '50%', objectFit: 'cover',
                        border: `2px solid ${bot.color}50`, background: '#111', flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700,
                            color: isSelectedForSlot ? bot.color : 'white' }}>{bot.name}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 15,  padding: '1px 6px',
                            borderRadius: 3, background: bot.tagColor + '25', color: bot.tagColor, fontWeight: 700 }}>{bot.tag}</span>
                          {assignedToSlots.length > 0 && (
                            <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                              also P{assignedToSlots.map(s => s + 1).join(',')}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <MiniBar label="Speed" value={bot.speed} color={bot.color} />
                          <MiniBar label="Acc" value={bot.accuracy} color={bot.color} />
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>
                          Submits: {bot.completesAt}
                        </div>
                      </div>
                      {isSelectedForSlot && <CheckCircle2 size={18} style={{ color: bot.color, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>

              {config.botMode === 'random' && (
                <button onClick={randomizeAllBots} style={{
                  marginTop: 10, width: '100%', padding: '10px', borderRadius: 8,
                  background: `${ac}15`, color: ac, cursor: 'pointer',
                  fontFamily: 'Rajdhani, sans-serif',  fontSize: 16, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  border: `1px solid 70`, transition: 'all 0.2s',
                }}>
                  <RefreshCw size={14} /> RE-RANDOMIZE
                </button>
              )}
            </Section>
          </div>

          {/* ══ RIGHT COLUMN — Summary + Enter ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Live Battle Summary Card */}
            <div style={{
              background: `linear-gradient(135deg, ${ac}10, ${ac}05)`,
              border: `1.5px solid 70`,
              borderRadius: 18, padding: '22px',
              position: 'sticky', top: 24,
            }}>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 16,
                color: ac, marginBottom: 18, letterSpacing: 2, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Cpu size={18} /> BATTLE SUMMARY
              </div>

              {/* Config grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Mode', value: `${config.playerMode}P Battle` },
                  { label: 'Rounds', value: `${config.rounds} rounds` },
                  { label: 'Time / Round', value: `${config.timeLimit} min` },
                  { label: 'Language', value: config.language },
                  { label: 'Difficulty', value: diffInfo.value },
                  { label: 'Test Cases', value: `${diffInfo.tests} tests` },
                  { label: 'Bot Selection', value: config.botMode === 'random' ? 'Random 🎲' : 'Manual 🎮' },
                  { label: 'Total Bots', value: `${config.playerMode} bot${config.playerMode > 1 ? 's' : ''}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)',
                      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: 'white' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Mode highlight */}
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: `${diffInfo.color}10`, border: `1px solid ${diffInfo.color}30`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}><PremiumIcon name={diffInfo.iconName} size={20} color={diffInfo.color} /></span>
                <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: diffInfo.color, letterSpacing: 1 }}>
                  {diffInfo.label}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginLeft: 'auto' }}>
                  {diffInfo.tests} test cases
                </span>
              </div>

              {/* Bot assignments */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                  textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Bot Assignments</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Array.from({ length: config.playerMode }, (_, i) => {
                    const botName = config.playerBots[i] || BOTS[0].name;
                    const bot = BOTS.find(b => b.name === botName) || BOTS[0];
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)', width: 60 }}>P{i + 1} vs</div>
                        <img src={bot.image} alt={bot.name} style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${bot.color}`, objectFit: 'cover', background: '#111' }} />
                        <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: bot.color }}>{bot.name}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: `${bot.color}20`, color: bot.color, marginLeft: 'auto' }}>{bot.tag}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multiplayer notice */}
              {config.playerMode > 1 && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                  background: `${ac}09`, border: `1px solid ${ac}25`,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <AlertTriangle size={13} style={{ color: ac, flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    Share <strong style={{ color: ac }}>Room ID + Password</strong> with your {config.playerMode - 1} teammate{config.playerMode > 2 ? 's' : ''} after creating the room.
                  </span>
                </div>
              )}

              {/* Reading time notice */}
              <div style={{
                padding: '8px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Zap size={12} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#10b981' }}>15s Reading Phase</strong> before timer starts — read the question carefully!
                </span>
              </div>

              {/* Enter Arena Button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 12px', marginBottom: 12, borderRadius: 9, background: `${ac}12`, border: `1px solid ${ac}35` }}>
                <Zap size={16} style={{ color: ac, flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
                  <strong style={{ color: ac }}>ROOM FEE: 1 G-THUNDER.</strong> The creator is charged when the room is created; joining is free. No refund if you leave or do not play.
                </div>
              </div>
              <button onClick={handleEnterArena} disabled={isCreating} style={{
                width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
                background: isCreating ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${ac}, ${ui})`,
                color: 'white', cursor: isCreating ? 'not-allowed' : 'pointer',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
                fontSize: 16, letterSpacing: 3, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: isCreating ? 'none' : `0 8px 32px 90`,
                transition: 'all 0.3s',
              }}>
                {isCreating ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.6)',
                      borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    CREATING ROOM...
                  </>
                ) : (
                  <>
                    <Rocket size={18} /> CREATE ROOM <ChevronRight size={18} />
                  </>
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

export default ComputerModeRoomCreationPage;
