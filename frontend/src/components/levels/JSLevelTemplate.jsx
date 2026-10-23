import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, Play, Send, Clock, CheckCircle2, XCircle, X, Terminal, Eye, FileCode } from "lucide-react";
import { Navbar } from "../Navbar";
import { CustomCursor } from "../landing/CustomCursor";
import { levelsAPI, validationAPI, runtimeAPI } from "../../utils/api";
import { readChallengeTimer, saveChallengeTimer } from "../../utils/challengeTimer";
import LessonGuide from "./LessonGuide";

const PAGE_BG = {
  red: "#0d0202",
  blue: "#020712",
  green: "#020c06",
  purple: "#08020f",
};

const JSLevelTemplate = ({ challenge, course, phase, levelNumber }) => {
  const navigate = useNavigate();
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [code, setCode] = useState(challenge.starterCode);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [previewTab, setPreviewTab] = useState("expected"); // 'expected' or 'outcome'
  const [testResults, setTestResults] = useState(
    challenge.testCases.map((_, index) => ({ id: index + 1, passed: false }))
  );
  
  const timerKey = `${course}_phase${phase}_level${levelNumber}_timer`;
  const [initialTimer] = useState(() => readChallengeTimer(timerKey, challenge.timeLimit));
  const [timeLeft, setTimeLeft] = useState(initialTimer.timeLeft);
  const [isRunning, setIsRunning] = useState(initialTimer.isRunning);
  
  const [showExitModal, setShowExitModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [levelResult, setLevelResult] = useState(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [completionProof, setCompletionProof] = useState(null);
  const [claimedXp, setClaimedXp] = useState(50);
  const [actualOutput, setActualOutput] = useState("");
  const editorRef = useRef(null);
  const codeRef = useRef(code);

  const themes = {
    red: {
      accent: "#ef4444",
      bgGradient: "from-red-950 via-slate-900 to-black",
      panelBg: "bg-red-950/20 border-red-900/50",
    },
    blue: {
      accent: "#3b82f6",
      bgGradient: "from-blue-950 via-slate-900 to-black",
      panelBg: "bg-blue-950/20 border-blue-900/50",
    },
    green: {
      accent: "#10b981",
      bgGradient: "from-emerald-950 via-slate-900 to-black",
      panelBg: "bg-emerald-950/20 border-emerald-900/50",
    },
    purple: {
      accent: "#a855f7",
      bgGradient: "from-purple-950 via-slate-900 to-black",
      panelBg: "bg-purple-950/20 border-purple-900/50",
    },
  };

  const currentTheme = themes[themeKey] || themes.purple;
  const pageBg = PAGE_BG[themeKey] || PAGE_BG.purple;

  useEffect(() => {
    localStorage.setItem('themeKey', themeKey);
  }, [themeKey]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) saveChallengeTimer(timerKey, timeLeft);
    else if (timeLeft === 0) saveChallengeTimer(timerKey, 0);
  }, [timeLeft, isRunning, timerKey]);

  useEffect(() => {
    return () => {
      const isRefresh = performance.getEntriesByType('navigation')[0]?.type === 'reload';
      if (!isRefresh) {
        sessionStorage.removeItem(timerKey);
      }
    };
  }, [timerKey]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft !== 0 || showResultModal) return;
    setIsRunning(false);
    setLevelResult('lose');
    setShowResultModal(true);
    setConsoleOutput((prev) => [...prev, {
      message: "⏰ Time's up!",
      type: 'error',
      timestamp: new Date().toLocaleTimeString(),
    }]);
  }, [timeLeft, showResultModal]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addConsoleMessage = (message, type = "info") => {
    setConsoleOutput((prev) => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleCompile = async () => {
    if (isCompiling || isRunningCode) return;
    
    setIsCompiling(true);
    setCanSubmit(false);
    setCompletionProof(null);
    setConsoleOutput([]);
    addConsoleMessage("🔄 Checking JavaScript requirements with the server...", "info");

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      addConsoleMessage("❌ Error: Code is empty", "error");
      setIsCompiling(false);
      return;
    }

    try {
      addConsoleMessage("Checking task criteria...", "info");
      
      const response = await validationAPI.validateJS({
        userCode: trimmedCode,
        levelTitle: challenge.title,
        levelDescription: challenge.description,
        testCases: challenge.testCases,
        expectedOutput: challenge.expectedOutput,
        course,
        phase,
        level: levelNumber,
      });

      if (codeRef.current !== trimmedCode) return;
      const validation = response.data.validation;

      if (validation.errors && validation.errors.length > 0) {
        addConsoleMessage("❌ Validation found issues:", "error");
        let errorLines = [];
        validation.errors.forEach((error) => {
          addConsoleMessage(`   ${error.message}`, "error");
          errorLines.push(`Finding: ${error.message} (${error.type || 'ValidationFinding'})`);
        });
        setActualOutput(`--- VALIDATION FINDINGS ---\n${errorLines.join("\n")}`);
      } else {
        addConsoleMessage("✅ Requirement review finished.", "success");
        setActualOutput(`=== SOURCE CHECK — NOT EXECUTED ===\nSummary: ${validation.summary}\n\n--- Requirement review ---\n${validation.testResults.map(tr => `[Requirement ${tr.id}] ${tr.passed ? 'PASSED' : 'FAILED'}: ${tr.message}`).join("\n")}`);
      }

      const newTestResults = validation.testResults.map(tr => ({
        id: tr.id,
        passed: tr.passed
      }));
      setTestResults(newTestResults);

      const testsPassed = validation.allTestsPassed;
      const proof = response.data.completionProof;
      setCompletionProof(typeof proof === 'string' ? proof : null);
      const allPassed = testsPassed && typeof proof === 'string';
      setCanSubmit(allPassed);

      if (testsPassed && !allPassed) {
        addConsoleMessage("⚠️ The result could not be secured. Run validation again before submitting.", "warning");
      }

      if (allPassed) {
        addConsoleMessage("🎉 All source requirements were reviewed successfully. Submit to claim XP.", "success");
      } else {
        addConsoleMessage("⚠️ Some source requirements still need changes. Review the task constraints.", "warning");
        
        validation.testResults.forEach((test) => {
          if (!test.passed) {
            addConsoleMessage(`   ❌ Test ${test.id}: ${test.message}`, "warning");
          }
        });
      }

      setPreviewTab("outcome");
      
    } catch (error) {
      console.error('Validation error:', error);
      addConsoleMessage("❌ Validation request failed. Try again.", "error");
      setActualOutput(`Validation request error: ${error.message || error}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      addConsoleMessage("❌ Cannot submit: Not all checkpoints are verified", "error");
      return;
    }

    if (timeLeft <= 0) {
      addConsoleMessage("❌ Cannot submit: Time limit exceeded", "error");
      return;
    }

    addConsoleMessage("🎉 Level completed successfully!", "success");
    setIsRunning(false);
    setLevelResult('win');
    setShowResultModal(true);
  };

  const handleRunCode = async () => {
    if (isRunningCode || isCompiling) return;
    const sourceCode = code.trim();
    if (!sourceCode) {
      addConsoleMessage("Add JavaScript before running it.", "error");
      return;
    }

    setIsRunningCode(true);
    setPreviewTab("outcome");
    setConsoleOutput([]);
    setActualOutput('Running JavaScript in the isolated code runner...');
    addConsoleMessage("Running JavaScript in the isolated code runner...", "info");
    try {
      const { data } = await runtimeAPI.run('javascript', sourceCode);
      const labels = { completed: 'Completed', error: 'Program error', timeout: 'Time limit reached', output_limit: 'Output limit reached' };
      const details = [
        '=== PROGRAM RUN — DOES NOT COMPLETE THE LEVEL ===',
        `Status: ${labels[data.status] || data.status}`,
        data.exitCode === null ? null : `Exit code: ${data.exitCode}`,
        `Runtime: ${data.durationMs} ms`,
        data.stdout ? `\n--- Output ---\n${data.stdout}` : '\nNo standard output.',
        data.stderr ? `\n--- Diagnostics ---\n${data.stderr}` : null,
      ].filter(Boolean).join('\n');
      setActualOutput(details);
      addConsoleMessage(labels[data.status] || 'Run finished.', data.status === 'completed' ? 'success' : 'warning');
    } catch (error) {
      const message = error.response?.data?.message || 'The isolated code runner is unavailable.';
      setActualOutput(`=== PROGRAM RUN UNAVAILABLE ===\n${message}\n\nProgram runs never award level rewards.`);
      addConsoleMessage(message, 'error');
    } finally {
      setIsRunningCode(false);
    }
  };

  const handleClaimReward = async () => {
    if (rewardClaimed) return;
    if (!completionProof) {
      addConsoleMessage("❌ Validate your current code before claiming the reward.", "error");
      return;
    }
    
    setIsClaimingReward(true);
    
    try {
      const response = await levelsAPI.completeLevel({
        course,
        phase,
        level: levelNumber,
        completionProof,
        userCode: code,
      });
      setClaimedXp(response.data.xpEarned || 0);
      
      setRewardClaimed(true);
      window.dispatchEvent(new Event('pointsUpdated'));
      
      setTimeout(() => {
        navigate(`/levels/${course}/phase${phase}`);
      }, 1500);
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert(error.response?.data?.message || 'Error claiming reward');
    } finally {
      setIsClaimingReward(false);
    }
  };


  const handleCodeChange = (e) => {
    const nextCode = e.target.value;
    codeRef.current = nextCode;
    setCode(nextCode);
    setCanSubmit(false);
    setCompletionProof(null);
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    navigate(`/levels/${course}/phase${phase}`);
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // Generate line numbers for the custom editor layout
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  const pct = challenge.timeLimit > 0 ? (timeLeft / challenge.timeLimit) : 1;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (pct * circ);

  const radialBackground = `radial-gradient(circle at 50% 50%, ${pageBg} 0%, #020005 100%)`;
  const gridBackground = `linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)`;

  const cyberPanelStyle = {
    background: 'rgba(5, 5, 12, 0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderColor: `${currentTheme.accent}20`,
    boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 15px -3px ${currentTheme.accent}15, inset 0 0 20px -5px ${currentTheme.accent}03`,
  };

  const CornerDecals = () => (
    <>
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l pointer-events-none" style={{ borderColor: `${currentTheme.accent}60` }} />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r pointer-events-none" style={{ borderColor: `${currentTheme.accent}60` }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l pointer-events-none" style={{ borderColor: `${currentTheme.accent}60` }} />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r pointer-events-none" style={{ borderColor: `${currentTheme.accent}60` }} />
    </>
  );

  return (
    <div
      className="h-screen w-screen flex flex-col text-slate-100 overflow-hidden font-sans relative"
      style={{
        background: radialBackground,
        backgroundImage: `${radialBackground}, ${gridBackground}`,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        transition: "background 0.5s ease"
      }}
    >
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
        .crt-console {
          position: relative;
          overflow: hidden;
        }
        .crt-console::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%);
          background-size: 100% 4px;
          z-index: 10;
          pointer-events: none;
          opacity: 0.4;
        }
        .crt-scanline {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 10%, rgba(255, 255, 255, 0.03) 50%, rgba(255,255,255,0) 90%, rgba(255,255,255,0));
          animation: scanline 8s linear infinite;
          pointer-events: none;
          z-index: 11;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${currentTheme.accent}30;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${currentTheme.accent}70;
        }
      `}</style>

      <CustomCursor theme={currentTheme} />

      <Navbar
        currentPage={`${course.toUpperCase()} LEVEL ${levelNumber}`}
        themeKey={themeKey}
        setThemeKey={setThemeKey}
        themes={themes}
        currentTheme={currentTheme}
      />

      {/* Main split-pane workspace (100% viewport, no scrolling) */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4" style={{ height: "calc(100vh - 64px)" }}>
        
        {/* PANEL 1: Objective & Test Checkpoints (Left, width 25%) */}
        <div className="w-[320px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
          {/* Objective Box */}
          <div 
            className="flex-[4] border rounded-xl p-4 overflow-hidden backdrop-blur-md flex flex-col relative"
            style={cyberPanelStyle}
          >
            <CornerDecals />
            <span className="text-[8px] font-bold tracking-[0.25em] text-slate-500 uppercase font-mono block mb-1">
              {'//'} Objective Level Instructions
            </span>
            <h2 className="text-md font-bold font-mono tracking-wide text-white uppercase mb-2 flex items-center gap-1.5" style={{ textShadow: `0 0 10px ${currentTheme.accent}30` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.accent }} />
              {challenge.title}
            </h2>
            <div className="text-xs text-slate-300 leading-relaxed font-mono flex-1 overflow-y-auto custom-scrollbar pr-1">
              {challenge.description}
              <LessonGuide challenge={challenge} />
            </div>
          </div>

          {/* Verification Step Box */}
          <div 
            className="flex-[6] border rounded-xl p-4 overflow-hidden backdrop-blur-md flex flex-col relative"
            style={cyberPanelStyle}
          >
            <CornerDecals />
            <span className="text-[8px] font-bold tracking-[0.25em] text-slate-500 uppercase font-mono block mb-3">
              {'//'} REQUIREMENT_REVIEW ({challenge.testCases.length})
            </span>
            <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
              {challenge.testCases.map((test) => {
                const isPassed = testResults.find(tr => tr.id === test.id)?.passed;
                return (
                  <div 
                    key={test.id} 
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-300 relative overflow-hidden ${
                      isPassed 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                        : 'bg-slate-950/30 border-slate-850/80 text-slate-400'
                    }`}
                    style={isPassed ? { boxShadow: '0 0 8px rgba(16, 185, 129, 0.05)' } : undefined}
                  >
                    {isPassed && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500" />}
                    <div 
                      className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[9px] text-white transition-all duration-300 ${
                        isPassed ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                      style={{ 
                        background: isPassed ? undefined : `linear-gradient(135deg, ${currentTheme.accent}90 0%, ${currentTheme.accent}30 100%)`,
                        boxShadow: isPassed ? '0 0 10px rgba(16, 185, 129, 0.4)' : undefined
                      }}
                    >
                      {test.id}
                    </div>
                    <span className="text-[10px] leading-snug font-medium pt-0.5 font-mono">{test.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL 2: Editor Workspace & Drawer Terminal Console (Center, flex-grow) */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          {/* Code Editor */}
          <div 
            className="flex-1 border rounded-xl overflow-hidden shadow-2xl flex flex-col relative"
            style={cyberPanelStyle}
          >
            <CornerDecals />
            {/* Editor tab bar */}
            <div className="bg-slate-950/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-900/60 relative">
              <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent w-32 transition-all duration-300" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${currentTheme.accent}, transparent)` }} />
              <span className="text-gray-300 text-xs font-mono flex items-center gap-2 font-bold tracking-wide">
                <FileCode size={13} style={{ color: currentTheme.accent }} />
                script.js
                <span className="text-[8px] bg-slate-900 text-slate-500 border border-slate-800/80 px-1 rounded-sm uppercase tracking-wider font-mono">JS ES6</span>
              </span>
              <span className="text-slate-500 text-[8px] font-mono tracking-widest uppercase">
                [SYS_ENV: READY]
              </span>
            </div>

            {/* Custom line numbers textarea wrapper */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Line numbers column */}
              <div className="w-10 bg-slate-950/30 text-right pr-3 pt-4 select-none font-mono text-xs text-slate-650 border-r border-slate-900/40" style={{ borderRightColor: `${currentTheme.accent}15` }}>
                {lineNumbers.map(num => (
                  <div key={num} className="leading-6 font-medium text-slate-550">{num}</div>
                ))}
              </div>

              {/* Textarea Code Space */}
              <textarea
                ref={editorRef}
                value={code}
                onChange={handleCodeChange}
                className="flex-1 h-full bg-transparent text-slate-100 font-mono text-xs p-4 resize-none focus:outline-none leading-6 overflow-y-auto custom-scrollbar"
                style={{
                  tabSize: 4,
                  caretColor: currentTheme.accent
                }}
                spellCheck="false"
              />
            </div>
          </div>

          {/* Dockable Console Box */}
          <div 
            className={`transition-all duration-300 border rounded-xl overflow-hidden flex flex-col relative ${
              isConsoleOpen ? 'h-[160px]' : 'h-10'
            }`}
            style={cyberPanelStyle}
          >
            <CornerDecals />
            <div 
              className="bg-slate-950/80 px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-slate-900/60 relative"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            >
              <span className="text-gray-300 text-xs font-mono flex items-center gap-2 font-bold">
                <Terminal size={13} className="text-yellow-500 animate-pulse" />
                SYSTEM DIAGNOSTIC CONSOLE
              </span>
              {isConsoleOpen ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {isConsoleOpen && (
              <div className="flex-1 bg-[#05050b]/90 overflow-y-auto p-3.5 space-y-1.5 custom-scrollbar relative crt-console select-text">
                <div className="crt-scanline" />
                {consoleOutput.length === 0 ? (
                  <p className="text-gray-500 text-xs font-mono flex items-center gap-1.5">
                    <span className="animate-pulse" style={{ color: currentTheme.accent }}>●</span> Requirement checker ready...
                  </p>
                ) : (
                  consoleOutput.map((log, index) => (
                    <div key={index} className="font-mono text-[11px] leading-relaxed flex items-start gap-1">
                      <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>{" "}
                      <span
                        className="font-mono text-[11px]"
                        style={{
                          color:
                            log.type === "error"
                              ? "#f87171"
                              : log.type === "success"
                              ? "#34d399"
                              : log.type === "warning"
                              ? "#fbbf24"
                              : "#a1a1aa",
                          textShadow: log.type === "error" || log.type === "success" 
                            ? `0 0 8px ${log.type === "error" ? "rgba(248,113,113,0.25)" : "rgba(52,211,153,0.25)"}`
                            : undefined
                        }}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 3: Timer, Preview Tabs & Actions (Right, width 30%) */}
        <div className="w-[360px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* Timer card */}
          <div 
            className="rounded-xl border p-4 shadow-xl shrink-0 flex flex-col gap-3.5 relative overflow-hidden"
            style={{ 
              ...cyberPanelStyle,
              borderColor: timeLeft < 60 ? "rgba(239,68,68,0.4)" : `${currentTheme.accent}20` 
            }}
          >
            <CornerDecals />
            
            {/* SVG Tactical Timer Gauge Layout */}
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                {/* Expanding outer pulse */}
                <div 
                  className={`absolute inset-0.5 rounded-full border opacity-20 ${timeLeft < 60 ? 'animate-ping border-red-500' : 'border-slate-500'}`} 
                  style={{ 
                    animationDuration: timeLeft < 60 ? '1s' : '2.5s',
                    borderColor: timeLeft < 60 ? undefined : currentTheme.accent 
                  }} 
                />
                
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" fill="transparent" />
                  <circle cx="28" cy="28" r={radius}
                    stroke={timeLeft < 60 ? '#ef4444' : currentTheme.accent}
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circ}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                  />
                </svg>
                <Clock className="absolute w-4 h-4 text-white/35" />
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-[8px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                  [SYS_TIME_CONSTRAINT]
                </span>
                <span 
                  className="font-mono text-2xl font-black tracking-wider leading-none"
                  style={{ 
                    color: timeLeft < 60 ? "#ef4444" : "#ffffff", 
                    textShadow: `0 0 10px ${timeLeft < 60 ? 'rgba(239,68,68,0.45)' : `${currentTheme.accent}40`}` 
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Run Actions row */}
            <div className="grid grid-cols-4 gap-2 mt-1 z-10">
              <button
                onClick={handleCompile}
                disabled={isCompiling || isRunningCode || !isRunning}
                className="font-techno font-bold text-white uppercase rounded-lg py-2.5 text-[9px] tracking-wider transition-all duration-300 hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden group border border-white/5"
                style={{ 
                  background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}bf 100%)`,
                  boxShadow: `0 0 12px -2px ${currentTheme.accent}50` 
                }}
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <FileCode size={10} />
                Validate
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunningCode || isCompiling || !isRunning}
                className="font-techno font-bold text-white uppercase rounded-lg py-2.5 text-[9px] tracking-wider transition-all duration-300 hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden group border border-white/5"
                style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)', boxShadow: '0 0 12px -2px rgba(20,184,166,0.4)' }}
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <Play size={10} fill="white" />
                {isRunningCode ? 'Running…' : 'Run Code'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit || !isRunning}
                className="font-techno font-bold text-white uppercase rounded-lg py-2.5 text-[9px] tracking-wider transition-all duration-300 hover:scale-[1.03] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden group border border-white/5"
                style={{ 
                  background: canSubmit ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
                  boxShadow: canSubmit ? "0 0 12px -2px rgba(16,185,129,0.5)" : "none"
                }}
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <Send size={10} fill="white" />
                Submit
              </button>

              <button
                onClick={handleExit}
                className="font-techno font-bold text-white uppercase rounded-lg py-2.5 text-[9px] tracking-wider transition-all duration-300 hover:scale-[1.03] flex items-center justify-center gap-1.5 bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 cursor-pointer shadow-lg shadow-red-950/40 relative overflow-hidden group border border-white/5"
              >
                <span className="absolute inset-0 w-full h-full bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <X size={10} />
                Exit
              </button>
            </div>
          </div>

          {/* Unified Console Viewport box */}
          <div 
            className="flex-1 border rounded-xl overflow-hidden shadow-2xl flex flex-col relative"
            style={cyberPanelStyle}
          >
            <CornerDecals />
            {/* Viewport tabs */}
            <div className="bg-slate-950/80 border-b border-slate-900/60 px-3 py-2 flex items-center justify-between relative">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPreviewTab("expected")}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1 font-mono ${
                    previewTab === "expected" 
                      ? 'bg-white/10 text-white border border-white/10' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={previewTab === "expected" ? { textShadow: `0 0 8px ${currentTheme.accent}40` } : undefined}
                >
                  <CheckCircle2 size={10} />
                  Example Behavior
                </button>
                <button
                  onClick={() => setPreviewTab("outcome")}
                  className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1 font-mono ${
                    previewTab === "outcome" 
                      ? 'bg-white/10 text-white border border-white/10' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={previewTab === "outcome" ? { textShadow: `0 0 8px ${currentTheme.accent}40` } : undefined}
                >
                  <Eye size={10} />
                  Validation Report
                </button>
              </div>
              <span className="text-[8px] text-slate-500 font-mono tracking-widest">[SOURCE_CHECK]</span>
            </div>

            {/* Terminal simulation display area */}
            <div className="flex-1 bg-[#05050b]/95 p-4 overflow-y-auto font-mono text-xs select-text leading-relaxed custom-scrollbar crt-console">
              <div className="crt-scanline" />
              {previewTab === "expected" ? (
                <div className="relative z-10">
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">{'//'} STATIC_REFERENCE — NOT A PROGRAM RUN:</div>
                  <pre className="text-emerald-400 whitespace-pre-wrap font-mono leading-relaxed" style={{ textShadow: '0 0 8px rgba(52,211,153,0.15)' }}>{challenge.expectedOutputHint || challenge.expectedOutput}</pre>
                </div>
              ) : (
                actualOutput ? (
                  <div className="relative z-10">
                    <p className="mb-2 border border-amber-400/20 bg-amber-950/20 px-2 py-1 text-[9px] uppercase tracking-wider text-amber-200/80">Program output is separate from requirement review and never awards level rewards.</p>
                    <pre className="text-slate-100 whitespace-pre-wrap font-mono leading-relaxed">{actualOutput}</pre>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-550 text-xs text-center font-mono relative z-10">
                    <Terminal size={18} className="mb-2 text-slate-600 animate-pulse" />
                    <span>No validation report yet.</span>
                    <span className="text-[9px] text-slate-500 mt-1">Run Code uses an isolated runner. Validation controls level rewards.</span>
                  </div>
                )
              )}
            </div>
          </div>

        </div>

      </main>

      {/* EXIT MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div 
            className="border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center relative overflow-hidden"
            style={cyberPanelStyle}
          >
            <CornerDecals />
            
            <div className="w-12 h-12 bg-red-950/40 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <X size={20} className="text-red-500 animate-pulse" />
            </div>
            <h2 className="font-techno font-bold text-xl text-white mb-2 uppercase tracking-wider font-mono">
              Abandon Challenge?
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6 font-mono">
              Your active code progress for this stage will be lost. Are you sure you want to exit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 font-techno font-bold text-slate-400 uppercase rounded-xl py-3 border border-slate-800 hover:bg-slate-900/50 hover:text-white transition-all duration-300 font-mono text-[10px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 font-techno font-bold text-white uppercase rounded-xl py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 transition-all duration-300 shadow-md shadow-red-950/30 font-mono text-[10px]"
              >
                Quit Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div 
            className="border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center relative overflow-hidden"
            style={cyberPanelStyle}
          >
            <CornerDecals />

            {levelResult === 'win' ? (
              <>
                <div className="w-16 h-16 bg-emerald-950/40 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <h2 className="font-techno font-bold text-2xl text-white mb-2 uppercase tracking-wider font-mono">
                  🎉 Level Completed!
                </h2>
                <p className="text-slate-300 text-xs mb-4 font-mono">
                  Excellent work! You successfully solved Level {levelNumber}.
                </p>
                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 mb-5 flex items-center justify-center gap-2 relative">
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-xl animate-pulse" />
                  <span className="font-techno font-bold text-lg text-emerald-400 tracking-widest font-mono shadow-emerald-950" style={{ textShadow: '0 0 10px rgba(16,185,129,0.4)' }}>
                    +{claimedXp} XP POINTS
                  </span>
                </div>
                <button
                  onClick={handleClaimReward}
                  disabled={isClaimingReward || rewardClaimed}
                  className="w-full font-techno font-bold text-white uppercase rounded-xl py-3.5 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 relative overflow-hidden group shadow-lg font-mono text-[11px]"
                  style={{
                    background: rewardClaimed ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`,
                    boxShadow: rewardClaimed ? '0 0 15px rgba(16,185,129,0.4)' : `0 0 15px ${currentTheme.accent}40`,
                    letterSpacing: "0.15em"
                  }}
                >
                  <span className="absolute inset-0 w-full h-full bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                  {rewardClaimed ? "✓ Reward Claimed" : isClaimingReward ? "Claiming..." : "Claim Reward"}
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-950/40 border border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <XCircle size={28} className="text-red-500 animate-pulse" />
                </div>
                <h2 className="font-techno font-bold text-2xl text-white mb-2 uppercase tracking-wider font-mono">
                  Time Expired!
                </h2>
                <p className="text-slate-400 text-xs mb-5 leading-relaxed font-mono">
                  Keep coding! Challenges help your mind develop and build persistence. Ready to try again?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 font-techno font-bold text-white uppercase rounded-xl py-3 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 transition-all duration-300 shadow-md shadow-emerald-950/30 font-mono text-[10px]"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate(`/levels/${course}/phase${phase}`)}
                    className="flex-1 font-techno font-bold text-slate-400 uppercase rounded-xl py-3 border border-slate-800 hover:bg-slate-900/50 hover:text-white transition-all duration-300 font-mono text-[10px]"
                  >
                    Quit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JSLevelTemplate;
