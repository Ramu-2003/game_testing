import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bug, Code2, Crown, Gamepad2, LayoutGrid, Trophy } from 'lucide-react';
import './learn-page.css';

const courses = [
  { name: 'HTML', color: '#ff6b6b', summary: 'Build page structure with semantic elements, forms, media, and accessible content.' },
  { name: 'CSS', color: '#60a5fa', summary: 'Shape responsive interfaces with selectors, layout, typography, and motion.' },
  { name: 'JavaScript', color: '#facc15', summary: 'Practice values, decisions, functions, collections, DOM events, and async work.' },
  { name: 'Python', color: '#4ade80', summary: 'Work through data, functions, collections, files, classes, and problem solving.' },
  { name: 'Java', color: '#c084fc', summary: 'Build confidence with types, methods, arrays, objects, collections, and exceptions.' },
];

const modes = [
  { icon: Code2, title: 'Level Mode', detail: 'Move through guided coding missions at your own pace.' },
  { icon: Gamepad2, title: 'Computer Mode', detail: 'Try timed rounds against clearly labelled computer opponents.' },
  { icon: LayoutGrid, title: 'Custom Mode', detail: 'Create or join a room and solve the same round with other players.' },
  { icon: Crown, title: 'Tournament Mode', detail: 'Queue for ranked matches and follow your season standing.' },
  { icon: Bug, title: 'Bug Hunter Arena', detail: 'Read a broken example, find the cause, and submit a repair.' },
  { icon: Trophy, title: 'Profile & Leaderboard', detail: 'Review your saved progress, rewards, and verified competition results.' },
];

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector);
  const created = !element;
  if (!element) {
    element = document.createElement('meta');
    const [key, name] = attribute;
    element.setAttribute(key, name);
    document.head.appendChild(element);
  }
  const previous = element.getAttribute('content');
  element.setAttribute('content', value);
  return () => {
    if (created) element.remove();
    else element.setAttribute('content', previous || '');
  };
}

export default function LearnPage() {
  useEffect(() => {
    const oldTitle = document.title;
    document.title = 'Learn HTML, CSS, JavaScript, Python & Java | GAME IN MY STYLE';
    const restoreDescription = setMeta('meta[name="description"]', ['name', 'description'], 'Learn five programming tracks through guided coding levels, browser previews, multiplayer rooms, debugging cases, and ranked practice in GAME IN MY STYLE.');
    const restoreRobots = setMeta('meta[name="robots"]', ['name', 'robots'], 'index, follow');
    const restoreOgTitle = setMeta('meta[property="og:title"]', ['property', 'og:title'], document.title);
    const restoreOgDescription = setMeta('meta[property="og:description"]', ['property', 'og:description'], 'Choose a coding track, build small projects, debug realistic mistakes, and practice with other players.');
    return () => {
      document.title = oldTitle;
      restoreDescription();
      restoreRobots();
      restoreOgTitle();
      restoreOgDescription();
    };
  }, []);

  return (
    <div className="learn-page">
      <a className="learn-skip-link" href="#learn-main">Skip to main content</a>
      <header className="learn-nav">
        <Link className="learn-brand" to="/" aria-label="GAME IN MY STYLE home">
          <img src="/assets/Game-in-my-style.png" alt="" />
          <span>GAME IN <b>MY STYLE</b></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#courses">Courses</a>
          <a href="#modes">Game modes</a>
          <Link className="learn-nav-cta" to="/?mode=signup">Create account <ArrowRight size={15} /></Link>
        </nav>
      </header>

      <main id="learn-main" tabIndex={-1}>
        <section className="learn-hero">
          <div className="learn-hero-copy">
            <p className="learn-eyebrow"><span /> A coding game for curious builders</p>
            <h1>Make code.<br /><em>See what happens.</em></h1>
            <p className="learn-lede">Learn by solving clear, bite-sized coding missions. Build web pages, practice programming fundamentals, hunt bugs, and challenge other players when you’re ready.</p>
            <div className="learn-actions">
              <Link className="learn-primary" to="/?mode=signup">Start your first mission <ArrowRight size={17} /></Link>
              <a className="learn-secondary" href="#courses">Explore the five courses</a>
            </div>
            <div className="learn-proofline"><span>5 learning tracks</span><i /> <span>Guided levels</span><i /> <span>Solo and multiplayer practice</span></div>
          </div>
  
          <div className="learn-demo" aria-label="Example HTML coding mission">
            <div className="learn-demo-top"><span className="learn-window-dots"><i /><i /><i /></span><span>MISSION 01 / HTML</span><span className="learn-live"><i /> PREVIEW</span></div>
            <div className="learn-demo-body">
              <div className="learn-code-lines" aria-label="Example markup">
                <span><b>01</b> &lt;main&gt;</span>
                <span><b>02</b> &nbsp;&nbsp;&lt;h1&gt;Hello, builder&lt;/h1&gt;</span>
                <span><b>03</b> &nbsp;&nbsp;&lt;p&gt;Your first page.&lt;/p&gt;</span>
                <span><b>04</b> &lt;/main&gt;</span>
              </div>
              <div className="learn-demo-output">
                <small>PAGE PREVIEW</small>
                <article><span className="learn-mini-mark">01 — YOUR FIRST PAGE</span><h2>Hello, builder</h2><p>Your first page.</p><span className="learn-demo-action">Keep building <ArrowRight size={13} /></span></article>
              </div>
            </div>
            <div className="learn-demo-foot"><span>STRUCTURE → BROWSER</span><span>HTML + CSS previews update as you edit</span></div>
          </div>
        </section>
  
        <section className="learn-section" id="courses">
          <div className="learn-section-heading"><div><p className="learn-eyebrow">Pick a path</p><h2>Five ways to learn by making</h2></div><p>Start with the language you’re curious about. Each track is divided into phases and short challenges so you can build skill one idea at a time.</p></div>
          <div className="learn-course-grid">
            {courses.map((course, index) => (
              <article className="learn-course-card" key={course.name} style={{ '--course-accent': course.color }}>
                <div className="learn-course-index">0{index + 1} <span>TRACK</span></div>
                <h3>{course.name}</h3>
                <p>{course.summary}</p>
                <Link to="/?mode=signup" aria-label={`Create an account, then choose the ${course.name} track`}>Create account, then choose this track <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </section>
  
        <section className="learn-section learn-modes" id="modes">
          <div className="learn-section-heading"><div><p className="learn-eyebrow">Practice your way</p><h2>Learn alone. Play together.</h2></div><p>Build a habit first, then try a different kind of challenge. Results and rankings should help you see progress, not replace learning.</p></div>
          <div className="learn-mode-grid">
            {modes.map(({ icon: Icon, title, detail }) => (
              <article className="learn-mode-card" key={title}><Icon size={20} aria-hidden="true" /><div><h3>{title}</h3><p>{detail}</p></div></article>
            ))}
          </div>
        </section>
  
        <section className="learn-note" aria-label="How code previews work">
          <div><span className="learn-note-label">A clear note about execution</span><h2>See the difference between a preview and a code runner.</h2></div>
          <p>In Level Mode, HTML and CSS show a live, sandboxed browser preview as you edit. JavaScript, Python, and Java levels use requirement checks rather than running language compilers. Competitive rounds also check code against task criteria; they do not use isolated compiler sandboxes.</p>
        </section>
      </main>

      <footer className="learn-footer"><Link className="learn-brand" to="/">GAME IN <b>MY STYLE</b></Link><span>Build a little. Learn a lot.</span><Link to="/?mode=signup">Create your account <ArrowRight size={14} /></Link></footer>
    </div>
  );
}
