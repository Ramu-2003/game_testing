import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Lightbulb, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import CompetitionFrame from '../components/competition/CompetitionFrame';
import { CodeEditor } from '../components/competition/CodeEditor';
import { bugHunterAPI, getApiErrorMessage } from '../utils/api';

const THEMES = {
  red: { accent: '#ff5252', ui: '#ff6b6b' }, blue: { accent: '#0099ff', ui: '#00ccff' },
  green: { accent: '#00ff88', ui: '#00ff99' }, purple: { accent: '#a855f7', ui: '#d8b4fe' },
};
const FALLBACK_LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'Python', 'Java'];
const FALLBACK_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const REWARD_FALLBACK = { Easy: 25, Medium: 50, Hard: 100 };

function formatDuration(milliseconds) {
  if (!Number.isFinite(Number(milliseconds))) return '—';
  const totalSeconds = Math.floor(Number(milliseconds) / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function BugHunterPage() {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [catalog, setCatalog] = useState(null);
  const [stats, setStats] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [language, setLanguage] = useState('JavaScript');
  const [difficulty, setDifficulty] = useState('Easy');
  const [code, setCode] = useState('');
  const [hints, setHints] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const theme = THEMES[themeKey] || THEMES.purple;
  const active = attempt?.status === 'active';
  const expirationChecked = useRef(null);

  useEffect(() => localStorage.setItem('themeKey', themeKey), [themeKey]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [catalogResult, activeResult, statsResult] = await Promise.all([
        bugHunterAPI.getCatalog(), bugHunterAPI.getActive(), bugHunterAPI.getStats(),
      ]);
      setCatalog(catalogResult.data);
      setStats(statsResult.data);
      const restored = activeResult.data.attempt;
      setAttempt(restored);
      setCode(restored?.challenge?.starterCode || '');
      setHints(restored?.unlockedHints || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load Bug Hunter Arena. Please try again.'));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!active) { setSecondsLeft(0); return undefined; }
    const deadline = new Date(attempt.startedAt).getTime() + attempt.challenge.timeLimitSeconds * 1000;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [active, attempt?.attemptId, attempt?.startedAt, attempt?.challenge?.timeLimitSeconds]);

  useEffect(() => {
    if (!active || secondsLeft !== 0 || expirationChecked.current === attempt.attemptId) return;
    const deadline = new Date(attempt.startedAt).getTime() + attempt.challenge.timeLimitSeconds * 1000;
    if (Date.now() < deadline) return;
    expirationChecked.current = attempt.attemptId;
    bugHunterAPI.getActive().then((response) => {
      if (!response.data.attempt) {
        setAttempt(null);
        setMessage('The challenge timer expired. Review your record and start another case when ready.');
        return bugHunterAPI.getStats().then((statsResult) => setStats(statsResult.data));
      }
      return undefined;
    }).catch(() => {});
  }, [active, attempt, secondsLeft]);

  const start = async () => {
    setBusy(true); setError(''); setMessage(''); setHints([]);
    try {
      const response = await bugHunterAPI.start({ language, difficulty });
      setAttempt(response.data.attempt);
      setCode(response.data.attempt.challenge.starterCode || '');
      setHints(response.data.attempt.unlockedHints || []);
      expirationChecked.current = null;
      setMessage(response.data.attempt.rewardAvailable === false ? 'Case started. You have already claimed its XP reward, so this replay is practice.' : 'Case started. Inspect the behavior and repair the source before time runs out.');
    } catch (requestError) {
      const nextAttempt = requestError.response?.data?.attempt;
      if (nextAttempt) {
        setAttempt(nextAttempt); setCode(nextAttempt.challenge.starterCode || ''); setHints(nextAttempt.unlockedHints || []);
      }
      setError(getApiErrorMessage(requestError, 'Could not start a challenge.'));
    } finally { setBusy(false); }
  };
  const requestHint = async () => {
    if (!attempt || busy) return;
    setBusy(true); setError('');
    try {
      const response = await bugHunterAPI.hint(attempt.attemptId);
      setHints((items) => [...items, response.data.hint]);
      setAttempt((current) => ({ ...current, hintCount: response.data.hintCount }));
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Could not load a hint.')); }
    finally { setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!attempt || attempt.status !== 'active' || busy) return;
    setBusy(true); setError(''); setMessage('Checking your repair on the server…');
    try {
      const response = await bugHunterAPI.submit(attempt.attemptId, code);
      if (response.data.completed) {
        setAttempt((current) => ({ ...current, status: 'completed', attemptCount: (current.attemptCount || 0) + 1 }));
        setMessage(response.data.xpEarned > 0 ? `Repair accepted. +${response.data.xpEarned} XP earned. ${response.data.explanation || ''}` : `Repair accepted. This case’s XP reward was already claimed. ${response.data.explanation || ''}`);
        window.dispatchEvent(new Event('pointsUpdated'));
        const statsResult = await bugHunterAPI.getStats();
        setStats(statsResult.data);
      } else {
        setAttempt((current) => ({ ...current, attemptCount: (current.attemptCount || 0) + 1 }));
        setMessage(response.data.message || 'The repair did not match yet. Use the observed and expected behavior to keep investigating.');
      }
    } catch (requestError) { setError(getApiErrorMessage(requestError, 'Could not save this submission. Please retry.')); }
    finally { setBusy(false); }
  };

  const languages = catalog?.languages || FALLBACK_LANGUAGES;
  const difficulties = catalog?.difficulties || FALLBACK_DIFFICULTIES;
  const byLanguage = stats?.byLanguage || [];
  const selectedStats = byLanguage.find((entry) => entry._id === language) || { attempted: 0, solvedChallenges: 0, xpEarned: 0 };
  const selectedCounts = catalog?.challengeCounts?.[language] || {};
  const challengeTotal = Object.values(selectedCounts).reduce((total, count) => total + (Number(count) || 0), 0);
  const solved = stats ? (selectedStats.solvedChallenges || 0) : loading ? '…' : '—';
  const selectedReward = catalog?.rewards?.[difficulty] ?? (catalog ? REWARD_FALLBACK[difficulty] : loading ? '…' : '—');
  const timeLabel = `${Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:${(secondsLeft % 60).toString().padStart(2, '0')}`;
  const completed = attempt?.status === 'completed';
  const metricValue = (value) => stats ? (value ?? 0) : loading ? '…' : '—';

  return (
    <CompetitionFrame currentPage="bug-hunter" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} theme={theme} pageClass="bug-page">
      <header className="bug-head">
        <div><p className="comp-kicker">DEBUGGING OPERATIONS / CASE FILES</p><h1 className="comp-title">Bug Hunter Arena</h1><p className="comp-copy">Read the evidence. Trace the defect. Make the smallest correct repair.</p></div>
        <div className="bug-head__stamp">{active ? `CASE ${attempt.challenge.language.toUpperCase()}` : loading ? 'ARENA / LOADING' : error && !catalog ? 'ARENA / OFFLINE' : 'ARENA / OPEN'}<span className="block text-[9px] font-sans tracking-normal text-white/45 mt-1">{active ? 'ACTIVE INVESTIGATION' : 'CURATED REPAIR CASES'}</span></div>
      </header>

      <div className="bug-metrics" aria-label="Arena record" aria-busy={loading}>
        <div className="bug-metric"><span className="comp-micro">CASES SOLVED</span><strong>{metricValue(stats?.completed)}</strong></div>
        <div className="bug-metric"><span className="comp-micro">SUCCESS RATE</span><strong>{metricValue(stats?.successRate)}{stats ? '%' : ''}</strong></div>
        <div className="bug-metric"><span className="comp-micro">XP EARNED</span><strong>{metricValue(stats?.xpEarned)}</strong></div>
        <div className="bug-metric"><span className="comp-micro">BEST SOLVE</span><strong className="!text-xl">{stats ? formatDuration(stats.bestCompletionMs) : loading ? '…' : '—'}</strong></div>
      </div>

      {error && <div className="comp-alert mb-4" role="alert"><span>{error}</span><button type="button" onClick={load} className="comp-button comp-button--quiet">Retry</button></div>}
      {message && <div className={`comp-status mb-4${completed ? ' border-emerald-300/35 bg-emerald-950/20' : ''}`} role="status">{message}</div>}

      {!active ? <>
        <div className="bug-entry">
          <section className="comp-panel bug-selector" aria-labelledby="case-selection-heading">
            <p className="comp-eyebrow">SELECT A CASE FILE</p><h2 id="case-selection-heading" className="comp-section-title mt-1">Choose your investigation</h2><p className="comp-section-note">Select a language and challenge depth. The arena serves from its curated case library.</p>
            <div className="bug-language-tabs" role="group" aria-label="Programming language">
              {languages.map((item) => {
                const count = Object.values(catalog?.challengeCounts?.[item] || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
                const progress = stats ? (byLanguage.find((entry) => entry._id === item)?.solvedChallenges || 0) : loading ? '…' : '—';
                return <button key={item} type="button" className="bug-language-tab" aria-pressed={language === item} onClick={() => setLanguage(item)} disabled={loading || busy}><span>{item}</span><span className="bug-language-tab__count">{progress} / {count || '—'} solved</span></button>;
              })}
            </div>
            <div className="bug-difficulty" role="group" aria-label="Challenge difficulty">
              {difficulties.map((item) => <button key={item} type="button" className="bug-difficulty__button" aria-pressed={difficulty === item} onClick={() => setDifficulty(item)} disabled={loading || busy}><span>{item}</span><span className="bug-difficulty__meta">{selectedCounts[item] ?? '—'} cases</span></button>)}
            </div>
            <div className="bug-selector__bottom"><div><p className="text-sm text-white/75"><strong className="text-white">{solved}</strong> of {catalog ? (challengeTotal || '—') : loading ? '…' : '—'} {language} cases solved</p><p className="text-xs text-white/40 mt-1">Up to +{selectedReward} XP on an unrewarded case.</p></div>
              <button type="button" className="comp-button comp-button--primary" onClick={start} disabled={loading || !catalog || busy || selectedCounts[difficulty] === 0}><Sparkles size={15} />{busy ? 'Opening case…' : completed ? 'Next case' : 'Start investigation'}</button>
            </div>
          </section>

          <section className="comp-panel bug-case-progress" aria-labelledby="progress-heading"><p className="comp-eyebrow">FIELD RECORD</p><h2 id="progress-heading" className="comp-section-title mt-1">Progress by language</h2>
            <div className="bug-language-progress" aria-busy={loading}>{stats && catalog ? languages.map((item) => { const entry = byLanguage.find((row) => row._id === item); const total = Object.values(catalog.challengeCounts?.[item] || {}).reduce((sum, value) => sum + (Number(value) || 0), 0); const count = entry?.solvedChallenges || 0; const pct = total ? Math.min(100, (count / total) * 100) : 0; return <div className="bug-language-progress__row" key={item}><span>{item}</span><div className="bug-language-progress__bar"><span style={{ width: `${pct}%` }} /></div><span className="text-right">{count}/{total || '—'}</span></div>; }) : <p className="text-sm text-white/45">{loading ? 'Loading saved progress…' : 'Progress is unavailable right now.'}</p>}</div>
            <div className="border-t border-white/10 mt-5 pt-4"><p className="comp-micro">CURRENT INVESTIGATION</p><p className="text-xs text-white/50 mt-2">{stats ? `${stats.attempted ?? 0} attempts logged` : loading ? 'Loading your activity…' : 'Activity is unavailable'} · progress and XP are saved to your profile.</p></div>
          </section>
        </div>
        <section className="comp-panel bug-history" aria-labelledby="case-history-heading"><div className="flex items-end justify-between gap-3"><div><p className="comp-eyebrow">RECENT CASES</p><h2 id="case-history-heading" className="comp-section-title mt-1">Investigation history</h2></div><span className="comp-micro">LATEST {stats ? stats.history?.length || 0 : loading ? '…' : '—'}</span></div>
          {stats?.history?.length ? <div className="mt-4">{stats.history.map((item) => <div className="bug-history__row" key={item.attemptId}><span className="min-w-0"><strong className="block text-white/80 truncate">{item.title}</strong><small className="block text-white/40 mt-1">{item.language} · {item.difficulty} · {item.attemptCount} checks · {item.hintCount} hints</small></span><span className={item.status === 'completed' ? 'text-emerald-200' : 'text-white/45'}>{item.status}</span><span>{item.xpAwarded > 0 ? `+${item.xpAwarded} XP` : '—'}</span><span>{formatDuration(item.completionMs)}</span></div>)}</div> : <p className="text-sm text-white/45 text-center py-7">{stats ? 'Your solved and abandoned cases will be recorded here.' : loading ? 'Loading your case history…' : 'Case history is unavailable right now.'}</p>}
        </section>
      </> : <section className="comp-panel bug-workspace" aria-labelledby="challenge-heading">
        <div className="bug-workspace__head"><div className="min-w-0"><p className="comp-eyebrow">{attempt.challenge.language} / {attempt.difficulty} / {attempt.rewardAvailable === false ? 'PRACTICE REPLAY' : `+${attempt.xpReward} XP`}</p><h2 id="challenge-heading" className="comp-section-title mt-1">{attempt.challenge.title}</h2><p className="comp-section-note max-w-3xl">{attempt.challenge.description}</p></div><div className="flex items-center gap-2 rounded-md bg-white/[.05] px-3 py-2 shrink-0"><Clock3 size={16} aria-hidden="true" style={{ color: secondsLeft <= 30 ? '#fb7185' : 'var(--comp-ui)' }} /><span role="timer" aria-label={`${secondsLeft} seconds remaining`} className="font-mono font-bold tabular-nums">{timeLabel}</span></div></div>
        <div className="bug-workspace__body">
          <div className="bug-workspace__editor">
            <form onSubmit={submit}>
              <CodeEditor id="bug-hunter-code" code={code} onChange={setCode} language={attempt.challenge.language} title="Case source / edit to repair" minHeight={440} disabled={!active || busy} onSubmitLabel={`${attempt.attemptCount || 0} checks`} />
              <div className="bug-output"><div className="bug-output__item"><span className="comp-micro">OBSERVED BEHAVIOR</span><p className="bug-output__text">{attempt.challenge.observedBehavior}</p></div><div className="bug-output__item"><span className="comp-micro">EXPECTED BEHAVIOR</span><p className="bug-output__text">{attempt.challenge.expectedBehavior}</p></div></div>
              <div className="bug-workspace__actions"><p className="bug-note">The curated checker validates source text. It does not compile or execute submitted code.</p><div className="flex gap-2 flex-wrap"><button type="button" className="comp-button comp-button--quiet" onClick={requestHint} disabled={busy || !active || attempt.hintCount >= attempt.challenge.hintCount}><Lightbulb size={15} />Hint {attempt.hintCount}/{attempt.challenge.hintCount}</button><button type="submit" className="comp-button comp-button--primary" disabled={busy || !code.trim() || !active}><ShieldCheck size={15} />{busy ? 'Checking…' : 'Check repair'}</button></div></div>
            </form>
          </div>
          <aside className="bug-workspace__side" aria-label="Case evidence">
            <div className="bug-brief"><span className="comp-micro">CASE NOTE</span><p className="text-sm text-white/70 mt-1">Look for the behavior described above; only visible sample information is shown.</p></div>
            <div className="bug-brief"><span className="comp-micro">SAMPLE INPUT</span><p className="font-mono text-xs text-white/60 mt-1 break-words">{attempt.challenge.sample?.input || 'No sample input'}</p></div>
            <div className="bug-brief"><span className="comp-micro">EXPECTED SAMPLE OUTPUT</span><p className="font-mono text-sm text-emerald-200 mt-1 break-words">{attempt.challenge.sample?.output || 'No sample output'}</p></div>
            {hints.length > 0 && <div className="bug-hints" aria-live="polite">{hints.map((hint, index) => <div key={`${index}-${hint}`} className="bug-hint"><span className="comp-micro text-amber-200/60">FIELD HINT {index + 1}</span><p className="mt-1">{hint}</p></div>)}</div>}
            <div className="bug-brief"><span className="comp-micro">CASE ACTIVITY</span><p className="text-xs text-white/55 mt-2">{attempt.attemptCount || 0} checks · {attempt.hintCount || 0} of {attempt.challenge.hintCount} hints</p><p className="text-xs text-white/40 mt-1">A case can award XP once. Replays stay available for practice.</p></div>
          </aside>
        </div>
      </section>}

      {!active && <p className="bug-note mt-4 flex items-start gap-2"><CheckCircle2 size={14} className="shrink-0 mt-0.5" />Rewards are verified by the backend and add XP only. Bug Hunter progress never changes tournament RP.</p>}
      {loading && <p className="text-center text-white/45 text-xs mt-5" role="status"><LoaderCircle size={14} className="inline animate-spin mr-2" />Loading case files…</p>}
    </CompetitionFrame>
  );
}

export default BugHunterPage;
