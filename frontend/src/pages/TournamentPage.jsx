import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, Code2, Crown, LoaderCircle, Search, ShieldCheck, Trophy, Wifi, XCircle } from 'lucide-react';
import CompetitionFrame from '../components/competition/CompetitionFrame';
import { CodeEditor } from '../components/competition/CodeEditor';
import { getApiErrorMessage, tournamentAPI } from '../utils/api';
import { getSocket } from '../utils/socket';

const THEMES = {
  red: { accent: '#ff5252', ui: '#ff6b6b' }, blue: { accent: '#0099ff', ui: '#00ccff' },
  green: { accent: '#00ff88', ui: '#00ff99' }, purple: { accent: '#a855f7', ui: '#d8b4fe' },
};
const LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'Python', 'Java'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
function resultLabel(match) {
  if (match.result === 'win') return 'Victory';
  if (match.result === 'loss') return 'Defeat';
  if (match.result === 'draw') return 'Draw';
  if (match.result === 'cancelled') return 'Cancelled';
  return 'Match complete';
}
function matchOpponent(match) { return match?.players?.find((player) => !player.isYou); }

function TournamentPage() {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [state, setState] = useState(null);
  const [language, setLanguage] = useState('JavaScript');
  const [difficulty, setDifficulty] = useState('Easy');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [queueBusy, setQueueBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const activeMatchId = useRef(null);
  const queuePanelRef = useRef(null);
  const theme = THEMES[themeKey] || THEMES.purple;

  useEffect(() => localStorage.setItem('themeKey', themeKey), [themeKey]);
  const loadState = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await tournamentAPI.getState();
      setState(response.data);
      setError('');
      return response.data;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load tournament status.'));
      return null;
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);
  useEffect(() => {
    const socket = getSocket();
    const updateConnection = () => setSocketConnected(socket.connected);
    const refresh = () => loadState(true);
    const onMatchFound = () => {
      setMatchFound(true);
      setMessage('Opponent found. The match clock is running.');
      refresh();
    };
    updateConnection();
    socket.on('connect', updateConnection);
    socket.on('disconnect', updateConnection);
    socket.on('connect_error', updateConnection);
    socket.on('tournament-match-found', onMatchFound);
    socket.on('tournament-match-finished', refresh);
    socket.on('tournament-queue-updated', refresh);
    const pollId = window.setInterval(refresh, 8000);
    return () => {
      socket.off('connect', updateConnection);
      socket.off('disconnect', updateConnection);
      socket.off('connect_error', updateConnection);
      socket.off('tournament-match-found', onMatchFound);
      socket.off('tournament-match-finished', refresh);
      socket.off('tournament-queue-updated', refresh);
      window.clearInterval(pollId);
    };
  }, [loadState]);

  const match = state?.activeMatch || null;
  useEffect(() => {
    if (!match) { activeMatchId.current = null; return; }
    if (activeMatchId.current !== match.matchId) {
      activeMatchId.current = match.matchId;
      setCode(match.challenge?.starterCode || '');
      setMessage('');
    }
  }, [match]);
  useEffect(() => {
    if (!match?.endsAt || match.status !== 'active') { setSecondsLeft(0); return undefined; }
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((new Date(match.endsAt).getTime() - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [match?.endsAt, match?.status]);
  useEffect(() => {
    if (!matchFound) return undefined;
    const timer = window.setTimeout(() => setMatchFound(false), 4500);
    return () => window.clearTimeout(timer);
  }, [matchFound]);

  const enqueue = async () => {
    setQueueBusy(true); setError(''); setMessage('');
    try {
      const response = await tournamentAPI.enqueue({ language, difficulty });
      if (response.data.status === 'matched') {
        setMatchFound(true);
        setMessage('Opponent found. The match clock is running.');
      } else {
        setMessage('You are in the ranked queue. We will pair you when a matching player is available.');
      }
      await loadState(true);
    } catch (requestError) {
      const payload = requestError.response?.data;
      if (payload?.activeMatch) setState((current) => ({ ...current, activeMatch: payload.activeMatch }));
      setError(getApiErrorMessage(requestError, 'Could not join the queue. Please try again.'));
    } finally { setQueueBusy(false); }
  };
  const cancelQueue = async () => {
    setQueueBusy(true); setError('');
    try {
      await tournamentAPI.cancelQueue();
      setMessage('Matchmaking search cancelled.');
      await loadState(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not cancel matchmaking.'));
      await loadState(true);
    } finally { setQueueBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!match || submitting || match.status !== 'active') return;
    setSubmitting(true); setMessage('Checking the repair on the server…'); setError('');
    try {
      const response = await tournamentAPI.submit(match.matchId, code);
      if (response.data.correct) setMessage('Repair accepted. The server has finalized the match.');
      else setMessage(response.data.finished ? 'The match timer expired. No rank points were awarded.' : response.data.message || 'That repair did not pass. Review the task and try again.');
      await loadState(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Submission failed. Check your connection and retry.'));
      await loadState(true);
    } finally { setSubmitting(false); }
  };

  const latestMatch = state?.recentMatches?.find((item) => item.status !== 'active');
  const displayMatch = match || latestMatch;
  const history = (state?.recentMatches || []).filter((item) => item.status !== 'active').slice(0, 5);
  const rank = state?.player?.rank;
  const opponent = matchOpponent(displayMatch);
  const timeLabel = formatTime(secondsLeft);
  const winnerDelta = displayMatch?.rpDeltas?.find((delta) => delta.userId === displayMatch.players?.find((player) => player.isYou)?.userId)?.amount || 0;
  const seasonLabel = state?.season?.seasonNumber ?? (loading ? '…' : '—');
  const rankPoints = state ? (state.player?.rankPoints ?? 0) : '—';
  const playerCount = (key) => state ? (state.player?.[key] ?? 0) : '—';

  return (
    <CompetitionFrame currentPage="tournament" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} theme={theme} pageClass="tour-page">
      <header className="tour-head">
        <div><p className="comp-kicker">RANKED ARENA / SEASON {seasonLabel}</p><h1 className="comp-title">Tournament Mode</h1><p className="comp-copy">One opponent. One repair. A place on the season ladder.</p></div>
        {state?.season?.endsAt && <div className="tour-season"><p className="comp-micro">SEASON {state.season.seasonNumber} ENDS</p><p className="font-techno text-lg font-bold mt-1">{new Date(state.season.endsAt).toLocaleDateString()}</p><p className="text-xs text-white/45 mt-1">{state.season.daysRemaining} days remaining</p></div>}
      </header>

      {error && <div className="comp-alert mb-4" role="alert"><span>{error}</span><button type="button" onClick={() => loadState()} className="comp-button comp-button--quiet">Retry</button></div>}
      {message && <div className={`comp-status mb-4${matchFound ? ' border-emerald-300/40 bg-emerald-950/25 text-emerald-100' : ''}`} role="status">{matchFound && <Crown size={15} className="inline mr-2" />}{message}</div>}

      <div className="tour-entry">
        <section className="comp-panel tour-rank" aria-labelledby="tour-rank-heading">
          <div className="tour-rank__top"><div><p className="comp-micro">YOUR SEASON POSITION</p><h2 id="tour-rank-heading" className="tour-rank__name">{rank?.name || (state ? 'UNRANKED' : loading ? 'LOADING' : 'UNAVAILABLE')}</h2><p className="tour-rank__rp">{rankPoints} RP {state?.player?.seasonRank ? `· #${state.player.seasonRank} this season` : state ? '· Play a ranked match to join standings' : loading ? '· Loading standings…' : '· Standings could not be loaded'}</p></div><Crown size={24} style={{ color: 'var(--comp-ui)' }} aria-hidden="true" /></div>
          <div className="tour-rank__progress" role="progressbar" aria-label="Progress to next rank" aria-valuenow={rank?.progress || 0} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${Math.max(0, Math.min(100, Number(rank?.progress) || 0))}%` }} /></div>
          <p className="text-[11px] text-white/43 mt-2">{rank?.nextRank ? `${rank.pointsToNextRank} RP to ${rank.nextRank}` : state ? 'Complete matches to reveal rank progress' : loading ? 'Loading rank progress…' : 'Rank progress unavailable'}</p>
          <div className="tour-rank__metrics">{[['WINS', playerCount('wins')], ['LOSSES', playerCount('losses')], ['DRAWS', playerCount('draws')], ['MATCHES', playerCount('matchesPlayed')]].map(([label, value]) => <div key={label}><span className="comp-micro">{label}</span><strong>{value}</strong></div>)}</div>
        </section>

        <section ref={queuePanelRef} className="comp-panel tour-command" aria-labelledby="queue-heading">
          <div className="tour-command__head"><div><p className="comp-eyebrow">ENTER RANKED MATCHMAKING</p><h2 id="queue-heading" className="comp-section-title mt-1">Find your opponent</h2><p className="comp-section-note">Players are paired by language and difficulty.</p></div><span className="tour-connection" data-online={socketConnected} aria-label={socketConnected ? 'Live connection online' : 'Live connection offline'}>{socketConnected ? 'LIVE LINK' : 'RECONNECTING'}</span></div>
          <div className="tour-command__form">
            <label className="tour-field">Language<select className="comp-select" value={language} onChange={(event) => setLanguage(event.target.value)} disabled={Boolean(state?.queue || match || queueBusy)}>{LANGUAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="tour-field">Difficulty<select className="comp-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} disabled={Boolean(state?.queue || match || queueBusy)}>{DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            {!state?.queue && !match && <button type="button" className="comp-button comp-button--primary" onClick={enqueue} disabled={queueBusy || loading}><Search size={15} />{queueBusy ? 'Searching…' : 'Find 1v1 match'}</button>}
          </div>
          <div className="tour-queue-status">
            {state?.queue ? <span role="status"><LoaderCircle size={15} className="inline mr-2 animate-spin" style={{ color: 'var(--comp-ui)' }} />Searching · {state.queue.language} / {state.queue.difficulty}</span>
              : match ? <span><Wifi size={14} className="inline mr-2 text-emerald-300" />{match.status === 'active' ? (matchFound ? 'Opponent found · match clock running' : 'Match in progress') : resultLabel(match)}</span>
                : state ? <span><strong className="text-white">{state.queuedPlayerCount ?? 0}</strong> players waiting in ranked queues</span> : <span>{loading ? 'Loading ranked queue…' : 'Ranked queue count unavailable'}</span>}
            {state?.queue && <button type="button" className="comp-button comp-button--quiet" onClick={cancelQueue} disabled={queueBusy}><XCircle size={15} />Cancel search</button>}
          </div>
          <p className="tour-rules">Win: +{state?.rewardPolicy?.[difficulty] ?? ({ Easy: 8, Medium: 15, Hard: 25 }[difficulty])} RP · Loss, draw, and timeout: 0 RP. Daily reward XP does not affect rank.</p>
        </section>
      </div>

      {displayMatch && <section className="comp-panel tour-match" aria-labelledby="match-heading">
        <div className="tour-match__bar"><div><p className="comp-micro">{displayMatch.status === 'active' ? (matchFound ? 'OPPONENT FOUND / LIVE MATCH' : 'LIVE RANKED MATCH') : 'FINAL RESULT'} · {displayMatch.matchId.slice(0, 8).toUpperCase()}</p><h2 id="match-heading" className="comp-section-title mt-1">{displayMatch.challenge?.title || 'Coding challenge'}</h2></div>
          {displayMatch.status === 'active' ? <div className="flex items-center gap-2 rounded-md bg-white/[.05] px-3 py-2"><Clock3 size={17} aria-hidden="true" style={{ color: secondsLeft <= 30 ? '#fb7185' : 'var(--comp-ui)' }} /><span role="timer" className="font-mono font-bold tabular-nums" aria-label={`${secondsLeft} seconds remaining`}>{timeLabel}</span></div> : <span className="comp-micro">{displayMatch.finalizedAt ? new Date(displayMatch.finalizedAt).toLocaleString() : 'MATCH ENDED'}</span>}
        </div>
        <div className="tour-match__players">
          {displayMatch.players?.filter((player) => player.isYou).map((player) => <div className="tour-player" key={player.userId}><img className="comp-avatar" src={player.profileImage || localStorage.getItem('profileImage') || '/assets/profile-images/male_human_01.png'} alt="" width="42" height="42" /><div className="min-w-0"><p className="comp-micro">YOU · {rank?.name || 'RANKED PLAYER'}</p><p className="tour-player__name">{player.username}</p><p className="tour-player__rank">{rankPoints} RP</p></div></div>)}
          <span className="tour-versus">VS</span>
          {opponent && <div className="tour-player tour-player--opponent"><div className="min-w-0"><p className="comp-micro">OPPONENT · {opponent.rank?.name || 'RANKED PLAYER'}</p><p className="tour-player__name">{opponent.username}</p><p className="tour-player__rank">{opponent.rankPoints != null ? `${opponent.rankPoints} RP` : 'Rank details unavailable'}</p></div><img className="comp-avatar" src={opponent.profileImage || '/assets/profile-images/human-051.png'} alt="" width="42" height="42" /></div>}
        </div>
        <div className="tour-match__bar"><span className="comp-micro">{displayMatch.language} / {displayMatch.difficulty} · {displayMatch.status === 'active' ? 'FIRST ACCEPTED REPAIR WINS' : 'SERVER VERIFIED RESULT'}</span>{displayMatch.status === 'active' && <span className="tour-connection" data-online={socketConnected}>{socketConnected ? 'CONNECTED' : 'RECONNECTING'}</span>}</div>
        {displayMatch.status === 'active' ? <div className="tour-match__body">
          <form className="tour-editor" onSubmit={submit}>
            <CodeEditor id="tournament-code" code={code} onChange={setCode} language={displayMatch.language} title="Your repair" minHeight={400} disabled={submitting || secondsLeft <= 0} onSubmitLabel={`${displayMatch.mySubmissionAttempts || 0} submissions`} />
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3"><p className="text-[11px] text-white/40 max-w-xl">Repairs are validated against the server’s curated challenge. Submitted source is not executed.</p><button type="submit" className="comp-button comp-button--primary" disabled={submitting || !code.trim() || secondsLeft <= 0}><ShieldCheck size={15} />{submitting ? 'Checking…' : 'Submit repair'}</button></div>
          </form>
          <aside className="comp-panel tour-challenge" aria-label="Challenge instructions">
            <p className="comp-eyebrow">CHALLENGE BRIEF</p><p className="text-sm text-white/70 mt-2 leading-relaxed">{displayMatch.challenge?.description}</p>
            <div className="tour-challenge__section mt-4"><span className="comp-micro">OBSERVED BEHAVIOR</span><p className="text-sm text-white/70 mt-1">{displayMatch.challenge?.observedBehavior}</p></div>
            <div className="tour-challenge__section"><span className="comp-micro">EXPECTED BEHAVIOR</span><p className="text-sm text-white/70 mt-1">{displayMatch.challenge?.expectedBehavior}</p></div>
            <div className="tour-challenge__section"><span className="comp-micro">SAMPLE INPUT</span><p className="font-mono text-xs text-white/60 mt-1">{displayMatch.challenge?.sample?.input || '—'}</p></div>
            <div><span className="comp-micro">EXPECTED SAMPLE OUTPUT</span><p className="font-mono text-sm text-emerald-200 mt-1 break-words">{displayMatch.challenge?.sample?.output || '—'}</p></div>
          </aside>
        </div> : <div className="tour-result" role="status"><div><span className="comp-micro">VERIFIED OUTCOME</span><h3 className="tour-result__title" style={{ color: displayMatch.result === 'win' ? 'var(--comp-ui)' : undefined }}>{resultLabel(displayMatch)}</h3><p className="text-sm text-white/55">{opponent?.username || 'Opponent'} · {displayMatch.language} · {displayMatch.difficulty}</p><p className="text-sm text-white/70 mt-2">{displayMatch.result === 'win' ? `You earned ${winnerDelta} RP.` : displayMatch.result === 'loss' ? 'No RP was removed for this loss.' : 'No rank points were awarded.'}</p>{rank && <p className="text-xs text-white/45 mt-2">Current rank: {rank.name} · {state?.player?.rankPoints ?? 0} RP{rank.nextRank ? ` · ${rank.pointsToNextRank} to ${rank.nextRank}` : ''}</p>}</div><button type="button" className="comp-button" onClick={() => { queuePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Back to matchmaking</button></div>}
      </section>}

      <div className="tour-support">
        <section className="comp-panel tour-support__panel" aria-labelledby="season-ladder-heading"><div className="flex items-start justify-between gap-3"><div><p className="comp-eyebrow">SEASON {seasonLabel}</p><h2 id="season-ladder-heading" className="comp-section-title mt-1">Season ladder</h2><p className="comp-section-note">Rank points · wins · stable player ID</p></div><Trophy size={19} style={{ color: 'var(--comp-ui)' }} /></div>
          {loading && !state ? <div className="comp-skeleton h-36 mt-4" /> : state?.leaderboard?.rows?.length ? <div className="tour-standing">{state.leaderboard.rows.map((row) => <div key={row.userId} className="tour-standing__row" style={{ background: row.isCurrentUser ? 'var(--comp-accent-soft)' : undefined }}><span className="text-white/42">#{row.rank}</span>{row.profileImage ? <img className="comp-avatar" src={row.profileImage} alt="" width="34" height="34" /> : <span className="comp-avatar flex items-center justify-center" style={{ width: 34, height: 34 }}><Code2 size={15} /></span>}<span className="truncate">{row.username}{row.isCurrentUser && <small className="ml-2 comp-micro" style={{ color: 'var(--comp-ui)' }}>YOU</small>}</span><strong className="font-techno">{row.rankPoints} RP</strong><span className="text-white/40">{row.wins} W</span></div>)}</div> : state ? <p className="text-sm text-white/45 py-8 text-center">No ranked results this season yet.</p> : <p className="text-sm text-white/45 py-8 text-center">Standings are unavailable right now. Retry to load the current season.</p>}
        </section>
        <section className="comp-panel tour-support__panel" aria-labelledby="battle-history-heading"><p className="comp-eyebrow">YOUR RECENT RECORD</p><h2 id="battle-history-heading" className="comp-section-title mt-1">Recent battles</h2>
          {history.length ? <div className="tour-history">{history.map((item) => { const rival = matchOpponent(item); const delta = item.rpDeltas?.find((entry) => entry.userId === item.players?.find((player) => player.isYou)?.userId)?.amount || 0; return <div className="tour-history__row" key={item.matchId}><span className={`tour-result-tag ${item.result === 'win' ? 'text-emerald-200' : item.result === 'loss' ? 'text-rose-200' : 'text-white/45'}`}>{item.result || item.status}</span><span className="truncate">vs {rival?.username || 'Opponent'}<small className="block text-white/40 mt-1">{item.language} · {item.difficulty}</small></span><strong>{delta > 0 ? `+${delta}` : '—'} RP</strong><span className="text-white/40">{item.finalizedAt ? new Date(item.finalizedAt).toLocaleDateString() : '—'}</span></div>; })}</div> : <p className="text-sm text-white/45 py-7 text-center">Completed battles will appear here.</p>}
          {latestMatch && <p className="text-[10px] text-white/35 mt-3">Match history is based on finalized server results.</p>}
          <div className="border-t border-white/10 mt-4 pt-4"><p className="comp-micro">RANKED RULES</p><ul className="mt-2 space-y-1 text-xs text-white/50">{[state?.matchRules?.winner, state?.matchRules?.loss, state?.matchRules?.draw].filter(Boolean).map((item) => <li key={item}>{item}</li>)}{!state && <li>First accepted repair wins. Daily XP and Bug Hunter rewards never change RP.</li>}</ul></div>
        </section>
      </div>
    </CompetitionFrame>
  );
}

export default TournamentPage;
