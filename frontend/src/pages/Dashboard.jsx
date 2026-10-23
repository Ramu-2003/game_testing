import { useMemo, useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { SpaceHeroScene } from '../components/landing/SpaceHeroScene';
import { DiscoverFeatures } from '../components/landing/DiscoverFeatures';
import { Rules } from '../components/landing/Rules';
import { Store } from '../components/landing/Store';
import { TriMode } from '../components/landing/TriMode';
import { Specials } from '../components/landing/Specials';
import { Leaderboard } from '../components/landing/Leaderboard';
import { Profile } from '../components/landing/Profile';
import { Welcome } from '../components/landing/Welcome';
import { CustomCursor } from '../components/landing/CustomCursor';
import { Footer } from '../components/landing/Footer';
import { GlobalParticleScene } from '../components/landing/GlobalParticleScene';

const themes = {
  red: {
    thunder: '#8b0000',
    asteroid: '#ff6b6b',
    accent: '#ff5252',
    ui: '#ff6b6b',
    background: 'radial-gradient(circle at 50% 32%, rgba(220, 20, 60, 0.75), rgba(30, 5, 10, 0.96) 54%, #0a0005 100%)',
  },
  blue: {
    thunder: '#003d99',
    asteroid: '#00d4ff',
    accent: '#0099ff',
    ui: '#00ccff',
    background: 'radial-gradient(circle at 50% 32%, rgba(0, 102, 255, 0.7), rgba(5, 15, 50, 0.96) 56%, #000a1a 100%)',
  },
  green: {
    thunder: '#1a5c1a',
    asteroid: '#39ff14',
    accent: '#00ff88',
    ui: '#00ff99',
    background: 'radial-gradient(circle at 50% 32%, rgba(0, 255, 65, 0.65), rgba(5, 30, 15, 0.96) 58%, #000a05 100%)',
  },
  purple: {
    thunder: '#6d28d9',
    asteroid: '#c084fc',
    accent: '#a855f7',
    ui: '#d8b4fe',
    background: 'radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.7), rgba(30, 10, 50, 0.96) 56%, #0a0515 100%)',
  },
};

const Dashboard = () => {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  const [particlesVisible, setParticlesVisible] = useState(false);
  const currentTheme = useMemo(() => themes[themeKey], [themeKey]);

  // Show global particles only once user has scrolled past the hero section
  useEffect(() => {
    const hero = document.getElementById('hero-section');
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setParticlesVisible(!entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);


  return (
    <>
      <CustomCursor theme={currentTheme} />
      <main
        id="hero-section"
        className="relative min-h-screen overflow-hidden bg-black text-white"
        style={{ background: currentTheme.background }}
        data-testid="landing-page-root"
      >
        <SpaceHeroScene theme={currentTheme} />
        
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_70%,rgba(0,0,0,0.85)_100%)]" />

        <div className="relative z-20 flex min-h-screen flex-col px-6 pb-6 pt-4 sm:px-12 sm:pb-8 sm:pt-5">
          <Navbar 
            currentPage="dashboard"
            themeKey={themeKey}
            setThemeKey={setThemeKey}
            themes={themes}
            currentTheme={currentTheme}
          />

          <section className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-end px-4 text-center">
            <div className="w-full max-w-5xl pb-4">
              <h1
                className="animate-rise font-display text-[5rem] font-black leading-[0.86] tracking-wide text-white sm:text-[8rem]"
                style={{ 
                  animationDelay: '100ms',
                  textShadow: `0 6px 32px rgba(0,0,0,0.9), 0 0 60px ${currentTheme.accent}44, 0 2px 4px rgba(0,0,0,0.8)`,
                  WebkitTextStroke: '1.5px rgba(255,255,255,0.08)',
                  letterSpacing: '0.04em'
                }}
                data-testid="hero-main-title"
              >
                GAME IN
                <br />
                MY STYLE
              </h1>

              <p
                className="mt-3 animate-rise font-techno text-[11px] font-semibold tracking-[0.38em] sm:text-[13px]"
                style={{ 
                  animationDelay: '240ms',
                  color: 'rgba(255,255,255,0.7)',
                  textShadow: `0 2px 12px rgba(0,0,0,0.8), 0 0 20px ${currentTheme.accent}33`
                }}
                data-testid="hero-cinematic-tagline"
              >
                C I N E M A T I C · E X P E R I E N C E
              </p>

              <button
                type="button"
                className="pointer-events-auto group mt-6 inline-flex animate-rise items-center rounded-full border-2 px-9 py-3.5 font-techno text-[13px] font-bold tracking-[0.24em] transition-all duration-400 hover:-translate-y-1.5 hover:scale-105"
                style={{
                  borderColor: currentTheme.accent,
                  backgroundColor: `${currentTheme.accent}18`,
                  color: '#ffffff',
                  boxShadow: `0 0 32px ${currentTheme.accent}88, 0 8px 24px rgba(0,0,0,0.6)`,
                  animationDelay: '380ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${currentTheme.accent}28`;
                  e.currentTarget.style.boxShadow = `0 0 48px ${currentTheme.accent}cc, 0 12px 32px rgba(0,0,0,0.7)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${currentTheme.accent}18`;
                  e.currentTarget.style.boxShadow = `0 0 32px ${currentTheme.accent}88, 0 8px 24px rgba(0,0,0,0.6)`;
                }}
                onClick={() => {
                  document.getElementById('discover-features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                data-testid="hero-cta-button"
              >
                ENTER EXPERIENCE
              </button>
            </div>
          </section>
        </div>
      </main>

      <DiscoverFeatures theme={currentTheme} id="discover-features" />
      <Rules theme={currentTheme} id="rules" />
      <Store theme={currentTheme} id="store" />
      <Specials theme={currentTheme} id="specials" />
      <TriMode theme={currentTheme} id="tri-mode" />
      <Leaderboard theme={currentTheme} id="leaderboard" />
      <Profile theme={currentTheme} id="profile" />
      <Welcome theme={currentTheme} />
      <Footer theme={currentTheme} />

      {/* Single global particle canvas */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
          opacity: particlesVisible ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        <GlobalParticleScene theme={currentTheme} />
      </div>
    </>
  );
};

export default Dashboard;
