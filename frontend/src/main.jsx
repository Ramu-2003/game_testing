import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode is intentionally omitted here because it double-invokes
// useEffect in development, which creates/destroys WebGL contexts twice
// on every component mount — causing jank and wasted GPU memory.
// React's StrictMode checks are still covered by ESLint rules.
const rootElement = document.getElementById('root');
const app = <App />;

if (rootElement?.dataset.prerendered === 'learn') {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
