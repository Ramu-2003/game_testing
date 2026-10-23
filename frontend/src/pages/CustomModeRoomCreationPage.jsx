import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Rocket, CheckCircle2, AlertTriangle, Zap, Crown } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { CustomCursor } from '../components/landing/CustomCursor';
import { PremiumIcon } from '../components/landing/PremiumIcon';


const THEMES = {
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#0b0e14', asteroid: '#c084fc' },
  blue:   { accent: '#3b82f6', ui: '#93c5fd', bg: '#0b1120', asteroid: '#60a5fa' },
  green:  { accent: '#10b981', ui: '#6ee7b7', bg: '#061411', asteroid: '#34d399' },
  red:    { accent: '#ef4444', ui: '#fca5a5', bg: '#1a0b0b', asteroid: '#f87171' },
};



/* ── Theme map (synced with rest of app) ─────────────────────────── */
const PLAYER_MODES = [
  { value: 2, iconName: '2P', label: '2P',  sub: '2 Humans battle' },
  { value: 3, iconName: '3P', label: '3P',  sub: '3 Humans battle' },
  { value: 4, iconName: '4P', label: '4P',  sub: '4 Humans battle' },
];

const TIME_OPTIONS = [3, 4, 5, 6, 7, 8];
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const LANGUAGES = [
  { value: 'HTML',       iconName: 'HTML', color: '#e34c26' },
  { value: 'CSS',        iconName: 'CSS', color: '#1572b6' },
  { value: 'JavaScript', iconName: 'JavaScript', color: '#f7df1e' },
  { value: 'Python',     iconName: 'Python', color: '#3776ab' },
  { value: 'Java',       iconName: 'Java', color: '#007396' },
];

function getDifficultyFromTime(t) {
  if (t <= 4) return { value: 'Beginner', tests: 3, color: '#10b981', iconName: 'Beginner', label: 'BEGINNER MODE' };
  if (t <= 6) return { value: 'Moderate', tests: 4, color: '#f59e0b', iconName: 'Moderate', label: 'MODERATE MODE' };
  return { value: 'Advanced', tests: 5, color: '#ef4444', iconName: 'Advanced', label: 'ADVANCED MODE' };
}

const Section = ({ title, subtitle, children, accent }) => (
  <div style={{
    background: `${accent}04`,
    border: `1px solid ${accent}18`,
    borderRadius: 16, padding: '18px 20px',
    transition: 'all 0.3s',
  }}>
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: accent }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 15, color: 'white' }}>{title}</div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', paddingLeft: 11 }}>{subtitle}</div>
    </div>
    {children}
  </div>
);

const PillSel = ({ options, value, onChange, accent }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {options.map(opt => {
      const isSelected = opt === value;
      return (
        <div key={opt} onClick={() => onChange(opt)} style={{
          padding: '8px 18px', borderRadius: 100,
          border: `1.5px solid ${isSelected ? accent : 'rgba(255,255,255,0.08)'}`,
          background: isSelected ? `${accent}18` : 'rgba(255,255,255,0.02)',
          color: isSelected ? accent : 'rgba(255,255,255,0.8)',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 16,
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isSelected ? `0 0 16px ${accent}25` : 'none',
        }}>
          {opt}
        </div>
      );
    })}
  </div>
);

const CustomModeRoomCreationPage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');

  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  /* Derive live theme colors from themeKey */

