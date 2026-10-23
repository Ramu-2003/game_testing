import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Crown, Medal, RefreshCw, Trophy, UserRound } from 'lucide-react';
import CompetitionFrame from '../components/competition/CompetitionFrame';
import { getApiErrorMessage, leaderboardAPI } from '../utils/api';

const THEMES = {
  red: { accent: '#ff5252', ui: '#ff6b6b' },
  blue: { accent: '#0099ff', ui: '#00ccff' },
  green: { accent: '#00ff88', ui: '#00ff99' },
  purple: { accent: '#a855f7', ui: '#d8b4fe' },
};
const CATEGORIES = [
  { id: 'ai', title: 'AI vs HUMAN', subtitle: 'Computer Mode', measure: '10 points per win', icon: '01' },
  { id: 'levels', title: 'LEVELS MODE', subtitle: 'Course progression', measure: 'Unique levels completed', icon: '02' },
  { id: 'multiplayer', title: 'HUMAN vs HUMAN', subtitle: '1v1 Battles', measure: '10 points per win', icon: '03' },
];
const COURSES = [['html', 'HTML'], ['css', 'CSS'], ['javascript', 'JavaScript'], ['python', 'Python'], ['java', 'Java']];
const LANGUAGES = ['HTML', 'CSS', 'JavaScript', 'Python', 'Java'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const PLACES = [
  { label: 'CHAMPION', color: '#facc15', icon: Crown },
  { label: 'RUNNER UP', color: '#cbd5e1', icon: Medal },
  { label: 'THIRD PLACE', color: '#d97745', icon: Medal },
];

function Avatar({ src, size = 44 }) {
  return src
    ? <img src={src} alt="" className="comp-avatar" width={size} height={size} />
    : <span className="comp-avatar flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true"><UserRound size={size * 0.5} className="text-white/45" /></span>;
}
Avatar.propTypes = { src: PropTypes.string, size: PropTypes.number };

function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = searchParams.get('category');
  const activeCategory = CATEGORIES.find((item) => item.id === requestedCategory) || CATEGORIES[0];
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('themeKey') || 'purple');
  const [course, setCourse] = useState('html');
  const [period, setPeriod] = useState('all');
  const [language, setLanguage] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const tabRefs = useRef([]);
  const touchStart = useRef(null);
  const theme = THEMES[themeKey] || THEMES.purple;

  useEffect(() => localStorage.setItem('themeKey', themeKey), [themeKey]);
  useEffect(() => {
    if (!requestedCategory || !CATEGORIES.some((item) => item.id === requestedCategory)) {
      setSearchParams({ category: 'ai' }, { replace: true });
    }
  }, [requestedCategory, setSearchParams]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const params = { category: activeCategory.id, page, limit: 20 };
      if (activeCategory.id === 'levels') params.course = course;
      else {
        params.period = period;
        if (language) params.language = language;
        if (difficulty) params.difficulty = difficulty;
      }
      const response = await leaderboardAPI.get(params);
      if (id === requestId.current) setData(response.data);
    } catch (requestError) {
      if (id === requestId.current) {
        setError(getApiErrorMessage(requestError, 'Could not load these standings. Please try again.'));
        setData(null);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [activeCategory.id, course, difficulty, language, page, period]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  const changeCategory = (index) => {
    const nextIndex = (index + CATEGORIES.length) % CATEGORIES.length;
    const next = CATEGORIES[nextIndex];
    setPage(1);
    setData(null);
    setSearchParams({ category: next.id }, { replace: true });
    requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  };
  const handleTabKey = (event, index) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); changeCategory(index + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); changeCategory(index - 1); }
    if (event.key === 'Home') { event.preventDefault(); changeCategory(0); }
    if (event.key === 'End') { event.preventDefault(); changeCategory(CATEGORIES.length - 1); }
  };
  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const handleTouchEnd = (event) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const distanceX = touch.clientX - touchStart.current.x;
    const distanceY = touch.clientY - touchStart.current.y;
    if (Math.abs(distanceX) > 55 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
      changeCategory(CATEGORIES.findIndex((item) => item.id === activeCategory.id) + (distanceX < 0 ? 1 : -1));
    }
    touchStart.current = null;
  };

  const rows = data?.rows || [];
  const topThree = page === 1 && activeCategory.id !== 'levels' ? rows.slice(0, 3) : [];
  const courseTopThree = page === 1 && activeCategory.id === 'levels' ? rows.slice(0, 3) : [];
  const listRows = page === 1 && activeCategory.id !== 'levels' ? rows.slice(3) : rows;
  const pageCount = Math.max(1, Math.ceil((data?.total || 0) / (data?.limit || 20)));
  const courseName = COURSES.find(([id]) => id === course)?.[1] || course;
  const tieBreak = activeCategory.id === 'levels' ? 'Unique phase and level completions, then stable player ID.' : 'Win points (10 per win), then wins, then stable player ID.';

  return (
    <CompetitionFrame currentPage="leaderboard" themeKey={themeKey} setThemeKey={setThemeKey} themes={THEMES} theme={theme} pageClass="rank-page">
      <header className="rank-intro">
        <div>
          <p className="comp-kicker">GLOBAL STANDINGS / {activeCategory.icon}</p>
          <h1 className="comp-title">Leaderboard</h1>
          <p className="comp-copy">A record of verified wins and steady progress across the coding arena.</p>
        </div>
        <div className="rank-intro__actions">
          <span className="comp-micro">{activeCategory.subtitle}</span>
          <button type="button" className="comp-button comp-button--quiet rank-refresh" onClick={load} disabled={loading} aria-label="Refresh leaderboard">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <nav className="rank-carousel" aria-label="Leaderboard category carousel">
        <button type="button" className="rank-carousel__arrow" onClick={() => changeCategory(CATEGORIES.findIndex((item) => item.id === activeCategory.id) - 1)} aria-label="Previous category"><ChevronLeft /></button>
        <div className="rank-tabs" role="tablist" aria-label="Leaderboard categories">
          {CATEGORIES.map((item, index) => (
            <button key={item.id} ref={(element) => { tabRefs.current[index] = element; }} id={`rank-tab-${item.id}`} type="button" role="tab"
              aria-selected={activeCategory.id === item.id} aria-controls="rank-panel" tabIndex={activeCategory.id === item.id ? 0 : -1}
              className="rank-tab" onClick={() => changeCategory(index)} onKeyDown={(event) => handleTabKey(event, index)}>
              <span className="rank-tab__title">{item.title}</span><span className="rank-tab__note">{item.subtitle}</span>
            </button>
          ))}
        </div>
        <button type="button" className="rank-carousel__arrow" onClick={() => changeCategory(CATEGORIES.findIndex((item) => item.id === activeCategory.id) + 1)} aria-label="Next category"><ChevronRight /></button>
      </nav>

      <section id="rank-panel" role="tabpanel" aria-labelledby={`rank-tab-${activeCategory.id}`} aria-live="polite" aria-busy={loading} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="rank-controls">
          <div>
            <h2 className="comp-section-title">{activeCategory.title}</h2>
            <p className="comp-section-note">{activeCategory.measure} · {tieBreak}</p>
          </div>
          <div className="rank-controls__filters">
            {activeCategory.id === 'levels' ? (
              <label className="rank-filter">Course
                <select className="comp-select rank-select" value={course} onChange={(event) => { setCourse(event.target.value); setPage(1); setData(null); }}>
                  {COURSES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
            ) : <>
              <label className="rank-filter">Period
                <select className="comp-select rank-select" value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); setData(null); }}>
                  <option value="all">All time</option><option value="30d">30 days</option><option value="7d">7 days</option>
                </select>
              </label>
              <label className="rank-filter">Language
                <select className="comp-select rank-select" value={language} onChange={(event) => { setLanguage(event.target.value); setPage(1); setData(null); }}>
                  <option value="">All languages</option>{LANGUAGES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="rank-filter">Difficulty
                <select className="comp-select rank-select" value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1); setData(null); }}>
                  <option value="">All difficulties</option>{DIFFICULTIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </>}
          </div>
        </div>

        {data?.me && (
          <div className="rank-current" aria-label="Your leaderboard position">
            <span><span className="comp-micro">YOUR VERIFIED POSITION</span><span className="block text-sm mt-1">{data.me.rank ? `Rank #${data.me.rank}` : 'Not ranked in this category yet'}</span></span>
            <span className="rank-current__place">{activeCategory.id === 'levels' ? `${data.me.completedLevels}/${data.me.totalLevels || '—'} levels` : `${data.me.score} pts · ${data.me.wins} wins`}</span>
          </div>
        )}

        {error && <div className="comp-alert" role="alert"><span>{error}</span><button className="comp-button comp-button--quiet" type="button" onClick={load}>Retry</button></div>}

        {loading ? (
          <div className="rank-grid" aria-label="Loading standings"><div className="comp-skeleton rank-feature" /><div className="rank-next"><div className="comp-skeleton rank-next__row" /><div className="comp-skeleton rank-next__row" /></div></div>
        ) : error ? null : !data?.total ? (
          <div className="comp-panel rank-empty"><Trophy size={31} aria-hidden="true" /><h3 className="comp-section-title">The board is waiting for its first record</h3><p className="comp-section-note">{activeCategory.id === 'levels' ? `Complete a ${courseName} level to begin this course leaderboard.` : 'Finish a verified match to earn your place. No sample results are shown.'}</p></div>
        ) : activeCategory.id === 'levels' ? (
          <div className="comp-panel p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-3"><div><p className="comp-eyebrow">COURSE MASTERY</p><h3 className="font-techno text-xl font-bold mt-1">{courseName} progression</h3></div><p className="comp-micro">{data.totalLevels || 100} TOTAL LEVELS</p></div>
            {courseTopThree.length > 0 && <div className={`rank-levels-podium${courseTopThree.length === 1 ? ' rank-levels-podium--solo' : courseTopThree.length === 2 ? ' rank-levels-podium--pair' : ''}`} aria-label={`Top three ${courseName} students`}>
              {courseTopThree[0] && <article className="rank-levels-podium__leader"><div className="flex items-center justify-between gap-3"><span className="comp-eyebrow">COURSE LEADER · #1</span><strong className="font-techno text-lg" style={{ color: 'var(--comp-ui)' }}>{courseTopThree[0].completedLevels}/{courseTopThree[0].totalLevels || data.totalLevels}</strong></div><div className="flex items-center gap-3 mt-3"><Avatar src={courseTopThree[0].profileImage} size={42} /><span className="font-techno text-lg font-bold truncate">{courseTopThree[0].username}</span></div><div className="rank-progressbar"><span style={{ width: `${Math.max(0, Math.min(100, Number(courseTopThree[0].completionPercent) || 0))}%` }} /></div></article>}
              {courseTopThree.slice(1).map((row) => <article className="rank-levels-podium__runner" key={row.userId}><span className="font-techno text-xl text-white/35">#{row.rank}</span><Avatar src={row.profileImage} size={34} /><div className="min-w-0"><p className="rank-levels-podium__name">{row.username}</p><p className="text-[10px] text-white/42">{row.completedLevels}/{row.totalLevels || data.totalLevels} levels</p></div></article>)}
            </div>}
            <div className="rank-progression">
              {(page === 1 ? rows.slice(3) : rows).map((row) => <div key={row.userId} className="rank-progression__row" style={{ background: row.isCurrentUser ? 'var(--comp-accent-soft)' : undefined }}>
                <span className="font-mono text-xs text-white/45">#{row.rank}</span><Avatar src={row.profileImage} size={34} />
                <div className="min-w-0"><div className="flex items-center gap-2 min-w-0"><span className="font-semibold truncate">{row.username}</span>{row.isCurrentUser && <span className="comp-micro" style={{ color: 'var(--comp-ui)' }}>YOU</span>}</div><div className="rank-progressbar"><span style={{ width: `${Math.max(0, Math.min(100, Number(row.completionPercent) || 0))}%` }} /></div></div>
                <div className="text-right"><strong className="font-techno text-sm">{row.completedLevels}/{row.totalLevels || data.totalLevels}</strong><span className="block text-[10px] text-white/45">{row.completionPercent}%</span></div>
              </div>)}
            </div>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className={`rank-grid${topThree.length === 1 ? ' rank-grid--solo' : ''}`} aria-label="Top three players">
                {topThree[0] && <article className="comp-panel rank-feature">
                  <p className="rank-feature__overline"><Crown size={15} /> VERIFIED CHAMPION / #1</p>
                  <div className="rank-feature__person"><Avatar src={topThree[0].profileImage} size={62} /><div className="min-w-0"><h3 className="rank-feature__name">{topThree[0].username}</h3><p className="rank-feature__score">{topThree[0].score} competitive points</p></div></div>
                  <div className="rank-feature__stats"><div><span className="comp-micro">WINS</span><strong>{topThree[0].wins}</strong></div><div><span className="comp-micro">WIN RATE</span><strong>{topThree[0].winRate}%</strong></div><div><span className="comp-micro">MATCHES</span><strong>{topThree[0].matchesPlayed}</strong></div></div>
                </article>}
                <div className={`rank-next${topThree.length === 2 ? ' rank-next--solo' : ''}`}>
                  {topThree.slice(1).map((row) => {
                    const place = PLACES[row.rank - 1] || PLACES[1];
                    const PlaceIcon = place.icon;
                    return <article key={row.userId} className="comp-panel rank-next__row">
                      <span className="rank-next__number">0{row.rank}</span><Avatar src={row.profileImage} size={43} />
                      <div className="min-w-0"><span className="comp-micro" style={{ color: place.color }}><PlaceIcon size={11} className="inline mr-1" />{place.label}</span><p className="rank-next__name">{row.username}</p><p className="rank-next__score">{row.wins} wins · {row.matchesPlayed} matches</p></div>
                      <strong className="rank-next__value">{row.score}<span className="text-[9px] ml-1">PTS</span></strong>
                    </article>;
                  })}
                </div>
              </div>
            )}

            {listRows.length > 0 && <div className="comp-panel rank-list mt-4">
              <div className="rank-list__head"><span>RANK</span><span>PLAYER</span><span>POINTS</span><span>W / L / D</span><span>MATCHES</span><span>WIN RATE</span></div>
              {listRows.map((row) => <div key={row.userId} className={`rank-row${row.isCurrentUser ? ' rank-row--self' : ''}`}>
                <span className="font-mono text-white/45">#{row.rank}</span><span className="rank-row__player"><Avatar src={row.profileImage} size={32} /><span className="rank-row__name">{row.username}{row.isCurrentUser && <small className="ml-2 comp-micro" style={{ color: 'var(--comp-ui)' }}>YOU</small>}</span></span>
                <strong className="font-techno">{row.score}</strong><span>{row.wins} / {row.losses} / {row.draws}</span><span>{row.matchesPlayed}</span><span>{row.winRate}%</span>
              </div>)}
            </div>}

            {activeCategory.id === 'ai' && data.aiSystem?.length > 0 && <section className="comp-panel rank-ai" aria-labelledby="ai-results-heading">
              <p className="comp-eyebrow">SYSTEM OPPONENT RECORDS</p><h3 id="ai-results-heading" className="font-techno text-lg font-bold mt-1">AI results are tracked separately</h3>
              <div className="rank-ai__rows">{data.aiSystem.map((entry) => <div key={entry.name} className="rank-ai__row"><span>{entry.name}</span><span className="text-xs text-white/50">{entry.wins} W · {entry.losses} L · {entry.draws} D · {entry.matchesPlayed} matches</span></div>)}</div>
            </section>}
          </>
        )}

        {!loading && !error && data?.total > 0 && <footer className="rank-pagination">
          <span>{data.total} ranked players · page {page} of {pageCount}</span><div className="flex gap-2"><button type="button" className="comp-button comp-button--quiet" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" className="comp-button comp-button--quiet" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div>
        </footer>}
      </section>
    </CompetitionFrame>
  );
}

export default LeaderboardPage;
