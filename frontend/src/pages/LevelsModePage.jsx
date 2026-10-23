import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { CustomCursor } from "../components/landing/CustomCursor";
import { HtmlIcon, CssIcon, JsIcon, PythonIcon, JavaIcon } from "../components/landing/TechIcons";
import { PremiumIcon } from "../components/landing/PremiumIcon";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import PixelBlast from "../components/landing/PixelBlast";
import { levelsAPI } from "../utils/api";

/* ─── Themes ─────────────────────────────────────────────────────── */
const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', asteroid: '#ff6b6b', bg: '#0d0305' },
  blue:   { accent: '#0099ff', ui: '#00ccff', asteroid: '#00d4ff', bg: '#020810' },
  green:  { accent: '#00ff88', ui: '#00ff99', asteroid: '#39ff14', bg: '#020d07' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', asteroid: '#c084fc', bg: '#06020d' },
};

/* ─── Course data ─────────────────────────────────────────────────── */
const COURSES = [
  {
    id: "html",
    title: "HTML",
    subtitle: "HyperText Markup Language",
    version: "HTML5",
    badge: "BEGINNER",
    badgeColor: "#10b981",
    difficulty: 1,
    Icon: HtmlIcon,
    langColor: "#e34c26",
    glyph: "</>",
    description: "Build the skeleton of every webpage. Write clean, semantic markup browsers love.",
    features: ["Tags, Attributes & Semantic Structure", "Forms, Tables & Accessibility", "HTML5 APIs & Media Elements"],
  },
  {
    id: "css",
    title: "CSS",
    subtitle: "Cascading Style Sheets",
    version: "CSS3",
    badge: "BEGINNER",
    badgeColor: "#10b981",
    difficulty: 1,
    Icon: CssIcon,
    langColor: "#1572b6",
    glyph: "{ }",
    description: "Transform raw HTML into stunning, responsive designs with modern layout systems.",
    features: ["Flexbox, Grid & Box Model", "Animations, Transitions & Variables", "Responsive Design & Media Queries"],
  },
  {
    id: "javascript",
    title: "JavaScript",
    subtitle: "ECMAScript / ES6+",
    version: "ES2024",
    badge: "INTERMEDIATE",
    badgeColor: "#f59e0b",
    difficulty: 2,
    Icon: JsIcon,
    langColor: "#f0db4f",
    glyph: "JS",
    description: "Breathe life into pages. Master the language of the web — DOM to async.",
    features: ["Variables, Functions & Closures", "Async / Await, Fetch & Promises", "DOM Manipulation & ES6+ Features"],
  },
  {
    id: "python",
    title: "Python",
    subtitle: "Python Programming",
    version: "Python 3.x",
    badge: "INTERMEDIATE",
    badgeColor: "#f59e0b",
    difficulty: 2,
    Icon: PythonIcon,
    langColor: "#3776ab",
    glyph: "PY",
    description: "Clean, powerful, readable. Tackle data structures, algorithms, and OOP.",
    features: ["Syntax, Types & Data Structures", "OOP, Decorators & Generators", "File I/O, Modules & Algorithms"],
  },
  {
    id: "java",
    title: "Java",
    subtitle: "Java SE / JDK",
    version: "Java 21 LTS",
    badge: "ADVANCED",
    badgeColor: "#ef4444",
    difficulty: 3,
    Icon: JavaIcon,
    langColor: "#e76f00",
    glyph: "J",
    description: "Enterprise-grade power. Master OOP, collections, multithreading & JVM.",
    features: ["OOP Principles & Inheritance", "Collections, Generics & Exceptions", "Multithreading & Java Streams"],
  },
];


/* ─── Stat badge ─────────────────────────────────────────────────── */
const StatBadge = ({ iconName, value, label, color }) => (
  <div style={{ textAlign: 'center', padding: '16px 28px' }}>
    <div style={{ fontSize: 24, marginBottom: 4, display: 'flex', justifyContent: 'center' }}><PremiumIcon name={iconName} size={28} color={color} /></div>
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 26, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 3 }}>{label}</div>
  </div>
);