const theme = THEMES[themeKey] || THEMES.purple;
  const accent = theme.accent;
  const ui     = theme.ui;
  const bg     = theme.bg;

  const [config, setConfig] = useState({
    playerMode: 2,
    rounds: 3,
    timeLimit: 5,
    language: 'JavaScript',
  });

  const [isCreating, setIsCreating] = useState(false);

  const update = (key, val) => setConfig(p => ({ ...p, [key]: val }));
  const diffInfo = getDifficultyFromTime(config.timeLimit);

  const selStyle = (isSelected, color) => {
    const c = color || accent;
    return {
      border: `1.5px solid ${isSelected ? c : 'rgba(255,255,255,0.07)'}`,
      background: isSelected ? `${c}12` : 'rgba(255,255,255,0.02)',
      boxShadow: isSelected ? `0 0 20px ${c}20` : 'none',
      cursor: 'pointer', borderRadius: 12, transition: 'all 0.2s',
    };
  };

  const handleEnterArena = () => {
    setIsCreating(true);
    const roomId = 'CUST-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const roomPassword = Math.random().toString(36).substr(2, 6).toUpperCase();

    setTimeout(() => {
      navigate('/custom-mode/lobby', {
        state: {
          roomId,
          roomPassword,
          playerMode: config.playerMode,
          rounds: config.rounds,
          roomTime: config.timeLimit,
          language: config.language,
          difficulty: diffInfo.value,
          isHost: true,
          mode: 'custom',
        },
      });
      setIsCreating(false);
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: 'white', transition: 'background 0.4s ease' }}>
      <CustomCursor theme={theme} />
      <Navbar
        currentPage="custom-mode"
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        themes={THEMES}
        currentTheme={theme}
      />

      {/* Ambient glow — uses dynamic accent */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 500,
        background: `radial-gradient(ellipse, ${accent}12 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, transition: 'background 0.4s ease',
      }} />
      {/* Grid lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${accent}80 1px, transparent 1px), linear-gradient(90deg, ${accent}80 1px, transparent 1px)`,
        backgroundSize: '50px 50px', transition: 'background-image 0.4s ease',
      }} />
      {/* Corner glows */}
      <div style={{
        position: 'fixed', top: '20%', right: '-5%',
        width: 400, height: 400,
        background: `radial-gradient(circle, ${theme.asteroid}08 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, animation: 'floatSlow 14s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', left: '-5%',
        width: 350, height: 350,
        background: `radial-gradient(circle, ${accent}06 0%, transparent 65%)`,
        pointerEvents: 'none', zIndex: 0, animation: 'floatSlow 18s ease-in-out infinite reverse',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <button onClick={() => navigate('/custom-mode')} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 8, border: `1.5px solid ${accent}40`, background: `${accent}10`,
            color: accent, cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif',
             fontSize: 15, fontWeight: 700, transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${accent}20`}
          onMouseLeave={e => e.currentTarget.style.background = `${accent}10`}
          >
            <ChevronLeft size={16} /> BACK
          </button>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 4, color: accent, textTransform: 'uppercase', marginBottom: 4, transition: 'color 0.3s' }}>
              CONFIGURE YOUR HUMAN BATTLE
            </div>
            <h1 style={{
              margin: 0, fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 38,
              textTransform: 'uppercase', letterSpacing: 4,
              backgroundImage: `linear-gradient(135deg, white 30%, ${accent})`,
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              color: 'transparent', WebkitTextFillColor: 'transparent',
              transition: 'all 0.4s ease',
            }}>
              ROOM SETTINGS
            </h1>
          </div>
          <div style={{ width: 90 }} />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* LEFT — config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Player Mode */}
            <Section title={<><PremiumIcon name="2P" size={16} color={accent} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Player Mode</span></>} subtitle="Choose the number of human players — no solo, no bots!" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {PLAYER_MODES.map(m => (
                  <div key={m.value} onClick={() => update('playerMode', m.value)}
                    style={{ ...selStyle(config.playerMode === m.value), padding: '16px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 26, marginBottom: 6 }}><PremiumIcon name={m.iconName} size={32} color={config.playerMode === m.value ? accent : 'rgba(255,255,255,0.7)'} /></div>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18,
                      color: config.playerMode === m.value ? accent : 'rgba(255,255,255,0.7)' }}>{m.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{m.sub}</div>
                    {config.playerMode === m.value && <CheckCircle2 size={14} style={{ color: accent, marginTop: 5 }} />}
                  </div>
                ))}
              </div>
              {/* No-solo notice */}
              <div style={{
                marginTop: 12, padding: '8px 14px', borderRadius: 8,
                background: `${accent}08`, border: `1px solid ${accent}20`,
                fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${accent}80`,
              }}>
                ⚠️ Custom Mode is Human vs Human only — No AI bots involved!
              </div>
            </Section>

            {/* Time Limit */}
            <Section title={<><PremiumIcon name="Time" size={16} color={accent} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Time Limit</span></>} subtitle="Minutes per round — auto-detects difficulty" accent={accent}>
              <PillSel options={TIME_OPTIONS} value={config.timeLimit} onChange={v => update('timeLimit', v)} accent={accent} />
              {/* Difficulty badge */}
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 10,
                background: `${diffInfo.color}12`, border: `1.5px solid ${diffInfo.color}35`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}><PremiumIcon name={diffInfo.iconName} size={28} color={diffInfo.color} /></div>
                <div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 16, color: diffInfo.color, letterSpacing: 2 }}>{diffInfo.label} ACTIVATED</div>
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
                3–4 min → Beginner · 5–6 min → Moderate · 7–8 min → Advanced
              </div>
            </Section>

            {/* Rounds */}
            <Section title={<><PremiumIcon name="Rounds" size={16} color={accent} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Rounds</span></>} subtitle="Number of rounds (1–10) — best score wins" accent={accent}>
              <PillSel options={ROUND_OPTIONS} value={config.rounds} onChange={v => update('rounds', v)} accent={accent} />
            </Section>

            {/* Language */}
            <Section title={<><PremiumIcon name="Language" size={16} color={accent} style={{marginRight: 6, display: 'inline-block', verticalAlign: 'middle'}}/> <span style={{verticalAlign: 'middle'}}>Language</span></>} subtitle="Programming language for all coding challenges" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                {LANGUAGES.map(l => {
                    const isSel = config.language === l.value;
                    return (
                      <div key={l.value} onClick={() => update('language', l.value)}
                        style={{ ...selStyle(isSel, l.color), padding: '12px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 6, filter: isSel ? `drop-shadow(0 0 10px ${l.color}80)` : 'none', opacity: isSel ? 1 : 0.4, transition: 'all 0.3s' }}>
                          <PremiumIcon name={l.iconName} size={32} />
                        </div>
                        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 15,
                          color: isSel ? l.color : 'rgba(255,255,255,0.7)', transition: 'all 0.3s' }}>
                          {l.value}
                        </div>
                      </div>
                    );
                })}
              </div>
            </Section>
          </div>

          {/* RIGHT — Summary + CTA */}
          <div>
            <div style={{
              background: `linear-gradient(135deg, ${accent}10, ${accent}04)`,
              border: `1.5px solid ${accent}30`,
              borderRadius: 18, padding: '22px',
              position: 'sticky', top: 24,
              transition: 'all 0.4s ease',
            }}>
              {/* Header */}
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 15,
                color: accent, marginBottom: 18, letterSpacing: 2, textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.3s',
              }}>
                <Zap size={16} /> BATTLE SUMMARY
              </div>

              {/* Config grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Mode', value: `${config.playerMode}P Human Battle` },
                  { label: 'Rounds', value: `${config.rounds} rounds` },
                  { label: 'Time / Round', value: `${config.timeLimit} min` },
                  { label: 'Language', value: config.language },
                  { label: 'Difficulty', value: diffInfo.value },
                  { label: 'Test Cases', value: `${diffInfo.tests} tests` },
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

              {/* Difficulty badge */}
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: `${diffInfo.color}10`, border: `1px solid ${diffInfo.color}30`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}><PremiumIcon name={diffInfo.iconName} size={20} color={diffInfo.color} /></span>
                <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: diffInfo.color, letterSpacing: 1 }}>
                  {diffInfo.label}
                </span>
              </div>

              {/* Multiplayer info */}
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: `${accent}08`, border: `1px solid ${accent}22`,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <AlertTriangle size={13} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  Share <strong style={{ color: accent }}>Room ID + Password</strong> with your {config.playerMode - 1} opponent{config.playerMode > 2 ? 's' : ''} after creating the room.
                </span>
              </div>

              {/* Winner rule */}
              <div style={{
                padding: '8px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ display: 'flex', alignItems: 'center' }}><Crown size={16} color="#10b981" /></span>
                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#10b981' }}>First to pass all test cases</strong> and submit wins the round!
                </span>
              </div>

              {/* Enter Arena button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 12px', marginBottom: 12, borderRadius: 9, background: `${accent}12`, border: `1px solid ${accent}35` }}>
                <Zap size={16} style={{ color: accent, flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
                  <strong style={{ color: accent }}>ROOM FEE: 1 G-THUNDER.</strong> The creator is charged when the room is created; joining is free. No refund if you leave or do not play.
                </div>
              </div>
              <button
                onClick={handleEnterArena}
                disabled={isCreating}
                id="custom-enter-arena-btn"
                style={{
                  width: '100%', padding: '16px 0', borderRadius: 12, border: 'none',
                  background: isCreating ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${accent}, ${ui})`,
                  color: isCreating ? 'rgba(255,255,255,0.7)' : '#ffffff',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
                  fontSize: 15, letterSpacing: 3, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: isCreating ? 'none' : `0 8px 32px ${accent}40`,
                  transition: 'all 0.3s',
                }}
              >
                {isCreating ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '3px solid rgba(255,255,255,0.6)',
                      borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    CREATING ROOM...
                  </>
                ) : (
                  <>
                    <Rocket size={16} /> CREATE ROOM <ChevronRight size={16} />
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-24px); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

export default CustomModeRoomCreationPage;
