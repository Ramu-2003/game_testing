import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users, Bug, Trophy } from "lucide-react";
import { Navbar } from '../components/Navbar';
import { Footer } from "../components/landing/Footer";
import { CustomCursor } from "../components/landing/CustomCursor";

/* ─── Page background tint per theme ─── */
const PAGE_BG = {
  red: "linear-gradient(135deg, #FFF5F7 0%, #FFE8EC 50%, #FFF0F3 100%)",
  blue: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 50%, #F0F9FF 100%)",
  green: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #F0FDF4 100%)",
  purple: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 50%, #FAF5FF 100%)",
};

/* ─── Carousel ─── */
const Carousel = ({ theme, navigate }) => {
  const [active, setActive] = useState(0);
  const TOTAL = 5;

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % TOTAL), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full mb-8">
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          height: "260px",
          background: `${theme.accent}0d`,
          border: `1px solid ${theme.accent}28`,
        }}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${active * 100}%)`,
            transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div
              key={i}
              className="min-w-full h-full flex items-center justify-center relative"
            >
              {i === 0 ? (
                <div 
                  className="w-full h-full bg-white relative overflow-hidden flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => navigate('/computer-mode')}
                >
                  {/* Left Character */}
                  <img 
                    src="/assets/HUMAN.png" 
                    alt="Human" 
                    className="absolute left-0 bottom-0 h-full object-contain object-left-bottom" 
                  />
                  {/* Right Character */}
                  <img 
                    src="/assets/ROBOT.png" 
                    alt="Robot" 
                    className="absolute right-0 bottom-0 h-full object-contain object-right-bottom" 
                  />
                  
                  {/* Center Content */}
                  <div className="z-10 flex flex-col items-center justify-center">
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1.1]" 
                      style={{ color: '#60a5fa', textShadow: '0 2px 10px rgba(96,165,250,0.3)' }}
                    >
                      COMPUTER
                    </h2>
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1]" 
                      style={{ color: '#fb7185', textShadow: '0 2px 10px rgba(251,113,133,0.3)' }}
                    >
                      MODE
                    </h2>
                    
                    <button 
                      className="mt-5 px-10 py-2.5 font-sans font-black text-xl rounded-lg border-4 border-black transition-transform hover:scale-105 active:scale-95"
                      style={{ 
                        backgroundColor: '#ffffff', // white color
                        color: 'black',
                        boxShadow: '0 6px 0 0 black',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/computer-mode');
                      }}
                    >
                      ENTER
                    </button>
                  </div>
                </div>
              ) : i === 1 ? (
                <div 
                  className="w-full h-full bg-white relative overflow-hidden flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => navigate('/custom-mode')}
                >
                  {/* Left Character */}
                  <img 
                    src="/assets/HUMAN.png" 
                    alt="Human Player 1" 
                    className="absolute left-0 bottom-0 h-full object-contain object-left-bottom" 
                  />
                  {/* Right Character */}
                  <img 
                    src="/assets/HUMAN-RED.png" 
                    alt="Human Player 2" 
                    className="absolute right-0 bottom-0 h-full object-contain object-right-bottom" 
                  />
                  
                  {/* Center Content */}
                  <div className="z-10 flex flex-col items-center justify-center">
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1.1]" 
                      style={{ color: '#60a5fa', textShadow: '0 2px 10px rgba(96,165,250,0.3)' }}
                    >
                      CUSTOM
                    </h2>
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1]" 
                      style={{ color: '#fb7185', textShadow: '0 2px 10px rgba(251,113,133,0.3)' }}
                    >
                      MODE
                    </h2>
                    
                    <button 
                      className="mt-5 px-10 py-2.5 font-sans font-black text-xl rounded-lg border-4 border-black transition-transform hover:scale-105 active:scale-95"
                      style={{ 
                        backgroundColor: '#ffffff', // As shown in second screenshot
                        color: 'black',
                        boxShadow: '0 6px 0 0 black',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/custom-mode');
                      }}
                    >
                      ENTER
                    </button>
                  </div>
                </div>
              ) : i === 2 ? (
                <div 
                  className="w-full h-full bg-white relative overflow-hidden flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => navigate('/levels-mode')}
                >
                  {/* Left Character */}
                  <img 
                    src="/assets/HUMANS-LOAD-BG.png" 
                    alt="Humans" 
                    className="absolute left-0 bottom-0 h-full max-w-[42%] object-contain object-left-bottom" 
                    style={{ 
                      WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent 95%)', 
                      maskImage: 'linear-gradient(to right, black 80%, transparent 95%)' 
                    }}
                  />
                  {/* Right Character */}
                  <img 
                    src="/assets/ROBOTS-LOAD-BG.png" 
                    alt="Robots" 
                    className="absolute right-0 bottom-0 h-full max-w-[42%] object-contain object-right-bottom" 
                    style={{ 
                      WebkitMaskImage: 'linear-gradient(to left, black 80%, transparent 95%)', 
                      maskImage: 'linear-gradient(to left, black 80%, transparent 95%)' 
                    }}
                  />
                  
                  {/* Center Content */}
                  <div className="z-10 flex flex-col items-center justify-center" style={{ transform: 'translateX(-25px)' }}>
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1.1]" 
                      style={{ color: '#60a5fa', textShadow: '0 2px 10px rgba(96,165,250,0.3)' }}
                    >
                      LEVELS
                    </h2>
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1]" 
                      style={{ color: '#fb7185', textShadow: '0 2px 10px rgba(251,113,133,0.3)' }}
                    >
                      MODE
                    </h2>
                    
                    <button 
                      className="mt-5 px-10 py-2.5 font-sans font-black text-xl rounded-lg border-4 border-black transition-transform hover:scale-105 active:scale-95"
                      style={{ 
                        backgroundColor: '#ffffff',
                        color: 'black',
                        boxShadow: '0 6px 0 0 black',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/levels-mode');
                      }}
                    >
                      ENTER
                    </button>
                  </div>
                </div>
              ) : i === 3 ? (
                <div 
                  className="w-full h-full bg-white relative overflow-hidden flex items-center justify-evenly cursor-pointer"
                  onClick={() => navigate('/specials-mode')}
                >
                  {/* Left Graphic: Bug */}
                  <div className="text-[#10b981] drop-shadow-lg relative">
                    <Bug size={150} strokeWidth={1.5} />
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <div className="bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-xl leading-none">
                        ×
                      </div>
                    </div>
                  </div>

                  {/* Right Content: Text & Button */}
                  <div className="z-10 flex flex-col items-center justify-center">
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1.1]" 
                      style={{ color: '#60a5fa', textShadow: '0 2px 10px rgba(96,165,250,0.3)' }}
                    >
                      BUG HUNTER
                    </h2>
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1]" 
                      style={{ color: '#fb7185', textShadow: '0 2px 10px rgba(251,113,133,0.3)' }}
                    >
                      ARENA
                    </h2>
                    <button 
                      className="mt-5 px-10 py-2.5 font-sans font-black text-xl rounded-lg border-4 border-black transition-transform hover:scale-105 active:scale-95"
                      style={{ backgroundColor: '#ffffff', color: 'black', boxShadow: '0 6px 0 0 black' }}
                      onClick={(e) => { e.stopPropagation(); navigate('/specials-mode'); }}
                    >
                      ENTER
                    </button>
                  </div>
                </div>
              ) : i === 4 ? (
                <div 
                  className="w-full h-full bg-white relative overflow-hidden flex items-center justify-evenly cursor-pointer"
                  onClick={() => navigate('/specials-mode')}
                >
                  {/* Left Graphic: Podium */}
                  <div className="flex items-end h-[150px] drop-shadow-lg">
                    {/* 2nd */}
                    <div className="w-16 h-[100px] bg-gray-300 flex flex-col items-center justify-start pt-2 rounded-t-md border-x border-t border-black/10">
                      <span className="text-white font-black text-2xl drop-shadow-md">2</span>
                      <Trophy size={20} className="text-white mt-auto mb-3 drop-shadow-md" />
                    </div>
                    {/* 1st */}
                    <div className="w-20 h-[140px] bg-yellow-400 flex flex-col items-center justify-start pt-2 rounded-t-md border-x border-t border-black/10 z-10 shadow-xl">
                      <span className="text-white font-black text-3xl drop-shadow-md">1</span>
                      <Trophy size={28} className="text-white mt-auto mb-3 drop-shadow-md" />
                    </div>
                    {/* 3rd */}
                    <div className="w-16 h-[80px] bg-amber-600 flex flex-col items-center justify-start pt-2 rounded-t-md border-x border-t border-black/10">
                      <span className="text-white font-black text-2xl drop-shadow-md">3</span>
                      <Trophy size={20} className="text-white mt-auto mb-3 drop-shadow-md" />
                    </div>
                  </div>

                  {/* Right Content: Text & Button */}
                  <div className="z-10 flex flex-col items-center justify-center">
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1.1]" 
                      style={{ color: '#60a5fa', textShadow: '0 2px 10px rgba(96,165,250,0.3)' }}
                    >
                      GRAND
                    </h2>
                    <h2 
                      className="font-sans font-black text-[3.5rem] leading-[1]" 
                      style={{ color: '#fb7185', textShadow: '0 2px 10px rgba(251,113,133,0.3)' }}
                    >
                      TOURNAMENT
                    </h2>
                    <button 
                      className="mt-5 px-10 py-2.5 font-sans font-black text-xl rounded-lg border-4 border-black transition-transform hover:scale-105 active:scale-95"
                      style={{ backgroundColor: '#ffffff', color: 'black', boxShadow: '0 6px 0 0 black' }}
                      onClick={(e) => { e.stopPropagation(); navigate('/specials-mode'); }}
                    >
                      ENTER
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* pagination dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === active ? "28px" : "9px",
              height: "9px",
              backgroundColor:
                i === active ? theme.accent : `${theme.accent}48`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Split Card Top — 50/50 Red/Blue with centered Thunderbolt
   ═══════════════════════════════════════════════════════════ */
const SplitCardTop = ({ leftSlot, rightSlot }) => (
  <div className="relative flex h-56 overflow-hidden">
    {/* Left Side - Soft Coral Pink */}
    <div className="flex flex-1 items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #FF9AA2 0%, #FFB7B2 100%)' }}>
      {leftSlot}
    </div>
    
    {/* Lightning Bolt Divider - Centered - Warm Golden */}
    <svg
      className="absolute left-1/2 top-0 h-full w-32 -translate-x-1/2"
      viewBox="0 0 128 224"
      preserveAspectRatio="none"
      style={{ zIndex: 10 }}
    >
      <path
        d="M 40 0 L 88 0 L 72 95 L 96 95 L 64 224 L 60 129 L 32 129 Z"
        fill="#FFEAA7"
      />
    </svg>
    
    {/* Right Side - Soft Sky Blue */}
    <div className="flex flex-1 items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #B8E0FF 0%, #A3D5FF 100%)' }}>
      {rightSlot}
    </div>
  </div>
);

/* ─── Mode Card Component ─── */
const ModeCard = ({ title, badge, type, navigate }) => {
  let cardTop;

  if (type === "levels") {
    cardTop = (
      <div className="relative h-56 overflow-hidden flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #FF9AA2 0%, #FFB7B2 100%)' }}>
        {/* Exact Pattern with Blue User Icon and Yellow-filled Circles */}
        <svg viewBox="0 0 300 220" className="w-full h-full">
          {/* User Icon - Blue color matching other cards */}
          <g transform="translate(150, 30) scale(2.5)">
            {/* Circle for head */}
            <circle cx="0" cy="-4" r="5" fill="#B8E0FF" stroke="#B8E0FF" strokeWidth="3" />
            {/* Path for body/shoulders */}
            <path 
              d="M -8 8 C -8 4 -6 2 -3 2 L 3 2 C 6 2 8 4 8 8 L 8 10 L -8 10 Z" 
              fill="#B8E0FF" 
              stroke="#B8E0FF" 
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
          
          {/* First circle - Yellow fill with Blue stroke */}
          <ellipse cx="150" cy="80" rx="20" ry="16" fill="#FFEAA7" stroke="#B8E0FF" strokeWidth="4" />
          
          {/* Dotted line going diagonally right - Blue */}
          <line x1="165" y1="90" x2="195" y2="115" stroke="#B8E0FF" strokeWidth="3" strokeDasharray="3,5" strokeLinecap="round" />
          
          {/* Second circle - Yellow fill with Blue stroke */}
          <ellipse cx="210" cy="125" rx="20" ry="16" fill="#FFEAA7" stroke="#B8E0FF" strokeWidth="4" />
          
          {/* Dotted line going diagonally down left - Blue */}
          <line x1="195" y1="135" x2="115" y2="165" stroke="#B8E0FF" strokeWidth="3" strokeDasharray="3,5" strokeLinecap="round" />
          
          {/* Third circle - Yellow fill with Blue stroke */}
          <ellipse cx="100" cy="175" rx="20" ry="16" fill="#FFEAA7" stroke="#B8E0FF" strokeWidth="4" />
          
          {/* Dotted line going right - Blue */}
          <line x1="120" y1="175" x2="180" y2="175" stroke="#B8E0FF" strokeWidth="3" strokeDasharray="3,5" strokeLinecap="round" />
          
          {/* Fourth circle - Yellow fill with Blue stroke */}
          <ellipse cx="200" cy="175" rx="20" ry="16" fill="#FFEAA7" stroke="#B8E0FF" strokeWidth="4" />
        </svg>
      </div>
    );
  } else if (type === "computer") {
    cardTop = (
      <SplitCardTop
        leftSlot={<User className="w-14 h-14" strokeWidth={2} />}
        rightSlot={
          <svg className="h-14 w-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        }
      />
    );
  } else {
    cardTop = (
      <SplitCardTop
        leftSlot={<Users className="w-14 h-14" strokeWidth={2} />}
        rightSlot={<Users className="w-14 h-14" strokeWidth={2} />}
      />
    );
  }

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      {cardTop}

      <div className="border-t border-gray-200" />

      <div className="py-4 px-4 text-center">
        <h3
          className="font-techno font-bold text-gray-800 text-sm"
          style={{ letterSpacing: "0.16em" }}
        >
          {title}
        </h3>
      </div>

      <div className="border-t border-gray-200" />

      <div className="flex flex-col items-center gap-3 px-5 py-5">
        <span
          className="border border-gray-400 rounded px-4 py-1.5 text-gray-600 font-techno font-medium uppercase"
          style={{ fontSize: "11px", letterSpacing: "0.18em" }}
        >
          {badge}
        </span>
        <button
          type="button"
          onClick={() => {
            if (type === "levels") {
              navigate("/levels-mode");
            } else if (type === "computer") {
              navigate("/computer-mode");
            } else if (type === "custom") {
              navigate("/custom-mode");
            }
          }}
          className="font-sans font-bold text-white uppercase rounded-full transition-all duration-300 hover:scale-105"
          style={{
            width: "148px",
            paddingTop: "10px",
            paddingBottom: "10px",
            background: "#c81e1e",
            letterSpacing: "0.22em",
            fontSize: "13px",
            boxShadow: '0 2px 8px rgba(200, 30, 30, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#a01818";
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(200, 30, 30, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#c81e1e";
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(200, 30, 30, 0.3)';
          }}
        >
          ENTER
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   TriModePage – main export
══════════════════════════════════════════ */
const TriModePage = () => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  
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
  
  const currentTheme = themes[themeKey];
  const pageBg = PAGE_BG[themeKey] || "#f8f4ff";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: pageBg, transition: "background-color 0.5s ease" }}
    >
      <CustomCursor theme={currentTheme} />
      
      <Navbar 
        currentPage="tri mode"
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        themes={themes}
        currentTheme={currentTheme}
      />

      {/* ════════════ MAIN CONTENT ════════════ */}
      <main className="flex-1 px-6 py-10 sm:px-12">
        <div className="mx-auto max-w-6xl">
          <Carousel theme={currentTheme} navigate={navigate} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
            <ModeCard
              title="LEVELS MODE"
              badge="SINGLE PLAYER"
              type="levels"
              navigate={navigate}
            />
            <ModeCard
              title="COMPUTER MODE"
              badge="MULTIPLAYER"
              type="computer"
              navigate={navigate}
            />
            <ModeCard title="CUSTOM MODE" badge="MULTIPLAYER" type="custom" navigate={navigate} />
          </div>
        </div>
      </main>

      {/* ════════════ FOOTER ════════════ */}
      <div
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,0,18,1) 0%, rgba(0,0,4,1) 100%)",
        }}
      >
        <Footer theme={currentTheme} />
      </div>
    </div>
  );
};

export default TriModePage;
