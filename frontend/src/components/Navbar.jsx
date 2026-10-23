import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Zap, LogOut, Plus, ChevronDown } from "lucide-react";
import { PrismThemeToggle } from "./landing/PrismThemeToggle";
import { profileAPI, pointsAPI } from "../utils/api";

const Navbar = ({ currentPage, themeKey, setThemeKey, themes: passedThemes }) => {
  const DEFAULT_THEMES = {
    red:    { accent: '#ff5252', ui: '#ff6b6b' },
    blue:   { accent: '#0099ff', ui: '#00ccff' },
    green:  { accent: '#00ff88', ui: '#00ff99' },
    purple: { accent: '#a855f7', ui: '#d8b4fe' },
  };

  const themes = {};
  Object.keys(DEFAULT_THEMES).forEach(k => {
    themes[k] = {
      ...DEFAULT_THEMES[k],
      ...(passedThemes?.[k] || {})
    };
  });

  const currentTheme = themes[themeKey] || DEFAULT_THEMES[themeKey];

  const navigate = useNavigate();
  const [isGameModeOpen, setIsGameModeOpen] = useState(false);
  const [isCompeteOpen, setIsCompeteOpen] = useState(false);
  const competeMenuRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [xpPoints, setXpPoints] = useState(0);
  const [gThunderPoints, setGThunderPoints] = useState(0);

  // Load profile image and points from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, pointsResponse] = await Promise.all([
          profileAPI.getProfile(),
          pointsAPI.getInfo()
        ]);
        
        const userData = profileResponse.data.user;
        
        // Only show image if profile is complete
        if (userData.profileSetupComplete) {
          localStorage.setItem('username', userData.username || '');
          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
            localStorage.setItem('profileImage', userData.profileImage);
          } else {
            setProfileImage(null);
            localStorage.removeItem('profileImage');
          }
        } else {
          setProfileImage(null);
          localStorage.removeItem('profileImage');
          localStorage.removeItem('username');
        }

        // Set XP and G-THUNDER points
        setXpPoints(pointsResponse.data.xpPoints || 0);
        setGThunderPoints(pointsResponse.data.gThunderPoints || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Don't reset on error - keep current values
        // The API interceptor will handle redirecting if token is invalid
      }
    };

    fetchData();
    
    // Listen for profile and points updates
    const handleProfileUpdate = () => {
      fetchData();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('pointsUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('pointsUpdated', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('username');
    navigate('/');
  };

  const isDashboard = currentPage === 'dashboard';
  const competeRoutes = [
    { label: 'LEADERBOARD', path: '/leaderboard', page: 'leaderboard' },
    { label: 'TOURNAMENT MODE', path: '/tournament', page: 'tournament' },
    { label: 'BUG HUNTER ARENA', path: '/bug-hunter', page: 'bug-hunter' },
  ];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!competeMenuRef.current?.contains(event.target)) setIsCompeteOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsCompeteOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header
      className={
        isDashboard
          ? "flex flex-wrap items-center justify-between gap-6"
          : "sticky top-0 z-50 flex flex-wrap items-center justify-between gap-6 px-6 py-4 sm:px-12 sm:py-5"
      }
      style={
        isDashboard
          ? {}
          : {
              background: "linear-gradient(135deg, rgba(4,0,18,0.99) 0%, rgba(7,0,26,0.98) 100%)",
              borderBottom: `1px solid ${currentTheme.accent}30`,
              boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 32px ${currentTheme.accent}12`,
            }
      }
      data-testid="top-navbar"
    >
      {/* Left side - Brand + Navigation */}
      <div className="flex items-center gap-7 sm:gap-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center font-techno text-xl font-bold tracking-wide bg-transparent border-none cursor-pointer p-0 transition-all duration-300 hover:brightness-125"
          style={{
            color: currentTheme.ui,
            filter: `drop-shadow(0 0 12px ${currentTheme.accent}66)`,
          }}
        >
          <span>GAME IN MY</span>
          <Zap 
            className="h-5 w-5 mx-1 animate-pulse" 
            style={{ color: currentTheme.accent }}
            fill={currentTheme.accent}
          />
          <span>TYLE</span>
        </button>

        <nav className="flex items-center gap-6 font-techno text-[15px] font-semibold sm:gap-7">
          <style>{`
            .nav-btn::after {
              content: '';
              position: absolute;
              bottom: -4px;
              left: 0;
              height: 2px;
              transition: all 0.3s ease;
            }
            .nav-btn-active::after {
              width: 100%;
              background-color: ${currentTheme.accent};
            }
            .nav-btn-inactive::after {
              width: 0;
              background-color: ${currentTheme.accent};
            }
            .nav-btn-inactive:hover::after {
              width: 100%;
            }
          `}</style>
          <button
            onClick={() => navigate("/dashboard")}
            className={`nav-btn relative tracking-wider transition-colors duration-300 bg-transparent border-none cursor-pointer p-0 font-techno text-[15px] font-semibold ${
              currentPage === 'dashboard' 
                ? 'text-white nav-btn-active' 
                : 'text-white/90 hover:text-white nav-btn-inactive'
            }`}
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
          >
            HOME
          </button>
          <button
            onClick={() => navigate("/rules")}
            className={`nav-btn relative tracking-wider transition-colors duration-300 bg-transparent border-none cursor-pointer p-0 font-techno text-[15px] font-semibold ${
              currentPage === 'rules' 
                ? 'text-white nav-btn-active' 
                : 'text-white/90 hover:text-white nav-btn-inactive'
            }`}
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
          >
            RULES
          </button>
          
          {/* Game Mode Dropdown — TRI MODE & SPECIALS only */}
          <div className="relative" data-dropdown="game-mode">
            <button
              onClick={() => setIsGameModeOpen(!isGameModeOpen)}
              className={`nav-btn relative tracking-wider transition-colors duration-300 bg-transparent border-none cursor-pointer p-0 font-techno text-[15px] font-semibold flex items-center gap-1 ${
                (currentPage === 'tri-mode' || currentPage === 'specials-mode')
                  ? 'text-white nav-btn-active' 
                  : 'text-white/90 hover:text-white nav-btn-inactive'
              }`}
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
            >
              GAME MODE
              <ChevronDown 
                className="h-4 w-4 transition-transform duration-300" 
                style={{ transform: isGameModeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            
            {/* Dropdown Menu */}
            {isGameModeOpen && (
              <div 
                className="absolute top-full left-0 mt-2 py-2 rounded-lg backdrop-blur-md min-w-[160px]"
                style={{
                  background: 'rgba(10, 5, 25, 0.98)',
                  border: `1px solid ${currentTheme.accent}60`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.9), 0 0 24px ${currentTheme.accent}30`,
                  zIndex: 9999
                }}
              >
                <button
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setIsGameModeOpen(false);
                    navigate('/tri-mode'); 
                  }}
                  className="w-full text-left px-4 py-2.5 font-techno text-[14px] font-semibold tracking-wider text-white/90 transition-all duration-200 hover:text-white cursor-pointer bg-transparent border-none"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${currentTheme.accent}25`;
                    e.currentTarget.style.borderLeft = `3px solid ${currentTheme.accent}`;
                    e.currentTarget.style.paddingLeft = '13px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeft = 'none';
                    e.currentTarget.style.paddingLeft = '16px';
                  }}
                >
                  TRI MODE
                </button>
                <button
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setIsGameModeOpen(false);
                    navigate('/specials-mode'); 
                  }}
                  className="w-full text-left px-4 py-2.5 font-techno text-[14px] font-semibold tracking-wider text-white/90 transition-all duration-200 hover:text-white cursor-pointer bg-transparent border-none"
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${currentTheme.accent}25`;
                    e.currentTarget.style.borderLeft = `3px solid ${currentTheme.accent}`;
                    e.currentTarget.style.paddingLeft = '13px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderLeft = 'none';
                    e.currentTarget.style.paddingLeft = '16px';
                  }}
                >
                  SPECIALS
                </button>
              </div>
            )}
          </div>
          
          <div className="relative" ref={competeMenuRef}>
            <button
              type="button"
              onClick={() => setIsCompeteOpen((open) => !open)}
              aria-expanded={isCompeteOpen}
              aria-controls="compete-navigation-menu"
              className={`nav-btn relative tracking-wider transition-colors duration-300 bg-transparent border-none cursor-pointer p-0 font-techno text-[15px] font-semibold flex items-center gap-1 ${competeRoutes.some((route) => route.page === currentPage) ? 'text-white nav-btn-active' : 'text-white/90 hover:text-white nav-btn-inactive'}`}
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
            >
              COMPETE
              <ChevronDown className="h-4 w-4 transition-transform duration-200" style={{ transform: isCompeteOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {isCompeteOpen && <nav id="compete-navigation-menu" aria-label="Competition pages" className="absolute top-full left-0 mt-3 min-w-[205px] rounded-lg py-2 backdrop-blur-md" style={{ background: 'rgba(10, 5, 25, 0.98)', border: `1px solid ${currentTheme.accent}55`, boxShadow: `0 8px 32px rgba(0,0,0,.85), 0 0 24px ${currentTheme.accent}22`, zIndex: 9999 }}>
              {competeRoutes.map((route) => <button key={route.path} type="button" aria-current={currentPage === route.page ? 'page' : undefined} onClick={() => { setIsCompeteOpen(false); navigate(route.path); }} className="w-full px-4 py-2.5 text-left font-techno text-[13px] font-semibold tracking-wider text-white/80 transition-colors hover:bg-white/[.06] hover:text-white focus-visible:outline focus-visible:outline-2" style={{ borderLeft: currentPage === route.page ? `2px solid ${currentTheme.accent}` : '2px solid transparent' }}>{route.label}</button>)}
            </nav>}
          </div>

        </nav>
      </div>

      {/* Right side - Page indicator + Controls */}
      <div className="flex items-center gap-5 sm:gap-7">
        {currentPage && currentPage !== 'dashboard' && (
          <span
            className="tracking-wider font-techno text-[15px] font-bold select-none"
            style={{
              color: currentTheme.ui,
              textShadow: `0 0 14px ${currentTheme.accent}90`,
              borderBottom: `2px solid ${currentTheme.accent}`,
              paddingBottom: "2px",
            }}
          >
            {currentPage.toUpperCase()}
          </span>
        )}

        {/* XP Points Display */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
          style={{
            borderColor: '#3b82f660',
            background: '#3b82f615',
          }}
        >
          <svg 
            className="h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="#3b82f6"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L2 7L12 12L22 7L12 2Z" />
            <path d="M2 17L12 22L22 17" />
            <path d="M2 12L12 17L22 12" />
          </svg>
          <span 
            className="font-techno text-sm font-bold"
            style={{ color: currentTheme.ui }}
          >
            {xpPoints}
          </span>
          <button
            onClick={() => navigate('/store')}
            className="flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 hover:scale-110"
            style={{
              background: '#3b82f6',
              color: '#ffffff',
            }}
            aria-label="Go to Store"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* G-THUNDER Points Display */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
          style={{
            borderColor: `#a855f760`,
            background: `#a855f715`,
          }}
        >
          <Zap 
            className="h-4 w-4" 
            style={{ color: '#a855f7' }}
            fill="#a855f7"
          />
          <span 
            className="font-techno text-sm font-bold"
            style={{ color: currentTheme.ui }}
          >
            {gThunderPoints}
          </span>
          <button
            onClick={() => navigate('/store')}
            className="flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300 hover:scale-110"
            style={{
              background: '#a855f7',
              color: '#ffffff',
            }}
            aria-label="Go to Store"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <PrismThemeToggle
          currentThemeKey={themeKey}
          onThemeChange={setThemeKey}
          themes={themes}
        />

        {/* Profile Icon with Image */}
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:brightness-110 overflow-hidden"
          style={{ 
            color: currentTheme.ui,
            background: `${currentTheme.accent}40`,
            borderColor: currentTheme.accent,
            boxShadow: `0 0 20px ${currentTheme.accent}60`
          }}
          aria-label="Profile"
        >
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-7 w-7"
            style={{ display: profileImage ? 'none' : 'block' }}
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-white/50 hover:bg-white/15"
          style={{ 
            color: currentTheme.ui,
            boxShadow: `0 0 16px ${currentTheme.accent}33`
          }}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

Navbar.propTypes = {
  currentPage: PropTypes.string,
  themeKey: PropTypes.string,
  setThemeKey: PropTypes.func,
  themes: PropTypes.object,
};

export { Navbar };
