import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Gamepad2, Play, Check } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { CustomCursor } from "../components/landing/CustomCursor";
import { levelsAPI } from "../utils/api";
import { loadCoursePhase } from "../config/curriculumLoader";
import { clearPhaseChallengeTimers } from "../utils/challengeTimer";
import curriculumLimits from "../config/curriculumLimits";

const PAGE_BG = {
  red: "#0d0202",
  blue: "#020712",
  green: "#020c06",
  purple: "#08020f",
};

export const GenericPhaseLevelsPage = () => {
  const { courseId, phaseId } = useParams();
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  const [completedLevels, setCompletedLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(true);
  const [phaseLevelsData, setPhaseLevelsData] = useState({});
  const [loadedCurriculumKey, setLoadedCurriculumKey] = useState(null);
  const [selectedLevelNum, setSelectedLevelNum] = useState(1);

  const phaseNum = Number(phaseId?.replace("phase", "") || "1");
  const curriculumKey = `${courseId}:${phaseNum}`;
  const TOTAL_LEVELS = Math.min(
    curriculumLimits.maxLevelsPerPhase,
    Object.keys(phaseLevelsData).length || 10,
  );

  // Themes mapping
  const themes = {
    red: {
      accent: "#ef4444",
      accentLight: "rgba(239, 68, 68, 0.15)",
      bgGradient: "from-red-950 via-slate-900 to-black",
      nodeGlow: "shadow-[0_0_15px_rgba(239,68,68,0.5)]",
      lineColor: "stroke-red-900",
    },
    blue: {
      accent: "#3b82f6",
      accentLight: "rgba(59, 130, 246, 0.15)",
      bgGradient: "from-blue-950 via-slate-900 to-black",
      nodeGlow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
      lineColor: "stroke-blue-900",
    },
    green: {
      accent: "#10b981",
      accentLight: "rgba(16, 185, 129, 0.15)",
      bgGradient: "from-emerald-950 via-slate-900 to-black",
      nodeGlow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
      lineColor: "stroke-emerald-900",
    },
    purple: {
      accent: "#a855f7",
      accentLight: "rgba(168, 85, 247, 0.15)",
      bgGradient: "from-purple-950 via-slate-900 to-black",
      nodeGlow: "shadow-[0_0_15px_rgba(168,85,247,0.5)]",
      lineColor: "stroke-purple-900",
    },
  };

  const currentTheme = themes[themeKey] || themes.purple;
  const pageBg = PAGE_BG[themeKey] || PAGE_BG.purple;

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await levelsAPI.getProgress();
      const completed = response.data.completedLevels || [];
      
      // Filter for this specific course and phase
      const filtered = completed
        .filter((cl) => cl.course === courseId && cl.phase === phaseNum)
        .map((cl) => cl.level);
      
      setCompletedLevels(filtered);

      // Set default selected level to the first incomplete unlocked level
      let defaultSelect = 1;
      for (let i = 1; i <= TOTAL_LEVELS; i++) {
        if (i === 1 || filtered.includes(i - 1)) {
          defaultSelect = i;
          if (!filtered.includes(i)) {
            break;
          }
        }
      }
      setSelectedLevelNum(defaultSelect);
    } catch (error) {
      console.error("Error fetching progress:", error);
      setCompletedLevels([]);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, phaseNum, TOTAL_LEVELS]);

  useEffect(() => {
    clearPhaseChallengeTimers(courseId, phaseNum);
    let active = true;
    setIsCurriculumLoading(true);
    loadCoursePhase(courseId, phaseNum)
      .then((levels) => {
        if (active) {
          setPhaseLevelsData(levels || {});
          setLoadedCurriculumKey(curriculumKey);
        }
      })
      .catch((error) => {
        console.error('Unable to load course lessons:', error);
        if (active) {
          setPhaseLevelsData({});
          setLoadedCurriculumKey(curriculumKey);
        }
      })
      .finally(() => {
        if (active) setIsCurriculumLoading(false);
      });
    fetchProgress();
    return () => { active = false; };
  }, [courseId, phaseNum, curriculumKey, fetchProgress]);

  const isLevelUnlocked = (levelNum) => {
    if (levelNum === 1) return true;
    return completedLevels.includes(levelNum - 1);
  };

  const isLevelCompleted = (levelNum) => {
    return completedLevels.includes(levelNum);
  };

  const handleLevelStart = (levelNum) => {
    if (isLevelUnlocked(levelNum)) {
      navigate(`/levels/${courseId}/${phaseId}/level${levelNum}`);
    }
  };

  if (isLoading || isCurriculumLoading || loadedCurriculumKey !== curriculumKey) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-r-transparent mb-4"
            style={{ borderColor: currentTheme.accent, borderRightColor: "transparent" }}
          />
          <p className="text-gray-400 font-techno text-sm tracking-widest">LOADING LEVEL GRAPH...</p>
        </div>
      </div>
    );
  }

  // Load level definitions from registry
  if (!Object.keys(phaseLevelsData).length) {
    return <Navigate to="/levels-mode" replace />;
  }
  const selectedLevel = phaseLevelsData[selectedLevelNum] || {
    title: `Level ${selectedLevelNum}`,
    description: "No challenge description provided.",
    timeLimit: 300,
    testCases: []
  };

  const completedCount = new Set(completedLevels.filter((l) => l <= TOTAL_LEVELS)).size;
  const progressPercent = Math.round((completedCount / TOTAL_LEVELS) * 100);

  // SVG Circular progress details
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Preserve the original S-curve for the current ten-stage phases. Larger
  // phases use a scrollable, keyboard-friendly serpentine map.
  const compactNodePositions = [
    { x: 80, y: 320 },   // L1
    { x: 190, y: 220 },  // L2
    { x: 300, y: 150 },  // L3
    { x: 420, y: 240 },  // L4
    { x: 500, y: 360 },  // L5
    { x: 620, y: 280 },  // L6
    { x: 740, y: 160 },  // L7
    { x: 630, y: 80 },   // L8
    { x: 500, y: 100 },  // L9
    { x: 380, y: 60 }    // L10
  ];
  const mapColumns = 10;
  const mapRows = Math.ceil(TOTAL_LEVELS / mapColumns);
  const mapWidth = TOTAL_LEVELS <= 10 ? 850 : 1000;
  const mapHeight = TOTAL_LEVELS <= 10 ? 380 : Math.max(380, mapRows * 96 + 60);
  const nodePositions = Array.from({ length: TOTAL_LEVELS }, (_, index) => {
    if (TOTAL_LEVELS <= 10) return compactNodePositions[index];
    const row = Math.floor(index / mapColumns);
    const offset = index % mapColumns;
    const column = row % 2 === 0 ? offset : mapColumns - offset - 1;
    return { x: 50 + column * 96, y: 50 + row * 96 };
  });

  return (
    <div
      className={`h-screen w-screen flex flex-col text-slate-100 overflow-hidden font-sans`}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${pageBg} 0%, #030008 100%)`,
        transition: "background 0.5s ease"
      }}
    >
      <CustomCursor theme={currentTheme} />

      <Navbar
        currentPage={`${courseId.toUpperCase()} PHASE ${phaseNum}`}
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        themes={themes}
        currentTheme={currentTheme}
      />

      {/* Main layout container: grid layout, 100% viewport height minus navbar */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6" style={{ height: "calc(100vh - 64px)" }}>
        
        {/* PANEL 1: Left Dashboard Sidebar (300px) */}
        <div className="w-[320px] shrink-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Neon side accent line */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1" 
            style={{ backgroundColor: currentTheme.accent }}
          />

          <div>
            {/* Back button */}
            <button
              onClick={() => navigate(`/phases/${courseId}`)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors duration-300 mb-6 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Phases
            </button>

            {/* Course Title and Phase info */}
            <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">
              {courseId} Curriculum
            </span>
            <h1 className="text-3xl font-black font-techno tracking-wide uppercase mt-1">
              PHASE <span style={{ color: currentTheme.accent }}>{phaseNum}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-mono uppercase tracking-wider">
              {TOTAL_LEVELS} Stages · Sequential Unlock
            </p>

            {/* Visual divider */}
            <div className="h-px bg-slate-800 my-5" />

            {/* Radial progress ring */}
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress Line */}
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke={currentTheme.accent}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute text-center">
                  <span className="text-3xl font-black font-techno tracking-tighter" style={{ color: currentTheme.accent }}>
                    {progressPercent}%
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                    Completed
                  </p>
                </div>
              </div>

              <div className="text-center mt-4">
                <span className="text-xs font-bold text-slate-300">
                  {completedCount} of {TOTAL_LEVELS} Finished
                </span>
              </div>
            </div>
          </div>

          {/* Footer stats or quick tips */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Gamepad2 size={13} style={{ color: currentTheme.accent }} />
              Cyber-Engine Level Link
            </span>
          </div>
        </div>

        {/* PANEL 2: Interactive Cyber Level Graph (Flex-grow) */}
        <div className="flex-1 bg-slate-900/40 border border-slate-850 rounded-2xl relative overflow-hidden backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentTheme.accent }} />
              Active Level Map (Select Node)
            </span>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <div className="w-2 h-2 rounded-full bg-slate-800" /> Locked
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentTheme.accent }} /> Active
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Passed
              </div>
            </div>
          </div>

          <div className="flex-1 relative overflow-auto p-4 select-none">
            <div className="relative mx-auto shrink-0" style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}>
            {/* Connection Wires Drawing Container */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${mapWidth} ${mapHeight}`} aria-hidden="true">
              <defs>
                {/* Neon Glow filters */}
                <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Draw individual line segments for dynamic styling */}
              {Array.from({ length: TOTAL_LEVELS - 1 }).map((_, i) => {
                const start = nodePositions[i];
                const end = nodePositions[i + 1];
                const sourceCompleted = isLevelCompleted(i + 1);
                const targetUnlocked = isLevelUnlocked(i + 2);

                let strokeColor = "rgba(255,255,255,0.08)";
                let isDashed = true;
                let strokeWidth = "2";
                let opacity = 0.4;
                let useGlow = false;

                if (sourceCompleted) {
                  // The player has finished the start level of this segment
                  strokeColor = currentTheme.accent;
                  isDashed = false;
                  strokeWidth = "3.5";
                  opacity = 0.95;
                  useGlow = true;
                } else if (targetUnlocked) {
                  // Path is unlocked but not yet passed
                  strokeColor = currentTheme.accent;
                  isDashed = true;
                  strokeWidth = "2.5";
                  opacity = 0.6;
                } else {
                  // Locked segment
                  strokeColor = "rgba(255,255,255,0.1)";
                  isDashed = true;
                  strokeWidth = "2";
                  opacity = 0.25;
                }

                return (
                  <g key={i}>
                    {/* Shadow/Glow layer if completed */}
                    {useGlow && (
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={strokeColor}
                        strokeWidth={parseFloat(strokeWidth) + 4}
                        opacity={0.4}
                        filter="url(#neon-glow)"
                      />
                    )}
                    {/* Main connector line */}
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isDashed ? "6 4" : "none"}
                      opacity={opacity}
                      className="transition-all duration-500"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Level Nodes Mapping */}
            <div className="absolute inset-0">
              {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map((lvlNum) => {
                const pos = nodePositions[lvlNum - 1];
                const unlocked = isLevelUnlocked(lvlNum);
                const completed = isLevelCompleted(lvlNum);
                const isSelected = selectedLevelNum === lvlNum;

                let nodeBg = "bg-slate-900 border-slate-750 text-slate-500 cursor-not-allowed";
                let hoverStyle = "";

                if (unlocked) {
                  if (completed) {
                    nodeBg = "bg-emerald-950/70 border-emerald-500 text-emerald-300 cursor-pointer";
                    hoverStyle = "hover:scale-110 hover:border-emerald-400";
                  } else {
                    nodeBg = `bg-slate-900 border-slate-100 text-slate-100 cursor-pointer ${isSelected ? 'border-2' : ''}`;
                    hoverStyle = "hover:scale-110";
                  }
                }

                return (
                  <button
                    type="button"
                    key={lvlNum}
                    aria-label={`Stage ${lvlNum}, ${completed ? 'completed' : unlocked ? 'available' : 'locked'}`}
                    aria-current={isSelected ? 'true' : undefined}
                    disabled={!unlocked}
                    onClick={() => setSelectedLevelNum(lvlNum)}
                    className={`absolute flex items-center justify-center w-12 h-12 rounded-full border p-0 transition-all duration-300 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${nodeBg} ${hoverStyle} ${
                      isSelected ? `${currentTheme.nodeGlow} scale-110` : ""
                    }`}
                    style={{
                      left: `${pos.x - 24}px`,
                      top: `${pos.y - 24}px`,
                      borderColor: isSelected ? currentTheme.accent : undefined,
                      boxShadow: isSelected ? `0 0 15px ${currentTheme.accent}` : completed ? `0 0 8px rgba(16,185,129,0.3)` : undefined
                    }}
                  >
                    {/* Node status indicators */}
                    {completed ? (
                      <Check size={16} strokeWidth={3} />
                    ) : !unlocked ? (
                      <Lock size={12} className="text-slate-600" />
                    ) : (
                      <span className="font-mono text-sm font-black tracking-tighter">{lvlNum}</span>
                    )}

                    {/* Small pulsing radar indicator for active unlocked level */}
                    {unlocked && !completed && !isSelected && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: currentTheme.accent, opacity: 0.7 }} />
                    )}
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: Level Details Panel (360px) */}
        <div className="w-[360px] shrink-0 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md shadow-2xl relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase font-mono">
                Stage {selectedLevelNum} Preview
              </span>
              <span 
                className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ 
                  backgroundColor: isLevelCompleted(selectedLevelNum) ? 'rgba(16,185,129,0.15)' : isLevelUnlocked(selectedLevelNum) ? `${currentTheme.accent}20` : 'rgba(255,255,255,0.05)',
                  color: isLevelCompleted(selectedLevelNum) ? '#10b981' : isLevelUnlocked(selectedLevelNum) ? currentTheme.accent : '#64748b'
                }}
              >
                {isLevelCompleted(selectedLevelNum) ? 'Completed' : isLevelUnlocked(selectedLevelNum) ? 'Available' : 'Locked'}
              </span>
            </div>

            <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-3">
              {selectedLevel.title}
            </h2>

            <div className="mb-5 bg-slate-950/30 p-4 rounded-xl border border-slate-850 text-[11px] text-slate-400 font-mono leading-relaxed space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar">
              <p className="text-slate-200 font-bold mb-1 uppercase tracking-wide">🚀 Challenge Workspace Guide</p>
              <p>Welcome to Stage {selectedLevelNum}! Once you start, you will enter our multi-panel IDE editor featuring:</p>
              <ul className="list-decimal pl-4 space-y-1.5 text-slate-350">
                <li><strong>Objective Panel (Left)</strong>: Read stage descriptions and active verification requirements.</li>
                <li><strong>IDE Code Editor (Center)</strong>: A tabbed workspace to write solution script files.</li>
                <li><strong>Interactive Console (Center Bottom)</strong>: Toggles to display compiler output and debugging messages.</li>
                <li><strong>Actions & Preview Panel (Right)</strong>: Displays a countdown timer, Compile/Submit keys, and preview output tabs to verify your work.</li>
              </ul>
              <p className="mt-1 text-yellow-500/80">💡 Goal: Solve all checks, compile successfully, and submit to earn +50 XP!</p>
            </div>

            <div className="mt-5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2.5 block">
                Workspace Contents
              </span>
              <div className="space-y-2.5 text-[11.5px] text-slate-300 bg-slate-950/30 p-4 border border-slate-850 rounded-xl font-mono leading-relaxed">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
                  <span>💻 Interactive Live Code Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
                  <span>🧪 Dynamic Test Cases Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
                  <span>⚙️ Developer Terminal & Preview Viewports</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
                  <span>⏱️ Time Limit: {Math.floor(selectedLevel.timeLimit / 60)} mins ({selectedLevel.timeLimit}s)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            {isLevelUnlocked(selectedLevelNum) ? (
              <button
                type="button"
                onClick={() => handleLevelStart(selectedLevelNum)}
                className="w-full font-techno font-bold text-white uppercase rounded-xl py-3.5 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 group cursor-pointer"
                style={{
                  background: currentTheme.accent,
                  boxShadow: `0 4px 15px ${currentTheme.accent}55`,
                  fontSize: "13px",
                  letterSpacing: "0.15em"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 6px 20px ${currentTheme.accent}88`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 4px 15px ${currentTheme.accent}55`;
                }}
              >
                <Play size={15} fill="white" className="group-hover:translate-x-0.5 transition-transform" />
                Start Challenge
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full font-techno font-bold text-slate-500 uppercase rounded-xl py-3.5 flex items-center justify-center gap-2 bg-slate-800/40 border border-slate-800 cursor-not-allowed text-xs tracking-wider"
              >
                <Lock size={14} />
                Stage Locked (Pass Prev Level)
              </button>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default GenericPhaseLevelsPage;
