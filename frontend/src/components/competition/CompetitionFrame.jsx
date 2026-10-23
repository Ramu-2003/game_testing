import PropTypes from 'prop-types';
import { Navbar } from '../Navbar';
import { Footer } from '../landing/Footer';
import { CustomCursor } from '../landing/CustomCursor';
import './competition.css';

export function CompetitionFrame({ currentPage, themeKey, setThemeKey, themes, theme, children, pageClass = '' }) {
  return (
    <div
      className={`competition-page ${pageClass}`.trim()}
      style={{
        '--comp-accent': theme.accent,
        '--comp-ui': theme.ui,
        '--comp-accent-soft': `${theme.accent}18`,
        '--comp-accent-line': `${theme.accent}45`,
      }}
    >
      <CustomCursor theme={theme} />
      <Navbar currentPage={currentPage} themeKey={themeKey} setThemeKey={setThemeKey} themes={themes} currentTheme={theme} />
      <main className="competition-main">
        <div className="competition-content">{children}</div>
      </main>
      <Footer theme={theme} />
    </div>
  );
}

CompetitionFrame.propTypes = {
  currentPage: PropTypes.string.isRequired,
  themeKey: PropTypes.string.isRequired,
  setThemeKey: PropTypes.func.isRequired,
  themes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  pageClass: PropTypes.string,
};

export default CompetitionFrame;
