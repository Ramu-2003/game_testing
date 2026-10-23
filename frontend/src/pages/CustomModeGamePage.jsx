import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Play, Trophy, Zap, BookOpen, Lock, Eye, Trash2 } from 'lucide-react';
import { computerModeAPI, profileAPI } from '../utils/api';
import { getSocket } from '../utils/socket';
import { buildHtmlPreview, buildSubmissionPreview } from '../utils/livePreview';

/* ── Theme map ─────────────────────────────────────────────────── */
const THEMES = {
  red:    { accent: '#ff5252', ui: '#ff6b6b', bg: '#050105' },
  blue:   { accent: '#0099ff', ui: '#00ccff', bg: '#00050f' },
  green:  { accent: '#00ff88', ui: '#00ff99', bg: '#000a05' },
  purple: { accent: '#a855f7', ui: '#d8b4fe', bg: '#060110' },
};

const PAGE_BG = '#010d12'; // fallback dark bg
const ext = l => ({ HTML: 'html', CSS: 'css', JavaScript: 'js', Python: 'py', Java: 'java' }[l] || 'txt');

// ── Animated Binary Panel ──
const BinaryPanel = ({ username, progress = 0, isTyping = false, color }) => {
  const ROWS = 18, COLS = 42;
  const [matrix, setMatrix] = useState(() =>
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => (Math.random() > 0.5 ? '1' : '0'))
    )
  );

  useEffect(() => {
    const speed = isTyping ? 60 : 300;
    const iv = setInterval(() => {
      setMatrix(prev =>
        prev.map(row =>
          row.map(c => (Math.random() > (isTyping ? 0.7 : 0.92) ? (c === '0' ? '1' : '0') : c))
        )
      );
    }, speed);
    return () => clearInterval(iv);
  }, [isTyping]);

  const totalCells = ROWS * COLS;
  const lit = Math.floor((progress / 100) * totalCells);
  let count = 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 14px', background: '#07090e',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 15,  color: '#94a3b8', fontWeight: 600 }}>
            {username}.enc [ENCRYPTED]
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isTyping && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: `${color}18`, border: `1px solid ${color}30`,
              borderRadius: 4, padding: '2px 8px',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: 'binaryPulse 0.5s infinite' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 15,  color, fontWeight: 700 }}>TYPING...</span>
            </div>
          )}
          <Lock size={12} style={{ color: `${color}60` }} />
          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: `${color}60` }}>OBFUSCATED</span>
        </div>
      </div>

      {/* Binary content */}
      <div style={{ flex: 1, padding: '12px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 15, fontWeight: 700, lineHeight: 1.6, userSelect: 'none' }}>
          {matrix.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 2, flexWrap: 'nowrap' }}>
              {row.map((cell, ci) => {
                const isLit = count++ < lit;
                return (
                  <span key={ci} style={{
                    color: isLit ? color : `${color}15`,
                    textShadow: isLit ? `0 0 5px ${color}80` : 'none',
                    transition: isTyping ? 'color 0.06s' : 'color 0.3s',
                  }}>{cell}</span>
                );
              })}
            </div>
          ))}
        </div>

        {/* Progress overlay bar */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: 2, transition: 'width 0.5s', boxShadow: `0 0 8px ${color}` }} />
        </div>
      </div>
    </div>
  );
};