/* ─── Course Card ─────────────────────────────────────────────────── */
const CourseCard = ({ course, theme, onClick, enterAnim, idx, levelCount, catalogStatus }) => {
  const [hovered, setHovered] = useState(false);
  const { title, subtitle, version, badge, badgeColor, difficulty, Icon, langColor, glyph, description, features } = course;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 24,
        border: `1.5px solid ${hovered ? langColor : theme.accent + '28'}`,
        background: hovered
          ? `linear-gradient(160deg, ${langColor}14 0%, ${langColor}05 50%, rgba(255,255,255,0.01) 100%)`
          : 'rgba(255,255,255,0.02)',
        boxShadow: hovered
          ? `0 0 60px ${langColor}22, 0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 ${langColor}18`
          : '0 8px 32px rgba(0,0,0,0.45)',
        transform: hovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 480,
        /* Staggered entrance */
        animation: enterAnim ? `cardEnter 0.5s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.08}s both` : 'none',
      }}
    >
      {/* Scan line on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${langColor}, transparent)`,
          animation: 'scanH 2s linear infinite',
        }} />
      )}

      {/* Hover glow orb */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 340, height: 340,
        background: `radial-gradient(circle, ${langColor}22 0%, transparent 70%)`,
        pointerEvents: 'none', opacity: hovered ? 1 : 0, transition: 'opacity 0.4s',
      }} />

      {/* Badge */}
      <div style={{
        position: 'absolute', top: 18, right: 18, padding: '3px 12px', borderRadius: 20,
        background: `${badgeColor}18`, border: `1px solid ${badgeColor}45`,
        fontFamily: 'monospace', fontSize: 15,  fontWeight: 900, letterSpacing: 2,
        color: badgeColor, textTransform: 'uppercase',
      }}>{badge}</div>

      {/* Glyph watermark */}
      <div style={{
        position: 'absolute', bottom: 110, right: 18,
        fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 900,
        color: `${langColor}18`, userSelect: 'none', pointerEvents: 'none',
      }}>{glyph}</div>

      {/* Icon zone */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '44px 0 28px', position: 'relative' }}>
        <div style={{
          position: 'absolute', width: 118, height: 118, borderRadius: '50%',
          border: `1.5px dashed ${hovered ? langColor : theme.accent}28`,
          animation: hovered ? 'spinRing 10s linear infinite' : 'none',
        }} />
        <div style={{
          position: 'absolute', width: 92, height: 92, borderRadius: '50%',
          border: `1px solid ${hovered ? langColor : theme.accent}18`,
          animation: hovered ? 'spinRing 6s linear infinite reverse' : 'none',
        }} />
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `linear-gradient(135deg, ${langColor}22, ${langColor}08)`,
          border: `2px solid ${hovered ? langColor : langColor + '50'}`,
          boxShadow: hovered ? `0 0 32px ${langColor}40, inset 0 0 24px ${langColor}12` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.42s', transform: hovered ? 'scale(1.12)' : 'scale(1)',
        }}>
          <div style={{ filter: hovered ? `drop-shadow(0 0 10px ${langColor}80)` : 'none', transition: 'filter 0.3s' }}>
            <Icon />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 26px 26px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 28, color: 'white',
          textTransform: 'uppercase', letterSpacing: 3, marginBottom: 4,
          textShadow: hovered ? `0 0 24px ${langColor}60` : 'none', transition: 'text-shadow 0.3s',
        }}>{title}</div>
        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.38)', marginBottom: 4, letterSpacing: 1 }}>{subtitle}</div>
        <div style={{ marginBottom: 14 }}>
          <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 20,
            background: `${hovered ? langColor : theme.accent}18`,
            border: `1px solid ${hovered ? langColor : theme.accent}35`,
            fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 2,
            color: hovered ? langColor : theme.ui, transition: 'all 0.3s',
          }}>{version}</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, marginBottom: 18, flex: 1 }}>
          {description}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {features.map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: hovered ? langColor : theme.accent,
                boxShadow: `0 0 8px ${hovered ? langColor : theme.accent}`,
                transition: 'all 0.3s',
              }} />
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.52)', lineHeight: 1.5 }}>{feat}</span>
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18,
          padding: '8px 12px', borderRadius: 10,
          background: `${hovered ? langColor : theme.accent}08`,
          border: `1px solid ${hovered ? langColor : theme.accent}14`, transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Difficulty</span>
            <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
              {[1,2,3].map(d => (
                <div key={d} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: d <= difficulty ? (hovered ? langColor : theme.accent) : 'rgba(255,255,255,0.08)',
                  boxShadow: d <= difficulty ? `0 0 8px ${hovered ? langColor : theme.accent}` : 'none',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
          <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: hovered ? langColor : theme.ui, letterSpacing: 1, transition: 'color 0.3s' }}>
            {catalogStatus === 'ready' ? `${levelCount} LEVELS` : catalogStatus === 'loading' ? 'LOADING CATALOG' : 'CATALOG UNAVAILABLE'}
          </span>
        </div>
        <button onClick={onClick} aria-label={`Start learning ${title}`} style={{
          marginTop: 'auto', width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
          background: hovered ? `linear-gradient(135deg, ${langColor}, ${langColor}cc)` : `linear-gradient(135deg, ${theme.accent}70, ${theme.accent}35)`,
          color: 'white', cursor: 'pointer', fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
          fontSize: 15, letterSpacing: 3, textTransform: 'uppercase',
          boxShadow: hovered ? `0 8px 32px ${langColor}50` : 'none', transition: 'all 0.35s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          START LEARNING <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LEVELS MODE PAGE
═══════════════════════════════════════════════════════════════════ */
const LevelsModePage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [glitch,   setGlitch]   = useState(false);
  const [entered,  setEntered]  = useState(false);  // ENTER button state
  const [cardAnim, setCardAnim] = useState(false);
  const [courseLevelCounts, setCourseLevelCounts] = useState(null);
  const [catalogStatus, setCatalogStatus] = useState('loading');

  useEffect(() => { localStorage.setItem('themeKey', themeKey); }, [themeKey]);

  useEffect(() => {
    let active = true;
    levelsAPI.getProgress().then(({ data }) => {
      const counts = data.phaseLevelCounts || {};
      if (!active) return;
      const nextCounts = Object.fromEntries(COURSES.map((course) => [
        course.id,
        Object.values(counts[course.id] || {}).reduce((total, count) => total + (Number(count) || 0), 0),
      ]));
      setCourseLevelCounts(nextCounts);
      setCatalogStatus(COURSES.every((course) => nextCounts[course.id] > 0) ? 'ready' : 'unavailable');
    }).catch(() => {
      if (active) setCatalogStatus('unavailable');
    });
    return () => { active = false; };
  }, []);

  const totalCourseLevelCount = Object.values(courseLevelCounts || {}).reduce((total, count) => total + count, 0);

  useEffect(() => {
    const iv = setInterval(() => { setGlitch(true); setTimeout(() => setGlitch(false), 180); }, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleEnter = () => {
    setEntered(true);
    setTimeout(() => setCardAnim(true), 50);
  };

  const theme  = THEMES[themeKey];
  const ac     = theme.accent;
  const ui     = theme.ui;
  const pageBg = theme.bg;

  const navThemes = {
    red:    { accent: '#ff5252', ui: '#ff6b6b' },
    blue:   { accent: '#0099ff', ui: '#00ccff' },
    green:  { accent: '#00ff88', ui: '#00ff99' },
    purple: { accent: '#a855f7', ui: '#d8b4fe' },
  };

  return (
    <div style={{
      minHeight: '100vh', background: pageBg, color: 'white',
      position: 'relative', overflow: 'hidden', transition: 'background 0.4s ease',
    }}>
      <CustomCursor theme={{ accent: ac, ui }} />
      <Navbar
        currentPage="levels mode"
        themeKey={themeKey} setThemeKey={setThemeKey}
        themes={navThemes} currentTheme={{ accent: ac, ui }}
      />

      {/* ── PIXEL BLAST BACKGROUND (unique to Levels Mode) ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.25 }}>
        <PixelBlast color={ac} />
      </div>

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '-8%', left: '15%', width: 560, height: 560, background: `radial-gradient(circle, ${ac}14 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'floatA 9s ease-in-out infinite', transition: 'background 0.4s' }} />
      <div style={{ position: 'fixed', top: '25%', right: '8%', width: 420, height: 420, background: `radial-gradient(circle, ${theme.asteroid}10 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'floatA 12s ease-in-out infinite reverse', transition: 'background 0.4s' }} />
      <div style={{ position: 'fixed', bottom: '5%', left: '5%', width: 380, height: 380, background: `radial-gradient(circle, ${ac}07 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0, animation: 'floatA 15s ease-in-out infinite 2s', transition: 'background 0.4s' }} />

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440, margin: '0 auto', padding: '36px 28px 100px' }}>

        {/* Back button */}
        <div style={{ marginBottom: 40 }}>
          <button
            onClick={() => navigate('/tri-mode')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8,
              border: `1.5px solid ${ac}35`, background: `${ac}10`, color: ac, cursor: 'pointer',
              fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${ac}20`; e.currentTarget.style.transform = 'translateX(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${ac}10`; e.currentTarget.style.transform = 'translateX(0)'; }}
          >
            <ChevronLeft size={16} /> BACK TO TRI MODE
          </button>
        </div>

        {/* ══ LANDING SCREEN (before ENTER) ══ */}
        {!entered && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '72vh', textAlign: 'center',
            animation: 'fadeIn 0.6s ease both',
          }}>
            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 20px', borderRadius: 20,
              background: `${ac}12`, border: `1px solid ${ac}70`,
              fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: ac,
              textTransform: 'uppercase', letterSpacing: 4, marginBottom: 28,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ac, animation: 'pulse 2s infinite', boxShadow: `0 0 8px ${ac}` }} />
              SINGLE PLAYER CAMPAIGN
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.asteroid, animation: 'pulse 2s infinite 1s', boxShadow: `0 0 8px ${theme.asteroid}` }} />
            </div>

            {/* Glitch title */}
            <h1 style={{
              margin: '0 0 20px',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
              fontSize: 'clamp(60px, 10vw, 110px)',
              textTransform: 'uppercase', letterSpacing: 8,
              background: `linear-gradient(135deg, white 20%, ${ac} 52%, ${ui} 80%)`,
              backgroundClip: 'text', WebkitBackgroundClip: 'text',
              color: 'transparent', WebkitTextFillColor: 'transparent',
              filter: glitch
                ? `drop-shadow(4px 0 0 ${ac}) drop-shadow(-4px 0 0 ${theme.asteroid})`
                : `drop-shadow(0 0 50px ${ac}35)`,
              transition: 'filter 0.1s',
            }}>
              LEVELS MODE
            </h1>

            {/* Divider */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ height: 1, width: 80, background: `linear-gradient(90deg, transparent, ${ac}90)` }} />
              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${ac}70`, letterSpacing: 4, textTransform: 'uppercase' }}>MASTER · PROGRESS · CONQUER</span>
              <div style={{ height: 1, width: 80, background: `linear-gradient(90deg, ${ac}90, transparent)` }} />
            </div>

            <p style={{
              fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
              margin: '0 auto 48px', maxWidth: 500, lineHeight: 1.9,
            }}>
              Choose a language track and follow its current lesson path.<br />
              Earn XP, climb the ranks, and forge your coding legacy.
            </p>

            {/* Stats bar */}
            <div style={{
              display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0,
              background: 'rgba(255,255,255,0.025)', border: `1px solid ${ac}15`,
              borderRadius: 18, overflow: 'hidden', backdropFilter: 'blur(12px)',
              boxShadow: `0 0 40px ${ac}08`, marginBottom: 52,
            }}>
              <StatBadge iconName="Library" value={catalogStatus === 'ready' ? totalCourseLevelCount : '—'} label="Total Lessons" color={ac} />
              <div style={{ width: 1, background: `${ac}15`, alignSelf: 'stretch' }} />
              <StatBadge iconName="Language" value="5"    label="Languages"     color={theme.asteroid} />
              <div style={{ width: 1, background: `${ac}15`, alignSelf: 'stretch' }} />
              <StatBadge iconName="Zap" value="∞"    label="Challenges"    color="#10b981" />
              <div style={{ width: 1, background: `${ac}15`, alignSelf: 'stretch' }} />
              <StatBadge iconName="Crown" value="XP"   label="Rewards"       color="#f59e0b" />
            </div>

            {/* ──── ENTER BUTTON ──── */}
            <button
              id="levels-enter-btn"
              onClick={handleEnter}
              style={{
                position: 'relative', overflow: 'hidden',
                padding: '20px 72px', borderRadius: 16, border: `2px solid ${ac}`,
                background: `linear-gradient(135deg, ${ac}28, ${ac}10)`,
                color: 'white', cursor: 'pointer',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900,
                fontSize: 22, letterSpacing: 6, textTransform: 'uppercase',
                boxShadow: `0 0 40px ${ac}35, 0 8px 32px rgba(0,0,0,0.5)`,
                animation: 'enterPulse 2.5s ease-in-out infinite',
                transition: 'transform 0.2s',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.06)';
                e.currentTarget.style.boxShadow = `0 0 70px ${ac}55, 0 12px 48px rgba(0,0,0,0.6)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 0 40px ${ac}35, 0 8px 32px rgba(0,0,0,0.5)`;
              }}
            >
              {/* Shimmer sweep */}
              <div style={{
                position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                animation: 'shimmer 2.5s linear infinite',
                pointerEvents: 'none',
              }} />
              <Zap size={22} fill={ac} style={{ color: ac }} />
              ENTER
              <ChevronRight size={20} style={{ color: ac }} />
            </button>

            <div style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${ac}80`, letterSpacing: 3 }}>
              CLICK TO SELECT YOUR LANGUAGE
            </div>
          </div>
        )}

        {/* ══ CARDS SCREEN (after ENTER) ══ */}
        {entered && (
          <div style={{ animation: 'fadeIn 0.4s ease both' }}>
            {/* Compact header */}
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <h2 style={{
                margin: '0 0 12px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 5vw, 52px)',
                textTransform: 'uppercase', letterSpacing: 5,
                backgroundImage: `linear-gradient(135deg, white 30%, ${ac} 65%, ${ui})`,
                backgroundClip: 'text', WebkitBackgroundClip: 'text',
                color: 'transparent', WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 30px ${ac}70)`,
              }}>
                CHOOSE YOUR LANGUAGE
              </h2>
              <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${ac}99`, letterSpacing: 3, margin: 0 }}>
                5 TRACKS · {catalogStatus === 'ready' ? totalCourseLevelCount : catalogStatus === 'loading' ? 'LOADING' : 'UNAVAILABLE'} LESSONS · 10 PHASES
              </p>
            </div>

            {/* Course cards */}
            <div style={{
              display: 'flex', gap: 22, alignItems: 'stretch',
              overflowX: 'auto', paddingBottom: 8,
              scrollbarWidth: 'thin', scrollbarColor: `${ac}80 transparent`,
            }}>
              {COURSES.map((course, idx) => (
                <div key={course.id} style={{ flex: '1 1 0', minWidth: 248, maxWidth: 310 }}>
                  <CourseCard
                    course={course}
                    levelCount={courseLevelCounts?.[course.id]}
                    catalogStatus={catalogStatus}
                    theme={theme}
                    onClick={() => navigate(`/phases/${course.id}`)}
                    enterAnim={cardAnim}
                    idx={idx}
                  />
                </div>
              ))}
            </div>

            {/* Feature strip */}
            <div style={{ marginTop: 44, textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 32, padding: '15px 36px', borderRadius: 40,
                background: 'rgba(255,255,255,0.025)', border: `1px solid ${ac}14`,
                backdropFilter: 'blur(14px)', flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {[
                  { iconName: 'Zap', text: 'Instant Validation', color: '#10b981' },
                  { iconName: 'BarChart2', text: 'XP Tracking', color: '#3b82f6' },
                  { iconName: 'Target', text: 'Adaptive Difficulty', color: '#f43f5e' },
                  { iconName: 'Flame', text: 'Daily Streaks', color: '#f59e0b' },
                  { iconName: 'Crown', text: 'Rank & Rewards', color: '#fbbf24' },
                ].map(({ iconName, text, color }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16, display: 'flex' }}><PremiumIcon name={iconName} size={18} color={color} /></span>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif',  fontSize: 15, fontWeight: 700, color: ui, letterSpacing: 1, textTransform: 'uppercase' }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${ac}70`, letterSpacing: 3 }}>
                SELECT A TRACK TO BEGIN · COMPLETE EACH PHASE TO UNLOCK THE NEXT
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatA  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }
        @keyframes spinRing { to { transform:rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.45;transform:scale(0.75)} }
        @keyframes scanH   { 0%,100%{opacity:0;transform:scaleX(0)} 50%{opacity:1;transform:scaleX(1)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardEnter { from{opacity:0;transform:translateY(40px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes enterPulse {
          0%,100% { box-shadow: 0 0 40px ${ac}35, 0 8px 32px rgba(0,0,0,0.5); }
          50%     { box-shadow: 0 0 65px ${ac}55, 0 8px 48px rgba(0,0,0,0.6); }
        }
        @keyframes shimmer { 0%{left:-100%} 100%{left:200%} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${ac}80; border-radius:3px; }
      `}</style>
    </div>
  );
};

export default LevelsModePage;