// ── Reading Phase Overlay ──
const ReadingPhaseOverlay = ({ challenge, countdown, ac }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 500,
    background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
      padding: '10px 24px', borderRadius: 30,
      background: `${ac}12`, border: `1px solid 70`,
    }}>
      <BookOpen size={18} style={{ color: ac }} />
      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 16, color: ac, letterSpacing: 3 }}>
        READING PHASE — STUDY THE CHALLENGE
      </span>
      <Lock size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
    </div>

    {(() => {
      const ringColor = countdown <= 5 ? '#ef4444' : ac;
      const r = 46;
      const circumference = 2 * Math.PI * r;
      const offset = circumference * (1 - countdown / 15);
      return (
        <div style={{
          width: 120, height: 120, marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <svg viewBox="0 0 100 100" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            transform: 'rotate(-90deg)',
          }}>
            <circle cx="50" cy="50" r={r} fill="none"
              stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle cx="50" cy="50" r={r} fill="none"
              stroke={ringColor} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            boxShadow: `0 0 28px ${ringColor}50`,
          }} />
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 38,
            color: ringColor,
            textShadow: `0 0 20px ${ringColor}80`,
            zIndex: 1,
          }}>{countdown}</div>
        </div>
      );
    })()}

    <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 28, letterSpacing: 2 }}>
      {countdown <= 5 ? '⚠️ GET READY — TIMER STARTS SOON!' : 'Editor locked · Read the problem carefully'}
    </div>

    {challenge && (
      <div style={{
        maxWidth: 680, width: '100%',
        background: 'rgba(255,255,255,0.04)', border: `1px solid 70`,
        borderRadius: 16, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 16, borderRadius: 2, background: ac }} />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 18, color: 'white', letterSpacing: 2 }}>
            {challenge.title}
          </span>
        </div>
        <div style={{ borderLeft: `3px solid ${ac}`, paddingLeft: 16, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.7, marginBottom: 16 }}>
          {challenge.objective}
        </div>
        {challenge.testCases && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {challenge.testCases.map((tc, i) => (
              <div key={i} style={{
                padding: '4px 12px', borderRadius: 20,
                background: `${ac}10`, border: `1px solid ${ac}20`,
                fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: `${ac}90`,
              }}>
                Test {i + 1}{tc.description ? `: ${tc.description}` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

// ── Output Panel ──
// Player colors for multi-player
const PLAYER_COLORS = ['#00e5ff', '#ff6b35', '#a855f7', '#10b981'];

export default function CustomModeGamePage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const rd         = location.state || {};

  const totalRounds = Number(rd.rounds) || 3;
  const roomTime    = Number(rd.roomTime || rd.timeLimit) || 5;
  const language    = rd.language || 'JavaScript';
  const difficulty  = rd.difficulty || 'Moderate';
  const playerMode  = Number(rd.playerMode) || 2;
  const isSpectator = rd.isSpectator || false;

  // ── Dynamic theme from localStorage ──
  const [themeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const theme = THEMES[themeKey] || THEMES.purple;
  const ac    = theme.accent;

  const [roomId]      = useState(() => rd.roomId || 'CUSTOM');
  const [myUserId, setMyUserId]   = useState(() => rd.userId || null);

  const [challenge, setChallenge] = useState(() => rd.gameData?.challenge || null);
  const [loading, setLoading]     = useState(() => !rd.gameData?.challenge);
  const [currentRound, setCurrentRound] = useState(() => rd.gameData?.currentRound || 1);
  const [scores, setScores]             = useState({});
  const [players, setPlayers]           = useState(() => rd.gameData?.players || rd.players || []);
  const [opponentTyping, setOpponentTyping]     = useState({});
  const [opponentProgress, setOpponentProgress] = useState({});

  // Editor
  const [userCode, setUserCode]       = useState('');
  const userCodeRef = useRef(userCode);
  const [testResults, setTestResults] = useState([]);
  const [outputData, setOutputData]   = useState([]); // per-test output detail
  const [allPassed, setAllPassed]     = useState(false);
  const [completionProof, setCompletionProof] = useState(null);
  const [compiling, setCompiling]     = useState(false);
  const [logs, setLogs]               = useState([]);
  const [progress, setProgress]       = useState(0);
  const [previewTab, setPreviewTab]   = useState('tests');
  const [compiledOutput, setCompiledOutput] = useState('');
  const iframeRef = useRef(null);
  const expectedIframeRef = useRef(null);



  // Timer
  const totalMs    = roomTime * 60 * 1000;
  const initMs     = rd.gameData?.timer ? rd.gameData.timer * 1000 : totalMs;
  const [playerMs, setPlayerMs] = useState(initMs);
  const msCurRef   = useRef(initMs);
  const startRef   = useRef(null);
  const timerIdRef = useRef(null);

  // Reading phase
  const [readingPhase, setReadingPhase]         = useState(false);
  const [readingCountdown, setReadingCountdown] = useState(15);
  const readingDoneRef = useRef(false);

  // Modals
  const [exitModal, setExitModal]   = useState(false);
  const [roundModal, setRoundModal] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [nextRoundIn, setNextRoundIn] = useState(5);
  const roundEndedRef  = useRef(false);
  const typingTimerRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(p => [...p.slice(-80), { msg, type, ts: new Date().toLocaleTimeString() }]);
  }, []);

  const fmtMs = ms => {
    const t = Math.max(0, ms);
    const m = Math.floor(t / 60000);
    const s = Math.floor((t % 60000) / 1000);
    const c = Math.floor((t % 1000) / 10);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(c).padStart(2,'0')}`;
  };

  const startTimer = useCallback(() => {
    if (timerIdRef.current) return;
    startRef.current = Date.now();
    timerIdRef.current = setInterval(() => {
      const rem = Math.max(0, msCurRef.current - (Date.now() - startRef.current));
      setPlayerMs(rem);
      if (rem <= 0) { clearInterval(timerIdRef.current); timerIdRef.current = null; }
    }, 16);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIdRef.current) {
      msCurRef.current = Math.max(0, msCurRef.current - (Date.now() - startRef.current));
      clearInterval(timerIdRef.current); timerIdRef.current = null;
    }
  }, []);

  const startReadingPhase = useCallback(() => {
    if (readingDoneRef.current) return;
    setReadingPhase(true);
    setReadingCountdown(15);
    let remaining = 15;
    const iv = setInterval(() => {
      remaining -= 1;
      setReadingCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(iv);
        setReadingPhase(false);
        readingDoneRef.current = true;
        startTimer();
      }
    }, 1000);
  }, [startTimer]);

  // Profile fetch for userId
  useEffect(() => {
    if (!myUserId) {
      profileAPI.getProfile().then(r => setMyUserId(r.data.user._id)).catch(() => {});
    }
  }, [myUserId]);

  // Multiplayer init from route state
  const mpInitDone = useRef(false);
  useEffect(() => {
    if (mpInitDone.current) return;
    const gd = rd.gameData;
    if (!gd?.challenge) return;
    mpInitDone.current = true;
    setChallenge(gd.challenge);
    setCurrentRound(gd.currentRound || 1);
    setPlayers(gd.players || []);
    // ── FIX: initialize testResults array with false for each test case ──
    const tcLen = gd.challenge?.testCases?.length || 0;
    setTestResults(Array(tcLen).fill(null));
    setOutputData(Array(tcLen).fill(null));
    if (gd.timer) { msCurRef.current = gd.timer * 1000; setPlayerMs(gd.timer * 1000); }
    setLoading(false);
    setTimeout(() => startReadingPhase(), 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket listeners — re-register when myUserId is known
  useEffect(() => {
    const sock = getSocket();
    if (!sock) return;

    const onGameInit = (d) => {
      setChallenge(d.challenge);
      setCompletionProof(null);
      setCurrentRound(d.currentRound);
      setPlayers(d.players || []);
      const tcLen = d.challenge?.testCases?.length || 0;
      setTestResults(Array(tcLen).fill(null));
      setOutputData(Array(tcLen).fill(null));
      setLoading(false);
      startReadingPhase();
    };

    const onGameTick = (d) => {
      if (d.timer !== undefined) {
        msCurRef.current = d.timer * 1000;
        startRef.current = Date.now();
        setPlayerMs(d.timer * 1000);
      }
      if (d.players) {
        setPlayers(d.players);
        // ── FIX: update opponent progress map ──
        const prog = {};
        d.players.forEach(p => {
          if (p.userId !== myUserId) prog[p.userId] = p.progress ?? 0;
        });
        setOpponentProgress(prog);
      }
    };

    const onPlayerCompleted = (d) => {
      if (d.userId !== myUserId) {
        addLog(`🏁 ${d.username || 'Opponent'} submitted their solution!`, 'warning');
      }
    };

    const onTypingUpdate = (d) => {
      if (d.userId !== myUserId) {
        setOpponentTyping(prev => ({ ...prev, [d.userId]: d.isTyping }));
      }
    };

    const onProgressUpdate = (d) => {
      // Real-time progress from opponent
      if (d.userId !== myUserId) {
        setOpponentProgress(prev => ({ ...prev, [d.userId]: d.progress ?? 0 }));
      }
    };

    const onRoundEnded = (d) => {
      stopTimer();
      roundEndedRef.current = true;
      setRoundWinner(d.roundWinner);
      setNextRoundIn(d.nextRoundIn || 5);
      if (d.scores) setScores(d.scores);
      setRoundModal(true);
    };

    const onNextRound = (d) => {
      roundEndedRef.current = false;
      setChallenge(d.challenge);
      setCompletionProof(null);
      setCurrentRound(d.round);
      const tcLen = d.challenge?.testCases?.length || 0;
      setTestResults(Array(tcLen).fill(null));
      setOutputData(Array(tcLen).fill(null));
      setProgress(0); setUserCode(''); userCodeRef.current = ''; setAllPassed(false); setRoundModal(false);
      msCurRef.current = totalMs; setPlayerMs(totalMs);
      readingDoneRef.current = false;
      startReadingPhase();
    };

    const onGameOver = (d) => {
      stopTimer();
      navigate('/custom-mode/results', {
        state: {
          roomId, winner: d.winner, players: d.players,
          scores: d.scores || {}, totalRounds, language, difficulty, playerMode,
          myUserId,
        },
      });
    };

    sock.on('custom-game-init', onGameInit);
    sock.on('custom-game-state-tick', onGameTick);
    sock.on('custom-player-completed', onPlayerCompleted);
    sock.on('custom-player-typing-update', onTypingUpdate);
    sock.on('custom-player-progress-update', onProgressUpdate);
    sock.on('custom-round-ended', onRoundEnded);
    sock.on('custom-next-round', onNextRound);
    sock.on('custom-game-over', onGameOver);

    return () => {
      sock.off('custom-game-init', onGameInit);
      sock.off('custom-game-state-tick', onGameTick);
      sock.off('custom-player-completed', onPlayerCompleted);
      sock.off('custom-player-typing-update', onTypingUpdate);
      sock.off('custom-player-progress-update', onProgressUpdate);
      sock.off('custom-round-ended', onRoundEnded);
      sock.off('custom-next-round', onNextRound);
      sock.off('custom-game-over', onGameOver);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myUserId]);

  // Emit join-game once userId is ready
  useEffect(() => {
    const sock = getSocket();
    if (!sock || !myUserId) return;
    sock.emit('custom-join-game', { roomId, userId: myUserId });
  }, [roomId, myUserId]);

  // Handle typing events
  const handleCodeChange = (val) => {
    userCodeRef.current = val;
    setUserCode(val);
    setCompiledOutput(buildSubmissionPreview(language, val, challenge?.htmlCode || challenge?.expectedOutput));
    setAllPassed(false);
    setCompletionProof(null);
    const sock = getSocket();
    if (sock && myUserId && !isSpectator) {
      sock.emit('custom-player-typing', { roomId, userId: myUserId, isTyping: true });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sock.emit('custom-player-typing', { roomId, userId: myUserId, isTyping: false });
      }, 1500);
    }
  };

  const handleCompile = async () => {
    if (!userCode.trim() || isSpectator) { addLog('✍️ Write some code first!', 'error'); return; }
    setCompiling(true);
    setAllPassed(false);
    setCompletionProof(null);
    addLog('⚙️ Checking requirements...', 'info');
    setCompiledOutput(buildSubmissionPreview(language, userCode, challenge?.htmlCode || challenge?.expectedOutput));
    try {
      const res = await computerModeAPI.validateCode({ userCode, challenge, language, timeMinutes: roomTime, difficulty, roomId, mode: 'custom' });
      if (userCodeRef.current !== userCode) return;
      const validation = res.data.validation || {};
      const rawResults = validation.testResults || [];
      const results    = rawResults.map(r => r.passed);

      // ── FIX: preserve null for missing tests, store per-test output ──
      const tcLen  = challenge?.testCases?.length || 0;
      const filled = Array(tcLen).fill(null).map((_, i) => results[i] !== undefined ? results[i] : null);
      setTestResults(filled);
      // Store detailed output per test
      const details = Array(tcLen).fill(null).map((_, i) => rawResults[i] ? {
        actualOutput: rawResults[i].actualOutput,
        stdout: rawResults[i].stdout || '',
        error: rawResults[i].error || null,
      } : null);
      setOutputData(details);

      const cnt  = results.filter(Boolean).length;
      const tot  = tcLen > 0 ? tcLen : results.length;
      const pct  = tot > 0 ? (cnt / tot) * 100 : 0;
      setProgress(pct);

      // Emit progress to server so opponents' binary panels update
      const sock = getSocket();
      if (sock && myUserId) {
        sock.emit('custom-player-progress', { roomId, userId: myUserId, progress: pct, testsPassed: cnt });
      }

      const proof = res.data.completionProof;
      setCompletionProof(typeof proof === 'string' ? proof : null);
      const canFinish = cnt === tot && tot > 0 && typeof proof === 'string';
      if (canFinish) {
        setAllPassed(true);
        addLog(`✅ ALL ${tot}/${tot} TESTS PASSED! Click SUBMIT to WIN!`, 'success');
      } else if (cnt === tot) {
        setAllPassed(false);
        addLog('⚠️ The round could not be verified. Run validation again.', 'warning');
      } else {
        setAllPassed(false);
        addLog(`⚠️ ${cnt}/${tot} tests passed. Fix remaining cases.`, 'warning');
      }
      (validation.errors || []).forEach(e => addLog(`  ${e.message}`, 'error'));
    } catch {
      addLog('❌ Validation error — check your connection.', 'error');
    }
    setCompiling(false);
  };

  const handleSubmit = () => {
    if (!allPassed || !completionProof || isSpectator) { addLog('❌ Pass all tests first!', 'error'); return; }
    stopTimer();
    addLog('🚀 SUBMITTED! System judging...', 'success');
    const sock = getSocket();
    if (sock && myUserId) {
      sock.emit('custom-player-finished', { roomId, userId: myUserId, completionProof });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if (readingPhase || isSpectator) return;
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'Enter') { e.preventDefault(); if (!compiling && !roundEndedRef.current) handleCompile(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') { e.preventDefault(); if (allPassed) handleSubmit(); }
      if (e.key === 'Escape') { e.preventDefault(); setExitModal(v => !v); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiling, allPassed, readingPhase, isSpectator]);

  // ── FIX: also init testResults when challenge loads with no socket data ──
  useEffect(() => {
    if (challenge && testResults.length === 0 && challenge.testCases?.length > 0) {
      setTestResults(Array(challenge.testCases.length).fill(null));
      setOutputData(Array(challenge.testCases.length).fill(null));
    }
  }, [challenge, testResults.length]);

  if (loading || !challenge) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: PAGE_BG, gap: 16 }}>
      <div style={{ width: 52, height: 52, border: `4px solid ${ac}25`, borderTopColor: ac, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 18, fontWeight: 800, color: ac, letterSpacing: 3, margin: 0, textTransform: 'uppercase' }}>LOADING BATTLE CHALLENGE...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const timerPct   = (playerMs / totalMs) * 100;
  const timerCrit  = playerMs < 30000;
  const timerColor = timerCrit ? '#ef4444' : ac;

  // Identify players
  const opponents   = players.filter(p => p.userId !== myUserId && !p.isSpectator);

  const effectiveOpponents = opponents;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: PAGE_BG, color: 'white', overflow: 'hidden' }}>

      {/* Reading Phase Overlay */}
      {readingPhase && <ReadingPhaseOverlay challenge={challenge} countdown={readingCountdown} ac={ac} />}

      {/* ══ TOP BAR ══ */}
      <div style={{
        height: 44, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 0,
        background: 'rgba(0,0,0,0.75)',
        borderBottom: `1px solid ${ac}20`,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <Zap size={12} fill={ac} style={{ color: ac }} />
          <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 15, color: ac, letterSpacing: 2 }}>CUSTOM MODE</span>
        </div>

        {/* Round dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%',
                background: i < currentRound ? ac : 'rgba(255,255,255,0.1)',
                boxShadow: i < currentRound ? `0 0 6px ${ac}` : 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>R{currentRound}/{totalRounds}</span>
        </div>

        {/* Title */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, color: 'white', textTransform: 'uppercase', letterSpacing: 1 }}>{challenge.title}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: `${ac}20`, color: ac }}>{language}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>{difficulty}</span>
          {isSpectator && (
            <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: `${ac}20`, color: ac, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={10} /> SPECTATING
            </span>
          )}
        </div>

        {/* Exit */}
        <button onClick={() => setExitModal(true)} style={{
          height: 44, width: 44, border: 'none', borderLeft: '1px solid rgba(239,68,68,0.2)',
          background: 'rgba(239,68,68,0.07)', color: '#ef4444', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}>
          <X size={14} />
        </button>
      </div>

      {/* ══ MAIN BODY (3-COLUMN LAYOUT) ══ */}
      <div style={{
        flex: 1, padding: '16px 20px',
        display: 'grid', gridTemplateColumns: isSpectator ? `repeat(${Math.min(playerMode, 4)}, 1fr)` : 'minmax(0, 1.2fr) minmax(0, 1fr) 280px', gap: 16,
        minHeight: 0, overflow: 'hidden',
      }}>

        {/* ═══ SPECTATOR MODE ═══ */}
        {isSpectator ? (
          players.filter(p => !p.isSpectator).map((p, idx) => (
            <div key={p.userId} style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              background: '#0b0e17', border: `1px solid ${PLAYER_COLORS[idx % PLAYER_COLORS.length]}25`,
              borderRadius: 10, overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 14px', background: '#07090e', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[idx % PLAYER_COLORS.length] }} />
                <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16, color: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}>{p.username}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>· {p.progress || 0}% done</span>
                {p.finished && <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#10b981' }}>✅ SUBMITTED</span>}
              </div>
              <div style={{ flex: 1 }}>
                <BinaryPanel
                  username={p.username}
                  progress={p.progress || 0}
                  isTyping={opponentTyping[p.userId] || false}
                  color={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                />
              </div>
            </div>
          ))
        ) : (
          <>
            {/* ═══════════ COLUMN 1: CHALLENGE & EDITOR ═══════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
              
              {/* Challenge Card */}
              <div style={{
                flexShrink: 0, background: '#0b0e17', border: `1px solid ${ac}25`,
                borderRadius: 10, padding: '14px 18px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: ac }} />
                  <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 16, color: ac, textTransform: 'uppercase', letterSpacing: 2 }}>CHALLENGE</span>
                  {progress > 0 && (
                    <span style={{
                      marginLeft: 'auto', fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                      color: allPassed ? '#10b981' : ac, background: allPassed ? 'rgba(16,185,129,0.12)' : `${ac}15`,
                      padding: '2px 8px', borderRadius: 10, border: `1px solid ${allPassed ? '#10b98140' : ac + '30'}`,
                    }}>
                      MY PROGRESS: {progress.toFixed(0)}%
                    </span>
                  )}
                </div>
                <div style={{ borderLeft: `3px solid ${ac}`, paddingLeft: 12, maxHeight: 80, overflowY: 'auto' }}>
                  <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1.6 }}>{challenge.objective}</p>
                </div>
              </div>

              {/* Editor */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                background: '#0b0e17', border: `1px solid ${readingPhase ? 'rgba(16,185,129,0.4)' : ac + '25'}`,
                borderRadius: 10, minHeight: 0, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                opacity: readingPhase ? 0.6 : 1, transition: 'all 0.3s',
              }}>
                <div style={{ background: '#07090e', padding: '8px 14px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>solution.{ext(language)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {readingPhase && <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={10} /> LOCKED
                    </span>}
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, background: `${ac}20`, color: ac, padding: '2px 8px', borderRadius: 4 }}>{language}</span>
                  </div>
                </div>

                <textarea
                  value={userCode}
                  onChange={e => handleCodeChange(e.target.value)}
                  placeholder={readingPhase ? '// Editor locked during reading phase...' : `// Write your ${language} solution here...
// ${challenge.objective}`}
                  disabled={readingPhase}
                  spellCheck={false}
                  style={{
                    flex: 1, minHeight: 0, background: '#07090e', color: '#f8fafc',
                    fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 15, fontWeight: 700,
                    lineHeight: 1.8, padding: '16px', border: 'none', resize: 'none', outline: 'none',
                    caretColor: ac, cursor: readingPhase ? 'not-allowed' : 'text', tabSize: 2,
                  }}
                />

                {/* Action bar */}
                <div style={{
                  flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                  borderTop: '1px solid rgba(255,255,255,0.06)', background: '#07090e',
                }}>
                  <button
                    onClick={handleCompile} disabled={compiling || readingPhase || roundEndedRef.current}
                    style={{
                      padding: '12px 0', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)',
                      background: readingPhase ? 'rgba(255,255,255,0.04)' : compiling ? 'rgba(16,185,129,0.18)' : '#10b981',
                      color: readingPhase ? 'rgba(255,255,255,0.6)' : 'white', cursor: compiling || readingPhase ? 'not-allowed' : 'pointer',
                      fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if(!compiling && !readingPhase) e.currentTarget.style.background='#059669'; }}
                    onMouseLeave={e => { if(!compiling && !readingPhase) e.currentTarget.style.background='#10b981'; }}
                  >
                    {compiling
                      ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.55)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> RUNNING...</>
                      : <><Play size={12} fill="white" /> CHECK REQUIREMENTS</>}
                  </button>

                  <button
                    onClick={handleSubmit} disabled={!allPassed || compiling || readingPhase || roundEndedRef.current}
                    style={{
                      padding: '12px 0', border: 'none',
                      background: allPassed && !readingPhase ? `linear-gradient(135deg, ${ac}, ${theme.ui})` : 'rgba(255,255,255,0.04)',
                      color: allPassed && !readingPhase ? 'white' : 'rgba(255,255,255,0.6)', cursor: allPassed && !readingPhase ? 'pointer' : 'not-allowed',
                      fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all 0.3s',
                      boxShadow: allPassed && !readingPhase ? `0 0 20px 80` : 'none',
                    }}
                  >
                    <Trophy size={12} /> SUBMIT
                  </button>
                </div>
              </div>
            </div>

            {/* ═══════════ COLUMN 2: OUTPUTS & CONSOLE ═══════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
              
              {/* PREVIEW ARENA CARD (tabbed) */}
              <div style={{
                flex: 3, display: 'flex', flexDirection: 'column',
                background: '#0b0e17', border: `1px solid ${ac}25`, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                minHeight: 0, overflow: 'hidden',
              }}>
                {(language === 'HTML' || language === 'CSS') ? (
                  <>
                    <div style={{
                      background: '#07090e', padding: '4px 6px', flexShrink: 0,
                      borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <button onClick={() => setPreviewTab('yours')} style={{
                        border: 'none', outline: 'none', padding: '6px 12px', borderRadius: 6,
                        background: previewTab === 'yours' ? `${ac}1e` : 'transparent',
                        color: previewTab === 'yours' ? ac : '#94a3b8',
                        fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: previewTab === 'yours' ? `2px solid ${ac}` : '2px solid transparent',
                      }}>YOUR OUTPUT</button>
                      <button onClick={() => setPreviewTab('expected')} style={{
                        border: 'none', outline: 'none', padding: '6px 12px', borderRadius: 6,
                        background: previewTab === 'expected' ? `${ac}1e` : 'transparent',
                        color: previewTab === 'expected' ? ac : '#94a3b8',
                        fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: previewTab === 'expected' ? `2px solid ${ac}` : '2px solid transparent',
                      }}>EXPECTED OUTPUT</button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#07090e', padding: 10 }}>
                      <div style={{ display: previewTab === 'yours' ? 'block' : 'none', width: '100%', height: '100%' }}>
                        {compiledOutput ? (
                          <iframe ref={iframeRef} title="Your live submission preview" srcDoc={compiledOutput} sandbox=""
                            style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: 6 }} />
                        ) : (
                          <div style={{ height: '100%', background: '#0a0d14', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Your HTML/CSS preview updates as you type. Other languages show the submission note here.</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: previewTab === 'expected' ? 'block' : 'none', width: '100%', height: '100%' }}>
                        {challenge?.expectedOutput ? (
                          <iframe ref={expectedIframeRef} title="Expected challenge output" srcDoc={buildHtmlPreview(challenge.expectedOutput)} sandbox=""
                            style={{ width: '100%', height: '100%', border: 'none', background: 'white', borderRadius: 6 }} />
                        ) : (
                          <div style={{ height: '100%', background: '#0a0d14', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>No expected output available.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      background: '#07090e', padding: '4px 6px', flexShrink: 0,
                      borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 4
                    }}>
                      <button onClick={() => setPreviewTab('tests')} style={{
                        border: 'none', outline: 'none', padding: '6px 12px', borderRadius: 6,
                        background: previewTab === 'tests' || previewTab === 'yours' || previewTab === 'expected' ? `${ac}1e` : 'transparent',
                        color: previewTab === 'tests' || previewTab === 'yours' || previewTab === 'expected' ? ac : '#94a3b8',
                        fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: previewTab === 'tests' || previewTab === 'yours' || previewTab === 'expected' ? `2px solid ${ac}` : '2px solid transparent',
                      }}>TEST RESULTS</button>
                      <button onClick={() => setPreviewTab('stdout')} style={{
                        border: 'none', outline: 'none', padding: '6px 12px', borderRadius: 6,
                        background: previewTab === 'stdout' ? `${ac}1e` : 'transparent',
                        color: previewTab === 'stdout' ? ac : '#94a3b8',
                        fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s',
                        borderBottom: previewTab === 'stdout' ? `2px solid ${ac}` : '2px solid transparent',
                      }}>STDOUT</button>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#07090e', padding: 10, overflowY: 'auto' }}>
                      {(previewTab === 'tests' || previewTab === 'yours' || previewTab === 'expected') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {!outputData || outputData.length === 0 || !outputData.some(od => od !== null) ? (
                            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 0' }}>
                              {'//'} Run your code to see test results
                            </div>
                          ) : (
                            (challenge.testCases || []).map((tc, i) => {
                              const passed = testResults[i];
                              const od = outputData?.[i];
                              if (!od) return null;
                              return (
                                <div key={i} style={{
                                  borderRadius: 8,
                                  border: `1px solid ${passed === true ? '#10b98130' : passed === false ? '#ef444430' : 'rgba(255,255,255,0.08)'}`,
                                  background: passed === true ? 'rgba(16,185,129,0.04)' : passed === false ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                                  overflow: 'hidden',
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{
                                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                      background: passed === true ? '#10b98120' : passed === false ? '#ef444420' : 'rgba(255,255,255,0.06)',
                                      border: `1.5px solid ${passed === true ? '#10b981' : passed === false ? '#ef4444' : 'rgba(255,255,255,0.6)'}`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontFamily: 'monospace', fontSize: 16, fontWeight: 900,
                                      color: passed === true ? '#10b981' : passed === false ? '#ef4444' : 'rgba(255,255,255,0.6)',
                                    }}>
                                      {passed === true ? '✓' : passed === false ? '✗' : i + 1}
                                    </div>
                                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 16, color: passed === true ? '#10b981' : passed === false ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>
                                      Test Case {i + 1} {tc.description ? `— ${tc.description}` : ''}
                                    </span>
                                  </div>
                                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {tc.input !== undefined && (
                                      <div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Input</div>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 4, wordBreak: 'break-all' }}>{JSON.stringify(tc.input)}</div>
                                      </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                      <div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Expected</div>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.06)', padding: '6px 10px', borderRadius: 4, wordBreak: 'break-all' }}>
                                          {tc.expectedOutput !== undefined ? JSON.stringify(tc.expectedOutput) : tc.expected !== undefined ? JSON.stringify(tc.expected) : '—'}
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Validation Report</div>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: passed ? '#10b981' : '#ef4444', background: passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', padding: '6px 10px', borderRadius: 4, wordBreak: 'break-all' }}>
                                          {od.actualOutput !== undefined ? JSON.stringify(od.actualOutput) : '—'}
                                        </div>
                                      </div>
                                    </div>
                                    {od.error && (
                                      <div>
                                        <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 2 }}>Error</div>
                                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.06)', padding: '6px 10px', borderRadius: 4, wordBreak: 'break-all' }}>{od.error}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {previewTab === 'stdout' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {!outputData || !outputData.some(od => od && od.stdout) ? (
                            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px 0' }}>
                              {'//'} No stdout output from your code
                            </div>
                          ) : (
                            outputData.map((od, i) => (
                              od?.stdout ? (
                                <div key={i} style={{ marginBottom: 4 }}>
                                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>► Test {i+1} stdout:</div>
                                  <pre style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {od.stdout}
                                  </pre>
                                </div>
                              ) : null
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* CONSOLE LOGS CARD */}             <div style={{
                flex: 2, display: 'flex', flexDirection: 'column',
                background: '#0b0e17', border: `1px solid ${ac}25`, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                minHeight: 0, overflow: 'hidden',
              }}>
                <div style={{
                  background: '#07090e', padding: '6px 14px', flexShrink: 0,
                  borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2.5 }}>
                      Execution Console
                    </span>
                    {logs.length > 0 && (
                      <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: `${ac}20`, color: ac }}>{logs.length}</span>
                    )}
                  </div>
                  <button onClick={() => setLogs([])} style={{ color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }} title="Clear Console">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '12px',
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, background: '#07090e', lineHeight: 1.6,
                }}>
                  {logs.length === 0
                    ? <span style={{ color: 'rgba(255,255,255,0.6)' }}>No system logs yet.</span>
                    : logs.map((l, i) => (
                      <div key={i} style={{
                        marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start',
                        color: l.type === 'error' ? '#ef4444' : l.type === 'success' ? '#10b981' : l.type === 'warning' ? '#f59e0b' : '#94a3b8'
                      }}>
                        <span style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, fontSize: 15 }}>{l.ts}</span>
                        <span>{l.msg}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* ═══════════ COLUMN 3: STATUS & OPPONENTS ═══════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
              
              {/* TIMER CARD */}
              <div style={{
                flexShrink: 0, padding: '16px',
                background: '#0b0e17', border: `1px solid ${readingPhase ? 'rgba(16,185,129,0.4)' : ac+'25'}`,
                borderRadius: 10, boxShadow: `0 4px 20px ${readingPhase ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.4)'}`,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'border-color 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16, color: readingPhase ? '#10b981' : '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
                      {readingPhase ? '📖 READING TIME' : '⏱ TIME REMAINING'}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono',monospace", fontWeight: 900, fontSize: 36,
                      color: readingPhase ? '#10b981' : timerColor, lineHeight: 1, letterSpacing: 0.5,
                      textShadow: `0 0 20px ${readingPhase ? '#10b981' : timerColor}55`, fontVariantNumeric: 'tabular-nums', transition: 'color 0.3s',
                    }}>
                      {readingPhase ? `00:${String(readingCountdown).padStart(2,'0')}.00` : fmtMs(playerMs)}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: readingPhase ? `${(readingCountdown/15)*100}%` : `${timerPct}%`,
                      background: readingPhase ? '#10b981' : timerColor,
                      boxShadow: `0 0 8px ${readingPhase ? '#10b981' : timerColor}80`, transition: 'width 0.1s linear,background 0.3s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                      {readingPhase ? '🔒 Editor locked' : `${Math.round(progress)}% complete`}
                    </span>
                    {allPassed && !readingPhase && (
                      <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 16, color: '#10b981', animation: 'pulse 1s infinite', letterSpacing: 0.5 }}>
                        ✅ READY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* TEST CASES COMPACT CARD */}
              <div style={{
                flexShrink: 0, padding: '12px 16px',
                background: '#0b0e17', border: `1px solid ${ac}25`, borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)', maxHeight: 160, overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 2.5, height: 12, borderRadius: 2, background: '#10b981' }} />
                    <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, textTransform: 'uppercase', letterSpacing: 2, color: 'white' }}>TESTS</span>
                  </div>
                  <div style={{
                    padding: '2px 8px', borderRadius: 20,
                    background: testResults.every(Boolean) ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${testResults.every(Boolean) ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                    color: testResults.every(Boolean) ? '#10b981' : 'rgba(255,255,255,0.65)', transition: 'all 0.3s',
                  }}>
                    {testResults.filter(Boolean).length} / {testResults.length} PASS
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {(challenge.testCases || []).map((tc, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6,
                      background: testResults[i] ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${testResults[i] ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.3s',
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        background: testResults[i] ? '#10b981' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 900, color: testResults[i] ? 'white' : 'rgba(255,255,255,0.6)',
                        boxShadow: testResults[i] ? '0 0 6px rgba(16,185,129,0.4)' : 'none',
                      }}>
                        {testResults[i] ? '✓' : i + 1}
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: testResults[i] ? '#6ee7b7' : '#94a3b8', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tc.description || `Test ${i + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMPACT OPPONENTS CARD */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                background: '#0b0e17', border: `1px solid ${ac}25`, borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minHeight: 0, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#07090e', flexShrink: 0,
                }}>
                  <div style={{ width: 2.5, height: 12, borderRadius: 2, background: '#f97316' }} />
                  <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 15, color: '#f97316', textTransform: 'uppercase', letterSpacing: 2 }}>OPPONENTS</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginLeft: 'auto' }}>
                    {effectiveOpponents.length} player{effectiveOpponents.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '12px 14px 4px', gap: 10 }}>
                  {effectiveOpponents.length === 0 ? (
                    <div role="status" style={{
                      minHeight: 116, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 8, padding: 16, textAlign: 'center',
                      border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 10,
                      color: 'rgba(255,255,255,0.68)', fontFamily: 'monospace', fontSize: 13,
                    }}>
                      <span style={{ color: '#f97316', fontWeight: 800, letterSpacing: 1 }}>SYNCING ROOM PLAYERS</span>
                      <span>Opponent progress will appear when the room connection is ready.</span>
                    </div>
                  ) : effectiveOpponents.map((opp, idx) => {
                    const oppColor   = PLAYER_COLORS[(idx + 1) % PLAYER_COLORS.length];
                    const isTyping   = opponentTyping[opp.userId] || false;
                    const oppProgress = opponentProgress[opp.userId] ?? opp.progress ?? 0;

                    return (
                      <div key={opp.userId} style={{
                        padding: '12px', background: opp.finished ? `${oppColor}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${opp.finished ? oppColor+'60' : 'rgba(255,255,255,0.09)'}`,
                        borderRadius: 10, boxShadow: opp.finished ? `0 4px 15px ${oppColor}15` : 'none',
                        transition: 'all 0.3s', display: 'flex', flexDirection: 'column', gap: 8,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: oppColor, boxShadow: `0 0 8px ${oppColor}` }} />
                            <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16, color: oppColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{opp.username}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {opp.finished ? (
                              <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#10b981' }}>✅ DONE</span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {isTyping && <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: oppColor }}>⌨️</span>}
                                <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 18, color: oppColor }}>{oppProgress.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${oppProgress}%`, background: oppColor, boxShadow: `0 0 6px ${oppColor}50`, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      {/* Exit modal */}
      {exitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#0f1523', border: '1.5px solid #ef444440', borderRadius: 20, padding: '36px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 26, color: '#ef4444', letterSpacing: 3, margin: '0 0 12px' }}>ABANDON BATTLE?</h2>
            <p style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 28, lineHeight: 1.6 }}>You will forfeit this battle. Your opponent will be declared the winner.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setExitModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid 80`, background: `${ac}10`, color: ac, fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', letterSpacing: 2 }}>
                KEEP FIGHTING
              </button>
              <button onClick={() => navigate('/custom-mode')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #ef444430', background: '#ef444420', color: '#ef4444', fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer', letterSpacing: 2 }}>
                ABANDON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round over modal */}
      {roundModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#0f1523', border: `1.5px solid 80`, borderRadius: 24, padding: '40px', maxWidth: 460, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {roundWinner?.userId === myUserId ? '🏆' : '💀'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: 4, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>ROUND {currentRound} COMPLETE</div>
            <h2 style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 32, letterSpacing: 3, margin: '0 0 8px',
              color: roundWinner?.userId === myUserId ? '#10b981' : ac }}>
              {roundWinner?.userId === myUserId ? 'YOU WIN THIS ROUND!' : `${roundWinner?.username || 'OPPONENT'} WINS!`}
            </h2>
            <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>
              Next round in {nextRoundIn}s...
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {players.filter(p => !p.isSpectator).map((p, i) => (
                <div key={p.userId} style={{
                  padding: '10px 20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${PLAYER_COLORS[i]}30`,
                }}>
                  <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 800, fontSize: 16, color: PLAYER_COLORS[i], marginBottom: 4 }}>{p.username}</div>
                  <div style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 900, fontSize: 28, color: 'white' }}>{scores[p.userId] || 0}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>POINTS</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 4px 16px 80} 50%{box-shadow:0 4px 24px ${ac}70} }
        @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb { background: 80; border-radius: 3px; }
      `}</style>
    </div>
  );
}
